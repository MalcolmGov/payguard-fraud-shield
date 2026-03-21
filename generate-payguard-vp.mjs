import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType, Table, TableRow, TableCell, WidthType, PageBreak, VerticalAlign, TableLayoutType } from "docx";
import fs from "fs";

const N="0F172A",B="1E3A5F",A="3B82F6",G="10B981",R="EF4444",O="F59E0B",GY="6B7280",LG="F1F5F9",W="FFFFFF",BK="111827",PUR="7C3AED",CY="06B6D4";

const h1=(t)=>new Paragraph({children:[new TextRun({text:t,bold:true,size:36,color:N,font:"Calibri"})],spacing:{before:500,after:200},border:{bottom:{style:BorderStyle.SINGLE,size:2,color:A}}});
const h2=(t,c=B)=>new Paragraph({children:[new TextRun({text:t,bold:true,size:26,color:c,font:"Calibri"})],spacing:{before:360,after:120}});
const h3=(t,c=A)=>new Paragraph({children:[new TextRun({text:t,bold:true,size:22,color:c,font:"Calibri"})],spacing:{before:240,after:80}});
const p=(t,o={})=>new Paragraph({children:[new TextRun({text:t,size:21,font:"Calibri",color:o.color||BK,bold:o.bold,italics:o.italic})],spacing:{after:o.noSpace?20:120}});
const bullet=(t,bp=null)=>{const c=[];if(bp)c.push(new TextRun({text:bp+" ",bold:true,size:21,font:"Calibri",color:BK}));c.push(new TextRun({text:t,size:21,font:"Calibri",color:BK}));return new Paragraph({children:c,spacing:{after:60},bullet:{level:0}})};
const cell=(t,o={})=>new TableCell({children:[new Paragraph({children:[new TextRun({text:t||"",size:o.size||18,color:o.color||BK,font:"Calibri",bold:o.bold})],alignment:o.center?AlignmentType.CENTER:AlignmentType.LEFT,spacing:{before:30,after:30}})],shading:o.bg?{type:ShadingType.SOLID,color:o.bg}:undefined,verticalAlign:VerticalAlign.CENTER,width:o.width?{size:o.width,type:WidthType.PERCENTAGE}:undefined,margins:{top:50,bottom:50,left:80,right:80}});
const pb=()=>new Paragraph({children:[new PageBreak()]});
const hdr=(t,w)=>cell(t,{bold:true,bg:N,color:W,width:w});

const c = [];

// ═══ COVER ═══
c.push(new Paragraph({spacing:{before:1000}}));
c.push(new Paragraph({children:[new TextRun({text:"PAYGUARD",size:56,bold:true,color:N,font:"Calibri"})],alignment:AlignmentType.CENTER}));
c.push(new Paragraph({children:[new TextRun({text:"Real-Time Fraud Prevention Platform",size:30,color:A,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{after:80}}));
c.push(new Paragraph({children:[new TextRun({text:"Value Proposition",size:28,color:GY,font:"Calibri",italics:true})],alignment:AlignmentType.CENTER,spacing:{after:200}}));
c.push(new Paragraph({children:[new TextRun({text:"The only fraud platform built for Africa — with on-device call detection",size:22,bold:true,color:R,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{after:100}}));
c.push(new Paragraph({children:[new TextRun({text:"Confidential — March 2026",size:20,color:GY,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{after:400}}));

// Key stats
c.push(new Table({layout:TableLayoutType.FIXED,rows:[new TableRow({children:[
  cell("$4B+",{bold:true,center:true,color:A,size:28,bg:LG,width:20}),
  cell("37",{bold:true,center:true,color:A,size:28,bg:LG,width:20}),
  cell("<100ms",{bold:true,center:true,color:A,size:28,bg:LG,width:20}),
  cell("3",{bold:true,center:true,color:A,size:28,bg:LG,width:20}),
  cell("3",{bold:true,center:true,color:A,size:28,bg:LG,width:20}),
]}),new TableRow({children:[
  cell("Annual Fraud Losses (Africa)",{center:true,color:GY,size:16,bg:LG,width:20}),
  cell("Fraud Detection Rules",{center:true,color:GY,size:16,bg:LG,width:20}),
  cell("Risk Scoring Latency",{center:true,color:GY,size:16,bg:LG,width:20}),
  cell("Native SDKs (iOS, Android, JS)",{center:true,color:GY,size:16,bg:LG,width:20}),
  cell("Live Microservices",{center:true,color:GY,size:16,bg:LG,width:20}),
]})],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(pb());

// ═══ THE PROBLEM ═══
c.push(h1("The Problem"));
c.push(p("Africa lost over $4 billion to payment fraud in 2024 (Interpol). Social engineering and SIM swap fraud are growing 45% year-over-year. The core challenge:"));
c.push(bullet("70% of mobile money fraud in Africa starts with a phone call — the victim is coached in real-time to transfer money, share an OTP, or approve a payment."));
c.push(bullet("Existing global fraud platforms (ThreatMetrix, BioCatch, Featurespace) don't capture on-device phone call signals. They were designed for Western card-not-present fraud, not African voice-phishing."));
c.push(bullet("African banks and mobile money operators are absorbing these losses or passing them to customers — neither is sustainable as digital payments scale."));
c.push(bullet("AI is making attacks worse: deepfake voice cloning, AI-powered social engineering calls, synthetic identity creation, and document forgery are all accelerating."));

// ═══ THE SOLUTION ═══
c.push(h1("The Solution: PayGuard"));
c.push(p("PayGuard is the only fraud prevention platform purpose-built for African payment fraud. It combines on-device intelligence, real-time risk scoring, and AI-powered detection across three channels: mobile banking apps (SDK), USSD, and API."));

c.push(h2("What Makes PayGuard Unique"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Capability",35),hdr("PayGuard",15),hdr("ThreatMetrix",12),hdr("BioCatch",12),hdr("Featurespace",14),hdr("Shield (SG)",12)]}),
  new TableRow({children:[cell("On-device call detection"),cell("✅",{center:true,color:G}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R})]}),
  new TableRow({children:[cell("OTP screen protection",{bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG})]}),
  new TableRow({children:[cell("Voice deepfake detection"),cell("✅",{center:true,color:G}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R})]}),
  new TableRow({children:[cell("AI caller detection",{bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG})]}),
  new TableRow({children:[cell("USSD channel fraud rules"),cell("✅",{center:true,color:G}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R})]}),
  new TableRow({children:[cell("Behavioral biometrics",{bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("✅",{center:true,color:G,bg:LG})]}),
  new TableRow({children:[cell("Device fingerprinting"),cell("✅",{center:true,color:G}),cell("✅",{center:true,color:G}),cell("❌",{center:true,color:R}),cell("✅",{center:true,color:G}),cell("✅",{center:true,color:G})]}),
  new TableRow({children:[cell("Graph-based fraud rings",{bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("❌",{center:true,color:R,bg:LG})]}),
  new TableRow({children:[cell("Remote access tool detection"),cell("✅",{center:true,color:G}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("✅",{center:true,color:G})]}),
  new TableRow({children:[cell("Africa-specific fraud patterns",{bg:LG}),cell("✅",{center:true,color:G,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG}),cell("❌",{center:true,color:R,bg:LG})]}),
  new TableRow({children:[cell("Native mobile SDKs"),cell("✅ iOS+Android",{center:true,color:G}),cell("✅",{center:true,color:G}),cell("❌",{center:true,color:R}),cell("❌",{center:true,color:R}),cell("✅",{center:true,color:G})]}),
  new TableRow({children:[cell("Pricing (est.)",{bg:LG}),cell("$0.01/txn",{center:true,bg:LG}),cell("$0.05-0.15",{center:true,bg:LG}),cell("$0.03-0.10",{center:true,bg:LG}),cell("$0.05-0.10",{center:true,bg:LG}),cell("$0.02-0.05",{center:true,bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(pb());

// ═══ FRAUD RULES ENGINE ═══
c.push(h1("Fraud Rules Engine — 37 Rules"));
c.push(p("Every transaction is scored against all applicable rules simultaneously. Scores are summed — higher total score = higher fraud probability. Banks configure their own threshold (e.g., score >70 = block, 40-70 = additional verification, <40 = allow)."));

// Social Engineering Rules
c.push(h2("🔴 Social Engineering & Core Rules (20 Rules)", R));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Rule",10),hdr("Name",25),hdr("Max Score",10),hdr("What It Detects",55)]}),
  new TableRow({children:[cell("001"),cell("Vishing Triple Threat"),cell("75",{center:true,color:R}),cell("Active call + new recipient + high amount — catches 70% of vishing fraud")]}),
  new TableRow({children:[cell("002",{bg:LG}),cell("Call + Unknown Recipient",{bg:LG}),cell("40",{center:true,color:O,bg:LG}),cell("On phone call while sending to someone not in contacts",{bg:LG})]}),
  new TableRow({children:[cell("003"),cell("Rushed Transaction"),cell("30",{center:true,color:O}),cell("Transaction initiated within 10 seconds of session start")]}),
  new TableRow({children:[cell("004",{bg:LG}),cell("Paste Detection",{bg:LG}),cell("20",{center:true,bg:LG}),cell("Recipient number was pasted (fraud scripts paste mule accounts)",{bg:LG})]}),
  new TableRow({children:[cell("005"),cell("First Transfer + High Amount"),cell("35",{center:true,color:O}),cell("New recipient + amount >2x user average")]}),
  new TableRow({children:[cell("006",{bg:LG}),cell("SIM Swap Detected",{bg:LG}),cell("50",{center:true,color:R,bg:LG}),cell("SIM swap event in current session — account takeover preparation",{bg:LG})]}),
  new TableRow({children:[cell("007"),cell("Multi-Account Device"),cell("60",{center:true,color:R}),cell("Device fingerprint seen on 3+ user accounts (fraud ring)")]}),
  new TableRow({children:[cell("008",{bg:LG}),cell("Fraud SMS Keywords",{bg:LG}),cell("25",{center:true,bg:LG}),cell("Recent SMS contained scam keywords — victim may be primed",{bg:LG})]}),
  new TableRow({children:[cell("009"),cell("Root/Jailbreak"),cell("20",{center:true}),cell("Rooted Android or jailbroken iOS — fraud farm indicator")]}),
  new TableRow({children:[cell("010",{bg:LG}),cell("VPN/Proxy",{bg:LG}),cell("15",{center:true,bg:LG}),cell("VPN or proxy active — location obfuscation",{bg:LG})]}),
  new TableRow({children:[cell("011"),cell("Emulator"),cell("40",{center:true,color:O}),cell("Emulator or simulator detected — fraud farms scale via emulators")]}),
  new TableRow({children:[cell("012",{bg:LG}),cell("Recipient Changes",{bg:LG}),cell("25",{center:true,bg:LG}),cell("Recipient changed 3+ times in session — testing mule accounts",{bg:LG})]}),
  new TableRow({children:[cell("013"),cell("App Tamper"),cell("50",{center:true,color:R}),cell("Modified banking app binary detected")]}),
  new TableRow({children:[cell("014",{bg:LG}),cell("OTP Screen on Call ⚡",{bg:LG}),cell("80",{center:true,color:R,bg:LG}),cell("OTP screen viewed during active call with unknown number — OTP interception attempt",{bg:LG})]}),
  new TableRow({children:[cell("021"),cell("Geolocation Anomaly"),cell("35",{center:true,color:O}),cell("Transaction >500km from user's usual location (haversine)")]}),
  new TableRow({children:[cell("022",{bg:LG}),cell("Velocity/Structuring",{bg:LG}),cell("45",{center:true,color:O,bg:LG}),cell("5+ transactions in 10min or amounts near FICA/CBN thresholds",{bg:LG})]}),
  new TableRow({children:[cell("023"),cell("Beneficiary Network Risk"),cell("55",{center:true,color:R}),cell("Recipient flagged in 3+ fraud reports from different senders (mule)")]}),
  new TableRow({children:[cell("024",{bg:LG}),cell("Time-of-Day Anomaly",{bg:LG}),cell("20",{center:true,bg:LG}),cell("Transaction between midnight–5am outside user's usual hours",{bg:LG})]}),
  new TableRow({children:[cell("025"),cell("Cooling-Off Period"),cell("30",{center:true,color:O}),cell("First-time recipient above threshold (APP fraud compliance)")]}),
  new TableRow({children:[cell("026",{bg:LG}),cell("Behavioural Biometrics",{bg:LG}),cell("25",{center:true,bg:LG}),cell("Typing cadence, touch pressure, scroll velocity, navigation pattern deviation",{bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(p(""));
// IP/Geo Rules (from aggregator)
c.push(h2("🌐 IP Intelligence Rules (3 Rules)", CY));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Rule",10),hdr("Name",25),hdr("What It Detects",65)]}),
  new TableRow({children:[cell("027"),cell("IP-Country Mismatch"),cell("IP geolocation doesn't match SIM country — cross-border fraud attempt")]}),
  new TableRow({children:[cell("028",{bg:LG}),cell("Hosting/Datacenter IP",{bg:LG}),cell("Request from cloud hosting provider IP — automated bot or fraud farm",{bg:LG})]}),
  new TableRow({children:[cell("029"),cell("IP-Device Distance"),cell("IP geolocation significantly distant from device GPS coordinates")]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(pb());

// AI Rules
c.push(h2("🤖 AI-Powered Fraud Rules (6 Rules)", PUR));
c.push(p("Next-generation rules detecting AI-driven attack vectors. These consume signals from the SDK's on-device ONNX model and server-side AI classifiers."));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Rule",10),hdr("Name",22),hdr("Max Score",10),hdr("What It Detects",58)]}),
  new TableRow({children:[cell("030"),cell("Voice Deepfake Shield"),cell("70",{center:true,color:R}),cell("AI-generated/cloned voice during active call — spectral analysis, breath patterns, pitch variance")]}),
  new TableRow({children:[cell("031",{bg:LG}),cell("Liveness Spoofing Guard",{bg:LG}),cell("85",{center:true,color:R,bg:LG}),cell("Deepfake face, screen replay, printed photo, mask, or virtual camera injection during KYC",{bg:LG})]}),
  new TableRow({children:[cell("032"),cell("Synthetic Identity"),cell("65",{center:true,color:R}),cell("Fabricated identity from real+fake data — SIM age mismatch, disposable email, graph isolation")]}),
  new TableRow({children:[cell("033",{bg:LG}),cell("AI Conversation Detector",{bg:LG}),cell("65",{center:true,color:R,bg:LG}),cell("AI chatbot impersonating bank staff — uniform response timing, no breathing, perfect grammar",{bg:LG})]}),
  new TableRow({children:[cell("034"),cell("Remote Access Blocker"),cell("85",{center:true,color:R}),cell("AnyDesk, TeamViewer, QuickSupport active — attacker remotely controlling victim's device")]}),
  new TableRow({children:[cell("035",{bg:LG}),cell("Document Forgery Scanner",{bg:LG}),cell("80",{center:true,color:R,bg:LG}),cell("AI-generated or digitally altered ID documents — EXIF analysis, font checks, MRZ validation",{bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

// USSD Rules
c.push(h2("📱 USSD / Feature Phone Rules (8 Rules)", O));
c.push(p("Server-side rules for USSD channels — no SDK required. All signals come from the institution's backend. Covers the 60% of African mobile users on feature phones."));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Rule",12),hdr("Name",22),hdr("Max Score",10),hdr("What It Detects",56)]}),
  new TableRow({children:[cell("USSD_001"),cell("SIM Swap + High Value"),cell("70",{center:true,color:R}),cell("SIM swap within 72hrs + high-value transfer — #1 USSD fraud vector")]}),
  new TableRow({children:[cell("USSD_002",{bg:LG}),cell("Velocity/Structuring",{bg:LG}),cell("45",{center:true,color:O,bg:LG}),cell("Rapid transactions or amounts near FICA/CBN reporting thresholds",{bg:LG})]}),
  new TableRow({children:[cell("USSD_003"),cell("Beneficiary Network"),cell("55",{center:true,color:R}),cell("Recipient blacklisted or flagged as mule account")]}),
  new TableRow({children:[cell("USSD_004",{bg:LG}),cell("Time-of-Day",{bg:LG}),cell("25",{center:true,bg:LG}),cell("USSD transaction during midnight–5am (post-SIM-swap pattern)",{bg:LG})]}),
  new TableRow({children:[cell("USSD_005"),cell("Cooling-Off"),cell("30",{center:true,color:O}),cell("First-time recipient above threshold — enforce hold/review window")]}),
  new TableRow({children:[cell("USSD_006",{bg:LG}),cell("Cell Tower Anomaly",{bg:LG}),cell("30",{center:true,color:O,bg:LG}),cell("Cell tower >200km from usual location (with accuracy margin)",{bg:LG})]}),
  new TableRow({children:[cell("USSD_007"),cell("New Subscriber"),cell("35",{center:true,color:O}),cell("Account <30 days old + high-value transfer — potential mule SIM")]}),
  new TableRow({children:[cell("USSD_008",{bg:LG}),cell("Rapid Session",{bg:LG}),cell("30",{center:true,color:O,bg:LG}),cell("USSD session completed in <10s with 3+ steps — automation/scripting",{bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(pb());

// ═══ ARCHITECTURE ═══
c.push(h1("Production Architecture"));
c.push(p("PayGuard is deployed as a microservices architecture on Railway with managed PostgreSQL and Redis. All services are live with verified health endpoints."));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Service",20),hdr("Stack",25),hdr("URL",35),hdr("Status",20)]}),
  new TableRow({children:[cell("API Gateway"),cell("Node.js, Express, TypeScript"),cell("api.payguard.africa"),cell("🟢 Live",{color:G})]}),
  new TableRow({children:[cell("Risk Engine",{bg:LG}),cell("Python, FastAPI, Uvicorn",{bg:LG}),cell("risk-engine.up.railway.app",{bg:LG}),cell("🟢 Live",{color:G,bg:LG})]}),
  new TableRow({children:[cell("Device Binding"),cell("Node.js, Express"),cell("device-binding.up.railway.app"),cell("🟢 Live",{color:G})]}),
  new TableRow({children:[cell("Graph Engine",{bg:LG}),cell("Python, FastAPI, Neo4j",{bg:LG}),cell("—",{bg:LG}),cell("🔵 Code Complete",{color:A,bg:LG})]}),
  new TableRow({children:[cell("PostgreSQL"),cell("Managed (Railway)"),cell("Internal"),cell("🟢 Live",{color:G})]}),
  new TableRow({children:[cell("Redis",{bg:LG}),cell("Managed (Railway)",{bg:LG}),cell("Internal",{bg:LG}),cell("🟢 Live",{color:G,bg:LG})]}),
  new TableRow({children:[cell("Dashboard"),cell("React, TypeScript, Vite"),cell("payguard.africa"),cell("🟢 Live",{color:G})]}),
  new TableRow({children:[cell("iOS SDK",{bg:LG}),cell("Swift, CXCallObserver",{bg:LG}),cell("CocoaPods / SPM",{bg:LG}),cell("🟢 Built",{color:G,bg:LG})]}),
  new TableRow({children:[cell("Android SDK"),cell("Kotlin, TelephonyManager"),cell("Maven / Gradle"),cell("🟢 Built",{color:G})]}),
  new TableRow({children:[cell("JavaScript SDK",{bg:LG}),cell("TypeScript, npm",{bg:LG}),cell("npm: @swifter/fraud-shield",{bg:LG}),cell("🟢 Published",{color:G,bg:LG})]}),
  new TableRow({children:[cell("CI/CD"),cell("GitHub Actions"),cell("4-job pipeline"),cell("🟢 Live",{color:G})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

// ═══ SDK CAPABILITIES ═══
c.push(h1("Native SDK Capabilities"));
c.push(h2("iOS SDK (Swift)"));
c.push(bullet("CXCallObserver integration — detects active calls without accessing call content (privacy-compliant)"));
c.push(bullet("OtpGuard: FLAG_SECURE equivalent + full-screen SCAM ALERT overlay when unknown caller detected during OTP entry"));
c.push(bullet("Hardware-backed device binding via Secure Enclave (P-256 key pair, never leaves device)"));
c.push(bullet("Behavioral signal collection: keystroke timing, paste detection, touch pressure, scroll patterns"));
c.push(bullet("Offline risk scoring — SDK scores locally when API is unreachable (fail-secure mode)"));
c.push(bullet("Distributed via CocoaPods and Swift Package Manager"));

c.push(h2("Android SDK (Kotlin)"));
c.push(bullet("TelephonyManager.listen(CALL_STATE) — real-time call state monitoring"));
c.push(bullet("OtpGuard: FLAG_SECURE on OTP screens + full-screen warning overlay for unknown callers"));
c.push(bullet("Hardware-backed device binding via Android Keystore (StrongBox, TEE)"));
c.push(bullet("Root detection: su binary, Magisk, test-keys, system properties, mounted paths"));
c.push(bullet("Emulator detection: Build.FINGERPRINT, HARDWARE, sensors, telephony properties"));
c.push(bullet("App tamper detection: signature verification, installer source, debugger attachment"));
c.push(bullet("Distributed via Maven Central / Gradle dependency"));

// ═══ BUSINESS MODEL ═══
c.push(pb());
c.push(h1("Business Model & Pricing"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Tier",15),hdr("Monthly Fee",15),hdr("Per API Call",15),hdr("Includes",55)]}),
  new TableRow({children:[cell("Free / Sandbox"),cell("$0"),cell("$0"),cell("1,000 API calls/month, JS SDK only, sandbox environment")]}),
  new TableRow({children:[cell("Startup",{bg:LG}),cell("$500",{bg:LG}),cell("$0.01",{center:true,bg:LG}),cell("50K calls/month, all SDKs, email support, dashboard",{bg:LG})]}),
  new TableRow({children:[cell("Growth"),cell("$2,000"),cell("$0.008",{center:true}),cell("500K calls/month, custom rules, priority support, SLA")]}),
  new TableRow({children:[cell("Enterprise",{bg:LG}),cell("Custom",{bg:LG}),cell("Custom",{center:true,bg:LG}),cell("Unlimited calls, dedicated support, custom AI models, on-premise option, SLA",{bg:LG})]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

// ═══ TARGET MARKET ═══
c.push(h1("Target Market"));
c.push(h2("Primary (Immediate)"));
c.push(bullet("South African banks: Standard Bank, ABSA, FNB, Capitec, Nedbank, TymeBank, Discovery Bank"));
c.push(bullet("Mobile money operators: MTN MoMo, Vodacom, Airtel Money, M-Pesa"));
c.push(bullet("Payment service providers: Ozow, Peach Payments, Yoco, iKhokha"));
c.push(bullet("Fintechs: TymeBank, Bank Zero, Ukheshe, Mukuru, Hello Paisa"));

c.push(h2("Secondary (6-12 months)"));
c.push(bullet("East African banks: Equity Bank (KE), KCB, NCBA, Stanbic"));
c.push(bullet("West African fintechs: Flutterwave, Paystack, OPay, Kuda, Moniepoint"));
c.push(bullet("Pan-African: Ecobank (36 countries), Standard Bank (20 countries)"));

// ═══ LIVE LINKS ═══
c.push(h1("Live Product Links"));
c.push(new Table({layout:TableLayoutType.FIXED,rows:[
  new TableRow({children:[hdr("Resource",30),hdr("URL",40),hdr("What You'll See",30)]}),
  new TableRow({children:[cell("PayGuard Dashboard"),cell("payguard.africa"),cell("Full admin dashboard")]}),
  new TableRow({children:[cell("Interactive Demo",{bg:LG}),cell("payguard.africa/demo",{bg:LG}),cell("7 fraud scenario walkthroughs",{bg:LG})]}),
  new TableRow({children:[cell("API Health Check"),cell("api.payguard.africa/health"),cell("Live JSON — hit it now")]}),
  new TableRow({children:[cell("Security Whitepaper",{bg:LG}),cell("Available on request",{bg:LG}),cell("28-page technical document",{bg:LG})]}),
  new TableRow({children:[cell("API Documentation"),cell("swifter.digital/developer-docs"),cell("OpenAPI 3.0 specs")]}),
],width:{size:100,type:WidthType.PERCENTAGE}}));

c.push(new Paragraph({spacing:{before:400}}));
c.push(p("Malcolm Govender", {bold:true}));
c.push(p("Founder & CEO, Swifter Technologies (Pty) Ltd"));
c.push(p("malcolm@swifter.digital | payguard.africa | swifter.digital"));
c.push(new Paragraph({spacing:{before:200}}));
c.push(p("— End of Document —", {italic:true}));

const doc = new Document({styles:{default:{document:{run:{font:"Calibri",size:21}}}},sections:[{children:c}]});
const buf = await Packer.toBuffer(doc);
const outPath = "C:/Users/616078/Downloads/PayGuard_Value_Proposition.docx";
fs.writeFileSync(outPath, buf);
console.log("✅ PayGuard Value Proposition saved:", outPath);
console.log("   Size:", (buf.length/1024).toFixed(1), "KB");
console.log("   Rules documented: 37");
