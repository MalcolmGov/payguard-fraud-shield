import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WebNav, { WebFooter } from '../components/WebNav';
import TalkToSalesModal from '../components/TalkToSalesModal';

type RequestTab = 'auth' | 'headers' | 'body';
type PanelTab   = 'playground' | 'simulator';

interface EndpointDef {
  method: string; path: string; label: string; group: string;
  body?: string;
  mock: (body: string) => Record<string, unknown>;
}

const ENDPOINTS: EndpointDef[] = [
  {
    method: 'POST', path: '/v1/transaction/evaluate', label: 'Evaluate Transaction', group: 'Transactions',
    body: JSON.stringify({ transaction_id: 'txn_demo_001', amount: 15000, currency: 'ZAR', sender: 'acc_001', receiver: 'acc_002', channel: 'mobile_banking', signals: { call_active: true, paste_detected: false, keystroke_anomaly: 0.12, device_fingerprint: 'fp_abc123' } }, null, 2),
    mock: (body: string) => {
      try {
        const b = JSON.parse(body);
        const s = b.signals || {};
        const score = (s.call_active ? 55 : 0) + (s.paste_detected ? 20 : 0) + Math.round((s.keystroke_anomaly || 0) * 50);
        const rules = [];
        if (s.call_active) rules.push({ rule: 'CALL_ACTIVE_DURING_PAYMENT', score: 55, severity: 'HIGH' });
        if (s.paste_detected) rules.push({ rule: 'PASTE_INTO_AMOUNT', score: 20, severity: 'MEDIUM' });
        if ((s.keystroke_anomaly || 0) > 0.3) rules.push({ rule: 'KEYSTROKE_ANOMALY', score: 15, severity: 'MEDIUM' });
        return {
          transaction_id: b.transaction_id || 'txn_demo_001',
          session_id: 'ses_' + Date.now(),
          risk_score: score,
          action: score >= 80 ? 'BLOCK' : score >= 45 ? 'WARN_USER' : 'ALLOW',
          rules_fired: rules,
          latency_ms: 44,
          timestamp: new Date().toISOString(),
        };
      } catch { return { error: 'invalid_payload', message: 'Could not parse request body' }; }
    },
  },
  {
    method: 'GET', path: '/v1/graph/entity/27821000001', label: 'Graph Lookup', group: 'Fraud Graph',
    mock: () => ({
      entity_id: '27821000001', type: 'MSISDN',
      connections: [
        { target: 'acc_17291', relationship: 'OWNS', risk: 'LOW' },
        { target: 'dev_8a3f1', relationship: 'USES_DEVICE', risk: 'MEDIUM' },
        { target: 'acc_88412', relationship: 'SENT_TO', risk: 'HIGH', flagged: true },
      ],
      cluster_id: 'CLU_0042', cluster_size: 14,
      risk_label: 'MEDIUM', last_activity: new Date().toISOString(),
    }),
  },
  {
    method: 'GET', path: '/v1/rules', label: 'List Rules', group: 'Rules',
    mock: () => ({
      total: 14, threshold: { warn: 45, block: 80 },
      rules: [
        { id: 'R001', name: 'CALL_ACTIVE_DURING_PAYMENT', score: 55, severity: 'HIGH', enabled: true },
        { id: 'R002', name: 'PASTE_INTO_AMOUNT', score: 20, severity: 'MEDIUM', enabled: true },
        { id: 'R003', name: 'KEYSTROKE_ANOMALY', score: 15, severity: 'MEDIUM', enabled: true },
        { id: 'R004', name: 'NEW_DEVICE_FIRST_TXN', score: 30, severity: 'HIGH', enabled: true },
        { id: 'R005', name: 'SIM_SWAP_48H', score: 70, severity: 'CRITICAL', enabled: true },
      ],
    }),
  },
  {
    method: 'POST', path: '/v1/signals/ingest', label: 'Ingest Signal', group: 'Signals',
    body: JSON.stringify({ device_id: 'dev_8a3f1', signal_type: 'SIM_CHANGE', carrier: 'Vodacom', timestamp: new Date().toISOString(), metadata: { previous_imsi: '655101234567890', new_imsi: '655109876543210', hours_since_change: 4 } }, null, 2),
    mock: (body: string) => {
      try {
        const b = JSON.parse(body);
        return { accepted: true, signal_id: 'sig_' + Date.now(), device_id: b.device_id, propagation_ms: 4800, alert_generated: (b.metadata?.hours_since_change || 999) < 48, timestamp: new Date().toISOString() };
      } catch { return { error: 'invalid_payload', message: 'Could not parse request body' }; }
    },
  },
];

const API_KEYS = [
  { label: 'pg_sandbox_demo_00001_test_key_99 (Sandbox)', key: 'pg_sandbox_demo_00001_test_key_99' },
  { label: 'pg_sandbox_demo_00002_test_key_42 (Sandbox)', key: 'pg_sandbox_demo_00002_test_key_42' },
];

const METHOD_COLORS: Record<string, string> = { GET: '#3FB950', POST: '#FF4455', PUT: '#F97316', PATCH: '#BC8CFF', DELETE: '#F85149' };
const GROUPS = ['Transactions', 'Fraud Graph', 'Rules', 'Signals'];

// -- Syntax Highlighter --------------------------------------------------------
function JsonView({ data, status }: { data: Record<string, unknown> | null; status: number | null }) {
  if (!data) return <div style={{ color: '#475569', fontStyle: 'italic', padding: 20 }}>Send a request to see the response.</div>;
  const ok = status !== null && status < 400;
  const str = JSON.stringify(data, null, 2);
  const lines = str.split('\n');

  const highlighted: { key: string; content: React.ReactNode }[] = [];
  lines.forEach((line, i) => {
    const keyMatch = line.match(/^(\s*)("[\w_]+")(:\s*)(.*)$/);
    if (keyMatch) {
      const [, indent, key, colon, val] = keyMatch;
      const isStr = val.startsWith('"');
      const isNum = !isNaN(Number(val.replace(',', '')));
      const isBool = val.startsWith('true') || val.startsWith('false');
      const valColor = isStr ? '#A5D6FF' : isNum ? '#79C0FF' : isBool ? '#FF7B72' : '#8B949E';
      highlighted.push({ key: `l${i}`, content: <span>{indent}<span style={{ color: '#7EE787' }}>{key}</span>{colon}<span style={{ color: valColor }}>{val}</span></span> });
    } else {
      highlighted.push({ key: `l${i}`, content: <span style={{ color: '#8B949E' }}>{line}</span> });
    }
  });

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 11, fontWeight: 700, color: ok ? '#3FB950' : '#F85149', background: ok ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)', padding: '3px 10px', borderRadius: 6 }}>
        {status}
      </div>
      <pre style={{ margin: 0, padding: '16px 20px', fontSize: 12.5, lineHeight: 1.7, overflowX: 'auto', fontFamily: 'JetBrains Mono, monospace', color: '#E6EDF3' }}>
        {highlighted.map(h => <div key={h.key}>{h.content}</div>)}
      </pre>
    </div>
  );
}

// -- Signal Simulator ----------------------------------------------------------
function SignalSimulator() {
  const [callActive, setCallActive] = useState(true);
  const [paste, setPaste] = useState(false);
  const [keystroke, setKeystroke] = useState(0.12);
  const [simSwap, setSimSwap] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const run = () => {
    const score = (callActive ? 55 : 0) + (paste ? 20 : 0) + Math.round(keystroke * 50) + (simSwap ? 70 : 0);
    const rules: { rule: string; score: number }[] = [];
    if (callActive) rules.push({ rule: 'CALL_ACTIVE_DURING_PAYMENT', score: 55 });
    if (paste) rules.push({ rule: 'PASTE_INTO_AMOUNT', score: 20 });
    if (keystroke > 0.3) rules.push({ rule: 'KEYSTROKE_ANOMALY', score: Math.round(keystroke * 50) });
    if (simSwap) rules.push({ rule: 'SIM_SWAP_48H', score: 70 });
    setResult({
      risk_score: Math.min(score, 100),
      action: score >= 80 ? 'BLOCK' : score >= 45 ? 'WARN_USER' : 'ALLOW',
      rules_fired: rules,
      signal_count: [callActive, paste, keystroke > 0.3, simSwap].filter(Boolean).length,
      latency_ms: 38 + Math.round(Math.random() * 20),
    });
  };

  const toggleStyle = (on: boolean): React.CSSProperties => ({
    width: 44, height: 24, borderRadius: 12, cursor: 'pointer', border: 'none',
    background: on ? '#FF4455' : 'rgba(255,255,255,0.1)',
    position: 'relative', transition: 'background 0.2s',
  });
  const dotStyle = (on: boolean): React.CSSProperties => ({
    width: 18, height: 18, borderRadius: '50%', background: '#fff',
    position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s',
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F6FF', marginBottom: 20 }}>Signal Controls</div>
        {[
          { label: 'Call active during payment', value: callActive, set: setCallActive },
          { label: 'Paste into amount field', value: paste, set: setPaste },
          { label: 'SIM swap detected (48h)', value: simSwap, set: setSimSwap },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>{s.label}</span>
            <button style={toggleStyle(s.value)} onClick={() => s.set(!s.value)}><div style={dotStyle(s.value)} /></button>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>Keystroke anomaly ({keystroke.toFixed(2)})</span>
          <input type="range" min="0" max="1" step="0.01" value={keystroke} onChange={e => setKeystroke(Number(e.target.value))} style={{ width: 120, accentColor: '#FF4455' }} />
        </div>
        <button onClick={run} className="w-btn-primary" style={{ marginTop: 20, width: '100%' }}>Run Evaluation</button>
      </div>
      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.08em' }}>RESULT</div>
        {result ? <JsonView data={result} status={200} /> : <div style={{ padding: 20, color: '#475569', fontStyle: 'italic', fontSize: 13 }}>Configure signals and run evaluation.</div>}
      </div>
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function SandboxPage() {
  const navigate = useNavigate();
  const [showSales, setShowSales] = useState(false);

  const [panelTab, setPanelTab] = useState<PanelTab>('playground');
  const [activeEp, setActiveEp] = useState(0);
  const [reqTab, setReqTab] = useState<RequestTab>('body');
  const [bodyText, setBodyText] = useState(ENDPOINTS[0].body || '');
  const [response, setResponse] = useState<{ data: Record<string, unknown>; status: number; latency: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(API_KEYS[0].key);
  const [search, setSearch] = useState('');

  const ep = ENDPOINTS[activeEp];

  const send = useCallback(() => {
    setLoading(true);
    setResponse(null);
    setTimeout(() => {
      const data = ep.mock(bodyText);
      const hasError = 'error' in data;
      setResponse({ data, status: hasError ? 400 : 200, latency: 38 + Math.round(Math.random() * 30) });
      setLoading(false);
    }, 400 + Math.round(Math.random() * 300));
  }, [ep, bodyText]);

  const selectEp = (i: number) => {
    setActiveEp(i);
    setBodyText(ENDPOINTS[i].body || '');
    setResponse(null);
  };

  const filteredEps = ENDPOINTS.filter(e => e.label.toLowerCase().includes(search.toLowerCase()) || e.path.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: 'Inter, sans-serif', color: '#F0F6FF', overflowX: 'hidden' }}>
      <WebNav />

      {/* Hero */}
      <section style={{ padding: '140px 48px 48px', textAlign: 'center' }}>
        <div className="section-label">Developer Sandbox</div>
        <h1 className="w-heading" style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
          <span className="grad-white-blue">Zero Credentials, Full Access.</span>
        </h1>
        <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.8 }}>
          Fire real API requests against the full endpoint catalogue, inspect live responses, or use the signal simulator to tune fraud rules.
        </p>

        {/* Tab toggle */}
        <div style={{ display: 'inline-flex', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 40 }}>
          {([['playground', '\uD83D\uDEE0\uFE0F API Playground'], ['simulator', '\uD83D\uDCE1 Signal Simulator']] as [PanelTab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setPanelTab(id)} style={{
              padding: '10px 24px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: panelTab === id ? '#FF4455' : 'transparent',
              color: panelTab === id ? '#fff' : '#64748B',
              transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>
      </section>

      {/* Panel */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1200, margin: '0 auto' }}>
        {panelTab === 'playground' ? (
          <div>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
              padding: '14px 20px', borderRadius: 14,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#FF4455', letterSpacing: '0.08em' }}>\uD83D\uDD11 API KEY</div>
              <select value={apiKey} onChange={e => setApiKey(e.target.value)} style={{
                flex: 1, maxWidth: 360, padding: '8px 12px', borderRadius: 8, fontSize: 12,
                background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {API_KEYS.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
              </select>
              <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(63,185,80,0.1)', color: '#3FB950', fontWeight: 700 }}>\u2705 Sandbox Active</div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>Base URL: <span style={{ color: '#A5D6FF' }}>api.payguard.swifter.io/sandbox</span></div>
            </div>

            {/* Endpoint selector + Request area */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
              {/* Endpoints sidebar */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <input placeholder="Search endpoints..." value={search} onChange={e => setSearch(e.target.value)} style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12, border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.3)', color: '#F0F6FF', fontFamily: 'JetBrains Mono, monospace',
                  }} />
                </div>
                {GROUPS.map(g => {
                  const items = filteredEps.filter(e => e.group === g);
                  if (!items.length) return null;
                  return (
                    <div key={g}>
                      <div style={{ padding: '8px 16px', fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.1em' }}>{g.toUpperCase()}</div>
                      {items.map(e => {
                        const idx = ENDPOINTS.indexOf(e);
                        return (
                          <div key={idx} onClick={() => selectEp(idx)} style={{
                            padding: '10px 16px', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center',
                            background: activeEp === idx ? 'rgba(255,68,85,0.08)' : 'transparent',
                            borderLeft: activeEp === idx ? '2px solid #FF4455' : '2px solid transparent',
                            transition: 'all 0.15s',
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: METHOD_COLORS[e.method] || '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{e.method}</span>
                            <span style={{ fontSize: 12, color: activeEp === idx ? '#F0F6FF' : '#64748B' }}>{e.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Request / Response */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* URL bar */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: METHOD_COLORS[ep.method], fontFamily: 'JetBrains Mono, monospace', padding: '6px 12px', borderRadius: 8, background: `${METHOD_COLORS[ep.method]}15` }}>{ep.method}</span>
                  <div style={{ flex: 1, padding: '10px 16px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: '#A5D6FF', fontFamily: 'JetBrains Mono, monospace' }}>
                    api.payguard.swifter.io/sandbox{ep.path}
                  </div>
                  <button onClick={send} disabled={loading} className="w-btn-primary" style={{ padding: '10px 24px', fontSize: 13, opacity: loading ? 0.6 : 1 }}>
                    {loading ? 'Sending...' : '\uD83D\uDE80 Send Request'}
                  </button>
                </div>

                {/* Request tabs */}
                {ep.body && (
                  <div>
                    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
                      {(['body', 'headers', 'auth'] as RequestTab[]).map(t => (
                        <button key={t} onClick={() => setReqTab(t)} style={{
                          padding: '8px 20px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                          color: reqTab === t ? '#FF4455' : '#475569', background: 'transparent',
                          borderBottom: reqTab === t ? '2px solid #FF4455' : '2px solid transparent',
                        }}>{t.toUpperCase()}</button>
                      ))}
                    </div>
                    {reqTab === 'body' && (
                      <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={12} style={{
                        width: '100%', padding: 16, borderRadius: 12, fontSize: 12.5, lineHeight: 1.6,
                        background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#E6EDF3', fontFamily: 'JetBrains Mono, monospace', resize: 'vertical',
                      }} />
                    )}
                    {reqTab === 'headers' && (
                      <pre style={{ padding: 16, borderRadius: 12, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
{`Content-Type: application/json
Authorization: Bearer ${apiKey}
X-Sandbox: true`}
                      </pre>
                    )}
                    {reqTab === 'auth' && (
                      <div style={{ padding: 16, borderRadius: 12, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: '#94A3B8' }}>
                        Bearer token: <span style={{ color: '#A5D6FF', fontFamily: 'JetBrains Mono, monospace' }}>{apiKey}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Response */}
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.08em' }}>RESPONSE</span>
                    {response && <span style={{ fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>{response.latency}ms</span>}
                  </div>
                  <JsonView data={response?.data || null} status={response?.status || null} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <SignalSimulator />
        )}
      </section>

      {/* CTA */}
      <section style={{ padding: '0 48px 80px', textAlign: 'center' }}>
        <div className="divider-glow" style={{ marginBottom: 64 }} />
        <h2 className="w-heading" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
          <span className="grad-blue-green">Ready to Integrate?</span>
        </h2>
        <p style={{ fontSize: 16, color: '#64748B', marginBottom: 32 }}>Move from sandbox to production in under 48 hours. Talk to our team to get started.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button className="w-btn-primary" onClick={() => setShowSales(true)} style={{ fontSize: 15, padding: '14px 32px' }}>🤝 Talk to Sales</button>
          <button className="w-btn-secondary" onClick={() => navigate('/developers')}>SDK Documentation</button>
          <button className="w-btn-secondary" onClick={() => navigate('/products')}>View Products</button>
        </div>
      </section>
      {showSales && <TalkToSalesModal onClose={() => setShowSales(false)} />}

      <WebFooter />
    </div>
  );
}
