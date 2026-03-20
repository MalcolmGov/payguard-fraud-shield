import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Data ──────────────────────────────────────────────────────────────────────

interface RingNode {
  id: string; label: string; type: 'device' | 'account' | 'wallet' | 'ip';
  x: number; y: number; risk: 'high' | 'medium' | 'low'; visible: boolean; blocked: boolean;
}

interface RingLink { source: string; target: string; label: string; visible: boolean; }

const INITIAL_NODES: RingNode[] = [
  // Device (centre)
  { id: 'D1', label: 'Device\nFRAUD-001', type: 'device',  x: 400, y: 240, risk: 'high', visible: false, blocked: false },
  // Victims (ring)
  { id: 'A1',  label: '+27 82 100 001', type: 'account', x: 160, y: 80,  risk: 'high',   visible: false, blocked: false },
  { id: 'A2',  label: '+27 82 100 002', type: 'account', x: 280, y: 50,  risk: 'high',   visible: false, blocked: false },
  { id: 'A3',  label: '+27 82 100 003', type: 'account', x: 400, y: 40,  risk: 'high',   visible: false, blocked: false },
  { id: 'A4',  label: '+27 82 100 004', type: 'account', x: 520, y: 50,  risk: 'high',   visible: false, blocked: false },
  { id: 'A5',  label: '+27 82 100 005', type: 'account', x: 630, y: 100, risk: 'high',   visible: false, blocked: false },
  { id: 'A6',  label: '+27 82 100 006', type: 'account', x: 660, y: 220, risk: 'high',   visible: false, blocked: false },
  { id: 'A7',  label: '+27 82 100 007', type: 'account', x: 620, y: 340, risk: 'high',   visible: false, blocked: false },
  { id: 'A8',  label: '+27 82 100 008', type: 'account', x: 500, y: 410, risk: 'medium', visible: false, blocked: false },
  { id: 'A9',  label: '+27 82 100 009', type: 'account', x: 380, y: 430, risk: 'medium', visible: false, blocked: false },
  { id: 'A10', label: '+27 82 100 010', type: 'account', x: 260, y: 400, risk: 'medium', visible: false, blocked: false },
  { id: 'A11', label: '+27 82 100 011', type: 'account', x: 160, y: 320, risk: 'high',   visible: false, blocked: false },
  { id: 'A12', label: '+27 82 100 012', type: 'account', x: 130, y: 190, risk: 'high',   visible: false, blocked: false },
  // Mule wallets
  { id: 'W1', label: 'Wallet\nMULE-001', type: 'wallet', x: 200, y: 240, risk: 'high', visible: false, blocked: false },
  { id: 'W2', label: 'Wallet\nMULE-002', type: 'wallet', x: 590, y: 240, risk: 'high', visible: false, blocked: false },
  // IP
  { id: 'IP', label: '196.25.1.82', type: 'ip', x: 400, y: 150, risk: 'medium', visible: false, blocked: false },
];

const ALL_LINKS: RingLink[] = [
  // Device to all accounts
  ...['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'].map(a => ({ source: 'D1', target: a, label: 'USED_BY', visible: false })),
  // Accounts to mule wallets
  ...['A1','A3','A5','A7','A9','A11'].map(a => ({ source: a, target: 'W1', label: 'SENT_TO', visible: false })),
  ...['A2','A4','A6','A8','A10','A12'].map(a => ({ source: a, target: 'W2', label: 'SENT_TO', visible: false })),
  // Device to IP
  { source: 'D1', target: 'IP', label: 'CONNECTS_FROM', visible: false },
];

// Investigation stages
interface Stage {
  id: number; title: string; description: string; action: string;
  revealNodes: string[]; revealLinks: string[]; blockNodes: string[];
  stat: { label: string; value: string; color: string } | null;
}

const STAGES: Stage[] = [
  {
    id: 0, title: 'Flagged Transaction', action: 'Investigate →',
    description: 'A transaction from +27 82 100 001 (R4,500 to an unknown wallet) was flagged with score 97. RULE_001 + RULE_006. Click Investigate to open the fraud graph.',
    revealNodes: [], revealLinks: [], blockNodes: [],
    stat: null,
  },
  {
    id: 1, title: 'Step 1 — Source Account', action: 'Expand Graph →',
    description: 'Account A1 (+27 82 100 001) is in the graph. The system traces what device this account used. Device FRAUD-001 surfaces.',
    revealNodes: ['A1', 'D1'], revealLinks: ['D1-A1'], blockNodes: [],
    stat: { label: 'Accounts found', value: '1', color: '#D29922' },
  },
  {
    id: 2, title: 'Step 2 — Same Device, 12 Accounts', action: 'Trace Money Flow →',
    description: 'Device FRAUD-001 has been used to control 12 different mobile wallet accounts. All of them show recent high-risk activity. This is a fraud farm.',
    revealNodes: ['A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'],
    revealLinks: ['D1-A2','D1-A3','D1-A4','D1-A5','D1-A6','D1-A7','D1-A8','D1-A9','D1-A10','D1-A11','D1-A12'],
    blockNodes: [], stat: { label: 'Accounts on this device', value: '12', color: '#F85149' },
  },
  {
    id: 3, title: 'Step 3 — Money Flows to 2 Mule Wallets', action: 'Identify IP →',
    description: 'Every account sent money to one of two mule wallets — MULE-001 and MULE-002. Combined withdrawals: R68,400 over 14 days.',
    revealNodes: ['W1','W2'],
    revealLinks: ['A1-W1','A3-W1','A5-W1','A7-W1','A9-W1','A11-W1','A2-W2','A4-W2','A6-W2','A8-W2','A10-W2','A12-W2'],
    blockNodes: [], stat: { label: 'Total stolen (14 days)', value: 'R68,400', color: '#F85149' },
  },
  {
    id: 4, title: 'Step 4 — Shared IP Address', action: 'Bulk Block →',
    description: 'All 12 accounts and both mule wallets connect from the same IP: 196.25.1.82. One operator, one device, one IP — a complete fraud ring.',
    revealNodes: ['IP'], revealLinks: ['D1-IP'],
    blockNodes: [], stat: { label: 'Unique IP', value: '196.25.1.82', color: '#BC8CFF' },
  },
  {
    id: 5, title: '🚫 Bulk Block — 14 Entities', action: '✅ Ring Dismantled',
    description: 'One click. All 12 victim accounts suspended pending re-verification. Both mule wallets frozen. IP blacklisted. Analyst report generated for SAPS/FSCA.',
    revealNodes: [], revealLinks: [],
    blockNodes: ['D1','A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12','W1','W2'],
    stat: { label: 'Entities blocked', value: '14', color: '#3FB950' },
  },
];

// ── SVG Graph ─────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = { device: '#F85149', account: '#58A6FF', wallet: '#D29922', ip: '#BC8CFF' };
const TYPE_ICON:  Record<string, string> = { device: '💻', account: '👤', wallet: '💳', ip: '🌐' };

function GraphView({ nodes, links }: { nodes: RingNode[]; links: RingLink[] }) {
  const visNodes = nodes.filter(n => n.visible);
  const visLinks = links.filter(l => l.visible);

  const getNode = (id: string) => nodes.find(n => n.id === id);

  return (
    <svg width="100%" height="100%" viewBox="0 0 800 480" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="glow-high"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow-med"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.2)" />
        </marker>
      </defs>

      {/* Links */}
      {visLinks.map(link => {
        const s = getNode(link.source), t = getNode(link.target);
        if (!s || !t) return null;
        return (
          <line key={`${link.source}-${link.target}`}
            x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke="rgba(255,255,255,0.12)" strokeWidth={1}
            markerEnd="url(#arrow)"
            style={{ animation: 'fadeIn 0.5s ease' }}
          />
        );
      })}

      {/* Nodes */}
      {visNodes.map(node => {
        const color = node.blocked ? '#484F58' : TYPE_COLOR[node.type];
        const isDevice = node.type === 'device';
        const r = isDevice ? 30 : node.type === 'wallet' ? 22 : 16;
        return (
          <g key={node.id} transform={`translate(${node.x},${node.y})`} style={{ animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <circle r={r + 6} fill={`${color}15`} />
            <circle r={r} fill={node.blocked ? '#1C2333' : `${color}33`} stroke={node.blocked ? '#484F58' : color} strokeWidth={node.blocked ? 1 : 2}
              filter={!node.blocked && node.risk === 'high' ? 'url(#glow-high)' : !node.blocked ? 'url(#glow-med)' : undefined}
            />
            <text textAnchor="middle" dominantBaseline="middle" fontSize={isDevice ? 14 : 10} fill={node.blocked ? '#484F58' : 'white'}>
              {node.blocked ? '🚫' : TYPE_ICON[node.type]}
            </text>
            {node.label.split('\n').map((line, i) => (
              <text key={i} x={0} y={r + 10 + i * 11} textAnchor="middle" fontSize={8} fill={node.blocked ? '#484F58' : 'rgba(255,255,255,0.7)'}>
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DemoFraudRing() {
  const navigate = useNavigate();
  const [stageIdx, setStageIdx] = useState(0);
  const [nodes, setNodes] = useState<RingNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<RingLink[]>(ALL_LINKS);
  const [autoPlay, setAutoPlay] = useState(false);

  const stage = STAGES[stageIdx];
  const isFirst = stageIdx === 0;
  const isLast = stageIdx === STAGES.length - 1;

  const advance = () => {
    if (stageIdx >= STAGES.length - 1) return;
    const next = STAGES[stageIdx + 1];
    setNodes(prev => prev.map(n => ({
      ...n,
      visible: n.visible || next.revealNodes.includes(n.id),
      blocked: n.blocked || next.blockNodes.includes(n.id),
    })));
    setLinks(prev => prev.map(l => ({
      ...l,
      visible: l.visible || next.revealLinks.includes(`${l.source}-${l.target}`),
    })));
    setStageIdx(s => s + 1);
  };

  const retreat = () => {
    if (stageIdx <= 0) return;
    const newIdx = stageIdx - 1;
    // Rebuild to the new stage
    const rebuilt = INITIAL_NODES.map(n => ({ ...n, visible: false, blocked: false }));
    const rebuiltLinks = ALL_LINKS.map(l => ({ ...l, visible: false }));
    for (let i = 1; i <= newIdx; i++) {
      const s = STAGES[i];
      s.revealNodes.forEach(id => { const n = rebuilt.find(x => x.id === id); if (n) n.visible = true; });
      s.revealLinks.forEach(id => { const l = rebuiltLinks.find(x => `${x.source}-${x.target}` === id); if (l) l.visible = true; });
      s.blockNodes.forEach(id => { const n = rebuilt.find(x => x.id === id); if (n) { n.visible = true; n.blocked = true; } });
    }
    setNodes(rebuilt);
    setLinks(rebuiltLinks);
    setStageIdx(newIdx);
  };

  const reset = () => {
    setNodes(INITIAL_NODES.map(n => ({ ...n, visible: false, blocked: false })));
    setLinks(ALL_LINKS.map(l => ({ ...l, visible: false })));
    setStageIdx(0);
    setAutoPlay(false);
  };

  useEffect(() => {
    if (!autoPlay || isLast) { if (isLast) setAutoPlay(false); return; }
    const t = setTimeout(advance, 2500);
    return () => clearTimeout(t);
  }, [autoPlay, stageIdx, isLast]);

  const visibleAccounts = nodes.filter(n => n.visible && n.type === 'account').length;
  const blockedEntities = nodes.filter(n => n.blocked).length;

  return (
    <div style={{ height: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', height: 56, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/demo')} style={{ fontSize: 12 }}>← All Demos</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>🕸️ Demo 4 of 4 — Fraud Ring Investigation</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Graph Engine · Connected Accounts · Mule Wallets · Bulk Block</div>
        </div>
        {isLast && <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ fontSize: 12 }}>Open Analyst Dashboard →</button>}
      </div>

      {/* Stage bar */}
      <div style={{ display: 'flex', padding: '0 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {STAGES.map((s, i) => {
          const isActive = i === stageIdx, isDone = i < stageIdx;
          return (
            <button key={s.id} onClick={() => { if (i < stageIdx) { for (let j = stageIdx; j > i; j--) {} retreat(); } else { for (let j = stageIdx; j < i; j++) advance(); } }}
              style={{ padding: '10px 16px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: 'transparent', borderBottom: isActive ? '2px solid #BC8CFF' : isDone ? '2px solid #3FB950' : '2px solid transparent', color: isActive ? '#BC8CFF' : isDone ? '#3FB950' : 'var(--text-muted)', fontSize: 11, fontWeight: isActive ? 700 : 400, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
              {isDone ? '✓' : `${i + 1}.`} {s.title.split(' ').slice(0, 4).join(' ')}
            </button>
          );
        })}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0, overflow: 'hidden' }}>

        {/* Left panel */}
        <div style={{ borderRight: '1px solid var(--border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          {/* Stage info */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#BC8CFF', letterSpacing: '0.1em', marginBottom: 6 }}>
              STAGE {stageIdx + 1} OF {STAGES.length}
            </div>
            <h2 style={{ fontSize: 18, marginBottom: 10, color: 'var(--text-primary)', lineHeight: 1.3 }}>{stage.title}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{stage.description}</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Accounts found', value: visibleAccounts.toString(), color: '#58A6FF' },
              { label: 'Entities blocked', value: blockedEntities.toString(), color: '#F85149' },
              { label: 'Mule wallets', value: nodes.filter(n => n.visible && n.type === 'wallet').length.toString(), color: '#D29922' },
              stage.stat ?? { label: 'Ring links', value: links.filter(l => l.visible).length.toString(), color: '#3FB950' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-card)', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={retreat} disabled={isFirst} style={{ flex: 1, fontSize: 12 }}>← Back</button>
              <button
                className={`btn ${isLast ? 'btn-ghost' : stageIdx === STAGES.length - 2 ? 'btn-danger' : 'btn-primary'}`}
                onClick={advance} disabled={isLast}
                style={{ flex: 2, fontSize: 12, fontWeight: 700 }}
              >
                {isLast ? '✅ Investigation Complete' : stage.action}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`btn ${autoPlay ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setAutoPlay(a => !a)} style={{ flex: 1, fontSize: 11 }}>
                {autoPlay ? '⏸ Pause' : '▶ Auto'}
              </button>
              <button className="btn btn-ghost" onClick={reset} style={{ flex: 1, fontSize: 11 }}>↺ Reset</button>
            </div>
          </div>

          {/* Legend */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>NODE LEGEND</div>
            {[
              { type: 'device', label: 'Fraud Device' },
              { type: 'account', label: 'Victim Account' },
              { type: 'wallet', label: 'Mule Wallet' },
              { type: 'ip', label: 'IP Address' },
            ].map(l => (
              <div key={l.type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: TYPE_COLOR[l.type], flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{TYPE_ICON[l.type]} {l.label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#484F58', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🚫 Blocked entity</span>
            </div>
          </div>

          {isLast && (
            <div style={{ background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.25)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3FB950', marginBottom: 6 }}>✅ Fraud Ring Dismantled</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                • 12 accounts suspended<br />
                • 2 mule wallets frozen<br />
                • R68,400 in future fraud prevented<br />
                • FSCA/SAPS report generated<br />
                • IP blacklisted network-wide
              </div>
            </div>
          )}
        </div>

        {/* Right: Graph canvas */}
        <div style={{ position: 'relative', background: 'radial-gradient(ellipse at center, #0D1117 0%, #080C10 100%)', overflow: 'hidden' }}>
          {/* Grid overlay */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Graph */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <GraphView nodes={nodes} links={links} />
          </div>

          {/* Empty state */}
          {stageIdx === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ fontSize: 48, opacity: 0.3 }}>🕸️</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                Fraud network graph will appear here<br />
                <span style={{ fontSize: 12 }}>Click "Investigate →" to begin</span>
              </div>
            </div>
          )}

          {/* Blocked overlay banner */}
          {isLast && (
            <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(63,185,80,0.9)', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, color: '#0D1117', backdropFilter: 'blur(8px)' }}>
              ✅ 14 entities blocked — ring dismantled in 4 steps
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popIn { from { opacity:0; transform:scale(0.3); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </div>
  );
}
