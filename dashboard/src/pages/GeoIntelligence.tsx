import { useState, useEffect, useRef } from 'react';

// South Africa province SVG paths (simplified but recognizable outlines)
const PROVINCE_PATHS: Record<string, string> = {
  LP: 'M 340 40 L 380 30 L 430 25 L 480 35 L 520 60 L 530 90 L 520 120 L 490 140 L 450 145 L 410 140 L 380 130 L 350 110 L 330 85 L 325 60 Z',
  NW: 'M 240 100 L 280 90 L 330 85 L 350 110 L 380 130 L 370 155 L 345 170 L 310 175 L 270 165 L 240 150 L 220 130 L 225 110 Z',
  GP: 'M 380 130 L 410 140 L 420 155 L 415 170 L 395 180 L 370 175 L 345 170 L 370 155 Z',
  MP: 'M 410 140 L 450 145 L 490 140 L 520 120 L 540 145 L 530 170 L 510 195 L 470 210 L 440 200 L 415 185 L 415 170 L 420 155 Z',
  KZ: 'M 440 200 L 470 210 L 510 195 L 530 220 L 520 260 L 500 290 L 470 310 L 440 300 L 420 270 L 410 240 L 415 215 Z',
  FS: 'M 270 165 L 310 175 L 345 170 L 370 175 L 395 180 L 415 185 L 440 200 L 415 215 L 410 240 L 380 260 L 340 270 L 300 260 L 270 240 L 250 210 L 245 185 Z',
  EC: 'M 300 260 L 340 270 L 380 260 L 410 240 L 420 270 L 440 300 L 420 340 L 390 370 L 350 385 L 310 380 L 280 360 L 260 330 L 250 300 L 270 275 Z',
  NC: 'M 60 130 L 100 100 L 150 80 L 200 85 L 240 100 L 225 110 L 220 130 L 240 150 L 270 165 L 245 185 L 250 210 L 270 240 L 300 260 L 270 275 L 250 300 L 230 310 L 190 320 L 150 310 L 120 290 L 90 260 L 70 220 L 55 180 L 50 150 Z',
  WC: 'M 150 310 L 190 320 L 230 310 L 250 300 L 260 330 L 280 360 L 260 385 L 230 400 L 190 410 L 150 400 L 120 380 L 100 360 L 110 330 L 130 315 Z',
};

// Province label positions (center points for text)
const PROVINCE_LABELS: Record<string, { x: number; y: number }> = {
  LP: { x: 430, y: 80 },
  NW: { x: 290, y: 135 },
  GP: { x: 390, y: 158 },
  MP: { x: 475, y: 170 },
  KZ: { x: 470, y: 255 },
  FS: { x: 335, y: 220 },
  EC: { x: 345, y: 325 },
  NC: { x: 150, y: 200 },
  WC: { x: 190, y: 365 },
};

const PROVINCES = [
  { id: 'GP', name: 'Gauteng',         risk: 'critical', score: 91, attacks: 147, prevented: 'R1.2M', topAttack: 'SIM Swap (41%)', trend: '+7%', hotspots: ['Johannesburg CBD', 'Sandton', 'Pretoria'] },
  { id: 'KZ', name: 'KwaZulu-Natal',   risk: 'high',     score: 74, attacks: 89,  prevented: 'R734K', topAttack: 'Vishing (38%)', trend: '+3%', hotspots: ['Durban Central', 'Umhlanga', 'Pietermaritzburg'] },
  { id: 'WC', name: 'Western Cape',    risk: 'high',     score: 68, attacks: 72,  prevented: 'R612K', topAttack: 'OTP Intercept (33%)', trend: '-2%', hotspots: ['Cape Town CBD', "Mitchell's Plain", 'Bellville'] },
  { id: 'EC', name: 'Eastern Cape',    risk: 'medium',   score: 45, attacks: 38,  prevented: 'R280K', topAttack: 'Account Takeover (29%)', trend: '+1%', hotspots: ['Port Elizabeth', 'East London'] },
  { id: 'FS', name: 'Free State',      risk: 'medium',   score: 42, attacks: 31,  prevented: 'R195K', topAttack: 'Mule Account (35%)', trend: '-5%', hotspots: ['Bloemfontein', 'Welkom'] },
  { id: 'MP', name: 'Mpumalanga',      risk: 'medium',   score: 39, attacks: 27,  prevented: 'R167K', topAttack: 'SIM Swap (31%)', trend: '+2%', hotspots: ['Nelspruit', 'Witbank'] },
  { id: 'NW', name: 'North West',      risk: 'low',      score: 28, attacks: 19,  prevented: 'R98K',  topAttack: 'Vishing (44%)', trend: '-8%', hotspots: ['Rustenburg', 'Mahikeng'] },
  { id: 'LP', name: 'Limpopo',         risk: 'low',      score: 22, attacks: 14,  prevented: 'R72K',  topAttack: 'Account Takeover (61%)', trend: '-11%', hotspots: ['Polokwane'] },
  { id: 'NC', name: 'Northern Cape',   risk: 'low',      score: 18, attacks: 6,   prevented: 'R48K',  topAttack: 'SIM Swap (50%)', trend: '-3%', hotspots: ['Kimberley'] },
];

const RISK_COLOR: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#FBBF24',
  low: '#10F5A0',
};

// Live fraud events feed
const generateEvent = () => {
  const provinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga'];
  const types = ['Vishing attempt', 'SIM swap detected', 'OTP intercept', 'New device block', 'Mule account flagged'];
  const actions = ['BLOCKED', 'WARNED', 'FLAGGED'] as const;
  const amounts = ['R2,400', 'R8,500', 'R1,200', 'R15,000', 'R3,750', 'R500'];
  return {
    id: Math.random().toString(36).slice(2, 8).toUpperCase(),
    province: provinces[Math.floor(Math.random() * provinces.length)],
    type: types[Math.floor(Math.random() * types.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    ts: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
};

export default function GeoIntelligence() {
  const [selected, setSelected] = useState(PROVINCES[0]);
  const [events, setEvents] = useState(() => Array.from({ length: 5 }, generateEvent));
  const [filter, setFilter] = useState<string>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setEvents(prev => [generateEvent(), ...prev.slice(0, 9)]);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const totalAttacks = PROVINCES.reduce((s, p) => s + p.attacks, 0);
  const totalPrevented = 'R3.24M';
  const criticalCount = PROVINCES.filter(p => p.risk === 'critical').length;

  const filteredProvinces = filter === 'all' ? PROVINCES : PROVINCES.filter(p => p.risk === filter);
  const filteredIds = new Set(filteredProvinces.map(p => p.id));

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Inter, sans-serif', color: '#F0F6FF' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#0EA5E9', marginBottom: 6 }}>AI GEO-INTELLIGENCE</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Fraud Heatmap \u2014 South Africa
        </h1>
        <p style={{ fontSize: 13, color: '#64748B' }}>Real-time provincial fraud intelligence \u00B7 AI-predicted risk \u00B7 Live event feed</p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'TOTAL ATTACKS (7D)', value: totalAttacks.toString(), color: '#EF4444', icon: '\uD83D\uDEA8' },
          { label: 'FRAUD PREVENTED', value: totalPrevented, color: '#10F5A0', icon: '\uD83D\uDEE1\uFE0F' },
          { label: 'CRITICAL PROVINCES', value: criticalCount.toString(), color: '#EF4444', icon: '\uD83D\uDD34' },
          { label: 'AVG RESPONSE TIME', value: '73ms', color: '#0EA5E9', icon: '\u26A1' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '16px 20px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', marginBottom: 8 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main layout: Map + Detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24 }}>
        {/* Map */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '20px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Filter bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>Click a province to explore</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'critical', 'high', 'medium', 'low'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: filter === f ? (f === 'all' ? '#0EA5E9' : RISK_COLOR[f] || '#0EA5E9') : 'rgba(255,255,255,0.06)',
                  color: filter === f ? '#000' : '#64748B',
                  transition: 'all 0.2s',
                }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>

          {/* SVG Map */}
          <svg viewBox="20 10 560 420" style={{ width: '100%', height: 'auto', maxHeight: 480 }}>
            {/* Background gradient */}
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(14,165,233,0.04)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect x="20" y="10" width="560" height="420" fill="url(#mapGlow)" rx="12" />

            {/* Province shapes */}
            {Object.entries(PROVINCE_PATHS).map(([id, path]) => {
              const prov = PROVINCES.find(p => p.id === id);
              if (!prov) return null;
              const color = RISK_COLOR[prov.risk];
              const isSelected = selected.id === id;
              const isHovered = hoveredId === id;
              const isFiltered = filteredIds.has(id);
              const opacity = isFiltered ? 1 : 0.2;

              return (
                <g key={id}
                  onClick={() => { const found = PROVINCES.find(p => p.id === id); if (found) setSelected(found); }}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Province fill */}
                  <path
                    d={path}
                    fill={`${color}${isSelected ? '40' : isHovered ? '30' : '18'}`}
                    stroke={isSelected ? color : `${color}80`}
                    strokeWidth={isSelected ? 2.5 : 1.2}
                    opacity={opacity}
                    style={{ transition: 'all 0.3s' }}
                    filter={isSelected ? 'url(#glow)' : undefined}
                  />
                  {/* Province label */}
                  {PROVINCE_LABELS[id] && isFiltered && (
                    <>
                      <text
                        x={PROVINCE_LABELS[id].x}
                        y={PROVINCE_LABELS[id].y - 8}
                        textAnchor="middle"
                        fill={isSelected || isHovered ? '#F0F6FF' : '#94A3B8'}
                        fontSize={id === 'GP' ? 9 : 10}
                        fontWeight={700}
                        fontFamily="Inter, sans-serif"
                        style={{ transition: 'fill 0.2s' }}
                      >
                        {prov.name}
                      </text>
                      {/* Risk score badge */}
                      <rect
                        x={PROVINCE_LABELS[id].x - 14}
                        y={PROVINCE_LABELS[id].y}
                        width={28} height={16} rx={4}
                        fill={`${color}30`}
                        stroke={`${color}60`}
                        strokeWidth={0.8}
                      />
                      <text
                        x={PROVINCE_LABELS[id].x}
                        y={PROVINCE_LABELS[id].y + 12}
                        textAnchor="middle"
                        fill={color}
                        fontSize={9}
                        fontWeight={800}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {prov.score}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Legend */}
            {[
              { label: 'Critical', color: '#EF4444', y: 370 },
              { label: 'High', color: '#F97316', y: 385 },
              { label: 'Medium', color: '#FBBF24', y: 400 },
              { label: 'Low', color: '#10F5A0', y: 415 },
            ].map(l => (
              <g key={l.label}>
                <rect x={40} y={l.y} width={10} height={10} rx={2} fill={l.color} opacity={0.6} />
                <text x={56} y={l.y + 9} fill="#64748B" fontSize={9} fontFamily="Inter, sans-serif">{l.label}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Detail panel */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '24px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: RISK_COLOR[selected.risk], marginBottom: 4 }}>
                {selected.risk.toUpperCase()}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{selected.name}</div>
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${RISK_COLOR[selected.risk]}15`,
              border: `2px solid ${RISK_COLOR[selected.risk]}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: RISK_COLOR[selected.risk],
              fontFamily: 'JetBrains Mono, monospace',
            }}>{selected.score}</div>
          </div>

          {/* Risk bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', marginBottom: 8 }}>RISK SCORE</div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${selected.score}%`, background: RISK_COLOR[selected.risk], borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
          </div>

          {/* Stats */}
          {[
            { label: 'Attacks (7 days)', value: selected.attacks.toString(), color: '#EF4444' },
            { label: 'Fraud Prevented', value: selected.prevented, color: '#10F5A0' },
            { label: 'Top Attack Vector', value: selected.topAttack, color: '#FBBF24' },
            { label: 'Trend', value: selected.trend, color: selected.trend.startsWith('+') ? '#EF4444' : '#10F5A0' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}

          {/* Hotspots */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', marginBottom: 10 }}>HIGH-RISK AREAS</div>
            {selected.hotspots.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: RISK_COLOR[selected.risk] }} />
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{h}</span>
              </div>
            ))}
          </div>

          {/* AI prediction */}
          <div style={{
            marginTop: 20, padding: '14px 16px', borderRadius: 12,
            background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', marginBottom: 6 }}>{'\uD83E\uDD16'} AI PREDICTION (72h)</div>
            <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
              Attack volume expected to increase 8-15% over the weekend. SIM swap activity peaks Friday evenings.
            </div>
          </div>
        </div>
      </div>

      {/* Live threat feed */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '20px', overflow: 'hidden',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#EF4444', marginBottom: 14 }}>{'\uD83D\uDEA8'} LIVE THREAT FEED</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {events.slice(0, 8).map((e, i) => (
            <div key={`${e.id}-${i}`} style={{
              display: 'grid', gridTemplateColumns: '70px 1fr 120px 90px 80px 70px',
              padding: '8px 12px', borderRadius: 8, fontSize: 12, gap: 8, alignItems: 'center',
              background: i === 0 ? 'rgba(239,68,68,0.04)' : 'transparent',
              borderLeft: i === 0 ? '2px solid #EF4444' : '2px solid transparent',
              opacity: i === 0 ? 1 : 0.7 + (0.3 * (1 - i / 8)),
              transition: 'all 0.5s',
            }}>
              <span style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{e.ts}</span>
              <span style={{ color: '#94A3B8' }}>{e.type}</span>
              <span style={{ color: '#64748B', fontSize: 11 }}>{e.province}</span>
              <span style={{ color: '#F0F6FF', fontWeight: 600, fontSize: 11 }}>{e.amount}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textAlign: 'center',
                background: e.action === 'BLOCKED' ? 'rgba(239,68,68,0.15)' : e.action === 'WARNED' ? 'rgba(251,191,36,0.15)' : 'rgba(14,165,233,0.15)',
                color: e.action === 'BLOCKED' ? '#EF4444' : e.action === 'WARNED' ? '#FBBF24' : '#0EA5E9',
              }}>{e.action}</span>
              <span style={{ color: '#334155', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>{e.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
