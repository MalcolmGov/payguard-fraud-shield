package com.swifter.fraudshield

import android.content.Context
import com.swifter.fraudshield.binding.DeviceBindingManager
import com.swifter.fraudshield.binding.DeviceBindingManager.BindingResult
import com.swifter.fraudshield.collectors.*
import kotlinx.coroutines.*
import org.json.JSONObject

data class TransactionPayload(
    val recipientPhone: String,
    val amount: Double,
    val currency: String,
    val note: String? = null
)

data class RiskDecision(
    val riskScore: Int,
    val riskLevel: RiskLevel,
    val recommendedAction: RecommendedAction,
    val triggeredRules: List<String>,
    val transactionId: String
)

enum class RiskLevel { LOW, MEDIUM, HIGH, CRITICAL }
enum class RecommendedAction { APPROVE, SOFT_WARNING, WARN_USER, BLOCK }

object FraudShieldSDK {

    private var apiKey: String? = null
    private var userId: String? = null
    private var context: Context? = null
    private var sessionId: String? = null
    private var apiBaseUrl: String = "https://api.payguard.africa"

    private var deviceCollector: DeviceCollector? = null
    private var networkCollector: NetworkCollector? = null
    private var behavioralCollector: BehavioralCollector? = null
    private var callStateCollector: CallStateCollector? = null
    private var smsPatternCollector: SmsPatternCollector? = null
    private var simCollector: SimCollector? = null
    private var dispatcher: FraudSignalDispatcher? = null

    /** Lazily-created device binding manager */
    private val deviceBinding: DeviceBindingManager by lazy {
        DeviceBindingManager(
            context      = context!!,
            apiBaseUrl   = apiBaseUrl,
            apiKey       = apiKey!!,
        )
    }

    /**
     * Initialize the Fraud Shield SDK.
     * Call this in Application.onCreate() before any transaction evaluation.
     *
     * @param context   Application context
     * @param apiKey    Your PayGuard API key (pg_live_*** or pg_sandbox_***)
     * @param userId    The authenticated user's ID (phone number or UUID)
     * @param baseUrl   Optional: override the API base URL (e.g. for staging)
     */
    fun initialize(
        context: Context,
        apiKey: String,
        userId: String,
        baseUrl: String = "https://api.payguard.africa",
    ) {
        this.context    = context.applicationContext
        this.apiKey     = apiKey
        this.userId     = userId
        this.apiBaseUrl = baseUrl

        deviceCollector      = DeviceCollector(context)
        networkCollector     = NetworkCollector(context)
        behavioralCollector  = BehavioralCollector()
        callStateCollector   = CallStateCollector(context)
        smsPatternCollector  = SmsPatternCollector(context)
        simCollector         = SimCollector(context)
        dispatcher           = FraudSignalDispatcher(context, apiKey)
    }

    // ── Device Binding ────────────────────────────────────────────────────────

    /**
     * Register this device for the current user.
     * Call ONCE after the user successfully logs in for the first time on this device.
     * Stores the device token securely in Android Keystore (AES-256-GCM).
     *
     * @return BindingResult — check requiresStepUp and stepUpMethod
     */
    suspend fun bindDevice(): BindingResult {
        requireNotNull(context) { "FraudShieldSDK.initialize() must be called first" }
        return deviceBinding.registerDevice(userId!!)
    }

    /**
     * Validate this device on every login and before every transaction.
     * Automatically re-registers if no binding exists.
     *
     * @return BindingResult — check requiresStepUp and riskDelta
     */
    suspend fun validateDevice(): BindingResult {
        requireNotNull(context) { "FraudShieldSDK.initialize() must be called first" }
        return deviceBinding.validateDevice(userId!!)
    }

    /**
     * Clear stored device binding (call on user logout).
     */
    fun clearDeviceBinding() = deviceBinding.clearBinding()

    /**
     * Returns true if this device has an existing binding token stored.
     */
    val isDeviceBound: Boolean get() = deviceBinding.hasBinding

    // ── Session ───────────────────────────────────────────────────────────────

    /**
     * Start a session. Call at the beginning of the MoMo transaction flow.
     */
    fun startSession(): String {
        sessionId = java.util.UUID.randomUUID().toString()
        behavioralCollector?.onSessionStart()
        return sessionId!!
    }

    /**
     * Evaluate a pending transaction and return a risk decision.
     * This is the primary entry point before executing any MoMo transfer.
     * Runs all collectors in parallel and submits to the risk engine.
     *
     * Best practice: call validateDevice() before evaluateTransaction().
     */
    suspend fun evaluateTransaction(payload: TransactionPayload): RiskDecision {
        requireNotNull(context) { "FraudShieldSDK.initialize() must be called first" }

        return withContext(Dispatchers.IO) {
            // Collect all signals in parallel
            val deviceSignals    = async { deviceCollector!!.collect() }
            val networkSignals   = async { networkCollector!!.collect() }
            val behavioralSignals = async { behavioralCollector!!.collect() }
            val callSignals      = async { callStateCollector!!.collect() }
            val smsSignals       = async { smsPatternCollector!!.collect() }
            val simSignals       = async { simCollector!!.collect() }

            val riskPayload = RiskPayloadBuilder.build(
                userId           = userId!!,
                sessionId        = sessionId ?: startSession(),
                transaction      = payload,
                deviceSignals    = deviceSignals.await(),
                networkSignals   = networkSignals.await(),
                behavioralSignals = behavioralSignals.await(),
                callSignals      = callSignals.await(),
                smsSignals       = smsSignals.await(),
                simSignals       = simSignals.await(),
            )

            dispatcher!!.evaluate(riskPayload)
        }
    }

    // ── Behavioral recording ──────────────────────────────────────────────────

    /** Record a keystroke event in the given field for behavioural analysis. */
    fun recordKeystroke(fieldName: String) = behavioralCollector?.recordKeystroke(fieldName)

    /** Record when the user pastes content into a field. */
    fun recordPaste(fieldName: String) = behavioralCollector?.recordPaste(fieldName)

    /** Record when the recipient number is changed mid-flow. */
    fun recordRecipientChange() = behavioralCollector?.recordRecipientChange()
}


data class TransactionPayload(
    val recipientPhone: String,
    val amount: Double,
    val currency: String,
    val note: String? = null
)

data class RiskDecision(
    val riskScore: Int,
    val riskLevel: RiskLevel,
    val recommendedAction: RecommendedAction,
    val triggeredRules: List<String>,
    val transactionId: String
)

enum class RiskLevel { LOW, MEDIUM, HIGH, CRITICAL }
enum class RecommendedAction { APPROVE, SOFT_WARNING, WARN_USER, BLOCK }

object FraudShieldSDK {

    private var apiKey: String? = null
    private var userId: String? = null
    private var context: Context? = null
    private var sessionId: String? = null

    private var deviceCollector: DeviceCollector? = null
    private var networkCollector: NetworkCollector? = null
    private var behavioralCollector: BehavioralCollector? = null
    private var callStateCollector: CallStateCollector? = null
    private var smsPatternCollector: SmsPatternCollector? = null
    private var simCollector: SimCollector? = null
    private var dispatcher: FraudSignalDispatcher? = null

    /**
     * Initialize the Fraud Shield SDK.
     * Call this in Application.onCreate() before any transaction evaluation.
     */
    fun initialize(context: Context, apiKey: String, userId: String) {
        this.context = context.applicationContext
        this.apiKey = apiKey
        this.userId = userId

        deviceCollector = DeviceCollector(context)
        networkCollector = NetworkCollector(context)
        behavioralCollector = BehavioralCollector()
        callStateCollector = CallStateCollector(context)
        smsPatternCollector = SmsPatternCollector(context)
        simCollector = SimCollector(context)
        dispatcher = FraudSignalDispatcher(context, apiKey)
    }

    /**
     * Start a session. Call at the beginning of the MoMo transaction flow.
     */
    fun startSession(): String {
        sessionId = java.util.UUID.randomUUID().toString()
        behavioralCollector?.onSessionStart()
        return sessionId!!
    }

    /**
     * Evaluate a pending transaction and return a risk decision.
     * This is the primary entry point before executing any MoMo transfer.
     * Runs all collectors in parallel and submits to the risk engine.
     */
    suspend fun evaluateTransaction(payload: TransactionPayload): RiskDecision {
        requireNotNull(context) { "FraudShieldSDK.initialize() must be called first" }

        return withContext(Dispatchers.IO) {
            // Collect all signals in parallel
            val deviceSignals = async { deviceCollector!!.collect() }
            val networkSignals = async { networkCollector!!.collect() }
            val behavioralSignals = async { behavioralCollector!!.collect() }
            val callSignals = async { callStateCollector!!.collect() }
            val smsSignals = async { smsPatternCollector!!.collect() }
            val simSignals = async { simCollector!!.collect() }

            val riskPayload = RiskPayloadBuilder.build(
                userId = userId!!,
                sessionId = sessionId ?: startSession(),
                transaction = payload,
                deviceSignals = deviceSignals.await(),
                networkSignals = networkSignals.await(),
                behavioralSignals = behavioralSignals.await(),
                callSignals = callSignals.await(),
                smsSignals = smsSignals.await(),
                simSignals = simSignals.await()
            )

            dispatcher!!.evaluate(riskPayload)
        }
    }

    /**
     * Record behavioral events during the transaction flow.
     * Call from your UI layer as the user types/swipes.
     */
    fun recordKeystroke(fieldName: String) = behavioralCollector?.recordKeystroke(fieldName)
    fun recordPaste(fieldName: String) = behavioralCollector?.recordPaste(fieldName)
    fun recordRecipientChange() = behavioralCollector?.recordRecipientChange()
}
