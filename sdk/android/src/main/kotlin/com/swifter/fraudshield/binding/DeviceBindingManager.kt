package com.swifter.fraudshield.binding

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * DeviceBindingManager
 *
 * Orchestrates device registration and validation against the PayGuard backend.
 * Handles:
 *  - Signal collection + fingerprint generation
 *  - Secure token storage in Android Keystore
 *  - POST /v1/device/register (on first login)
 *  - POST /v1/device/validate (on every login + transaction)
 *  - Step-up authentication enforcement
 */
class DeviceBindingManager(
    private val context: Context,
    private val apiBaseUrl: String,
    private val apiKey: String,
) {
    private val fingerprintCollector = DeviceFingerprintCollector(context)
    private val tokenStore           = KeystoreTokenStore(context)

    data class BindingResult(
        val deviceStatus: String,   // "trusted" | "new_device" | "suspicious_device"
        val requiresStepUp: Boolean,
        val stepUpMethod: String?,  // "otp_verification" | "biometric" | "email_verification"
        val riskDelta: Int,
        val triggeredRules: List<String>,
    )

    /**
     * Register this device for the given user.
     * Must be called after a successful login to bind the device.
     * Stores the returned device token securely in Android Keystore.
     */
    suspend fun registerDevice(userId: String): BindingResult = withContext(Dispatchers.IO) {
        val signals     = fingerprintCollector.collect()
        val fingerprint = fingerprintCollector.generateFingerprint(signals)

        val body = buildRegisterBody(userId, fingerprint, signals)
        val response = postJson("$apiBaseUrl/v1/device/register", body)

        val token  = response.getString("device_token")
        val status = response.getString("device_status")

        // Store token securely in Keystore
        tokenStore.storeToken(token)

        BindingResult(
            deviceStatus   = status,
            requiresStepUp = status != "trusted",
            stepUpMethod   = response.optString("required_action").ifEmpty { null },
            riskDelta      = 0,
            triggeredRules = emptyList(),
        )
    }

    /**
     * Validate this device on every login and transaction.
     * Returns the risk delta to merge into the transaction risk score.
     * If step-up is required, the app should prompt before proceeding.
     */
    suspend fun validateDevice(userId: String): BindingResult = withContext(Dispatchers.IO) {
        val storedToken = tokenStore.retrieveToken()
        val signals     = fingerprintCollector.collect()
        val fingerprint = fingerprintCollector.generateFingerprint(signals)

        if (storedToken == null) {
            // No token stored — register as new device
            return@withContext registerDevice(userId)
        }

        val body = buildValidateBody(userId, storedToken, fingerprint, signals)
        val response = postJson("$apiBaseUrl/v1/device/validate", body)

        val status    = response.getString("device_status")
        val riskDelta = response.optInt("risk_delta", 0)
        val rules     = response.optJSONArray("triggered_rules")
        val rulesList = (0 until (rules?.length() ?: 0)).map { rules!!.getString(it) }

        // If token validation failed, re-register
        if (response.optString("validation_error").isNotEmpty()) {
            tokenStore.clearToken()
            return@withContext registerDevice(userId)
        }

        BindingResult(
            deviceStatus   = status,
            requiresStepUp = status != "trusted",
            stepUpMethod   = response.optString("required_action").ifEmpty { null },
            riskDelta      = riskDelta,
            triggeredRules = rulesList,
        )
    }

    /** Clear stored token on logout. */
    fun clearBinding() = tokenStore.clearToken()

    /** True if a device token is currently stored. */
    fun hasBinding(): Boolean = tokenStore.hasToken()

    // ── HTTP helpers ──────────────────────────────────────────────────────────

    private fun postJson(urlStr: String, body: JSONObject): JSONObject {
        val url  = URL(urlStr)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("x-api-key", apiKey)
            doOutput = true
            connectTimeout = 5_000
            readTimeout    = 8_000
        }
        OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use {
            it.write(body.toString())
        }

        val responseCode = conn.responseCode
        val responseBody = if (responseCode < 400) {
            conn.inputStream.bufferedReader().readText()
        } else {
            conn.errorStream?.bufferedReader()?.readText() ?: "{}"
        }
        conn.disconnect()
        return JSONObject(responseBody)
    }

    private fun buildRegisterBody(
        userId: String,
        fingerprint: String,
        signals: DeviceFingerprintCollector.DeviceSignals,
    ) = JSONObject().apply {
        put("user_id", userId)
        put("signals", JSONObject().apply {
            put("device_model",      signals.deviceModel)
            put("os_version",        signals.osVersion)
            put("screen_resolution", signals.screenResolution)
            put("app_install_id",    signals.appInstallId)
            put("sim_country",       signals.simCountry)
            put("carrier",           signals.carrier)
            put("ip_address",        signals.ipAddress)
            put("timezone",          signals.timezone)
            put("locale",            signals.locale)
            put("is_rooted",         signals.isRooted)
            put("is_emulator",       signals.isEmulator)
            put("is_jailbroken",     signals.isJailbroken)
            put("app_hash",          signals.appHash)
        })
    }

    private fun buildValidateBody(
        userId: String,
        token: String,
        fingerprint: String,
        signals: DeviceFingerprintCollector.DeviceSignals,
    ) = JSONObject().apply {
        put("user_id",            userId)
        put("device_token",       token)
        put("device_fingerprint", fingerprint)
        put("ip_address",         signals.ipAddress)
        put("sim_country",        signals.simCountry)
    }
}
