import { useState } from 'react';
import CaseSummariser from '../components/CaseSummariser';
import { mockTransactions } from '../data/mock';
import type { Transaction } from '../data/mock';

interface UserDevice {
  id: string;
  model: string;
  os: string;
  lastSeen: string;
  trusted: boolean;
  fingerprint: string;
  firstSeen: string;
}

interface UserAlert {
  id: string;
  timestamp: string;
  type: 'BLOCK' | 'WARNING' | 'INFO' | 'ESCALATION';
  message: string;
  resolved: boolean;
}

interface UserData {
  phone: string;
  name: string;
  accountAge: string;
  kycStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  totalTxns: number;
  totalVolume: number;
  avgTxnSize: number;
  blockedTxns: number;
  flagRate: number;
  devices: UserDevice[];
  alerts: UserAlert[];
  riskTrend: number[];
}

// Simulated user profiles linked to mock transactions
const USER_DB: Record<string, UserData> = {
  '+27821000001': {
    phone: '+27821000001', name: 'Sipho Ndlovu', accountAge: '2y 3m', kycStatus: 'VERIFIED',
    riskTier: 'HIGH', totalTxns: 847, totalVolume: 1250000, avgTxnSize: 1476, blockedTxns: 12, flagRate: 8.4,
    devices: [
      { id: 'dev_001', model: 'Samsung Galaxy S24', os: 'Android 14', lastSeen: '2 min ago', trusted: true, fingerprint: 'fp_a8c3f1', firstSeen: '2024-01-15' },
      { id: 'dev_002', model: 'Huawei P30 Lite', os: 'Android 12', lastSeen: '45 days ago', trusted: false, fingerprint: 'fp_b7d2e4', firstSeen: '2023-06-10' },
    ],
    alerts: [
      { id: 'ALT-001', timestamp: '2026-03-20T01:32:00', type: 'BLOCK', message: 'Transaction blocked — active call + high amount (R2,500)', resolved: false },
      { id: 'ALT-002', timestamp: '2026-03-19T14:15:00', type: 'WARNING', message: 'SIM swap detected — 48h cooldown triggered', resolved: true },
      { id: 'ALT-003', timestamp: '2026-03-18T09:45:00', type: 'ESCALATION', message: 'Account escalated to fraud team — 3 blocks in 48h', resolved: true },
      { id: 'ALT-004', timestamp: '2026-03-15T11:20:00', type: 'INFO', message: 'New device registered: Samsung Galaxy S24', resolved: true },
      { id: 'ALT-005', timestamp: '2026-03-10T16:30:00', type: 'WARNING', message: 'Recipient not in contacts — R4,200 to unknown wallet', resolved: true },
    ],
    riskTrend: [22, 18, 25, 35, 42, 38, 55, 72, 89, 95, 88, 85, 92, 78, 65, 89, 100, 95, 82, 90],
  },
  '+27821000002': {
    phone: '+27821000002', name: 'Thandiwe Mokoena', accountAge: '1y 8m', kycStatus: 'VERIFIED',
    riskTier: 'HIGH', totalTxns: 523, totalVolume: 890000, avgTxnSize: 1702, blockedTxns: 8, flagRate: 6.2,
    devices: [
      { id: 'dev_003', model: 'iPhone 15 Pro', os: 'iOS 17.3', lastSeen: '15 min ago', trusted: true, fingerprint: 'fp_c9e5a2', firstSeen: '2024-09-01' },
    ],
    alerts: [
      { id: 'ALT-006', timestamp: '2026-03-19T19:34:00', type: 'BLOCK', message: 'R3,000 blocked — emulator detected + VPN active', resolved: false },
      { id: 'ALT-007', timestamp: '2026-03-17T08:20:00', type: 'WARNING', message: 'Geo-velocity anomaly — JHB → CPT in 2h', resolved: true },
    ],
    riskTrend: [15, 12, 18, 20, 25, 30, 28, 45, 62, 78, 85, 72, 68, 80, 75, 82, 90, 88, 95, 85],
  },
  '+27821000003': {
    phone: '+27821000003', name: 'Andile Khumalo', accountAge: '3y 1m', kycStatus: 'VERIFIED',
    riskTier: 'MEDIUM', totalTxns: 1247, totalVolume: 580000, avgTxnSize: 465, blockedTxns: 2, flagRate: 1.1,
    devices: [
      { id: 'dev_004', model: 'Samsung Galaxy A54', os: 'Android 13', lastSeen: '1h ago', trusted: true, fingerprint: 'fp_d1f3b7', firstSeen: '2023-02-20' },
    ],
    alerts: [
      { id: 'ALT-008', timestamp: '2026-03-19T18:34:00', type: 'WARNING', message: 'High-value transaction to new recipient — R500', resolved: false },
    ],
    riskTrend: [10, 8, 12, 15, 12, 10, 18, 22, 20, 25, 28, 22, 18, 15, 20, 25, 30, 35, 28, 40],
  },
};

// Fallback for unknown users
const DEFAULT_USER: UserData = {
  phone: '', name: 'Unknown User', accountAge: 'N/A', kycStatus: 'PENDING',
  riskTier: 'LOW', totalTxns: 0, totalVolume: 0, avgTxnSize: 0, blockedTxns: 0, flagRate: 0,
  devices: [], alerts: [],
  riskTrend: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
};

const RISK_COLORS: Record<string, string> = { HIGH: '#EF4444', MEDIUM: '#FBBF24', LOW: '#10F5A0' };
const ALERT_COLORS: Record<string, { color: string; icon: string }> = {
  BLOCK: { color: '#EF4444', icon: '🚫' },
  WARNING: { color: '#FBBF24', icon: '⚠️' },
  ESCALATION: { color: '#F97316', icon: '⚡' },
  INFO: { color: '#0EA5E9', icon: 'ℹ️' },
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 240;
  const h = 48;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polygon points={areaPoints} fill={`${color}15`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      {/* Current value dot */}
      <circle cx={w} cy={h - (data[data.length - 1] / max) * h} r={3} fill={color} />
    </svg>
  );
}

export default function UserProfile() {
  const [selectedPhone, setSelectedPhone] = useState('+27821000001');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'devices' | 'alerts'>('transactions');

  const user = USER_DB[selectedPhone] || { ...DEFAULT_USER, phone: selectedPhone };
  const userTxns = mockTransactions.filter(tx => tx.userPhone === selectedPhone);
  const rColor = RISK_COLORS[user.riskTier] || '#0EA5E9';

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: '#F0F6FF' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
            👤 User 360° Profile
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>Full investigation view — transaction history, devices, risk trend, and alerts</p>
        </div>
      </div>

      {/* User Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {Object.keys(USER_DB).map(phone => (
          <button key={phone} onClick={() => setSelectedPhone(phone)} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: selectedPhone === phone ? '#0EA5E9' : 'rgba(255,255,255,0.04)',
            color: selectedPhone === phone ? '#000' : '#64748B',
            fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.15s',
          }}>{phone}</button>
        ))}
        <input
          placeholder="Search phone…"
          onChange={e => { if (USER_DB[e.target.value]) setSelectedPhone(e.target.value); }}
          style={{
            padding: '8px 14px', borderRadius: 10, fontSize: 11, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', width: 180,
          }}
        />
      </div>

      {/* Profile Card */}
      <div style={{
        display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginBottom: 20,
      }}>
        {/* Left: Identity */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Avatar + Name */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${rColor}15`, border: `2px solid ${rColor}40`, fontSize: 20, fontWeight: 800,
              color: rColor, fontFamily: 'Outfit, sans-serif',
            }}>{user.name.charAt(0)}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>{user.phone}</div>
            </div>
          </div>

          {/* Meta pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${rColor}15`, color: rColor, border: `1px solid ${rColor}25` }}>
              RISK: {user.riskTier}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: user.kycStatus === 'VERIFIED' ? 'rgba(16,245,160,0.1)' : 'rgba(251,191,36,0.1)', color: user.kycStatus === 'VERIFIED' ? '#10F5A0' : '#FBBF24', border: `1px solid ${user.kycStatus === 'VERIFIED' ? 'rgba(16,245,160,0.2)' : 'rgba(251,191,36,0.2)'}` }}>
              KYC: {user.kycStatus}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(14,165,233,0.1)', color: '#0EA5E9' }}>
              {user.accountAge}
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Total Txns', value: user.totalTxns.toLocaleString() },
              { label: 'Volume', value: `R${(user.totalVolume / 1000).toFixed(0)}k` },
              { label: 'Avg Size', value: `R${user.avgTxnSize.toLocaleString()}` },
              { label: 'Blocked', value: String(user.blockedTxns), color: '#EF4444' },
              { label: 'Flag Rate', value: `${user.flagRate}%`, color: user.flagRate > 5 ? '#EF4444' : '#10F5A0' },
              { label: 'Devices', value: String(user.devices.length) },
            ].map(s => (
              <div key={s.label} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                <div style={{ fontSize: 8, color: '#475569', fontWeight: 700, letterSpacing: '0.06em' }}>{s.label.toUpperCase()}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: s.color || '#F0F6FF', fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Risk Trend + Quick Stats */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em' }}>RISK SCORE TREND (20D)</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Score history across last 20 transactions</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: rColor, fontFamily: 'Outfit, sans-serif' }}>
                {user.riskTrend[user.riskTrend.length - 1]}
              </div>
              <div style={{ fontSize: 9, color: '#475569' }}>CURRENT SCORE</div>
            </div>
          </div>
          <MiniSparkline data={user.riskTrend} color={rColor} />

          {/* Recent alerts summary */}
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            {[
              { label: 'Open Alerts', count: user.alerts.filter(a => !a.resolved).length, color: '#EF4444' },
              { label: 'Resolved', count: user.alerts.filter(a => a.resolved).length, color: '#10F5A0' },
              { label: 'Recent Txns', count: userTxns.length, color: '#0EA5E9' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: `${s.color}08`, border: `1px solid ${s.color}18` }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: 'Outfit' }}>{s.count}</div>
                <div style={{ fontSize: 9, color: '#475569', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
        {([
          { id: 'transactions' as const, label: '💳 Transactions', count: userTxns.length },
          { id: 'devices' as const, label: '📱 Devices', count: user.devices.length },
          { id: 'alerts' as const, label: '🔔 Alerts', count: user.alerts.length },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 20px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'transparent',
            color: activeTab === tab.id ? '#0EA5E9' : '#475569',
            borderBottom: activeTab === tab.id ? '2px solid #0EA5E9' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>{tab.label} <span style={{ fontSize: 10, opacity: 0.7 }}>({tab.count})</span></button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'transactions' && (
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 120px 85px 70px 85px', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: 8 }}>
            {['DATE', 'RECIPIENT', 'AMOUNT', 'RISK', 'ACTION'].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
            ))}
          </div>
          {userTxns.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 12 }}>No transactions found for this user</div>
          ) : userTxns.map((tx, i) => (
            <div key={tx.id} onClick={() => setSelectedTx(tx)} style={{
              display: 'grid', gridTemplateColumns: '90px 120px 85px 70px 85px',
              padding: '10px 18px', gap: 8, alignItems: 'center', cursor: 'pointer',
              borderBottom: i < userTxns.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                {new Date(tx.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })}
              </span>
              <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{tx.recipientWallet}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#F0F6FF', fontFamily: 'JetBrains Mono' }}>R{tx.amount.toLocaleString()}</span>
              <span style={{
                fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4, textAlign: 'center',
                background: `${RISK_COLORS[tx.riskLevel]}15`, color: RISK_COLORS[tx.riskLevel],
              }}>{tx.riskLevel}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: tx.recommendedAction === 'BLOCK' ? '#EF4444' : tx.recommendedAction === 'WARN_USER' ? '#FBBF24' : '#10F5A0' }}>
                {tx.recommendedAction}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'devices' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {user.devices.map(d => (
            <div key={d.id} style={{
              background: 'rgba(255,255,255,0.025)', border: `1px solid ${d.trusted ? 'rgba(16,245,160,0.15)' : 'rgba(239,68,68,0.15)'}`,
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FF' }}>📱 {d.model}</div>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: d.trusted ? 'rgba(16,245,160,0.1)' : 'rgba(239,68,68,0.1)',
                  color: d.trusted ? '#10F5A0' : '#EF4444', border: `1px solid ${d.trusted ? 'rgba(16,245,160,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>{d.trusted ? '✅ TRUSTED' : '⚠️ UNTRUSTED'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'OS', value: d.os },
                  { label: 'Last Seen', value: d.lastSeen },
                  { label: 'Fingerprint', value: d.fingerprint },
                  { label: 'First Seen', value: d.firstSeen },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 8, color: '#475569', fontWeight: 700, letterSpacing: '0.06em' }}>{f.label.toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {user.alerts.map(a => {
            const cfg = ALERT_COLORS[a.type];
            return (
              <div key={a.id} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 16px', borderRadius: 12,
                background: a.resolved ? 'rgba(255,255,255,0.02)' : `${cfg.color}06`,
                border: `1px solid ${a.resolved ? 'rgba(255,255,255,0.05)' : cfg.color + '20'}`,
                opacity: a.resolved ? 0.6 : 1,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${cfg.color}12`, fontSize: 14, flexShrink: 0,
                }}>{cfg.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: a.resolved ? '#64748B' : cfg.color }}>{a.type}</span>
                    <span style={{ fontSize: 10, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                      {new Date(a.timestamp).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>{a.message}</p>
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: a.resolved ? 'rgba(16,245,160,0.08)' : 'rgba(239,68,68,0.08)',
                      color: a.resolved ? '#10F5A0' : '#EF4444',
                    }}>{a.resolved ? '✅ Resolved' : '🔴 Open'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTx && <CaseSummariser tx={selectedTx} onClose={() => setSelectedTx(null)} />}
    </div>
  );
}
