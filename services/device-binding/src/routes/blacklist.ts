/**
 * Blacklist management routes — analyst-only controls.
 *
 * POST   /device/blacklist/:fingerprint  — blacklist a device
 * DELETE /device/blacklist/:fingerprint  — remove from blacklist (whitelist)
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../db/postgres';
import { cacheBlacklist, clearBlacklist } from '../db/redis';

export const blacklistRouter = Router();

const BlacklistBodySchema = z.object({
  reason:       z.string().optional().default('manual analyst action'),
  fraud_case_id: z.string().optional(),
  analyst_id:   z.string().optional().default('unknown'),
});

/** POST /device/blacklist/:fingerprint */
blacklistRouter.post('/:fingerprint', async (req: Request, res: Response) => {
  const fingerprint = req.params['fingerprint'];
  if (!fingerprint) {
    res.status(400).json({ error: 'Missing device fingerprint' });
    return;
  }

  const parsed = BlacklistBodySchema.safeParse(req.body);
  const body = parsed.success ? parsed.data : { reason: 'manual analyst action', analyst_id: 'unknown', fraud_case_id: undefined };

  try {
    await withTransaction(async (client) => {
      // Insert into blacklist (ignore duplicate)
      await client.query(
        `INSERT INTO device_blacklist (id, device_fingerprint, reason, blacklisted_by, fraud_case_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (device_fingerprint) DO UPDATE SET
           reason = EXCLUDED.reason, blacklisted_by = EXCLUDED.blacklisted_by,
           fraud_case_id = EXCLUDED.fraud_case_id`,
        [uuidv4(), fingerprint, body.reason, body.analyst_id, body.fraud_case_id ?? null],
      );

      // Update device classification
      await client.query(
        `UPDATE devices SET classification = 'blacklisted', updated_at = NOW()
         WHERE device_fingerprint = $1`,
        [fingerprint],
      );

      // Mark all active tokens for this device as revoked
      await client.query(
        `UPDATE device_tokens dt SET revoked = TRUE, revoked_at = NOW()
         FROM devices d
         WHERE d.id = dt.device_id AND d.device_fingerprint = $1 AND dt.revoked = FALSE`,
        [fingerprint],
      );

      // Update all device_accounts to suspicious
      await client.query(
        `UPDATE device_accounts da SET trust_status = 'suspicious_device'
         FROM devices d WHERE d.id = da.device_id AND d.device_fingerprint = $1`,
        [fingerprint],
      );
    });

    // Populate Redis hot blacklist cache
    await cacheBlacklist(fingerprint);

    res.status(200).json({
      success:   true,
      action:    'blacklisted',
      device_fingerprint: fingerprint,
      message:   'Device blacklisted. All active tokens revoked. All associated accounts marked suspicious.',
    });
  } catch (err) {
    console.error('[blacklist POST] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /device/blacklist/:fingerprint — remove from blacklist */
blacklistRouter.delete('/:fingerprint', async (req: Request, res: Response) => {
  const fingerprint = req.params['fingerprint'];
  if (!fingerprint) {
    res.status(400).json({ error: 'Missing device fingerprint' });
    return;
  }

  try {
    const deleted = await query<{ device_fingerprint: string }>(
      `DELETE FROM device_blacklist WHERE device_fingerprint = $1 RETURNING device_fingerprint`,
      [fingerprint],
    );

    if (deleted.length === 0) {
      res.status(404).json({ error: 'Device not found in blacklist' });
      return;
    }

    // Update classification back to unknown
    await query(
      `UPDATE devices SET classification = 'unknown', updated_at = NOW()
       WHERE device_fingerprint = $1`,
      [fingerprint],
    );

    // Clear Redis blacklist cache
    await clearBlacklist(fingerprint);

    res.status(200).json({
      success: true,
      action:  'removed_from_blacklist',
      device_fingerprint: fingerprint,
    });
  } catch (err) {
    console.error('[blacklist DELETE] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
