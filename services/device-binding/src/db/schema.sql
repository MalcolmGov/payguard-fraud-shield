-- PayGuard Device Binding Service — PostgreSQL Schema
-- Run once on service startup or via migration tool

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── devices ──────────────────────────────────────────────────────────────────
-- One row per unique device fingerprint (SHA-256 hash of 13 device signals).
CREATE TABLE IF NOT EXISTS devices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_fingerprint  TEXT UNIQUE NOT NULL,        -- SHA-256 hash of signals
  device_model        TEXT NOT NULL DEFAULT '',
  os_version          TEXT NOT NULL DEFAULT '',
  sim_country         TEXT NOT NULL DEFAULT '',
  carrier             TEXT NOT NULL DEFAULT '',
  timezone            TEXT NOT NULL DEFAULT '',
  locale              TEXT NOT NULL DEFAULT '',
  is_rooted           BOOLEAN NOT NULL DEFAULT FALSE,
  is_emulator         BOOLEAN NOT NULL DEFAULT FALSE,
  is_jailbroken       BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address          TEXT NOT NULL DEFAULT '',
  classification      TEXT NOT NULL DEFAULT 'unknown'  -- trusted|unknown|high_risk|blacklisted
                        CHECK (classification IN ('trusted','unknown','high_risk','blacklisted')),
  fraud_report_count  INTEGER NOT NULL DEFAULT 0,
  first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── device_tokens ─────────────────────────────────────────────────────────────
-- Short-lived JWT tokens issued per device+user pair. Rotated on each session.
CREATE TABLE IF NOT EXISTS device_tokens (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id           UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL,
  token_hash          TEXT NOT NULL,               -- SHA-256 of the raw JWT (never store raw token)
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL,        -- issued_at + 24h
  revoked             BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_device_user
  ON device_tokens(device_id, user_id)
  WHERE revoked = FALSE;

-- ── device_accounts ───────────────────────────────────────────────────────────
-- Maps devices to all user accounts they've been associated with.
-- A device linked to > 3 unrelated accounts triggers RULE_017.
CREATE TABLE IF NOT EXISTS device_accounts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id           UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL,
  trust_status        TEXT NOT NULL DEFAULT 'new_device'
                        CHECK (trust_status IN ('trusted','new_device','suspicious_device')),
  step_up_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  step_up_method      TEXT,                        -- otp_verification|biometric|email|support
  first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_device_accounts_user ON device_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_device_accounts_device ON device_accounts(device_id);

-- ── device_blacklist ──────────────────────────────────────────────────────────
-- Analyst-managed blacklist. Queried by risk engine on every request.
CREATE TABLE IF NOT EXISTS device_blacklist (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_fingerprint  TEXT UNIQUE NOT NULL,
  reason              TEXT NOT NULL DEFAULT '',
  blacklisted_by      TEXT NOT NULL DEFAULT 'system',   -- analyst user ID or 'system'
  fraud_case_id       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blacklist_fingerprint ON device_blacklist(device_fingerprint);

-- ── device_ip_history ─────────────────────────────────────────────────────────
-- Track IP addresses seen per device for geolocation / country mismatch detection.
CREATE TABLE IF NOT EXISTS device_ip_history (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id           UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  ip_address          TEXT NOT NULL,
  country_code        TEXT NOT NULL DEFAULT '',
  city                TEXT NOT NULL DEFAULT '',
  seen_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_history_device ON device_ip_history(device_id);

-- ── device_fraud_reports ──────────────────────────────────────────────────────
-- Fraud events linked to a device — fed by the risk engine via Kafka.
CREATE TABLE IF NOT EXISTS device_fraud_reports (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id           UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL,
  rule_triggered      TEXT NOT NULL,
  risk_score          INTEGER NOT NULL,
  action_taken        TEXT NOT NULL,  -- BLOCK|WARN_USER|ALLOW
  transaction_id      TEXT,
  reported_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_reports_device ON device_fraud_reports(device_id);
