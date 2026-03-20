"""
API Key Authentication Middleware
==================================
Validates Bearer tokens on protected endpoints.
Keys are loaded from the PAYGUARD_API_KEYS environment variable (comma-separated).

IMPORTANT: Uses JSONResponse instead of HTTPException because
Starlette's BaseHTTPMiddleware doesn't handle raised exceptions properly.

Public endpoints (/health, /metrics, /docs, /openapi.json) bypass auth.
"""
import os
import time
import hashlib
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# ── Configuration ─────────────────────────────────────────────────────────────
# Comma-separated list of valid API keys
# Example: PAYGUARD_API_KEYS=pk_live_abc123,pk_live_def456
_raw_keys = os.getenv("PAYGUARD_API_KEYS", "pk_sandbox_demo")
VALID_API_KEYS = set(k.strip() for k in _raw_keys.split(",") if k.strip())

# Endpoints that don't require authentication
PUBLIC_PATHS = {"/health", "/metrics", "/docs", "/openapi.json", "/redoc"}


class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    """Validates that requests to protected endpoints carry a valid API key."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Skip auth for public endpoints
        if path in PUBLIC_PATHS or request.method == "OPTIONS":
            return await call_next(request)

        # Extract Bearer token
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={
                    "error": "authentication_required",
                    "message": "Missing API key. Include 'Authorization: Bearer <your_api_key>' header.",
                    "docs": "https://payguard.africa/developers",
                },
            )

        api_key = auth_header[7:].strip()

        if api_key not in VALID_API_KEYS:
            return JSONResponse(
                status_code=401,
                content={
                    "error": "invalid_api_key",
                    "message": "The provided API key is not valid.",
                },
            )

        # Attach client identifier to request state for rate limiting / logging
        request.state.api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()[:12]
        request.state.api_key = api_key

        return await call_next(request)
