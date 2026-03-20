/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard SDK — Main Client
 * Real-time fraud detection for payments
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

import type {
  PayGuardConfig, Transaction, RiskResult, Decision, Signal,
  OutcomeReport, DeviceFingerprint, LogLevel,
} from './types';
import {
  collectDeviceFingerprint,
  getBehaviouralSignals,
  resetBehaviouralSignals,
  attachBehaviouralMonitor,
} from './signals';

// ── Constants ────────────────────────────────────────────────────────────────

const ENDPOINTS = {
  sandbox: 'https://api-gateway-production-8d15.up.railway.app',
  production: 'https://api-gateway-production-8d15.up.railway.app',
};

const SDK_VERSION = '1.0.0';

// ── Logger ───────────────────────────────────────────────────────────────────

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3, none: 4,
};

class Logger {
  private level: number;

  constructor(level: LogLevel = 'warn') {
    this.level = LOG_LEVELS[level];
  }

  debug(...args: any[]) { if (this.level <= 0) console.debug('[PayGuard]', ...args); }
  info(...args: any[])  { if (this.level <= 1) console.info('[PayGuard]', ...args); }
  warn(...args: any[])  { if (this.level <= 2) console.warn('[PayGuard]', ...args); }
  error(...args: any[]) { if (this.level <= 3) console.error('[PayGuard]', ...args); }
}

// ── PayGuard Client Class ────────────────────────────────────────────────────

class PayGuardClient {
  private config: Required<PayGuardConfig>;
  private logger: Logger;
  private initialized = false;
  private fingerprint: DeviceFingerprint | null = null;

  constructor() {
    this.config = {
      apiKey: '',
      environment: 'sandbox',
      shadowMode: false,
      apiUrl: '',
      signals: {
        deviceFingerprint: true,
        pasteDetection: true,
        keystrokeCadence: true,
        screenCapture: true,
        iframeDetection: true,
        botDetection: true,
      },
      logLevel: 'warn',
      timeout: 5000,
      failOpen: true,
    };
    this.logger = new Logger('warn');
  }

  // ── Initialise ───────────────────────────────────────────────────────────

  /**
   * Initialise the PayGuard SDK.
   * Call this once at app startup, before any risk assessments.
   */
  async initialize(config: PayGuardConfig): Promise<void> {
    if (!config.apiKey) throw new Error('PayGuard: apiKey is required');
    if (!config.apiKey.startsWith('pk_')) {
      throw new Error('PayGuard: apiKey must start with pk_sandbox_ or pk_live_');
    }

    this.config = {
      ...this.config,
      ...config,
      apiUrl: config.apiUrl || ENDPOINTS[config.environment],
      signals: { ...this.config.signals, ...config.signals },
    };

    this.logger = new Logger(this.config.logLevel);
    this.logger.info(`SDK v${SDK_VERSION} initializing...`);
    this.logger.info(`Environment: ${this.config.environment}`);
    this.logger.info(`Shadow mode: ${this.config.shadowMode ? 'ON (observe only)' : 'OFF'}`);

    // Collect device fingerprint on init (async, non-blocking)
    if (typeof window !== 'undefined' && this.config.signals.deviceFingerprint) {
      try {
        this.fingerprint = await collectDeviceFingerprint(this.config.signals);
        this.logger.debug('Device fingerprint collected:', this.fingerprint.deviceId);
        this.logger.debug('Anomalies detected:', this.fingerprint.anomalies);
      } catch (err) {
        this.logger.warn('Failed to collect device fingerprint:', err);
      }
    }

    this.initialized = true;
    this.logger.info('SDK initialized ✓');
  }

  // ── Assess Risk ──────────────────────────────────────────────────────────

  /**
   * Assess the risk of a transaction in real time.
   * Returns a decision (ALLOW, WARN, or BLOCK) with risk score and triggered signals.
   *
   * @param transaction - The transaction details
   * @returns RiskResult with decision, score, and signals
   *
   * @example
   * ```typescript
   * const result = await payguard.assessRisk({
   *   transactionId: 'TXN-001',
   *   amount: 15000,
   *   currency: 'ZAR',
   *   channel: 'mobile_banking',
   * });
   *
   * if (result.decision === 'BLOCK') {
   *   // Stop the payment
   * }
   * ```
   */
  async assessRisk(transaction: Transaction): Promise<RiskResult> {
    const startTime = performance.now();

    if (!this.initialized) {
      this.logger.error('SDK not initialized. Call PayGuard.initialize() first.');
      if (this.config.failOpen) return this.failOpenResult(transaction, startTime);
      throw new Error('PayGuard: SDK not initialized');
    }

    if (!transaction.transactionId || !transaction.amount || !transaction.currency) {
      this.logger.error('transactionId, amount, and currency are required');
      if (this.config.failOpen) return this.failOpenResult(transaction, startTime);
      throw new Error('PayGuard: transactionId, amount, and currency are required');
    }

    try {
      // Collect behavioural signals
      const behavioural = getBehaviouralSignals();

      // Build the risk assessment payload
      const payload = {
        transaction: {
          ...transaction,
          sdk_version: SDK_VERSION,
          shadow_mode: this.config.shadowMode,
        },
        device: this.fingerprint ? {
          device_id: this.fingerprint.deviceId,
          platform: this.fingerprint.platform,
          screen: this.fingerprint.screen,
          timezone: this.fingerprint.timezone,
          language: this.fingerprint.language,
          cores: this.fingerprint.cores,
          memory: this.fingerprint.memory,
          gpu: this.fingerprint.gpu,
          touch_support: this.fingerprint.touchSupport,
          anomalies: this.fingerprint.anomalies,
        } : null,
        signals: {
          paste_events: behavioural.pasteEvents,
          average_keystroke_ms: behavioural.averageKeystrokeMs,
          rapid_form_completion: behavioural.rapidFormCompletion,
          form_duration_ms: behavioural.formEndTime - behavioural.formStartTime,
        },
        timestamp: new Date().toISOString(),
      };

      this.logger.debug('Assessing risk for:', transaction.transactionId);

      // Make API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.apiUrl}/v1/assess`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'X-PayGuard-SDK': SDK_VERSION,
          'X-PayGuard-Shadow': this.config.shadowMode ? '1' : '0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        this.logger.error(`API error: ${response.status} ${response.statusText}`);
        if (this.config.failOpen) return this.failOpenResult(transaction, startTime);
        throw new Error(`PayGuard API error: ${response.status}`);
      }

      const data = await response.json();

      const result: RiskResult = {
        decision: data.decision || 'ALLOW',
        riskScore: data.risk_score ?? 0,
        assessmentId: data.assessment_id || `local-${Date.now()}`,
        triggeredSignals: (data.signals || []).map((s: any) => ({
          code: s.code,
          description: s.description,
          severity: s.severity,
          category: s.category,
        })),
        warningMessage: data.warning_message,
        blockReason: data.block_reason,
        isShadow: this.config.shadowMode || false,
        latencyMs,
        timestamp: new Date().toISOString(),
      };

      this.logger.info(
        `Risk assessment: ${result.decision} (score: ${result.riskScore}, ${latencyMs}ms)`,
        result.triggeredSignals.length > 0 ? `Signals: ${result.triggeredSignals.map(s => s.code).join(', ')}` : ''
      );

      // In shadow mode, always return ALLOW but log the real decision
      if (this.config.shadowMode && result.decision !== 'ALLOW') {
        this.logger.info(`🔍 Shadow mode: Would have returned ${result.decision} but allowing`);
        return { ...result, decision: 'ALLOW' as Decision, isShadow: true };
      }

      // Reset behavioural signals after assessment
      resetBehaviouralSignals();

      return result;

    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      this.logger.error('Risk assessment failed:', err.message || err);

      if (this.config.failOpen) {
        this.logger.warn('Fail-open: Returning ALLOW due to error');
        return this.failOpenResult(transaction, startTime);
      }

      throw err;
    }
  }

  // ── Report Outcome ───────────────────────────────────────────────────────

  /**
   * Report the outcome of a transaction to improve model accuracy.
   * Call this after a transaction completes, or when fraud is confirmed.
   *
   * @example
   * ```typescript
   * // Transaction completed normally
   * await payguard.reportOutcome({
   *   transactionId: 'TXN-001',
   *   outcome: 'completed',
   * });
   *
   * // Fraud was confirmed later
   * await payguard.reportOutcome({
   *   transactionId: 'TXN-001',
   *   outcome: 'fraud_confirmed',
   *   fraudType: 'social_engineering',
   * });
   * ```
   */
  async reportOutcome(report: OutcomeReport): Promise<void> {
    if (!this.initialized) {
      this.logger.warn('SDK not initialized, skipping outcome report');
      return;
    }

    try {
      await fetch(`${this.config.apiUrl}/v1/outcomes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'X-PayGuard-SDK': SDK_VERSION,
        },
        body: JSON.stringify({
          transaction_id: report.transactionId,
          outcome: report.outcome,
          fraud_type: report.fraudType,
          notes: report.notes,
          device_id: this.fingerprint?.deviceId,
          timestamp: new Date().toISOString(),
        }),
      });

      this.logger.info(`Outcome reported: ${report.transactionId} → ${report.outcome}`);
    } catch (err) {
      this.logger.warn('Failed to report outcome (non-blocking):', err);
      // Non-blocking — outcome reporting should never break the user flow
    }
  }

  // ── Monitor Input ────────────────────────────────────────────────────────

  /**
   * Attach behavioural monitoring to a payment input field.
   * Tracks paste events, keystroke cadence, and form completion speed.
   * Returns a cleanup function to remove the monitors.
   *
   * @example
   * ```typescript
   * const cleanup = payguard.monitorInput(amountInput);
   * // Later: cleanup() to remove listeners
   * ```
   */
  monitorInput(element: HTMLInputElement | HTMLTextAreaElement): () => void {
    if (!element) {
      this.logger.warn('monitorInput: element is null');
      return () => {};
    }
    this.logger.debug('Behavioural monitor attached to:', element.name || element.id || 'unknown');
    return attachBehaviouralMonitor(element);
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  /** Get the current device fingerprint */
  getDeviceFingerprint(): DeviceFingerprint | null {
    return this.fingerprint;
  }

  /** Get SDK version */
  getVersion(): string {
    return SDK_VERSION;
  }

  /** Check if SDK is initialized */
  isInitialized(): boolean {
    return this.initialized;
  }

  /** Check if running in shadow mode */
  isShadowMode(): boolean {
    return this.config.shadowMode || false;
  }

  // ── Private Helpers ──────────────────────────────────────────────────────

  private failOpenResult(transaction: Transaction, startTime: number): RiskResult {
    return {
      decision: 'ALLOW',
      riskScore: 0,
      assessmentId: `failopen-${Date.now()}`,
      triggeredSignals: [],
      isShadow: false,
      latencyMs: Math.round(performance.now() - startTime),
      timestamp: new Date().toISOString(),
    };
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────

/** PayGuard SDK singleton instance */
const payguard = new PayGuardClient();

export default payguard;
export { PayGuardClient };
