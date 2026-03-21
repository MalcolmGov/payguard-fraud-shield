import { useState, useEffect } from 'react';

interface Account {
  id: string; phone: string; name: string; province: string;
  precrime: number; trend: 'rising' | 'stable' | 'falling';
  signals: string[]; lastActivity: string; amount: number;
  sparkline: number[]; recommendation: string; riskFactors: string[];
}

const SAMPLE_ACCOUNTS: Account[] = [
  { id: 'AC-8812', phone: '+27821 •••• 881', name: 'T. Mokoena', province: 'Gauteng',
    precrime: 94, trend: 'rising', amount: 15000,
    signals: ['New device 3h ago', 'SIM serial changed', 'Contact: known scammer'],
    sparkline: [20, 28, 35, 42, 58, 71, 88, 94],
    lastActivity: '14 min ago',
    recommendation: 'Freeze outbound transactions. Trigger USSD device re-verification immediately.',
    riskFactors: ['SIM serial mismatch within 48h', 'Unknown caller 22min before login', 'Paste event detected'] },
  { id: 'AC-3341', phone: '+27831 •••• 204', name: 'L. Dlamini', province: 'KwaZulu-Natal',
    precrime: 87, trend: 'rising', amount: 8500,
    signals: ['3 failed OTPs', 'Geo anomaly: Lagos', 'Keystroke anomaly'],
    sparkline: [30, 38, 45, 50, 62, 74, 82, 87],
    lastActivity: '31 min ago',
    recommendation: 'Apply friction layer for next 3 transactions. Escalate to fraud analyst queue.',
    riskFactors: ['Login from foreign IP', 'Typing speed 4x above baseline', 'Multiple OTP requests'] },
  { id: 'AC-9977', phone: '+27711 •••• 559', name: 'M. Nkosi', province: 'Gauteng',
    precrime: 79, trend: 'rising', amount: 22000,
    signals: ['Screen capture active', 'High value tx pending', 'Call state on'],
    sparkline: [15, 20, 28, 40, 55, 60, 73, 79],
    lastActivity: '1h 12min ago',
    recommendation: 'Block transaction pending. Notify account holder via verified channel.',
    riskFactors: ['MediaProjection API running during payment', 'Outbound transaction >R20k', 'Vishing call pattern'] },
  { id: 'AC-5523', phone: '+27841 •••• 117', name: 'P. van der Berg', province: 'Western Cape',
    precrime: 61, trend: 'rising', amount: 3200,
    signals: ['New recipient wallet', 'Off-hours login', 'VPN detected'],
    sparkline: [20, 25, 30, 35, 40, 48, 55, 61],
    lastActivity: '2h ago',
    recommendation: 'Monitor closely. Apply soft WARN friction on next payment attempt.',
    riskFactors: ['First-time recipient wallet', 'Login at 02:34 AM', 'VPN endpoint in Russia'] },
  { id: 'AC-7734', phone: '+27761 •••• 332', name: 'N. Sithole', province: 'Eastern Cape',
    precrime: 48, trend: 'stable', amount: 1400,
    signals: ['Unusual amount', 'New session location'],
    sparkline: [30, 35, 38, 40, 43, 46, 48, 48],
    lastActivity: '3h ago',
    recommendation: 'Watchlist. No immediate action required. Review if score exceeds 70.',
    riskFactors: ['Amount 3x above average', 'Login from new city (Port Elizabeth)'] },
  { id: 'AC-2289', phone: '+27791 •••• 773', name: 'S. Mahlangu', province: 'Mpumalanga',
    precrime: 31, trend: 'falling', amount: 800,
    signals: ['Resolved: suspicious login'],
    sparkline: [60, 55, 48, 42, 38, 35, 33, 31],
    lastActivity: '5h ago',
    recommendation: 'Risk diminishing. USSD verification completed successfully. Resume normal monitoring.',
    riskFactors: [] },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts.split(' ').at(-1)!.split(',')[0]} cy={pts.split(' ').at(-1)!.split(',')[1]} r="3" fill={color} />
    </svg>
  );
}

type UssdStatus = 'idle' | 'sending' | 'waiting' | 'confirmed' | 'denied' | 'timeout';
interface Toast { id: number; msg: string; type: 'success' | 'warn' | 'error'; }

const TREND_ICON = { rising: '↑', stable: '→', falling: '↓' };
const TREND_COLOR = { rising: '#EF4444', stable: '#FBBF24', falling: '#10F5A0' };
const SCORE_COLOR = (s: number) => s >= 80 ? '#EF4444' : s >= 60 ? '#F97316' : s >= 40 ? '#FBBF24' : '#10F5A0';

export default function PrecrimePage() {
  const [selected, setSelected] = useState<Account>(SAMPLE_ACCOUNTS[0]);
  const [scores, setScores] = useState(SAMPLE_ACCOUNTS.map(a => a.precrime));
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [frozenAccounts, setFrozenAccounts] = useState<Set<string>>(new Set());
  const [confirmFreeze, setConfirmFreeze] = useState<Account | null>(null);
  const [ussdStatus, setUssdStatus] = useState<Record<string, UssdStatus>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastId = 0;

  const addToast = (msg: string, type: Toast['type']) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // Simulate live score drift (frozen accounts don't need drift but still update)
  useEffect(() => {
    const t = setInterval(() => {
      setScores(prev => prev.map((s, i) => {
        if (frozenAccounts.has(SAMPLE_ACCOUNTS[i].id)) return s; // stop drift for frozen
        return Math.min(99, Math.max(10, s + (Math.random() > 0.6 ? 1 : -1) * Math.floor(Math.random() * 2)));
      }));
      setLastUpdate(new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 3000);
    return () => clearInterval(t);
  }, [frozenAccounts]);

  const doFreeze = (acc: Account) => {
    setFrozenAccounts(prev => new Set([...prev, acc.id]));
    setConfirmFreeze(null);
    // Freeze also stops score updates — set score to 0 visually after freeze
    const idx = SAMPLE_ACCOUNTS.findIndex(a => a.id === acc.id);
    setScores(prev => prev.map((s, i) => i === idx ? 0 : s));
    addToast(`✅ ${acc.name} (${acc.id}) — account frozen. All outbound transactions blocked.`, 'success');
  };

  const doUnfreeze = (acc: Account) => {
    setFrozenAccounts(prev => { const s = new Set(prev); s.delete(acc.id); return s; });
    const idx = SAMPLE_ACCOUNTS.findIndex(a => a.id === acc.id);
    setScores(prev => prev.map((s, i) => i === idx ? acc.precrime : s));
    addToast(`🔓 ${acc.name} (${acc.id}) — account unfrozen. Normal monitoring resumed.`, 'warn');
  };

  const doUssdPush = async (acc: Account) => {
    if (ussdStatus[acc.id] === 'sending' || ussdStatus[acc.id] === 'waiting') return;
    const code = `*384*PG${Math.floor(100000 + Math.random() * 900000)}#`;
    setUssdStatus(prev => ({ ...prev, [acc.id]: 'sending' }));
    addToast(`📲 USSD push initiated to ${acc.phone}…`, 'warn');
    await new Promise(r => setTimeout(r, 1200));
    setUssdStatus(prev => ({ ...prev, [acc.id]: 'waiting' }));
    addToast(`⏳ ${code} sent · Awaiting response from physical SIM…`, 'warn');
    // Simulate random outcome after 3.5s
    await new Promise(r => setTimeout(r, 3500));
    const outcome = Math.random() > 0.3 ? 'confirmed' : 'denied';
    setUssdStatus(prev => ({ ...prev, [acc.id]: outcome }));
    if (outcome === 'confirmed') {
      addToast(`✅ ${acc.name} confirmed via USSD — account holder verified. Transaction allowed.`, 'success');
    } else {
      addToast(`🚨 ${acc.name} DENIED via USSD — fraudster cannot complete USSD challenge. Account frozen.`, 'error');
      setFrozenAccounts(prev => new Set([...prev, acc.id]));
      const idx = SAMPLE_ACCOUNTS.findIndex(a => a.id === acc.id);
      setScores(prev => prev.map((s, i) => i === idx ? 0 : s));
    }
    // Reset USSD status after 8s so button is usable again
    setTimeout(() => setUssdStatus(prev => ({ ...prev, [acc.id]: 'idle' })), 8000);
  };

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)', background: '#0D1629', minHeight: '100vh' }}>
      {/* Toast stack */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: 360 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 16px', borderRadius: 12, fontSize: 12, lineHeight: 1.6, fontWeight: 500,
            background: t.type === 'success' ? 'rgba(16,245,160,0.1)' : t.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.1)',
            border: `1px solid ${t.type === 'success' ? 'rgba(16,245,160,0.35)' : t.type === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(251,191,36,0.35)'}`,
            color: t.type === 'success' ? '#10F5A0' : t.type === 'error' ? '#EF4444' : '#FBBF24',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: 'fadeInDown 0.3s ease',
          }}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* Freeze Confirmation Dialog */}
      {confirmFreeze && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setConfirmFreeze(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0A101E', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: 32, width: 420, boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>🔒</div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>Freeze Account?</h3>
            <p style={{ fontSize: 13, color: 'var(--w-text-3)', textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
              This will immediately block all outbound transactions for <strong style={{ color: 'var(--w-text-1)' }}>{confirmFreeze.name}</strong> ({confirmFreeze.id}) and remove them from the pre-crime watchlist. The account holder will receive an in-app notification.
            </p>
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 20, fontSize: 12, color: 'var(--w-text-2)' }}>
              <strong style={{ color: '#EF4444' }}>Account:</strong> {confirmFreeze.id} · {confirmFreeze.phone}<br />
              <strong style={{ color: '#EF4444' }}>Reason:</strong> Pre-crime score {scores[SAMPLE_ACCOUNTS.findIndex(a => a.id === confirmFreeze.id)]}/100 — {confirmFreeze.signals[0]}<br />
              <strong style={{ color: '#EF4444' }}>Action:</strong> Outbound block + analyst queue escalation
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmFreeze(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--w-text-3)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => doFreeze(confirmFreeze)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg,#EF4444,#DC2626)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>🔒 Confirm Freeze</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>🤖 AI PRE-CRIME ENGINE</div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Account Pre-crime Score</h1>
        <p style={{ color: 'var(--w-text-2)', fontSize: 13, margin: 0 }}>ML model scoring accounts on 24h attack probability · Updated every 3 seconds · <span style={{ color: '#10F5A0' }}>Live</span> · Last: {lastUpdate}</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Critical (≥80)', value: scores.filter(s => s >= 80).length, color: '#EF4444', icon: '🚨' },
          { label: 'High Risk (60–79)', value: scores.filter(s => s >= 60 && s < 80).length, color: '#F97316', icon: '⚠️' },
          { label: 'Frozen accounts', value: frozenAccounts.size, color: '#7C3AED', icon: '🔒' },
          { label: 'Avg 24h Score', value: `${Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)}`, color: '#0EA5E9', icon: '📊' },
        ].map(k => (
          <div key={k.label} style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.12)', border: `1px solid ${k.color}25`, borderRadius: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--w-text-2)', marginBottom: 4 }}>{k.icon} {k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color, fontFamily: 'Outfit' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Watchlist */}
        <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--w-text-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>At-Risk Watchlist — Ranked by 24h Score</span>
          </div>
          {SAMPLE_ACCOUNTS.map((acc, idx) => {
            const score = scores[idx];
            const color = frozenAccounts.has(acc.id) ? '#7C3AED' : SCORE_COLOR(score);
            const isFrozen = frozenAccounts.has(acc.id);
            const uStat = ussdStatus[acc.id] ?? 'idle';
            const isSelected = selected.id === acc.id;
            return (
              <div key={acc.id} onClick={() => setSelected(acc)} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 80px 100px 90px',
                alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer',
                background: isFrozen ? 'rgba(124,58,237,0.06)' : isSelected ? 'rgba(14,165,233,0.06)' : 'transparent',
                borderLeft: `3px solid ${isFrozen ? '#7C3AED' : isSelected ? '#0EA5E9' : 'transparent'}`,
                borderBottom: '1px solid var(--w-card-border)', transition: 'all 0.15s',
                opacity: isFrozen ? 0.75 : 1,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color, fontFamily: 'Outfit' }}>
                  {isFrozen ? '🔒' : score}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {acc.name}
                    {isFrozen && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#7C3AED', fontWeight: 700 }}>FROZEN</span>}
                    {uStat === 'waiting' && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24', fontWeight: 700 }}>USSD PENDING</span>}
                    {uStat === 'confirmed' && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(16,245,160,0.12)', border: '1px solid rgba(16,245,160,0.3)', color: '#10F5A0', fontWeight: 700 }}>✓ VERIFIED</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--w-text-2)', fontFamily: 'JetBrains Mono' }}>{acc.id} · {acc.province}</div>
                  <div style={{ fontSize: 10, color: 'var(--w-text-3)', marginTop: 3 }}>{acc.signals.slice(0,2).join(' · ')}</div>
                </div>
                <Sparkline data={acc.sparkline} color={color} />
                <div style={{ fontSize: 11, color: TREND_COLOR[acc.trend], fontWeight: 700 }}>
                  {TREND_ICON[acc.trend]} {acc.trend.charAt(0).toUpperCase() + acc.trend.slice(1)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--w-text-2)' }}>{acc.lastActivity}</div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {(() => {
          const idx = SAMPLE_ACCOUNTS.findIndex(a => a.id === selected.id);
          const score = scores[idx];
          const color = frozenAccounts.has(selected.id) ? '#7C3AED' : SCORE_COLOR(score);
          const isFrozen = frozenAccounts.has(selected.id);
          const uStat = ussdStatus[selected.id] ?? 'idle';

          return (
            <div style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid ${color}30`, borderRadius: 20, padding: 22, position: 'sticky', top: 20, height: 'fit-content', transition: 'border-color 0.4s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    {isFrozen ? '🔒 FROZEN — Transactions Blocked' : 'Pre-crime Score'}
                  </div>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 800, margin: 0 }}>{selected.name}</h2>
                  <div style={{ fontSize: 11, color: 'var(--w-text-2)', marginTop: 2, fontFamily: 'JetBrains Mono' }}>{selected.phone} · {selected.province}</div>
                </div>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: `${color}15`, border: `2px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isFrozen ? 26 : 26, fontWeight: 900, color, fontFamily: 'Outfit' }}>
                  {isFrozen ? '🔒' : score}
                </div>
              </div>

              {/* Score bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ width: `${isFrozen ? 0 : score}%`, height: '100%', background: `linear-gradient(90deg, #10F5A0, ${color})`, borderRadius: 99, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--w-text-3)' }}>
                  <span>LOW</span><span>MEDIUM</span><span>HIGH</span><span>CRITICAL</span>
                </div>
              </div>

              {/* USSD Status panel */}
              {(uStat === 'waiting' || uStat === 'confirmed' || uStat === 'denied') && (
                <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12,
                  background: uStat === 'confirmed' ? 'rgba(16,245,160,0.07)' : uStat === 'denied' ? 'rgba(239,68,68,0.07)' : 'rgba(251,191,36,0.07)',
                  border: `1px solid ${uStat === 'confirmed' ? 'rgba(16,245,160,0.25)' : uStat === 'denied' ? 'rgba(239,68,68,0.25)' : 'rgba(251,191,36,0.25)'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: uStat === 'confirmed' ? '#10F5A0' : uStat === 'denied' ? '#EF4444' : '#FBBF24' }}>
                    {uStat === 'waiting' && '⏳ USSD Push Sent — Awaiting Response'}
                    {uStat === 'confirmed' && '✅ USSD Confirmed — Account Holder Verified'}
                    {uStat === 'denied' && '🚨 USSD Denied — Account Frozen Automatically'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--w-text-3)' }}>
                    {uStat === 'waiting' && 'Customer must press 1 (Confirm) or 2 (Deny) on their physical SIM.'}
                    {uStat === 'confirmed' && 'Account holder confirmed they initiated the session. Risk score reset.'}
                    {uStat === 'denied' && 'Fraudster could not complete USSD challenge. Account blocked and escalated.'}
                  </div>
                </div>
              )}

              {/* Signals */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--w-text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Triggered signals</div>
                {selected.signals.map(s => (
                  <div key={s} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--w-text-2)' }}>{s}</span>
                  </div>
                ))}
              </div>

              {/* Risk factors */}
              {selected.riskFactors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: 'var(--w-text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Risk factors</div>
                  {selected.riskFactors.map(f => (
                    <div key={f} style={{ fontSize: 11, color: 'var(--w-text-3)', marginBottom: 4, paddingLeft: 10, borderLeft: `2px solid ${color}40` }}>{f}</div>
                  ))}
                </div>
              )}

              {/* AI Recommendation */}
              <div style={{ padding: 14, background: `${color}08`, border: `1px solid ${color}25`, borderRadius: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🤖 AI Recommendation</div>
                <p style={{ fontSize: 11, color: 'var(--w-text-3)', lineHeight: 1.7, margin: 0 }}>{selected.recommendation}</p>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                {isFrozen ? (
                  <button onClick={() => doUnfreeze(selected)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(16,245,160,0.08)', border: '1px solid rgba(16,245,160,0.3)', color: '#10F5A0', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🔓 Unfreeze Account</button>
                ) : (
                  <button onClick={() => setConfirmFreeze(selected)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🔒 Freeze Account</button>
                )}
                <button
                  onClick={() => doUssdPush(selected)}
                  disabled={uStat === 'sending' || uStat === 'waiting' || isFrozen}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: (uStat === 'sending' || uStat === 'waiting' || isFrozen) ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700,
                    background: uStat === 'confirmed' ? 'rgba(16,245,160,0.1)' : uStat === 'denied' ? 'rgba(239,68,68,0.1)' : 'rgba(14,165,233,0.1)',
                    border: `1px solid ${uStat === 'confirmed' ? 'rgba(16,245,160,0.3)' : uStat === 'denied' ? 'rgba(239,68,68,0.3)' : 'rgba(14,165,233,0.3)'}`,
                    color: uStat === 'confirmed' ? '#10F5A0' : uStat === 'denied' ? '#EF4444' : '#0EA5E9',
                    opacity: (uStat === 'sending' || uStat === 'waiting' || isFrozen) ? 0.5 : 1 }}>
                  {uStat === 'sending' ? '📡 Sending…' : uStat === 'waiting' ? '⏳ Waiting…' : uStat === 'confirmed' ? '✅ Verified' : uStat === 'denied' ? '🚨 Denied' : '📲 Send USSD Push'}
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
