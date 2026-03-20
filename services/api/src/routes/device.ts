/**
 * /v1/device — Proxy routes in the Signal API
 *
 * Thin forwarding layer. The mobile SDK talks to the Signal API (port 3001)
 * as a single entry point. These routes proxy device binding calls to the
 * device-binding-service (port 3002) while adding audit logging.
 *
 * Routes:
 *   POST /v1/device/register  → device-binding-service POST /device/register
 *   POST /v1/device/validate  → device-binding-service POST /device/validate
 */
import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

export const deviceRouter = Router();

const DEVICE_BINDING_URL =
  process.env.DEVICE_BINDING_SERVICE_URL || 'http://localhost:3002';

async function proxyRequest(
  req: Request,
  res: Response,
  targetPath: string,
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  try {
    const upstream = await fetch(`${DEVICE_BINDING_URL}${targetPath}`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json() as unknown;
    logger.info(`[device-proxy] ${targetPath} → ${upstream.status}`, {
      user_id: (req.body as Record<string, unknown>)['user_id'],
    });
    res.status(upstream.status).json(data);
  } catch (err) {
    logger.error('[device-proxy] device-binding-service unreachable', { err, targetPath });
    res.status(503).json({ error: 'Device binding service unavailable' });
  }
}

/** POST /v1/device/register */
deviceRouter.post('/register', (req: Request, res: Response) => {
  void proxyRequest(req, res, '/device/register');
});

/** POST /v1/device/validate */
deviceRouter.post('/validate', (req: Request, res: Response) => {
  void proxyRequest(req, res, '/device/validate');
});
