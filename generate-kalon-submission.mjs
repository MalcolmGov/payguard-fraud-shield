import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType, Table, TableRow, TableCell, WidthType, PageBreak, VerticalAlign, TableLayoutType } from "docx";
import fs from "fs";

const N="0F172A",B="1E3A5F",A="3B82F6",G="10B981",R="EF4444",O="F59E0B",GY="6B7280",LG="F1F5F9",W="FFFFFF",BK="111827",PUR="7C3AED",CY="06B6D4";

const h1=(t)=>new Paragraph({children:[new TextRun({text:t,bold:true,size:34,color:N,font:"Calibri"})],spacing:{before:460,after:180},border:{bottom:{style:BorderStyle.SINGLE,size:2,color:A}}});
const h2=(t,c=B)=>new Paragraph({children:[new TextRun({text:t,bold:true,size:26,color:c,font:"Calibri"})],spacing:{before:320,after:100}});
const h3=(t,c=A)=>new Paragraph({children:[new TextRun({text:t,bold:true,size:22,color:c,font:"Calibri"})],spacing:{before:220,after:70}});
const p=(t,o={})=>new Paragraph({children:[new TextRun({text:t,size:21,font:"Calibri",color:o.color||BK,bold:o.bold,italics:o.italic})],spacing:{after:o.noSpace?20:110}});
const mp=(runs)=>new Paragraph({children:runs.map(r=>new TextRun({size:21,font:"Calibri",...r})),spacing:{after:110}});
const bullet=(t,bp=null)=>{const c=[];if(bp)c.push(new TextRun({text:bp+" ",bold:true,size:21,font:"Calibri",color:BK}));c.push(new TextRun({text:t,size:21,font:"Calibri",color:BK}));return new Paragraph({children:c,spacing:{after:55},bullet:{level:0}})};
const cell=(t,o={})=>new TableCell({children:[new Paragraph({children:[new TextRun({text:t||"",size:o.size||18,color:o.color||BK,font:"Calibri",bold:o.bold})],alignment:o.center?AlignmentType.CENTER:AlignmentType.LEFT,spacing:{before:25,after:25}})],shading:o.bg?{type:ShadingType.SOLID,color:o.bg}:undefined,verticalAlign:VerticalAlign.CENTER,width:o.width?{size:o.width,type:WidthType.PERCENTAGE}:undefined,margins:{top:45,bottom:45,left:75,right:75}});
const pb=()=>new Paragraph({children:[new PageBreak()]});
const hdr=(t,w)=>cell(t,{bold:true,bg:N,color:W,width:w});

const c = [];

// ════════════════════════════ COVER PAGE ════════════════════════════
c.push(new Paragraph({spacing:{before:800}}));
c.push(new Paragraph({children:[new TextRun({text:"SWIFTER TECHNOLOGIES (PTY) LTD",size:48,bold:true,color:N,font:"Calibri"})],alignment:AlignmentType.CENTER}));
c.push(new Paragraph({children:[new TextRun({text:"Investor Information Pack",size:32,color:A,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{after:60}}));
c.push(new Paragraph({children:[new TextRun({text:"Kalon Venture Partners — Pre-Seed / Seed Application",size:22,color:GY,font:"Calibri",italics:true})],alignment:AlignmentType.CENTER,spacing:{after:300}}));

// Hero stats
c.push(new Table({layout:TableLayoutType.FIXED,rows:[new TableRow({children:[
  cell("16",{bold:true,center:true,color:A,size:32,bg:LG,width:20}),
  cell("37",{bold:true,center:true,color:A,size:32,bg:LG,width:20}),
  cell("$4B+",{bold:true,center:true,color:R,size:32,bg:LG,width:20}),
  cell("$48B",{bold:true,center:true,color:G,size:32,bg:LG,width:20}),
  cell("18",{bold:true,center:true,color:PUR,size:32,bg:LG,width:20}),
]}),new TableRow({children:[
  cell("Products Built",{center:true,color:GY,size:15,bg:LG,width:20}),
  cell("Fraud Rules",{center:true,color:GY,size:15,bg:LG,width:20}),
  cell("African Fraud (Annual)",{center:true,color:GY,size:15,bg:LG,width:20}),
  cell("Remittance TAM",{center:true,color:GY,size:15,bg:LG,width:20}),
  cell("Months Solo Build",{center:true,color:GY,size:15,bg:LG,width:20}),
]})],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(new Paragraph({spacing:{before:300}}));
c.push(new Paragraph({children:[
  new TextRun({text:"Malcolm Govender",bold:true,size:24,color:N,font:"Calibri"}),
  new TextRun({text:"  —  Founder & CEO",size:22,color:GY,font:"Calibri"}),
],alignment:AlignmentType.CENTER}));
c.push(new Paragraph({children:[new TextRun({text:"malcolm@swifter.digital  |  +27 83 465 4639  |  swifter.digital  |  payguard.africa",size:20,color:A,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{after:100}}));
c.push(new Paragraph({children:[new TextRun({text:"Confidential — March 2026",size:18,color:R,font:"Calibri",bold:true})],alignment:AlignmentType.CENTER}));

c.push(pb());

// ════════════════════════════ TABLE OF CONTENTS ════════════════════════════
c.push(h1("Contents"));
const toc = [
  "1. Executive Summary",
  "2. The Problem: Why Africa Needs This",
  "3. Flagship Product: PayGuard — Fraud Prevention",
  "4. Flagship Product: Swifter Send — Cross-Border Payments",
  "5. Full Product Portfolio (16 Products)",
  "6. Competitive Landscape",
  "7. Technology & Architecture",
  "8. Business Model & Revenue",
  "9. Market Opportunity",
  "10. The Team & Founder",
  "11. Funding Ask & Use of Funds",
  "12. Roadmap & Milestones",
  "13. Live Product Links & Demos",
];
toc.forEach(t => c.push(p(t, {bold:true})));
c.push(pb());

// ════════════════════════════ 1. EXECUTIVE SUMMARY ════════════════════════════
c.push(h1("1. Executive Summary"));
c.push(p("Swifter Technologies is a South African fintech company building infrastructure for secure, instant, low-cost financial services across Africa. Founded in 2024 by Malcolm Govender, the company has bootstrapped the development of 16 interconnected products — from cross-border payments to real-time fraud prevention — with zero external funding and a single engineer."));
c.push(p("The two flagship products are commercially ready:"));
c.push(bullet("PayGuard — the only fraud prevention platform purpose-built for African payment fraud. Its unique capability: on-device phone call detection that catches 70% of mobile money vishing fraud. No global competitor captures this signal. 37 fraud detection rules, native iOS and Android SDKs, 3 live microservices on Railway.", "PayGuard:"));
c.push(bullet("Swifter Send — a full-stack cross-border remittance platform enabling sub-60-second transfers from South Africa to 20+ African countries at 50% lower cost than traditional providers, using stablecoin settlement rails (ZAR → USDC → Local Currency).", "Swifter Send:"));
c.push(p("The company is seeking pre-seed / seed investment to support commercial rollout, team expansion, regulatory licensing, and multi-market deployment across Africa."));

c.push(h2("Why Now"));
c.push(bullet("$4B+ in annual fraud losses across Africa (Interpol 2024), growing 45% YoY"));
c.push(bullet("$48B African remittance market with 8-12% average fees (World Bank)"));
c.push(bullet("Regulatory tailwinds: CBN Open Banking, SARB crypto licensing, FSCA conduct standards"));
c.push(bullet("AI is accelerating both fraud attacks AND the opportunity for AI-powered defence"));
c.push(bullet("Africa's 600M+ mobile money accounts need fraud protection designed for mobile-first, voice-heavy fraud patterns"));

c.push(pb());

// ════════════════════════════ 2. THE PROBLEM ════════════════════════════
c.push(h1("2. The Problem: Why Africa Needs This"));
c.push(h2("Problem 1: Fraud is Devastating African Digital Payments"));
c.push(p("As Africa's digital payments ecosystem scales rapidly (M-Pesa, MoMo, bank apps), fraud is scaling faster. But the fraud patterns are different from the West:"));
c.push(bullet("70% of mobile money fraud starts with a phone call — the victim is coached in real-time to transfer money or share an OTP. This \"vishing\" (voice phishing) pattern is uniquely African and is invisible to Western fraud platforms."));
c.push(bullet("SIM swap fraud is endemic — attackers hijack phone numbers, then drain accounts via USSD banking. South Africa alone reported 9,000+ SIM swap fraud complaints to SAFPS in 2024."));
c.push(bullet("Feature phone fraud — 60% of African mobile users are on feature phones using USSD banking. No existing fraud platform protects USSD channels."));
c.push(bullet("AI-powered attacks — voice deepfake cloning, AI-scripted social engineering, synthetic identity creation, and document forgery are accelerating and no African player has AI countermeasures."));

c.push(h2("Problem 2: Cross-Border Payments Are Broken"));
c.push(p("Sending money across African borders remains expensive, slow, and opaque:"));
c.push(bullet("Average cost: 8-12% fees for a typical $200 remittance (vs 1-2% in developed markets)"));
c.push(bullet("Settlement time: 3-5 business days via correspondent banking networks"));
c.push(bullet("Fragmented infrastructure: each country has different banks, mobile money operators, regulations, and currencies"));
c.push(bullet("No single platform serves both B2C (retail remittances) and B2B (enterprise treasury, payroll, trade finance)"));

c.push(pb());

// ════════════════════════════ 3. PAYGUARD DEEP-DIVE ════════════════════════════
c.push(h1("3. Flagship: PayGuard — Fraud Prevention"));
c.push(mp([
  {text:"STATUS: ",bold:true,color:GY},
  {text:"🟢 LIVE — 3 microservices deployed, SDKs built, dashboard operational",bold:true,color:G},
]));
c.push(p("PayGuard is a real-time fraud scoring API with native mobile SDKs. Banks and fintechs integrate the SDK into their mobile banking app — every transaction is scored in <100ms against 37 fraud rules across 9 attack categories."));

c.push(h2("The Killer Feature: On-Device Call Detection"));
c.push(p("PayGuard's unique differentiator is its ability to detect when a user is on an active phone call while performing a payment or viewing an OTP screen. This catches the #1 fraud vector in African digital payments:"));
c.push(bullet("iOS: CXCallObserver API — privacy-compliant, no call content access"));
c.push(bullet("Android: TelephonyManager.listen(CALL_STATE) — real-time call state monitoring"));
c.push(bullet("OtpGuard: When an unknown caller is detected while the OTP screen is visible, the SDK triggers FLAG_SECURE (blocks screenshots) and displays a full-screen SCAM ALERT overlay"));
c.push(bullet("No global fraud company — not ThreatMetrix, BioCatch, Featurespace, or Shield — captures this signal"));

c.push(h2("Fraud Rules Engine — 37 Rules Across 9 Categories"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Category",28),hdr("Rules",8),hdr("Key Detections",64)]}),
  new TableRow({children:[cell("Social Engineering / Vishing"),cell("6",{center:true}),cell("Active call + payment, call + unknown recipient, OTP screen on call, rushed transactions, paste detection")]}),
  new TableRow({children:[cell("SIM Swap & Identity",{bg:LG}),cell("3",{center:true,bg:LG}),cell("SIM swap events, multi-account devices, fraud ring detection via device fingerprinting",{bg:LG})]}),
  new TableRow({children:[cell("Device Intelligence"),cell("4",{center:true}),cell("Root/jailbreak, emulator, app tampering, VPN/proxy detection")]}),
  new TableRow({children:[cell("Behavioural Biometrics",{bg:LG}),cell("3",{center:true,bg:LG}),cell("Typing cadence, touch pressure, scroll velocity, navigation pattern, recipient change frequency",{bg:LG})]}),
  new TableRow({children:[cell("Network & Geolocation"),cell("4",{center:true}),cell("IP-country mismatch, hosting/datacenter IP, IP-device distance, geolocation anomaly (haversine)")]}),
  new TableRow({children:[cell("Compliance / AML",{bg:LG}),cell("3",{center:true,bg:LG}),cell("Velocity/structuring (FICA/CBN thresholds), beneficiary network risk (mule detection), cooling-off periods",{bg:LG})]}),
  new TableRow({children:[cell("AI-Powered Detection"),cell("6",{center:true}),cell("Voice deepfake shield, liveness spoofing guard, synthetic identity detector, AI caller detection, remote access blocker, document forgery scanner")]}),
  new TableRow({children:[cell("USSD / Feature Phone",{bg:LG}),cell("8",{center:true,bg:LG}),cell("SIM swap + high value, velocity, beneficiary network, cell tower anomaly, new subscriber, rapid session automation",{bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(h2("Production Architecture"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Component",20),hdr("Stack",25),hdr("Endpoint / Distribution",35),hdr("Status",20)]}),
  new TableRow({children:[cell("API Gateway"),cell("Node.js, Express, TS"),cell("api.payguard.africa"),cell("🟢 Live",{color:G})]}),
  new TableRow({children:[cell("Risk Engine",{bg:LG}),cell("Python, FastAPI",{bg:LG}),cell("risk-engine.up.railway.app",{bg:LG}),cell("🟢 Live",{color:G,bg:LG})]}),
  new TableRow({children:[cell("Device Binding"),cell("Node.js, Express"),cell("device-binding.up.railway.app"),cell("🟢 Live",{color:G})]}),
  new TableRow({children:[cell("iOS SDK",{bg:LG}),cell("Swift, CXCallObserver",{bg:LG}),cell("CocoaPods / SPM",{bg:LG}),cell("🟢 Built",{color:G,bg:LG})]}),
  new TableRow({children:[cell("Android SDK"),cell("Kotlin, TelephonyManager"),cell("Maven / Gradle"),cell("🟢 Built",{color:G})]}),
  new TableRow({children:[cell("JS SDK",{bg:LG}),cell("TypeScript",{bg:LG}),cell("npm: @swifter/fraud-shield",{bg:LG}),cell("🟢 Published",{color:G,bg:LG})]}),
  new TableRow({children:[cell("Dashboard"),cell("React, TypeScript, Vite"),cell("payguard.africa"),cell("🟢 Live",{color:G})]}),
  new TableRow({children:[cell("CI/CD",{bg:LG}),cell("GitHub Actions",{bg:LG}),cell("4-job pipeline (lint, test, build, deploy)",{bg:LG}),cell("🟢 Live",{color:G,bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(pb());

// ════════════════════════════ 4. SWIFTER SEND ════════════════════════════
c.push(h1("4. Flagship: Swifter Send — Cross-Border Payments"));
c.push(mp([
  {text:"STATUS: ",bold:true,color:GY},
  {text:"🟢 LIVE — Platform deployed, 20+ corridors, API operational",bold:true,color:G},
]));
c.push(p("Swifter Send enables instant, low-cost cross-border money transfers using stablecoin settlement rails. Instead of routing through correspondent banks (SWIFT), transfers settle via ZAR → USDC → Local Currency in under 60 seconds."));

c.push(h2("Key Metrics"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Metric",40),hdr("Traditional",30),hdr("Swifter Send",30)]}),
  new TableRow({children:[cell("Settlement Time"),cell("3-5 business days"),cell("<60 seconds",{color:G,bold:true})]}),
  new TableRow({children:[cell("Total Cost",{bg:LG}),cell("8-12%",{bg:LG}),cell("1.5-3%",{color:G,bold:true,bg:LG})]}),
  new TableRow({children:[cell("Countries"),cell("Varies by bank"),cell("20+ African countries",{bold:true})]}),
  new TableRow({children:[cell("API Integration",{bg:LG}),cell("Weeks-months",{bg:LG}),cell("Single REST API",{color:G,bold:true,bg:LG})]}),
],width:{size:70,type:WidthType.PERCENTAGE}}));

c.push(h2("Key Features"));
c.push(bullet("Multi-corridor support: ZAR, USD, GBP, EUR, KES, NGN, GHS, UGX, TZS, MWK, ZMW, BWP, and more"));
c.push(bullet("Real-time FX aggregation with best-rate selection across multiple liquidity providers"));
c.push(bullet("Mobile money, bank transfer, and cash pickup payout methods"));
c.push(bullet("Automated BOP code classification for SARB reporting (B2B)"));
c.push(bullet("B2B API for banks and fintechs to embed cross-border payments under their own brand"));
c.push(bullet("Built-in KYC/AML compliance per transaction — no separate compliance integration needed"));
c.push(bullet("Live dashboard with corridor analytics and real-time transaction tracking"));

c.push(pb());

// ════════════════════════════ 5. FULL PRODUCT PORTFOLIO ════════════════════════════
c.push(h1("5. Full Product Portfolio — 16 Products"));
c.push(p("Every product was built by a single engineer over 18 months. The portfolio spans payments, fraud prevention, identity, DeFi, enterprise tools, and AI — all interconnected on shared infrastructure."));

c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Product",17),hdr("Category",10),hdr("Status",8),hdr("Done",7),hdr("Files",7),hdr("What's Built",51)]}),
  new TableRow({children:[cell("Swifter Send"),cell("Payments"),cell("🟢 Live",{center:true}),cell("90%",{center:true,color:G,bold:true}),cell("176+",{center:true}),cell("Full-stack: website, API, dashboard, FX engine, KYC, multi-provider routing. Railway + Vercel.")]}),
  new TableRow({children:[cell("PayGuard",{bg:LG}),cell("Security",{bg:LG}),cell("🟢 Live",{center:true,bg:LG}),cell("85%",{center:true,color:G,bold:true,bg:LG}),cell("71+SDK",{center:true,bg:LG}),cell("3 microservices, 37 rules, iOS/Android/JS SDKs, dashboard, CI/CD. Railway.",{bg:LG})]}),
  new TableRow({children:[cell("Swifter ID"),cell("Identity"),cell("🟢 Live",{center:true}),cell("80%",{center:true,color:G,bold:true}),cell("138",{center:true}),cell("eKYC: document verification (15+ countries), biometric liveness, sanctions/PEP, KYB.")]}),
  new TableRow({children:[cell("B2B Payments",{bg:LG}),cell("Payments",{bg:LG}),cell("🟢 Live",{center:true,bg:LG}),cell("85%",{center:true,color:G,bold:true,bg:LG}),cell("Shared",{center:true,bg:LG}),cell("Invoicing, multi-currency settlement, BOP codes, KYB wizard. On swifter.digital.",{bg:LG})]}),
  new TableRow({children:[cell("Smart Routing"),cell("Intelligence"),cell("🟢 Live",{center:true}),cell("85%",{center:true,color:G,bold:true}),cell("Embed",{center:true}),cell("AI corridor selection, multi-variable optimization, auto-failover.")]}),
  new TableRow({children:[cell("FX Intelligence",{bg:LG}),cell("Intelligence",{bg:LG}),cell("🟢 Live",{center:true,bg:LG}),cell("85%",{center:true,color:G,bold:true,bg:LG}),cell("Embed",{center:true,bg:LG}),cell("Real-time rate aggregation, best-rate selection, rate locking.",{bg:LG})]}),
  new TableRow({children:[cell("Connectivity"),cell("Infra"),cell("🟢 Live",{center:true}),cell("80%",{center:true,color:G,bold:true}),cell("Embed",{center:true}),cell("Partner API gateway, 15+ provider integrations, health monitoring.")]}),
  new TableRow({children:[cell("Stablecoin Lending",{bg:LG}),cell("DeFi",{bg:LG}),cell("🟡 Beta",{center:true,bg:LG}),cell("75%",{center:true,color:O,bold:true,bg:LG}),cell("133",{center:true,bg:LG}),cell("Solana smart contracts (Rust/Anchor), Pyth oracle, auto-liquidation, ZAR disbursement.",{bg:LG})]}),
  new TableRow({children:[cell("Chatbanking"),cell("Channels"),cell("🟡 Beta",{center:true}),cell("65%",{center:true,color:O,bold:true}),cell("33",{center:true}),cell("WhatsApp Business API, conversational banking, send money, balance checks.")]}),
  new TableRow({children:[cell("PayStream",{bg:LG}),cell("Payments",{bg:LG}),cell("🟡 Beta",{center:true,bg:LG}),cell("60%",{center:true,color:O,bold:true,bg:LG}),cell("Shared",{center:true,bg:LG}),cell("Batch payroll API, CSV upload, multi-country disbursement for gig economy.",{bg:LG})]}),
  new TableRow({children:[cell("AI Agents"),cell("Intelligence"),cell("🟡 Beta",{center:true}),cell("50%",{center:true,color:O,bold:true}),cell("Shared",{center:true}),cell("Compliance screening, ops monitoring, support agents. Framework built.")]}),
  new TableRow({children:[cell("Trade Finance",{bg:LG}),cell("Payments",{bg:LG}),cell("🔵 Dev",{center:true,bg:LG}),cell("40%",{center:true,color:A,bg:LG}),cell("Shared",{center:true,bg:LG}),cell("Smart contract escrow, milestone release. Built on stablecoin base.",{bg:LG})]}),
  new TableRow({children:[cell("Swifter ERP"),cell("Enterprise"),cell("🔵 Dev",{center:true}),cell("30%",{center:true,color:A}),cell("8",{center:true}),cell("Invoicing module, expense tracking. Architecture designed.")]}),
  new TableRow({children:[cell("Crypto-as-a-Service",{bg:LG}),cell("DeFi",{bg:LG}),cell("⚪ Road",{center:true,bg:LG}),cell("20%",{center:true,color:GY,bg:LG}),cell("Design",{center:true,bg:LG}),cell("White-label on/off-ramp for banks. API spec written.",{bg:LG})]}),
  new TableRow({children:[cell("AI Insights"),cell("Intelligence"),cell("⚪ Road",{center:true}),cell("15%",{center:true,color:GY}),cell("Design",{center:true}),cell("Predictive analytics, corridor demand forecasting. Framework designed.")]}),
  new TableRow({children:[cell("Network Intel",{bg:LG}),cell("Intelligence",{bg:LG}),cell("⚪ Road",{center:true,bg:LG}),cell("10%",{center:true,color:GY,bg:LG}),cell("Design",{center:true,bg:LG}),cell("Partner health scoring, risk monitoring. Concept stage.",{bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));
c.push(p("Total: 8 Live · 4 Beta · 2 In Development · 2 Roadmap · 700+ source files audited", {bold:true, color:A}));

c.push(pb());

// ════════════════════════════ 6. COMPETITIVE LANDSCAPE ════════════════════════════
c.push(h1("6. Competitive Landscape"));
c.push(h2("PayGuard vs Global Fraud Platforms"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("",30),hdr("PayGuard",14),hdr("ThreatMetrix",14),hdr("BioCatch",14),hdr("Featurespace",14),hdr("Shield",14)]}),
  new TableRow({children:[cell("On-device call detection"),cell("✅",{center:true,color:G}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R})]}),
  new TableRow({children:[cell("OTP screen protection",{bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG})]}),
  new TableRow({children:[cell("Voice deepfake detection"),cell("✅",{center:true,color:G}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R})]}),
  new TableRow({children:[cell("USSD channel rules",{bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG})]}),
  new TableRow({children:[cell("Africa-specific patterns"),cell("✅",{center:true,color:G}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R})]}),
  new TableRow({children:[cell("Native mobile SDKs",{bg:LG}),cell("✅ 3 SDKs",{center:true,color:G,bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("✅",{center:true,color:G,bg:LG})]}),
  new TableRow({children:[cell("Pricing (per API call)"),cell("$0.01",{center:true,color:G,bold:true}),cell("$0.05-0.15",{center:true}),cell("$0.03-0.10",{center:true}),cell("$0.05-0.10",{center:true}),cell("$0.02-0.05",{center:true})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(h2("Swifter Send vs Remittance Competitors"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("",28),hdr("Swifter Send",15),hdr("Wise",12),hdr("Chipper Cash",14),hdr("WorldRemit",14),hdr("Thunes",12)]}),
  new TableRow({children:[cell("Stablecoin rails"),cell("✅",{center:true,color:G}),cell("❌",{center:true,color:R}),cell("✅ Partial",{center:true}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R})]}),
  new TableRow({children:[cell("Sub-60s settlement",{bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("✅",{center:true,color:G,bg:LG})]}),
  new TableRow({children:[cell("B2B + B2C platform"),cell("✅",{center:true,color:G}),cell("✅",{center:true,color:G}),cell("❌ B2C only",{center:true}),cell("❌ B2C only",{center:true}),cell("✅ B2B only",{center:true})]}),
  new TableRow({children:[cell("White-label API",{bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("✅",{center:true,color:G,bg:LG})]}),
  new TableRow({children:[cell("Built-in fraud prevention"),cell("✅ PayGuard",{center:true,color:G}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R})]}),
  new TableRow({children:[cell("Cost",{bg:LG}),cell("1.5-3%",{center:true,color:G,bold:true,bg:LG}),cell("1-3%",{center:true,bg:LG}),cell("2-4%",{center:true,bg:LG}),cell("3-5%",{center:true,bg:LG}),cell("B2B pricing",{center:true,bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(pb());

// ════════════════════════════ 7. TECHNOLOGY ════════════════════════════
c.push(h1("7. Technology & Architecture"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Layer",25),hdr("Technology",75)]}),
  new TableRow({children:[cell("Frontend"),cell("React, TypeScript, Vite, Framer Motion — deployed on Vercel")]}),
  new TableRow({children:[cell("Backend APIs",{bg:LG}),cell("Node.js (Express), Python (FastAPI) — deployed on Railway",{bg:LG})]}),
  new TableRow({children:[cell("Databases"),cell("PostgreSQL (managed), Redis (caching/sessions), Neo4j (graph)")]}),
  new TableRow({children:[cell("Smart Contracts",{bg:LG}),cell("Rust (Anchor/Solana), Pyth Oracle integration",{bg:LG})]}),
  new TableRow({children:[cell("Mobile SDKs"),cell("Swift (iOS), Kotlin (Android), TypeScript (npm)")]}),
  new TableRow({children:[cell("AI/ML",{bg:LG}),cell("ONNX models (on-device), FastAPI classifiers (server-side)",{bg:LG})]}),
  new TableRow({children:[cell("Infrastructure"),cell("Railway (microservices), Vercel (frontend), GitHub Actions (CI/CD)")]}),
  new TableRow({children:[cell("Security",{bg:LG}),cell("Hardware-backed device binding (Secure Enclave / Keystore), HMAC-SHA256, TLS 1.3",{bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

// ════════════════════════════ 8. BUSINESS MODEL ════════════════════════════
c.push(h1("8. Business Model & Revenue"));
c.push(h2("PayGuard Revenue"));
c.push(bullet("Per-API-call pricing: $0.008–$0.01 per risk score API call"));
c.push(bullet("Monthly platform fee: $500–$2,000 per client depending on tier"));
c.push(bullet("Enterprise: custom pricing with SLA, dedicated support, custom AI models"));
c.push(bullet("Target: 10 bank/fintech clients × 500K monthly API calls = $50K MRR within 12 months"));

c.push(h2("Swifter Send Revenue"));
c.push(bullet("Transaction fee: 0.5–1.5% of transfer value (paid by sender or split)"));
c.push(bullet("FX spread: 0.3–0.8% margin on exchange rate"));
c.push(bullet("B2B API: monthly platform fee + per-transaction pricing"));
c.push(bullet("Target: $150K+ MRR within 18 months via B2B API clients"));

c.push(h2("Platform Synergy"));
c.push(p("Each product reinforces the others:"));
c.push(bullet("Swifter Send + PayGuard = every remittance is fraud-scored (the remittance generates fraud data, fraud prevention makes remittances safer)"));
c.push(bullet("Swifter Send + Swifter ID = automated KYC at onboarding with ongoing monitoring"));
c.push(bullet("PayStream + Smart Routing = payroll batches route through cheapest, fastest corridor"));
c.push(bullet("Chatbanking + Swifter Send = reach 60% of Africans without banking apps"));

c.push(pb());

// ════════════════════════════ 9. MARKET OPPORTUNITY ════════════════════════════
c.push(h1("9. Market Opportunity"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Market",35),hdr("Size",20),hdr("Source",25),hdr("Swifter's Play",20)]}),
  new TableRow({children:[cell("African digital fraud losses"),cell("$4B+ / year"),cell("Interpol 2024"),cell("PayGuard")]}),
  new TableRow({children:[cell("African remittances",{bg:LG}),cell("$48B / year",{bg:LG}),cell("World Bank 2024",{bg:LG}),cell("Swifter Send",{bg:LG})]}),
  new TableRow({children:[cell("Mobile money transactions"),cell("$1.26T / year"),cell("GSMA 2024"),cell("PayGuard + Send")]}),
  new TableRow({children:[cell("African trade finance gap",{bg:LG}),cell("$120B / year",{bg:LG}),cell("AfDB 2024",{bg:LG}),cell("Trade Finance",{bg:LG})]}),
  new TableRow({children:[cell("Fraud prevention SaaS (global)"),cell("$35B by 2028"),cell("MarketsandMarkets"),cell("PayGuard")]}),
  new TableRow({children:[cell("African SMEs (formal + informal)",{bg:LG}),cell("44M businesses",{bg:LG}),cell("IFC 2024",{bg:LG}),cell("ERP + Send",{bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

// ════════════════════════════ 10. FOUNDER ════════════════════════════
c.push(h1("10. The Team & Founder"));
c.push(h2("Malcolm Govender — Founder & CEO"));
c.push(p("Solo technical founder who designed, built, and deployed the entire Swifter platform over 18 months — bootstrapped with zero external funding."));
c.push(bullet("16 products built across payments, fraud prevention, identity verification, DeFi, and enterprise tools"));
c.push(bullet("700+ source files audited across the codebase"));
c.push(bullet("Full-stack capability: frontend (React), backend (Node.js, Python, FastAPI), mobile SDKs (Swift, Kotlin), smart contracts (Rust/Solana), infrastructure (Railway, Vercel, Docker, CI/CD)"));
c.push(bullet("Deep understanding of African payment infrastructure, regulatory landscape, and fraud patterns"));
c.push(bullet("Production deployment experience: 3 microservices on Railway, frontend on Vercel, CI/CD via GitHub Actions"));

c.push(h2("Team Plan (Post-Funding)"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Role",25),hdr("Priority",15),hdr("Why",60)]}),
  new TableRow({children:[cell("CTO / Senior Backend"),cell("Immediate"),cell("Scale backend services, add GraphQL API layer, optimize risk engine performance")]}),
  new TableRow({children:[cell("Head of Sales / BD",{bg:LG}),cell("Immediate",{bg:LG}),cell("Enterprise bank and MNO sales, partnership development across SA and EA",{bg:LG})]}),
  new TableRow({children:[cell("Mobile Engineer"),cell("Month 2"),cell("Maintain and enhance iOS and Android SDKs, add React Native support")]}),
  new TableRow({children:[cell("ML / AI Engineer",{bg:LG}),cell("Month 3",{bg:LG}),cell("Train fraud detection models, enhance deepfake detection, build anomaly classifiers",{bg:LG})]}),
  new TableRow({children:[cell("Compliance Officer"),cell("Month 3"),cell("Navigate SARB, FSCA, CBN regulatory requirements, manage licensing")]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(pb());

// ════════════════════════════ 11. FUNDING ASK ════════════════════════════
c.push(h1("11. Funding Ask & Use of Funds"));
c.push(h2("The Ask: $250K – $500K Pre-Seed / Seed"));

c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Use of Funds",40),hdr("Allocation",15),hdr("Details",45)]}),
  new TableRow({children:[cell("Team Expansion"),cell("40%",{center:true,bold:true}),cell("CTO, Head of Sales/BD, Mobile Engineer, ML Engineer")]}),
  new TableRow({children:[cell("Commercial Launch",{bg:LG}),cell("25%",{center:true,bold:true,bg:LG}),cell("Sales collateral, pilot programmes with 3-5 banks, conference attendance",{bg:LG})]}),
  new TableRow({children:[cell("Regulatory & Compliance"),cell("15%",{center:true,bold:true}),cell("SARB authorization, FSCA licensing, POPIA compliance, security audit")]}),
  new TableRow({children:[cell("Infrastructure & Ops",{bg:LG}),cell("12%",{center:true,bold:true,bg:LG}),cell("Production scaling, monitoring, disaster recovery, SLA guarantees",{bg:LG})]}),
  new TableRow({children:[cell("Working Capital"),cell("8%",{center:true,bold:true}),cell("18-month runway buffer, legal, accounting")]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(h2("Milestones This Investment Unlocks"));
c.push(bullet("Month 1-3: First 3 paying enterprise clients (PayGuard pilot + Swifter Send API)"));
c.push(bullet("Month 3-6: First $25K MRR, 5+ bank/fintech clients, regulatory applications filed"));
c.push(bullet("Month 6-12: $100K+ MRR, East African market entry, Series A readiness"));

// ════════════════════════════ 12. ROADMAP ════════════════════════════
c.push(h1("12. Roadmap & Milestones"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Timeline",15),hdr("Product Milestone",40),hdr("Business Milestone",45)]}),
  new TableRow({children:[cell("Q2 2026"),cell("PayGuard + Swifter Send commercial launch"),cell("First 3 enterprise pilot clients in SA")]}),
  new TableRow({children:[cell("Q3 2026",{bg:LG}),cell("Stablecoin Lending mainnet, Chatbanking WhatsApp launch",{bg:LG}),cell("$25K MRR, regulatory applications submitted",{bg:LG})]}),
  new TableRow({children:[cell("Q4 2026"),cell("PayStream payroll launch, AI Agents v2"),cell("East Africa expansion (KE, NG), 10+ clients")]}),
  new TableRow({children:[cell("Q1 2027",{bg:LG}),cell("Trade Finance, Crypto-as-a-Service beta",{bg:LG}),cell("$100K+ MRR, Series A preparation",{bg:LG})]}),
  new TableRow({children:[cell("Q2 2027"),cell("Full platform integration, ERP launch"),cell("Series A raise, 20+ enterprise clients")]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(pb());

// ════════════════════════════ 13. LIVE LINKS ════════════════════════════
c.push(h1("13. Live Product Links & Demos"));
c.push(p("These are live, production-deployed products you can test right now:"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Resource",30),hdr("URL",40),hdr("What You'll See",30)]}),
  new TableRow({children:[cell("Swifter Send Website"),cell("https://swifter.digital"),cell("Full product site + corridors")]}),
  new TableRow({children:[cell("PayGuard Dashboard",{bg:LG}),cell("https://payguard.africa",{bg:LG}),cell("Admin dashboard (login)",{bg:LG})]}),
  new TableRow({children:[cell("PayGuard Interactive Demo"),cell("https://payguard.africa/demo"),cell("7 fraud scenario walkthroughs")]}),
  new TableRow({children:[cell("API Health (live)",{bg:LG}),cell("https://api.payguard.africa/health",{bg:LG}),cell("Hit it now — returns JSON",{bg:LG})]}),
  new TableRow({children:[cell("API Documentation"),cell("https://swifter.digital/developer-docs"),cell("OpenAPI 3.0 specs, all products")]}),
  new TableRow({children:[cell("SDK Demo",{bg:LG}),cell("https://swifter.digital/demos",{bg:LG}),cell("SDK integration examples",{bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(new Paragraph({spacing:{before:400}}));
c.push(new Paragraph({children:[new TextRun({text:"Thank you for your consideration.",size:24,color:A,font:"Calibri",italics:true})],alignment:AlignmentType.CENTER,spacing:{after:200}}));
c.push(new Paragraph({children:[new TextRun({text:"Malcolm Govender",size:24,bold:true,color:N,font:"Calibri"})],alignment:AlignmentType.CENTER}));
c.push(new Paragraph({children:[new TextRun({text:"Founder & CEO, Swifter Technologies (Pty) Ltd",size:20,color:GY,font:"Calibri"})],alignment:AlignmentType.CENTER}));
c.push(new Paragraph({children:[new TextRun({text:"malcolm@swifter.digital  |  +27 83 465 4639",size:20,color:A,font:"Calibri"})],alignment:AlignmentType.CENTER}));
c.push(new Paragraph({children:[new TextRun({text:"swifter.digital  |  payguard.africa",size:20,color:A,font:"Calibri"})],alignment:AlignmentType.CENTER}));

const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [{ children: c }],
});

const buf = await Packer.toBuffer(doc);
const outPath = "C:/Users/616078/Downloads/Swifter_Technologies_-_Kalon_VC_Submission.docx";
fs.writeFileSync(outPath, buf);
console.log("✅ Kalon VC Submission saved:", outPath);
console.log("   Size:", (buf.length / 1024).toFixed(1), "KB");
console.log("   Pages: ~14");
console.log("   Sections: 13");
