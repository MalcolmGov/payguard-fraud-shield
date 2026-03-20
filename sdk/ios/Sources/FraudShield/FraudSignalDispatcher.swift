import Foundation

struct RiskPayload: Codable {
    let payloadId: String
    let userId: String
    let sessionId: String
    let timestamp: Double
    let transaction: TransactionData
    let device: DeviceData
    let network: NetworkData
    let behavioral: BehavioralData
    let call: CallData
    let recipientInContacts: Bool

    struct TransactionData: Codable {
        let recipientPhone: String
        let amount: Double
        let currency: String
        let note: String?
    }
    struct DeviceData: Codable {
        let deviceId: String
        let manufacturer: String
        let model: String
        let osVersion: String
        let isJailbroken: Bool
        let isSimulator: Bool
        let isAppTampered: Bool
    }
    struct NetworkData: Codable {
        let ipAddress: String
        let isVpn: Bool
        let isProxy: Bool
        let connectionType: String
    }
    struct BehavioralData: Codable {
        let sessionDurationMs: Double
        let keystrokeCount: Int
        let averageKeystrokeIntervalMs: Double
        let pasteDetected: Bool
        let pastedFields: [String]
        let recipientChangedCount: Int
        let transactionCreationMs: Double
        let typingSpeedScore: Double
    }
    struct CallData: Codable {
        let isOnActiveCall: Bool
        let callType: String
    }
}

class RiskPayloadBuilder {
    static func build(
        userId: String,
        sessionId: String,
        transaction: TransactionPayload,
        device: DeviceSignals,
        network: NetworkSignals,
        behavioral: BehavioralSignals,
        call: CallSignals,
        recipientInContacts: Bool = false
    ) -> RiskPayload {
        return RiskPayload(
            payloadId: UUID().uuidString,
            userId: userId,
            sessionId: sessionId,
            timestamp: Date().timeIntervalSince1970 * 1000,
            transaction: .init(
                recipientPhone: transaction.recipientPhone,
                amount: transaction.amount,
                currency: transaction.currency,
                note: transaction.note
            ),
            device: .init(
                deviceId: device.deviceId,
                manufacturer: device.manufacturer,
                model: device.model,
                osVersion: device.osVersion,
                isJailbroken: device.isJailbroken,
                isSimulator: device.isSimulator,
                isAppTampered: device.isAppTampered
            ),
            network: .init(
                ipAddress: network.ipAddress,
                isVpn: network.isVpnActive,
                isProxy: network.isProxySet,
                connectionType: network.connectionType
            ),
            behavioral: .init(
                sessionDurationMs: behavioral.sessionDurationMs,
                keystrokeCount: behavioral.keystrokeCount,
                averageKeystrokeIntervalMs: behavioral.averageKeystrokeIntervalMs,
                pasteDetected: behavioral.pasteDetected,
                pastedFields: behavioral.pastedFields,
                recipientChangedCount: behavioral.recipientChangedCount,
                transactionCreationMs: behavioral.transactionCreationMs,
                typingSpeedScore: behavioral.typingSpeedScore
            ),
            call: .init(
                isOnActiveCall: call.isOnActiveCall,
                callType: call.callType
            ),
            recipientInContacts: recipientInContacts
        )
    }
}

class FraudSignalDispatcher {
    private let apiKey: String
    private let baseURL = "https://api.fraudshield.swifter.io"
    private let session: URLSession

    init(apiKey: String) {
        self.apiKey = apiKey
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 8.0
        self.session = URLSession(configuration: config)
    }

    func evaluate(_ payload: RiskPayload) async throws -> RiskDecision {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        let body = try encoder.encode(payload)

        guard let url = URL(string: "\(baseURL)/v1/evaluate") else {
            throw FraudShieldError.networkFailure("Invalid URL")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "X-Api-Key")
        request.httpBody = body

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            return failSecureFallback(payload: payload)
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let decision = try decoder.decode(RiskDecisionResponse.self, from: data)
        return RiskDecision(
            riskScore: decision.riskScore,
            riskLevel: RiskLevel(rawValue: decision.riskLevel) ?? .medium,
            recommendedAction: RecommendedAction(rawValue: decision.recommendedAction) ?? .softWarning,
            triggeredRules: decision.triggeredRules,
            transactionId: decision.transactionId
        )
    }

    private func failSecureFallback(payload: RiskPayload) -> RiskDecision {
        var score = 0
        var rules: [String] = []
        if payload.call.isOnActiveCall { score += 30; rules.append("RULE_002") }
        if !payload.recipientInContacts { score += 20; rules.append("LOCAL_UNKNOWN_RECIPIENT") }
        if payload.behavioral.pasteDetected { score += 15; rules.append("RULE_004") }
        if payload.device.isJailbroken { score += 20; rules.append("RULE_009") }
        let level: RiskLevel = score >= 60 ? .high : (score >= 30 ? .medium : .low)
        return RiskDecision(
            riskScore: min(score, 100),
            riskLevel: level,
            recommendedAction: score >= 60 ? .warnUser : .softWarning,
            triggeredRules: rules,
            transactionId: payload.payloadId
        )
    }
}

private struct RiskDecisionResponse: Codable {
    let riskScore: Int
    let riskLevel: String
    let recommendedAction: String
    let triggeredRules: [String]
    let transactionId: String
}
