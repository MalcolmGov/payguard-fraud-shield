import { useState } from 'react';
import WebNav, { WebFooter } from '../components/WebNav';

const VALUES = [
  { icon: '/icon-transaction-guard.png', title: 'Zero Friction', desc: 'Fraud prevention must be invisible to legitimate users. We block threats without adding delays or disrupting real customers.', color: '#3B82F6' },
  { icon: '/icon-ai-anomaly.png', title: 'Intelligence-Led', desc: 'Every rule is grounded in real fraud data and African payment patterns. Our models learn continuously from the threats that matter most.', color: '#10B981' },
  { icon: '/icon-fraud-ring.png', title: 'Partner-First', desc: "We don't replace your fraud team — we give them superpowers. Your analysts own the rules. We provide the platform and insights.", color: '#8B5CF6' },
  { icon: '/icon-aml-sanctions.png', title: 'Privacy by Design', desc: 'Data minimisation, in-region hosting (af-south-1), end-to-end AES-256-GCM encryption. GDPR, POPIA, and PCI-DSS compliant by default.', color: '#06B6D4' },
  { icon: '/icon-decision.png', title: 'Africa-First Innovation', desc: "Built for the continent's unique payment landscape — mobile money, USSD, instant EFT, and airtime. Not a US product adapted for Africa.", color: '#F59E0B' },
  { icon: '/icon-sdk-embedded.png', title: 'Developer Obsessed', desc: 'One SDK. Four lines of code. Native Kotlin + Swift. We believe great security should be the easiest thing to implement, not the hardest.', color: '#EC4899' },
];

const MILESTONES = [
  { year: '2023', event: 'PayGuard founded with a mission to eliminate fraud across African digital payments.' },
  { year: '2024', event: 'Launched Transaction Guard and OTP Guard. First bank partnership signed.' },
  { year: '2024', event: 'Released AI Anomaly Detection with deepfake voice scoring and synthetic identity models.' },
  { year: '2025', event: 'Expanded to 8 products covering the full fraud lifecycle. Opened sandbox for developers.' },
  { year: '2025', event: 'Processing fraud signals across multiple payment rails — EFT, Card, RTP, Mobile Money, USSD.' },
];

const INST_TYPES = ['Commercial Bank', 'Neobank / Challenger', 'Mobile Network Operator', 'Fintech / Wallet', 'PSP / Acquirer', 'Insurance Provider', 'Credit Union / Cooperative', 'Regulator / Government'];
const ROLES = ['Chief Risk Officer', 'Head of Fraud / Financial Crime', 'CISO / Head of Security', 'Product Manager', 'Technology / Engineering Lead', 'CEO / Founder', 'Compliance Officer', 'Investor / Analyst', 'Other'];
const INTERESTS = ['Transaction Fraud Prevention', 'OTP & Account Takeover', 'SIM Swap Defence', 'Fraud Graph & Ring Detection', 'Live Rule Tuning', 'SDK Integration', 'API & Webhooks', 'Enterprise Pricing'];
const TX_VOLUMES = ['< 100K transactions/month', '100K – 1M / month', '1M – 10M / month', '10M – 100M / month', '100M+ / month', 'Not sure yet'];

type FormData = {
  firstName: string; lastName: string; email: string; phone: string;
  company: string; institutionType: string; role: string;
  txVolume: string; interests: string[]; message: string; consent: boolean;
};

const FIELD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10, padding: '13px 16px', fontSize: 14, color: '#F0F6FF',
  fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%',
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#64748B', letterSpacing: '0.04em',
  marginBottom: 6, display: 'block',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}{required && <span style={{ color: '#F85149', marginLeft: 4 }}>*</span>}</label>
      {children}
    </div>
  );
}

export default function AboutPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    company: '', institutionType: '', role: '',
    txVolume: '', interests: [], message: '', consent: false,
  });

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v }));

  const toggleInterest = (i: string) =>
    setForm(p => ({ ...p, interests: p.interests.includes(i) ? p.interests.filter(x => x !== i) : [...p.interests, i] }));

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'About Page' }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again or email sales@payguard.africa directly.');
    } finally {
      setSending(false);
    }
  };

  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = 'rgba(14,165,233,0.5)');
  const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = 'rgba(255,255,255,0.09)');

  return (
    <div style={{ minHeight: '100vh', background: '#0B1121', fontFamily: 'Inter, sans-serif', color: '#F0F6FF', overflowX: 'hidden' }}>
      <WebNav />

      {/* ═══ HERO ═══ */}
      <section className="mesh-bg" style={{ padding: '140px 48px 80px', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 500, height: 500, background: 'rgba(59,130,246,0.09)', top: -80, right: -100, '--orb-dur': '14s' } as React.CSSProperties} />
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(0,212,170,0.06)', bottom: -60, left: -80, '--orb-dur': '18s' } as React.CSSProperties} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-label">About PayGuard</div>
          <h1 className="w-heading" style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 28 }}>
            Protecting Africa's{' '}
            <span className="grad-blue-purple">Digital Payment Future.</span>
          </h1>
          <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.9, maxWidth: 680, margin: '0 auto' }}>
            PayGuard is Africa's real-time fraud prevention platform. We combine device intelligence, AI-powered anomaly detection, and graph-based fraud ring analysis into a single SDK — protecting banks, telcos, fintechs, and payment providers from the continent's most sophisticated threats.
          </p>
        </div>
      </section>

      {/* ═══ MISSION ═══ */}
      <section style={{ padding: '100px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div className="section-label">Our Mission</div>
            <h2 className="w-heading" style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 24, lineHeight: 1.15 }}>
              Make Every Digital Payment Safe.{' '}
              <span style={{ color: '#3B82F6' }}>Everywhere.</span>
            </h2>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.9, marginBottom: 20 }}>
              Africa's digital payments ecosystem is growing at <strong style={{ color: '#F0F6FF' }}>over 20% annually</strong>, driving financial inclusion across the continent. But with growth comes risk — social engineering, SIM swaps, deepfake voice cloning, and organised mule networks cost institutions and customers <strong style={{ color: '#F59E0B' }}>billions every year</strong>.
            </p>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.9, marginBottom: 20 }}>
              We believe that fraud prevention shouldn't be a luxury only available to the world's largest banks. Our mission is to <strong style={{ color: '#F0F6FF' }}>democratise enterprise-grade fraud protection</strong> — making it accessible to every financial institution in Africa through a single, developer-friendly SDK.
            </p>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.9 }}>
              When a grandmother's pension is protected from a vishing scam, when a small business isn't drained by a SIM swap attack — that's our mission in action.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { value: '8', label: 'Products', sub: 'Full fraud lifecycle coverage', color: '#3B82F6' },
              { value: '35', label: 'Rules', sub: 'Evaluating in parallel', color: '#8B5CF6' },
              { value: '<100ms', label: 'Latency', sub: 'Signal to decision', color: '#10B981' },
              { value: '5', label: 'Intelligence Layers', sub: 'Device · Call · SIM · Graph · AI', color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} className="glass-card" style={{ padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: s.color, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FF', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OUR VALUES ═══ */}
      <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="section-label">Our Values</div>
            <h2 className="w-heading" style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
              What We Stand For
            </h2>
            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 580, margin: '0 auto', lineHeight: 1.8 }}>
              These principles guide every product decision, every line of code, and every partnership we build.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {VALUES.map(v => (
              <div key={v.title} className="glass-card" style={{ padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${v.color}, ${v.color}60, transparent)` }} />
                <div style={{ width: 56, height: 56, borderRadius: 14, background: `${v.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: `0 0 24px ${v.color}15`, border: `1px solid ${v.color}20`, overflow: 'hidden' }}>
                  <img src={v.icon} alt={v.title} style={{ width: 38, height: 38, objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#F0F6FF', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>{v.title}</div>
                <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY AFRICA ═══ */}
      <section style={{ padding: '100px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-label">Why Africa</div>
            <h2 className="w-heading" style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.15 }}>
              Built for the Continent,{' '}
              <span style={{ color: '#00D4AA' }}>by the Continent.</span>
            </h2>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.9 }}>
              Africa isn't a secondary market we adapted for — it's our foundation. Our infrastructure runs on <strong style={{ color: '#F0F6FF' }}>AWS af-south-1 (Cape Town)</strong> for data sovereignty. Our ML models are trained on African payment patterns — mobile money, USSD, instant EFT — not retrofitted Western transaction data.
            </p>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.9 }}>
              We understand the unique fraud vectors that target this continent: social engineering calls exploiting trust, SIM swap attacks leveraging telco vulnerabilities, and organised crime networks that move stolen funds across borders in minutes. PayGuard was purpose-built to stop them all.
            </p>
          </div>

          {/* Journey timeline */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', marginBottom: 24 }}>OUR JOURNEY</div>
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              <div style={{ position: 'absolute', left: 8, top: 6, bottom: 6, width: 2, background: 'linear-gradient(180deg, #3B82F6, #00D4AA)' }} />
              {MILESTONES.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 24, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -22, top: 6, width: 12, height: 12, borderRadius: '50%', background: i === MILESTONES.length - 1 ? '#00D4AA' : '#3B82F6', boxShadow: `0 0 12px ${i === MILESTONES.length - 1 ? 'rgba(0,212,170,0.4)' : 'rgba(59,130,246,0.4)'}` }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', marginBottom: 4 }}>{m.year}</div>
                    <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7 }}>{m.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VISION ═══ */}
      <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '80px 48px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-label">Our Vision</div>
          <h2 className="w-heading" style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 20, lineHeight: 1.2 }}>
            A world where every digital payment{' '}
            <span className="grad-blue-purple">is inherently safe.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.9, maxWidth: 640, margin: '0 auto' }}>
            We envision a future where fraud protection is embedded invisibly into every payment rail, every app, and every transaction — where customers never have to think about whether their money is safe. That's the future PayGuard is building, one SDK at a time.
          </p>
        </div>
      </section>

      {/* ═══ Contact form ═══ */}
      <section id="contact" style={{ padding: '96px 48px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="section-label">Get in Touch</div>
            <h2 className="w-heading" style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>
              Talk to Our Team
            </h2>
            <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.8, maxWidth: 560, margin: '0 auto' }}>
              Whether you're a bank, telco, fintech, or PSP — tell us about your fraud challenges and we'll show you exactly how PayGuard fits your stack.
            </p>
          </div>

          {sent ? (
            <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', borderColor: 'rgba(16,245,160,0.25)', maxWidth: 520, margin: '0 auto' }}>
              <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10F5A0', fontFamily: 'Outfit', marginBottom: 10 }}>Message Received</div>
              <div style={{ fontSize: 15, color: '#64748B', lineHeight: 1.8 }}>
                Thank you — a member of our team will reach out within one business day. We look forward to the conversation.
              </div>
              <button onClick={() => setSent(false)} style={{ marginTop: 28, background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 20px', color: '#475569', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter' }}>Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                {/* Row 1: Name */}
                <Field label="First Name" required>
                  <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane" style={FIELD_STYLE} onFocus={focusBorder} onBlur={blurBorder} />
                </Field>
                <Field label="Last Name" required>
                  <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Smith" style={FIELD_STYLE} onFocus={focusBorder} onBlur={blurBorder} />
                </Field>

                {/* Row 2: Contact */}
                <Field label="Work Email" required>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane.smith@yourbank.com" style={FIELD_STYLE} onFocus={focusBorder} onBlur={blurBorder} />
                </Field>
                <Field label="Phone / WhatsApp">
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" style={FIELD_STYLE} onFocus={focusBorder} onBlur={blurBorder} />
                </Field>

                {/* Row 3: Institution */}
                <Field label="Company / Institution" required>
                  <input required value={form.company} onChange={e => set('company', e.target.value)} placeholder="Your Bank or Fintech Name" style={FIELD_STYLE} onFocus={focusBorder} onBlur={blurBorder} />
                </Field>
                <Field label="Institution Type" required>
                  <select required value={form.institutionType} onChange={e => set('institutionType', e.target.value)}
                    style={{ ...FIELD_STYLE, cursor: 'pointer', color: form.institutionType ? '#F0F6FF' : '#475569' }}
                    onFocus={focusBorder} onBlur={blurBorder}>
                    <option value="" disabled>Select type…</option>
                    {INST_TYPES.map(t => <option key={t} value={t} style={{ background: '#0D1117' }}>{t}</option>)}
                  </select>
                </Field>

                {/* Row 4: Role + Volume */}
                <Field label="Your Role" required>
                  <select required value={form.role} onChange={e => set('role', e.target.value)}
                    style={{ ...FIELD_STYLE, cursor: 'pointer', color: form.role ? '#F0F6FF' : '#475569' }}
                    onFocus={focusBorder} onBlur={blurBorder}>
                    <option value="" disabled>Select role…</option>
                    {ROLES.map(r => <option key={r} value={r} style={{ background: '#0D1117' }}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Monthly Transaction Volume">
                  <select value={form.txVolume} onChange={e => set('txVolume', e.target.value)}
                    style={{ ...FIELD_STYLE, cursor: 'pointer', color: form.txVolume ? '#F0F6FF' : '#475569' }}
                    onFocus={focusBorder} onBlur={blurBorder}>
                    <option value="" disabled>Select volume…</option>
                    {TX_VOLUMES.map(v => <option key={v} value={v} style={{ background: '#0D1117' }}>{v}</option>)}
                  </select>
                </Field>

              </div>

              {/* Areas of interest */}
              <div style={{ marginTop: 24 }}>
                <label style={{ ...LABEL_STYLE, marginBottom: 12 }}>Areas of Interest <span style={{ color: '#334155', fontWeight: 400 }}>(select all that apply)</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INTERESTS.map(i => {
                    const on = form.interests.includes(i);
                    return (
                      <button type="button" key={i} onClick={() => toggleInterest(i)}
                        style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.15s', border: on ? '1px solid rgba(14,165,233,0.5)' : '1px solid rgba(255,255,255,0.09)', background: on ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.04)', color: on ? '#0EA5E9' : '#64748B', fontWeight: on ? 600 : 400 }}>
                        {on ? '✓ ' : ''}{i}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div style={{ marginTop: 24 }}>
                <Field label="Tell us about your fraud challenge">
                  <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={5}
                    placeholder="Describe the fraud vectors you're dealing with, your current tooling, and what outcome you're trying to achieve."
                    style={{ ...FIELD_STYLE, resize: 'vertical', lineHeight: 1.8 }}
                    onFocus={focusBorder} onBlur={blurBorder} />
                </Field>
              </div>

              {/* Consent */}
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <input type="checkbox" checked={form.consent} onChange={e => set('consent', e.target.checked)} required
                  style={{ marginTop: 3, accentColor: '#0EA5E9', flexShrink: 0, cursor: 'pointer', width: 16, height: 16 }} />
                <label style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, cursor: 'pointer' }}>
                  I agree that PayGuard may contact me regarding their fraud prevention platform. My data will be handled in accordance with the{' '}
                  <span style={{ color: '#0EA5E9', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
                </label>
              </div>

              {/* Info row */}
              <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { icon: '⚡', label: 'Response within 24h', sub: 'Business days' },
                  { icon: '🔒', label: 'Your data is secure', sub: 'GDPR & POPIA compliant' },
                  { icon: '🎯', label: 'No spam, ever', sub: 'Unsubscribe any time' },
                ].map(b => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 18 }}>{b.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{b.label}</div>
                      <div style={{ fontSize: 11, color: '#334155' }}>{b.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit */}
              {error && <p style={{ textAlign: 'center', fontSize: 13, color: '#F85149', marginTop: 16 }}>{error}</p>}
              <button type="submit" disabled={sending} className="w-btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '16px', marginTop: 28, opacity: sending ? 0.6 : 1 }}>
                {sending ? 'Sending…' : 'Submit Enquiry →'}
              </button>

              {/* Alternative contact */}
              <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#334155' }}>
                Prefer email directly?{' '}
                <a href="mailto:partnerships@payguard.africa" style={{ color: '#0EA5E9', textDecoration: 'none' }}>partnerships@payguard.africa</a>
                {' · '}
                <a href="mailto:sales@payguard.africa" style={{ color: '#0EA5E9', textDecoration: 'none' }}>sales@payguard.africa</a>
              </div>
            </form>
          )}
        </div>
      </section>

      <WebFooter />
    </div>
  );
}
