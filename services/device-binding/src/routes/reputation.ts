/** GET /device/:fingerprint/reputation */
import { Router, Request, Response } from 'express';
import { computeReputation } from '../reputation/scorer';

export const reputationRouter = Router();

reputationRouter.get('/:fingerprint', async (req: Request, res: Response) => {
  const fingerprint = req.params['fingerprint'];
  if (!fingerprint) { res.status(400).json({ error: 'Missing fingerprint' }); return; }

  try {
    const reputation = await computeReputation(fingerprint);
    if (!reputation) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.status(200).json(reputation);
  } catch (err) {
    console.error('[reputation] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
