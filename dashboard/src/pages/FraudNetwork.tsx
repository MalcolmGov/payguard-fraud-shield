import { useState } from 'react';
import { mockGraphData } from '../data/mock';
import ForceGraph2D from 'react-force-graph-2d';

const NODE_COLORS: Record<string, string> = {
  device:  '#BC8CFF',
  account: '#58A6FF',
  wallet:  '#F85149',
  ip:      '#D29922',
};

const RISK_GLOW: Record<string, string> = {
  high:   '#F85149',
  medium: '#D29922',
  low:    '#3FB950',
};

const RISK_LABELS: Record<string, string> = {
  high: 'High Risk',
  medium: 'Medium Risk',
  low: 'Low Risk',
};

export default function FraudNetwork() {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const getConnections = (nodeId: string) =>
    mockGraphData.links.filter((l: any) => l.source === nodeId || l.target === nodeId || l.source?.id === nodeId || l.target?.id === nodeId);

  const getConnectedNodes = (nodeId: string) => {
    const conns = getConnections(nodeId);
    const ids = new Set<string>();
    conns.forEach((l: any) => {
      const src = typeof l.source === 'string' ? l.source : l.source?.id;
      const tgt = typeof l.target === 'string' ? l.target : l.target?.id;
      if (src !== nodeId) ids.add(src);
      if (tgt !== nodeId) ids.add(tgt);
    });
    return Array.from(ids).map(id => mockGraphData.nodes.find((n: any) => n.id === id)).filter(Boolean);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 0px)', fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--w-card-border)',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
            {'🕸️'} Fraud Network Graph
          </h1>
          <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>Neo4j-powered entity relationships · Click nodes to explore · {mockGraphData.nodes.length} nodes · {mockGraphData.links.length} edges</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--w-text-3)' }}>
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
        {/* Graph */}
        <div style={{ flex: 1, background: 'var(--w-bg)', position: 'relative' }}>
          <ForceGraph2D
            graphData={mockGraphData}
            backgroundColor="#0D1117"
            nodeLabel={(node: any) => node.label?.replace('\n', ' ')}
            nodeColor={(node: any) => NODE_COLORS[node.type] || '#8B949E'}
            nodeRelSize={6}
            nodeVal={(node: any) => node.val}
            linkColor={() => '#30363D'}
            linkWidth={1.5}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            onNodeClick={(node: any) => setSelectedNode(node)}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.label?.split('\n')[0] || node.id;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Inter`;
              const color = NODE_COLORS[node.type] || '#8B949E';
              const glow = RISK_GLOW[node.risk] || '#8B949E';
              const isSelected = selectedNode?.id === node.id;

              ctx.save();
              ctx.shadowColor = glow;
              ctx.shadowBlur = node.risk === 'high' ? 12 : 4;

              // Selection ring
              if (isSelected) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val * 2 + 8, 0, 2 * Math.PI);
                ctx.strokeStyle = '#0EA5E9';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 3]);
                ctx.stroke();
                ctx.setLineDash([]);
              }

              ctx.beginPath();
              ctx.arc(node.x, node.y, node.val * 2 + 3, 0, 2 * Math.PI);
              ctx.fillStyle = color + '33';
              ctx.fill();
              ctx.strokeStyle = isSelected ? '#0EA5E9' : color;
              ctx.lineWidth = isSelected ? 2.5 : 2;
              ctx.stroke();
              ctx.restore();

              ctx.fillStyle = '#E6EDF3';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(label, node.x, node.y + node.val * 2 + 8);
            }}
          />
        </div>

        {/* Detail Panel */}
        {selectedNode && (() => {
          const color = NODE_COLORS[selectedNode.type] || '#8B949E';
          const riskColor = RISK_GLOW[selectedNode.risk] || '#8B949E';
          const connections = getConnections(selectedNode.id);
          const connectedNodes = getConnectedNodes(selectedNode.id);

          return (
            <div style={{
              width: 320, background: 'var(--w-bg)', borderLeft: '1px solid rgba(255,255,255,0.08)',
              padding: '24px 20px', overflowY: 'auto',
            }}>
              {/* Close */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {selectedNode.type?.toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Outfit, sans-serif', margin: 0, color: 'var(--w-text-1)' }}>
                    {selectedNode.label?.replace('\n', ' ') || selectedNode.id}
                  </h3>
                </div>
                <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>

              {/* Risk Level */}
              <div style={{
                padding: '14px 16px', borderRadius: 12, marginBottom: 16, textAlign: 'center',
                background: `${riskColor}10`, border: `1px solid ${riskColor}30`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 6 }}>RISK LEVEL</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: riskColor, fontFamily: 'Outfit, sans-serif' }}>
                  {RISK_LABELS[selectedNode.risk] || 'Unknown'}
                </div>
              </div>

              {/* Properties */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 10 }}>PROPERTIES</div>
                {[
                  { label: 'Node ID', value: selectedNode.id },
                  { label: 'Type', value: selectedNode.type },
                  { label: 'Risk', value: selectedNode.risk },
                  { label: 'Weight', value: selectedNode.val?.toString() || '—' },
                  { label: 'Connections', value: connections.length.toString() },
                ].map(p => (
                  <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--w-card-border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--w-text-3)' }}>{p.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--w-text-1)', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{p.value}</span>
                  </div>
                ))}
              </div>

              {/* Connected Entities */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 10 }}>CONNECTED ENTITIES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {connectedNodes.map((n: any) => {
                    const nColor = NODE_COLORS[n.type] || '#8B949E';
                    const edge = connections.find((l: any) => {
                      const src = typeof l.source === 'string' ? l.source : l.source?.id;
                      const tgt = typeof l.target === 'string' ? l.target : l.target?.id;
                      return src === n.id || tgt === n.id;
                    });
                    return (
                      <div key={n.id} onClick={() => setSelectedNode(n)} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        borderRadius: 8, background: 'var(--w-card)', cursor: 'pointer',
                        borderLeft: `2px solid ${nColor}40`, transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: 4, background: nColor, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--w-text-1)' }}>
                            {n.label?.replace('\n', ' ') || n.id}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--w-text-3)', textTransform: 'capitalize' }}>
                            {n.type} · {edge?.label || '—'}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: `${RISK_GLOW[n.risk] || '#8B949E'}15`,
                          color: RISK_GLOW[n.risk] || '#8B949E',
                        }}>{n.risk?.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Edge Details */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 10 }}>RELATIONSHIPS</div>
                {connections.map((l: any, i: number) => {
                  const src = typeof l.source === 'string' ? l.source : l.source?.id;
                  const tgt = typeof l.target === 'string' ? l.target : l.target?.id;
                  return (
                    <div key={i} style={{
                      fontSize: 11, color: 'var(--w-text-3)', padding: '6px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <span style={{ color: 'var(--w-text-2)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{src}</span>
                      <span style={{ color: '#0EA5E9', margin: '0 6px' }}>→</span>
                      <span style={{ color: 'var(--w-text-2)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{tgt}</span>
                      <span style={{
                        marginLeft: 8, fontSize: 9, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', fontWeight: 600,
                      }}>{l.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
