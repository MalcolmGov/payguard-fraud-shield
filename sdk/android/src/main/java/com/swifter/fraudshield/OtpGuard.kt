/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard Android SDK — OTP Guard
 * Protects OTP screens from social engineering disclosure
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

package com.swifter.fraudshield

import android.app.Activity
import android.app.AlertDialog
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.view.Gravity
import android.view.ViewGroup.LayoutParams
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import com.swifter.fraudshield.collectors.CallStateCollector
import com.swifter.fraudshield.network.FraudSignalDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * OTP Guard — Prevents OTP vishing / social engineering disclosure.
 *
 * When a bank's OTP screen opens while the user is on a phone call,
 * this module:
 *
 *   1. Applies FLAG_SECURE to prevent screenshots and screen recording
 *   2. Shows a full-screen red warning overlay:
 *      - Unknown caller → "SCAM ALERT" with instructions to hang up
 *      - Known caller → gentler warning about not sharing OTP verbally
 *   3. Fires RULE_014 signal (OTP_SCREEN_ON_CALL) to the risk engine
 *      with risk delta 80 (unknown) or 45 (known)
 *
 * INTEGRATION IN BANK APP:
 *
 *   class OtpActivity : AppCompatActivity() {
 *       private val otpGuard = OtpGuard.shared
 *
 *       override fun onResume() {
 *           super.onResume()
 *           otpGuard.activate(this) { riskLevel ->
 *               if (riskLevel == OtpRiskLevel.HIGH_RISK) {
 *                   // Optionally auto-cancel the OTP
 *               }
 *           }
 *       }
 *
 *       override fun onPause() {
 *           super.onPause()
 *           otpGuard.deactivate(this)
 *       }
 *   }
 */

enum class OtpRiskLevel {
    CLEAN,        // Not on a call
    MEDIUM_RISK,  // On a known call — warning shown
    HIGH_RISK     // On a call with unknown caller — full SCAM ALERT
}

class OtpGuard private constructor() {

    companion object {
        val shared = OtpGuard()
    }

    private var warningDialog: AlertDialog? = null
    private var callCollector: CallStateCollector? = null

    // ── Public API ──────────────────────────────────────────────────────────

    /**
     * Activate OTP protection on the given Activity.
     *
     * Checks if the user is on an active call. If so, applies FLAG_SECURE
     * and shows a warning overlay. Fires the OTP_SCREEN_ON_CALL signal.
     *
     * @param activity The OTP screen activity
     * @param callback Reports the detected risk level back to the host app
     */
    fun activate(
        activity: Activity,
        callback: (OtpRiskLevel) -> Unit
    ) {
        // Step 1: Apply FLAG_SECURE — prevents screenshots/screen recording
        activity.window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )

        // Step 2: Check call state
        if (callCollector == null) {
            callCollector = CallStateCollector(activity.applicationContext)
        }

        if (!callCollector!!.isOnCall()) {
            callback(OtpRiskLevel.CLEAN)
            return
        }

        // User IS on a call — determine risk level
        val isUnknownCaller = callCollector!!.isCallerUnknown()
        val riskLevel = if (isUnknownCaller) OtpRiskLevel.HIGH_RISK else OtpRiskLevel.MEDIUM_RISK

        // Step 3: Show warning overlay
        showWarningOverlay(activity, riskLevel)

        // Step 4: Fire risk signal
        fireOtpOnCallSignal(riskLevel)

        callback(riskLevel)
    }

    /**
     * Deactivate OTP protection. Call from onPause().
     * Removes FLAG_SECURE and dismisses the warning overlay.
     */
    fun deactivate(activity: Activity) {
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        dismissWarning()
    }

    // ── Warning Overlay ─────────────────────────────────────────────────────

    private fun showWarningOverlay(activity: Activity, riskLevel: OtpRiskLevel) {
        dismissWarning()

        val isHighRisk = riskLevel == OtpRiskLevel.HIGH_RISK
        val dangerRed = Color.parseColor("#C81919")

        val layout = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(64, 96, 64, 96)
            setBackgroundColor(dangerRed)
        }

        // Emoji
        val emoji = TextView(activity).apply {
            text = if (isHighRisk) "🚨" else "⚠️"
            textSize = 56f
            gravity = Gravity.CENTER
        }
        layout.addView(emoji)

        // Headline
        val headline = TextView(activity).apply {
            text = if (isHighRisk) "SCAM ALERT" else "Active Call Detected"
            textSize = 22f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 24, 0, 16)
        }
        layout.addView(headline)

        // Body
        val body = TextView(activity).apply {
            text = if (isHighRisk) {
                "You are on a call with an UNKNOWN number.\n\n" +
                "⛔ NEVER read your OTP to anyone.\n" +
                "⛔ Your bank will never ask for your code.\n" +
                "⛔ Hang up immediately."
            } else {
                "You are on an active call.\n\n" +
                "Never share your OTP verbally.\n" +
                "Only enter it directly on the app screen."
            }
            textSize = 15f
            setTextColor(Color.parseColor("#E5E5E5"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }
        layout.addView(body)

        // Dismiss button (high risk only)
        if (isHighRisk) {
            val button = Button(activity).apply {
                text = "I understand — End Call Now"
                textSize = 15f
                setTextColor(dangerRed)
                setBackgroundColor(Color.WHITE)
                setPadding(48, 24, 48, 24)
                setOnClickListener { dismissWarning() }
            }
            layout.addView(button, LinearLayout.LayoutParams(
                LayoutParams.WRAP_CONTENT,
                LayoutParams.WRAP_CONTENT
            ).apply { gravity = Gravity.CENTER })
        }

        warningDialog = AlertDialog.Builder(activity, android.R.style.Theme_NoTitleBar_Fullscreen)
            .setView(layout)
            .setCancelable(!isHighRisk) // High risk: must tap button to dismiss
            .create()
            .also { dialog ->
                dialog.window?.setBackgroundDrawable(ColorDrawable(dangerRed))
                dialog.show()
            }
    }

    private fun dismissWarning() {
        warningDialog?.dismiss()
        warningDialog = null
    }

    // ── Risk Signal Dispatch ────────────────────────────────────────────────

    private fun fireOtpOnCallSignal(riskLevel: OtpRiskLevel) {
        val dispatcher = FraudSignalDispatcher.shared ?: return

        val event = mapOf(
            "event_type" to "OTP_SCREEN_ON_CALL",
            "unknown_caller" to (riskLevel == OtpRiskLevel.HIGH_RISK),
            "rule" to "RULE_014",
            "risk_delta" to if (riskLevel == OtpRiskLevel.HIGH_RISK) 80 else 45,
            "timestamp" to (System.currentTimeMillis() / 1000.0)
        )

        CoroutineScope(Dispatchers.IO).launch {
            try {
                dispatcher.dispatchEvent(event)
            } catch (_: Exception) {
                // Non-blocking
            }
        }
    }
}
