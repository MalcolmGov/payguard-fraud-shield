import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import { decryptMiddleware } from '../middleware/decrypt';

export const transactionsRouter = Router();

const RISK_ENGINE_URL = process.env.RISK_ENGINE_URL || 'http://localhost:8000';
const SCORE_TIMEOUT_MS = 95; // Stay within 100ms total budget

/**
 * POST /v1/evaluate
 * Synchronous evaluation endpoint — used when the mobile wallet app needs a
 * risk decision BEFORE allowing the transaction to proceed.
 * Calls the Python risk engine and returns within the 100ms latency budget.
 */
transactionsRouter.post('/', decryptMiddleware, async (req: Request, res: Response) => {
  const startMs = Date.now();

  try {
    const response = await axios.post(
      `${RISK_ENGINE_URL}/score`,
      req.body,
      {
        timeout: SCORE_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const elapsed = Date.now() - startMs;
    logger.info('Transaction evaluated', {
      user_id: req.body.user_id,
      risk_score: response.data.risk_score,
      action: response.data.recommended_action,
      elapsed_ms: elapsed,
    });

    res.json(response.data);
  } catch (err: unknown) {
    const elapsed = Date.now() - startMs;

    if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
      // Risk engine timed out — fail open (don't block the transaction)
      logger.error('Risk engine timeout — failing open', { elapsed_ms: elapsed });
      res.status(200).json({
        risk_score: 0,
        risk_level: 'LOW',
        recommended_action: 'APPROVE',
        triggered_rules: [],
        score_breakdown: {},
        warning_message: null,
        timeout: true,
      });
    } else {
      logger.error('Risk engine error', { err });
      res.status(502).json({ error: 'Risk engine unavailable' });
    }
  }
});
