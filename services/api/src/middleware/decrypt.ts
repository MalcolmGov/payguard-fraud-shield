import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

const ENCRYPTION_KEY = Buffer.from(
  process.env.PAYLOAD_ENCRYPTION_KEY || '0'.repeat(64), // 32 bytes hex
  'hex'
);

/**
 * Decrypts AES-256-GCM encrypted SDK payloads.
 * The SDK sends: { iv: hex, tag: hex, ciphertext: hex }
 * This middleware decrypts and puts the plain object back on req.body.
 *
 * In dev mode (SKIP_DECRYPTION=true), passes the body through unchanged.
 */
export function decryptMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (process.env.SKIP_DECRYPTION === 'true') {
    return next();
  }

  try {
    const { iv, tag, ciphertext } = req.body as { iv: string; tag: string; ciphertext: string };

    if (!iv || !tag || !ciphertext) {
      // Payload not encrypted — pass through (supports dev mode plain JSON)
      return next();
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      ENCRYPTION_KEY,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'hex')),
      decipher.final(),
    ]);

    req.body = JSON.parse(decrypted.toString('utf8'));
    next();
  } catch (err) {
    logger.error('Payload decryption failed', { err });
    res.status(400).json({ error: 'Payload decryption failed' });
  }
}
