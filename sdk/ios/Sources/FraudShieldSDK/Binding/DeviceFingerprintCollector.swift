import Foundation
import UIKit
import CoreTelephony
import CryptoKit

/// DeviceFingerprintCollector (iOS/Swift)
///
/// Collects 13 hardware-stable device signals and computes a deterministic
/// SHA-256 fingerprint. Signal names and ordering match the Android SDK exactly
/// so the backend's fingerprint hasher produces the same hash for the same device.
public struct DeviceSignals {
    public let deviceModel:      String
    public let osVersion:        String
    public let screenResolution: String
    public let appInstallId:     String
    public let simCountry:       String
    public let carrier:          String
    public let ipAddress:        String
    public let timezone:         String
    public let locale:           String
    public let isRooted:         Bool   // jailbreak detection on iOS
    public let isEmulator:       Bool
    public let isJailbroken:     Bool
    public let appHash:          String
}

public final class DeviceFingerprintCollector {

    public init() {}

    /// Collect all device signals. Call from a background thread.
    public func collect() -> DeviceSignals {
        let device = UIDevice.current
        let screen = UIScreen.main.bounds
        let info   = CTTelephonyNetworkInfo()
        let carrier: CTCarrier?
        if #available(iOS 16, *) {
            carrier = nil // CTCarrier deprecated in iOS 16; SIM country unavailable without entitlement
        } else {
            carrier = info.subscriberCellularProvider
        }

        return DeviceSignals(
            deviceModel:      "\(device.model) \(deviceModelName())",
            osVersion:        "iOS \(device.systemVersion)",
            screenResolution: "\(Int(screen.width))x\(Int(screen.height))",
            appInstallId:     getOrCreateInstallId(),
            simCountry:       carrier?.isoCountryCode?.uppercased() ?? "",
            carrier:          carrier?.carrierName ?? "",
            ipAddress:        "",    // resolved server-side
            timezone:         TimeZone.current.identifier,
            locale:           Locale.current.identifier,
            isRooted:         detectJailbreak(),
            isEmulator:       isSimulator(),
            isJailbroken:     detectJailbreak(),
            appHash:          getAppHash()
        )
    }

    /// Generate SHA-256 fingerprint (must match backend field ordering exactly).
    public func generateFingerprint(_ signals: DeviceSignals) -> String {
        let parts = [
            "device_model:\(signals.deviceModel.lowercased())",
            "os_version:\(signals.osVersion.lowercased())",
            "screen_resolution:\(signals.screenResolution.lowercased())",
            "app_install_id:\(signals.appInstallId.lowercased())",
            "sim_country:\(signals.simCountry.lowercased())",
            "carrier:\(signals.carrier.lowercased())",
            "timezone:\(signals.timezone.lowercased())",
            "locale:\(signals.locale.lowercased())",
            "is_rooted:\(signals.isRooted)",
            "is_emulator:\(signals.isEmulator)",
            "is_jailbroken:\(signals.isJailbroken)",
            "app_hash:\(signals.appHash.lowercased())",
        ]
        let raw = parts.joined(separator: "|")
        let data = Data(raw.utf8)
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }

    // MARK: - Private helpers

    private func getOrCreateInstallId() -> String {
        let key = "PayGuardInstallId"
        if let existing = UserDefaults.standard.string(forKey: key) { return existing }
        let newId = UUID().uuidString
        UserDefaults.standard.set(newId, forKey: key)
        return newId
    }

    private func detectJailbreak() -> Bool {
        #if targetEnvironment(simulator)
        return false
        #else
        let paths = [
            "/Applications/Cydia.app", "/usr/sbin/sshd",
            "/bin/bash", "/etc/apt", "/usr/bin/ssh",
            "/private/var/lib/apt", "/private/var/mobile/Library/SBSettings",
        ]
        for path in paths {
            if FileManager.default.fileExists(atPath: path) { return true }
        }
        // Try writing to /private — will fail on non-jailbroken
        let testStr = "jb_test"
        do {
            try testStr.write(toFile: "/private/jb_test.txt",
                              atomically: true, encoding: .utf8)
            try FileManager.default.removeItem(atPath: "/private/jb_test.txt")
            return true
        } catch { return false }
        #endif
    }

    private func isSimulator() -> Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }

    private func deviceModelName() -> String {
        var sysinfo = utsname()
        uname(&sysinfo)
        return withUnsafePointer(to: &sysinfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) { String(cString: $0) }
        }
    }

    private func getAppHash() -> String {
        guard let bundlePath = Bundle.main.executablePath,
              let data = FileManager.default.contents(atPath: bundlePath) else { return "" }
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }
}
