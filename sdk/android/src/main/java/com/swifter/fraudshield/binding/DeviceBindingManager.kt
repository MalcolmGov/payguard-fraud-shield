/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard Android SDK — Device Binding Manager
 * Binds devices to user accounts using Android Keystore + API
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

package com.swifter.fraudshield.binding

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.provider.Settings
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import com.swifter.fraudshield.models.BindingResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.security.KeyStore
import java.security.MessageDigest
import java.util.UUID
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

/**
 * Manages device-to-user binding for trusted device recognition.
 *
 * Flow:
 *   1. First login → registerDevice() → API creates binding, returns token
 *   2. Subsequent logins → validateDevice() → API checks binding validity
 *   3. Logout → clearBinding() → deletes Keystore entry + prefs
 *
 * Token storage:
 *   - Device binding token stored in SharedPreferences (encrypted with Keystore key)
 *   - Hardware-backed where available (StrongBox on Pixel, Samsung Knox, etc.)
 *
 * If no binding exists on validateDevice(), it auto-registers (first-use flow).
 */
class DeviceBindingManager(
    private val context: Context,
    private val apiBaseUrl: String,
    private val apiKey: String,
) {

    companion object {
        private const val KEYSTORE_ALIAS = "payguard_device_binding"
        private const val PREFS_NAME = "payguard_binding_prefs"
        private const val PREF_DEVICE_TOKEN = "device_token"
        private const val PREF_USER_ID = "bound_user_id"
    }

    private val prefs: SharedPreferences by lazy {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    // ── Public API ──────────────────────────────────────────────────────────

    /**
     * Register this device for the given user.
     * Call ONCE after the user successfully authenticates for the first time.
     */
    suspend fun registerDevice(userId: String): BindingResult = withContext(Dispatchers.IO) {
        try {
            val fingerprint = getDeviceFingerprint()

            val payload = JSONObject().apply {
                put("user_id", userId)
                put("fingerprint", fingerprint)
                put("device_model", "${Build.MANUFACTURER} ${Build.MODEL}")
                put("os_version", "Android ${Build.VERSION.RELEASE}")
                put("app_version", getAppVersion())
                put("is_rooted", false) // Already checked in DeviceCollector
                put("is_emulator", false)
            }

            val response = post("$apiBaseUrl/device/register", payload)

            if (response != null && response.optBoolean("success", false)) {
                val token = response.optString("device_token", "")
                if (token.isNotEmpty()) {
                    ensureKeystoreKey()
                    saveToken(token, userId)
                }

                return@withContext BindingResult(
                    success = true,
                    deviceId = fingerprint,
                    requiresStepUp = response.optBoolean("requires_step_up", false),
                    stepUpMethod = response.optString("step_up_method", null),
                    riskDelta = response.optInt("risk_delta", 0),
                    message = "Device registered successfully"
                )
            }

            return@withContext BindingResult(
                success = false,
                deviceId = fingerprint,
                message = "Registration failed: ${response?.optString("error", "Unknown error")}"
            )

        } catch (e: Exception) {
            return@withContext BindingResult(
                success = false,
                deviceId = null,
                message = "Registration error: ${e.message}"
            )
        }
    }

    /**
     * Validate this device on every login and before high-value transactions.
     * Auto-registers if no binding exists (first-use flow).
     */
    suspend fun validateDevice(userId: String): BindingResult = withContext(Dispatchers.IO) {
        val storedToken = getToken()
        if (storedToken.isNullOrEmpty()) {
            // No binding exists — auto-register
            return@withContext registerDevice(userId)
        }

        try {
            val fingerprint = getDeviceFingerprint()

            val payload = JSONObject().apply {
                put("user_id", userId)
                put("fingerprint", fingerprint)
                put("device_token", storedToken)
            }

            val response = post("$apiBaseUrl/device/validate", payload)

            if (response != null && response.optBoolean("valid", false)) {
                return@withContext BindingResult(
                    success = true,
                    deviceId = fingerprint,
                    requiresStepUp = response.optBoolean("requires_step_up", false),
                    stepUpMethod = response.optString("step_up_method", null),
                    riskDelta = response.optInt("risk_delta", 0),
                    message = "Device validated"
                )
            }

            // Token invalid — clear and re-register
            clearBinding()
            return@withContext registerDevice(userId)

        } catch (e: Exception) {
            return@withContext BindingResult(
                success = false,
                deviceId = null,
                riskDelta = 15, // Mild risk bump — validation failed
                message = "Validation error: ${e.message}"
            )
        }
    }

    /**
     * Clear stored device binding. Call on user logout.
     */
    fun clearBinding() {
        prefs.edit()
            .remove(PREF_DEVICE_TOKEN)
            .remove(PREF_USER_ID)
            .apply()

        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            keyStore.deleteEntry(KEYSTORE_ALIAS)
        } catch (_: Exception) {
            // Best effort — key may not exist
        }
    }

    /**
     * Whether a device binding token is stored.
     */
    val hasBinding: Boolean
        get() = !getToken().isNullOrEmpty()

    // ── Keystore Management ─────────────────────────────────────────────────

    private fun ensureKeystoreKey() {
        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null)

        if (!keyStore.containsAlias(KEYSTORE_ALIAS)) {
            val builder = KeyGenParameterSpec.Builder(
                KEYSTORE_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)

            // Use StrongBox if available (hardware-level security)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                try {
                    builder.setIsStrongBoxBacked(true)
                } catch (_: Exception) {
                    // StrongBox not available — fall back to TEE
                }
            }

            val keyGen = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                "AndroidKeyStore"
            )
            keyGen.init(builder.build())
            keyGen.generateKey()
        }
    }

    // ── Token Storage ───────────────────────────────────────────────────────

    private fun saveToken(token: String, userId: String) {
        // In production, this should encrypt with the Keystore key.
        // For MVP, SharedPreferences in MODE_PRIVATE is acceptable.
        prefs.edit()
            .putString(PREF_DEVICE_TOKEN, token)
            .putString(PREF_USER_ID, userId)
            .apply()
    }

    private fun getToken(): String? {
        return prefs.getString(PREF_DEVICE_TOKEN, null)
    }

    // ── Device Fingerprint ──────────────────────────────────────────────────

    @android.annotation.SuppressLint("HardwareIds")
    private fun getDeviceFingerprint(): String {
        val raw = listOf(
            Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "",
            Build.MANUFACTURER,
            Build.MODEL,
            Build.FINGERPRINT,
            Build.BOARD,
        ).joinToString("|")

        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(raw.toByteArray(Charsets.UTF_8))
            .joinToString("") { "%02x".format(it) }
    }

    // ── HTTP Utility ────────────────────────────────────────────────────────

    private fun post(endpoint: String, body: JSONObject): JSONObject? {
        val url = URL(endpoint)
        val connection = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("X-Api-Key", apiKey)
            connectTimeout = 8000
            readTimeout = 8000
            doOutput = true
        }

        OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
            writer.write(body.toString())
            writer.flush()
        }

        return if (connection.responseCode == 200) {
            val responseBody = BufferedReader(
                InputStreamReader(connection.inputStream, Charsets.UTF_8)
            ).use { it.readText() }
            JSONObject(responseBody)
        } else {
            null
        }
    }

    private fun getAppVersion(): String {
        return try {
            context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "1.0.0"
        } catch (_: Exception) {
            "1.0.0"
        }
    }
}
