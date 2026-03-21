/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard Android SDK — Data Models
 * All data classes used across the SDK
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

package com.swifter.fraudshield.models

import org.json.JSONArray
import org.json.JSONObject

// ── Configuration ────────────────────────────────────────────────────────────

enum class Environment(val baseUrl: String) {
    SANDBOX("https://api-gateway-production-8d15.up.railway.app"),
    PRODUCTION("https://api.payguard.africa")
}

enum class LogLevel(val priority: Int) {
    DEBUG(0), INFO(1), WARN(2), ERROR(3), NONE(4)
}

data class PayGuardConfig(
    val apiKey: String,
    val userId: String,
    val environment: Environment = Environment.SANDBOX,
    val shadowMode: Boolean = false,
    val baseUrl: String? = null,
    val timeout: Long = 8000L,
    val failOpen: Boolean = true,
    val logLevel: LogLevel = LogLevel.WARN
)

// ── Transaction ──────────────────────────────────────────────────────────────

data class TransactionPayload(
    val recipientPhone: String,
    val amount: Double,
    val currency: String,
    val note: String? = null
)

// ── Risk Decision ────────────────────────────────────────────────────────────

enum class RiskLevel { LOW, MEDIUM, HIGH, CRITICAL }

enum class RecommendedAction { APPROVE, SOFT_WARNING, WARN_USER, BLOCK }

data class RiskDecision(
    val riskScore: Int,
    val riskLevel: RiskLevel,
    val recommendedAction: RecommendedAction,
    val triggeredRules: List<String>,
    val transactionId: String
)

// ── Signal Data Containers ───────────────────────────────────────────────────

data class DeviceSignals(
    val deviceId: String,
    val manufacturer: String,
    val model: String,
    val osVersion: String,
    val isRooted: Boolean,
    val isEmulator: Boolean,
    val isAppTampered: Boolean
)

data class NetworkSignals(
    val ipAddress: String,
    val isVpnActive: Boolean,
    val isProxySet: Boolean,
    val connectionType: String
)

data class BehavioralSignals(
    val sessionDurationMs: Long,
    val keystrokeCount: Int,
    val averageKeystrokeIntervalMs: Double,
    val pasteDetected: Boolean,
    val pastedFields: List<String>,
    val recipientChangedCount: Int,
    val transactionCreationMs: Long,
    val typingSpeedScore: Double
)

data class CallSignals(
    val isOnActiveCall: Boolean,
    val callType: String   // "IDLE", "RINGING", "OFFHOOK"
)

// ── Device Binding ───────────────────────────────────────────────────────────

data class BindingResult(
    val success: Boolean,
    val deviceId: String?,
    val requiresStepUp: Boolean = false,
    val stepUpMethod: String? = null,
    val riskDelta: Int = 0,
    val message: String? = null
)

// ── Risk Payload (sent to server) ────────────────────────────────────────────

data class RiskPayload(
    val payloadId: String,
    val userId: String,
    val sessionId: String,
    val timestamp: Long,
    val transaction: TransactionPayload,
    val device: DeviceSignals,
    val network: NetworkSignals,
    val behavioral: BehavioralSignals,
    val call: CallSignals,
    val recipientInContacts: Boolean
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("payload_id", payloadId)
        put("user_id", userId)
        put("session_id", sessionId)
        put("timestamp", timestamp)
        put("transaction", JSONObject().apply {
            put("recipient_phone", transaction.recipientPhone)
            put("amount", transaction.amount)
            put("currency", transaction.currency)
            put("note", transaction.note ?: JSONObject.NULL)
        })
        put("device", JSONObject().apply {
            put("device_id", device.deviceId)
            put("manufacturer", device.manufacturer)
            put("model", device.model)
            put("os_version", device.osVersion)
            put("is_rooted", device.isRooted)
            put("is_emulator", device.isEmulator)
            put("is_app_tampered", device.isAppTampered)
        })
        put("network", JSONObject().apply {
            put("ip_address", network.ipAddress)
            put("is_vpn", network.isVpnActive)
            put("is_proxy", network.isProxySet)
            put("connection_type", network.connectionType)
        })
        put("behavioral", JSONObject().apply {
            put("session_duration_ms", behavioral.sessionDurationMs)
            put("keystroke_count", behavioral.keystrokeCount)
            put("average_keystroke_interval_ms", behavioral.averageKeystrokeIntervalMs)
            put("paste_detected", behavioral.pasteDetected)
            put("pasted_fields", JSONArray(behavioral.pastedFields))
            put("recipient_changed_count", behavioral.recipientChangedCount)
            put("transaction_creation_ms", behavioral.transactionCreationMs)
            put("typing_speed_score", behavioral.typingSpeedScore)
        })
        put("call", JSONObject().apply {
            put("is_on_active_call", call.isOnActiveCall)
            put("call_type", call.callType)
        })
        put("recipient_in_contacts", recipientInContacts)
    }
}

// ── SDK Errors ───────────────────────────────────────────────────────────────

sealed class FraudShieldException(message: String) : Exception(message) {
    class NotInitialized : FraudShieldException("FraudShieldSDK.initialize() must be called before evaluating transactions.")
    class NetworkFailure(detail: String) : FraudShieldException("Fraud Shield network error: $detail")
    class InvalidApiKey : FraudShieldException("API key must start with pg_sandbox_ or pg_live_")
}
