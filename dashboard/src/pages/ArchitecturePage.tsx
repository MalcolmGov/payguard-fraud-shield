import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebNav, { WebFooter } from '../components/WebNav';
import TalkToSalesModal from '../components/TalkToSalesModal';

const LAYERS = [
  {
    id: 0, num: '01', color: '#3B82F6', icon: '\uD83D\uDCF1', title: 'Customer Device Layer',
    subtitle: 'Android \u2022 iOS \u2022 React Native',
    desc: 'The PayGuard SDK runs entirely on the customer\'s device. Four signal collectors run asynchronously during the payment flow, capturing call state, paste events, keystroke cadence, and device telemetry. All signals are AES-256 encrypted before leaving the device.',
    components: [
      { name: 'Call State Monitor', desc: 'Detects active phone calls during payment' },
      { name: 'Paste Detector', desc: 'Flags clipboard paste into amount fields' },
      { name: 'Keystroke Analyser', desc: 'Cadence anomaly detection via timing deltas' },
      { name: 'Device Fingerprint', desc: 'SIM, IMEI, carrier, root/jailbreak status' },
    ],
  },
  {
    id: 1, num: '02', color: '#0EA5E9', icon: '\uD83D\uDCE1', title: 'Signal Ingestion Layer',
    subtitle: 'Kafka \u2022 gRPC \u2022 Redis Streams',
    desc: 'Encrypted signal payloads are streamed to a Kafka cluster hosted in AWS af-south-1. A gRPC gateway validates, deduplicates, and routes events to the risk engine and graph database in parallel.',
    components: [
      { name: 'gRPC Gateway', desc: 'TLS 1.3 ingest with mutual authentication' },
      { name: 'Kafka Cluster', desc: '3-node cluster, 99.99% uptime, auto-scaling' },
      { name: 'Signal Validator', desc: 'Schema validation, dedup, rate limiting' },
      { name: 'Redis Streams', desc: 'Real-time event bus for sub-10ms routing' },
    ],
  },
  {
    id: 2, num: '03', color: '#00D4AA', icon: '\u26A1', title: 'Risk Engine Layer',
    subtitle: 'Rust \u2022 35 Rules \u2022 Sub-50ms',
    desc: 'The risk engine evaluates all 35 fraud rules in parallel. Each rule returns a score; the aggregation layer computes a final risk verdict (ALLOW, WARN, BLOCK) and returns it before the customer taps Confirm.',
    components: [
      { name: 'Rule Engine (Rust)', desc: '35 rules evaluated in parallel, p99 < 50ms' },
      { name: 'Score Aggregator', desc: 'Weighted scoring with configurable thresholds' },
      { name: 'Action Enforcer', desc: 'ALLOW / WARN / BLOCK with audit trail' },
      { name: 'Rule Hot-Deploy', desc: 'Live rule updates via Redis pub/sub' },
    ],
  },
  {
    id: 3, num: '04', color: '#14B8A6', icon: '\uD83D\uDD78\uFE0F', title: 'Graph & Analytics Layer',
    subtitle: 'Neo4j \u2022 React Dashboard \u2022 REST API',
    desc: 'A Neo4j-powered fraud graph links accounts, devices, and wallets across your entire customer base. The analyst dashboard provides the investigation UI, bulk block actions, and live rule tuning.',
    components: [
      { name: 'Fraud Graph (Neo4j)', desc: 'Device > Account > Wallet relationship graph' },
      { name: 'Ring Detector', desc: 'Cypher queries for mule network patterns' },
      { name: 'Kafka Consumer', desc: 'Streams risk events into graph in real-time' },
      { name: 'Analyst Dashboard', desc: 'React + Vite, 8 pages, live rule engine UI' },
    ],
  },
];

const SPECS = [
  { label: 'Decision Latency (p99)',  value: '< 100ms', icon: '\u23F1\uFE0F', color: '#3B82F6' },
  { label: 'SDK Size (Android)',       value: '0.8 MB',  icon: '\uD83D\uDCE6', color: '#0EA5E9' },
  { label: 'Signal Encryption',       value: 'AES-256', icon: '\uD83D\uDD10', color: '#00D4AA' },
  { label: 'Availability SLA',        value: '99.99%',  icon: '\u2705', color: '#14B8A6' },
  { label: 'Data Residency',          value: 'South Africa', icon: '\uD83C\uDF0D', color: '#3B82F6' },
  { label: 'Hosting',                 value: 'AWS af-south-1', icon: '\u2601\uFE0F', color: '#0EA5E9' },
  { label: 'Compliance',              value: 'POPIA \u2022 FSCA \u2022 SARB', icon: '\uD83D\uDCDC', color: '#00D4AA' },
  { label: 'TLS Version',             value: 'TLS 1.3', icon: '\uD83D\uDD12', color: '#14B8A6' },
];

const LATENCY = [
  { step: 'Signal capture (on-device)', ms: '~12ms', width: '12', color: '#3B82F6' },
  { step: 'Encrypted transit',          ms: '~18ms', width: '18', color: '#0EA5E9' },
  { step: 'Rule evaluation (35 rules)', ms: '~42ms', width: '42', color: '#00D4AA' },
  { step: 'Response + enforcement',     ms: '~8ms',  width: '8',  color: '#14B8A6' },
];

export default function ArchitecturePage() {
  const navigate = useNavigate();
  const [activeLayer, setActiveLayer] = useState(0);
  const [showSales, setShowSales] = useState(false);
  const layer = LAYERS[activeLayer];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--w-bg)', fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)', overflowX: 'hidden' }}>
      <WebNav />

      {/* Hero */}
      <section style={{ padding: '140px 48px 80px', textAlign: 'center', position: 'relative' }}>
        <div className="section-label">System Architecture</div>
        <h1 className="w-heading" style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
          <span className="grad-white-blue">Four Layers.</span><br />
          <span style={{ color: 'var(--w-text-1)' }}>Zero Single Points of Failure.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--w-text-2)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.8 }}>
          From device SDK to graph engine &mdash; every component is independently scalable, encrypted end-to-end, and hosted in South Africa.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button className="w-btn-primary" onClick={() => navigate('/developers')}>View SDK Docs</button>
          <button className="w-btn-secondary" onClick={() => navigate('/sandbox')}>Try Sandbox</button>
        </div>
      </section>

      {/* Layer Selector */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 48, flexWrap: 'wrap' }}>
          {LAYERS.map(l => (
            <button key={l.id}
              onClick={() => setActiveLayer(l.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 24px', borderRadius: 16, cursor: 'pointer',
                border: activeLayer === l.id ? `1px solid ${l.color}` : '1px solid rgba(255,255,255,0.08)',
                background: activeLayer === l.id ? `${l.color}15` : 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 32 }}>{l.icon}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: l.color }}>{l.num}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: activeLayer === l.id ? '#F0F6FF' : '#64748B' }}>{l.title}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Active Layer Detail */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.6) 100%)',
          border: `1px solid ${layer.color}30`,
          borderRadius: 24, padding: '48px 48px 40px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${layer.color}, transparent)` }} />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 36 }}>{layer.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: layer.color, marginBottom: 4 }}>LAYER {layer.num}</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--w-text-1)' }}>{layer.title}</h2>
            </div>
          </div>
          <div style={{ fontSize: 12, color: layer.color, marginBottom: 16, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>{layer.subtitle}</div>
          <p style={{ fontSize: 15, color: 'var(--w-text-2)', lineHeight: 1.85, marginBottom: 32, maxWidth: 700 }}>{layer.desc}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {layer.components.map((c, i) => (
              <div key={i} style={{
                background: 'var(--w-card)',
                border: '1px solid var(--w-card-border)',
                borderRadius: 14, padding: '20px 24px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--w-text-1)', marginBottom: 6 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: 'var(--w-text-3)', lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latency Waterfall */}
      <section style={{ padding: '0 48px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="section-label">End-to-End Latency</div>
          <h2 className="w-heading" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>Signal to Decision in ~80ms</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LATENCY.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 200, fontSize: 13, color: 'var(--w-text-2)', textAlign: 'right', flexShrink: 0 }}>{r.step}</div>
              <div style={{ flex: 1, height: 28, background: 'var(--w-card)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', width: `${r.width}%`, background: r.color, borderRadius: 99, boxShadow: `0 0 8px ${r.color}50`, minWidth: 40 }} />
              </div>
              <div style={{ width: 60, fontSize: 13, fontWeight: 700, color: r.color, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{r.ms}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--w-text-3)' }}>Total end-to-end (p50)</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#00D4AA', fontFamily: 'Outfit' }}>~80ms</span>
        </div>
      </section>

      {/* Technical Specs */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-label">Technical Specs</div>
          <h2 className="w-heading" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>Enterprise-Grade by Default</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {SPECS.map((s, i) => (
            <div key={i} style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.5) 100%)',
              border: `1px solid ${s.color}25`,
              borderRadius: 16, padding: '24px 20px', textAlign: 'center',
              transition: 'transform 0.2s, border-color 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.borderColor = `${s.color}50`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.borderColor = `${s.color}25`; }}
            >
              <div style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, border: `1px solid ${s.color}30`, alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--w-text-1)', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--w-text-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 48px 80px', textAlign: 'center' }}>
        <div className="divider-glow" style={{ marginBottom: 64 }} />
        <h2 className="w-heading" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
          <span className="grad-blue-green">Ready to Deploy PayGuard?</span>
        </h2>
        <p style={{ fontSize: 16, color: 'var(--w-text-3)', marginBottom: 32 }}>Talk to our team about integrating PayGuard into your infrastructure, or explore our SDK documentation.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button className="w-btn-primary" onClick={() => setShowSales(true)} style={{ fontSize: 15, padding: '14px 32px' }}>🤝 Talk to Sales</button>
          <button className="w-btn-secondary" onClick={() => navigate('/developers')}>SDK Documentation</button>
          <button className="w-btn-secondary" onClick={() => navigate('/sandbox')}>Try Sandbox</button>
        </div>
      </section>
      {showSales && <TalkToSalesModal onClose={() => setShowSales(false)} />}

      <WebFooter />
    </div>
  );
}
