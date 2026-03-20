import crypto from 'crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  email: string;
  environment: 'sandbox' | 'production';
  tier: 'free' | 'starter' | 'growth' | 'enterprise';
  rate_limit: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKey {
  id: string;
  client_id: string;
  key_prefix: string;       // First 8 chars for identification (e.g. "pk_live_")
  key_hash: string;          // SHA-256 hash of full key
  environment: 'sandbox' | 'production';
  label: string;
  rate_limit: number;
  is_active: boolean;
  last_used_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
  revoked_at: Date | null;
}

export interface AuthContext {
  client_id: string;
  client_name: string;
  environment: 'sandbox' | 'production';
  tier: string;
  rate_limit: number;
}

// ── Key Generation ────────────────────────────────────────────────────────────

const KEY_PREFIXES = {
  sandbox: 'pk_test_',
  production: 'pk_live_',
} as const;

/**
 * Generate a cryptographically secure API key with environment prefix.
 * Format: pk_live_<32 hex chars> or pk_test_<32 hex chars>
 */
export function generateApiKey(environment: 'sandbox' | 'production'): string {
  const prefix = KEY_PREFIXES[environment];
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `${prefix}${randomPart}`;
}

/**
 * Hash an API key using SHA-256 for secure storage.
 * We never store the raw key — only the hash.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Extract the prefix from a key for display/identification.
 */
export function getKeyPrefix(key: string): string {
  return key.substring(0, 8);
}

/**
 * Mask a key for display (show prefix + last 4 chars).
 */
export function maskKey(key: string): string {
  if (key.length <= 12) return key.substring(0, 4) + '****';
  return key.substring(0, 8) + '...' + key.substring(key.length - 4);
}
