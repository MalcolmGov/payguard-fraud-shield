// Vercel serverless function types (inline to avoid @vercel/node dependency)
type VercelRequest = { method?: string; body?: any; query?: Record<string, string | string[]>; headers: Record<string, string> };
type VercelResponse = { setHeader: (k: string, v: string) => VercelResponse; status: (code: number) => VercelResponse; json: (data: any) => void; end: () => void };

/**
 * Vercel serverless function — generates ephemeral OpenAI Realtime API tokens
 * for the PayGuard Voice Co-Pilot. Keeps the API key server-side.
 *
 * POST /api/openai-session
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const apiKey = (globalThis as any).process?.env?.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2025-06-03',
        voice: 'sage',
        modalities: ['audio', 'text'],
        instructions: `You are PayGuard's Fraud Analyst Co-Pilot, an AI voice assistant built into the PayGuard fraud analytics dashboard.

IDENTITY:
- Your name is "PayGuard Co-Pilot"
- You speak in a confident, analytical tone — like a senior fraud analyst briefing a CISO
- You are an expert in social engineering fraud, SIM swap detection, vishing, OTP interception, account takeover, and mule network analysis

CONTEXT:
- PayGuard is a real-time social engineering fraud detection platform for banks and fintechs in South Africa
- It monitors transactions for fraud patterns: SIM swaps, vishing (phone phishing), OTP interception, account takeover, mule networks, velocity breaches
- Key metrics: transactions processed, threats blocked, warnings issued, fraud prevented (ZAR), average response time
- Threat levels: GREEN (normal), AMBER (elevated), RED (critical)
- The system uses AI pre-crime scores, geo-intelligence, device binding, fraud clusters, and trajectory forecasting

BEHAVIOR:
- Keep responses conversational and concise (2-4 sentences for voice)
- When asked about threat stats, refer to real-time dashboard data
- Mention specific attack vectors and their percentages when discussing threats
- Be proactive: flag unusual patterns, suggest rule adjustments, recommend actions
- You can discuss SARB compliance, POPIA, and regulatory requirements

VOICE STYLE:
- Speak naturally, like a senior analyst in a SOC briefing
- Use phrases like "Looking at the threat feed..." or "I'm seeing elevated activity on..."
- Round numbers: say "about 12,800 transactions" not "12,847"
- Be decisive with recommendations`,
        tools: [
          { type: 'function', name: 'get_threat_overview', description: 'Get current threat level, transaction count, threats blocked, warnings, fraud prevented amount, and response time.', parameters: { type: 'object', properties: {}, required: [] } },
          { type: 'function', name: 'get_attack_vectors', description: 'Get breakdown of top attack vectors with percentages (SIM swap, vishing, OTP interception, account takeover, mule networks).', parameters: { type: 'object', properties: {}, required: [] } },
          { type: 'function', name: 'get_live_threats', description: 'Get the latest entries from the live threat feed showing recent blocked/warned transactions.', parameters: { type: 'object', properties: {}, required: [] } },
          { type: 'function', name: 'get_flagged_transactions', description: 'Get recent flagged transactions with risk levels and actions taken.', parameters: { type: 'object', properties: {}, required: [] } },
        ],
        tool_choice: 'auto',
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: { type: 'server_vad', threshold: 0.85, prefix_padding_ms: 400, silence_duration_ms: 1000 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `OpenAI API error: ${response.status}`, detail: errorText });
    }

    return res.status(200).json(await response.json());
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create session', detail: err.message });
  }
}
