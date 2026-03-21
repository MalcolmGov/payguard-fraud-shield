import { useState } from 'react';

interface Props { onClose: () => void; }

const ROLES = ['CEO / Founder', 'CTO / Engineering', 'Product Manager', 'Fraud / Risk Manager', 'IT / Security', 'Other'];
const USE_CASES = ['mobile wallet / Mobile Money', 'Digital Banking', 'Payment Gateway / PSP', 'Telco Financial Services', 'Neobank', 'Other'];
const VOLUMES = ['< 10k txn/month', '10k–100k txn/month', '100k–1M txn/month', '1M+ txn/month'];

export default function TalkToSalesModal({ onClose }: Props) {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', role: '', useCase: '', volume: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

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
        body: JSON.stringify({ ...form, source: 'Talk to Sales Modal' }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or email sales@payguard.africa directly.');
    } finally {
      setSending(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14,
    background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#F0F6FF', fontFamily: 'Inter, sans-serif', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      padding: '20px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'linear-gradient(140deg,#0A101E,#080D18)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, width: '100%', maxWidth: 600,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(14,165,233,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '28px 32px 0', position: 'relative' }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 20, right: 20,
            background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#94A3B8',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, color: '#F0F6FF', margin: '0 0 6px' }}>
            Talk to Sales
          </h2>
          <p style={{ color: '#64748B', fontSize: 13, margin: '0 0 4px' }}>
            Tell us about your institution and we'll get back to you within one business day.
          </p>
          <a href="mailto:sales@payguard.africa" style={{ color: '#0EA5E9', fontSize: 12, textDecoration: 'none' }}>
            sales@payguard.africa
          </a>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0 0' }} />

        {submitted ? (
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 700, color: '#F0F6FF', marginBottom: 10 }}>
              Your email client should open now
            </h3>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Your details have been pre-filled. Just hit Send.<br />
              We'll respond within one business day.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 16px', background: 'rgba(16,245,160,0.08)', border: '1px solid rgba(16,245,160,0.2)', borderRadius: 8, color: '#10F5A0', fontSize: 12, fontWeight: 600 }}>
                📧 sales@payguard.africa
              </div>
            </div>
            <button onClick={onClose} className="w-btn-primary" style={{ marginTop: 24, padding: '11px 28px', fontSize: 14 }}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '24px 32px 32px' }}>
            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input required style={inputStyle} placeholder="Jane Smith" value={form.name}
                  onChange={e => set('name', e.target.value)}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#0EA5E9'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)'} />
              </div>
              <div>
                <label style={labelStyle}>Company *</label>
                <input required style={inputStyle} placeholder="Acme Corp" value={form.company}
                  onChange={e => set('company', e.target.value)}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#0EA5E9'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)'} />
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Work Email *</label>
                <input required type="email" style={inputStyle} placeholder="jane@company.com" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#0EA5E9'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)'} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} placeholder="+27 82 000 0000" value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#0EA5E9'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)'} />
              </div>
            </div>

            {/* Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Your Role *</label>
                <select required style={{ ...inputStyle, cursor: 'pointer', color: form.role ? '#F0F6FF' : '#64748B' }} value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="" style={{ background: '#0A101E' }}>Select role…</option>
                  {ROLES.map(r => <option key={r} value={r} style={{ background: '#0A101E', color: '#F0F6FF' }}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Primary Use Case *</label>
                <select required style={{ ...inputStyle, cursor: 'pointer', color: form.useCase ? '#F0F6FF' : '#64748B' }} value={form.useCase} onChange={e => set('useCase', e.target.value)}>
                  <option value="" style={{ background: '#0A101E' }}>Select use case…</option>
                  {USE_CASES.map(u => <option key={u} value={u} style={{ background: '#0A101E', color: '#F0F6FF' }}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Transaction volume */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Monthly Transaction Volume</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {VOLUMES.map(v => (
                  <button key={v} type="button" onClick={() => set('volume', v)} style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: form.volume === v ? '1px solid #0EA5E9' : '1px solid rgba(255,255,255,0.12)',
                    background: form.volume === v ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)',
                    color: form.volume === v ? '#0EA5E9' : '#64748B',
                    transition: 'all 0.15s',
                  }}>{v}</button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Message</label>
              <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' } as React.CSSProperties}
                placeholder="Tell us about your fraud challenge, timeline, or specific requirements…"
                value={form.message} onChange={e => set('message', e.target.value)}
                onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#0EA5E9'}
                onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.12)'} />
            </div>

            {/* Submit */}
            {error && <p style={{ textAlign: 'center', fontSize: 13, color: '#F85149', marginBottom: 8 }}>{error}</p>}
            <button type="submit" disabled={sending} className="w-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, fontWeight: 700, opacity: sending ? 0.6 : 1 }}>
              {sending ? 'Sending…' : 'Send to Sales Team →'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#334155', marginTop: 12 }}>
              🔒 Your details go directly to <strong style={{ color: '#475569' }}>sales@payguard.africa</strong> — no spam, ever.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
