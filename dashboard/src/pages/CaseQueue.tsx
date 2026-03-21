import { useState, useEffect } from 'react';
import CaseSummariser from '../components/CaseSummariser';
import type { Transaction } from '../data/mock';
import { mockTransactions } from '../data/mock';

type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type CaseStatus = 'NEW' | 'IN_REVIEW' | 'ESCALATED' | 'RESOLVED';

interface FraudCase {
  id: string;
  tx: Transaction;
  priority: Priority;
  status: CaseStatus;
  assignee: string | null;
  createdAt: Date;
  slaMinutes: number;
  notes: string;
  rulesFired: string[];
}

const ANALYSTS = ['Thabo M.', 'Sipho K.', 'Naledi R.', 'Andile B.', 'Zanele D.'];

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; sla: number }> = {
  CRITICAL: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', sla: 15 },
  HIGH:     { color: '#F97316', bg: 'rgba(249,115,22,0.06)', sla: 30 },
  MEDIUM:   { color: '#FBBF24', bg: 'rgba(251,191,36,0.05)', sla: 120 },
  LOW:      { color: '#10F5A0', bg: 'rgba(16,245,160,0.04)', sla: 480 },
};

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; icon: string }> = {
  NEW:       { label: 'New', color: '#EF4444', icon: '🔴' },
  IN_REVIEW: { label: 'In Review', color: '#FBBF24', icon: '🔍' },
  ESCALATED: { label: 'Escalated', color: '#F97316', icon: '⚡' },
  RESOLVED:  { label: 'Resolved', color: '#10F5A0', icon: '✅' },
};

// Generate cases from mock transactions
function generateCases(): FraudCase[] {
  return mockTransactions.map((tx, i) => {
    const priority: Priority = tx.riskLevel === 'HIGH' ? (tx.riskScore >= 85 ? 'CRITICAL' : 'HIGH') : tx.riskLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW';
    const minutesAgo = [3, 8, 14, 22, 45, 95, 180][i % 7];
    return {
      id: `CASE-${String(1000 + i).slice(1)}`,
      tx,
      priority,
      status: i === 0 ? 'NEW' : i < 3 ? 'IN_REVIEW' : i < 5 ? 'NEW' : 'RESOLVED' as CaseStatus,
      assignee: i < 3 ? ANALYSTS[i % ANALYSTS.length] : null,
      createdAt: new Date(Date.now() - minutesAgo * 60 * 1000),
      slaMinutes: PRIORITY_CONFIG[priority].sla,
      notes: '',
      rulesFired: tx.triggeredRules || [],
    };
  });
}

function SlaTimer({ createdAt, slaMinutes, status }: { createdAt: Date; slaMinutes: number; status: CaseStatus }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - createdAt.getTime()) / 60000));
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [createdAt]);

  if (status === 'RESOLVED') return <span style={{ fontSize: 10, color: '#10F5A0' }}>Resolved</span>;

  const remaining = slaMinutes - elapsed;
  const breached = remaining <= 0;
  const urgent = remaining > 0 && remaining <= 5;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: breached ? 'rgba(239,68,68,0.15)' : urgent ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${breached ? '#EF4444' : urgent ? '#FBBF24' : 'rgba(255,255,255,0.08)'}`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: breached ? '#EF4444' : urgent ? '#FBBF24' : '#94A3B8' }}>
          {Math.abs(remaining)}m
        </span>
      </div>
      <div>
        <div style={{ fontSize: 9, color: breached ? '#EF4444' : '#475569', fontWeight: 700 }}>
          {breached ? '⚠️ SLA BREACHED' : urgent ? '⏰ URGENT' : 'SLA OK'}
        </div>
        <div style={{ fontSize: 9, color: '#334155' }}>{elapsed}m elapsed</div>
      </div>
    </div>
  );
}

export default function CaseQueue() {
  const [cases, setCases] = useState<FraudCase[]>(generateCases);
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const filtered = cases
    .filter(c => statusFilter === 'ALL' || c.status === statusFilter)
    .filter(c => priorityFilter === 'ALL' || c.priority === priorityFilter)
    .sort((a, b) => {
      const pOrder: Record<Priority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const sOrder: Record<CaseStatus, number> = { NEW: 0, IN_REVIEW: 1, ESCALATED: 2, RESOLVED: 3 };
      if (sOrder[a.status] !== sOrder[b.status]) return sOrder[a.status] - sOrder[b.status];
      if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  const updateCase = (id: string, updates: Partial<FraudCase>) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // Stats
  const newCount = cases.filter(c => c.status === 'NEW').length;
  const reviewCount = cases.filter(c => c.status === 'IN_REVIEW').length;
  const breachedCount = cases.filter(c => {
    const elapsed = Math.floor((Date.now() - c.createdAt.getTime()) / 60000);
    return c.status !== 'RESOLVED' && elapsed > c.slaMinutes;
  }).length;

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
            📋 Case Queue
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>Prioritized alerts requiring analyst action · SLA-tracked triage</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'New', count: newCount, color: '#EF4444' },
            { label: 'In Review', count: reviewCount, color: '#FBBF24' },
            { label: 'SLA Breached', count: breachedCount, color: '#EF4444' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '8px 14px', borderRadius: 10,
              background: `${s.color}10`, border: `1px solid ${s.color}25`,
            }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.count}</div>
              <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, letterSpacing: '0.05em' }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#475569', fontWeight: 700, alignSelf: 'center', marginRight: 4 }}>STATUS:</span>
          {(['ALL', 'NEW', 'IN_REVIEW', 'ESCALATED', 'RESOLVED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: statusFilter === s ? (s === 'ALL' ? '#0EA5E9' : STATUS_CONFIG[s as CaseStatus]?.color || '#0EA5E9') : 'rgba(255,255,255,0.04)',
              color: statusFilter === s ? (s === 'ALL' || s === 'RESOLVED' ? '#000' : '#fff') : '#64748B',
              transition: 'all 0.15s',
            }}>{s === 'ALL' ? 'ALL' : STATUS_CONFIG[s as CaseStatus]?.icon + ' ' + STATUS_CONFIG[s as CaseStatus]?.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#475569', fontWeight: 700, alignSelf: 'center', marginRight: 4 }}>PRIORITY:</span>
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: priorityFilter === p ? (p === 'ALL' ? '#0EA5E9' : PRIORITY_CONFIG[p as Priority]?.color || '#0EA5E9') : 'rgba(255,255,255,0.04)',
              color: priorityFilter === p ? '#000' : '#64748B',
              transition: 'all 0.15s',
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Case Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(c => {
          const pCfg = PRIORITY_CONFIG[c.priority];
          const sCfg = STATUS_CONFIG[c.status];
          return (
            <div key={c.id} style={{
              background: c.status === 'NEW' ? pCfg.bg : 'rgba(255,255,255,0.02)',
              border: `1px solid ${c.status === 'NEW' ? pCfg.color + '20' : 'rgba(255,255,255,0.06)'}`,
              borderLeft: `3px solid ${pCfg.color}`,
              borderRadius: 12, padding: '14px 18px',
              display: 'grid', gridTemplateColumns: '100px 1fr 130px 110px 130px 160px',
              alignItems: 'center', gap: 12,
              transition: 'all 0.15s', cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = c.status === 'NEW' ? pCfg.bg : 'rgba(255,255,255,0.02)'; }}
            >
              {/* Case ID + Priority */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--w-text-1)', fontFamily: 'JetBrains Mono, monospace' }}>{c.id}</div>
                <span style={{
                  fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4, marginTop: 4, display: 'inline-block',
                  background: `${pCfg.color}18`, color: pCfg.color, letterSpacing: '0.06em',
                }}>{c.priority}</span>
              </div>

              {/* Transaction summary */}
              <div onClick={() => setSelectedTx(c.tx)}>
                <div style={{ fontSize: 12, color: 'var(--w-text-2)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{c.tx.userPhone}</span>
                  <span style={{ color: '#334155' }}>→</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{c.tx.recipientWallet}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text-1)', fontFamily: 'JetBrains Mono, monospace' }}>R{c.tx.amount.toLocaleString()}</span>
                  {c.tx.onCall && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontWeight: 700 }}>📞 ON CALL</span>}
                  {c.rulesFired.length > 0 && <span style={{ fontSize: 9, color: '#475569' }}>{c.rulesFired.length} rules</span>}
                </div>
              </div>

              {/* SLA Timer */}
              <SlaTimer createdAt={c.createdAt} slaMinutes={c.slaMinutes} status={c.status} />

              {/* Status */}
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 8, textAlign: 'center',
                background: `${sCfg.color}12`, color: sCfg.color, border: `1px solid ${sCfg.color}25`,
              }}>{sCfg.icon} {sCfg.label}</span>

              {/* Assignee */}
              <div style={{ position: 'relative' }}>
                <button onClick={(e) => { e.stopPropagation(); setAssigningId(assigningId === c.id ? null : c.id); }} style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', width: '100%', textAlign: 'left',
                  background: c.assignee ? 'rgba(14,165,233,0.08)' : 'rgba(255,255,255,0.04)',
                  color: c.assignee ? '#0EA5E9' : '#475569', fontWeight: 600,
                  border: `1px solid ${c.assignee ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  {c.assignee || '+ Assign'}
                </button>
                {assigningId === c.id && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 160, zIndex: 100,
                    background: '#0D1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)', overflow: 'hidden',
                  }}>
                    {ANALYSTS.map(a => (
                      <button key={a} onClick={(e) => { e.stopPropagation(); updateCase(c.id, { assignee: a, status: 'IN_REVIEW' }); setAssigningId(null); }} style={{
                        display: 'block', width: '100%', padding: '8px 14px', fontSize: 11, border: 'none', cursor: 'pointer', textAlign: 'left',
                        background: c.assignee === a ? 'rgba(14,165,233,0.1)' : 'transparent', color: c.assignee === a ? '#0EA5E9' : '#94A3B8',
                        fontWeight: c.assignee === a ? 700 : 400,
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = c.assignee === a ? 'rgba(14,165,233,0.1)' : 'transparent'; }}
                      >{a}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                {c.status !== 'RESOLVED' && (
                  <>
                    <button onClick={() => updateCase(c.id, { status: 'RESOLVED' })} title="Resolve" style={{
                      padding: '5px 8px', borderRadius: 6, fontSize: 10, border: 'none', cursor: 'pointer',
                      background: 'rgba(16,245,160,0.08)', color: '#10F5A0', fontWeight: 700,
                    }}>✅</button>
                    <button onClick={() => updateCase(c.id, { status: 'ESCALATED' })} title="Escalate" style={{
                      padding: '5px 8px', borderRadius: 6, fontSize: 10, border: 'none', cursor: 'pointer',
                      background: 'rgba(249,115,22,0.1)', color: '#F97316', fontWeight: 700,
                    }}>⚡</button>
                    <button onClick={() => setSelectedTx(c.tx)} title="Investigate" style={{
                      padding: '5px 8px', borderRadius: 6, fontSize: 10, border: 'none', cursor: 'pointer',
                      background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', fontWeight: 700,
                    }}>🔍</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTx && <CaseSummariser tx={selectedTx} onClose={() => setSelectedTx(null)} />}
    </div>
  );
}
