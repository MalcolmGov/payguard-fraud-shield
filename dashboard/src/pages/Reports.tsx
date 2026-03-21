import { useState } from 'react';
import { mockTransactions, mockRules } from '../data/mock';

interface Toast { id: number; msg: string; type: 'success'; }

export default function Reports() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (msg: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type: 'success' }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const totalTxn = mockTransactions.length;
  const blocked = mockTransactions.filter((t: any) => t.recommendedAction === 'BLOCK').length;
  const warned = mockTransactions.filter((t: any) => t.recommendedAction === 'WARN_USER').length;
  const allowed = mockTransactions.filter((t: any) => t.recommendedAction === 'ALLOW').length;
  const blockedAmount = mockTransactions.filter((t: any) => t.recommendedAction === 'BLOCK').reduce((s: number, t: any) => s + t.amount, 0);
  const totalAmount = mockTransactions.reduce((s: number, t: any) => s + t.amount, 0);
  const highRisk = mockTransactions.filter((t: any) => t.riskLevel === 'HIGH');
  const avgRiskScore = (mockTransactions.reduce((s, t) => s + t.riskScore, 0) / totalTxn).toFixed(1);
  const blockRate = ((blocked / totalTxn) * 100).toFixed(1);

  const reports = [
    { id: 'RPT-001', name: 'Weekly Fraud Summary', type: 'Automated', date: '2026-03-14', status: 'Ready' },
    { id: 'RPT-002', name: 'SIM Swap Incident Report', type: 'Incident', date: '2026-03-13', status: 'Ready' },
    { id: 'RPT-003', name: 'Monthly Compliance Extract', type: 'Compliance', date: '2026-03-01', status: 'Ready' },
    { id: 'RPT-004', name: 'False Positive Analysis', type: 'Analytics', date: '2026-03-10', status: 'Ready' },
    { id: 'RPT-005', name: 'Mule Network Investigation', type: 'Investigation', date: '2026-03-12', status: 'In Review' },
    { id: 'RPT-006', name: 'Rule Performance Audit', type: 'Analytics', date: '2026-03-08', status: 'Ready' },
  ];

  const periodLabel = period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days';
  const dateStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ── Professional PDF HTML template ──────────────────────────────────────────
  function buildReportHTML(report: typeof reports[0]) {
    const riskColor = (r: string) => r === 'HIGH' ? '#DC2626' : r === 'MEDIUM' ? '#D97706' : '#059669';
    const actionBg = (a: string) => a === 'BLOCK' ? '#FEE2E2' : a === 'WARN_USER' ? '#FEF3C7' : '#D1FAE5';
    const actionColor = (a: string) => a === 'BLOCK' ? '#991B1B' : a === 'WARN_USER' ? '#92400E' : '#065F46';

    const txRows = (report.type === 'Incident' ? highRisk : mockTransactions).map(tx => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-family:'Courier New',monospace;font-size:12px;color:#374151">${tx.id}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-family:'Courier New',monospace;font-size:12px;color:#374151">${tx.userPhone}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-family:'Courier New',monospace;font-size:12px;color:#374151">${tx.recipientWallet}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-family:'Courier New',monospace;font-size:12px;color:#374151;text-align:right;font-weight:600">R${tx.amount.toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;text-align:center">
          <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;background:${riskColor(tx.riskLevel)}15;color:${riskColor(tx.riskLevel)}">${tx.riskLevel}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;text-align:center">
          <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${actionBg(tx.recommendedAction)};color:${actionColor(tx.recommendedAction)}">${tx.recommendedAction}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#6B7280">${new Date(tx.createdAt).toLocaleString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
      </tr>
    `).join('');

    const rulesSection = report.type === 'Analytics' ? `
      <div style="margin-top:36px">
        <h2 style="font-family:'Inter',sans-serif;font-size:18px;font-weight:700;color:#111827;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #E5E7EB">Rule Performance Summary</h2>
        <table style="width:100%;border-collapse:collapse;font-family:'Inter',sans-serif">
          <thead>
            <tr style="background:#F9FAFB">
              <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#6B7280;letter-spacing:0.05em;text-transform:uppercase;border-bottom:2px solid #E5E7EB">Rule ID</th>
              <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#6B7280;letter-spacing:0.05em;text-transform:uppercase;border-bottom:2px solid #E5E7EB">Name</th>
              <th style="padding:10px 12px;text-align:center;font-size:10px;font-weight:700;color:#6B7280;letter-spacing:0.05em;text-transform:uppercase;border-bottom:2px solid #E5E7EB">Score</th>
              <th style="padding:10px 12px;text-align:center;font-size:10px;font-weight:700;color:#6B7280;letter-spacing:0.05em;text-transform:uppercase;border-bottom:2px solid #E5E7EB">Severity</th>
              <th style="padding:10px 12px;text-align:center;font-size:10px;font-weight:700;color:#6B7280;letter-spacing:0.05em;text-transform:uppercase;border-bottom:2px solid #E5E7EB">Status</th>
            </tr>
          </thead>
          <tbody>
            ${mockRules.map(r => `
              <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-family:'Courier New',monospace;font-size:12px;color:#374151">${r.ruleId}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:13px;color:#374151;font-weight:500">${r.name}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;text-align:center;font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:#374151">${r.score}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;text-align:center">
                  <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;background:${r.severity === 'CRITICAL' ? '#FEE2E2' : r.severity === 'HIGH' ? '#FFEDD5' : r.severity === 'MEDIUM' ? '#FEF3C7' : '#D1FAE5'};color:${r.severity === 'CRITICAL' ? '#991B1B' : r.severity === 'HIGH' ? '#9A3412' : r.severity === 'MEDIUM' ? '#92400E' : '#065F46'}">${r.severity}</span>
                </td>
                <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:12px;color:${r.enabled ? '#059669' : '#9CA3AF'};font-weight:600">${r.enabled ? 'Active' : 'Disabled'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${report.name} — PayGuard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { margin: 40px 50px; size: A4; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    body { margin: 0; padding: 0; background: #fff; color: #111827; font-family: 'Inter', -apple-system, sans-serif; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 50px; }
  </style>
</head>
<body>
  <!-- Print button -->
  <div class="no-print" style="position:fixed;top:20px;right:20px;z-index:100;display:flex;gap:8px">
    <button onclick="window.print()" style="padding:10px 24px;border-radius:10px;font-size:13px;font-weight:700;border:none;cursor:pointer;background:#0EA5E9;color:#fff;font-family:'Inter',sans-serif;box-shadow:0 2px 8px rgba(14,165,233,0.3)">🖨️ Print / Save PDF</button>
    <button onclick="window.close()" style="padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;border:1px solid #E5E7EB;cursor:pointer;background:#fff;color:#6B7280;font-family:'Inter',sans-serif">Close</button>
  </div>

  <div class="page">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:3px solid #111827">
      <div>
        <div style="font-family:'Outfit',sans-serif;font-size:28px;font-weight:900;color:#111827;letter-spacing:-0.02em">🛡️ PayGuard</div>
        <div style="font-size:11px;color:#9CA3AF;margin-top:2px;letter-spacing:0.05em">FRAUD INTELLIGENCE PLATFORM</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;font-weight:700;color:#6B7280;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px">${report.type} Report</div>
        <div style="font-size:11px;color:#9CA3AF">${report.id} · ${dateStr}</div>
        <div style="font-size:11px;color:#9CA3AF">Period: ${periodLabel}</div>
      </div>
    </div>

    <!-- Title -->
    <h1 style="font-family:'Outfit',sans-serif;font-size:24px;font-weight:900;color:#111827;margin:0 0 8px;letter-spacing:-0.02em">${report.name}</h1>
    <p style="font-size:13px;color:#6B7280;margin:0 0 32px;line-height:1.6">
      This report was automatically generated by PayGuard's AI fraud intelligence engine. All data reflects the ${periodLabel.toLowerCase()} period ending ${report.date}. For questions, contact the PayGuard operations team.
    </p>

    <!-- KPI Grid -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px">
      ${[
        { label: 'Transactions Evaluated', value: totalTxn.toString(), accent: '#0EA5E9' },
        { label: 'Threats Blocked', value: blocked.toString(), accent: '#DC2626' },
        { label: 'Warnings Issued', value: warned.toString(), accent: '#D97706' },
        { label: 'Amount Protected', value: `R${blockedAmount.toLocaleString()}`, accent: '#059669' },
      ].map(k => `
        <div style="padding:16px;border:1px solid #E5E7EB;border-radius:12px;border-top:3px solid ${k.accent}">
          <div style="font-size:10px;font-weight:700;color:#9CA3AF;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px">${k.label}</div>
          <div style="font-size:22px;font-weight:900;color:#111827;font-family:'Outfit',sans-serif">${k.value}</div>
        </div>
      `).join('')}
    </div>

    <!-- Executive Summary -->
    <div style="padding:20px 24px;background:#F0F9FF;border:1px solid #BAE6FD;border-radius:12px;margin-bottom:32px">
      <div style="font-size:11px;font-weight:700;color:#0369A1;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px">📋 Executive Summary</div>
      <p style="font-size:14px;color:#1E3A5F;line-height:1.8;margin:0">
        During the reporting period, PayGuard evaluated <strong>${totalTxn} transactions</strong> totalling <strong>R${totalAmount.toLocaleString()}</strong>. The system automatically blocked <strong>${blocked} fraudulent transactions</strong> (${blockRate}% block rate), protecting <strong>R${blockedAmount.toLocaleString()}</strong> in potential losses.
        An additional <strong>${warned} transactions</strong> received user warnings, and <strong>${allowed} transactions</strong> were allowed through. The average risk score across all transactions was <strong>${avgRiskScore}/100</strong>.
        ${highRisk.length > 0 ? `<strong>${highRisk.length} high-risk transactions</strong> were identified, with the most common triggered rules being ${[...new Set(highRisk.flatMap(t => t.triggeredRules))].slice(0, 3).join(', ')}.` : ''}
      </p>
    </div>

    <!-- Risk Distribution -->
    <div style="margin-bottom:32px">
      <h2 style="font-family:'Inter',sans-serif;font-size:18px;font-weight:700;color:#111827;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #E5E7EB">Risk Distribution</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        ${[
          { label: 'High Risk', count: highRisk.length, pct: ((highRisk.length / totalTxn) * 100).toFixed(1), color: '#DC2626', bg: '#FEE2E2' },
          { label: 'Medium Risk', count: mockTransactions.filter(t => t.riskLevel === 'MEDIUM').length, pct: ((mockTransactions.filter(t => t.riskLevel === 'MEDIUM').length / totalTxn) * 100).toFixed(1), color: '#D97706', bg: '#FEF3C7' },
          { label: 'Low Risk', count: mockTransactions.filter(t => t.riskLevel === 'LOW').length, pct: ((mockTransactions.filter(t => t.riskLevel === 'LOW').length / totalTxn) * 100).toFixed(1), color: '#059669', bg: '#D1FAE5' },
        ].map(r => `
          <div style="padding:16px 20px;background:${r.bg};border-radius:12px;text-align:center">
            <div style="font-size:28px;font-weight:900;color:${r.color};font-family:'Outfit',sans-serif">${r.count}</div>
            <div style="font-size:12px;color:${r.color};font-weight:600;margin-top:2px">${r.label} (${r.pct}%)</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Transaction Detail Table -->
    <div style="margin-bottom:32px">
      <h2 style="font-family:'Inter',sans-serif;font-size:18px;font-weight:700;color:#111827;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #E5E7EB">
        ${report.type === 'Incident' ? 'High-Risk Transaction Detail' : 'Transaction Detail'}
      </h2>
      <table style="width:100%;border-collapse:collapse;font-family:'Inter',sans-serif">
        <thead>
          <tr style="background:#F9FAFB">
            ${['TXN ID', 'Sender', 'Recipient', 'Amount', 'Risk', 'Action', 'Timestamp'].map(h =>
              `<th style="padding:10px 12px;text-align:${h === 'Amount' ? 'right' : h === 'Risk' || h === 'Action' ? 'center' : 'left'};font-size:10px;font-weight:700;color:#6B7280;letter-spacing:0.05em;text-transform:uppercase;border-bottom:2px solid #E5E7EB">${h}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>${txRows}</tbody>
      </table>
    </div>

    ${rulesSection}

    <!-- Footer -->
    <div style="margin-top:48px;padding-top:20px;border-top:2px solid #E5E7EB;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:11px;color:#9CA3AF">Generated by PayGuard AI · ${dateStr}</div>
        <div style="font-size:11px;color:#9CA3AF">payguard.africa · For internal distribution only</div>
      </div>
      <div style="font-family:'Outfit',sans-serif;font-size:14px;font-weight:800;color:#D1D5DB">CONFIDENTIAL</div>
    </div>
  </div>
</body>
</html>`;
  }

  // ── CSV fallback ────────────────────────────────────────────────────────────
  function downloadCSV(report: typeof reports[0]) {
    const header = 'Transaction ID,Sender,Recipient,Amount (ZAR),Risk Level,Risk Score,Action,On Call,Timestamp\n';
    const rows = mockTransactions.map(tx =>
      `${tx.id},${tx.userPhone},${tx.recipientWallet},${tx.amount},${tx.riskLevel},${tx.riskScore},${tx.recommendedAction},${tx.onCall ? 'Yes' : 'No'},${tx.createdAt}`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/\s+/g, '_')}_${period}_${report.date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(`📥 CSV downloaded: ${report.name}`);
  }

  function openPDFReport(report: typeof reports[0]) {
    const html = buildReportHTML(report);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setDownloadedIds(prev => new Set([...prev, report.id]));
    addToast(`📄 Report opened: ${report.name} — Use Print to save as PDF`);
    setTimeout(() => setDownloadedIds(prev => { const s = new Set(prev); s.delete(report.id); return s; }), 3000);
  }

  const typeColor = (t: string) => {
    if (t === 'Automated') return '#0EA5E9';
    if (t === 'Incident') return '#EF4444';
    if (t === 'Compliance') return '#A78BFA';
    if (t === 'Analytics') return '#FBBF24';
    return '#F97316';
  };

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', color: 'var(--w-text-1)' }}>
      {/* Toast stack */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: 380 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 16px', borderRadius: 12, fontSize: 12, lineHeight: 1.6, fontWeight: 500,
            background: 'rgba(16,245,160,0.1)', border: '1px solid rgba(16,245,160,0.35)',
            color: '#10F5A0', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeInDown 0.3s ease',
          }}>{t.msg}</div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
            Reports & Analytics
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>Automated fraud intelligence reports · Compliance extracts · <span style={{ color: '#10F5A0' }}>PDF + CSV export</span></p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--w-card)', borderRadius: 8, padding: 3 }}>
            {(['7d', '30d', '90d'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: period === p ? '#0EA5E9' : 'transparent',
                color: period === p ? '#000' : '#64748B',
              }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'TOTAL EVALUATED', value: totalTxn.toString(), color: '#0EA5E9' },
          { label: 'THREATS BLOCKED', value: blocked.toString(), color: '#EF4444' },
          { label: 'WARNINGS ISSUED', value: warned.toString(), color: '#FBBF24' },
          { label: 'AMOUNT PROTECTED', value: `R${blockedAmount.toLocaleString()}`, color: '#10F5A0' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)',
            borderRadius: 14, padding: '16px 18px',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Reports List */}
      <div style={{
        background: 'rgba(255,255,255,0.025)', border: '1px solid var(--w-card-border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--w-card-border)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--w-text-2)' }}>Available Reports</span>
          <span style={{ fontSize: 11, color: '#475569' }}>{reports.length} reports</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 100px 75px 200px', padding: '10px 20px', borderBottom: '1px solid var(--w-card-border)', gap: 8 }}>
          {['ID', 'REPORT NAME', 'TYPE', 'DATE', 'STATUS', 'ACTIONS'].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
          ))}
        </div>

        {reports.map((r, i) => {
          const isViewed = downloadedIds.has(r.id);
          return (
            <div key={r.id} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 90px 100px 75px 200px',
              padding: '14px 20px', gap: 8, alignItems: 'center',
              borderBottom: i < reports.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={(e: any) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e: any) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>{r.id}</span>
              <span style={{ fontSize: 13, color: 'var(--w-text-1)', fontWeight: 600 }}>{r.name}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                background: `${typeColor(r.type)}18`, color: typeColor(r.type),
              }}>{r.type}</span>
              <span style={{ fontSize: 11, color: 'var(--w-text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{r.date}</span>
              <span style={{
                fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                background: r.status === 'Ready' ? 'rgba(16,245,160,0.1)' : 'rgba(251,191,36,0.1)',
                color: r.status === 'Ready' ? '#10F5A0' : '#FBBF24',
              }}>{r.status}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openPDFReport(r)} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: isViewed ? 'rgba(16,245,160,0.15)' : 'rgba(14,165,233,0.12)',
                  color: isViewed ? '#10F5A0' : '#0EA5E9',
                  transition: 'all 0.2s',
                }}>{isViewed ? '✓ Opened' : '📄 View PDF'}</button>
                <button onClick={() => downloadCSV(r)} style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: 'var(--w-card)', color: 'var(--w-text-3)',
                  transition: 'all 0.2s',
                }}>⬇ CSV</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
