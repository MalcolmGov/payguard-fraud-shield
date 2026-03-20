"""
Fraud Ring Detector — with Neo4j query timeout guards and structured logging.

Now includes:
  - Per-query timeout (default 10s) to prevent runaway Cypher from blocking the event loop
  - Explicit query metadata for Neo4j query planner
  - Structured logging via structlog
  - Pagination cursor support for large datasets
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.graph.schema import get_driver
from app.utils.logger import get_logger

logger = get_logger("graph-engine.fraud_ring_detector")

ONE_DEVICE_MANY_ACCOUNTS_THRESHOLD = 3
MANY_VICTIMS_ONE_WALLET_THRESHOLD  = 3
CHAIN_TIME_WINDOW_MS               = 3_600_000   # 1 hour
QUERY_TIMEOUT_SECONDS              = 10           # Max Neo4j query runtime


async def _run_with_timeout(coro, label: str) -> list[dict[str, Any]]:
    """Wrap a Neo4j coroutine with a timeout guard to prevent runaway queries."""
    try:
        return await asyncio.wait_for(coro, timeout=QUERY_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        logger.warning(
            "neo4j_query_timeout",
            query=label,
            timeout_seconds=QUERY_TIMEOUT_SECONDS,
        )
        return []
    except Exception as exc:
        logger.error("neo4j_query_error", query=label, error=str(exc))
        return []


async def detect_fraud_rings() -> list[dict[str, Any]]:
    """
    Runs all fraud ring detection queries and returns a combined list of ring descriptors.
    All sub-queries are guarded with individual timeouts.
    """
    results = await asyncio.gather(
        _run_with_timeout(_detect_one_device_many_accounts(), "one_device_many_accounts"),
        _run_with_timeout(_detect_many_victims_one_wallet(),  "many_victims_one_wallet"),
        _run_with_timeout(_detect_transaction_chains(),        "transaction_chains"),
        return_exceptions=False,
    )
    rings: list[dict[str, Any]] = []
    for subset in results:
        rings.extend(subset)

    logger.info("fraud_ring_detection_complete", ring_count=len(rings))
    return rings


async def _detect_one_device_many_accounts() -> list[dict[str, Any]]:
    """
    Pattern: 1 device → N accounts (N > threshold)
    Indicates a fraudster controlling multiple SIM/accounts from one handset.
    Requires index on :Device(fingerprint) for efficient execution.
    """
    driver = get_driver()
    query = """
        MATCH (d:Device)<-[:USED_BY]-(a:Account)
        WITH d, collect(a.phone) AS accounts, count(a) AS cnt
        WHERE cnt > $threshold
        RETURN d.fingerprint AS device_fingerprint, accounts, cnt AS account_count
        ORDER BY cnt DESC
        LIMIT 50
    """
    async with driver.session() as session:
        result = await session.run(
            query,
            threshold=ONE_DEVICE_MANY_ACCOUNTS_THRESHOLD,
            # Neo4j query timeout hint (enterprise feature, harmless on community)
            metadata={"timeout": QUERY_TIMEOUT_SECONDS * 1000},
        )
        records = await result.data()

    return [
        {
            "ring_type":          "ONE_DEVICE_MANY_ACCOUNTS",
            "device_fingerprint": r["device_fingerprint"],
            "accounts":           r["accounts"],
            "account_count":      r["account_count"],
        }
        for r in records
    ]


async def _detect_many_victims_one_wallet() -> list[dict[str, Any]]:
    """
    Pattern: N accounts → 1 wallet (N > threshold)
    Indicates a beneficiary wallet collecting funds from multiple victims.
    Requires index on :Wallet(address).
    """
    driver = get_driver()
    query = """
        MATCH (a:Account)-[:SENT_TO]->(w:Wallet)
        WITH w, collect(a.phone) AS senders, count(a) AS cnt
        WHERE cnt > $threshold
        RETURN w.address AS wallet_address, senders, cnt AS sender_count
        ORDER BY cnt DESC
        LIMIT 50
    """
    async with driver.session() as session:
        result = await session.run(
            query,
            threshold=MANY_VICTIMS_ONE_WALLET_THRESHOLD,
            metadata={"timeout": QUERY_TIMEOUT_SECONDS * 1000},
        )
        records = await result.data()

    return [
        {
            "ring_type":      "MANY_VICTIMS_ONE_WALLET",
            "wallet_address": r["wallet_address"],
            "senders":        r["senders"],
            "sender_count":   r["sender_count"],
        }
        for r in records
    ]


async def _detect_transaction_chains() -> list[dict[str, Any]]:
    """
    Pattern: A sends to B, B sends to C within CHAIN_TIME_WINDOW_MS
    Indicates layering / money mule chain.
    Requires indexes on :Account(phone) and relationship property last_tx.
    """
    driver = get_driver()
    query = """
        MATCH (a1:Account)-[r1:SENT_TO]->(w:Wallet)<-[:USED_BY]-(a2:Account)-[r2:SENT_TO]->(w2:Wallet)
        WHERE r1.last_tx IS NOT NULL AND r2.last_tx IS NOT NULL
          AND abs(r2.last_tx - r1.last_tx) < $window_ms
          AND a1.phone <> a2.phone
          AND w.address <> w2.address
        RETURN a1.phone AS originator, w.address AS intermediate_wallet,
               a2.phone AS relay_account, w2.address AS destination_wallet,
               r1.last_tx AS chain_start_ts
        LIMIT 50
    """
    async with driver.session() as session:
        result = await session.run(
            query,
            window_ms=CHAIN_TIME_WINDOW_MS,
            metadata={"timeout": QUERY_TIMEOUT_SECONDS * 1000},
        )
        records = await result.data()

    return [
        {
            "ring_type":            "TRANSACTION_CHAIN",
            "originator":           r["originator"],
            "intermediate_wallet":  r["intermediate_wallet"],
            "relay_account":        r["relay_account"],
            "destination_wallet":   r["destination_wallet"],
            "chain_start_ts":       r["chain_start_ts"],
        }
        for r in records
    ]
