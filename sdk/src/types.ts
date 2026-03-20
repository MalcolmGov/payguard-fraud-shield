/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard SDK — Type Definitions
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

// ── Configuration ────────────────────────────────────────────────────────────

export type Environment = 'sandbox' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export interface PayGuardConfig {
  /** Your PayGuard API key (pk_sandbox_... or pk_live_...) */
  apiKey: string;
  /** Environment — sandbox for testing, production for live */
  environment: Environment;
  /** Shadow mode — logs decisions but never blocks (ideal for PoC pilots) */
  shadowMode?: boolean;
  /** Custom API endpoint (optional — defaults to PayGuard cloud) */
  apiUrl?: string;
  /** Signal collection options */
  signals?: SignalOptions;
  /** Logging level */
  logLevel?: LogLevel;
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Fail-open — if true, returns ALLOW on any error (default: true) */
  failOpen?: boolean;
}

export interface SignalOptions {
  /** Collect device fingerprint (default: true) */
  deviceFingerprint?: boolean;
  /** Detect paste events on monitored inputs (default: true) */
  pasteDetection?: boolean;
  /** Monitor keystroke cadence on inputs (default: true) */
  keystrokeCadence?: boolean;
  /** Detect screen recording / screen sharing (default: true) */
  screenCapture?: boolean;
  /** Detect if page is running in an iframe (default: true) */
  iframeDetection?: boolean;
  /** Detect browser automation tools (default: true) */
  botDetection?: boolean;
}

// ── Transaction ──────────────────────────────────────────────────────────────

export type Channel = 'mobile_banking' | 'web' | 'ussd' | 'wallet' | 'pos' | 'api';
export type PaymentMethod = 'eft' | 'card' | 'wallet' | 'airtime' | 'qr' | 'crypto';

export interface Transaction {
  /** Unique transaction reference (your internal ID) */
  transactionId: string;
  /** Transaction amount */
  amount: number;
  /** ISO 4217 currency code (e.g. ZAR, USD, EUR) */
  currency: string;
  /** Hashed or tokenised recipient account identifier */
  recipientAccount?: string;
  /** Recipient display name */
  recipientName?: string;
  /** Payment channel */
  channel?: Channel;
  /** Payment method */
  paymentMethod?: PaymentMethod;
  /** Your internal customer/user ID */
  customerId?: string;
  /** Customer's MSISDN / phone number (hashed recommended) */
  customerPhone?: string;
  /** Custom metadata (key-value pairs) */
  metadata?: Record<string, string | number | boolean>;
}

// ── Risk Result ──────────────────────────────────────────────────────────────

export type Decision = 'ALLOW' | 'WARN' | 'BLOCK';

export interface Signal {
  /** Signal identifier */
  code: string;
  /** Human-readable description */
  description: string;
  /** Signal severity: 0-100 */
  severity: number;
  /** Signal category */
  category: 'call_state' | 'device' | 'behaviour' | 'identity' | 'velocity' | 'graph' | 'network';
}

export interface RiskResult {
  /** The fraud decision */
  decision: Decision;
  /** Risk score: 0 (safe) to 100 (definite fraud) */
  riskScore: number;
  /** Unique assessment ID for audit trail */
  assessmentId: string;
  /** Signals that were triggered */
  triggeredSignals: Signal[];
  /** Warning message for WARN decisions (display to user) */
  warningMessage?: string;
  /** Block reason for BLOCK decisions (internal) */
  blockReason?: string;
  /** Whether this was a shadow mode assessment (observe only) */
  isShadow: boolean;
  /** Latency of the risk assessment in ms */
  latencyMs: number;
  /** Timestamp of assessment */
  timestamp: string;
}

// ── Event Reporting ──────────────────────────────────────────────────────────

export type Outcome = 'completed' | 'declined' | 'reversed' | 'fraud_confirmed';
export type FraudType = 'social_engineering' | 'sim_swap' | 'account_takeover' | 'mule' | 'device_takeover' | 'other';

export interface OutcomeReport {
  /** Transaction ID this outcome relates to */
  transactionId: string;
  /** Transaction outcome */
  outcome: Outcome;
  /** If fraud_confirmed, the type of fraud */
  fraudType?: FraudType;
  /** Additional notes */
  notes?: string;
}

// ── Device Fingerprint ───────────────────────────────────────────────────────

export interface DeviceFingerprint {
  /** Unique device hash */
  deviceId: string;
  /** Browser/platform info */
  platform: string;
  /** Screen dimensions */
  screen: string;
  /** Timezone */
  timezone: string;
  /** Language */
  language: string;
  /** Number of CPU cores */
  cores: number;
  /** Available memory (GB, approximate) */
  memory: number;
  /** GPU renderer */
  gpu: string;
  /** Touch support */
  touchSupport: boolean;
  /** WebGL hash */
  webglHash: string;
  /** Canvas hash */
  canvasHash: string;
  /** Audio fingerprint hash */
  audioHash: string;
  /** Detected anomalies */
  anomalies: string[];
}
