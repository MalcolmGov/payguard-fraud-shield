"""
Graph Engine Service — FastAPI app

Consumes fraud signals from Kafka and writes device/account/wallet relationships
to Neo4j for fraud ring detection.

Security: API key authentication, restricted CORS, rate limiting.
"""
from __future__ import annotations
import asyncio
import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.kafka.consumer import start_consumer
from app.graph.schema import init_neo4j, close_neo4j

logger = structlog.get_logger("graph-engine")

# ── Rate limiting state ───────────────────────────────────────────────────────
_rate_limits: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60       # seconds
RATE_LIMIT_MAX    = 100      # requests per window


# ── Auth ──────────────────────────────────────────────────────────────────────
def _get_valid_keys() -> set[str]:
    """Load API keys from environment. Reloaded on each request for hot-update."""
    raw = os.getenv("API_KEYS", "")
    if not raw:
        logger.warning("graph_engine_no_api_keys", msg="API_KEYS env var is empty — all requests will be rejected")
        return set()
    return {k.strip() for k in raw.split(",") if k.strip()}


def _check_rate_limit(client_ip: str) -> bool:
    """Simple sliding-window rate limiter."""
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    hits = _rate_limits[client_ip]
    # Prune old entries
    _rate_limits[client_ip] = [t for t in hits if t > window_start]
    if len(_rate_limits[client_ip]) >= RATE_LIMIT_MAX:
        return False
    _rate_limits[client_ip].append(now)
    return True


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("graph_engine_starting")
    await init_neo4j()
    consumer_task = asyncio.create_task(start_consumer())
    yield
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        raise
    await close_neo4j()
    logger.info("graph_engine_shutdown")


app = FastAPI(
    title="Fraud Shield — Graph Engine",
    description="Fraud network graph service. Builds and queries a Neo4j fraud graph from Kafka signal events.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS — restricted to known origins ────────────────────────────────────────
_allowed_origins = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET"],
    allow_headers=["Authorization", "Content-Type"],
)


# ── Auth + Rate-limit middleware ──────────────────────────────────────────────
@app.middleware("http")
async def auth_and_rate_limit(request: Request, call_next):
    # Skip auth for health check
    if request.url.path == "/health":
        return await call_next(request)

    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(client_ip):
        logger.warning("rate_limit_exceeded", ip=client_ip)
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded. Max 100 requests per minute."},
        )

    # API key authentication
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={"error": "Missing or invalid Authorization header"},
        )

    token = auth_header[7:]
    valid_keys = _get_valid_keys()
    if token not in valid_keys:
        logger.warning("invalid_api_key", ip=client_ip, key_prefix=token[:8] + "...")
        return JSONResponse(
            status_code=403,
            content={"error": "Invalid API key"},
        )

    return await call_next(request)


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "graph-engine"}


@app.get("/api/v1/fraud-rings")
async def get_fraud_rings():
    """Returns detected fraud rings from the Neo4j graph."""
    from app.graph.fraud_ring_detector import detect_fraud_rings
    rings = await detect_fraud_rings()
    return {"fraud_rings": rings}
