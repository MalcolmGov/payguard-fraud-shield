/**
 * Device Token Generator
 *
 * Issues signed JWT device tokens. Tokens are:
 *  - HS256 signed with a per-environment secret
 *  - Short-lived (24h TTL)
 *  - Bound to a specific device_fingerprint + user_id pair
 *  - Rotated on every successful session (existing token revoked on new issuance)
 *
 * Claims:
 *   sub   — user_id
 *   did   — device_id (UUID from devices table)
 *   dfp   — device_fingerprint (SHA-256 hash)
 *   iat   — issued at (Unix seconds)
 *   exp   — expires at (iat + 86400)
 *   jti   — unique JWT ID (UUIDv4), used for replay prevention
 */
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// DEVICE_TOKEN_SECRET is mandatory — validateEnv() in index.ts ensures it's
// set and meets minimum length before this module is ever invoked.
const JWT_SECRET = process.env.DEVICE_TOKEN_SECRET!;

const TOKEN_TTL_SECONDS = 86_400; // 24 hours

export interface DeviceTokenPayload {
  sub: string;    // user_id
  did: string;    // device_id (UUID)
  dfp: string;    // device_fingerprint
  jti: string;    // JWT ID for replay prevention
  iat: number;
  exp: number;
}

/**
 * Issue a signed device token for the given user + device.
 * Returns the raw JWT string (to be sent to the SDK and stored in Keystore/Keychain).
 */
export function issueDeviceToken(userId: string, deviceId: string, fingerprint: string): string {
  const now = Math.floor(Date.now() / 1_000);
  const payload: Omit<DeviceTokenPayload, 'iat' | 'exp'> & { iat: number; exp: number } = {
    sub: userId,
    did: deviceId,
    dfp: fingerprint,
    jti: uuidv4(),
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', noTimestamp: true });
}

/**
 * Decode a device token WITHOUT verifying the signature.
 * Used only to extract the jti/did for revocation lookups.
 * Never use this for authentication — use verifyDeviceToken instead.
 */
export function decodeDeviceToken(token: string): DeviceTokenPayload | null {
  try {
    return jwt.decode(token) as DeviceTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify the device token signature and expiry.
 * Returns the decoded payload if valid, throws if invalid/expired.
 */
export function verifyDeviceToken(token: string): DeviceTokenPayload {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as DeviceTokenPayload;
}
