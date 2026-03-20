# Swifter Fraud Shield — API Reference

## Base URL

```
https://api.fraudshield.swifter.io/v1
```

All requests require the header `X-API-Key: <your-api-key>`.

---

## Authentication

API keys are provisioned per MoMo integration. Include in every request:

```http
X-API-Key: fs_live_abc123...
```

---

## Endpoints

### POST /v1/signals

Ingests an encrypted fraud signal payload from the mobile SDK.

**Request Body**

```json
{
  "payload": "<AES-256-GCM encrypted base64 string>",
  "iv": "<initialization vector, base64>",
  "sdk_version": "1.0.0"
}
```

**Response — 202 Accepted**

```json
{
  "signal_id": "sig_01HZ...",
  "status": "queued"
}
```

---

### POST /v1/evaluate

Synchronous risk evaluation. Returns a `RiskDecision` within 100ms.

**Request Body**

```json
{
  "user_id": "+27821000001",
  "recipient_wallet": "+27821000010",
  "amount": 2500.00,
  "signals": {
    "device_fingerprint": "a3f4d...",
    "build_fingerprint": "samsung/SM-A546B",
    "is_rooted": false,
    "is_emulator": false,
    "on_call": true,
    "call_duration_s": 95,
    "unknown_caller": true,
    "new_recipient": true,
    "recipient_not_in_contacts": true,
    "session_elapsed_s": 8,
    "paste_detected": false,
    "sim_swapped_last_48h": false,
    "sms_fraud_keywords": [],
    "vpn_active": false,
    "ip_address": "196.25.1.82",
    "associated_accounts": []
  }
}
```

**Response — 200 OK**

```json
{
  "transaction_id": "tx_01HZ...",
  "risk_score": 85,
  "risk_level": "HIGH",
  "recommended_action": "BLOCK",
  "triggered_rules": ["RULE_001", "RULE_002"],
  "latency_ms": 42
}
```

**Risk Levels**

| Level  | Score Range | Recommended Action |
|--------|-------------|-------------------|
| LOW    | 0 – 44      | ALLOW             |
| MEDIUM | 45 – 79     | WARN_USER         |
| HIGH   | 80 – 100    | BLOCK             |

---

### GET /v1/decisions/:transactionId

Polls the decision for a previously submitted transaction.

**Response — 200 OK**

```json
{
  "transaction_id": "tx_01HZ...",
  "risk_score": 85,
  "risk_level": "HIGH",
  "recommended_action": "BLOCK",
  "triggered_rules": ["RULE_001", "RULE_002"],
  "created_at": "2025-03-12T03:22:00Z"
}
```

**Response — 404 Not Found**

```json
{ "error": "Transaction not found" }
```

---

## Fraud Rules Reference

| Rule ID  | Description                                          | Score Delta |
|----------|------------------------------------------------------|-------------|
| RULE_001 | On call + new recipient + high amount               | +75         |
| RULE_002 | On call + recipient not in contacts                 | +40         |
| RULE_003 | Transaction initiated < 10s of session start        | +30         |
| RULE_004 | Copy/paste of recipient number                      | +20         |
| RULE_005 | New recipient + amount > 2× user average            | +35         |
| RULE_006 | SIM swap detected in last 48h                       | +50         |
| RULE_007 | Device linked to > 3 distinct accounts              | +60         |
| RULE_008 | Recent SMS contains fraud keywords                  | +25         |
| RULE_009 | Rooted / jailbroken device                          | +20         |
| RULE_010 | VPN or proxy active                                 | +15         |

Score is capped at 100. All active rules are summed.

---

## SDK Integration

### Android (Kotlin)

```kotlin
// In Application.onCreate()
FraudShieldSDK.initialize(
    context = applicationContext,
    apiKey = "fs_live_abc123",
    userId = currentUser.phone,
    apiBaseUrl = "https://api.fraudshield.swifter.io"
)

// Before money transfer — synchronous evaluation
val decision = FraudSignalDispatcher(context).evaluate(
    RiskPayloadBuilder(context).build(
        recipientWallet = recipientPhone,
        amount = amount,
        sessionStartMs = FraudShieldSDK.sessionStartMs
    )
)

when (decision.recommendedAction) {
    "BLOCK"     -> showBlockDialog()
    "WARN_USER" -> showWarningDialog()
    "ALLOW"     -> proceedWithTransfer()
}
```

### iOS (Swift)

```swift
// In AppDelegate.didFinishLaunchingWithOptions
FraudShieldSDK.initialize(
    apiKey: "fs_live_abc123",
    userId: currentUser.phone,
    apiBaseUrl: "https://api.fraudshield.swifter.io"
)

// Before money transfer
Task {
    let payload = await RiskPayloadBuilder.shared.build(
        recipientWallet: recipient,
        amount: amount
    )
    let decision = try await FraudSignalDispatcher.shared.evaluate(payload)

    switch decision.recommendedAction {
    case "BLOCK":     showBlockAlert()
    case "WARN_USER": showWarningSheet()
    default:          proceedWithTransfer()
    }
}
```

---

## Error Codes

| Code | Meaning                        |
|------|--------------------------------|
| 400  | Invalid payload / missing fields |
| 401  | Missing or invalid API key      |
| 422  | Decryption failure              |
| 429  | Rate limited (100 req/s)        |
| 503  | Risk engine unavailable         |
