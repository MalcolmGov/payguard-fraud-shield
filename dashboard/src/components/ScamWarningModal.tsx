interface Props { onClose: () => void; }

export default function ScamWarningModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">⚠️</div>
        <h2>Possible Scam Detected</h2>
        <p>
          Our fraud detection system has flagged this transaction as <strong>HIGH RISK</strong>.<br /><br />
          Were you instructed by someone on a call to make this payment?<br />
          Legitimate companies will <strong>NEVER</strong> ask you to send money to claim a prize or fix your account.
        </p>

        <div style={{
          background: 'rgba(248,81,73,0.07)',
          border: '1px solid rgba(248,81,73,0.25)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 24,
          fontSize: 13,
          color: 'var(--text-secondary)',
          textAlign: 'left'
        }}>
          <strong style={{ color: 'var(--accent-red)' }}>Risk Indicators Detected:</strong>
          <ul style={{ marginTop: 6, paddingLeft: 20, lineHeight: 2 }}>
            <li>📞 Active call during transaction</li>
            <li>👤 Recipient not in your contacts</li>
            <li>💰 Amount significantly above your average</li>
          </ul>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose} id="cancel-transaction-btn">
            ✅ Cancel Transaction (Safe)
          </button>
          <button className="btn btn-ghost" onClick={onClose} id="proceed-anyway-btn" style={{ color: 'var(--accent-red)' }}>
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
