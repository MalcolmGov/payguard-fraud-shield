package com.swifter.fraudshield.collectors

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.provider.Settings
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.security.MessageDigest

data class DeviceSignals(
    val deviceId: String,
    val manufacturer: String,
    val model: String,
    val osVersion: String,
    val sdkVersion: Int,
    val isRooted: Boolean,
    val isEmulator: Boolean,
    val isAppTampered: Boolean,
    val buildFingerprint: String
)

class DeviceCollector(private val context: Context) {

    fun collect(): DeviceSignals {
        return DeviceSignals(
            deviceId = getDeviceId(),
            manufacturer = Build.MANUFACTURER,
            model = Build.MODEL,
            osVersion = Build.VERSION.RELEASE,
            sdkVersion = Build.VERSION.SDK_INT,
            isRooted = detectRoot(),
            isEmulator = detectEmulator(),
            isAppTampered = detectTampering(),
            buildFingerprint = Build.FINGERPRINT
        )
    }

    @SuppressLint("HardwareIds")
    private fun getDeviceId(): String {
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown"
        val raw = "${androidId}:${Build.MANUFACTURER}:${Build.MODEL}:${Build.HARDWARE}"
        return sha256(raw)
    }

    private fun detectRoot(): Boolean {
        // Check 1: Common su binary locations
        val suPaths = listOf(
            "/system/bin/su", "/system/xbin/su", "/sbin/su",
            "/system/su", "/system/bin/.ext/.su",
            "/system/usr/we-need-root/su-backup",
            "/system/xbin/mu"
        )
        if (suPaths.any { File(it).exists() }) return true

        // Check 2: Build tags (test-keys indicate rooted images)
        val buildTags = Build.TAGS
        if (buildTags != null && buildTags.contains("test-keys")) return true

        // Check 3: Try executing su
        return try {
            val process = Runtime.getRuntime().exec(arrayOf("/system/xbin/which", "su"))
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            reader.readLine() != null
        } catch (e: Exception) {
            false
        }
    }

    private fun detectEmulator(): Boolean {
        // Check build properties common to emulators
        val emulatorMarkers = listOf(
            Build.FINGERPRINT.startsWith("generic"),
            Build.FINGERPRINT.startsWith("unknown"),
            Build.MODEL.contains("google_sdk"),
            Build.MODEL.contains("Emulator"),
            Build.MODEL.contains("Android SDK built for x86"),
            Build.MANUFACTURER.contains("Genymotion"),
            Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"),
            Build.PRODUCT == "google_sdk" || Build.PRODUCT == "sdk" || Build.PRODUCT == "sdk_x86",
            Build.HARDWARE == "goldfish" || Build.HARDWARE == "ranchu"
        )
        if (emulatorMarkers.any { it }) return true

        // Check QEMU properties
        return try {
            val props = Runtime.getRuntime().exec("getprop ro.kernel.qemu")
            val reader = BufferedReader(InputStreamReader(props.inputStream))
            reader.readLine()?.trim() == "1"
        } catch (e: Exception) {
            false
        }
    }

    private fun detectTampering(): Boolean {
        // Check package signature integrity
        return try {
            val packageInfo = context.packageManager.getPackageInfo(
                context.packageName,
                @Suppress("DEPRECATION") android.content.pm.PackageManager.GET_SIGNATURES
            )
            @Suppress("DEPRECATION")
            val signatures = packageInfo.signatures
            if (signatures == null || signatures.isEmpty()) return true

            // In production, compare against your known signing certificate hash
            val sigHash = sha256(signatures[0].toByteArray().contentToString())
            // TODO: Replace with your actual release signing cert hash
            val knownCertHash = "REPLACE_WITH_YOUR_CERT_HASH"
            sigHash != knownCertHash // returns true only in production if tampered
            false // Dev mode: always pass
        } catch (e: Exception) {
            true // If we can't read package info, assume tampered
        }
    }

    private fun sha256(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
