# PayGuard iOS SDK — Integration Guide

**Version:** 1.0.0  
**Platform:** iOS 14.0+  
**Language:** Swift 5.9+

---

## 1. Installation

### Swift Package Manager (recommended)

In Xcode: **File → Add Package Dependencies**, then enter:

```
https://github.com/swifter-tech/payguard-ios-sdk
```

Or add to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/swifter-tech/payguard-ios-sdk", from: "1.0.0")
]
```

### CocoaPods

```ruby
# Podfile
pod 'PayGuardSDK', '~> 1.0'
```

```bash
pod install
```

---

## 2. Privacy & Permissions

Add to your `Info.plist`:

```xml
<!-- Required: App needs to check call state -->
<key>NSLocalNetworkUsageDescription</key>
<string>PayGuard uses network information for fraud prevention.</string>

<!-- Optional: Enhanced SIM monitoring -->
<key>NSCellularDataUsageDescription</key>
<string>PayGuard monitors cellular signals for fraud prevention.</string>
```

**Privacy Manifest (PrivacyInfo.xcprivacy):**

```xml
<key>NSPrivacyCollectedDataTypes</key>
<array>
    <dict>
        <key>NSPrivacyCollectedDataType</key>
        <string>NSPrivacyCollectedDataTypeDeviceID</string>
        <key>NSPrivacyCollectedDataTypeLinked</key>
        <false/>
        <key>NSPrivacyCollectedDataTypeTracking</key>
        <false/>
        <key>NSPrivacyCollectedDataTypePurposes</key>
        <array>
            <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
        </array>
    </dict>
</array>
```

---

## 3. Initialisation

Configure in your `AppDelegate` or `@main` App:

```swift
import PayGuardSDK

@main
struct MyApp: App {
    init() {
        let config = PayGuardConfig(
            apiKey: "pk_sandbox_your_key_here",
            environment: .sandbox,           // .sandbox or .production
            options: PayGuardOptions(
                callDetection: true,         // Detect active calls during payment
                deviceFingerprint: true,      // Device intelligence
                simMonitoring: true,          // SIM swap detection
                behaviouralSignals: true,     // Keystroke cadence, paste detection
                logLevel: .debug              // .debug, .info, .warn, .error, .none
            )
        )
        
        PayGuard.initialize(config: config)
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

**UIKit:**

```swift
import PayGuardSDK

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        let config = PayGuardConfig(
            apiKey: "pk_sandbox_your_key_here",
            environment: .sandbox
        )
        PayGuard.initialize(config: config)
        
        return true
    }
}
```

---

## 4. Transaction Risk Assessment

Call `assessRisk()` before the user confirms a payment:

```swift
import PayGuardSDK

let transaction = PayGuardTransaction(
    transactionId: "TXN-2026-001234",         // Your internal reference
    amount: 15000.00,                           // Amount
    currency: "ZAR",
    recipientAccount: "hash_of_recipient",     // Hashed for privacy
    recipientName: "John Doe",                  // Optional
    channel: .mobileBanking,                    // .mobileBanking, .ussd, .wallet, .web
    paymentMethod: .eft,                        // .eft, .card, .wallet, .airtime
    customerId: "CUST-98765"                    // Your internal customer ID
)

PayGuard.assessRisk(transaction: transaction) { result in
    switch result {
    case .success(let riskResult):
        switch riskResult.decision {
        case .allow:
            // ✅ Transaction is safe — proceed
            self.proceedWithPayment()
            
        case .warn:
            // ⚠️ Elevated risk — show warning
            self.showFraudWarning(
                message: riskResult.warningMessage,
                riskScore: riskResult.riskScore,           // 0–100
                signals: riskResult.triggeredSignals        // [Signal]
            )
            
        case .block:
            // 🚫 High-risk — block the transaction
            self.blockTransaction(
                reason: riskResult.blockReason,
                riskScore: riskResult.riskScore,
                signals: riskResult.triggeredSignals
            )
        }
        
    case .failure(let error):
        // Network timeout, API error, etc.
        // Default: ALLOW (fail-open — never block on SDK errors)
        print("PayGuard error: \(error.localizedDescription)")
        self.proceedWithPayment()
    }
}
```

### Async/Await (iOS 15+)

```swift
Task {
    do {
        let result = try await PayGuard.assessRisk(transaction: transaction)
        
        switch result.decision {
        case .allow:  proceedWithPayment()
        case .warn:   showWarning(result)
        case .block:  blockTransaction(result)
        }
    } catch {
        // Fail open
        proceedWithPayment()
    }
}
```

---

## 5. Shadow Mode (Observe Only)

For PoC / pilot testing — records decisions without affecting the user:

```swift
let config = PayGuardConfig(
    apiKey: "pk_live_your_key_here",
    environment: .production,
    shadowMode: true  // 🔍 Logs decisions but NEVER blocks transactions
)

PayGuard.initialize(config: config)
```

In shadow mode:
- All signals are collected normally
- Risk scores are calculated and logged to the dashboard
- **No transaction is ever blocked or warned**
- Compare PayGuard decisions against your existing fraud system

---

## 6. Signal Collection Details

### Call State Detection (CallKit)

```swift
// Automatically detected via CallKit framework
// No additional code required
// Signal: .activeCallDuringPayment
// Note: CallKit does not require special entitlements for call state reading
```

### SIM Monitoring (CoreTelephony)

```swift
// Automatically detected via CTTelephonyNetworkInfo
// Signals: .simChanged, .simPorted, .newSimDetected, .carrierChanged
```

### Device Intelligence

```swift
// Automatically collected
// Signals: .jailbreakDetected, .simulatorDetected, .remoteAccessTool,
//          .screenRecording, .screenMirroring, .debuggerAttached
```

### Behavioural Signals

```swift
// Attach to your payment input fields
PayGuard.attachBehaviouralMonitor(to: amountTextField)
PayGuard.attachBehaviouralMonitor(to: recipientTextField)
// Signals: .pasteEventDetected, .unusualKeystrokeCadence, .rapidFormCompletion
```

**SwiftUI:**

```swift
TextField("Amount", text: $amount)
    .payguardMonitored()  // View modifier for behavioural monitoring
```

---

## 7. Event Reporting

Report transaction outcomes to improve model accuracy:

```swift
// After a successful payment
PayGuard.reportOutcome(
    transactionId: "TXN-2026-001234",
    outcome: .completed      // .completed, .declined, .reversed, .fraudConfirmed
)

// If fraud is later confirmed
PayGuard.reportOutcome(
    transactionId: "TXN-2026-001234",
    outcome: .fraudConfirmed,
    fraudType: .socialEngineering   // .socialEngineering, .simSwap, .accountTakeover, .mule
)
```

---

## 8. Testing

### Test Scenarios

| Scenario | Test Trigger | Expected Decision |
|----------|-------------|-------------------|
| Clean transaction | Normal payment flow | `.allow` |
| Active call | Simulate call via CallKit test | `.block` |
| Rapid paste | Paste account number | `.warn` |
| High amount | Amount > R50,000 | `.warn` |
| Simulator | Run on iOS Simulator | `.block` |
| Known fraud recipient | Use test recipient `TEST-FRAUD-001` | `.block` |

### Sandbox vs Production

| Feature | Sandbox | Production |
|---------|---------|-----------|
| API Key prefix | `pk_sandbox_` | `pk_live_` |
| Real signals | Simulated | Live |
| Rate limits | 100 req/min | Per agreement |
| Data retention | 7 days | 12 months |

---

## 9. App Store Compliance

PayGuard SDK is designed for App Store compliance:

- ✅ No private API usage
- ✅ Privacy Manifest included
- ✅ No IDFA/AdSupport dependency
- ✅ No background location tracking
- ✅ CallKit used only for call state (not call blocking)
- ✅ Data minimisation — only fraud-relevant signals collected

---

## 10. Support

- **Documentation:** [payguard.africa/developers](https://payguard.africa/developers)
- **Sandbox:** [payguard.africa/sandbox](https://payguard.africa/sandbox)
- **Support:** support@swifter.co.za
- **SDK Issues:** sdk-support@swifter.co.za

---

*PayGuard iOS SDK v1.0.0 · Swifter Technologies (Pty) Ltd*
