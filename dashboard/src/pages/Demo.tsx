import { useNavigate } from 'react-router-dom';

const DEMOS = [
  { route:'/demo/transaction',  emoji:'💸', tag:'Demo 1', title:'Transaction Fraud',        subtitle:'Vishing · Mule Transfer',           color:'#58A6FF', persona:'👨🏾 Sipho',    steps:8, rules:['RULE_001','RULE_002','RULE_004'], description:'Scammer calls Sipho, convinces him to send a "processing fee." SDK fires on call+paste+high amount → BLOCK.', outcome:'R2,500 transfer blocked' },
  { route:'/demo/takeover',     emoji:'🔑', tag:'Demo 2', title:'Account Takeover (OTP)',   subtitle:'Smishing · OTP Phishing',           color:'#F85149', persona:'👩🏾 Lerato',   steps:8, rules:['RULE_008','RULE_014'],            description:'Fake mobile carrier SMS → Lerato calls scammer → OTP arrives → OtpGuard fires full-screen red overlay before she can read it.', outcome:'Account takeover prevented' },
  { route:'/demo/simswap',      emoji:'📡', tag:'Demo 3', title:'SIM Swap Attack',          subtitle:'SIM Port · New Device Freeze',      color:'#D29922', persona:'👩🏾 Nomvula',  steps:8, rules:['RULE_006','RULE_011'],            description:'Attacker ports Nomvula\'s SIM. New device attempts R8,000 transfer. RULE_006 fires — account frozen instantly.', outcome:'R12,000 balance secured' },
  { route:'/demo/fraudring',    emoji:'🕸️', tag:'Demo 4', title:'Fraud Ring Investigation', subtitle:'Graph Engine · Bulk Block',         color:'#BC8CFF', persona:'🔍 Analyst',   steps:6, rules:['Graph Engine'],                   description:'One flagged tx → device with 12 accounts → 2 mule wallets → 1 IP. Four clicks to bulk-block all 14 entities.', outcome:'14 entities blocked' },
  { route:'/demo/ruletuning',   emoji:'⚙️',  tag:'Demo 5', title:'Live Rule Tuning',         subtitle:'Zero Code · Real-Time Deploy',      color:'#3FB950', persona:'🏢 Ops Team',   steps:5, rules:['Rules Engine'],                  description:'New scam wave detected. Analyst adjusts RULE_003 delta 30→55 with a slider. 14 missed transactions now blocked. No code, no ticket, instant.', outcome:'14 new detections unlocked' },
  { route:'/demo/falsepositive',emoji:'✅', tag:'Demo 6', title:'False Positive Proof',    subtitle:'Genuine Customer · Zero Friction',  color:'#39D3BB', persona:'👨🏾 Thabo',    steps:6, rules:['Score: 3/100'],                   description:'Thabo pays rent (R6,000) to his known landlord. No call, no paste, contact recognised. All 8 rules pass clean. ALLOW — Thabo notices nothing.', outcome:'Transaction approved instantly' },
  { route:'/ussd-demo',         emoji:'📲', tag:'Demo 7', title:'USSD Push Auth',           subtitle:'Device Trust · No Internet Needed', color:'#0EA5E9', persona:'👨🏾 End User',  steps:5, rules:['Device Binding','USSD Push'],      description:'Subscriber gets a USSD push on any handset. Press 1 to allow their new device, 2 to deny and block an attacker — no internet or smartphone required.', outcome:'Device authorised via USSD' },
];

export default function Demo() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:56, borderBottom:'1px solid var(--border)', background:'var(--bg-secondary)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ fontSize:12 }}>← Home</button>
          <span style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>🛡️ PayGuard — Interactive Demos</span>
        </div>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>7 attack scenarios · stakeholder review</span>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'48px 28px' }}>
        <h1 style={{ fontSize:34, textAlign:'center', marginBottom:6 }}>Choose a Demo Scenario</h1>
        <p style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:46, maxWidth:540, margin:'0 auto 48px' }}>
          Seven interactive walkthroughs covering every fraud vector PayGuard protects against — from vishing and SIM swap to USSD push device authorisation.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:18 }}>
          {DEMOS.map(demo => (
            <div key={demo.route} onClick={() => navigate(demo.route)}
              style={{ background:`${demo.color}06`, border:`1px solid ${demo.color}25`, borderRadius:14, padding:22, cursor:'pointer', transition:'transform 0.18s, box-shadow 0.18s', display:'flex', flexDirection:'column', gap:12 }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLDivElement).style.boxShadow=`0 8px 32px ${demo.color}20`;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.boxShadow='';}}>
              <div>
                <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', color:demo.color, marginBottom:6 }}>{demo.tag}</div>
                <div style={{ fontSize:32, marginBottom:5 }}>{demo.emoji}</div>
                <h2 style={{ fontSize:16, color:'var(--text-primary)', marginBottom:2, lineHeight:1.2 }}>{demo.title}</h2>
                <div style={{ fontSize:10, color:'var(--text-secondary)' }}>{demo.subtitle}</div>
              </div>
              <p style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.8 }}>{demo.description}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                <span style={{ fontSize:9, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:4, padding:'2px 6px', color:'var(--text-muted)' }}>{demo.persona}</span>
                <span style={{ fontSize:9, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:4, padding:'2px 6px', color:'var(--text-muted)' }}>{demo.steps} steps</span>
                {demo.rules.map(r=>(
                  <span key={r} style={{ fontSize:9, background:`${demo.color}15`, border:`1px solid ${demo.color}30`, borderRadius:4, padding:'2px 6px', color:demo.color, fontFamily:'JetBrains Mono, monospace' }}>{r}</span>
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                <span style={{ fontSize:11, fontWeight:600, color:'#3FB950' }}>✅ {demo.outcome}</span>
                <button className="btn" style={{ background:demo.color, color:'#0D1117', fontWeight:700, fontSize:11, padding:'6px 14px', borderRadius:7 }}
                  onClick={e=>{e.stopPropagation();navigate(demo.route);}}>▶ Launch</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
