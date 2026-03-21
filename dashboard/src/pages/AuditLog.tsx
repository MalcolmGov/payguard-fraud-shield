import { useState, useMemo } from 'react';

type ActionType = 'BLOCK' | 'UNBLOCK' | 'APPROVE' | 'REJECT' | 'ESCALATE' | 'RULE_EDIT' | 'RULE_TOGGLE' | 'RISK_OVERRIDE' | 'NOTE_ADDED' | 'EXPORT' | 'LOGIN' | 'LOGOUT' | 'BULK_BLOCK';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: 'admin' | 'analyst' | 'viewer';
  action: ActionType;
  target: string;
  details: string;
  ip: string;
  category: 'account' | 'transaction' | 'rule' | 'system' | 'device';
}

const ACTION_META: Record<ActionType, { label: string; color: string; icon: string }> = {
  BLOCK: { label: 'Account Blocked', color: '#EF4444', icon: '🔒' },
  UNBLOCK: { label: 'Account Unblocked', color: '#10F5A0', icon: '🔓' },
  APPROVE: { label: 'Transaction Approved', color: '#10F5A0', icon: '✅' },
  REJECT: { label: 'Transaction Rejected', color: '#EF4444', icon: '❌' },
  ESCALATE: { label: 'Transaction Escalated', color: '#FBBF24', icon: '⚡' },
  RULE_EDIT: { label: 'Rule Modified', color: '#0EA5E9', icon: '✏️' },
  RULE_TOGGLE: { label: 'Rule Toggled', color: '#A78BFA', icon: '⚙️' },
  RISK_OVERRIDE: { label: 'Risk Override', color: '#F97316', icon: '🎚️' },
  NOTE_ADDED: { label: 'Note Added', color: 'var(--w-text-3)', icon: '📝' },
  EXPORT: { label: 'Data Exported', color: '#0EA5E9', icon: '📤' },
  LOGIN: { label: 'Session Started', color: '#10F5A0', icon: '🔑' },
  LOGOUT: { label: 'Session Ended', color: 'var(--w-text-3)', icon: '🚪' },
  BULK_BLOCK: { label: 'Bulk Block', color: '#EF4444', icon: '🔒' },
};

const ROLE_COLORS: Record<string, string> = { admin: '#EF4444', analyst: '#FBBF24', viewer: '#10F5A0' };

const MOCK_LOG: AuditEntry[] = [
  { id: 'a001', timestamp: '2026-03-14 09:12:34', actor: 'admin', role: 'admin', action: 'LOGIN', target: 'System', details: 'Dashboard login from 196.21.45.102', ip: '196.21.45.102', category: 'system' },
  { id: 'a002', timestamp: '2026-03-14 09:15:22', actor: 'admin', role: 'admin', action: 'RULE_EDIT', target: 'RULE-001 (Velocity Check)', details: 'Score changed from 35 → 42, severity LOW → MEDIUM', ip: '196.21.45.102', category: 'rule' },
  { id: 'a003', timestamp: '2026-03-14 09:18:45', actor: 'admin', role: 'admin', action: 'BLOCK', target: 'ACC-2741 (+27821000003)', details: 'Manual block — emulator device with 4 linked accounts', ip: '196.21.45.102', category: 'account' },
  { id: 'a004', timestamp: '2026-03-14 09:22:11', actor: 'analyst', role: 'analyst', action: 'LOGIN', target: 'System', details: 'Dashboard login from 41.185.22.61', ip: '41.185.22.61', category: 'system' },
  { id: 'a005', timestamp: '2026-03-14 09:25:00', actor: 'analyst', role: 'analyst', action: 'APPROVE', target: 'TXN-9281', details: 'R12,400 transfer to +27609000012 — confirmed legitimate', ip: '41.185.22.61', category: 'transaction' },
  { id: 'a006', timestamp: '2026-03-14 09:28:33', actor: 'analyst', role: 'analyst', action: 'REJECT', target: 'TXN-9283', details: 'R45,000 transfer flagged by SIM swap rule — rejected', ip: '41.185.22.61', category: 'transaction' },
  { id: 'a007', timestamp: '2026-03-14 09:31:12', actor: 'analyst', role: 'analyst', action: 'ESCALATE', target: 'TXN-9285', details: 'R128,000 transfer — unusual velocity, needs senior review', ip: '41.185.22.61', category: 'transaction' },
  { id: 'a008', timestamp: '2026-03-14 09:35:44', actor: 'analyst', role: 'analyst', action: 'RISK_OVERRIDE', target: 'ACC-1842 (+27821000004)', details: 'Risk changed MEDIUM → HIGH — location anomaly confirmed', ip: '41.185.22.61', category: 'account' },
  { id: 'a009', timestamp: '2026-03-14 09:38:20', actor: 'analyst', role: 'analyst', action: 'NOTE_ADDED', target: 'ACC-1842 (+27821000004)', details: 'Added note: "Customer called claiming no knowledge of Durban transaction"', ip: '41.185.22.61', category: 'account' },
  { id: 'a010', timestamp: '2026-03-14 09:45:00', actor: 'admin', role: 'admin', action: 'RULE_TOGGLE', target: 'RULE-004 (Geo Velocity)', details: 'Rule DISABLED → ENABLED', ip: '196.21.45.102', category: 'rule' },
  { id: 'a011', timestamp: '2026-03-14 09:52:18', actor: 'admin', role: 'admin', action: 'BULK_BLOCK', target: 'RING-001 (SIM Swap Ring)', details: 'Blocked all 12 accounts in fraud ring — R2.4M exposure frozen', ip: '196.21.45.102', category: 'account' },
  { id: 'a012', timestamp: '2026-03-14 10:05:00', actor: 'analyst', role: 'analyst', action: 'EXPORT', target: 'Weekly Fraud Summary', details: 'PDF report generated and downloaded', ip: '41.185.22.61', category: 'system' },
  { id: 'a013', timestamp: '2026-03-14 10:12:30', actor: 'viewer', role: 'viewer', action: 'LOGIN', target: 'System', details: 'Dashboard login from 41.76.108.22', ip: '41.76.108.22', category: 'system' },
  { id: 'a014', timestamp: '2026-03-14 10:30:00', actor: 'analyst', role: 'analyst', action: 'APPROVE', target: 'TXN-9290', details: 'R8,200 transfer — customer verified via callback', ip: '41.185.22.61', category: 'transaction' },
  { id: 'a015', timestamp: '2026-03-14 10:45:15', actor: 'admin', role: 'admin', action: 'RULE_EDIT', target: 'RULE-007 (OTP Intercept)', details: 'Description updated, score 55 → 62', ip: '196.21.45.102', category: 'rule' },
  { id: 'a016', timestamp: '2026-03-14 11:02:45', actor: 'analyst', role: 'analyst', action: 'REJECT', target: 'TXN-9295', details: 'R67,500 — device fingerprint mismatch + new province', ip: '41.185.22.61', category: 'transaction' },
  { id: 'a017', timestamp: '2026-03-14 11:20:00', actor: 'admin', role: 'admin', action: 'UNBLOCK', target: 'ACC-3102 (+27821000006)', details: 'Unblocked after customer identity verification', ip: '196.21.45.102', category: 'account' },
  { id: 'a018', timestamp: '2026-03-14 11:35:00', actor: 'analyst', role: 'analyst', action: 'LOGOUT', target: 'System', details: 'Session ended after 2h 10m', ip: '41.185.22.61', category: 'system' },
  { id: 'a019', timestamp: '2026-03-14 14:00:00', actor: 'admin', role: 'admin', action: 'BLOCK', target: 'DEV-d006 (Oppo A57)', details: 'Device blacklisted — rooted, 3 provinces in 48h', ip: '196.21.45.102', category: 'device' },
  { id: 'a020', timestamp: '2026-03-14 14:15:30', actor: 'admin', role: 'admin', action: 'LOGOUT', target: 'System', details: 'Session ended after 5h 03m', ip: '196.21.45.102', category: 'system' },
];

type FilterCategory = 'all' | AuditEntry['category'];
type FilterRole = 'all' | AuditEntry['role'];

export default function AuditLog() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() =>
    MOCK_LOG
      .filter(e => categoryFilter === 'all' || e.category === categoryFilter)
      .filter(e => roleFilter === 'all' || e.role === roleFilter)
      .filter(e =>
        search === '' ||
        e.actor.toLowerCase().includes(search.toLowerCase()) ||
        e.target.toLowerCase().includes(search.toLowerCase()) ||
        e.details.toLowerCase().includes(search.toLowerCase()) ||
        e.action.toLowerCase().includes(search.toLowerCase())
      ),
    [search, categoryFilter, roleFilter]
  );

  const categoryCounts = useMemo(() => ({
    all: MOCK_LOG.length,
    account: MOCK_LOG.filter(e => e.category === 'account').length,
    transaction: MOCK_LOG.filter(e => e.category === 'transaction').length,
    rule: MOCK_LOG.filter(e => e.category === 'rule').length,
    device: MOCK_LOG.filter(e => e.category === 'device').length,
    system: MOCK_LOG.filter(e => e.category === 'system').length,
  }), []);

  const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
    all: { icon: '📋', color: 'var(--w-text-1)' },
    account: { icon: '👤', color: '#0EA5E9' },
    transaction: { icon: '💳', color: '#10F5A0' },
    rule: { icon: '⚙️', color: '#A78BFA' },
    device: { icon: '📱', color: '#F97316' },
    system: { icon: '🔐', color: 'var(--w-text-3)' },
  };

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
            📋 Audit Log
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>
            Compliance-grade action trail · {MOCK_LOG.length} events recorded · Immutable log
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
            background: 'rgba(14,165,233,0.1)', color: '#0EA5E9',
          }}>📤 Export CSV</button>
          <button style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
            background: 'rgba(167,139,250,0.1)', color: '#A78BFA',
          }}>📄 Compliance Report</button>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <input
          placeholder="Search actions, actors, targets\u2026"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: 280, padding: '10px 16px', borderRadius: 10, fontSize: 12,
            background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--w-text-1)', fontFamily: 'JetBrains Mono, monospace',
          }}
        />

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(Object.keys(categoryCounts) as FilterCategory[]).map(cat => {
            const meta = CATEGORY_ICONS[cat];
            const isActive = categoryFilter === cat;
            return (
              <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                background: isActive ? `${meta.color}15` : 'rgba(255,255,255,0.03)',
                border: isActive ? `1px solid ${meta.color}40` : '1px solid rgba(255,255,255,0.06)',
                color: isActive ? meta.color : '#475569',
                transition: 'all 0.15s', textTransform: 'capitalize',
              }}>
                {meta.icon} {cat === 'all' ? 'All' : cat} ({categoryCounts[cat]})
              </button>
            );
          })}
        </div>

        {/* Role filter */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {(['all', 'admin', 'analyst', 'viewer'] as FilterRole[]).map(r => {
            const isActive = roleFilter === r;
            const color = r === 'all' ? '#F0F6FF' : ROLE_COLORS[r];
            return (
              <button key={r} onClick={() => setRoleFilter(r)} style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                background: isActive ? `${color}15` : 'rgba(255,255,255,0.03)',
                border: isActive ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.06)',
                color: isActive ? color : '#475569',
                transition: 'all 0.15s', textTransform: 'capitalize',
              }}>
                {r === 'all' ? '👥 All Roles' : `${r.charAt(0).toUpperCase() + r.slice(1)}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>
        Showing {filtered.length} of {MOCK_LOG.length} events
        {(categoryFilter !== 'all' || roleFilter !== 'all' || search) && (
          <button onClick={() => { setCategoryFilter('all'); setRoleFilter('all'); setSearch(''); }} style={{
            marginLeft: 12, background: 'none', border: 'none', color: '#0EA5E9', fontSize: 11, cursor: 'pointer', fontWeight: 600,
          }}>✕ Clear filters</button>
        )}
      </div>

      {/* Log entries */}
      <div style={{
        background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '140px 90px 80px 1fr 120px 32px',
          padding: '12px 20px', borderBottom: '1px solid var(--w-card-border)', gap: 12,
        }}>
          {['TIMESTAMP', 'ACTOR', 'ACTION', 'DETAILS', 'TARGET', ''].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
          ))}
        </div>

        {/* Entries */}
        {filtered.map((entry, i) => {
          const meta = ACTION_META[entry.action];
          const isExpanded = expandedId === entry.id;
          return (
            <div key={entry.id}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '140px 90px 80px 1fr 120px 32px',
                  padding: '12px 20px', gap: 12, alignItems: 'center', cursor: 'pointer',
                  borderBottom: i < filtered.length - 1 && !isExpanded ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  background: isExpanded ? 'rgba(14,165,233,0.04)' : 'transparent',
                  borderLeft: `2px solid ${meta.color}40`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Timestamp */}
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--w-text-3)' }}>
                  {entry.timestamp.split(' ')[1]}
                  <span style={{ display: 'block', fontSize: 9, color: '#334155' }}>{entry.timestamp.split(' ')[0]}</span>
                </span>

                {/* Actor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: ROLE_COLORS[entry.role] }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--w-text-2)', textTransform: 'capitalize' }}>{entry.actor}</span>
                </div>

                {/* Action badge */}
                <span style={{
                  fontSize: 8, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: `${meta.color}12`, color: meta.color,
                  textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                }}>
                  {meta.icon} {entry.action.replace('_', ' ')}
                </span>

                {/* Details */}
                <span style={{ fontSize: 12, color: 'var(--w-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.details}
                </span>

                {/* Target */}
                <span style={{ fontSize: 10, color: 'var(--w-text-3)', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.target}
                </span>

                {/* Expand */}
                <span style={{ fontSize: 10, color: '#334155', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{
                  padding: '16px 20px 16px 40px',
                  background: 'rgba(14,165,233,0.03)',
                  borderBottom: '1px solid var(--w-card-border)',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 12 }}>
                    {[
                      { label: 'Actor', value: entry.actor, sub: entry.role },
                      { label: 'IP Address', value: entry.ip, sub: 'Source' },
                      { label: 'Category', value: entry.category, sub: 'Type' },
                    ].map(f => (
                      <div key={f.label} style={{ padding: '10px 14px', background: 'var(--w-card)', borderRadius: 10 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 4 }}>{f.label.toUpperCase()}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--w-text-1)', textTransform: 'capitalize' }}>{f.value}</div>
                        <div style={{ fontSize: 9, color: '#334155', textTransform: 'capitalize' }}>{f.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 14px', background: 'var(--w-card)', borderRadius: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 4 }}>FULL DESCRIPTION</div>
                    <div style={{ fontSize: 13, color: 'var(--w-text-2)', lineHeight: 1.7 }}>{entry.details}</div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 10, color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>
                    Event ID: {entry.id} · Logged at {entry.timestamp} · Hash: {entry.id.repeat(4).slice(0, 16)}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>
            No audit events match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
