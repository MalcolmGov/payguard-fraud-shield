/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard Android SDK — Device Collector
 * Collects device fingerprint, root, emulator, and tamper signals
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

package com.swifter.fraudshield.collectors

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.provider.Settings
import com.swifter.fraudshield.models.DeviceSignals
import java.io.File
import java.security.MessageDigest

class DeviceCollector(private val context: Context) {

    suspend fun collect(): DeviceSignals {
        return DeviceSignals(
            deviceId    = getDeviceId(),
            manufacturer = Build.MANUFACTURER,
            model       = Build.MODEL,
            osVersion   = Build.VERSION.RELEASE,
            isRooted    = detectRoot(),
            isEmulator  = detectEmulator(),
            isAppTampered = detectTamper()
        )
    }

    // ── Device ID (SHA-256 hash of Android ID) ──────────────────────────────

    @SuppressLint("HardwareIds")
    private fun getDeviceId(): String {
        val androidId = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        ) ?: "unknown"
        return sha256(androidId)
    }

    // ── Root Detection ──────────────────────────────────────────────────────

    private fun detectRoot(): Boolean {
        // Method 1: su binary exists
        val suPaths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
        )
        if (suPaths.any { File(it).exists() }) return true

        // Method 2: test-keys in build fingerprint (common on rooted custom ROMs)
        if (Build.TAGS?.contains("test-keys") == true) return true

        // Method 3: Magisk paths
        val magiskPaths = arrayOf(
            "/sbin/.magisk",
            "/data/adb/magisk",
            "/data/adb/modules",
        )
        if (magiskPaths.any { File(it).exists() }) return true

        // Method 4: Try running su command
        return try {
            Runtime.getRuntime().exec("su")
            true
        } catch (_: Exception) {
            false
        }
    }

    // ── Emulator Detection ──────────────────────────────────────────────────

    private fun detectEmulator(): Boolean {
        val fingerprint = Build.FINGERPRINT.lowercase()
        val model = Build.MODEL.lowercase()
        val brand = Build.BRAND.lowercase()
        val device = Build.DEVICE.lowercase()
        val product = Build.PRODUCT.lowercase()
        val hardware = Build.HARDWARE.lowercase()

        // Known emulator fingerprints
        if (fingerprint.startsWith("generic") || fingerprint.startsWith("unknown")) return true
        if (fingerprint.contains("sdk_gphone")) return true

        // Known emulator models
        val emulatorModels = setOf("sdk", "emulator", "simulator", "android sdk built for x86")
        if (emulatorModels.any { model.contains(it) }) return true

        // Known emulator brands/devices
        if (brand.startsWith("generic") || brand == "google" && device.contains("emulator")) return true
        if (product.contains("sdk") || product.contains("emulator")) return true

        // Goldfish / Ranchu (QEMU-based emulators)
        if (hardware.contains("goldfish") || hardware.contains("ranchu")) return true

        // Missing hardware indicators
        if (Build.BOARD.lowercase() == "unknown" && Build.BOOTLOADER.lowercase() == "unknown") return true

        return false
    }

    // ── App Tamper Detection ────────────────────────────────────────────────

    private fun detectTamper(): Boolean {
        val info = context.packageManager.getApplicationInfo(context.packageName, 0)

        // Method 1: Debuggable flag (should be false in production)
        if (info.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE != 0) return true

        // Method 2: Installer package check — Google Play vs sideloaded
        @Suppress("DEPRECATION")
        val installer = context.packageManager.getInstallerPackageName(context.packageName)
        val trustedInstallers = setOf(
            "com.android.vending",          // Google Play
            "com.google.android.packageinstaller",
            "com.samsung.android.packageinstaller",
            "com.huawei.appmarket",
        )
        // Only flag if there IS an installer and it's not trusted, OR no installer at all (sideload)
        // We don't flag no-installer in debug/development, so we only flag if explicitly unknown
        if (installer != null && installer !in trustedInstallers) return true

        return false
    }

    // ── Utility ─────────────────────────────────────────────────────────────

    private fun sha256(input: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(input.toByteArray(Charsets.UTF_8))
        return hash.joinToString("") { "%02x".format(it) }
    }
}
