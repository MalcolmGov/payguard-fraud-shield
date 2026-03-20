import Foundation
import UIKit
import Security

struct DeviceSignals {
    let deviceId: String
    let manufacturer: String
    let model: String
    let osVersion: String
    let isJailbroken: Bool
    let isSimulator: Bool
    let isAppTampered: Bool
}

class DeviceCollector {

    func collect() async -> DeviceSignals {
        return DeviceSignals(
            deviceId: getDeviceId(),
            manufacturer: "Apple",
            model: UIDevice.current.model,
            osVersion: UIDevice.current.systemVersion,
            isJailbroken: detectJailbreak(),
            isSimulator: detectSimulator(),
            isAppTampered: detectTampering()
        )
    }

    private func getDeviceId() -> String {
        // IDFV persists within the same vendor — stable across app reinstalls
        let idfv = UIDevice.current.identifierForVendor?.uuidString ?? "unknown"
        let model = UIDevice.current.model
        let raw = "\(idfv):\(model)"
        return sha256(raw)
    }

    private func detectJailbreak() -> Bool {
        #if targetEnvironment(simulator)
        return false
        #else
        // Check 1: Cydia and common jailbreak paths
        let jailbreakPaths = [
            "/Applications/Cydia.app",
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/bin/bash",
            "/usr/sbin/sshd",
            "/etc/apt",
            "/usr/bin/ssh",
            "/private/var/lib/apt"
        ]
        if jailbreakPaths.contains(where: { FileManager.default.fileExists(atPath: $0) }) {
            return true
        }

        // Check 2: Write to a path outside sandbox
        let testPath = "/private/jailbreak_test.txt"
        do {
            try "jailbreak".write(toFile: testPath, atomically: true, encoding: .utf8)
            try FileManager.default.removeItem(atPath: testPath)
            return true // Was able to write outside sandbox — jailbroken
        } catch {}

        // Check 3: Symbolic link to Applications
        if let _ = try? FileManager.default.destinationOfSymbolicLink(atPath: "/Applications") {
            return true
        }

        return false
        #endif
    }

    private func detectSimulator() -> Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }

    private func detectTampering() -> Bool {
        // Check if the app was modified (e.g., IPA re-signed)
        // In production, compare against known valid bundle ID + team ID
        guard let bundleId = Bundle.main.bundleIdentifier else { return true }
        let knownBundleId = "com.swifter.momo" // Replace with your MoMo app bundle ID
        return !bundleId.hasPrefix("com.swifter") // Flexible check for dev
    }

    private func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes { _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash) }
        return hash.map { String(format: "%02x", $0) }.joined()
    }
}
