import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType, Table, TableRow, TableCell, WidthType, VerticalAlign, TableLayoutType } from "docx";
import fs from "fs";

const N="0F172A",B="1E3A5F",A="3B82F6",G="10B981",R="EF4444",O="F59E0B",GY="6B7280",LG="F1F5F9",W="FFFFFF",BK="111827";

const cell = (t, o={}) => new TableCell({
  children:[new Paragraph({children:[new TextRun({text:t||"",size:19,color:o.color||BK,font:"Calibri",bold:o.bold})],alignment:o.center?AlignmentType.CENTER:AlignmentType.LEFT,spacing:{before:40,after:40}})],
  shading:o.bg?{type:ShadingType.SOLID,color:o.bg}:undefined,
  verticalAlign:VerticalAlign.CENTER,
  width:o.width?{size:o.width,type:WidthType.PERCENTAGE}:undefined,
  margins:{top:60,bottom:60,left:100,right:100},
});

const hdr = (t,w) => cell(t,{bold:true,bg:N,color:W,width:w});

const products = [
  { name:"Swifter Send", cat:"Payments", status:"🟢 Live", pct:"90%", pctColor:G, files:"176+", bg:false,
    detail:"Full-stack: Website, API Gateway, dashboard, FX engine, corridors, KYC, multi-provider routing. Deployed Railway + Vercel. Pending: regulatory licensing." },
  { name:"PayGuard", cat:"Security", status:"🟢 Live", pct:"85%", pctColor:G, files:"71 svc + SDKs", bg:true,
    detail:"3 microservices on Railway (API, Risk Engine, Device Binding), iOS SDK (Swift), Android SDK (Kotlin), JS SDK (npm), 35+ fraud rules, dashboard, CI/CD. Pending: Graph Engine, ONNX ML models, pen test." },
  { name:"Swifter ID (eKYC)", cat:"Identity", status:"🟢 Live", pct:"80%", pctColor:G, files:"138", bg:false,
    detail:"Full eKYC: document verification (SA ID, passport, DL for 15+ countries), biometric liveness, sanctions/PEP screening, KYB (CIPC), address verification. 138 source files built." },
  { name:"B2B Payments", cat:"Payments", status:"🟢 Live", pct:"85%", pctColor:G, files:"Shared", bg:true,
    detail:"Part of Swifter Send: invoicing with PDF, multi-currency settlement (ZAR/USD/EUR/GBP), BOP code classification, KYB wizard, client payment portal. Live on swifter.digital." },
  { name:"Stablecoin Lending", cat:"DeFi", status:"🟡 Beta", pct:"75%", pctColor:O, files:"133", bg:false,
    detail:"Solana smart contracts (Rust/Anchor), Pyth oracle feeds, auto-liquidation, ZAR disbursement to SA banks, dashboard. 133 source files. Pending: security audit, mainnet deployment." },
  { name:"Chatbanking", cat:"Channels", status:"🟡 Beta", pct:"65%", pctColor:O, files:"33", bg:true,
    detail:"WhatsApp Business API integration, conversational banking flows, balance checks, send money, transaction history. 33 source files. Pending: USSD fallback, multi-language." },
  { name:"Smart Routing", cat:"Intelligence", status:"🟢 Live", pct:"85%", pctColor:G, files:"Embedded", bg:false,
    detail:"AI-powered corridor & provider selection. Multi-variable optimization (cost, speed, reliability). Auto-failover. Embedded in Swifter Send core engine." },
  { name:"FX Intelligence", cat:"Intelligence", status:"🟢 Live", pct:"85%", pctColor:G, files:"Embedded", bg:true,
    detail:"Real-time rate aggregation from multiple liquidity providers. Best-rate selection, rate locking for enterprise. Live in production." },
  { name:"Connectivity", cat:"Infrastructure", status:"🟢 Live", pct:"80%", pctColor:G, files:"Embedded", bg:false,
    detail:"Partner API gateway normalising 15+ provider interfaces. Health monitoring, auto-failover, webhook mgmt, rate limiting, audit logging." },
  { name:"PayStream", cat:"Payments", status:"🟡 Beta", pct:"60%", pctColor:O, files:"Shared", bg:true,
    detail:"Batch payroll API, CSV upload, multi-country disbursement via Swifter Send rails. Pending: Deel/Remote integration, tax withholding automation." },
  { name:"AI Agents", cat:"Intelligence", status:"🟡 Beta", pct:"50%", pctColor:O, files:"Shared", bg:false,
    detail:"Compliance screening agent, ops monitoring agent, support agent. Agent framework built on Send platform. Individual agent training pending." },
  { name:"Trade Finance", cat:"Payments", status:"🔵 Dev", pct:"40%", pctColor:A, files:"Shared", bg:true,
    detail:"Smart contract escrow design complete, milestone release logic. Built on stablecoin contract base. Pending: LC issuance, IoT triggers, insurance integration." },
  { name:"Swifter ERP", cat:"Enterprise", status:"🔵 Dev", pct:"30%", pctColor:A, files:"8", bg:false,
    detail:"Early stage: invoicing module, expense tracking skeleton. Architecture designed. Core modules (payroll, reconciliation, tax) pending." },
  { name:"Crypto-as-a-Service", cat:"DeFi", status:"⚪ Roadmap", pct:"20%", pctColor:GY, files:"Design", bg:true,
    detail:"Architecture designed, API spec written. Will leverage stablecoin contracts + Swifter Send on/off-ramp. Pending: multi-tenant, white-label UI, CASP license." },
  { name:"AI Insights", cat:"Intelligence", status:"⚪ Roadmap", pct:"15%", pctColor:GY, files:"Design", bg:false,
    detail:"Analytics framework designed. Will consume data from Send + PayGuard. Pending: ML models, dashboard widgets, corridor demand forecasting." },
  { name:"Network Intel", cat:"Intelligence", status:"⚪ Roadmap", pct:"10%", pctColor:GY, files:"Design", bg:true,
    detail:"Concept: partner health scoring, risk monitoring, early warning. Architecture designed. Implementation pending." },
];

const rows = [
  new TableRow({ children: [hdr("Product",16), hdr("Category",10), hdr("Status",8), hdr("Completion",8), hdr("Src Files",8), hdr("What's Built",50)] }),
  ...products.map(p => new TableRow({ children: [
    cell(p.name, p.bg?{bg:LG}:{}),
    cell(p.cat, p.bg?{bg:LG}:{}),
    cell(p.status, {center:true, ...(p.bg?{bg:LG}:{})}),
    cell(p.pct, {center:true, color:p.pctColor, bold:true, ...(p.bg?{bg:LG}:{})}),
    cell(p.files, {center:true, ...(p.bg?{bg:LG}:{})}),
    cell(p.detail, p.bg?{bg:LG}:{}),
  ]})),
];

const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [{ children: [
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({ children: [new TextRun({ text: "SWIFTER TECHNOLOGIES", size: 44, bold: true, color: N, font: "Calibri" })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new TextRun({ text: "Product Readiness Matrix", size: 32, color: A, font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: "Based on codebase audit — 21 March 2026", size: 22, color: GY, font: "Calibri", italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: "Confidential", size: 20, color: R, font: "Calibri", bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    new Paragraph({ children: [
      new TextRun({ text: "Status:  ", bold: true, size: 20, color: GY, font: "Calibri" }),
      new TextRun({ text: "🟢 Live  ", size: 20, color: G, font: "Calibri", bold: true }),
      new TextRun({ text: "🟡 Beta  ", size: 20, color: O, font: "Calibri", bold: true }),
      new TextRun({ text: "🔵 In Dev  ", size: 20, color: A, font: "Calibri", bold: true }),
      new TextRun({ text: "⚪ Roadmap", size: 20, color: GY, font: "Calibri", bold: true }),
    ], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
    new Table({ layout: TableLayoutType.FIXED, rows, width: { size: 100, type: WidthType.PERCENTAGE } }),
    new Paragraph({ spacing: { before: 300 }, children: [
      new TextRun({ text: "Methodology: ", bold: true, size: 19, color: BK, font: "Calibri" }),
      new TextRun({ text: "Source files counted excluding node_modules, dist, and build artifacts. 'Shared' or 'Embedded' means the product is integrated into a parent product's codebase. Completion % reflects production readiness (code + deployment + testing + docs), not just lines written.", size: 19, color: GY, font: "Calibri" }),
    ] }),
    new Paragraph({ spacing: { before: 200 }, children: [
      new TextRun({ text: "Total source files audited: 700+  |  Products: 16  |  Live in production: 8  |  Beta: 4  |  In Development: 2  |  Roadmap: 2", bold: true, size: 20, color: A, font: "Calibri" }),
    ], alignment: AlignmentType.CENTER }),
  ]}],
});

const buf = await Packer.toBuffer(doc);
const outPath = "C:/Users/616078/Downloads/Swifter_Product_Readiness_Matrix.docx";
fs.writeFileSync(outPath, buf);
console.log("✅ Saved:", outPath);
console.log("   Size:", (buf.length / 1024).toFixed(1), "KB");
