import { useState } from 'react';
import { mockTransactions } from '../data/mock';

interface Account {
  phone: string;
  name: string;
  txCount: number;
  maxRisk: string;
  totalAmount: number;
  blocked: boolean;
  lastSeen: string;
  notes: string[];
}

function buildAccounts(): Account[] {
  const map = new Map<string, Account>();
  mockTransactions.forEach(tx => {
    const existing = map.get(tx.userPhone);
    if (existing) {
      existing.txCount += 1;
      existing.totalAmount += tx.amount;
      if (['HIGH', 'MEDIUM', 'LOW'].indexOf(existing.maxRisk) > ['HIGH', 'MEDIUM', 'LOW'].indexOf(tx.riskLevel)) {
        existing.maxRisk = tx.riskLevel;
      }
    } else {
      map.set(tx.userPhone, {
        phone: tx.userPhone,
        name: 'Account ' + tx.userPhone.slice(-4),
        txCount: 1,
        maxRisk: tx.riskLevel,
        totalAmount: tx.amount,
        blocked: false,
        lastSeen: tx.createdAt,
        notes: [],
      });
    }
  });
  return Array.from(map.values());
}

interface Toast { id: number; msg: string; type: 'success' | 'warn'; }

export default function Accounts() {
  const [accounts, setAccounts] = useState(buildAccounts);
  const [search, setSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (msg: string, type: Toast['type']) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const toggle = (phone: string) => {
    setAccounts(prev => prev.map(a => a.phone === phone ? { ...a, blocked: !a.blocked } : a));
    const acc = accounts.find(a => a.phone === phone);
    if (acc) addToast(`${acc.blocked ? '🔓 Unblocked' : '🔒 Blocked'} — ${acc.name} (${phone})`, acc.blocked ? 'success' : 'warn');
  };

  const changeRisk = (phone: string, risk: string) => {
    setAccounts(prev => prev.map(a => a.phone === phone ? { ...a, maxRisk: risk } : a));
    addToast(`⚠️ Risk override → ${risk} for ${phone}`, 'warn');
  };

  const addNote = (phone: string) => {
    if (!noteInput.trim()) return;
    const timestamp = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    setAccounts(prev => prev.map(a =>
      a.phone === phone ? { ...a, notes: [`[${timestamp}] ${noteInput.trim()}`, ...a.notes] } : a
    ));
    addToast(`📝 Note added to ${phone}`, 'success');
    setNoteInput('');
  };

  const filtered = accounts.filter(a => a.phone.includes(search));
  const blockedCount = accounts.filter(a => a.blocked).length;
  const highRiskCount = accounts.filter(a => a.maxRisk === 'HIGH').length;
  const selected = accounts.find(a => a.phone === selectedPhone);
  const selectedTxs = selectedPhone ? mockTransactions.filter(tx => tx.userPhone === selectedPhone) : [];

  const riskColor = (r: string) => r === 'HIGH' ? '#EF4444' : r === 'MEDIUM' ? '#FBBF24' : '#10F5A0';

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: '#F0F6FF' }}>
      {/* Toast stack */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: 360 }}>
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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
            Account Management
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>
            {accounts.length} accounts tracked · <span style={{ color: '#0EA5E9' }}>Click any row for account detail</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', display: 'block' }}>HIGH RISK</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#EF4444', fontFamily: 'Outfit, sans-serif' }}>{highRiskCount}</span>
          </div>
          <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', display: 'block' }}>BLOCKED</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#F85149', fontFamily: 'Outfit, sans-serif' }}>{blockedCount}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <input
        placeholder="Search by phone number…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', maxWidth: 360, padding: '10px 16px', borderRadius: 10, fontSize: 13, marginBottom: 20,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#F0F6FF', fontFamily: 'JetBrains Mono, monospace',
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16, transition: 'all 0.3s' }}>
        {/* Table */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 100px 90px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 8 }}>
            {['PHONE / ACCOUNT', 'TRANSACTIONS', 'TOTAL AMOUNT', 'RISK', 'STATUS', 'ACTION'].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
            ))}
          </div>
          {filtered.map((a, i) => (
            <div key={a.phone} onClick={() => setSelectedPhone(selectedPhone === a.phone ? null : a.phone)} style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 100px 90px',
              padding: '12px 20px', gap: 8, alignItems: 'center', cursor: 'pointer',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              background: selectedPhone === a.phone ? 'rgba(14,165,233,0.05)' : a.blocked ? 'rgba(248,81,73,0.03)' : 'transparent',
              borderLeft: selectedPhone === a.phone ? '2px solid #0EA5E9' : '2px solid transparent',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = selectedPhone === a.phone ? 'rgba(14,165,233,0.05)' : a.blocked ? 'rgba(248,81,73,0.03)' : 'transparent')}
            >
              <div>
                <div style={{ fontSize: 13, color: '#F0F6FF', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{a.phone}</div>
                <div style={{ fontSize: 10, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {a.name}
                  {a.notes.length > 0 && <span style={{ fontSize: 9, color: '#0EA5E9' }}>📝 {a.notes.length}</span>}
                </div>
              </div>
              <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{a.txCount}</span>
              <span style={{ fontSize: 13, color: '#F0F6FF', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>R{a.totalAmount.toLocaleString()}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 6, textAlign: 'center',
                background: `${riskColor(a.maxRisk)}18`, color: riskColor(a.maxRisk),
              }}>{a.maxRisk}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: a.blocked ? '#F85149' : '#10F5A0',
              }}>{a.blocked ? '🔒 Blocked' : '✅ Active'}</span>
              <button onClick={e => { e.stopPropagation(); toggle(a.phone); }} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: a.blocked ? 'rgba(16,245,160,0.1)' : 'rgba(239,68,68,0.1)',
                color: a.blocked ? '#10F5A0' : '#EF4444',
                transition: 'all 0.2s',
              }}>{a.blocked ? 'Unblock' : 'Block'}</button>
            </div>
          ))}
        </div>

        {/* Detail Drawer */}
        {selected && (
          <div style={{
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '22px', position: 'sticky', top: 20, height: 'fit-content',
            maxHeight: 'calc(100vh - 60px)', overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: riskColor(selected.maxRisk), letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {selected.blocked ? '🔒 BLOCKED' : 'ACCOUNT DETAIL'}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: '#8B949E', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{selected.phone}</div>
              </div>
              <button onClick={() => setSelectedPhone(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Transactions', value: selected.txCount.toString(), color: '#0EA5E9' },
                { label: 'Total Volume', value: `R${selected.totalAmount.toLocaleString()}`, color: '#F0F6FF' },
              ].map(s => (
                <div key={s.label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Risk Override */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 8 }}>RISK OVERRIDE</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map(risk => (
                  <button key={risk} onClick={() => changeRisk(selected.phone, risk)} style={{
                    flex: 1, padding: '8px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    background: selected.maxRisk === risk ? `${riskColor(risk)}25` : 'rgba(255,255,255,0.04)',
                    border: selected.maxRisk === risk ? `1px solid ${riskColor(risk)}50` : '1px solid rgba(255,255,255,0.06)',
                    color: selected.maxRisk === risk ? riskColor(risk) : '#475569',
                    transition: 'all 0.2s',
                  }}>{risk}</button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 8 }}>ANALYST NOTES</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addNote(selected.phone); }}
                  placeholder="Add a note…"
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#F0F6FF', fontFamily: 'Inter, sans-serif',
                  }}
                />
                <button onClick={() => addNote(selected.phone)} style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: 'rgba(14,165,233,0.12)', color: '#0EA5E9',
                }}>+ Add</button>
              </div>
              {selected.notes.length === 0 ? (
                <div style={{ fontSize: 11, color: '#334155', fontStyle: 'italic' }}>No notes yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                  {selected.notes.map((note, i) => (
                    <div key={i} style={{
                      fontSize: 11, color: '#94A3B8', padding: '6px 10px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)', borderLeft: '2px solid #0EA5E940',
                    }}>{note}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Transaction History */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', marginBottom: 8 }}>TRANSACTION HISTORY</div>
              {selectedTxs.length === 0 ? (
                <div style={{ fontSize: 11, color: '#334155' }}>No transactions found</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selectedTxs.map(tx => (
                    <div key={tx.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                      borderLeft: `2px solid ${riskColor(tx.riskLevel)}30`,
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{tx.id}</div>
                        <div style={{ fontSize: 9, color: '#475569' }}>
                          {new Date(tx.createdAt).toLocaleString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#F0F6FF', fontFamily: 'JetBrains Mono, monospace' }}>R{tx.amount.toLocaleString()}</div>
                        <span style={{
                          fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: `${riskColor(tx.riskLevel)}15`, color: riskColor(tx.riskLevel),
                        }}>{tx.riskLevel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
