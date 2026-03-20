/**
 * Invoice Management API Routes
 * ==============================
 * POST   /v1/admin/invoices/generate        — generate invoice for a client
 * GET    /v1/admin/invoices                  — list all invoices
 * GET    /v1/admin/invoices/:id              — get invoice detail + line items
 * PATCH  /v1/admin/invoices/:id              — update status (paid/sent/cancelled)
 * GET    /v1/admin/invoices/:id/html         — get branded HTML invoice (for PDF)
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/postgres';
import { logger } from '../utils/logger';

export const invoiceRouter = Router();

// ── Generate Invoice Number ──────────────────────────────────────────────────
function generateInvoiceNumber(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `PG-${y}${m}-${seq}`;
}

// ── Schemas ──────────────────────────────────────────────────────────────────
const GenerateSchema = z.object({
  client_id: z.string().uuid(),
  period_start: z.string(),  // YYYY-MM-DD
  period_end: z.string(),
  monthly_fee: z.number().optional(),
  per_tx_fee: z.number().optional(),
  api_calls: z.number().int().min(0).optional(),  // Manual override for API call count
  notes: z.string().optional(),
});

const UpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  notes: z.string().optional(),
  paid_at: z.string().optional(),
});

// ── POST /v1/admin/invoices/generate ─────────────────────────────────────────
invoiceRouter.post('/generate', async (req: Request, res: Response) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  const { client_id, period_start, period_end, notes } = parsed.data;

  try {
    // 1. Get client info + pricing
    const clients = await query<any>(
      'SELECT * FROM clients WHERE id = $1 AND is_active = true', [client_id]
    );
    if (clients.length === 0) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    const client = clients[0];

    const monthlyFee = parsed.data.monthly_fee ?? (parseFloat(client.monthly_fee) || 0);
    const perTxFee = parsed.data.per_tx_fee ?? (parseFloat(client.per_tx_fee) || 0.01);
    const currency = client.currency || 'ZAR';

    // 2. Count API calls — manual override or pull from api_key_usage
    let totalApiCalls: number;
    if (parsed.data.api_calls !== undefined && parsed.data.api_calls > 0) {
      totalApiCalls = parsed.data.api_calls;
    } else {
      const usageRows = await query<{ total: string }>(
        `SELECT COALESCE(COUNT(*), 0) AS total
         FROM api_key_usage
         WHERE client_id = $1
           AND created_at >= $2::date
           AND created_at < ($3::date + INTERVAL '1 day')`,
        [client_id, period_start, period_end]
      );
      totalApiCalls = parseInt(usageRows[0]?.total || '0', 10);
    }

    // 3. Calculate totals
    const txAmount = totalApiCalls * perTxFee;
    const subtotal = monthlyFee + txAmount;
    const vatRate = 15.00;
    const vatAmount = Math.round(subtotal * vatRate) / 100;
    const total = subtotal + vatAmount;

    // 4. Create invoice + line items in transaction
    const result = await withTransaction(async (dbClient) => {
      const invoiceNumber = generateInvoiceNumber(new Date(period_start));
      const dueDate = new Date(period_end);
      dueDate.setDate(dueDate.getDate() + 30); // Net 30

      const invoiceRows = await dbClient.query(
        `INSERT INTO invoices
           (invoice_number, client_id, period_start, period_end, due_date,
            monthly_fee, per_tx_fee, currency, total_api_calls,
            subtotal, vat_rate, vat_amount, total, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft',$14)
         RETURNING *`,
        [invoiceNumber, client_id, period_start, period_end, dueDate.toISOString().split('T')[0],
         monthlyFee, perTxFee, currency, totalApiCalls,
         subtotal, vatRate, vatAmount, total, notes || null]
      );
      const invoice = invoiceRows.rows[0];

      // Line items
      const items = [];

      if (monthlyFee > 0) {
        await dbClient.query(
          `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, amount, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [invoice.id, 'PayGuard Platform — Monthly SaaS License', 1, monthlyFee, monthlyFee, 1]
        );
        items.push({ description: 'Monthly SaaS License', quantity: 1, unit_price: monthlyFee, amount: monthlyFee });
      }

      // Always show transaction fee line (even at 0 calls to show the rate)
      await dbClient.query(
        `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, amount, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [invoice.id, `API Transaction Calls (${period_start} to ${period_end})`, totalApiCalls, perTxFee, txAmount, 2]
      );
      items.push({ description: 'API Transaction Calls', quantity: totalApiCalls, unit_price: perTxFee, amount: txAmount });

      return { invoice, items };
    });

    logger.info('Invoice generated', { invoiceNumber: result.invoice.invoice_number, clientId: client_id, total });

    res.status(201).json({
      message: 'Invoice generated successfully',
      invoice: result.invoice,
      line_items: result.items,
    });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Invoice already exists for this period' });
      return;
    }
    logger.error('Failed to generate invoice', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /v1/admin/invoices — List all invoices ───────────────────────────────
invoiceRouter.get('/', async (req: Request, res: Response) => {
  const { status, client_id, limit = '50' } = req.query;

  try {
    let sql = `
      SELECT i.*, c.name AS client_name, c.email AS client_email
      FROM invoices i
      JOIN clients c ON c.id = i.client_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      params.push(status);
      sql += ` AND i.status = $${params.length}`;
    }
    if (client_id) {
      params.push(client_id);
      sql += ` AND i.client_id = $${params.length}`;
    }

    params.push(parseInt(String(limit), 10));
    sql += ` ORDER BY i.created_at DESC LIMIT $${params.length}`;

    const invoices = await query(sql, params);

    // Summary stats
    const stats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'draft') AS drafts,
        COUNT(*) FILTER (WHERE status = 'sent') AS sent,
        COUNT(*) FILTER (WHERE status = 'paid') AS paid,
        COUNT(*) FILTER (WHERE status = 'overdue') AS overdue,
        COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) AS total_collected,
        COALESCE(SUM(total) FILTER (WHERE status IN ('sent','overdue')), 0) AS total_outstanding
      FROM invoices
    `);

    res.json({ invoices, stats: stats[0], total: invoices.length });
  } catch (err) {
    logger.error('Failed to list invoices', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /v1/admin/invoices/:id — Invoice detail ──────────────────────────────
invoiceRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  // Allow lookup by ID or invoice number
  const isUuid = /^[0-9a-f]{8}-/.test(id);

  try {
    const invoices = await query(
      isUuid
        ? 'SELECT i.*, c.name AS client_name, c.email AS client_email, c.billing_address, c.vat_number FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = $1'
        : 'SELECT i.*, c.name AS client_name, c.email AS client_email, c.billing_address, c.vat_number FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.invoice_number = $1',
      [id]
    );

    if (invoices.length === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const items = await query(
      'SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY sort_order',
      [invoices[0].id]
    );

    res.json({ invoice: invoices[0], line_items: items });
  } catch (err) {
    logger.error('Failed to get invoice', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /v1/admin/invoices/:id — Update status ─────────────────────────────
invoiceRouter.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  const updates: string[] = ['updated_at = NOW()'];
  const params: any[] = [];

  if (parsed.data.status) {
    params.push(parsed.data.status);
    updates.push(`status = $${params.length}`);
    if (parsed.data.status === 'paid') {
      updates.push('paid_at = NOW()');
    }
    if (parsed.data.status === 'sent') {
      updates.push('sent_at = NOW()');
    }
  }
  if (parsed.data.notes !== undefined) {
    params.push(parsed.data.notes);
    updates.push(`notes = $${params.length}`);
  }

  params.push(id);

  try {
    const result = await query(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (result.length === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    logger.info('Invoice updated', { id, status: parsed.data.status });
    res.json({ message: 'Invoice updated', invoice: result[0] });
  } catch (err) {
    logger.error('Failed to update invoice', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /v1/admin/invoices/:id/html — Branded HTML invoice ───────────────────
invoiceRouter.get('/:id/html', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const invoices = await query<any>(
      `SELECT i.*, c.name AS client_name, c.email AS client_email, c.billing_address, c.vat_number
       FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = $1`,
      [id]
    );

    if (invoices.length === 0) { res.status(404).json({ error: 'Invoice not found' }); return; }
    const inv = invoices[0];

    const items = await query<any>(
      'SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY sort_order', [id]
    );

    const currency = inv.currency || 'ZAR';
    const fmt = (n: number) => `${currency} ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

    const statusColor: Record<string, string> = {
      draft: '#94A3B8', sent: '#0EA5E9', paid: '#10F5A0', overdue: '#EF4444', cancelled: '#475569',
    };

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Invoice ${inv.invoice_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a2e; background: #fff; }
  .invoice { max-width: 800px; margin: 0 auto; padding: 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #0EA5E9; padding-bottom: 24px; }
  .logo { font-size: 28px; font-weight: 900; color: #0EA5E9; letter-spacing: -0.02em; }
  .logo span { color: #7C3AED; }
  .logo-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
  .invoice-meta { text-align: right; }
  .invoice-number { font-size: 22px; font-weight: 800; color: #1a1a2e; }
  .invoice-date { font-size: 12px; color: #64748b; margin-top: 4px; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 8px; background: ${statusColor[inv.status] || '#94A3B8'}20; color: ${statusColor[inv.status] || '#94A3B8'}; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 36px; }
  .party-label { font-size: 9px; font-weight: 700; color: #94A3B8; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
  .party-name { font-size: 16px; font-weight: 700; color: #1a1a2e; }
  .party-detail { font-size: 12px; color: #64748b; line-height: 1.8; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  thead th { text-align: left; font-size: 9px; font-weight: 700; color: #94A3B8; letter-spacing: 0.1em; text-transform: uppercase; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; }
  thead th:last-child, thead th:nth-child(3), thead th:nth-child(2) { text-align: right; }
  tbody td { padding: 14px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
  tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(2) { text-align: right; font-family: 'JetBrains Mono', monospace; }
  .totals { display: flex; justify-content: flex-end; }
  .totals-table { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #64748b; }
  .totals-row.total { font-size: 18px; font-weight: 800; color: #1a1a2e; border-top: 2px solid #0EA5E9; padding-top: 12px; margin-top: 4px; }
  .totals-row .value { font-family: 'JetBrains Mono', monospace; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94A3B8; text-align: center; line-height: 1.8; }
  .notes { background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 24px; font-size: 12px; color: #64748b; }
  .notes-label { font-size: 9px; font-weight: 700; color: #94A3B8; letter-spacing: 0.1em; margin-bottom: 6px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .invoice { padding: 24px; } }
</style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <div>
      <div class="logo">🛡️ Pay<span>Guard</span></div>
      <div class="logo-sub">Swifter Technologies (Pty) Ltd</div>
      <div class="logo-sub">Fraud Detection Platform</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-number">${inv.invoice_number}</div>
      <div class="invoice-date">Issued: ${new Date(inv.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div class="invoice-date">Due: ${new Date(inv.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div class="status">${inv.status}</div>
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="party-label">From</div>
      <div class="party-name">Swifter Technologies (Pty) Ltd</div>
      <div class="party-detail">
        PayGuard Division<br>
        Johannesburg, South Africa<br>
        malcolm@swifter.co.za<br>
        VAT: 4123456789
      </div>
    </div>
    <div>
      <div class="party-label">Bill To</div>
      <div class="party-name">${inv.client_name}</div>
      <div class="party-detail">
        ${inv.client_email}<br>
        ${inv.billing_address ? inv.billing_address.replace(/\n/g, '<br>') : ''}
        ${inv.vat_number ? `<br>VAT: ${inv.vat_number}` : ''}
      </div>
    </div>
  </div>

  <div class="party-label" style="margin-bottom:8px">BILLING PERIOD: ${new Date(inv.period_start).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} — ${new Date(inv.period_end).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</div>

  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
    <tbody>
      ${items.map((item: any) => `
        <tr>
          <td>${item.description}</td>
          <td>${Number(item.quantity).toLocaleString('en-ZA')}</td>
          <td>${fmt(item.unit_price)}</td>
          <td>${fmt(item.amount)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row"><span>Subtotal</span><span class="value">${fmt(inv.subtotal)}</span></div>
      <div class="totals-row"><span>VAT (${inv.vat_rate}%)</span><span class="value">${fmt(inv.vat_amount)}</span></div>
      <div class="totals-row total"><span>Total Due</span><span class="value">${fmt(inv.total)}</span></div>
    </div>
  </div>

  ${inv.notes ? `<div class="notes"><div class="notes-label">NOTES</div>${inv.notes}</div>` : ''}

  <div class="footer">
    <strong>Swifter Technologies (Pty) Ltd</strong> · PayGuard Fraud Detection Platform<br>
    Bank: First National Bank · Account: 62890012345 · Branch: 250655 · Ref: ${inv.invoice_number}<br>
    © ${new Date().getFullYear()} Swifter Technologies. All rights reserved.
  </div>
</div>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    logger.error('Failed to generate HTML invoice', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});
