# Android Integration Guide

> **PayGuard SDK for Android** · Kotlin · Min SDK 21 · Target SDK 34

---

## 1. Installation

### Gradle (Kotlin DSL)

```kotlin
// settings.gradle.kts — add the PayGuard Maven repository
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://maven.payguard.africa/releases") }
    }
}

// app/build.gradle.kts
dependencies {
    implementation("africa.payguard:fraud-shield-sdk:1.0.0")
}
```

### Required Permissions

The SDK needs these permissions to collect device and call-state signals. Add to `AndroidManifest.xml`:

```xml
<!-- Required -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Optional: Improves location accuracy for geo-risk scoring -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

> **Note:** `READ_PHONE_STATE` is required for the call-state detector — the killer signal that catches 70%+ of social engineering fraud. Without it, RULE_001/002/014 cannot fire.

---

## 2. Initialization

Call `initialize()` once in your `Application.onCreate()`:

```kotlin
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()

        FraudShieldSDK.initialize(
            context = this,
            apiKey = "pg_live_your_api_key_here",
            userId = AuthManager.getCurrentUserId(),
            // Optional: override base URL for staging
            // baseUrl = "https://sandbox.api.payguard.africa"
        )
    }
}
```

### Configuration Options

```kotlin
FraudShieldSDK.initialize(
    context = this,
    apiKey = "pg_live_...",
    userId = "user-123",
    config = FraudShieldConfig(
        baseUrl = "https://api.payguard.africa",   // Production default
        timeoutMs = 8000,                           // Network timeout
        enableLocalFallback = true,                 // Fallback if API unreachable
        logLevel = LogLevel.WARN,                   // SDK logging level
    )
)
```

---

## 3. Device Binding

Register the device after the user's first successful login. The SDK stores a secure token in Android Keystore.

```kotlin
// After successful login:
lifecycleScope.launch {
    val result = FraudShieldSDK.bindDevice()

    when (result.deviceStatus) {
        "trusted"          -> proceedToHome()
        "new_device"       -> requestOtpVerification()  // Step-up required
        "suspicious_device" -> blockAndNotifySupport()
    }
}

// On every subsequent login and before high-value transactions:
lifecycleScope.launch {
    val validation = FraudShieldSDK.validateDevice()

    if (validation.requiresStepUp) {
        when (validation.stepUpMethod) {
            "otp_verification" -> requestOtp()
            "biometric"        -> requestBiometric()
        }
    }
}

// On logout:
FraudShieldSDK.clearDeviceBinding()
```

---

## 4. Transaction Evaluation

Evaluate every transaction before executing it. The SDK collects all signals automatically.

```kotlin
// In your SendMoneyActivity/Fragment:
class SendMoneyActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Start a new session at the beginning of the send money flow
        FraudShieldSDK.startSession()
    }

    private suspend fun onSendButtonClicked() {
        val payload = TransactionPayload(
            recipientPhone = recipientPhoneInput.text.toString(),
            amount = amountInput.text.toString().toDouble(),
            currency = "ZAR",
            note = noteInput.text.toString()
        )

        // Step 1: Validate device binding
        val deviceResult = FraudShieldSDK.validateDevice()
        if (deviceResult.requiresStepUp) {
            handleStepUp(deviceResult)
            return
        }

        // Step 2: Evaluate transaction risk
        val decision = FraudShieldSDK.evaluateTransaction(payload)

        // Step 3: Act on the decision
        when (decision.recommendedAction) {
            RecommendedAction.APPROVE -> executeTransaction(payload)

            RecommendedAction.SOFT_WARNING -> {
                showInfoDialog(
                    title = "Transaction Review",
                    message = decision.warningMessage ?: "Please verify the recipient.",
                    onConfirm = { executeTransaction(payload) }
                )
            }

            RecommendedAction.WARN_USER -> {
                showScamWarningDialog(
                    message = decision.warningMessage!!,
                    riskScore = decision.riskScore,
                    onProceed = { executeTransaction(payload) },
                    onCancel  = { cancelTransaction() }
                )
            }

            RecommendedAction.BLOCK -> {
                showBlockedDialog(
                    message = decision.warningMessage!!,
                    triggeredRules = decision.triggeredRules
                )
            }
        }
    }
}
```

---

## 5. Behavioural Signal Recording

For best accuracy, instrument your UI to record behavioural signals:

```kotlin
// Record keystrokes (attach to amount and phone number fields)
recipientPhoneInput.addTextChangedListener(object : TextWatcher {
    override fun afterTextChanged(s: Editable?) {
        FraudShieldSDK.recordKeystroke(field = "recipient_phone")
    }
    override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
    override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
})

// Record paste events
recipientPhoneInput.setOnPasteListener {
    FraudShieldSDK.recordPaste(field = "recipient_phone")
}

// Record recipient changes
recipientPhoneInput.setOnFocusChangeListener { _, hasFocus ->
    if (!hasFocus && recipientPhoneInput.text.isNotEmpty()) {
        FraudShieldSDK.recordRecipientChange()
    }
}
```

---

## 6. OtpGuard — Protecting OTP Screens

OtpGuard detects when a user is on an active call while viewing an OTP screen — the #1 pattern in OTP phishing attacks.

```kotlin
class OtpActivity : AppCompatActivity() {

    override fun onResume() {
        super.onResume()
        // Activate OtpGuard — checks for active calls and applies protections
        OtpGuard.activate(this) { riskLevel ->
            when (riskLevel) {
                OtpRiskLevel.HIGH_RISK -> {
                    // Full-screen red overlay is shown automatically
                    // Optionally auto-cancel the OTP request:
                    // cancelOtpRequest()
                }
                OtpRiskLevel.MEDIUM_RISK -> {
                    // Warning banner shown automatically
                }
                OtpRiskLevel.CLEAN -> {
                    // No active call — proceed normally
                }
            }
        }
    }

    override fun onPause() {
        super.onPause()
        OtpGuard.deactivate()
    }
}
```

**OtpGuard protections (applied automatically):**
- `FLAG_SECURE` — prevents screenshots and screen recording of OTP field
- Full-screen red overlay warning — "NEVER share your OTP verbally"
- Fires `RULE_014` signal to Risk Engine (+80 score for unknown caller)

---

## 7. ProGuard / R8 Rules

Add to your `proguard-rules.pro`:

```
-keep class africa.payguard.fraudshield.** { *; }
-keepclassmembers class africa.payguard.fraudshield.** { *; }
-dontwarn africa.payguard.fraudshield.**
```

---

## 8. Error Handling

```kotlin
try {
    val decision = FraudShieldSDK.evaluateTransaction(payload)
    handleDecision(decision)
} catch (e: FraudShieldException.NotInitialized) {
    // SDK not initialized — call initialize() first
    Log.e("PayGuard", "SDK not initialized", e)
} catch (e: FraudShieldException.NetworkFailure) {
    // API unreachable — local fallback was applied automatically
    // The decision still contains a local risk score
    Log.w("PayGuard", "Network failure, using local fallback", e)
    handleDecision(e.fallbackDecision)
}
```

---

## 9. Testing

### Sandbox Mode

Use sandbox API keys to test without affecting production:

```kotlin
FraudShieldSDK.initialize(
    context = this,
    apiKey = "pg_sandbox_test_key_001",
    userId = "test-user-001",
    config = FraudShieldConfig(
        baseUrl = "https://sandbox.api.payguard.africa"
    )
)
```

### Test Scenarios

| Scenario | How to Trigger | Expected |
|----------|---------------|----------|
| Clean transaction | Normal flow, recipient in contacts | Score ~0, APPROVE |
| Vishing attack | Start a phone call, then send to unknown recipient | Score 75+, WARN_USER or BLOCK |
| OTP phishing | Open OTP screen while on call | OtpGuard fires, RULE_014 |
| Fraud farm | Use emulator + high amount | Score 40+, SOFT_WARNING |
| SIM swap | (Backend mock) Set sim_swap_detected flag | Score 50+, WARN_USER |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | March 2026 | Initial release: 14 fraud rules, OtpGuard, device binding |
