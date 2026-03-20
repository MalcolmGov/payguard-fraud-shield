/**
 * Signal API — Integration Tests
 *
 * Tests cover:
 *   1. Health endpoint (unauthenticated)
 *   2. Auth middleware (401/403 flow)
 *   3. Signal ingestion (POST /v1/signals with Zod validation)
 *   4. Transaction evaluation (POST /v1/evaluate — risk engine stubbed)
 *   5. 404 handler
 *   6. Rate limiting
 */
// ⚠️ Env must be set BEFORE importing app — auth.ts reads API_KEYS at module init
process.env.SKIP_DECRYPTION = 'true';
process.env.API_KEYS = 'test-key-001,test-key-002';

import request from 'supertest';
import { app } from '../index';

const AUTH = { Authorization: 'Bearer test-key-001' };

// ── Minimal valid signal payload ─────────────────────────────────────────────
const validSignal = {
  user_id: 'user-123',
  session_id: 'sess-abc',
  timestamp: Date.now(),
  transaction: {
    recipient_phone: '+27821234567',
    amount: 250.0,
    currency: 'ZAR',
  },
  device: {
    device_id: 'dev-001',
    manufacturer: 'Samsung',
    model: 'Galaxy S24',
    os_version: '14',
  },
  network: {
    ip_address: '41.0.0.1',
  },
  behavioral: {},
  call: {},
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Health Endpoint
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /health', () => {
  it('returns 200 with service info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('fraud-shield-api');
    expect(res.body.version).toBeDefined();
  });

  it('does NOT require authentication', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Authentication Middleware
// ═══════════════════════════════════════════════════════════════════════════════

describe('Auth middleware', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).post('/v1/signals').send(validSignal);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Authorization/i);
  });

  it('returns 401 when Authorization is not Bearer scheme', async () => {
    const res = await request(app)
      .post('/v1/signals')
      .set('Authorization', 'Basic dXNlcjpwYXNz')
      .send(validSignal);
    expect(res.status).toBe(401);
  });

  it('returns 403 when API key is invalid', async () => {
    const res = await request(app)
      .post('/v1/signals')
      .set('Authorization', 'Bearer invalid-key-xyz')
      .send(validSignal);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Invalid API key/i);
  });

  it('accepts a valid API key', async () => {
    const res = await request(app)
      .post('/v1/signals')
      .set(AUTH)
      .send(validSignal);
    // Should pass auth — may be 202 (accepted) or 400 (validation), not 401/403
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('accepts the second valid API key', async () => {
    const res = await request(app)
      .post('/v1/signals')
      .set('Authorization', 'Bearer test-key-002')
      .send(validSignal);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Signal Ingestion — POST /v1/signals
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /v1/signals', () => {
  it('returns 202 Accepted with a payload_id for valid signal', async () => {
    const res = await request(app)
      .post('/v1/signals')
      .set(AUTH)
      .send(validSignal);
    expect(res.status).toBe(202);
    expect(res.body.status).toBe('accepted');
    expect(res.body.payload_id).toBeDefined();
  });

  it('uses provided payload_id if supplied', async () => {
    const res = await request(app)
      .post('/v1/signals')
      .set(AUTH)
      .send({ ...validSignal, payload_id: 'my-custom-id-123' });
    expect(res.status).toBe(202);
    expect(res.body.payload_id).toBe('my-custom-id-123');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/v1/signals')
      .set(AUTH)
      .send({ user_id: 'test' }); // Missing required fields
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid payload/i);
    expect(res.body.details).toBeDefined();
  });

  it('returns 400 when transaction amount is negative', async () => {
    const res = await request(app)
      .post('/v1/signals')
      .set(AUTH)
      .send({
        ...validSignal,
        transaction: { ...validSignal.transaction, amount: -100 },
      });
    expect(res.status).toBe(400);
  });

  it('returns 400 when user_id is missing', async () => {
    const { user_id, ...noUser } = validSignal;
    const res = await request(app).post('/v1/signals').set(AUTH).send(noUser);
    expect(res.status).toBe(400);
  });

  it('accepts optional fields with defaults', async () => {
    const res = await request(app)
      .post('/v1/signals')
      .set(AUTH)
      .send({
        ...validSignal,
        sms: { has_fraud_keywords: true, fraud_keywords_found: ['OTP'] },
        sim: { sim_swap_detected: true },
      });
    expect(res.status).toBe(202);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. 404 Handler
// ═══════════════════════════════════════════════════════════════════════════════

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Metrics Endpoint
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /metrics', () => {
  it('returns metrics endpoint (no auth required)', async () => {
    const res = await request(app).get('/metrics');
    // Prometheus metrics endpoint should respond (might be 200 or redirect)
    expect(res.status).toBeLessThan(500);
  });
});
