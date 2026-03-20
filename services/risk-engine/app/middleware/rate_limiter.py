"""
Sliding Window Rate Limiter
============================
In-memory rate limiter using a sliding window counter.
Limits requests per API key (or per IP for unauthenticated routes).

Default: 100 requests per second per client.
Configure via PAYGUARD_RATE_LIMIT (requests/second).
"""
import os
import time
import collections
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# ── Configuration ─────────────────────────────────────────────────────────────
RATE_LIMIT = int(os.getenv("PAYGUARD_RATE_LIMIT", "100"))  # requests per second
WINDOW_SECONDS = 1

# Endpoints exempt from rate limiting
EXEMPT_PATHS = {"/health", "/metrics", "/docs", "/openapi.json", "/redoc"}

# In-memory sliding window: { client_id: deque([timestamps]) }
_windows: dict[str, collections.deque] = {}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding window rate limiter per API key / IP."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Skip rate limiting for exempt endpoints
        if path in EXEMPT_PATHS or request.method == "OPTIONS":
            return await call_next(request)

        # Identify client: use API key hash if available, else IP
        client_id = getattr(request.state, "api_key_hash", None)
        if not client_id:
            client_id = request.client.host if request.client else "unknown"

        now = time.monotonic()

        # Get or create window for this client
        if client_id not in _windows:
            _windows[client_id] = collections.deque()

        window = _windows[client_id]

        # Evict timestamps outside the window
        cutoff = now - WINDOW_SECONDS
        while window and window[0] < cutoff:
            window.popleft()

        # Check limit
        if len(window) >= RATE_LIMIT:
            retry_after = WINDOW_SECONDS - (now - window[0]) if window else WINDOW_SECONDS
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Rate limit exceeded ({RATE_LIMIT} requests/second). Please slow down.",
                    "retry_after_seconds": round(max(retry_after, 0.1), 2),
                },
                headers={"Retry-After": str(max(int(retry_after), 1))},
            )

        # Record this request
        window.append(now)

        response = await call_next(request)

        # Add rate limit headers
        remaining = max(RATE_LIMIT - len(window), 0)
        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(now + WINDOW_SECONDS))

        return response
