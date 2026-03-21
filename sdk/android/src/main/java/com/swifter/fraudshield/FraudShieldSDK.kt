/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard Android SDK — Main Entry Point
 * Real-time fraud detection for mobile payments
 * © 2026 Swifter Technologies (Pty) Ltd
 *
 * Integration Guide:
 *
 *   // 1. Initialize in Application.onCreate() or after auth
 *   FraudShieldSDK.shared.initialize(
 *       context = applicationContext,
 *       config = PayGuardConfig(
 *           apiKey = "pg_sandbox_your_key",
 *           userId = authenticatedUserId,
 *           environment = Environment.SANDBOX
 *       )
 *   )
 *
 *   // 2. Start session at beginning of send money flow
 *   FraudShieldSDK.shared.startSession()
 *
 *   // 3. Record behavioral events as user interacts
 *   FraudShieldSDK.shared.recordKeystroke("amount_field")
 *   FraudShieldSDK.shared.recordPaste("recipient_phone")
 *   FraudShieldSDK.shared.recordRecipientChange()
 *
 *   // 4. Before executing the payment, evaluate risk
 *   val decision = FraudShieldSDK.shared.evaluateTransaction(
 *       TransactionPayload(
 *           recipientPhone = "+27812345678",
 *           amount = 5000.0,
 *           currency = "ZAR"
 *       )
 *   )
 *
 *   when (decision.recommendedAction) {
 *       RecommendedAction.APPROVE      -> executePayment()
 *       RecommendedAction.SOFT_WARNING -> showWarning(decision) { executePayment() }
 *       RecommendedAction.WARN_USER    -> showStrongWarning(decision)
 *       RecommendedAction.BLOCK        -> blockTransaction(decision)
 *   }
 *
 * ═══════════════════════════════════════════════════════════════════════════ */

package com.swifter.fraudshield

import android.content.Context
import com.swifter.fraudshield.binding.DeviceBindingManager
import com.swifter.fraudshield.collectors.BehavioralCollector
import com.swifter.fraudshield.collectors.CallStateCollector
import com.swifter.fraudshield.collectors.DeviceCollector
import com.swifter.fraudshield.collectors.NetworkCollector
import com.swifter.fraudshield.models.*
import com.swifter.fraudshield.network.FraudSignalDispatcher
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import java.util.UUID

class FraudShieldSDK private constructor() {

    companion object {
        /** Singleton instance — use throughout the app. */
        val shared = FraudShieldSDK()

        const val VERSION = "1.0.0"
    }

    // ── Internal State ──────────────────────────────────────────────────────

    private var config: PayGuardConfig? = null
    private var sessionId: String? = null
    private var initialized = false

    private var deviceCollector: DeviceCollector? = null
    private var networkCollector: NetworkCollector? = null
    private val behavioralCollector = BehavioralCollector()
    private var callStateCollector: CallStateCollector? = null
    private var dispatcher: FraudSignalDispatcher? = null
    private var deviceBinding: DeviceBindingManager? = null

    // ── Initialization ──────────────────────────────────────────────────────

    /**
     * Initialize the PayGuard SDK.
     * Must be called before any risk assessment.
     *
     * @param context Application context (NOT activity context)
     * @param config SDK configuration with API key, user ID, environment
     * @throws FraudShieldException.InvalidApiKey if API key format is invalid
     */
    fun initialize(context: Context, config: PayGuardConfig) {
        if (!config.apiKey.startsWith("pg_")) {
            throw FraudShieldException.InvalidApiKey()
        }

        this.config = config

        val baseUrl = config.baseUrl ?: config.environment.baseUrl

        // Initialize collectors
        deviceCollector = DeviceCollector(context)
        networkCollector = NetworkCollector(context)
        callStateCollector = CallStateCollector(context)

        // Initialize dispatcher
        dispatcher = FraudSignalDispatcher(
            apiKey = config.apiKey,
            baseUrl = baseUrl,
            timeout = config.timeout
        )
        FraudSignalDispatcher.shared = dispatcher

        // Initialize device binding
        deviceBinding = DeviceBindingManager(
            context = context,
            apiBaseUrl = baseUrl,
            apiKey = config.apiKey
        )

        initialized = true
        log("SDK v$VERSION initialized (${config.environment.name}, shadow=${config.shadowMode})")
    }

    // ── Session Management ──────────────────────────────────────────────────

    /**
     * Start a new transaction session.
     * Call at the beginning of the send money flow.
     * @return Session ID
     */
    fun startSession(): String {
        val id = UUID.randomUUID().toString()
        sessionId = id
        behavioralCollector.onSessionStart()
        log("Session started: $id")
        return id
    }

    // ── Transaction Evaluation ──────────────────────────────────────────────

    /**
     * Evaluate a pending transaction for fraud risk.
     *
     * Runs all signal collectors in parallel, builds the risk payload,
     * and sends it to the PayGuard API for evaluation.
     *
     * In shadow mode, always returns APPROVE but logs the real decision.
     *
     * @param payload Transaction details (amount, recipient, currency)
     * @param recipientInContacts Whether the recipient is in the user's contacts
     * @return RiskDecision with score, level, and recommended action
     * @throws FraudShieldException.NotInitialized if initialize() hasn't been called
     */
    suspend fun evaluateTransaction(
        payload: TransactionPayload,
        recipientInContacts: Boolean = false
    ): RiskDecision {
        if (!initialized || config == null || dispatcher == null) {
            throw FraudShieldException.NotInitialized()
        }

        // Record transaction creation timing
        behavioralCollector.recordTransactionScreenReached()

        // Collect all signals in parallel
        val riskPayload = coroutineScope {
            val device = async { deviceCollector!!.collect() }
            val network = async { networkCollector!!.collect() }
            val behavioral = async { behavioralCollector.collect() }
            val call = async { callStateCollector!!.collect() }

            RiskPayload(
                payloadId = UUID.randomUUID().toString(),
                userId = config!!.userId,
                sessionId = sessionId ?: startSession(),
                timestamp = System.currentTimeMillis(),
                transaction = payload,
                device = device.await(),
                network = network.await(),
                behavioral = behavioral.await(),
                call = call.await(),
                recipientInContacts = recipientInContacts
            )
        }

        // Evaluate via API (or fail-secure local fallback)
        val decision = dispatcher!!.evaluate(riskPayload)

        log("Risk: ${decision.riskLevel} (score=${decision.riskScore}, rules=${decision.triggeredRules.joinToString(",")})")

        // Shadow mode: log real decision but always approve
        if (config!!.shadowMode && decision.recommendedAction != RecommendedAction.APPROVE) {
            log("Shadow mode: would have returned ${decision.recommendedAction} — approving instead")
            return decision.copy(recommendedAction = RecommendedAction.APPROVE)
        }

        return decision
    }

    // ── Device Binding ──────────────────────────────────────────────────────

    /**
     * Register this device for the current user.
     * Call ONCE after the user successfully authenticates on this device.
     */
    suspend fun bindDevice(): BindingResult {
        if (!initialized || config == null) throw FraudShieldException.NotInitialized()
        return deviceBinding!!.registerDevice(config!!.userId)
    }

    /**
     * Validate this device on every login and before high-value transactions.
     * Auto-registers if no binding exists.
     */
    suspend fun validateDevice(): BindingResult {
        if (!initialized || config == null) throw FraudShieldException.NotInitialized()
        return deviceBinding!!.validateDevice(config!!.userId)
    }

    /** Clear stored device binding. Call on user logout. */
    fun clearDeviceBinding() {
        deviceBinding?.clearBinding()
    }

    /** Whether a device binding token is stored. */
    val isDeviceBound: Boolean
        get() = deviceBinding?.hasBinding ?: false

    // ── Behavioral Event Recording ──────────────────────────────────────────

    /**
     * Record a keystroke in the given field for behavioral biometric analysis.
     * Call from TextWatcher.onTextChanged() or similar.
     */
    fun recordKeystroke(field: String) {
        behavioralCollector.recordKeystroke(field)
    }

    /**
     * Record when the user pastes content into a field.
     * Pasting recipient numbers is a strong fraud signal (RULE_004).
     */
    fun recordPaste(field: String) {
        behavioralCollector.recordPaste(field)
    }

    /**
     * Record when the recipient number changes mid-flow.
     * Multiple changes suggest testing mule accounts (RULE_012).
     */
    fun recordRecipientChange() {
        behavioralCollector.recordRecipientChange()
    }

    // ── Utilities ───────────────────────────────────────────────────────────

    /** Get SDK version. */
    fun getVersion(): String = VERSION

    /** Check if SDK is initialized. */
    fun isInitialized(): Boolean = initialized

    /** Check if running in shadow mode. */
    fun isShadowMode(): Boolean = config?.shadowMode ?: false

    // ── Private ─────────────────────────────────────────────────────────────

    private fun log(message: String) {
        val level = config?.logLevel ?: LogLevel.WARN
        if (level.priority <= LogLevel.INFO.priority) {
            android.util.Log.i("PayGuard", message)
        }
    }
}
