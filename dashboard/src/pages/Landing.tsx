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

/* ── Data ──────────────────────────────────────────────────────── */
const RULE_CATEGORIES = [
  {
    id: 'social', icon: '/icon-social-engineering.png', color: '#FF1744', title: 'Social Engineering',
    count: 14, range: 'RULE 001–014',
    desc: 'Voice phishing, OTP interception, rushed transactions, clipboard attacks, SIM swap, and behavioural manipulation.',
    rules: [
      { id: '001', name: 'Vishing Call Guard', score: 75, severity: 'CRITICAL' },
      { id: '002', name: 'Contact List Check', score: 40, severity: 'HIGH' },
      { id: '003', name: 'Session Speed Gate', score: 30, severity: 'MEDIUM' },
      { id: '004', name: 'Clipboard Paste Detection', score: 20, severity: 'LOW' },
      { id: '005', name: 'Velocity Anomaly', score: 35, severity: 'HIGH' },
      { id: '006', name: 'SIM Swap Detector', score: 50, severity: 'CRITICAL' },
      { id: '007', name: 'Multi-Account Device', score: 60, severity: 'CRITICAL' },
      { id: '008', name: 'SMS Keyword Scanner', score: 25, severity: 'MEDIUM' },
      { id: '009', name: 'Root/Jailbreak Check', score: 20, severity: 'MEDIUM' },
      { id: '010', name: 'VPN/Proxy Shield', score: 15, severity: 'LOW' },
      { id: '011', name: 'Emulator Detection', score: 40, severity: 'CRITICAL' },
      { id: '012', name: 'Frequent Recipient Changes', score: 25, severity: 'MEDIUM' },
      { id: '013', name: 'Tampered App Detection', score: 50, severity: 'CRITICAL' },
      { id: '014', name: 'OTP Intercept Guard', score: 80, severity: 'CRITICAL' },
    ],
  },
  {
    id: 'device', icon: '/icon-device-binding.png', color: '#7C3AED', title: 'Device Binding',
    count: 6, range: 'RULE 015–020',
    desc: 'Device trust verification, blacklisting, multi-account detection, emulator scanning, and rapid device switching.',
    rules: [
      { id: '015', name: 'New Device Alert', score: 55, severity: 'CRITICAL' },
      { id: '016', name: 'Blacklisted Device', score: 80, severity: 'CRITICAL' },
      { id: '017', name: 'Multi-Account Device Bind', score: 60, severity: 'CRITICAL' },
      { id: '018', name: 'Emulator (Binding Layer)', score: 40, severity: 'CRITICAL' },
      { id: '019', name: 'Device Country Mismatch', score: 35, severity: 'HIGH' },
      { id: '020', name: 'Rapid Device Switching', score: 45, severity: 'CRITICAL' },
    ],
  },
  {
    id: 'enterprise', icon: '/icon-enterprise-fraud.png', color: '#0EA5E9', title: 'Enterprise Fraud',
    count: 6, range: 'RULE 021–026',
    desc: 'Geolocation anomalies, velocity structuring, beneficiary network analysis, time-of-day patterns, and biometrics.',
    rules: [
      { id: '021', name: 'Geolocation Anomaly', score: 35, severity: 'HIGH' },
      { id: '022', name: 'Velocity / Structuring', score: 45, severity: 'CRITICAL' },
      { id: '023', name: 'Beneficiary Network Risk', score: 55, severity: 'CRITICAL' },
      { id: '024', name: 'Time-of-Day Anomaly', score: 20, severity: 'LOW' },
      { id: '025', name: 'Cooling-Off Period', score: 30, severity: 'MEDIUM' },
      { id: '026', name: 'Behavioural Biometrics', score: 25, severity: 'MEDIUM' },
    ],
  },
  {
    id: 'ip', icon: '/icon-ip-intelligence.png', color: '#F59E0B', title: 'IP Intelligence',
    count: 3, range: 'RULE 027–029',
    desc: 'IP-to-SIM country correlation, datacenter/hosting detection, and IP-vs-GPS distance analysis.',
    rules: [
      { id: '027', name: 'IP Country Mismatch', score: 20, severity: 'MEDIUM' },
      { id: '028', name: 'Hosting/Datacenter IP', score: 15, severity: 'LOW' },
      { id: '029', name: 'IP vs Device GPS Distance', score: 10, severity: 'LOW' },
    ],
  },
  {
    id: 'ai', icon: '/icon-ai-fraud.png', color: '#10B981', title: 'AI Fraud Detection',
    count: 6, range: 'RULE 030–035',
    desc: 'Voice deepfakes, liveness spoofing, synthetic identities, AI-scripted calls, remote access tools, and document forgery.',
    rules: [
      { id: '030', name: 'Voice Deepfake Shield', score: 70, severity: 'CRITICAL' },
      { id: '031', name: 'Liveness Spoofing Guard', score: 85, severity: 'CRITICAL' },
      { id: '032', name: 'Synthetic Identity Detector', score: 65, severity: 'CRITICAL' },
      { id: '033', name: 'AI Conversation Detector', score: 65, severity: 'CRITICAL' },
      { id: '034', name: 'Remote Access Tool Blocker', score: 85, severity: 'CRITICAL' },
      { id: '035', name: 'Document Forgery Scanner', score: 80, severity: 'CRITICAL' },
    ],
  },
];

const STATS = [
  { value: 485, suffix: 'B+', prefix: '$', label: 'Lost globally to payment fraud annually', color: '#F85149' },
  { value: 68, suffix: '%', prefix: '', label: 'Of authorised push payment fraud involves a phone call', color: '#FF1744' },
  { value: 35, suffix: '', prefix: '', label: 'Fraud detection rules evaluated in parallel', color: '#10B981' },
  { value: 100, suffix: 'ms', prefix: '<', label: 'End-to-end decision latency', color: '#0EA5E9' },
];

const PRODUCTS = [
  { icon: '💸', color: '#FF1744', name: 'Transaction Guard', desc: 'Real-time risk scoring on every outbound payment. 35 rules evaluate simultaneously before the customer taps Confirm.' },
  { icon: '🔑', color: '#FF4455', name: 'OTP Guard', desc: 'Detects OTP entry during active calls. Prevents screen capture, overlays, and remote-access fraud tools.' },
  { icon: '📡', color: '#C62828', name: 'SIM Swap Defender', desc: 'Detects SIM change, porting events, and device takeover. Freezes high-risk transactions instantly.' },
  { icon: '🕸️', color: '#F97316', name: 'Fraud Ring Intelligence', desc: 'Graph-based detection linking accounts, devices, wallets, and IPs. One-click mule network blocking.' },
  { icon: '🤖', color: '#10B981', name: 'AI Fraud Shield', desc: 'Deepfake voice detection, liveness spoofing guard, synthetic identity detector, and AI conversation analysis.' },
  { icon: '📱', color: '#7C3AED', name: 'Device Intelligence', desc: 'Device fingerprinting, binding, emulator detection, remote access tool blocking, and country mismatch.' },
  { icon: '🛡️', color: '#0EA5E9', name: 'AML & Sanctions', desc: 'Automated screening against global watchlists, PEP databases, and sanctions. Continuous monitoring.' },
  { icon: '📊', color: '#EC4899', name: 'Analytics Dashboard', desc: 'Live fraud monitoring, rule tuning, investigation tools, heatmaps, and drill-down reports.' },
];

const HOW_WORKS = [
  { n: '01', title: 'SDK Embedded', desc: 'Drop the PayGuard SDK into your mobile app. iOS, Android, USSD. No UI changes.' },
  { n: '02', title: 'Signals Stream', desc: 'Call state, paste events, device telemetry, biometrics, SIM identity — all encrypted.' },
  { n: '03', title: '35 Rules Fire', desc: 'All 35 fraud rules evaluate simultaneously across 5 intelligence layers in <50ms.' },
  { n: '04', title: 'Decision Returned', desc: 'ALLOW, WARN, or BLOCK — before the payment leaves the account.' },
  { n: '05', title: 'Graph Learns', desc: 'Every event feeds the intelligence engine. Fraud rings detected in seconds.' },
];

const COMPARISONS = [
  { title: 'Voice Phishing (Vishing)', icon: '📞', rules: 'RULE_001, 002, 014',
    without: 'Customer is on a scam call while transferring funds. Bank detects fraud after money is gone.',
    withPG: 'Active call + unknown recipient + high amount detected. Transaction blocked. Customer warned before loss.' },
  { title: 'AI Deepfake Call', icon: '🤖', rules: 'RULE_030, 033, 034',
    without: 'AI clones CEO voice, calls finance team, instructs urgent transfer. No detection possible.',
    withPG: 'Voice deepfake shield detects synthetic speech markers. AI conversation detector flags uniform timing. Transfer blocked.' },
  { title: 'SIM Swap Attack', icon: '📡', rules: 'RULE_006, 015, 020',
    without: 'Fraudster ports SIM, resets banking credentials, drains account overnight.',
    withPG: 'SIM swap detected + new device alert + rapid switching. High-risk transaction frozen automatically.' },
  { title: 'Synthetic Identity', icon: '🎭', rules: 'RULE_032, 035, 023',
    without: 'Fake identity assembled from stolen data opens accounts and launders money.',
    withPG: 'Synthetic identity detector flags SIM/email/graph anomalies. AI-generated documents detected. Account blocked.' },
];

const WHO_FOR = ['Banks', 'Telcos', 'Fintechs', 'Wallet Providers', 'PSPs', 'Neobanks', 'Switches', 'Payment Processors'];
const RAILS = ['Mobile banking apps', 'Wallets & mobile money', 'Card payments', 'Instant EFT / RTP', 'USSD & server-side', 'Cross-border payments'];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#F59E0B',
  LOW: '#22C55E',
};

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
  const navBg = scrolled || menuOpen ? 'rgba(0,0,0,0.95)' : 'transparent';

  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 68, background: navBg, borderBottom: (scrolled || menuOpen) ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent', backdropFilter: (scrolled || menuOpen) ? 'blur(24px)' : 'none', transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s' }}>
        <div onClick={() => go('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', zIndex: 201 }}>
          <img src="/payguard-logo.png" alt="PayGuard" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', boxShadow: '0 0 30px rgba(255,23,68,0.65), 0 0 60px rgba(255,23,68,0.2), 0 4px 16px rgba(0,0,0,0.6)' }} />
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 800, color: '#F0F6FF', letterSpacing: '-0.02em' }}>PayGuard</div>
        </div>
        <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(l => (
            <button key={l.path} onClick={() => go(l.path)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#94A3B8', fontFamily: 'Inter, sans-serif', transition: 'color 0.15s, background 0.15s' }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = '#F0F6FF'; (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = '#94A3B8'; (e.target as HTMLButtonElement).style.background = 'none'; }}>{l.label}</button>
          ))}
        </div>
        <div className="nav-desktop-ctas" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => go('/sandbox')} className="w-btn-secondary" style={{ padding: '9px 20px', fontSize: 13 }}>Try Sandbox</button>
          <button onClick={() => go('/demo')} className="w-btn-secondary" style={{ padding: '9px 20px', fontSize: 13 }}>▶ Live Demo</button>
          <button onClick={() => go('/dashboard')} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#FF1744,#0369A1)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 16px #FF174440', transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}>🔐 Sign In</button>
        </div>
        <button className="hamburger-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: 8, zIndex: 201, color: '#F0F6FF' }}>
          <div style={{ width: 22, height: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ display: 'block', height: 2, background: '#F0F6FF', borderRadius: 2, transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none', transition: 'transform 0.25s ease' }} />
            <span style={{ display: 'block', height: 2, background: '#F0F6FF', borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s ease' }} />
            <span style={{ display: 'block', height: 2, background: '#F0F6FF', borderRadius: 2, transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none', transition: 'transform 0.25s ease' }} />
          </div>
        </button>
      </nav>
      <div className="mobile-menu" style={{ position: 'fixed', top: 68, left: 0, right: 0, zIndex: 199, background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(24px)', borderBottom: menuOpen ? '1px solid rgba(255,255,255,0.08)' : 'none', display: 'flex', flexDirection: 'column', maxHeight: menuOpen ? '100vh' : 0, overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {links.map(l => (
            <button key={l.path} onClick={() => go(l.path)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', borderRadius: 10, fontSize: 16, fontWeight: 600, color: '#94A3B8', textAlign: 'left', fontFamily: 'Inter, sans-serif', width: '100%' }}>{l.label}</button>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
          <button onClick={() => go('/demo')} className="w-btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}>▶ Live Demo</button>
          <button onClick={() => go('/dashboard')} style={{ width: '100%', padding: '13px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg,#FF1744,#0369A1)', color: '#fff', border: 'none' }}>🔐 Sign In</button>
        </div>
      </div>
    </>
  );
}

/* ── Main Landing ──────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [showSales, setShowSales] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: '#050505', overflowY: 'auto', overflowX: 'hidden', fontFamily: 'Inter, sans-serif', color: '#F0F6FF' }}>
      <Nav />

      {/* ═══ HERO ═══ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 48px 80px', position: 'relative', overflow: 'hidden', background: '#000' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,23,68,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,23,68,0.08) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 130% 90% at 50% 40%, black 10%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 130% 90% at 50% 40%, black 10%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', width: 900, height: 900, transform: 'translate(-50%, -50%)', zIndex: 0, pointerEvents: 'none' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '1px solid rgba(255,23,68,0.15)', position: 'relative' }}>
            {[300, 500, 700].map(s => <div key={s} style={{ position: 'absolute', top: '50%', left: '50%', width: s, height: s, transform: 'translate(-50%,-50%)', borderRadius: '50%', border: `1px solid rgba(255,23,68,${s === 300 ? 0.2 : s === 500 ? 0.12 : 0.08})` }} />)}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', animation: 'radarSweep 5s linear infinite', background: 'conic-gradient(from 0deg, transparent 0deg, transparent 320deg, rgba(255,23,68,0.08) 340deg, rgba(255,23,68,0.25) 355deg, rgba(255,23,68,0.4) 360deg)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 10, height: 10, borderRadius: '50%', transform: 'translate(-50%,-50%)', background: '#FF1744', boxShadow: '0 0 20px rgba(255,23,68,0.8), 0 0 50px rgba(255,23,68,0.4)' }} />
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, zIndex: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,23,68,0.4) 20%, rgba(255,23,68,0.8) 50%, rgba(255,23,68,0.4) 80%, transparent 100%)', boxShadow: '0 0 30px 4px rgba(255,23,68,0.3)', animation: 'scanLine 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', width: 1000, height: 600, background: 'radial-gradient(ellipse, rgba(255,23,68,0.12) 0%, rgba(255,23,68,0.04) 40%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 960, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Rotating 3D Hero Image */}
          <div className="fade-in-up delay-1" style={{ marginBottom: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,23,68,0.25) 0%, rgba(255,23,68,0.08) 40%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
            <img
              src="/icon-social-engineering.png"
              alt="PayGuard Fraud Shield"
              style={{
                width: 320, height: 320, borderRadius: 40, objectFit: 'cover',
                animation: 'hero3dFloat 8s ease-in-out infinite',
                filter: 'drop-shadow(0 0 60px rgba(255,23,68,0.6)) drop-shadow(0 0 120px rgba(255,23,68,0.25))',
                position: 'relative',
              }}
            />
          </div>

          <div className="fade-in-up delay-1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: '#FF4455', background: 'rgba(255,68,85,0.08)', border: '1px solid rgba(255,68,85,0.2)', borderRadius: 99, padding: '6px 16px', marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4455', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            35 FRAUD RULES · 5 INTELLIGENCE LAYERS · &lt;100ms DECISIONS
          </div>
          <h1 className="fade-in-up delay-2 w-heading" style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.05, marginBottom: 28, letterSpacing: '-0.03em' }}>
            <span style={{ color: '#FFFFFF' }}>Stop Fraud</span><br />
            <span style={{ color: '#F0F6FF' }}>Before the</span>
            <span style={{ background: 'linear-gradient(135deg, #FF1744 0%, #FF5252 50%, #FF5722 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> Money Moves.</span>
          </h1>
          <p className="fade-in-up delay-3" style={{ fontSize: 19, color: '#94A3B8', lineHeight: 1.8, maxWidth: 720, margin: '0 auto 16px', fontWeight: 400 }}>
            Real-time fraud prevention for banks, telcos, fintechs, and payment providers. 35 rules across social engineering, device binding, enterprise fraud, IP intelligence, and <strong style={{ color: '#10B981' }}>AI-powered deepfake detection</strong> — all in under 100ms.
          </p>
          <p className="fade-in-up delay-3" style={{ fontSize: 15, color: '#475569', lineHeight: 1.8, maxWidth: 700, margin: '0 auto 48px', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>
            One SDK. Any payment rail. Any app. Any market.
          </p>
          <div className="fade-in-up delay-4" style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 64, flexWrap: 'wrap' }}>
            <button className="w-btn-primary" onClick={() => setShowSales(true)}>🤝 Talk to Sales</button>
            <button className="w-btn-secondary" onClick={() => navigate('/demo')}>▶ Live Demo</button>
            <button className="w-btn-secondary" onClick={() => navigate('/developers')}>View SDK Docs →</button>
          </div>
          {showSales && <TalkToSalesModal onClose={() => setShowSales(false)} />}

          {/* Stats strip inline with hero */}
          <div className="fade-in-up delay-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, borderRadius: 20, overflow: 'hidden' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', padding: '28px 16px', borderTop: `2px solid ${s.color}40`, textAlign: 'center', transition: 'background 0.2s' }}>
                <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'Outfit', letterSpacing: '-0.04em', color: s.color, marginBottom: 8 }}>
                  <Counter target={s.value} suffix={s.suffix} prefix={s.prefix} />
                </div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WORKS ACROSS ═══ */}
      <section style={{ padding: '48px 48px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#475569', marginBottom: 20 }}>WORKS ACROSS EVERY PAYMENT RAIL</div>
          <div style={{ display: 'flex', gap: 0, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            {RAILS.map((r, i) => (
              <div key={r} style={{ padding: '10px 28px', fontSize: 14, fontWeight: 600, color: '#64748B', transition: 'color 0.2s', cursor: 'default', borderRight: i < RAILS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.color = '#F0F6FF'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.color = '#64748B'}>{r}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 35 RULES — THE CORE SECTION ═══ */}
      <section style={{ padding: '96px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="section-label">Fraud Detection Rules</div>
          <h2 className="w-heading" style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16 }}>
            35 Rules. 5 Intelligence Layers.<br />One Decision Engine.
          </h2>
          <p style={{ fontSize: 17, color: '#94A3B8', maxWidth: 680, margin: '0 auto', lineHeight: 1.8 }}>
            Every transaction is evaluated against 35 fraud detection rules across social engineering, device binding, enterprise fraud, IP intelligence, and AI-powered deepfake detection. All rules fire simultaneously. Decision returned in under 50ms.
          </p>
        </div>

        {/* Category cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 56 }}>
          {RULE_CATEGORIES.map(cat => {
            const isExpanded = expandedCat === cat.id;
            return (
              <div key={cat.id} style={{
                borderRadius: 24, overflow: 'hidden', position: 'relative',
                border: `1px solid ${isExpanded ? cat.color + '50' : 'rgba(255,255,255,0.08)'}`,
                background: isExpanded
                  ? `linear-gradient(168deg, ${cat.color}0C 0%, #080b15 40%, #060812 100%)`
                  : 'linear-gradient(168deg, rgba(255,255,255,0.03) 0%, rgba(5,5,10,0.95) 100%)',
                transition: 'border-color 0.4s, background 0.4s, box-shadow 0.4s, transform 0.3s',
                boxShadow: isExpanded
                  ? `0 12px 56px ${cat.color}20, 0 0 0 1px ${cat.color}15, inset 0 1px 0 rgba(255,255,255,0.06)`
                  : '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
              }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.borderColor = `${cat.color}30`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = ''; }}
              >
                {/* Top gradient accent line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${cat.color}80, ${cat.color}, ${cat.color}80, transparent)`, opacity: isExpanded ? 1 : 0.4, transition: 'opacity 0.4s' }} />

                {/* Category header */}
                <div
                  onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '72px 1fr auto',
                    alignItems: 'center', gap: 24, padding: '28px 36px',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                >
                  {/* 3D Icon */}
                  <div style={{ position: 'relative', width: 72, height: 72 }}>
                    <div style={{ position: 'absolute', inset: -6, borderRadius: 22, background: `radial-gradient(circle, ${cat.color}20, transparent 70%)`, filter: 'blur(10px)' }} />
                    <div style={{
                      position: 'relative', width: 72, height: 72, borderRadius: 20,
                      background: `linear-gradient(145deg, ${cat.color}15, rgba(0,0,0,0.4))`,
                      border: `1px solid ${cat.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 8px 32px ${cat.color}25, inset 0 1px 0 rgba(255,255,255,0.1)`,
                      overflow: 'hidden',
                    }}>
                      <img src={cat.icon} alt={cat.title} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 12, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
                    </div>
                  </div>

                  {/* Text content */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Outfit', color: '#F0F6FF', margin: 0, letterSpacing: '-0.01em' }}>{cat.title}</h3>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#fff', background: `linear-gradient(135deg, ${cat.color}, ${cat.color}CC)`, padding: '4px 12px', borderRadius: 8, boxShadow: `0 2px 12px ${cat.color}40` }}>{cat.count} RULES</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#536380', fontFamily: 'JetBrains Mono' }}>{cat.range}</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#8296B0', margin: 0, lineHeight: 1.7 }}>{cat.desc}</p>
                  </div>

                  {/* Animated expand button */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: isExpanded ? `${cat.color}20` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isExpanded ? cat.color + '40' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      boxShadow: isExpanded ? `0 4px 20px ${cat.color}30, 0 0 0 1px ${cat.color}20` : '0 2px 8px rgba(0,0,0,0.2)',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? cat.color : '#64748B'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1), stroke 0.3s' }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: isExpanded ? cat.color : '#475569', transition: 'color 0.3s' }}>{isExpanded ? 'COLLAPSE' : 'EXPAND'}</span>
                  </div>
                </div>

                {/* Expanded rules grid */}
                <div style={{
                  maxHeight: isExpanded ? '600px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.5s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <div style={{ height: 1, margin: '0 36px', background: `linear-gradient(90deg, transparent, ${cat.color}30, transparent)` }} />
                  <div style={{ padding: '20px 36px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                    {cat.rules.map(rule => (
                      <div key={rule.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                        border: '1px solid rgba(255,255,255,0.07)',
                        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                        backdropFilter: 'blur(8px)',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${cat.color}12, ${cat.color}04)`; e.currentTarget.style.borderColor = `${cat.color}30`; e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${cat.color}15`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                      >
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 800, color: cat.color, minWidth: 30, padding: '2px 0', borderRight: `2px solid ${cat.color}30`, paddingRight: 10 }}>{rule.id}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#D0DCE8', flex: 1 }}>{rule.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: `${SEVERITY_COLORS[rule.severity]}18`, color: SEVERITY_COLORS[rule.severity], letterSpacing: '0.06em', border: `1px solid ${SEVERITY_COLORS[rule.severity]}25` }}>{rule.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total rules count */}
        <div style={{ textAlign: 'center', marginTop: 48, padding: '32px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(255,23,68,0.06), rgba(16,245,160,0.04))', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 48, fontWeight: 900, fontFamily: 'Outfit', background: 'linear-gradient(135deg, #FF1744, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8 }}>35</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F0F6FF', marginBottom: 4 }}>Total Fraud Detection Rules</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>14 Social Engineering · 6 Device Binding · 6 Enterprise Fraud · 3 IP Intelligence · 6 AI Fraud Detection</div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '96px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="section-label">How It Works</div>
            <h2 className="w-heading" style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em' }}>From Signal to Decision in &lt;100ms</h2>
            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 540, margin: '16px auto 0' }}>PayGuard evaluates every transaction before the customer taps Confirm. No delays. No friction.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 32, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, rgba(255,23,68,0.3), rgba(16,181,129,0.3))', zIndex: 0 }} />
            {HOW_WORKS.map((s, i) => (
              <div key={i} style={{ padding: '0 16px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${['#FF1744', '#7C3AED', '#0EA5E9', '#F59E0B', '#10B981'][i]}20, ${['#FF1744', '#7C3AED', '#0EA5E9', '#F59E0B', '#10B981'][i]}08)`, border: `1px solid ${['#FF1744', '#7C3AED', '#0EA5E9', '#F59E0B', '#10B981'][i]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 900, fontFamily: 'Outfit', color: ['#FF1744', '#7C3AED', '#0EA5E9', '#F59E0B', '#10B981'][i], boxShadow: `0 0 30px ${['#FF1744', '#7C3AED', '#0EA5E9', '#F59E0B', '#10B981'][i]}15` }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, fontFamily: 'Outfit', color: '#F0F6FF' }}>{s.title}</h3>
                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRODUCT SUITE ═══ */}
      <section style={{ padding: '96px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="section-label">Product Suite</div>
          <h2 className="w-heading" style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>Eight Products. One Platform.</h2>
          <p style={{ fontSize: 17, color: '#94A3B8', maxWidth: 640, margin: '0 auto' }}>From social engineering and SIM swap to AI deepfakes and mule networks — PayGuard covers every attack vector.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {PRODUCTS.map((p, i) => (
            <div key={i} onClick={() => navigate('/products')} style={{
              borderRadius: 20, cursor: 'pointer', overflow: 'hidden',
              background: `linear-gradient(168deg, ${p.color}06 0%, #0a0d1a 100%)`,
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '28px 24px', transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 24px 64px ${p.color}20`; e.currentTarget.style.borderColor = `${p.color}30`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{p.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Outfit', color: '#F0F6FF', marginBottom: 10 }}>{p.name}</h3>
              <p style={{ fontSize: 13, color: '#7B8BA5', lineHeight: 1.7, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ WITHOUT vs WITH ═══ */}
      <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '96px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="section-label">Real-World Scenarios</div>
            <h2 className="w-heading" style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em' }}>See PayGuard In Action</h2>
            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 560, margin: '16px auto 0' }}>From classic vishing to AI deepfake attacks — see how PayGuard transforms each scenario.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {COMPARISONS.map((c, i) => (
              <div key={i} style={{
                borderRadius: 20, overflow: 'hidden',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03), #0a0d1a)',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ padding: '28px 28px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <span style={{ fontSize: 28 }}>{c.icon}</span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Outfit', color: '#F0F6FF', margin: 0 }}>{c.title}</h3>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', fontFamily: 'JetBrains Mono', marginBottom: 20 }}>Rules: {c.rules}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#EF4444', marginBottom: 10 }}>⛔ WITHOUT PAYGUARD</div>
                      <p style={{ fontSize: 12, color: '#8892A8', lineHeight: 1.7, margin: 0 }}>{c.without}</p>
                    </div>
                    <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(16,245,160,0.04)', border: '1px solid rgba(16,245,160,0.12)' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#10F5A0', marginBottom: 10 }}>🛡️ WITH PAYGUARD</div>
                      <p style={{ fontSize: 12, color: '#C8D6E5', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{c.withPG}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHO IT'S FOR ═══ */}
      <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <div className="section-label">Who It's For</div>
        <h2 className="w-heading" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 32 }}>If you move money in real time — you need PayGuard.</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
          {WHO_FOR.map((w, i) => (
            <div key={w} style={{ padding: '14px 32px', fontSize: 17, fontWeight: 800, color: '#1E293B', fontFamily: 'Outfit', letterSpacing: '-0.02em', transition: 'color 0.2s', cursor: 'default', borderRight: i < WHO_FOR.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.color = '#F0F6FF'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.color = '#1E293B'}>{w}</div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: '120px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 600, height: 600, background: 'rgba(255,23,68,0.08)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', '--orb-dur': '12s' } as React.CSSProperties} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
          <div className="section-label">Get Started</div>
          <h2 className="w-heading" style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 20, lineHeight: 1.1 }}>
            <span className="grad-blue-green">Stop Fraud Before</span><br />It Happens.
          </h2>
          <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.8, marginBottom: 12 }}>35 rules. 5 intelligence layers. Every payment rail. Every fraud vector.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40 }}>
            <button className="w-btn-primary" onClick={() => setShowSales(true)} style={{ fontSize: 16, padding: '15px 36px' }}>🤝 Talk to Sales</button>
            <button className="w-btn-secondary" onClick={() => navigate('/demo')} style={{ fontSize: 16, padding: '15px 36px' }}>▶ Live Demo</button>
            <button className="w-btn-secondary" onClick={() => navigate('/developers')} style={{ fontSize: 16, padding: '15px 36px' }}>SDK Docs →</button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '64px 48px 40px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 56 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <img src="/payguard-logo.png" alt="PayGuard" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', boxShadow: '0 0 20px rgba(255,23,68,0.5), 0 4px 12px rgba(0,0,0,0.5)' }} />
                <div style={{ fontFamily: 'Outfit', fontSize: 15, fontWeight: 800, color: '#F0F6FF' }}>PayGuard</div>
              </div>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.8, maxWidth: 280, fontWeight: 500 }}>Real-Time Fraud Prevention. 35 Rules. 5 Intelligence Layers. &lt;100ms Decisions.</p>
              <div style={{ marginTop: 16, fontSize: 11, color: '#334155', fontFamily: 'JetBrains Mono' }}>© 2026 Swifter</div>
            </div>
            {[
              { title: 'Product', links: [['Products', '/products'], ['Architecture', '/architecture'], ['Interactive Demo', '/demo'], ['Dashboard', '/dashboard']] },
              { title: 'Developers', links: [['SDK Docs', '/developers'], ['API Reference', '/developers#api'], ['Sandbox', '/sandbox']] },
              { title: 'Company', links: [['About Us', '/about'], ['Mission', '/about#mission'], ['Contact', '/about#contact']] },
              { title: 'Legal', links: [['Privacy Policy', '/legal/privacy'], ['Security', '/legal/security'], ['Terms of Service', '/legal/terms'], ['SOC 2 Type II', '/legal/soc2']] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#FF1744', textTransform: 'uppercase', marginBottom: 16 }}>{col.title}</div>
                {col.links.map(([label, path]) => (
                  <div key={label} onClick={() => { if (path !== '#') navigate(path); }} style={{ fontSize: 13, color: '#475569', marginBottom: 10, cursor: 'pointer', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.color = '#94A3B8'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.color = '#475569'}>{label}</div>
                ))}
              </div>
            ))}
          </div>
          <div className="divider-glow" style={{ marginBottom: 24 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#334155' }}>
            <span>© 2026 Swifter Technologies. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <span>🔒 SOC 2 Type II</span>
              <span>🌍 Africa-first infrastructure</span>
              <span>⚡ 99.99% SLA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
