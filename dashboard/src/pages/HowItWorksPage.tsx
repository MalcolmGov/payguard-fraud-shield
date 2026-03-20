import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebNav, { WebFooter } from '../components/WebNav';
import TalkToSalesModal from '../components/TalkToSalesModal';

const STEPS = [
  {
    num: '01',
    color: '#FF4455',
    title: 'SDK Embedded at Checkout',
    desc: 'PayGuard\'s lightweight SDK (0.8 MB) is embedded into your banking or fintech app. It activates automatically when a customer initiates a payment or transfer \u2014 no user action required.',
    detail: 'Supports Android, iOS, and React Native. Drop-in integration with 12 lines of code. Works with any payment rail: EFT, mobile money, card, wallet.',
    visual: 'install',
  },
  {
    num: '02',
    color: '#FF1744',
    title: 'Real-Time Signal Collection',
    desc: 'The moment a transaction begins, four signal collectors activate in parallel \u2014 checking for active phone calls, clipboard paste events, keystroke anomalies, and device fingerprint changes.',
    detail: 'All signals are captured on-device in under 12ms. Data is AES-256 encrypted before transmission. Zero impact on user experience.',
    visual: 'scan',
  },
  {
    num: '03',
    color: '#C62828',
    title: 'AI Risk Engine Evaluates',
    desc: '35 fraud rules evaluate simultaneously in our Rust-based risk engine. Each rule scores the transaction across dimensions: behavioral, device, network, and transactional.',
    detail: 'The engine runs in AWS af-south-1 (Cape Town). P99 latency is under 50ms. Scores are aggregated into a single risk verdict: ALLOW, WARN, or BLOCK.',
    visual: 'engine',
  },
  {
    num: '04',
    color: '#F97316',
    title: 'Instant Decision & Action',
    desc: 'Before the customer taps "Confirm", PayGuard returns a verdict. Fraudulent transactions are blocked or flagged. Legitimate ones flow through without friction.',
    detail: 'Total end-to-end latency: ~80ms. False positive rate: < 0.3%. Blocked transactions trigger full-screen warnings explaining the risk to the customer.',
    visual: 'verdict',
  },
  {
    num: '05',
    color: '#7C3AED',
    title: 'Graph Intelligence & Learning',
    desc: 'Every transaction feeds into PayGuard\'s Neo4j fraud graph, linking accounts, devices, and wallets. The system continuously learns and adapts to new fraud patterns.',
    detail: 'Mule networks are detected automatically. Analysts can bulk-block connected accounts with one click. ML models retrain weekly on African payment data.',
    visual: 'graph',
  },
];

const SCENARIOS = [
  {
    title: 'Social Engineering Call',
    icon: '\uD83D\uDCDE',
    color: '#FF4455',
    without: 'Customer is manipulated into transferring funds while on a call with a scammer. Bank only discovers the fraud days later.',
    with: 'PayGuard detects the active call during payment. Transaction is blocked instantly. Customer sees a full-screen fraud warning.',
  },
  {
    title: 'SIM Swap Attack',
    icon: '\uD83D\uDCF1',
    color: '#FF1744',
    without: 'Fraudster ports victim\'s SIM, resets banking credentials, and drains account within hours.',
    with: 'PayGuard detects new device fingerprint within 48h of SIM change. All outbound transactions are frozen automatically.',
  },
  {
    title: 'Mule Account Network',
    icon: '\uD83D\uDD78\uFE0F',
    color: '#C62828',
    without: 'Stolen funds are laundered through dozens of connected accounts across banks. Investigation takes weeks.',
    with: 'PayGuard\'s fraud graph links shared devices, IPs, and behavioural patterns. One-click bulk-block across the entire ring.',
  },
];

const INTEGRATION_STEPS = [
  { num: '1', title: 'Install SDK', desc: 'Add PayGuard to your app with a single dependency. 12 lines of code.', time: 'Day 1' },
  { num: '2', title: 'Configure Rules', desc: 'Set risk thresholds and actions via dashboard or API. Use our defaults or customise.', time: 'Day 1-2' },
  { num: '3', title: 'Go Live', desc: 'Deploy to production. Real-time fraud protection active immediately.', time: 'Day 2-3' },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const [showSales, setShowSales] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#050505', fontFamily: 'Inter, sans-serif', color: '#F0F6FF', overflowX: 'hidden' }}>
      <WebNav />

      {/* Hero */}
      <section style={{ padding: '140px 48px 80px', textAlign: 'center', position: 'relative' }}>
        <div className="section-label">How It Works</div>
        <h1 className="w-heading" style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
          From Payment to Protection<br />
          <span style={{ background: 'linear-gradient(135deg, #FF1744, #FF4455)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>in Under 80ms.</span>
        </h1>
        <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.8 }}>
          PayGuard works invisibly inside your app. No customer friction. No manual reviews. Every transaction is scored in real-time before money moves.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button className="w-btn-primary" onClick={() => navigate('/sandbox')}>Try the Sandbox</button>
          <button className="w-btn-secondary" onClick={() => navigate('/architecture')}>View Architecture</button>
        </div>
      </section>

      {/* 5-Step Flow */}
      <section style={{ padding: '0 48px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="divider-glow" style={{ marginBottom: 80 }} />
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="section-label">The Process</div>
          <h2 className="w-heading" style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>Five Steps. Zero Friction.</h2>
        </div>

        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: 32, top: 0, bottom: 0, width: 2,
            background: 'linear-gradient(180deg, #FF4455, #C62828, #F97316, #7C3AED)',
            opacity: 0.3,
          }} />

          {STEPS.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 40, marginBottom: i < STEPS.length - 1 ? 48 : 0,
              position: 'relative',
            }}>
              {/* Step number circle */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                background: `${step.color}15`,
                border: `2px solid ${step.color}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: step.color,
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: `0 0 30px ${step.color}20`,
                position: 'relative', zIndex: 1,
              }}>
                {step.num}
              </div>

              {/* Content card */}
              <div style={{
                flex: 1, background: '#0c0f1a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: '32px 36px',
                position: 'relative', overflow: 'hidden',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${step.color}40`; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${step.color}10`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
              >
                {/* Top accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${step.color}, transparent)` }} />

                <h3 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#F0F6FF', marginBottom: 12, letterSpacing: '-0.01em' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.8, marginBottom: 16 }}>
                  {step.desc}
                </p>
                <div style={{
                  fontSize: 13, color: '#64748B', lineHeight: 1.7,
                  padding: '14px 18px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {step.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Before & After Scenarios */}
      <section style={{
        background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '96px 48px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="section-label">Real-World Scenarios</div>
            <h2 className="w-heading" style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Without PayGuard vs. With PayGuard
            </h2>
            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 500, margin: '0 auto' }}>See how PayGuard transforms fraud outcomes across common attack vectors.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {SCENARIOS.map((s, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '240px 1fr 1fr', gap: 0,
                borderRadius: 20, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                {/* Scenario label */}
                <div style={{
                  background: `${s.color}10`, padding: '32px 28px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#F0F6FF', textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>{s.title}</div>
                </div>

                {/* Without */}
                <div style={{
                  background: 'rgba(248,81,73,0.04)', padding: '28px 32px',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#F85149', marginBottom: 12 }}>WITHOUT PAYGUARD</div>
                  <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.75 }}>{s.without}</p>
                </div>

                {/* With */}
                <div style={{ background: 'rgba(63,185,80,0.04)', padding: '28px 32px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#3FB950', marginBottom: 12 }}>WITH PAYGUARD</div>
                  <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.75 }}>{s.with}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Timeline */}
      <section style={{ padding: '96px 48px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="section-label">Integration</div>
          <h2 className="w-heading" style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Go Live in 48 Hours
          </h2>
          <p style={{ fontSize: 16, color: '#64748B' }}>Three steps from first install to production-grade fraud protection.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {INTEGRATION_STEPS.map((s, i) => (
            <div key={i} style={{
              background: '#0c0f1a', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '36px 28px', textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #FF1744, transparent)' }} />
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 20px',
                background: 'rgba(255,23,68,0.1)', border: '2px solid rgba(255,23,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 900, color: '#FF4455',
                fontFamily: 'JetBrains Mono, monospace',
              }}>{s.num}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#FF4455', marginBottom: 10 }}>{s.time}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#F0F6FF', fontFamily: 'Outfit, sans-serif', marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Stats */}
      <section style={{
        background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '80px 48px',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            { value: '~80ms', label: 'End-to-end decision', color: '#FF4455' },
            { value: '< 0.3%', label: 'False positive rate', color: '#FF1744' },
            { value: '35', label: 'Parallel fraud rules', color: '#C62828' },
            { value: '99.99%', label: 'Platform uptime SLA', color: '#F97316' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: s.color, marginBottom: 8 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '96px 48px', textAlign: 'center' }}>
        <h2 className="w-heading" style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
          Ready to Stop Fraud?
        </h2>
        <p style={{ fontSize: 16, color: '#64748B', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          See PayGuard in action with our interactive sandbox, or talk to our team about your use case.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button className="w-btn-primary" onClick={() => setShowSales(true)} style={{ fontSize: 15, padding: '14px 32px' }}>🤝 Talk to Sales</button>
          <button className="w-btn-secondary" onClick={() => navigate('/sandbox')}>Try the Sandbox</button>
          <button className="w-btn-secondary" onClick={() => navigate('/products')}>Explore Products</button>
        </div>
      </section>
      {showSales && <TalkToSalesModal onClose={() => setShowSales(false)} />}

      <WebFooter />
    </div>
  );
}
