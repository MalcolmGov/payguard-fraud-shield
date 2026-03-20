package com.swifter.fraudshield.sample

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.swifter.fraudshield.FraudShieldSDK
import com.swifter.fraudshield.RiskPayloadBuilder
import com.swifter.fraudshield.FraudSignalDispatcher
import kotlinx.coroutines.*

/**
 * Sample MoMo-style Activity demonstrating Fraud Shield SDK integration.
 *
 * Flow:
 *  1. User enters recipient number + amount
 *  2. On "Send Money" tap — SDK collects all signals
 *  3. Risk payload submitted to API
 *  4. RiskDecision displayed (ALLOW / WARN / BLOCK) 
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "FraudShieldSample"
        private const val REQUEST_PERMISSIONS = 1001
    }

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialise the SDK
        FraudShieldSDK.initialize(
            context = applicationContext,
            apiKey = "demo-api-key-replace-me",
            userId = "test-user-001",
            apiBaseUrl = "https://api.fraudshield.swifter.io"
        )

        requestRequiredPermissions()

        val etRecipient = findViewById<EditText>(R.id.etRecipient)
        val etAmount     = findViewById<EditText>(R.id.etAmount)
        val btnSend      = findViewById<Button>(R.id.btnSend)
        val tvResult     = findViewById<TextView>(R.id.tvResult)
        val progressBar  = findViewById<ProgressBar>(R.id.progressBar)

        btnSend.setOnClickListener {
            val recipient = etRecipient.text.toString().trim()
            val amountStr = etAmount.text.toString().trim()

            if (recipient.isEmpty() || amountStr.isEmpty()) {
                Toast.makeText(this, "Please fill in recipient and amount", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val amount = amountStr.toDoubleOrNull() ?: run {
                Toast.makeText(this, "Invalid amount", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnSend.isEnabled = false
            progressBar.visibility = android.view.View.VISIBLE
            tvResult.text = "Evaluating transaction…"

            scope.launch {
                try {
                    // Build risk payload from all collectors
                    val payload = withContext(Dispatchers.IO) {
                        RiskPayloadBuilder(applicationContext).build(
                            recipientWallet = recipient,
                            amount = amount,
                            sessionStartMs = FraudShieldSDK.sessionStartMs
                        )
                    }

                    Log.d(TAG, "Risk payload: ${payload.toJson()}")

                    // Submit to risk engine
                    val decision = withContext(Dispatchers.IO) {
                        FraudSignalDispatcher(applicationContext).evaluate(payload)
                    }

                    progressBar.visibility = android.view.View.GONE
                    btnSend.isEnabled = true

                    // Show result
                    val color = when (decision.riskLevel) {
                        "HIGH"   -> android.R.color.holo_red_dark
                        "MEDIUM" -> android.R.color.holo_orange_dark
                        else     -> android.R.color.holo_green_dark
                    }
                    tvResult.setTextColor(ContextCompat.getColor(this@MainActivity, color))
                    tvResult.text = buildString {
                        appendLine("━━━━━━━━━━━━━━━━━━━━━")
                        appendLine("Risk Score : ${decision.riskScore}")
                        appendLine("Risk Level : ${decision.riskLevel}")
                        appendLine("Action     : ${decision.recommendedAction}")
                        if (decision.triggeredRules.isNotEmpty()) {
                            appendLine("Rules      : ${decision.triggeredRules.joinToString()}")
                        }
                        appendLine("━━━━━━━━━━━━━━━━━━━━━")
                    }

                    // Show warning dialog if HIGH risk
                    if (decision.riskLevel == "HIGH") {
                        showScamWarningDialog(recipient, amount)
                    }

                } catch (e: Exception) {
                    progressBar.visibility = android.view.View.GONE
                    btnSend.isEnabled = true
                    tvResult.text = "Error: ${e.message}"
                    Log.e(TAG, "Evaluation failed", e)
                }
            }
        }
    }

    private fun showScamWarningDialog(recipient: String, amount: Double) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("⚠️ Possible Scam Detected")
            .setMessage(
                "Our fraud detection system has flagged this transaction as HIGH RISK.\n\n" +
                "Recipient: $recipient\n" +
                "Amount: R${"%.2f".format(amount)}\n\n" +
                "Were you instructed by someone on a call to make this payment? " +
                "Legitimate companies will NEVER ask you to send money to confirm a prize or fix an account."
            )
            .setPositiveButton("Cancel Transaction") { dialog, _ -> dialog.dismiss() }
            .setNegativeButton("Proceed Anyway") { dialog, _ ->
                Toast.makeText(this, "Transaction proceeding despite warning", Toast.LENGTH_LONG).show()
                dialog.dismiss()
            }
            .setCancelable(false)
            .show()
    }

    private fun requestRequiredPermissions() {
        val permissions = arrayOf(
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.READ_SMS,
        )
        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), REQUEST_PERMISSIONS)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }
}
