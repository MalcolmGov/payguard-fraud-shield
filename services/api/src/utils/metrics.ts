/**
 * Prometheus metrics for fraud-shield-api (Signal API)
 *
 * Exposes /metrics endpoint with:
 *  - http_request_duration_ms (p50, p95, p99)
 *  - http_requests_total (by route + status)
 *  - signal_ingestion_total (accepted signals by user)
 *  - kafka_publish_errors_total
 *  - risk_score_histogram (score distribution)
 */
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
import { Router, Request, Response, NextFunction } from 'express';

export const metricsRegistry = new Registry();

// ── Default Node.js metrics (memory, event loop, GC) ─────────────────────────
collectDefaultMetrics({ register: metricsRegistry });

// ── HTTP request duration ─────────────────────────────────────────────────────
export const httpRequestDuration = new Histogram({
  name:    'http_request_duration_ms',
  help:    'HTTP request latency in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
  registers: [metricsRegistry],
});

// ── HTTP totals ───────────────────────────────────────────────────────────────
export const httpRequestsTotal = new Counter({
  name:    'http_requests_total',
  help:    'Total HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

// ── Signal ingestion ──────────────────────────────────────────────────────────
export const signalIngestionTotal = new Counter({
  name:    'signal_ingestion_total',
  help:    'Total fraud signals accepted',
  labelNames: ['result'],
  registers: [metricsRegistry],
});

// ── Kafka errors ──────────────────────────────────────────────────────────────
export const kafkaPublishErrors = new Counter({
  name:    'kafka_publish_errors_total',
  help:    'Total Kafka publish failures',
  registers: [metricsRegistry],
});

// ── Risk score distribution ───────────────────────────────────────────────────
export const riskScoreHistogram = new Histogram({
  name:    'risk_score_distribution',
  help:    'Distribution of fraud risk scores returned by the risk engine',
  buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  registers: [metricsRegistry],
});

// ── Rate limit hits ───────────────────────────────────────────────────────────
export const rateLimitHits = new Counter({
  name:    'rate_limit_hits_total',
  help:    'Total requests rejected by rate limiter',
  labelNames: ['route'],
  registers: [metricsRegistry],
});

// ── Middleware: record duration + totals on every request ─────────────────────
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const route      = req.route?.path ?? req.path ?? 'unknown';
    const statusCode = String(res.statusCode);
    const duration   = Date.now() - start;
    httpRequestDuration.observe({ method: req.method, route, status_code: statusCode }, duration);
    httpRequestsTotal.inc({    method: req.method, route, status_code: statusCode });
  });
  next();
}

// ── /metrics route ────────────────────────────────────────────────────────────
export const metricsRouter = Router();

metricsRouter.get('/', async (_req: Request, res: Response) => {
  res.set('Content-Type', metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
});
