/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard Android SDK — Call State Collector
 * THE critical signal — detects active phone calls during transactions
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

package com.swifter.fraudshield.collectors

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.provider.ContactsContract
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.swifter.fraudshield.models.CallSignals

/**
 * Detects whether the user is on an active phone call.
 *
 * This is the single most important signal in the PayGuard SDK.
 * ~70% of social engineering fraud in Africa happens while the victim
 * is being instructed over the phone by a fraudster.
 *
 * RULE_001: Active call + unknown recipient + high amount = 75 pts
 * RULE_002: Active call + unknown recipient = 40 pts
 * RULE_014: OTP screen open during call = 80 pts
 */
class CallStateCollector(private val context: Context) {

    @Volatile
    private var currentCallState: Int = TelephonyManager.CALL_STATE_IDLE

    private val telephonyManager: TelephonyManager by lazy {
        context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
    }

    init {
        // Register call state listener on init
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE)
            == PackageManager.PERMISSION_GRANTED
        ) {
            registerCallStateListener()
        }
    }

    @Suppress("DEPRECATION")
    private fun registerCallStateListener() {
        telephonyManager.listen(
            object : android.telephony.PhoneStateListener() {
                override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                    currentCallState = state
                }
            },
            android.telephony.PhoneStateListener.LISTEN_CALL_STATE
        )
    }

    // ── Collect Current State ───────────────────────────────────────────────

    suspend fun collect(): CallSignals {
        val hasPermission = ContextCompat.checkSelfPermission(
            context, Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasPermission) {
            // Degrade gracefully — cannot detect calls without permission
            return CallSignals(
                isOnActiveCall = false,
                callType = "PERMISSION_DENIED"
            )
        }

        val isOnActiveCall = currentCallState == TelephonyManager.CALL_STATE_OFFHOOK
        val callType = when (currentCallState) {
            TelephonyManager.CALL_STATE_IDLE    -> "IDLE"
            TelephonyManager.CALL_STATE_RINGING -> "RINGING"
            TelephonyManager.CALL_STATE_OFFHOOK -> "OFFHOOK"
            else -> "UNKNOWN"
        }

        return CallSignals(
            isOnActiveCall = isOnActiveCall,
            callType = callType
        )
    }

    // ── Unknown Caller Check ────────────────────────────────────────────────

    /**
     * Checks if the current incoming/active call is from a number NOT in the
     * user's contacts. Used by OtpGuard to distinguish between medium risk
     * (known caller) and high risk (unknown caller → SCAM ALERT).
     *
     * Requires READ_CONTACTS permission.
     */
    fun isCallerUnknown(phoneNumber: String? = null): Boolean {
        if (phoneNumber.isNullOrBlank()) return true

        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            // Can't check contacts — assume unknown (safer)
            return true
        }

        val uri = Uri.withAppendedPath(
            ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
            Uri.encode(phoneNumber)
        )

        var cursor: Cursor? = null
        return try {
            cursor = context.contentResolver.query(
                uri,
                arrayOf(ContactsContract.PhoneLookup._ID),
                null, null, null
            )
            // If cursor has no rows, the number is NOT in contacts
            cursor == null || cursor.count == 0
        } catch (_: Exception) {
            true  // Assume unknown on error (safer)
        } finally {
            cursor?.close()
        }
    }

    /**
     * Whether the device is currently on an active phone call.
     * Fast synchronous check — useful for OtpGuard.
     */
    fun isOnCall(): Boolean = currentCallState == TelephonyManager.CALL_STATE_OFFHOOK
}
