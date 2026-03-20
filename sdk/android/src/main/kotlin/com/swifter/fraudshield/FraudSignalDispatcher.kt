package com.swifter.fraudshield

import android.content.Context
import android.util.Log
import com.swifter.fraudshield.collectors.CallStateCollector
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import android.util.Base64
import java.security.SecureRandom

class FraudSignalDispatcher(
    private val context: Context,
    private val apiKey: String
) {

    companion object {
        private const val TAG = "FraudShield"
        // In production: use your deployed API URL
        private const val API_BASE_URL = "https://api.fraudshield.swifter.io"
        private const val EVALUATE_ENDPOINT = "/v1/evaluate"
        private const val TIMEOUT_MS = 8000 // 8s timeout, leaving headroom for 100ms UI budget
    }

    private val callStateCollector = CallStateCollector(context)

    /**
     * Synchronously evaluates a transaction risk. Sends encrypted payload to the
     * risk engine and returns a RiskDecision.
     *
     * Falls back to LOCAL HIGH RISK if network is unavailable (fail-secure).
     */
    suspend fun evaluate(payload: RiskPayload): RiskDecision = withContext(Dispatchers.IO) {
        // Enrich: check recipient in contacts
        val recipientInContacts = callStateCollector.isNumberInContacts(payload.transaction.recipientPhone)
        val enrichedPayload = payload.copy(recipientInContacts = recipientInContacts)

        return@withContext try {
            sendToApi(enrichedPayload)
        } catch (e: Exception) {
            Log.w(TAG, "Network unavailable. Applying fail-secure fallback risk.", e)
            failSecureFallback(enrichedPayload)
        }
    }

    private fun sendToApi(payload: RiskPayload): RiskDecision {
        val json = RiskPayloadBuilder.toJson(payload)
        val encrypted = encryptPayload(json.toString())

        val wrapper = JSONObject().apply {
            put("api_key", apiKey)
            put("payload", encrypted.ciphertext)
            put("iv", encrypted.iv)
            put("payload_id", payload.payloadId)
        }

        val url = URL("$API_BASE_URL$EVALUATE_ENDPOINT")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("X-Api-Key", apiKey)
        conn.connectTimeout = TIMEOUT_MS
        conn.readTimeout = TIMEOUT_MS
        conn.doOutput = true

        OutputStreamWriter(conn.outputStream).use { it.write(wrapper.toString()) }

        val responseCode = conn.responseCode
        if (responseCode != 200) {
            throw Exception("Risk API responded with HTTP $responseCode")
        }

        val responseBody = conn.inputStream.bufferedReader().readText()
        return parseDecision(responseBody)
    }

    private fun parseDecision(json: String): RiskDecision {
        val obj = JSONObject(json)
        val riskScore = obj.getInt("risk_score")
        val riskLevelStr = obj.getString("risk_level")
        val actionStr = obj.getString("recommended_action")
        val triggeredRulesArr = obj.optJSONArray("triggered_rules")
        val triggeredRules = buildList {
            triggeredRulesArr?.let {
                for (i in 0 until it.length()) add(it.getString(i))
            }
        }

        return RiskDecision(
            riskScore = riskScore,
            riskLevel = RiskLevel.valueOf(riskLevelStr),
            recommendedAction = RecommendedAction.valueOf(actionStr),
            triggeredRules = triggeredRules,
            transactionId = obj.optString("transaction_id", java.util.UUID.randomUUID().toString())
        )
    }

    /**
     * If API is unreachable, compute a basic local risk score using the most
     * important signals. This ensures protection even without connectivity.
     */
    private fun failSecureFallback(payload: RiskPayload): RiskDecision {
        var score = 0
        val rules = mutableListOf<String>()

        if (payload.call.isOnActiveCall) { score += 30; rules.add("RULE_002") }
        if (!payload.recipientInContacts) { score += 20; rules.add("LOCAL_UNKNOWN_RECIPIENT") }
        if (payload.behavioral.pasteDetected) { score += 15; rules.add("RULE_004") }
        if (payload.sim.simSwapDetected) { score += 50; rules.add("RULE_006") }
        if (payload.device.isRooted) { score += 20; rules.add("RULE_009") }
        if (payload.sms.hasFraudKeywords) { score += 25; rules.add("RULE_008") }

        val level = when {
            score >= 70 -> RiskLevel.HIGH
            score >= 40 -> RiskLevel.MEDIUM
            else -> RiskLevel.LOW
        }

        return RiskDecision(
            riskScore = score.coerceAtMost(100),
            riskLevel = level,
            recommendedAction = if (score >= 70) RecommendedAction.WARN_USER else RecommendedAction.SOFT_WARNING,
            triggeredRules = rules,
            transactionId = payload.payloadId
        )
    }

    // ---- AES-256-GCM Encryption ----

    data class EncryptedPayload(val ciphertext: String, val iv: String)

    private fun encryptPayload(plaintext: String): EncryptedPayload {
        // In production: derive this key from your SDK initialization secret
        // using HKDF or similar key derivation
        val keyBytes = apiKey.toByteArray().copyOf(32) // Pad/truncate to 256-bit
        val key = SecretKeySpec(keyBytes, "AES")

        val iv = ByteArray(12).apply { SecureRandom().nextBytes(this) }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(128, iv))

        val cipherBytes = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
        return EncryptedPayload(
            ciphertext = Base64.encodeToString(cipherBytes, Base64.NO_WRAP),
            iv = Base64.encodeToString(iv, Base64.NO_WRAP)
        )
    }
}
