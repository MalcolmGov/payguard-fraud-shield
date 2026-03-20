import Foundation
import UIKit

// MARK: - Public Types

public enum RiskLevel: String, Codable {
    case low = "LOW"
    case medium = "MEDIUM"
    case high = "HIGH"
    case critical = "CRITICAL"
}

public enum RecommendedAction: String, Codable {
    case approve = "APPROVE"
    case softWarning = "SOFT_WARNING"
    case warnUser = "WARN_USER"
    case block = "BLOCK"
}

public struct TransactionPayload {
    public let recipientPhone: String
    public let amount: Double
    public let currency: String
    public let note: String?

    public init(recipientPhone: String, amount: Double, currency: String, note: String? = nil) {
        self.recipientPhone = recipientPhone
        self.amount = amount
        self.currency = currency
        self.note = note
    }
}

public struct RiskDecision {
    public let riskScore: Int
    public let riskLevel: RiskLevel
    public let recommendedAction: RecommendedAction
    public let triggeredRules: [String]
    public let transactionId: String
}

// MARK: - SDK Entry Point

@MainActor
public final class FraudShieldSDK {

    public static let shared = FraudShieldSDK()

    private var apiKey: String?
    private var userId: String?
    private var sessionId: String?
    private var apiBaseUrl: String = "https://api.payguard.africa"

    private let deviceCollector      = DeviceCollector()
    private let networkCollector     = NetworkCollector()
    private let behavioralCollector  = BehavioralCollector()
    private let callStateCollector   = CallStateCollector()
    private var dispatcher: FraudSignalDispatcher?

    /// Lazily-created device binding manager
    private var _deviceBinding: DeviceBindingManager?
    private var deviceBinding: DeviceBindingManager {
        if _deviceBinding == nil {
            _deviceBinding = DeviceBindingManager(apiBaseUrl: apiBaseUrl, apiKey: apiKey!)
        }
        return _deviceBinding!
    }

    private init() {}

    // MARK: - Initialization

    /// Initialize the SDK. Call from `application(_:didFinishLaunchingWithOptions:)`.
    ///
    /// - Parameters:
    ///   - apiKey:   Your PayGuard API key (`pg_live_***` or `pg_sandbox_***`)
    ///   - userId:   The authenticated user's ID (MSISDN or UUID)
    ///   - baseUrl:  Optional: override the API base URL for staging environments
    public func initialize(
        apiKey: String,
        userId: String,
        baseUrl: String = "https://api.payguard.africa"
    ) {
        self.apiKey     = apiKey
        self.userId     = userId
        self.apiBaseUrl = baseUrl
        self.dispatcher = FraudSignalDispatcher(apiKey: apiKey)
        // Reset binding manager so it picks up new creds
        _deviceBinding = nil
    }

    // MARK: - Device Binding

    /// Register this device for the current user.
    ///
    /// Call ONCE after the user successfully authenticates for the first time on this device.
    /// Stores the device token securely in the iOS Keychain
    /// (`kSecAttrAccessibleAfterFirstUnlock`).
    ///
    /// - Returns: `BindingResult` — check `requiresStepUp` and `stepUpMethod`.
    public func bindDevice() async throws -> DeviceBindingManager.BindingResult {
        guard let userId = userId else {
            throw FraudShieldError.notInitialized
        }
        return try await deviceBinding.registerDevice(userId: userId)
    }

    /// Validate this device on every login and before every high-value transaction.
    ///
    /// Automatically re-registers if no token is stored (first use).
    /// - Returns: `BindingResult` — check `requiresStepUp` and `riskDelta`.
    public func validateDevice() async throws -> DeviceBindingManager.BindingResult {
        guard let userId = userId else {
            throw FraudShieldError.notInitialized
        }
        return try await deviceBinding.validateDevice(userId: userId)
    }

    /// Clear stored device binding token. Call on user logout.
    public func clearDeviceBinding() {
        deviceBinding.clearBinding()
    }

    /// `true` if a device token is currently stored in Keychain.
    public var isDeviceBound: Bool {
        deviceBinding.hasBinding
    }

    // MARK: - Session

    /// Start a new transaction session. Call at the beginning of the send money flow.
    @discardableResult
    public func startSession() -> String {
        let id = UUID().uuidString
        sessionId = id
        behavioralCollector.onSessionStart()
        return id
    }

    // MARK: - Transaction Evaluation

    /// Evaluate a pending transaction for fraud risk before executing it.
    ///
    /// Best practice: call `validateDevice()` before `evaluateTransaction(_:)`.
    /// - Returns: A `RiskDecision` with score, level, and recommended action.
    public func evaluateTransaction(_ payload: TransactionPayload) async throws -> RiskDecision {
        guard let userId = userId, let dispatcher = dispatcher else {
            throw FraudShieldError.notInitialized
        }

        async let deviceSignals     = deviceCollector.collect()
        async let networkSignals    = networkCollector.collect()
        async let behavioralSignals = behavioralCollector.collect()
        async let callSignals       = callStateCollector.collect()

        let riskPayload = await RiskPayloadBuilder.build(
            userId:      userId,
            sessionId:   sessionId ?? startSession(),
            transaction: payload,
            device:      deviceSignals,
            network:     networkSignals,
            behavioral:  behavioralSignals,
            call:        callSignals
        )

        return try await dispatcher.evaluate(riskPayload)
    }

    // MARK: - Behavioral Event Recording

    /// Record a keystroke in the given field for behavioural biometric analysis.
    public func recordKeystroke(in field: String) {
        behavioralCollector.recordKeystroke(field: field)
    }

    /// Record when the user pastes content into a field.
    public func recordPaste(in field: String) {
        behavioralCollector.recordPaste(field: field)
    }

    /// Record when the recipient number changes mid-flow (social engineering signal).
    public func recordRecipientChange() {
        behavioralCollector.recordRecipientChange()
    }
}

// MARK: - Errors

public enum FraudShieldError: LocalizedError {
    case notInitialized
    case networkFailure(String)
    case decryptionFailure

    public var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "FraudShieldSDK.shared.initialize() must be called before evaluating transactions."
        case .networkFailure(let msg):
            return "Fraud Shield network error: \(msg)"
        case .decryptionFailure:
            return "Response decryption failed."
        }
    }
}


// MARK: - Public Types

public enum RiskLevel: String, Codable {
    case low = "LOW"
    case medium = "MEDIUM"
    case high = "HIGH"
    case critical = "CRITICAL"
}

public enum RecommendedAction: String, Codable {
    case approve = "APPROVE"
    case softWarning = "SOFT_WARNING"
    case warnUser = "WARN_USER"
    case block = "BLOCK"
}

public struct TransactionPayload {
    public let recipientPhone: String
    public let amount: Double
    public let currency: String
    public let note: String?

    public init(recipientPhone: String, amount: Double, currency: String, note: String? = nil) {
        self.recipientPhone = recipientPhone
        self.amount = amount
        self.currency = currency
        self.note = note
    }
}

public struct RiskDecision {
    public let riskScore: Int
    public let riskLevel: RiskLevel
    public let recommendedAction: RecommendedAction
    public let triggeredRules: [String]
    public let transactionId: String
}

// MARK: - SDK Entry Point

@MainActor
public final class FraudShieldSDK {

    public static let shared = FraudShieldSDK()

    private var apiKey: String?
    private var userId: String?
    private var sessionId: String?

    private let deviceCollector = DeviceCollector()
    private let networkCollector = NetworkCollector()
    private let behavioralCollector = BehavioralCollector()
    private let callStateCollector = CallStateCollector()
    private var dispatcher: FraudSignalDispatcher?

    private init() {}

    /// Initialize the SDK. Call from AppDelegate or scene delegate before any transaction.
    public func initialize(apiKey: String, userId: String) {
        self.apiKey = apiKey
        self.userId = userId
        self.dispatcher = FraudSignalDispatcher(apiKey: apiKey)
    }

    /// Start a new transaction session. Call at the beginning of the send money flow.
    @discardableResult
    public func startSession() -> String {
        let id = UUID().uuidString
        sessionId = id
        behavioralCollector.onSessionStart()
        return id
    }

    /// Evaluate a pending transaction for fraud risk.
    /// - Returns: A RiskDecision with score, level, and recommended action.
    public func evaluateTransaction(_ payload: TransactionPayload) async throws -> RiskDecision {
        guard let userId = userId, let dispatcher = dispatcher else {
            throw FraudShieldError.notInitialized
        }

        async let deviceSignals = deviceCollector.collect()
        async let networkSignals = networkCollector.collect()
        async let behavioralSignals = behavioralCollector.collect()
        async let callSignals = callStateCollector.collect()

        let riskPayload = await RiskPayloadBuilder.build(
            userId: userId,
            sessionId: sessionId ?? startSession(),
            transaction: payload,
            device: deviceSignals,
            network: networkSignals,
            behavioral: behavioralSignals,
            call: callSignals
        )

        return try await dispatcher.evaluate(riskPayload)
    }

    // MARK: - Behavioral Event Recording

    public func recordKeystroke(in field: String) {
        behavioralCollector.recordKeystroke(field: field)
    }

    public func recordPaste(in field: String) {
        behavioralCollector.recordPaste(field: field)
    }

    public func recordRecipientChange() {
        behavioralCollector.recordRecipientChange()
    }
}

// MARK: - Errors

public enum FraudShieldError: LocalizedError {
    case notInitialized
    case networkFailure(String)
    case decryptionFailure

    public var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "FraudShieldSDK.shared.initialize() must be called before evaluating transactions."
        case .networkFailure(let msg):
            return "Fraud Shield network error: \(msg)"
        case .decryptionFailure:
            return "Response decryption failed."
        }
    }
}
