import ExcelJS from "exceljs";
import path from "path";

const wb = new ExcelJS.Workbook();
wb.creator = "PayGuard";
wb.created = new Date();

// ══════════════════════════════════════════════════
// SHEET 1: Feature Comparison Matrix
// ══════════════════════════════════════════════════
const ws1 = wb.addWorksheet("Feature Comparison", { 
  properties: { tabColor: { argb: "3B82F6" } },
  views: [{ state: "frozen", xSplit: 2, ySplit: 2 }]
});

const companies = [
  "PayGuard",
  "Feedzai",
  "Sardine",
  "NICE Actimize",
  "SEON",
  "Socure",
  "Orca Fraud",
  "Featurespace (Visa)",
  "Smile ID",
  "Persona",
  "Hawk",
];

const features = [
  // Category, Feature, then per-company values
  ["ON-DEVICE SDK", "Native Android SDK (Kotlin)", ["✅ Yes", "❌ No", "✅ Yes", "❌ No", "✅ Yes", "❌ No", "❌ No", "❌ No", "✅ Yes", "✅ Yes", "❌ No"]],
  ["", "Native iOS SDK (Swift)", ["✅ Yes", "❌ No", "✅ Yes", "❌ No", "✅ Yes", "❌ No", "❌ No", "❌ No", "✅ Yes", "✅ Yes", "❌ No"]],
  ["", "Web/JavaScript SDK", ["✅ Yes", "✅ Yes", "✅ Yes", "❌ No", "✅ Yes", "❌ No", "❌ No", "❌ No", "✅ Yes", "✅ Yes", "❌ No"]],
  ["", "SDK Size < 2MB", ["✅ Yes", "N/A", "⚠️ ~3MB", "N/A", "⚠️ ~5MB", "N/A", "N/A", "N/A", "⚠️ ~3MB", "⚠️ Unknown", "N/A"]],

  ["CALL-STATE DETECTION", "Detects active phone call during payment", ["✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "Call + new recipient + high amount (vishing)", ["✅ RULE_001", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "OTP screen open during call detection", ["✅ RULE_014", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],

  ["AI FRAUD DETECTION", "Voice deepfake detection", ["✅ RULE_030", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "Liveness spoofing guard (GAN/injection)", ["✅ RULE_031", "❌ No", "❌ No", "❌ No", "❌ No", "⚠️ Limited", "❌ No", "❌ No", "✅ Yes", "⚠️ Limited", "❌ No"]],
  ["", "Synthetic identity detection", ["✅ RULE_032", "⚠️ Limited", "⚠️ Limited", "⚠️ Limited", "⚠️ Limited", "✅ Yes", "❌ No", "❌ No", "⚠️ Limited", "✅ Yes", "❌ No"]],
  ["", "AI conversation/caller detection", ["✅ RULE_033", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "Remote access tool blocking", ["✅ RULE_034", "❌ No", "✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "AI document forgery scanner", ["✅ RULE_035", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "⚠️ Limited", "❌ No"]],

  ["DEVICE INTELLIGENCE", "Device fingerprinting", ["✅ Yes", "✅ Yes", "✅ Yes", "⚠️ Limited", "✅ Yes", "⚠️ Limited", "❌ No", "❌ No", "✅ Yes", "✅ Yes", "❌ No"]],
  ["", "Device binding (1 device = 1 account)", ["✅ RULE_015-020", "❌ No", "⚠️ Limited", "❌ No", "⚠️ Limited", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "Rooted/jailbroken detection", ["✅ Yes", "⚠️ Limited", "✅ Yes", "❌ No", "✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "Emulator detection", ["✅ Yes", "⚠️ Limited", "✅ Yes", "❌ No", "✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "Behavioural biometrics", ["✅ Yes", "✅ Yes", "✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No", "⚠️ Limited", "❌ No", "❌ No", "❌ No"]],

  ["SOCIAL ENGINEERING RULES", "Paste detection (fraud script)", ["✅ RULE_004", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "SIM swap detection", ["✅ RULE_006", "⚠️ Limited", "✅ Yes", "⚠️ Limited", "⚠️ Limited", "⚠️ Limited", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "VPN/Proxy detection", ["✅ Yes", "✅ Yes", "✅ Yes", "✅ Yes", "✅ Yes", "⚠️ Limited", "❌ No", "✅ Yes", "❌ No", "❌ No", "✅ Yes"]],
  ["", "Rushed transaction detection", ["✅ RULE_013", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],

  ["AFRICA-SPECIFIC", "USSD channel fraud scoring", ["✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "ZAR thresholds (FICA)", ["✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "NGN thresholds (CBN)", ["✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "KES/GHS thresholds", ["✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "⚠️ Limited", "❌ No", "❌ No", "❌ No", "❌ No"]],
  ["", "POPIA/DPA compliance doc", ["✅ Yes", "⚠️ GDPR only", "⚠️ GDPR only", "⚠️ GDPR only", "⚠️ GDPR only", "⚠️ GDPR only", "✅ Yes", "⚠️ GDPR only", "✅ Yes", "⚠️ GDPR only", "⚠️ GDPR only"]],
  ["", "Mobile money (MoMo/M-Pesa) support", ["✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No"]],

  ["ENTERPRISE", "AML transaction monitoring", ["⚠️ Basic", "✅ Yes", "✅ Yes", "✅ Yes", "⚠️ Limited", "⚠️ Limited", "❌ No", "⚠️ Limited", "❌ No", "❌ No", "✅ Yes"]],
  ["", "Graph/network analysis", ["✅ Neo4j", "✅ Yes", "⚠️ Limited", "✅ Yes", "⚠️ Limited", "❌ No", "❌ No", "⚠️ Limited", "❌ No", "❌ No", "⚠️ Limited"]],
  ["", "Real-time scoring (< 100ms)", ["✅ Yes", "✅ Yes", "✅ Yes", "✅ Yes", "✅ Yes", "✅ Yes", "✅ Yes", "✅ Yes", "❌ N/A", "❌ N/A", "✅ Yes"]],
  ["", "Shadow mode (observe-only)", ["✅ Yes", "✅ Yes", "✅ Yes", "✅ Yes", "❌ No", "❌ No", "❌ No", "✅ Yes", "❌ N/A", "❌ N/A", "✅ Yes"]],
  ["", "Fail-open design", ["✅ Yes", "✅ Yes", "✅ Yes", "✅ Yes", "❌ No", "❌ No", "❌ No", "✅ Yes", "❌ N/A", "❌ N/A", "✅ Yes"]],

  ["INFRASTRUCTURE", "Docker deployment", ["✅ Yes", "☁️ SaaS", "☁️ SaaS", "☁️ Both", "☁️ SaaS", "☁️ SaaS", "☁️ SaaS", "☁️ SaaS", "☁️ SaaS", "☁️ SaaS", "☁️ SaaS"]],
  ["", "On-premise option", ["✅ Yes", "✅ Yes", "❌ No", "✅ Yes", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "❌ No", "✅ Yes"]],
  ["", "Kafka event streaming", ["✅ Yes", "✅ Yes", "❌ Unknown", "✅ Yes", "❌ Unknown", "❌ Unknown", "❌ Unknown", "❌ Unknown", "❌ N/A", "❌ N/A", "❌ Unknown"]],
  ["", "Prometheus metrics", ["✅ Yes", "✅ Yes", "❌ Unknown", "✅ Yes", "❌ Unknown", "❌ Unknown", "❌ Unknown", "❌ Unknown", "❌ N/A", "❌ N/A", "❌ Unknown"]],
];

// Styles
const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
const payguardFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
const catFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Calibri" };
const pgFont = { bold: true, size: 10, name: "Calibri", color: { argb: "FF1E3A5F" } };
const normalFont = { size: 10, name: "Calibri" };
const catFont = { bold: true, size: 10, name: "Calibri", color: { argb: "FF3B82F6" } };
const thinBorder = { style: "thin", color: { argb: "FFD1D5DB" } };
const allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

// Set column widths
ws1.getColumn(1).width = 22;
ws1.getColumn(2).width = 38;
for (let i = 3; i <= companies.length + 2; i++) ws1.getColumn(i).width = 18;

// Row 1: Title
const titleRow = ws1.addRow(["PayGuard — Competitive Feature Comparison"]);
titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: "FF3B82F6" }, name: "Calibri" };
ws1.mergeCells(1, 1, 1, companies.length + 2);
titleRow.height = 30;

// Row 2: Headers
const headerData = ["Category", "Feature", ...companies];
const hRow = ws1.addRow(headerData);
hRow.eachCell((cell, i) => {
  cell.fill = headerFill;
  cell.font = headerFont;
  cell.border = allBorders;
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
});
hRow.height = 35;

// PayGuard column highlight
const pgColIdx = 3; // column C

// Data rows
let lastCat = "";
for (const [cat, feature, vals] of features) {
  const row = ws1.addRow([cat || lastCat, feature, ...vals]);
  if (cat) lastCat = cat;

  row.eachCell((cell, colNum) => {
    cell.border = allBorders;
    cell.alignment = { vertical: "middle", wrapText: true, horizontal: colNum > 2 ? "center" : "left" };
    cell.font = normalFont;

    // Category column styling
    if (colNum === 1) {
      cell.font = catFont;
      cell.fill = catFill;
    }

    // PayGuard column highlight
    if (colNum === pgColIdx) {
      cell.fill = payguardFill;
      cell.font = pgFont;
    }

    // Color code values
    const v = String(cell.value || "");
    if (v.startsWith("✅")) cell.font = { ...cell.font, color: { argb: "FF16A34A" } };
    if (v.startsWith("❌")) cell.font = { ...cell.font, color: { argb: "FFDC2626" } };
    if (v.startsWith("⚠️")) cell.font = { ...cell.font, color: { argb: "FFF59E0B" } };
    if (v.startsWith("☁️")) cell.font = { ...cell.font, color: { argb: "FF6B7280" } };
  });
  row.height = 22;
}

// ══════════════════════════════════════════════════
// SHEET 2: Company Overview
// ══════════════════════════════════════════════════
const ws2 = wb.addWorksheet("Company Overview", {
  properties: { tabColor: { argb: "16A34A" } },
  views: [{ state: "frozen", xSplit: 1, ySplit: 2 }]
});

const overviewCols = ["Company", "Founded", "HQ", "Total Funding", "Valuation", "Employees (est.)", "Focus", "Africa Presence", "Key Differentiator"];
ws2.getColumn(1).width = 20;
ws2.getColumn(2).width = 10;
ws2.getColumn(3).width = 18;
ws2.getColumn(4).width = 16;
ws2.getColumn(5).width = 16;
ws2.getColumn(6).width = 14;
ws2.getColumn(7).width = 30;
ws2.getColumn(8).width = 16;
ws2.getColumn(9).width = 45;

const t2 = ws2.addRow(["PayGuard — Competitor Company Profiles"]);
t2.getCell(1).font = { bold: true, size: 16, color: { argb: "FF16A34A" }, name: "Calibri" };
ws2.mergeCells(1, 1, 1, overviewCols.length);

const h2 = ws2.addRow(overviewCols);
h2.eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = allBorders; cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; });
h2.height = 30;

const companyData = [
  ["PayGuard", "2025", "South Africa", "Pre-seed", "Pre-revenue", "1-5", "Real-time fraud detection SDK with call-state awareness, AI deepfake detection, Africa-tuned rules", "✅ Built for Africa", "ONLY platform with call-state detection + voice deepfake + USSD scoring for Africa"],
  ["Feedzai", "2011", "Portugal / USA", "$352M+", "$2B+", "500+", "AI financial crime prevention, AML, fraud detection for banks", "❌ No Africa focus", "Largest independent fraud platform. Partnered with Mastercard. Acquired DemystData."],
  ["Sardine", "2020", "USA", "$145M", "~$500M+ est.", "150+", "AI risk platform: fraud, compliance, credit underwriting. Device intelligence.", "❌ No Africa focus", "130% ARR growth. AI agents for fraud ops. Strong device intelligence."],
  ["NICE Actimize", "1999", "Israel / USA", "N/A (NICE sub)", "$1.5-2B (sale)", "1000+", "Enterprise AML, fraud detection, trade surveillance", "⚠️ Minimal", "Market leader in enterprise AML. NICE actively selling for $1.5-2B."],
  ["SEON", "2017", "Hungary / UK", "$80M+", "~$300M+ est.", "200+", "Fraud prevention via device fingerprinting, digital footprint analysis", "❌ No Africa focus", "Strong device fingerprinting. Digital footprint (email/phone enrichment)."],
  ["Socure", "2012", "USA", "$300M+", "$4.5B (2022)", "500+", "Digital identity verification. Fraud prevention. KYC.", "❌ No Africa focus", "Identity verification leader. Acquired Effectiv for $136M. Inc 5000 x4."],
  ["Orca Fraud", "2024", "South Africa", "$2.35M", "Early stage", "5-10", "Real-time fraud intelligence for African payment rails via ML", "✅ Africa-first", "ML trained on African transaction data. $5B monthly volume. 70+ countries."],
  ["Featurespace (Visa)", "2012", "UK (now Visa)", "~$100M+ (pre-acq)", "Acquired by Visa", "300+", "Real-time AI payment protection. Adaptive behavioral analytics.", "⚠️ Via Visa", "Acquired by Visa Dec 2024. Adaptive Behavioral Analytics (ARIC)."],
  ["Smile ID", "2016", "Nigeria", "$20M+", "~$100M+ est.", "100+", "Identity verification, KYC, biometrics, anti-fraud for Africa", "✅ Africa-first", "Leading African ID verification. Acquired Appruve. Partnered with Mastercard."],
  ["Persona", "2018", "USA", "$200M+ (Series D)", "$1.5B+", "400+", "Identity decisioning platform. KYB, age assurance, workforce identity.", "❌ No Africa focus", "Well-funded identity platform. Expanding into decisioning."],
  ["Hawk", "2018", "Germany", "$56M+ (Series C)", "~$200M+ est.", "150+", "AI-driven AML, sanctions screening, fraud prevention", "❌ No Africa focus", "German AML/fraud platform with European bank focus."],
];

for (let i = 0; i < companyData.length; i++) {
  const row = ws2.addRow(companyData[i]);
  row.eachCell((cell, colNum) => {
    cell.border = allBorders;
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.font = normalFont;
    if (colNum === 1) cell.font = { ...normalFont, bold: true };
    if (i === 0) { cell.fill = payguardFill; cell.font = { ...cell.font, color: { argb: "FF1E3A5F" }, bold: true }; }
  });
  row.height = 50;
}

// ══════════════════════════════════════════════════
// SHEET 3: Scoring Summary
// ══════════════════════════════════════════════════
const ws3 = wb.addWorksheet("Capability Score", {
  properties: { tabColor: { argb: "7C3AED" } },
  views: [{ state: "frozen", xSplit: 1, ySplit: 2 }]
});

const categories = [
  "On-Device SDK (4 features)",
  "Call-State Detection (3 features) — UNIQUE",
  "AI Fraud Detection (6 features)",
  "Device Intelligence (5 features)",
  "Social Engineering Rules (4 features)",
  "Africa-Specific (6 features)",
  "Enterprise Features (5 features)",
  "Infrastructure (4 features)",
];

// scores out of category max
const scores = [
  // PG   Feedz  Sard  NICE  SEON  Socure Orca  Feat  Smile Person Hawk
  [4,     1,     3,    0,    3,    0,     0,    0,    3,    3,     0],   // SDK
  [3,     0,     0,    0,    0,    0,     0,    0,    0,    0,     0],   // Call-state
  [6,     0,     1,    0,    0,    1,     0,    0,    1,    1,     0],   // AI fraud
  [5,     3,     4,    0,    3,    0,     0,    0,    1,    1,     0],   // Device
  [4,     1,     2,    1,    1,    1,     0,    1,    0,    0,     1],   // Social eng
  [6,     0,     0,    0,    0,    0,     3,    0,    1,    0,     0],   // Africa
  [4,     5,     3,    5,    2,    1,     1,    3,    0,    0,     3],   // Enterprise
  [4,     3,     1,    3,    1,    1,     1,    1,    1,    1,     1],   // Infra
];

const maxes = [4, 3, 6, 5, 4, 6, 5, 4];

ws3.getColumn(1).width = 38;
for (let i = 2; i <= companies.length + 1; i++) ws3.getColumn(i).width = 16;

const t3 = ws3.addRow(["PayGuard — Capability Score Card"]);
t3.getCell(1).font = { bold: true, size: 16, color: { argb: "FF7C3AED" }, name: "Calibri" };
ws3.mergeCells(1, 1, 1, companies.length + 1);

const h3 = ws3.addRow(["Capability Area", ...companies]);
h3.eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = allBorders; cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; });
h3.height = 35;

for (let i = 0; i < categories.length; i++) {
  const rowData = [categories[i], ...scores[i].map((s, j) => `${s}/${maxes[i]}`)];
  const row = ws3.addRow(rowData);
  row.eachCell((cell, colNum) => {
    cell.border = allBorders;
    cell.alignment = { horizontal: colNum === 1 ? "left" : "center", vertical: "middle", wrapText: true };
    cell.font = normalFont;
    if (colNum === 1) cell.font = { ...normalFont, bold: true };
    if (colNum === 2) { cell.fill = payguardFill; cell.font = pgFont; }
    
    // Color by score
    if (colNum > 1) {
      const score = scores[i][colNum - 2];
      const max = maxes[i];
      const pct = score / max;
      if (pct >= 0.8) cell.font = { ...cell.font, color: { argb: "FF16A34A" }, bold: true };
      else if (pct >= 0.5) cell.font = { ...cell.font, color: { argb: "FFF59E0B" } };
      else if (pct > 0) cell.font = { ...cell.font, color: { argb: "FFEA580C" } };
      else cell.font = { ...cell.font, color: { argb: "FFDC2626" } };
    }
  });
  row.height = 25;
}

// Total row
const totals = companies.map((_, j) => scores.reduce((sum, row) => sum + row[j], 0));
const totalMax = maxes.reduce((a, b) => a + b, 0);
const totalRow = ws3.addRow(["TOTAL SCORE", ...totals.map(t => `${t}/${totalMax}`)]);
totalRow.eachCell((cell, colNum) => {
  cell.border = allBorders;
  cell.alignment = { horizontal: colNum === 1 ? "left" : "center", vertical: "middle" };
  cell.font = { bold: true, size: 12, name: "Calibri" };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  if (colNum === 2) { cell.fill = payguardFill; cell.font = { ...cell.font, size: 14, color: { argb: "FF1E3A5F" } }; }
});
totalRow.height = 30;

// Percentage row
const pctRow = ws3.addRow(["PERCENTAGE", ...totals.map(t => `${Math.round(t/totalMax*100)}%`)]);
pctRow.eachCell((cell, colNum) => {
  cell.border = allBorders;
  cell.alignment = { horizontal: colNum === 1 ? "left" : "center", vertical: "middle" };
  cell.font = { bold: true, size: 12, name: "Calibri" };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  if (colNum === 2) { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } }; cell.font = { ...cell.font, size: 14, color: { argb: "FFFFFFFF" } }; }
});
pctRow.height = 30;

// Save
const dlPath = path.join("C:", "Users", "616078", "Downloads", "PayGuard_Competitor_Comparison.xlsx");
await wb.xlsx.writeFile(dlPath);
const stats = (await import("fs")).statSync(dlPath);
console.log("✅ Saved to:", dlPath);
console.log("   Size:", (stats.size / 1024).toFixed(1), "KB");
console.log("   Sheets: Feature Comparison, Company Overview, Capability Score");
