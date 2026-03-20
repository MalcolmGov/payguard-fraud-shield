import { useState, useEffect } from 'react';

// ── Node types ────────────────────────────────────────────────────────────────
type NodeType = 'account' | 'device' | 'wallet' | 'ip' | 'phone';
const NODE_COLORS: Record<NodeType, string> = {
  account: '#EF4444', device: '#0EA5E9', wallet: '#10F5A0', ip: '#F97316', phone: '#7C3AED',
};
const NODE_ICONS: Record<NodeType, string> = {
  account: '👤', device: '📱', wallet: '💰', ip: '🌐', phone: '📞',
};

interface FNode { id: string; label: string; type: NodeType; ring: number; x: number; y: number; vx: number; vy: number; isNew?: boolean; }
interface FEdge { from: string; to: string; strength: number; }

// ── Fraud ring data ───────────────────────────────────────────────────────────
const RINGS = [
  {
    id: 'RING-001', name: 'Johannesburg Mule Network', color: '#EF4444', risk: 'critical',
    discovered: '2h ago', members: 7, stolen: 'R124,000',
    nodes: [
      { id: 'a1', label: 'AC-7731', type: 'account' as NodeType, ring: 0, x: 200, y: 180, vx: 0, vy: 0 },
      { id: 'a2', label: 'AC-8842', type: 'account' as NodeType, ring: 0, x: 280, y: 220, vx: 0, vy: 0 },
      { id: 'a3', label: 'AC-3391', type: 'account' as NodeType, ring: 0, x: 160, y: 270, vx: 0, vy: 0 },
      { id: 'd1', label: 'DEV-44a', type: 'device' as NodeType, ring: 0, x: 230, y: 300, vx: 0, vy: 0 },
      { id: 'w1', label: 'MULE-001', type: 'wallet' as NodeType, ring: 0, x: 300, y: 170, vx: 0, vy: 0 },
      { id: 'ip1', label: '196.216.x', type: 'ip' as NodeType, ring: 0, x: 340, y: 260, vx: 0, vy: 0 },
      { id: 'p1', label: '+2779###', type: 'phone' as NodeType, ring: 0, x: 190, y: 220, vx: 0, vy: 0 },
    ] as FNode[],
    edges: [
      { from: 'a1', to: 'd1', strength: 0.9 },
      { from: 'a2', to: 'd1', strength: 0.9 },
      { from: 'a3', to: 'd1', strength: 0.7 },
      { from: 'a1', to: 'w1', strength: 0.8 },
      { from: 'a2', to: 'w1', strength: 0.8 },
      { from: 'ip1', to: 'a1', strength: 0.6 },
      { from: 'ip1', to: 'a2', strength: 0.6 },
      { from: 'p1', to: 'a3', strength: 0.7 },
      { from: 'w1', to: 'ip1', strength: 0.5 },
    ] as FEdge[],
  },
  {
    id: 'RING-002', name: 'Cape Town SIM Swap Ring', color: '#F97316', risk: 'high',
    discovered: '6h ago', members: 4, stolen: 'R67,500',
    nodes: [
      { id: 'b1', label: 'AC-5521', type: 'account' as NodeType, ring: 1, x: 600, y: 160, vx: 0, vy: 0 },
      { id: 'b2', label: 'AC-9913', type: 'account' as NodeType, ring: 1, x: 680, y: 200, vx: 0, vy: 0 },
      { id: 'bd1', label: 'DEV-77c', type: 'device' as NodeType, ring: 1, x: 638, y: 260, vx: 0, vy: 0 },
      { id: 'bw1', label: 'MULE-002', type: 'wallet' as NodeType, ring: 1, x: 700, y: 280, vx: 0, vy: 0 },
    ] as FNode[],
    edges: [
      { from: 'b1', to: 'bd1', strength: 0.9 },
      { from: 'b2', to: 'bd1', strength: 0.9 },
      { from: 'b1', to: 'bw1', strength: 0.8 },
      { from: 'b2', to: 'bw1', strength: 0.8 },
    ] as FEdge[],
  },
];

// Merge all nodes/edges for display
const ALL_NODES = RINGS.flatMap(r => r.nodes);
const ALL_EDGES = RINGS.flatMap(r => r.edges);

interface Toast { id: number; msg: string; type: 'success' | 'warn' | 'error'; }

export default function FraudClusterPage() {
  const [nodes, setNodes] = useState<FNode[]>(ALL_NODES);
  const [selected, setSelected] = useState<FNode | null>(null);
  const [newRingAlert, setNewRingAlert] = useState(false);
  const [highlightEdge, setHighlightEdge] = useState<string | null>(null);
  const [blockedRings, setBlockedRings] = useState<Set<string>>(new Set());
  const [confirmBlock, setConfirmBlock] = useState<typeof RINGS[0] | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (msg: string, type: Toast['type']) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const doBulkBlock = (ring: typeof RINGS[0]) => {
    setBlockedRings(prev => new Set([...prev, ring.id]));
    setConfirmBlock(null);
    addToast(`🔒 ${ring.id} — All ${ring.members} accounts blocked. ${ring.stolen} exposure frozen.`, 'success');
  };

  // Gentle floating animation
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setNodes(prev => prev.map(n => ({
        ...n,
        x: n.x + Math.sin(Date.now() / 2000 + n.x) * 0.3,
        y: n.y + Math.cos(Date.now() / 2500 + n.y) * 0.3,
      })));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Simulate new ring detected after 8 seconds
  useEffect(() => {
    const t = setTimeout(() => setNewRingAlert(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const getNode = (id: string) => nodes.find(n => n.id === id);
  const getRingForNode = (nodeId: string) => RINGS.find(r => r.nodes.some(n => n.id === nodeId));

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, sans-serif', color: '#F0F6FF', background: '#0D1629', minHeight: '100vh' }}>
      {/* Toast stack */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: 380 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 16px', borderRadius: 12, fontSize: 12, lineHeight: 1.6, fontWeight: 500,
            background: t.type === 'success' ? 'rgba(16,245,160,0.1)' : t.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.1)',
            border: `1px solid ${t.type === 'success' ? 'rgba(16,245,160,0.35)' : t.type === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(251,191,36,0.35)'}`,
            color: t.type === 'success' ? '#10F5A0' : t.type === 'error' ? '#EF4444' : '#FBBF24',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>{t.msg}</div>
        ))}
      </div>

      {/* Bulk-block confirmation dialog */}
      {confirmBlock && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setConfirmBlock(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0A101E', border: `1px solid ${confirmBlock.color}40`, borderRadius: 20, padding: 32, width: 420, boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>🔒</div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 800, textAlign: 'center', margin: '0 0 8px' }}>Bulk-Block {confirmBlock.id}?</h3>
            <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
              This will immediately block all <strong style={{ color: '#F0F6FF' }}>{confirmBlock.members} accounts</strong> in the <strong style={{ color: confirmBlock.color }}>{confirmBlock.name}</strong> fraud ring and freeze <strong style={{ color: '#F0F6FF' }}>{confirmBlock.stolen}</strong> in exposure.
            </p>
            <div style={{ padding: '12px 16px', background: `${confirmBlock.color}08`, border: `1px solid ${confirmBlock.color}25`, borderRadius: 10, marginBottom: 20, fontSize: 12, color: '#94A3B8' }}>
              <strong style={{ color: confirmBlock.color }}>Ring:</strong> {confirmBlock.id} · {confirmBlock.name}<br />
              <strong style={{ color: confirmBlock.color }}>Risk:</strong> {confirmBlock.risk.toUpperCase()} · Detected {confirmBlock.discovered}<br />
              <strong style={{ color: confirmBlock.color }}>Action:</strong> Block all linked accounts + escalate to analyst queue
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmBlock(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748B', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => doBulkBlock(confirmBlock)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: `linear-gradient(135deg,${confirmBlock.color},${confirmBlock.color}CC)`, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px ${confirmBlock.color}40` }}>🔒 Confirm Block All</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#F97316', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>🕸️ AI FRAUD GRAPH ENGINE</div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Fraud Pattern Clustering</h1>
        <p style={{ color: '#8B949E', fontSize: 13, margin: 0 }}>AI-detected fraud rings · Shared device/wallet/IP linking · Real-time cluster discovery</p>
      </div>

      {/* New ring alert banner */}
      {newRingAlert && (
        <div style={{ padding: '12px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, animation: 'pulse 2s infinite' }}>
          <span style={{ fontSize: 18 }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, color: '#EF4444', fontSize: 13 }}>New fraud ring detected — RING-003 (Durban)</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>3 accounts sharing a single device fingerprint · R28,000 at risk · Auto-blocked</div>
          </div>
          <button onClick={() => setNewRingAlert(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Active rings', value: newRingAlert ? '3' : '2', color: '#EF4444' },
          { label: 'Linked accounts', value: newRingAlert ? '14' : '11', color: '#F97316' },
          { label: 'Total exposure', value: newRingAlert ? 'R219,500' : 'R191,500', color: '#10F5A0' },
          { label: 'Auto-blocked', value: '100%', color: '#0EA5E9' },
        ].map(k => (
          <div key={k.label} style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.12)', border: `1px solid ${k.color}20`, borderRadius: 14 }}>
            <div style={{ fontSize: 10, color: '#8B949E', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: 'Outfit' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Graph */}
        <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
          {/* Legend */}
          <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {(Object.entries(NODE_ICONS) as [NodeType, string][]).map(([t, icon]) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: NODE_COLORS[t] }}>
                <span>{icon}</span><span style={{ textTransform: 'capitalize' }}>{t}</span>
              </div>
            ))}
          </div>

          <svg viewBox="0 0 900 420" style={{ width: '100%', height: 'auto' }} onClick={() => setSelected(null)}>
            <defs>
              {RINGS.map(r => (
                <radialGradient key={r.id} id={`rglow-${r.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={r.color} stopOpacity="0.08" />
                  <stop offset="100%" stopColor={r.color} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            {/* Ring halos */}
            {RINGS.map(r => {
              const ns = nodes.filter(n => r.nodes.some(rn => rn.id === n.id));
              const cx = ns.reduce((s, n) => s + n.x, 0) / ns.length;
              const cy = ns.reduce((s, n) => s + n.y, 0) / ns.length;
              const radius = Math.max(...ns.map(n => Math.hypot(n.x - cx, n.y - cy))) + 50;
              return (
                <g key={r.id}>
                  <circle cx={cx} cy={cy} r={radius} fill={`url(#rglow-${r.id})`} stroke={r.color} strokeWidth="1" strokeOpacity="0.2" strokeDasharray="6,4" />
                  <text x={cx} y={cy - radius - 6} textAnchor="middle" fill={r.color} fontSize="11" fontWeight="700" fontFamily="Outfit" opacity="0.8">{r.id}</text>
                </g>
              );
            })}

            {/* Edges */}
            {ALL_EDGES.map((e, i) => {
              const from = getNode(e.from), to = getNode(e.to);
              if (!from || !to) return null;
              const ring = getRingForNode(e.from);
              const color = ring?.color ?? '#8B949E';
              const isHover = highlightEdge === `${e.from}-${e.to}`;
              return (
                <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={color} strokeWidth={isHover ? 2.5 : e.strength * 1.5}
                  strokeOpacity={isHover ? 0.9 : 0.35}
                  onMouseEnter={() => setHighlightEdge(`${e.from}-${e.to}`)}
                  onMouseLeave={() => setHighlightEdge(null)}
                  style={{ cursor: 'pointer' }} />
              );
            })}

            {/* Nodes */}
            {nodes.map(n => {
              const color = NODE_COLORS[n.type];
              const isSelected = selected?.id === n.id;
              const ring = getRingForNode(n.id);
              return (
                <g key={n.id} onClick={e => { e.stopPropagation(); setSelected(n); }} style={{ cursor: 'pointer' }}>
                  {isSelected && <circle cx={n.x} cy={n.y} r={22} fill={`${ring?.color ?? color}20`} stroke={ring?.color ?? color} strokeWidth="1.5" strokeDasharray="4,3" />}
                  <circle cx={n.x} cy={n.y} r={16} fill={`${color}20`} stroke={color} strokeWidth={isSelected ? 2 : 1.5} />
                  {/* pulse ring for new nodes */}
                  {n.isNew && (
                    <circle cx={n.x} cy={n.y} r={16} fill="none" stroke={color} strokeWidth="2" opacity="0">
                      <animate attributeName="r" from="16" to="40" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="13" style={{ userSelect: 'none', pointerEvents: 'none' }}>{NODE_ICONS[n.type]}</text>
                  <text x={n.x} y={n.y + 28} textAnchor="middle" fill={color} fontSize="8" fontFamily="JetBrains Mono">{n.label}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Ring list + detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {RINGS.map(ring => (
            <div key={ring.id} style={{ padding: 16, background: `${ring.color}08`, border: `1px solid ${ring.color}30`, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: ring.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ring.id}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F6FF', marginTop: 2 }}>{ring.name}</div>
                </div>
                <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 99, background: `${ring.color}15`, border: `1px solid ${ring.color}30`, color: ring.color, fontWeight: 700 }}>{ring.risk.toUpperCase()}</span>
              </div>
              {[
                { k: 'Members', v: ring.members },
                { k: 'Stolen', v: ring.stolen },
                { k: 'Detected', v: ring.discovered },
              ].map(r => (
                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '5px 0' }}>
                  <span style={{ color: '#8B949E' }}>{r.k}</span>
                  <span style={{ color: '#94A3B8', fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
              {blockedRings.has(ring.id) ? (
                <div style={{ width: '100%', marginTop: 10, padding: '8px', borderRadius: 8, background: 'rgba(16,245,160,0.1)', border: '1px solid rgba(16,245,160,0.3)', color: '#10F5A0', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
                  ✅ All accounts blocked
                </div>
              ) : (
                <button onClick={() => setConfirmBlock(ring)} style={{ width: '100%', marginTop: 10, padding: '8px', borderRadius: 8, background: `${ring.color}15`, border: `1px solid ${ring.color}30`, color: ring.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                  🔒 Bulk-block all accounts
                </button>
              )}
            </div>
          ))}

          {/* Selected node detail */}
          {selected && (
            <div style={{ padding: 16, background: `${NODE_COLORS[selected.type]}08`, border: `1px solid ${NODE_COLORS[selected.type]}30`, borderRadius: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: NODE_COLORS[selected.type], marginBottom: 6 }}>SELECTED NODE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{NODE_ICONS[selected.type]}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.label}</div>
                  <div style={{ fontSize: 10, color: '#8B949E', textTransform: 'capitalize' }}>{selected.type} · {getRingForNode(selected.id)?.id}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Connected to {ALL_EDGES.filter(e => e.from === selected.id || e.to === selected.id).length} other entities in this fraud ring.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
