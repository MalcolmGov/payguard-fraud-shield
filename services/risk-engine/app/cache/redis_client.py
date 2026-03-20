import os
import json
import logging
import redis.asyncio as redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
_client: redis.Redis | None = None


async def get_client() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(REDIS_URL, decode_responses=True)
    return _client


async def get_cache(key: str) -> dict | None:
    try:
        client = await get_client()
        val = await client.get(key)
        if val:
            return json.loads(val)
        return None
    except Exception as e:
        logger.warning(f"Redis get failed for key {key}: {e}")
        return None


async def set_cache(key: str, value: dict, ttl: int = 300):
    try:
        client = await get_client()
        await client.setex(key, ttl, json.dumps(value))
    except Exception as e:
        logger.warning(f"Redis set failed for key {key}: {e}")


async def add_to_blacklist(wallet: str, reason: str, ttl_days: int = 30):
    """Add a wallet address to the fraud blacklist."""
    await set_cache(f"blacklist:{wallet}", {"reason": reason}, ttl=ttl_days * 86400)


async def increment_device_velocity(device_id: str, window_seconds: int = 3600) -> int:
    """Track how many transactions a device has attempted in a rolling window."""
    try:
        client = await get_client()
        key = f"device_velocity:{device_id}"
        count = await client.incr(key)
        if count == 1:
            await client.expire(key, window_seconds)
        return count
    except Exception:
        return 0
