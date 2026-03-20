/**
 * Prometheus metrics for the PayGuard Device Binding Service.
 *
 * Exposes /metrics endpoint with:
 *  - device_registration_total    (new/existing/blacklisted)
 *  - device_validation_total      (trusted/new_device/suspicious)
 *  - otp_requests_total
 *  - otp_verification_total       (success/fail/expired/max_attempts)
 *  - device_binding_duration_ms   (register + validate latency)
 *  - blacklist_additions_total
 */
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
import { Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

export const metricsRegistry = new Registry();

// Collect Node.js default metrics (memory, event loop lag, GC)
collectDefaultMetrics({ register: metricsRegistry, prefix: 'dbs_' });

// ── Device registration outcomes ──────────────────────────────────────────────
export const deviceRegistrations = new Counter({
  name:       'device_registration_total',
  help:       'Device registration outcomes',
  labelNames: ['result'],   // new | existing | blacklisted
  registers:  [metricsRegistry],
});

// ── Device validation outcomes ────────────────────────────────────────────────
export const deviceValidations = new Counter({
  name:       'device_validation_total',
  help:       'Device validation outcomes by trust status',
  labelNames: ['status'],   // trusted | new_device | suspicious_device
  registers:  [metricsRegistry],
});

// ── OTP metrics ───────────────────────────────────────────────────────────────
export const otpRequests = new Counter({
  name:      'otp_requests_total',
  help:      'Total OTP step-up requests initiated',
  registers: [metricsRegistry],
});

export const otpVerifications = new Counter({
  name:       'otp_verification_total',
  help:       'OTP verification outcomes',
  labelNames: ['result'],   // success | invalid | expired | max_attempts
  registers:  [metricsRegistry],
});

// ── Blacklist ─────────────────────────────────────────────────────────────────
export const blacklistAdditions = new Counter({
  name:      'blacklist_additions_total',
  help:      'Total devices added to the blacklist',
  registers: [metricsRegistry],
});

// ── Latency histogram ─────────────────────────────────────────────────────────
export const deviceBindingDuration = new Histogram({
  name:       'device_binding_duration_ms',
  help:       'Latency of device binding operations in milliseconds',
  labelNames: ['operation'],   // register | validate
  buckets:    [1, 5, 10, 25, 50, 100, 250, 500],
  registers:  [metricsRegistry],
});

// ── Token rotations ───────────────────────────────────────────────────────────
export const tokenRotations = new Counter({
  name:      'token_rotation_total',
  help:      'Total device tokens rotated (sliding window renewal)',
  registers: [metricsRegistry],
});

// ── /metrics route ────────────────────────────────────────────────────────────
export const metricsRouter = ExpressRouter();

metricsRouter.get('/', async (_req: Request, res: Response) => {
  res.set('Content-Type', metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
});
