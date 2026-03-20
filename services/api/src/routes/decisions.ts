import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

export const decisionsRouter = Router();

const RISK_ENGINE_URL = process.env.RISK_ENGINE_URL || 'http://localhost:8000';

/**
 * GET /v1/decisions/:transactionId
 * Allows the mobile wallet app to poll for a previously scored decision.
 * Useful when the transaction was sent via /v1/signals (async path)
 * and the app wants to check the result after a short delay.
 */
decisionsRouter.get('/:transactionId', async (req: Request, res: Response) => {
  const { transactionId } = req.params;

  try {
    const response = await axios.get(
      `${RISK_ENGINE_URL}/decisions/${transactionId}`,
      { timeout: 2000 }
    );
    res.json(response.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      res.status(404).json({ error: 'Decision not found — may still be processing' });
    } else {
      logger.error('Error fetching decision', { transactionId, err });
      res.status(502).json({ error: 'Risk engine unavailable' });
    }
  }
});

/**
 * GET /v1/decisions
 * List recent decisions — used by the dashboard.
 * Supports optional query params: limit, risk_level, user_id
 */
decisionsRouter.get('/', async (req: Request, res: Response) => {
  const { limit = 50, risk_level, user_id } = req.query;

  try {
    const params = new URLSearchParams({
      limit: String(limit),
      ...(risk_level ? { risk_level: String(risk_level) } : {}),
      ...(user_id ? { user_id: String(user_id) } : {}),
    });

    const response = await axios.get(
      `${RISK_ENGINE_URL}/decisions?${params}`,
      { timeout: 3000 }
    );
    res.json(response.data);
  } catch {
    res.status(502).json({ error: 'Risk engine unavailable' });
  }
});
