import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebNav, { WebFooter } from '../components/WebNav';
import TalkToSalesModal from '../components/TalkToSalesModal';

const PRODUCTS = [
  {
    id: 'transaction-guard', icon: '\uD83D\uDEE1\uFE0F', color: '#3B82F6', glyph: '01',
    name: 'Transaction Guard', tag: 'Core \u2022 Always-On',
    tagline: 'Block fraud at the point of payment.',
    desc: 'The foundational layer. Transaction Guard evaluates every send-money event against 35 fraud rules in parallel. Verdicts (ALLOW, WARN, BLOCK) return before the customer taps Confirm.',
    signals: [
      { name: 'Call-state monitor', desc: 'Detects live phone calls during payment' },
      { name: 'Paste detector', desc: 'Flags clipboard-pasted amounts and account numbers' },
      { name: 'Keystroke cadence', desc: 'Detects typing anomalies vs. coached dictation' },
      { name: 'Velocity checks', desc: 'Frequency and amount thresholds per window' },
    ],
  },
  {
    id: 'otpguard', icon: '\uD83D\uDD10', color: '#FF9100', glyph: '02',
    name: 'OtpGuard', tag: 'OTP \u2022 Screen Lock',
    tagline: 'Kill OTP interception at the source.',
    desc: 'OtpGuard prevents screen-overlay attacks and OTP theft by locking the display during sensitive flows. If a suspicious app attempts to read or capture the OTP, the transaction is halted.',
    signals: [
      { name: 'Screen overlay detector', desc: 'Blocks draw-over-other-apps during OTP entry' },
      { name: 'Accessibility abuse check', desc: 'Detects accessibility services reading OTP fields' },
      { name: 'SMS auto-read protection', desc: 'Prevents malware from auto-reading SMS OTPs' },
      { name: 'Clipboard wipe', desc: 'Clears clipboard after OTP paste within 10 seconds' },
    ],
  },
  {
    id: 'sim-swap', icon: '\uD83D\uDCF1', color: '#00BCD4', glyph: '03',
    name: 'SIM Swap Defender', tag: 'Telco \u2022 Identity',
    tagline: 'Detect SIM swaps before they drain accounts.',
    desc: 'SIM Swap Defender queries mobile operator HLR databases in real-time. If a SIM change is detected within a configurable window (default: 48 hours), outbound transactions are frozen automatically.',
    signals: [
      { name: 'HLR/SS7 lookup', desc: 'Real-time SIM status from mobile operator' },
      { name: 'IMSI change detection', desc: 'Flags new IMSI within 48h threshold' },
      { name: 'Carrier mismatch', desc: 'Detects SIM port to different carrier' },
      { name: 'Geo-velocity check', desc: 'Flags SIM appearing in new location post-swap' },
    ],
  },
  {
    id: 'fraud-graph', icon: '\uD83D\uDD78\uFE0F', color: '#7C4DFF', glyph: '04',
    name: 'Fraud Ring Intel', tag: 'Neo4j \u2022 Graph',
    tagline: 'Uncover hidden networks of connected fraud.',
    desc: 'A Neo4j-powered fraud graph links accounts, devices, wallets, and IP addresses. Cypher queries detect mule networks, shared-device rings, and coordinated attack patterns automatically.',
    signals: [
      { name: 'Device-to-account links', desc: 'Maps which devices access which accounts' },
      { name: 'Wallet clustering', desc: 'Groups wallets receiving funds from flagged sources' },
      { name: 'Ring detection', desc: 'Cypher queries find circular payment chains' },
      { name: 'Bulk block', desc: 'One-click freeze across entire connected network' },
    ],
  },
  {
    id: 'rules-engine', icon: '\u2699\uFE0F', color: '#BC8CFF', glyph: '05',
    name: 'Live Rules Engine', tag: 'Ops \u2022 Control',
    tagline: 'Tune fraud rules in real-time. No deploys.',
    desc: 'The Live Rules Engine lets analysts create, modify, and hot-deploy fraud rules through a visual dashboard. Changes propagate via Redis pub/sub in under 2 seconds. No downtime, no code changes.',
    signals: [
      { name: 'Rule builder UI', desc: 'Drag-and-drop conditions and thresholds' },
      { name: 'Hot deploy', desc: 'Rules go live via Redis pub/sub, no restart needed' },
      { name: 'A/B testing', desc: 'Shadow-mode rules for safe evaluation' },
      { name: 'Rule enable/disable', desc: 'Toggle rules per tenant in real-time' },
    ],
  },
  {
    id: 'device-trust', icon: '\uD83D\uDD12', color: '#06B6D4', glyph: '06',
    name: 'Device Trust & Binding', tag: 'Hardware \u2022 Identity',
    tagline: 'One device, one identity. Always verified.',
    desc: 'Device Trust generates a 64-byte SHA-256 fingerprint from 13 hardware and OS signals. Trusted devices are bound to accounts. Blacklisted devices are blocked at the perimeter. Token rotation uses a 6-hour sliding window.',
    signals: [
      { name: 'Hardware fingerprint', desc: '13-signal SHA-256 (model, OS, install ID, etc.)' },
      { name: 'Root/jailbreak detection', desc: 'Blocks compromised devices' },
      { name: 'Biometric binding', desc: 'Face ID / Touch ID verification' },
      { name: 'Token rotation', desc: '6-hour sliding window for session tokens' },
    ],
  },
];

const COMPARE = [
  { feature: 'Social engineering detection',      fs: true,  legacy: false },
  { feature: 'Real-time call state monitoring',   fs: true,  legacy: false },
  { feature: 'OTP screen blocking (OtpGuard)',    fs: true,  legacy: false },
  { feature: 'SIM swap defence',                  fs: true,  legacy: 'Partial' },
  { feature: 'Fraud ring graph engine',            fs: true,  legacy: false },
  { feature: 'Device Trust & Binding (6 rules)',   fs: true,  legacy: false },
  { feature: 'Token rotation (sliding window)',    fs: true,  legacy: false },
  { feature: 'Zero-code rule updates',             fs: true,  legacy: false },
  { feature: 'Sub-100ms decision latency',         fs: true,  legacy: '300ms+' },
  { feature: 'Native Android + iOS SDK',           fs: true,  legacy: false },
  { feature: 'Global infra + regional hosting',   fs: true,  legacy: false },
  { feature: 'False positive rate',                fs: '< 0.1%', legacy: '2-5%' },
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [activeProduct, setActiveProduct] = useState(PRODUCTS[0].id);
  const [showSales, setShowSales] = useState(false);
  const product = PRODUCTS.find(p => p.id === activeProduct) || PRODUCTS[0];

  return (
    <div style={{ minHeight: '100vh', background: '#0B1121', fontFamily: 'Inter, sans-serif', color: '#F0F6FF', overflowX: 'hidden' }}>
      <WebNav />

      {/* Hero */}
      <section style={{ padding: '140px 48px 64px', textAlign: 'center' }}>
        <div className="section-label">Product Suite</div>
        <h1 className="w-heading" style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
          <span className="grad-white-blue">Six Modules.</span><br />
          <span style={{ color: '#F0F6FF' }}>One Unified Defence.</span>
        </h1>
        <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.8 }}>
          Each module works independently or together as a complete fraud management stack. Deploy what you need today, add more as you grow.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button className="w-btn-primary" onClick={() => navigate('/developers')}>View SDK Docs</button>
          <button className="w-btn-secondary" onClick={() => navigate('/sandbox')}>Try Sandbox</button>
        </div>
      </section>

      {/* Product Tabs */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 48, flexWrap: 'wrap' }}>
          {PRODUCTS.map(p => (
            <button key={p.id}
              onClick={() => setActiveProduct(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                border: activeProduct === p.id ? `1px solid ${p.color}` : '1px solid rgba(255,255,255,0.08)',
                background: activeProduct === p.id ? `${p.color}15` : 'rgba(255,255,255,0.03)',
                color: activeProduct === p.id ? '#F0F6FF' : '#64748B',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              {p.name}
            </button>
          ))}
        </div>

        {/* Active Product Detail */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.6) 100%)',
          border: `1px solid ${product.color}30`,
          borderRadius: 24, padding: '48px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${product.color}, transparent)` }} />

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 36 }}>{product.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: product.color, marginBottom: 4 }}>MODULE {product.glyph}</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#F0F6FF' }}>{product.name}</h2>
            </div>
          </div>
          <div style={{ fontSize: 12, color: product.color, marginBottom: 6, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>{product.tag}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F6FF', marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>{product.tagline}</div>
          <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.85, marginBottom: 32, maxWidth: 700 }}>{product.desc}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {product.signals.map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '20px 24px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FF', marginBottom: 6 }}>{s.name}</div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section style={{ padding: '0 48px 96px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-label">Comparison</div>
          <h2 className="w-heading" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>PayGuard vs. Legacy Rule Engines</h2>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>FEATURE</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00D4AA', textAlign: 'center' }}>PAYGUARD</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'center' }}>RULE-BASED LEGACY</div>
          </div>

          {/* Rows */}
          {COMPARE.map((row, i) => (
            <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '14px 24px', borderBottom: i < COMPARE.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
              <div style={{ fontSize: 14, color: '#94A3B8' }}>{row.feature}</div>
              <div style={{ textAlign: 'center', fontSize: 14, color: typeof row.fs === 'boolean' ? '#00D4AA' : '#00D4AA', fontWeight: 600 }}>
                {typeof row.fs === 'boolean' ? (row.fs ? '\u2705' : '\u274C') : row.fs}
              </div>
              <div style={{ textAlign: 'center', fontSize: 14, color: typeof row.legacy === 'boolean' ? (row.legacy ? '#00D4AA' : '#EF4444') : '#D29922', fontWeight: 600 }}>
                {typeof row.legacy === 'boolean' ? (row.legacy ? '\u2705' : '\u274C') : row.legacy}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 48px 80px', textAlign: 'center' }}>
        <div className="divider-glow" style={{ marginBottom: 64 }} />
        <h2 className="w-heading" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
          <span className="grad-blue-green">Ready to Protect Your Customers?</span>
        </h2>
        <p style={{ fontSize: 16, color: '#64748B', marginBottom: 32, maxWidth: 520, margin: '0 auto 32px' }}>Tell us about your fraud challenges — our team will show you exactly how PayGuard fits your stack.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button className="w-btn-primary" onClick={() => setShowSales(true)} style={{ fontSize: 15, padding: '14px 32px' }}>🤝 Talk to Sales</button>
          <button className="w-btn-secondary" onClick={() => navigate('/sandbox')}>Try Sandbox</button>
          <button className="w-btn-secondary" onClick={() => navigate('/developers')}>View SDK Docs</button>
        </div>
      </section>
      {showSales && <TalkToSalesModal onClose={() => setShowSales(false)} />}

      <WebFooter />
    </div>
  );
}
