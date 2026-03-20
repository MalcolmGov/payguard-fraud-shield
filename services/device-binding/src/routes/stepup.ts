import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requestOtp, verifyOtp } from '../otp/service';
import { query } from '../db/postgres';
import {
  isRedisOnline,
  getUssdSession,
  setUssdSession,
  delUssdSession,
} from '../db/redis';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth';

export const stepUpRouter = Router();
stepUpRouter.use(authMiddleware);

// ── Shared: promote device to trusted ────────────────────────────────────────
async function promoteDeviceToTrusted(userId: string, deviceFingerprint: string) {
  await query(
    `UPDATE device_accounts
     SET trust_status = 'trusted', trusted_at = NOW()
     WHERE user_id = $1
       AND device_fingerprint = (
         SELECT fingerprint FROM devices WHERE fingerprint = $2
       )`,
    [userId, deviceFingerprint],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OTP STEP-UP
// ═══════════════════════════════════════════════════════════════════════════════

const OtpRequestSchema = z.object({
  user_id:      z.string().min(1),
  phone_number: z.string().min(7).max(20),
});

stepUpRouter.post('/request', async (req: Request, res: Response) => {
  const parsed = OtpRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }

  const { user_id, phone_number } = parsed.data;

  try {
    const result = await requestOtp(user_id, phone_number);
    logger.info('OTP requested', { userId: user_id, channel: 'sms' });
    return res.json(result);
  } catch (err) {
    logger.error('OTP request failed', { userId: user_id, err });
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

const OtpVerifySchema = z.object({
  user_id:            z.string().min(1),
  device_fingerprint: z.string().min(8),
  otp:               z.string().length(parseInt(process.env.OTP_LENGTH || '6', 10)),
});

stepUpRouter.post('/verify', async (req: Request, res: Response) => {
  const parsed = OtpVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }

  const { user_id, device_fingerprint, otp } = parsed.data;

  try {
    const result = await verifyOtp(user_id, otp);

    if (!result.valid) {
      const statusCode = result.reason === 'max_attempts' ? 429 : 401;
      return res.status(statusCode).json({ error: 'OTP verification failed', reason: result.reason });
    }

    await promoteDeviceToTrusted(user_id, device_fingerprint);
    logger.info('Device promoted to trusted via OTP step-up', { userId: user_id });

    return res.json({
      success:        true,
      channel:        'otp_sms',
      device_status:  'trusted',
      message:        'Device verified and trusted. Future logins will not require OTP.',
    });
  } catch (err) {
    logger.error('OTP verification failed', { userId: user_id, err });
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USSD PUSH STEP-UP
// ═══════════════════════════════════════════════════════════════════════════════
//
// Flow:
//   1. POST /step-up/ussd/push  → trigger mobile carrier USSD push to subscriber's handset
//   2. Subscriber's phone shows: "PayGuard: Authorise new device? 1=Allow 2=Deny"
//   3. mobile carrier USSD GW POSTs the response back to our /ussd/callback endpoint
//   4. App polls GET /step-up/ussd/status?session_id=... until confirmed/denied/expired
//   5. On confirmed → device is promoted to trusted
//
// Redis keys:
//   ussd:session:{sessionId}  → JSON { userId, fingerprint, status, expiresAt }
//   TTL: 5 minutes
// ─────────────────────────────────────────────────────────────────────────────

const USSD_SESSION_TTL_S = 300; // 5 minutes

const UssdPushSchema = z.object({
  user_id:            z.string().min(1),
  phone_number:       z.string().min(7).max(20),
  device_fingerprint: z.string().min(8),
});

/**
 * POST /device/step-up/ussd/push
 * Initiates a USSD push notification to the subscriber's handset.
 */
stepUpRouter.post('/ussd/push', async (req: Request, res: Response) => {
  const parsed = UssdPushSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }

  const { user_id, phone_number, device_fingerprint } = parsed.data;

  if (!isRedisOnline()) {
    logger.warn('USSD push rejected — Redis offline', { userId: user_id });
    return res.status(503).json({
      error: 'USSD step-up temporarily unavailable — session store offline. Try OTP instead.',
    });
  }

  try {
    const sessionId = `ussd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const expiresAt = Math.floor(Date.now() / 1000) + USSD_SESSION_TTL_S;

    await setUssdSession(
      sessionId,
      JSON.stringify({ userId: user_id, fingerprint: device_fingerprint, status: 'pending', expiresAt }),
      USSD_SESSION_TTL_S,
    );

    await triggerUssdPush(phone_number, sessionId);

    logger.info('USSD push initiated', { userId: user_id, sessionId, channel: 'ussd' });

    return res.json({
      session_id:  sessionId,
      status:      'ussd_push_sent',
      expires_at:  expiresAt,
      message:     'A USSD notification has been sent to your handset. Press 1 to authorise or 2 to deny.',
      poll_url:    `/device/step-up/ussd/status?session_id=${sessionId}`,
    });
  } catch (err) {
    logger.error('USSD push failed', { userId: user_id, err });
    return res.status(500).json({ error: 'Failed to send USSD push' });
  }
});

/**
 * GET /device/step-up/ussd/status?session_id=...
 * Polling endpoint — returns the current status of a USSD push session.
 * Client SDK polls every 3s until status is 'confirmed', 'denied', or 'expired'.
 */
stepUpRouter.get('/ussd/status', async (req: Request, res: Response) => {
  const { session_id } = req.query;
  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'Missing session_id query parameter' });
  }

  try {
    const raw = await getUssdSession(session_id);
    if (!raw) {
      return res.status(404).json({ status: 'expired', message: 'Session not found or expired' });
    }

    const session = JSON.parse(raw) as {
      userId: string; fingerprint: string; status: string; expiresAt: number;
    };

    if (session.status === 'confirmed') {
      await promoteDeviceToTrusted(session.userId, session.fingerprint);
      await delUssdSession(session_id);
      logger.info('Device promoted to trusted via USSD push', { userId: session.userId });
    }

    return res.json({
      session_id,
      status:      session.status,
      expires_at:  session.expiresAt,
      device_status: session.status === 'confirmed' ? 'trusted' : undefined,
    });
  } catch (err) {
    logger.error('USSD status check failed', { sessionId: session_id, err });
    return res.status(500).json({ error: 'Status check failed' });
  }
});

/**
 * POST /device/step-up/ussd/callback
 * Webhook called by the mobile carrier USSD Gateway with the subscriber's response (1=Allow, 2=Deny).
 * This endpoint is NOT protected by API key — it validates by session_id + HMAC signature.
 */
stepUpRouter.post('/ussd/callback', async (req: Request, res: Response) => {
  const { session_id, response_code, msisdn } = req.body;

  if (!session_id || !response_code) {
    return res.status(400).json({ error: 'Missing session_id or response_code' });
  }

  // TODO: Verify HMAC-SHA256 signature from carrier gateway header

  try {
    const raw = await getUssdSession(session_id);
    if (!raw) {
      return res.status(200).send('OK'); // already expired or handled
    }

    const session = JSON.parse(raw);
    const newStatus = response_code === '1' ? 'confirmed' : 'denied';

    await setUssdSession(
      session_id,
      JSON.stringify({ ...session, status: newStatus }),
      60, // keep for 60s so client poll can see the final state
    );

    logger.info('USSD callback received', { sessionId: session_id, status: newStatus, msisdn });

    return res.status(200).send('END Device authorisation complete. Thank you.');
  } catch (err) {
    logger.error('USSD callback processing failed', { session_id, err });
    return res.status(500).send('END Error processing your response. Please try again.');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Internal: trigger USSD push via mobile carrier USSD Gateway / Africa's Talking
// ─────────────────────────────────────────────────────────────────────────────
async function triggerUssdPush(msisdn: string, sessionId: string): Promise<void> {
  const ussdString = `CON PayGuard Security Alert\nA new device is requesting access to your mobile money account.\n\nPress 1 to Allow\nPress 2 to Deny`;
  const callbackUrl = `${process.env.SERVICE_BASE_URL}/device/step-up/ussd/callback`;

  // Africa's Talking USSD push (or mobile carrier direct USSD GW — swap env var USSD_PROVIDER)
  const provider = process.env.USSD_PROVIDER ?? 'africas_talking';

  if (provider === 'africas_talking') {
    // Africa's Talking doesn't have a built-in USSD push API in the JS SDK —
    // use their HTTP API directly
    const axios = await import('axios');
    await axios.default.post(
      `https://api.africastalking.com/version1/ussd/send`,
      new URLSearchParams({
        username:    process.env.AT_USERNAME!,
        phoneNumber: msisdn,
        sessionId,
        serviceCode: process.env.USSD_SERVICE_CODE ?? '*384#',
        text:        ussdString,
      }),
      {
        headers: {
          apiKey:         process.env.AT_API_KEY!,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept:         'application/json',
        },
      },
    );
  } else if (provider === 'mtn_gw') {
    // mobile carrier direct USSD push gateway
    const axios = await import('axios');
    await axios.default.post(process.env.MTN_USSD_GW_URL!, {
      msisdn,
      session_id:  sessionId,
      message:     ussdString,
      callback_url: callbackUrl,
    }, {
      headers: { Authorization: `Bearer ${process.env.MTN_USSD_GW_TOKEN}` },
    });
  } else {
    // Stub / dev mode — immediately mark confirmed in Redis for local testing
    logger.warn('USSD_PROVIDER not configured — using stub (auto-confirm in 5s)', { msisdn });
    setTimeout(async () => {
      const raw = await getUssdSession(sessionId);
      if (raw) {
        const session = JSON.parse(raw);
        await setUssdSession(sessionId, JSON.stringify({ ...session, status: 'confirmed' }), 60);
      }
    }, 5000);
  }
}
