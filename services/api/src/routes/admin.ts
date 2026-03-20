/**
 * Admin API Routes — Client & API Key Management
 * ================================================
 * These endpoints manage multi-tenant API keys. They are protected
 * by the standard auth middleware (platform owner keys only).
 *
 * POST   /v1/admin/clients              — register a new client
 * GET    /v1/admin/clients              — list all clients
 * GET    /v1/admin/clients/:id          — get client details + keys
 * POST   /v1/admin/clients/:id/keys     — generate a new API key pair
 * DELETE /v1/admin/keys/:id             — revoke a key
 * GET    /v1/admin/keys/:id/usage       — get key usage stats
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/postgres';
import { generateApiKey, hashApiKey, getKeyPrefix, maskKey } from '../models/apiKeys';
import { logger } from '../utils/logger';

export const adminRouter = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const CreateClientSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  tier: z.enum(['free', 'starter', 'growth', 'enterprise']).default('free'),
  rate_limit: z.number().int().positive().default(100),
  metadata: z.record(z.any()).optional(),
  // Custom pricing
  monthly_fee: z.number().min(0).default(0),
  per_tx_fee: z.number().min(0).default(0.01),
  currency: z.enum(['ZAR', 'USD', 'EUR', 'GBP']).default('ZAR'),
  billing_cycle: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  vat_number: z.string().max(30).optional(),
  billing_address: z.string().optional(),
});

const CreateKeySchema = z.object({
  environment: z.enum(['sandbox', 'production']),
  label: z.string().max(255).default('Default'),
  rate_limit: z.number().int().positive().optional(),
  expires_in_days: z.number().int().positive().optional(),
});

// ── POST /v1/admin/clients — Register a new client ───────────────────────────

adminRouter.post('/clients', async (req: Request, res: Response) => {
  const parsed = CreateClientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  const { name, email, tier, rate_limit, metadata, monthly_fee, per_tx_fee, currency, billing_cycle, contract_start, contract_end, vat_number, billing_address } = parsed.data;

  try {
    const result = await withTransaction(async (client) => {
      // Create client
      const clientRows = await client.query(
        `INSERT INTO clients (name, email, tier, rate_limit, metadata, monthly_fee, per_tx_fee, currency, billing_cycle, contract_start, contract_end, vat_number, billing_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, name, email, tier, rate_limit, monthly_fee, per_tx_fee, currency, created_at`,
        [name, email, tier, rate_limit, JSON.stringify(metadata || {}), monthly_fee, per_tx_fee, currency, billing_cycle, contract_start || null, contract_end || null, vat_number || null, billing_address || null]
      );
      const newClient = clientRows.rows[0];

      // Generate sandbox + production key pair
      const sandboxKey = generateApiKey('sandbox');
      const productionKey = generateApiKey('production');

      const keys = [
        { raw: sandboxKey, env: 'sandbox' as const },
        { raw: productionKey, env: 'production' as const },
      ];

      const keyRecords = [];
      for (const k of keys) {
        const keyHash = hashApiKey(k.raw);
        const prefix = getKeyPrefix(k.raw);

        await client.query(
          `INSERT INTO api_keys (client_id, key_prefix, key_hash, environment, label, rate_limit)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newClient.id, prefix, keyHash, k.env, 'Default', rate_limit]
        );

        keyRecords.push({
          environment: k.env,
          key: k.raw,          // Only returned once at creation!
          prefix: prefix,
        });
      }

      return { client: newClient, keys: keyRecords };
    });

    logger.info('Client registered', { clientId: result.client.id, name: result.client.name });

    res.status(201).json({
      message: 'Client registered successfully',
      client: result.client,
      api_keys: result.keys,
      warning: '⚠️ Save these API keys now — they will NOT be shown again.',
    });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'A client with this email already exists' });
      return;
    }
    logger.error('Failed to create client', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /v1/admin/clients — List all clients ─────────────────────────────────

adminRouter.get('/clients', async (_req: Request, res: Response) => {
  try {
    const clients = await query(
      `SELECT c.id, c.name, c.email, c.tier, c.rate_limit, c.is_active, c.created_at,
              c.monthly_fee, c.per_tx_fee, c.currency, c.billing_cycle,
              COUNT(ak.id) FILTER (WHERE ak.is_active) AS active_keys,
              MAX(ak.last_used_at) AS last_api_call
       FROM clients c
       LEFT JOIN api_keys ak ON ak.client_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );

    res.json({ clients, total: clients.length });
  } catch (err) {
    logger.error('Failed to list clients', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /v1/admin/clients/:id — Get client details + keys ────────────────────

adminRouter.get('/clients/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const clients = await query(
      'SELECT * FROM clients WHERE id = $1', [id]
    );

    if (clients.length === 0) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const keys = await query(
      `SELECT id, key_prefix, environment, label, rate_limit, is_active,
              last_used_at, expires_at, created_at, revoked_at
       FROM api_keys WHERE client_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      client: clients[0],
      api_keys: keys.map(k => ({
        ...k,
        masked_key: k.key_prefix + '...',
      })),
    });
  } catch (err) {
    logger.error('Failed to get client', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /v1/admin/clients/:id/keys — Generate a new API key ─────────────────

adminRouter.post('/clients/:id/keys', async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = CreateKeySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  const { environment, label, rate_limit, expires_in_days } = parsed.data;

  try {
    // Verify client exists
    const clients = await query('SELECT id, rate_limit FROM clients WHERE id = $1 AND is_active = true', [id]);
    if (clients.length === 0) {
      res.status(404).json({ error: 'Client not found or inactive' });
      return;
    }

    const rawKey = generateApiKey(environment);
    const keyHash = hashApiKey(rawKey);
    const prefix = getKeyPrefix(rawKey);
    const keyRateLimit = rate_limit || clients[0].rate_limit;
    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 86_400_000)
      : null;

    await query(
      `INSERT INTO api_keys (client_id, key_prefix, key_hash, environment, label, rate_limit, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, prefix, keyHash, environment, label, keyRateLimit, expiresAt]
    );

    logger.info('API key generated', { clientId: id, environment, prefix });

    res.status(201).json({
      message: 'API key generated successfully',
      api_key: {
        key: rawKey,
        environment,
        label,
        prefix,
        rate_limit: keyRateLimit,
        expires_at: expiresAt,
      },
      warning: '⚠️ Save this API key now — it will NOT be shown again.',
    });
  } catch (err) {
    logger.error('Failed to generate key', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /v1/admin/keys/:id — Revoke a key ─────────────────────────────────

adminRouter.delete('/keys/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await query(
      `UPDATE api_keys SET is_active = false, revoked_at = NOW()
       WHERE id = $1 AND is_active = true
       RETURNING id, key_prefix, environment`,
      [id]
    );

    if (result.length === 0) {
      res.status(404).json({ error: 'Key not found or already revoked' });
      return;
    }

    logger.info('API key revoked', { keyId: id, prefix: result[0].key_prefix });

    res.json({
      message: 'API key revoked successfully',
      revoked_key: result[0],
    });
  } catch (err) {
    logger.error('Failed to revoke key', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /v1/admin/keys/:id/usage — Key usage stats ───────────────────────────

adminRouter.get('/keys/:id/usage', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { days = '7' } = req.query;

  try {
    const usage = await query(
      `SELECT
         DATE(created_at) AS date,
         COUNT(*) AS total_requests,
         COUNT(*) FILTER (WHERE status_code < 400) AS successful,
         COUNT(*) FILTER (WHERE status_code >= 400) AS errors,
         ROUND(AVG(latency_ms)::numeric, 1) AS avg_latency_ms
       FROM api_key_usage
       WHERE api_key_id = $1
         AND created_at > NOW() - INTERVAL '1 day' * $2
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [id, parseInt(String(days), 10)]
    );

    res.json({ usage, period_days: parseInt(String(days), 10) });
  } catch (err) {
    logger.error('Failed to get usage', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal server error' });
  }
});
