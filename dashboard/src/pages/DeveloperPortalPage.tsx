import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebNav, { WebFooter } from '../components/WebNav';
import TalkToSalesModal from '../components/TalkToSalesModal';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiKey { id: string; name: string; key: string; created: string; lastUsed: string; env: 'live'|'sandbox'; requests: number; }

// ── Static data ───────────────────────────────────────────────────────────────
const API_KEYS: ApiKey[] = [
  { id:'1', name:'mobile wallet Production',  key:'pg_live_a8b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0', created:'2026-01-15', lastUsed:'2026-03-12', env:'live',    requests:1423091 },
  { id:'2', name:'Sandbox Testing',      key:'pg_sandbox_demo_00001_test_key_99',  created:'2026-02-01', lastUsed:'2026-03-12', env:'sandbox', requests:3218 },
];

const ENDPOINTS = [
  {
    method:'POST', path:'/v1/evaluate', tag:'Core', summary:'Evaluate transaction risk',
    desc:'Submit a full signal payload for a payment session. Returns a risk score, enforcement action, and the list of fraud rules that fired. This is the primary endpoint called by the SDK on every send-money action.',
    auth: true,
    request: {
      headers: [
        { name:'Authorization', type:'string', required:true,  desc:'Bearer {API_KEY}' },
        { name:'Content-Type',  type:'string', required:true,  desc:'application/json' },
        { name:'X-Request-Id',  type:'string', required:false, desc:'Idempotency key (UUID). Prevents duplicate evaluations on retry.' },
      ],
      body: `{
  "session_id":            "string  — unique payment session ID (UUID)",
  "account_id":            "string  — customer's mobile wallet account ID",
  "timestamp":             "string  — ISO 8601 UTC (auto-set by SDK)",
  "signals": {
    "call_active":           "boolean — active phone call during session",
    "call_contact_known":    "boolean — calling number in contacts",
    "recipient_in_contacts": "boolean — send-to number in contacts",
    "paste_detected":        "boolean — recipient field populated via paste",
    "amount_zar":            "number  — transaction amount in ZAR",
    "session_age_ms":        "number  — ms since app was opened",
    "device_fingerprint":    "string  — SHA-256 of device identifiers",
    "sim_serial_changed":    "boolean — SIM serial differs from stored",
    "network_type":          "string  — WIFI | LTE | 3G | 2G",
    "is_rooted":             "boolean — device root/jailbreak detected",
    "vpn_active":            "boolean — VPN/proxy detected",
    "otp_screen_active":     "boolean — OTP entry screen in foreground",
    "sms_fraud_keyword":     "boolean — recent SMS matched fraud patterns",
    "new_device":            "boolean — device not seen before for account"
  }
}`,
      example: `{
  "session_id": "sess_7f3a2b1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "account_id": "27821000001",
  "timestamp": "2026-03-12T05:03:00Z",
  "signals": {
    "call_active": true,
    "call_contact_known": false,
    "recipient_in_contacts": false,
    "paste_detected": true,
    "amount_zar": 2500,
    "session_age_ms": 8200,
    "device_fingerprint": "a1b2c3d4e5f6...",
    "sim_serial_changed": false,
    "network_type": "LTE",
    "is_rooted": false,
    "vpn_active": false,
    "otp_screen_active": false,
    "sms_fraud_keyword": false,
    "new_device": false
  }
}`,
    },
    response: `{
  "session_id":  "sess_7f3a2b1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "risk_score":  97,
  "action":      "BLOCK",
  "threshold":   { "warn": 45, "block": 80 },
  "rules_fired": [
    { "rule_id": "RULE_001", "delta": 75, "reason": "Active call + unknown caller + new recipient" },
    { "rule_id": "RULE_004", "delta": 20, "reason": "Recipient field populated via paste" },
    { "rule_id": "RULE_003", "delta": 30, "reason": "Transaction < 10s of session start" }
  ],
  "latency_ms":    44,
  "request_id":    "req_abc123",
  "decision_at":   "2026-03-12T05:03:00.044Z",
  "sdk_version":   "1.0.0"
}`,
  },
  {
    method:'GET', path:'/v1/sessions/:id', tag:'Core', summary:'Get session detail',
    desc:'Retrieve the full audit record for a payment session — all signals received, all rules evaluated, the final decision, and wall-clock timing at each pipeline stage.',
    auth: true,
    request: {
      headers: [
        { name:'Authorization', type:'string', required:true, desc:'Bearer {API_KEY}' },
      ],
      body: null,
      example: null,
    },
    response: `{
  "session_id":    "sess_7f3a...",
  "account_id":    "27821000001",
  "risk_score":    97,
  "action":        "BLOCK",
  "signals":       { "...full signal snapshot..." },
  "rules_fired":   [ { "rule_id": "RULE_001", "delta": 75 } ],
  "pipeline": {
    "sdk_dispatch_ms":    8,
    "api_receive_ms":     18,
    "kafka_lag_ms":       6,
    "engine_eval_ms":     38,
    "total_ms":           70
  },
  "created_at":    "2026-03-12T05:03:00Z"
}`,
  },
  {
    method:'GET', path:'/v1/rules', tag:'Rules Engine', summary:'List all fraud rules',
    desc:'Returns all fraud rules configured for your tenant, including current weights, enabled state, and firing statistics over the last 30 days.',
    auth: true,
    request: { headers:[{ name:'Authorization', type:'string', required:true, desc:'Bearer {API_KEY}' }], body:null, example:null },
    response: `{
  "rules": [
    {
      "rule_id":      "RULE_001",
      "label":        "Active call + unknown caller + new recipient",
      "category":     "social_engineering",
      "delta":        75,
      "enabled":      true,
      "firing_rate_30d": 0.68,
      "last_modified": "2026-03-01T10:00:00Z"
    },
    { "rule_id": "RULE_002", "label": "Active call + caller not in contacts", "delta": 40, "enabled": true },
    { "...": "12 more rules" }
  ],
  "total": 14,
  "threshold": { "warn": 45, "block": 80 }
}`,
  },
  {
    method:'PUT', path:'/v1/rules/:id', tag:'Rules Engine', summary:'Update a rule weight',
    desc:'Adjust the delta (point contribution) of any rule, or toggle it on/off. Changes propagate to all risk engine instances within 5 seconds. No code deployment required.',
    auth: true,
    request: {
      headers:[{ name:'Authorization', type:'string', required:true, desc:'Bearer {API_KEY}' }],
      body:`{
  "delta":   55,        // number, 5–100 (points added to risk score when rule fires)
  "enabled": true       // boolean, optional — toggle rule on/off
}`,
      example:`{
  "delta": 55,
  "enabled": true
}`,
    },
    response:`{
  "rule_id":       "RULE_003",
  "delta":         55,
  "previous_delta": 30,
  "enabled":       true,
  "propagated_at": "2026-03-12T05:03:05Z",
  "propagation_ms": 4800
}`,
  },
  {
    method:'GET', path:'/v1/accounts/:id/risk', tag:'Accounts', summary:'Account risk profile',
    desc:'Returns aggregate risk metrics for an account: total transactions evaluated, blocked count, average risk score, top fired rules, and device history.',
    auth: true,
    request:{ headers:[{ name:'Authorization', type:'string', required:true, desc:'Bearer {API_KEY}' }], body:null, example:null },
    response:`{
  "account_id":          "27821000001",
  "total_evaluated":     142,
  "blocked":             3,
  "warned":              8,
  "avg_risk_score":      22.4,
  "top_rules": [
    { "rule_id": "RULE_002", "fires": 18 },
    { "rule_id": "RULE_004", "fires": 11 }
  ],
  "devices": [
    { "fingerprint": "a1b2...", "first_seen": "2025-08-01", "last_seen": "2026-03-12", "trusted": true }
  ]
}`,
  },
  {
    method:'POST', path:'/v1/accounts/:id/freeze', tag:'Accounts', summary:'Freeze account',
    desc:'Immediately freezes all outbound transactions for an account. Used by the analyst dashboard on SIM swap detection or fraud ring association. Requires freeze_accounts scope.',
    auth: true,
    request:{
      headers:[{ name:'Authorization', type:'string', required:true, desc:'Bearer {API_KEY}' }],
      body:`{ "reason": "string — analyst note (required)", "duration_hours": 24 }`,
      example:`{ "reason": "SIM swap detected — device not recognised", "duration_hours": 24 }`,
    },
    response:`{
  "account_id":  "27821000001",
  "frozen":      true,
  "frozen_at":   "2026-03-12T05:03:00Z",
  "expires_at":  "2026-03-13T05:03:00Z",
  "reason":      "SIM swap detected — device not recognised"
}`,
  },
  {
    method:'GET', path:'/v1/graph/entity/:id', tag:'Fraud Graph', summary:'Entity neighbors',
    desc:'Returns the direct neighbors of a given entity (account, device, IP, or wallet) in the fraud graph — relationships, edge weights, and last-seen timestamps.',
    auth: true,
    request:{ headers:[{ name:'Authorization', type:'string', required:true, desc:'Bearer {API_KEY}' }], body:null, example:null },
    response:`{
  "entity": { "id": "27821000001", "type": "account" },
  "neighbors": [
    { "id": "DEV_a1b2c3", "type": "device",  "relationship": "USED_BY",    "weight": 0.95 },
    { "id": "WALLET_x9y8", "type": "wallet", "relationship": "SENT_TO",    "weight": 0.72 },
    { "id": "IP_1.2.3.4",  "type": "ip",    "relationship": "CONNECTS_FROM","weight": 0.41 }
  ],
  "risk_cluster": "fraud_ring_007",
  "cluster_size": 14
}`,
  },
  {
    method:'POST', path:'/v1/webhooks', tag:'Webhooks', summary:'Register webhook',
    desc:'Subscribe to real-time fraud events. Your endpoint will receive a POST with the event payload within 200ms of a decision. Supports BLOCK, WARN_USER, ACCOUNT_FROZEN, and GRAPH_CLUSTER_DETECTED events.',
    auth: true,
    request:{
      headers:[{ name:'Authorization', type:'string', required:true, desc:'Bearer {API_KEY}' }],
      body:`{
  "url":    "string — HTTPS endpoint (required)",
  "events": ["BLOCK","WARN_USER","ACCOUNT_FROZEN","GRAPH_CLUSTER_DETECTED"],
  "secret": "string — HMAC-SHA256 signing secret (min 32 chars)"
}`,
      example:`{
  "url": "https://your-backend.mtn.com/payguard/events",
  "events": ["BLOCK", "ACCOUNT_FROZEN"],
  "secret": "wh_secret_min32charsecretkey_here"
}`,
    },
    response:`{
  "webhook_id":  "wh_abc123",
  "url":         "https://your-backend.mtn.com/payguard/events",
  "events":      ["BLOCK","ACCOUNT_FROZEN"],
  "created_at":  "2026-03-12T05:03:00Z",
  "signing_key": "whsec_a1b2c3d4..."
}`,
  },
  {
    method:'POST', path:'/v1/device/register', tag:'Device Trust', summary:'Register device binding',
    desc:'Called by the SDK on first launch or after reinstall. Generates a 64-byte SHA-256 fingerprint from 13 device signals, issues a JWT device token, and creates a binding between device and user account. Returns existing token if fingerprint already known.',
    auth: true,
    request: {
      headers: [
        { name:'x-api-key', type:'string', required:true, desc:'API key' },
        { name:'Content-Type', type:'string', required:true, desc:'application/json' },
      ],
      body: `{
  "user_id":  "string — phone number or UUID",
  "signals": {
    "device_model":      "string",
    "os_version":        "string",
    "app_version":       "string",
    "is_rooted":         "boolean",
    "is_emulator":       "boolean",
    "is_jailbroken":     "boolean",
    "sim_country":       "string (ISO 3166-1 alpha-2)",
    "ip_address":        "string (IPv4)"
  }
}`,
      example: `{
  "user_id": "+27821234567",
  "signals": {
    "device_model": "Samsung Galaxy S24",
    "os_version": "Android 14",
    "app_version": "2.1.0",
    "is_rooted": false,
    "is_emulator": false,
    "sim_country": "ZA"
  }
}`,
    },
    response: `{
  "device_token":   "eyJhbGciOiJSUzI1NiJ...",
  "device_status":  "new_device",
  "device_id":      "uuid-v4",
  "required_action": "otp_verification"
}`,
  },
  {
    method:'POST', path:'/v1/device/validate', tag:'Device Trust', summary:'Validate device on transaction',
    desc:'Called on every login and transaction. Validates JWT device token, checks fingerprint consistency, queries blacklist, and returns a risk delta (0–100) to feed into the Risk Engine. Returns rotated_token when sliding renewal window triggers.',
    auth: true,
    request: {
      headers: [{ name:'x-api-key', type:'string', required:true, desc:'API key' }],
      body: `{
  "user_id":            "string",
  "device_token":       "string (JWT)",
  "device_fingerprint": "string (SHA-256 hex, 64 chars)",
  "ip_address":         "string (IPv4)",
  "sim_country":        "string"
}`,
      example: `{
  "user_id": "+27821234567",
  "device_token": "eyJhbGciOiJSUzI...",
  "device_fingerprint": "a1b2c3d4e5f6...",
  "ip_address": "197.88.1.1",
  "sim_country": "ZA"
}`,
    },
    response: `{
  "device_status":   "trusted",
  "risk_delta":      12,
  "triggered_rules": [],
  "classification":  "known_device",
  "required_action": null,
  "rotated_token":   null
}`,
  },
  {
    method:'GET', path:'/v1/device/:fingerprint/reputation', tag:'Device Trust', summary:'Get device reputation',
    desc:'Returns the full reputation record for a device fingerprint — trust status, risk score, IP history, linked account count, root/emulator flags, and first/last seen timestamps.',
    auth: true,
    request: { headers:[{ name:'x-api-key', type:'string', required:true, desc:'API key' }], body:null, example:null },
    response: `{
  "fingerprint":     "a1b2c3d4e5f6...",
  "trust_status":    "trusted",
  "risk_score":      12,
  "is_rooted":       false,
  "is_emulator":     false,
  "linked_accounts": 1,
  "first_seen_at":   "2024-11-10T00:00:00Z",
  "last_seen_at":    "2026-03-12T11:00:00Z",
  "ip_history": [
    { "ip": "197.88.1.1", "country_code": "ZA", "seen_at": "2026-03-12T11:00:00Z" }
  ]
}`,
  },
  {
    method:'POST', path:'/v1/device/step-up/request', tag:'Step-Up Auth', summary:'Request OTP (SMS)',
    desc:'Initiates SMS OTP step-up for an unrecognised device. Sends a 6-digit code via Africa\'s Talking / Infobip. Rate limited: 5 req / 15 min per IP.',
    auth: true,
    request: {
      headers: [{ name:'x-api-key', type:'string', required:true, desc:'API key' }],
      body: `{\n  "user_id":      "+27821234567",\n  "phone_number": "+27821234567"\n}`,
      example: `{\n  "user_id": "+27821234567",\n  "phone_number": "+27821234567"\n}`,
    },
    response: `{\n  "status":     "otp_sent",\n  "channel":    "otp_sms",\n  "expires_at": 1710220980\n}`,
  },
  {
    method:'POST', path:'/v1/device/step-up/verify', tag:'Step-Up Auth', summary:'Verify OTP → trust device',
    desc:'Verifies the submitted OTP and promotes the device to trusted. Max 3 attempts before invalidation.',
    auth: true,
    request: {
      headers: [{ name:'x-api-key', type:'string', required:true, desc:'API key' }],
      body: `{\n  "user_id":            "+27821234567",\n  "device_fingerprint": "a1b2c3d4e5f6...",\n  "otp":                "483920"\n}`,
      example: `{\n  "user_id": "+27821234567",\n  "device_fingerprint": "a1b2c3d4e5f6...",\n  "otp": "483920"\n}`,
    },
    response: `{\n  "success":       true,\n  "channel":       "otp_sms",\n  "device_status": "trusted",\n  "message":       "Device verified and trusted."\n}`,
  },
  {
    method:'POST', path:'/v1/device/step-up/ussd/push', tag:'Step-Up Auth', summary:'Initiate USSD push authorisation',
    desc:'Triggers a USSD push to the subscriber\'s handset via MTN USSD Gateway or Africa\'s Talking. Subscriber presses 1 (Allow) or 2 (Deny) — no internet required. Works on any handset. Rate limited: 3 req / 15 min per IP.',
    auth: true,
    request: {
      headers: [{ name:'x-api-key', type:'string', required:true, desc:'API key' }],
      body: `{\n  "user_id":            "+27821234567",\n  "phone_number":       "+27821234567",\n  "device_fingerprint": "a1b2c3d4e5f6..."\n}`,
      example: `{\n  "user_id": "+27821234567",\n  "phone_number": "+27821234567",\n  "device_fingerprint": "a1b2c3d4e5f6..."\n}`,
    },
    response: `{\n  "session_id":  "ussd_1710220000_abc123",\n  "status":      "ussd_push_sent",\n  "expires_at":  1710220300,\n  "poll_url":    "/v1/device/step-up/ussd/status?session_id=ussd_1710220000_abc123"\n}`,
  },
  {
    method:'GET', path:'/v1/device/step-up/ussd/status', tag:'Step-Up Auth', summary:'Poll USSD push session',
    desc:'Poll every 3 seconds after initiating a USSD push. Returns pending until subscriber responds or session expires (5 min). On confirmed, device is automatically promoted to trusted.',
    auth: true,
    request: { headers:[{ name:'x-api-key', type:'string', required:true, desc:'API key' }], body:null, example:null },
    response: `{\n  "session_id":    "ussd_1710220000_abc123",\n  "status":        "confirmed",\n  "expires_at":    1710220300,\n  "device_status": "trusted"\n}`,
  },
  {
    method:'POST', path:'/v1/device/blacklist', tag:'Device Trust', summary:'Blacklist a device',
    desc:'Immediately blacklists a device fingerprint. All future validate calls return device_status: blacklisted and risk_delta: 100. Requires canBlacklist permission.',
    auth: true,
    request: {
      headers: [{ name:'x-api-key', type:'string', required:true, desc:'API key' }],
      body: `{\n  "fingerprint": "string — SHA-256 device fingerprint (64 hex chars)",\n  "reason":      "string — analyst note (required)"\n}`,
      example: `{\n  "fingerprint": "a1b2c3d4e5f6...",\n  "reason": "Confirmed fraud ring device — CASE-2847"\n}`,
    },
    response: `{\n  "fingerprint":    "a1b2c3d4e5f6...",\n  "blacklisted":    true,\n  "blacklisted_at": "2026-03-12T14:00:00Z",\n  "reason":         "Confirmed fraud ring device — CASE-2847"\n}`,
  },
];

const ERROR_CODES = [
  { code:400, id:'invalid_payload',      desc:'Request body is malformed or missing required fields. Check the field-level errors in the response.', example:'{ "error": "invalid_payload", "fields": { "signals.amount_zar": "required" } }' },
  { code:401, id:'unauthorized',         desc:'API key is missing, malformed, or revoked. Ensure Bearer token is correct and the key has not been rotated.', example:'{ "error": "unauthorized", "message": "Invalid API key" }' },
  { code:403, id:'insufficient_scope',   desc:'Your API key lacks the required scope for this operation. E.g. freeze_accounts is not enabled.', example:'{ "error": "insufficient_scope", "required": "freeze_accounts" }' },
  { code:404, id:'not_found',            desc:'The requested resource (session, account, rule) was not found.', example:'{ "error": "not_found", "resource": "session" }' },
  { code:409, id:'duplicate_request',    desc:'The X-Request-Id you provided was already processed. Return the original response from your cache.', example:'{ "error": "duplicate_request", "original_request_id": "req_abc" }' },
  { code:422, id:'rule_conflict',        desc:'Rule update would create an invalid state (e.g. sum of minimums > threshold). Adjust the delta and retry.', example:'{ "error": "rule_conflict", "detail": "Block threshold unreachable" }' },
  { code:429, id:'rate_limit_exceeded',  desc:'You have exceeded your rate limit. Wait for the retry-after period indicated in the response header.', example:'{ "error": "rate_limit_exceeded", "retry_after": 12 }' },
  { code:500, id:'internal_error',       desc:'A transient engine error. Safe to retry with backoff. If persistent, check our status page.', example:'{ "error": "internal_error", "request_id": "req_xyz" }' },
];

const RATE_LIMITS = [
  { tier:'Sandbox',     evaluate:'100/min',  read:'500/min',  write:'50/min',  burst:20 },
  { tier:'Starter',     evaluate:'500/min',  read:'2k/min',   write:'200/min', burst:100 },
  { tier:'Growth',      evaluate:'5k/min',   read:'20k/min',  write:'1k/min',  burst:500 },
  { tier:'Enterprise',  evaluate:'Unlimited',read:'Unlimited',write:'Unlimited',burst:9999 },
];

const CODE_SAMPLES: Record<string, string> = {
  'Kotlin': `// Kotlin (Android)
val sdk = PayGuardSDK.init(apiKey = "pg_live_...", env = Env.PRODUCTION)

sdk.evaluate(
    sessionId  = UUID.randomUUID().toString(),
    accountId  = currentUser.momoId,
    signals    = signalCollector.collect()
) { result ->
    when (result.action) {
        RiskAction.BLOCK     -> showBlockScreen(result.rulesFired)
        RiskAction.WARN_USER -> showScamWarning(result)
        RiskAction.ALLOW     -> proceedWithTransaction()
    }
}`,
  'Swift': `// Swift (iOS)
let sdk = PayGuardSDK.initialise(apiKey: "pg_live_...", environment: .production)

sdk.evaluate(
    sessionId: UUID().uuidString,
    accountId: currentUser.momoId,
    signals:   signalCollector.collect()
) { result in
    switch result.action {
    case .block:    showBlockScreen(result: result)
    case .warnUser: showScamWarning(result: result)
    case .allow:    proceedWithTransaction()
    }
}`,
  'cURL': `curl -X POST https://api.payguard.swifter.io/v1/evaluate \\
  -H "Authorization: Bearer pg_live_a8b2c4d6..." \\
  -H "Content-Type: application/json" \\
  -H "X-Request-Id: $(uuidgen)" \\
  -d '{
    "session_id": "sess_test_001",
    "account_id": "27821000001",
    "signals": {
      "call_active": true,
      "call_contact_known": false,
      "amount_zar": 2500,
      "paste_detected": true,
      "session_age_ms": 8200
    }
  }'`,
  'Python': `import requests, uuid

response = requests.post(
    "https://api.payguard.swifter.io/v1/evaluate",
    headers={
        "Authorization": "Bearer pg_live_a8b2c4d6...",
        "Content-Type":  "application/json",
        "X-Request-Id":  str(uuid.uuid4()),
    },
    json={
        "session_id": "sess_test_001",
        "account_id": "27821000001",
        "signals": {
            "call_active": True,
            "call_contact_known": False,
            "amount_zar": 2500,
            "paste_detected": True,
            "session_age_ms": 8200,
        }
    }
)

result = response.json()
print(f"Action: {result['action']}, Score: {result['risk_score']}")`,
  'Node.js': `const axios = require('axios');

const result = await axios.post(
  'https://api.payguard.swifter.io/v1/evaluate',
  {
    session_id: crypto.randomUUID(),
    account_id: '27821000001',
    signals: {
      call_active: true,
      call_contact_known: false,
      amount_zar: 2500,
      paste_detected: true,
      session_age_ms: 8200,
    }
  },
  {
    headers: {
      'Authorization': 'Bearer pg_live_a8b2c4d6...',
      'Content-Type':  'application/json',
      'X-Request-Id':  crypto.randomUUID(),
    }
  }
);

const { action, risk_score, rules_fired } = result.data;`,
};

const NAV_SECTIONS = [
  { id:'overview',       label:'Overview', icon:'🏠' },
  { id:'authentication', label:'Authentication', icon:'🔑' },
  { id:'api-keys',       label:'API Keys', icon:'🗝️' },
  { id:'quickstart',     label:'Quick Start', icon:'⚡' },
  { id:'sdk',            label:'SDK Reference', icon:'📱' },
  { id:'endpoints',      label:'API Reference', icon:'📡', badge: String(ENDPOINTS.length) },
  { id:'webhooks',       label:'Webhooks', icon:'🔔' },
  { id:'errors',         label:'Error Codes', icon:'⚠️' },
  { id:'rate-limits',    label:'Rate Limits', icon:'📊' },
  { id:'changelog',      label:'Changelog', icon:'📋' },
];

const METHOD_COLOR: Record<string,string> = { POST:'#10F5A0', GET:'#0EA5E9', PUT:'#F97316', DELETE:'#F85149', PATCH:'#BC8CFF' };

// ── Sub-components ────────────────────────────────────────────────────────────

function CopyButton({ text, style }: { text: string; style?: React.CSSProperties }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ background: copied ? 'rgba(16,245,160,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${copied ? 'rgba(16,245,160,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, color: copied ? '#10F5A0' : '#64748B', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter', ...style }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function CodeBox({ code, lang }: { code: string; lang?: string }) {
  return (
    <div style={{ position: 'relative', background: '#060A13', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
      {lang && <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{lang}</span>
        <CopyButton text={code} />
      </div>}
      <pre style={{ padding: '18px 20px', fontSize: 12.5, lineHeight: 1.9, color: '#8B949E', fontFamily: 'JetBrains Mono, monospace', overflowX: 'auto', whiteSpace: 'pre', margin: 0 }}>{code.trim()}</pre>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ paddingTop: 48, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <h2 className="w-heading" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 28, color: '#F0F6FF' }}>{title}</h2>
      {children}
    </section>
  );
}

function Chip({ label, color = '#0EA5E9' }: { label: string; color?: string }) {
  return <span style={{ fontSize: 10, fontWeight: 700, background: `${color}12`, border: `1px solid ${color}30`, color, borderRadius: 99, padding: '2px 8px', fontFamily: 'Inter', letterSpacing: '0.06em' }}>{label}</span>;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DeveloperPortalPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [activeEndpoint, setActiveEndpoint] = useState(0);
  const [codeLang, setCodeLang] = useState('Kotlin');
  const [showSales, setShowSales] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const ep = ENDPOINTS[activeEndpoint];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B1121', fontFamily: 'Inter, sans-serif', color: '#F0F6FF', overflowX: 'hidden' }}>
      <WebNav />

      {/* Hero */}
      <section className="mesh-bg" style={{ padding: '120px 48px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(16,245,160,0.07)', top: -80, left: '35%', '--orb-dur': '11s' } as React.CSSProperties} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
          <div className="section-label">Developer Portal</div>
          <h1 className="w-heading" style={{ fontSize: 54, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20 }}>
            <span className="grad-blue-green">Build Fraud Protection</span><br />
            <span style={{ color: '#F0F6FF' }}>in Under a Day.</span>
          </h1>
          <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.8, maxWidth: 480, margin: '0 auto 32px' }}>
            Full API reference, SDK guides, sandbox keys and interactive playground — everything you need to integrate PayGuard end-to-end.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="w-btn-primary" onClick={() => setShowSales(true)}>🤝 Talk to Sales</button>
            <button className="w-btn-secondary" onClick={() => navigate('/sandbox')}>Open Playground</button>
          </div>
          {showSales && <TalkToSalesModal onClose={() => setShowSales(false)} />}
        </div>
      </section>

      {/* Body: sidebar + content */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', maxWidth: 1400, margin: '0 auto', minHeight: '80vh' }}>

        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: 68, height: 'calc(100vh - 68px)', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '32px 0' }}>
          {NAV_SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 24px', background: activeSection === s.id ? 'rgba(14,165,233,0.08)' : 'none', borderLeft: activeSection === s.id ? '2px solid #0EA5E9' : '2px solid transparent', border: 'none', cursor: 'pointer', color: activeSection === s.id ? '#0EA5E9' : '#475569', fontSize: 13, fontWeight: activeSection === s.id ? 600 : 400, fontFamily: 'Inter', textAlign: 'left', transition: 'all 0.15s', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 14 }}>{s.icon}</span>{s.label}</span>
              {s.badge && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(14,165,233,0.15)', color: '#0EA5E9', borderRadius: 99, padding: '1px 7px' }}>{s.badge}</span>}
            </button>
          ))}
          <div style={{ margin: '24px 24px 0', padding: '16px', background: 'rgba(16,245,160,0.06)', border: '1px solid rgba(16,245,160,0.15)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10F5A0', marginBottom: 6 }}>Base URL</div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#64748B', wordBreak: 'break-all' }}>api.payguard<br />.swifter.io</div>
          </div>
          <div style={{ margin: '12px 24px 0', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>VERSION</div>
            <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#0EA5E9' }}>v1.0.0 · stable</div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ padding: '0 48px 80px', overflowY: 'auto' }}>

          {/* ── OVERVIEW ── */}
          <Section id="overview" title="Overview">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
              {[
                { icon:'⚡', label:'Decision Latency', value:'< 100ms', color:'#10F5A0' },
                { icon:'🔒', label:'Transport Layer', value:'TLS 1.3', color:'#0EA5E9' },
                { icon:'📊', label:'Fraud Rules', value:'35 built-in', color:'#7C3AED' },
              ].map(m => (
                <div key={m.label} style={{ padding: '20px', borderRadius: 14, background: `${m.color}08`, border: `1px solid ${m.color}25`, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{m.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.color, fontFamily: 'Outfit' }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.9 }}>
              The PayGuard API is a real-time risk engine accessible via a REST interface. It evaluates fraud signals from the SDK and returns an enforcement action — <code style={{ color: '#10F5A0', background: 'rgba(16,245,160,0.08)', padding: '1px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono' }}>ALLOW</code>, <code style={{ color: '#D29922', background: 'rgba(210,153,34,0.08)', padding: '1px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono' }}>WARN_USER</code>, or <code style={{ color: '#F85149', background: 'rgba(248,81,73,0.08)', padding: '1px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono' }}>BLOCK</code> — in under 100ms.
            </p>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.9, marginTop: 12 }}>
              All API responses follow a consistent envelope. Error responses always include a machine-readable <code style={{ fontFamily: 'JetBrains Mono', color: '#BC8CFF' }}>error</code> field and a human-readable <code style={{ fontFamily: 'JetBrains Mono', color: '#BC8CFF' }}>message</code> field.
            </p>
          </Section>

          {/* ── AUTHENTICATION ── */}
          <Section id="authentication" title="Authentication">
            <div style={{ padding: '16px 20px', borderRadius: 10, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', marginBottom: 24, fontSize: 13, color: '#64748B', lineHeight: 1.8 }}>
              All API requests use <strong style={{ color: '#F0F6FF' }}>Bearer token authentication</strong>. Include your API key in the <code style={{ fontFamily: 'JetBrains Mono', color: '#0EA5E9' }}>Authorization</code> header on every request.
            </div>
            <CodeBox code={`Authorization: Bearer pg_live_a8b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0`} lang="HTTP Header" />
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#E2E8F0' }}>Key Formats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { prefix:'pg_live_',    desc:'Production key — charges apply, used in your released app', color:'#10F5A0' },
                  { prefix:'pg_sandbox_', desc:'Sandbox key — no charges, simulated responses, rate limited', color:'#F97316' },
                ].map(k => (
                  <div key={k.prefix} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <code style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: k.color, background: `${k.color}10`, padding: '3px 10px', borderRadius: 6 }}>{k.prefix}</code>
                    <span style={{ fontSize: 13, color: '#64748B' }}>{k.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 24, padding: '14px 18px', borderRadius: 10, background: 'rgba(248,81,73,0.06)', border: '1px solid rgba(248,81,73,0.2)', fontSize: 13, color: '#64748B', lineHeight: 1.8 }}>
              🔒 <strong style={{ color: '#F0F6FF' }}>Never expose API keys client-side.</strong> Always call the PayGuard API from your backend, or use the SDK (which handles signing internally).
            </div>
          </Section>

          {/* ── API KEYS ── */}
          <Section id="api-keys" title="API Keys">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: '#64748B' }}>Manage your API credentials. Production keys are scoped — only enable permissions you need.</p>
              <button className="w-btn-primary" style={{ fontSize: 12, padding: '8px 18px' }}>+ Create New Key</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {API_KEYS.map(k => (
                <div key={k.id} style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: k.env === 'live' ? 'rgba(16,245,160,0.12)' : 'rgba(249,115,22,0.12)', border: `1px solid ${k.env === 'live' ? 'rgba(16,245,160,0.25)' : 'rgba(249,115,22,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {k.env === 'live' ? '🔑' : '🧪'}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F6FF' }}>{k.name}</div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Created {k.created} · Last used {k.lastUsed}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <Chip label={k.env === 'live' ? 'LIVE' : 'SANDBOX'} color={k.env === 'live' ? '#10F5A0' : '#F97316'} />
                      <span style={{ fontSize: 12, color: '#475569', fontFamily: 'JetBrains Mono' }}>{k.requests.toLocaleString()} reqs</span>
                    </div>
                  </div>
                  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <code style={{ flex: 1, fontSize: 12, fontFamily: 'JetBrains Mono', color: '#64748B', background: 'rgba(255,255,255,0.03)', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                      {showKey[k.id] ? k.key : `${k.key.slice(0, 18)}${'•'.repeat(24)}${k.key.slice(-4)}`}
                    </code>
                    <button onClick={() => setShowKey(p => ({ ...p, [k.id]: !p[k.id] }))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 7, padding: '7px 14px', fontSize: 12, color: '#64748B', cursor: 'pointer' }}>{showKey[k.id] ? 'Hide' : 'Reveal'}</button>
                    <CopyButton text={k.key} />
                    <button style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)', borderRadius: 7, padding: '7px 14px', fontSize: 12, color: '#F85149', cursor: 'pointer' }}>Revoke</button>
                  </div>
                  <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['evaluate', 'read_sessions', 'read_rules', ...(k.env === 'live' ? ['write_rules','freeze_accounts'] : [])].map(scope => (
                      <Chip key={scope} label={scope} color="#7C3AED" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── QUICKSTART ── */}
          <Section id="quickstart" title="Quick Start">
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 24 }}>
              {Object.keys(CODE_SAMPLES).map(lang => (
                <button key={lang} onClick={() => setCodeLang(lang)} style={{ padding: '10px 20px', border: 'none', borderBottom: codeLang === lang ? '2px solid #10F5A0' : '2px solid transparent', background: 'transparent', color: codeLang === lang ? '#10F5A0' : '#475569', fontSize: 13, fontWeight: codeLang === lang ? 600 : 400, cursor: 'pointer', fontFamily: 'Inter', marginBottom: -1 }}>
                  {lang}
                </button>
              ))}
            </div>
            <CodeBox code={CODE_SAMPLES[codeLang]} lang={codeLang} />
          </Section>

          {/* ── SDK META ── */}
          <Section id="sdk" title="SDK Reference">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                { name:'PayGuardSDK', kind:'class', color:'#0EA5E9', methods:['init(apiKey, env)','attachToPaymentFlow(ctx)','evaluate(signals, cb)','detach()','setLogLevel(level)'] },
                { name:'OtpGuard', kind:'class', color:'#10F5A0', methods:['activate()','deactivate()','isActive(): Boolean','setOverlayTheme(theme)','onOtpIntercepted(cb)'] },
                { name:'SignalCollector', kind:'interface', color:'#BC8CFF', methods:['collect(): SignalBundle','startListening()','stopListening()','setInterval(ms)'] },
                { name:'RiskDecision', kind:'data class', color:'#F97316', methods:['action: RiskAction','score: Int (0–100)','rulesFired: List<String>','latencyMs: Int','requestId: String'] },
              ].map(cls => (
                <div key={cls.name} style={{ borderRadius: 14, background: `${cls.color}07`, border: `1px solid ${cls.color}22`, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${cls.color}15`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Chip label={cls.kind} color={cls.color} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: cls.color, fontFamily: 'JetBrains Mono' }}>{cls.name}</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    {cls.methods.map(m => (
                      <div key={m} style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#BC8CFF', background: 'rgba(188,140,255,0.05)', borderRadius: 5, padding: '5px 10px', marginBottom: 5 }}>{m}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── API REFERENCE ── */}
          <Section id="endpoints" title="API Reference">
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
              {/* Endpoint list */}
              <div style={{ position: 'sticky', top: 88 }}>
                {['Core','Rules Engine','Accounts','Fraud Graph','Device Trust','Webhooks'].map(tag => (
                  <div key={tag}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#334155', textTransform: 'uppercase', padding: '10px 0 6px' }}>{tag}</div>
                    {ENDPOINTS.filter(e => e.tag === tag).map((e) => {
                      const globalIdx = ENDPOINTS.indexOf(e);
                      return (
                        <button key={e.path} onClick={() => setActiveEndpoint(globalIdx)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeEndpoint === globalIdx ? 'rgba(255,255,255,0.05)' : 'transparent', marginBottom: 3, textAlign: 'left' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: METHOD_COLOR[e.method] ?? '#64748B', fontFamily: 'JetBrains Mono', minWidth: 34 }}>{e.method}</span>
                          <span style={{ fontSize: 12, color: activeEndpoint === globalIdx ? '#F0F6FF' : '#64748B', fontFamily: 'JetBrains Mono' }}>{e.path}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Endpoint detail */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: METHOD_COLOR[ep.method], fontFamily: 'JetBrains Mono', background: `${METHOD_COLOR[ep.method]}12`, border: `1px solid ${METHOD_COLOR[ep.method]}30`, borderRadius: 6, padding: '4px 12px' }}>{ep.method}</span>
                  <code style={{ fontSize: 16, fontFamily: 'JetBrains Mono', color: '#E2E8F0' }}>{ep.path}</code>
                  {ep.auth && <Chip label="AUTH REQUIRED" color="#F97316" />}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: '#F0F6FF', fontFamily: 'Outfit' }}>{ep.summary}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.9, marginBottom: 24 }}>{ep.desc}</p>

                {/* Headers */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>REQUEST HEADERS</div>
                  <div style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '160px 80px 60px 1fr', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: '0.08em' }}>
                      <span>HEADER</span><span>TYPE</span><span>REQ</span><span>DESCRIPTION</span>
                    </div>
                    {ep.request.headers.map(h => (
                      <div key={h.name} style={{ display: 'grid', gridTemplateColumns: '160px 80px 60px 1fr', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, alignItems: 'center' }}>
                        <code style={{ fontFamily: 'JetBrains Mono', color: '#10F5A0' }}>{h.name}</code>
                        <span style={{ color: '#64748B' }}>{h.type}</span>
                        <span style={{ color: h.required ? '#F85149' : '#475569' }}>{h.required ? 'Yes' : 'No'}</span>
                        <span style={{ color: '#64748B' }}>{h.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Request body */}
                {ep.request.body && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>REQUEST BODY SCHEMA</div>
                    <CodeBox code={ep.request.body} lang="JSON Schema" />
                  </div>
                )}
                {ep.request.example && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>EXAMPLE REQUEST</div>
                    <CodeBox code={ep.request.example} lang="JSON" />
                  </div>
                )}

                {/* Response */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>EXAMPLE RESPONSE <span style={{ color: '#10F5A0', fontFamily: 'JetBrains Mono', fontSize: 11 }}>200 OK</span></div>
                  <CodeBox code={ep.response} lang="JSON" />
                </div>
              </div>
            </div>
          </Section>

          {/* ── WEBHOOKS ── */}
          <Section id="webhooks" title="Webhooks">
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.9, marginBottom: 20 }}>
              Subscribe to fraud events delivered in real-time (&lt;200ms) to your HTTPS endpoint. Payloads are signed with HMAC-SHA256 using your webhook secret.
            </p>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>VERIFY WEBHOOK SIGNATURE</div>
              <CodeBox code={`// Node.js — verify incoming webhook
const crypto = require('crypto');

function verifyWebhookSignature(payload, sigHeader, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(sigHeader),
    Buffer.from(\`sha256=\${expected}\`)
  );
}

// Express middleware
app.post('/payguard/events', express.raw({ type: '*/*' }), (req, res) => {
  const valid = verifyWebhookSignature(
    req.body,
    req.headers['x-payguard-signature'],
    process.env.WEBHOOK_SECRET
  );
  if (!valid) return res.status(401).send('Unauthorized');
  const event = JSON.parse(req.body);
  console.log('Fraud event:', event.type, event.data);
  res.status(200).send('OK');
});`} lang="Node.js" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['BLOCK','WARN_USER','ACCOUNT_FROZEN','GRAPH_CLUSTER_DETECTED'].map(evt => (
                <div key={evt} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <code style={{ fontFamily: 'JetBrains Mono', color: '#BC8CFF', fontSize: 12, minWidth: 200 }}>{evt}</code>
                  <span style={{ fontSize: 13, color: '#64748B' }}>{{ BLOCK:'Transaction blocked by risk engine', WARN_USER:'Risk score in WARN range — user shown scam warning', ACCOUNT_FROZEN:'Analyst froze account via dashboard or API', GRAPH_CLUSTER_DETECTED:'New fraud ring cluster identified in graph engine' }[evt]}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── ERRORS ── */}
          <Section id="errors" title="Error Codes">
            <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 180px 1fr', background: 'rgba(255,255,255,0.03)', padding: '10px 20px', fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: '0.08em' }}>
                <span>HTTP</span><span>ERROR CODE</span><span>DESCRIPTION</span>
              </div>
              {ERROR_CODES.map((e) => (
                <div key={e.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '70px 180px 1fr', padding: '14px 20px', alignItems: 'start', fontSize: 13 }}>
                    <span style={{ color: e.code >= 500 ? '#F85149' : e.code >= 400 ? '#D29922' : '#10F5A0', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{e.code}</span>
                    <code style={{ fontFamily: 'JetBrains Mono', color: '#BC8CFF', fontSize: 12 }}>{e.id}</code>
                    <span style={{ color: '#64748B', fontSize: 13 }}>{e.desc}</span>
                  </div>
                  <div style={{ padding: '0 20px 14px 270px' }}>
                    <CodeBox code={e.example} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── RATE LIMITS ── */}
          <Section id="rate-limits" title="Rate Limits">
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.9, marginBottom: 20 }}>
              Rate limits are applied per API key. When exceeded, the API returns HTTP 429 with a <code style={{ fontFamily: 'JetBrains Mono', color: '#D29922' }}>Retry-After</code> header in seconds. Use exponential backoff with jitter on retry.
            </p>
            <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 1fr 100px', background: 'rgba(255,255,255,0.03)', padding: '10px 20px', fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: '0.08em' }}>
                <span>TIER</span><span>/v1/evaluate</span><span>Read endpoints</span><span>Write endpoints</span><span>Burst</span>
              </div>
              {RATE_LIMITS.map((r) => (
                <div key={r.tier} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 1fr 100px', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 13, alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: r.tier === 'Enterprise' ? '#10F5A0' : '#F0F6FF' }}>{r.tier}</span>
                  <code style={{ fontFamily: 'JetBrains Mono', color: '#0EA5E9' }}>{r.evaluate}</code>
                  <code style={{ fontFamily: 'JetBrains Mono', color: '#64748B' }}>{r.read}</code>
                  <code style={{ fontFamily: 'JetBrains Mono', color: '#64748B' }}>{r.write}</code>
                  <code style={{ fontFamily: 'JetBrains Mono', color: '#BC8CFF' }}>{r.burst === 9999 ? 'Unlimited' : `${r.burst}/s`}</code>
                </div>
              ))}
            </div>
          </Section>

          {/* ── CHANGELOG ── */}
          <Section id="changelog" title="Changelog">
            {[
              { version:'v1.1.0', date:'March 2026', badge:'LATEST', color:'#06B6D4', changes:[
                'Device Trust & Binding API — /v1/device/register, /validate, /reputation, /step-up/*',
                'RULE_015–RULE_020 — 6 new device binding fraud rules live',
                'Token rotation — 6h sliding window, Redis revocation list',
                'Prometheus /metrics on all 3 backend services',
                'RBAC dashboard — admin / analyst / viewer with role badges',
                'OpenAPI 3.1 specs for Signal API and Device Binding Service',
                'iOS PrivacyInfo.xcprivacy — Apple App Store compliant (5 required-reason API categories)',
                'k6 load tests for Signal API (500 VU spike) and Device Binding (200 VU spike)',
              ]},
              { version:'v1.0.0', date:'March 2026', badge:'STABLE', color:'#10F5A0', changes:['Initial GA release — all 35 fraud rules active','OtpGuard module launched (RULE_014)','Fraud Graph API (Neo4j) — /v1/graph endpoints','Webhook support for BLOCK, WARN_USER, ACCOUNT_FROZEN, GRAPH_CLUSTER_DETECTED','Live rule tuning via PUT /v1/rules/:id — propagation < 5s'] },
              { version:'v0.9.0-beta', date:'January 2026', badge:'BETA', color:'#D29922', changes:['SIM Swap Defender (RULE_006, RULE_011) added','Account freeze API endpoint added','Rate limiting enforced on all sandbox keys','TLS 1.3 enforced — TLS 1.2 deprecated'] },
              { version:'v0.5.0-alpha', date:'September 2024', badge:'ALPHA', color:'#BC8CFF', changes:['Alpha SDK: Android (Kotlin) + iOS (Swift)','First 14 fraud rules live','Signal API (Node.js + Kafka) operational','Risk Engine (Python/FastAPI) live'] },
            ].map(v => (
              <div key={v.version} style={{ display: 'flex', gap: 24, marginBottom: 32, paddingLeft: 24, borderLeft: `2px solid ${v.color}33`, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -6, top: 4, width: 10, height: 10, borderRadius: '50%', background: v.color, boxShadow: `0 0 10px ${v.color}` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#F0F6FF', fontFamily: 'Outfit' }}>{v.version}</span>
                    <Chip label={v.badge} color={v.color} />
                    <span style={{ fontSize: 12, color: '#334155' }}>{v.date}</span>
                  </div>
                  <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {v.changes.map(c => <li key={c} style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>{c}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </Section>

        </main>
      </div>
      <WebFooter />
    </div>
  );
}
