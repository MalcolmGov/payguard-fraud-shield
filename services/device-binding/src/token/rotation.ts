/**
 * Device Token Rotation
 *
 * Implements sliding-window token renewal:
 *  1. On successful validate, if token is within the renewal window (within 6h of expiry),
 *     issue a new token and revoke the old one.
 *  2. The old token's jti is added to the revocation list in Redis.
 *  3. The new token is returned in the validate response under `rotated_token`.
 *
 * This means:
 *  - Active users never need to re-register
 *  - Tokens are continuously refreshed during active sessions
 *  - Stolen tokens are invalidated if the legitimate user is active
 */

import { query } from '../db/postgres';
import redis from '../db/redis';
import { issueDeviceToken } from '../token/generator';
import { decodeDeviceToken } from '../token/generator';
import { logger } from '../utils/logger';

const RENEWAL_WINDOW_SECONDS = 6 * 60 * 60;  // Renew if < 6h until expiry
const REVOCATION_TTL_SECONDS = 30 * 24 * 60 * 60;  // Keep revocation record for 30 days

/**
 * Check if a token should be rotated (within renewal window).
 */
export function shouldRotate(expAt: number): boolean {
  const secondsUntilExpiry = expAt - Math.floor(Date.now() / 1_000);
  return secondsUntilExpiry < RENEWAL_WINDOW_SECONDS;
}

/**
 * Returns the revocation Redis key for a given JWT ID.
 */
export const revocationKey = (jti: string) => `dbs:revoked:${jti}`;

/**
 * Check if a token JTI has been revoked.
 */
export async function isRevoked(jti: string): Promise<boolean> {
  return (await redis.exists(revocationKey(jti))) === 1;
}

/**
 * Rotate a device token:
 *  1. Mark old token as revoked in Redis
 *  2. Mark old token as revoked in DB (set revoked_at)
 *  3. Issue and persist a new token
 *  4. Return the new token string
 */
export async function rotateToken(
  oldToken: string,
  userId: string,
  deviceId: string,
  fingerprint: string,
): Promise<string> {
  const decoded = decodeDeviceToken(oldToken);
  if (!decoded) {
    throw new Error('Cannot rotate — invalid token');
  }

  const oldJti = decoded.jti;

  // 1. Revoke old token in Redis (fast path for future requests)
  await redis.setex(revocationKey(oldJti), REVOCATION_TTL_SECONDS, '1');

  // 2. Revoke in DB (audit trail)
  await query(
    `UPDATE device_tokens
     SET revoked_at = NOW(), revoked_by = 'token_rotation'
     WHERE jti = $1`,
    [oldJti],
  );

  // 3. Issue new token
  const newToken = issueDeviceToken(userId, deviceId, fingerprint);
  const newDecoded = decodeDeviceToken(newToken)!;

  // 4. Persist new token record
  await query(
    `INSERT INTO device_tokens (jti, device_id, user_id, fingerprint, issued_at, expires_at)
     VALUES ($1, $2, $3, $4, NOW(), to_timestamp($5))`,
    [newDecoded.jti, deviceId, userId, fingerprint, newDecoded.exp],
  );

  logger.info('Device token rotated', { userId, deviceId });
  return newToken;
}
