import { useState } from 'react';

const HISTORY = [
  { day: 'Mon 3', attacks: 18, prevented: 14, high: 6, label: 'Mar 3' },
  { day: 'Tue 4', attacks: 24, prevented: 20, high: 9, label: 'Mar 4' },
  { day: 'Wed 5', attacks: 31, prevented: 27, high: 13, label: 'Mar 5' },
  { day: 'Thu 6', attacks: 19, prevented: 16, high: 7, label: 'Mar 6' },
  { day: 'Fri 7', attacks: 42, prevented: 38, high: 18, label: 'Mar 7' },
  { day: 'Sat 8', attacks: 15, prevented: 13, high: 4, label: 'Mar 8' },
  { day: 'Sun 9', attacks: 11, prevented: 9, high: 2, label: 'Mar 9' },
  { day: 'Mon 10', attacks: 27, prevented: 24, high: 10, label: 'Mar 10' },
  { day: 'Tue 11', attacks: 33, prevented: 29, high: 14, label: 'Mar 11' },
  { day: 'Wed 12', attacks: 29, prevented: 25, high: 11, label: 'Mar 12 (today)' },
];

const FORECAST = [
  { day: 'Thu 13', forecast: 34, low: 28, high: 42, label: 'Mar 13' },
  { day: 'Fri 14', forecast: 48, low: 38, high: 61, label: 'Mar 14 ⚠️ Peak' },
  { day: 'Sat 15', forecast: 21, low: 15, high: 29, label: 'Mar 15' },
  { day: 'Sun 16', forecast: 14, low: 9, high: 21, label: 'Mar 16' },
  { day: 'Mon 17', forecast: 38, low: 29, high: 50, label: 'Mar 17' },
  { day: 'Tue 18', forecast: 41, low: 31, high: 55, label: 'Mar 18' },
  { day: 'Wed 19', forecast: 44, low: 33, high: 59, label: 'Mar 19 ⚠️' },
];

const ALL_VALUES = [...HISTORY.map(h => h.attacks), ...FORECAST.map(f => f.high)];
const MAX_VAL = Math.max(...ALL_VALUES) + 8;
const W = 800, H = 240, PAD = { t: 20, r: 20, b: 40, l: 40 };
const INNER_W = W - PAD.l - PAD.r;
const INNER_H = H - PAD.t - PAD.b;
const ALL_DAYS = [...HISTORY, ...FORECAST.map(f => ({ day: f.day, attacks: f.forecast, prevented: 0, high: 0, label: f.label }))];
const xScale = (i: number) => PAD.l + (i / (ALL_DAYS.length - 1)) * INNER_W;
const yScale = (v: number) => PAD.t + INNER_H - (v / MAX_VAL) * INNER_H;

export default function TrajectoryPage() {
  const [hover, setHover] = useState<number | null>(null);

  // Build forecast confidence band polygon
  const bandTop = FORECAST.map((f, i) => `${xScale(HISTORY.length + i)},${yScale(f.high)}`).join(' ');
  const bandBot = [...FORECAST].reverse().map((f, i) => `${xScale(HISTORY.length + FORECAST.length - 1 - i)},${yScale(f.low)}`).join(' ');

  // Historical path
  const histPath = HISTORY.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(h.attacks)}`).join(' ');
  // Forecast path (dotted)
  const forecastPath = [`M ${xScale(HISTORY.length - 1)},${yScale(HISTORY[HISTORY.length - 1].attacks)}`,
    ...FORECAST.map((f, i) => `L ${xScale(HISTORY.length + i)},${yScale(f.forecast)}`)].join(' ');

  const recommendations = [
    { day: 'Fri 14', level: 'critical', action: 'Increase analyst staffing +2. Pre-activate RULE_003 sensitivity boost for Gauteng.' },
    { day: 'Mon 17–Wed 19', level: 'high', action: 'Extended monitoring window. Consider automated WARN threshold reduction from 50 → 40.' },
  ];

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)', background: '#0D1629', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>🤖 ML TRAJECTORY MODEL</div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Attack Trajectory Prediction</h1>
        <p style={{ color: 'var(--w-text-2)', fontSize: 13, margin: 0 }}>7-day ML forecast with 80% confidence bands · Historical baseline · Pre-emptive staffing recommendations</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Peak day predicted', value: 'Fri Mar 14', color: '#EF4444', sub: '48 attacks forecast' },
          { label: '7-day total', value: '240', color: '#F97316', sub: '±45 confidence' },
          { label: 'Fraud prevented (7d)', value: 'R820K', color: '#10F5A0', sub: 'projected' },
          { label: 'Model confidence', value: '81%', color: '#7C3AED', sub: 'LSTM v2.1' },
        ].map(k => (
          <div key={k.label} style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.12)', border: `1px solid ${k.color}20`, borderRadius: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--w-text-2)', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: 'Outfit' }}>{k.value}</div>
            <div style={{ fontSize: 10, color: 'var(--w-text-3)', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart card */}
      <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '20px 20px 8px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text-2)' }}>Fraud Volume Forecast · 10-day window (3 history + 7 forecast)</span>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 20, height: 2, background: '#0EA5E9' }} /><span style={{ color: 'var(--w-text-3)' }}>Historical</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 20, height: 2, background: '#7C3AED', borderTop: '2px dashed #7C3AED' }} /><span style={{ color: 'var(--w-text-3)' }}>Forecast</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 16, height: 10, background: 'rgba(124,58,237,0.15)', borderRadius: 2 }} /><span style={{ color: 'var(--w-text-3)' }}>80% CI</span></div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}
            onMouseLeave={() => setHover(null)}>
            <defs>
              <linearGradient id="histgrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y-axis grid lines */}
            {[0, 20, 40, 60].map(v => (
              <g key={v}>
                <line x1={PAD.l} y1={yScale(v)} x2={W - PAD.r} y2={yScale(v)} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
                <text x={PAD.l - 6} y={yScale(v) + 4} textAnchor="end" fill="#334155" fontSize="9" fontFamily="JetBrains Mono">{v}</text>
              </g>
            ))}

            {/* Today divider */}
            <line x1={xScale(HISTORY.length - 1)} y1={PAD.t} x2={xScale(HISTORY.length - 1)} y2={H - PAD.b}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4,4" />
            <text x={xScale(HISTORY.length - 1) + 4} y={PAD.t + 10} fill="#475569" fontSize="8" fontFamily="Inter">TODAY</text>

            {/* Confidence band */}
            <polygon points={`${bandTop} ${bandBot}`} fill="rgba(124,58,237,0.12)" stroke="none" />
            <polyline points={FORECAST.map((f,i) => `${xScale(HISTORY.length+i)},${yScale(f.high)}`).join(' ')} fill="none" stroke="rgba(124,58,237,0.3)" strokeWidth="1" strokeDasharray="3,3" />
            <polyline points={FORECAST.map((f,i) => `${xScale(HISTORY.length+i)},${yScale(f.low)}`).join(' ')} fill="none" stroke="rgba(124,58,237,0.3)" strokeWidth="1" strokeDasharray="3,3" />

            {/* Area under historical */}
            <path d={`${histPath} L ${xScale(HISTORY.length-1)},${H-PAD.b} L ${xScale(0)},${H-PAD.b} Z`} fill="url(#histgrad)" />

            {/* Historical line */}
            <path d={histPath} fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinejoin="round" />

            {/* Forecast line (dashed) */}
            <path d={forecastPath} fill="none" stroke="#7C3AED" strokeWidth="2" strokeDasharray="6,3" strokeLinejoin="round" />

            {/* Data points + hover */}
            {ALL_DAYS.map((d, i) => {
              const isHistory = i < HISTORY.length;
              const val = isHistory ? HISTORY[i].attacks : FORECAST[i - HISTORY.length].forecast;
              const color = isHistory ? '#0EA5E9' : '#7C3AED';
              return (
                <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: 'pointer' }}>
                  <circle cx={xScale(i)} cy={yScale(val)} r={hover === i ? 6 : 3.5} fill={color} stroke="#0D1629" strokeWidth="1.5" />
                  <text x={xScale(i)} y={H - PAD.b + 14} textAnchor="middle" fill="#475569" fontSize="8" fontFamily="Inter" style={{ userSelect: 'none' }}>{d.day}</text>
                  {hover === i && (
                    <g>
                      <rect x={xScale(i) - 50} y={yScale(val) - 38} width="100" height="32" rx="6" fill="#0D1629" stroke={color} strokeWidth="1" />
                      <text x={xScale(i)} y={yScale(val) - 22} textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="Outfit">{val} attacks</text>
                      <text x={xScale(i)} y={yScale(val) - 10} textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="Inter">{d.label}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--w-text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>🤖 AI Pre-emptive Recommendations</div>
          {recommendations.map(r => (
            <div key={r.day} style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 10, background: r.level === 'critical' ? 'rgba(239,68,68,0.07)' : 'rgba(249,115,22,0.07)', border: `1px solid ${r.level === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.25)'}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: r.level === 'critical' ? '#EF4444' : '#F97316', marginBottom: 4 }}>{r.day}</div>
              <div style={{ fontSize: 11, color: 'var(--w-text-3)', lineHeight: 1.7 }}>{r.action}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--w-text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>📊 Forecast Breakdown by Day</div>
          {FORECAST.map(f => (
            <div key={f.day} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--w-text-2)', width: 50, flexShrink: 0, fontFamily: 'JetBrains Mono' }}>{f.day}</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${(f.forecast / MAX_VAL) * 100}%`, height: '100%', background: f.forecast > 40 ? 'linear-gradient(90deg,#F97316,#EF4444)' : f.forecast > 25 ? '#FBBF24' : '#10F5A0', borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: f.forecast > 40 ? '#EF4444' : '#94A3B8', width: 24, textAlign: 'right' }}>{f.forecast}</span>
              <span style={{ fontSize: 9, color: 'var(--w-text-3)', width: 50 }}>±{Math.round((f.high - f.low) / 2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
