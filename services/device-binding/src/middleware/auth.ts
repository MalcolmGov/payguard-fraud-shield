/**
 * API Key authentication middleware.
 * Validates the x-api-key header against allowed keys stored in env / Redis.
 * Shares the same key format (pg_live_*, pg_sandbox_*) as the Signal API.
 */
import { Request, Response, NextFunction } from 'express';

const VALID_API_KEYS = new Set(
  (process.env.API_KEYS || 'pg_sandbox_001,pg_sandbox_002').split(',').map((k) => k.trim()),
);

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'];
  if (!key || !VALID_API_KEYS.has(String(key))) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing x-api-key header' });
    return;
  }
  next();
}
