/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard Android SDK — Fraud Signal Dispatcher
 * HTTP client that sends risk payloads to the API and parses decisions
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

package com.swifter.fraudshield.network

import com.swifter.fraudshield.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

/**
 * Handles all HTTP communication with the PayGuard API.
 *
 * Uses HttpURLConnection (zero external dependencies — ships with Android).
 * Includes a fail-secure offline fallback that scores locally using critical
 * rules when the API is unreachable.
 */
class FraudSignalDispatcher(
    private val apiKey: String,
    private val baseUrl: String,
    private val timeout: Long = 8000L,
) {

    companion object {
        /** Shared instance for fire-and-forget event dispatch (e.g., OtpGuard signals). */
        var shared: FraudSignalDispatcher? = null
    }

    // ── Evaluate Transaction ────────────────────────────────────────────────

    /**
     * Sends the risk payload to /v1/evaluate and returns a RiskDecision.
     * Falls back to local scoring if the API is unreachable.
     */
    suspend fun evaluate(payload: RiskPayload): RiskDecision = withContext(Dispatchers.IO) {
        try {
            val url = URL("$baseUrl/v1/evaluate")
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("X-Api-Key", apiKey)
                setRequestProperty("X-PayGuard-SDK", "android/1.0.0")
                connectTimeout = timeout.toInt()
                readTimeout = timeout.toInt()
                doOutput = true
            }

            // Send payload
            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(payload.toJson().toString())
                writer.flush()
            }

            // Parse response
            if (connection.responseCode == 200) {
                val responseBody = BufferedReader(
                    InputStreamReader(connection.inputStream, Charsets.UTF_8)
                ).use { it.readText() }

                return@withContext parseDecision(responseBody, payload.payloadId)
            }

            // Non-200 — fall back to local scoring
            return@withContext failSecureFallback(payload)

        } catch (_: Exception) {
            // Network error — fall back to local scoring
            return@withContext failSecureFallback(payload)
        }
    }

    // ── Fire-and-forget Event Dispatch (for OtpGuard signals) ───────────────

    /**
     * Dispatches a risk event asynchronously without expecting a decision.
     * Used by OtpGuard to send OTP_SCREEN_ON_CALL signals.
     */
    suspend fun dispatchEvent(event: Map<String, Any>) = withContext(Dispatchers.IO) {
        try {
            val url = URL("$baseUrl/v1/signals")
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("X-Api-Key", apiKey)
                connectTimeout = 5000
                readTimeout = 5000
                doOutput = true
            }

            val json = JSONObject(event)
            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(json.toString())
                writer.flush()
            }

            // Read response code to complete the request
            connection.responseCode
        } catch (_: Exception) {
            // Non-blocking — event dispatch should never break the user flow
        }
    }

    // ── Response Parsing ────────────────────────────────────────────────────

    private fun parseDecision(responseBody: String, fallbackTxId: String): RiskDecision {
        val json = JSONObject(responseBody)

        val riskLevel = try {
            RiskLevel.valueOf(json.optString("risk_level", "MEDIUM").uppercase())
        } catch (_: Exception) {
            RiskLevel.MEDIUM
        }

        val action = try {
            RecommendedAction.valueOf(json.optString("recommended_action", "SOFT_WARNING").uppercase())
        } catch (_: Exception) {
            RecommendedAction.SOFT_WARNING
        }

        val triggeredRules = mutableListOf<String>()
        val rulesArray = json.optJSONArray("triggered_rules")
        if (rulesArray != null) {
            for (i in 0 until rulesArray.length()) {
                triggeredRules.add(rulesArray.getString(i))
            }
        }

        return RiskDecision(
            riskScore         = json.optInt("risk_score", 0),
            riskLevel         = riskLevel,
            recommendedAction = action,
            triggeredRules    = triggeredRules,
            transactionId     = json.optString("transaction_id", fallbackTxId)
        )
    }

    // ── Fail-Secure Local Fallback ──────────────────────────────────────────

    /**
     * Offline scoring using critical rules when the API is unreachable.
     * This ensures the SDK provides SOME protection even without connectivity.
     *
     * Matches the iOS failSecureFallback logic exactly.
     */
    private fun failSecureFallback(payload: RiskPayload): RiskDecision {
        var score = 0
        val rules = mutableListOf<String>()

        // RULE_002: On active call
        if (payload.call.isOnActiveCall) {
            score += 30
            rules.add("RULE_002")
        }

        // LOCAL: Unknown recipient (not in contacts)
        if (!payload.recipientInContacts) {
            score += 20
            rules.add("LOCAL_UNKNOWN_RECIPIENT")
        }

        // RULE_004: Paste detected in recipient field
        if (payload.behavioral.pasteDetected) {
            score += 15
            rules.add("RULE_004")
        }

        // RULE_009: Rooted device
        if (payload.device.isRooted) {
            score += 20
            rules.add("RULE_009")
        }

        // RULE_011: Emulator detected
        if (payload.device.isEmulator) {
            score += 40
            rules.add("RULE_011")
        }

        val level = when {
            score >= 60 -> RiskLevel.HIGH
            score >= 30 -> RiskLevel.MEDIUM
            else        -> RiskLevel.LOW
        }

        val action = when {
            score >= 60 -> RecommendedAction.WARN_USER
            score >= 30 -> RecommendedAction.SOFT_WARNING
            else        -> RecommendedAction.APPROVE
        }

        return RiskDecision(
            riskScore         = minOf(score, 100),
            riskLevel         = level,
            recommendedAction = action,
            triggeredRules    = rules,
            transactionId     = payload.payloadId
        )
    }
}
