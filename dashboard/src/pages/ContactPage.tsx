import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebNav, { WebFooter } from '../components/WebNav';

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
  fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box',
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

export default function ContactPage() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    company: '', institutionType: '', role: '',
    txVolume: '', interests: [], message: '', consent: false,
  });

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v }));

  const toggleInterest = (i: string) =>
    setForm(p => ({ ...p, interests: p.interests.includes(i) ? p.interests.filter(x => x !== i) : [...p.interests, i] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'Contact Page' }),
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

      {/* Hero */}
      <section className="mesh-bg" style={{ padding: '140px 48px 64px', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 500, height: 500, background: 'rgba(0,212,170,0.08)', top: -80, right: -100, '--orb-dur': '14s' } as React.CSSProperties} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-label">Contact Us</div>
          <h1 className="w-heading" style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
            <span className="grad-white-blue">Let's Talk</span> About<br />
            <span style={{ background: 'linear-gradient(135deg, #3B82F6, #00D4AA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Fraud Prevention.</span>
          </h1>
          <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.8, maxWidth: 580, margin: '0 auto' }}>
            Whether you're a bank, telco, fintech, or PSP — tell us about your fraud challenges and we'll show you exactly how PayGuard fits your stack.
          </p>
        </div>
      </section>

      {/* Quick contact methods */}
      <section style={{ padding: '0 48px 48px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: '📧', label: 'Email Partnerships', value: 'partnerships@payguard.africa', href: 'mailto:partnerships@payguard.africa' },
            { icon: '📧', label: 'Email Sales', value: 'sales@payguard.africa', href: 'mailto:sales@payguard.africa' },
            { icon: '🌐', label: 'Visit Website', value: 'payguard.africa', href: 'https://payguard.africa' },
          ].map(c => (
            <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px',
              borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              textDecoration: 'none', transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(14,165,233,0.4)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLAnchorElement).style.transform = ''; }}
            >
              <div style={{ fontSize: 24, flexShrink: 0 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0EA5E9' }}>{c.value}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '80px 48px 96px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-label">Get in Touch</div>
            <h2 className="w-heading" style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>
              Talk to Our Team
            </h2>
            <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.8, maxWidth: 520, margin: '0 auto' }}>
              Tell us about your institution, fraud challenges, and timeline. We'll respond within one business day.
            </p>
          </div>

          {sent ? (
            <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', borderColor: 'rgba(16,245,160,0.25)', maxWidth: 520, margin: '0 auto' }}>
              <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10F5A0', fontFamily: 'Outfit', marginBottom: 10 }}>Message Sent Successfully</div>
              <div style={{ fontSize: 15, color: '#64748B', lineHeight: 1.8, marginBottom: 8 }}>
                Your enquiry has been delivered to our sales team.<br />
                We'll respond within one business day.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                <div style={{ padding: '8px 16px', background: 'rgba(16,245,160,0.08)', border: '1px solid rgba(16,245,160,0.2)', borderRadius: 8, color: '#10F5A0', fontSize: 12, fontWeight: 600 }}>
                  📧 Confirmation sent to your email
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                <button onClick={() => setSent(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 20px', color: '#475569', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter' }}>Send another message</button>
                <button onClick={() => navigate('/')} className="w-btn-secondary" style={{ padding: '10px 20px', fontSize: 13 }}>Back to Home</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Field label="First Name" required>
                  <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane" style={FIELD_STYLE} onFocus={focusBorder} onBlur={blurBorder} />
                </Field>
                <Field label="Last Name" required>
                  <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Smith" style={FIELD_STYLE} onFocus={focusBorder} onBlur={blurBorder} />
                </Field>
                <Field label="Work Email" required>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane.smith@yourbank.com" style={FIELD_STYLE} onFocus={focusBorder} onBlur={blurBorder} />
                </Field>
                <Field label="Phone / WhatsApp">
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" style={FIELD_STYLE} onFocus={focusBorder} onBlur={blurBorder} />
                </Field>
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
                    placeholder="Describe the fraud vectors you're dealing with, your current tooling, and what outcome you're trying to achieve. The more detail, the more we can tailor our response."
                    style={{ ...FIELD_STYLE, resize: 'vertical', lineHeight: 1.8 }}
                    onFocus={focusBorder} onBlur={blurBorder} />
                </Field>
              </div>

              {/* Consent */}
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <input type="checkbox" checked={form.consent} onChange={e => set('consent', e.target.checked)} required
                  style={{ marginTop: 3, accentColor: '#0EA5E9', flexShrink: 0, cursor: 'pointer', width: 16, height: 16 }} />
                <label style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, cursor: 'pointer' }}>
                  I agree that Swifter Technologies may contact me about PayGuard. I understand my data will be handled in accordance with our{' '}
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
                {sending ? 'Sending…' : 'Send to Sales Team →'}
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
