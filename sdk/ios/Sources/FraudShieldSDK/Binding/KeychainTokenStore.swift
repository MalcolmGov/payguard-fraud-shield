import Foundation
import Security

/// KeychainTokenStore (iOS/Swift)
///
/// Stores device tokens in the iOS Keychain using kSecClassGenericPassword.
/// The token is protected with kSecAttrAccessibleAfterFirstUnlock so it's
/// available for background validation tasks (after first device unlock post-boot).
public final class KeychainTokenStore {

    private let service = "io.swifter.payguard.devicetoken"
    private let account = "device_binding_token"

    public init() {}

    /// Store a device token securely in the Keychain. Replaces any existing token.
    public func storeToken(_ token: String) throws {
        let data = Data(token.utf8)
        let query: [String: Any] = [
            kSecClass as String:            kSecClassGenericPassword,
            kSecAttrService as String:      service,
            kSecAttrAccount as String:      account,
            kSecValueData as String:        data,
            kSecAttrAccessible as String:   kSecAttrAccessibleAfterFirstUnlock,
        ]

        // Delete existing before insert
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.unhandledError(status: status)
        }
    }

    /// Retrieve the stored device token. Returns nil if not present.
    public func retrieveToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String:  true,
            kSecMatchLimit as String:  kSecMatchLimitOne,
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    /// Erase the stored token (on logout or blacklist event).
    public func clearToken() {
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(query as CFDictionary)
    }

    /// Returns true if a token is currently stored.
    public func hasToken() -> Bool {
        return retrieveToken() != nil
    }

    public enum KeychainError: Error {
        case unhandledError(status: OSStatus)
    }
}
