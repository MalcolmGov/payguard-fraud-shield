/**
 * Redis client for device-binding-service.
 *
 * OFFLINE-MODE SAFE: If Redis is unavailable the service keeps running.
 * All cache operations become no-ops and return safe defaults.
 * This mirrors how payguard-api handles Kafka being unavailable.
 */
import Redis from 'ioredis';

let redisOnline = false;

const redis = new Redis({
  host:     process.env.REDIS_HOST     || 'localhost',
  port:     parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db:       parseInt(process.env.REDIS_DB   || '1', 10),
  lazyConnect:            true,   // don't connect at import time
  enableOfflineQueue:     false,  // don't queue commands while offline — fail fast
  maxRetriesPerRequest:   0,      // fail immediately per-command when offline
  // Give up after 3 attempts to avoid flooding logs with thousands of retries.
  // Once null is returned ioredis stops reconnecting permanently.
  retryStrategy: (times: number) => {
    if (times === 1) {
      console.warn('[Redis] Cannot connect — entering permanent offline mode. Cache ops are no-ops.');
    }
    if (times > 3) return null; // stop retrying
    return Math.min(times * 500, 2_000);
  },
});

redis.on('connect', () => {
  redisOnline = true;
  console.log('[Redis] Connected — cache layer active');
});
redis.on('ready', () => {
  redisOnline = true;
});
redis.on('error', (err: Error) => {
  // Only log the first transition to offline, not every reconnect retry tick
  if (redisOnline) {
    console.warn('[Redis] Connection lost — running without cache:', err.message);
    redisOnline = false;
  }
  // Suppress all subsequent error events to prevent log flooding
});
redis.on('close', () => {
  redisOnline = false;
});

// Attempt initial connection — but don't crash if it fails
redis.connect().catch(() => {
  console.warn('[Redis] Unavailable at startup — service running in offline mode. Cache operations are no-ops.');
});

// ── Key helpers ───────────────────────────────────────────────────────────────

export const tokenKey    = (tokenHash: string)    => `dbs:token:${tokenHash}`;
export const velocityKey = (fingerprint: string)  => `dbs:velocity:${fingerprint}`;
export const blacklistKey = (fingerprint: string) => `dbs:blacklist:${fingerprint}`;

// ── Safe wrapper — returns undefined/null/default instead of throwing ─────────

async function safeExec<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!redisOnline) return fallback;
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[Redis] Operation failed (offline mode):', msg);
    redisOnline = false;
    return fallback;
  }
}

// ── Cache operations ──────────────────────────────────────────────────────────

/** Cache a device token for 24 hours. No-op if Redis is offline. */
export async function cacheToken(
  tokenHash: string,
  payload: { device_id: string; user_id: string },
): Promise<void> {
  await safeExec(
    () => redis.set(tokenKey(tokenHash), JSON.stringify(payload), 'EX', 86_400),
    undefined,
  );
}

/** Retrieve a cached token payload. Returns null if Redis is offline or key absent. */
export async function getCachedToken(
  tokenHash: string,
): Promise<{ device_id: string; user_id: string } | null> {
  return safeExec(async () => {
    const raw = await redis.get(tokenKey(tokenHash));
    return raw ? (JSON.parse(raw) as { device_id: string; user_id: string }) : null;
  }, null);
}

/** Invalidate a device token from cache. No-op if Redis offline. */
export async function invalidateToken(tokenHash: string): Promise<void> {
  await safeExec(() => redis.del(tokenKey(tokenHash)), undefined);
}

/** Increment velocity counter. Returns 0 if Redis offline (safe — won't block). */
export async function incrementVelocity(fingerprint: string): Promise<number> {
  return safeExec(() => redis.incr(velocityKey(fingerprint)), 0);
}

/** Get velocity count. Returns 0 if Redis offline. */
export async function getVelocity(fingerprint: string): Promise<number> {
  return safeExec(async () => {
    const val = await redis.get(velocityKey(fingerprint));
    return val ? parseInt(val, 10) : 0;
  }, 0);
}

/** Cache a blacklist hit for 60 seconds. No-op if Redis offline. */
export async function cacheBlacklist(fingerprint: string): Promise<void> {
  await safeExec(() => redis.set(blacklistKey(fingerprint), '1', 'EX', 60), undefined);
}

/**
 * Check if fingerprint is in the hot Redis blacklist.
 * Returns false (not cached = not blocked) when Redis offline — safe default,
 * route will fall through to DB check.
 */
export async function isBlacklistedCached(fingerprint: string): Promise<boolean> {
  return safeExec(async () => (await redis.exists(blacklistKey(fingerprint))) === 1, false);
}

/** Clear blacklist cache entry. No-op if Redis offline. */
export async function clearBlacklist(fingerprint: string): Promise<void> {
  await safeExec(() => redis.del(blacklistKey(fingerprint)), undefined);
}

// ── Status export ─────────────────────────────────────────────────────────────

/** Returns true when Redis is connected and accepting commands. */
export function isRedisOnline(): boolean {
  return redisOnline;
}

// ── OTP operations (used by otp/service.ts) ───────────────────────────────────

/** Store OTP hash with TTL. Returns true on success, false if Redis offline. */
export async function setOtp(userId: string, hash: string, ttlSeconds: number): Promise<boolean> {
  return safeExec(
    () => redis.set(`otp:${userId}`, hash, 'EX', ttlSeconds).then(() => true),
    false,
  );
}

/** Get stored OTP hash. Returns null if Redis offline or key absent. */
export async function getOtp(userId: string): Promise<string | null> {
  return safeExec(() => redis.get(`otp:${userId}`), null);
}

/** Delete OTP and attempts keys together. No-op if Redis offline. */
export async function clearOtp(userId: string): Promise<void> {
  await safeExec(
    () => redis.del(`otp:${userId}`, `otp_attempts:${userId}`).then(() => undefined as void),
    undefined,
  );
}

/**
 * Get OTP attempt count.
 * Returns a value >= MAX_ATTEMPTS (999) when Redis is offline so that
 * the service safely denies further attempts rather than allowing unlimited tries.
 */
export async function getOtpAttempts(userId: string): Promise<number> {
  return safeExec(
    async () => parseInt((await redis.get(`otp_attempts:${userId}`)) ?? '0', 10),
    999, // safe default: deny when cache is unreachable
  );
}

/** Increment OTP attempt counter and set/refresh its TTL. No-op if Redis offline. */
export async function incrOtpAttempts(userId: string, ttlSeconds: number): Promise<void> {
  await safeExec(async () => {
    await redis.incr(`otp_attempts:${userId}`);
    await redis.expire(`otp_attempts:${userId}`, ttlSeconds);
  }, undefined);
}

// ── USSD Session operations (used by routes/stepup.ts) ────────────────────────

/** Get a USSD session JSON string. Returns null if Redis offline or key absent. */
export async function getUssdSession(sessionId: string): Promise<string | null> {
  return safeExec(() => redis.get(`ussd:session:${sessionId}`), null);
}

/** Set a USSD session with TTL. Returns true on success, false if Redis offline. */
export async function setUssdSession(
  sessionId: string,
  value: string,
  ttlSeconds: number,
): Promise<boolean> {
  return safeExec(
    () => redis.set(`ussd:session:${sessionId}`, value, 'EX', ttlSeconds).then(() => true),
    false,
  );
}

/** Delete a USSD session. No-op if Redis offline. */
export async function delUssdSession(sessionId: string): Promise<void> {
  await safeExec(
    () => redis.del(`ussd:session:${sessionId}`).then(() => undefined as void),
    undefined,
  );
}

export default redis;
