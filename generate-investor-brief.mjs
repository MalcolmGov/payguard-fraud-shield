import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType, Table, TableRow, TableCell, WidthType, PageBreak, ExternalHyperlink, ImageRun, VerticalAlign, TableLayoutType } from "docx";
import fs from "fs";
import path from "path";

const NAVY = "0F172A";
const BLUE = "1E3A5F";
const ACCENT = "3B82F6";
const GREEN = "10B981";
const RED = "EF4444";
const ORANGE = "F59E0B";
const GRAY = "6B7280";
const LGRAY = "F1F5F9";
const WHITE = "FFFFFF";
const BLACK = "111827";

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, color: NAVY, font: "Calibri" })],
    spacing: { before: 500, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
  });
}
function h2(text, color = BLUE) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color, font: "Calibri" })],
    spacing: { before: 360, after: 120 },
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 21, font: "Calibri", color: opts.color || BLACK, bold: opts.bold, italics: opts.italic })],
    spacing: { after: opts.noSpace ? 20 : 120 },
    indent: opts.indent ? { left: 300 } : undefined,
    bullet: opts.bullet ? { level: 0 } : undefined,
  });
}
function bullet(text, bold_prefix = null) {
  const children = [];
  if (bold_prefix) {
    children.push(new TextRun({ text: bold_prefix + " ", bold: true, size: 21, font: "Calibri", color: BLACK }));
  }
  children.push(new TextRun({ text, size: 21, font: "Calibri", color: BLACK }));
  return new Paragraph({ children, spacing: { after: 60 }, bullet: { level: 0 } });
}
function statBox(label, value) {
  return new TableCell({
    children: [
      new Paragraph({ children: [new TextRun({ text: value, bold: true, size: 32, color: ACCENT, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: label, size: 18, color: GRAY, font: "Calibri" })], alignment: AlignmentType.CENTER }),
    ],
    shading: { type: ShadingType.SOLID, color: LGRAY },
    verticalAlign: VerticalAlign.CENTER,
    width: { size: 25, type: WidthType.PERCENTAGE },
    margins: { top: 200, bottom: 200, left: 100, right: 100 },
  });
}
function cell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: text || "", size: 19, color: opts.color || BLACK, font: "Calibri", bold: opts.bold })], alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { before: 40, after: 40 } })],
    shading: opts.bg ? { type: ShadingType.SOLID, color: opts.bg } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

const children = [];

// ═══════════════════════════════════════════════════════════════════════════════
// COVER
// ═══════════════════════════════════════════════════════════════════════════════
children.push(new Paragraph({ spacing: { before: 1200 } }));
children.push(new Paragraph({
  children: [new TextRun({ text: "SWIFTER TECHNOLOGIES", size: 52, bold: true, color: NAVY, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Investor Executive Brief", size: 30, color: ACCENT, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Pre-Seed / Seed — March 2026", size: 22, color: GRAY, font: "Calibri", italics: true })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 100 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Confidential", size: 20, color: RED, font: "Calibri", bold: true })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 },
}));

// Key stats banner
children.push(new Table({
  layout: TableLayoutType.FIXED,
  rows: [new TableRow({ children: [
    statBox("Annual Fraud Losses\n(Africa)", "$4B+"),
    statBox("Remittance Market\n(Sub-Saharan Africa)", "$48B"),
    statBox("Built Solo\n(No Funding)", "18 mo"),
    statBox("Fraud Rules\n(Live & Scoring)", "35+"),
  ]})],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ═══════════════════════════════════════════════════════════════════════════════
// THE OPPORTUNITY
// ═══════════════════════════════════════════════════════════════════════════════
children.push(h1("The Opportunity"));
children.push(p("Africa has the fastest-growing digital payments market in the world — but two massive problems remain unsolved:"));
children.push(h2("Problem 1: Payment Fraud ($4B+ Annual Losses)", RED));
children.push(bullet("70% of mobile money fraud in Africa starts with a phone call — a victim is coached in real-time to transfer money, share an OTP, or approve a payment."));
children.push(bullet("Existing fraud platforms (ThreatMatrix, BioCatch, Featurespace) are designed for Western markets and don't capture on-device phone call signals."));
children.push(bullet("African banks and fintechs lose $4 billion annually (Interpol, 2024), with social engineering and SIM swap fraud growing 45% year-over-year."));
children.push(h2("Problem 2: Cross-Border Payments (Slow, Expensive)", RED));
children.push(bullet("Sending money across African borders still takes 3-5 business days, costs 8-12% in fees, and requires physical branch visits."));
children.push(bullet("$48 billion flows to Sub-Saharan Africa annually in remittances (World Bank, 2024), making it the fastest-growing remittance corridor globally."));
children.push(bullet("Existing players (Wise, WorldRemit) serve the diaspora-to-Africa corridor. Intra-Africa corridors remain underserved."));

// ═══════════════════════════════════════════════════════════════════════════════
// THE PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════
children.push(h1("Our Products"));
children.push(p("Two production-ready platforms, built from scratch, fully deployed, and operational today."));

// ── PAYGUARD ─────────────────────────────────────────────────────────────────
children.push(h2("🛡️ PayGuard — Real-Time Fraud Prevention Platform"));
children.push(p("The only fraud platform purpose-built for African payment fraud, with native on-device phone call detection."));
children.push(bullet("35+ fraud detection rules across 7 modules (social engineering, SIM swap, OTP vishing, deepfake voice, velocity, device intelligence, AML/sanctions)"));
children.push(bullet("Native iOS SDK (Swift) and Android SDK (Kotlin) with real-time call state detection via TelephonyManager / CXCallObserver"));
children.push(bullet("OTP Guard — detects when a user is on a phone call while viewing their OTP screen and shows a full-screen SCAM ALERT"));
children.push(bullet("Graph-based fraud ring detection using Neo4j — maps device-to-account-to-IP relationships"));
children.push(bullet("<100ms risk scoring latency with fail-secure offline mode (SDK scores locally when API is unreachable)"));
children.push(bullet("Full admin dashboard with real-time analytics, deployed on Vercel"));

children.push(p("Links:", { bold: true }));
children.push(bullet("Live Dashboard: payguard.africa"));
children.push(bullet("Interactive Demo: payguard.africa/demo"));
children.push(bullet("API Health Check: api.payguard.africa/health (hit this — it returns live JSON)"));
children.push(bullet("Security Whitepaper: Available on request"));

// ── SWIFTER SEND ─────────────────────────────────────────────────────────────
children.push(h2("💸 Swifter Send — Cross-Border Remittance Platform"));
children.push(p("B2B remittance infrastructure for banks and fintechs, with a consumer-facing web app."));
children.push(bullet("Multi-corridor support: ZAR, USD, GBP, EUR, KES, NGN, GHS, UGX, TZS"));
children.push(bullet("Real-time FX rates with transparent fee structure (1.5-3% vs industry 8-12%)"));
children.push(bullet("Full API for institutional integration — banks embed Swifter Send into their own apps"));
children.push(bullet("KYC/AML compliance framework with POPIA Data Processing Agreement"));
children.push(bullet("Settlement engine with multi-provider payout (bank, mobile money, wallet)"));

children.push(p("Links:", { bold: true }));
children.push(bullet("Platform: swifter.digital"));
children.push(bullet("API Documentation: swifter.digital/developer-docs"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ═══════════════════════════════════════════════════════════════════════════════
// COMPETITIVE LANDSCAPE
// ═══════════════════════════════════════════════════════════════════════════════
children.push(h1("Competitive Landscape"));

children.push(h2("PayGuard vs. Global Fraud Platforms"));
children.push(new Table({
  layout: TableLayoutType.FIXED,
  rows: [
    new TableRow({ children: [
      cell("Capability", { bold: true, bg: NAVY, color: WHITE, width: 28 }),
      cell("PayGuard", { bold: true, bg: NAVY, color: WHITE, center: true, width: 12 }),
      cell("ThreatMetrix", { bold: true, bg: NAVY, color: WHITE, center: true, width: 12 }),
      cell("BioCatch", { bold: true, bg: NAVY, color: WHITE, center: true, width: 12 }),
      cell("Featurespace", { bold: true, bg: NAVY, color: WHITE, center: true, width: 12 }),
      cell("Shield (SG)", { bold: true, bg: NAVY, color: WHITE, center: true, width: 12 }),
      cell("Africa Focus", { bold: true, bg: NAVY, color: WHITE, center: true, width: 12 }),
    ]}),
    new TableRow({ children: [
      cell("On-device call detection"), cell("✅", {center:true,color:GREEN}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}),
    ]}),
    new TableRow({ children: [
      cell("OTP screen protection", {bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}),
    ]}),
    new TableRow({ children: [
      cell("Behavioral biometrics"), cell("✅",{center:true,color:GREEN}), cell("✅",{center:true,color:GREEN}), cell("✅",{center:true,color:GREEN}), cell("✅",{center:true,color:GREEN}), cell("✅",{center:true,color:GREEN}), cell("❌",{center:true,color:RED}),
    ]}),
    new TableRow({ children: [
      cell("Device fingerprinting", {bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}),
    ]}),
    new TableRow({ children: [
      cell("Graph-based fraud rings"), cell("✅",{center:true,color:GREEN}), cell("✅",{center:true,color:GREEN}), cell("❌",{center:true,color:RED}), cell("✅",{center:true,color:GREEN}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}),
    ]}),
    new TableRow({ children: [
      cell("SIM swap detection", {bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("⚠️",{center:true,color:ORANGE,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}),
    ]}),
    new TableRow({ children: [
      cell("Native mobile SDK (iOS + Android)"), cell("✅",{center:true,color:GREEN}), cell("✅",{center:true,color:GREEN}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}), cell("✅",{center:true,color:GREEN}), cell("❌",{center:true,color:RED}),
    ]}),
    new TableRow({ children: [
      cell("Vishing / social engineering focus", {bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("⚠️",{center:true,color:ORANGE,bg:LGRAY}), cell("⚠️",{center:true,color:ORANGE,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}),
    ]}),
    new TableRow({ children: [
      cell("Africa-specific fraud patterns"), cell("✅",{center:true,color:GREEN}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}),
    ]}),
    new TableRow({ children: [
      cell("Pricing (est. per-txn)", {bg:LGRAY}), cell("$0.01",{center:true,bg:LGRAY}), cell("$0.05-0.15",{center:true,bg:LGRAY}), cell("$0.03-0.10",{center:true,bg:LGRAY}), cell("$0.05-0.10",{center:true,bg:LGRAY}), cell("$0.02-0.05",{center:true,bg:LGRAY}), cell("N/A",{center:true,bg:LGRAY}),
    ]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(p(""));
children.push(p("PayGuard's moat: On-device call detection. No global competitor captures TelephonyManager/CXCallObserver signals — these are mobile-first signals that require a native SDK embedded in the bank's app. This is the most predictive signal for social engineering fraud in Africa, where 70% of fraud happens during a live phone call.", { bold: true }));

children.push(h2("Swifter Send vs. Remittance Competitors"));
children.push(new Table({
  layout: TableLayoutType.FIXED,
  rows: [
    new TableRow({ children: [
      cell("Feature", { bold: true, bg: NAVY, color: WHITE, width: 28 }),
      cell("Swifter Send", { bold: true, bg: NAVY, color: WHITE, center: true, width: 18 }),
      cell("Wise", { bold: true, bg: NAVY, color: WHITE, center: true, width: 18 }),
      cell("WorldRemit", { bold: true, bg: NAVY, color: WHITE, center: true, width: 18 }),
      cell("Chipper Cash", { bold: true, bg: NAVY, color: WHITE, center: true, width: 18 }),
    ]}),
    new TableRow({ children: [
      cell("B2B API for banks"), cell("✅",{center:true,color:GREEN}), cell("✅",{center:true,color:GREEN}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}),
    ]}),
    new TableRow({ children: [
      cell("Intra-Africa corridors", {bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("⚠️ Limited",{center:true,color:ORANGE,bg:LGRAY}), cell("⚠️ Limited",{center:true,color:ORANGE,bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}),
    ]}),
    new TableRow({ children: [
      cell("Embedded fraud prevention"), cell("✅ PayGuard",{center:true,color:GREEN}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}), cell("❌",{center:true,color:RED}),
    ]}),
    new TableRow({ children: [
      cell("Mobile money payout", {bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}),
    ]}),
    new TableRow({ children: [
      cell("Fees"), cell("1.5-3%",{center:true,color:GREEN}), cell("0.5-2%",{center:true}), cell("2-5%",{center:true}), cell("Free-2%",{center:true}),
    ]}),
    new TableRow({ children: [
      cell("White-label for banks", {bg:LGRAY}), cell("✅",{center:true,color:GREEN,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}), cell("❌",{center:true,color:RED,bg:LGRAY}),
    ]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS MODEL
// ═══════════════════════════════════════════════════════════════════════════════
children.push(h1("Business Model"));
children.push(h2("PayGuard Revenue"));
children.push(bullet("Per-transaction fee: $0.01 per API call (risk scoring)", "API Pricing:"));
children.push(bullet("Monthly platform fee: $500-$5,000/mo depending on tier (Free, Startup, Enterprise)", "SaaS Pricing:"));
children.push(bullet("Custom rule development, dedicated support, on-premise deployment", "Enterprise:"));

children.push(h2("Swifter Send Revenue"));
children.push(bullet("1.5-3% fee per transfer (competitive vs 8-12% industry average)", "Transaction Fee:"));
children.push(bullet("0.25-0.50% spread on real-time FX rates", "FX Spread:"));
children.push(bullet("Monthly platform fee for embedded API clients", "API Licensing:"));

children.push(h2("Combined Platform Advantage"));
children.push(p("Every Swifter Send transaction is automatically scored by PayGuard — creating a flywheel where the remittance platform generates fraud data, and the fraud platform makes remittances safer. Banks can buy either product standalone or get both as an integrated stack."));

// ═══════════════════════════════════════════════════════════════════════════════
// TECH STACK
// ═══════════════════════════════════════════════════════════════════════════════
children.push(h1("Technology Stack (Production-Ready)"));
children.push(new Table({
  layout: TableLayoutType.FIXED,
  rows: [
    new TableRow({ children: [
      cell("Layer", { bold: true, bg: NAVY, color: WHITE, width: 25 }),
      cell("Technology", { bold: true, bg: NAVY, color: WHITE, width: 35 }),
      cell("Status", { bold: true, bg: NAVY, color: WHITE, width: 20 }),
      cell("Deployed To", { bold: true, bg: NAVY, color: WHITE, width: 20 }),
    ]}),
    new TableRow({ children: [cell("Frontend",{bg:LGRAY}), cell("React, TypeScript, Vite",{bg:LGRAY}), cell("✅ Live",{color:GREEN,bg:LGRAY}), cell("Vercel",{bg:LGRAY})]}),
    new TableRow({ children: [cell("API Gateway"), cell("Node.js, Express, TypeScript"), cell("✅ Live",{color:GREEN}), cell("Railway")]}),
    new TableRow({ children: [cell("Risk Engine",{bg:LGRAY}), cell("Python, FastAPI, Uvicorn",{bg:LGRAY}), cell("✅ Live",{color:GREEN,bg:LGRAY}), cell("Railway",{bg:LGRAY})]}),
    new TableRow({ children: [cell("Device Binding"), cell("Node.js, Express"), cell("✅ Live",{color:GREEN}), cell("Railway")]}),
    new TableRow({ children: [cell("Graph Engine",{bg:LGRAY}), cell("Python, FastAPI, Neo4j",{bg:LGRAY}), cell("Code complete",{color:ORANGE,bg:LGRAY}), cell("Pending",{bg:LGRAY})]}),
    new TableRow({ children: [cell("Database"), cell("PostgreSQL (managed)"), cell("✅ Live",{color:GREEN}), cell("Railway")]}),
    new TableRow({ children: [cell("Cache",{bg:LGRAY}), cell("Redis (managed)",{bg:LGRAY}), cell("✅ Live",{color:GREEN,bg:LGRAY}), cell("Railway",{bg:LGRAY})]}),
    new TableRow({ children: [cell("iOS SDK"), cell("Swift, SPM, CXCallObserver"), cell("✅ Built",{color:GREEN}), cell("CocoaPods/SPM")]}),
    new TableRow({ children: [cell("Android SDK",{bg:LGRAY}), cell("Kotlin, TelephonyManager, Keystore",{bg:LGRAY}), cell("✅ Built",{color:GREEN,bg:LGRAY}), cell("Maven/Gradle",{bg:LGRAY})]}),
    new TableRow({ children: [cell("JavaScript SDK"), cell("TypeScript, npm"), cell("✅ Published",{color:GREEN}), cell("npm")]}),
    new TableRow({ children: [cell("CI/CD",{bg:LGRAY}), cell("GitHub Actions (4-job pipeline)",{bg:LGRAY}), cell("✅ Live",{color:GREEN,bg:LGRAY}), cell("GitHub",{bg:LGRAY})]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ═══════════════════════════════════════════════════════════════════════════════
// THE ASK
// ═══════════════════════════════════════════════════════════════════════════════
children.push(h1("The Ask"));
children.push(h2("Raising: $250K - $500K (Pre-Seed)"));

children.push(p("Use of Funds:", { bold: true }));
children.push(new Table({
  layout: TableLayoutType.FIXED,
  rows: [
    new TableRow({ children: [
      cell("Category", { bold: true, bg: NAVY, color: WHITE, width: 35 }),
      cell("Allocation", { bold: true, bg: NAVY, color: WHITE, center: true, width: 20 }),
      cell("Details", { bold: true, bg: NAVY, color: WHITE, width: 45 }),
    ]}),
    new TableRow({ children: [cell("Engineering Team"), cell("40%",{center:true}), cell("3 full-stack engineers (6-month runway)")]}),
    new TableRow({ children: [cell("Commercial & BD",{bg:LGRAY}), cell("25%",{center:true,bg:LGRAY}), cell("1 commercial lead + pilot customer acquisition",{bg:LGRAY})]}),
    new TableRow({ children: [cell("Regulatory & Legal"), cell("15%",{center:true}), cell("Money transfer licensing (SA, Kenya), POPIA audit")]}),
    new TableRow({ children: [cell("Infrastructure & Security",{bg:LGRAY}), cell("10%",{center:true,bg:LGRAY}), cell("Cloud hosting, penetration test, SOC 2 prep",{bg:LGRAY})]}),
    new TableRow({ children: [cell("Working Capital"), cell("10%",{center:true}), cell("Operations, travel, conferences")]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(h2("What We\'re Looking For Beyond Capital"));
children.push(bullet("Introductions to banking and fintech decision-makers across Southern and East Africa"));
children.push(bullet("Guidance on money transfer licensing in South Africa (SARB) and Kenya (CBK)"));
children.push(bullet("Go-to-market strategy for B2B enterprise sales (PayGuard to bank fraud teams)"));
children.push(bullet("Board-level support during the regulatory and compliance journey"));

// ═══════════════════════════════════════════════════════════════════════════════
// WHY ME
// ═══════════════════════════════════════════════════════════════════════════════
children.push(h1("Why This Founder"));
children.push(p("Everything in this document — every product, every API, every SDK, every dashboard, every database migration, every fraud rule, every deployment script — was built by one person in 18 months with zero funding."));
children.push(p("This is proof of extreme execution velocity. With a small team and modest capital, the output will be disproportionate.", { italic: true }));

children.push(h2("Milestones Achieved (Solo, Bootstrapped)"));
children.push(bullet("Built and deployed 3 live microservices on Railway with managed Postgres and Redis"));
children.push(bullet("Wrote 35+ fraud detection rules spanning 7 attack categories"));
children.push(bullet("Built native SDKs for iOS (Swift), Android (Kotlin), and JavaScript (npm-published)"));
children.push(bullet("Implemented on-device call detection — a capability no global competitor has"));
children.push(bullet("Deployed dashboards for both PayGuard and Swifter Send on Vercel"));
children.push(bullet("Wrote production Docker configs with multi-stage builds, healthchecks, and CI/CD"));
children.push(bullet("Created POPIA-compliant legal documentation (DPA, SLA, Terms of Service)"));

// ═══════════════════════════════════════════════════════════════════════════════
// LINKS
// ═══════════════════════════════════════════════════════════════════════════════
children.push(h1("Product Links & Live Demos"));
children.push(new Table({
  layout: TableLayoutType.FIXED,
  rows: [
    new TableRow({ children: [
      cell("Product", { bold: true, bg: NAVY, color: WHITE, width: 30 }),
      cell("URL", { bold: true, bg: NAVY, color: WHITE, width: 50 }),
      cell("What You\'ll See", { bold: true, bg: NAVY, color: WHITE, width: 20 }),
    ]}),
    new TableRow({ children: [cell("PayGuard Dashboard"), cell("payguard.africa"), cell("Live dashboard")]}),
    new TableRow({ children: [cell("PayGuard Demo",{bg:LGRAY}), cell("payguard.africa/demo",{bg:LGRAY}), cell("7 fraud scenarios",{bg:LGRAY})]}),
    new TableRow({ children: [cell("PayGuard API Health"), cell("api.payguard.africa/health"), cell("Live JSON response")]}),
    new TableRow({ children: [cell("Swifter Send",{bg:LGRAY}), cell("swifter.digital",{bg:LGRAY}), cell("Platform + API docs",{bg:LGRAY})]}),
    new TableRow({ children: [cell("Developer Docs"), cell("swifter.digital/developer-docs"), cell("OpenAPI specs")]}),
    new TableRow({ children: [cell("Security Whitepaper",{bg:LGRAY}), cell("Available on request",{bg:LGRAY}), cell("28-page document",{bg:LGRAY})]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(new Paragraph({ spacing: { before: 400 } }));
children.push(new Paragraph({
  children: [
    new TextRun({ text: "Malcolm Gillespie", bold: true, size: 24, color: NAVY, font: "Calibri" }),
  ],
  spacing: { after: 40 },
}));
children.push(p("Founder & CEO, Swifter Technologies (Pty) Ltd"));
children.push(p("malcolm@swifter.co.za | payguard.africa | swifter.digital"));

children.push(new Paragraph({ spacing: { before: 300 } }));
children.push(p("— End of Document —", { italic: true }));


// ── GENERATE ──────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [{ children }],
});

const outPath = path.join("C:", "Users", "616078", "Downloads", "Swifter_Investor_Executive_Brief.docx");
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log("✅ Investor Executive Brief saved to:", outPath);
console.log("   File size:", (buffer.length / 1024).toFixed(1), "KB");
