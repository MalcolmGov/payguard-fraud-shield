/**
 * Domain types for the Device Binding Service.
 */

export type TrustStatus = 'trusted' | 'new_device' | 'suspicious_device';
export type ReputationClass = 'trusted' | 'unknown' | 'high_risk' | 'blacklisted';
export type StepUpMethod = 'otp_verification' | 'biometric' | 'email_verification' | 'support_confirmation';

// ── Raw signals sent from the SDK ─────────────────────────────────────────────
export interface DeviceSignals {
  device_model:       string;
  os_version:         string;
  screen_resolution:  string;
  app_install_id:     string;
  sim_country:        string;
  carrier:            string;
  ip_address:         string;
  timezone:           string;
  locale:             string;
  is_rooted:          boolean;
  is_emulator:        boolean;
  is_jailbroken:      boolean;
  app_hash:           string;  // hash of installed app binary
}

// ── DB row representations ────────────────────────────────────────────────────
export interface DeviceRecord {
  id:                 string;
  device_fingerprint: string;
  device_model:       string;
  os_version:         string;
  sim_country:        string;
  carrier:            string;
  timezone:           string;
  locale:             string;
  is_rooted:          boolean;
  is_emulator:        boolean;
  is_jailbroken:      boolean;
  ip_address:         string;
  classification:     ReputationClass;
  fraud_report_count: number;
  first_seen_at:      Date;
  last_seen_at:       Date;
}

export interface DeviceAccountRecord {
  id:               string;
  device_id:        string;
  user_id:          string;
  trust_status:     TrustStatus;
  step_up_completed: boolean;
  step_up_method:   string | null;
  first_seen_at:    Date;
  last_seen_at:     Date;
}

// ── API request / response shapes ─────────────────────────────────────────────
export interface RegisterRequest {
  user_id:            string;
  device_fingerprint: string;
  signals:            DeviceSignals;
}

export interface RegisterResponse {
  device_token:   string;
  device_status:  TrustStatus;
  device_id:      string;
  required_action?: StepUpMethod;
}

export interface ValidateRequest {
  user_id:            string;
  device_token:       string;
  device_fingerprint: string;
  ip_address:         string;
  sim_country?:       string;
}

export interface ValidateResponse {
  device_status:    TrustStatus;
  required_action?: StepUpMethod;
  risk_delta:       number;               // score to inject into Risk Engine
  triggered_rules:  string[];
  classification:   ReputationClass;
}

export interface ReputationResponse {
  device_fingerprint: string;
  classification:     ReputationClass;
  account_count:      number;
  fraud_report_count: number;
  is_blacklisted:     boolean;
  ip_history:         Array<{ ip_address: string; country_code: string; seen_at: string }>;
  last_seen_at:       string;
}
