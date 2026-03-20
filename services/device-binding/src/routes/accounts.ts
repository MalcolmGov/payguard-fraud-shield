/** GET /device/:fingerprint/accounts — all user accounts linked to a device (for graph/analyst) */
import { Router, Request, Response } from 'express';
import { query } from '../db/postgres';

export const accountsRouter = Router();

accountsRouter.get('/:fingerprint/accounts', async (req: Request, res: Response) => {
  const fingerprint = req.params['fingerprint'];
  if (!fingerprint) { res.status(400).json({ error: 'Missing fingerprint' }); return; }

  try {
    const rows = await query<{
      user_id: string; trust_status: string;
      first_seen_at: string; last_seen_at: string;
    }>(
      `SELECT da.user_id, da.trust_status, da.first_seen_at, da.last_seen_at
       FROM device_accounts da
       JOIN devices d ON d.id = da.device_id
       WHERE d.device_fingerprint = $1
       ORDER BY da.last_seen_at DESC`,
      [fingerprint],
    );

    res.status(200).json({ device_fingerprint: fingerprint, accounts: rows, count: rows.length });
  } catch (err) {
    console.error('[accounts] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
