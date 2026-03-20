# 🛡️ Swifter Fraud Shield SDK

[![CI — Tests](https://github.com/swifter-financial/fraud-shield/actions/workflows/ci-tests.yml/badge.svg)](https://github.com/swifter-financial/fraud-shield/actions/workflows/ci-tests.yml)
[![CI — Docker](https://github.com/swifter-financial/fraud-shield/actions/workflows/ci-docker.yml/badge.svg)](https://github.com/swifter-financial/fraud-shield/actions/workflows/ci-docker.yml)

**Social Engineering Fraud Detection Platform for Banks, Fintechs & PSPs**

Designed for banks, mobile money operators, fintechs, payment service providers, and digital financial institutions across Africa.

---

## Overview

Swifter Fraud Shield detects social engineering scams where victims are *voluntarily* manipulated into sending money — the defining challenge in digital payments fraud.

The platform combines:
- **Native SDKs** (Android/iOS) that collect device, behavioural, and call-state signals
- **Real-time Risk Engine** that scores each transaction in <100ms
- **Fraud Graph Engine** that identifies fraud rings and mule wallets
- **Fraud Analyst Dashboard** for fraud team investigation

## Repository Structure

```
fraud-shield/
├── sdk/
│   ├── android/          ← Kotlin SDK + sample app
│   └── ios/              ← Swift Package SDK
├── services/
│   ├── api/              ← Node.js/TypeScript Fraud Signal API
│   ├── risk-engine/      ← Python FastAPI risk scoring engine
│   └── graph-engine/     ← Python Neo4j fraud ring detector
├── dashboard/            ← React + Vite fraud analyst dashboard
├── infra/                ← Docker Compose + Nginx
└── docs/                 ← API documentation
```

## Quick Start (Docker)

```bash
cd infra
docker compose up -d
```

- Dashboard: http://localhost:3000
- Signal API: http://localhost:4000
- Risk Engine: http://localhost:8000

## SDK Integration

### Android
```kotlin
// In your Application.onCreate()
FraudShieldSDK.initialize(
    context = this,
    apiKey = "your-api-key",
    userId = currentUser.id
)

// Before executing a transaction
val decision = FraudShieldSDK.evaluateTransaction(
    TransactionPayload(
        recipientPhone = "+27821234567",
        amount = 500.00,
        currency = "ZAR"
    )
)

when (decision.riskLevel) {
    RiskLevel.HIGH -> showScamWarning()
    RiskLevel.MEDIUM -> showSoftWarning()
    RiskLevel.LOW -> proceedWithTransaction()
}
```

### iOS
```swift
// In AppDelegate.application(_:didFinishLaunchingWithOptions:)
FraudShieldSDK.initialize(apiKey: "your-api-key", userId: currentUser.id)

// Before transaction
let decision = await FraudShieldSDK.evaluateTransaction(payload)
```

## The Killer Signal: Call-Aware Transaction Monitoring

When a user is on an active phone call while initiating a transaction to an unknown recipient — this single combination predicts >70% of social engineering fraud cases.

```
User on phone call (active)
+ Recipient not in contacts
+ First transaction to this number
+ Amount > user average
= Risk Score: 95 (HIGH) → Show scam warning
```

## License

Proprietary — Swifter Financial Technologies
