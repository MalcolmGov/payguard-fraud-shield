// AI Case Summariser — slide-in panel for transaction alerts
import { useState, useEffect } from 'react';
import type { Transaction } from '../data/mock';

type ActionState = 'idle' | 'confirming_freeze' | 'frozen' | 'ussd_sending' | 'ussd_waiting' | 'ussd_confirmed' | 'ussd_denied' | 'safe' | 'contacted';

interface Props { tx: Transaction; onClose: () => void; }

const SUMMARIES: Record<string, { summary: string; timeline: { ts: string; event: string; detail: string; type: 'info' | 'warn' | 'danger' }[]; recommendation: string; confidence: number; }> = {
  HIGH: {
    summary: 'This transaction was flagged as HIGH RISK based on concurrent rule activations. The account holder was on an active call with an unrecognised number when the payment was initiated — a classic vishing indicator. Additionally, the recipient account number was pasted rather than typed, and the transaction amount is 4.2× above this account\'s 30-day average. Two rules fired simultaneously (RULE_003, RULE_007), producing a combined risk score of 89/100.',
    confidence: 89,
    timeline: [
      { ts: '18:12:04', event: 'Session started', detail: 'User opened mobile wallet app · Device fingerprint matched trusted device', type: 'info' },
      { ts: '18:12:31', event: 'Incoming call detected', detail: 'call_active=true · Caller ID: unknown (+2779 unregistered)', type: 'warn' },
      { ts: '18:13:45', event: 'Payment screen opened', detail: 'Transaction initiated · Amount: R8,500', type: 'info' },
      { ts: '18:13:52', event: 'Paste event detected', detail: 'Account number pasted from clipboard · Unusual entry method', type: 'warn' },
      { ts: '18:13:53', event: 'RULE_003 fired', detail: 'Active call during high-value payment → confidence 0.91', type: 'danger' },
      { ts: '18:13:53', event: 'RULE_007 fired', detail: 'Unknown caller + paste event → confidence 0.87', type: 'danger' },
      { ts: '18:13:54', event: 'BLOCK decision issued', detail: 'Combined score: 89/100 · Transaction halted · Scam warning shown', type: 'danger' },
    ],
    recommendation: 'Contact account holder via verified channel (in-app notification, NOT SMS). Confirm whether they intended this payment and whether they were on a call. If vishing confirmed, escalate to fraud team and report the caller number to SAPS. Consider temporary outbound hold for 24h.',
  },
  MEDIUM: {
    summary: 'This transaction was flagged as MEDIUM RISK based on a combination of soft signals. The login originated from a city the account holder has not previously used, and the transaction amount is above average. No active calls or device anomalies were detected. RULE_009 (geo-velocity anomaly) fired with moderate confidence.',
    confidence: 58,
    timeline: [
      { ts: '11:04:12', event: 'Login from new location', detail: 'IP geolocated to Port Elizabeth · Account last active in Johannesburg', type: 'warn' },
      { ts: '11:04:45', event: 'Payment initiated', detail: 'Amount: R3,200 · Recipient: new wallet (first time)', type: 'warn' },
      { ts: '11:04:46', event: 'RULE_009 fired', detail: 'Geo-velocity anomaly · 1,200km in 3h → confidence 0.62', type: 'warn' },
      { ts: '11:04:47', event: 'WARN decision issued', detail: 'Combined score: 58/100 · Friction layer shown to user', type: 'warn' },
    ],
    recommendation: 'Low urgency. Friction layer has been applied. If the user successfully completes step-up verification, allow the transaction. Queue for 24h passive monitoring. No immediate analyst action required unless score increases.',
  },
  LOW: {
    summary: 'This transaction scored LOW RISK. All signals were within expected parameters — the device matches the trusted fingerprint, the recipient account has been used before, the amount is within normal range, and no call state was detected. No rules fired.',
    confidence: 18,
    timeline: [
      { ts: '09:22:10', event: 'Session started', detail: 'Trusted device · Known fingerprint · Normal session time', type: 'info' },
      { ts: '09:22:43', event: 'Payment initiated', detail: 'Amount: R450 · Known recipient wallet', type: 'info' },
      { ts: '09:22:44', event: 'Risk evaluated', detail: 'Score: 18/100 · No rules fired · ALLOW decision issued', type: 'info' },
    ],
    recommendation: 'No action required. Transaction approved automatically. Filed for statistical baseline update.',
  },
};

export default function CaseSummariser({ tx, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [action, setAction] = useState<ActionState>('idle');
  const [ussdCode] = useState(`*384*PG${Math.floor(100000 + Math.random() * 900000)}#`);
  const data = SUMMARIES[tx.riskLevel] ?? SUMMARIES.LOW;
  const TYPE_COLOR = { info: '#0EA5E9', warn: '#FBBF24', danger: '#EF4444' };
  const RISK_COLOR: Record<string, string> = { HIGH: '#EF4444', MEDIUM: '#F97316', LOW: '#10F5A0' };
  const rColor = RISK_COLOR[tx.riskLevel] ?? '#0EA5E9';

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setGenerating(false), 1400);
    return () => clearTimeout(t);
  }, []);

  const doUssdPush = async () => {
    setAction('ussd_sending');
    await new Promise(r => setTimeout(r, 1200));
    setAction('ussd_waiting');
    await new Promise(r => setTimeout(r, 3800));
    const outcome = Math.random() > 0.3 ? 'ussd_confirmed' : 'ussd_denied';
    setAction(outcome);
    if (outcome === 'ussd_denied') {
      // Auto escalate to frozen
      await new Promise(r => setTimeout(r, 2000));
      setAction('frozen');
    }
  };

  const close = () => { setVisible(false); setTimeout(onClose, 300); };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div style={{
        width: 480, background: 'linear-gradient(160deg,#0A1628,#0A101E)',
        borderLeft: `1px solid ${rColor}30`,
        boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
        overflowY: 'auto',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 22px', borderBottom: `1px solid ${rColor}20`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: rColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>🤖 AI CASE SUMMARY</div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, margin: 0, color: '#F0F6FF' }}>{tx.id}</h2>
            </div>
            <button onClick={close} style={{ background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#64748B', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { label: 'Amount', value: `R${tx.amount.toLocaleString()}` },
              { label: 'Risk level', value: tx.riskLevel, color: rColor },
              { label: 'Score', value: String(tx.riskScore), color: rColor },
            ].map(k => (
              <div key={k.label} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.07)', borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: '#64748B', marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: k.color ?? '#F0F6FF', fontFamily: 'Outfit' }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {generating ? (
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🤖</div>
              <div style={{ fontSize: 13, color: '#8B949E', marginBottom: 16 }}>Analysing transaction signals…</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ width: 8, height: 8, borderRadius: '50%', background: rColor, animation: 'pulse 1.2s infinite', animationDelay: `${j * 0.2}s` }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* AI Summary paragraph */}
              <div style={{ padding: '14px 16px', background: `${rColor}07`, border: `1px solid ${rColor}20`, borderRadius: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: rColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>AI Analysis</div>
                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.85, margin: 0 }}>{data.summary}</p>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#64748B' }}>Confidence:</span>
                  <div style={{ flex: 1, height: 4, background: 'var(--w-card)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${data.confidence}%`, height: '100%', background: `linear-gradient(90deg, #10F5A0, ${rColor})`, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: rColor }}>{data.confidence}%</span>
                </div>
              </div>

              {/* Event timeline */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Event Timeline</div>
                {data.timeline.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLOR[ev.type], marginTop: 3 }} />
                      {i < data.timeline.length - 1 && <div style={{ width: 1, height: 22, background: 'var(--w-card)' }} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#64748B' }}>{ev.ts}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[ev.type] }}>{ev.event}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#8B949E', lineHeight: 1.5 }}>{ev.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div style={{ padding: '14px 16px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>🤖 Recommended Action</div>
                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.8, margin: 0 }}>{data.recommendation}</p>
              </div>

              {/* Action section */}
              {action === 'idle' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setAction('confirming_freeze')} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🔒 Freeze Account</button>
                  <button onClick={() => setAction('safe')} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(16,245,160,0.08)', border: '1px solid rgba(16,245,160,0.25)', color: '#10F5A0', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✅ Mark Safe</button>
                  <button onClick={() => { setAction('contacted'); }} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#0EA5E9', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>📲 USSD Push</button>
                </div>
              )}

              {/* Freeze confirmation */}
              {action === 'confirming_freeze' && (
                <div style={{ padding: '16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>⚠️ Confirm Freeze?</div>
                  <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7, margin: '0 0 12px' }}>This will immediately block all outbound transactions for this account and escalate the case to the fraud queue. The account holder will be notified via in-app message.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setAction('idle')} style={{ flex: 1, padding: '9px', borderRadius: 9, background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748B', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => setAction('frozen')} style={{ flex: 1, padding: '9px', borderRadius: 9, background: 'linear-gradient(135deg,#EF4444,#DC2626)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🔒 Confirm Freeze</button>
                  </div>
                </div>
              )}

              {/* Frozen state */}
              {action === 'frozen' && (
                <div style={{ padding: '16px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', marginBottom: 6 }}>🔒 Account Frozen</div>
                  <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7, margin: '0 0 12px' }}>All outbound transactions have been blocked. Case escalated to fraud analyst queue. Account holder notified via in-app message. Ref: CASE-{tx.id}.</p>
                  <button onClick={() => setAction('idle')} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(16,245,160,0.08)', border: '1px solid rgba(16,245,160,0.25)', color: '#10F5A0', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🔓 Unfreeze</button>
                </div>
              )}

              {/* USSD Push states */}
              {(action === 'contacted' || action === 'ussd_sending' || action === 'ussd_waiting' || action === 'ussd_confirmed' || action === 'ussd_denied') && (
                <div style={{ padding: '16px', borderRadius: 14,
                  background: action === 'ussd_confirmed' ? 'rgba(16,245,160,0.07)' : action === 'ussd_denied' ? 'rgba(239,68,68,0.07)' : 'rgba(14,165,233,0.07)',
                  border: `1px solid ${action === 'ussd_confirmed' ? 'rgba(16,245,160,0.25)' : action === 'ussd_denied' ? 'rgba(239,68,68,0.25)' : 'rgba(14,165,233,0.25)'}` }}>
                  {action === 'contacted' && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0EA5E9', marginBottom: 8 }}>📲 Ready to send USSD Challenge</div>
                      <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7, margin: '0 0 12px' }}>This will push <strong style={{ color: '#0EA5E9', fontFamily: 'JetBrains Mono' }}>{ussdCode}</strong> to the account holder's registered SIM ({tx.userPhone}). They must respond 1 (Confirm) or 2 (Deny) within 300 seconds.</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setAction('idle')} style={{ flex: 1, padding: '9px', borderRadius: 9, background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748B', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={doUssdPush} style={{ flex: 1, padding: '9px', borderRadius: 9, background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>📡 Send Now</button>
                      </div>
                    </>
                  )}
                  {action === 'ussd_sending' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 4 }}>{[0,1,2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', animation: 'pulse 1.2s infinite', animationDelay: `${j*0.2}s` }} />)}</div>
                      <span style={{ fontSize: 12, color: '#0EA5E9', fontWeight: 600 }}>Sending USSD push to {tx.userPhone}…</span>
                    </div>
                  )}
                  {action === 'ussd_waiting' && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#FBBF24', marginBottom: 6 }}>⏳ Awaiting SIM Response</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}><span style={{ fontFamily: 'JetBrains Mono', color: '#FBBF24' }}>{ussdCode}</span> sent · Customer presses 1 to confirm or 2 to deny</div>
                      <div style={{ height: 3, background: 'var(--w-card)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#FBBF24', borderRadius: 99, animation: 'progressBar 3.8s linear forwards' }} />
                      </div>
                    </>
                  )}
                  {action === 'ussd_confirmed' && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#10F5A0', marginBottom: 6 }}>✅ Confirmed — Account Holder Verified</div>
                      <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7, margin: '0 0 10px' }}>Customer pressed <strong style={{ color: '#10F5A0' }}>1 (Confirm)</strong> — they initiated this session. Transaction may proceed. Risk score reset to baseline.</p>
                      <button onClick={() => setAction('idle')} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748B', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Close</button>
                    </>
                  )}
                  {action === 'ussd_denied' && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', marginBottom: 6 }}>🚨 Denied — Freezing Account…</div>
                      <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7, margin: 0 }}>Customer pressed <strong style={{ color: '#EF4444' }}>2 (Deny)</strong> — fraudster cannot complete challenge. Auto-freezing account and escalating to fraud queue.</p>
                    </>
                  )}
                </div>
              )}

              {/* Mark Safe state */}
              {action === 'safe' && (
                <div style={{ padding: '16px', background: 'rgba(16,245,160,0.07)', border: '1px solid rgba(16,245,160,0.25)', borderRadius: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#10F5A0', marginBottom: 6 }}>✅ Marked Safe</div>
                  <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7, margin: '0 0 10px' }}>Transaction {tx.id} marked as legitimate by analyst. Score suppressed for this session. Note added to account history. No further action required.</p>
                  <button onClick={() => setAction('idle')} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748B', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Undo</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
