import Foundation
import CallKit
import UIKit

// MARK: - OtpGuard (iOS)
//
// Protects OTP screens from social engineering disclosure.
//
// INTEGRATION:
//   class OtpViewController: UIViewController {
//       private let otpGuard = OtpGuard.shared
//
//       override func viewWillAppear(_ animated: Bool) {
//           super.viewWillAppear(animated)
//           otpGuard.activate(on: self) { riskLevel in
//               if riskLevel == .highRisk {
//                   // Optionally auto-cancel the OTP request
//               }
//           }
//       }
//
//       override func viewWillDisappear(_ animated: Bool) {
//           super.viewWillDisappear(animated)
//           otpGuard.deactivate()
//       }
//   }

public enum OtpRiskLevel {
    case clean        // Not on a call
    case mediumRisk   // On a known call — warning shown
    case highRisk     // On a call with unknown caller — full block shown
}

public class OtpGuard: NSObject {
    public static let shared = OtpGuard()

    private let callObserver = CXCallObserver()
    private var warningViewController: UIViewController?
    private weak var hostController: UIViewController?

    private override init() {
        super.init()
        callObserver.setDelegate(self, queue: .main)
    }

    // MARK: - Public API

    /// Call when the OTP screen appears. Checks for active call and applies protections.
    public func activate(on viewController: UIViewController, completion: @escaping (OtpRiskLevel) -> Void) {
        hostController = viewController

        // Prevent screenshots — marks the window as secure
        viewController.view.window?.isHidden = false
        setScreenshotProtection(enabled: true, on: viewController)

        let activeCalls = callObserver.calls.filter { !$0.hasEnded }
        guard !activeCalls.isEmpty else {
            completion(.clean)
            return
        }

        let isConnected = activeCalls.contains { $0.hasConnected }
        guard isConnected else {
            completion(.clean)
            return
        }

        // We can't easily determine unknown caller on iOS without Contacts access.
        // Use CallStateCollector's contact-check logic instead.
        let callCollector = CallStateCollector()
        let riskLevel: OtpRiskLevel = callCollector.isCallerUnknown() ? .highRisk : .mediumRisk

        showWarningOverlay(on: viewController, riskLevel: riskLevel)
        fireOtpOnCallSignal(riskLevel: riskLevel)
        completion(riskLevel)
    }

    /// Call when OTP screen disappears.
    public func deactivate() {
        removeWarningOverlay()
        if let host = hostController {
            setScreenshotProtection(enabled: false, on: host)
        }
        hostController = nil
    }

    // MARK: - Screenshot Prevention

    private func setScreenshotProtection(enabled: Bool, on viewController: UIViewController) {
        // iOS does not provide a FLAG_SECURE equivalent, but we can obscure
        // the OTP field using a secure text field approach — the host app's
        // OTP fields should use UITextField.isSecureTextEntry = true.
        // We add an opaque UITextField overlay trick to prevent system screenshot capture.
        if enabled {
            let secureField = UITextField()
            secureField.isSecureTextEntry = true
            secureField.frame = viewController.view.bounds
            secureField.backgroundColor = .clear
            secureField.isUserInteractionEnabled = false
            secureField.tag = 9998
            viewController.view.addSubview(secureField)
            viewController.view.layer.superlayer?.addSublayer(secureField.layer)
            secureField.layer.sublayers?.last?.addSublayer(viewController.view.layer)
        } else {
            viewController.view.subviews.first(where: { $0.tag == 9998 })?.removeFromSuperview()
        }
    }

    // MARK: - Warning Overlay

    private func showWarningOverlay(on presenter: UIViewController, riskLevel: OtpRiskLevel) {
        let vc = OtpWarningViewController(riskLevel: riskLevel)
        vc.modalPresentationStyle = .overFullScreen
        vc.modalTransitionStyle = .crossDissolve
        warningViewController = vc
        presenter.present(vc, animated: true)
    }

    private func removeWarningOverlay() {
        warningViewController?.dismiss(animated: true)
        warningViewController = nil
    }

    // MARK: - Risk Signal

    private func fireOtpOnCallSignal(riskLevel: OtpRiskLevel) {
        Task {
            let payload: [String: Any] = [
                "event_type": "OTP_SCREEN_ON_CALL",
                "unknown_caller": riskLevel == .highRisk,
                "rule": "RULE_011",
                "risk_delta": riskLevel == .highRisk ? 80 : 45,
                "timestamp": Date().timeIntervalSince1970,
            ]
            try? await FraudSignalDispatcher.shared.dispatchEvent(payload)
        }
    }
}

// MARK: - CXCallObserverDelegate

extension OtpGuard: CXCallObserverDelegate {
    public func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        // If a call ends while OTP screen is still active, remove the overlay
        if call.hasEnded, warningViewController != nil {
            removeWarningOverlay()
        }
    }
}

// MARK: - Warning View Controller

private class OtpWarningViewController: UIViewController {
    private let riskLevel: OtpRiskLevel

    init(riskLevel: OtpRiskLevel) {
        self.riskLevel = riskLevel
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.78, green: 0.10, blue: 0.10, alpha: 0.95)

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 16
        stack.alignment = .center
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),
        ])

        let emoji = UILabel()
        emoji.text = riskLevel == .highRisk ? "🚨" : "⚠️"
        emoji.font = .systemFont(ofSize: 56)
        stack.addArrangedSubview(emoji)

        let headline = UILabel()
        headline.text = riskLevel == .highRisk ? "SCAM ALERT" : "Active Call Detected"
        headline.font = .boldSystemFont(ofSize: 22)
        headline.textColor = .white
        headline.textAlignment = .center
        stack.addArrangedSubview(headline)

        let body = UILabel()
        body.numberOfLines = 0
        body.textAlignment = .center
        body.textColor = UIColor(white: 0.9, alpha: 1)
        body.font = .systemFont(ofSize: 15)
        body.text = riskLevel == .highRisk
            ? "You are on a call with an UNKNOWN number.\n\n⛔ NEVER read your OTP to anyone.\n⛔ MTN will never ask for your code.\n⛔ Hang up immediately."
            : "You are on an active call.\n\nNever share your OTP verbally.\nOnly enter it directly on the app screen."
        stack.addArrangedSubview(body)

        if riskLevel == .highRisk {
            let btn = UIButton(type: .system)
            btn.setTitle("I understand — End Call Now", for: .normal)
            btn.backgroundColor = UIColor.white
            btn.setTitleColor(UIColor(red: 0.78, green: 0.10, blue: 0.10, alpha: 1), for: .normal)
            btn.titleLabel?.font = .boldSystemFont(ofSize: 15)
            btn.layer.cornerRadius = 10
            btn.contentEdgeInsets = UIEdgeInsets(top: 12, left: 24, bottom: 12, right: 24)
            btn.addTarget(self, action: #selector(dismiss(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }
    }

    @objc private func dismiss(_ sender: Any) {
        dismiss(animated: true)
    }
}
