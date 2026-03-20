/**
 * OTP Service — generates, stores, and verifies one-time passwords for device step-up.
 *
 * Storage: Redis with configurable TTL (default 10 minutes).
 * SMS: Pluggable provider abstraction (mock | africas_talking | infobip).
 */

import crypto from 'crypto';
import {
  isRedisOnline,
  setOtp,
  getOtp,
  clearOtp,
  getOtpAttempts,
  incrOtpAttempts,
} from '../db/redis';
import { logger } from '../utils/logger';


const OTP_TTL    = parseInt(process.env.OTP_TTL_SECONDS  || '600', 10);
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH        || '6',   10);
const MAX_ATTEMPTS = 3;

// ── SMS Provider abstraction ──────────────────────────────────────────────────
interface SmsProvider {
  sendOtp(phoneNumber: string, otp: string): Promise<void>;
}

class MockSmsProvider implements SmsProvider {
  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    // In mock mode, log the OTP so developers can test without SMS credits
    logger.warn('[MOCK SMS] OTP not sent via real provider', {
      phone: phoneNumber,
      otp: process.env.NODE_ENV !== 'production' ? otp : '***REDACTED***',
    });
  }
}

class AfricasTalkingProvider implements SmsProvider {
  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    const { default: AfricasTalking } = await import('africastalking');
    const at = AfricasTalking({
      apiKey:   process.env.AFRICAS_TALKING_API_KEY!,
      username: process.env.AFRICAS_TALKING_USERNAME!,
    });
    await at.SMS.send({
      to:      [phoneNumber],
      message: `Your PayGuard verification code is: ${otp}. Valid for ${Math.floor(OTP_TTL / 60)} minutes. Do not share.`,
      from:    'PayGuard',
    });
    logger.info('OTP sent via Africa\'s Talking');
  }
}

class InfobipProvider implements SmsProvider {
  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    const response = await fetch(`${process.env.INFOBIP_BASE_URL}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${process.env.INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          destinations: [{ to: phoneNumber }],
          from: 'PayGuard',
          text: `Your PayGuard verification code is: ${otp}. Valid for ${Math.floor(OTP_TTL / 60)} minutes. Do not share.`,
        }],
      }),
    });
    if (!response.ok) throw new Error(`Infobip SMS failed: ${response.statusText}`);
    logger.info('OTP sent via Infobip');
  }
}

function getSmsProvider(): SmsProvider {
  switch ((process.env.SMS_PROVIDER || 'mock').toLowerCase()) {
    case 'africas_talking': return new AfricasTalkingProvider();
    case 'infobip':          return new InfobipProvider();
    default:                 return new MockSmsProvider();
  }
}

// Note: OTP Redis keys are now managed by db/redis.ts safe wrappers.
// The local key helpers below are kept for reference only and are no longer used.

// ── Public API ────────────────────────────────────────────────────────────────
export interface OtpRequestResult {
  success: boolean;
  expiresInSeconds: number;
}

export interface OtpVerifyResult {
  valid: boolean;
  reason?: 'expired' | 'invalid' | 'max_attempts';
}

/**
 * Generate a new OTP, store in Redis, and dispatch via SMS provider.
 */
export async function requestOtp(
  userId: string,
  phoneNumber: string,
): Promise<OtpRequestResult> {
  if (!isRedisOnline()) {
    throw new Error('OTP service unavailable — session store offline');
  }

  const otp = crypto.randomInt(
    Math.pow(10, OTP_LENGTH - 1),
    Math.pow(10, OTP_LENGTH),
  ).toString();

  // Hash before storing (so DB breach doesn't expose OTPs)
  const hash = crypto.createHash('sha256').update(otp).digest('hex');

  const stored = await setOtp(userId, hash, OTP_TTL);
  if (!stored) {
    throw new Error('OTP service unavailable — failed to persist OTP');
  }
  // setOtp overwrites any previous OTP hash for this userId.
  // incrOtpAttempts will reset naturally on next verification cycle.

  const provider = getSmsProvider();
  await provider.sendOtp(phoneNumber, otp);

  logger.info('OTP generated and dispatched', { userId });
  return { success: true, expiresInSeconds: OTP_TTL };
}

/**
 * Verify a submitted OTP against the stored hash.
 * Tracks attempts and locks out after MAX_ATTEMPTS.
 */
export async function verifyOtp(
  userId: string,
  submittedOtp: string,
): Promise<OtpVerifyResult> {
  if (!isRedisOnline()) {
    throw new Error('OTP service unavailable — session store offline');
  }

  // Check attempt count — returns 999 if Redis is offline (safe deny)
  const attempts = await getOtpAttempts(userId);
  if (attempts >= MAX_ATTEMPTS) {
    logger.warn('OTP max attempts exceeded', { userId });
    return { valid: false, reason: 'max_attempts' };
  }

  const storedHash = await getOtp(userId);
  if (!storedHash) {
    return { valid: false, reason: 'expired' };
  }

  const submittedHash = crypto.createHash('sha256').update(submittedOtp).digest('hex');
  const isValid = crypto.timingSafeEqual(
    Buffer.from(storedHash),
    Buffer.from(submittedHash),
  );

  if (!isValid) {
    await incrOtpAttempts(userId, OTP_TTL);
    logger.warn('OTP verification failed', { userId, attempt: attempts + 1 });
    return { valid: false, reason: 'invalid' };
  }

  // Consume the OTP (invalidate after first successful use)
  await clearOtp(userId);
  logger.info('OTP verified successfully', { userId });
  return { valid: true };
}
