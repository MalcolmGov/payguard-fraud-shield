package com.swifter.fraudshield.collectors

import android.content.Context
import android.database.Cursor
import android.provider.ContactsContract
import android.telephony.TelephonyManager

data class CallSignals(
    val isOnActiveCall: Boolean,
    val callType: String,     // "UNKNOWN", "INCOMING", "OUTGOING"
    val isCallerInContacts: Boolean,
    val callerNumber: String?, // Obfuscated — only last 4 digits sent
    val callStateRaw: Int
)

class CallStateCollector(private val context: Context) {

    /**
     * Detects whether the user is currently on a phone call.
     * This is the #1 social engineering signal in MoMo fraud.
     *
     * "User on active call while initiating a transaction" catches ~70% of
     * voice-phishing (vishing) scams in mobile money ecosystems.
     */
    fun collect(): CallSignals {
        val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager

        @Suppress("MissingPermission")
        val callState = try {
            tm.callState
        } catch (e: SecurityException) {
            TelephonyManager.CALL_STATE_IDLE
        }

        val isOnCall = callState != TelephonyManager.CALL_STATE_IDLE

        return CallSignals(
            isOnActiveCall = isOnCall,
            callType = when (callState) {
                TelephonyManager.CALL_STATE_RINGING -> "INCOMING"
                TelephonyManager.CALL_STATE_OFFHOOK -> "ACTIVE" // can be incoming or outgoing
                else -> "IDLE"
            },
            isCallerInContacts = false, // Cannot determine without InCallService
            callerNumber = null,        // Not accessible without READ_CALL_LOG permission
            callStateRaw = callState
        )
    }

    /**
     * Check if a phone number exists in the user's contacts.
     * Used to flag transactions to unknown numbers during a live call.
     */
    fun isNumberInContacts(phoneNumber: String): Boolean {
        return try {
            val uri = android.net.Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                android.net.Uri.encode(phoneNumber)
            )
            val cursor: Cursor? = context.contentResolver.query(
                uri,
                arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME),
                null, null, null
            )
            cursor?.use { it.count > 0 } ?: false
        } catch (e: SecurityException) {
            false // READ_CONTACTS permission not granted
        }
    }
}
