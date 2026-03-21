# PayGuard — Deployment Guide

## Prerequisites

- Docker & Docker Compose installed
- Railway CLI installed (`npm i -g @railway/cli`)
- Railway account authenticated (`railway login`)

---

## Option 1: Local Docker Compose (Development / Testing)

### Step 1: Configure Environment

```bash
cd infra/
cp .env.services.template .env.services
cp .env.infra.template .env.infra   # If exists, otherwise create:

# .env.infra — infrastructure credentials
echo "NEO4J_AUTH=neo4j/your_neo4j_password" > .env.infra
```

Edit `.env.services` and set all `CHANGE_ME` values.

### Step 2: Build & Start

```bash
# From repo root
cd infra/
docker compose up --build -d

# Check all services are healthy
docker compose ps
```

### Step 3: Verify

```bash
# Health checks
curl http://localhost:3001/health   # API Gateway
curl http://localhost:8001/health   # Risk Engine
curl http://localhost:8002/health   # Graph Engine
curl http://localhost:3002/health   # Device Binding

# Test risk scoring
curl -X POST http://localhost:8001/score \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: your_api_key" \
  -d '{"payload_id":"test-001","user_id":"user-1","transaction":{"amount":5000,"currency":"ZAR"},"call":{"is_on_active_call":true},"recipient_in_contacts":false}'
```

---

## Option 2: Railway Deployment (Production)

Railway supports Docker-based deployments with automatic HTTPS, scaling, and managed databases.

### Step 1: Create Railway Project

```bash
railway login
railway init    # Creates a new project
```

### Step 2: Provision Infrastructure Services

Railway provides managed databases that are easier to maintain than self-hosted:

```bash
# Add PostgreSQL
railway add --plugin postgresql

# Add Redis
railway add --plugin redis
```

For Neo4j and Kafka, you'll need to deploy as Docker services or use managed alternatives:
- **Neo4j**: Use Neo4j Aura Free Tier (https://neo4j.com/cloud/aura-free/)
- **Kafka**: Use Upstash Kafka (https://upstash.com/kafka) or Redpanda Cloud

### Step 3: Deploy Backend Services

Each service is deployed as a separate Railway service:

```bash
# Deploy API Gateway
cd services/api
railway up --service payguard-api

# Deploy Risk Engine
cd ../risk-engine
railway up --service payguard-risk-engine

# Deploy Graph Engine
cd ../graph-engine
railway up --service payguard-graph-engine

# Deploy Device Binding
cd ../device-binding
railway up --service payguard-device-binding
```

### Step 4: Set Environment Variables

In the Railway dashboard (https://railway.app/dashboard):

1. Click each service → **Variables** tab
2. Add all variables from `.env.services.template`
3. Use Railway's **Reference Variables** for managed databases:
   - `${{Postgres.DATABASE_URL}}` for PostgreSQL
   - `${{Redis.REDIS_URL}}` for Redis

### Step 5: Set Up Custom Domains

1. In Railway dashboard → each service → **Settings** → **Domains**
2. Add custom domains:
   - `api.payguard.africa` → API Gateway
   - `risk.payguard.africa` → Risk Engine (internal only)
   - `graph.payguard.africa` → Graph Engine (internal only)
   - `device.payguard.africa` → Device Binding

### Step 6: Verify Production

```bash
curl https://api.payguard.africa/health
```

---

## Architecture Diagram

```
                    ┌─────────────────────────┐
                    │   payguard.africa        │
                    │   (Vercel - Dashboard)   │
                    └──────────┬──────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │   API Gateway            │
                    │   (Express / Port 3001)  │
                    └──┬───────┬───────┬──────┘
                       │       │       │
          ┌────────────▼──┐ ┌─▼────┐ ┌▼───────────────┐
          │  Risk Engine  │ │Kafka │ │ Device Binding  │
          │  (FastAPI)    │ │      │ │ (Express)       │
          │  Port 8001    │ └──┬───┘ │ Port 3002       │
          └──┬────────────┘    │     └──┬──────────────┘
             │            ┌───▼────┐    │
             │            │ Graph  │    │
             │            │ Engine │    │
             │            │ 8002   │    │
             │            └───┬────┘    │
          ┌──▼────────────────▼─────────▼──┐
          │          PostgreSQL             │
          │          Redis                  │
          │          Neo4j                  │
          └────────────────────────────────┘
```

---

## Service Ports & Health Checks

| Service | Port | Health Check | Dockerfile |
|---------|------|-------------|------------|
| API Gateway | 3001 | `GET /health` | `services/api/Dockerfile` |
| Risk Engine | 8001 | `GET /health` | `services/risk-engine/Dockerfile` |
| Graph Engine | 8002 | `GET /health` | `services/graph-engine/Dockerfile` |
| Device Binding | 3002 | `GET /health` | `services/device-binding/Dockerfile` |

---

## Security Checklist (Pre-Production)

- [ ] All `CHANGE_ME` values replaced with strong random secrets
- [ ] `SKIP_DECRYPTION` set to `false`
- [ ] API keys generated and distributed to SDK clients securely
- [ ] CORS origins restricted to production domains only
- [ ] TLS 1.3 enforced (automatic on Railway + Vercel)
- [ ] Rate limits tested under load
- [ ] Database backups configured (Railway auto-backs up managed DBs)
- [ ] Monitoring/alerting set up (Railway metrics or Grafana Cloud)
