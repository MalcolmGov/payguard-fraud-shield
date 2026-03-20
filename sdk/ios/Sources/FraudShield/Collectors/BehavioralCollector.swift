import Foundation
import UIKit

struct BehavioralSignals {
    let sessionDurationMs: Double
    let keystrokeCount: Int
    let averageKeystrokeIntervalMs: Double
    let pasteDetected: Bool
    let pastedFields: [String]
    let recipientChangedCount: Int
    let transactionCreationMs: Double
    let typingSpeedScore: Double
}

class BehavioralCollector {

    private var sessionStartTime: Date?
    private var keystrokeTimes: [Date] = []
    private var pastedFields: [String] = []
    private var recipientChangedCount = 0

    func onSessionStart() {
        sessionStartTime = Date()
        keystrokeTimes.removeAll()
        pastedFields.removeAll()
        recipientChangedCount = 0

        // Observe UIPasteboard changes as fraud signal
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(pasteboardChanged),
            name: UIPasteboard.changedNotification,
            object: nil
        )
    }

    @objc private func pasteboardChanged() {
        pastedFields.append("pasteboard_change")
    }

    func recordKeystroke(field: String) {
        keystrokeTimes.append(Date())
    }

    func recordPaste(field: String) {
        pastedFields.append(field)
    }

    func recordRecipientChange() {
        recipientChangedCount += 1
    }

    func collect() async -> BehavioralSignals {
        let now = Date()
        let sessionDurationMs = sessionStartTime.map { now.timeIntervalSince($0) * 1000 } ?? 0

        // Calculate average time between keystrokes
        let intervals = zip(keystrokeTimes, keystrokeTimes.dropFirst())
            .map { $1.timeIntervalSince($0) * 1000 }
        let avgInterval = intervals.isEmpty ? 0.0 : intervals.reduce(0, +) / Double(intervals.count)

        let typingSpeedScore: Double
        switch avgInterval {
        case ..<50: typingSpeedScore = 0.1    // Extremely fast — scripted?
        case 50..<800: typingSpeedScore = 1.0 // Normal
        case 800..<3000: typingSpeedScore = 0.6 // Hesitant
        default: typingSpeedScore = avgInterval == 0 ? 0.5 : 0.3 // Very slow — coached?
        }

        return BehavioralSignals(
            sessionDurationMs: sessionDurationMs,
            keystrokeCount: keystrokeTimes.count,
            averageKeystrokeIntervalMs: avgInterval,
            pasteDetected: !pastedFields.isEmpty,
            pastedFields: pastedFields,
            recipientChangedCount: recipientChangedCount,
            transactionCreationMs: sessionDurationMs,
            typingSpeedScore: typingSpeedScore
        )
    }
}
