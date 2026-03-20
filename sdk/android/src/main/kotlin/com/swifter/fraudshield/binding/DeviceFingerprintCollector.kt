package com.swifter.fraudshield.binding

import android.content.Context
import android.os.Build
import android.provider.Settings
import android.telephony.TelephonyManager
import android.util.DisplayMetrics
import android.view.WindowManager
import java.io.File
import java.security.MessageDigest
import java.util.Locale
import java.util.TimeZone
import java.util.UUID

/**
 * DeviceFingerprintCollector
 *
 * Collects 13 hardware-stable device signals and computes a deterministic SHA-256
 * device fingerprint. The signals match those used by the backend hasher exactly.
 *
 * Signals that change legitimately (IP address) are excluded from the fingerprint
 * but still returned for geolocation checks by the server.
 */
class DeviceFingerprintCollector(private val context: Context) {

    data class DeviceSignals(
        val deviceModel: String,
        val osVersion: String,
        val screenResolution: String,
        val appInstallId: String,
        val simCountry: String,
        val carrier: String,
        val ipAddress: String,
        val timezone: String,
        val locale: String,
        val isRooted: Boolean,
        val isEmulator: Boolean,
        val isJailbroken: Boolean,   // always false on Android; kept for API parity with iOS
        val appHash: String,
    )

    /** Collect all signals synchronously. Call from a background thread. */
    fun collect(): DeviceSignals {
        val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        return DeviceSignals(
            deviceModel      = "${Build.MANUFACTURER} ${Build.MODEL}",
            osVersion        = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
            screenResolution = getScreenResolution(),
            appInstallId     = getOrCreateInstallId(),
            simCountry       = tm?.simCountryIso?.uppercase(Locale.ROOT) ?: "",
            carrier          = tm?.networkOperatorName ?: "",
            ipAddress        = "",  // resolved server-side from HTTP request IP
            timezone         = TimeZone.getDefault().id,
            locale           = Locale.getDefault().toLanguageTag(),
            isRooted         = detectRoot(),
            isEmulator       = detectEmulator(),
            isJailbroken     = false,
            appHash          = getAppHash(),
        )
    }

    /** Generate SHA-256 fingerprint from the stable subset of signals (mirrors backend logic). */
    fun generateFingerprint(signals: DeviceSignals): String {
        val parts = listOf(
            "device_model:${signals.deviceModel.lowercase()}",
            "os_version:${signals.osVersion.lowercase()}",
            "screen_resolution:${signals.screenResolution.lowercase()}",
            "app_install_id:${signals.appInstallId.lowercase()}",
            "sim_country:${signals.simCountry.lowercase()}",
            "carrier:${signals.carrier.lowercase()}",
            "timezone:${signals.timezone.lowercase()}",
            "locale:${signals.locale.lowercase()}",
            "is_rooted:${signals.isRooted}",
            "is_emulator:${signals.isEmulator}",
            "is_jailbroken:${signals.isJailbroken}",
            "app_hash:${signals.appHash.lowercase()}",
        )
        return sha256(parts.joinToString("|"))
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private fun getScreenResolution(): String {
        val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        wm.defaultDisplay.getMetrics(metrics)
        return "${metrics.widthPixels}x${metrics.heightPixels}"
    }

    /**
     * Returns a stable per-installation UUID stored in SharedPreferences.
     * Survives app restarts; lost on uninstall. Used as the baseline stable ID.
     */
    private fun getOrCreateInstallId(): String {
        val prefs = context.getSharedPreferences("pg_device_prefs", Context.MODE_PRIVATE)
        var id = prefs.getString("install_id", null)
        if (id == null) {
            id = UUID.randomUUID().toString()
            prefs.edit().putString("install_id", id).apply()
        }
        return id
    }

    /** Returns the SHA-256 of APK signature → changes only on update-with-new-cert or tampering. */
    private fun getAppHash(): String {
        return try {
            val pi = context.packageManager.getPackageInfo(
                context.packageName, android.content.pm.PackageManager.GET_SIGNATURES
            )
            @Suppress("DEPRECATION")
            sha256(pi.signatures?.firstOrNull()?.toByteArray()?.toString() ?: "")
        } catch (_: Exception) { "" }
    }

    /** Basic root detection: checks for su binary and known root paths. */
    private fun detectRoot(): Boolean {
        val rootPaths = arrayOf(
            "/su", "/system/bin/su", "/system/xbin/su",
            "/sbin/su", "/system/su", "/system/bin/.ext/.su",
            "/system/usr/we-need-root/su-backup", "/system/xbin/mu",
        )
        return rootPaths.any { File(it).exists() }
    }

    /** Emulator detection: checks Build fields known to differ on real hardware. */
    private fun detectEmulator(): Boolean {
        val fingerprint = Build.FINGERPRINT.lowercase()
        val model = Build.MODEL.lowercase()
        val manufacturer = Build.MANUFACTURER.lowercase()
        val brand = Build.BRAND.lowercase()
        val device = Build.DEVICE.lowercase()
        return (fingerprint.contains("generic") || fingerprint.contains("unknown") ||
                model.contains("google sdk") || model.contains("emulator") ||
                model.contains("android sdk") || manufacturer.contains("genymotion") ||
                brand.startsWith("generic") || device.contains("emulator") ||
                Build.PRODUCT.contains("sdk_gphone") ||
                Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) == "000000000000000")
    }

    private fun sha256(input: String): String =
        sha256(input.toByteArray(Charsets.UTF_8))

    private fun sha256(bytes: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(bytes).joinToString("") { "%02x".format(it) }
    }
}
