/**
 * Startup environment variable validation.
 * Crashes fast with a descriptive error if critical secrets are missing or insecure.
 */

interface EnvSpec {
  key: string;
  required: boolean;
  minLength?: number;
  forbidDefault?: string[];
}

const REQUIRED_ENV: EnvSpec[] = [
  {
    key: 'DEVICE_TOKEN_SECRET',
    required: true,
    minLength: 32,
    forbidDefault: [
      'change_me_in_production_min_32_chars',
      'CHANGE_ME_GENERATE_WITH_OPENSSL_RAND_HEX_32',
      'secret',
      'dev',
      'test',
    ],
  },
  { key: 'POSTGRES_HOST',     required: true },
  { key: 'POSTGRES_USER',     required: true },
  { key: 'POSTGRES_PASSWORD', required: true, forbidDefault: ['fraud_secret', 'postgres', 'password', ''] },
  { key: 'POSTGRES_DB',       required: true },
  { key: 'REDIS_HOST',        required: true },
  { key: 'API_KEYS',          required: true, minLength: 10 },
];

export function validateEnv(): void {
  const errors: string[] = [];

  for (const spec of REQUIRED_ENV) {
    const value = process.env[spec.key];

    if (spec.required && !value) {
      errors.push(`❌ Missing required env var: ${spec.key}`);
      continue;
    }

    if (value && spec.minLength && value.length < spec.minLength) {
      errors.push(`❌ ${spec.key} is too short (${value.length} chars, minimum ${spec.minLength})`);
    }

    if (value && spec.forbidDefault?.some(d => value.toLowerCase() === d.toLowerCase())) {
      errors.push(`❌ ${spec.key} is set to a known insecure default value — generate a strong secret`);
    }
  }

  // Warn on non-production without SSL
  if (process.env.NODE_ENV === 'production' && process.env.POSTGRES_SSL !== 'true') {
    errors.push('❌ POSTGRES_SSL must be "true" in production');
  }

  if (errors.length > 0) {
    console.error('\n🚨 Environment validation failed:\n');
    errors.forEach(e => console.error('  ' + e));
    console.error('\nFix these issues before starting the service.\n');
    process.exit(1);
  }
}
