import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTransactions, mockRules } from '../data/mock';

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.round(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// ── Mini sparkline component ──────────────────────────────────────────────────
function Sparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${w},${height}`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

// ── Ring gauge component ──────────────────────────────────────────────────────
function RingGauge({ value, max, color, size = 80, label }: { value: number; max: number; color: string; size?: number; label: string }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 8) / 2;
  const c = Math.PI * 2 * r;
  const offset = c * (1 - pct);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
        <div style={{ fontSize: 7, color: '#475569', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</div>
      </div>
    </div>
  );
}

// ── Live event generator ──────────────────────────────────────────────────────
const generateLiveEvent = () => {
  const types = ['SIM Swap Blocked', 'Vishing Call Detected', 'OTP Intercept Stopped', 'Mule Account Flagged', 'Device Anomaly', 'Velocity Breach'];
  const users = ['+27821000001', '+27834000012', '+27715000003', '+27609000045', '+27831000067', '+27724000089'];
  const amounts = [2500, 8500, 1200, 15000, 3750, 500, 22000, 6800, 950, 4200];
  const actions = ['BLOCK', 'WARN_USER', 'BLOCK', 'BLOCK', 'WARN_USER'] as const;
  return {
    id: Math.random().toString(36).slice(2, 8).toUpperCase(),
    type: types[Math.floor(Math.random() * types.length)],
    user: users[Math.floor(Math.random() * users.length)],
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    risk: Math.floor(Math.random() * 40) + 60,
    ts: new Date(),
  };
};

export default function Overview() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [threatLevel, setThreatLevel] = useState<'GREEN' | 'AMBER' | 'RED'>('AMBER');
  const [liveEvents, setLiveEvents] = useState(() => Array.from({ length: 8 }, generateLiveEvent));
  const eventRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute stats
  const totalTxn = 12847;
  const blocked = 342;
  const warned = 189;
  const prevented = 2340000;
  const activeRules = mockRules?.filter((r: { enabled: boolean }) => r.enabled).length || 10;
  const totalRules = mockRules?.length || 14;
  const avgLatency = 47;
  const falsePositiveRate = 0.28;

  // Sparkline data
  const txnTrend = [820, 950, 780, 1100, 1340, 980, 1250, 1400, 1180, 1350, 1520, 1280, 1450, 1620];
  const blockTrend = [18, 22, 15, 28, 35, 20, 31, 38, 25, 34, 42, 29, 36, 44];
  const preventedTrend = [120, 180, 95, 220, 340, 150, 280, 390, 200, 310, 420, 250, 350, 480];

  // Animated counters
  const aTxn = useCounter(totalTxn);
  const aBlocked = useCounter(blocked);
  const aWarned = useCounter(warned);
  const aPrevented = useCounter(prevented);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    eventRef.current = setInterval(() => {
      setLiveEvents(prev => [generateLiveEvent(), ...prev.slice(0, 11)]);
    }, 3000);
    // Rotate threat level for demo
    const threatTimer = setInterval(() => {
      setThreatLevel(prev => prev === 'GREEN' ? 'AMBER' : prev === 'AMBER' ? 'RED' : 'GREEN');
    }, 15000);
    return () => { clearInterval(t); if (eventRef.current) clearInterval(eventRef.current); clearInterval(threatTimer); };
  }, []);

  const threatColors = { GREEN: '#10F5A0', AMBER: '#FBBF24', RED: '#EF4444' };
  const threatLabels = { GREEN: 'Normal Operations', AMBER: 'Elevated Activity', RED: 'Active Threat Detected' };

  const recentFlagged = mockTransactions
    ?.sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6) || [];

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `R${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `R${(n / 1000).toFixed(0)}K`;
    return `R${n}`;
  };

  return (
    <div style={{ padding: '20px 28px', fontFamily: 'Inter, sans-serif', color: '#F0F6FF' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
            Command Center
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>Real-time fraud operations \u00B7 AI-powered analytics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
            {time.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#10F5A0', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, color: '#10F5A0', fontWeight: 600 }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* Threat Level Banner */}
      <div style={{
        padding: '12px 20px', borderRadius: 12, marginBottom: 20,
        background: `${threatColors[threatLevel]}08`,
        border: `1px solid ${threatColors[threatLevel]}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.5s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: 5,
            background: threatColors[threatLevel],
            boxShadow: `0 0 12px ${threatColors[threatLevel]}80`,
            animation: threatLevel === 'RED' ? 'pulse 1s infinite' : undefined,
          }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: threatColors[threatLevel] }}>
            THREAT LEVEL: {threatLevel}
          </span>
          <span style={{ fontSize: 12, color: '#64748B' }}>\u2014 {threatLabels[threatLevel]}</span>
        </div>
        <span style={{ fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
          Updated {time.toLocaleTimeString('en-ZA')}
        </span>
      </div>

      {/* Stats Grid — clickable drill-down */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'TRANSACTIONS (7D)', value: aTxn.toLocaleString(), trend: '+12%', trendUp: true, color: '#0EA5E9', spark: txnTrend, sparkColor: '#0EA5E9', link: '/transactions' },
          { label: 'THREATS BLOCKED', value: aBlocked.toLocaleString(), trend: '+18%', trendUp: true, color: '#EF4444', spark: blockTrend, sparkColor: '#EF4444', link: '/transactions' },
          { label: 'WARNINGS ISSUED', value: aWarned.toLocaleString(), trend: '-5%', trendUp: false, color: '#FBBF24', spark: null, sparkColor: '', link: '/transactions' },
          { label: 'FRAUD PREVENTED', value: formatCurrency(aPrevented), trend: '+24%', trendUp: true, color: '#10F5A0', spark: preventedTrend, sparkColor: '#10F5A0', link: '/reports' },
          { label: 'AVG RESPONSE', value: `${avgLatency}ms`, trend: '-8ms', trendUp: false, color: '#A78BFA', spark: null, sparkColor: '', link: '/rules' },
        ].map((s, i) => (
          <div key={i} onClick={() => navigate(s.link)} style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${s.color}40`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}60, transparent)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#475569' }}>{s.label}</span>
              <span style={{ fontSize: 10, color: '#334155', transition: 'color 0.2s' }}>→</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#F0F6FF', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: s.trendUp ? '#10F5A0' : '#0EA5E9', marginTop: 4 }}>
                  {s.trendUp ? '\u2191' : '\u2193'} {s.trend}
                </div>
              </div>
              {s.spark && <Sparkline data={s.spark} color={s.sparkColor} />}
            </div>
          </div>
        ))}
      </div>

      {/* Middle row: Ring Gauges + Risk Distribution + Attack Types */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 280px', gap: 14, marginBottom: 20 }}>
        {/* Ring Gauges */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '20px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', marginBottom: 16 }}>SYSTEM HEALTH</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, justifyItems: 'center' }}>
            <RingGauge value={activeRules} max={totalRules} color="#0EA5E9" label="RULES" />
            <RingGauge value={99} max={100} color="#10F5A0" label="UPTIME %" />
            <RingGauge value={Math.round(falsePositiveRate * 100)} max={100} color="#FBBF24" label="FP RATE" />
            <RingGauge value={avgLatency} max={100} color="#A78BFA" label="LATENCY" />
          </div>
        </div>

        {/* Risk Distribution - Custom bars */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569' }}>DAILY THREAT VOLUME (14D)</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[{ l: 'Blocked', c: '#EF4444' }, { l: 'Warned', c: '#FBBF24' }, { l: 'Allowed', c: '#10F5A0' }].map(x => (
                <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
                  <span style={{ fontSize: 10, color: '#64748B' }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 160 }}>
            {[
              { b: 18, w: 12, a: 45 }, { b: 22, w: 8, a: 52 }, { b: 15, w: 14, a: 38 },
              { b: 28, w: 10, a: 60 }, { b: 35, w: 16, a: 72 }, { b: 20, w: 9, a: 48 },
              { b: 31, w: 13, a: 55 }, { b: 38, w: 18, a: 68 }, { b: 25, w: 11, a: 50 },
              { b: 34, w: 15, a: 65 }, { b: 42, w: 20, a: 78 }, { b: 29, w: 12, a: 58 },
              { b: 36, w: 17, a: 70 }, { b: 44, w: 22, a: 82 },
            ].map((d, i) => {
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const maxH = 150;
              const scale = maxH / 148;
              const total = d.b + d.w + d.a;
              return (
                <div key={i} title={`${days[i]}\n━━━━━━━━━━━━\nBlocked: ${d.b}\nWarned: ${d.w}\nAllowed: ${d.a}\nTotal: ${total}`}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'flex-end', cursor: 'pointer', position: 'relative' }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.3)'; e.currentTarget.style.transform = 'scaleX(1.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scaleX(1)'; }}
                >
                  <div style={{ height: d.a * scale, background: '#10F5A0', borderRadius: '3px 3px 0 0', opacity: 0.7, transition: 'all 0.3s' }} />
                  <div style={{ height: d.w * scale, background: '#FBBF24', opacity: 0.8, transition: 'all 0.3s' }} />
                  <div style={{ height: d.b * scale, background: '#EF4444', borderRadius: '0 0 3px 3px', opacity: 0.9, transition: 'all 0.3s' }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#334155' }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Top Attack Vectors */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '20px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', marginBottom: 16 }}>TOP ATTACK VECTORS</div>
          {[
            { name: 'SIM Swap', pct: 41, color: '#EF4444' },
            { name: 'Vishing (Phone)', pct: 28, color: '#F97316' },
            { name: 'OTP Intercept', pct: 16, color: '#FBBF24' },
            { name: 'Account Takeover', pct: 9, color: '#A78BFA' },
            { name: 'Mule Networks', pct: 6, color: '#0EA5E9' },
          ].map((v, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{v.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: v.color, fontFamily: 'JetBrains Mono, monospace' }}>{v.pct}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${v.pct}%`, background: v.color, borderRadius: 99, transition: 'width 1s ease-out' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Live Feed + Recent Flagged */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Live Threat Feed */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '20px', maxHeight: 380, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#EF4444' }}>LIVE THREAT FEED</span>
            </div>
            <span style={{ fontSize: 10, color: '#334155' }}>{liveEvents.length} events</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {liveEvents.slice(0, 8).map((e, i) => (
              <div key={`${e.id}-${i}`} style={{
                display: 'grid', gridTemplateColumns: '65px 1fr 70px 50px',
                padding: '8px 10px', borderRadius: 8, fontSize: 11, alignItems: 'center', gap: 8,
                background: i === 0 ? 'rgba(239,68,68,0.06)' : 'transparent',
                borderLeft: `2px solid ${i === 0 ? '#EF4444' : 'transparent'}`,
                opacity: 1 - i * 0.08,
                transition: 'all 0.5s',
              }}>
                <span style={{ color: '#334155', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
                  {e.ts.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span style={{ color: '#94A3B8', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.type}</span>
                <span style={{ color: '#F0F6FF', fontWeight: 600, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>R{e.amount.toLocaleString()}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textAlign: 'center',
                  background: e.action === 'BLOCK' ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.15)',
                  color: e.action === 'BLOCK' ? '#EF4444' : '#FBBF24',
                }}>{e.action === 'BLOCK' ? 'BLOCK' : 'WARN'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Flagged Transactions */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '20px', maxHeight: 380, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569' }}>RECENT FLAGGED TRANSACTIONS</span>
            <button onClick={() => navigate('/transactions')} style={{
              fontSize: 10, color: '#0EA5E9', background: 'none', border: '1px solid rgba(14,165,233,0.3)',
              padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
            }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 60px 70px', padding: '6px 10px', gap: 8 }}>
              {['TIME', 'USER', 'AMOUNT', 'RISK', 'ACTION'].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.08em' }}>{h}</span>
              ))}
            </div>
            {recentFlagged.map((t: any, i: number) => {
              const riskColor = t.riskLevel === 'HIGH' ? '#EF4444' : t.riskLevel === 'MEDIUM' ? '#FBBF24' : '#10F5A0';
              return (
                <div key={t.id || i} onClick={() => navigate(`/transactions/${t.id}`)} style={{
                  display: 'grid', gridTemplateColumns: '70px 1fr 80px 60px 70px',
                  padding: '10px 10px', borderRadius: 8, gap: 8, cursor: 'pointer', alignItems: 'center',
                  background: t.riskLevel === 'HIGH' ? 'rgba(239,68,68,0.04)' : 'transparent',
                  borderLeft: `2px solid ${riskColor}30`,
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={(e: any) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e: any) => (e.currentTarget.style.background = t.riskLevel === 'HIGH' ? 'rgba(239,68,68,0.04)' : 'transparent')}
                >
                  <span style={{ fontSize: 10, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                    {new Date(t.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{t.senderId}</span>
                  <span style={{ fontSize: 11, color: '#F0F6FF', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>R{t.amount?.toLocaleString()}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: `${riskColor}18`, color: riskColor, textAlign: 'center',
                  }}>{t.riskLevel}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 600, color: t.recommendedAction === 'BLOCK' ? '#EF4444' : t.recommendedAction === 'WARN_USER' ? '#FBBF24' : '#10F5A0',
                  }}>{t.recommendedAction}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
