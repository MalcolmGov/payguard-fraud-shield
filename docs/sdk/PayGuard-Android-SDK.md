# PayGuard Android SDK — Integration Guide

**Version:** 1.0.0  
**Min SDK:** 21 (Android 5.0 Lollipop)  
**Language:** Kotlin / Java

---

## 1. Installation

### Gradle (recommended)

Add the PayGuard Maven repository to your project-level `build.gradle`:

```groovy
// settings.gradle.kts or build.gradle (project-level)
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://sdk.payguard.africa/android") }
    }
}
```

Add the dependency to your app-level `build.gradle`:

```groovy
// app/build.gradle.kts
dependencies {
    implementation("africa.payguard:sdk:1.0.0")
}
```

### Required Permissions

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## 2. Initialisation

Initialise the SDK in your `Application` class or main `Activity`:

```kotlin
import africa.payguard.PayGuard
import africa.payguard.PayGuardConfig
import africa.payguard.Environment

class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()

        val config = PayGuardConfig.Builder()
            .apiKey("pk_sandbox_your_key_here")       // Sandbox key for testing
            .environment(Environment.SANDBOX)          // SANDBOX or PRODUCTION
            .enableCallDetection(true)                 // Detect active calls during payment
            .enableDeviceFingerprint(true)              // Device intelligence
            .enableSIMMonitoring(true)                  // SIM swap detection
            .enableBehaviouralSignals(true)             // Keystroke cadence, paste detection
            .logLevel(LogLevel.DEBUG)                   // DEBUG, INFO, WARN, ERROR, NONE
            .build()

        PayGuard.init(this, config)
    }
}
```

---

## 3. Transaction Risk Assessment

Call `assessRisk()` before the user confirms a payment:

```kotlin
import africa.payguard.PayGuard
import africa.payguard.model.Transaction
import africa.payguard.model.RiskResult
import africa.payguard.model.Decision

// Build the transaction
val transaction = Transaction.Builder()
    .transactionId("TXN-2026-001234")                  // Your internal reference
    .amount(15000.00)                                    // Amount in lowest denomination
    .currency("ZAR")
    .recipientAccount("hash_of_recipient_account")      // Hashed for privacy
    .recipientName("John Doe")                           // Optional
    .channel("mobile_banking")                           // mobile_banking, ussd, wallet, web
    .paymentMethod("eft")                                // eft, card, wallet, airtime
    .customerId("CUST-98765")                            // Your internal customer ID
    .build()

// Assess risk — returns in <100ms
PayGuard.assessRisk(transaction) { result: RiskResult ->
    when (result.decision) {
        Decision.ALLOW -> {
            // ✅ Transaction is safe — proceed with payment
            proceedWithPayment()
        }
        Decision.WARN -> {
            // ⚠️ Elevated risk — show warning to customer
            showFraudWarning(
                message = result.warningMessage,
                riskScore = result.riskScore,     // 0–100
                signals = result.triggeredSignals // List of triggered fraud signals
            )
        }
        Decision.BLOCK -> {
            // 🚫 High-risk — block the transaction
            blockTransaction(
                reason = result.blockReason,
                riskScore = result.riskScore,
                signals = result.triggeredSignals
            )
        }
    }
}
```

---

## 4. Shadow Mode (Observe Only)

For PoC / pilot testing, enable shadow mode to record decisions without affecting the user:

```kotlin
val config = PayGuardConfig.Builder()
    .apiKey("pk_sandbox_your_key_here")
    .environment(Environment.PRODUCTION)
    .shadowMode(true)  // 🔍 Logs decisions but NEVER blocks transactions
    .build()

PayGuard.init(this, config)
```

In shadow mode:
- All signals are collected normally
- Risk scores are calculated
- Decisions (ALLOW/WARN/BLOCK) are logged to the dashboard
- **No transaction is ever blocked or warned**
- Perfect for comparing PayGuard decisions against your existing fraud system

---

## 5. Signal Collection Details

### Call State Detection
```kotlin
// Automatically detected — no code required
// PayGuard detects if the user is on a phone call during the transaction
// Signal: ACTIVE_CALL_DURING_PAYMENT
```

### SIM Swap Detection
```kotlin
// Automatically detected — requires READ_PHONE_STATE permission
// PayGuard checks SIM identity against known baseline
// Signals: SIM_CHANGED, SIM_PORTED, NEW_SIM_DETECTED
```

### Device Intelligence
```kotlin
// Automatically collected — no code required
// Signals: EMULATOR_DETECTED, ROOT_DETECTED, REMOTE_ACCESS_TOOL,
//          SCREEN_SHARING_ACTIVE, OVERLAY_DETECTED, SPOOFED_DEVICE
```

### Behavioural Signals
```kotlin
// Attach to your payment input fields for enhanced detection
PayGuard.attachBehaviouralMonitor(amountEditText)
PayGuard.attachBehaviouralMonitor(recipientEditText)
// Signals: PASTE_EVENT_DETECTED, UNUSUAL_KEYSTROKE_CADENCE,
//          RAPID_FORM_COMPLETION
```

---

## 6. Event Reporting

Report transaction outcomes to improve model accuracy:

```kotlin
// After a successful payment
PayGuard.reportOutcome(
    transactionId = "TXN-2026-001234",
    outcome = Outcome.COMPLETED     // COMPLETED, DECLINED, REVERSED, FRAUD_CONFIRMED
)

// If fraud is later confirmed
PayGuard.reportOutcome(
    transactionId = "TXN-2026-001234",
    outcome = Outcome.FRAUD_CONFIRMED,
    fraudType = "social_engineering"  // social_engineering, sim_swap, account_takeover, mule
)
```

---

## 7. ProGuard / R8 Configuration

```proguard
# PayGuard SDK
-keep class africa.payguard.** { *; }
-dontwarn africa.payguard.**
```

---

## 8. Testing

### Test Cards / Scenarios

| Scenario | Test Trigger | Expected Decision |
|----------|-------------|-------------------|
| Clean transaction | Normal payment flow | ALLOW |
| Active call | Simulate call during payment | BLOCK |
| Rapid paste | Paste account number from clipboard | WARN |
| High amount | Amount > R50,000 | WARN |
| Emulator | Run on Android emulator | BLOCK |
| Known fraud recipient | Use test recipient `TEST-FRAUD-001` | BLOCK |

### Sandbox vs Production

| Feature | Sandbox | Production |
|---------|---------|-----------|
| API Key prefix | `pk_sandbox_` | `pk_live_` |
| Real signals | Simulated | Live |
| Rate limits | 100 req/min | Per agreement |
| Data retention | 7 days | 12 months |

---

## 9. Error Handling

```kotlin
PayGuard.assessRisk(transaction) { result ->
    if (result.isError) {
        // Network timeout, API error, etc.
        // Default: ALLOW the transaction (fail-open)
        Log.e("PayGuard", "Error: ${result.errorMessage}")
        proceedWithPayment()  // Never block on SDK errors
    }
}
```

**Important:** PayGuard is designed to **fail open** — if the SDK cannot reach the server, the transaction is allowed. Fraud prevention should never cause payment outages.

---

## 10. Support

- **Documentation:** [payguard.africa/developers](https://payguard.africa/developers)
- **Sandbox:** [payguard.africa/sandbox](https://payguard.africa/sandbox)
- **Support:** support@swifter.co.za
- **SDK Issues:** sdk-support@swifter.co.za

---

*PayGuard Android SDK v1.0.0 · Swifter Technologies (Pty) Ltd*
