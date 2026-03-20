import Foundation
import CallKit
import Contacts

struct CallSignals {
    let isOnActiveCall: Bool
    let callType: String
    let isCallerInContacts: Bool
}

class CallStateCollector: NSObject, CXCallObserverDelegate {

    private let callObserver = CXCallObserver()
    private var activeCalls: [CXCall] = []

    override init() {
        super.init()
        callObserver.setDelegate(self, queue: DispatchQueue.main)
    }

    func collect() async -> CallSignals {
        let calls = callObserver.calls
        let isActive = calls.contains { !$0.hasEnded }

        return CallSignals(
            isOnActiveCall: isActive,
            callType: calls.first(where: { !$0.hasEnded }).map { call in
                call.isOutgoing ? "OUTGOING" : "INCOMING"
            } ?? "IDLE",
            isCallerInContacts: false // CXCall does not surface caller ID for privacy
        )
    }

    /// Check if a phone number exists in the user's Contacts.
    /// Used to determine if a MoMo recipient is known to the user.
    func isNumberInContacts(_ phoneNumber: String) async -> Bool {
        return await withCheckedContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                let store = CNContactStore()
                let normalised = phoneNumber.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()

                do {
                    let predicate = CNContact.predicateForContacts(matching: CNPhoneNumber(stringValue: phoneNumber))
                    let contacts = try store.unifiedContacts(matching: predicate, keysToFetch: [CNContactPhoneNumbersKey as CNKeyDescriptor])
                    if !contacts.isEmpty {
                        continuation.resume(returning: true)
                        return
                    }
                    // Also try normalised number
                    let contacts2 = try store.unifiedContacts(matching: CNContact.predicateForContacts(matching: CNPhoneNumber(stringValue: normalised)), keysToFetch: [CNContactPhoneNumbersKey as CNKeyDescriptor])
                    continuation.resume(returning: !contacts2.isEmpty)
                } catch {
                    continuation.resume(returning: false)
                }
            }
        }
    }

    // MARK: - CXCallObserverDelegate
    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        // Delegate kept active to maintain live call state
    }
}
