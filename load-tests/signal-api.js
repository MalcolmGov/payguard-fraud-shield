/**
 * k6 Load Test — Signal API
 *
 * Simulates realistic SDK traffic patterns:
 *  - Steady-state: 50 virtual users for 2 minutes
 *  - Ramp-up: 0 → 200 VUs over 1 minute
 *  - Spike: 500 VUs for 30 seconds
 *  - Ramp-down: 200 → 0 over 30 seconds
 *
 * Thresholds (SLOs):
 *  - 95% of requests < 200ms
 *  - 99% of requests < 500ms
 *  - Error rate < 1%
 *
 * Run:
 *   k6 run load-tests/signal-api.js --env API_URL=https://api.fraudshield.swifter.io
 *   k6 run load-tests/signal-api.js --env API_URL=http://localhost:4000 -o cloud
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// ── Custom metrics ─────────────────────────────────────────────────────────────
const errorRate     = new Rate('error_rate');
const signalLatency = new Trend('signal_latency_ms', true);
const accepted      = new Counter('signals_accepted');
const rejected      = new Counter('signals_rejected');

// ── Configuration ─────────────────────────────────────────────────────────────
const BASE_URL = __ENV.API_URL || 'http://localhost:4000';
const API_KEY  = __ENV.API_KEY  || 'pg_sandbox_test_001';

export const options = {
  stages: [
    { duration: '30s', target: 10  },   // Warm up
    { duration:  '2m', target: 50  },   // Steady state
    { duration: '30s', target: 200 },   // Ramp up
    { duration:  '1m', target: 200 },   // Sustained load
    { duration: '30s', target: 500 },   // Traffic spike
    { duration: '30s', target: 200 },   // Spike recovery
    { duration: '30s', target: 0   },   // Ramp down
  ],
  thresholds: {
    'http_req_duration':        ['p(95)<200', 'p(99)<500'],
    'http_req_failed':          ['rate<0.01'],
    'error_rate':               ['rate<0.01'],
    'signal_latency_ms':        ['p(95)<200'],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const PHONES    = ['+27821234567', '+27831234567', '+27741234567', '+27669876543', '+27781234567'];
const MODELS    = ['Samsung Galaxy S24', 'iPhone 15 Pro', 'Huawei P40', 'Xiaomi Poco X5', 'Oppo A57'];
const OS_LIST   = ['Android 14', 'iOS 17', 'Android 13', 'Android 12'];
const AMOUNTS   = [50, 150, 500, 1000, 2500, 5000, 10000];

function generateSignal() {
  return {
    user_id:    randomItem(PHONES),
    session_id: randomString(32),
    timestamp:  Date.now(),
    transaction: {
      recipient_phone: randomItem(PHONES),
      amount:          randomItem(AMOUNTS),
      currency:        'ZAR',
    },
    device: {
      device_id:       randomString(16),
      manufacturer:    'Samsung',
      model:           randomItem(MODELS),
      os_version:      randomItem(OS_LIST),
      is_rooted:       Math.random() < 0.05,    // 5% rooted
      is_emulator:     Math.random() < 0.02,    // 2% emulator
      is_app_tampered: false,
      is_jailbroken:   false,
      is_simulator:    false,
    },
    network: {
      ip_address:      `197.88.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      is_vpn:          Math.random() < 0.08,    // 8% VPN
      is_proxy:        Math.random() < 0.03,
      connection_type: randomItem(['WIFI', 'LTE', '5G']),
    },
    behavioral: {
      session_duration_ms:       Math.floor(Math.random() * 120000),
      keystroke_count:           Math.floor(Math.random() * 50),
      avg_keystroke_interval_ms: Math.floor(80 + Math.random() * 200),
      paste_detected:            Math.random() < 0.15,   // 15% paste
      pasted_fields:             [],
      recipient_changed_count:   Math.floor(Math.random() * 3),
      transaction_creation_ms:   Math.floor(5000 + Math.random() * 60000),
      typing_speed_score:        Math.random(),
    },
    call: {
      is_on_active_call:     Math.random() < 0.10,  // 10% on active call (fraud signal)
      call_type:             'IDLE',
      is_caller_in_contacts: true,
    },
    recipient_in_contacts: Math.random() > 0.20,
  };
}

// ── Main scenario ──────────────────────────────────────────────────────────────
export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key':    API_KEY,
  };

  group('Signal Ingestion', () => {
    const payload = JSON.stringify(generateSignal());
    const start   = Date.now();

    const res = http.post(`${BASE_URL}/v1/signals`, payload, {
      headers,
      tags: { endpoint: 'signals' },
    });

    const latency = Date.now() - start;
    signalLatency.add(latency);

    const ok = check(res, {
      'status 202':              r => r.status === 202,
      'has payload_id':          r => JSON.parse(r.body as string)?.payload_id !== undefined,
      'latency < 200ms':         () => latency < 200,
    });

    if (res.status === 202) { accepted.add(1); }
    else                    { rejected.add(1); }

    errorRate.add(!ok);
    sleep(0.5 + Math.random());   // 0.5 – 1.5s think time
  });

  // Occasionally check health
  if (Math.random() < 0.05) {
    group('Health Check', () => {
      const res = http.get(`${BASE_URL}/health`, { tags: { endpoint: 'health' } });
      check(res, { 'health 200': r => r.status === 200 });
    });
  }
}

// ── Teardown: print summary ───────────────────────────────────────────────────
export function teardown() {
  console.log(`✅ Load test complete — accepted: ${accepted.name}, rejected: ${rejected.name}`);
}
