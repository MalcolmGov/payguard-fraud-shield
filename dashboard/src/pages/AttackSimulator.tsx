import { useState, useEffect, useRef } from 'react';

const SCENARIOS = [
  {
    id: 'vishing',
    name: '\uD83D\uDCDE Vishing Attack',
    desc: 'Scammer calls victim, instructs them to make a payment while staying on the phone.',
    steps: [
      { ms: 0, label: 'Incoming call from unknown number', detail: 'Caller ID: +27600000000 \u00B7 Duration starts', signal: null, status: 'neutral' },
      { ms: 800, label: 'Victim opens banking app', detail: 'App session started \u00B7 Device fingerprint verified', signal: 'OK', status: 'ok' },
      { ms: 1600, label: '\u26A0\uFE0F Call state detected during payment', detail: 'Rule: CALL_ACTIVE_DURING_PAYMENT triggered \u00B7 Score +55', signal: 'WARN', status: 'warned' },
      { ms: 2400, label: 'Amount entered: R8,500', detail: 'Above daily average \u00B7 Velocity check passed', signal: null, status: 'neutral' },
      { ms: 3200, label: '\u26A0\uFE0F Keystroke anomaly detected', detail: 'Typing pattern matches coached dictation \u00B7 Score +15', signal: 'WARN', status: 'warned' },
      { ms: 4000, label: '\uD83D\uDED1 BLOCKED \u2014 Risk score 70+', detail: 'Action: BLOCK \u00B7 Transaction halted \u00B7 SMS alert sent to victim', signal: 'BLOCK', status: 'blocked' },
    ],
  },
  {
    id: 'sim-swap',
    name: '\uD83D\uDCF1 SIM Swap Attack',
    desc: 'Attacker ports victim\u2019s number to a new SIM to intercept OTPs.',
    steps: [
      { ms: 0, label: 'SIM change detected via HLR lookup', detail: 'IMSI changed within last 4 hours \u00B7 Carrier: Vodacom', signal: 'WARN', status: 'warned' },
      { ms: 1000, label: 'New device attempting login', detail: 'Device fingerprint: unknown \u00B7 Location: Johannesburg', signal: 'WARN', status: 'warned' },
      { ms: 2000, label: '\u26A0\uFE0F SIM_SWAP_48H rule triggered', detail: 'Score +70 \u00B7 Severity: CRITICAL \u00B7 All outbound transactions frozen', signal: 'BLOCK', status: 'blocked' },
      { ms: 3000, label: 'OTP request intercepted', detail: 'OTP delivery blocked to new SIM \u00B7 Original number flagged', signal: 'BLOCK', status: 'blocked' },
      { ms: 4000, label: '\uD83D\uDED1 Account placed in high-security mode', detail: 'Biometric re-verification required \u00B7 Account frozen 72h', signal: 'BLOCK', status: 'blocked' },
    ],
  },
  {
    id: 'otp-intercept',
    name: '\uD83D\uDD10 OTP Intercept',
    desc: 'Malware overlay attempts to capture OTP during authentication.',
    steps: [
      { ms: 0, label: 'OTP display initiated', detail: 'User requested OTP \u00B7 SMS sent to +27821######', signal: null, status: 'neutral' },
      { ms: 1000, label: '\u26A0\uFE0F Screen overlay detected', detail: 'Suspicious app drawing over banking app \u00B7 SYSTEM_ALERT_WINDOW', signal: 'WARN', status: 'warned' },
      { ms: 2000, label: '\uD83D\uDED1 OtpGuard activated', detail: 'OTP display locked \u00B7 Overlay blocked \u00B7 Score +40', signal: 'BLOCK', status: 'blocked' },
      { ms: 3000, label: 'Accessibility service audit', detail: 'Suspicious service: "ScreenHelper" accessing OTP fields', signal: 'BLOCK', status: 'blocked' },
      { ms: 4000, label: 'Clipboard wiped + session invalidated', detail: 'OTP expired early \u00B7 New OTP requires biometric verification', signal: 'BLOCK', status: 'blocked' },
    ],
  },
];

export default function AttackSimulator() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const run = () => {
    setCurrentStep(-1);
    setRunning(true);
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    activeScenario.steps.forEach((step, i) => {
      const t = setTimeout(() => {
        setCurrentStep(i);
        if (i === activeScenario.steps.length - 1) setRunning(false);
      }, step.ms);
      timerRef.current.push(t);
    });
  };

  const reset = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setCurrentStep(-1);
    setRunning(false);
  };

  useEffect(() => () => timerRef.current.forEach(clearTimeout), []);

  const statusColor = (s: string) => s === 'blocked' ? '#EF4444' : s === 'warned' ? '#FBBF24' : s === 'ok' ? '#10F5A0' : '#475569';

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: '#F0F6FF' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
          {'\u26A1'} Attack Simulator
        </h1>
        <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>Replay real-world fraud scenarios and see PayGuard\u2019s response in real-time</p>
      </div>

      {/* Scenario Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => { setActiveScenario(s); reset(); }} style={{
            padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: activeScenario.id === s.id ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.04)',
            color: activeScenario.id === s.id ? '#0EA5E9' : '#64748B',
            border: activeScenario.id === s.id ? '1px solid rgba(14,165,233,0.3)' : '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.2s',
          }}>{s.name}</button>
        ))}
      </div>

      {/* Description + Controls */}
      <div style={{
        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '20px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: 0, maxWidth: 600 }}>{activeScenario.desc}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={run} disabled={running} style={{
            padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: running ? 'not-allowed' : 'pointer',
            background: running ? 'rgba(255,255,255,0.05)' : '#0EA5E9',
            color: running ? '#475569' : '#000',
          }}>{running ? 'Running\u2026' : '\u25B6 Run Simulation'}</button>
          <button onClick={reset} style={{
            padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: '#64748B', cursor: 'pointer',
          }}>Reset</button>
        </div>
      </div>

      {/* Timeline */}
      <div style={{
        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '24px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', marginBottom: 20 }}>EVENT TIMELINE</div>
        <div style={{ position: 'relative', paddingLeft: 28 }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 9, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.06)' }} />

          {activeScenario.steps.map((step, i) => {
            const isActive = i <= currentStep;
            const isCurrent = i === currentStep;
            const color = statusColor(step.status);

            return (
              <div key={i} style={{
                position: 'relative', marginBottom: 24, paddingLeft: 24,
                opacity: isActive ? 1 : 0.3, transition: 'opacity 0.5s',
              }}>
                {/* Dot */}
                <div style={{
                  position: 'absolute', left: -24, top: 4, width: 16, height: 16, borderRadius: 8,
                  background: isActive ? `${color}25` : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${isActive ? color : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                  boxShadow: isCurrent ? `0 0 12px ${color}60` : 'none',
                }}>
                  {isActive && <div style={{ width: 6, height: 6, borderRadius: 3, background: color }} />}
                </div>

                <div style={{ fontSize: 9, color: '#334155', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
                  +{(step.ms / 1000).toFixed(1)}s
                  {step.signal && (
                    <span style={{
                      marginLeft: 8, padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      background: step.signal === 'BLOCK' ? 'rgba(239,68,68,0.15)' : step.signal === 'WARN' ? 'rgba(251,191,36,0.15)' : 'rgba(16,245,160,0.15)',
                      color: step.signal === 'BLOCK' ? '#EF4444' : step.signal === 'WARN' ? '#FBBF24' : '#10F5A0',
                    }}>{step.signal}</span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? '#F0F6FF' : '#475569', marginBottom: 4, transition: 'color 0.3s' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>{step.detail}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
