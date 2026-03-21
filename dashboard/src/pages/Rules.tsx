import { useState } from 'react';
import { mockRules } from '../data/mock';
import type { FraudRule } from '../data/mock';

interface Toast { id: number; msg: string; type: 'success' | 'warn'; }

export default function Rules() {
  const [rules, setRules] = useState<FraudRule[]>(mockRules.map(r => ({ ...r })));
  const [editRule, setEditRule] = useState<FraudRule | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editScore, setEditScore] = useState(0);
  const [editSeverity, setEditSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  const toggle = (ruleId: string) => {
    setRules(prev => prev.map(r => r.ruleId === ruleId ? { ...r, enabled: !r.enabled } : r));
  };

  const openEdit = (rule: FraudRule) => {
    setEditRule(rule);
    setEditName(rule.name);
    setEditDesc(rule.description);
    setEditScore(rule.score);
    setEditSeverity(rule.severity);
  };

  const addToast = (msg: string, type: Toast['type']) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const saveEdit = () => {
    if (!editRule) return;
    setRules(prev => prev.map(r =>
      r.ruleId === editRule.ruleId
        ? { ...r, name: editName, description: editDesc, score: editScore, scoreDelta: editScore, severity: editSeverity }
        : r
    ));
    addToast(`✅ ${editRule.ruleId} updated — score: ${editScore}, severity: ${editSeverity}`, 'success');
    setEditRule(null);
  };

  const activeCount = rules.filter(r => r.enabled).length;
  const criticalRules = rules.filter(r => r.severity === 'CRITICAL' || r.score >= 50);

  const severityColor = (s: string) => {
    if (s === 'CRITICAL') return '#EF4444';
    if (s === 'HIGH') return '#F97316';
    if (s === 'MEDIUM') return '#FBBF24';
    return '#10F5A0';
  };

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)' }}>
      {/* Toast stack */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: 380 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 16px', borderRadius: 12, fontSize: 12, lineHeight: 1.6, fontWeight: 500,
            background: t.type === 'success' ? 'rgba(16,245,160,0.1)' : 'rgba(251,191,36,0.1)',
            border: `1px solid ${t.type === 'success' ? 'rgba(16,245,160,0.35)' : 'rgba(251,191,36,0.35)'}`,
            color: t.type === 'success' ? '#10F5A0' : '#FBBF24',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeInDown 0.3s ease',
          }}>{t.msg}</div>
        ))}
      </div>

      {/* Edit Modal */}
      {editRule && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        }} onClick={() => setEditRule(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(140deg,#0A101E,#080D18)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
            padding: 32, width: 480, boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>EDIT RULE</div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--w-text-1)' }}>{editRule.ruleId}</h3>
              </div>
              <button onClick={() => setEditRule(null)} style={{ background: 'none', border: 'none', color: 'var(--w-text-3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>RULE NAME</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
                background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--w-text-1)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
              }} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>DESCRIPTION</label>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, resize: 'vertical',
                background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--w-text-1)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
              }} />
            </div>

            {/* Score slider + Severity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {/* Score */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  SCORE <span style={{ color: severityColor(editSeverity), fontFamily: 'JetBrains Mono, monospace' }}>{editScore}</span>
                </label>
                <input type="range" min={0} max={100} value={editScore} onChange={e => setEditScore(Number(e.target.value))} style={{
                  width: '100%', accentColor: severityColor(editSeverity),
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#334155', marginTop: 4 }}>
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
              </div>

              {/* Severity */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>SEVERITY</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(sev => (
                    <button key={sev} onClick={() => setEditSeverity(sev)} style={{
                      padding: '8px 4px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      background: editSeverity === sev ? `${severityColor(sev)}25` : 'rgba(255,255,255,0.04)',
                      color: editSeverity === sev ? severityColor(sev) : '#475569',
                      border: editSeverity === sev ? `1px solid ${severityColor(sev)}50` : '1px solid rgba(255,255,255,0.06)',
                      transition: 'all 0.2s',
                    }}>{sev}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div style={{
              padding: '12px 16px', borderRadius: 12, marginBottom: 20,
              background: `${severityColor(editSeverity)}08`,
              border: `1px solid ${severityColor(editSeverity)}25`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 8 }}>PREVIEW</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text-1)', marginBottom: 4 }}>{editName}</div>
              <div style={{ fontSize: 11, color: 'var(--w-text-3)', marginBottom: 6 }}>{editDesc}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--w-text-2)' }}>
                  Score: <span style={{ fontWeight: 700, color: severityColor(editSeverity), fontFamily: 'JetBrains Mono, monospace' }}>{editScore}</span>
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  background: `${severityColor(editSeverity)}18`, color: severityColor(editSeverity),
                }}>{editSeverity}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditRule(null)} style={{
                flex: 1, padding: '11px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--w-text-3)',
              }}>Cancel</button>
              <button onClick={saveEdit} style={{
                flex: 1, padding: '11px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', border: 'none', color: '#fff',
                boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
              }}>💾 Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
            Rules Engine
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>
            {activeCount} of {rules.length} rules active · Hot-deploy via Redis pub/sub · <span style={{ color: '#0EA5E9' }}>Click any card to edit</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(16,245,160,0.08)', border: '1px solid rgba(16,245,160,0.2)' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', display: 'block' }}>ACTIVE</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#10F5A0', fontFamily: 'Outfit, sans-serif' }}>{activeCount}</span>
          </div>
          <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', display: 'block' }}>CRITICAL</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#EF4444', fontFamily: 'Outfit, sans-serif' }}>{criticalRules.length}</span>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {rules.map((rule) => {
          const sColor = severityColor(rule.severity || 'MEDIUM');
          return (
            <div key={rule.ruleId} onClick={() => openEdit(rule)} style={{
              background: 'rgba(255,255,255,0.025)', border: `1px solid ${rule.enabled ? sColor + '30' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 14, padding: '20px', position: 'relative', overflow: 'hidden', cursor: 'pointer',
              opacity: rule.enabled ? 1 : 0.5, transition: 'all 0.2s',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: rule.enabled ? sColor : 'transparent' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>{rule.ruleId}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--w-text-1)', fontFamily: 'Outfit, sans-serif' }}>{rule.name}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); toggle(rule.ruleId); }} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                  background: rule.enabled ? '#10F5A0' : 'rgba(255,255,255,0.1)', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 9, background: '#fff',
                    position: 'absolute', top: 3, left: rule.enabled ? 23 : 3, transition: 'left 0.2s',
                  }} />
                </button>
              </div>

              <p style={{ fontSize: 12, color: 'var(--w-text-3)', lineHeight: 1.6, marginBottom: 12 }}>{rule.description}</p>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {rule.score != null && (
                  <div style={{ fontSize: 11, color: 'var(--w-text-2)' }}>
                    Score: <span style={{ fontWeight: 700, color: sColor, fontFamily: 'JetBrains Mono, monospace' }}>{rule.score}</span>
                  </div>
                )}
                {rule.severity && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                    background: `${sColor}18`, color: sColor,
                  }}>{rule.severity}</span>
                )}
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                  background: rule.enabled ? 'rgba(16,245,160,0.1)' : 'rgba(255,255,255,0.05)',
                  color: rule.enabled ? '#10F5A0' : '#475569',
                }}>{rule.enabled ? 'ENABLED' : 'DISABLED'}</span>
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 6, marginLeft: 'auto',
                  background: 'rgba(14,165,233,0.1)', color: '#0EA5E9',
                }}>✏️ Edit</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
