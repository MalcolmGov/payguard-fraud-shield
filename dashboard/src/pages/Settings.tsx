import { useState } from 'react';

interface Toast { id: number; msg: string; type: 'success' | 'warn'; }

export default function Settings() {
  // Risk thresholds
  const [lowMax, setLowMax] = useState(30);
  const [medMax, setMedMax] = useState(70);
  const [autoBlock, setAutoBlock] = useState(90);

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [alertEmail, setAlertEmail] = useState('fraud-team@payguard.africa');
  const [alertPhone, setAlertPhone] = useState('+27821234567');
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T0XXXXX/B0XXXXX/xxxx');

  // API Keys
  const [apiKeys] = useState([
    { id: 'pk_live_4xR8nB2', name: 'Production API Key', created: '2025-11-01', lastUsed: '2026-03-14', status: 'active' },
    { id: 'pk_test_9yK3mD7', name: 'Sandbox API Key', created: '2026-01-15', lastUsed: '2026-03-13', status: 'active' },
    { id: 'pk_live_2wQ5pL1', name: 'Legacy Integration', created: '2024-06-20', lastUsed: '2025-12-01', status: 'revoked' },
  ]);

  // Session settings
  const [sessionTTL, setSessionTTL] = useState('8');
  const [maxAttempts, setMaxAttempts] = useState('5');
  const [lockoutDuration, setLockoutDuration] = useState('30');

  // Geolocation
  const [geoEnabled, setGeoEnabled] = useState(true);
  const [anomalyThreshold, setAnomalyThreshold] = useState(500);
  const [vpnDetection, setVpnDetection] = useState(true);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (msg: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const ToggleSwitch = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <div onClick={onToggle} style={{
      width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative',
      background: on ? 'rgba(16,245,160,0.3)' : 'rgba(255,255,255,0.08)',
      border: on ? '1px solid rgba(16,245,160,0.5)' : '1px solid rgba(255,255,255,0.15)',
      transition: 'all 0.2s',
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: 8, position: 'absolute', top: 2,
        left: on ? 21 : 2, transition: 'left 0.2s',
        background: on ? '#10F5A0' : '#475569',
      }} />
    </div>
  );

  const SectionHeader = ({ icon, title, sub }: { icon: string; title: string; sub: string }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.1em', marginBottom: 6 }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: 11, color: '#334155' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)', minHeight: '100vh' }}>
      {/* Toast stack */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: 340 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 16px', borderRadius: 12, fontSize: 12, fontWeight: 500,
            background: t.type === 'success' ? 'rgba(16,245,160,0.1)' : 'rgba(251,191,36,0.1)',
            border: `1px solid ${t.type === 'success' ? 'rgba(16,245,160,0.35)' : 'rgba(251,191,36,0.35)'}`,
            color: t.type === 'success' ? '#10F5A0' : '#FBBF24',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>{t.msg}</div>
        ))}
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
          ⚙️ Settings
        </h1>
        <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>Platform configuration · Risk thresholds · API management</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ── Risk Thresholds ── */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)', borderRadius: 14, padding: 24 }}>
          <SectionHeader icon="🎚️" title="RISK THRESHOLDS" sub="Configure risk scoring boundaries and auto-block trigger" />

          {/* Visual threshold bars */}
          <div style={{ marginBottom: 24, padding: '16px', background: 'var(--w-card)', borderRadius: 12 }}>
            <div style={{ display: 'flex', height: 24, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ width: `${lowMax}%`, background: 'rgba(16,245,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#10F5A0' }}>LOW 0–{lowMax}</span>
              </div>
              <div style={{ width: `${medMax - lowMax}%`, background: 'rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#FBBF24' }}>MED {lowMax}–{medMax}</span>
              </div>
              <div style={{ width: `${100 - medMax}%`, background: 'rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#EF4444' }}>HIGH {medMax}–100</span>
              </div>
            </div>
            <div style={{ height: 2, background: 'var(--w-card)', borderRadius: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', left: `${autoBlock}%`, top: -6, width: 2, height: 14, background: '#EF4444' }} />
              <div style={{ position: 'absolute', left: `${autoBlock - 2}%`, top: 10, fontSize: 8, color: '#EF4444', fontWeight: 700 }}>AUTO-BLOCK: {autoBlock}</div>
            </div>
          </div>

          {[
            { label: 'Low Risk Max', value: lowMax, setter: setLowMax, color: '#10F5A0', min: 10, max: 50 },
            { label: 'Medium Risk Max', value: medMax, setter: setMedMax, color: '#FBBF24', min: 40, max: 90 },
            { label: 'Auto-Block Threshold', value: autoBlock, setter: setAutoBlock, color: '#EF4444', min: 70, max: 100 },
          ].map(s => (
            <div key={s.label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--w-text-2)', fontWeight: 500 }}>{s.label}</label>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</span>
              </div>
              <input type="range" min={s.min} max={s.max} value={s.value}
                onChange={e => s.setter(Number(e.target.value))}
                style={{ width: '100%', accentColor: s.color, cursor: 'pointer' }}
              />
            </div>
          ))}

          <button onClick={() => addToast('✅ Risk thresholds saved')} style={{
            width: '100%', padding: '11px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700,
            background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
          }}>Save Thresholds</button>
        </div>

        {/* ── Notifications ── */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)', borderRadius: 14, padding: 24 }}>
          <SectionHeader icon="🔔" title="NOTIFICATIONS" sub="Alert channels for fraud events and system changes" />

          {/* Channel toggles */}
          {[
            { label: 'Email Alerts', on: emailAlerts, toggle: () => setEmailAlerts(!emailAlerts), color: '#0EA5E9' },
            { label: 'SMS Alerts', on: smsAlerts, toggle: () => setSmsAlerts(!smsAlerts), color: '#10F5A0' },
            { label: 'Slack Notifications', on: slackAlerts, toggle: () => setSlackAlerts(!slackAlerts), color: '#A78BFA' },
          ].map(ch => (
            <div key={ch.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: '1px solid var(--w-card-border)',
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: ch.on ? '#F0F6FF' : '#475569' }}>{ch.label}</span>
                <span style={{ fontSize: 9, marginLeft: 8, padding: '2px 6px', borderRadius: 4, background: ch.on ? 'rgba(16,245,160,0.1)' : 'rgba(255,255,255,0.05)', color: ch.on ? '#10F5A0' : '#475569', fontWeight: 700 }}>
                  {ch.on ? 'ON' : 'OFF'}
                </span>
              </div>
              <ToggleSwitch on={ch.on} onToggle={ch.toggle} />
            </div>
          ))}

          {/* Contact fields */}
          <div style={{ marginTop: 16 }}>
            {[
              { label: 'Alert Email', value: alertEmail, setter: setAlertEmail, disabled: !emailAlerts },
              { label: 'SMS Number', value: alertPhone, setter: setAlertPhone, disabled: !smsAlerts },
              { label: 'Slack Webhook', value: slackWebhook, setter: setSlackWebhook, disabled: !slackAlerts },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 6 }}>{f.label.toUpperCase()}</label>
                <input value={f.value} onChange={e => f.setter(e.target.value)} disabled={f.disabled} style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 12, boxSizing: 'border-box',
                  background: f.disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--w-card-border)', color: f.disabled ? '#334155' : '#F0F6FF',
                  fontFamily: 'JetBrains Mono, monospace', opacity: f.disabled ? 0.5 : 1,
                }} />
              </div>
            ))}
          </div>

          <button onClick={() => addToast('✅ Notification preferences saved')} style={{
            width: '100%', padding: '11px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700,
            background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(167,139,250,0.3)', marginTop: 4,
          }}>Save Notifications</button>
        </div>

        {/* ── Geolocation Settings ── */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)', borderRadius: 14, padding: 24 }}>
          <SectionHeader icon="📍" title="GEOLOCATION & DEVICE INTELLIGENCE" sub="GPS tracking, anomaly detection, and VPN enforcement" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--w-card-border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: geoEnabled ? '#F0F6FF' : '#475569' }}>GPS Location Tracking</span>
            <ToggleSwitch on={geoEnabled} onToggle={() => setGeoEnabled(!geoEnabled)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--w-card-border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: vpnDetection ? '#F0F6FF' : '#475569' }}>VPN / Proxy Detection</span>
            <ToggleSwitch on={vpnDetection} onToggle={() => setVpnDetection(!vpnDetection)} />
          </div>

          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--w-text-2)' }}>Anomaly Distance Threshold (km)</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#F97316', fontFamily: 'JetBrains Mono, monospace' }}>{anomalyThreshold}km</span>
            </div>
            <input type="range" min={50} max={2000} step={50} value={anomalyThreshold}
              onChange={e => setAnomalyThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#F97316', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#334155', marginTop: 4 }}>
              <span>50km (strict)</span><span>2000km (lenient)</span>
            </div>
          </div>

          <button onClick={() => addToast('✅ Geolocation settings saved')} style={{
            width: '100%', padding: '11px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700,
            background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
          }}>Save Geo Settings</button>
        </div>

        {/* ── Session & Security ── */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)', borderRadius: 14, padding: 24 }}>
          <SectionHeader icon="🔐" title="SESSION & SECURITY" sub="Login policies, session timeouts, and lockout configuration" />

          {[
            { label: 'Session Timeout (hours)', value: sessionTTL, setter: setSessionTTL },
            { label: 'Max Login Attempts', value: maxAttempts, setter: setMaxAttempts },
            { label: 'Lockout Duration (seconds)', value: lockoutDuration, setter: setLockoutDuration },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 6 }}>{f.label.toUpperCase()}</label>
              <input value={f.value} onChange={e => f.setter(e.target.value)} style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, boxSizing: 'border-box',
                background: 'var(--w-card)', border: '1px solid var(--w-card-border)', color: 'var(--w-text-1)',
                fontFamily: 'JetBrains Mono, monospace',
              }} />
            </div>
          ))}

          <div style={{
            padding: '12px 14px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: 10, marginBottom: 16, fontSize: 11, color: '#FBBF24', lineHeight: 1.6,
          }}>
            ⚠️ Changing session settings will force all active sessions to re-authenticate.
          </div>

          <button onClick={() => addToast('✅ Security settings saved')} style={{
            width: '100%', padding: '11px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700,
            background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
          }}>Save Security Settings</button>
        </div>
      </div>

      {/* ── API Keys ── */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)', borderRadius: 14, padding: 24, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <SectionHeader icon="🔑" title="API KEYS" sub="Manage integration keys for the PayGuard REST API" />
          </div>
          <button onClick={() => addToast('🔑 New API key generated — copy it now, it won\'t be shown again')} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
            background: 'rgba(16,245,160,0.1)', color: '#10F5A0',
          }}>+ Generate New Key</button>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '200px 1fr 100px 100px 80px 100px',
          padding: '10px 16px', borderBottom: '1px solid var(--w-card-border)', gap: 12,
        }}>
          {['KEY ID', 'NAME', 'CREATED', 'LAST USED', 'STATUS', 'ACTION'].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
          ))}
        </div>
        {apiKeys.map(key => (
          <div key={key.id} style={{
            display: 'grid', gridTemplateColumns: '200px 1fr 100px 100px 80px 100px',
            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', gap: 12, alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--w-text-2)' }}>{key.id}</span>
            <span style={{ fontSize: 12, color: 'var(--w-text-1)', fontWeight: 500 }}>{key.name}</span>
            <span style={{ fontSize: 11, color: 'var(--w-text-3)' }}>{key.created}</span>
            <span style={{ fontSize: 11, color: 'var(--w-text-3)' }}>{key.lastUsed}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textAlign: 'center',
              background: key.status === 'active' ? 'rgba(16,245,160,0.1)' : 'rgba(239,68,68,0.1)',
              color: key.status === 'active' ? '#10F5A0' : '#EF4444',
              textTransform: 'uppercase',
            }}>{key.status}</span>
            <button onClick={() => addToast(key.status === 'active' ? `⚠️ Key ${key.id} revoked` : `Key already revoked`, key.status === 'active' ? 'warn' : 'success')} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: key.status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
              color: key.status === 'active' ? '#EF4444' : '#475569',
            }}>{key.status === 'active' ? 'Revoke' : 'Revoked'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
