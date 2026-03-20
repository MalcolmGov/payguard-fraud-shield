-- PayGuard Invoice System Migration
-- Run against Railway PostgreSQL

-- ── Invoices table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  VARCHAR(30) NOT NULL UNIQUE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Period
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  due_date        DATE NOT NULL,

  -- Pricing (negotiated per client)
  monthly_fee     NUMERIC(12,2) NOT NULL DEFAULT 0,
  per_tx_fee      NUMERIC(10,4) NOT NULL DEFAULT 0.01,
  currency        VARCHAR(3) NOT NULL DEFAULT 'ZAR',

  -- Usage
  total_api_calls INTEGER NOT NULL DEFAULT 0,
  
  -- Calculated totals
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate        NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  vat_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Status
  status          VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  paid_at         TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Invoice line items ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity         NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(10,4) NOT NULL DEFAULT 0,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices (client_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items ON invoice_line_items (invoice_id, sort_order);

-- ── Add pricing columns to clients table ──────────────────────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS monthly_fee     NUMERIC(12,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS per_tx_fee      NUMERIC(10,4) DEFAULT 0.01;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS currency        VARCHAR(3) DEFAULT 'ZAR';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_cycle   VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_start  DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_end    DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vat_number      VARCHAR(30);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_address TEXT;
