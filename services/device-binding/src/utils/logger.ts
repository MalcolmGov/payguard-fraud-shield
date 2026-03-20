import winston from 'winston';

// ── PII masking patterns ──────────────────────────────────────────────────────
const PII_PATTERNS: Array<[RegExp, string]> = [
  [/(\+?27|0)[6-8][0-9]{8}/g,         '***PHONE***'],
  [/(\+?234)[0-9]{10}/g,              '***PHONE***'],
  [/\b[0-9]{10,15}\b/g,              '***PHONE***'],
  [/\b[\w.-]+@[\w.-]+\.\w{2,}\b/g,  '***EMAIL***'],
  [/\b((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g, '***IP***'],
  [/eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/]*/g, '***JWT***'],
  [/("password"|"secret"|"token"|"api_key"|"otp"|"pin")\s*:\s*"[^"]*"/gi, '$1: "***REDACTED***"'],
];

function maskPII(value: unknown): string {
  let str = typeof value === 'string' ? value : (JSON.stringify(value) ?? '');
  for (const [pattern, replacement] of PII_PATTERNS) {
    str = str.replace(pattern, replacement);
  }
  return str;
}

// ── Winston format with PII masking ──────────────────────────────────────────
const maskedFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { level, message, timestamp, ...meta } = info as {
      level: string; message: string; timestamp: string; [k: string]: unknown;
    };
    const maskedMsg  = maskPII(message);
    const maskedMeta = meta && Object.keys(meta).length
      ? ' ' + maskPII(JSON.stringify(meta))
      : '';
    return `[${timestamp}] ${level.toUpperCase().padEnd(5)} ${maskedMsg}${maskedMeta}`;
  }),
);

const jsonMaskedFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { level, message, timestamp, ...meta } = info as {
      level: string; message: string; timestamp: string; [k: string]: unknown;
    };
    return JSON.stringify({
      ts: timestamp,
      level,
      msg: maskPII(message),
      ...JSON.parse(maskPII(JSON.stringify(meta))),
      service: 'device-binding-service',
    });
  }),
);

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProduction ? jsonMaskedFormat : maskedFormat,
  transports: [
    new winston.transports.Console(),
  ],
});

export function redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE_KEYS = new Set([
    'password', 'secret', 'token', 'apiKey', 'api_key',
    'device_token', 'otp', 'pin', 'cvv',
  ]);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      SENSITIVE_KEYS.has(k.toLowerCase()) ? [k, '***REDACTED***'] : [k, v]
    )
  );
}
