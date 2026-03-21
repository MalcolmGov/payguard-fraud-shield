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
    <div className="demo-page">
      {/* Header */}
      <div className="demo-header">
        <div className="demo-header-left">
          <button className="btn btn-ghost demo-home-btn" onClick={() => navigate('/')}>← Home</button>
          <span className="demo-header-title">🛡️ PayGuard — Interactive Demos</span>
        </div>
        <span className="demo-header-subtitle">7 attack scenarios · stakeholder review</span>
      </div>

      {/* Content */}
      <div className="demo-content">
        <h1 className="demo-main-heading">Choose a Demo Scenario</h1>
        <p className="demo-main-desc">
          Seven interactive walkthroughs covering every fraud vector PayGuard protects against — from vishing and SIM swap to USSD push device authorisation.
        </p>

        {/* Demo Grid */}
        <div className="demo-grid">
          {DEMOS.map(demo => (
            <div key={demo.route} className="demo-card" onClick={() => navigate(demo.route)}
              style={{ background:`${demo.color}06`, borderColor:`${demo.color}25` }}>
              <div>
                <div className="demo-card-tag" style={{ color: demo.color }}>{demo.tag}</div>
                <div className="demo-card-emoji">{demo.emoji}</div>
                <h2 className="demo-card-title">{demo.title}</h2>
                <div className="demo-card-subtitle">{demo.subtitle}</div>
              </div>
              <p className="demo-card-desc">{demo.description}</p>
              <div className="demo-card-tags">
                <span className="demo-tag-pill">{demo.persona}</span>
                <span className="demo-tag-pill">{demo.steps} steps</span>
                {demo.rules.map(r=>(
                  <span key={r} className="demo-tag-rule" style={{ background:`${demo.color}15`, borderColor:`${demo.color}30`, color:demo.color }}>{r}</span>
                ))}
              </div>
              <div className="demo-card-footer">
                <span className="demo-card-outcome">✅ {demo.outcome}</span>
                <button className="demo-launch-btn" style={{ background: demo.color }}
                  onClick={e=>{e.stopPropagation();navigate(demo.route);}}>▶ Launch</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
