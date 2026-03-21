import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType, Table, TableRow, TableCell, WidthType, PageBreak, VerticalAlign, TableLayoutType } from "docx";
import fs from "fs";

const N = "0F172A", B = "1E3A5F", A = "3B82F6", G = "10B981", R = "EF4444", O = "F59E0B", GY = "6B7280", LG = "F1F5F9", W = "FFFFFF", BK = "111827";

const h1 = (t) => new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 36, color: N, font: "Calibri" })], spacing: { before: 500, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: A } } });
const h2 = (t, c = B) => new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 26, color: c, font: "Calibri" })], spacing: { before: 360, after: 120 } });
const h3 = (t, c = A) => new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 22, color: c, font: "Calibri" })], spacing: { before: 240, after: 80 } });
const p = (t, o = {}) => new Paragraph({ children: [new TextRun({ text: t, size: 21, font: "Calibri", color: o.color || BK, bold: o.bold, italics: o.italic })], spacing: { after: o.noSpace ? 20 : 120 } });
const bullet = (t, bp = null) => { const c = []; if (bp) c.push(new TextRun({ text: bp + " ", bold: true, size: 21, font: "Calibri", color: BK })); c.push(new TextRun({ text: t, size: 21, font: "Calibri", color: BK })); return new Paragraph({ children: c, spacing: { after: 60 }, bullet: { level: 0 } }); };
const cell = (t, o = {}) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t || "", size: 19, color: o.color || BK, font: "Calibri", bold: o.bold })], alignment: o.center ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { before: 40, after: 40 } })], shading: o.bg ? { type: ShadingType.SOLID, color: o.bg } : undefined, verticalAlign: VerticalAlign.CENTER, width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined, margins: { top: 60, bottom: 60, left: 100, right: 100 } });
const pb = () => new Paragraph({ children: [new PageBreak()] });

const c = [];

// ═══ COVER ═══
c.push(new Paragraph({ spacing: { before: 1200 } }));
c.push(new Paragraph({ children: [new TextRun({ text: "SWIFTER TECHNOLOGIES", size: 52, bold: true, color: N, font: "Calibri" })], alignment: AlignmentType.CENTER }));
c.push(new Paragraph({ children: [new TextRun({ text: "Product Portfolio Overview", size: 32, color: A, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
c.push(new Paragraph({ children: [new TextRun({ text: "A comprehensive view of our full product ecosystem — what's live, what's in development, and what's on the roadmap.", size: 22, color: GY, font: "Calibri", italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }));
c.push(new Paragraph({ children: [new TextRun({ text: "Confidential — March 2026", size: 20, color: R, font: "Calibri", bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 600 } }));

// Status legend
c.push(new Paragraph({ children: [new TextRun({ text: "Status Key:  ", bold: true, size: 20, color: GY, font: "Calibri" }), new TextRun({ text: "🟢 Live  ", size: 20, color: G, font: "Calibri", bold: true }), new TextRun({ text: "🟡 Beta  ", size: 20, color: O, font: "Calibri", bold: true }), new TextRun({ text: "🔵 In Development  ", size: 20, color: A, font: "Calibri", bold: true }), new TextRun({ text: "⚪ Roadmap", size: 20, color: GY, font: "Calibri", bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }));

// Portfolio overview table
c.push(new Table({ layout: TableLayoutType.FIXED, rows: [
  new TableRow({ children: [cell("Product", {bold:true,bg:N,color:W,width:22}), cell("Category",{bold:true,bg:N,color:W,width:18}), cell("Status",{bold:true,bg:N,color:W,center:true,width:12}), cell("Description",{bold:true,bg:N,color:W,width:48})] }),
  new TableRow({ children: [cell("Swifter Send"), cell("Payments"), cell("🟢 Live",{center:true}), cell("Cross-border remittance platform (B2B + B2C)")] }),
  new TableRow({ children: [cell("PayGuard",{bg:LG}), cell("Security",{bg:LG}), cell("🟢 Live",{center:true,bg:LG}), cell("Real-time fraud prevention with mobile SDKs",{bg:LG})] }),
  new TableRow({ children: [cell("B2B Payments"), cell("Payments"), cell("🟢 Live",{center:true}), cell("Enterprise treasury & cross-border invoicing")] }),
  new TableRow({ children: [cell("PayStream",{bg:LG}), cell("Payments",{bg:LG}), cell("🟡 Beta",{center:true,bg:LG}), cell("Remote worker payroll infrastructure",{bg:LG})] }),
  new TableRow({ children: [cell("Trade Finance"), cell("Payments"), cell("🔵 Dev",{center:true}), cell("Smart contract escrow & digital letters of credit")] }),
  new TableRow({ children: [cell("Stablecoin Lending",{bg:LG}), cell("DeFi",{bg:LG}), cell("🟡 Beta",{center:true,bg:LG}), cell("USDC-collateralized ZAR loans",{bg:LG})] }),
  new TableRow({ children: [cell("Crypto-as-a-Service"), cell("DeFi"), cell("⚪ Roadmap",{center:true}), cell("White-label on/off-ramp for banks")] }),
  new TableRow({ children: [cell("Smart Routing",{bg:LG}), cell("Intelligence",{bg:LG}), cell("🟢 Live",{center:true,bg:LG}), cell("AI-powered corridor & provider selection",{bg:LG})] }),
  new TableRow({ children: [cell("FX Intelligence"), cell("Intelligence"), cell("🟢 Live",{center:true}), cell("Real-time rate aggregation & forecasting")] }),
  new TableRow({ children: [cell("AI Agents",{bg:LG}), cell("Intelligence",{bg:LG}), cell("🟡 Beta",{center:true,bg:LG}), cell("Autonomous compliance & ops agents",{bg:LG})] }),
  new TableRow({ children: [cell("AI Insights"), cell("Intelligence"), cell("🔵 Dev",{center:true}), cell("Predictive analytics & anomaly detection")] }),
  new TableRow({ children: [cell("Network Intel",{bg:LG}), cell("Intelligence",{bg:LG}), cell("⚪ Roadmap",{center:true,bg:LG}), cell("Partner health scoring & risk monitoring",{bg:LG})] }),
  new TableRow({ children: [cell("Swifter ERP"), cell("Enterprise"), cell("🔵 Dev",{center:true}), cell("Financial management for African SMEs")] }),
  new TableRow({ children: [cell("Swifter ID",{bg:LG}), cell("Identity",{bg:LG}), cell("🔵 Dev",{center:true,bg:LG}), cell("KYC/KYB identity verification platform",{bg:LG})] }),
  new TableRow({ children: [cell("Chatbanking"), cell("Channels"), cell("⚪ Roadmap",{center:true}), cell("WhatsApp & USSD banking interface")] }),
  new TableRow({ children: [cell("Connectivity",{bg:LG}), cell("Infrastructure",{bg:LG}), cell("🟢 Live",{center:true,bg:LG}), cell("Partner API gateway & corridor aggregation",{bg:LG})] }),
], width: { size: 100, type: WidthType.PERCENTAGE } }));

c.push(pb());

// ═══ FLAGSHIP 1: SWIFTER SEND ═══
c.push(h1("💸 Swifter Send — Cross-Border Payments"));
c.push(new Paragraph({ children: [new TextRun({ text: "STATUS: ", bold: true, size: 21, color: GY, font: "Calibri" }), new TextRun({ text: "🟢 LIVE — Production deployed", bold: true, size: 21, color: G, font: "Calibri" })], spacing: { after: 200 } }));
c.push(p("Swifter Send is a full-stack cross-border remittance platform enabling instant, low-cost money transfers from South Africa to 20+ African countries. Settlement uses stablecoin rails (ZAR → USDC → Local Currency), replacing correspondent banking with 50% lower fees and sub-60-second delivery."));

c.push(h2("Value Proposition"));
c.push(bullet("Traditional remittances cost 8-12% and take 3-5 business days. Swifter Send costs 1.5-3% and settles in under 60 seconds."));
c.push(bullet("B2B API lets banks and fintechs embed cross-border payments into their own apps under their own brand."));
c.push(bullet("Multi-provider corridor routing automatically selects the fastest, cheapest path for each transfer."));
c.push(bullet("Built-in KYC/AML compliance per transaction — banks don't need to build their own compliance layer."));

c.push(h2("Key Features"));
c.push(bullet("Multi-corridor support: ZAR, USD, GBP, EUR, KES, NGN, GHS, UGX, TZS, MWK, ZMW, BWP, SZL, MZN, NAD, LSL, RWF, TGS, BIF, XOF, XAF"));
c.push(bullet("Real-time FX aggregation with best-rate selection across multiple liquidity providers"));
c.push(bullet("Mobile money, bank transfer, and cash pickup payout methods"));
c.push(bullet("Automated BOP code classification for SARB reporting (B2B)"));
c.push(bullet("Invoice generation with PDF export for business payments"));
c.push(bullet("Live corridor analytics and transaction tracking dashboard"));

c.push(h2("Stats"));
c.push(new Table({ layout: TableLayoutType.FIXED, rows: [
  new TableRow({ children: [cell("Metric",{bold:true,bg:N,color:W}), cell("Value",{bold:true,bg:N,color:W,center:true})] }),
  new TableRow({ children: [cell("Settlement Time"), cell("<60 seconds",{center:true})] }),
  new TableRow({ children: [cell("Cost Savings vs Traditional",{bg:LG}), cell("50%+",{center:true,bg:LG})] }),
  new TableRow({ children: [cell("Countries Supported"), cell("20+",{center:true})] }),
  new TableRow({ children: [cell("Uptime SLA",{bg:LG}), cell("99.2%",{center:true,bg:LG})] }),
  new TableRow({ children: [cell("Currencies"), cell("12+",{center:true})] }),
], width: { size: 60, type: WidthType.PERCENTAGE } }));
c.push(p("Website: swifter.digital  |  API Docs: swifter.digital/developer-docs", { bold: true }));

c.push(pb());

// ═══ FLAGSHIP 2: PAYGUARD ═══
c.push(h1("🛡️ PayGuard — Real-Time Fraud Prevention"));
c.push(new Paragraph({ children: [new TextRun({ text: "STATUS: ", bold: true, size: 21, color: GY, font: "Calibri" }), new TextRun({ text: "🟢 LIVE — 3 microservices deployed on Railway", bold: true, size: 21, color: G, font: "Calibri" })], spacing: { after: 200 } }));
c.push(p("PayGuard is the only fraud prevention platform purpose-built for African payment fraud. Its unique capability is on-device phone call detection — 70% of mobile money fraud in Africa starts with a phone call where the victim is coached to send money or share an OTP. No global competitor captures this signal."));

c.push(h2("Value Proposition"));
c.push(bullet("Detects social engineering fraud in real-time by monitoring active phone calls during payment flows — a signal no competitor captures."));
c.push(bullet("35+ fraud detection rules across 7 attack categories (social engineering, SIM swap, OTP phishing, deepfake, velocity, device intel, AML)."));
c.push(bullet("Native iOS (Swift) and Android (Kotlin) SDKs with hardware-backed device binding."));
c.push(bullet("<100ms risk scoring latency with fail-secure offline mode — SDK scores locally when API is unreachable."));

c.push(h2("Unique Features"));
c.push(bullet("On-device call detection via TelephonyManager (Android) and CXCallObserver (iOS) — detects active calls during OTP/payment screens."));
c.push(bullet("OTP Guard — FLAG_SECURE prevents screenshots, full-screen SCAM ALERT overlay when unknown caller detected during OTP entry."));
c.push(bullet("Graph-based fraud ring detection using Neo4j — maps device-to-account-to-IP relationships across clients."));
c.push(bullet("Behavioral biometrics — keystroke cadence, paste detection, typing speed analysis."));
c.push(bullet("Device intelligence — root detection (su, Magisk, test-keys), emulator detection, app tamper detection."));
c.push(bullet("SIM swap detection via telecom API integration."));

c.push(h2("Architecture"));
c.push(new Table({ layout: TableLayoutType.FIXED, rows: [
  new TableRow({ children: [cell("Service",{bold:true,bg:N,color:W,width:25}), cell("Tech Stack",{bold:true,bg:N,color:W,width:30}), cell("URL",{bold:true,bg:N,color:W,width:30}), cell("Status",{bold:true,bg:N,color:W,center:true,width:15})] }),
  new TableRow({ children: [cell("API Gateway"), cell("Node.js, Express"), cell("api.payguard.africa"), cell("🟢 Live",{center:true})] }),
  new TableRow({ children: [cell("Risk Engine",{bg:LG}), cell("Python, FastAPI",{bg:LG}), cell("risk-engine.up.railway.app",{bg:LG}), cell("🟢 Live",{center:true,bg:LG})] }),
  new TableRow({ children: [cell("Device Binding"), cell("Node.js, Express"), cell("device-binding.up.railway.app"), cell("🟢 Live",{center:true})] }),
  new TableRow({ children: [cell("Graph Engine",{bg:LG}), cell("Python, FastAPI, Neo4j",{bg:LG}), cell("—",{bg:LG}), cell("🔵 Dev",{center:true,bg:LG})] }),
  new TableRow({ children: [cell("iOS SDK"), cell("Swift, CXCallObserver"), cell("CocoaPods / SPM"), cell("🟢 Built",{center:true})] }),
  new TableRow({ children: [cell("Android SDK",{bg:LG}), cell("Kotlin, TelephonyManager",{bg:LG}), cell("Maven / Gradle",{bg:LG}), cell("🟢 Built",{center:true,bg:LG})] }),
  new TableRow({ children: [cell("Dashboard"), cell("React, TypeScript"), cell("payguard.africa"), cell("🟢 Live",{center:true})] }),
], width: { size: 100, type: WidthType.PERCENTAGE } }));
c.push(p("Live Demo: payguard.africa/demo  |  API Health: api.payguard.africa/health", { bold: true }));

c.push(pb());

// ═══ B2B PAYMENTS ═══
c.push(h1("🏢 B2B Payments — Enterprise Cross-Border Treasury"));
c.push(new Paragraph({ children: [new TextRun({ text: "STATUS: ", bold: true, size: 21, color: GY, font: "Calibri" }), new TextRun({ text: "🟢 LIVE", bold: true, size: 21, color: G, font: "Calibri" })], spacing: { after: 200 } }));
c.push(p("Full invoicing, multi-currency settlement, and automated reconciliation for businesses trading across African borders. One platform replaces fragmented banking relationships."));
c.push(bullet("Invoice generation with PDF export and client payment portal"));
c.push(bullet("Multi-currency acceptance: ZAR, USD, EUR, GBP"));
c.push(bullet("Automated BOP code classification for SARB reporting"));
c.push(bullet("KYB verification wizard for business onboarding"));
c.push(bullet("Payment dispute management and resolution workflows"));

c.push(pb());

// ═══ PAYSTREAM ═══
c.push(h1("👥 PayStream — Remote Worker Payroll"));
c.push(new Paragraph({ children: [new TextRun({ text: "STATUS: ", bold: true, size: 21, color: GY, font: "Calibri" }), new TextRun({ text: "🟡 BETA", bold: true, size: 21, color: O, font: "Calibri" })], spacing: { after: 200 } }));
c.push(p("A single B2B API for paying Africa's 50M+ gig economy and remote workers. Global employers integrate once — every payment settles in under 60 seconds at ~2% total cost."));
c.push(bullet("Batch payroll processing with CSV upload or API"));
c.push(bullet("Multi-country disbursement in a single batch"));
c.push(bullet("Worker onboarding with embedded KYC verification"));
c.push(bullet("Platform integration compatibility (Deel, Remote, Papaya Global)"));
c.push(bullet("Real-time settlement tracking with webhook notifications"));
c.push(bullet("Automated tax withholding and compliance documentation"));

c.push(pb());

// ═══ TRADE FINANCE ═══
c.push(h1("📦 Trade Finance — Blockchain-Secured Escrow"));
c.push(new Paragraph({ children: [new TextRun({ text: "STATUS: ", bold: true, size: 21, color: GY, font: "Calibri" }), new TextRun({ text: "🔵 IN DEVELOPMENT", bold: true, size: 21, color: A, font: "Calibri" })], spacing: { after: 200 } }));
c.push(p("Smart contract escrow, automated milestone releases, and digital letters of credit for intra-African trade — reducing settlement risk and eliminating intermediaries."));
c.push(bullet("Smart contract escrow with multi-signature release"));
c.push(bullet("Digital Letters of Credit (LC) issuance"));
c.push(bullet("IoT & GPS milestone-triggered payment release"));
c.push(bullet("Bill of Lading & document verification"));
c.push(bullet("Insurance integration for cargo protection"));

// ═══ STABLECOIN LENDING ═══
c.push(h1("🏦 Stablecoin Lending — USDC-Collateralized ZAR Loans"));
c.push(new Paragraph({ children: [new TextRun({ text: "STATUS: ", bold: true, size: 21, color: GY, font: "Calibri" }), new TextRun({ text: "🟡 BETA", bold: true, size: 21, color: O, font: "Calibri" })], spacing: { after: 200 } }));
c.push(p("South Africa's first stablecoin-backed lending protocol. Users deposit USDC as collateral and borrow ZAR — unlocking liquidity without selling crypto assets."));
c.push(bullet("Solana smart contract with Pyth oracle price feeds for real-time valuation"));
c.push(bullet("Auto-liquidation at configurable LTV thresholds (max 80% LTV)"));
c.push(bullet("ZAR disbursement via FNB, ABSA, Standard Bank, Capitec"));
c.push(bullet("Insurance fund for protocol safety"));
c.push(bullet("Revenue: interest spread + origination fee + platform fees"));

c.push(pb());

// ═══ CRYPTO AS A SERVICE ═══
c.push(h1("🪙 Crypto-as-a-Service — White-Label On/Off-Ramp"));
c.push(new Paragraph({ children: [new TextRun({ text: "STATUS: ", bold: true, size: 21, color: GY, font: "Calibri" }), new TextRun({ text: "⚪ ROADMAP", bold: true, size: 21, color: GY, font: "Calibri" })], spacing: { after: 200 } }));
c.push(p("Enable any bank or fintech to offer crypto on/off-ramps, stablecoin wallets, and cross-border settlement — all via a single API under their own brand."));
c.push(bullet("White-label on/off-ramp for USDC, USDT, BTC, ETH"));
c.push(bullet("Multi-tenant architecture for partner isolation"));
c.push(bullet("CASP license piggybacking (Ref: CASP-YC-2026-0041)"));
c.push(bullet("Embedded KYC/AML compliance per tenant"));
c.push(bullet("Revenue sharing model with transparent fee splits"));

// ═══ INTELLIGENCE LAYER ═══
c.push(pb());
c.push(h1("🧠 Intelligence Layer"));
c.push(p("A suite of AI-powered tools that sit underneath all payment products, optimizing routing, rates, compliance, and risk in real-time."));

c.push(h2("Smart Routing — 🟢 Live"));
c.push(p("AI-powered corridor and provider selection engine. Analyzes real-time liquidity, fees, speed, and success rates across all connected providers to route each transaction through the optimal path."));
c.push(bullet("Multi-variable optimization (cost, speed, reliability, liquidity)"));
c.push(bullet("Auto-failover to backup providers when primary is down"));
c.push(bullet("Learning algorithm improves routing accuracy over time"));

c.push(h2("FX Intelligence — 🟢 Live"));
c.push(p("Real-time foreign exchange rate aggregation from multiple liquidity providers. Provides best-rate selection and rate locking for enterprise clients."));
c.push(bullet("Multi-provider rate aggregation in real-time"));
c.push(bullet("Rate lock functionality for enterprise treasury operations"));
c.push(bullet("Historical rate analytics and trend visualization"));

c.push(h2("AI Agents — 🟡 Beta"));
c.push(p("Autonomous AI agents that handle compliance screening, transaction monitoring, and operational tasks. Reduces manual review burden by 60-80%."));
c.push(bullet("Compliance agent: Automated sanctions screening and PEP checks"));
c.push(bullet("Ops agent: Transaction monitoring and anomaly flagging"));
c.push(bullet("Support agent: Customer query resolution via natural language"));

c.push(h2("AI Insights — 🔵 In Development"));
c.push(p("Predictive analytics engine that surfaces trends, anomalies, and opportunities across transaction data."));
c.push(bullet("Corridor demand forecasting for liquidity planning"));
c.push(bullet("Customer churn prediction and retention signals"));
c.push(bullet("Revenue optimization recommendations"));

c.push(h2("Network Intel — ⚪ Roadmap"));
c.push(p("Partner health scoring and real-time risk monitoring across the provider network."));
c.push(bullet("Partner uptime and performance scoring"));
c.push(bullet("Early warning system for provider degradation"));
c.push(bullet("Automatic partner rotation based on health metrics"));

c.push(pb());

// ═══ ENTERPRISE PRODUCTS ═══
c.push(h1("🏗️ Enterprise & Channel Products"));

c.push(h2("Swifter ERP — 🔵 In Development"));
c.push(p("A lightweight financial management platform designed for African SMEs. Combines invoicing, expense tracking, payroll, and cross-border payments in one system — replacing the patchwork of Excel spreadsheets and manual banking that most African SMEs rely on."));
c.push(bullet("Multi-currency invoicing with automated reminders and payment tracking"));
c.push(bullet("Expense management with receipt scanning and categorization"));
c.push(bullet("Payroll processing integrated with PayStream for cross-border worker payments"));
c.push(bullet("Bank feed integration for automated reconciliation"));
c.push(bullet("Tax reporting aligned with SARS, KRA, and FIRS requirements"));
c.push(bullet("Embedded Swifter Send for cross-border supplier payments directly from the ERP"));

c.push(h2("Swifter ID — 🔵 In Development"));
c.push(p("Identity verification platform providing KYC and KYB services across African markets. A single API call verifies identity documents, performs biometric matching, and runs compliance checks — enabling any fintech to onboard customers in minutes."));
c.push(bullet("Document verification: SA ID, passport, driver's license across 15+ African countries"));
c.push(bullet("Biometric liveness detection to prevent spoofing"));
c.push(bullet("Sanctions, PEP, and adverse media screening"));
c.push(bullet("Business verification (KYB): CIPC, company registry lookups"));
c.push(bullet("Address verification via utility bill parsing"));
c.push(bullet("API-first with pre-built UI components for rapid integration"));

c.push(h2("Chatbanking — ⚪ Roadmap"));
c.push(p("WhatsApp and USSD banking interface that brings Swifter Send's capabilities to feature phones and messaging apps — addressing the 60% of African mobile users without smartphone banking apps."));
c.push(bullet("WhatsApp Business API integration for conversational banking"));
c.push(bullet("USSD menu system for feature phone access"));
c.push(bullet("Send money, check balances, view transaction history via chat"));
c.push(bullet("Multi-language support: English, Zulu, Swahili, French, Portuguese"));
c.push(bullet("End-to-end encrypted transaction flow"));

c.push(h2("Connectivity — 🟢 Live"));
c.push(p("The foundational infrastructure layer that connects Swifter to banks, mobile money operators, and payment processors across Africa. A partner API gateway that normalizes diverse provider interfaces into a single, consistent API."));
c.push(bullet("Unified API across 15+ payment providers (PawaPay, MoMo, bank APIs)"));
c.push(bullet("Real-time provider health monitoring and auto-failover"));
c.push(bullet("Webhook management for partner event notifications"));
c.push(bullet("Rate limiting, authentication, and audit logging per partner"));

c.push(pb());

// ═══ PLATFORM SYNERGY ═══
c.push(h1("🔄 Platform Synergy — Why It All Fits Together"));
c.push(p("Every product in the Swifter ecosystem is modular but interconnected. Banks and fintechs can adopt individual products or combine them for exponential value:"));
c.push(bullet("Swifter Send + PayGuard = Every remittance is fraud-scored in real-time — the remittance platform generates fraud data, and the fraud platform makes remittances safer."));
c.push(bullet("Swifter Send + Swifter ID = Automated KYC at onboarding with ongoing transaction monitoring."));
c.push(bullet("PayStream + Smart Routing = Payroll batches automatically route through the cheapest, fastest corridor."));
c.push(bullet("Swifter ERP + Swifter Send = African SMEs pay international suppliers directly from their accounting system."));
c.push(bullet("Chatbanking + Swifter Send = Reach the 60% of Africans without banking apps via WhatsApp and USSD."));
c.push(bullet("Stablecoin Lending + Crypto-as-a-Service = Banks offer crypto products under their own brand with lending built in."));

c.push(h2("Integration Model"));
c.push(p("Integrate once with a single REST API. Activate any product from the dashboard — no additional integration required."));
c.push(p("SDKs available: Python, Node.js, Go, Java, Swift (iOS), Kotlin (Android), JavaScript (npm).", { bold: true }));

c.push(pb());

// ═══ FOUNDER NOTE ═══
c.push(h1("📝 A Note from the Founder"));
c.push(p("Every product described in this document was designed, built, and deployed by a single engineer over 18 months — bootstrapped, with no funding and no team."));
c.push(p("The flagship products (Swifter Send and PayGuard) are live in production today. The supporting products are in various stages of readiness, built on the same infrastructure and codebase."));
c.push(p("This document represents what's possible when deep technical execution meets a massive market opportunity. With the right capital and team, the commercial launch of this platform will be transformational for African financial infrastructure."));
c.push(new Paragraph({ spacing: { before: 300 } }));
c.push(p("Malcolm Govender", { bold: true }));
c.push(p("Founder & CEO, Swifter Technologies (Pty) Ltd"));
c.push(p("malcolm@swifter.digital | payguard.africa | swifter.digital"));

c.push(new Paragraph({ spacing: { before: 300 } }));
c.push(p("— End of Document —", { italic: true }));

const doc = new Document({ styles: { default: { document: { run: { font: "Calibri", size: 21 } } } }, sections: [{ children: c }] });
const outPath = "C:/Users/616078/Downloads/Swifter_Product_Portfolio_Overview.docx";
const buf = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buf);
console.log("✅ Product Portfolio saved:", outPath);
console.log("   Size:", (buf.length / 1024).toFixed(1), "KB");
console.log("   Products covered: 16");
