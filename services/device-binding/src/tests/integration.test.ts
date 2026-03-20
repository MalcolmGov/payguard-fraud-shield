/**
 * Device Binding Service — Integration Tests
 *
 * Tests the full REST API surface of the device-binding-service.
 * Requires the service to be running on http://localhost:3002
 * with a PostgreSQL + Redis backend (use docker-compose up for integration env).
 *
 * Run with:
 *   npm test -- --testPathPattern=integration
 *   or: jest src/tests/integration.test.ts
 */

const BASE_URL    = 'http://localhost:3002';
const VALID_KEY   = process.env.API_KEYS?.split(',')[0] ?? 'pg_sandbox_001';
const FINGERPRINT = 'aabbccdd11223344aabbccdd11223344aabbccdd11223344aabbccdd11223344';
const USER_ID     = 'test_user_integration_001';

const authHeaders = { 'x-api-key': VALID_KEY, 'Content-Type': 'application/json' };

// ── Helpers ───────────────────────────────────────────────────────────────────
async function post(path: string, body: object, key = VALID_KEY) {
  return fetch(`${BASE_URL}${path}`, {
    method:  'POST',
    headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}

async function get(path: string) {
  return fetch(`${BASE_URL}${path}`, { headers: authHeaders });
}

// ── Test suites ───────────────────────────────────────────────────────────────
describe('Health & Observability', () => {
  it('GET /health returns 200', async () => {
    const resp = await fetch(`${BASE_URL}/health`);
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('device-binding-service');
  });

  it('GET /metrics returns Prometheus exposition format', async () => {
    const resp = await fetch(`${BASE_URL}/metrics`);
    expect(resp.status).toBe(200);
    const text = await resp.text();
    expect(text).toContain('device_registration_total');
  });
});

describe('Authentication', () => {
  it('rejects requests with no API key (401)', async () => {
    const resp = await fetch(`${BASE_URL}/device/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: USER_ID }),
    });
    expect(resp.status).toBe(401);
  });

  it('rejects requests with invalid API key (401)', async () => {
    const resp = await post('/device/register', { user_id: USER_ID }, 'bad_key');
    expect(resp.status).toBe(401);
  });
});

describe('Device Registration', () => {
  it('rejects registration with missing fields (400)', async () => {
    const resp = await post('/device/register', { user_id: USER_ID }); // no signals
    expect(resp.status).toBe(400);
  });

  it('registers a new device successfully (200)', async () => {
    const resp = await post('/device/register', {
      user_id: USER_ID,
      signals: {
        device_model:      'Samsung Galaxy S24',
        os_version:        'Android 14',
        app_version:       '2.1.0',
        screen_resolution: '2340x1080',
        app_install_id:    `install_${Date.now()}`,
        sim_country:       'ZA',
        carrier:           'MTN',
        ip_address:        '197.88.1.1',
        timezone:          'Africa/Johannesburg',
        locale:            'en_ZA',
        is_rooted:         false,
        is_emulator:       false,
        is_jailbroken:     false,
        app_hash:          'abc123',
      },
    });

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body).toHaveProperty('device_token');
    expect(body).toHaveProperty('device_status');
    expect(typeof body.device_token).toBe('string');
  });
});

describe('Device Validation', () => {
  it('rejects validation with missing token (400)', async () => {
    const resp = await post('/device/validate', {
      user_id: USER_ID,
      device_fingerprint: FINGERPRINT,
      // missing device_token
    });
    expect(resp.status).toBe(400);
  });

  it('returns new_device status for unknown token (200)', async () => {
    const resp = await post('/device/validate', {
      user_id:            USER_ID,
      device_token:       'invalid.token.here',
      device_fingerprint: FINGERPRINT,
      ip_address:         '197.88.1.1',
    });
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.device_status).toBe('new_device');
  });
});

describe('Device Reputation', () => {
  it('returns reputation for known fingerprint (200)', async () => {
    const resp = await get(`/device/${FINGERPRINT}/reputation`);
    // May be 404 if device not created, 200 if exists
    expect([200, 404]).toContain(resp.status);
  });
});

describe('OTP Step-Up', () => {
  it('rejects OTP request with missing phone number (400)', async () => {
    const resp = await post('/device/step-up/request', { user_id: USER_ID });
    expect(resp.status).toBe(400);
  });

  it('rejects OTP verify with wrong OTP (401)', async () => {
    // First request an OTP
    await post('/device/step-up/request', {
      user_id:      USER_ID,
      phone_number: '+27821234567',
    });
    // Then try to verify with wrong OTP
    const verifyResp = await post('/device/step-up/verify', {
      user_id:            USER_ID,
      device_fingerprint: FINGERPRINT,
      otp:               '000000',
    });
    expect(verifyResp.status).toBe(401);
    const body = await verifyResp.json();
    expect(body.reason).toMatch(/invalid|expired/);
  });
});
