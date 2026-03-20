import { useNavigate } from 'react-router-dom';

const LAYERS = [
  {
    label: 'Customer Layer',
    color: '#58A6FF',
    bg: 'rgba(88,166,255,0.06)',
    border: 'rgba(88,166,255,0.25)',
    nodes: [
      { icon: '📱', title: 'MTN mobile wallet app (Android)', sub: 'Kotlin SDK embedded' },
      { icon: '🍎', title: 'MTN mobile wallet app (iOS)', sub: 'Swift SDK embedded' },
    ],
    downArrow: 'Encrypted signal payload · TLS 1.3 + certificate pinning',
  },
  {
    label: 'PayGuard API Layer',
    color: '#D29922',
    bg: 'rgba(210,153,34,0.06)',
    border: 'rgba(210,153,34,0.25)',
    nodes: [
      { icon: '🔗', title: 'Signal API (Node.js)', sub: 'POST /v1/signals · POST /v1/evaluate' },
      { icon: '🔐', title: 'Auth Middleware', sub: 'API key + AES-256-GCM decrypt' },
      { icon: '📨', title: 'Kafka Producer', sub: 'fraud.signals.raw topic' },
    ],
    downArrow: 'Sub-50ms async scoring · Kafka stream',
  },
  {
    label: 'Intelligence Layer',
    color: '#BC8CFF',
    bg: 'rgba(188,140,255,0.06)',
    border: 'rgba(188,140,255,0.25)',
    nodes: [
      { icon: '🧠', title: 'Risk Engine (Python/FastAPI)', sub: '35 fraud rules · ML scoring' },
      { icon: '🕸️', title: 'Graph Engine (Neo4j)', sub: 'Fraud ring detection · device graph' },
    ],
    downArrow: 'RiskDecision · risk_score · triggered_rules',
  },
  {
    label: 'Data Layer',
    color: '#39D3BB',
    bg: 'rgba(57,211,187,0.06)',
    border: 'rgba(57,211,187,0.25)',
    nodes: [
      { icon: '🐘', title: 'PostgreSQL', sub: 'Accounts · devices · decisions' },
      { icon: '⚡', title: 'Redis', sub: 'Velocity counters · fingerprint cache' },
      { icon: '🌐', title: 'Neo4j Graph', sub: 'Device→Account→Wallet relationships' },
    ],
    downArrow: null,
  },
];

const ANALYST_FEATURES = [
  { icon: '📊', label: 'Overview Dashboard', sub: 'Live transaction feed + KPI metrics' },
  { icon: '🔍', label: 'Transaction Detail', sub: 'Full signal dump + rule breakdown' },
  { icon: '🕸️', label: 'Fraud Network Graph', sub: 'Device/account ring visualisation' },
  { icon: '⚙️', label: 'Rules Engine UI', sub: 'Enable/disable/tune rules live' },
  { icon: '📄', label: 'CSV/PDF Reports', sub: 'FSCA/SARB audit exports' },
  { icon: '🔒', label: 'Account Management', sub: 'Manual block/unblock wallets' },
];

export default function Ecosystem() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 56, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ fontSize: 12 }}>← Home</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>🏗️ MTN Ecosystem Architecture</span>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/demo')} style={{ fontSize: 12 }}>▶ Live Demo</button>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 32px' }}>
        <h1 style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>System Architecture</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 48, fontSize: 15 }}>
          End-to-end signal flow from customer device to fraud analyst — all within 100ms.
        </p>

        {/* Stack diagram */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {LAYERS.map((layer) => (
            <div key={layer.label}>
              <div style={{ background: layer.bg, border: `1px solid ${layer.border}`, borderRadius: 14, padding: '20px 24px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: layer.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                  {layer.label}
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {layer.nodes.map(node => (
                    <div key={node.title} style={{
                      background: 'var(--bg-card)', border: `1px solid ${layer.border}`,
                      borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 180,
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{node.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{node.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{node.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {layer.downArrow && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>{layer.downArrow}</div>
                  <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>↓</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Analyst Dashboard */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Fraud Analyst Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
            MTN's fraud operations team gets a real-time command centre for every flagged transaction.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {ANALYST_FEATURES.map(f => (
              <div key={f.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key numbers */}
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { v: '<100ms', l: 'End-to-end decision', c: '#3FB950' },
            { v: '35', l: 'Active fraud rules', c: '#58A6FF' },
            { v: 'TLS 1.3', l: 'SDK transport security', c: '#BC8CFF' },
            { v: '0 UX', l: 'Impact on clean users', c: '#39D3BB' },
          ].map(s => (
            <div key={s.v} style={{ background: 'var(--bg-card)', border: `1px solid ${s.c}33`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.c, fontFamily: 'JetBrains Mono, monospace' }}>{s.v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <button className="btn btn-primary" onClick={() => navigate('/demo')} style={{ fontSize: 15, padding: '14px 36px', borderRadius: 10, fontWeight: 700 }}>
            ▶ See It In Action
          </button>
        </div>
      </div>
    </div>
  );
}
