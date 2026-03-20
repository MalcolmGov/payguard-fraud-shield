#!/usr/bin/env python3
"""
Fraud Shield — Database Seed Script
Seeds PostgreSQL with test users, device fingerprints, and synthetic fraud scenarios
for local development and dashboard demonstration.
"""
import asyncio
import hashlib
import json
import os
import random
import uuid
from datetime import datetime, timedelta

import asyncpg  # pip install asyncpg

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://fraud_user:fraud_secret@localhost:5432/fraudshield")

# ── Test Data Fixtures ────────────────────────────────────────────────────────

TEST_USERS = [
    {"phone": "+27821000001", "name": "Sipho Dlamini",    "avg_tx_amount": 350.0},
    {"phone": "+27821000002", "name": "Nomsa Khumalo",   "avg_tx_amount": 500.0},
    {"phone": "+27821000003", "name": "Thabo Mokoena",   "avg_tx_amount": 200.0},
    {"phone": "+27821000004", "name": "Lerato Sithole",  "avg_tx_amount": 750.0},
    {"phone": "+27821000005", "name": "Zanele Dube",     "avg_tx_amount": 1200.0},
    # Mule accounts (programmatic)
    {"phone": "+27821000010", "name": "Mule A",          "avg_tx_amount": 5000.0},
    {"phone": "+27821000011", "name": "Mule B",          "avg_tx_amount": 5000.0},
]

# Fraud device — shared across many accounts
FRAUD_DEVICE_FP = hashlib.sha256(b"fraud-device-emulator-001").hexdigest()

TEST_DEVICES = [
    {"fingerprint": hashlib.sha256(f"device-{i}".encode()).hexdigest(), "is_rooted": False, "is_emulator": False}
    for i in range(5)
] + [
    {"fingerprint": FRAUD_DEVICE_FP, "is_rooted": True, "is_emulator": True},  # Known fraud device
]

# Synthetic fraud transactions
FRAUD_SCENARIOS = [
    {
        "scenario": "RULE_001: On call + new recipient + high amount",
        "rules_triggered": ["RULE_001", "RULE_002"],
        "risk_score": 85,
        "risk_level": "HIGH",
        "recommended_action": "BLOCK",
        "user_phone": "+27821000001",
        "recipient_wallet": "+27821000010",
        "amount": 2500.0,
        "on_call": True,
        "call_duration_s": 95,
        "unknown_caller": True,
        "new_recipient": True,
    },
    {
        "scenario": "RULE_006: SIM swap + new recipient",
        "rules_triggered": ["RULE_006", "RULE_005"],
        "risk_score": 90,
        "risk_level": "HIGH",
        "recommended_action": "BLOCK",
        "user_phone": "+27821000002",
        "recipient_wallet": "+27821000011",
        "amount": 3000.0,
        "on_call": False,
        "sim_swapped": True,
    },
    {
        "scenario": "RULE_007: Device shared across 4+ accounts",
        "rules_triggered": ["RULE_007"],
        "risk_score": 70,
        "risk_level": "HIGH",
        "recommended_action": "WARN_USER",
        "user_phone": "+27821000003",
        "recipient_wallet": "+27821000010",
        "amount": 500.0,
        "device_fingerprint": FRAUD_DEVICE_FP,
        "on_call": False,
    },
    {
        "scenario": "RULE_008: SMS fraud keywords detected",
        "rules_triggered": ["RULE_008", "RULE_004"],
        "risk_score": 45,
        "risk_level": "MEDIUM",
        "recommended_action": "WARN_USER",
        "user_phone": "+27821000004",
        "recipient_wallet": "+27821000011",
        "amount": 700.0,
        "sms_fraud_keywords": ["OTP", "winner", "prize"],
        "paste_detected": True,
        "on_call": False,
    },
    {
        "scenario": "Normal transaction — low risk",
        "rules_triggered": [],
        "risk_score": 5,
        "risk_level": "LOW",
        "recommended_action": "ALLOW",
        "user_phone": "+27821000005",
        "recipient_wallet": "+27821000002",
        "amount": 300.0,
        "on_call": False,
    },
]


async def create_tables(conn: asyncpg.Connection) -> None:
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            phone       TEXT UNIQUE NOT NULL,
            name        TEXT,
            avg_tx_amount NUMERIC(12,2) DEFAULT 0,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS device_registry (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            fingerprint     TEXT UNIQUE NOT NULL,
            is_rooted       BOOLEAN DEFAULT FALSE,
            is_emulator     BOOLEAN DEFAULT FALSE,
            is_blacklisted  BOOLEAN DEFAULT FALSE,
            created_at      TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_phone      TEXT NOT NULL,
            recipient_wallet TEXT NOT NULL,
            amount          NUMERIC(12,2),
            risk_score      INT,
            risk_level      TEXT,
            recommended_action TEXT,
            triggered_rules TEXT[],
            signal_payload  JSONB,
            on_call         BOOLEAN DEFAULT FALSE,
            created_at      TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS fraud_rules (
            rule_id     TEXT PRIMARY KEY,
            description TEXT,
            score_delta INT,
            enabled     BOOLEAN DEFAULT TRUE,
            updated_at  TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    print("✅ Tables created/verified")


async def seed_accounts(conn: asyncpg.Connection) -> None:
    for user in TEST_USERS:
        await conn.execute("""
            INSERT INTO accounts (phone, name, avg_tx_amount)
            VALUES ($1, $2, $3)
            ON CONFLICT (phone) DO NOTHING
        """, user["phone"], user["name"], user["avg_tx_amount"])
    print(f"✅ Seeded {len(TEST_USERS)} accounts")


async def seed_devices(conn: asyncpg.Connection) -> None:
    for device in TEST_DEVICES:
        is_blacklisted = device["fingerprint"] == FRAUD_DEVICE_FP
        await conn.execute("""
            INSERT INTO device_registry (fingerprint, is_rooted, is_emulator, is_blacklisted)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (fingerprint) DO NOTHING
        """, device["fingerprint"], device["is_rooted"], device["is_emulator"], is_blacklisted)
    print(f"✅ Seeded {len(TEST_DEVICES)} devices (1 fraud device blacklisted)")


async def seed_fraud_rules(conn: asyncpg.Connection) -> None:
    rules = [
        ("RULE_001", "On call + new recipient + high amount",           75),
        ("RULE_002", "On call + recipient not in contacts",             40),
        ("RULE_003", "Transaction initiated < 10s of session start",    30),
        ("RULE_004", "Copy/paste of recipient number",                  20),
        ("RULE_005", "New recipient + amount > 2× user avg",            35),
        ("RULE_006", "SIM swap detected in last 48h",                   50),
        ("RULE_007", "Device seen on > 3 accounts",                     60),
        ("RULE_008", "Recent SMS with fraud keywords",                  25),
        ("RULE_009", "Rooted/jailbroken device",                        20),
        ("RULE_010", "VPN/proxy active",                                15),
    ]
    for rule_id, description, score_delta in rules:
        await conn.execute("""
            INSERT INTO fraud_rules (rule_id, description, score_delta)
            VALUES ($1, $2, $3)
            ON CONFLICT (rule_id) DO NOTHING
        """, rule_id, description, score_delta)
    print(f"✅ Seeded {len(rules)} fraud rules")


async def seed_transactions(conn: asyncpg.Connection) -> None:
    now = datetime.utcnow()
    for i, scenario in enumerate(FRAUD_SCENARIOS):
        tx_id = str(uuid.uuid4())
        created_at = now - timedelta(hours=i * 2)
        signal_payload = {k: v for k, v in scenario.items() if k not in ("rules_triggered", "risk_score", "risk_level", "recommended_action", "scenario")}
        await conn.execute("""
            INSERT INTO transactions (id, user_phone, recipient_wallet, amount, risk_score, risk_level,
                                      recommended_action, triggered_rules, signal_payload, on_call, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT DO NOTHING
        """,
            tx_id,
            scenario["user_phone"],
            scenario.get("recipient_wallet", ""),
            scenario.get("amount", 0),
            scenario["risk_score"],
            scenario["risk_level"],
            scenario["recommended_action"],
            scenario["rules_triggered"],
            json.dumps(signal_payload),
            scenario.get("on_call", False),
            created_at,
        )
    print(f"✅ Seeded {len(FRAUD_SCENARIOS)} synthetic fraud transactions")


async def main() -> None:
    print("🌱 Fraud Shield — Seeding database…")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await create_tables(conn)
        await seed_accounts(conn)
        await seed_devices(conn)
        await seed_fraud_rules(conn)
        await seed_transactions(conn)
        print("\n✅ Seed complete! You can now start the dashboard and see live fraud scenarios.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
