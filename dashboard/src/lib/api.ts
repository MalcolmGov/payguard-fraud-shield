/**
 * PayGuard Risk Engine API Client
 * ================================
 * Connects the dashboard to the live risk engine API.
 * Falls back to mock data when the API is unreachable (demo mode).
 *
 * API Base: https://risk-engine-production-e2b3.up.railway.app
 * Auth: Bearer token via VITE_PAYGUARD_API_KEY env var
 */

const API_BASE = import.meta.env.VITE_PAYGUARD_API_URL || 'https://risk-engine-production-e2b3.up.railway.app';
const API_KEY = import.meta.env.VITE_PAYGUARD_API_KEY || 'pk_sandbox_demo';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  timeout?: number;
}

class PayGuardAPI {
  private baseUrl: string;
  private apiKey: string;
  private isOnline: boolean = true;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, timeout = 10000 } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(response.status, error.message || error.error || response.statusText);
      }

      this.isOnline = true;
      return response.json();
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof ApiError) throw err;
      this.isOnline = false;
      throw new ApiError(0, `API unreachable: ${(err as Error).message}`);
    }
  }

  // ── Health ──────────────────────────────────────────────────────────────

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // ── Scoring ─────────────────────────────────────────────────────────────

  async scoreTransaction(payload: ScorePayload): Promise<ScoreResponse> {
    return this.request<ScoreResponse>('/score', { method: 'POST', body: payload as unknown as Record<string, unknown> });
  }

  async scoreUssd(payload: UssdPayload): Promise<UssdScoreResponse> {
    return this.request<UssdScoreResponse>('/score/ussd', { method: 'POST', body: payload as unknown as Record<string, unknown> });
  }

  // ── Decisions ───────────────────────────────────────────────────────────

  async getDecision(transactionId: string): Promise<ScoreResponse | null> {
    try {
      return await this.request<ScoreResponse>(`/decisions/${transactionId}`);
    } catch {
      return null;
    }
  }

  // ── Blacklist ───────────────────────────────────────────────────────────

  async checkBlacklist(wallet: string): Promise<BlacklistResult> {
    return this.request<BlacklistResult>(`/blacklist/check/${encodeURIComponent(wallet)}`);
  }

  // ── Status ──────────────────────────────────────────────────────────────

  get online(): boolean {
    return this.isOnline;
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.health();
      return true;
    } catch {
      return false;
    }
  }
}

// ── Error class ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  channels: string[];
  auth: string;
  rate_limit: string;
}

export interface ScorePayload {
  payload_id: string;
  user_id: string;
  session_id: string;
  timestamp: number;
  transaction: {
    recipient_phone: string;
    amount: number;
    currency: string;
  };
  device: {
    device_id: string;
    manufacturer: string;
    model: string;
    os_version: string;
    is_rooted?: boolean;
    is_jailbroken?: boolean;
    is_emulator?: boolean;
    is_simulator?: boolean;
    is_app_tampered?: boolean;
    is_screen_shared?: boolean;
    is_remote_controlled?: boolean;
  };
  network: {
    ip_address: string;
    is_vpn?: boolean;
    is_proxy?: boolean;
    latitude?: number;
    longitude?: number;
  };
  behavioral: {
    transaction_creation_ms?: number;
    paste_detected?: boolean;
    pasted_fields?: string[];
    recipient_changed_count?: number;
  };
  call: {
    is_on_active_call?: boolean;
    call_duration_seconds?: number;
    caller_id_visible?: boolean;
    caller_in_contacts?: boolean;
  };
  recipient_in_contacts?: boolean;
  sim?: {
    sim_swap_detected?: boolean;
    sim_age_days?: number;
    country_iso?: string;
  };
  sms?: {
    has_fraud_keywords?: boolean;
    fraud_keywords_found?: string[];
  };
}

export interface ScoreResponse {
  transaction_id: string;
  user_id: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommended_action: 'APPROVE' | 'SOFT_WARNING' | 'WARN_USER' | 'BLOCK';
  triggered_rules: string[];
  score_breakdown: Record<string, number>;
  warning_message: string | null;
}

export interface UssdPayload {
  payload_id: string;
  user_id: string;
  session_id: string;
  timestamp: number;
  transaction: {
    recipient_phone: string;
    amount: number;
    currency: string;
  };
}

export interface UssdScoreResponse extends ScoreResponse {
  ussd_prompt: string;
}

export interface BlacklistResult {
  wallet: string;
  is_blacklisted: boolean;
}

// ── Singleton instance ──────────────────────────────────────────────────────

export const api = new PayGuardAPI(API_BASE, API_KEY);
export default api;
