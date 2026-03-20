import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import { logger } from './utils/logger';
import { metricsMiddleware, metricsRouter } from './utils/metrics';
import { signalsRouter } from './routes/signals';
import { transactionsRouter } from './routes/transactions';
import { decisionsRouter } from './routes/decisions';
import { deviceRouter } from './routes/device';
import { adminRouter } from './routes/admin';
import { invoiceRouter } from './routes/invoices';
import { authMiddleware } from './middleware/auth';
import { initKafka } from './kafka/producer';
import { initDatabase } from './db/postgres';

// ── Crash guards — prevent silent process death ─────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION — keeping server alive', { error: err.message, stack: err.stack });
});
process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION — keeping server alive', { reason: String(reason) });
});

const app = express();
const PORT = process.env.PORT || 4000;

// Trust Railway reverse proxy (fixes ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from any origin (dashboard, SDK clients, etc.)
    callback(null, true);
  },
  credentials: true,
}));

// Rate limiting — 200 req/min per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded' },
  validate: { xForwardedForHeader: false },
}));

app.use(express.json({ limit: '1mb' }));
app.use(metricsMiddleware);

// Health check + metrics (no auth)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fraud-shield-api', version: '1.0.1', uptime: process.uptime() });
});
app.use('/metrics', metricsRouter);

// API routes (auth required)
app.use('/v1/signals', authMiddleware, signalsRouter);
app.use('/v1/evaluate', authMiddleware, transactionsRouter);
app.use('/v1/decisions', authMiddleware, decisionsRouter);
app.use('/v1/admin/invoices', authMiddleware, invoiceRouter);
app.use('/v1/admin', authMiddleware, adminRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

async function main() {
  try {
    await initDatabase();
  } catch (err) {
    logger.error('PostgreSQL connection failed — retrying in 5s', { err });
    await new Promise(r => setTimeout(r, 5000));
    await initDatabase();
  }

  try {
    await initKafka();
    logger.info('Kafka producer initialized');
  } catch (err) {
    logger.warn('Kafka unavailable — running in offline mode', { err });
  }

  app.listen(PORT, () => {
    logger.info(`Fraud Shield API v1.0.1 listening on port ${PORT}`);
  });
}

main().catch((err) => {
  logger.error('FATAL: Server failed to start', { error: err.message });
  process.exit(1);
});

export { app };
