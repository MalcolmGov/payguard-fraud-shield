/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard Android SDK — Behavioral Collector
 * Tracks keystroke cadence, paste events, recipient changes, session timing
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

package com.swifter.fraudshield.collectors

import com.swifter.fraudshield.models.BehavioralSignals

class BehavioralCollector {

    private var sessionStartTime: Long = 0L
    private var keystrokeCount: Int = 0
    private val keystrokeTimings: MutableList<Long> = mutableListOf()
    private var lastKeystrokeTime: Long = 0L
    private var pasteDetected: Boolean = false
    private val pastedFields: MutableList<String> = mutableListOf()
    private var recipientChangedCount: Int = 0
    private var transactionCreationMs: Long = 0L

    // ── Session Lifecycle ───────────────────────────────────────────────────

    fun onSessionStart() {
        sessionStartTime = System.currentTimeMillis()
        reset()
    }

    // ── Event Recording (called by host app) ────────────────────────────────

    /**
     * Record a keystroke event in the given field.
     * Tracks inter-key intervals for cadence analysis.
     */
    fun recordKeystroke(field: String) {
        keystrokeCount++
        val now = System.currentTimeMillis()
        if (lastKeystrokeTime > 0) {
            val interval = now - lastKeystrokeTime
            keystrokeTimings.add(interval)
            // Keep only last 100 timings to bound memory
            if (keystrokeTimings.size > 100) {
                keystrokeTimings.removeAt(0)
            }
        }
        lastKeystrokeTime = now
    }

    /**
     * Record a paste event in the given field.
     * Pasting recipient numbers is a strong fraud indicator (RULE_004).
     */
    fun recordPaste(field: String) {
        pasteDetected = true
        if (field !in pastedFields) {
            pastedFields.add(field)
        }
    }

    /**
     * Record when the user changes the recipient mid-flow.
     * Multiple changes suggest testing different mule accounts (RULE_012).
     */
    fun recordRecipientChange() {
        recipientChangedCount++
    }

    /**
     * Record when the transaction creation screen is reached.
     * Rushed transactions (< 10s from session start) trigger RULE_003.
     */
    fun recordTransactionScreenReached() {
        transactionCreationMs = System.currentTimeMillis() - sessionStartTime
    }

    // ── Collect Snapshot ────────────────────────────────────────────────────

    suspend fun collect(): BehavioralSignals {
        val now = System.currentTimeMillis()
        val sessionDurationMs = if (sessionStartTime > 0) now - sessionStartTime else 0L

        // Compute average keystroke interval
        val avgInterval = if (keystrokeTimings.isNotEmpty()) {
            keystrokeTimings.sum().toDouble() / keystrokeTimings.size
        } else 0.0

        // Typing speed score: normalised 0.0–1.0
        // Typical human: 100-200ms between keys. Very fast (<50ms) → bot suspect
        val typingSpeedScore = when {
            keystrokeTimings.isEmpty() -> 0.5
            avgInterval < 30   -> 0.05  // Inhuman speed → likely automated
            avgInterval < 60   -> 0.15  // Very suspicious
            avgInterval < 100  -> 0.3   // Fast typer
            avgInterval < 200  -> 0.5   // Normal
            avgInterval < 400  -> 0.7   // Slow typer
            else               -> 0.9   // Very slow / hunt-and-peck
        }

        return BehavioralSignals(
            sessionDurationMs         = sessionDurationMs,
            keystrokeCount            = keystrokeCount,
            averageKeystrokeIntervalMs = avgInterval,
            pasteDetected             = pasteDetected,
            pastedFields              = pastedFields.toList(),
            recipientChangedCount     = recipientChangedCount,
            transactionCreationMs     = transactionCreationMs,
            typingSpeedScore          = typingSpeedScore
        )
    }

    // ── Reset ───────────────────────────────────────────────────────────────

    private fun reset() {
        keystrokeCount = 0
        keystrokeTimings.clear()
        lastKeystrokeTime = 0L
        pasteDetected = false
        pastedFields.clear()
        recipientChangedCount = 0
        transactionCreationMs = 0L
    }
}
