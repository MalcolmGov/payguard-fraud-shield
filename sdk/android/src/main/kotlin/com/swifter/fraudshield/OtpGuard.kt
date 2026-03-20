package com.swifter.fraudshield

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.provider.Telephony
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.swifter.fraudshield.collectors.CallStateCollector
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * OtpGuard — Protects OTP screens from social engineering disclosure.
 *
 * PROBLEM: Scammer calls the user while an OTP is being delivered via SMS.
 * They instruct the user to "just read me the code". OtpGuard intercepts
 * this exact moment with two complementary mechanisms:
 *
 *  1. FLAG_SECURE — applies a system-level screenshot/screen-recording block
 *     so the scammer cannot see the OTP via a screen-sharing session.
 *
 *  2. In-app Warning Overlay — displays a full-screen red banner over the OTP
 *     screen: "⚠️ You are on a call. NEVER share this code verbally."
 *
 *  3. High-Risk Signal — fires RULE_011 immediately to the risk engine,
 *     which may trigger a BLOCK on any pending transaction.
 *
 * INTEGRATION (host MoMo app):
 *
 *   class OtpActivity : AppCompatActivity() {
 *       private val otpGuard = OtpGuard(this)
 *
 *       override fun onResume() {
 *           super.onResume()
 *           otpGuard.activate() // call when OTP screen becomes visible
 *       }
 *
 *       override fun onPause() {
 *           super.onPause()
 *           otpGuard.deactivate() // clean up
 *       }
 *   }
 */
class OtpGuard(private val activity: Activity) {

    companion object {
        private const val TAG = "OtpGuard"
        private const val OVERLAY_TAG = "FraudShield_OtpOverlay"
    }

    private val callStateCollector = CallStateCollector(activity)
    private val scope = CoroutineScope(Dispatchers.Main)
    private var overlayView: FrameLayout? = null

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Call this as soon as the OTP screen / OTP input field is shown to the user.
     *
     * Checks if the device is currently on an active call. If so:
     *  - Applies FLAG_SECURE
     *  - Shows the warning overlay
     *  - Fires RULE_011 signal to the risk engine
     *
     * @return OtpRiskLevel indicating the protection action taken
     */
    fun activate(): OtpRiskLevel {
        // Always apply FLAG_SECURE regardless of call state — OTPs should never be recordable
        applyFlagSecure()

        val callState = callStateCollector.collect()
        return if (callState.isOnActiveCall) {
            showWarningOverlay(callState.isUnknownCaller)
            fireOtpOnCallSignal(callState.isUnknownCaller)
            if (callState.isUnknownCaller) OtpRiskLevel.HIGH_RISK else OtpRiskLevel.MEDIUM_RISK
        } else {
            OtpRiskLevel.CLEAN
        }
    }

    /**
     * Call this when the OTP screen leaves focus (onPause, successful verification, etc.)
     */
    fun deactivate() {
        removeWarningOverlay()
        clearFlagSecure()
    }

    // ── Private Implementation ────────────────────────────────────────────────

    private fun applyFlagSecure() {
        activity.runOnUiThread {
            activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }

    private fun clearFlagSecure() {
        activity.runOnUiThread {
            activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }

    private fun showWarningOverlay(unknownCaller: Boolean) {
        activity.runOnUiThread {
            if (overlayView != null) return@runOnUiThread

            val rootView = activity.window.decorView as FrameLayout

            val overlay = FrameLayout(activity).apply {
                setBackgroundColor(0xF0C62828.toInt()) // semi-opaque red
                tag = OVERLAY_TAG
            }

            val content = LinearLayout(activity).apply {
                orientation = LinearLayout.VERTICAL
                gravity = android.view.Gravity.CENTER
                setPadding(48, 48, 48, 48)
            }

            val icon = TextView(activity).apply {
                text = "🚨"
                textSize = 48f
                gravity = android.view.Gravity.CENTER
            }

            val headline = TextView(activity).apply {
                text = if (unknownCaller) "SCAM ALERT — Unknown Caller" else "⚠ Active Call Detected"
                textSize = 20f
                setTextColor(0xFFFFFFFF.toInt())
                typeface = android.graphics.Typeface.DEFAULT_BOLD
                gravity = android.view.Gravity.CENTER
                setPadding(0, 16, 0, 12)
            }

            val message = TextView(activity).apply {
                text = buildString {
                    appendLine("You are currently on an active call.")
                    appendLine()
                    if (unknownCaller) {
                        appendLine("⛔  NEVER read this code to anyone.")
                        appendLine("⛔  MTN will NEVER ask for your OTP.")
                        appendLine("⛔  Hang up this call immediately.")
                    } else {
                        appendLine("Never share this OTP verbally.")
                        appendLine("Only enter it directly on this screen.")
                    }
                }
                textSize = 15f
                setTextColor(0xFFFFEEEE.toInt())
                gravity = android.view.Gravity.CENTER
            }

            content.addView(icon)
            content.addView(headline)
            content.addView(message)
            overlay.addView(content)

            overlayView = overlay
            rootView.addView(overlay)
        }
    }

    private fun removeWarningOverlay() {
        activity.runOnUiThread {
            overlayView?.let {
                (activity.window.decorView as? FrameLayout)?.removeView(it)
                overlayView = null
            }
        }
    }

    private fun fireOtpOnCallSignal(unknownCaller: Boolean) {
        scope.launch(Dispatchers.IO) {
            try {
                val payload = mapOf(
                    "event_type" to "OTP_SCREEN_ON_CALL",
                    "unknown_caller" to unknownCaller,
                    "rule" to "RULE_011",
                    "risk_delta" to if (unknownCaller) 80 else 45,
                    "timestamp" to System.currentTimeMillis(),
                )
                FraudSignalDispatcher(activity).dispatchSignalEvent(payload)
            } catch (e: Exception) {
                android.util.Log.e(TAG, "Failed to dispatch OTP-on-call signal", e)
            }
        }
    }
}

/**
 * Risk level returned by OtpGuard.activate()
 */
enum class OtpRiskLevel {
    CLEAN,        // Not on a call — OTP screen is normal
    MEDIUM_RISK,  // On a known/contact call — warning shown, signal fired
    HIGH_RISK,    // On a call with UNKNOWN number — full block overlay shown
}
