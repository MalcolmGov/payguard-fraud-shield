/**
 * Device Reputation Scorer
 *
 * Classifies devices as trusted / unknown / high_risk / blacklisted
 * based on account count, fraud reports, and security flags.
 * This is called during validate and by the risk engine integration.
 */
import { query } from '../db/postgres';
import { getVelocity } from '../db/redis';
import { ReputationClass, ReputationResponse } from '../models/device';

/** Thresholds for reputation classification */
const THRESHOLDS = {
  HIGH_RISK_ACCOUNT_COUNT:  3,    // Device seen on > 3 accounts → high_risk
  HIGH_RISK_FRAUD_REPORTS:  2,    // Device has > 2 fraud reports → high_risk
  TRUSTED_MIN_SESSIONS:     5,    // Device needs > 5 clean sessions to be auto-trusted
};

/**
 * Compute the reputation for a given device fingerprint.
 * Merges DB data with Redis velocity counter.
 */
export async function computeReputation(
  deviceFingerprint: string,
): Promise<ReputationResponse | null> {
  // ── Fetch device record ───────────────────────────────────────────────────
  const deviceRows = await query<{
    id: string; classification: string; fraud_report_count: number;
    is_rooted: boolean; is_emulator: boolean; last_seen_at: string;
  }>(
    `SELECT id, classification, fraud_report_count, is_rooted, is_emulator, last_seen_at
     FROM devices WHERE device_fingerprint = $1 LIMIT 1`,
    [deviceFingerprint],
  );

  if (deviceRows.length === 0) return null;
  const device = deviceRows[0];

  // ── Check blacklist ───────────────────────────────────────────────────────
  const bRows = await query(
    'SELECT 1 FROM device_blacklist WHERE device_fingerprint = $1 LIMIT 1',
    [deviceFingerprint],
  );
  const isBlacklisted = bRows.length > 0;

  // ── Account count (Redis velocity + DB) ──────────────────────────────────
  const redisCount = await getVelocity(deviceFingerprint);
  const dbCountRows = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM device_accounts WHERE device_id = $1',
    [device.id],
  );
  const accountCount = Math.max(redisCount, parseInt(dbCountRows[0]?.count ?? '0', 10));

  // ── IP history ────────────────────────────────────────────────────────────
  const ipRows = await query<{ ip_address: string; country_code: string; seen_at: string }>(
    `SELECT ip_address, country_code, seen_at FROM device_ip_history
     WHERE device_id = $1 ORDER BY seen_at DESC LIMIT 10`,
    [device.id],
  );

  // ── Compute classification ────────────────────────────────────────────────
  let classification: ReputationClass = device.classification as ReputationClass;
  if (isBlacklisted) {
    classification = 'blacklisted';
  } else if (
    accountCount > THRESHOLDS.HIGH_RISK_ACCOUNT_COUNT ||
    device.fraud_report_count > THRESHOLDS.HIGH_RISK_FRAUD_REPORTS ||
    device.is_emulator || device.is_rooted
  ) {
    classification = 'high_risk';
  } else if (classification === 'unknown') {
    classification = 'unknown';
  }

  return {
    device_fingerprint:  deviceFingerprint,
    classification,
    account_count:       accountCount,
    fraud_report_count:  device.fraud_report_count,
    is_blacklisted:      isBlacklisted,
    ip_history:          ipRows.map((r) => ({ ...r, seen_at: r.seen_at })),
    last_seen_at:        device.last_seen_at,
  };
}

/**
 * Convert a validate result + reputation into a risk engine delta and list of triggered rules.
 * Called by the validate route to attach fraud signals to the response.
 */
export function computeRiskDelta(
  trustStatus: string,
  reputation: ReputationResponse | null,
): { risk_delta: number; triggered_rules: string[] } {
  let delta = 0;
  const rules: string[] = [];

  if (trustStatus === 'suspicious_device' || reputation?.is_blacklisted) {
    delta += 80; rules.push('RULE_016');
  }
  if (trustStatus === 'new_device') {
    delta += 55; rules.push('RULE_015');
  }
  if (reputation && reputation.account_count > THRESHOLDS.HIGH_RISK_ACCOUNT_COUNT) {
    delta += 60; rules.push('RULE_017');
  }
  if (reputation?.classification === 'high_risk') {
    delta += 20; rules.push('RULE_HIGH_RISK_DEVICE');
  }

  return { risk_delta: delta, triggered_rules: rules };
}
