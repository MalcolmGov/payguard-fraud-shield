import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TalkToSalesModal from '../components/TalkToSalesModal';

/* ── Animated Counter ──────────────────────────────────────────── */
function Counter({ target, suffix = '', prefix = '', duration = 2000 }: { target: number; suffix?: string; prefix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start: number | null = null;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setVal(Math.floor(p * target));
        if (p < 1) requestAnimationFrame(step); else setVal(target);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ── Scroll Reveal ─────────────────────────────────────────────── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Data ──────────────────────────────────────────────────────── */
const STATS = [
  { value: 485, suffix: 'B+', prefix: '$', label: 'Lost globally to payment fraud annually', color: '#F59E0B' },
  { value: 68, suffix: '%', prefix: '', label: 'Of APP fraud involves a phone call', color: '#F59E0B' },
  { value: 97, suffix: '%', prefix: '', label: 'Fraud detection accuracy', color: '#00D4AA' },
  { value: 100, suffix: 'ms', prefix: '<', label: 'End-to-end decision latency', color: '#00D4AA' },
];

const PRODUCTS = [
  { icon: '🛡️', color: '#3B82F6', name: 'Transaction Guard', desc: 'Real-time risk scoring on every outbound payment. 35 rules evaluate simultaneously before the customer taps Confirm.' },
  { icon: '🔐', color: '#F59E0B', name: 'OtpGuard', desc: 'Detects OTP entry during active calls. Prevents screen capture, overlays, and remote-access fraud tools.' },
  { icon: '📡', color: '#EF4444', name: 'SIM Swap Defender', desc: 'Detects SIM change, porting events, and device takeover. Freezes high-risk transactions instantly.' },
  { icon: '🕸️', color: '#8B5CF6', name: 'Fraud Ring Intel', desc: 'Neo4j-powered graph linking accounts, devices, wallets, and IPs. One-click mule network blocking.' },
  { icon: '🧠', color: '#10B981', name: 'AI Anomaly Detection', desc: 'ML models trained on African payment patterns. Deepfake voice detection and synthetic identity scoring.' },
  { icon: '📱', color: '#EC4899', name: 'Device Intelligence', desc: 'Device fingerprinting, binding, emulator/RAT detection, root/jailbreak checks. 13-signal SHA-256 fingerprint.' },
  { icon: '⚖️', color: '#06B6D4', name: 'AML & Sanctions', desc: 'Automated screening against global watchlists, PEP databases, and sanctions. Continuous monitoring.' },
  { icon: '📊', color: '#F43F5E', name: 'Fraud Analytics', desc: 'Real-time dashboard with drill-down reports, heatmaps, investigation tools, and AI case summaries.' },
];

const HOW_WORKS = [
  { n: '01', title: 'SDK Embedded', desc: 'Drop-in SDK for iOS, Android, USSD. Zero UI changes. 0.8 MB footprint.', color: '#3B82F6' },
  { n: '02', title: 'Signals Collected', desc: 'Call state, device telemetry, SIM identity, behavioural biometrics — all AES-256 encrypted.', color: '#8B5CF6' },
  { n: '03', title: '35 Rules Evaluate', desc: 'All 35 fraud rules fire in parallel across 5 intelligence layers. P99 latency < 50ms.', color: '#F59E0B' },
  { n: '04', title: 'Decision Returned', desc: 'ALLOW, WARN, or BLOCK — before the payment leaves the account. Zero friction for legit users.', color: '#10B981' },
];

const COMPARISONS = [
  { title: 'Voice Phishing (Vishing)', icon: '📞', color: '#EF4444',
    without: 'Customer is on a scam call transferring funds. Bank detects fraud after money is gone.',
    withPG: 'Active call + unknown recipient + high amount detected. Transaction blocked. Customer warned before loss.' },
  { title: 'SIM Swap Attack', icon: '📡', color: '#F97316',
    without: 'Fraudster ports SIM, resets banking credentials, drains account overnight.',
    withPG: 'SIM swap detected + new device alert + rapid switching. High-risk transaction frozen automatically.' },
  { title: 'AI Deepfake Call', icon: '🤖', color: '#8B5CF6',
    without: 'AI clones CEO voice, instructs urgent transfer. No detection possible.',
    withPG: 'Deepfake shield detects synthetic speech. AI conversation detector flags uniform timing. Transfer blocked.' },
  { title: 'Mule Network', icon: '🕸️', color: '#3B82F6',
    without: 'Stolen funds laundered through dozens of connected accounts. Investigation takes weeks.',
    withPG: 'Fraud graph links shared devices, IPs, and patterns. One-click bulk-block across entire ring.' },
];

const WHO_FOR = [
  { name: 'Banks', icon: '🏦', desc: 'Retail & commercial banks protecting customer deposits' },
  { name: 'Telcos', icon: '📡', desc: 'Mobile operators securing airtime and mobile money' },
  { name: 'Fintechs', icon: '💳', desc: 'Digital-first financial services and neobanks' },
  { name: 'PSPs', icon: '🔄', desc: 'Payment service providers and switches' },
  { name: 'Wallets', icon: '📱', desc: 'Digital wallets and mobile money platforms' },
  { name: 'Insurance', icon: '🛡️', desc: 'Insurers preventing claims fraud and identity theft' },
];

/* ── Nav ───────────────────────────────────────────────────────── */
function Nav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn); }, []);
  useEffect(() => { const fn = () => { if (window.innerWidth > 768) setMenuOpen(false); }; window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);

  const links = [
    { label: 'Products', path: '/products' }, { label: 'How It Works', path: '/how-it-works' },
    { label: 'Architecture', path: '/architecture' }, { label: 'Developers', path: '/developers' },
    { label: 'Sandbox', path: '/sandbox' }, { label: 'About', path: '/about' },
  ];
  const go = (path: string) => { setMenuOpen(false); navigate(path); };
  const navBg = scrolled || menuOpen ? 'rgba(10,22,40,0.95)' : 'transparent';

  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 72, background: navBg, borderBottom: scrolled ? '1px solid rgba(59,130,246,0.15)' : '1px solid transparent', backdropFilter: scrolled ? 'blur(24px)' : 'none', transition: 'all 0.3s' }}>
        <div onClick={() => go('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', zIndex: 201 }}>
          <img src="/payguard-logo.png" alt="PayGuard" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', boxShadow: '0 0 24px rgba(59,130,246,0.4)' }} />
          <div style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: '#F0F6FF', letterSpacing: '-0.02em' }}>PayGuard</div>
        </div>
        <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {links.map(l => (
            <button key={l.path} onClick={() => go(l.path)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#94A3B8', fontFamily: 'Inter, sans-serif', transition: 'color 0.15s, background 0.15s' }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = '#F0F6FF'; (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = '#94A3B8'; (e.target as HTMLButtonElement).style.background = 'none'; }}>{l.label}</button>
          ))}
        </div>
        <div className="nav-desktop-ctas" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => go('/demo')} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, background: 'transparent', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, cursor: 'pointer', color: '#94A3B8', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)'; e.currentTarget.style.color = '#F0F6FF'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.color = '#94A3B8'; }}>Live Demo</button>
          <button onClick={() => go('/dashboard')} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 16px rgba(59,130,246,0.35)', transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>Sign In →</button>
        </div>
        <button className="hamburger-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: 8, zIndex: 201, color: '#F0F6FF' }}>
          <div style={{ width: 22, height: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ display: 'block', height: 2, background: '#F0F6FF', borderRadius: 2, transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none', transition: 'transform 0.25s' }} />
            <span style={{ display: 'block', height: 2, background: '#F0F6FF', borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
            <span style={{ display: 'block', height: 2, background: '#F0F6FF', borderRadius: 2, transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none', transition: 'transform 0.25s' }} />
          </div>
        </button>
      </nav>
      <div className="mobile-menu" style={{ position: 'fixed', top: 72, left: 0, right: 0, zIndex: 199, background: 'rgba(10,22,40,0.97)', backdropFilter: 'blur(24px)', borderBottom: menuOpen ? '1px solid rgba(59,130,246,0.15)' : 'none', display: 'flex', flexDirection: 'column', maxHeight: menuOpen ? '100vh' : 0, overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {links.map(l => (
            <button key={l.path} onClick={() => go(l.path)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', borderRadius: 10, fontSize: 16, fontWeight: 600, color: '#94A3B8', textAlign: 'left', fontFamily: 'Inter, sans-serif', width: '100%' }}>{l.label}</button>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
          <button onClick={() => go('/demo')} style={{ width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14, background: 'transparent', border: '1px solid rgba(59,130,246,0.3)', color: '#94A3B8' }}>Live Demo</button>
          <button onClick={() => go('/dashboard')} style={{ width: '100%', padding: '13px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff', border: 'none' }}>Sign In →</button>
        </div>
      </div>
    </>
  );
}

/* ── Main Landing ──────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [showSales, setShowSales] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', overflowY: 'auto', overflowX: 'hidden', fontFamily: 'Inter, sans-serif', color: '#F0F6FF' }}>
      <Nav />

      {/* ═══ HERO ═══ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 48px 80px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #0B1121 0%, #0A1628 50%, #0D1B2A 100%)' }}>
        {/* Animated gradient mesh + grid texture */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,212,170,0.06) 40%, transparent 70%)', filter: 'blur(60px)', animation: 'meshFloat 12s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.04) 50%, transparent 70%)', filter: 'blur(60px)', animation: 'meshFloat 15s ease-in-out infinite reverse' }} />
          <div style={{ position: 'absolute', top: '20%', left: '30%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 60%)', filter: 'blur(80px)', animation: 'meshFloat 20s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 90% 70% at 50% 40%, black 20%, transparent 65%)', WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 40%, black 20%, transparent 65%)' }} />
          {/* Subtle noise overlay */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.015, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noise%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noise)%27/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />
        </div>

        <div style={{ maxWidth: 900, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: '#3B82F6', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 99, padding: '6px 18px', marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              REAL-TIME FRAUD PREVENTION FOR AFRICA
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif", fontSize: 68, fontWeight: 800, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.03em' }}>
              Stop Fraud Before{' '}
              <span style={{ background: 'linear-gradient(135deg, #3B82F6, #00D4AA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>the Money Moves.</span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p style={{ fontSize: 19, color: '#94A3B8', lineHeight: 1.8, maxWidth: 680, margin: '0 auto 16px', fontWeight: 400 }}>
              Real-time fraud prevention for banks, telcos, fintechs, and payment providers.
              35 rules across social engineering, device intelligence, and{' '}
              <strong style={{ color: '#00D4AA' }}>AI-powered deepfake detection</strong> — all in under 100ms.
            </p>
          </Reveal>

          <Reveal delay={250}>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, maxWidth: 600, margin: '0 auto 48px', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>
              One SDK. Any payment rail. Any app. Any market.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 72, flexWrap: 'wrap' }}>
              <button onClick={() => setShowSales(true)} style={{ padding: '14px 32px', fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 24px rgba(59,130,246,0.4)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(59,130,246,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px rgba(59,130,246,0.4)'; }}>Book a Demo</button>
              <button onClick={() => navigate('/developers')} style={{ padding: '14px 32px', fontSize: 15, fontWeight: 600, background: 'transparent', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.color = '#F0F6FF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.2)'; e.currentTarget.style.color = '#94A3B8'; }}>View SDK Docs →</button>
            </div>
          </Reveal>

          {/* Stats bar — glassmorphism */}
          <Reveal delay={400}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(59,130,246,0.1)' }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', padding: '28px 16px', textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif", letterSpacing: '-0.04em', color: s.color, marginBottom: 8 }}>
                    <Counter target={s.value} suffix={s.suffix} prefix={s.prefix} />
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ TRUSTED BY ═══ */}
      <section style={{ padding: '48px 48px', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#334155', marginBottom: 28 }}>TRUSTED BY LEADING AFRICAN FINANCIAL INSTITUTIONS</div>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', opacity: 0.4 }}>
            {['Tier 1 Bank', 'Digital Wallet', 'Telco MoMo', 'PSP Partner', 'Neobank', 'Insurance'].map((name, i) => (
              <div key={i} style={{ padding: '12px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRODUCT SUITE ═══ */}
      <Reveal>
        <section style={{ padding: '100px 48px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#3B82F6', marginBottom: 12 }}>PRODUCT SUITE</div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif", fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16, color: '#F0F6FF' }}>
              Eight Products. One Platform.
            </h2>
            <p style={{ fontSize: 17, color: '#94A3B8', maxWidth: 600, margin: '0 auto', lineHeight: 1.8 }}>From social engineering and SIM swap to AI deepfakes and mule networks — PayGuard covers every attack vector.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {PRODUCTS.map((p, i) => (
              <Reveal key={i} delay={i * 60}>
                <div onClick={() => navigate('/products')} style={{
                  borderRadius: 16, cursor: 'pointer', overflow: 'hidden', height: '100%',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  padding: '28px 24px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 60px ${p.color}15`; e.currentTarget.style.borderColor = `${p.color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                  <div style={{ fontSize: 32, marginBottom: 14 }}>{p.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#F0F6FF', marginBottom: 10 }}>{p.name}</h3>
                  <p style={{ fontSize: 14, color: '#8899B0', lineHeight: 1.7, margin: 0 }}>{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ═══ HOW IT WORKS — PIPELINE ═══ */}
      <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#3B82F6', marginBottom: 12 }}>HOW IT WORKS</div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif", fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', color: '#F0F6FF' }}>From Signal to Decision in &lt;100ms</h2>
              <p style={{ fontSize: 16, color: '#64748B', maxWidth: 540, margin: '16px auto 0', lineHeight: 1.8 }}>PayGuard evaluates every transaction before the customer taps Confirm. No delays. No friction.</p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 36, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #F59E0B, #10B981)', opacity: 0.3, zIndex: 0 }} />
            {HOW_WORKS.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div style={{ padding: '0 16px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${s.color}12`, border: `2px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 20, fontWeight: 900, fontFamily: "'Plus Jakarta Sans', monospace", color: s.color, boxShadow: `0 0 40px ${s.color}15`, transition: 'all 0.3s' }}>
                    {s.n}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#F0F6FF' }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DEVELOPER TEASER ═══ */}
      <Reveal>
        <section style={{ padding: '100px 48px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#10B981', marginBottom: 12 }}>DEVELOPER EXPERIENCE</div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif", fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16, color: '#F0F6FF', lineHeight: 1.15 }}>
                Integrate in<br /><span style={{ color: '#10B981' }}>4 Lines of Code.</span>
              </h2>
              <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.8, marginBottom: 24 }}>
                Drop our SDK into your Android or iOS app. PayGuard handles signal collection, encryption, API calls, and decision rendering automatically.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['0.8 MB SDK footprint', 'AES-256-GCM encrypted payloads', 'Kotlin + Swift native SDKs', 'Sandbox mode for testing'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: '#64748B', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#10B981', fontSize: 14 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/developers')} style={{ padding: '12px 24px', fontSize: 14, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}>Read the Docs →</button>
            </div>
            <div style={{ background: '#0B1121', borderRadius: 16, border: '1px solid rgba(59,130,246,0.15)', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>
              <div style={{ padding: '12px 18px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ marginLeft: 10, fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>MainActivity.kt</span>
              </div>
              <pre style={{ padding: '24px', margin: 0, fontSize: 13, lineHeight: 1.8, fontFamily: 'JetBrains Mono, monospace', color: '#94A3B8', overflow: 'auto' }}>
{`// Initialize PayGuard SDK
FraudShieldSDK.initialize(
  context = applicationContext,
  apiKey  = "pg_live_your_key",
  userId  = currentUser.id
)

// Evaluate before payment
val decision = FraudShieldSDK
  .evaluateTransaction(payload)

when (decision.action) {
  ALLOW -> processPayment()
  WARN  -> showWarning(decision)
  BLOCK -> blockTransaction(decision)
}`}
              </pre>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ═══ WITHOUT vs WITH ═══ */}
      <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '100px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#3B82F6', marginBottom: 12 }}>REAL-WORLD SCENARIOS</div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif", fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', color: '#F0F6FF' }}>See PayGuard In Action</h2>
              <p style={{ fontSize: 16, color: '#64748B', maxWidth: 520, margin: '16px auto 0', lineHeight: 1.8 }}>From classic vishing to AI deepfake attacks — see how PayGuard transforms each scenario.</p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {COMPARISONS.map((c, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ padding: '24px 24px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 24 }}>{c.icon}</span>
                      <h3 style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#F0F6FF', margin: 0 }}>{c.title}</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#EF4444', marginBottom: 8 }}>⛔ WITHOUT PAYGUARD</div>
                        <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7, margin: 0 }}>{c.without}</p>
                      </div>
                      <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#10B981', marginBottom: 8 }}>🛡️ WITH PAYGUARD</div>
                        <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{c.withPG}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIAL ═══ */}
      <Reveal>
        <section style={{ padding: '100px 48px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 64, color: 'rgba(59,130,246,0.2)', fontFamily: 'Georgia, serif', marginBottom: 24, lineHeight: 0.5 }}>"</div>
          <blockquote style={{ fontSize: 22, fontWeight: 500, color: '#CBD5E1', lineHeight: 1.7, fontStyle: 'italic', margin: '0 auto 24px', maxWidth: 680 }}>
            Within 90 days of deploying PayGuard, we reduced APP fraud losses by 84% and false positive rates dropped from 4.2% to under 0.3%. The on-call detection alone has saved our customers millions.
          </blockquote>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FF' }}>Head of Fraud Operations</div>
          <div style={{ fontSize: 13, color: '#475569' }}>Tier 1 South African Bank</div>
        </section>
      </Reveal>

      {/* ═══ WHO IT'S FOR ═══ */}
      <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#3B82F6', marginBottom: 12 }}>WHO IT'S FOR</div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif", fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', color: '#F0F6FF' }}>Built for Every Payment Provider.</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {WHO_FOR.map((w, i) => (
              <Reveal key={i} delay={i * 60}>
                <div style={{ padding: '28px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s', textAlign: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = ''; }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{w.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F6FF', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{w.name}</div>
                  <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{w.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST BADGES ═══ */}
      <Reveal>
        <section style={{ padding: '64px 48px', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, textAlign: 'center' }}>
            {[
              { icon: '🔒', title: 'SOC 2 Type II', desc: 'Certified compliant' },
              { icon: '🔐', title: 'AES-256-GCM', desc: 'Military-grade encryption' },
              { icon: '⚡', title: '99.99% SLA', desc: 'Platform uptime guarantee' },
              { icon: '🌍', title: 'Africa-First', desc: 'Local infrastructure (af-south-1)' },
            ].map((b, i) => (
              <div key={i} style={{ padding: '24px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{b.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FF', marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{b.title}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: '120px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 600, height: 600, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <Reveal>
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif", fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.1, color: '#F0F6FF' }}>
              Ready to <span style={{ background: 'linear-gradient(135deg, #3B82F6, #00D4AA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Stop Fraud?</span>
            </h2>
            <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.8, marginBottom: 40 }}>35 rules. 5 intelligence layers. Every payment rail. Every fraud vector.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowSales(true)} style={{ padding: '15px 36px', fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 24px rgba(59,130,246,0.4)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(59,130,246,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px rgba(59,130,246,0.4)'; }}>Book a Demo</button>
              <button onClick={() => navigate('/demo')} style={{ padding: '15px 36px', fontSize: 16, fontWeight: 600, background: 'transparent', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.color = '#F0F6FF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.2)'; e.currentTarget.style.color = '#94A3B8'; }}>▶ Live Demo</button>
              <button onClick={() => navigate('/developers')} style={{ padding: '15px 36px', fontSize: 16, fontWeight: 600, background: 'transparent', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.color = '#F0F6FF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.2)'; e.currentTarget.style.color = '#94A3B8'; }}>SDK Docs →</button>
            </div>
          </div>
        </Reveal>
      </section>
      {showSales && <TalkToSalesModal onClose={() => setShowSales(false)} />}

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '64px 48px 40px', background: '#080F1E' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 56 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <img src="/payguard-logo.png" alt="PayGuard" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }} />
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 800, color: '#F0F6FF' }}>PayGuard</div>
              </div>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.8, maxWidth: 260 }}>Real-time fraud prevention for African financial infrastructure. Built by Swifter Technologies.</p>
              <div style={{ marginTop: 16, fontSize: 12, color: '#334155' }}>malcolm@swifter.co.za</div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#1E293B', fontFamily: 'JetBrains Mono, monospace' }}>© 2026 Swifter Technologies</div>
            </div>
            {[
              { title: 'Product', links: [['Products', '/products'], ['Architecture', '/architecture'], ['Interactive Demo', '/demo'], ['Dashboard', '/dashboard']] },
              { title: 'Developers', links: [['SDK Docs', '/developers'], ['API Reference', '/developers#api'], ['Sandbox', '/sandbox']] },
              { title: 'Company', links: [['About Us', '/about'], ['Contact', '/contact'], ['Careers', '#']] },
              { title: 'Legal', links: [['Privacy Policy', '/legal/privacy'], ['Security', '/legal/security'], ['Terms of Service', '/legal/terms'], ['SOC 2 Type II', '/legal/soc2']] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#3B82F6', marginBottom: 16 }}>{col.title.toUpperCase()}</div>
                {col.links.map(([label, path]) => (
                  <div key={label} onClick={() => { if (path !== '#') navigate(path); }} style={{ fontSize: 13, color: '#475569', marginBottom: 10, cursor: 'pointer', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#94A3B8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>{label}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)', marginBottom: 24 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#1E293B' }}>
            <span>© 2026 Swifter Technologies. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 24, color: '#334155' }}>
              <span>🔒 SOC 2 Type II</span>
              <span>🌍 Africa-first infrastructure</span>
              <span>⚡ 99.99% SLA</span>
              <a href="https://swifter.digital" target="_blank" rel="noopener noreferrer" style={{ color: '#334155', textDecoration: 'none' }}>swifter.digital ↗</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
