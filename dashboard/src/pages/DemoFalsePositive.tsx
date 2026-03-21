import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface FPStep {
  id: number; title: string; subtitle: string; narration: string;
  screen: 'home'|'contacts'|'recipient'|'amount'|'scanning'|'success';
  riskScore: number; signalsFired: string[];
}

const STEPS: FPStep[] = [
  { id:0, title:'Thabo Opens mobile wallet', subtitle:'Recognised device. Familiar location. No call active.', screen:'home', riskScore:0, signalsFired:[],
    narration:'Thabo Mokoena opens mobile wallet to pay his monthly rent. The PayGuard SDK initialises ? device fingerprint matches stored baseline, location normal, no active calls.' },
  { id:1, title:'Navigates to Send Money', subtitle:'No active call ? primary social engineering signal absent.', screen:'contacts', riskScore:0, signalsFired:[],
    narration:'Thabo taps Send Money. RULE_002 monitoring begins: is there an active call? No. The highest-weight rule cannot fire. Risk stays at 0.' },
  { id:2, title:'Types His Landlord\'s Name', subtitle:'Recipient in contacts ? no paste event detected.', screen:'recipient', riskScore:0, signalsFired:[],
    narration:'Thabo types "Uncle Sipho" ? his landlord, already in contacts. No clipboard paste detected (RULE_004: 0). Contact is known (RULE_002: 0). Score still 0.' },
  { id:3, title:'Enters R6,000 ? Above Average', subtitle:'But: no call, known contact ? RULE_001 cannot fire.', screen:'amount', riskScore:3, signalsFired:['RULE_005 evaluated ? known contact exemption applies'],
    narration:'R6,000 is above Thabo\'s R1,200 average. RULE_005 evaluates: amount > 2? average ? but the recipient IS in contacts, so the rule applies a known-contact exemption. Only a residual 3 pts.' },
  { id:4, title:'PayGuard Evaluating?', subtitle:'0 high-confidence rules fired. Score: 3/100.', screen:'scanning', riskScore:3, signalsFired:[],
    narration:'The full rule set is evaluated in 29ms. No social engineering indicators. Device known. No SIM swap. No VPN. No paste. No rush. Score: 3/100 ? decisively ALLOW.' },
  { id:5, title:'? Transaction Approved ? Zero Friction', subtitle:'R6,000 sent. Thabo experienced nothing. Rent paid.', screen:'success', riskScore:3, signalsFired:[],
    narration:'The transaction completes instantly. Thabo saw no warning, no delay, no friction. PayGuard protected him without touching his experience. This is the promise: genuine customers feel nothing.' },
];

const CLEAN_RULES = [
  { id:'RULE_001', label:'Call + new recipient + high amt', fired:false, reason:'No active call' },
  { id:'RULE_002', label:'Call + recipient not in contacts', fired:false, reason:'No active call' },
  { id:'RULE_003', label:'Transaction < 10s of session', fired:false, reason:'Normal pace (18s)' },
  { id:'RULE_004', label:'Paste on recipient field', fired:false, reason:'Typed manually' },
  { id:'RULE_005', label:'New recipient + high amount', fired:false, reason:'Recipient in contacts' },
  { id:'RULE_006', label:'SIM swap last 48h', fired:false, reason:'No SIM change' },
  { id:'RULE_007', label:'Device on > 3 accounts', fired:false, reason:'Single account device' },
  { id:'RULE_014', label:'OTP screen on unknown call', fired:false, reason:'No call active' },
];

function HomeScreen() {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#FFCC00' }}>
      <div style={{ padding:'16px 14px 10px' }}>
        <div style={{ fontSize:10, color:'#666', fontWeight:600 }}>mobile wallet</div>
        <div style={{ fontSize:13, fontWeight:700, color:'#1A1A1A' }}>Good morning, Thabo ??</div>
        <div style={{ marginTop:4, background:'#fff3', borderRadius:8, padding:'6px 10px' }}>
          <div style={{ fontSize:10, color:'#555' }}>Balance</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#1A1A1A' }}>R 8,400.00</div>
        </div>
      </div>
      <div style={{ flex:1, background:'#fff', borderRadius:'12px 12px 0 0', padding:14 }}>
        <div style={{ fontSize:9, color:'#3FB950', fontWeight:600, marginBottom:8, padding:'4px 8px', background:'rgba(63,185,80,0.08)', borderRadius:6 }}>?? PayGuard: Device recognised ? Baseline normal</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {[['??','Send'],['??','Receive'],['??','Airtime'],['??','Bills'],['??','Bank'],['?','More']].map(([i,l])=>(
            <div key={l} style={{ background:'#F5F5F5', borderRadius:8, padding:'10px 6px', textAlign:'center' }}>
              <div style={{ fontSize:18 }}>{i}</div><div style={{ fontSize:9, color:'#444', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactsScreen() {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#fff' }}>
      <div style={{ background:'#FFCC00', padding:'10px 14px' }}><div style={{ fontSize:12, fontWeight:700, color:'#1A1A1A' }}>? Send Money</div></div>
      <div style={{ padding:14 }}>
        <div style={{ fontSize:9, color:'#3FB950', fontWeight:600, marginBottom:8, padding:'4px 8px', background:'rgba(63,185,80,0.08)', borderRadius:6 }}>? No active call detected ? primary fraud signal absent</div>
        <div style={{ fontSize:10, color:'#333', marginBottom:4 }}>Recipient</div>
        <div style={{ border:'2px solid #FFCC00', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#333', display:'flex', alignItems:'center', gap:6 }}>
          <span>??</span> Uncle Sipho<span style={{ color:'#aaa' }}>|</span>
        </div>
        <div style={{ marginTop:10, background:'#f5f5f5', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'#333', marginBottom:6 }}>CONTACTS</div>
          {[['Uncle Sipho','Landlord'],['Nomsa K.','Sister'],['Thandi M.','Friend']].map(([n,t])=>(
            <div key={n} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid #eee' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'#FFCC00', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>??</div>
              <div><div style={{ fontSize:11, fontWeight:600, color:'#333' }}>{n}</div><div style={{ fontSize:9, color:'#888' }}>{t}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecipientScreen() {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#fff' }}>
      <div style={{ background:'#FFCC00', padding:'10px 14px' }}><div style={{ fontSize:12, fontWeight:700, color:'#1A1A1A' }}>? Send Money</div></div>
      <div style={{ padding:14 }}>
        <div style={{ fontSize:10, color:'#333', marginBottom:4 }}>Recipient</div>
        <div style={{ border:'2px solid #3FB950', borderRadius:8, padding:'8px 10px', fontSize:11, color:'#333', display:'flex', alignItems:'center', gap:6, background:'#f0fff4' }}>
          <span style={{ fontSize:16 }}>?</span>
          <div><div style={{ fontSize:12, fontWeight:600 }}>Uncle Sipho</div><div style={{ fontSize:9, color:'#3FB950', fontWeight:600 }}>In contacts ? Known recipient</div></div>
        </div>
        <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(63,185,80,0.08)', border:'1px solid rgba(63,185,80,0.2)', borderRadius:6 }}>
          <div style={{ fontSize:9, color:'#3FB950', fontWeight:600 }}>?? PayGuard: RULE_004 ? No paste event</div>
          <div style={{ fontSize:9, color:'#3FB950' }}>RULE_002 ? Recipient in contacts. No signal.</div>
        </div>
        <div style={{ fontSize:10, color:'#333', marginTop:12, marginBottom:4 }}>Amount (ZAR)</div>
        <div style={{ border:'1px solid #ddd', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#ccc' }}>R 0.00</div>
      </div>
    </div>
  );
}

function AmountScreen() {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#fff' }}>
      <div style={{ background:'#FFCC00', padding:'10px 14px' }}><div style={{ fontSize:12, fontWeight:700, color:'#1A1A1A' }}>? Send Money</div></div>
      <div style={{ padding:14 }}>
        <div style={{ fontSize:10, color:'#333', marginBottom:4 }}>Recipient</div>
        <div style={{ fontSize:12, fontWeight:600, color:'#333', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}><span>?</span> Uncle Sipho (In contacts)</div>
        <div style={{ fontSize:10, color:'#333', marginBottom:4 }}>Amount</div>
        <div style={{ border:'2px solid #3FB950', borderRadius:8, padding:'10px', fontSize:18, fontWeight:700, color:'#1A1A1A', background:'#f0fff4' }}>R 6,000.00</div>
        <div style={{ fontSize:9, color:'#888', marginTop:4 }}>Your average: R1,200 ? Above average, but recipient is a known contact</div>
        <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(63,185,80,0.08)', border:'1px solid rgba(63,185,80,0.2)', borderRadius:6, fontSize:9 }}>
          <div style={{ color:'#3FB950', fontWeight:600, marginBottom:2 }}>?? RULE_005 evaluated:</div>
          <div style={{ color:'#555' }}>Amount above 2? avg ? but recipient IS in contacts. Known-contact exemption applied. +3 pts residual only.</div>
        </div>
      </div>
    </div>
  );
}

function ScanningFP() {
  const [dots, setDots] = useState('');
  useEffect(() => { const t = setInterval(() => setDots(d => d.length>=3?'':d+'.'), 400); return ()=>clearInterval(t); }, []);
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0D1117', gap:14, padding:20 }}>
      <div style={{ fontSize:36, animation:'spin 1s linear infinite' }}>???</div>
      <div style={{ fontSize:13, fontWeight:700, color:'#3FB950' }}>Evaluating{dots}</div>
      <div style={{ fontSize:10, color:'#8B949E', textAlign:'center', lineHeight:1.8 }}>
        8 rules checked<br />0 high-confidence signals<br />29ms decision time
      </div>
      <div style={{ width:'100%', background:'#30363D', borderRadius:999, height:6, overflow:'hidden' }}>
        <div style={{ height:'100%', background:'#3FB950', borderRadius:999, animation:'scanProgress 1.2s ease-in-out' }} />
      </div>
      <div style={{ fontFamily:'monospace', fontSize:10, color:'#3FB950' }}>Score: 3/100 ? ALLOW</div>
    </div>
  );
}

function SuccessScreen() {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0D1117', gap:12, padding:20 }}>
      <div style={{ fontSize:48 }}>?</div>
      <div style={{ fontSize:15, fontWeight:800, color:'#3FB950', textAlign:'center' }}>R6,000 Sent</div>
      <div style={{ fontSize:11, color:'#8B949E', textAlign:'center', lineHeight:1.8 }}>Uncle Sipho<br />Rent paid<br />Zero friction</div>
      <div style={{ width:'100%', background:'rgba(63,185,80,0.1)', border:'1px solid rgba(63,185,80,0.3)', borderRadius:8, padding:'10px 12px', marginTop:4 }}>
        <div style={{ fontSize:9, color:'#3FB950', fontWeight:600, marginBottom:4 }}>?? PayGuard Result</div>
        <div style={{ fontSize:9, color:'#8B949E', lineHeight:1.7 }}>Risk score: 3/100<br />Decision: ALLOW<br />Thabo experienced: nothing<br />Fraud prevented: ?</div>
      </div>
    </div>
  );
}

function PhoneScreen({ screen }: { screen: FPStep['screen'] }) {
  switch(screen) {
    case 'home':     return <HomeScreen />;
    case 'contacts': return <ContactsScreen />;
    case 'recipient':return <RecipientScreen />;
    case 'amount':   return <AmountScreen />;
    case 'scanning': return <ScanningFP />;
    case 'success':  return <SuccessScreen />;
  }
}

export default function DemoFalsePositive() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const step = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;

  const advance = useCallback(() => {
    if (stepIdx >= STEPS.length - 1) return;
    setStepIdx(s => s + 1);
  }, [stepIdx]);

  const reset = () => { setStepIdx(0); setAutoPlay(false); };

  useEffect(() => {
    if (!autoPlay || isLast) { if (isLast) setAutoPlay(false); return; }
    const t = setTimeout(advance, 2200);
    return () => clearTimeout(t);
  }, [autoPlay, stepIdx, isLast, advance]);

  const score = step.riskScore;
  const scoreColor = score <= 10 ? '#3FB950' : score <= 45 ? '#D29922' : '#F85149';

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0 24px', height:56, borderBottom:'1px solid var(--border)', background:'var(--bg-secondary)', flexShrink:0 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/demo')} style={{ fontSize:12 }}>? All Demos</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>? Demo 6 of 6 ? False Positive Proof</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>Genuine Customer ? Zero Friction ? Score: 3/100 ? ALLOW</div>
        </div>
        {isLast && <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ fontSize:12 }}>Open Analyst Dashboard ?</button>}
      </div>

      {/* Step bar */}
      <div style={{ display:'flex', padding:'0 24px', background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {STEPS.map((s, i) => {
          const isActive = i === stepIdx, isDone = i < stepIdx;
          return (
            <button key={s.id} onClick={() => { setStepIdx(i); }}
              style={{ padding:'10px 14px', border:'none', cursor:'pointer', whiteSpace:'nowrap', background:'transparent', borderBottom: isActive ? '2px solid #3FB950' : isDone ? '2px solid #3FB950' : '2px solid transparent', color: isActive ? '#3FB950' : isDone ? '#3FB950' : 'var(--text-muted)', fontSize:11, fontWeight: isActive ? 700 : 400, fontFamily:'Inter, sans-serif', transition:'all 0.2s' }}>
              {isDone ? '?' : `${i+1}.`} {s.title.split(' ').slice(0,3).join(' ')}
            </button>
          );
        })}
      </div>

      <div className="demo-flow-grid" style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 320px 1fr', gap:20, padding:24, overflow:'hidden' }}>

        {/* Left */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#3FB950', letterSpacing:'0.08em', marginBottom:6 }}>STEP {stepIdx+1} OF {STEPS.length}</div>
            <h2 style={{ fontSize:20, marginBottom:6, color:'var(--text-primary)', lineHeight:1.2 }}>{step.title}</h2>
            <div style={{ fontSize:13, color:'#3FB950', fontWeight:500, marginBottom:12 }}>{step.subtitle}</div>
            <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.8 }}>{step.narration}</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-ghost" onClick={() => setStepIdx(s=>Math.max(0,s-1))} disabled={isFirst} style={{ flex:1 }}>? Back</button>
            <button className="btn btn-primary" onClick={advance} disabled={isLast} style={{ flex:2, fontWeight:700, background:'#3FB950', color:'#0D1117' }}>
              {isLast ? '? Demo Complete' : 'Next Step ?'}
            </button>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className={`btn ${autoPlay ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setAutoPlay(a=>!a)} style={{ flex:1, fontSize:12 }}>
              {autoPlay ? '? Pause' : '? Auto-Play'}
            </button>
            <button className="btn btn-ghost" onClick={reset} style={{ flex:1, fontSize:12 }}>? Reset</button>
          </div>

          {/* Key message card */}
          <div style={{ background:'rgba(63,185,80,0.06)', border:'1px solid rgba(63,185,80,0.2)', borderRadius:12, padding:18 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#3FB950', marginBottom:8 }}>?? Why This Matters</div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.9 }}>
              False positives destroy customer trust. A fraud solution that blocks legitimate transactions is not acceptable.<br /><br />
              <strong style={{ color:'var(--text-primary)' }}>PayGuard is precision-tuned</strong> ? it only fires when multiple high-confidence signals combine. A single large amount with a known contact and no call = pass.
            </div>
          </div>
        </div>

        {/* Centre: Phone */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:260, height:520, background:'#1A1A1A', borderRadius:34, padding:10, boxShadow:'0 0 50px rgba(0,0,0,0.8), 0 0 30px rgba(63,185,80,0.1), inset 0 0 0 1px rgba(255,255,255,0.06)', flexShrink:0 }}>
            <div style={{ width:64, height:16, background:'#111', borderRadius:'0 0 10px 10px', margin:'0 auto 6px', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background:'#333' }} />
              <div style={{ width:28, height:4, borderRadius:2, background:'#222' }} />
            </div>
            <div style={{ borderRadius:22, overflow:'hidden', height:440 }}>
              <PhoneScreen screen={step.screen} />
            </div>
            <div style={{ width:56, height:3, background:'#333', borderRadius:2, margin:'6px auto 0' }} />
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Risk meter ? green */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', marginBottom:14 }}>REAL-TIME RISK SCORE</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:8, marginBottom:10 }}>
              <div style={{ fontSize:52, fontWeight:800, color:scoreColor, lineHeight:1, fontFamily:'JetBrains Mono, monospace', transition:'color 0.5s' }}>{score}</div>
              <div style={{ fontSize:13, color:'var(--text-muted)', paddingBottom:4 }}>/100</div>
              <div style={{ marginLeft:'auto' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#3FB950', background:'rgba(63,185,80,0.15)', border:'1px solid rgba(63,185,80,0.3)', borderRadius:99, padding:'3px 10px' }}>LOW</span>
              </div>
            </div>
            <div style={{ background:'var(--border)', borderRadius:999, height:8, overflow:'hidden', marginBottom:10 }}>
              <div style={{ height:'100%', borderRadius:999, width:`${score}%`, background:'#3FB950', transition:'width 1s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:'0 0 8px rgba(63,185,80,0.5)' }} />
            </div>
            <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(63,185,80,0.1)', border:'1px solid rgba(63,185,80,0.3)', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>?</span>
              <div><div style={{ fontSize:10, color:'var(--text-muted)' }}>Decision</div><div style={{ fontSize:14, fontWeight:700, color:'#3FB950' }}>ALLOW</div></div>
            </div>
          </div>

          {/* Rules ? all not fired */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:20, flex:1 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', marginBottom:12 }}>RULE EVALUATION ? CLEAN SESSION</div>
            {CLEAN_RULES.map(r => (
              <div key={r.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                <span style={{ fontSize:9, color:'#3FB950' }}>?</span>
                <span style={{ fontSize:10, fontFamily:'JetBrains Mono, monospace', color:'var(--text-muted)', flex:'0 0 72px' }}>{r.id}</span>
                <span style={{ fontSize:10, color:'var(--text-muted)', flex:1 }}>{r.label}</span>
                <span style={{ fontSize:9, color:'#3FB950', background:'rgba(63,185,80,0.1)', borderRadius:4, padding:'1px 5px', flexShrink:0, whiteSpace:'nowrap' }}>{r.reason}</span>
              </div>
            ))}
            <div style={{ marginTop:12, padding:'8px 12px', background:'rgba(63,185,80,0.06)', borderRadius:8, fontSize:11, color:'#3FB950', fontWeight:600, textAlign:'center' }}>
              0 signals fired ? 8 rules passed cleanly
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes scanProgress { from { width:0%; } to { width:100%; } }
      `}</style>
    </div>
  );
}
