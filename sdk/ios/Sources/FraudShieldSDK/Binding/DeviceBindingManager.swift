import Foundation

/// DeviceBindingManager (iOS/Swift)
///
/// Orchestrates device registration and validation against the PayGuard backend.
/// Mirrors the Android DeviceBindingManager API exactly.
public final class DeviceBindingManager {

    private let apiBaseUrl: String
    private let apiKey:     String
    private let collector   = DeviceFingerprintCollector()
    private let tokenStore  = KeychainTokenStore()

    public struct BindingResult {
        public let deviceStatus:    String   // "trusted" | "new_device" | "suspicious_device"
        public let requiresStepUp:  Bool
        public let stepUpMethod:    String?  // "otp_verification" | "biometric" | "email_verification"
        public let riskDelta:       Int
        public let triggeredRules:  [String]
    }

    public init(apiBaseUrl: String, apiKey: String) {
        self.apiBaseUrl = apiBaseUrl
        self.apiKey     = apiKey
    }

    // MARK: - Public API

    /// Register this device for the given user.
    /// Call after successful login. Stores token securely in Keychain.
    public func registerDevice(userId: String) async throws -> BindingResult {
        let signals     = collector.collect()
        let fingerprint = collector.generateFingerprint(signals)

        let body = buildRegisterBody(userId: userId, fingerprint: fingerprint, signals: signals)
        let response = try await postJSON(path: "/v1/device/register", body: body)

        guard let token  = response["device_token"]  as? String,
              let status = response["device_status"]  as? String else {
            throw BindingError.invalidResponse
        }

        try tokenStore.storeToken(token)

        return BindingResult(
            deviceStatus:   status,
            requiresStepUp: status != "trusted",
            stepUpMethod:   response["required_action"] as? String,
            riskDelta:      0,
            triggeredRules: []
        )
    }

    /// Validate this device. Call on every login and before every transaction.
    public func validateDevice(userId: String) async throws -> BindingResult {
        guard let storedToken = tokenStore.retrieveToken() else {
            return try await registerDevice(userId: userId)
        }

        let signals     = collector.collect()
        let fingerprint = collector.generateFingerprint(signals)

        let body = buildValidateBody(
            userId: userId, token: storedToken,
            fingerprint: fingerprint, signals: signals
        )
        let response = try await postJSON(path: "/v1/device/validate", body: body)

        // If validation error, re-register
        if let _ = response["validation_error"] as? String {
            tokenStore.clearToken()
            return try await registerDevice(userId: userId)
        }

        let status    = response["device_status"]  as? String ?? "new_device"
        let riskDelta = response["risk_delta"]      as? Int    ?? 0
        let rules     = response["triggered_rules"] as? [String] ?? []

        return BindingResult(
            deviceStatus:   status,
            requiresStepUp: status != "trusted",
            stepUpMethod:   response["required_action"] as? String,
            riskDelta:      riskDelta,
            triggeredRules: rules
        )
    }

    /// Clear stored token on logout.
    public func clearBinding() { tokenStore.clearToken() }

    /// True if a device token is stored.
    public var hasBinding: Bool { tokenStore.hasToken() }

    // MARK: - Private helpers

    private func postJSON(path: String, body: [String: Any]) async throws -> [String: Any] {
        guard let url = URL(string: "\(apiBaseUrl)\(path)") else {
            throw BindingError.invalidURL
        }

        var request = URLRequest(url: url, timeoutInterval: 8)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, _) = try await URLSession.shared.data(for: request)
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw BindingError.invalidResponse
        }
        return json
    }

    private func buildRegisterBody(userId: String, fingerprint: String,
                                   signals: DeviceSignals) -> [String: Any] {
        return [
            "user_id": userId,
            "signals": [
                "device_model":      signals.deviceModel,
                "os_version":        signals.osVersion,
                "screen_resolution": signals.screenResolution,
                "app_install_id":    signals.appInstallId,
                "sim_country":       signals.simCountry,
                "carrier":           signals.carrier,
                "ip_address":        signals.ipAddress,
                "timezone":          signals.timezone,
                "locale":            signals.locale,
                "is_rooted":         signals.isRooted,
                "is_emulator":       signals.isEmulator,
                "is_jailbroken":     signals.isJailbroken,
                "app_hash":          signals.appHash,
            ]
        ]
    }

    private func buildValidateBody(userId: String, token: String,
                                   fingerprint: String, signals: DeviceSignals) -> [String: Any] {
        return [
            "user_id":            userId,
            "device_token":       token,
            "device_fingerprint": fingerprint,
            "ip_address":         signals.ipAddress,
            "sim_country":        signals.simCountry,
        ]
    }

    public enum BindingError: Error {
        case invalidURL
        case invalidResponse
    }
}
