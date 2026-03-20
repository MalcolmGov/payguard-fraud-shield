import os
import asyncpg
import logging
from app.models.signal import RiskDecision, RiskPayloadSchema
import json

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://fraudshield:fraudshield@localhost:5432/fraudshield")

_pool: asyncpg.Pool | None = None


async def get_db() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return _pool


async def fetch_user_baseline(user_id: str) -> dict:
    """
    Fetch the user's historical transaction baseline.
    Used by rules to detect anomalies (e.g., amount > 2x user average).
    Returns default baseline if user is new.
    """
    try:
        pool = await get_db()
        row = await pool.fetchrow(
            """
            SELECT
                AVG(amount) as avg_transaction_amount,
                COUNT(*) as total_transactions,
                COUNT(DISTINCT device_id) as device_count,
                COUNT(DISTINCT recipient_phone) as unique_recipients
            FROM transactions
            WHERE user_id = $1
            AND created_at > NOW() - INTERVAL '90 days'
            """,
            user_id
        )

        # Get device account count (how many users share this device)
        pool2 = await get_db()
        device_count_row = await pool2.fetchrow(
            """
            SELECT COUNT(DISTINCT user_id) as account_count
            FROM device_registry
            WHERE device_id = (
                SELECT device_id FROM device_registry WHERE user_id = $1 LIMIT 1
            )
            """,
            user_id
        )

        return {
            "avg_transaction_amount": float(row["avg_transaction_amount"] or 100),
            "total_transactions": int(row["total_transactions"] or 0),
            "device_count": int(row["device_count"] or 1),
            "unique_recipients": int(row["unique_recipients"] or 0),
            "device_account_count": int(device_count_row["account_count"] if device_count_row else 1),
        }
    except Exception as e:
        logger.warning(f"Could not fetch baseline for user {user_id}: {e}")
        return {
            "avg_transaction_amount": 100,
            "total_transactions": 0,
            "device_count": 1,
            "unique_recipients": 0,
            "device_account_count": 1,
        }


async def record_decision(decision: RiskDecision, payload: RiskPayloadSchema):
    """Persist the risk decision and transaction to the database."""
    try:
        pool = await get_db()
        await pool.execute(
            """
            INSERT INTO fraud_decisions
                (transaction_id, user_id, risk_score, risk_level, recommended_action,
                 triggered_rules, recipient_phone, amount, currency, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (transaction_id) DO NOTHING
            """,
            decision.transaction_id,
            decision.user_id,
            decision.risk_score,
            decision.risk_level.value,
            decision.recommended_action.value,
            json.dumps(decision.triggered_rules),
            payload.transaction.recipient_phone,
            payload.transaction.amount,
            payload.transaction.currency,
        )
    except Exception as e:
        logger.error(f"Failed to persist decision: {e}")
