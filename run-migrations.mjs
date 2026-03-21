// ── Run all PayGuard database migrations against Railway Postgres ──────────
import pg from "pg";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = `postgresql://postgres:dGHYIfHtKmewtlHOKcyYbSbhZTFkbOZy@junction.proxy.rlwy.net:28121/railway`;

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  console.log("✅ Connected to Railway Postgres\n");

  try {
    // ── 1. API Gateway migrations ──────────────────────────────────────────
    console.log("── Running API Gateway migrations ──");
    
    const migrationSql = fs.readFileSync(
      path.join(__dirname, "services/api/src/db/migration.sql"), "utf8"
    );
    await client.query(migrationSql);
    console.log("   ✅ clients, api_keys, api_key_usage tables created");

    const invoiceSql = fs.readFileSync(
      path.join(__dirname, "services/api/src/db/migration-invoices.sql"), "utf8"
    );
    await client.query(invoiceSql);
    console.log("   ✅ invoices, invoice_line_items tables created\n");

    // ── 2. Risk Engine migrations ──────────────────────────────────────────
    console.log("── Running Risk Engine migrations ──");

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_baselines (
        user_id       VARCHAR(255) PRIMARY KEY,
        avg_amount    NUMERIC(12,2) DEFAULT 0,
        avg_tx_count  INTEGER DEFAULT 0,
        known_devices JSONB DEFAULT '[]',
        known_ips     JSONB DEFAULT '[]',
        usual_hours   JSONB DEFAULT '{}',
        usual_location JSONB DEFAULT '{}',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("   ✅ user_baselines table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS risk_decisions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payload_id      VARCHAR(255) NOT NULL,
        user_id         VARCHAR(255) NOT NULL,
        session_id      VARCHAR(255),
        risk_score      INTEGER NOT NULL,
        risk_level      VARCHAR(20) NOT NULL,
        recommended_action VARCHAR(30) NOT NULL,
        triggered_rules JSONB DEFAULT '[]',
        score_breakdown JSONB DEFAULT '{}',
        channel         VARCHAR(20) DEFAULT 'sdk',
        warning_message TEXT,
        latency_ms      INTEGER,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_decisions_user ON risk_decisions (user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_decisions_payload ON risk_decisions (payload_id);
      CREATE INDEX IF NOT EXISTS idx_decisions_level ON risk_decisions (risk_level, created_at DESC);
    `);
    console.log("   ✅ risk_decisions table created\n");

    // ── 3. Device Binding migrations ───────────────────────────────────────
    console.log("── Running Device Binding migrations ──");

    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id       VARCHAR(255) NOT NULL,
        user_id         VARCHAR(255) NOT NULL,
        fingerprint     VARCHAR(255) NOT NULL,
        device_model    VARCHAR(255),
        os_version      VARCHAR(50),
        app_version     VARCHAR(20),
        is_trusted      BOOLEAN NOT NULL DEFAULT false,
        trust_score     INTEGER DEFAULT 50,
        is_rooted       BOOLEAN DEFAULT false,
        is_emulator     BOOLEAN DEFAULT false,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(device_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_devices_user ON devices (user_id);
      CREATE INDEX IF NOT EXISTS idx_devices_fingerprint ON devices (fingerprint);
    `);
    console.log("   ✅ devices table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id     UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        token_hash    VARCHAR(255) NOT NULL UNIQUE,
        expires_at    TIMESTAMPTZ,
        is_valid      BOOLEAN NOT NULL DEFAULT true,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tokens_device ON device_tokens (device_id);
      CREATE INDEX IF NOT EXISTS idx_tokens_hash ON device_tokens (token_hash) WHERE is_valid = true;
    `);
    console.log("   ✅ device_tokens table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS device_accounts (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id     UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        user_id       VARCHAR(255) NOT NULL,
        first_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(device_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_device_accounts_user ON device_accounts (user_id);
    `);
    console.log("   ✅ device_accounts table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS device_blacklist (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        fingerprint   VARCHAR(255) NOT NULL UNIQUE,
        reason        TEXT NOT NULL,
        reported_by   VARCHAR(255),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("   ✅ device_blacklist table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS device_ip_history (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id     UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        ip_address    VARCHAR(45) NOT NULL,
        country       VARCHAR(3),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ip_history_device ON device_ip_history (device_id, created_at DESC);
    `);
    console.log("   ✅ device_ip_history table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS device_fraud_reports (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id     UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        report_type   VARCHAR(50) NOT NULL,
        description   TEXT,
        reported_by   VARCHAR(255),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_fraud_reports_device ON device_fraud_reports (device_id);
    `);
    console.log("   ✅ device_fraud_reports table created\n");

    // ── 4. Generate production API key ─────────────────────────────────────
    console.log("── Generating Production API Key ──");

    const apiKey = "pg_live_" + crypto.randomBytes(24).toString("hex");
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const keyPrefix = apiKey.substring(0, 16);

    // Get the PayGuard client ID
    const clientResult = await client.query(
      `SELECT id FROM clients WHERE email = 'malcolmgov24@gmail.com' LIMIT 1`
    );

    if (clientResult.rows.length > 0) {
      const clientId = clientResult.rows[0].id;
      await client.query(`
        INSERT INTO api_keys (client_id, key_prefix, key_hash, environment, label, rate_limit)
        VALUES ($1, $2, $3, 'production', 'Primary Production Key', 10000)
        ON CONFLICT (key_hash) DO NOTHING
      `, [clientId, keyPrefix, keyHash]);
      console.log("   ✅ API key generated and stored");
      console.log(`\n   🔑 YOUR PRODUCTION API KEY (save this — shown only once):`);
      console.log(`   ${apiKey}\n`);
    } else {
      console.log("   ⚠️ No client found — insert PayGuard client first");
    }

    // ── 5. Generate secrets ────────────────────────────────────────────────
    console.log("── Generated Secrets ──");
    const encKey = crypto.randomBytes(32).toString("hex");
    const jwtSecret = crypto.randomBytes(48).toString("hex");
    console.log(`   PAYLOAD_ENCRYPTION_KEY: ${encKey}`);
    console.log(`   DEVICE_TOKEN_SECRET:    ${jwtSecret}`);

    // ── 6. Verify tables ───────────────────────────────────────────────────
    console.log("\n── Verifying all tables ──");
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log("   Tables in database:");
    tables.rows.forEach(r => console.log(`   • ${r.table_name}`));

    console.log("\n✅ All migrations complete!");

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
