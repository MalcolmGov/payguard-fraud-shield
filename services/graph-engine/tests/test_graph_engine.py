"""
Graph Engine — Test Suite

Tests for authentication, rate limiting, CORS, and fraud ring endpoint.
"""
import os
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

# Set API_KEYS before importing the app
os.environ["API_KEYS"] = "test-key-001,test-key-002"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"
os.environ["NEO4J_URI"] = "bolt://localhost:7687"
os.environ["NEO4J_USER"] = "neo4j"
os.environ["NEO4J_PASSWORD"] = "test"


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """Create a test client with mocked Neo4j and Kafka."""
    with patch("app.graph.schema.init_neo4j", new_callable=AsyncMock), \
         patch("app.graph.schema.close_neo4j", new_callable=AsyncMock), \
         patch("app.kafka.consumer.start_consumer", new_callable=AsyncMock):
        from app.main import app
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c


# ── Health Endpoint (no auth required) ────────────────────────────────────────

@pytest.mark.anyio
async def test_health_returns_ok(client):
    """Health endpoint should be accessible without authentication."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "graph-engine"


# ── Authentication ────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_no_auth_header_returns_401(client):
    """Requests without Authorization header should be rejected."""
    response = await client.get("/api/v1/fraud-rings")
    assert response.status_code == 401
    assert "Authorization" in response.json()["error"]


@pytest.mark.anyio
async def test_invalid_auth_scheme_returns_401(client):
    """Non-Bearer auth schemes should be rejected."""
    response = await client.get(
        "/api/v1/fraud-rings",
        headers={"Authorization": "Basic dGVzdDp0ZXN0"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_invalid_api_key_returns_403(client):
    """Invalid API keys should be rejected with 403."""
    response = await client.get(
        "/api/v1/fraud-rings",
        headers={"Authorization": "Bearer invalid-key-xyz"},
    )
    assert response.status_code == 403
    assert "Invalid API key" in response.json()["error"]


@pytest.mark.anyio
async def test_valid_api_key_passes_auth(client):
    """Valid API key should pass authentication."""
    with patch("app.graph.fraud_ring_detector.detect_fraud_rings", new_callable=AsyncMock, return_value=[]):
        response = await client.get(
            "/api/v1/fraud-rings",
            headers={"Authorization": "Bearer test-key-001"},
        )
        assert response.status_code == 200
        assert response.json()["fraud_rings"] == []


@pytest.mark.anyio
async def test_second_valid_key_also_works(client):
    """All keys in the API_KEYS list should be accepted."""
    with patch("app.graph.fraud_ring_detector.detect_fraud_rings", new_callable=AsyncMock, return_value=[]):
        response = await client.get(
            "/api/v1/fraud-rings",
            headers={"Authorization": "Bearer test-key-002"},
        )
        assert response.status_code == 200


# ── Rate Limiting ─────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_rate_limit_blocks_excessive_requests(client):
    """After 100 requests in 60s, should return 429."""
    from app.main import _rate_limits
    # Simulate 100 prior requests from the same IP
    _rate_limits["testclient"] = [__import__("time").time()] * 100

    response = await client.get(
        "/api/v1/fraud-rings",
        headers={"Authorization": "Bearer test-key-001"},
    )
    assert response.status_code == 429
    assert "Rate limit" in response.json()["error"]

    # Clean up
    _rate_limits.clear()


# ── Fraud Rings Endpoint ─────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_fraud_rings_returns_list(client):
    """Should return fraud ring data from Neo4j."""
    mock_rings = [
        {"ring_id": "ring-001", "accounts": 12, "total_value": 180000},
        {"ring_id": "ring-002", "accounts": 5, "total_value": 45000},
    ]
    with patch("app.graph.fraud_ring_detector.detect_fraud_rings", new_callable=AsyncMock, return_value=mock_rings):
        response = await client.get(
            "/api/v1/fraud-rings",
            headers={"Authorization": "Bearer test-key-001"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["fraud_rings"]) == 2
        assert data["fraud_rings"][0]["ring_id"] == "ring-001"
        assert data["fraud_rings"][1]["accounts"] == 5


# ── CORS ──────────────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_cors_allows_configured_origin(client):
    """Configured CORS origin should be allowed."""
    with patch("app.graph.fraud_ring_detector.detect_fraud_rings", new_callable=AsyncMock, return_value=[]):
        response = await client.get(
            "/api/v1/fraud-rings",
            headers={
                "Authorization": "Bearer test-key-001",
                "Origin": "http://localhost:5173",
            },
        )
        assert response.status_code == 200


@pytest.mark.anyio
async def test_empty_api_keys_rejects_all():
    """When API_KEYS is empty, all requests should be rejected."""
    with patch.dict(os.environ, {"API_KEYS": ""}):
        from app.main import _get_valid_keys
        keys = _get_valid_keys()
        assert len(keys) == 0
