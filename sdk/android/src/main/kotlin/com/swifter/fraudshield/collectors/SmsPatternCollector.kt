package com.swifter.fraudshield.collectors

import android.content.Context
import android.database.Cursor
import android.net.Uri

data class SmsSignals(
    val hasFraudKeywords: Boolean,
    val fraudKeywordsFound: List<String>,
    val recentSmsCount: Int,
    val unknownSenderCount: Int
)

class SmsPatternCollector(private val context: Context) {

    private val FRAUD_KEYWORDS = listOf(
        "otp", "pin", "winner", "won", "prize", "claim", "congratulations",
        "urgent", "emergency", "reverse", "refund", "verify", "account locked",
        "mtn momo", "airtel money", "m-pesa", "upgrade", "kyc", "suspend"
    )

    private val LOOKBACK_HOURS = 24L

    /**
     * Scans recent SMS (last 24 hours) for known fraud keyword patterns.
     * Common in prize scams and fake MoMo agent impersonation attacks.
     */
    fun collect(): SmsSignals {
        return try {
            scanSms()
        } catch (e: SecurityException) {
            // READ_SMS permission not granted — return empty signals
            SmsSignals(
                hasFraudKeywords = false,
                fraudKeywordsFound = emptyList(),
                recentSmsCount = 0,
                unknownSenderCount = 0
            )
        }
    }

    private fun scanSms(): SmsSignals {
        val cutoffMs = System.currentTimeMillis() - (LOOKBACK_HOURS * 60 * 60 * 1000)

        val uri: Uri = Uri.parse("content://sms/inbox")
        val cursor: Cursor? = context.contentResolver.query(
            uri,
            arrayOf("address", "body", "date"),
            "date > ?",
            arrayOf(cutoffMs.toString()),
            "date DESC"
        )

        val foundKeywords = mutableSetOf<String>()
        var unknownCount = 0
        var totalCount = 0

        cursor?.use {
            val bodyIdx = it.getColumnIndex("body")
            val addressIdx = it.getColumnIndex("address")

            while (it.moveToNext()) {
                totalCount++
                val body = if (bodyIdx >= 0) it.getString(bodyIdx)?.lowercase() ?: "" else ""
                val address = if (addressIdx >= 0) it.getString(addressIdx) ?: "" else ""

                // Flag if body contains fraud keywords
                FRAUD_KEYWORDS.forEach { keyword ->
                    if (body.contains(keyword)) {
                        foundKeywords.add(keyword)
                    }
                }

                // Unknown sender: numeric-only address is often a shortcode/scammer
                if (address.replace("+", "").replace("-", "").all { c -> c.isDigit() } && address.length < 7) {
                    unknownCount++
                }
            }
        }

        return SmsSignals(
            hasFraudKeywords = foundKeywords.isNotEmpty(),
            fraudKeywordsFound = foundKeywords.toList(),
            recentSmsCount = totalCount,
            unknownSenderCount = unknownCount
        )
    }
}
