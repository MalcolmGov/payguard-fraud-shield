/**
 * Shared phone UI components used across all PayGuard demo pages.
 * Uses CSS/text-based icons instead of emoji to avoid encoding issues.
 */
import { useState, useEffect } from 'react';

// ── Quick Action tile data ─────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Send',    bg: '#E3F2FD', fg: '#1565C0', icon: '↑' },
  { label: 'Receive', bg: '#E8F5E9', fg: '#2E7D32', icon: '↓' },
  { label: 'Airtime', bg: '#FFF3E0', fg: '#E65100', icon: '*' },
  { label: 'Bills',   bg: '#FCE4EC', fg: '#C62828', icon: 'B' },
  { label: 'Bank',    bg: '#EDE7F6', fg: '#4527A0', icon: '$' },
  { label: 'More',    bg: '#F5F5F5', fg: '#616161', icon: '...' },
];

// ── CallBar ────────────────────────────────────────────────────────────────────
export function CallBar({ number = '+27 84 555 0001' }: { number?: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ background: '#4CAF50', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>CALL: Unknown {number}</span>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', marginLeft: 'auto', fontFamily: 'monospace' }}>
        {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}
      </span>
    </div>
  );
}

// ── WalletHome ─────────────────────────────────────────────────────────────────
export function WalletHome({
  callActive = false,
  name = 'Customer',
  balance = 'R 4,820.00',
  recentTx = [
    { name: 'Nomsa K.', amount: '-R350', time: '2d ago' },
    { name: 'Thabo M.', amount: '-R120', time: '5d ago' },
  ],
  sdkBadge,
}: {
  callActive?: boolean;
  name?: string;
  balance?: string;
  recentTx?: { name: string; amount: string; time: string }[];
  sdkBadge?: string;
}) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1565C0', position: 'relative' }}>
      {callActive && <CallBar />}
      <div style={{ background: 'linear-gradient(135deg,#1565C0,#0D47A1)', padding: '18px 14px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.06em' }}>PayGuard Wallet</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Good morning, {name}</div>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>●●● ●●● ●●●●</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>Available Balance</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>{balance}</div>
        </div>
      </div>

      <div style={{ flex: 1, background: '#fff', borderRadius: '14px 14px 0 0', padding: 12, overflowY: 'auto' }}>
        {sdkBadge && (
          <div style={{ fontSize: 9, color: '#2E7D32', background: '#E8F5E9', borderRadius: 5, padding: '4px 8px', marginBottom: 10, border: '1px solid #A5D6A7', fontWeight: 600 }}>
            [SDK] {sdkBadge}
          </div>
        )}
        <div style={{ fontSize: 9, fontWeight: 700, color: '#333', marginBottom: 8, letterSpacing: '0.06em' }}>QUICK ACTIONS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
          {QUICK_ACTIONS.map(({ label, bg, fg, icon }) => (
            <div key={label} style={{ background: bg, borderRadius: 8, padding: '9px 4px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: fg, lineHeight: 1 }}>{icon}</div>
              <div style={{ fontSize: 8, color: '#555', marginTop: 3, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#333', marginBottom: 8, letterSpacing: '0.06em' }}>RECENT</div>
          {recentTx.map(tx => (
            <div key={tx.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #eee', fontSize: 10 }}>
              <div>
                <div style={{ color: '#333', fontWeight: 600 }}>{tx.name}</div>
                <div style={{ fontSize: 8, color: '#999' }}>{tx.time}</div>
              </div>
              <span style={{ color: '#E53935', fontWeight: 700 }}>{tx.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── NoService screen ───────────────────────────────────────────────────────────
export function NoServiceScreen({ name = 'Customer' }: { name?: string }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1565C0' }}>
      <div style={{ background: 'linear-gradient(135deg,#1565C0,#0D47A1)', padding: '18px 14px 14px', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.06em' }}>PayGuard Wallet</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Good morning, {name}</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: '14px 14px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFF3E0', border: '2px solid #FF6D00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#E65100' }}>!</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>No Service</div>
        <div style={{ fontSize: 10, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>
          Network signal lost.<br />SIM may have been deactivated.
        </div>
        <div style={{ width: '100%', background: '#FFF3E0', border: '1px solid #FFCC80', borderRadius: 8, padding: 10, marginTop: 8 }}>
          <div style={{ fontSize: 9, color: '#E65100', fontWeight: 600 }}>[!] SIM Swap Alert</div>
          <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>Your SIM has been ported. Contact your network provider immediately.</div>
        </div>
      </div>
    </div>
  );
}

// ── IncomingCall ───────────────────────────────────────────────────────────────
export function IncomingCall({ number = '+27 84 555 0001', label = 'Unknown Number' }: { number?: string; label?: string }) {
  const [ringing, setRinging] = useState(true);
  useEffect(() => { setTimeout(() => setRinging(false), 1500); }, []);
  return (
    <div style={{ height: '100%', background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 8 }}>INCOMING CALL</div>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E53935', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 24, animation: ringing ? 'phonePulse 0.5s ease-in-out infinite' : 'phonePulse 1.5s ease-in-out infinite' }}>?</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 4 }}>{number}</div>
        <div style={{ fontSize: 10, color: '#F44336', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Not in your contacts</div>
      </div>
      <div style={{ display: 'flex', gap: 28 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, margin: '0 auto 5px', color: 'white', fontWeight: 800 }}>X</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Decline</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, margin: '0 auto 5px', color: 'white', fontWeight: 800 }}>OK</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Answer</div>
        </div>
      </div>
    </div>
  );
}

// ── ProtectedScreen ────────────────────────────────────────────────────────────
export function ProtectedScreen({ title = 'Transaction Cancelled', message = 'R2,500 protected', details = ['Fraud event logged', 'Analyst alerted'] }: {
  title?: string;
  message?: string;
  details?: string[];
}) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0D1117', gap: 12, padding: 20 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#3FB950', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 24 }}>v</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#3FB950', textAlign: 'center' }}>{title}</div>
      <div style={{ fontSize: 10, color: '#8B949E', textAlign: 'center', lineHeight: 1.8 }}>
        {message}<br />{details.join('\n')}
      </div>
      <div style={{ width: '100%', background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: 8, padding: '10px 12px', marginTop: 4 }}>
        <div style={{ fontSize: 9, color: '#3FB950', fontWeight: 600, marginBottom: 4 }}>[v] PayGuard Protected You</div>
        {details.map(d => <div key={d} style={{ fontSize: 9, color: '#8B949E' }}>+ {d}</div>)}
      </div>
    </div>
  );
}
