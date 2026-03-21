import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType, ShadingType } from "docx";
import fs from "fs";
import path from "path";

const BLUE = "1E3A5F";
const LIGHT_BLUE = "E8F0FE";
const ACCENT = "3B82F6";
const RED = "DC2626";
const ORANGE = "F59E0B";
const GREEN = "16A34A";
const GRAY = "6B7280";
const WHITE = "FFFFFF";
const BLACK = "000000";

const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" };
const tableBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function headerCell(text) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: BLUE },
    borders: tableBorders,
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

function sectionTitle(text, color = BLUE) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32, color, font: "Calibri" })],
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
  });
}

function companyBlock(num, name, tagline, details) {
  const paragraphs = [];
  paragraphs.push(new Paragraph({
    children: [
      new TextRun({ text: `${num}. ${name}`, bold: true, size: 26, color: BLUE, font: "Calibri" }),
    ],
    spacing: { before: 300, after: 40 },
  }));
  paragraphs.push(new Paragraph({
    children: [new TextRun({ text: tagline, italics: true, size: 20, color: GRAY, font: "Calibri" })],
    spacing: { after: 100 },
  }));

  const rows = details.map(([key, val]) => new TableRow({
    children: [
      cell(key, { bold: true, width: 25, shading: LIGHT_BLUE }),
      cell(val, { width: 75 }),
    ],
  }));

  paragraphs.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
  return paragraphs;
}

// ── Build the document ────────────────────────────────────────────────────────

const children = [];

// Title page
children.push(new Paragraph({ spacing: { before: 2000 } }));
children.push(new Paragraph({
  children: [new TextRun({ text: "PayGuard", size: 72, bold: true, color: ACCENT, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Target Client Research Report", size: 40, color: BLUE, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Comprehensive Sales Prospecting — South Africa & Africa", size: 24, color: GRAY, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 400 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "March 2026 — Confidential", size: 22, color: GRAY, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
}));

// Market Context
children.push(sectionTitle("Market Context — Why Now"));
children.push(new Paragraph({
  children: [new TextRun({ text: "Africa's digital payment fraud is at crisis levels. PayGuard's call-state detection, deepfake voice analysis, and USSD channel support address threats that no competitor currently covers.", size: 22, font: "Calibri", color: BLACK })],
  spacing: { after: 200 },
}));

const marketTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Market"), headerCell("Fraud Losses"), headerCell("Trend")] }),
    new TableRow({ children: [cell("🇿🇦 South Africa"), cell("R1.888B digital banking fraud (2024)"), cell("+74% YoY, 86% surge in incidents")] }),
    new TableRow({ children: [cell("🇿🇦 SA Insurance"), cell("R175.9M detected losses (2023)"), cell("+46% cases, R1.5B prevented")] }),
    new TableRow({ children: [cell("🇳🇬 Nigeria"), cell("NGN 52.26B lost to fraud (2024)"), cell("+196% over 5 years")] }),
    new TableRow({ children: [cell("🇰🇪 Kenya"), cell("KSh 810M mobile banking fraud (2024)"), cell("+344% YoY")] }),
    new TableRow({ children: [cell("🇬🇭 Ghana"), cell("GH¢99M financial sector losses (2024)"), cell("+850% identity theft")] }),
    new TableRow({ children: [cell("🌍 Africa (remittances)"), cell("$2.7B annual fraud losses"), cell("Growing consistently")] }),
  ],
});
children.push(marketTable);

// TIER 1
children.push(sectionTitle("🔴 TIER 1 — Highest Priority (Active Fraud Crisis)", RED));
children.push(new Paragraph({
  children: [new TextRun({ text: "Companies with documented, recent, large-scale fraud losses. Most receptive to new solutions.", size: 22, font: "Calibri", italics: true, color: GRAY })],
  spacing: { after: 100 },
}));

children.push(...companyBlock(1, "Capitec Bank", "SA's largest retail bank by customers (22M+). Primary target for banking app fraud.", [
  ["Website", "capitecbank.co.za"],
  ["Fraud Exposure", "Primary target for banking app fraud (65% of SA digital fraud via apps). Implemented AI-based transaction monitoring."],
  ["Why PayGuard", "SDK-level detection catches fraud BEFORE the transaction reaches their systems. Call-state detection is something app-level monitoring misses."],
  ["Contact", "0860 10 20 43"],
  ["HQ", "Stellenbosch, Western Cape"],
]));

children.push(...companyBlock(2, "TymeBank", "Digital-only bank with 10M+ customers. Warned about AI-driven social engineering in 2025.", [
  ["Website", "tymebank.co.za"],
  ["Fraud Exposure", "Publicly warned about AI-enhanced vishing, voice cloning, fake payment links. Accounts used for fraudulent transactions."],
  ["Why PayGuard", "RULE_030 (deepfake voice), RULE_033 (AI caller detection), RULE_014 (OTP interception) directly address their stated threats."],
  ["Contact", "0860 999 119 · service@tymebank.co.za"],
  ["HQ", "30 Jellicoe Ave, Rosebank, Johannesburg"],
]));

children.push(...companyBlock(3, "MTN Group (MoMo)", "Africa's largest telco. MoMo lost $53M to fraud in Nigeria (2022), GHS 27M in Ghana.", [
  ["Website", "mtn.com"],
  ["Fraud Exposure", "$53M loss in Nigeria, R10.5B unauthorized transfers, GHS 56M Ghana mobile money fraud. SIM swap and social engineering primary vectors."],
  ["Why PayGuard", "USSD scoring endpoint covers feature phone MoMo users. SIM swap detection (RULE_006), social engineering rules directly relevant."],
  ["Contact", "mtn.com/contact-us"],
  ["HQ", "Fairland, Johannesburg"],
]));

children.push(...companyBlock(4, "Safaricom (M-Pesa)", "Kenya's dominant mobile money platform. $4M SIM swap fraud losses. Fired 113 employees for fraud in 2024.", [
  ["Website", "safaricom.co.ke"],
  ["Fraud Exposure", "$4M SIM fraud (2022), 113 staff fired for fraud (2024), KSh 500M Fuliza exploitation, SIM swap investigations up 327%."],
  ["Why PayGuard", "RULE_006 (SIM swap), RULE_007 (device on multiple accounts), USSD channel scoring for feature phone M-Pesa."],
  ["Contact", "0722 002 100 · safaricom.co.ke/contact-us"],
  ["HQ", "Nairobi, Kenya"],
]));

children.push(...companyBlock(5, "Flutterwave", "Africa's leading payment infrastructure. NGN 11B security breach in April 2024.", [
  ["Website", "flutterwave.com"],
  ["Fraud Exposure", "NGN 11-20B diverted via small transfers designed to avoid fraud checks (April 2024). Multiple prior breaches totaling $35M+."],
  ["Why PayGuard", "RULE_022 (velocity/structuring detection) directly catches the 'many small transfers' pattern used in their breach. Device binding prevents account takeover."],
  ["Contact", "hi@flutterwave.com"],
  ["HQ", "Lagos, Nigeria / San Francisco"],
]));

children.push(...companyBlock(6, "OPay", "Nigeria's largest mobile money provider. EFCC formally warned them to improve fraud prevention (Dec 2025).", [
  ["Website", "opayweb.com"],
  ["Fraud Exposure", "EFCC warning (Dec 2025), NGN 95M fraud case, multiple lawsuits, KYC weaknesses exploited by fraudsters."],
  ["Why PayGuard", "Device binding (RULE_015-020) and synthetic identity detection (RULE_032) address their KYC gaps."],
  ["Contact", "support@opayweb.com"],
  ["HQ", "Lagos, Nigeria"],
]));

children.push(...companyBlock(7, "Mukuru", "Leading SA-to-Zimbabwe remittance provider. Lost R18M to SIM swap fraud ring.", [
  ["Website", "mukuru.com"],
  ["Fraud Exposure", "R18M SIM swap fraud ring, multiple employees stealing $200K+ using fake IDs. Internal + external fraud."],
  ["Why PayGuard", "SIM swap detection (RULE_006), synthetic identity detection (RULE_032), document forgery scanner (RULE_035)."],
  ["Contact", "mukuru.com/contact"],
  ["HQ", "Cape Town, South Africa"],
]));

// TIER 2
children.push(sectionTitle("🟡 TIER 2 — Strong Fit (Known Fraud Challenges)", ORANGE));
children.push(new Paragraph({
  children: [new TextRun({ text: "Companies with documented fraud concerns and strong product-fit. Growing exposure.", size: 22, font: "Calibri", italics: true, color: GRAY })],
  spacing: { after: 100 },
}));

const tier2Companies = [
  [8, "Discovery Bank", "AI-forward digital bank. 80% EFT fraud reduction with AI. Still battling vishing + courier scams.", [
    ["Website", "discovery.co.za"], ["Contact", "0860 000 628 · Fraud: 011 324 444"], ["HQ", "Sandton, Johannesburg"],
    ["Fraud Exposure", "Vishing, courier scams, phishing. Uses in-app biometric auth. Previously had CVV vulnerability."],
    ["Why PayGuard", "Complementary SDK-level layer that catches call-state fraud their server-side AI can't see."],
  ]],
  [9, "African Bank", "Mid-tier digital bank using Experian's Hunter. Adopting AI-driven fraud systems.", [
    ["Website", "africanbank.co.za"], ["Contact", "0861 111 011 · CExperience@africanbank.co.za"], ["HQ", "Midrand, Johannesburg"],
    ["Fraud Exposure", "Historical staff fraud on unsecured loans. Now investing in real-time AI fraud detection."],
  ]],
  [10, "Nedbank", "SA Big 5 bank. Heavy digital banking investment.", [
    ["Website", "nedbank.co.za"], ["Contact", "0860 555 111"], ["HQ", "135 Rivonia Rd, Sandton"],
    ["Fraud Exposure", "Part of R1.888B SA digital banking fraud losses. All Big 5 banks are targets."],
  ]],
  [11, "FNB (First National Bank)", "Known for innovation (eBucks, app awards). Large digital customer base.", [
    ["Website", "fnb.co.za"], ["Contact", "087 575 9404"], ["HQ", "FNB Bank City, Simmonds St, Johannesburg"],
    ["Fraud Exposure", "Most-targeted banking apps in SA. Part of R1.888B losses."],
  ]],
  [12, "Absa", "Major SA bank with Barclays heritage. 12 African markets.", [
    ["Website", "absa.co.za"], ["Contact", "0860 008 600"], ["HQ", "15 Troye St, Johannesburg"],
    ["Fraud Exposure", "Part of R1.888B losses. Multi-market presence (PayGuard's ZAR/NGN/KES/GHS support relevant)."],
  ]],
  [13, "Standard Bank", "Africa's largest bank by assets. 20 African countries.", [
    ["Website", "standardbank.co.za"], ["Contact", "0860 123 000"], ["HQ", "5 Simmonds St, Johannesburg"],
    ["Fraud Exposure", "Massive scale = massive attack surface. 20-country presence amplifies fraud risk."],
  ]],
  [14, "Ozow", "SA instant EFT leader. 0.02% fraud rate but actively fighting phishing.", [
    ["Website", "ozow.com"], ["Contact", "ozow.com/contact"], ["HQ", "Johannesburg"],
    ["Fraud Exposure", "Uses reverse-image searches for rogue clones, SSL verification."],
  ]],
  [15, "Paystack (Stripe)", "Pan-African payment gateway (acquired by Stripe).", [
    ["Website", "paystack.com"], ["Contact", "paystack.com/contact"], ["HQ", "Lagos (Stripe-owned)"],
  ]],
  [16, "PalmPay", "Nigeria's #2 wallet (35M users, 300M monthly transactions).", [
    ["Website", "palmpay.com"], ["Contact", "palmpay.com/contact"], ["HQ", "Lagos, Nigeria"],
    ["Fraud Exposure", "MD publicly acknowledged fraud increase. Using biometric auth, AI anomaly detection."],
  ]],
  [17, "Airtel Money", "Major mobile money in East Africa. Lost Sh670M ($6.7M) to employee theft.", [
    ["Website", "airtel.africa"], ["Contact", "airtel.africa/contact"], ["HQ", "Nairobi"],
    ["Fraud Exposure", "Sh670M employee theft (Kenya 2018), Uganda breach (2022). Banks threatened disconnection."],
  ]],
];

for (const [num, name, tagline, details] of tier2Companies) {
  children.push(...companyBlock(num, name, tagline, details));
}

// TIER 3
children.push(sectionTitle("🟢 TIER 3 — Strategic Targets (Proactive Buyers)", GREEN));
children.push(new Paragraph({
  children: [new TextRun({ text: "Companies actively investing in fraud prevention. Longer sales cycle but higher LTV.", size: 22, font: "Calibri", italics: true, color: GRAY })],
  spacing: { after: 100 },
}));

const tier3Companies = [
  [18, "Old Mutual", "SA's largest insurer. Using AI for document verification. R175.9M industry fraud losses.", [
    ["Website", "oldmutual.co.za"], ["Contact", "0860 60 60 60"], ["HQ", "Mutual Park, Pinelands, Cape Town"],
    ["Why PayGuard", "Document forgery scanner (RULE_035) + liveness spoofing (RULE_031) for claims verification."],
  ]],
  [19, "Sanlam", "Major SA insurer. Zero-tolerance fraud policy.", [
    ["Website", "sanlam.com"], ["Contact", "0860 726 526"], ["HQ", "Bellville, Cape Town"],
  ]],
  [20, "Hollard", "SA's largest privately-owned insurer. Uses voice analysis for claims fraud.", [
    ["Website", "hollard.co.za"], ["Contact", "0860 000 107"], ["HQ", "Parktown, Johannesburg"],
    ["Why PayGuard", "Voice deepfake detection (RULE_030) would enhance their existing voice analysis."],
  ]],
  [21, "Peach Payments", "SA e-commerce payment gateway.", [
    ["Website", "peachpayments.com"], ["Contact", "peachpayments.com/contact"], ["HQ", "Cape Town"],
  ]],
  [22, "Stitch (Stitch Pay)", "Modern SA fintech payment gateway.", [
    ["Website", "stitch.money"], ["Contact", "stitch.money/contact"], ["HQ", "Cape Town"],
  ]],
  [23, "DPO Group (Network International)", "Pan-African PSP. 21 African countries.", [
    ["Website", "dpogroup.com"], ["Contact", "dpogroup.com/contact"], ["HQ", "Nairobi, Kenya"],
  ]],
  [24, "Yoco", "SA's leading SME card payment provider.", [
    ["Website", "yoco.com"], ["Contact", "yoco.com/contact"], ["HQ", "Cape Town"],
  ]],
  [25, "Mama Money", "SA remittance provider.", [
    ["Website", "mamamoney.co.za"], ["Contact", "mamamoney.co.za/contact"], ["HQ", "Johannesburg"],
  ]],
  [26, "Hello Paisa", "SA remittance operator.", [
    ["Website", "hellopaisa.co.za"], ["Contact", "hellopaisa.co.za/contact"], ["HQ", "Johannesburg"],
  ]],
  [27, "Chipper Cash", "Pan-African cross-border payment app.", [
    ["Website", "chippercash.com"], ["Contact", "chippercash.com/contact"], ["HQ", "San Francisco / Lagos"],
  ]],
  [28, "Vodacom (M-Pesa)", "SA's largest mobile network. M-Pesa operations in Mozambique, Tanzania, DRC.", [
    ["Website", "vodacom.com"], ["Contact", "vodacom.com/contact-us"], ["HQ", "Midrand, Johannesburg"],
  ]],
  [29, "WorldRemit (Zepz)", "Global MTO. Brand exploited for scams in Ghana.", [
    ["Website", "worldremit.com"], ["Contact", "worldremit.com/en/about/contact-us"], ["HQ", "London"],
  ]],
  [30, "Equity Bank (Kenya)", "Kenya's largest bank by customers. KSh 270M debit card fraud in April 2024.", [
    ["Website", "equitybankgroup.com"], ["Contact", "equitybankgroup.com/contact"], ["HQ", "Nairobi, Kenya"],
  ]],
];

for (const [num, name, tagline, details] of tier3Companies) {
  children.push(...companyBlock(num, name, tagline, details));
}

// Approach Strategy
children.push(sectionTitle("Approach Strategy"));

children.push(new Paragraph({
  children: [new TextRun({ text: "TIER 1 — Crisis Mode", bold: true, size: 24, color: RED, font: "Calibri" })],
  spacing: { before: 200, after: 80 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: '"You\'ve already lost [specific amount]. Here\'s how PayGuard would have caught it — and here\'s a 14-day shadow mode pilot to prove it with zero risk to your users."', italics: true, size: 22, font: "Calibri" })],
  spacing: { after: 200 },
}));

children.push(new Paragraph({
  children: [new TextRun({ text: "TIER 2 — Active Prevention", bold: true, size: 24, color: ORANGE, font: "Calibri" })],
  spacing: { before: 200, after: 80 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: '"Your existing fraud detection works server-side. PayGuard adds the SDK layer — we see the call state, device fingerprint, and behavioural signals your backend never receives."', italics: true, size: 22, font: "Calibri" })],
  spacing: { after: 200 },
}));

children.push(new Paragraph({
  children: [new TextRun({ text: "TIER 3 — Proactive Investment", bold: true, size: 24, color: GREEN, font: "Calibri" })],
  spacing: { before: 200, after: 80 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: '"As deepfake voice and AI-driven social engineering scale across Africa in 2025, PayGuard\'s RULE_030–035 provide forward-looking protection that legacy systems don\'t have."', italics: true, size: 22, font: "Calibri" })],
  spacing: { after: 200 },
}));

// Industry Bodies
children.push(sectionTitle("Key Industry Bodies"));
const industryTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: [headerCell("Organization"), headerCell("What They Do"), headerCell("Contact")] }),
    new TableRow({ children: [cell("SABRIC"), cell("SA Banking Risk Information Centre — industry fraud data sharing"), cell("sabric.co.za")] }),
    new TableRow({ children: [cell("SAFPS"), cell("SA Fraud Prevention Service — cross-industry fraud database"), cell("safps.org.za")] }),
    new TableRow({ children: [cell("Insurance Crime Bureau"), cell("Insurance fraud investigation"), cell("insurancecrime.co.za")] }),
    new TableRow({ children: [cell("PASA"), cell("Payments Association of SA — payment system governance"), cell("pasa.org.za")] }),
  ],
});
children.push(industryTable);

children.push(new Paragraph({ spacing: { before: 300 } }));
children.push(new Paragraph({
  children: [new TextRun({ text: "Tip: ", bold: true, size: 22, color: ACCENT, font: "Calibri" }), new TextRun({ text: "Getting PayGuard listed as a SAFPS-compatible technology partner would give instant credibility with all SA banks. Consider approaching SABRIC for an industry presentation on call-state fraud detection.", size: 22, font: "Calibri" })],
}));

// Build and save
const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [{ children }],
});

const downloadsPath = path.join("C:", "Users", "616078", "Downloads", "PayGuard_Target_Clients_Report.docx");
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(downloadsPath, buffer);
console.log("✅ Document saved to:", downloadsPath);
console.log("   File size:", (buffer.length / 1024).toFixed(1), "KB");
