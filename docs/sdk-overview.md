# PayGuard SDK — Developer Overview

> **Version 1.1** — 20 Fraud Rules · <100ms Latency · AES-256 Encryption

---

## Overview

The PayGuard SDK provides banks, fintechs, PSPs, and digital financial institutions with real-time social engineering fraud detection. It collects device, behavioural, call-state, and network signals from the mobile app, sends them to the PayGuard Risk Engine for scoring, and returns an actionable `RiskDecision` in under 100ms.

### Architecture

```
┌─────────────────────┐      ┌────────────────────┐      ┌──────────────────┐
│   Mobile App        │      │   PayGuard API      │      │   Risk Engine    │
│   (SDK integrated)  │─────▶│   /v1/evaluate      │─────▶│   14 fraud rules │
│                     │◀─────│   /v1/signals       │◀─────│   graph analysis │
│   Signals:          │      │                     │      │                  │
│   • Device          │      │   Auth: Bearer      │      │   Response:      │
│   • Call state      │      │   Encryption: AES   │      │   • risk_score   │
│   • Behavioural     │      │   Latency: <100ms   │      │   • risk_level   │
│   • Network         │      │                     │      │   • action       │
└─────────────────────┘      └────────────────────┘      └──────────────────┘
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Signal** | A snapshot of device/behavioural/call data collected at transaction time |
| **RiskDecision** | Server response: score (0–100), level (LOW/MEDIUM/HIGH/CRITICAL), action |
| **OtpGuard** | Protects OTP screens from social engineering disclosure during calls |
| **Device Binding** | Ties a device to a user via Keychain/Keystore token for trust scoring |
| **Fail-Secure** | If the API is unreachable, the SDK applies local rules as a fallback |

### Environments

| Environment | Base URL | API Key Prefix |
|------------|----------|----------------|
| **Sandbox** | `https://sandbox.api.payguard.africa` | `pg_sandbox_` |
| **Production** | `https://api.payguard.africa` | `pg_live_` |

---

## Quick Start

Choose your platform:
- [Android Integration Guide →](./android-integration.md)
- [iOS Integration Guide →](./ios-integration.md)

---

## API Reference (Signal API)

### POST `/v1/evaluate` — Synchronous Risk Decision

Returns a risk score in <100ms. Use before executing a transaction.

```json
// Request
{
  "user_id": "user-123",
  "session_id": "sess-abc",
  "timestamp": 1710000000,
  "transaction": {
    "recipient_phone": "+27821234567",
    "amount": 500.00,
    "currency": "ZAR"
  },
  "device": {
    "device_id": "sha256-fingerprint",
    "manufacturer": "Samsung",
    "model": "Galaxy S24",
    "os_version": "14",
    "is_rooted": false,
    "is_emulator": false
  },
  "network": { "ip_address": "41.0.0.1", "is_vpn": false },
  "behavioral": { "transaction_creation_ms": 45000, "paste_detected": false },
  "call": { "is_on_active_call": true, "call_type": "INCOMING" },
  "recipient_in_contacts": false
}
```

```json
// Response
{
  "transaction_id": "txn-uuid",
  "risk_score": 85,
  "risk_level": "CRITICAL",
  "recommended_action": "BLOCK",
  "triggered_rules": ["RULE_001", "RULE_002", "RULE_005"],
  "warning_message": "🚨 STOP — High Fraud Risk Detected...",
  "score_breakdown": {
    "RULE_001": 75,
    "RULE_002": 40,
    "RULE_005": 35
  }
}
```

### POST `/v1/signals` — Async Signal Ingestion

Fire-and-forget signal ingestion. Returns `202 Accepted` immediately.

---

## Fraud Rules Reference

| Rule | Score | Trigger |
|------|-------|---------|
| **RULE_001** | +75 | Active call + unknown recipient + high amount (vishing pattern) |
| **RULE_002** | +40 | Active call + recipient not in contacts |
| **RULE_003** | +30 | Transaction created within 10 seconds of session start |
| **RULE_004** | +20 | Recipient phone number was pasted |
| **RULE_005** | +35 | First-time recipient + amount >2× user average |
| **RULE_006** | +50 | SIM swap detected |
| **RULE_007** | +60 | Device seen on 4+ accounts (fraud ring indicator) |
| **RULE_008** | +25 | Recent SMS contained fraud keywords |
| **RULE_009** | +20 | Rooted/jailbroken device |
| **RULE_010** | +15 | VPN or proxy active |
| **RULE_011** | +40 | Emulator/simulator detected |
| **RULE_012** | +25 | Recipient changed 3+ times in session |
| **RULE_013** | +50 | App tampering detected |
| **RULE_014** | +80 | OTP screen open during call with unknown number |

#### Enterprise Rules (Compliance, Network & Biometrics)

| Rule | Score | Trigger |
|------|------|---------|
| **RULE_021** | +35 | Geolocation anomaly — >500km from user's usual location |
| **RULE_022** | +45 | Velocity / structuring — rapid transactions or amounts below reporting threshold (FICA/CBN) |
| **RULE_023** | +55 | Beneficiary network risk — recipient flagged in multiple fraud reports (mule account) |
| **RULE_024** | +20 | Time-of-day anomaly — transaction during unusual hours (00:00–05:00) |
| **RULE_025** | +30 | Cooling-off period — first-time recipient above high-value threshold (APP fraud alignment) |
| **RULE_026** | +25 | Behavioural biometrics deviation — typing cadence, touch pressure, scroll velocity, navigation |

### Risk Levels

| Score Range | Level | Action | UX Recommendation |
|-------------|-------|--------|-------------------|
| 0–34 | LOW | APPROVE | Proceed normally |
| 35–64 | MEDIUM | SOFT_WARNING | Show informational warning, allow proceed |
| 65–84 | HIGH | WARN_USER | Show scam warning, require confirmation |
| 85–100 | CRITICAL | BLOCK | Block transaction, show full-screen alert |
