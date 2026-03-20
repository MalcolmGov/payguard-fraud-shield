package com.swifter.fraudshield

import android.content.Context
import com.swifter.fraudshield.collectors.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

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
    val sms: SmsSignals,
    val sim: SimSignals,
    val recipientInContacts: Boolean
)

object RiskPayloadBuilder {

    fun build(
        userId: String,
        sessionId: String,
        transaction: TransactionPayload,
        deviceSignals: DeviceSignals,
        networkSignals: NetworkSignals,
        behavioralSignals: BehavioralSignals,
        callSignals: CallSignals,
        smsSignals: SmsSignals,
        simSignals: SimSignals,
        recipientInContacts: Boolean = false
    ): RiskPayload {
        return RiskPayload(
            payloadId = UUID.randomUUID().toString(),
            userId = userId,
            sessionId = sessionId,
            timestamp = System.currentTimeMillis(),
            transaction = transaction,
            device = deviceSignals,
            network = networkSignals,
            behavioral = behavioralSignals,
            call = callSignals,
            sms = smsSignals,
            sim = simSignals,
            recipientInContacts = recipientInContacts
        )
    }

    fun toJson(payload: RiskPayload): JSONObject {
        return JSONObject().apply {
            put("payload_id", payload.payloadId)
            put("user_id", payload.userId)
            put("session_id", payload.sessionId)
            put("timestamp", payload.timestamp)

            put("transaction", JSONObject().apply {
                put("recipient_phone", payload.transaction.recipientPhone)
                put("amount", payload.transaction.amount)
                put("currency", payload.transaction.currency)
                put("note", payload.transaction.note)
            })

            put("device", JSONObject().apply {
                put("device_id", payload.device.deviceId)
                put("manufacturer", payload.device.manufacturer)
                put("model", payload.device.model)
                put("os_version", payload.device.osVersion)
                put("sdk_version", payload.device.sdkVersion)
                put("is_rooted", payload.device.isRooted)
                put("is_emulator", payload.device.isEmulator)
                put("is_app_tampered", payload.device.isAppTampered)
            })

            put("network", JSONObject().apply {
                put("ip_address", payload.network.ipAddress)
                put("is_vpn", payload.network.isVpnActive)
                put("is_proxy", payload.network.isProxySet)
                put("connection_type", payload.network.connectionType)
                put("latitude", payload.network.latitude)
                put("longitude", payload.network.longitude)
            })

            put("behavioral", JSONObject().apply {
                put("session_duration_ms", payload.behavioral.sessionDurationMs)
                put("keystroke_count", payload.behavioral.keystrokeCount)
                put("avg_keystroke_interval_ms", payload.behavioral.averageKeystrokeIntervalMs)
                put("paste_detected", payload.behavioral.pasteDetected)
                put("pasted_fields", JSONArray(payload.behavioral.pastedFields))
                put("recipient_changed_count", payload.behavioral.recipientChangedCount)
                put("transaction_creation_ms", payload.behavioral.transactionCreationMs)
                put("typing_speed_score", payload.behavioral.typingSpeedScore)
            })

            put("call", JSONObject().apply {
                put("is_on_active_call", payload.call.isOnActiveCall)
                put("call_type", payload.call.callType)
                put("is_caller_in_contacts", payload.call.isCallerInContacts)
            })

            put("sms", JSONObject().apply {
                put("has_fraud_keywords", payload.sms.hasFraudKeywords)
                put("fraud_keywords_found", JSONArray(payload.sms.fraudKeywordsFound))
                put("recent_sms_count", payload.sms.recentSmsCount)
                put("unknown_sender_count", payload.sms.unknownSenderCount)
            })

            put("sim", JSONObject().apply {
                put("operator_name", payload.sim.operatorName)
                put("sim_serial_hash", payload.sim.simSerialHash)
                put("country_iso", payload.sim.countryIso)
                put("sim_swap_detected", payload.sim.simSwapDetected)
                put("is_dual_sim", payload.sim.isDualSim)
            })

            put("recipient_in_contacts", payload.recipientInContacts)
        }
    }
}
