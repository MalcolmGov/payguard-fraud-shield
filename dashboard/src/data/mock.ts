// Mock data for dashboard demonstration
// In production this is fetched from the PayGuard API

export interface Transaction {
  id: string;
  userPhone: string;
  recipientWallet: string;
  amount: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedAction: 'ALLOW' | 'WARN_USER' | 'BLOCK';
  triggeredRules: string[];
  onCall: boolean;
  createdAt: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
}

export interface FraudRule {
  ruleId: string;
  name: string;
  description: string;
  scoreDelta: number;
  score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  category?: string;
}

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-001',
    userPhone: '+27821000001',
    recipientWallet: '+27821000010',
    amount: 2500,
    riskScore: 85,
    riskLevel: 'HIGH',
    recommendedAction: 'BLOCK',
    triggeredRules: ['RULE_001', 'RULE_002'],
    onCall: true,
    createdAt: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    id: 'tx-002',
    userPhone: '+27821000002',
    recipientWallet: '+27821000011',
    amount: 3000,
    riskScore: 90,
    riskLevel: 'HIGH',
    recommendedAction: 'BLOCK',
    triggeredRules: ['RULE_006', 'RULE_005'],
    onCall: false,
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: 'tx-003',
    userPhone: '+27821000003',
    recipientWallet: '+27821000010',
    amount: 500,
    riskScore: 70,
    riskLevel: 'HIGH',
    recommendedAction: 'WARN_USER',
    triggeredRules: ['RULE_007'],
    onCall: false,
    createdAt: new Date(Date.now() - 7_200_000).toISOString(),
  },
  {
    id: 'tx-004',
    userPhone: '+27821000004',
    recipientWallet: '+27821000011',
    amount: 700,
    riskScore: 45,
    riskLevel: 'MEDIUM',
    recommendedAction: 'WARN_USER',
    triggeredRules: ['RULE_008', 'RULE_004'],
    onCall: false,
    createdAt: new Date(Date.now() - 10_800_000).toISOString(),
  },
  {
    id: 'tx-005',
    userPhone: '+27821000005',
    recipientWallet: '+27821000002',
    amount: 300,
    riskScore: 5,
    riskLevel: 'LOW',
    recommendedAction: 'ALLOW',
    triggeredRules: [],
    onCall: false,
    createdAt: new Date(Date.now() - 14_400_000).toISOString(),
  },
  {
    id: 'tx-006',
    userPhone: '+27821000001',
    recipientWallet: '+27821000003',
    amount: 150,
    riskScore: 12,
    riskLevel: 'LOW',
    recommendedAction: 'ALLOW',
    triggeredRules: [],
    onCall: false,
    createdAt: new Date(Date.now() - 18_000_000).toISOString(),
  },
  {
    id: 'tx-007',
    userPhone: '+27821000002',
    recipientWallet: '+27821000010',
    amount: 4500,
    riskScore: 95,
    riskLevel: 'HIGH',
    recommendedAction: 'BLOCK',
    triggeredRules: ['RULE_001', 'RULE_006', 'RULE_007'],
    onCall: true,
    createdAt: new Date(Date.now() - 21_600_000).toISOString(),
  },
];

// All 29 SDK rules aligned with backend risk-engine implementations
export const mockRules: FraudRule[] = [
  // Social Engineering (social_engineering.py RULE_001-014)
  { ruleId: 'RULE_001', name: 'Vishing Call Guard',         description: 'On call + new recipient + high amount (catches ~70% of vishing)',       scoreDelta: 75, score: 75, severity: 'CRITICAL', enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_002', name: 'Contact List Check',         description: 'On call + recipient not in contacts',                                   scoreDelta: 40, score: 40, severity: 'HIGH',     enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_003', name: 'Session Speed Gate',         description: 'Transaction initiated < 10s of session start',                          scoreDelta: 30, score: 30, severity: 'MEDIUM',   enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_004', name: 'Clipboard Paste Detection',  description: 'Recipient number pasted from external source (fraud script indicator)',  scoreDelta: 20, score: 20, severity: 'LOW',      enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_005', name: 'Velocity Anomaly',           description: 'New recipient + amount > 2x user average',                              scoreDelta: 35, score: 35, severity: 'HIGH',     enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_006', name: 'SIM Swap Detector',          description: 'SIM swap detected - possible account takeover preparation',              scoreDelta: 50, score: 50, severity: 'CRITICAL', enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_007', name: 'Multi-Account Device',       description: 'Device fingerprint seen on > 3 accounts (fraud ring indicator)',         scoreDelta: 60, score: 60, severity: 'CRITICAL', enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_008', name: 'SMS Keyword Scanner',        description: 'Recent SMS with fraud keywords (PIN, OTP, verify, urgent)',              scoreDelta: 25, score: 25, severity: 'MEDIUM',   enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_009', name: 'Root/Jailbreak Check',       description: 'Rooted (Android) or jailbroken (iOS) device - fraud farm indicator',     scoreDelta: 20, score: 20, severity: 'MEDIUM',   enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_010', name: 'VPN/Proxy Shield',           description: 'VPN or proxy active - location obfuscation detected',                    scoreDelta: 15, score: 15, severity: 'LOW',      enabled: false, category: 'Social Engineering' },
  { ruleId: 'RULE_011', name: 'Emulator Detection',         description: 'Emulator/simulator detected - fraud farms use emulators to scale',       scoreDelta: 40, score: 40, severity: 'CRITICAL', enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_012', name: 'Frequent Recipient Changes', description: 'Recipient changed 3+ times in session - testing mule accounts',          scoreDelta: 25, score: 25, severity: 'MEDIUM',   enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_013', name: 'Tampered App Detection',     description: 'Modified banking app binary detected - bypasses security controls',      scoreDelta: 50, score: 50, severity: 'CRITICAL', enabled: true,  category: 'Social Engineering' },
  { ruleId: 'RULE_014', name: 'OTP Intercept Guard',        description: 'OTP screen open during call with unknown caller - interception attempt',  scoreDelta: 80, score: 80, severity: 'CRITICAL', enabled: true,  category: 'Social Engineering' },
  // Device Binding (device_binding.py RULE_015-020)
  { ruleId: 'RULE_015', name: 'New Device Alert',           description: 'First-time device for user - step-up OTP verification required',         scoreDelta: 55, score: 55, severity: 'CRITICAL', enabled: true,  category: 'Device Binding' },
  { ruleId: 'RULE_016', name: 'Blacklisted Device',         description: 'Device flagged as suspicious or blacklisted - support confirmation',     scoreDelta: 80, score: 80, severity: 'CRITICAL', enabled: true,  category: 'Device Binding' },
  { ruleId: 'RULE_017', name: 'Multi-Account Device Bind',  description: 'Device linked to > 3 accounts in binding service (mule ring)',           scoreDelta: 60, score: 60, severity: 'CRITICAL', enabled: true,  category: 'Device Binding' },
  { ruleId: 'RULE_018', name: 'Emulator (Binding Layer)',   description: 'Emulator detected at device binding layer - fraud farm indicator',        scoreDelta: 40, score: 40, severity: 'CRITICAL', enabled: true,  category: 'Device Binding' },
  { ruleId: 'RULE_019', name: 'Device Country Mismatch',    description: 'SIM country does not match IP geolocation country',                      scoreDelta: 35, score: 35, severity: 'HIGH',     enabled: true,  category: 'Device Binding' },
  { ruleId: 'RULE_020', name: 'Rapid Device Switching',     description: 'Device changed < 30min ago - possible account takeover in progress',     scoreDelta: 45, score: 45, severity: 'CRITICAL', enabled: true,  category: 'Device Binding' },
  // Enterprise Fraud (social_engineering.py RULE_021-026)
  { ruleId: 'RULE_021', name: 'Geolocation Anomaly',        description: 'Transaction > 500km from user usual location (haversine)',               scoreDelta: 35, score: 35, severity: 'HIGH',     enabled: true,  category: 'Enterprise Fraud' },
  { ruleId: 'RULE_022', name: 'Velocity / Structuring',     description: '5+ transactions in 10min or amounts near reporting thresholds',          scoreDelta: 45, score: 45, severity: 'CRITICAL', enabled: true,  category: 'Enterprise Fraud' },
  { ruleId: 'RULE_023', name: 'Beneficiary Network Risk',   description: 'Recipient flagged in fraud network - mule account detection',            scoreDelta: 55, score: 55, severity: 'CRITICAL', enabled: true,  category: 'Enterprise Fraud' },
  { ruleId: 'RULE_024', name: 'Time-of-Day Anomaly',        description: 'High-value transfer between 00:00-05:00 outside user usual hours',       scoreDelta: 20, score: 20, severity: 'LOW',      enabled: true,  category: 'Enterprise Fraud' },
  { ruleId: 'RULE_025', name: 'Cooling-Off Period',         description: 'First-time recipient + amount above regulatory threshold (FICA/CBN)',     scoreDelta: 30, score: 30, severity: 'MEDIUM',   enabled: true,  category: 'Enterprise Fraud' },
  { ruleId: 'RULE_026', name: 'Behavioural Biometrics',     description: 'Typing cadence, touch pressure, scroll velocity deviate from baseline',  scoreDelta: 25, score: 25, severity: 'MEDIUM',   enabled: true,  category: 'Enterprise Fraud' },
  // IP Intelligence (ip_geolocation.py RULE_027-029)
  { ruleId: 'RULE_027', name: 'IP Country Mismatch',        description: 'IP geolocated to different country than SIM - foreign proxy/stolen SIM', scoreDelta: 20, score: 20, severity: 'MEDIUM',   enabled: true,  category: 'IP Intelligence' },
  { ruleId: 'RULE_028', name: 'Hosting/Datacenter IP',      description: 'IP belongs to hosting provider or datacenter - not residential',         scoreDelta: 15, score: 15, severity: 'LOW',      enabled: true,  category: 'IP Intelligence' },
  { ruleId: 'RULE_029', name: 'IP vs Device GPS Distance',  description: 'IP location > 500km from device GPS - location spoofing suspected',      scoreDelta: 10, score: 10, severity: 'LOW',      enabled: true,  category: 'IP Intelligence' },
  // AI Fraud Detection (ai_fraud_rules.py RULE_030-035)
  { ruleId: 'RULE_030', name: 'Voice Deepfake Shield',      description: 'AI-generated/cloned voice detected during call - synthetic speech markers',scoreDelta: 70, score: 70, severity: 'CRITICAL', enabled: true,  category: 'AI Fraud Detection' },
  { ruleId: 'RULE_031', name: 'Liveness Spoofing Guard',     description: 'Deepfake/GAN face or virtual camera injection during video KYC',         scoreDelta: 85, score: 85, severity: 'CRITICAL', enabled: true,  category: 'AI Fraud Detection' },
  { ruleId: 'RULE_032', name: 'Synthetic Identity Detector', description: 'Fabricated identity from real+fake data - SIM/email/graph anomalies',     scoreDelta: 65, score: 65, severity: 'CRITICAL', enabled: true,  category: 'AI Fraud Detection' },
  { ruleId: 'RULE_033', name: 'AI Conversation Detector',    description: 'AI chatbot impersonating bank staff - uniform timing, no breathing',      scoreDelta: 65, score: 65, severity: 'CRITICAL', enabled: true,  category: 'AI Fraud Detection' },
  { ruleId: 'RULE_034', name: 'Remote Access Tool Blocker',  description: 'AnyDesk/TeamViewer/screen sharing active during payment session',         scoreDelta: 85, score: 85, severity: 'CRITICAL', enabled: true,  category: 'AI Fraud Detection' },
  { ruleId: 'RULE_035', name: 'Document Forgery Scanner',    description: 'AI-generated or digitally altered ID documents - GAN artifact detection', scoreDelta: 80, score: 80, severity: 'CRITICAL', enabled: true,  category: 'AI Fraud Detection' },
];

export const mockGraphData = {
  nodes: [
    { id: 'D1', label: 'Device\nFRAUD-001', type: 'device',  risk: 'high',   val: 3 },
    { id: 'A1', label: '+27821000001',       type: 'account', risk: 'high',   val: 2 },
    { id: 'A2', label: '+27821000002',       type: 'account', risk: 'high',   val: 2 },
    { id: 'A3', label: '+27821000003',       type: 'account', risk: 'medium', val: 2 },
    { id: 'W1', label: 'Wallet\n0010',       type: 'wallet',  risk: 'high',   val: 4 },
    { id: 'W2', label: 'Wallet\n0011',       type: 'wallet',  risk: 'high',   val: 3 },
    { id: 'IP', label: '196.25.1.82',        type: 'ip',      risk: 'medium', val: 1 },
    { id: 'A4', label: '+27821000004',       type: 'account', risk: 'low',    val: 1 },
    { id: 'A5', label: '+27821000005',       type: 'account', risk: 'low',    val: 1 },
    { id: 'D2', label: 'Device\nSAFE-002',   type: 'device',  risk: 'low',    val: 1 },
  ],
  links: [
    { source: 'A1', target: 'D1', label: 'USED_BY' },
    { source: 'A2', target: 'D1', label: 'USED_BY' },
    { source: 'A3', target: 'D1', label: 'USED_BY' },
    { source: 'A1', target: 'W1', label: 'SENT_TO' },
    { source: 'A2', target: 'W2', label: 'SENT_TO' },
    { source: 'A3', target: 'W1', label: 'SENT_TO' },
    { source: 'A1', target: 'IP', label: 'SHARES_IP' },
    { source: 'A2', target: 'IP', label: 'SHARES_IP' },
    { source: 'A4', target: 'D2', label: 'USED_BY' },
    { source: 'A5', target: 'D2', label: 'USED_BY' },
    { source: 'A4', target: 'W2', label: 'SENT_TO' },
  ],
};

export const riskDistributionData = [
  { name: 'Mon', low: 45, medium: 12, high: 5 },
  { name: 'Tue', low: 52, medium: 18, high: 8 },
  { name: 'Wed', low: 38, medium: 8,  high: 3 },
  { name: 'Thu', low: 61, medium: 22, high: 11 },
  { name: 'Fri', low: 70, medium: 30, high: 15 },
  { name: 'Sat', low: 25, medium: 10, high: 6 },
  { name: 'Sun', low: 18, medium: 5,  high: 2 },
];

export function riskLevelClass(level: string) {
  return level.toLowerCase() as 'low' | 'medium' | 'high';
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
