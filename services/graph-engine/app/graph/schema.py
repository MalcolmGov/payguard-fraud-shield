"""
Neo4j Graph Schema and Connection Management

Node types:
  Device    — mobile device (identified by device_fingerprint)
  Account   — user account / phone number
  Wallet    — MoMo wallet address  
  IPAddress — IP address

Relationship types:
  USED_BY        — Device → Account (this device was used by this account)
  SENT_TO        — Account → Wallet (funds transferred)
  SHARES_IP      — Account → IPAddress
  SHARES_DEVICE  — Account → Device (reverse index)
"""
from __future__ import annotations
import logging
import os
from typing import Optional

from neo4j import AsyncGraphDatabase, AsyncDriver

logger = logging.getLogger(__name__)

_driver: Optional[AsyncDriver] = None

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "fraudshield")


async def init_neo4j() -> None:
    global _driver
    _driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    async with _driver.session() as session:
        # ── Uniqueness constraints (also create implicit indexes) ─────────────
        await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (d:Device) REQUIRE d.fingerprint IS UNIQUE")
        await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (a:Account) REQUIRE a.phone IS UNIQUE")
        await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (w:Wallet) REQUIRE w.address IS UNIQUE")
        await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (i:IPAddress) REQUIRE i.address IS UNIQUE")

        # ── Explicit indexes for query-critical properties ─────────────────────
        # Device last_seen for time-range queries
        await session.run(
            "CREATE INDEX device_last_seen IF NOT EXISTS FOR (d:Device) ON (d.last_seen)"
        )
        # Account last_seen for velocity queries
        await session.run(
            "CREATE INDEX account_last_seen IF NOT EXISTS FOR (a:Account) ON (a.last_seen)"
        )
        # Compound index: Account phone + risk score (for high-risk account lookups)
        await session.run(
            "CREATE INDEX account_phone_risk IF NOT EXISTS FOR (a:Account) ON (a.phone, a.risk_score)"
        )
        # Wallet address full-text index for fuzzy lookups
        await session.run(
            "CREATE INDEX wallet_address_btree IF NOT EXISTS FOR (w:Wallet) ON (w.address)"
        )
        # IP geolocation index for country-level grouping
        await session.run(
            "CREATE INDEX ip_country IF NOT EXISTS FOR (i:IPAddress) ON (i.country)"
        )

    logger.info("Neo4j initialised at %s — constraints and indexes applied", NEO4J_URI)


async def close_neo4j() -> None:
    global _driver
    if _driver:
        await _driver.close()
        _driver = None


def get_driver() -> AsyncDriver:
    if _driver is None:
        raise RuntimeError("Neo4j driver not initialised — call init_neo4j() first")
    return _driver


async def merge_signal_into_graph(signal: dict) -> None:
    """
    Upserts a fraud signal into the graph as nodes + relationships.
    Called for every event consumed from Kafka.
    """
    driver = get_driver()
    device_fp: str = signal.get("device_fingerprint", "unknown")
    user_phone: str = signal.get("user_id", "unknown")
    recipient_wallet: str = signal.get("recipient_wallet", "")
    ip_address: str = signal.get("ip_address", "")

    async with driver.session() as session:
        # Merge Device and Account nodes
        await session.run(
            """
            MERGE (d:Device {fingerprint: $device_fp})
            ON CREATE SET d.first_seen = timestamp(), d.is_rooted = $is_rooted, d.is_emulator = $is_emulator
            ON MATCH  SET d.last_seen  = timestamp()
            MERGE (a:Account {phone: $user_phone})
            ON CREATE SET a.first_seen = timestamp()
            ON MATCH  SET a.last_seen  = timestamp()
            MERGE (a)-[:USED_BY]->(d)
            MERGE (d)-[:SHARES_DEVICE]->(a)
            """,
            device_fp=device_fp,
            user_phone=user_phone,
            is_rooted=signal.get("is_rooted", False),
            is_emulator=signal.get("is_emulator", False),
        )

        # Merge Wallet and SENT_TO relationship
        if recipient_wallet:
            await session.run(
                """
                MERGE (w:Wallet {address: $wallet})
                ON CREATE SET w.first_seen = timestamp()
                MERGE (a:Account {phone: $user_phone})
                MERGE (a)-[r:SENT_TO]->(w)
                ON CREATE SET r.count = 1, r.first_tx = timestamp()
                ON MATCH  SET r.count = r.count + 1, r.last_tx = timestamp()
                """,
                wallet=recipient_wallet,
                user_phone=user_phone,
            )

        # Merge IP Address
        if ip_address:
            await session.run(
                """
                MERGE (i:IPAddress {address: $ip})
                MERGE (a:Account {phone: $user_phone})
                MERGE (a)-[:SHARES_IP]->(i)
                """,
                ip=ip_address,
                user_phone=user_phone,
            )

    logger.info("Signal merged into graph for device=%s account=%s", device_fp, user_phone)
