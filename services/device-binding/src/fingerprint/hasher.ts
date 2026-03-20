/**
 * Device Fingerprint Hasher
 *
 * Generates a deterministic SHA-256 fingerprint from 13 device signals.
 * The fingerprint is used as the stable device identity across sessions.
 *
 * Design decisions:
 *  - Hardware-stable signals only (model, screen, app_install_id) — not IP or timezone
 *    which can change legitimately. IP/timezone are stored separately for geolocation checks.
 *  - All signals are normalised to lowercase to prevent trivial bypass via capitalisation.
 *  - A fixed field ordering ensures the hash is deterministic across SDK versions.
 */
import { createHash } from 'crypto';
import { DeviceSignals } from '../models/device';

/** Ordered list of fields that contribute to the fingerprint. Must not change between SDK versions. */
const FINGERPRINT_FIELDS: (keyof DeviceSignals)[] = [
  'device_model',
  'os_version',
  'screen_resolution',
  'app_install_id',
  'sim_country',
  'carrier',
  'timezone',
  'locale',
  'is_rooted',
  'is_emulator',
  'is_jailbroken',
  'app_hash',
  // Note: ip_address is intentionally excluded — IPs change (roaming, VPN, DHCP).
  // IP is stored in device_ip_history for country-mismatch detection instead.
];

/**
 * Generates a SHA-256 device fingerprint from the provided signals.
 * Returns a 64-character hex string.
 */
export function generateFingerprint(signals: DeviceSignals): string {
  const parts = FINGERPRINT_FIELDS.map((field) => {
    const val = signals[field];
    return `${field}:${String(val).toLowerCase().trim()}`;
  });

  return createHash('sha256')
    .update(parts.join('|'))
    .digest('hex');
}

/**
 * Hash a raw JWT token string for safe storage in the DB.
 * We never store the raw token — only its SHA-256 hash.
 */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Validate that a client-provided fingerprint matches the server-computed one.
 * Used during device validation to detect token cloning / replay attacks.
 */
export function fingerprintMatches(
  clientFingerprint: string,
  serverFingerprint: string,
): boolean {
  // Constant-time comparison to prevent timing attacks
  if (clientFingerprint.length !== serverFingerprint.length) return false;
  let diff = 0;
  for (let i = 0; i < clientFingerprint.length; i++) {
    diff |= clientFingerprint.charCodeAt(i) ^ serverFingerprint.charCodeAt(i);
  }
  return diff === 0;
}
