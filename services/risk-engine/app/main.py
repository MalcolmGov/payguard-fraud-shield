"""
Risk Engine — main FastAPI application.

Updated with:
  - structlog structured + PII-masked logging
  - Prometheus /metrics endpoint
  - Request ID propagation via contextvars
  - Rule-level metric recording
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import Response
import time
import uuid

from app.utils.logger import get_logger
from app.utils.metrics import (
    scoring_duration,
    risk_score_histogram,
    scoring_requests_total,
    rule_trigger_total,
    cache_hits_total,
    cache_misses_total,
    decisions_by_level,
    record_decision_metrics,
    get_metrics_response,
)
from app.models.signal import RiskPayloadSchema
from app.models.ussd_signal import UssdPayloadSchema
from app.scoring.aggregator import score_payload
from app.scoring.ussd_aggregator import score_ussd_payload
from app.db.postgres import get_db, fetch_user_baseline, record_decision
from app.cache.redis_client import get_cache, set_cache
from app.middleware.auth import APIKeyAuthMiddleware
from app.middleware.rate_limiter import RateLimitMiddleware

import structlog

logger = get_logger("risk-engine.main")

app = FastAPI(
    title="Swifter Fraud Shield — Risk Engine",
    description="Real-time fraud risk scoring for mobile apps (SDK) and USSD/feature phone channels (API)",
    version="1.2.0",
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4000",
        "http://localhost:5173",
        "https://api.fraudshield.swifter.io",
        "https://payguard.africa",
    ],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
# Rate limiter runs BEFORE auth so it can use the api_key_hash set by auth
app.add_middleware(RateLimitMiddleware)
# Auth middleware runs first (outermost = added last)
app.add_middleware(APIKeyAuthMiddleware)


# ── Request ID middleware ─────────────────────────────────────────────────────
@app.middleware("http")
async def add_request_id(request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "risk-engine", "version": "1.2.0", "channels": ["sdk", "ussd"], "auth": "api_key", "rate_limit": "100/s"}


# ── Prometheus metrics endpoint ────────────────────────────────────────────────
@app.get("/metrics")
async def metrics():
    body, content_type = get_metrics_response()
    return Response(content=body, media_type=content_type)


# ── Primary scoring endpoint ───────────────────────────────────────────────────
@app.post("/score")
async def score_transaction(payload: RiskPayloadSchema):
    """
    Primary scoring endpoint.
    Accepts a full fraud signal payload and returns a RiskDecision.
    Target latency: <50ms (leaves headroom for API overhead to stay under 100ms total).
    """
    start_time = time.perf_counter()

    # Check cache — avoid re-scoring identical payload IDs
    cached = await get_cache(f"decision:{payload.payload_id}")
    if cached:
        cache_hits_total.inc()
        scoring_requests_total.labels(outcome="cache_hit").inc()
        logger.info("score_cache_hit", payload_id=payload.payload_id)
        return cached

    cache_misses_total.inc()

    try:
        # Fetch user's historical baseline from Postgres
        baseline = await fetch_user_baseline(payload.user_id)

        # Run the rules + scoring engine
        decision = await score_payload(payload, baseline)

        # Record per-rule metrics
        record_decision_metrics(decision, decision.triggered_rules)

        # Persist the decision
        await record_decision(decision, payload)

        # Cache for 60 seconds to handle duplicate requests
        await set_cache(f"decision:{payload.payload_id}", decision.dict(), ttl=60)

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        scoring_duration.observe(elapsed_ms / 1000)
        scoring_requests_total.labels(outcome="success").inc()

        logger.info(
            "payload_scored",
            payload_id=payload.payload_id,
            score=decision.risk_score,
            level=decision.risk_level,
            elapsed_ms=round(elapsed_ms, 1),
        )

        return decision

    except Exception as exc:
        scoring_requests_total.labels(outcome="error").inc()
        logger.error("scoring_error", payload_id=payload.payload_id, error=str(exc))
        raise


# ── USSD scoring endpoint (server-side, no SDK required) ──────────────────────
@app.post("/score/ussd")
async def score_ussd_transaction(payload: UssdPayloadSchema):
    """
    USSD / Feature Phone scoring endpoint.
    Accepts server-side signals (no SDK) and returns a UssdRiskDecision
    with USSD-formatted prompts suitable for shortcode display.

    8 rules evaluated: SIM swap, velocity, beneficiary risk, time-of-day,
    cooling-off, geolocation (cell tower), new subscriber, rapid session.
    """
    start_time = time.perf_counter()

    cached = await get_cache(f"ussd_decision:{payload.payload_id}")
    if cached:
        cache_hits_total.inc()
        scoring_requests_total.labels(outcome="cache_hit").inc()
        logger.info("ussd_score_cache_hit", payload_id=payload.payload_id)
        return cached

    cache_misses_total.inc()

    try:
        baseline = await fetch_user_baseline(payload.user_id)
        decision = await score_ussd_payload(payload, baseline)

        record_decision_metrics(decision, decision.triggered_rules)

        await set_cache(f"ussd_decision:{payload.payload_id}", decision.dict(), ttl=60)

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        scoring_duration.observe(elapsed_ms / 1000)
        scoring_requests_total.labels(outcome="success").inc()

        logger.info(
            "ussd_payload_scored",
            payload_id=payload.payload_id,
            channel="USSD",
            score=decision.risk_score,
            level=decision.risk_level,
            elapsed_ms=round(elapsed_ms, 1),
        )

        return decision

    except Exception as exc:
        scoring_requests_total.labels(outcome="error").inc()
        logger.error("ussd_scoring_error", payload_id=payload.payload_id, error=str(exc))
        raise


@app.get("/decisions/{transaction_id}")
async def get_decision(transaction_id: str):
    cached = await get_cache(f"decision:{transaction_id}")
    if not cached:
        raise HTTPException(status_code=404, detail="Decision not found")
    return cached


@app.get("/blacklist/check/{wallet}")
async def check_blacklist(wallet: str):
    """Quick check if a wallet is on the fraud blacklist."""
    is_blacklisted = await get_cache(f"blacklist:{wallet}")
    return {"wallet": wallet, "is_blacklisted": bool(is_blacklisted)}
