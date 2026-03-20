package com.swifter.fraudshield.collectors

import android.content.Context
import android.telephony.TelephonyManager
import androidx.core.content.edit

data class SimSignals(
    val operatorName: String,
    val simSerialHash: String,
    val countryIso: String,
    val simSwapDetected: Boolean,
    val isDualSim: Boolean
)

class SimCollector(private val context: Context) {

    private val PREFS_NAME = "fraud_shield_sim"
    private val PREF_LAST_SERIAL = "last_sim_serial"
    private val PREF_LAST_OPERATOR = "last_operator"

    fun collect(): SimSignals {
        val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager

        @Suppress("MissingPermission")
        val simSerial = try { tm.simSerialNumber ?: "unknown" } catch (e: SecurityException) { "unknown" }
        val operatorName = tm.networkOperatorName ?: "unknown"
        val countryIso = tm.simCountryIso ?: "unknown"

        val simSerialHash = hashString(simSerial)
        val simSwapDetected = detectSimSwap(simSerialHash, operatorName)

        // Save current values for next session comparison
        saveCurrentSimState(simSerialHash, operatorName)

        return SimSignals(
            operatorName = operatorName,
            simSerialHash = simSerialHash,
            countryIso = countryIso,
            simSwapDetected = simSwapDetected,
            isDualSim = detectDualSim(tm)
        )
    }

    private fun detectSimSwap(currentSerialHash: String, currentOperator: String): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lastSerial = prefs.getString(PREF_LAST_SERIAL, null)
        val lastOperator = prefs.getString(PREF_LAST_OPERATOR, null)

        if (lastSerial == null) return false // First run, no baseline yet

        return lastSerial != currentSerialHash || lastOperator != currentOperator
    }

    private fun saveCurrentSimState(serialHash: String, operator: String) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit {
            putString(PREF_LAST_SERIAL, serialHash)
            putString(PREF_LAST_OPERATOR, operator)
        }
    }

    private fun detectDualSim(tm: TelephonyManager): Boolean {
        return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            @Suppress("MissingPermission")
            try {
                val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE)
                        as? android.telephony.SubscriptionManager
                (subscriptionManager?.activeSubscriptionInfoCount ?: 0) > 1
            } catch (e: Exception) { false }
        } else {
            false
        }
    }

    private fun hashString(input: String): String {
        val bytes = java.security.MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
