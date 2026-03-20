/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard SDK
 * Real-time fraud detection for payments
 *
 * Usage:
 *   import payguard from '@payguard/sdk';
 *
 *   await payguard.initialize({
 *     apiKey: 'pk_sandbox_your_key',
 *     environment: 'sandbox',
 *   });
 *
 *   const result = await payguard.assessRisk({
 *     transactionId: 'TXN-001',
 *     amount: 15000,
 *     currency: 'ZAR',
 *   });
 *
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

// Default export — singleton instance
export { default } from './client';

// Named exports — class + types
export { PayGuardClient } from './client';

// Types
export type {
  PayGuardConfig,
  Environment,
  LogLevel,
  SignalOptions,
  Transaction,
  Channel,
  PaymentMethod,
  RiskResult,
  Decision,
  Signal,
  OutcomeReport,
  Outcome,
  FraudType,
  DeviceFingerprint,
} from './types';

// Signal utilities (for advanced usage)
export {
  collectDeviceFingerprint,
  attachBehaviouralMonitor,
  getBehaviouralSignals,
  resetBehaviouralSignals,
} from './signals';
