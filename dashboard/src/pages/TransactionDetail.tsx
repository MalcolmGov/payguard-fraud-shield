import { useParams, useNavigate } from 'react-router-dom';
import { mockTransactions, mockRules } from '../data/mock';

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tx = mockTransactions.find(t => t.id === id);

  if (!tx) return (
    <div className="page-content" style={{ paddingTop: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
      Transaction not found.{' '}
      <button className="btn btn-ghost" onClick={() => navigate('/transactions')}>Back</button>
    </div>
  );

  const triggeredRuleDetails = mockRules.filter(r => tx.triggeredRules.includes(r.ruleId));

  return (
    <div>
      <div className="topbar">
        <div className="flex items-center gap-8">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
          <span className="topbar-title">Transaction Detail</span>
        </div>
        <span className={`badge badge-${tx.riskLevel.toLowerCase()}`}>{tx.riskLevel} RISK</span>
      </div>

      <div className="page-content">
        {/* Call State Alert */}
        {tx.onCall && (
          <div style={{
            background: 'rgba(248,81,73,0.1)',
            border: '1px solid rgba(248,81,73,0.4)',
            borderRadius: 10,
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#F85149',
            fontWeight: 600
          }}>
            📞 Active Call Detected — User was on a call during this transaction. Highest social engineering risk indicator.
          </div>
        )}

        {/* Transaction Summary */}
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">Transaction Summary</span></div>
            <table>
              <tbody>
                {[
                  ['Transaction ID', tx.id],
                  ['User Phone', tx.userPhone],
                  ['Recipient Wallet', tx.recipientWallet],
                  ['Amount', `R${tx.amount.toLocaleString()}`],
                  ['Timestamp', new Date(tx.createdAt).toLocaleString()],
                  ['On Active Call', tx.onCall ? '⚠️ YES' : 'No'],
                ].map(([label, value]) => (
                  <tr key={label as string}>
                    <td style={{ color: 'var(--text-muted)', width: '40%', borderBottom: '1px solid var(--border-subtle)', padding: '10px 0' }}>
                      {label}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, borderBottom: '1px solid var(--border-subtle)', padding: '10px 0' }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Risk Decision */}
          <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontSize: 64, fontFamily: 'JetBrains Mono', fontWeight: 700, color: tx.riskLevel === 'HIGH' ? '#F85149' : tx.riskLevel === 'MEDIUM' ? '#D29922' : '#3FB950' }}>
              {tx.riskScore}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Risk Score (0–100)</div>
            <span className={`action-tag action-${tx.recommendedAction}`} style={{ fontSize: 14, padding: '8px 20px' }}>
              {tx.recommendedAction}
            </span>
          </div>
        </div>

        {/* Triggered Rules */}
        <div className="card mt-16">
          <div className="card-header">
            <span className="card-title">Triggered Fraud Rules ({triggeredRuleDetails.length})</span>
          </div>
          {triggeredRuleDetails.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No rules triggered — transaction is clean.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rule ID</th>
                    <th>Description</th>
                    <th>Score Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {triggeredRuleDetails.map(rule => (
                    <tr key={rule.ruleId}>
                      <td><span className="badge badge-high">{rule.ruleId}</span></td>
                      <td>{rule.description}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: '#F85149', fontWeight: 600 }}>+{rule.scoreDelta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
