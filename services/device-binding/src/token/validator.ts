/**
 * Device Token Validator
 *
 * Handles full validation of a device token on each login/transaction:
 *  1. Verify JWT signature and expiry
 *  2. Check fingerprint claim matches presented fingerprint (no token cloning)
 *  3. Check token hash not in revoked set (DB + Redis cache)
 *  4. Check device not blacklisted (Redis hot cache → DB fallback)
 */
import { verifyDeviceToken, DeviceTokenPayload } from './generator';
import { hashToken } from '../fingerprint/hasher';
import { fingerprintMatches } from '../fingerprint/hasher';
import { query } from '../db/postgres';
import { getCachedToken, isBlacklistedCached, cacheBlacklist } from '../db/redis';

export type TokenValidationError =
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_REVOKED'
  | 'FINGERPRINT_MISMATCH'
  | 'DEVICE_BLACKLISTED';

export interface TokenValidationResult {
  valid: boolean;
  payload?: DeviceTokenPayload;
  error?: TokenValidationError;
}

/**
 * Full device token validation pipeline.
 * Returns { valid: true, payload } on success.
 * Returns { valid: false, error } on any failure.
 */
export async function validateDeviceToken(
  rawToken: string,
  presentedFingerprint: string,
): Promise<TokenValidationResult> {
  // ── 1. Verify JWT signature and expiry ──────────────────────────────────────
  let payload: DeviceTokenPayload;
  try {
    payload = verifyDeviceToken(rawToken);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    return {
      valid: false,
      error: msg.includes('expired') ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    };
  }

  // ── 2. Fingerprint match check (prevents token cloning) ─────────────────────
  if (!fingerprintMatches(presentedFingerprint, payload.dfp)) {
    return { valid: false, error: 'FINGERPRINT_MISMATCH' };
  }

  const tokenHash = hashToken(rawToken);

  // ── 3. Blacklist check — Redis hot cache first ───────────────────────────────
  const cachedBlacklisted = await isBlacklistedCached(payload.dfp);
  if (cachedBlacklisted) {
    return { valid: false, error: 'DEVICE_BLACKLISTED' };
  }

  // DB blacklist fallback (populates cache for 60s on hit)
  const blacklistRows = await query<{ device_fingerprint: string }>(
    'SELECT device_fingerprint FROM device_blacklist WHERE device_fingerprint = $1 LIMIT 1',
    [payload.dfp],
  );
  if (blacklistRows.length > 0) {
    await cacheBlacklist(payload.dfp);
    return { valid: false, error: 'DEVICE_BLACKLISTED' };
  }

  // ── 4. Token revocation check — Redis cache first ────────────────────────────
  const cached = await getCachedToken(tokenHash);
  if (cached) {
    // Cache hit means token is still valid (not revoked)
    return { valid: true, payload };
  }

  // DB fallback: check if token was explicitly revoked
  const tokenRows = await query<{ revoked: boolean }>(
    'SELECT revoked FROM device_tokens WHERE token_hash = $1 LIMIT 1',
    [tokenHash],
  );
  if (tokenRows.length > 0 && tokenRows[0].revoked) {
    return { valid: false, error: 'TOKEN_REVOKED' };
  }

  return { valid: true, payload };
}
