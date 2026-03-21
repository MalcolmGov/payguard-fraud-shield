import { useState, useEffect, useRef } from 'react';

// -- Types ----------------------------------------------------------------------
type DemoStep =
  | 'idle'
  | 'new_device'
  | 'push_sent'
  | 'waiting'
  | 'confirmed'
  | 'denied'
  | 'trusted';

type Scenario = {
  label: string;
  description: string;
  outcome: 'confirmed' | 'denied';
  delayMs: number;
};

const SCENARIOS: Scenario[] = [
  {
    label: 'Legitimate User — Allow',
    description: 'Customer recognises the alert and presses 1 to authorise their new phone.',
    outcome: 'confirmed',
    delayMs: 4000,
  },
  {
    label: 'SIM Swap / ATO — Deny',
    description: 'Attacker registered a new device but the real owner receives the USSD and presses 2 to deny. Account protected.',
    outcome: 'denied',
    delayMs: 5000,
  },
];

const PHONE = '+27 82 123 4567';
const DEVICE_NEW = 'Samsung Galaxy S24 · Android 14';
const DEVICE_OLD = 'iPhone 14 Pro · iOS 17';

// -- Sub-components -------------------------------------------------------------

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: `${color}18`, border: `1px solid ${color}40`,
      color, borderRadius: 20, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
    }}>
      {children}
    </span>
  );
}

function StepDot({ active, done, n }: { active: boolean; done: boolean; n: number }) {
  const bg = done ? '#10F5A0' : active ? '#0EA5E9' : '#1E293B';
  const color = (done || active) ? '#0F172A' : '#64748B';
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: bg, color, fontWeight: 800, fontSize: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.4s', flexShrink: 0,
      boxShadow: active ? `0 0 0 4px ${bg}33` : 'none',
    }}>
      {done ? '?' : n}
    </div>
  );
}

// -- USSD Phone Mockup ----------------------------------------------------------
function PhoneMockup({ step }: { step: DemoStep }) {
  const showUssd  = ['push_sent', 'waiting', 'confirmed', 'denied'].includes(step);
  const responded = step === 'confirmed' || step === 'denied';
  const denied    = step === 'denied';

  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: '#0A0A0A',
      borderRadius: 36,
      border: '6px solid #1A1A1A',
      boxShadow: '0 0 0 2px #333, 0 24px 48px rgba(0,0,0,0.6)',
      padding: '32px 12px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative',
    }}>
      {/* Notch */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: 60, height: 14, background: '#1A1A1A', borderRadius: 8,
      }} />

      {/* Screen */}
      <div style={{
        width: '100%', minHeight: 280,
        background: 'var(--w-bg)',
        borderRadius: 20,
        padding: 14,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Status bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 9, color: 'var(--w-text-3)', marginBottom: 10,
        }}>
          <span>14:02</span>
          <span>network carrier ¦¦¦ ??</span>
        </div>

        {!showUssd && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontSize: 28 }}>??</div>
            <div style={{ fontSize: 10, color: '#334155', textAlign: 'center' }}>
              Waiting for action...
            </div>
          </div>
        )}

        {showUssd && (
          <div style={{
            flex: 1,
            background: responded
              ? (denied ? '#1A0505' : '#051A0E')
              : '#050F1A',
            borderRadius: 10, padding: 12,
            display: 'flex', flexDirection: 'column', gap: 6,
            animation: showUssd ? 'fadeIn 0.3s ease' : 'none',
          }}>
            {/* USSD header */}
            <div style={{
              background: '#0EA5E9', color: '#fff',
              fontSize: 9, fontWeight: 700, padding: '3px 8px',
              borderRadius: 4, textAlign: 'center', letterSpacing: '0.05em',
            }}>
              USSD MENU
            </div>

            {!responded && (
              <>
                <div style={{ fontSize: 10, color: 'var(--w-text-1)', fontWeight: 700, marginTop: 4 }}>
                  ??? PayGuard Security Alert
                </div>
                <div style={{ fontSize: 9, color: 'var(--w-text-2)', lineHeight: 1.5 }}>
                  A new device is requesting access to your mobile wallet account.
                </div>
                <div style={{ fontSize: 9, color: 'var(--w-text-2)', marginTop: 2 }}>
                  Device: {DEVICE_NEW.split(' · ')[0]}
                </div>
                <div style={{
                  borderTop: '1px solid #1E293B',
                  marginTop: 8, paddingTop: 8,
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}>
                  <div style={{
                    background: 'var(--w-bg)', borderRadius: 6,
                    padding: '6px 10px', fontSize: 10, color: '#10F5A0', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{
                      width: 18, height: 18, background: '#10F5A020',
                      border: '1px solid #10F5A040', borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 900,
                    }}>1</span>
                    Allow
                  </div>
                  <div style={{
                    background: 'var(--w-bg)', borderRadius: 6,
                    padding: '6px 10px', fontSize: 10, color: '#F87171', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{
                      width: 18, height: 18, background: '#F8717120',
                      border: '1px solid #F8717140', borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 900,
                    }}>2</span>
                    Deny
                  </div>
                </div>
                {/* Pulsing indicator */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  marginTop: 6,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9',
                    animation: 'pulse 1.2s ease infinite',
                  }} />
                  <div style={{ fontSize: 8, color: 'var(--w-text-3)' }}>Awaiting response…</div>
                </div>
              </>
            )}

            {responded && !denied && (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8,
              }}>
                <div style={{ fontSize: 24 }}>?</div>
                <div style={{ fontSize: 10, color: '#10F5A0', fontWeight: 800, textAlign: 'center' }}>
                  Device Authorised
                </div>
                <div style={{ fontSize: 9, color: 'var(--w-text-2)', textAlign: 'center', lineHeight: 1.5 }}>
                  Thank you. Your new device is now trusted.
                </div>
              </div>
            )}

            {responded && denied && (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8,
              }}>
                <div style={{ fontSize: 24 }}>??</div>
                <div style={{ fontSize: 10, color: '#F87171', fontWeight: 800, textAlign: 'center' }}>
                  Access Denied
                </div>
                <div style={{ fontSize: 9, color: 'var(--w-text-2)', textAlign: 'center', lineHeight: 1.5 }}>
                  Device blocked. If this wasn't you, your account is safe.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Home bar */}
      <div style={{
        width: 60, height: 4, background: '#333',
        borderRadius: 4, marginTop: 12,
      }} />
    </div>
  );
}

// -- Main Demo Page -------------------------------------------------------------
export default function UssdDemoPage() {
  const [step, setStep] = useState<DemoStep>('idle');
  const [scenarioIdx, setScenarioIdx] = useState(0);

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scenario = SCENARIOS[scenarioIdx];
  const sessionId = 'ussd_demo_1773' + Math.floor(Math.random() * 9999);

  const clearInt = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startDemo = () => {
    clearInt();
    setStep('new_device');
    setElapsed(0);

    // Step 1: show new device alert ? push sent after 2s
    setTimeout(() => setStep('push_sent'), 1500);

    // Step 2: show waiting / polling after 2.5s
    setTimeout(() => setStep('waiting'), 2500);

    // Step 3: subscriber responds
    const respondAt = scenario.delayMs;
    setTimeout(() => setStep(scenario.outcome), respondAt);

    // Step 4: show trusted / blocked 1.5s later
    setTimeout(() => {
      setStep(scenario.outcome === 'confirmed' ? 'trusted' : 'denied');
    }, respondAt + 1500);

    // Elapsed timer
    let t = 0;
    intervalRef.current = setInterval(() => {
      t += 100;
      setElapsed(t);
    }, 100);

    // Stop timer
    setTimeout(() => clearInt(), respondAt + 2000);
  };

  const reset = () => {
    clearInt();
    setStep('idle');
    setElapsed(0);
  };

  useEffect(() => () => clearInt(), []);

  const isRunning = !['idle', 'trusted', 'denied'].includes(step);

  const STEPS = [
    { label: 'New device detected',   states: ['new_device'] },
    { label: 'USSD push sent',        states: ['push_sent'] },
    { label: 'Polling for response',  states: ['waiting'] },
    { label: 'Subscriber responds',   states: ['confirmed', 'denied'] },
    { label: 'Device status updated', states: ['trusted'] },
  ];

  const currentStepIdx = STEPS.findIndex(s => s.states.includes(step));

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>

      {/* -- Header ------------------------------------------------------------ */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg,#0EA5E9,#0369A1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>??</div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--w-text-1)', margin: 0 }}>
              USSD Push — Device Authorisation
            </h1>
            <div style={{ fontSize: 13, color: 'var(--w-text-3)', marginTop: 2 }}>
              Interactive demo · Stakeholder presentation
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Pill color="#10F5A0">?? Live Demo</Pill>
          </div>
        </div>

        {/* Scenario selector */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {SCENARIOS.map((s, i) => (
            <button
              key={i}
              onClick={() => { reset(); setScenarioIdx(i); }}
              disabled={isRunning}
              style={{
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                fontWeight: 700, fontSize: 13,
                border: `2px solid ${scenarioIdx === i ? '#0EA5E9' : '#1E293B'}`,
                background: scenarioIdx === i ? '#0EA5E920' : '#0F172A',
                color: scenarioIdx === i ? '#0EA5E9' : '#64748B',
                transition: 'all 0.2s',
              }}
            >
              {i === 0 ? '?' : '??'} Scenario {i + 1}: {s.label}
            </button>
          ))}
        </div>
        <div style={{
          marginTop: 10, padding: '10px 14px',
          background: 'var(--w-bg)', borderRadius: 8, borderLeft: '3px solid #0EA5E9',
          fontSize: 13, color: 'var(--w-text-2)',
        }}>
          {scenario.description}
        </div>
      </div>

      {/* -- Main layout -------------------------------------------------------- */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* Left: Phone */}
        <PhoneMockup step={step} />

        {/* Right: Flow + Status */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Flow steps */}
          <div style={{
            background: 'var(--w-bg)', borderRadius: 14,
            border: '1px solid #1E293B', padding: 24,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--w-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
              Authorization Flow
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {STEPS.map((s, i) => {
                const isDone   = currentStepIdx > i;
                const isActive = currentStepIdx === i;
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <StepDot active={isActive} done={isDone} n={i + 1} />
                      {i < STEPS.length - 1 && (
                        <div style={{
                          width: 2, height: 28,
                          background: isDone ? '#10F5A040' : '#1E293B',
                          transition: 'background 0.4s',
                        }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 4, paddingBottom: 14 }}>
                      <div style={{
                        fontSize: 13, fontWeight: isActive ? 700 : 500,
                        color: isDone ? '#10F5A0' : isActive ? '#F0F6FF' : '#64748B',
                        transition: 'color 0.3s',
                      }}>
                        {s.label}
                      </div>
                      {isActive && (
                        <div style={{
                          fontSize: 11, color: '#0EA5E9', marginTop: 2,
                          animation: 'fadeIn 0.3s ease',
                        }}>
                          {i === 0 && '?? Fingerprint mismatch detected — new device'}
                          {i === 1 && `?? USSD push sent to ${PHONE}`}
                          {i === 2 && '? Polling Redis session every 3s…'}
                          {i === 3 && (scenario.outcome === 'confirmed' ? '?? Subscriber pressed 1 — Allow' : '? Subscriber pressed 2 — Deny')}
                          {i === 4 && (scenario.outcome === 'confirmed' ? '??? Device promoted to trusted' : '?? Device blocked')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* API Payload panel */}
          <div style={{
            background: 'var(--w-bg)', borderRadius: 14,
            border: '1px solid #1E293B', padding: 20,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--w-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Live API Exchange
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, Courier New, monospace',
              fontSize: 11, lineHeight: 1.7, color: 'var(--w-text-2)',
            }}>
              {step === 'idle' && (
                <span style={{ color: '#334155' }}>// Press Start Demo to see the API calls...</span>
              )}
              {step === 'new_device' && (
                <span style={{ color: '#0EA5E9' }}>{'? POST /device/validate\n   { "device_status": "new_device",\n     "required_action": "ussd_push" }'}</span>
              )}
              {step === 'push_sent' && (
                <span style={{ color: '#F9A825' }}>{'? POST /device/step-up/ussd/push\n   { "user_id": "' + PHONE + '",\n     "session_id": "' + sessionId + '",\n     "status": "ussd_push_sent" }'}</span>
              )}
              {step === 'waiting' && (
                <span style={{ color: '#0EA5E9' }}>{'? GET /device/step-up/ussd/status\n     ?session_id=' + sessionId + '\n   { "status": "pending",\n     "expires_at": ' + Math.floor(Date.now() / 1000 + 280) + ' }'}</span>
              )}
              {(step === 'confirmed' || step === 'denied') && (
                <span style={{ color: step === 'confirmed' ? '#10F5A0' : '#F87171' }}>
                  {'? POST /device/step-up/ussd/callback\n   { "session_id": "' + sessionId + '",\n     "response_code": "' + (step === 'confirmed' ? '1' : '2') + '",\n     "msisdn": "' + PHONE + '" }'}
                </span>
              )}
              {step === 'trusted' && (
                <span style={{ color: '#10F5A0' }}>
                  {'? GET /device/step-up/ussd/status\n   { "status": "confirmed",\n     "device_status": "trusted" }\n\n? Device promoted to trusted in DB'}
                </span>
              )}
            </div>
          </div>

          {/* Device context */}
          <div style={{
            background: 'var(--w-bg)', borderRadius: 14,
            border: '1px solid #1E293B', padding: 20,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
          }}>
            {[
              { label: 'Registered Device', value: DEVICE_OLD, icon: '?', color: '#10F5A0' },
              { label: 'New Device (Requesting)', value: DEVICE_NEW, icon: '?', color: '#F9A825' },
              { label: 'MSISDN', value: PHONE, icon: '??', color: '#0EA5E9' },
              { label: 'Session Status', value:
                  step === 'idle'    ? 'Not started' :
                  step === 'waiting' ? 'Pending…' :
                  step === 'confirmed' || step === 'trusted' ? 'Confirmed — Trusted' :
                  step === 'denied'  ? 'Denied — Blocked' : 'Initiating…',
                icon: step === 'trusted' ? '??' : step === 'denied' ? '??' : '??',
                color: step === 'trusted' ? '#10F5A0' : step === 'denied' ? '#F87171' : '#F9A825',
              },
            ].map(({ label, value, icon, color }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: 'var(--w-text-3)', fontWeight: 600, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12, color, fontWeight: 600 }}>{icon} {value}</div>
              </div>
            ))}
          </div>

          {/* Timer */}
          {elapsed > 0 && (
            <div style={{ fontSize: 12, color: 'var(--w-text-3)', textAlign: 'right' }}>
              ? Elapsed: {(elapsed / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      </div>

      {/* -- Controls ----------------------------------------------------------- */}
      <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'center' }}>
        <button
          onClick={startDemo}
          disabled={isRunning}
          style={{
            padding: '12px 40px', borderRadius: 10,
            background: isRunning ? '#1E293B' : 'linear-gradient(135deg,#0EA5E9,#0369A1)',
            color: isRunning ? '#64748B' : '#fff',
            fontWeight: 800, fontSize: 15, cursor: isRunning ? 'not-allowed' : 'pointer',
            border: 'none', transition: 'all 0.2s',
            boxShadow: isRunning ? 'none' : '0 4px 20px #0EA5E940',
          }}
        >
          {isRunning ? '? Running…' : step === 'idle' ? '?  Start Demo' : '?  Run Again'}
        </button>
        {step !== 'idle' && !isRunning && (
          <button
            onClick={reset}
            style={{
              padding: '12px 24px', borderRadius: 10,
              background: '#1E293B', color: 'var(--w-text-2)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              border: '1px solid #334155',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* -- Result banner ------------------------------------------------------ */}
      {step === 'trusted' && (
        <div style={{
          marginTop: 24, padding: '16px 24px',
          background: '#051A0E', border: '1px solid #16A34A',
          borderRadius: 12, textAlign: 'center',
          animation: 'fadeIn 0.4s ease',
        }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#10F5A0' }}>
            ? Device Authorised — Account Protected
          </div>
          <div style={{ fontSize: 13, color: '#4B7A5E', marginTop: 4 }}>
            New device trusted in {(scenario.delayMs + 1500) / 1000}s · No OTP required · Works on any handset
          </div>
        </div>
      )}
      {step === 'denied' && (
        <div style={{
          marginTop: 24, padding: '16px 24px',
          background: '#1A0505', border: '1px solid #DC2626',
          borderRadius: 12, textAlign: 'center',
          animation: 'fadeIn 0.4s ease',
        }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#F87171' }}>
            ?? Attack Blocked — Account Secured
          </div>
          <div style={{ fontSize: 13, color: '#7A4B4B', marginTop: 4 }}>
            Real owner denied access · Attacker's device blacklisted · SIM swap attempt stopped
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}
