package com.swifter.fraudshield.collectors

data class BehavioralSignals(
    val sessionDurationMs: Long,
    val keystrokeCount: Int,
    val averageKeystrokeIntervalMs: Double,
    val pasteDetected: Boolean,
    val pastedFields: List<String>,
    val recipientChangedCount: Int,
    val transactionCreationMs: Long, // ms from session start to transaction submit
    val typingSpeedScore: Double    // 0.0 (very slow/nervous) to 1.0 (normal)
)

class BehavioralCollector {

    private var sessionStartMs: Long = 0L
    private val keystrokeTimes = mutableListOf<Long>()
    private val pastedFields = mutableListOf<String>()
    private var recipientChangedCount = 0

    fun onSessionStart() {
        sessionStartMs = System.currentTimeMillis()
        keystrokeTimes.clear()
        pastedFields.clear()
        recipientChangedCount = 0
    }

    fun recordKeystroke(fieldName: String) {
        keystrokeTimes.add(System.currentTimeMillis())
    }

    fun recordPaste(fieldName: String) {
        pastedFields.add(fieldName)
        keystrokeTimes.add(System.currentTimeMillis())
    }

    fun recordRecipientChange() {
        recipientChangedCount++
    }

    fun collect(): BehavioralSignals {
        val now = System.currentTimeMillis()
        val sessionDuration = if (sessionStartMs > 0) now - sessionStartMs else 0L
        val transactionCreationMs = sessionDuration

        // Calculate average interval between keystrokes
        val intervals = keystrokeTimes.zipWithNext { a, b -> (b - a).toDouble() }
        val avgInterval = if (intervals.isNotEmpty()) intervals.average() else 0.0

        // Typing speed score: very fast (<50ms avg) = suspicious (rushing),
        // very slow (>3000ms avg) = suspicious (nervous). Normal = 100-800ms
        val typingSpeedScore = when {
            avgInterval <= 0 -> 0.5 // No data
            avgInterval < 50 -> 0.1  // Extremely fast — scripted?
            avgInterval in 50.0..800.0 -> 1.0 // Normal
            avgInterval in 800.0..3000.0 -> 0.6 // Slow — hesitant?
            else -> 0.3 // Very slow — possibly coached
        }

        return BehavioralSignals(
            sessionDurationMs = sessionDuration,
            keystrokeCount = keystrokeTimes.size,
            averageKeystrokeIntervalMs = avgInterval,
            pasteDetected = pastedFields.isNotEmpty(),
            pastedFields = pastedFields.toList(),
            recipientChangedCount = recipientChangedCount,
            transactionCreationMs = transactionCreationMs,
            typingSpeedScore = typingSpeedScore
        )
    }
}
