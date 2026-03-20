import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletHome } from '../components/WalletPhoneUI';

interface Signal {
  id: string; rule: string; label: string; delta: number;
  severity: 'low' | 'medium' | 'high'; icon: string; timestamp: string;
}

interface SimStep {
  id: number; title: string; subtitle: string; narration: string;
  leftScreen: 'victim_home' | 'victim_signal_drop' | 'victim_no_service' | 'victim_alert';
  rightScreen: 'attacker_idle' | 'attacker_store' | 'attacker_new_device' | 'attacker_send' | 'attacker_blocked';
  showAttacker: boolean;
  signalsToFire: Signal[];
  riskScoreTarget: number;
}

const STEPS: SimStep[] = [
  {
    id: 0, title: 'Victim: Normal mobile wallet Session',
    subtitle: 'Nomvula\'s phone. SDK baseline established.',
    leftScreen: 'victim_home', rightScreen: 'attacker_idle', showAttacker: false,
    signalsToFire: [], riskScoreTarget: 0,
    narration: 'Nomvula Dube is using her mobile wallet normally. Full signal, recognised device, normal location. The PayGuard SDK has a clean baseline for her behaviour.',
  },
  {
    id: 1, title: 'Attacker at Network Store',
    subtitle: 'Fraudster presents fake ID to port Nomvula\'s number.',
    leftScreen: 'victim_home', rightScreen: 'attacker_store', showAttacker: true,
    signalsToFire: [], riskScoreTarget: 0,
    narration: 'At a mobile wallet agent outlet, the attacker presents a fraudulent ID. They request a SIM swap on Nomvula\'s number ? +27 82 100 0055 ? to a new SIM card they hold.',
  },
  {
    id: 2, title: 'Nomvula\'s SIM Is Being Ported',
    subtitle: 'Signal drops as the old SIM is deactivated by the network.',
    leftScreen: 'victim_signal_drop', rightScreen: 'attacker_store', showAttacker: true,
    signalsToFire: [
      { id: 's1', rule: 'RULE_006', label: 'SIM swap event detected on account', delta: 50, severity: 'high', icon: '??', timestamp: '' },
    ],
    riskScoreTarget: 50,
    narration: 'Network processes the SIM swap. Nomvula\'s signal begins to drop. The PayGuard backend detects the SIM change event via the network carrier signal ? RULE_006 fires immediately: +50 pts.',
  },
  {
    id: 3, title: 'No Service ? SIM Deactivated',
    subtitle: 'Nomvula\'s phone is now unreachable. Attacker\'s SIM is live.',
    leftScreen: 'victim_no_service', rightScreen: 'attacker_new_device', showAttacker: true,
    signalsToFire: [
      { id: 's2', rule: 'RULE_011', label: 'New device fingerprint ? never seen before', delta: 40, severity: 'high', icon: '??', timestamp: '' },
    ],
    riskScoreTarget: 75,
    narration: 'Old SIM is dead. Attacker inserts the new SIM into their device and opens mobile wallet. The SDK sees: completely new device fingerprint ? never associated with this account before. RULE_011 fires: +40 pts.',
  },
  {
    id: 4, title: 'Attacker Opens Send Money',
    subtitle: 'Immediately targets Nomvula\'s R12,000 balance.',
    leftScreen: 'victim_no_service', rightScreen: 'attacker_send', showAttacker: true,
    signalsToFire: [
      { id: 's3', rule: 'RULE_003', label: 'Transaction < 10s after new session on new device', delta: 30, severity: 'high', icon: '?', timestamp: '' },
      { id: 's4', rule: 'RULE_005', label: 'R8,000 ? first transaction on new device', delta: 35, severity: 'high', icon: '??', timestamp: '' },
    ],
    riskScoreTarget: 97,
    narration: 'The attacker immediately navigates to Send Money and enters R8,000 to a mule wallet. The SDK fires two more rules: rushed transaction (< 10 seconds) and a first-ever high-amount transfer. Score: 97.',
  },
  {
    id: 5, title: 'PayGuard Analysing?',
    subtitle: 'Risk engine evaluating 4 fired rules in 38ms.',
    leftScreen: 'victim_no_service', rightScreen: 'attacker_send', showAttacker: true,
    signalsToFire: [], riskScoreTarget: 97,
    narration: 'The payload arrives at the risk engine: RULE_006 + RULE_011 + RULE_003 + RULE_005. Total score: 97. Decision: BLOCK. Account frozen pending manual review.',
  },
  {
    id: 6, title: '?? Transfer Blocked ? Account Frozen',
    subtitle: 'Attacker sees: "Your account has been suspended."',
    leftScreen: 'victim_no_service', rightScreen: 'attacker_blocked', showAttacker: true,
    signalsToFire: [], riskScoreTarget: 97,
    narration: 'The attacker\'s transfer attempt fails. mobile wallet surfaces a suspension notice. The account is frozen ? no further transactions possible until identity is re-verified by Nomvula in person.',
  },
  {
    id: 7, title: '?? Nomvula Gets an Alert (New SIM)',
    subtitle: 'Automated notification as soon as she gets any connectivity.',
    leftScreen: 'victim_alert', rightScreen: 'attacker_blocked', showAttacker: true,
    signalsToFire: [], riskScoreTarget: 97,
    narration: 'When Nomvula\'s phone reconnects (via WiFi or backup SIM), the mobile wallet app sends a push alert: "A SIM swap was detected on your account. Your account has been frozen. Please visit an Network store to verify your identity."',
  },
];

// -- Phone Screens -------------------------------------------------------------

function SignalBars({ level }: { level: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
      {[4, 8, 12, 16].map((h, i) => (
        <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: i < level ? '#333' : '#ddd' }} />
      ))}
    </div>
  );
}

function VictimHome({ callActive = false }: { callActive?: boolean }) {
  return (
    <WalletHome
      name="Nomvula"
      balance="R 12,000.00"
      callActive={callActive}
      sdkBadge="Device baseline clean"
    />
  );
}

function VictimSignalDrop() {
  const [bars, setBars] = useState<0|1|2|3|4>(4);
  useEffect(() => {
    const t = setTimeout(() => setBars(2), 600);
    const t2 = setTimeout(() => setBars(1), 1400);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#FFCC00' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#FFD700' }}>
        <span style={{ fontSize: 9, color: '#333', fontWeight: 600 }}>Network</span>
        <SignalBars level={bars} />
      </div>
      <div style={{ padding: '12px 16px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>Good morning, Nomvula ??</div>
        <div style={{ marginTop: 4, background: '#fff3', borderRadius: 8, padding: '6px 10px' }}>
          <div style={{ fontSize: 10, color: '#555' }}>Balance</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>R 12,000.00</div>
        </div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: '12px 12px 0 0', padding: 14 }}>
        <div style={{ padding: '8px 10px', background: '#FFF3E0', borderRadius: 8, border: '1px solid #FFB94C', marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#E65100', fontWeight: 600 }}>? Weak Signal</div>
          <div style={{ fontSize: 9, color: '#666' }}>Checking network?</div>
        </div>
        <div style={{ padding: '8px 10px', background: '#FFEBEE', borderRadius: 8, border: '1px solid #FFCDD2' }}>
          <div style={{ fontSize: 9, color: '#C62828', fontWeight: 600 }}>?? PayGuard: SIM swap detected on this account ? Score +50</div>
        </div>
      </div>
    </div>
  );
}

function VictimNoService() {
  return (
    <div style={{ height: '100%', background: '#1A1A1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'absolute', top: 8, padding: '0 10px' }}>
        <span style={{ fontSize: 9, color: '#666', fontWeight: 600 }}>Network</span>
        <SignalBars level={0} />
      </div>
      <div style={{ fontSize: 36 }}>??</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>No SIM</div>
      <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>Emergency calls only</div>
      <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 8, width: '100%' }}>
        <div style={{ fontSize: 9, color: '#F85149', fontWeight: 600, lineHeight: 1.8 }}>
          SIM deactivated<br />Account frozen by PayGuard<br />R12,000 secured
        </div>
      </div>
    </div>
  );
}

function VictimAlert() {
  return (
    <div style={{ height: '100%', background: '#0D1117', display: 'flex', flexDirection: 'column', padding: 12, gap: 10 }}>
      <div style={{ fontSize: 10, color: '#8B949E', textAlign: 'center', marginTop: 8 }}>Push Notification</div>
      <div style={{ background: '#1C2333', border: '2px solid #F85149', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>???</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F85149' }}>mobile wallet Security Alert</div>
            <div style={{ fontSize: 9, color: '#8B949E' }}>Just now</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#C9D1D9', lineHeight: 1.8 }}>
          A SIM swap was detected on your account <strong>+27 82 100 0055</strong>.<br /><br />
          Your account has been <strong style={{ color: '#F85149' }}>temporarily frozen</strong> to protect your R12,000.<br /><br />
          No money has been taken.<br /><br />
          Visit any Network store with your ID to restore access.
        </div>
        <button style={{ width: '100%', marginTop: 10, background: '#238636', border: 'none', borderRadius: 6, padding: 8, fontSize: 10, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
          Verify My Identity ?
        </button>
      </div>
    </div>
  );
}

function AttackerIdle() {
  return (
    <div style={{ height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#444', fontSize: 11 }}>Attacker's device (offline)</div>
    </div>
  );
}

function AttackerStore() {
  return (
    <div style={{ height: '100%', background: '#F5F5F5', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1A1A2E', padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>?? Network Outlet ? SIM Swap</div>
      </div>
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #ddd' }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>SIM Swap Request</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>+27 82 100 0055</div>
          <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>Nomvula Dube</div>
        </div>
        <div style={{ background: '#FFF3E0', borderRadius: 6, padding: '8px 10px', border: '1px solid #FFB94C', fontSize: 9, color: '#E65100' }}>
          ? ID presented: FRAUDULENT (undetected at store level)
        </div>
        <div style={{ marginTop: 'auto', background: '#FFEBEE', borderRadius: 6, padding: '8px 10px', border: '1px solid #FFCDD2', fontSize: 9, color: '#C62828' }}>
          ?? PayGuard backend: SIM change event received from carrier
        </div>
      </div>
    </div>
  );
}

function AttackerNewDevice() {
  return (
    <div style={{ height: '100%', background: '#FFCC00', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#FFD700' }}>
        <span style={{ fontSize: 9, color: '#333', fontWeight: 600 }}>Network</span>
        <SignalBars level={4} />
      </div>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>mobile wallet</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>Welcome, Nomvula</div>
        <div style={{ marginTop: 4, background: '#fff3', borderRadius: 8, padding: '6px 10px' }}>
          <div style={{ fontSize: 10, color: '#555' }}>Balance</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>R 12,000.00</div>
        </div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: '12px 12px 0 0', padding: 14 }}>
        <div style={{ background: '#FFEBEE', borderRadius: 6, padding: '6px 10px', border: '1px solid #FFCDD2', fontSize: 9, color: '#C62828', marginBottom: 8 }}>
          ?? SDK: New device fingerprint ? never seen. RULE_011 fired (+40 pts)
        </div>
      </div>
    </div>
  );
}

function AttackerSend() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ background: '#FFCC00', padding: '10px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A' }}>? Send Money</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 10, color: '#333', marginBottom: 4 }}>Recipient</div>
        <div style={{ border: '2px solid #F44336', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#333', marginBottom: 10 }}>
          +27 82 999 0001 (Mule Account)
        </div>
        <div style={{ fontSize: 10, color: '#333', marginBottom: 4 }}>Amount</div>
        <div style={{ border: '2px solid #F44336', borderRadius: 8, padding: '10px', fontSize: 18, fontWeight: 700, color: '#E53935', background: '#fff8f8' }}>
          R 8,000.00
        </div>
        <div style={{ marginTop: 10, padding: '8px 10px', background: '#FFEBEE', borderRadius: 6, border: '1px solid #FFCDD2', fontSize: 9, color: '#C62828' }}>
          ?? Score: 97/100 ? RULE_006 + RULE_011 + RULE_003 + RULE_005<br />Decision: BLOCK
        </div>
        <button style={{ width: '100%', marginTop: 10, background: '#FFCC00', border: 'none', borderRadius: 8, padding: 10, fontSize: 12, fontWeight: 700, color: '#1A1A1A', cursor: 'pointer' }}>
          Confirm Transfer ?
        </button>
      </div>
    </div>
  );
}

function AttackerBlocked() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0D1117', gap: 12, padding: 20 }}>
      <div style={{ fontSize: 44 }}>??</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#F85149', textAlign: 'center' }}>Account Suspended</div>
      <div style={{ fontSize: 10, color: '#8B949E', textAlign: 'center', lineHeight: 1.8 }}>Transfer blocked<br />Identity required<br />Fraud flagged</div>
      <div style={{ width: '100%', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontSize: 9, color: '#F85149', fontWeight: 600, marginBottom: 4 }}>PayGuard Decision</div>
        <div style={{ fontSize: 9, color: '#8B949E', lineHeight: 1.6 }}>? R8,000 transfer blocked<br />? Account frozen<br />? Analyst dashboard alerted<br />? Device watchlisted</div>
      </div>
    </div>
  );
}

// -- Risk Meter & Signal Feed (shared pattern) ---------------------------------

function RiskMeter({ score }: { score: number }) {
  const color = score >= 80 ? '#F85149' : score >= 45 ? '#D29922' : '#3FB950';
  const label = score >= 80 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW';
  const action = score >= 80 ? 'BLOCK' : score >= 45 ? 'WARN_USER' : 'ALLOW';
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>REAL-TIME RISK SCORE</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 52, fontWeight: 800, color, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace', transition: 'color 0.5s' }}>{score}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingBottom: 4 }}>/100</div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}22`, border: `1px solid ${color}44`, borderRadius: 99, padding: '3px 10px' }}>{label}</span>
        </div>
      </div>
      <div style={{ background: 'var(--border)', borderRadius: 999, height: 8, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', borderRadius: 999, width: `${score}%`, background: score >= 80 ? 'linear-gradient(90deg,#D29922,#F85149)' : score >= 45 ? '#D29922' : '#3FB950', transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: `0 0 8px ${color}88` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginBottom: 10 }}>
        <span>0</span><span>45</span><span>80</span>
      </div>
      {score > 0 && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: `${color}15`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{score >= 80 ? '??' : score >= 45 ? '??' : '?'}</span>
          <div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Decision</div><div style={{ fontSize: 13, fontWeight: 700, color }}>{action}</div></div>
        </div>
      )}
    </div>
  );
}

function SignalFeed({ signals }: { signals: Signal[] }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span className="live-dot" />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>LIVE SIGNAL FEED</span>
      </div>
      {signals.length === 0
        ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>No signals ? baseline clean ?</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {signals.map(sig => {
              const c = sig.severity === 'high' ? '#F85149' : sig.severity === 'medium' ? '#D29922' : '#3FB950';
              return (
                <div key={sig.id} style={{ background: `${c}0D`, border: `1px solid ${c}33`, borderRadius: 8, padding: '10px 12px', animation: 'signalIn 0.4s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 16 }}>{sig.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{sig.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sig.rule} ? {sig.timestamp}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c }}>+{sig.delta} pts</span>
                  </div>
                </div>
              );
            })}
          </div>}
    </div>
  );
}

// -- Main ----------------------------------------------------------------------

export default function DemoSimSwap() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [animating, setAnimating] = useState(false);

  const step = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;

  const advanceStep = useCallback(() => {
    if (animating || stepIdx >= STEPS.length - 1) return;
    const next = STEPS[stepIdx + 1];
    if (next.signalsToFire.length > 0) {
      setAnimating(true);
      next.signalsToFire.forEach((sig, i) => {
        setTimeout(() => {
          const fired = { ...sig, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
          setSignals(prev => [fired, ...prev]);
          if (i === next.signalsToFire.length - 1) setAnimating(false);
        }, i * 600);
      });
    }
    setStepIdx(s => s + 1);
    setRiskScore(next.riskScoreTarget);
  }, [stepIdx, animating]);

  const retreat = () => {
    if (stepIdx <= 0) return;
    const prev = STEPS[stepIdx - 1];
    const allSigs: Signal[] = [];
    for (let i = 0; i < stepIdx - 1; i++) STEPS[i].signalsToFire.forEach(s => allSigs.unshift({ ...s, timestamp: '?' }));
    setStepIdx(s => s - 1);
    setSignals(allSigs);
    setRiskScore(prev.riskScoreTarget);
  };

  const reset = () => { setStepIdx(0); setSignals([]); setRiskScore(0); setAutoPlay(false); };

  useEffect(() => {
    if (!autoPlay) return;
    if (isLast) { setAutoPlay(false); return; }
    const t = setTimeout(() => advanceStep(), 2400);
    return () => clearTimeout(t);
  }, [autoPlay, stepIdx, isLast, advanceStep]);

  const renderLeft = () => {
    switch (step.leftScreen) {
      case 'victim_home':         return <VictimHome />;
      case 'victim_signal_drop':  return <VictimSignalDrop />;
      case 'victim_no_service':   return <VictimNoService />;
      case 'victim_alert':        return <VictimAlert />;
    }
  };

  const renderRight = () => {
    switch (step.rightScreen) {
      case 'attacker_idle':       return <AttackerIdle />;
      case 'attacker_store':      return <AttackerStore />;
      case 'attacker_new_device': return <AttackerNewDevice />;
      case 'attacker_send':       return <AttackerSend />;
      case 'attacker_blocked':    return <AttackerBlocked />;
    }
  };

  const Phone = ({ children, label, color }: { children: React.ReactNode; label: string; color: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ width: 200, height: 420, background: '#1A1A1A', borderRadius: 28, padding: 9, boxShadow: `0 0 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), 0 0 20px ${color}33` }}>
        <div style={{ width: 60, height: 14, background: '#111', borderRadius: '0 0 8px 8px', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#333' }} />
          <div style={{ width: 28, height: 4, borderRadius: 2, background: '#222' }} />
        </div>
        <div style={{ borderRadius: 18, overflow: 'hidden', height: 362 }}>{children}</div>
        <div style={{ width: 56, height: 3, background: '#333', borderRadius: 2, margin: '5px auto 0' }} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', height: 56, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/demo')} style={{ fontSize: 12 }}>? All Demos</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>?? Demo 3 of 4 ? SIM Swap Attack</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SIM Port Fraud ? New Device Takeover ? Account Freeze</div>
        </div>
        {isLast && <button className="btn btn-primary" onClick={() => navigate('/demo/fraudring')} style={{ fontSize: 12 }}>Next: Fraud Ring ?</button>}
      </div>

      {/* Step bar */}
      <div style={{ display: 'flex', padding: '0 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
        {STEPS.map((s, i) => {
          const isActive = i === stepIdx, isDone = i < stepIdx;
          return (
            <button key={s.id} onClick={() => { setStepIdx(i); setRiskScore(STEPS[i].riskScoreTarget); const sigs: Signal[] = []; for (let j = 0; j < i; j++) STEPS[j].signalsToFire.forEach(sig => sigs.unshift({ ...sig, timestamp: '?' })); setSignals(sigs); }}
              style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: 'transparent', borderBottom: isActive ? '2px solid #D29922' : isDone ? '2px solid #3FB950' : '2px solid transparent', color: isActive ? '#D29922' : isDone ? '#3FB950' : 'var(--text-muted)', fontSize: 11, fontWeight: isActive ? 700 : 400, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
              {isDone ? '?' : `${i + 1}.`} {s.title.split(' ').slice(0, 3).join(' ')}
            </button>
          );
        })}
      </div>

      {/* Main grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, padding: 24 }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#D29922', letterSpacing: '0.08em', marginBottom: 6 }}>STEP {stepIdx + 1} OF {STEPS.length}</div>
            <h2 style={{ fontSize: 20, marginBottom: 6, color: 'var(--text-primary)', lineHeight: 1.2 }}>{step.title}</h2>
            <div style={{ fontSize: 13, color: 'var(--accent-orange)', fontWeight: 500, marginBottom: 12 }}>{step.subtitle}</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{step.narration}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={retreat} disabled={isFirst} style={{ flex: 1 }}>? Back</button>
            <button className={`btn ${isLast ? 'btn-ghost' : 'btn-primary'}`} onClick={advanceStep} disabled={isLast || animating} style={{ flex: 2, fontWeight: 700 }}>
              {isLast ? '? Demo Complete' : animating ? 'Detecting?' : 'Next Step ?'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className={`btn ${autoPlay ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setAutoPlay(a => !a)} style={{ flex: 1, fontSize: 12 }}>
              {autoPlay ? '? Pause' : '? Auto-Play'}
            </button>
            <button className="btn btn-ghost" onClick={reset} style={{ flex: 1, fontSize: 12 }}>? Reset</button>
          </div>
          <RiskMeter score={riskScore} />
        </div>

        {/* Centre: dual phones */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <Phone label="???? VICTIM'S PHONE" color="#3FB950">{renderLeft()}</Phone>
          {step.showAttacker && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 2, height: 40, background: 'var(--border)' }} />
                <div style={{ fontSize: 18 }}>??</div>
                <div style={{ width: 2, height: 40, background: 'var(--border)' }} />
              </div>
              <Phone label="?? ATTACKER'S DEVICE" color="#F85149">{renderRight()}</Phone>
            </>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SignalFeed signals={signals} />
          {/* Rule breakdown */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>SIM SWAP DETECTION RULES</div>
            {[
              { id: 'RULE_006', label: 'SIM swap event ? last 48h',         delta: 50, fired: riskScore >= 50 },
              { id: 'RULE_011', label: 'New device ? never seen before',     delta: 40, fired: riskScore >= 75 },
              { id: 'RULE_003', label: 'Transaction < 10s of session start', delta: 30, fired: riskScore >= 90 },
              { id: 'RULE_005', label: 'High amount on brand-new device',    delta: 35, fired: riskScore >= 90 },
              { id: 'RULE_007', label: 'Device on multiple accounts',        delta: 60, fired: false },
              { id: 'RULE_009', label: 'Rooted/jailbroken device',           delta: 20, fired: false },
            ].map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border-subtle)', opacity: r.fired ? 1 : 0.35, transition: 'opacity 0.5s' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.fired ? '#F85149' : '#484F58', flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: r.fired ? 'var(--text-primary)' : 'var(--text-muted)', flex: 1 }}>{r.id}</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', flex: 2 }}>{r.label}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: r.fired ? '#F85149' : 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>+{r.delta}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes signalIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

