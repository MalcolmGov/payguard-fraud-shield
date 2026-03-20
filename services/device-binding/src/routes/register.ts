/**
 * POST /device/register
 *
 * Called by the SDK after a successful user login.
 * Registers the device, issues a signed device token, and returns trust status.
 *
 * Flow:
 *  1. Validate request body
 *  2. Look up or create device record in DB
 *  3. Look up or create device_accounts record
 *  4. If new device for this user → status = "new_device" (step-up required)
 *  5. If known trusted device → status = "trusted"
 *  6. Issue JWT device token, store hash in DB + Redis cache
 *  7. Return token + status
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../db/postgres';
import { cacheToken } from '../db/redis';
import { generateFingerprint, hashToken } from '../fingerprint/hasher';
import { issueDeviceToken } from '../token/generator';
import { incrementVelocity } from '../db/redis';
import type { RegisterResponse, TrustStatus, StepUpMethod } from '../models/device';

export const registerRouter = Router();

const RegisterSchema = z.object({
  user_id: z.string().min(1),
  signals: z.object({
    device_model:      z.string().default(''),
    os_version:        z.string().default(''),
    screen_resolution: z.string().default(''),
    app_install_id:    z.string().min(1),
    sim_country:       z.string().default(''),
    carrier:           z.string().default(''),
    ip_address:        z.string().default(''),
    timezone:          z.string().default(''),
    locale:            z.string().default(''),
    is_rooted:         z.boolean().default(false),
    is_emulator:       z.boolean().default(false),
    is_jailbroken:     z.boolean().default(false),
    app_hash:          z.string().default(''),
  }),
});

registerRouter.post('/', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  const { user_id, signals } = parsed.data;
  const fingerprint = generateFingerprint(signals);

  try {
    const result = await withTransaction(async (client) => {
      // ── 1. Upsert device record ─────────────────────────────────────────
      const deviceUpsert = await client.query<{ id: string; classification: string }>(
        `INSERT INTO devices
           (id, device_fingerprint, device_model, os_version, sim_country, carrier,
            timezone, locale, is_rooted, is_emulator, is_jailbroken, ip_address, classification)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'unknown')
         ON CONFLICT (device_fingerprint) DO UPDATE
           SET last_seen_at = NOW(),
               ip_address   = EXCLUDED.ip_address,
               updated_at   = NOW()
         RETURNING id, classification`,
        [
          uuidv4(), fingerprint,
          signals.device_model, signals.os_version,
          signals.sim_country,  signals.carrier,
          signals.timezone,     signals.locale,
          signals.is_rooted,    signals.is_emulator,
          signals.is_jailbroken, signals.ip_address,
        ],
      );
      const device = deviceUpsert.rows[0];

      // ── 2. Check if this user-device pair already exists ─────────────────
      const existing = await client.query<{ trust_status: string }>(
        `SELECT trust_status FROM device_accounts
         WHERE device_id = $1 AND user_id = $2 LIMIT 1`,
        [device.id, user_id],
      );

      let trustStatus: TrustStatus = 'new_device';
      let isNewBinding = true;

      if (existing.rows.length > 0) {
        trustStatus = existing.rows[0].trust_status as TrustStatus;
        isNewBinding = false;
      } else {
        // New binding — insert device_accounts and increment velocity counter
        await client.query(
          `INSERT INTO device_accounts (id, device_id, user_id, trust_status)
           VALUES ($1, $2, $3, 'new_device')
           ON CONFLICT (device_id, user_id) DO NOTHING`,
          [uuidv4(), device.id, user_id],
        );
        await incrementVelocity(fingerprint);
      }

      // ── 3. Log IP history ────────────────────────────────────────────────
      await client.query(
        `INSERT INTO device_ip_history (id, device_id, ip_address, country_code)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), device.id, signals.ip_address, signals.sim_country],
      );

      // ── 4. Issue device token ────────────────────────────────────────────
      const rawToken  = issueDeviceToken(user_id, device.id, fingerprint);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 86_400_000);

      await client.query(
        `INSERT INTO device_tokens (id, device_id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), device.id, user_id, tokenHash, expiresAt],
      );

      // Cache token in Redis
      await cacheToken(tokenHash, { device_id: device.id, user_id });

      return { rawToken, trustStatus, deviceId: device.id, isNewBinding };
    });

    const required_action: StepUpMethod | undefined =
      result.trustStatus === 'new_device' ? 'otp_verification' : undefined;

    const response: RegisterResponse = {
      device_token:   result.rawToken,
      device_status:  result.trustStatus,
      device_id:      result.deviceId,
      ...(required_action ? { required_action } : {}),
    };

    res.status(201).json(response);
  } catch (err) {
    console.error('[register] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
