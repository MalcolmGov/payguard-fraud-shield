import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateDeviceToken } from '../token/validator';
import { computeReputation, computeRiskDelta } from '../reputation/scorer';
import { query } from '../db/postgres';
import { shouldRotate, rotateToken } from '../token/rotation';
import { decodeDeviceToken } from '../token/generator';
import { logger } from '../utils/logger';
import type { ValidateResponse, TrustStatus, StepUpMethod } from '../models/device';

export const validateRouter = Router();

const ValidateSchema = z.object({
  user_id:            z.string().min(1),
  device_token:       z.string().min(1),
  device_fingerprint: z.string().min(1),
  ip_address:         z.string().default(''),
  sim_country:        z.string().optional(),
});

validateRouter.post('/', async (req: Request, res: Response) => {
  const parsed = ValidateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  const { user_id, device_token, device_fingerprint, ip_address, sim_country } = parsed.data;

  try {
    // ── 1. Token validation pipeline ─────────────────────────────────────────
    const tokenResult = await validateDeviceToken(device_token, device_fingerprint);

    if (!tokenResult.valid) {
      const status: TrustStatus =
        tokenResult.error === 'DEVICE_BLACKLISTED' ? 'suspicious_device' : 'new_device';
      const action: StepUpMethod = 'otp_verification';
      const riskDelta = tokenResult.error === 'DEVICE_BLACKLISTED' ? 80 : 55;

      res.status(200).json({
        device_status:    status,
        required_action:  action,
        risk_delta:       riskDelta,
        triggered_rules:  tokenResult.error === 'DEVICE_BLACKLISTED'
          ? ['RULE_016'] : ['RULE_015'],
        classification:   'unknown',
        validation_error: tokenResult.error ?? 'UNKNOWN_ERROR',
      } satisfies ValidateResponse & { validation_error: string });
      return;
    }

    // ── 2. Look up device_accounts trust status ───────────────────────────────
    const accountRows = await query<{ trust_status: string; device_id: string }>(
      `SELECT da.trust_status, d.id as device_id
       FROM device_accounts da
       JOIN devices d ON d.id = da.device_id
       WHERE d.device_fingerprint = $1 AND da.user_id = $2
       LIMIT 1`,
      [device_fingerprint, user_id],
    );

    if (accountRows.length === 0) {
      res.status(200).json({
        device_status:   'new_device',
        required_action: 'otp_verification',
        risk_delta:      55,
        triggered_rules: ['RULE_015'],
        classification:  'unknown',
      } satisfies ValidateResponse);
      return;
    }

    const { trust_status, device_id } = accountRows[0];

    // ── 3. Rapid device switching check ──────────────────────────────────────
    const rapidSwitch = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM device_accounts da
       JOIN devices d ON d.id = da.device_id
       WHERE da.user_id = $1
         AND d.id != $2
         AND da.last_seen_at > NOW() - INTERVAL '30 minutes'`,
      [user_id, device_id],
    );
    const isRapidSwitch = parseInt(rapidSwitch[0]?.count ?? '0', 10) > 0;

    // ── 4. Update last_seen_at ────────────────────────────────────────────────
    await Promise.all([
      query('UPDATE devices SET last_seen_at = NOW() WHERE id = $1', [device_id]),
      query(
        'UPDATE device_accounts SET last_seen_at = NOW() WHERE device_id = $1 AND user_id = $2',
        [device_id, user_id],
      ),
    ]);

    // ── 5. Compute risk delta ─────────────────────────────────────────────────
    const reputation = await computeReputation(device_fingerprint);
    let { risk_delta, triggered_rules } = computeRiskDelta(trust_status, reputation);

    if (isRapidSwitch) {
      risk_delta += 45;
      triggered_rules.push('RULE_020');
    }

    if (sim_country && reputation?.ip_history?.length) {
      const lastIpCountry = reputation.ip_history[0]?.country_code ?? '';
      if (lastIpCountry && sim_country.toUpperCase() !== lastIpCountry.toUpperCase()) {
        risk_delta += 35;
        triggered_rules.push('RULE_019');
      }
    }

    // ── 6. Token rotation (sliding window renewal) ────────────────────────────
    let rotatedToken: string | undefined;
    const decoded = decodeDeviceToken(device_token);
    if (decoded && shouldRotate(decoded.exp)) {
      try {
        rotatedToken = await rotateToken(device_token, user_id, device_id, device_fingerprint);
        logger.info('Token rotated on validate', { userId: user_id, deviceId: device_id });
      } catch {
        logger.warn('Token rotation failed — continuing without rotation', { userId: user_id });
      }
    }

    const response: ValidateResponse & { rotated_token?: string } = {
      device_status:   trust_status as TrustStatus,
      risk_delta,
      triggered_rules,
      classification:  reputation?.classification ?? 'unknown',
      ...(trust_status === 'new_device' ? { required_action: 'otp_verification' as StepUpMethod } : {}),
      ...(rotatedToken ? { rotated_token: rotatedToken } : {}),
    };

    res.status(200).json(response);
  } catch (err) {
    logger.error('Device validation error', { userId: user_id });
    res.status(500).json({ error: 'Internal server error' });
  }
});
