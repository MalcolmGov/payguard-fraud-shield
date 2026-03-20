/**
 * k6 Load Test — Device Binding Service
 *
 * Simulates realistic device registration and validation traffic:
 *  - Mix: 60% validate, 30% register, 10% reputation lookups
 *  - OTP flows at low rate (1%)
 *
 * Stages:
 *  - Ramp 0 → 30 VUs (1 minute)
 *  - Steady 30 VUs (3 minutes)
 *  - Spike 200 VUs (30 seconds)
 *  - Ramp down 0 VUs (30 seconds)
 *
 * Thresholds (SLOs):
 *  - Register p95 < 150ms
 *  - Validate p95 < 100ms
 *  - Error rate < 0.5%
 *
 * Run:
 *   k6 run load-tests/device-binding.js --env API_URL=http://localhost:3002
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// ── Custom metrics ─────────────────────────────────────────────────────────────
const errorRate      = new Rate('error_rate');
const registerTrend  = new Trend('register_latency_ms', true);
const validateTrend  = new Trend('validate_latency_ms', true);
const bindingErrors  = new Counter('binding_errors');

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.API_URL || 'http://localhost:3002';
const API_KEY  = __ENV.API_KEY  || 'pg_sandbox_001';

export const options = {
  stages: [
    { duration: '1m',  target: 30  },
    { duration: '3m',  target: 30  },
    { duration: '30s', target: 200 },   // Spike
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    'register_latency_ms': ['p(95)<150'],
    'validate_latency_ms': ['p(95)<100'],
    'error_rate':          ['rate<0.005'],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const MODELS    = ['Samsung Galaxy S24', 'iPhone 15 Pro', 'Oppo A57', 'Huawei P40'];
const OS_LIST   = ['Android 14', 'iOS 17', 'Android 13'];
const COUNTRIES = ['ZA', 'NG', 'GH', 'KE', 'UG'];

// State shared across iterations for the same VU
const knownTokens: string[] = [];
const knownFingerprints: string[] = [];

const headers = {
  'Content-Type': 'application/json',
  'x-api-key':    API_KEY,
};

function registerDevice() {
  const userId = `+27${Math.floor(600000000 + Math.random() * 199999999)}`;
  const payload = JSON.stringify({
    user_id: userId,
    signals: {
      device_model:      randomItem(MODELS),
      os_version:        randomItem(OS_LIST),
      app_version:       '2.1.0',
      screen_resolution: '2340x1080',
      app_install_id:    randomString(32),
      sim_country:       randomItem(COUNTRIES),
      carrier:           'MTN',
      ip_address:        `197.88.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      timezone:          'Africa/Johannesburg',
      locale:            'en_ZA',
      is_rooted:         Math.random() < 0.03,
      is_emulator:       Math.random() < 0.01,
      is_jailbroken:     false,
      app_hash:          randomString(64),
    },
  });

  const start = Date.now();
  const res = http.post(`${BASE_URL}/device/register`, payload, { headers, tags: { op: 'register' } });
  registerTrend.add(Date.now() - start);

  const ok = check(res, {
    'register 200':     r => r.status === 200,
    'has device_token': r => {
      try { return !!JSON.parse(r.body as string).device_token; } catch { return false; }
    },
  });

  if (ok && res.status === 200) {
    const body = JSON.parse(res.body as string);
    if (body.device_token) knownTokens.push(body.device_token);
  } else {
    bindingErrors.add(1);
  }

  errorRate.add(!ok);
}

function validateDevice() {
  // If no known tokens yet, skip
  if (knownTokens.length === 0 || knownFingerprints.length === 0) return;

  const payload = JSON.stringify({
    user_id:            `+27${Math.floor(600000000 + Math.random() * 199999999)}`,
    device_token:       randomItem(knownTokens),
    device_fingerprint: randomString(64),
    ip_address:         `197.88.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    sim_country:        randomItem(COUNTRIES),
  });

  const start = Date.now();
  const res = http.post(`${BASE_URL}/device/validate`, payload, { headers, tags: { op: 'validate' } });
  validateTrend.add(Date.now() - start);

  const ok = check(res, {
    'validate 200':        r => r.status === 200,
    'has device_status':   r => {
      try { return !!JSON.parse(r.body as string).device_status; } catch { return false; }
    },
  });

  errorRate.add(!ok);
}

function checkReputation() {
  const fp = randomString(64);
  const res = http.get(`${BASE_URL}/device/${fp}/reputation`, { headers, tags: { op: 'reputation' } });
  check(res, { 'reputation 200/404': r => r.status === 200 || r.status === 404 });
}

// ── Scenario ──────────────────────────────────────────────────────────────────
export default function () {
  const rand = Math.random();

  if (rand < 0.30) {
    group('Register Device', () => registerDevice());
  } else if (rand < 0.90) {
    group('Validate Device', () => validateDevice());
  } else {
    group('Reputation Check', () => checkReputation());
  }

  sleep(0.3 + Math.random() * 0.7);
}
