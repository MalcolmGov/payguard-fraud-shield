/**
 * Multi-Tenant Auth Middleware
 * ============================
 * Validates Bearer tokens against the api_keys table in PostgreSQL.
 * Caches validated keys in a local Map for fast lookups (no Redis dependency).
 * Falls back to env-var API_KEYS if database is unavailable.
 *
 * On success, attaches `req.client` with tenant context (client_id, name, tier, etc.).
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { query } from '../db/postgres';
import { hashApiKey, type AuthContext } from '../models/apiKeys';

// ── In-memory cache (TTL: 5 minutes) ─────────────────────────────────────────
const KEY_CACHE = new Map<string, { context: AuthContext; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// ── Fallback: env-var keys (for backward compatibility) ──────────────────────
const FALLBACK_KEYS = new Set(
  (process.env.API_KEYS || 'dev-key-001,dev-key-002').split(',').map(k => k.trim()).filter(Boolean)
);

// Extend Express Request to include client context
declare global {
  namespace Express {
    interface Request {
      client?: AuthContext;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) {
    res.status(401).json({ error: 'Empty API key' });
    return;
  }

  const keyHash = hashApiKey(rawKey);

  // ── 1. Check in-memory cache ────────────────────────────────────────────────
  const cached = KEY_CACHE.get(keyHash);
  if (cached && cached.expiresAt > Date.now()) {
    req.client = cached.context;
    next();
    return;
  }

  // ── 2. Check database ──────────────────────────────────────────────────────
  try {
    const rows = await query<{
      client_id: string;
      client_name: string;
      environment: 'sandbox' | 'production';
      tier: string;
      rate_limit: number;
      key_id: string;
    }>(
      `SELECT
         ak.id AS key_id,
         ak.client_id,
         c.name AS client_name,
         ak.environment,
         c.tier,
         ak.rate_limit
       FROM api_keys ak
       JOIN clients c ON c.id = ak.client_id
       WHERE ak.key_hash = $1
         AND ak.is_active = true
         AND c.is_active = true
         AND (ak.expires_at IS NULL OR ak.expires_at > NOW())`,
      [keyHash]
    );

    if (rows.length > 0) {
      const row = rows[0];
      const context: AuthContext = {
        client_id: row.client_id,
        client_name: row.client_name,
        environment: row.environment,
        tier: row.tier,
        rate_limit: row.rate_limit,
      };

      // Cache the key
      KEY_CACHE.set(keyHash, { context, expiresAt: Date.now() + CACHE_TTL_MS });

      // Update last_used_at asynchronously (fire-and-forget)
      query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [row.key_id]).catch(() => {});

      req.client = context;
      next();
      return;
    }
  } catch (dbErr) {
    // Database unavailable — fall through to env-var fallback
    logger.warn('DB lookup failed, falling back to env-var keys', { error: (dbErr as Error).message });
  }

  // ── 3. Fallback: check env-var keys ─────────────────────────────────────────
  if (FALLBACK_KEYS.has(rawKey)) {
    req.client = {
      client_id: 'platform-owner',
      client_name: 'PayGuard (Platform)',
      environment: rawKey.includes('test') ? 'sandbox' : 'production',
      tier: 'enterprise',
      rate_limit: 10000,
    };
    next();
    return;
  }

  // ── 4. Rejected ─────────────────────────────────────────────────────────────
  logger.warn('Invalid API key attempt', {
    ip: req.ip,
    prefix: rawKey.slice(0, 8) + '...',
  });
  res.status(403).json({ error: 'Invalid API key' });
}
