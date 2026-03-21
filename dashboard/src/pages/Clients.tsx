import { useState, useEffect, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Client {
  id: string;
  name: string;
  email: string;
  tier: string;
  rate_limit: number;
  is_active: boolean;
  created_at: string;
  active_keys?: string;
  last_api_call?: string;
}

interface ApiKey {
  id: string;
  key_prefix: string;
  environment: string;
  label: string;
  rate_limit: number;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
  masked_key?: string;
}

interface NewKey { environment: string; key: string; prefix: string; }

interface Toast { id: number; msg: string; type: 'success' | 'warn' | 'error'; }

const API_URL = 'https://api-gateway-production-8d15.up.railway.app';
const API_KEY = 'pk_live_payguard_2026_prod';

const headers = (extra: Record<string, string> = {}) => ({
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  ...extra,
});

const TIER_COLORS: Record<string, string> = {
  free: '#94A3B8', starter: '#0EA5E9', growth: '#10F5A0', enterprise: '#A78BFA',
};
const INDUSTRIES = ['Banking', 'Fintech', 'Telco / MNO', 'Insurance', 'PSP / Payment Gateway', 'Digital Wallet', 'Neobank', 'Retail', 'Other'] as const;
const REGIONS = ['South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Uganda', 'Tanzania', 'Rwanda', 'Pan-Africa', 'Global'] as const;
const INTEGRATIONS = ['Android SDK', 'iOS SDK', 'REST API', 'USSD Gateway', 'Webhook'] as const;

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<{ client: Client; api_keys: ApiKey[] } | null>(null);
  const [newKeys, setNewKeys] = useState<NewKey[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form state
  const [form, setForm] = useState({
    // Company info
    name: '', email: '', tier: 'free' as string, rate_limit: 100,
    // Contact
    contact_name: '', contact_phone: '', contact_role: '',
    // Company details
    company_reg: '', industry: '', region: '', website: '',
    // Integration
    integration_types: [] as string[], use_case: '',
    // Billing & Pricing
    billing_email: '', estimated_volume: '',
    monthly_fee: 0, per_tx_fee: 0.01, currency: 'ZAR',
    billing_cycle: 'monthly', contract_start: '', contract_end: '',
    vat_number: '', billing_address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(0);

  const addToast = (msg: string, type: Toast['type']) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  // ── Fetch clients ──────────────────────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v1/admin/clients`, { headers: headers() });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      addToast('❌ Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // ── Fetch client detail ────────────────────────────────────────────────────
  const fetchDetail = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/admin/clients/${id}`, { headers: headers() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setClientDetail(data);
    } catch {
      addToast('❌ Failed to load client detail', 'error');
    }
  };

  const selectClient = (id: string) => {
    if (selectedId === id) { setSelectedId(null); setClientDetail(null); return; }
    setSelectedId(id);
    setNewKeys([]);
    fetchDetail(id);
  };

  // ── Form validation per step ───────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!form.name.trim()) { addToast('⚠️ Company name is required', 'warn'); return false; }
      if (!form.email.trim()) { addToast('⚠️ Contact email is required', 'warn'); return false; }
      if (!form.industry) { addToast('⚠️ Please select an industry', 'warn'); return false; }
      return true;
    }
    if (step === 1) {
      if (!form.contact_name.trim()) { addToast('⚠️ Contact person name is required', 'warn'); return false; }
      return true;
    }
    return true;
  };

  const nextStep = () => { if (validateStep(formStep)) setFormStep(s => Math.min(s + 1, 3)); };
  const prevStep = () => setFormStep(s => Math.max(s - 1, 0));

  const toggleIntegration = (t: string) => {
    setForm(f => ({
      ...f,
      integration_types: f.integration_types.includes(t)
        ? f.integration_types.filter(x => x !== t)
        : [...f.integration_types, t],
    }));
  };

  // ── Register client ────────────────────────────────────────────────────────
  const registerClient = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      addToast('⚠️ Name and email are required', 'warn');
      return;
    }
    setSubmitting(true);
    try {
      const { contact_name, contact_phone, contact_role, company_reg, industry, region, website, integration_types, use_case, billing_email, estimated_volume, billing_address, ...coreFields } = form;
      const payload = {
        ...coreFields,
        billing_address,
        metadata: { contact_name, contact_phone, contact_role, company_reg, industry, region, website, integration_types, use_case, billing_email, estimated_volume },
      };
      const res = await fetch(`${API_URL}/v1/admin/clients`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(`❌ ${data.error || 'Failed to register'}`, 'error');
        return;
      }
      setNewKeys(data.api_keys || []);
      addToast(`✅ ${data.client.name} registered successfully`, 'success');
      setForm({ name: '', email: '', tier: 'free', rate_limit: 100, contact_name: '', contact_phone: '', contact_role: '', company_reg: '', industry: '', region: '', website: '', integration_types: [], use_case: '', billing_email: '', estimated_volume: '', monthly_fee: 0, per_tx_fee: 0.01, currency: 'ZAR', billing_cycle: 'monthly', contract_start: '', contract_end: '', vat_number: '', billing_address: '' });
      setFormStep(0);
      setShowForm(false);
      fetchClients();
      setSelectedId(data.client.id);
      fetchDetail(data.client.id);
    } catch {
      addToast('❌ Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Generate new key ───────────────────────────────────────────────────────
  const generateKey = async (clientId: string, environment: 'sandbox' | 'production') => {
    try {
      const res = await fetch(`${API_URL}/v1/admin/clients/${clientId}/keys`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ environment, label: `${environment} key` }),
      });
      const data = await res.json();
      if (!res.ok) { addToast(`❌ ${data.error}`, 'error'); return; }
      addToast(`🔑 New ${environment} key generated`, 'success');
      setNewKeys(prev => [...prev, { environment, key: data.api_key.key, prefix: data.api_key.prefix }]);
      fetchDetail(clientId);
    } catch {
      addToast('❌ Failed to generate key', 'error');
    }
  };

  // ── Revoke key ─────────────────────────────────────────────────────────────
  const revokeKey = async (keyId: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/admin/keys/${keyId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (!res.ok) { addToast('❌ Failed to revoke key', 'error'); return; }
      addToast('🔒 Key revoked', 'warn');
      if (selectedId) fetchDetail(selectedId);
    } catch {
      addToast('❌ Network error', 'error');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const tierColor = (t: string) => TIER_COLORS[t] || '#94A3B8';

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)' }}>
      {/* Toast stack */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: 400 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 16px', borderRadius: 12, fontSize: 12, lineHeight: 1.6, fontWeight: 500,
            background: t.type === 'success' ? 'rgba(16,245,160,0.1)' : t.type === 'warn' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${t.type === 'success' ? 'rgba(16,245,160,0.35)' : t.type === 'warn' ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)'}`,
            color: t.type === 'success' ? '#10F5A0' : t.type === 'warn' ? '#FBBF24' : '#EF4444',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeInDown 0.3s ease',
          }}>{t.msg}</div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
            API Client Management
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>
            {clients.length} registered clients · Multi-tenant API key management
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', display: 'block' }}>TOTAL CLIENTS</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0EA5E9', fontFamily: 'Outfit, sans-serif' }}>{clients.length}</span>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
            background: showForm ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, #0EA5E9, #7C3AED)',
            color: showForm ? '#EF4444' : '#fff',
            boxShadow: showForm ? 'none' : '0 4px 20px rgba(14,165,233,0.3)',
            transition: 'all 0.2s',
          }}>
            {showForm ? '✕ Cancel' : '+ Register Client'}
          </button>
        </div>
      </div>

      {/* Registration Form */}
      {showForm && (
        <div style={{
          background: 'var(--w-card)', border: '1px solid rgba(14,165,233,0.2)',
          borderRadius: 14, padding: 24, marginBottom: 20,
          animation: 'fadeInDown 0.2s ease',
        }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0EA5E9' }}>Register New Client</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {['Company', 'Contact', 'Integration', 'Plan'].map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, transition: 'all 0.2s',
                    background: i <= formStep ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.04)',
                    border: i === formStep ? '1.5px solid #0EA5E9' : '1px solid rgba(255,255,255,0.08)',
                    color: i <= formStep ? '#0EA5E9' : '#475569',
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 10, color: i === formStep ? '#F0F6FF' : '#475569', fontWeight: i === formStep ? 600 : 400 }}>{label}</span>
                  {i < 3 && <div style={{ width: 20, height: 1, background: i < formStep ? '#0EA5E9' : 'rgba(255,255,255,0.08)' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Step 0: Company Info */}
          {formStep === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. MTN MoMo" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contact Email *</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="api@company.com" style={inputStyle} type="email" />
              </div>
              <div>
                <label style={labelStyle}>Company Registration / Tax ID</label>
                <input value={form.company_reg} onChange={e => setForm({ ...form, company_reg: e.target.value })} placeholder="e.g. 2024/123456/07" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://company.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Industry *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {INDUSTRIES.map(ind => (
                    <button key={ind} onClick={() => setForm({ ...form, industry: ind })} style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                      background: form.industry === ind ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)',
                      border: form.industry === ind ? '1px solid rgba(14,165,233,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      color: form.industry === ind ? '#0EA5E9' : '#94A3B8',
                      transition: 'all 0.15s',
                    }}>{ind}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Region</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {REGIONS.map(r => (
                    <button key={r} onClick={() => setForm({ ...form, region: r })} style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                      background: form.region === r ? 'rgba(16,245,160,0.12)' : 'rgba(255,255,255,0.04)',
                      border: form.region === r ? '1px solid rgba(16,245,160,0.35)' : '1px solid rgba(255,255,255,0.06)',
                      color: form.region === r ? '#10F5A0' : '#94A3B8',
                      transition: 'all 0.15s',
                    }}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Contact Person */}
          {formStep === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Contact Person Name *</label>
                <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="e.g. John Doe" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contact Phone</label>
                <input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="+27 82 123 4567" style={inputStyle} type="tel" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Role / Title</label>
                <input value={form.contact_role} onChange={e => setForm({ ...form, contact_role: e.target.value })} placeholder="e.g. CTO, Head of Fraud, VP Engineering" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Billing Email (if different)</label>
                <input value={form.billing_email} onChange={e => setForm({ ...form, billing_email: e.target.value })} placeholder="billing@company.com" style={inputStyle} type="email" />
              </div>
            </div>
          )}

          {/* Step 2: Integration */}
          {formStep === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Integration Types</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {INTEGRATIONS.map(t => (
                    <button key={t} onClick={() => toggleIntegration(t)} style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: form.integration_types.includes(t) ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                      border: form.integration_types.includes(t) ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      color: form.integration_types.includes(t) ? '#A78BFA' : '#94A3B8',
                      transition: 'all 0.15s',
                    }}>{form.integration_types.includes(t) ? '✓ ' : ''}{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Use Case / Description</label>
                <textarea value={form.use_case} onChange={e => setForm({ ...form, use_case: e.target.value })} placeholder="Describe how you plan to use PayGuard in your product..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Estimated Monthly Transaction Volume</label>
                <input value={form.estimated_volume} onChange={e => setForm({ ...form, estimated_volume: e.target.value })} placeholder="e.g. 500,000" style={inputStyle} />
              </div>
            </div>
          )}

          {/* Step 3: Pricing & Billing */}
          {formStep === 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Section Header */}
              <div style={{ gridColumn: '1 / -1', padding: '12px 16px', borderRadius: 10, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>💰 Custom Pricing — Negotiated per client by sales team</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>Standard per-transaction fee: R0.01 per API call. Monthly SaaS fee and rate limits are agreed during contract negotiation.</div>
              </div>

              <div>
                <label style={labelStyle}>Monthly SaaS Fee (ZAR)</label>
                <input value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: parseFloat(e.target.value) || 0 })} type="number" step="0.01" placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Per-Transaction Fee (ZAR)</label>
                <input value={form.per_tx_fee} onChange={e => setForm({ ...form, per_tx_fee: parseFloat(e.target.value) || 0.01 })} type="number" step="0.0001" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Currency</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['ZAR', 'USD', 'EUR', 'GBP'].map(c => (
                    <button key={c} onClick={() => setForm({ ...form, currency: c })} style={{
                      flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: form.currency === c ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)',
                      border: form.currency === c ? '1px solid rgba(14,165,233,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      color: form.currency === c ? '#0EA5E9' : '#94A3B8',
                      transition: 'all 0.15s',
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Billing Cycle</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['monthly', 'quarterly', 'annual'].map(bc => (
                    <button key={bc} onClick={() => setForm({ ...form, billing_cycle: bc })} style={{
                      flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: form.billing_cycle === bc ? 'rgba(16,245,160,0.12)' : 'rgba(255,255,255,0.04)',
                      border: form.billing_cycle === bc ? '1px solid rgba(16,245,160,0.35)' : '1px solid rgba(255,255,255,0.06)',
                      color: form.billing_cycle === bc ? '#10F5A0' : '#94A3B8',
                      textTransform: 'capitalize', transition: 'all 0.15s',
                    }}>{bc}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Rate Limit (req/min)</label>
                <input value={form.rate_limit} onChange={e => setForm({ ...form, rate_limit: parseInt(e.target.value) || 100 })} type="number" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>VAT Number</label>
                <input value={form.vat_number} onChange={e => setForm({ ...form, vat_number: e.target.value })} placeholder="e.g. 4123456789" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contract Start Date</label>
                <input value={form.contract_start} onChange={e => setForm({ ...form, contract_start: e.target.value })} type="date" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contract End Date (optional)</label>
                <input value={form.contract_end} onChange={e => setForm({ ...form, contract_end: e.target.value })} type="date" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Billing Address</label>
                <textarea value={form.billing_address} onChange={e => setForm({ ...form, billing_address: e.target.value })} placeholder="Street address, city, postal code..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Summary */}
              <div style={{ gridColumn: '1 / -1', padding: 16, borderRadius: 10, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 8 }}>REGISTRATION SUMMARY</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: 'var(--w-text-1)', lineHeight: 1.8 }}>
                  <div>
                    <strong>{form.name || '—'}</strong> ({form.industry || '—'})<br />
                    {form.contact_name && <><span style={{ color: 'var(--w-text-2)' }}>Contact:</span> {form.contact_name}<br /></>}
                    <span style={{ color: 'var(--w-text-2)' }}>Region:</span> {form.region || '—'}<br />
                    <span style={{ color: 'var(--w-text-2)' }}>Integration:</span> {form.integration_types.join(', ') || '—'}
                  </div>
                  <div>
                    <span style={{ color: '#10F5A0', fontWeight: 700 }}>Pricing</span><br />
                    <span style={{ color: 'var(--w-text-2)' }}>Monthly Fee:</span> {form.currency} {form.monthly_fee.toFixed(2)}<br />
                    <span style={{ color: 'var(--w-text-2)' }}>Per-TX Fee:</span> {form.currency} {form.per_tx_fee.toFixed(4)}<br />
                    <span style={{ color: 'var(--w-text-2)' }}>Billing:</span> {form.billing_cycle} · {form.rate_limit} req/min
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
            <button onClick={prevStep} disabled={formStep === 0} style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: formStep === 0 ? 'not-allowed' : 'pointer',
              background: 'var(--w-card)', color: formStep === 0 ? '#334155' : '#94A3B8',
            }}>← Back</button>
            {formStep < 3 ? (
              <button onClick={nextStep} style={{
                padding: '8px 22px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: 'rgba(14,165,233,0.15)', color: '#0EA5E9',
              }}>Next →</button>
            ) : (
              <button onClick={registerClient} disabled={submitting} style={{
                padding: '10px 28px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: submitting ? '#334155' : 'linear-gradient(135deg, #0EA5E9, #7C3AED)',
                color: '#fff', boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
              }}>
                {submitting ? '⏳ Registering...' : '🔑 Register & Generate Keys'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* New Keys Banner */}
      {newKeys.length > 0 && (
        <div style={{
          background: 'rgba(16,245,160,0.06)', border: '1px solid rgba(16,245,160,0.25)',
          borderRadius: 14, padding: 20, marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#10F5A0', marginBottom: 12 }}>
            🔑 New API Keys Generated — Copy them now, they won't be shown again!
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {newKeys.map((k, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.3)',
              }}>
                <div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, marginRight: 10,
                    background: k.environment === 'production' ? 'rgba(239,68,68,0.15)' : 'rgba(14,165,233,0.15)',
                    color: k.environment === 'production' ? '#EF4444' : '#0EA5E9',
                  }}>{k.environment.toUpperCase()}</span>
                  <code style={{ fontSize: 13, color: 'var(--w-text-1)', fontFamily: 'JetBrains Mono, monospace' }}>{k.key}</code>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(k.key); addToast(`📋 ${k.environment} key copied`, 'success'); }} style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: 'rgba(14,165,233,0.12)', color: '#0EA5E9',
                }}>Copy</button>
              </div>
            ))}
          </div>
          <button onClick={() => setNewKeys([])} style={{
            marginTop: 12, padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: 'var(--w-card)', color: '#475569',
          }}>✕ Dismiss</button>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Loading clients...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: clientDetail ? '1fr 380px' : '1fr', gap: 16, transition: 'all 0.3s' }}>
          {/* Client Table */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 80px 90px 100px', padding: '12px 20px', borderBottom: '1px solid var(--w-card-border)', gap: 8 }}>
              {['CLIENT', 'EMAIL', 'TIER', 'KEYS', 'RATE LIMIT', 'LAST ACTIVE'].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
              ))}
            </div>
            {clients.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>No clients registered yet</div>
            ) : clients.map((c, i) => (
              <div key={c.id} onClick={() => selectClient(c.id)} style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 90px 80px 90px 100px',
                padding: '14px 20px', gap: 8, alignItems: 'center', cursor: 'pointer',
                borderBottom: i < clients.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                background: selectedId === c.id ? 'rgba(14,165,233,0.05)' : 'transparent',
                borderLeft: selectedId === c.id ? '2px solid #0EA5E9' : '2px solid transparent',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = selectedId === c.id ? 'rgba(14,165,233,0.05)' : 'transparent')}
              >
                <div>
                  <div style={{ fontSize: 13, color: 'var(--w-text-1)', fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>
                    {new Date(c.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--w-text-2)', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 6, textAlign: 'center',
                  background: `${tierColor(c.tier)}15`, color: tierColor(c.tier), textTransform: 'uppercase',
                }}>{c.tier}</span>
                <span style={{ fontSize: 13, color: '#0EA5E9', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{c.active_keys || '0'}</span>
                <span style={{ fontSize: 11, color: 'var(--w-text-2)', fontFamily: 'JetBrains Mono, monospace' }}>{c.rate_limit}/min</span>
                <span style={{ fontSize: 10, color: '#475569' }}>
                  {c.last_api_call ? new Date(c.last_api_call).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }) : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Detail Drawer */}
          {clientDetail && (
            <div style={{
              background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)',
              borderRadius: 14, padding: '22px', position: 'sticky', top: 20, height: 'fit-content',
              maxHeight: 'calc(100vh - 60px)', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: tierColor(clientDetail.client.tier), letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {clientDetail.client.tier} CLIENT
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{clientDetail.client.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--w-text-2)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{clientDetail.client.email}</div>
                </div>
                <button onClick={() => { setSelectedId(null); setClientDetail(null); }} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: '12px 14px', background: 'var(--w-card)', borderRadius: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 4 }}>ACTIVE KEYS</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0EA5E9', fontFamily: 'Outfit, sans-serif' }}>
                    {clientDetail.api_keys.filter(k => k.is_active).length}
                  </div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--w-card)', borderRadius: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 4 }}>RATE LIMIT</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--w-text-1)', fontFamily: 'Outfit, sans-serif' }}>{clientDetail.client.rate_limit}/min</div>
                </div>
              </div>

              {/* Generate Key Buttons */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 8 }}>GENERATE NEW KEY</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => generateKey(clientDetail.client.id, 'sandbox')} style={{
                    flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', color: '#0EA5E9',
                  }}>+ Sandbox Key</button>
                  <button onClick={() => generateKey(clientDetail.client.id, 'production')} style={{
                    flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444',
                  }}>+ Production Key</button>
                </div>
              </div>

              {/* API Keys List */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 8 }}>API KEYS</div>
                {clientDetail.api_keys.length === 0 ? (
                  <div style={{ fontSize: 11, color: '#334155', fontStyle: 'italic' }}>No keys</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {clientDetail.api_keys.map(k => (
                      <div key={k.id} style={{
                        padding: '10px 12px', borderRadius: 10, background: 'var(--w-card)',
                        borderLeft: `2px solid ${k.is_active ? (k.environment === 'production' ? '#EF4444' : '#0EA5E9') : '#334155'}`,
                        opacity: k.is_active ? 1 : 0.5,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{
                              fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginRight: 8,
                              background: k.environment === 'production' ? 'rgba(239,68,68,0.15)' : 'rgba(14,165,233,0.15)',
                              color: k.environment === 'production' ? '#EF4444' : '#0EA5E9',
                            }}>{k.environment.toUpperCase()}</span>
                            <code style={{ fontSize: 11, color: 'var(--w-text-2)', fontFamily: 'JetBrains Mono, monospace' }}>{k.key_prefix}...</code>
                          </div>
                          {k.is_active ? (
                            <button onClick={(e) => { e.stopPropagation(); revokeKey(k.id); }} style={{
                              padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700, border: 'none', cursor: 'pointer',
                              background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                            }}>Revoke</button>
                          ) : (
                            <span style={{ fontSize: 9, color: '#475569', fontWeight: 600 }}>REVOKED</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 9, color: '#475569' }}>
                          <span>Created: {new Date(k.created_at).toLocaleDateString('en-ZA')}</span>
                          {k.last_used_at && <span>Last used: {new Date(k.last_used_at).toLocaleDateString('en-ZA')}</span>}
                          {k.revoked_at && <span style={{ color: '#EF4444' }}>Revoked: {new Date(k.revoked_at).toLocaleDateString('en-ZA')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared Styles ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em',
  display: 'block', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
  background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--w-text-1)', fontFamily: 'Inter, sans-serif',
};
