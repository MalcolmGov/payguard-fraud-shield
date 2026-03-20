import Foundation
import MessageUI

// MARK: - SmsPatternCollector (iOS)
//
// iOS does not provide API access to the user's SMS inbox.
// On iOS, this collector uses two strategies:
//   1. Observe UNUserNotificationCenter for notification content that matches fraud keywords
//      (works when a fraud SMS arrives while the containing app is in foreground).
//   2. Provide a UIActivity extension hook allowing the user to forward a suspicious SMS
//      to the MoMo app for analysis (user-prompted scan).
//
// The call-state and behavioral collectors are the primary iOS fraud signals.

public struct SmsFraudResult {
    public let keywordsDetected: [String]
    public let riskScore: Int
}

public class SmsPatternCollector: NSObject {

    // Known social-engineering keywords in English + Swahili + Zulu + Shona
    private static let fraudKeywords: [String] = [
        // English
        "OTP", "PIN", "winner", "prize", "claim", "transfer", "urgent", "reward",
        "lottery", "congratulations", "verify", "blocked", "suspended", "refund",
        // Swahili
        "nambari ya siri", "fediha", "tuzo",
        // Zulu
        "inombolo yokufaka", "umvuzo",
        // Shona
        "nambari yekupinda", "mubayiro",
    ]

    // MARK: - User-Prompted SMS Scan
    // Call this when the user taps "I received a suspicious message" in the MoMo UI.
    // Presents a share sheet — the user picks the suspicious SMS from Messages and shares it.
    public func presentSmsSharePrompt(presentingViewController: UIViewController, completion: @escaping (SmsFraudResult) -> Void) {
        let alert = UIAlertController(
            title: "Suspicious Message?",
            message: "To check if you've received a scam message, please copy the message text and paste it below.",
            preferredStyle: .alert
        )
        alert.addTextField { tf in
            tf.placeholder = "Paste SMS text here…"
            tf.autocorrectionType = .no
        }
        alert.addAction(UIAlertAction(title: "Analyse", style: .default) { [weak alert] _ in
            let text = alert?.textFields?.first?.text ?? ""
            let result = SmsPatternCollector.analyse(text: text)
            completion(result)
        })
        alert.addAction(UIAlertAction(title: "Skip", style: .cancel) { _ in
            completion(SmsFraudResult(keywordsDetected: [], riskScore: 0))
        })
        presentingViewController.present(alert, animated: true)
    }

    // MARK: - Notification Observer
    // Call startObservingNotifications() in viewDidLoad / SceneDelegate.
    // When a push or local notification arrives with matching content, the result
    // is broadcast via NotificationCenter so the SDK can elevate the risk signal.
    public func startObservingNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleNotification(_:)),
            name: NSNotification.Name("FraudShield.IncomingNotification"),
            object: nil
        )
    }

    @objc private func handleNotification(_ notification: Notification) {
        guard let body = notification.userInfo?["body"] as? String else { return }
        let result = SmsPatternCollector.analyse(text: body)
        if result.riskScore > 0 {
            NotificationCenter.default.post(
                name: NSNotification.Name("FraudShield.SmsRiskDetected"),
                object: nil,
                userInfo: ["smsFraudResult": result]
            )
        }
    }

    // MARK: - Analysis Engine (shared)
    public static func analyse(text: String) -> SmsFraudResult {
        let uppercased = text.uppercased()
        let detected = fraudKeywords.filter { uppercased.contains($0.uppercased()) }
        let score = min(detected.count * 10, 25)   // cap at RULE_008 max
        return SmsFraudResult(keywordsDetected: detected, riskScore: score)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
