import { useState } from 'react';
import { mockTransactions } from '../data/mock';
import type { Transaction } from '../data/mock';
import CaseSummariser from '../components/CaseSummariser';

type TxStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
interface Toast { id: number; msg: string; type: 'success' | 'warn' | 'error'; }

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [statuses, setStatuses] = useState<Record<string, TxStatus>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (msg: string, type: Toast['type']) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const setTxStatus = (txId: string, status: TxStatus) => {
    setStatuses(prev => ({ ...prev, [txId]: status }));
    const labels: Record<TxStatus, string> = { PENDING: '', APPROVED: '✅ Approved', REJECTED: '❌ Rejected', ESCALATED: '⚡ Escalated' };
    const types: Record<TxStatus, Toast['type']> = { PENDING: 'success', APPROVED: 'success', REJECTED: 'error', ESCALATED: 'warn' };
    addToast(`${labels[status]} — ${txId}`, types[status]);
  };

  const filtered = mockTransactions
    .filter(tx => filter === 'ALL' || tx.riskLevel === filter)
    .filter(tx =>
      tx.userPhone.includes(search) ||
      tx.recipientWallet.includes(search) ||
      tx.id.includes(search)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const riskColor = (level: string) =>
    level === 'HIGH' ? '#EF4444' : level === 'MEDIUM' ? '#FBBF24' : '#10F5A0';

  const actionColor = (action: string) =>
    action === 'BLOCK' ? '#EF4444' : action === 'WARN_USER' ? '#FBBF24' : '#10F5A0';

  const statusColor = (s: TxStatus) =>
    s === 'APPROVED' ? '#10F5A0' : s === 'REJECTED' ? '#EF4444' : s === 'ESCALATED' ? '#F97316' : '#475569';

  const statusLabel = (s: TxStatus) =>
    s === 'APPROVED' ? '✅ Approved' : s === 'REJECTED' ? '❌ Rejected' : s === 'ESCALATED' ? '⚡ Escalated' : '⏳ Pending';

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: '#F0F6FF' }}>
      {/* Toast stack */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: 360 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 16px', borderRadius: 12, fontSize: 12, lineHeight: 1.6, fontWeight: 500,
            background: t.type === 'success' ? 'rgba(16,245,160,0.1)' : t.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.1)',
            border: `1px solid ${t.type === 'success' ? 'rgba(16,245,160,0.35)' : t.type === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(251,191,36,0.35)'}`,
            color: t.type === 'success' ? '#10F5A0' : t.type === 'error' ? '#EF4444' : '#FBBF24',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeInDown 0.3s ease',
          }}>{t.msg}</div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
            All Transactions
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#10F5A0', display: 'inline-block' }} />
              Click any row for AI Case Summary · Use action buttons to approve, reject, or escalate
            </span>
          </p>
        </div>
        <span style={{ fontSize: 12, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>{filtered.length} results</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <input
          placeholder="Search by phone, wallet, or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, maxWidth: 360, padding: '10px 16px', borderRadius: 10, fontSize: 13,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#F0F6FF', fontFamily: 'JetBrains Mono, monospace',
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
            <button key={level} onClick={() => setFilter(level)} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: filter === level ? (level === 'ALL' ? '#0EA5E9' : riskColor(level)) : 'rgba(255,255,255,0.05)',
              color: filter === level ? '#000' : '#64748B',
              transition: 'all 0.2s',
            }}>{level}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '70px 120px 115px 115px 80px 65px 75px 50px 80px 145px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 6 }}>
          {['TIME', 'TXN ID', 'SENDER', 'RECIPIENT', 'AMOUNT', 'RISK', 'ACTION', 'CALL', 'STATUS', 'ACTIONS'].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {filtered.map((tx, i) => {
          const txStatus = statuses[tx.id] || 'PENDING';
          return (
            <div key={tx.id} style={{
              display: 'grid', gridTemplateColumns: '70px 120px 115px 115px 80px 65px 75px 50px 80px 145px',
              padding: '12px 20px', gap: 6, alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              background: txStatus === 'REJECTED' ? 'rgba(239,68,68,0.04)' : txStatus === 'APPROVED' ? 'rgba(16,245,160,0.02)' : tx.riskLevel === 'HIGH' ? 'rgba(239,68,68,0.03)' : 'transparent',
              borderLeft: `2px solid ${riskColor(tx.riskLevel)}20`,
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = txStatus === 'REJECTED' ? 'rgba(239,68,68,0.04)' : txStatus === 'APPROVED' ? 'rgba(16,245,160,0.02)' : tx.riskLevel === 'HIGH' ? 'rgba(239,68,68,0.03)' : 'transparent')}
            >
              <span onClick={() => setSelectedTx(tx)} style={{ fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                {new Date(tx.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span onClick={() => setSelectedTx(tx)} style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>{tx.id.slice(0, 12)}</span>
              <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{tx.userPhone}</span>
              <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>{tx.recipientWallet}</span>
              <span style={{ fontSize: 12, color: '#F0F6FF', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>R{tx.amount.toLocaleString()}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textAlign: 'center',
                background: `${riskColor(tx.riskLevel)}18`, color: riskColor(tx.riskLevel),
              }}>{tx.riskLevel}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: actionColor(tx.recommendedAction) }}>
                {tx.recommendedAction}
              </span>
              <span style={{ fontSize: 11, color: tx.onCall ? '#EF4444' : '#334155' }}>
                {tx.onCall ? '📞 Yes' : '—'}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textAlign: 'center',
                background: `${statusColor(txStatus)}15`, color: statusColor(txStatus),
                border: `1px solid ${statusColor(txStatus)}30`,
              }}>{statusLabel(txStatus)}</span>
              <div style={{ display: 'flex', gap: 3 }} onClick={e => e.stopPropagation()}>
                <button disabled={txStatus !== 'PENDING'} onClick={() => setTxStatus(tx.id, 'APPROVED')} style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, border: 'none', cursor: txStatus !== 'PENDING' ? 'not-allowed' : 'pointer',
                  background: 'rgba(16,245,160,0.1)', color: '#10F5A0', opacity: txStatus !== 'PENDING' ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}>✅</button>
                <button disabled={txStatus !== 'PENDING'} onClick={() => setTxStatus(tx.id, 'REJECTED')} style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, border: 'none', cursor: txStatus !== 'PENDING' ? 'not-allowed' : 'pointer',
                  background: 'rgba(239,68,68,0.1)', color: '#EF4444', opacity: txStatus !== 'PENDING' ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}>❌</button>
                <button disabled={txStatus !== 'PENDING'} onClick={() => setTxStatus(tx.id, 'ESCALATED')} style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, border: 'none', cursor: txStatus !== 'PENDING' ? 'not-allowed' : 'pointer',
                  background: 'rgba(249,115,22,0.1)', color: '#F97316', opacity: txStatus !== 'PENDING' ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}>⚡</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Case Summariser Modal */}
      {selectedTx && <CaseSummariser tx={selectedTx} onClose={() => setSelectedTx(null)} />}
    </div>
  );
}
