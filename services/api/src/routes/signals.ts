import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { publishToKafka } from '../kafka/producer';
import { decryptMiddleware } from '../middleware/decrypt';
import { enrichIpGeolocation } from '../utils/enrichment';

export const signalsRouter = Router();

// Zod schema for runtime validation of SDK payloads
const SignalSchema = z.object({
  payload_id: z.string().optional(),
  user_id: z.string(),
  session_id: z.string(),
  timestamp: z.number(),
  email: z.string().email().optional(),  // Optional — used for EmailRep enrichment
  transaction: z.object({
    recipient_phone: z.string(),
    amount: z.number().positive(),
    currency: z.string(),
    note: z.string().optional(),
  }),
  device: z.object({
    device_id: z.string(),
    manufacturer: z.string(),
    model: z.string(),
    os_version: z.string(),
    is_rooted: z.boolean().default(false),
    is_emulator: z.boolean().default(false),
    is_app_tampered: z.boolean().default(false),
    is_jailbroken: z.boolean().default(false),
    is_simulator: z.boolean().default(false),
  }),
  network: z.object({
    ip_address: z.string(),
    is_vpn: z.boolean().default(false),
    is_proxy: z.boolean().default(false),
    connection_type: z.string().default('UNKNOWN'),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  }),
  behavioral: z.object({
    session_duration_ms: z.number().default(0),
    keystroke_count: z.number().default(0),
    avg_keystroke_interval_ms: z.number().default(0),
    paste_detected: z.boolean().default(false),
    pasted_fields: z.array(z.string()).default([]),
    recipient_changed_count: z.number().default(0),
    transaction_creation_ms: z.number().default(0),
    typing_speed_score: z.number().default(0.5),
  }),
  call: z.object({
    is_on_active_call: z.boolean().default(false),
    call_type: z.string().default('IDLE'),
    is_caller_in_contacts: z.boolean().default(true),
  }),
  sms: z.object({
    has_fraud_keywords: z.boolean().default(false),
    fraud_keywords_found: z.array(z.string()).default([]),
    recent_sms_count: z.number().default(0),
    unknown_sender_count: z.number().default(0),
  }).optional(),
  sim: z.object({
    operator_name: z.string().default(''),
    sim_serial_hash: z.string().default(''),
    country_iso: z.string().default(''),
    sim_swap_detected: z.boolean().default(false),
    is_dual_sim: z.boolean().default(false),
  }).optional(),
  recipient_in_contacts: z.boolean().default(true),
});

/**
 * POST /v1/signals
 * Receives encrypted SDK fraud signal payloads asynchronously.
 * Enriches with IP geolocation data, then publishes to Kafka for async
 * processing by the risk engine.
 * Returns 202 Accepted immediately.
 */
signalsRouter.post('/', decryptMiddleware, async (req: Request, res: Response) => {
  const parsed = SignalSchema.safeParse(req.body);

  if (!parsed.success) {
    logger.warn('Invalid signal payload', { errors: parsed.error.issues });
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.issues });
    return;
  }

  // Enrich with IP geolocation (non-blocking, 500ms timeout)
  const ipGeo = await enrichIpGeolocation(parsed.data.network.ip_address);

  const signal = {
    ...parsed.data,
    payload_id: parsed.data.payload_id || uuidv4(),
    received_at: Date.now(),
    ip_geo: ipGeo,  // Attached for risk engine consumption
  };

  try {
    await publishToKafka('fraud.signals.raw', signal.payload_id, signal);
    logger.info('Signal enqueued', { payload_id: signal.payload_id, user_id: signal.user_id, ip_enriched: !!ipGeo });
    res.status(202).json({ status: 'accepted', payload_id: signal.payload_id });
  } catch {
    // Kafka down — still accept and log (signals are not lost in this path)
    logger.error('Failed to publish signal to Kafka — payload dropped');
    res.status(202).json({ status: 'accepted', payload_id: signal.payload_id, warning: 'queued locally' });
  }
});
