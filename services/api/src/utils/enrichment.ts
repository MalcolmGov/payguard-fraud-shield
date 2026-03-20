/**
 * External API Enrichment Utilities
 * ===================================
 * Wraps free public APIs for signal enrichment before Kafka publishing.
 * All calls have 500ms timeouts and fail silently — never block signal ingestion.
 */

import { logger } from './logger';

// ── Types ────────────────────────────────────────────────────────────────────

export interface IpGeoData {
  country: string;
  countryCode: string;
  city: string;
  isp: string;
  org: string;
  hosting: boolean;
  proxy: boolean;
  lat: number;
  lon: number;
}

export interface EmailRepData {
  email: string;
  reputation: string;
  suspicious: boolean;
  references: number;
  blacklisted: boolean;
  malicious_activity: boolean;
  data_breach: boolean;
}

// ── IP Geolocation (ip-api.com) ──────────────────────────────────────────────

const IP_API_URL = 'http://ip-api.com/json';

/**
 * Enrich an IP address with geolocation data from ip-api.com.
 * Free tier: 45 requests/minute, no API key needed.
 * Returns null on failure (fail-open).
 */
export async function enrichIpGeolocation(ip: string): Promise<IpGeoData | null> {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 500);

    const resp = await fetch(
      `${IP_API_URL}/${ip}?fields=status,country,countryCode,city,lat,lon,isp,org,hosting,proxy`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!resp.ok) return null;
    const data: any = await resp.json();

    if (data.status !== 'success') return null;

    return {
      country: data.country,
      countryCode: data.countryCode,
      city: data.city,
      isp: data.isp,
      org: data.org,
      hosting: data.hosting ?? false,
      proxy: data.proxy ?? false,
      lat: data.lat,
      lon: data.lon,
    };
  } catch (err) {
    logger.debug('IP geolocation enrichment failed (non-blocking)', { ip });
    return null;
  }
}

// ── Email Reputation (EmailRep.io) ───────────────────────────────────────────

const EMAILREP_URL = 'https://emailrep.io';

/**
 * Check email reputation via EmailRep.io.
 * Free tier: no API key, ~25 req/day.
 * Returns null on failure (fail-open).
 */
export async function checkEmailReputation(email: string): Promise<EmailRepData | null> {
  if (!email || !email.includes('@')) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const resp = await fetch(`${EMAILREP_URL}/${email}`, {
      headers: {
        'User-Agent': 'PayGuard-FraudShield/1.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) return null;
    const data: any = await resp.json();

    return {
      email,
      reputation: data.reputation ?? 'none',
      suspicious: data.suspicious ?? false,
      references: data.references ?? 0,
      blacklisted: data.details?.blacklisted ?? false,
      malicious_activity: data.details?.malicious_activity ?? false,
      data_breach: data.details?.data_breach ?? false,
    };
  } catch (err) {
    logger.debug('Email reputation check failed (non-blocking)', { email });
    return null;
  }
}
