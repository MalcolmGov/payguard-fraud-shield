﻿import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// -- Types ---------------------------------------------------------------------

interface Signal {
  id: string;
  rule: string;
  label: string;
  delta: number;
  severity: 'low' | 'medium' | 'high';
  icon: string;
  timestamp: string;
}

interface ATOStep {
  id: number;
  title: string;
  subtitle: string;
  screen: 'home' | 'sms' | 'call_out' | 'wait_otp' | 'otp_arrives' | 'otp_screen' | 'guard_fires' | 'alert' | 'protected';
  callActive: boolean;
  signalsToFire: Signal[];
  riskScoreTarget: number;
  narration: string;
}

// -- ATO Demo Script -----------------------------------------------------------

const ATO_STEPS: ATOStep[] = [
  {
    id: 0,
    title: 'Lerato\'s Normal Day on mobile wallet',
    subtitle: 'No threats. SDK baseline established.',
    screen: 'home',
    callActive: false,
    signalsToFire: [],
    riskScoreTarget: 0,
    narration: 'Lerato Nkosi opens her Network mobile wallet app as usual. The PayGuard SDK has silently established her device baseline � typical session behaviour, normal location, no anomalies.',
  },
  {
    id: 1,
    title: 'Suspicious SMS Arrives',
    subtitle: 'Smishing bait � fake Network security alert.',
    screen: 'sms',
    callActive: false,
    signalsToFire: [
      { id: 'a1', rule: 'RULE_008', label: 'SMS contains fraud keywords: "security", "access", "urgent"', delta: 25, severity: 'medium', icon: '??', timestamp: '' },
    ],
    riskScoreTarget: 25,
    narration: 'Lerato receives an SMS: "Network Security: Your account was accessed from an unknown device in Cape Town. Call us immediately: 087 555 0022." The SDK scans the SMS content � RULE_008 fires on fraud keywords.',
  },
  {
    id: 2,
    title: 'Lerato Calls "Network Security"',
    subtitle: 'Outbound call to scammer\'s number.',
    screen: 'call_out',
    callActive: true,
    signalsToFire: [],
    riskScoreTarget: 25,
    narration: 'Lerato calls the number. It\'s answered immediately � a professional-sounding "Network agent". They ask her to verify her identity. She\'s on a call with an unknown number she received via SMS.',
  },
  {
    id: 3,
    title: 'Scammer: "We\'ll Send You an OTP"',
    subtitle: '"Just read it back to confirm it\'s you."',
    screen: 'wait_otp',
    callActive: true,
    signalsToFire: [],
    riskScoreTarget: 25,
    narration: '"For your security, we need to send a one-time PIN to verify your identity. Please read it back to me when you receive it." � The scammer triggers a password reset on their end. Lerato\'s number receives the real Network OTP.',
  },
  {
    id: 4,
    title: 'Real OTP SMS Arrives',
    subtitle: 'Genuine Network OTP � scammer waiting for Lerato to read it.',
    screen: 'otp_arrives',
    callActive: true,
    signalsToFire: [
      { id: 'a2', rule: 'RULE_008', label: 'OTP SMS received during active call session', delta: 25, severity: 'high', icon: '??', timestamp: '' },
    ],
    riskScoreTarget: 45,
    narration: 'Lerato receives the OTP. The SDK sees: SMS received + user is on an active call with an unknown number. Risk is rising. Lerato is about to open the mobile wallet app to see the OTP.',
  },
  {
    id: 5,
    title: 'Lerato Opens mobile wallet to View OTP',
    subtitle: 'OtpGuard.activate() fires the moment the screen renders.',
    screen: 'otp_screen',
    callActive: true,
    signalsToFire: [
      { id: 'a3', rule: 'RULE_014', label: 'OTP screen open during call with UNKNOWN caller', delta: 80, severity: 'high', icon: '??', timestamp: '' },
    ],
    riskScoreTarget: 100,
    narration: 'The moment the OTP screen renders, OtpGuard.activate() runs. It detects: active call + unknown caller. It immediately applies FLAG_SECURE (blocks screen recording) and fires RULE_014 (+80 pts). Score spikes to 100.',
  },
  {
    id: 6,
    title: '?? OTP Interception Alert � Full Screen',
    subtitle: 'Red overlay covers OTP. Warning impossible to miss.',
    screen: 'alert',
    callActive: true,
    signalsToFire: [],
    riskScoreTarget: 100,
    narration: 'A full-screen red blocking overlay appears OVER the OTP. Lerato cannot see the code until she acknowledges the warning. She reads: "? NEVER read your OTP to anyone. Network will never ask for your code."',
  },
  {
    id: 7,
    title: '? Account Takeover Prevented',
    subtitle: 'OTP never shared. Account remains secure.',
    screen: 'protected',
    callActive: false,
    signalsToFire: [],
    riskScoreTarget: 100,
    narration: 'Lerato hangs up. The password reset expires unused. The scammer never got the OTP. The event is logged in the fraud dashboard � the phone number and IP are added to the watchlist.',
  },
];

// -- Phone Screen Components ---------------------------------------------------

function CallBar({ unknown = true }: { unknown?: boolean }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => { const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t); }, []);
  return (
    <div style={{ background: unknown ? '#E53935' : '#4CAF50', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>?? {unknown ? '? Unknown 087 555 0022' : 'Network Security'}</span>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', marginLeft: 'auto', fontFamily: 'monospace' }}>
        {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}
      </span>
    </div>
  );
}

function HomeScreen() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#FFCC00' }}>
      <div style={{ padding: '20px 16px 12px' }}>
        <div style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>mobile wallet</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>Good afternoon, Lerato ??</div>
        <div style={{ marginTop: 4, background: '#fff3', borderRadius: 8, padding: '6px 10px' }}>
          <div style={{ fontSize: 10, color: '#555' }}>Wallet Balance</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>R 12,340.00</div>
        </div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: '12px 12px 0 0', padding: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#333', marginBottom: 12 }}>QUICK ACTIONS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[['??', 'Send'], ['??', 'Receive'], ['??', 'Airtime'], ['??', 'Bills'], ['??', 'Security'], ['?', 'More']].map(([icon, label]) => (
            <div key={label} style={{ background: '#F5F5F5', borderRadius: 8, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 18 }}>{icon}</div>
              <div style={{ fontSize: 9, color: '#444', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SmsScreen() {
  return (
    <div style={{ height: '100%', background: '#F5F5F5', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1A1A1A', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>?</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Messages</span>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#333' }}>Network-SECURITY</span>
            <span style={{ fontSize: 9, color: '#888' }}>Just now</span>
          </div>
          <div style={{ fontSize: 11, color: '#333', lineHeight: 1.7, background: '#FFF3E0', borderRadius: 8, padding: '10px 12px', border: '1px solid #FFB94C' }}>
            ?? <strong>Network Security Alert:</strong> Your account was accessed from an unknown device in Cape Town.<br /><br />
            If this wasn't you, call us IMMEDIATELY:<br />
            <strong style={{ color: '#E53935' }}>087 555 0022</strong><br /><br />
            <span style={{ fontSize: 9, color: '#888' }}>Ref: Network-2026-39841</span>
          </div>
          <div style={{ marginTop: 8, padding: '6px 8px', background: '#FFEBEE', borderRadius: 6, fontSize: 9, color: '#C62828' }}>
            ?? PayGuard: fraud keywords detected in this SMS
          </div>
        </div>
      </div>
    </div>
  );
}

function OutboundCallScreen() {
  const [secs, setSecs] = useState(0);
  useEffect(() => { const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t); }, []);
  return (
    <div style={{ height: '100%', background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#E53935', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>? CALLING UNKNOWN NUMBER</div>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#333', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>??</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 4 }}>087 555 0022</div>
        <div style={{ fontSize: 11, color: '#F44336' }}>? Not a verified Network number</div>
      </div>
      <div style={{ textAlign: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, width: '100%' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontStyle: 'italic' }}>
          "Welcome to Network Security. Your account shows suspicious activity. I'll need to verify your identity�"
        </div>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#4CAF50' }}>
        {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')} � Call in progress
      </div>
    </div>
  );
}

function WaitOtpScreen({ callActive }: { callActive: boolean }) {
  const [dots, setDots] = useState('');
  useEffect(() => { const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500); return () => clearInterval(t); }, []);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {callActive && <CallBar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 }}>
        <div style={{ fontSize: 40 }}>?</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#333', textAlign: 'center' }}>Waiting for OTP{dots}</div>
        <div style={{ fontSize: 10, color: '#888', textAlign: 'center', lineHeight: 1.7, padding: '10px 12px', background: '#FFF3E0', borderRadius: 8, border: '1px solid #FFB94C' }}>
          <strong>"You'll receive a 6-digit PIN shortly.<br />Please read it to me when you get it."</strong>
        </div>
        <div style={{ fontSize: 9, color: '#E53935', textAlign: 'center' }}>
          ? Real Network agents never ask for your OTP
        </div>
      </div>
    </div>
  );
}

function OtpArrivesScreen({ callActive }: { callActive: boolean }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F5F5F5' }}>
      {callActive && <CallBar />}
      <div style={{ background: '#1A1A1A', padding: '10px 14px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>? Messages</span>
      </div>
      {/* New SMS notification */}
      <div style={{ margin: 12, background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '2px solid #FFCC00' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#333' }}>Network</span>
          <span style={{ fontSize: 9, color: '#888' }}>Just now</span>
        </div>
        <div style={{ fontSize: 12, color: '#333', lineHeight: 1.7 }}>
          Your mobile wallet one-time PIN is:<br />
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', letterSpacing: 8, textAlign: 'center', margin: '8px 0', fontFamily: 'monospace', filter: 'blur(6px)' }}>
            847291
          </div>
          <span style={{ fontSize: 9, color: '#888' }}>Valid for 5 minutes. Never share this code.</span>
        </div>
        <div style={{ marginTop: 8, padding: '6px 8px', background: '#FFEBEE', borderRadius: 6, fontSize: 9, color: '#C62828' }}>
          ?? OTP received during active call � SDK alert incoming
        </div>
      </div>
    </div>
  );
}

function OtpGuardScreen({ callActive }: { callActive: boolean }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', position: 'relative', overflow: 'hidden' }}>
      {callActive && <CallBar />}
      {/* Blurred background hint */}
      <div style={{ flex: 1, filter: 'blur(4px)', opacity: 0.3, padding: 20 }}>
        <div style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 800, letterSpacing: 8, textAlign: 'center', marginTop: 60 }}>
          8 4 7 2 9 1
        </div>
      </div>
      {/* OtpGuard overlay � full screen */}
      <div style={{ position: 'absolute', inset: 0, top: 24, background: 'rgba(198,40,40,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 }}>
        <div style={{ fontSize: 36 }}>??</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'white', textAlign: 'center', lineHeight: 1.3 }}>
          SCAM ALERT
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
          You are on a call with an UNKNOWN number
        </div>
        <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '10px 12px', width: '100%' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', lineHeight: 1.9 }}>
            ? NEVER read your OTP to anyone<br />
            ? Network will NEVER ask for your code<br />
            ? Hang up this call immediately
          </div>
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          ?? Screen recording blocked � OTP hidden
        </div>
        <button style={{ background: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 11, fontWeight: 700, color: '#C62828', cursor: 'pointer', marginTop: 4 }}>
          I understand � End Call
        </button>
      </div>
    </div>
  );
}

function ATOAlertScreen() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1A1A1A', gap: 10, padding: 16 }}>
      <div style={{ fontSize: 48 }}>???</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#F85149', textAlign: 'center' }}>Account Takeover Blocked</div>
      <div style={{ fontSize: 10, color: '#8B949E', textAlign: 'center', lineHeight: 1.8 }}>
        OTP never disclosed<br />Password reset expired<br />Call ended
      </div>
      <div style={{ width: '100%', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontSize: 9, color: '#F85149', fontWeight: 600, marginBottom: 4 }}>FRAUD SHIELD ACTION</div>
        <div style={{ fontSize: 9, color: '#8B949E', lineHeight: 1.6 }}>
          � FLAG_SECURE applied � screen blocked<br />
          � RULE_014 fired � +80 pts ? BLOCK<br />
          � Risk score: 100/100
        </div>
      </div>
    </div>
  );
}

function ATOProtectedScreen() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0D1117', gap: 12, padding: 20 }}>
      <div style={{ fontSize: 52 }}>?</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#3FB950', textAlign: 'center' }}>Account Secure</div>
      <div style={{ fontSize: 10, color: '#8B949E', textAlign: 'center', lineHeight: 1.8 }}>
        Lerato's account protected<br />
        Scammer got nothing<br />
        Analyst dashboard updated
      </div>
      <div style={{ width: '100%', background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: 8, padding: '10px 12px', marginTop: 8 }}>
        <div style={{ fontSize: 9, color: '#3FB950', fontWeight: 600, marginBottom: 4 }}>?? PayGuard Protected You</div>
        <div style={{ fontSize: 9, color: '#8B949E', lineHeight: 1.6 }}>
          � Caller number flagged in graph<br />
          � Device watchlisted for 30 days<br />
          � SMS sender reported
        </div>
      </div>
    </div>
  );
}

function ATOPhoneScreen({ screen, callActive }: { screen: ATOStep['screen']; callActive: boolean }) {
  switch (screen) {
    case 'home':        return <HomeScreen />;
    case 'sms':         return <SmsScreen />;
    case 'call_out':    return <OutboundCallScreen />;
    case 'wait_otp':    return <WaitOtpScreen callActive={callActive} />;
    case 'otp_arrives': return <OtpArrivesScreen callActive={callActive} />;
    case 'otp_screen':  return <OtpGuardScreen callActive={callActive} />;
    case 'alert':       return <ATOAlertScreen />;
    case 'protected':   return <ATOProtectedScreen />;
    default:            return <HomeScreen />;
  }
}

// -- Risk Meter ----------------------------------------------------------------

function RiskMeter({ score }: { score: number }) {
  const color = score >= 80 ? '#F85149' : score >= 45 ? '#D29922' : '#3FB950';
  const label = score >= 80 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW';
  const action = score >= 80 ? 'BLOCK' : score >= 45 ? 'WARN_USER' : 'ALLOW';
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>REAL-TIME RISK SCORE</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 56, fontWeight: 800, color, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace', transition: 'color 0.5s ease' }}>{score}</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', paddingBottom: 6 }}>/100</div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, background: `${color}22`, border: `1px solid ${color}44`, borderRadius: 99, padding: '4px 12px' }}>{label}</div>
        </div>
      </div>
      <div style={{ background: 'var(--border)', borderRadius: 999, height: 10, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', borderRadius: 999, width: `${score}%`, background: score >= 80 ? 'linear-gradient(90deg, #D29922, #F85149)' : score >= 45 ? '#D29922' : '#3FB950', transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: `0 0 8px ${color}88` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginBottom: 12 }}>
        <span>0 � ALLOW</span><span>45 � WARN</span><span>80 � BLOCK</span>
      </div>
      {score > 0 && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: `${color}15`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{score >= 80 ? '??' : score >= 45 ? '??' : '?'}</span>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Recommended Action</div>
            <div style={{ fontSize: 13, fontWeight: 700, color }}>{action}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function SignalFeed({ signals }: { signals: Signal[] }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span className="live-dot" />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>LIVE SIGNAL FEED</span>
      </div>
      {signals.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '24px 0' }}>No signals yet � session clean ?</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {signals.map(sig => {
            const c = sig.severity === 'high' ? '#F85149' : sig.severity === 'medium' ? '#D29922' : '#3FB950';
            return (
              <div key={sig.id} style={{ background: `${c}0D`, border: `1px solid ${c}33`, borderRadius: 8, padding: '10px 12px', animation: 'signalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 16 }}>{sig.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{sig.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sig.rule} � {sig.timestamp}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c, flexShrink: 0 }}>+{sig.delta} pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -- Main ----------------------------------------------------------------------

export default function DemoTakeover() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [animating, setAnimating] = useState(false);

  const step = ATO_STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === ATO_STEPS.length - 1;

  const advanceStep = useCallback(() => {
    if (animating || stepIdx >= ATO_STEPS.length - 1) return;
    const next = ATO_STEPS[stepIdx + 1];
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
    setStepIdx(stepIdx + 1);
    setRiskScore(next.riskScoreTarget);
  }, [stepIdx, animating]);

  const retreat = () => {
    if (stepIdx <= 0) return;
    setStepIdx(stepIdx - 1);
    const prev = ATO_STEPS[stepIdx - 1];
    const allSigs: Signal[] = [];
    for (let i = 0; i < stepIdx - 1; i++) ATO_STEPS[i].signalsToFire.forEach(s => allSigs.unshift({ ...s, timestamp: '�' }));
    setSignals(allSigs);
    setRiskScore(prev.riskScoreTarget);
  };

  const reset = () => { setStepIdx(0); setSignals([]); setRiskScore(0); setAutoPlay(false); };

  useEffect(() => {
    if (!autoPlay) return;
    if (isLast) { setAutoPlay(false); return; }
    const t = setTimeout(() => advanceStep(), 2200);
    return () => clearTimeout(t);
  }, [autoPlay, stepIdx, isLast, advanceStep]);

  return (
    <div className="demo-flow-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Topbar */}
      <div className="demo-flow-header" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', height: 56, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/demo')} style={{ fontSize: 12, padding: '6px 12px' }}>? All Demos</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>?? Demo 2 of 2 � Account Takeover via OTP Interception</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Smishing � Vishing � OTP Phishing � OtpGuard Protection</div>
        </div>
        {isLast && (
          <button className="btn btn-primary" onClick={() => navigate('/transactions')} style={{ fontSize: 12 }}>
            View Analyst Dashboard ?
          </button>
        )}
      </div>

      {/* Step Bar */}
      <div className="demo-flow-tabs" style={{ display: 'flex', padding: '0 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
        {ATO_STEPS.map((s, i) => {
          const isActive = i === stepIdx;
          const isDone = i < stepIdx;
          return (
            <button key={s.id} onClick={() => {
              setStepIdx(i);
              setRiskScore(ATO_STEPS[i].riskScoreTarget);
              const allSigs: Signal[] = [];
              for (let j = 0; j < i; j++) ATO_STEPS[j].signalsToFire.forEach(sig => allSigs.unshift({ ...sig, timestamp: '�' }));
              setSignals(allSigs);
            }}
              style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: 'transparent', borderBottom: isActive ? '2px solid #F85149' : isDone ? '2px solid #3FB950' : '2px solid transparent', color: isActive ? '#F85149' : isDone ? '#3FB950' : 'var(--text-muted)', fontSize: 11, fontWeight: isActive ? 700 : 400, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
              {isDone ? '?' : `${i + 1}.`} {s.title.split(' ').slice(0, 3).join(' ')}
            </button>
          );
        })}
      </div>

      {/* Main */}
      <div className="demo-flow-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px 1fr', gap: 20, padding: 24, overflow: 'hidden' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#F85149', letterSpacing: '0.08em', marginBottom: 6 }}>STEP {stepIdx + 1} OF {ATO_STEPS.length}</div>
            <h2 style={{ fontSize: 22, marginBottom: 8, color: 'var(--text-primary)', lineHeight: 1.2 }}>{step.title}</h2>
            <div style={{ fontSize: 13, color: 'var(--accent-orange)', fontWeight: 500, marginBottom: 14 }}>{step.subtitle}</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{step.narration}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={retreat} disabled={isFirst} style={{ flex: 1, fontSize: 13 }}>? Back</button>
            <button className={`btn ${isLast ? 'btn-ghost' : 'btn-danger'}`} onClick={advanceStep} disabled={isLast || animating} style={{ flex: 2, fontSize: 13, fontWeight: 700 }}>
              {isLast ? '? End of Demo' : animating ? 'Detecting�' : 'Next Step ?'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className={`btn ${autoPlay ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setAutoPlay(a => !a)} style={{ flex: 1, fontSize: 12 }}>
              {autoPlay ? '? Pause' : '? Auto-Play'}
            </button>
            <button className="btn btn-ghost" onClick={reset} style={{ flex: 1, fontSize: 12 }}>? Reset</button>
          </div>
          <SignalFeed signals={signals} />
        </div>

        {/* Centre: Phone */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="demo-phone-frame" style={{ width: 280, height: 560, background: '#1A1A1A', borderRadius: 36, padding: 12, boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <div style={{ width: 80, height: 20, background: '#111', borderRadius: '0 0 12px 12px', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#333' }} />
              <div style={{ width: 40, height: 6, borderRadius: 3, background: '#222' }} />
            </div>
            <div className="demo-phone-screen" style={{ borderRadius: 24, overflow: 'hidden', height: 470, background: '#f5f5f5' }}>
              <ATOPhoneScreen screen={step.screen} callActive={step.callActive} />
            </div>
            <div style={{ width: 80, height: 4, background: '#333', borderRadius: 2, margin: '8px auto 0' }} />
          </div>
        </div>

        {/* Right: Risk + Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RiskMeter score={riskScore} />
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>ATO DETECTION RULES</div>
            {[
              { id: 'RULE_008', label: 'SMS fraud keywords detected', delta: 25, fired: riskScore >= 25 },
              { id: 'RULE_008', label: 'OTP SMS during active call session', delta: 25, fired: riskScore >= 45 },
              { id: 'RULE_014', label: 'OTP screen open � unknown caller', delta: 80, fired: riskScore >= 100 },
              { id: 'RULE_011', label: 'Emulator / fraud farm device', delta: 40, fired: false },
              { id: 'RULE_006', label: 'SIM swap detected last 48h', delta: 50, fired: false },
              { id: 'RULE_009', label: 'Rooted/jailbroken device', delta: 20, fired: false },
            ].map((r, idx) => {
              const color = r.fired ? '#F85149' : '#484F58';
              return (
                <div key={`${r.id}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', opacity: r.fired ? 1 : 0.35, transition: 'opacity 0.5s' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: r.fired ? 'var(--text-primary)' : 'var(--text-muted)', flex: 1, fontFamily: 'JetBrains Mono, monospace' }}>{r.id}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', flex: 2 }}>{r.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: r.fired ? '#F85149' : 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>+{r.delta}</span>
                </div>
              );
            })}
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(248,81,73,0.07)', border: '1px solid rgba(248,81,73,0.2)', borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <strong style={{ color: '#F85149' }}>?? RULE_014</strong> � Highest single-rule weight in the engine (+80 pts). OTP disclosure enables full account takeover regardless of transaction amount.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes signalIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
