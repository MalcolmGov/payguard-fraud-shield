import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType, PageBreak } from "docx";
import fs from "fs";
import path from "path";

const BLUE = "1E3A5F";
const ACCENT = "3B82F6";
const GRAY = "6B7280";
const BLACK = "000000";

function heading(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: opts.size || 28, color: opts.color || BLUE, font: "Calibri" })],
    spacing: { before: opts.spaceBefore || 400, after: 160 },
    border: opts.border ? { bottom: { style: BorderStyle.SINGLE, size: 1, color: ACCENT } } : undefined,
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", color: BLACK, bold: opts.bold, italics: opts.italics })],
    spacing: { after: opts.noSpace ? 40 : 160 },
  });
}

function emailBlock(subject, bodyLines) {
  const children = [];
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "Subject: ", bold: true, size: 22, font: "Calibri", color: GRAY }),
      new TextRun({ text: subject, bold: true, size: 22, font: "Calibri", color: ACCENT }),
    ],
    spacing: { after: 200 },
    shading: { type: ShadingType.SOLID, color: "F3F4F6" },
    indent: { left: 200, right: 200 },
  }));
  
  for (const line of bodyLines) {
    children.push(new Paragraph({
      children: [new TextRun({ text: line, size: 22, font: "Calibri", color: BLACK })],
      spacing: { after: line === "" ? 120 : 80 },
      indent: { left: 200 },
    }));
  }
  return children;
}

const children = [];

// TITLE
children.push(new Paragraph({ spacing: { before: 600 } }));
children.push(new Paragraph({
  children: [new TextRun({ text: "Investor Outreach Emails", size: 48, bold: true, color: BLUE, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Swifter Technologies — Pre-Seed / Seed Round", size: 26, color: GRAY, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Confidential — March 2025", size: 22, color: GRAY, font: "Calibri", italics: true })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 400 },
}));

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 1 — COLD OUTREACH (Africa-focused VC)
// ═══════════════════════════════════════════════════════════════════════════════
children.push(heading("Email 1 — Cold Outreach (Africa-Focused VC)", { border: true }));
children.push(body("Best for: Founders Factory Africa, Norrsken22, Lateral Capital, TLcom, 4DX Ventures, Algebra Ventures", { italics: true }));
children.push(...emailBlock(
  "Solo-built fintech infrastructure for Africa — seeking strategic partner to scale",
  [
    "Hi [Name],",
    "",
    "I'm Malcolm, the founder and sole engineer behind Swifter Technologies. Over the past 18 months, I've single-handedly designed, built, and deployed two fintech platforms that solve critical infrastructure gaps across Africa:",
    "",
    "1. Swifter Send — A cross-border remittance platform with real-time FX, multi-corridor support, and full API integration for banks and fintechs. Built from scratch: React frontend, Node.js/NestJS backend, PostgreSQL, deployed on Railway.",
    "",
    "2. PayGuard — A real-time fraud prevention engine with 35+ detection rules (vishing, SIM swap, OTP phishing, deepfake voice), native iOS and Android SDKs, and a graph-based fraud ring detector. Three backend microservices are live on Railway with managed Postgres and Redis. The platform scores transactions in under 100ms.",
    "",
    "Everything is bootstrapped. No funding. No team. I wrote every line of code, designed every screen, and deployed every service myself.",
    "",
    "I'm reaching out because I'm ready to take this from working product to commercial launch — but I can't do the next phase alone. I'm looking for:",
    "",
    "• A strategic partner who understands African fintech distribution",
    "• Pre-seed / seed funding to hire a 3-person engineering team and a commercial lead",
    "• Guidance on regulatory licensing (money transfer, POPIA compliance) and go-to-market",
    "",
    "Africa loses over $4 billion annually to payment fraud, and cross-border transactions still take 3-5 days with 8-12% fees. These products already work — I just need the fuel to launch them commercially.",
    "",
    "Would you be open to a 20-minute call? I can walk you through a live demo of both platforms.",
    "",
    "Best regards,",
    "Malcolm Gillespie",
    "Founder & CEO, Swifter Technologies",
    "malcolm@swifter.co.za | payguard.africa | swifter.digital",
  ]
));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 2 — WARM / INTRO REQUEST
// ═══════════════════════════════════════════════════════════════════════════════
children.push(heading("Email 2 — Shorter / Warm Intro Version", { border: true }));
children.push(body("Best for: When someone is making an introduction on your behalf, or for busy investors who prefer brevity", { italics: true }));
children.push(...emailBlock(
  "Bootstrapped solo founder — two live fintech products for Africa, seeking first cheque",
  [
    "Hi [Name],",
    "",
    "I'm Malcolm from Swifter Technologies. I've spent the last 18 months bootstrapping two fintech products — alone — that are now live and production-ready:",
    "",
    "• Swifter Send: Cross-border remittance infrastructure (B2B API + consumer app)",
    "• PayGuard: Real-time fraud prevention with 35+ rules, mobile SDKs, and <100ms scoring",
    "",
    "Both platforms are fully built — React dashboards deployed on Vercel, backend microservices running on Railway, with PostgreSQL, Redis, Kafka, and Neo4j in the stack. You can try the live demo at payguard.africa/demo.",
    "",
    "I'm looking for a pre-seed partner who can help me:",
    "1. Hire my first 3 engineers and a commercial lead",
    "2. Navigate licensing and compliance for money movement",
    "3. Connect me to pilot banks and fintechs across Southern and East Africa",
    "",
    "The market is massive ($4B+ annual fraud losses, $48B remittance flows to Africa), and I've built the product. I just need the right partner to help me sell it.",
    "",
    "Happy to jump on a quick call or send a deck. What works best for you?",
    "",
    "Malcolm Gillespie",
    "malcolm@swifter.co.za | +27 XX XXX XXXX",
  ]
));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 3 — FOLLOW-UP
// ═══════════════════════════════════════════════════════════════════════════════
children.push(heading("Email 3 — Follow-Up (5 Days After No Reply)", { border: true }));
children.push(body("Send 5-7 business days after Email 1 or 2 with no response", { italics: true }));
children.push(...emailBlock(
  "Re: Solo-built fintech infrastructure for Africa",
  [
    "Hi [Name],",
    "",
    "Just floating this back up — I know your inbox moves fast.",
    "",
    "Since my last note, I've deployed all backend services to production and completed the Android SDK. The full stack is now live:",
    "",
    "• API Gateway: api.payguard.africa/health (try it — returns JSON)",
    "• Risk Engine: 35+ fraud rules scoring in real-time",
    "• Device Binding: Android Keystore + iOS Keychain hardware-backed tokens",
    "• Interactive demo: payguard.africa/demo",
    "",
    "Still looking for the right pre-seed partner to help me take this from working product to commercial launch across Africa.",
    "",
    "Worth a 15-minute chat?",
    "",
    "Malcolm",
  ]
));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL 4 — ACCELERATOR / PROGRAMME APPLICATION
// ═══════════════════════════════════════════════════════════════════════════════
children.push(heading("Email 4 — Accelerator / Programme Application", { border: true }));
children.push(body("Best for: Y Combinator, Techstars, Founders Factory Africa, Google for Startups, Plug and Play", { italics: true }));
children.push(...emailBlock(
  "Application: Solo founder with two live fintech products for Africa",
  [
    "Hi [Programme Team],",
    "",
    "I'm applying to [Programme Name] because I believe I've built something meaningful — but I need help turning it into a business.",
    "",
    "My name is Malcolm Gillespie. I'm a South African software engineer who has spent the last 18 months building two fintech platforms entirely alone — no co-founder, no team, no funding:",
    "",
    "SWIFTER SEND — Cross-border remittance infrastructure",
    "• Multi-corridor support (ZAR, USD, GBP, EUR, KES, NGN, GHS)",
    "• Real-time FX rates with transparent fee structure",
    "• B2B API for banks and fintechs + consumer web app",
    "• Full compliance documentation (POPIA DPA, SLA)",
    "",
    "PAYGUARD — Real-time fraud prevention platform",
    "• 35+ fraud detection rules (social engineering, SIM swap, deepfake voice, OTP phishing)",
    "• Native iOS SDK (Swift) and Android SDK (Kotlin) with on-device call detection",
    "• OTP Guard — detects when a user is on a phone call while viewing their OTP screen",
    "• Graph-based fraud ring detection using Neo4j",
    "• Three microservices deployed on Railway (API Gateway, Risk Engine, Device Binding)",
    "• <100ms risk scoring latency, fail-secure offline mode",
    "",
    "THE MARKET:",
    "• Africa loses $4B+ annually to payment fraud (Interpol, 2024)",
    "• $48B in annual remittance flows to Sub-Saharan Africa (World Bank)",
    "• 70% of mobile money fraud in Africa involves social engineering during phone calls — PayGuard is the only platform that detects this signal natively",
    "",
    "WHAT I NEED:",
    "• Product-market fit validation with 2-3 pilot bank customers",
    "• Mentorship on go-to-market strategy and regulatory licensing",
    "• $150K-$500K to hire my first engineering team (3 devs + 1 commercial lead)",
    "• Access to your network of African banks, fintechs, and mobile money operators",
    "",
    "WHY ME:",
    "I built everything you see — every API endpoint, every database migration, every SDK signal collector, every dashboard component — in 18 months, on my own. The products work. They're deployed. They have live health endpoints you can hit right now. What I lack is distribution, regulatory guidance, and a team.",
    "",
    "I'd welcome the chance to demo both products and discuss how [Programme Name] can help me bring them to market.",
    "",
    "Malcolm Gillespie",
    "Founder & CEO, Swifter Technologies (Pty) Ltd",
    "malcolm@swifter.co.za | payguard.africa | swifter.digital",
  ]
));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ═══════════════════════════════════════════════════════════════════════════════
// SPEAKING POINTS
// ═══════════════════════════════════════════════════════════════════════════════
children.push(heading("Key Talking Points for Calls", { border: true, size: 32 }));
children.push(body("YOUR STORY (2 minutes):", { bold: true }));
children.push(body("\"I'm a solo technical founder from South Africa. Over the last 18 months, I've bootstrapped two fintech platforms from zero — Swifter Send for cross-border payments and PayGuard for real-time fraud prevention. Every line of code, every design, every deployment — all me. No funding, no team. The products are live and working. I'm here because I've proven I can build — now I need a partner to help me sell.\""));
children.push(body("THE PROBLEM (1 minute):", { bold: true }));
children.push(body("\"Africa processes $48 billion in annual remittances, but transfers still take 3-5 days and cost 8-12% in fees. Meanwhile, $4 billion is lost annually to payment fraud — and 70% of mobile money fraud starts with a phone call where someone is coached to send money. No existing fraud solution detects that phone call signal on-device in real-time. PayGuard does.\""));
children.push(body("THE ASK (30 seconds):", { bold: true }));
children.push(body("\"I'm raising a pre-seed round of $250K-$500K to hire 3 engineers and a commercial lead, secure our first 2-3 pilot bank customers, and obtain the necessary regulatory licenses to operate Swifter Send in South Africa and Kenya. I'm looking for investors who can also open doors to banks and mobile money operators across the continent.\""));
children.push(body("TRACTION / PROOF (30 seconds):", { bold: true }));
children.push(body("\"Both products are deployed and operational. You can hit api.payguard.africa/health right now and get a JSON response from our live risk engine. The PayGuard dashboard is at payguard.africa with interactive fraud scenario demos. The codebase includes 35+ fraud detection rules, native iOS and Android SDKs, CI/CD pipelines, and legal documentation including a POPIA-compliant Data Processing Agreement and Service Level Agreement.\""));

children.push(new Paragraph({ spacing: { before: 400 } }));
children.push(body("— End of Document —", { italics: true }));

// ── GENERATE ───────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [{ children }],
});

const outPath = path.join("C:", "Users", "616078", "Downloads", "Investor_Outreach_Emails.docx");
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log("✅ Investor outreach emails saved to:", outPath);
console.log("   File size:", (buffer.length / 1024).toFixed(1), "KB");
