// ── PM2 Ecosystem Config ─────────────────────────────────────────────────────
// IMPORTANT: Build TypeScript before starting!
//   npm run build --workspace=services/api
//   npm run build --workspace=services/device-binding
//
// Usage:
//   Start all:         pm2 start ecosystem.config.cjs
//   Stop all:          pm2 stop all
//   Restart service:   pm2 restart payguard-api
//   Live logs:         pm2 logs
//   Status table:      pm2 list
//   Monitor:           pm2 monit
//   Save on boot:      pm2 startup  → run printed command → pm2 save
//
// NOTE: Sensitive env vars (DEVICE_TOKEN_SECRET, POSTGRES_PASSWORD, API_KEYS)
//       must be set in .env files or the host environment — NOT in this file.

module.exports = {
  apps: [
    // ── 1. Signal Ingestion & Evaluation API (port 3001) ────────────────────
    {
      name:    'payguard-api',
      cwd:     './services/api',
      script:  'dist/index.js',           // compiled JS — no ts-node needed
      watch:   false,
      instances:        1,
      exec_mode:        'fork',
      autorestart:      true,
      max_restarts:     10,
      restart_delay:    3000,
      min_uptime:       '5s',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: '3001',
        DASHBOARD_URL: 'http://localhost:5173',
        KAFKA_BROKERS: 'localhost:9092',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
      error_file: '../../logs/api-error.log',
      out_file:   '../../logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },

    // ── 2. Device Binding Microservice (port 3002) ──────────────────────────
    {
      name:    'payguard-device',
      cwd:     './services/device-binding',
      script:  'dist/index.js',           // compiled JS — no ts-node needed
      watch:   false,
      instances:        1,
      exec_mode:        'fork',
      autorestart:      true,
      max_restarts:     10,
      restart_delay:    3000,
      min_uptime:       '5s',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: '3002',
        USSD_PROVIDER: 'stub',
        SMS_PROVIDER: 'stub',
        CORS_ORIGIN: 'http://localhost:5173',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '3002',
      },
      error_file: '../../logs/device-error.log',
      out_file:   '../../logs/device-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
