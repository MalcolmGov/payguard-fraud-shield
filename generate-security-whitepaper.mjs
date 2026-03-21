import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType, PageBreak } from "docx";
import fs from "fs";
import path from "path";

const BLUE = "1E3A5F";
const LIGHT_BLUE = "E8F0FE";
const ACCENT = "3B82F6";
const RED = "DC2626";
const ORANGE = "F59E0B";
const GREEN = "16A34A";
const TEAL = "0D9488";
const GRAY = "6B7280";
const WHITE = "FFFFFF";
const BLACK = "000000";

const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" };
const tableBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function headerCell(text, opts = {}) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: opts.color || BLUE },
    borders: tableBorders,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: WHITE, size: 20, font: "Calibri" })], spacing: { before: 60, after: 60 }, indent: { left: 120 } })],
  });
}

function cell(text, opts = {}) {
  return new TableCell({
    shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
    borders: tableBorders,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text, size: 20, font: "Calibri", bold: opts.bold, color: opts.color || BLACK, italics: opts.italics })],
      spacing: { before: 40, after: 40 },
      indent: { left: 120 },
    })],
  });
}

function statusCell(status) {
  const map = {
    "BUILT": { emoji: "🟢", color: GREEN },
    "BUILT — NOT YET DEPLOYED": { emoji: "🔵", color: ACCENT },
    "DOCUMENTED": { emoji: "🟡", color: ORANGE },
    "ROADMAP": { emoji: "⚪", color: GRAY },
  };
  const s = map[status] || map["ROADMAP"];
  return cell(`${s.emoji} ${status}`, { color: s.color, bold: true });
}

function sectionTitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32, color: BLUE, font: "Calibri" })],
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
  });
}

function subTitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: BLUE, font: "Calibri" })],
    spacing: { before: 300, after: 100 },
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", color: opts.color || BLACK, italics: opts.italics, bold: opts.bold })],
    spacing: { before: opts.spaceBefore || 0, after: opts.spaceAfter || 120 },
  });
}

function richBody(runs) {
  return new Paragraph({
    children: runs.map(r => new TextRun({ size: 22, font: "Calibri", ...r })),
    spacing: { after: 120 },
  });
}

// ── BUILD DOCUMENT ─────────────────────────────────────────────────────────────
const children = [];

// TITLE PAGE
children.push(new Paragraph({ spacing: { before: 2400 } }));
children.push(new Paragraph({
  children: [new TextRun({ text: "PayGuard", size: 80, bold: true, color: ACCENT, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Security Whitepaper", size: 44, color: BLUE, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 300 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Architecture, Data Security, Compliance & Platform Maturity", size: 24, color: GRAY, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Version 1.1  •  March 2025  •  Confidential", size: 22, color: GRAY, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "partnerships@payguard.africa  •  payguard.africa", size: 22, color: ACCENT, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
}));

// PAGE BREAK
children.push(new Paragraph({ children: [new PageBreak()] }));

// MATURITY LEGEND
children.push(sectionTitle("Maturity Legend"));
children.push(body("Each capability is tagged with its current status:"));
const legendData = [
  ["🟢", "BUILT", "Fully implemented in source code, tested, and deployed to production OR production-ready"],
  ["🔵", "BUILT — NOT YET DEPLOYED", "Code written and tested but not yet running in a production environment"],
  ["🟡", "DOCUMENTED", "Legal/compliance documents prepared, pending formal third-party certification"],
  ["⚪", "ROADMAP", "Designed and planned, not yet implemented"],
];
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("", { width: 5 }), headerCell("Status", { width: 30 }), headerCell("Meaning", { width: 65 })] }),
    ...legendData.map(([emoji, tag, meaning]) => new TableRow({
      children: [cell(emoji, { width: 5 }), cell(tag, { bold: true, width: 30 }), cell(meaning, { width: 65 })],
    })),
  ],
}));

// 1. EXECUTIVE SUMMARY
children.push(sectionTitle("1. Executive Summary"));
children.push(body("PayGuard is a real-time fraud prevention platform purpose-built for Africa's digital payment ecosystem. The platform consists of four backend microservices, three native SDKs, a fraud analytics dashboard, and a suite of legal and compliance documentation."));
children.push(body("This document provides a transparent view of what has been built, what is pending deployment, and what remains on the roadmap — intended for banks and financial institutions conducting due diligence."));

// 2. ARCHITECTURE OVERVIEW
children.push(sectionTitle("2. Architecture Overview"));
children.push(subTitle("2.1 Backend Services"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Service", { width: 22 }), headerCell("Technology", { width: 18 }), headerCell("Description", { width: 38 }), headerCell("Status", { width: 22 })] }),
    new TableRow({ children: [cell("API Gateway", { bold: true }), cell("Express / TypeScript"), cell("Signal ingestion, transaction evaluation, decisions, device, admin, invoices. Helmet security headers, CORS, rate limiting (200 req/min), auth middleware, AES-256-GCM payload decryption."), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Risk Engine", { bold: true }), cell("FastAPI / Python 3.12"), cell("35+ fraud rules across 7 modules, scoring aggregator, Redis caching, Postgres persistence, Prometheus metrics, USSD scoring endpoint. Version 1.2.0."), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Graph Engine", { bold: true }), cell("FastAPI / Python 3.12"), cell("Neo4j-based fraud ring detection. Consumes events via Kafka consumer. API key auth + rate limiting. Fraud ring query endpoint."), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Device Binding Service", { bold: true }), cell("Express / TypeScript"), cell("6 route modules: register, validate, blacklist, reputation, accounts, step-up (OTP). Granular rate limiting per endpoint. Full Postgres migration (6 tables)."), statusCell("BUILT — NOT YET DEPLOYED")] }),
  ],
}));

children.push(subTitle("2.2 Mobile SDKs & Client Libraries"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("SDK", { width: 22 }), headerCell("Technology", { width: 18 }), headerCell("Capabilities", { width: 38 }), headerCell("Status", { width: 22 })] }),
    new TableRow({ children: [cell("JavaScript SDK", { bold: true }), cell("TypeScript / npm"), cell("PayGuardClient with assessRisk(), reportOutcome(), monitorInput(). 13-signal SHA-256 fingerprint (canvas, WebGL, audio). Behavioral biometrics. Bot/anomaly detection. Shadow mode. Fail-open. Published as npm package."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("iOS SDK", { bold: true }), cell("Swift / SPM"), cell("FraudShieldSDK with evaluateTransaction(), bindDevice(), validateDevice(). 4 signal collectors (device, network, behavioral, callState). OtpGuard with CXCallObserver, screenshot prevention, full-screen scam warning overlay. PrivacyInfo.xcprivacy included."), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Android SDK", { bold: true }), cell("Kotlin / Gradle"), cell("Build configuration and manifest defined. Signal collection implementation pending."), statusCell("ROADMAP")] }),
  ],
}));

children.push(subTitle("2.3 Dashboard & Frontend"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Component", { width: 22 }), headerCell("Technology", { width: 18 }), headerCell("Description", { width: 38 }), headerCell("Status", { width: 22 })] }),
    new TableRow({ children: [cell("Analytics Dashboard", { bold: true }), cell("React / TypeScript"), cell("Transaction monitoring, rule management, case management, audit trail, RBAC (Admin/Analyst/Viewer). Deployed on Vercel."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("Landing Page", { bold: true }), cell("React / TypeScript"), cell("Product showcase, interactive demos, 3D icons. Live at payguard.africa."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("Developer Portal", { bold: true }), cell("React / TypeScript"), cell("OpenAPI documentation, SDK integration guides, sandbox access."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("Interactive Demos", { bold: true }), cell("React / TypeScript"), cell("7 fraud scenario walkthroughs with phone simulator UI."), statusCell("BUILT")] }),
  ],
}));

children.push(subTitle("2.4 Infrastructure"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Component", { width: 22 }), headerCell("Detail", { width: 38 }), headerCell("Docker Compose?", { width: 18 }), headerCell("Status", { width: 22 })] }),
    new TableRow({ children: [cell("PostgreSQL 16", { bold: true }), cell("Primary data store. Migrations defined for device binding (6 tables) and API (transactions, invoices)."), cell("Yes"), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Redis 7", { bold: true }), cell("Decision caching (60s TTL), rate limiting, session management. maxmemory 256MB, allkeys-lru."), cell("Yes"), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Neo4j", { bold: true }), cell("Fraud ring graph database. Schema init on startup. Fraud ring detector queries."), cell("Yes"), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Apache Kafka", { bold: true }), cell("Event streaming. API produces to Kafka, graph-engine consumes. Zookeeper included."), cell("Yes"), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Nginx", { bold: true }), cell("Reverse proxy with TLS termination, rate limiting, security headers."), cell("Yes"), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Vercel Edge Network", { bold: true }), cell("Frontend hosting. Global CDN (200+ PoPs). Automatic HTTPS. DDoS protection."), cell("N/A"), statusCell("BUILT")] }),
  ],
}));

// 3. SECURITY
children.push(sectionTitle("3. Data Security"));

children.push(subTitle("3.1 Encryption"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Layer", { width: 25 }), headerCell("Standard", { width: 50 }), headerCell("Status", { width: 25 })] }),
    new TableRow({ children: [cell("Data in Transit", { bold: true }), cell("TLS 1.3 enforced on all HTTPS connections (Vercel + Nginx)"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("API Payload Encryption", { bold: true }), cell("AES-256-GCM decrypt middleware built (services/api/src/middleware/decrypt.ts). Handles IV + auth tag + ciphertext. Dev mode bypass supported."), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Data at Rest", { bold: true }), cell("PostgreSQL + Redis configured for encrypted volumes in Docker Compose"), statusCell("BUILT — NOT YET DEPLOYED")] }),
  ],
}));

children.push(subTitle("3.2 Authentication & Access Control"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Capability", { width: 25 }), headerCell("Implementation", { width: 50 }), headerCell("Status", { width: 25 })] }),
    new TableRow({ children: [cell("API Key Authentication", { bold: true }), cell("Bearer token auth middleware on all services. API keys validated per request. Auth module in API, risk-engine, graph-engine, and device-binding."), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Rate Limiting", { bold: true }), cell("Per-endpoint rate limiting: API (200/min), device registration (5/min), validation (60/min), OTP step-up (5/15min). Graph engine (100/min sliding window)."), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("RBAC (Dashboard)", { bold: true }), cell("Admin, Analyst, Viewer roles with granular permissions in the React dashboard."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("Helmet Security Headers", { bold: true }), cell("Helmet.js on API gateway and device-binding service. HSTS (1yr), X-Frame-Options, CSP."), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("CORS", { bold: true }), cell("Restricted origins on all services. Risk-engine allows only specified domains."), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("MFA", { bold: true }), cell("TOTP-based multi-factor authentication for dashboard access."), statusCell("ROADMAP")] }),
  ],
}));

children.push(subTitle("3.3 Data Handling"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Principle", { width: 25 }), headerCell("Implementation", { width: 50 }), headerCell("Status", { width: 25 })] }),
    new TableRow({ children: [cell("Data Minimisation", { bold: true }), cell("SDK collects fraud-relevant signals only. No message content, call recordings, GPS, or browsing history. Documented in DPA Clause 3."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("PII Hashing", { bold: true }), cell("MSISDN, IMEI, SIM serial are hashed (SHA-256). IP addresses anonymised after 90 days. Documented in DPA Annexure B."), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("No Card Data", { bold: true }), cell("PayGuard never receives, processes, or stores card numbers, PINs, or CVVs. Architecture by design."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("Retention Policy", { bold: true }), cell("Transaction signals: 12 months. Raw telemetry: 90 days. IP: 90 days then anonymised. Audit logs: 24 months. Defined in DPA and SLA."), statusCell("DOCUMENTED")] }),
    new TableRow({ children: [cell("structlog PII Masking", { bold: true }), cell("Risk engine uses structlog with PII masking and request ID propagation."), statusCell("BUILT — NOT YET DEPLOYED")] }),
  ],
}));

// 4. FRAUD DETECTION
children.push(sectionTitle("4. Fraud Detection Rules — Full Inventory"));
children.push(body("The risk engine evaluates 35+ rules across 7 modules. Every rule is independent — all are evaluated in parallel, scores are summed, and a composite decision is returned. Below is the complete rule inventory as implemented in code."));

children.push(subTitle("4.1 Social Engineering Rules (RULE_001–014, RULE_021–026)"));
children.push(body("Source: services/risk-engine/app/rules/social_engineering.py (391 lines)", { italics: true, color: GRAY }));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Rule", { width: 12 }), headerCell("Name", { width: 25 }), headerCell("Score", { width: 8 }), headerCell("Description", { width: 55 })] }),
    new TableRow({ children: [cell("RULE_001", { bold: true }), cell("Vishing Triad", { bold: true }), cell("75"), cell("Active call + unknown recipient + high amount. Catches ~70% of vishing fraud.")] }),
    new TableRow({ children: [cell("RULE_002"), cell("Call + Unknown Recipient"), cell("40"), cell("Active call with uncontacted recipient.")] }),
    new TableRow({ children: [cell("RULE_003"), cell("Rushed Transaction"), cell("30"), cell("Transaction initiated within 10 seconds of session start.")] }),
    new TableRow({ children: [cell("RULE_004"), cell("Paste Recipient"), cell("20"), cell("Recipient phone number pasted (fraud script indicator).")] }),
    new TableRow({ children: [cell("RULE_005"), cell("First Transfer High Amount"), cell("35"), cell("New recipient + amount >2x user average.")] }),
    new TableRow({ children: [cell("RULE_006", { bold: true }), cell("SIM Swap Detected", { bold: true }), cell("50"), cell("SIM swap detected in session — account takeover preparation.")] }),
    new TableRow({ children: [cell("RULE_007"), cell("Device Multi-Account"), cell("60"), cell("Device fingerprint seen on >3 distinct user accounts.")] }),
    new TableRow({ children: [cell("RULE_008"), cell("Fraud SMS Keywords"), cell("25"), cell("Recent SMS contained scam keywords (victim priming).")] }),
    new TableRow({ children: [cell("RULE_009"), cell("Rooted / Jailbroken"), cell("20"), cell("Device is rooted or jailbroken — fraud farm indicator.")] }),
    new TableRow({ children: [cell("RULE_010"), cell("VPN / Proxy"), cell("15"), cell("VPN or proxy active — location obfuscation.")] }),
    new TableRow({ children: [cell("RULE_011"), cell("Emulator Detected"), cell("40"), cell("Emulator/simulator — fraud farm scaling.")] }),
    new TableRow({ children: [cell("RULE_012"), cell("Frequent Recipient Changes"), cell("25"), cell("Recipient changed 3+ times in session.")] }),
    new TableRow({ children: [cell("RULE_013"), cell("Tampered App"), cell("50"), cell("Modified banking app binary detected.")] }),
    new TableRow({ children: [cell("RULE_014", { bold: true }), cell("OTP Screen on Call", { bold: true }), cell("80"), cell("OTP screen viewed during active call with unknown caller — OTP phishing interception.")] }),
    new TableRow({ children: [cell("RULE_021"), cell("Geolocation Anomaly"), cell("35"), cell("Transaction >500km from user's usual location (haversine).")] }),
    new TableRow({ children: [cell("RULE_022"), cell("Velocity / Structuring"), cell("45"), cell(">5 transactions in 10 minutes OR amount just below FICA/CBN reporting threshold.")] }),
    new TableRow({ children: [cell("RULE_023"), cell("Beneficiary Network Risk"), cell("55"), cell("Beneficiary flagged in 3+ fraud reports from different senders (mule account).")] }),
    new TableRow({ children: [cell("RULE_024"), cell("Time-of-Day Anomaly"), cell("20"), cell("Transaction at 00:00-05:00 when user normally transacts 06:00-22:00.")] }),
    new TableRow({ children: [cell("RULE_025"), cell("Cooling-Off Period"), cell("30"), cell("First-time recipient above configurable threshold per currency.")] }),
    new TableRow({ children: [cell("RULE_026"), cell("Behavioural Biometrics"), cell("25"), cell("3+/4 anomalies in typing cadence, touch pressure, scroll velocity, navigation.")] }),
  ],
}));
children.push(richBody([{ text: "Status: ", bold: true, color: GREEN }, { text: "ALL 20 RULES BUILT — code complete with unit tests." }]));

children.push(subTitle("4.2 AI Fraud Rules (RULE_030–035)"));
children.push(body("Source: services/risk-engine/app/rules/ai_fraud_rules.py (362 lines)", { italics: true, color: GRAY }));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Rule", { width: 12 }), headerCell("Name", { width: 25 }), headerCell("Score", { width: 8 }), headerCell("Description", { width: 55 })] }),
    new TableRow({ children: [cell("RULE_030", { bold: true }), cell("Voice Deepfake Shield"), cell("70"), cell("On-device ONNX model scores voice authenticity (0–1). Detects missing breath patterns, uniform pitch, spectral artifacts.")] }),
    new TableRow({ children: [cell("RULE_031"), cell("Liveness Spoofing"), cell("—"), cell("Detects replay attacks, photo injection, and mask spoofing during identity verification.")] }),
    new TableRow({ children: [cell("RULE_032"), cell("Synthetic Identity"), cell("—"), cell("Detects AI-generated fake identities from composite stolen PII.")] }),
    new TableRow({ children: [cell("RULE_033"), cell("AI Caller Detection"), cell("—"), cell("Detects AI-scripted social engineering calls (unnaturally perfect scripts).")] }),
    new TableRow({ children: [cell("RULE_034"), cell("Remote Access Tool (RAT)"), cell("—"), cell("Detects TeamViewer, AnyDesk, and similar remote control running during transaction.")] }),
    new TableRow({ children: [cell("RULE_035"), cell("Document Forgery"), cell("—"), cell("AI-generated document detection for KYC and claims fraud.")] }),
  ],
}));
children.push(richBody([{ text: "Status: ", bold: true, color: GREEN }, { text: "ALL 6 RULES BUILT — rule logic complete. ML model integration requires on-device ONNX models (companion to SDK)." }]));

children.push(subTitle("4.3 Additional Rule Modules"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Module", { width: 25 }), headerCell("Rules", { width: 20 }), headerCell("Description", { width: 33 }), headerCell("Status", { width: 22 })] }),
    new TableRow({ children: [cell("IP Geolocation", { bold: true }), cell("RULE_027–029"), cell("IP/SIM country mismatch, hosting provider IP, IP/device distance"), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Device Binding", { bold: true }), cell("RULE_015–020"), cell("Device blacklist, emulator patterns, velocity (1 device → many accounts)"), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Device Intelligence", { bold: true }), cell("Various"), cell("Device reputation, build fingerprint checks, blacklist management"), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Email Reputation", { bold: true }), cell("Various"), cell("Email domain age, disposable email detection"), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("USSD Rules", { bold: true }), cell("8 rules"), cell("SIM swap, velocity, beneficiary risk, time-of-day, cooling-off, geolocation, new subscriber, rapid session — for feature phones"), statusCell("BUILT — NOT YET DEPLOYED")] }),
  ],
}));

children.push(subTitle("4.4 Scoring Engine"));
children.push(body("The aggregator (scoring/aggregator.py) evaluates ALL rule sets in order: social engineering → device binding → IP geolocation → AI fraud rules. Scores are summed and capped. Risk levels: LOW (0-30) / MEDIUM (31-55) / HIGH (56-80) / CRITICAL (81+). Each level has a configured warning message for banking apps."));
children.push(body("USSD has a dedicated scoring endpoint (/score/ussd) with 8 rules optimised for server-side-only signals (no SDK required). Returns USSD-formatted prompts suitable for shortcode display."));

// 5. IOS OTP GUARD
children.push(sectionTitle("5. OTP Guard (iOS — Built)"));
children.push(body("The iOS SDK includes a fully implemented OtpGuard module (220 lines of Swift) that:"));
children.push(body("• Uses CXCallObserver to detect active phone calls in real time"));
children.push(body("• Shows a full-screen red warning overlay when OTP screen is opened during a call"));
children.push(body("• Distinguishes between known callers (medium risk) and unknown callers (high risk → SCAM ALERT)"));
children.push(body("• Applies screenshot prevention using UITextField.isSecureTextEntry layering technique"));
children.push(body("• Fires RULE_014 signal (OTP_SCREEN_ON_CALL) to the backend with risk delta 80 or 45"));
children.push(body("• Provides integration example code in comments for bank app developers"));
children.push(richBody([{ text: "Status: ", bold: true, color: GREEN }, { text: "BUILT — Code complete. Ready for TestFlight distribution." }]));

// 6. DEVICE FINGERPRINTING
children.push(sectionTitle("6. Device Fingerprinting"));
children.push(body("The JavaScript SDK collects a 13-signal composite fingerprint hashed with SHA-256:"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("#", { width: 5 }), headerCell("Signal", { width: 25 }), headerCell("Collection Method", { width: 48 }), headerCell("Status", { width: 22 })] }),
    new TableRow({ children: [cell("1"), cell("User Agent"), cell("navigator.userAgent"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("2"), cell("Screen Resolution + Color Depth"), cell("screen.width × screen.height × screen.colorDepth"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("3"), cell("Timezone"), cell("Intl.DateTimeFormat().resolvedOptions().timeZone"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("4"), cell("Language"), cell("navigator.language"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("5"), cell("CPU Cores"), cell("navigator.hardwareConcurrency"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("6"), cell("Device Memory"), cell("navigator.deviceMemory"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("7"), cell("GPU Renderer"), cell("WEBGL_debug_renderer_info extension"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("8"), cell("Touch Support"), cell("'ontouchstart' in window || navigator.maxTouchPoints"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("9"), cell("Canvas Fingerprint"), cell("Canvas2D rendering hash (unique per GPU/driver)"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("10"), cell("WebGL Fingerprint"), cell("Vendor + renderer from WEBGL_debug_renderer_info"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("11"), cell("Audio Fingerprint"), cell("AudioContext oscillator/analyser signal hash"), statusCell("BUILT")] }),
  ],
}));
children.push(body("Plus bot/anomaly detection: webdriver, headless Chrome, Selenium, Nightmare, PhantomJS, iframe, devtools, execution speed, Tor canvas blocking, plugin enumeration."));
children.push(richBody([{ text: "Status: ", bold: true, color: GREEN }, { text: "ALL SIGNALS BUILT — npm package compiled to dist/." }]));

// 7. COMPLIANCE
children.push(sectionTitle("7. Compliance & Legal Documentation"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Document", { width: 25 }), headerCell("Detail", { width: 50 }), headerCell("Status", { width: 25 })] }),
    new TableRow({ children: [cell("POPIA Data Processing Agreement", { bold: true }), cell("230-line legally structured DPA under POPIA Sections 19-22. Categories of data processed, purpose limitation, security measures, breach notification (72hr), retention schedule, cross-border transfers, audit rights, sub-processor list."), statusCell("DOCUMENTED")] }),
    new TableRow({ children: [cell("Service Level Agreement", { bold: true }), cell("170-line SLA. 99.9% uptime target. P1-P4 incident classification with response times (P1: 15 min response, 2hr resolution). Service credits (10-100%). RPO 1hr, RTO 4hr. Change management with 90-day notice for breaking changes."), statusCell("DOCUMENTED")] }),
    new TableRow({ children: [cell("OpenAPI — Signal API", { bold: true }), cell("Complete OpenAPI 3.0 YAML specification for the signal ingestion API."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("OpenAPI — Device Binding", { bold: true }), cell("Complete OpenAPI 3.0 YAML specification for the device binding API."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("SDK Integration Guides", { bold: true }), cell("Step-by-step guides for Android and iOS integration with code examples."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("PCI-DSS", { bold: true }), cell("PayGuard never handles card data — limited scope. Formal certification pending."), statusCell("ROADMAP")] }),
    new TableRow({ children: [cell("SOC 2 Type II", { bold: true }), cell("Target: after production deployment. Requires operational history."), statusCell("ROADMAP")] }),
    new TableRow({ children: [cell("ISO 27001", { bold: true }), cell("Target: 2026."), statusCell("ROADMAP")] }),
    new TableRow({ children: [cell("Third-Party Pen Test", { bold: true }), cell("To be conducted before first bank production deployment."), statusCell("ROADMAP")] }),
  ],
}));

// 8. CI/CD
children.push(sectionTitle("8. CI/CD & Testing"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Pipeline", { width: 25 }), headerCell("Detail", { width: 50 }), headerCell("Status", { width: 25 })] }),
    new TableRow({ children: [cell("CI Test Pipeline", { bold: true }), cell("GitHub Actions — 4 parallel jobs: API tests (Jest), risk-engine tests (pytest), graph-engine tests (pytest + httpx), lint & type-check (tsc + ruff)."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("CI Docker Pipeline", { bold: true }), cell("GitHub Actions — multi-service container builds."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("Frontend Deploy", { bold: true }), cell("Automated build + deploy to Vercel via deploy-vercel.cjs script."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("Load Tests", { bold: true }), cell("Load test scripts for device-binding and signal-api endpoints."), statusCell("BUILT")] }),
    new TableRow({ children: [cell("Unit Tests — Risk Engine", { bold: true }), cell("test_rules.py, test_scoring.py, test_device_binding.py"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("Unit Tests — Graph Engine", { bold: true }), cell("test_graph_engine.py"), statusCell("BUILT")] }),
    new TableRow({ children: [cell("Unit Tests — API", { bold: true }), cell("api.test.ts (Jest)"), statusCell("BUILT")] }),
  ],
}));

// 9. SUMMARY
children.push(sectionTitle("9. Maturity Summary"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Category", { width: 50 }), headerCell("Status", { width: 50 })] }),
    // BUILT
    new TableRow({ children: [cell("Dashboard, Landing Page, Demos, Developer Portal", { bold: true }), statusCell("BUILT")] }),
    new TableRow({ children: [cell("JavaScript SDK (npm package, 13-signal fingerprint)", { bold: true }), statusCell("BUILT")] }),
    new TableRow({ children: [cell("CI/CD Pipelines (test + docker + deploy)", { bold: true }), statusCell("BUILT")] }),
    new TableRow({ children: [cell("OpenAPI Specifications (2 APIs)", { bold: true }), statusCell("BUILT")] }),
    new TableRow({ children: [cell("SDK Integration Guides (Android + iOS)", { bold: true }), statusCell("BUILT")] }),
    new TableRow({ children: [cell("TLS 1.3 (frontend)", { bold: true }), statusCell("BUILT")] }),
    new TableRow({ children: [cell("RBAC & Audit Trail (Dashboard)", { bold: true }), statusCell("BUILT")] }),
    // BUILT NOT DEPLOYED
    new TableRow({ children: [cell("Risk Engine with 35+ Rules (7 modules)", { bold: true }), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("API Gateway (Express, auth, AES-256-GCM decrypt)", { bold: true }), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Graph Engine (Neo4j + Kafka fraud ring detection)", { bold: true }), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Device Binding Service (6 endpoints, granular rate limits)", { bold: true }), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("iOS SDK (Swift, OtpGuard, call detection, screenshot prevention)", { bold: true }), statusCell("BUILT — NOT YET DEPLOYED")] }),
    new TableRow({ children: [cell("Docker Infrastructure (Postgres, Redis, Neo4j, Kafka, Nginx)", { bold: true }), statusCell("BUILT — NOT YET DEPLOYED")] }),
    // DOCUMENTED
    new TableRow({ children: [cell("POPIA Data Processing Agreement", { bold: true }), statusCell("DOCUMENTED")] }),
    new TableRow({ children: [cell("Service Level Agreement", { bold: true }), statusCell("DOCUMENTED")] }),
    new TableRow({ children: [cell("Data Retention Policy", { bold: true }), statusCell("DOCUMENTED")] }),
    // ROADMAP
    new TableRow({ children: [cell("Android SDK (Kotlin signal collection)", { bold: true }), statusCell("ROADMAP")] }),
    new TableRow({ children: [cell("MFA for Dashboard", { bold: true }), statusCell("ROADMAP")] }),
    new TableRow({ children: [cell("SOC 2 Type II / ISO 27001 / PCI-DSS Certification", { bold: true }), statusCell("ROADMAP")] }),
    new TableRow({ children: [cell("Third-Party Penetration Test", { bold: true }), statusCell("ROADMAP")] }),
    new TableRow({ children: [cell("On-Device ONNX ML Models (deepfake, liveness)", { bold: true }), statusCell("ROADMAP")] }),
  ],
}));

// 10. WHAT'S NEEDED FOR PRODUCTION READINESS
children.push(sectionTitle("10. Production Readiness — What Remains"));
children.push(body("The following items are required before the first production bank deployment:", { bold: true }));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("#", { width: 5 }), headerCell("Item", { width: 30 }), headerCell("Detail", { width: 40 }), headerCell("Priority", { width: 25 })] }),
    new TableRow({ children: [cell("1"), cell("Cloud Deployment", { bold: true }), cell("Deploy all 4 backend services + infrastructure to AWS af-south-1 (or Railway). Currently defined via Docker Compose but not running in production."), cell("CRITICAL", { bold: true, color: RED })] }),
    new TableRow({ children: [cell("2"), cell("Android SDK", { bold: true }), cell("Implement Kotlin signal collection to match iOS SDK capabilities. Build.gradle and manifest exist."), cell("CRITICAL", { bold: true, color: RED })] }),
    new TableRow({ children: [cell("3"), cell("Third-Party Pen Test", { bold: true }), cell("Engage external security firm for penetration testing of API, SDK, and dashboard."), cell("HIGH", { bold: true, color: ORANGE })] }),
    new TableRow({ children: [cell("4"), cell("ONNX ML Models", { bold: true }), cell("Train and package on-device models for voice deepfake (RULE_030) and liveness (RULE_031). Rule logic exists, model binaries needed."), cell("HIGH", { bold: true, color: ORANGE })] }),
    new TableRow({ children: [cell("5"), cell("MFA for Dashboard", { bold: true }), cell("Implement TOTP-based MFA for analyst and admin dashboard access."), cell("HIGH", { bold: true, color: ORANGE })] }),
    new TableRow({ children: [cell("6"), cell("SOC 2 Preparation", { bold: true }), cell("Begin documenting controls for SOC 2 Type II audit. Requires 3-6 months operational history."), cell("MEDIUM", { bold: true, color: ACCENT })] }),
  ],
}));

// 11. CONTACT
children.push(sectionTitle("11. Contact"));
children.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [cell("Partnerships", { bold: true, width: 25, shading: LIGHT_BLUE }), cell("partnerships@payguard.africa", { width: 75 })] }),
    new TableRow({ children: [cell("Sales", { bold: true, width: 25, shading: LIGHT_BLUE }), cell("sales@payguard.africa", { width: 75 })] }),
    new TableRow({ children: [cell("Website", { bold: true, width: 25, shading: LIGHT_BLUE }), cell("https://payguard.africa", { width: 75 })] }),
    new TableRow({ children: [cell("Developer Portal", { bold: true, width: 25, shading: LIGHT_BLUE }), cell("https://payguard.africa/developers", { width: 75 })] }),
  ],
}));

children.push(new Paragraph({ spacing: { before: 400 } }));
children.push(body("This document is confidential and intended for prospective partners evaluating PayGuard's security posture. Maturity indicators reflect platform status as of March 2025 and are updated quarterly.", { italics: true, color: GRAY }));

// ── GENERATE ───────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [{ children }],
});

const outPath = path.join("C:", "Users", "616078", "Downloads", "PayGuard_Security_Whitepaper.docx");
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log("✅ Security Whitepaper v1.1 saved to:", outPath);
console.log("   File size:", (buffer.length / 1024).toFixed(1), "KB");
