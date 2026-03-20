-- PayGuard Multi-Tenant API Key Management
-- Run against the Railway PostgreSQL database

-- ── Clients table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  tier          VARCHAR(50) NOT NULL DEFAULT 'free',
  rate_limit    INTEGER NOT NULL DEFAULT 100,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── API Keys table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  key_prefix    VARCHAR(16) NOT NULL,
  key_hash      VARCHAR(128) NOT NULL UNIQUE,
  environment   VARCHAR(20) NOT NULL CHECK (environment IN ('sandbox', 'production')),
  label         VARCHAR(255) NOT NULL DEFAULT 'Default',
  rate_limit    INTEGER NOT NULL DEFAULT 100,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_used_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys (key_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_client ON api_keys (client_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys (key_prefix);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients (email);

-- ── API Key usage log (for analytics) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_key_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id    UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  endpoint      VARCHAR(255) NOT NULL,
  method        VARCHAR(10) NOT NULL,
  status_code   INTEGER,
  latency_ms    INTEGER,
  ip_address    VARCHAR(45),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_key ON api_key_usage (api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_client ON api_key_usage (client_id, created_at DESC);

-- ── Insert PayGuard as the first client (platform owner) ──────────────────────
INSERT INTO clients (name, email, tier, rate_limit)
VALUES ('PayGuard (Platform)', 'malcolmgov24@gmail.com', 'enterprise', 10000)
ON CONFLICT (email) DO NOTHING;
