import { useState, useEffect, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  client_email: string;
  period_start: string;
  period_end: string;
  due_date: string;
  monthly_fee: string;
  per_tx_fee: string;
  currency: string;
  total_api_calls: number;
  subtotal: string;
  vat_rate: string;
  vat_amount: string;
  total: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paid_at: string | null;
  sent_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Client { id: string; name: string; email: string; monthly_fee: string; per_tx_fee: string; }
interface Stats { drafts: string; sent: string; paid: string; overdue: string; total_collected: string; total_outstanding: string; }
interface Toast { id: number; msg: string; type: 'success' | 'warn' | 'error'; }

const API_URL = 'https://api-gateway-production-8d15.up.railway.app';
const API_KEY = 'pk_live_payguard_2026_prod';
const headers = (extra: Record<string, string> = {}) => ({
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  ...extra,
});

const STATUS_COLORS: Record<string, string> = {
  draft: '#94A3B8', sent: '#0EA5E9', paid: '#10F5A0', overdue: '#EF4444', cancelled: '#475569',
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Generate form
  const [genForm, setGenForm] = useState({
    client_id: '', period_start: '', period_end: '', monthly_fee: '', per_tx_fee: '', api_calls: '', notes: '',
  });
  const [generating, setGenerating] = useState(false);

  const addToast = (msg: string, type: Toast['type']) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const fmt = (n: string | number, currency = 'ZAR') =>
    `${currency} ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
    try {
      const url = filter
        ? `${API_URL}/v1/admin/invoices?status=${filter}`
        : `${API_URL}/v1/admin/invoices`;
      const res = await fetch(url, { headers: headers() });
      const data = await res.json();
      setInvoices(data.invoices || []);
      setStats(data.stats || null);
    } catch {
      addToast('❌ Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v1/admin/clients`, { headers: headers() });
      const data = await res.json();
      setClients(data.clients || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Auto-fill pricing when client selected
  const onClientSelect = (clientId: string) => {
    setGenForm(f => ({ ...f, client_id: clientId }));
    const c = clients.find(cl => cl.id === clientId);
    if (c) {
      setGenForm(f => ({
        ...f, client_id: clientId,
        monthly_fee: c.monthly_fee || '0',
        per_tx_fee: c.per_tx_fee || '0.01',
      }));
    }
  };

  // Set defaults for current month
  const setCurrentMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    setGenForm(f => ({
      ...f,
      period_start: start.toISOString().split('T')[0],
      period_end: end.toISOString().split('T')[0],
    }));
  };

  // ── Generate Invoice ───────────────────────────────────────────────────────
  const generateInvoice = async () => {
    if (!genForm.client_id || !genForm.period_start || !genForm.period_end) {
      addToast('⚠️ Client and period are required', 'warn');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/v1/admin/invoices/generate`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          ...genForm,
          monthly_fee: parseFloat(genForm.monthly_fee) || 0,
          per_tx_fee: parseFloat(genForm.per_tx_fee) || 0.01,
          api_calls: genForm.api_calls ? parseInt(genForm.api_calls) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { addToast(`❌ ${data.error}`, 'error'); return; }
      addToast(`✅ Invoice ${data.invoice.invoice_number} generated — Total: ${fmt(data.invoice.total)}`, 'success');
      setShowGenerate(false);
      setGenForm({ client_id: '', period_start: '', period_end: '', monthly_fee: '', per_tx_fee: '', api_calls: '', notes: '' });
      fetchInvoices();
    } catch {
      addToast('❌ Network error', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ── Update Status ──────────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/admin/invoices/${id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { addToast('❌ Failed to update', 'error'); return; }
      addToast(`✅ Invoice marked as ${status}`, 'success');
      fetchInvoices();
      if (selectedInvoice?.id === id) setSelectedInvoice(null);
    } catch {
      addToast('❌ Network error', 'error');
    }
  };

  // ── Download PDF ───────────────────────────────────────────────────────────
  const downloadPDF = async (inv: Invoice) => {
    try {
      const res = await fetch(`${API_URL}/v1/admin/invoices/${inv.id}/html`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      if (!res.ok) { addToast('❌ Failed to load invoice', 'error'); return; }
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      addToast(`📄 Invoice ${inv.invoice_number} opened — use Ctrl+P to print/save as PDF`, 'success');
    } catch {
      addToast('❌ Network error', 'error');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)' }}>
      {/* Toasts */}
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
            Invoice Management
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>
            Generate, track, and manage client invoices
          </p>
        </div>
        <button onClick={() => { setShowGenerate(!showGenerate); if (!showGenerate) setCurrentMonth(); }} style={{
          padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
          background: showGenerate ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, #0EA5E9, #7C3AED)',
          color: showGenerate ? '#EF4444' : '#fff',
          boxShadow: showGenerate ? 'none' : '0 4px 20px rgba(14,165,233,0.3)',
        }}>
          {showGenerate ? '✕ Cancel' : '+ Generate Invoice'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'DRAFTS', value: stats.drafts, color: 'var(--w-text-2)' },
            { label: 'SENT', value: stats.sent, color: '#0EA5E9' },
            { label: 'PAID', value: stats.paid, color: '#10F5A0' },
            { label: 'OVERDUE', value: stats.overdue, color: '#EF4444' },
            { label: 'COLLECTED', value: fmt(stats.total_collected), color: '#10F5A0', large: true },
            { label: 'OUTSTANDING', value: fmt(stats.total_outstanding), color: '#FBBF24', large: true },
          ].map(s => (
            <div key={s.label} style={{
              padding: '10px 14px', borderRadius: 10,
              background: `${s.color}08`, border: `1px solid ${s.color}20`,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: s.large ? 14 : 18, fontWeight: 800, color: s.color, fontFamily: s.large ? 'JetBrains Mono, monospace' : 'Outfit, sans-serif' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Invoice Form */}
      {showGenerate && (
        <div style={{
          background: 'var(--w-card)', border: '1px solid rgba(14,165,233,0.2)',
          borderRadius: 14, padding: 24, marginBottom: 20, animation: 'fadeInDown 0.2s ease',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0EA5E9', marginBottom: 16 }}>Generate Invoice</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Client *</label>
              <select value={genForm.client_id} onChange={e => onClientSelect(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Period Start *</label>
              <input value={genForm.period_start} onChange={e => setGenForm({ ...genForm, period_start: e.target.value })} type="date" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Period End *</label>
              <input value={genForm.period_end} onChange={e => setGenForm({ ...genForm, period_end: e.target.value })} type="date" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Monthly Fee (override)</label>
              <input value={genForm.monthly_fee} onChange={e => setGenForm({ ...genForm, monthly_fee: e.target.value })} type="number" step="0.01" placeholder="From client settings" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Per-TX Fee (override)</label>
              <input value={genForm.per_tx_fee} onChange={e => setGenForm({ ...genForm, per_tx_fee: e.target.value })} type="number" step="0.0001" placeholder="0.01" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Notes (shown on invoice)</label>
              <input value={genForm.notes} onChange={e => setGenForm({ ...genForm, notes: e.target.value })} placeholder="e.g. Thank you for your business" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>API Call Count (manual override)</label>
              <input value={genForm.api_calls} onChange={e => setGenForm({ ...genForm, api_calls: e.target.value })} type="number" min="0" placeholder="Leave empty to pull from usage DB" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={generateInvoice} disabled={generating} style={{
              padding: '10px 28px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: generating ? '#334155' : 'linear-gradient(135deg, #0EA5E9, #7C3AED)',
              color: '#fff', boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
            }}>
              {generating ? '⏳ Generating...' : '📄 Generate Invoice'}
            </button>
            <div style={{ fontSize: 10, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
              💡 API calls are pulled automatically from the usage table for the selected period
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {['', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer',
            background: filter === s ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)',
            border: filter === s ? '1px solid rgba(14,165,233,0.4)' : '1px solid rgba(255,255,255,0.06)',
            color: filter === s ? '#0EA5E9' : '#94A3B8',
            textTransform: 'uppercase', transition: 'all 0.15s',
          }}>{s || 'All'}</button>
        ))}
      </div>

      {/* Invoice Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Loading invoices...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedInvoice ? '1fr 360px' : '1fr', gap: 16, transition: 'all 0.3s' }}>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 90px 110px 80px 80px', padding: '12px 20px', borderBottom: '1px solid var(--w-card-border)', gap: 8 }}>
              {['INVOICE #', 'CLIENT', 'PERIOD', 'API CALLS', 'TOTAL', 'STATUS', 'ACTION'].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
              ))}
            </div>
            {invoices.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>No invoices yet — generate your first one above</div>
            ) : invoices.map((inv, i) => (
              <div key={inv.id} onClick={() => setSelectedInvoice(selectedInvoice?.id === inv.id ? null : inv)} style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 100px 90px 110px 80px 80px',
                padding: '14px 20px', gap: 8, alignItems: 'center', cursor: 'pointer',
                borderBottom: i < invoices.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                background: selectedInvoice?.id === inv.id ? 'rgba(14,165,233,0.05)' : 'transparent',
                borderLeft: selectedInvoice?.id === inv.id ? '2px solid #0EA5E9' : '2px solid transparent',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = selectedInvoice?.id === inv.id ? 'rgba(14,165,233,0.05)' : 'transparent')}
              >
                <span style={{ fontSize: 12, color: '#0EA5E9', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{inv.invoice_number}</span>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--w-text-1)', fontWeight: 600 }}>{inv.client_name}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>{inv.client_email}</div>
                </div>
                <span style={{ fontSize: 10, color: 'var(--w-text-2)' }}>
                  {new Date(inv.period_start).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} — {new Date(inv.period_end).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                </span>
                <span style={{ fontSize: 12, color: 'var(--w-text-2)', fontFamily: 'JetBrains Mono, monospace' }}>{Number(inv.total_api_calls).toLocaleString()}</span>
                <span style={{ fontSize: 13, color: 'var(--w-text-1)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{fmt(inv.total, inv.currency)}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 6, textAlign: 'center',
                  background: `${STATUS_COLORS[inv.status]}15`, color: STATUS_COLORS[inv.status],
                  textTransform: 'uppercase',
                }}>{inv.status}</span>
                <button onClick={e => { e.stopPropagation(); downloadPDF(inv); }} style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: 'rgba(14,165,233,0.1)', color: '#0EA5E9',
                }}>📄 PDF</button>
              </div>
            ))}
          </div>

          {/* Detail Drawer */}
          {selectedInvoice && (
            <div style={{
              background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)',
              borderRadius: 14, padding: 22, position: 'sticky', top: 20, height: 'fit-content',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLORS[selectedInvoice.status], letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{selectedInvoice.status}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#0EA5E9' }}>{selectedInvoice.invoice_number}</div>
                  <div style={{ fontSize: 12, color: 'var(--w-text-2)', marginTop: 2 }}>{selectedInvoice.client_name}</div>
                </div>
                <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>

              {/* Invoice details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Monthly Fee', value: fmt(selectedInvoice.monthly_fee, selectedInvoice.currency) },
                  { label: 'Per-TX Fee', value: `${selectedInvoice.currency} ${Number(selectedInvoice.per_tx_fee).toFixed(4)}` },
                  { label: 'API Calls', value: Number(selectedInvoice.total_api_calls).toLocaleString() },
                  { label: 'Subtotal', value: fmt(selectedInvoice.subtotal, selectedInvoice.currency) },
                  { label: `VAT (${selectedInvoice.vat_rate}%)`, value: fmt(selectedInvoice.vat_amount, selectedInvoice.currency) },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--w-card-border)' }}>
                    <span style={{ color: 'var(--w-text-2)' }}>{r.label}</span>
                    <span style={{ color: 'var(--w-text-1)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderTop: '2px solid #0EA5E9' }}>
                  <span style={{ color: 'var(--w-text-1)', fontWeight: 700 }}>Total Due</span>
                  <span style={{ color: '#10F5A0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>{fmt(selectedInvoice.total, selectedInvoice.currency)}</span>
                </div>
              </div>

              {/* Dates */}
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 16, lineHeight: 1.8 }}>
                <span style={{ color: 'var(--w-text-2)' }}>Due:</span> {new Date(selectedInvoice.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                {selectedInvoice.paid_at && <><span style={{ color: '#10F5A0' }}>Paid:</span> {new Date(selectedInvoice.paid_at).toLocaleDateString('en-ZA')}<br /></>}
                {selectedInvoice.sent_at && <><span style={{ color: '#0EA5E9' }}>Sent:</span> {new Date(selectedInvoice.sent_at).toLocaleDateString('en-ZA')}<br /></>}
              </div>

              {/* Action Buttons */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 8 }}>ACTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => downloadPDF(selectedInvoice)} style={actionBtn('#0EA5E9')}>📄 Open Invoice (Print / PDF)</button>
                {selectedInvoice.status === 'draft' && (
                  <button onClick={() => updateStatus(selectedInvoice.id, 'sent')} style={actionBtn('#0EA5E9')}>📧 Mark as Sent</button>
                )}
                {['draft', 'sent', 'overdue'].includes(selectedInvoice.status) && (
                  <button onClick={() => updateStatus(selectedInvoice.id, 'paid')} style={actionBtn('#10F5A0')}>✅ Mark as Paid</button>
                )}
                {selectedInvoice.status === 'sent' && (
                  <button onClick={() => updateStatus(selectedInvoice.id, 'overdue')} style={actionBtn('#FBBF24')}>⚠️ Mark as Overdue</button>
                )}
                {selectedInvoice.status !== 'cancelled' && selectedInvoice.status !== 'paid' && (
                  <button onClick={() => updateStatus(selectedInvoice.id, 'cancelled')} style={actionBtn('#EF4444')}>🚫 Cancel Invoice</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const actionBtn = (color: string): React.CSSProperties => ({
  padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
  background: `${color}12`, color, textAlign: 'left', transition: 'all 0.15s',
});

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em',
  display: 'block', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
  background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--w-text-1)', fontFamily: 'Inter, sans-serif',
};
