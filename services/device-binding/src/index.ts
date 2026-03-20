import 'dotenv/config';
import { validateEnv } from './utils/env';

// Validate environment FIRST — crashes fast with clear errors if secrets missing
validateEnv();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { authMiddleware } from './middleware/auth';
import { registerRouter } from './routes/register';
import { validateRouter } from './routes/validate';
import { blacklistRouter } from './routes/blacklist';
import { reputationRouter } from './routes/reputation';
import { accountsRouter } from './routes/accounts';
import { stepUpRouter } from './routes/stepup';

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
app.use(express.json({ limit: '256kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Global limiter — generous, catches runaway clients
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// Registration limiter — tight, prevents account enumeration
const registerLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Registration rate limit exceeded — try again in 1 minute' },
  keyGenerator: (req) => req.ip + ':' + (req.headers['x-api-key'] || ''),
});

// Validation limiter — moderate hot-path throughput
const validateLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Validation rate limit exceeded' },
});

// OTP limiter — very tight, brute-force prevention
const otpLimiter = rateLimit({
  windowMs: 15 * 60_000,  // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'OTP rate limit exceeded — try again in 15 minutes' },
});

app.use(globalLimiter);

// ── Health check (no auth, no rate limit) ─────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'device-binding-service', version: '1.0.0' });
});

// ── Device binding routes ─────────────────────────────────────────────────────
app.use('/device/register',  registerLimiter,  authMiddleware, registerRouter);
app.use('/device/validate',  validateLimiter,  authMiddleware, validateRouter);
app.use('/device/step-up',   otpLimiter,       authMiddleware, stepUpRouter);
app.use('/device/blacklist', authMiddleware, blacklistRouter);
app.use('/device',           authMiddleware, reputationRouter);
app.use('/device',           authMiddleware, accountsRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { message: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Device Binding Service listening on port ${PORT}`, {
    env: process.env.NODE_ENV,
    smsProvider: process.env.SMS_PROVIDER || 'mock',
  });
});

export { app };
