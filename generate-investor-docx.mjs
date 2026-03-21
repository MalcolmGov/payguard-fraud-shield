import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType } from "docx";
import fs from "fs";
import path from "path";

const BLUE = "1E3A5F";
const LB = "E8F0FE";
const ACCENT = "3B82F6";
const RED = "DC2626";
const ORANGE = "F59E0B";
const GREEN = "16A34A";
const PURPLE = "7C3AED";
const GRAY = "6B7280";
const WHITE = "FFFFFF";
const BLACK = "000000";

const tb = { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" };
const borders = { top: tb, bottom: tb, left: tb, right: tb };

const hc = (t) => new TableCell({ shading: { type: ShadingType.SOLID, color: BLUE }, borders, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: WHITE, size: 20, font: "Calibri" })], spacing: { before: 60, after: 60 }, indent: { left: 120 } })] });
const c = (t, o = {}) => new TableCell({ shading: o.bg ? { type: ShadingType.SOLID, color: o.bg } : undefined, borders, width: o.w ? { size: o.w, type: WidthType.PERCENTAGE } : undefined, children: [new Paragraph({ children: [new TextRun({ text: t, size: 20, font: "Calibri", bold: o.b, color: o.c || BLACK, italics: o.i })], spacing: { before: 40, after: 40 }, indent: { left: 120 } })] });

const sec = (t, col = BLUE) => new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 32, color: col, font: "Calibri" })], spacing: { before: 500, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } } });
const sub = (t, col = BLUE) => new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 26, color: col, font: "Calibri" })], spacing: { before: 350, after: 100 } });
const p = (t, o = {}) => new Paragraph({ children: [new TextRun({ text: t, size: o.s || 22, font: "Calibri", color: o.c || BLACK, bold: o.b, italics: o.i })], spacing: { before: o.sb || 0, after: o.sa || 80 } });

function investorTable(rows) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
    new TableRow({ children: [hc("Investor"), hc("Fund Size / Stage"), hc("Why Relevant for PayGuard"), hc("Contact / Website")] }),
    ...rows.map(r => new TableRow({ children: [c(r[0], { b: true, w: 20 }), c(r[1], { w: 20 }), c(r[2], { w: 40 }), c(r[3], { w: 20 })] }))
  ]});
}

function companyTable(rows) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
    new TableRow({ children: [hc("Company"), hc("Valuation / Revenue"), hc("Acquisition Signal"), hc("Why PayGuard Fits"), hc("Website")] }),
    ...rows.map(r => new TableRow({ children: [c(r[0], { b: true, w: 15 }), c(r[1], { w: 15 }), c(r[2], { w: 25 }), c(r[3], { w: 30 }), c(r[4], { w: 15 })] }))
  ]});
}

const ch = [];

// Title
ch.push(new Paragraph({ spacing: { before: 1500 } }));
ch.push(new Paragraph({ children: [new TextRun({ text: "PayGuard", size: 72, bold: true, color: ACCENT, font: "Calibri" })], alignment: AlignmentType.CENTER }));
ch.push(new Paragraph({ children: [new TextRun({ text: "Investor & Acquirer Research Report", size: 40, color: BLUE, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
ch.push(new Paragraph({ children: [new TextRun({ text: "Investment Opportunities · Strategic Acquirers · Partnership Targets", size: 24, color: GRAY, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
ch.push(new Paragraph({ children: [new TextRun({ text: "March 2026 — Confidential", size: 22, color: GRAY, font: "Calibri" })], alignment: AlignmentType.CENTER }));

// Executive Summary
ch.push(sec("Executive Summary"));
ch.push(p("PayGuard is seeking investment to take its production-ready fraud detection platform to market, or a strategic buyer/partner for an acquisition or partnership deal. This report identifies 40+ potential investors and acquirers across four categories:", { sa: 200 }));
ch.push(p("1. South African & Africa-focused VCs — Early-stage investors with proven fintech/fraud thesis", { b: true }));
ch.push(p("2. Global Fraud Prevention Companies — Potential strategic acquirers or partners looking to expand into Africa", { b: true }));
ch.push(p("3. Card Networks & Big Tech — Mastercard, Visa, and tech giants actively acquiring fraud companies", { b: true }));
ch.push(p("4. Global VCs & Growth Investors — Firms funding fraud detection at Series A-C", { b: true }));

ch.push(p("Key Market Signal: Africa's digital payment fraud losses exceeded $3 billion annually. Visa invested $12B in fraud tech. Mastercard acquired Recorded Future for $2.65B. NICE is selling Actimize for $1.5-2B. Visa acquired Featurespace. This is a hot sector.", { sa: 200, i: true, c: GRAY }));

// ══════════════════════════════════════════════════
// SECTION 1: SA & AFRICA VCs
// ══════════════════════════════════════════════════
ch.push(sec("1. South African & Africa-Focused VCs", ACCENT));
ch.push(p("These investors have active mandates for fintech, fraud prevention, and cybersecurity startups in Africa.", { i: true, c: GRAY, sa: 200 }));

ch.push(sub("🔴 Highest Priority — Active Fraud/Fintech Investors"));
ch.push(investorTable([
  ["Norrsken22", "$205M fund. Invested in Orca Fraud ($2.35M seed, March 2026), TymeBank", "Already invested in African fraud detection (Orca Fraud). PayGuard's SDK + 35 rules + native mobile SDKs offer superior technology. Could be interested in expanding fraud portfolio.", "norrsken22.com"],
  ["HAVAÍC", "$30M Fund 3. Pre-seed/Seed. Cape Town.", "Led NjiaPay pre-seed. Actively investing in SA fintech. PayGuard is a natural fit for their portfolio.", "havaic.com"],
  ["TLcom Capital", "$154M TIDE Africa II. Seed/Series A. First SA investment Oct 2024.", "Made first SA investment in LittleFish (fintech). PayGuard's fraud detection SDK is exactly the B2B fintech tool they look for.", "tlcomcapital.com"],
  ["AlphaCode (RMI)", "Growth capital. RMI initiative for early-stage financial services.", "Backed by Rand Merchant Investments. Specifically targets early-stage financial services companies. PayGuard's production-ready state is ideal.", "alphacode.club"],
  ["Norrsken Africa Seed", "$100K-$250K. Pre-seed/Seed. SA, Ivory Coast, Nigeria.", "Early-stage arm of Norrsken ecosystem. Pipeline funder — success leads to larger Norrsken22 investment.", "norrskenafricaseed.vc"],
]));

ch.push(sub("🟡 Strong Fit — Fintech-Active SA Investors"));
ch.push(investorTable([
  ["Naspers Foundry", "Seed to Series B. Part of Prosus/Naspers.", "Global internet group with deep pockets. Invested in fintech. PayGuard's Africa focus aligns with Naspers' Africa-first thesis.", "naspersfoundry.com"],
  ["4Di Capital", "Seed/Early-stage. Cape Town.", "Independent tech VC. Co-led Happy Pay pre-seed. Active SA fintech investor.", "4dicapital.com"],
  ["Hlayisani Capital", "R1B+ across 3 funds. Series A. AI, fintech, healthtech.", "Targets Series A companies in AI + fintech — exactly PayGuard's category. R1B+ under management.", "hlayisani.co.za"],
  ["Allan Gray VC", "Seed to Series C. Financial services, fintech, payments.", "One of SA's largest asset managers backing VC. Financial services and payments focus.", "allangray.co.za"],
  ["Raba Partnership", "Pre-seed to Series A. Financial services, fintech, software.", "Explicitly targets financial services + fintech in SA. PayGuard's production state is ahead of typical deal flow.", "rabapartnership.com"],
  ["Kalon Venture Partners", "Growth capital. Portfolio includes Sendmarc (anti-phishing).", "Already invested in cybersecurity (Sendmarc). PayGuard fills the fraud detection gap in their portfolio.", "kalonvp.com"],
  ["E4E Africa", "Early-stage. Impact-focused.", "Co-led Happy Pay's pre-seed. Active early-stage fintech investor.", "e4eafrica.com"],
  ["Partech Africa", "$300M fund. $1M-$15M tickets. Pan-African.", "Huge Africa fund, invested in Yoco. PayGuard's multi-country fraud rules (ZAR/NGN/KES/GHS) match their pan-African thesis.", "partechpartners.com"],
  ["Launch Africa", "Pre-seed/Seed. Pan-African.", "Active early-stage African tech investor. Participated in multiple fintech rounds.", "launchafrica.vc"],
  ["Enza Capital", "Early-stage. Africa-focused.", "Participated in fintech rounds. Growing portfolio.", "enzacapital.com"],
  ["Vumela Fund (FNB)", "SME & tech enterprises. Partnership with FNB.", "Backed Trade Shield (credit risk). FNB connection could lead to a banking pilot for PayGuard.", "vumela.co.za"],
]));

// ══════════════════════════════════════════════════
// SECTION 2: STRATEGIC ACQUIRERS
// ══════════════════════════════════════════════════
ch.push(sec("2. Strategic Acquirers — Fraud Prevention Companies", RED));
ch.push(p("These companies either lack Africa-specific capabilities, don't have call-state/SDK-level detection, or are actively acquiring. PayGuard fills a gap in every case.", { i: true, c: GRAY, sa: 200 }));

ch.push(sub("🔴 Highest Acquisition Probability"));
ch.push(companyTable([
  ["Feedzai", "$2B+ valuation. $352M raised. Series E.", "Acquired DemystData (Apr 2025). Partnered with Mastercard for Consumer Fraud Risk.", "No Africa-specific rules. No on-device SDK. PayGuard adds 35 Africa-tuned rules + native mobile SDKs + USSD channel.", "feedzai.com"],
  ["Sardine", "$145M raised. $70M Series C (Feb 2025). 130% ARR growth.", "Expanding AI risk platform with intelligent agents. Series C = looking for bolt-on acquisitions.", "Sardine focuses on device intelligence — PayGuard adds call-state detection and Africa-specific rules they don't have.", "sardine.ai"],
  ["Socure", "Acquired Effectiv for $136M (Oct 2024). Inc 5000 x4.", "Active acquirer. Bought Effectiv for risk decisioning. Looking to expand beyond identity.", "PayGuard's real-time scoring engine and device binding complement their identity verification.", "socure.com"],
  ["SEON", "$80M raised. Device fingerprinting focus.", "Growing fraud detection company. Device intelligence is their core.", "PayGuard adds the Africa-specific layer (USSD, ZAR/NGN thresholds) SEON doesn't have.", "seon.io"],
  ["NICE Actimize", "$158M operating profit. Parent NICE exploring $1.5-2B sale.", "NICE is ACTIVELY SELLING Actimize. A buyer could pair it with PayGuard's SDK for a complete solution.", "PayGuard's real-time SDK fills Actimize's gap in on-device detection. Could be acquired alongside Actimize by the buyer.", "niceactimize.com"],
]));

ch.push(sub("🟡 Strong Fit — Companies with Africa/Mobile Gap"));
ch.push(companyTable([
  ["Orca Fraud", "$2.35M seed. SA-based. ML on African data.", "Direct competitor but much earlier stage. Co-investment or M&A synergy possible.", "Orca does server-side ML on payment rails. PayGuard adds SDK-level signals (call state, device binding, behavioural) Orca can't access.", "orca-fraud.com"],
  ["Smile ID", "Acquired Appruve. Leading Africa ID verification.", "Actively acquiring (bought Appruve). Expanding from identity into fraud.", "PayGuard adds real-time transaction fraud scoring to complement Smile ID's identity verification.", "usesmileid.com"],
  ["Persona", "$200M Series D (Q2 2025). Identity decisioning.", "Well-funded, expanding into KYB and fraud decisioning.", "PayGuard's behavioural biometrics and transaction scoring complement Persona's document-level identity checks.", "withpersona.com"],
  ["Hawk", "$56M Series C (Q2 2025). AML + fraud.", "Growing AML/fraud platform seeking expansion.", "PayGuard adds mobile SDK-level signals Hawk's server-side platform doesn't capture.", "hawk.ai"],
  ["Inscribe", "$25M Series B. Document fraud detection.", "Expanding fraud detection capabilities.", "PayGuard's RULE_035 (document forgery) overlaps — potential integration or acquisition.", "inscribe.ai"],
]));

// ══════════════════════════════════════════════════
// SECTION 3: CARD NETWORKS & BIG TECH
// ══════════════════════════════════════════════════
ch.push(sec("3. Card Networks & Big Tech", PURPLE));
ch.push(p("Both Mastercard and Visa are spending billions on fraud prevention and are active acquirers. B2B partnerships or acqui-hire are realistic paths.", { i: true, c: GRAY, sa: 200 }));

ch.push(companyTable([
  ["Mastercard", "$7B+ spent on fraud tech. Acquired Recorded Future ($2.65B).", "Invested $200M in MTN Group. Partnered Smile ID (Sep 2025) + Feedzai (Feb 2025) for Africa fraud. MADE Alliance targeting 100M Africans.", "PayGuard's SDK-level detection + USSD channel fills gap in Mastercard's server-side CFR solution. DPA/POPIA compliance ready.", "mastercard.com"],
  ["Visa", "$12B+ spent on fraud tech. Acquired Featurespace (Dec 2024).", "Launched Visa Scam Disruption (VSD) with AI. Expanding fraud tech aggressively. Featurespace was real-time AI — same space as PayGuard.", "PayGuard adds on-device signals (call state, voice deepfake) that Visa's network-level data can't capture. Complementary to Visa Protect suite.", "visa.com"],
  ["Stripe", "Owns Paystack (Africa). Market cap ~$91B.", "Paystack serves Africa. Stripe could offer PayGuard as a fraud add-on for all Paystack merchants across Africa.", "PayGuard SDK integrates at checkout. Stripe/Paystack would gain Africa-specific fraud rules for their merchant base.", "stripe.com"],
]));

// ══════════════════════════════════════════════════
// SECTION 4: GLOBAL VCs & GROWTH
// ══════════════════════════════════════════════════
ch.push(sec("4. Global VCs Funding Fraud Detection", GREEN));
ch.push(p("These investors have recently funded fraud detection companies and understand the category.", { i: true, c: GRAY, sa: 200 }));

ch.push(investorTable([
  ["Activant Capital", "Led Sardine $70M Series C. Growth stage.", "Actively investing in fraud detection at Series B-C. Understands the category deeply.", "activantcapital.com"],
  ["Andreessen Horowitz (a16z)", "Led Sardine Series B. Backed multiple fraud cos.", "Thesis on fraud detection as infrastructure. PayGuard's SDK approach aligns with a16z's platform thesis.", "a16z.com"],
  ["Tiger Global", "Growth investor in fintech/fraud.", "Active VC/growth equity in fintech. Has invested in African tech (Chipper Cash).", "tigerglobal.com"],
  ["Accel", "Early/growth stage. Backed multiple fintech unicorns.", "Strong fintech portfolio. Active in emerging markets.", "accel.com"],
  ["GV (Google Ventures)", "Multi-stage. Backed fraud detection companies.", "Google acquired Wiz for $32B. GV backs security/fraud companies. PayGuard's AI rules appeal to Google's AI thesis.", "gv.com"],
  ["Index Ventures", "Multi-stage. Strong fintech portfolio.", "Backed payments companies globally. Interested in B2B infrastructure.", "indexventures.com"],
  ["QED Investors", "Fintech-specialized VC. Active in emerging markets.", "Fintech-ONLY VC. Invested in global fraud and payments companies. Deep expertise in financial services.", "qedinvestors.com"],
  ["Ribbit Capital", "Fintech-specialized. Early & growth.", "Fintech-focused VC with emerging market thesis. Invested in companies like Nubank.", "ribbitcap.com"],
]));

// ══════════════════════════════════════════════════
// APPROACH STRATEGY
// ══════════════════════════════════════════════════
ch.push(sec("Approach Strategy"));

ch.push(sub("For SA/Africa VCs", ACCENT));
ch.push(p('Pitch: "Production-ready fraud detection SDK with 35 rules, native Android + iOS SDKs, and the only USSD fraud scoring endpoint in Africa. R1.888B SA digital banking fraud in 2024. We need capital to close our first bank pilot and scale."'));
ch.push(p("Key proof points: Working codebase, Africa-tuned thresholds (FICA/CBN), POPIA DPA document, live demo at payguard.africa/demo.", { i: true, c: GRAY }));

ch.push(sub("For Strategic Acquirers", RED));
ch.push(p('Pitch: "We\'ve built what your platform is missing — on-device call-state detection, voice deepfake analysis, and Africa-specific fraud rules for ZAR/NGN/KES/GHS. And we have native Android + iOS SDKs ready to deploy. Acqui-hire us and integrate PayGuard\'s 35 rules into your platform."'));
ch.push(p("Key proof points: 35 rules (vs typical 10-15), native mobile SDKs (not React Native wrappers), USSD channel (unique to PayGuard), AI fraud rules (RULE_030-035).", { i: true, c: GRAY }));

ch.push(sub("For Card Networks", PURPLE));
ch.push(p('Pitch: "Visa invested $12B and Mastercard $7B in fraud — but neither has SDK-level detection that sees the caller\'s voice, the call state, or the device fingerprint during a payment session. PayGuard fills that gap."'));
ch.push(p("Key proof points: Call-state detection (unique), voice deepfake scoring, device binding, behavioural biometrics, USSD channel for feature phones.", { i: true, c: GRAY }));

ch.push(sub("For Global VCs", GREEN));
ch.push(p('Pitch: "Africa loses $3B+ annually to payment fraud. Sardine raised $70M, Feedzai is at $2B+ valuation, Visa acquired Featurespace. None of them are built for Africa. PayGuard is — with USSD support, Africa-tuned thresholds, and DPA/POPIA compliance built in."'));
ch.push(p("Key proof points: Market size ($3B+ Africa fraud losses), differentiation (USSD, Africa-tuned rules, AI fraud detection), production-ready codebase.", { i: true, c: GRAY }));

// ══════════════════════════════════════════════════
// COMPARABLE VALUATIONS
// ══════════════════════════════════════════════════
ch.push(sec("Comparable Valuations & Transactions"));
ch.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
  new TableRow({ children: [hc("Company"), hc("Transaction"), hc("Value"), hc("Year")] }),
  new TableRow({ children: [c("Featurespace"), c("Acquired by Visa"), c("Undisclosed (~$700M-$1B est.)"), c("Dec 2024")] }),
  new TableRow({ children: [c("Recorded Future"), c("Acquired by Mastercard"), c("$2.65 billion"), c("Dec 2024")] }),
  new TableRow({ children: [c("NICE Actimize"), c("Exploring sale by NICE"), c("$1.5-2 billion (expected)"), c("Late 2025")] }),
  new TableRow({ children: [c("Effectiv"), c("Acquired by Socure"), c("$136 million"), c("Oct 2024")] }),
  new TableRow({ children: [c("Feedzai"), c("Series E fundraise"), c("$2B+ valuation"), c("Oct 2025")] }),
  new TableRow({ children: [c("Sardine"), c("Series C fundraise"), c("$145M total raised"), c("Feb 2025")] }),
  new TableRow({ children: [c("Orca Fraud"), c("Seed round"), c("$2.35M"), c("Mar 2026")] }),
  new TableRow({ children: [c("Persona"), c("Series D"), c("$200M raised"), c("Q2 2025")] }),
  new TableRow({ children: [c("SEON"), c("Series C"), c("$80M raised"), c("2024")] }),
]}));

// Build
const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [{ children: ch }],
});

const dlPath = path.join("C:", "Users", "616078", "Downloads", "PayGuard_Investor_Acquirer_Report.docx");
const buf = await Packer.toBuffer(doc);
fs.writeFileSync(dlPath, buf);
console.log("✅ Document saved to:", dlPath);
console.log("   File size:", (buf.length / 1024).toFixed(1), "KB");
