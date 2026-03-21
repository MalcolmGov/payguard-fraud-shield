import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Rule {
  id: string; label: string; delta: number; originalDelta: number;
  enabled: boolean; category: string; firingRate: number;
}

const INITIAL_RULES: Rule[] = [
  { id:'RULE_001', label:'Call + new recipient + high amount',   delta:75, originalDelta:75, enabled:true,  category:'Social Engineering', firingRate:68 },
  { id:'RULE_002', label:'Call + recipient not in contacts',     delta:40, originalDelta:40, enabled:true,  category:'Social Engineering', firingRate:55 },
  { id:'RULE_003', label:'Transaction < 10s of session start',   delta:30, originalDelta:30, enabled:true,  category:'Behavioral',         firingRate:42 },
  { id:'RULE_004', label:'Paste detected on recipient field',    delta:20, originalDelta:20, enabled:true,  category:'Behavioral',         firingRate:38 },
  { id:'RULE_005', label:'New recipient + amount > 2× avg',      delta:35, originalDelta:35, enabled:true,  category:'Velocity',           firingRate:61 },
  { id:'RULE_006', label:'SIM swap detected last 48h',           delta:50, originalDelta:50, enabled:true,  category:'Device',             firingRate:12 },
  { id:'RULE_007', label:'Device on > 3 accounts',               delta:60, originalDelta:60, enabled:true,  category:'Device',             firingRate:18 },
  { id:'RULE_008', label:'Recent SMS with fraud keywords',        delta:25, originalDelta:25, enabled:true,  category:'Social Engineering', firingRate:29 },
  { id:'RULE_009', label:'Rooted/jailbroken device',             delta:20, originalDelta:20, enabled:false, category:'Device',             firingRate:8  },
  { id:'RULE_010', label:'VPN/proxy active',                     delta:15, originalDelta:15, enabled:false, category:'Network',            firingRate:5  },
  { id:'RULE_011', label:'New device fingerprint',               delta:40, originalDelta:40, enabled:true,  category:'Device',             firingRate:24 },
  { id:'RULE_014', label:'OTP screen open during unknown call',  delta:80, originalDelta:80, enabled:true,  category:'Social Engineering', firingRate:9  },
];

const CAT_COLOR: Record<string, string> = {
  'Social Engineering':'#F85149', 'Behavioral':'#D29922',
  'Velocity':'#58A6FF', 'Device':'#BC8CFF', 'Network':'#39D3BB',
};

const AFFECTED_TXS = [
  { id:'TX-0441', amount:'R1,200', old:65, next:90 },
  { id:'TX-0502', amount:'R800',   old:58, next:83 },
  { id:'TX-0613', amount:'R3,500', old:70, next:95 },
  { id:'TX-0714', amount:'R500',   old:55, next:80 },
];

const STAGES = [
  { title:'New Fraud Wave Detected',          action:'Open Rules Engine ?',    color:'#F85149' },
  { title:'Analyst Opens Rules Engine',        action:'Identify the Rule ?',    color:'#D29922' },
  { title:'RULE_003 Identified — Score Too Low',action:'Adjust Score ?',        color:'#D29922' },
  { title:'Live Score Adjustment',             action:'Deploy Change ?',        color:'#58A6FF' },
  { title:'? Deployed — No Code Required',    action:'Done',                   color:'#3FB950' },
];

const STAGE_DESCS = [
  'A new scam variant is surfacing — fraudsters rush victims through the payment flow in under 10 seconds. RULE_003 is currently only worth 30 pts, not enough to reach the BLOCK threshold on its own. 14 fraudulent transactions slipped through in the last 6 hours.',
  'No ticket to IT. No code deployment. No waiting. The mobile operator fraud analyst opens the PayGuard Rules Engine directly. Every rule is visible, editable, and deployable in real-time.',
  '"Transaction initiated < 10s of session start" currently scores only 30 pts. Combined with other signals it reaches WARN but not BLOCK. The analyst selects RULE_003 to increase its weight.',
  'The analyst drags the delta slider from 30 ? 55. The system previews impact: 14 transactions that were WARN would now be BLOCK. No code change. No deployment window needed.',
  'Rule takes effect instantly. Future transactions are now correctly evaluated. 14 cases now blocked. mobile operator\'s fraud team made this change themselves — no Swifter engineer involved.',
];

export default function DemoRuleTuning() {
  const navigate = useNavigate();
  const [stageIdx, setStageIdx] = useState(0);
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deployed, setDeployed] = useState(false);

  const stage = STAGES[stageIdx];
  const isLast = stageIdx === STAGES.length - 1;
  const showPreview = stageIdx >= 3;


  const advance = () => {
    if (isLast) return;
    if (stageIdx === 2) setEditingId('RULE_003');
    if (stageIdx === 3) { setDeployed(true); setEditingId(null); }
    setStageIdx(s => s + 1);
  };

  const retreat = () => {
    if (stageIdx === 0) return;
    if (stageIdx === 3) setEditingId('RULE_003');
    if (stageIdx === 4) { setDeployed(false); setEditingId(null); }
    if (stageIdx === 2) setEditingId(null);
    setStageIdx(s => s - 1);
  };

  const updateDelta = (id: string, val: number) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, delta: Math.max(5, Math.min(100, val)) } : r));

  const toggleEnabled = (id: string) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  return (
    <div style={{ height:'100vh', background:'var(--bg-primary)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Topbar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0 24px', height:56, borderBottom:'1px solid var(--border)', background:'var(--bg-secondary)', flexShrink:0 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/demo')} style={{ fontSize:12 }}>? All Demos</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>?? Demo 5 of 6 — Live Rule Tuning</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>Zero Code · Real-Time Deployment · mobile operator Fraud Ops Ownership</div>
        </div>
        {isLast && <button className="btn btn-primary" onClick={() => navigate('/demo/falsepositive')} style={{ fontSize:12 }}>Next: False Positive Proof ?</button>}
      </div>

      {/* Stage progress bar */}
      <div style={{ display:'flex', padding:'0 24px', background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {STAGES.map((s, i) => {
          const isActive = i === stageIdx, isDone = i < stageIdx;
          return (
            <button key={i} onClick={() => { if (i < stageIdx) { for (let j=stageIdx;j>i;j--) retreat(); } else { for (let j=stageIdx;j<i;j++) advance(); } }}
              style={{ padding:'10px 16px', border:'none', cursor:'pointer', whiteSpace:'nowrap', background:'transparent', borderBottom: isActive ? '2px solid #3FB950' : isDone ? '2px solid #3FB950' : '2px solid transparent', color: isActive ? '#3FB950' : isDone ? '#3FB950' : 'var(--text-muted)', fontSize:11, fontWeight: isActive ? 700 : 400, fontFamily:'Inter, sans-serif', transition:'all 0.2s' }}>
              {isDone ? '?' : `${i+1}.`} {s.title.split(' ').slice(0,3).join(' ')}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="demo-flow-grid" style={{ flex:1, display:'grid', gridTemplateColumns:'320px 1fr', overflow:'hidden' }}>

        {/* Left */}
        <div style={{ borderRight:'1px solid var(--border)', padding:20, display:'flex', flexDirection:'column', gap:14, overflowY:'auto' }}>
          {stageIdx === 0 && (
            <div style={{ background:'rgba(248,81,73,0.1)', border:'1px solid rgba(248,81,73,0.3)', borderRadius:10, padding:14 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#F85149', marginBottom:6 }}>?? FRAUD INTELLIGENCE ALERT</div>
              <div style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.8 }}>New scam variant detected. <strong style={{ color:'var(--text-primary)' }}>14 transactions</strong> missed in last 6 hours. RULE_003 delta (30 pts) insufficient to reach BLOCK threshold.</div>
            </div>
          )}

          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
            <div style={{ fontSize:10, fontWeight:600, color:'#3FB950', letterSpacing:'0.1em', marginBottom:6 }}>STAGE {stageIdx+1} OF {STAGES.length}</div>
            <h2 style={{ fontSize:17, marginBottom:10, color:'var(--text-primary)', lineHeight:1.3 }}>{stage.title}</h2>
            <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.8 }}>{STAGE_DESCS[stageIdx]}</p>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost" onClick={retreat} disabled={stageIdx===0} style={{ flex:1, fontSize:12 }}>? Back</button>
            <button className={`btn btn-primary`} onClick={advance} disabled={isLast} style={{ flex:2, fontSize:12, fontWeight:700, background: stageIdx===3 ? '#3FB950' : undefined, color: stageIdx===3 ? '#0D1117' : undefined }}>
              {stage.action}
            </button>
          </div>

          {showPreview && (
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', marginBottom:10 }}>
                {deployed ? '? DEPLOYED — IMPACT' : '? PREVIEW — IMPACT'}
              </div>
              {AFFECTED_TXS.map(tx => (
                <div key={tx.id} style={{ marginBottom:8, padding:'8px 10px', background:'rgba(248,81,73,0.05)', border:'1px solid rgba(248,81,73,0.15)', borderRadius:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:10, fontFamily:'JetBrains Mono, monospace', color:'var(--text-secondary)' }}>{tx.id}</span>
                    <span style={{ fontSize:10, color:'var(--text-muted)' }}>{tx.amount}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:10, color:'#D29922', fontFamily:'monospace' }}>{tx.old}</span>
                    <span style={{ fontSize:10, color:'var(--text-muted)' }}>?</span>
                    <span style={{ fontSize:10, color:'#F85149', fontWeight:700, fontFamily:'monospace' }}>{tx.next}</span>
                    <span style={{ fontSize:9, background:'rgba(248,81,73,0.15)', color:'#F85149', borderRadius:4, padding:'1px 6px', marginLeft:'auto' }}>WARN ? BLOCK</span>
                  </div>
                </div>
              ))}
              <div style={{ fontSize:11, fontWeight:600, color: deployed ? '#3FB950' : '#58A6FF', textAlign:'center', marginTop:6 }}>
                {deployed ? '? 14 transactions now correctly blocked' : '? 14 transactions would be reclassified'}
              </div>
            </div>
          )}

          {deployed && (
            <div style={{ background:'rgba(63,185,80,0.08)', border:'1px solid rgba(63,185,80,0.25)', borderRadius:10, padding:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#3FB950', marginBottom:6 }}>?? Live in Production</div>
              <div style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.9 }}>
                No code merged<br />No ticket raised<br />No deployment pipeline<br />No downtime<br />
                <strong style={{ color:'var(--text-primary)' }}>mobile operator Fraud Ops team in full control.</strong>
              </div>
            </div>
          )}
        </div>

        {/* Right: Rules table */}
        <div style={{ overflow:'auto', padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h2 style={{ fontSize:20, color:'var(--text-primary)', marginBottom:4 }}>Fraud Rule Engine</h2>
              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{rules.filter(r=>r.enabled).length} active rules · Changes apply instantly · No deployment needed</div>
            </div>
            {deployed && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(63,185,80,0.1)', border:'1px solid rgba(63,185,80,0.3)', borderRadius:8, padding:'8px 14px' }}>
                <span style={{ color:'#3FB950' }}>?</span>
                <span style={{ fontSize:12, fontWeight:600, color:'#3FB950' }}>Rule change deployed at {new Date().toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {rules.map(rule => {
              const catColor = CAT_COLOR[rule.category] ?? '#58A6FF';
              const isHighlight = stageIdx >= 2 && rule.id === 'RULE_003';
              const isEditing = editingId === rule.id;
              const changed = rule.delta !== rule.originalDelta;
              return (
                <div key={rule.id} style={{ background: isHighlight ? 'rgba(88,166,255,0.05)' : 'var(--bg-card)', border:`1px solid ${isHighlight ? '#58A6FF55' : changed && deployed ? '#3FB95044' : 'var(--border)'}`, borderRadius:10, padding:'12px 16px', opacity: rule.enabled ? 1 : 0.45, transition:'all 0.3s', boxShadow: isHighlight ? '0 0 0 2px rgba(88,166,255,0.12)' : undefined }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    {/* Toggle */}
                    <div onClick={() => toggleEnabled(rule.id)} style={{ width:32, height:18, borderRadius:9, background: rule.enabled ? '#3FB950' : '#30363D', cursor:'pointer', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
                      <div style={{ position:'absolute', top:2, left: rule.enabled ? 16 : 2, width:14, height:14, borderRadius:'50%', background:'white', transition:'left 0.2s' }} />
                    </div>
                    <span style={{ fontSize:10, fontFamily:'JetBrains Mono, monospace', color: isHighlight ? '#58A6FF' : 'var(--text-secondary)', flexShrink:0, minWidth:70 }}>{rule.id}</span>
                    <span style={{ fontSize:9, background:`${catColor}15`, color:catColor, border:`1px solid ${catColor}30`, borderRadius:4, padding:'1px 6px', flexShrink:0 }}>{rule.category}</span>
                    <span style={{ fontSize:12, color:'var(--text-primary)', flex:1 }}>{rule.label}</span>
                    <span style={{ fontSize:10, color:'var(--text-muted)', flexShrink:0, fontFamily:'monospace' }}>{rule.firingRate}%</span>
                    {/* Delta */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => updateDelta(rule.id, rule.delta-5)} style={{ width:22, height:22, borderRadius:4, background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-primary)', cursor:'pointer', fontSize:12 }}>-</button>
                          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:14, fontWeight:700, color:'#58A6FF', minWidth:28, textAlign:'center' }}>{rule.delta}</span>
                          <button onClick={() => updateDelta(rule.id, rule.delta+5)} style={{ width:22, height:22, borderRadius:4, background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-primary)', cursor:'pointer', fontSize:12 }}>+</button>
                        </>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          {changed && <span style={{ fontSize:9, color:'var(--text-muted)', textDecoration:'line-through', fontFamily:'monospace' }}>{rule.originalDelta}</span>}
                          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:13, fontWeight:700, color: changed ? (deployed ? '#3FB950' : '#58A6FF') : 'var(--text-secondary)', minWidth:24, textAlign:'right' }}>{rule.delta}</span>
                          <span style={{ fontSize:10, color:'var(--text-muted)' }}>pts</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div style={{ marginTop:10, paddingLeft:44 }}>
                      <input type="range" min={5} max={100} step={5} value={rule.delta} onChange={e => updateDelta(rule.id, Number(e.target.value))} style={{ width:'100%', accentColor:'#58A6FF' }} />
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--text-muted)', marginTop:2 }}>
                        <span>5</span>
                        <span style={{ color:'#58A6FF', fontWeight:600 }}>Current: {rule.delta} pts (+{rule.delta - rule.originalDelta} from {rule.originalDelta})</span>
                        <span>100</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
