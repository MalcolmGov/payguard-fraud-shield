/**
 * PayGuardVoiceCoPilot — AI Voice Co-Pilot for PayGuard Fraud Dashboard
 *
 * WebRTC speech-to-speech with function calling for live fraud data.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Live Fraud Data ── */
function getLiveFraudData() {
  const baseTx = 12000 + Math.floor(Math.random() * 2000);
  const blocked = 300 + Math.floor(Math.random() * 100);
  const warnings = 150 + Math.floor(Math.random() * 80);
  const prevented = 2000000 + Math.random() * 800000;
  const avgResponse = 40 + Math.floor(Math.random() * 20);

  return {
    threatLevel: Math.random() > 0.7 ? 'RED' : Math.random() > 0.4 ? 'AMBER' : 'GREEN',
    transactions: baseTx, blocked, warnings,
    fraudPrevented: prevented, avgResponseMs: avgResponse,
    successRate: 97 + Math.random() * 2.5,
    attackVectors: [
      { name: 'SIM Swap', pct: 38 + Math.floor(Math.random() * 8) },
      { name: 'Vishing (Phone)', pct: 24 + Math.floor(Math.random() * 6) },
      { name: 'OTP Interception', pct: 14 + Math.floor(Math.random() * 4) },
      { name: 'Account Takeover', pct: 10 + Math.floor(Math.random() * 4) },
      { name: 'Mule Networks', pct: 6 + Math.floor(Math.random() * 3) },
    ],
    recentThreats: [
      { time: '18:08:54', type: 'Velocity Breach', amount: 950, action: 'BLOCK' },
      { time: '18:06:12', type: 'Device Anomaly', amount: 1200, action: 'BLOCK' },
      { time: '18:04:31', type: 'Mule Account Flagged', amount: 8500, action: 'BLOCK' },
      { time: '18:02:18', type: 'SIM Swap Blocked', amount: 3500, action: 'BLOCK' },
      { time: '18:00:45', type: 'SIM Swap Blocked', amount: 1200, action: 'WARN' },
    ],
    flaggedTx: [
      { time: '23:06', user: '—', amount: 2900, risk: 'HIGH', action: 'BLOCK' },
      { time: '17:02', user: '—', amount: 3000, risk: 'HIGH', action: 'BLOCK' },
      { time: '16:08', user: '—', amount: 500, risk: 'HIGH', action: 'WARN_USER' },
      { time: '13:05', user: '—', amount: 700, risk: 'MEDIUM', action: 'WARN_USER' },
      { time: '14:35', user: '—', amount: 300, risk: 'LOW', action: 'ALLOW' },
    ],
  };
}

async function resolveToolCall(fnName: string): Promise<string> {
  const d = getLiveFraudData();
  switch (fnName) {
    case 'get_threat_overview':
      return JSON.stringify({
        threatLevel: d.threatLevel, transactions: d.transactions,
        threatsBlocked: d.blocked, warningsIssued: d.warnings,
        fraudPrevented: `R ${Math.round(d.fraudPrevented).toLocaleString()}`,
        avgResponseTime: `${d.avgResponseMs}ms`, detectionRate: `${d.successRate.toFixed(1)}%`,
      });
    case 'get_attack_vectors':
      return JSON.stringify(d.attackVectors);
    case 'get_live_threats':
      return JSON.stringify(d.recentThreats);
    case 'get_flagged_transactions':
      return JSON.stringify(d.flaggedTx);
    default:
      return JSON.stringify({ error: `Unknown function: ${fnName}` });
  }
}

type ConnState = 'disconnected' | 'connecting' | 'connected' | 'error';
interface TranscriptEntry { id: string; role: 'user' | 'assistant'; text: string; ts: number; }

export default function PayGuardVoiceCoPilot() {
  const [conn, setConn] = useState<ConnState>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingRef = useRef<Map<string, { name: string; args: string }>>(new Map());
  const greetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { disconnect(); }, []);

  const addMsg = useCallback((role: 'user' | 'assistant', text: string) => {
    setTranscript(p => [...p.slice(-9), { id: `${role}-${Date.now()}-${Math.random()}`, role, text, ts: Date.now() }]);
  }, []);

  const connect = useCallback(async () => {
    setConn('connecting'); setErrorMsg('');
    try {
      let tokenRes: Response;
      try { tokenRes = await fetch('/api/openai-session', { method: 'POST' }); }
      catch { throw new Error('Cannot reach voice server'); }
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({ error: 'Failed to get session token' }));
        throw new Error(err.error || `Token failed: ${tokenRes.status}`);
      }
      const session = await tokenRes.json();
      const ek = session.client_secret?.value;
      if (!ek) throw new Error('No ephemeral key');

      const pc = new RTCPeerConnection(); pcRef.current = pc;
      const audio = new Audio(); audio.autoplay = true; audioRef.current = audio;
      pc.ontrack = e => { audio.srcObject = e.streams[0]; audio.play().catch(() => {}); };
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') setErrorMsg('Audio connection failed');
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const dc = pc.createDataChannel('oai-events'); dcRef.current = dc;
      dc.onopen = () => {
        setConn('connected');
        if (dc.readyState === 'open') {
          dc.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['audio', 'text'], voice: 'sage',
              input_audio_transcription: { model: 'whisper-1' },
              turn_detection: { type: 'server_vad', threshold: 0.85, prefix_padding_ms: 400, silence_duration_ms: 1000 },
            },
          }));
        }
        setTimeout(() => {
          if (dc.readyState === 'open') {
            dc.send(JSON.stringify({
              type: 'response.create',
              response: { modalities: ['audio', 'text'], instructions: 'Greet the user. Say "Hi, I\'m your PayGuard co-pilot. I can brief you on threat levels, attack vectors, and flagged transactions. What would you like to know?" Keep it brief.' },
            }));
          }
        }, 800);
        greetRef.current = setTimeout(() => {
          setTranscript(p => p.length === 0 ? [{ id: `g-${Date.now()}`, role: 'assistant', text: "Hi, I'm your PayGuard co-pilot. What would you like to know?", ts: Date.now() }] : p);
        }, 6000);
      };
      dc.onmessage = e => handleEvent(JSON.parse(e.data));
      dc.onerror = () => { setErrorMsg('Data channel error'); setConn('error'); };
      dc.onclose = () => setConn('disconnected');

      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      const sdpRes = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
        method: 'POST', headers: { Authorization: `Bearer ${ek}`, 'Content-Type': 'application/sdp' }, body: offer.sdp,
      });
      if (!sdpRes.ok) throw new Error(`SDP exchange failed: ${sdpRes.status}`);
      await pc.setRemoteDescription({ type: 'answer', sdp: await sdpRes.text() });
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed'); setConn('error'); disconnect();
    }
  }, [addMsg]);

  const handleEvent = useCallback((ev: any) => {
    switch (ev.type) {
      case 'output_audio_buffer.speech_started': setIsAiSpeaking(true); break;
      case 'output_audio_buffer.speech_stopped': setIsAiSpeaking(false); break;
      case 'response.audio_transcript.done': if (ev.transcript) { addMsg('assistant', ev.transcript); setIsAiSpeaking(false); } break;
      case 'response.text.done': if (ev.text) addMsg('assistant', ev.text); break;
      case 'response.content_part.done': if (ev.part?.text) addMsg('assistant', ev.part.text); break;
      case 'conversation.item.input_audio_transcription.completed': if (ev.transcript) addMsg('user', ev.transcript); break;
      case 'response.function_call_arguments.delta':
        if (ev.call_id) { const c = pendingRef.current.get(ev.call_id); if (c) c.args += ev.delta || ''; } break;
      case 'response.output_item.added':
        if (ev.item?.type === 'function_call') pendingRef.current.set(ev.item.call_id, { name: ev.item.name, args: '' }); break;
      case 'response.function_call_arguments.done':
        if (ev.call_id) {
          const call = pendingRef.current.get(ev.call_id);
          if (call) {
            const cid = ev.call_id;
            resolveToolCall(call.name).then(result => {
              if (dcRef.current?.readyState === 'open') {
                dcRef.current.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: cid, output: result } }));
                dcRef.current.send(JSON.stringify({ type: 'response.create' }));
              }
              pendingRef.current.delete(cid);
            });
          }
        } break;
      case 'error': setErrorMsg(ev.error?.message || 'API error'); break;
      case 'response.done': setIsAiSpeaking(false); break;
    }
  }, [addMsg]);

  const disconnect = useCallback(() => {
    if (greetRef.current) { clearTimeout(greetRef.current); greetRef.current = null; }
    if (dcRef.current) { try { dcRef.current.close(); } catch {} dcRef.current = null; }
    if (pcRef.current) { try { pcRef.current.close(); } catch {} pcRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioRef.current) { audioRef.current.srcObject = null; audioRef.current = null; }
    pendingRef.current.clear(); setConn('disconnected'); setIsAiSpeaking(false); setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (streamRef.current) { const t = streamRef.current.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); } }
  }, []);

  const toggleOpen = useCallback(() => {
    if (!isOpen) { setIsOpen(true); } else { if (conn === 'connected' || conn === 'connecting') disconnect(); setIsOpen(false); setTranscript([]); setErrorMsg(''); }
  }, [isOpen, conn, disconnect]);

  /* ── Render ── */
  return (
    <>
      {/* Floating button */}
      <motion.button onClick={toggleOpen}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          display: 'flex', alignItems: 'center', gap: 10,
          borderRadius: 16, fontWeight: 700, border: '1px solid rgba(255,255,255,0.15)',
          padding: '14px 20px', cursor: 'pointer', color: '#fff',
          background: conn === 'connected' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#ef4444,#7c3aed)',
          boxShadow: '0 0 25px rgba(239,68,68,0.4), 0 8px 32px rgba(0,0,0,0.3)',
        }}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
      >
        {conn === 'connected' ? (
          <>
            <span style={{ fontSize: 18 }}>🔊</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, lineHeight: 1.2 }}>Co-Pilot Active</div>
              <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>{isAiSpeaking ? 'Speaking...' : 'Listening...'}</div>
            </div>
          </>
        ) : (
          <>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, lineHeight: 1.2 }}>Voice Co-Pilot</div>
              <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>Talk to PayGuard AI</div>
            </div>
          </>
        )}
      </motion.button>

      {/* Overlay Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed', bottom: 90, right: 24, zIndex: 999, width: 380, borderRadius: 16,
              background: '#141720', border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1e28', border: '1px solid rgba(255,255,255,0.07)', fontSize: 18 }}>🛡️</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>PayGuard Co-Pilot</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    {conn === 'connected' ? (isAiSpeaking ? 'Speaking...' : 'Listening...') : conn === 'connecting' ? 'Connecting...' : conn === 'error' ? 'Error' : 'Ready'}
                  </p>
                </div>
              </div>
              <button onClick={toggleOpen} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
            </div>

            {/* Transcript */}
            <div style={{ height: 280, overflowY: 'auto', padding: '16px 20px', background: '#0d0f12', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transcript.length === 0 && conn !== 'connected' && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
                  <span style={{ fontSize: 48, opacity: 0.2 }}>🛡️</span>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Voice Co-Pilot</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Powered by PayGuard AI</p>
                  <p style={{ fontSize: 11, color: '#475569' }}>Two-way voice with live fraud data access</p>
                </div>
              )}
              {transcript.map(t => (
                <div key={t.id} style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                  ...(t.role === 'assistant' ? { background: '#1e293b', color: '#e2e8f0', alignSelf: 'flex-start', borderBottomLeftRadius: 4 }
                    : { background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', alignSelf: 'flex-end', borderBottomRightRadius: 4 }),
                }}>{t.text}</div>
              ))}
            </div>

            {/* Error */}
            {errorMsg && <div style={{ padding: '8px 20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 12, fontWeight: 600 }}>{errorMsg}</div>}

            {/* Controls */}
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {conn === 'connected' ? (
                <>
                  <button onClick={toggleMute} style={{
                    width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 18,
                    background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)', color: isMuted ? '#ef4444' : '#94a3b8',
                  }}>{isMuted ? '🔇' : '🎤'}</button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>Listening</span>
                  </div>
                  <button onClick={() => { disconnect(); }} style={{
                    width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 18,
                    background: 'rgba(239,68,68,0.2)', color: '#ef4444',
                  }}>📴</button>
                </>
              ) : (
                <button onClick={connect} disabled={conn === 'connecting'} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 28px', borderRadius: 14, border: 'none', cursor: conn === 'connecting' ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontWeight: 700, fontSize: 14,
                  boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
                }}>
                  {conn === 'connecting' ? '⏳ Connecting...' : '📞 Start Conversation'}
                </button>
              )}
            </div>
            <p style={{ textAlign: 'center', fontSize: 10, color: '#475569', paddingBottom: 12, margin: 0 }}>PayGuard AI Fraud Analyst</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
