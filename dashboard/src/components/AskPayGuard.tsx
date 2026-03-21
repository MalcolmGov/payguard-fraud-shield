import { useState, useRef, useEffect } from 'react';

interface Message { role: 'user' | 'ai'; text: string; ts: string; }

// ── Simulated AI brain — context-aware fraud intelligence responses ────────────
const AI_KNOWLEDGE: Array<{ patterns: RegExp[]; response: () => string }> = [
  {
    patterns: [/vish/i, /call/i, /phone scam/i],
    response: () => `**Vishing (voice phishing)** is our #1 attack vector — accounting for **63%** of blocked transactions this week.\n\n**How PayGuard detects it:**\n- Rule RULE_003 monitors active call state during payment initiation\n- Rule RULE_007 flags paste events (victim reading out details from scammer)\n- If both fire simultaneously, confidence: **HIGH**, action: **BLOCK**\n\n📊 This week: 31 vishing attacks blocked, R248,500 saved.`,
  },
  {
    patterns: [/sim swap/i, /sim.?swap/i, /ported/i],
    response: () => `**SIM Swap attacks** are detected via carrier-reported events and device fingerprint delta.\n\n**Detection chain:**\n1. Carrier reports SIM serial change → RULE_011 fires\n2. New device fingerprint within 48h → RULE_012 fires  \n3. USSD push verification sent to physical SIM\n4. If push times out → account frozen pending review\n\n📊 This month: 12 SIM swap attempts blocked. 0 successful breaches.`,
  },
  {
    patterns: [/otp/i, /one.?time/i, /intercept/i],
    response: () => `**OTP Interception** is blocked using PayGuard's step-up verification layer.\n\n**Rules firing:**\n- RULE_005: Screen capture/overlay detected during OTP display\n- RULE_006: Multiple failed OTP attempts cross-referenced with known vishing numbers\n\n⚡ Decision latency: **avg 73ms**. Context enriched before OTP screen renders.`,
  },
  {
    patterns: [/risk score/i, /score/i, /how.*score/i, /scoring/i],
    response: () => `**Risk scoring** is computed by our real-time engine across 14 parallel rules.\n\n**Score bands:**\n| Score | Action | Description |\n|-------|--------|-------------|\n| 0–39  | ALLOW  | Invisible to customer |\n| 40–69 | WARN   | Friction layer shown |\n| 70–100 | BLOCK | Payment halted |\n\n📊 Current distribution: 29% Low · 14% Medium · 57% High blocked.`,
  },
  {
    patterns: [/block/i, /blocked/i, /why.*block/i],
    response: () => `**Blocked transactions** are stopped before funds leave the account.\n\n**Today's blocks:** 3 transactions, R10,500 protected\n\nTop rules firing:\n1. **RULE_003** — Active call during payment (2 events)\n2. **RULE_011** — SIM serial mismatch (1 event)\n\nAll blocked transactions are queued for analyst review in the Transactions tab. Click any row to see the full rule trace.`,
  },
  {
    patterns: [/gauteng/i, /johannesburg/i, /joburg/i, /jozi/i],
    response: () => `**Gauteng** is our highest-risk province — 41% of all fraud attempts originate here.\n\n**Gauteng fraud breakdown (7 days):**\n- Johannesburg CBD: 🔴 Very High (vishing clusters)\n- Soweto: 🟠 High (SIM swap rings)\n- Sandton: 🟡 Medium (account takeover attempts)\n\nRecommendation: Consider tightening RULE_003 threshold for Gauteng-registered accounts.`,
  },
  {
    patterns: [/mobile carrier/i, /network.*operator/i, /telco/i],
    response: () => `**Mobile Money integration overview:**\n\nPayGuard evaluates signals at the SDK layer — **before** the mobile carrier payment gateway processes the transaction.\n\n**Integration points:**\n- SDK embedded in mobile wallet app (4 lines, Kotlin/Swift)\n- Signals sent to \`api.payguard.swifter.io/v1/evaluate\`\n- Response (ALLOW/WARN/BLOCK) returned in <100ms\n- USSD push via mobile carrier USSD Gateway for device step-up\n\nmobile carrier needs to: embed SDK, configure webhook, provide API credentials.`,
  },
  {
    patterns: [/false positive/i, /legitimate/i, /false alarm/i],
    response: () => `**False positive rate** is a key metric we track continuously.\n\n**Current performance:**\n- False positive rate: **0.3%** (industry avg: 2.1%)\n- Analyst review queue: 4 pending\n- Auto-resolved: 97% of flags\n\n**How to reduce false positives:**\n1. Tune RULE_009 threshold in Rules Engine\n2. Add trusted contact whitelist per account\n3. Review flagged transactions in Reports → False Positive Analysis`,
  },
  {
    patterns: [/device/i, /fingerprint/i, /binding/i, /trust/i],
    response: () => `**Device binding** creates a cryptographic trust anchor per account.\n\n**Binding process:**\n1. First login: device fingerprint captured + stored\n2. Subsequent logins: fingerprint delta computed\n3. New device: USSD push step-up triggered\n4. Delta > threshold: treat as high-risk event\n\n**Signals captured:** Hardware ID · SIM serial · Screen resolution · OS version · Install ID\n\n📊 Currently: 1,247 trusted devices registered across your customer base.`,
  },
  {
    patterns: [/how many/i, /stats/i, /numbers/i, /summary/i, /today/i],
    response: () => `**Live dashboard summary (today):**\n\n| Metric | Value |\n|--------|-------|\n| Total transactions evaluated | 7 |\n| High-risk blocked | 3 |\n| Warnings issued | 2 |\n| Fraud prevented | R10,500 |\n| Active fraud rules | 10/11 |\n| Avg decision latency | 73ms |\n\nAll systems operational. Last model update: 2h ago.`,
  },
  {
    patterns: [/recommend/i, /suggest/i, /what should/i, /advice/i, /improve/i],
    response: () => `**PayGuard recommendations for your institution:**\n\n🔴 **High priority:**\n- Enable USSD push for all new device registrations\n- Tighten RULE_003 threshold from 0.7 → 0.85 (current false positive rate allows headroom)\n\n🟡 **Medium priority:**\n- Activate graph engine for mule network detection\n- Schedule weekly fraud pattern briefing for fraud team\n\n🟢 **Low priority:**\n- Update SDK to v1.1.0 for USSD push support\n- Review 4 pending analyst queue items`,
  },
  {
    patterns: [/rule/i, /rules/i, /engine/i],
    response: () => `**PayGuard Rule Engine — 14 active fraud rules:**\n\n| Rule | Signal | Action |\n|------|--------|--------|\n| RULE_001 | Paste during payment | WARN |\n| RULE_002 | Keystroke cadence anomaly | WARN |\n| RULE_003 | Active call + payment | BLOCK |\n| RULE_005 | Screen capture overlay | BLOCK |\n| RULE_007 | Unknown call + paste | BLOCK |\n| RULE_011 | SIM serial mismatch | BLOCK |\n| …+8 more | See Rules Engine tab | — |\n\nAll rules evaluate in parallel. Combined score determines final action.`,
  },
];

const FALLBACK_RESPONSES = [
  `I can help you analyse fraud patterns, transaction data, or explain how PayGuard's detection rules work. Try asking:\n- "Show me today's blocked transactions"\n- "How does SIM swap detection work?"\n- "What's our false positive rate?"\n- "Recommend rule optimisations"`,
  `Great question. Let me pull that from the PayGuard intelligence layer...\n\nTo give you the most accurate answer, could you clarify whether you're asking about:\n1. A specific transaction ID\n2. A fraud pattern or rule\n3. An account or device\n\nOr try one of: "Explain vishing detection" · "SIM swap stats" · "Today's summary"`,
];

function getAIResponse(query: string): string {
  const match = AI_KNOWLEDGE.find(k => k.patterns.some(p => p.test(query)));
  if (match) return match.response();
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

function formatTime(): string {
  return new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}

// Render markdown-lite: bold, tables, bullet lists
function RenderMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.7 }}>
      {lines.map((line, i) => {
        if (line.startsWith('| ')) {
          // table row
          const cells = line.split('|').filter(c => c.trim() && !c.trim().match(/^-+$/));
          if (cells.length === 0) return null;
          return (
            <div key={i} style={{ display: 'flex', gap: 0, marginBottom: 2 }}>
              {cells.map((c, j) => (
                <div key={j} style={{ flex: 1, padding: '2px 8px', background: j === 0 ? 'rgba(255,255,255,0.05)' : 'transparent', fontSize: 11, color: '#94A3B8', borderRight: '1px solid rgba(255,255,255,0.06)', lineHeight: 1.9 }}>
                  {c.trim().replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
              ))}
            </div>
          );
        }
        if (line.trim().match(/^\d+\.\s|^[-•]\s|^🔴|^🟡|^🟢|^📊|^⚡|^✅/)) {
          const bold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong style="color:#F0F6FF">${m}</strong>`);
          return <div key={i} style={{ paddingLeft: 4, marginBottom: 3, fontSize: 12, color: '#94A3B8' }} dangerouslySetInnerHTML={{ __html: bold(line) }} />;
        }
        if (line.startsWith('**') || line.startsWith('# ') || line.startsWith('## ')) {
          const clean = line.replace(/^#+\s/, '').replace(/\*\*/g, '');
          return <div key={i} style={{ fontWeight: 700, color: '#F0F6FF', marginBottom: 4, fontSize: 12 }}>{clean}</div>;
        }
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        const bold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong style="color:#F0F6FF">${m}</strong>`);
        return <div key={i} style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }} dangerouslySetInnerHTML={{ __html: bold(line) }} />;
      })}
    </div>
  );
}

const SUGGESTIONS = [
  "Today's summary", "How does vishing detection work?", "Recommend optimisations", "SIM swap stats", "Explain risk scoring",
];

export default function AskPayGuard({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', ts: formatTime(), text: `**Hello! I'm PayGuard AI** 🛡️\n\nI have full context of your dashboard — transactions, rules, risk scores, and fraud patterns.\n\nAsk me anything:\n- "Explain today's blocked transactions"\n- "Why did RULE_003 fire?"\n- "What's our false positive rate?"\n- "SIM swap detection stats"` },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { role: 'user', ts: formatTime(), text: text.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setThinking(true);

    // Simulate AI thinking delay (700–1400ms)
    const delay = 700 + Math.random() * 700;
    await new Promise(r => setTimeout(r, delay));

    const aiResponse = getAIResponse(text);
    setMessages(m => [...m, { role: 'ai', ts: formatTime(), text: aiResponse }]);
    setThinking(false);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 500,
      width: 400, maxHeight: '80vh',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(140deg, #0A101E, #080D18)',
      border: '1px solid rgba(14,165,233,0.3)',
      borderRadius: 20,
      boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(14,165,233,0.15)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'rgba(14,165,233,0.08)', borderBottom: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡️</div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: '#F0F6FF' }}>Ask PayGuard</div>
            <div style={{ fontSize: 10, color: '#0EA5E9', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10F5A0', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              AI · Live dashboard context
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: '#64748B', fontSize: 14 }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: m.role === 'ai' ? 'linear-gradient(135deg,#0EA5E9,#7C3AED)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
              {m.role === 'ai' ? '🛡️' : '👤'}
            </div>
            <div style={{ maxWidth: '85%' }}>
              <div style={{
                padding: '10px 12px', borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                background: m.role === 'user' ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${m.role === 'user' ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.07)'}`,
              }}>
                {m.role === 'ai' ? <RenderMessage text={m.text} /> : <div style={{ fontSize: 13, color: '#F0F6FF' }}>{m.text}</div>}
              </div>
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 3, textAlign: m.role === 'user' ? 'right' : 'left' }}>{m.ts}</div>
            </div>
          </div>
        ))}
        {thinking && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🛡️</div>
            <div style={{ padding: '10px 16px', borderRadius: '4px 14px 14px 14px', background: 'var(--w-card)', border: '1px solid var(--w-card-border)' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', animation: 'pulse 1.2s infinite', animationDelay: `${j * 0.2}s`, opacity: 0.6 }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: '#0EA5E9', cursor: 'pointer' }}>{s}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Ask about fraud patterns, transactions, rules…"
          style={{ flex: 1, background: 'var(--w-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#F0F6FF', fontFamily: 'Inter, sans-serif', outline: 'none' }}
        />
        <button onClick={() => send(input)} disabled={!input.trim() || thinking} style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() ? 'linear-gradient(135deg,#0EA5E9,#7C3AED)' : 'rgba(255,255,255,0.05)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>→</button>
      </div>
    </div>
  );
}
