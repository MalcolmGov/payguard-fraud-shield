# iOS Integration Guide

> **PayGuard SDK for iOS** · Swift Package · iOS 15+ · Swift 5.9+

---

## 1. Installation

### Swift Package Manager (Recommended)

In Xcode:
1. **File → Add Package Dependencies**
2. Enter: `https://github.com/swifter-financial/fraud-shield-ios.git`
3. Select version `1.0.0` or later

Or add to `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/swifter-financial/fraud-shield-ios.git", from: "1.0.0")
],
targets: [
    .target(name: "MyApp", dependencies: ["FraudShield"])
]
```

### Required Capabilities

Add to your `Info.plist`:

```xml
<!-- Required: Call detection for social engineering fraud detection -->
<key>NSPhoneStateUsageDescription</key>
<string>PayGuard monitors call state to protect against phone scams.</string>

<!-- Required: Contact matching for recipient risk scoring -->
<key>NSContactsUsageDescription</key>
<string>PayGuard checks if transfer recipients are in your contacts.</string>

<!-- Optional: Improves location-based risk scoring -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>PayGuard uses location to detect geographic anomalies.</string>
```

### Privacy Manifest

The SDK ships with `PrivacyInfo.xcprivacy` that declares all data collection types (required for App Store submission as of Spring 2024). No action needed — it's bundled in the package.

---

## 2. Initialization

Call `initialize()` in `AppDelegate` or your app's entry point:

```swift
import FraudShield

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        FraudShieldSDK.shared.initialize(
            apiKey: "pg_live_your_api_key_here",
            userId: AuthManager.currentUserId
            // Optional: override for staging
            // baseUrl: "https://sandbox.api.payguard.africa"
        )
        return true
    }
}
```

### SwiftUI App Lifecycle

```swift
import FraudShield

@main
struct MyApp: App {
    init() {
        FraudShieldSDK.shared.initialize(
            apiKey: "pg_live_your_api_key_here",
            userId: AuthManager.currentUserId
        )
    }

    var body: some Scene {
        WindowGroup { ContentView() }
    }
}
```

---

## 3. Device Binding

Register the device after first successful login. Token is stored in the **iOS Keychain** (`kSecAttrAccessibleAfterFirstUnlock`) — survives app reinstalls.

```swift
// After successful login:
Task {
    do {
        let result = try await FraudShieldSDK.shared.bindDevice()

        switch result.deviceStatus {
        case "trusted":
            navigateToHome()
        case "new_device":
            // Step-up required
            if result.stepUpMethod == "otp_verification" {
                presentOtpVerification()
            }
        case "suspicious_device":
            presentAccountLocked()
        default:
            break
        }
    } catch {
        print("Device binding failed: \(error)")
    }
}

// On every login and before high-value transactions:
Task {
    let validation = try await FraudShieldSDK.shared.validateDevice()

    if validation.requiresStepUp {
        switch validation.stepUpMethod {
        case "otp_verification": presentOtpVerification()
        case "biometric":        requestFaceID()
        default: break
        }
    }
}

// On logout:
FraudShieldSDK.shared.clearDeviceBinding()

// Check binding status:
if FraudShieldSDK.shared.isDeviceBound {
    // Device is registered
}
```

---

## 4. Transaction Evaluation

The SDK collects all signals automatically — you just pass the transaction details:

```swift
class SendMoneyViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        // Start a new session at the beginning of the flow
        FraudShieldSDK.shared.startSession()
    }

    @IBAction func sendButtonTapped(_ sender: UIButton) {
        Task {
            let payload = TransactionPayload(
                recipientPhone: recipientField.text ?? "",
                amount: Double(amountField.text ?? "0") ?? 0,
                currency: "ZAR",
                note: noteField.text
            )

            // Step 1: Validate device
            let deviceResult = try await FraudShieldSDK.shared.validateDevice()
            if deviceResult.requiresStepUp {
                handleStepUp(deviceResult)
                return
            }

            // Step 2: Evaluate risk
            let decision = try await FraudShieldSDK.shared.evaluateTransaction(payload)

            // Step 3: Act on decision
            switch decision.recommendedAction {
            case .approve:
                executeTransaction(payload)

            case .softWarning:
                presentAlert(
                    title: "Transaction Review",
                    message: "Please verify the recipient before proceeding.",
                    confirmAction: { self.executeTransaction(payload) }
                )

            case .warnUser:
                presentScamWarning(
                    score: decision.riskScore,
                    rules: decision.triggeredRules,
                    onProceed: { self.executeTransaction(payload) },
                    onCancel: { self.cancelTransaction() }
                )

            case .block:
                presentBlockedAlert(rules: decision.triggeredRules)
            }
        }
    }
}
```

### SwiftUI Example

```swift
struct SendMoneyView: View {
    @State private var recipient = ""
    @State private var amount = ""
    @State private var showWarning = false
    @State private var decision: RiskDecision?

    var body: some View {
        VStack {
            TextField("Recipient", text: $recipient)
            TextField("Amount", text: $amount)

            Button("Send Money") {
                Task { await evaluateAndSend() }
            }
        }
        .onAppear { FraudShieldSDK.shared.startSession() }
        .alert("Fraud Warning", isPresented: $showWarning) {
            Button("Cancel", role: .cancel) {}
            Button("Proceed Anyway") { executeTransaction() }
        } message: {
            Text(decision?.warningMessage ?? "")
        }
    }

    func evaluateAndSend() async {
        let payload = TransactionPayload(
            recipientPhone: recipient,
            amount: Double(amount) ?? 0,
            currency: "ZAR"
        )
        let result = try? await FraudShieldSDK.shared.evaluateTransaction(payload)
        decision = result

        switch result?.recommendedAction {
        case .approve:    executeTransaction()
        case .block:      showBlockedView()
        default:          showWarning = true
        }
    }
}
```

---

## 5. Behavioural Signal Recording

For maximum detection accuracy, record user interactions:

```swift
// UIKit — attach to text fields
recipientField.addTarget(self, action: #selector(recipientChanged), for: .editingChanged)

@objc func recipientChanged() {
    FraudShieldSDK.shared.recordKeystroke(in: "recipient_phone")
}

// Detect paste
recipientField.addTarget(self, action: #selector(checkForPaste), for: .editingChanged)
@objc func checkForPaste() {
    if UIPasteboard.general.hasStrings {
        FraudShieldSDK.shared.recordPaste(in: "recipient_phone")
    }
}

// Record recipient changes
FraudShieldSDK.shared.recordRecipientChange()
```

### SwiftUI Bindings

```swift
TextField("Recipient", text: $recipient)
    .onChange(of: recipient) { _ in
        FraudShieldSDK.shared.recordKeystroke(in: "recipient_phone")
    }
```

---

## 6. OtpGuard — Protecting OTP Screens

OtpGuard detects active calls when the OTP screen appears and overlays a scam warning.

```swift
class OtpViewController: UIViewController {
    private let otpGuard = OtpGuard.shared

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)

        otpGuard.activate(on: self) { riskLevel in
            switch riskLevel {
            case .highRisk:
                // Full-screen red overlay shown automatically
                // Unknown caller detected — likely OTP phishing
                print("⚠️ OTP phishing risk: unknown caller active")

            case .mediumRisk:
                // Warning overlay shown — known caller, but still risky
                print("⚠️ User on known call during OTP entry")

            case .clean:
                // No active call — safe to proceed
                break
            }
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        otpGuard.deactivate()
    }
}
```

**OtpGuard protections (applied automatically):**
- Screenshot prevention — secure UITextField overlay trick
- Full-screen warning overlay for high-risk calls
- Fires `RULE_014` signal (+80 score) to Risk Engine
- Auto-dismisses warning when the call ends

---

## 7. Error Handling

```swift
do {
    let decision = try await FraudShieldSDK.shared.evaluateTransaction(payload)
    handleDecision(decision)

} catch FraudShieldError.notInitialized {
    // Call initialize() first
    fatalError("FraudShieldSDK not initialized")

} catch FraudShieldError.networkFailure(let message) {
    // API unreachable — SDK applied local fallback rules automatically
    print("Network error: \(message). Local fallback active.")

} catch FraudShieldError.decryptionFailure {
    // Response couldn't be decrypted — investigate API key mismatch
    print("Decryption failure — check API key")
}
```

### Fail-Secure Fallback

When the PayGuard API is unreachable, the SDK applies **local rules** using on-device signals:

| Local Rule | Signal | Score |
|-----------|--------|-------|
| `RULE_002` | Active call detected | +30 |
| `LOCAL_UNKNOWN_RECIPIENT` | Recipient not in contacts | +20 |
| `RULE_004` | Paste detected | +15 |
| `RULE_009` | Jailbroken device | +20 |

The local score is returned as a valid `RiskDecision` — your app doesn't need special handling.

---

## 8. Testing

### Sandbox Mode

```swift
FraudShieldSDK.shared.initialize(
    apiKey: "pg_sandbox_test_key_001",
    userId: "test-user-001",
    baseUrl: "https://sandbox.api.payguard.africa"
)
```

### Simulator Note

The SDK detects simulators (`isSimulator: true`) and marks them in device signals. In the simulator you **cannot** test:
- Call state detection (no `CXCallObserver` on simulator)
- Jailbreak detection (always returns `false`)
- Keychain persistence (resets on rebuild)

Use a **physical device** connected to Xcode for full integration testing.

### Test Scenarios

| Scenario | How to Trigger | Expected |
|----------|---------------|----------|
| Clean transaction | Send to a contact, no call active | Score ~0, `.approve` |
| Vishing attack | Start call → open app → send to non-contact | Score 75+, `.warnUser` or `.block` |
| OTP phishing | Call active → navigate to OTP screen | Red overlay, RULE_014 fires |
| Paste attack | Paste a phone number into recipient field | RULE_004 fires (+20) |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | March 2026 | Initial release: 14 fraud rules, OtpGuard, device binding, SwiftUI support |
