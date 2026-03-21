import { Document, Packer, Paragraph, TextRun, BorderStyle, HeadingLevel, AlignmentType, ShadingType } from "docx";
import fs from "fs";
import path from "path";

const BLUE = "1E3A5F";
const ACCENT = "3B82F6";
const RED = "DC2626";
const ORANGE = "F59E0B";
const GREEN = "16A34A";
const GRAY = "6B7280";
const BLACK = "000000";
const LIGHT_BG = "F8FAFC";

function heading(text, color = BLUE) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color, font: "Calibri" })],
    spacing: { before: 500, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
  });
}

function tierHeading(text, color) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, color, font: "Calibri" })],
    spacing: { before: 600, after: 200 },
    border: { bottom: { style: BorderStyle.THICK, size: 4, color } },
  });
}

function label(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20, color: GRAY, font: "Calibri" })],
    spacing: { before: 60, after: 20 },
  });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri", color: BLACK, bold: opts.bold, italics: opts.italics })],
    spacing: { before: opts.spaceBefore || 0, after: opts.spaceAfter || 60 },
  });
}

function emailBlock(company, subject, body) {
  const paras = [];
  paras.push(new Paragraph({
    children: [new TextRun({ text: `📧 ${company}`, bold: true, size: 26, color: BLUE, font: "Calibri" })],
    spacing: { before: 400, after: 60 },
    shading: { type: ShadingType.SOLID, color: LIGHT_BG },
  }));
  paras.push(label("Subject:"));
  paras.push(bodyText(subject, { bold: true }));
  paras.push(label("Body:"));
  
  const lines = body.split("\n");
  for (const line of lines) {
    if (line.trim() === "") {
      paras.push(new Paragraph({ spacing: { before: 80, after: 80 } }));
    } else {
      paras.push(bodyText(line));
    }
  }
  
  paras.push(new Paragraph({
    children: [new TextRun({ text: "─".repeat(60), size: 16, color: "D1D5DB", font: "Calibri" })],
    spacing: { before: 200, after: 100 },
  }));
  
  return paras;
}

const children = [];

// Title
children.push(new Paragraph({ spacing: { before: 1000 } }));
children.push(new Paragraph({
  children: [new TextRun({ text: "PayGuard", size: 72, bold: true, color: ACCENT, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Outreach Email Templates", size: 40, color: BLUE, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Personalised by Company · Tier-Specific Messaging", size: 24, color: GRAY, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "March 2026 — Confidential", size: 22, color: GRAY, font: "Calibri" })],
  alignment: AlignmentType.CENTER,
}));

// ═══════════════════════════════════════════════════════════════════════════
// TIER 1
// ═══════════════════════════════════════════════════════════════════════════

children.push(tierHeading("🔴 TIER 1 — Crisis Mode Emails", RED));
children.push(bodyText("Strategy: Lead with their specific loss. Offer 14-day shadow mode pilot with zero risk.", { italics: true, spaceBefore: 0, spaceAfter: 200 }));

// 1. Capitec
children.push(...emailBlock("Capitec Bank",
  "R1.2B lost through banking apps in 2024 — PayGuard catches what your backend can't see",
`Hi [Name],

Banking apps now account for 65% of South Africa's digital fraud — over R1.2 billion in losses in 2024 alone. As SA's largest retail bank, Capitec carries a disproportionate share of that burden.

The core issue: server-side fraud detection can't see what's happening ON the user's device during the payment.

PayGuard is an SDK that sits inside your banking app and detects fraud signals your backend never receives:

• Is the customer on a phone call while making a payment? (70% of vishing fraud)
• Was the recipient's number pasted rather than typed? (fraud script indicator)
• Is a remote access tool controlling the device? (RAT scam)
• Is the caller's voice AI-generated? (deepfake vishing)

We return an ALLOW / WARN / BLOCK decision in under 100ms — before the transaction reaches your core banking system.

I'd like to offer Capitec a 14-day shadow mode pilot: our SDK observes and scores transactions without blocking anything. You see exactly what we'd catch — with zero risk to your customers.

Would 20 minutes next week work to walk you through a live demo?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa | payguard.africa/demo`));

// 2. TymeBank
children.push(...emailBlock("TymeBank",
  "You warned about AI social engineering — here's the SDK that detects it in real time",
`Hi [Name],

I saw TymeBank's recent advisory warning customers about AI-driven social engineering — voice cloning, fake payment links, and AI-enhanced vishing. It's the exact threat we built PayGuard to stop.

PayGuard is a lightweight SDK (< 2MB) that detects fraud signals during the payment session itself:

• RULE_030 — Voice Deepfake Shield: Analyses call audio for synthetic speech markers (missing breath patterns, uniform pitch, spectral artifacts). Scores voice authenticity 0–100%.
• RULE_033 — AI Conversation Detector: Identifies AI-driven social engineering calls (uniform response timing, no filler words, perfect grammar).
• RULE_014 — OTP Interception Guard: Detects when the OTP screen is open while on a phone call with an unknown number — the exact OTP phishing pattern.

These rules run on-device and return a decision in under 100ms. In shadow mode, we observe without blocking — so you can validate detection accuracy before going live.

TymeBank is already thinking about this problem. We have the technology to solve it. Can we set up a 30-minute technical walkthrough?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa | payguard.africa/demo`));

// 3. MTN MoMo
children.push(...emailBlock("MTN Group (MoMo)",
  "$53M lost to MoMo fraud in Nigeria — PayGuard covers both smartphone AND feature phone channels",
`Hi [Name],

MoMo's $53 million fraud loss in Nigeria and GHS 27 million in Ghana represent the scale of the problem — but also the opportunity to fundamentally change how mobile money fraud is detected across Africa.

Most fraud prevention tools require a smartphone SDK. That leaves out the 40%+ of MoMo users on feature phones who transact via USSD. PayGuard solves both:

SDK Channel (Smartphones):
• 35 fraud rules executing in < 100ms
• Call-state detection during payment (catches 70% of vishing)
• SIM swap detection, device fingerprinting, behavioural biometrics

USSD Channel (Feature Phones):
• Server-side scoring endpoint — no SDK required
• 8 USSD-specific rules: SIM swap, velocity, beneficiary risk, time-of-day, cooling-off, geolocation, new subscriber, rapid session
• Returns risk decision with USSD-formatted warning prompts (fits shortcode display)

Africa-tuned thresholds: Our structuring detection uses GHS 50,000 (Ghana), NGN 5M (Nigeria), and KES 500K (Kenya) reporting thresholds — not generic US/EU values.

I'd welcome 20 minutes to demo PayGuard's dual-channel approach for a specific MoMo market. We also offer a 14-day shadow mode pilot at no cost.

Best regards,
Malcolm
Founder, PayGuard
payguard.africa | payguard.africa/demo`));

// 4. Safaricom
children.push(...emailBlock("Safaricom (M-Pesa)",
  "SIM swap investigations up 327% — PayGuard detects swap + fraud ring patterns before money moves",
`Hi [Name],

The numbers from 2024 tell the story: $4M in SIM fraud losses, 113 staff terminated for fraud, SIM swap investigations up 327%, and 123,000 fraudulent SIM cards registered using stolen identities. M-Pesa's scale makes it the highest-value target in East Africa.

PayGuard addresses three critical gaps:

1. SIM Swap Detection (RULE_006) — Flags transactions where a SIM swap was detected in the current session, before the payment completes.

2. Device-on-Multiple-Accounts (RULE_007) — When a single device fingerprint appears across 3+ user accounts, it's a fraud ring indicator. Our graph engine maps these connections in real time.

3. USSD Channel Scoring — For the millions of M-Pesa users on feature phones, our server-side scoring endpoint evaluates 8 rules without requiring an SDK install.

We also detect the internal fraud pattern: RULE_032 (Synthetic Identity) flags accounts created with stolen IDs, and RULE_035 (Document Forgery Scanner) catches AI-generated identity documents.

I'd like to offer a 14-day shadow mode pilot — we observe and score transactions alongside your existing systems, without interfering. You see exactly what PayGuard catches.

Can we schedule a 30-minute call?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa | payguard.africa/demo`));

// 5. Flutterwave
children.push(...emailBlock("Flutterwave",
  "NGN 11B breach used 'many small transfers' — PayGuard's velocity detection catches that pattern",
`Hi [Name],

Flutterwave's April 2024 breach — where NGN 11 billion was diverted through small transfers designed to avoid triggering fraud checks — is precisely the attack vector PayGuard's RULE_022 (Velocity & Structuring Detection) was built to catch.

Our rule detects:
• Rapid sequential transactions (> 5 in 10 minutes)
• Amounts clustering just below reporting thresholds (90-100% of NGN 5M CBN threshold, or $10K USD)
• Cross-currency structuring patterns

But velocity is just one layer. PayGuard runs 35 rules simultaneously, including:
• Device binding — same device used across multiple accounts (fraud ring pattern)
• Beneficiary network risk — recipient account with multiple fraud reports from different senders
• Remote access tool detection — blocks transactions while TeamViewer/AnyDesk is active

All scored in < 100ms. Shadow mode available for risk-free validation.

As a payment infrastructure provider, Flutterwave could also offer PayGuard as a value-add to your merchants — adding SDK-level fraud protection to every checkout built on Flutterwave.

Worth a 20-minute conversation?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa | payguard.africa/demo`));

// 6. OPay
children.push(...emailBlock("OPay",
  "EFCC's December warning — PayGuard adds the fraud prevention layer regulators expect",
`Hi [Name],

The EFCC's December 2025 warning to OPay to enhance fraud prevention and AML controls puts a clear timeline on the need for stronger detection. PayGuard can help close that gap quickly.

Where PayGuard fits in OPay's stack:

KYC Strengthening:
• RULE_032 (Synthetic Identity Detector) — Flags accounts assembled from real + fake data: SIM age vs account age mismatch, disposable emails, recycled phone numbers, isolated social graph nodes, AI-generated profile photos.
• RULE_035 (Document Forgery Scanner) — Detects AI-generated or digitally altered identity documents via EXIF analysis, font consistency checks, and MRZ validation.

Transaction-Level Detection:
• Device binding — one device, one account. Prevents fraudsters from operating multiple mule accounts from a single device.
• Velocity/structuring — catches the rapid small-value transfers that exploit KYC gaps.
• Call-state awareness — if a user is on a phone call while making a payment to an unknown recipient, the risk score spikes immediately.

We offer a shadow mode pilot — PayGuard observes and scores without blocking, so you can validate detection accuracy and present results to regulators as evidence of enhanced controls.

Can we schedule a technical walkthrough this week?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa | payguard.africa/demo`));

// 7. Mukuru
children.push(...emailBlock("Mukuru",
  "R18M SIM swap fraud ring + employee ID theft — PayGuard detects both vectors",
`Hi [Name],

Mukuru's R18 million SIM swap fraud ring and the employee cases involving fake ID documents represent two distinct attack vectors — and PayGuard detects both.

External Fraud (SIM Swap Ring):
• RULE_006 — Detects SIM swap events in the current session
• RULE_023 — Beneficiary Network Risk: flags recipients that have received funds from 3+ flagged transactions across different senders (mule account pattern)
• RULE_025 — Cooling-off period for first-time recipients above ZAR 2,500

Internal/Identity Fraud (Fake IDs):
• RULE_032 — Synthetic Identity Detector: flags mismatches between SIM age and claimed account tenure, disposable emails, recycled phone numbers
• RULE_035 — Document Forgery Scanner: detects AI-generated or tampered identity documents via EXIF metadata, font analysis, and micro-pattern verification

PayGuard's SDK integrates into your mobile app and returns a risk decision in under 100ms. In shadow mode, we observe without interfering — you validate accuracy, then decide when to enable warnings and blocks.

Worth a quick call to discuss?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa | payguard.africa/demo`));

// ═══════════════════════════════════════════════════════════════════════════
// TIER 2
// ═══════════════════════════════════════════════════════════════════════════

children.push(tierHeading("🟡 TIER 2 — Active Prevention Emails", ORANGE));
children.push(bodyText("Strategy: Position PayGuard as a complementary SDK layer that sees what server-side detection misses.", { italics: true, spaceBefore: 0, spaceAfter: 200 }));

// 8. Discovery Bank
children.push(...emailBlock("Discovery Bank",
  "Your AI reduced EFT fraud 80% — PayGuard adds the on-device signals your server never sees",
`Hi [Name],

Congratulations on the 80% EFT fraud reduction — that's a remarkable result. Discovery Bank's AI-forward approach to security is exactly the right direction.

There's one gap server-side AI can't close: what's happening on the customer's device during the payment session.

PayGuard is a lightweight SDK (< 2MB) that captures signals your backend never receives:

• Is the customer currently on a phone call? (vishing pattern — responsible for the majority of social engineering losses)
• Is the caller's voice AI-generated? (deepfake detection with sub-second scoring)
• Is a remote access tool active? (TeamViewer/AnyDesk — the "courier scam" pattern)
• Was the OTP screen viewed while on a call with an unknown number?

These signals feed into 35 rules that return an ALLOW / WARN / BLOCK decision in < 100ms — before the payment reaches your EFT processing layer.

PayGuard isn't a replacement for your AI — it's a complementary layer that catches what server-side monitoring physically cannot see.

Would a 20-minute demo be of interest?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa | payguard.africa/demo`));

// 9-13: SA Big Banks (template)
const saBanks = [
  ["African Bank", "africanbank.co.za", "African Bank's investment in Experian's Hunter for fraud prevention shows the right strategic direction. PayGuard adds a complementary layer"],
  ["Nedbank", "nedbank.co.za", "Nedbank's digital banking customers are part of the R1.888 billion lost to SA digital fraud in 2024. PayGuard adds a layer"],
  ["FNB", "fnb.co.za", "FNB has always led on innovation — eBucks, app-first banking, API partnerships. PayGuard is the next innovation layer"],
  ["Absa", "absa.co.za", "With operations across 12 African markets, Absa faces fraud across ZAR, NGN, KES, and GHS — exactly the currencies PayGuard's rules are tuned for. PayGuard adds a layer"],
  ["Standard Bank", "standardbank.co.za", "As Africa's largest bank by assets across 20 countries, Standard Bank's attack surface is unmatched. PayGuard adds a layer"],
];

for (const [bank, website, intro] of saBanks) {
  children.push(...emailBlock(bank,
    `R1.888B lost to SA digital banking fraud in 2024 — adding SDK-level detection to ${bank}'s app`,
`Hi [Name],

${intro} that your existing server-side fraud detection can't provide: real-time on-device signals.

PayGuard is a lightweight SDK that sits inside your banking app and captures:

• Call state — Is the customer on a phone call while making a payment? (70% of vishing catch rate)
• Device intelligence — Rooted/jailbroken device, emulator, active remote access tool
• Behavioural biometrics — Typing cadence, touch pressure, scroll velocity vs user baseline
• Paste detection — Was the recipient number pasted from a scam SMS?

35 rules. < 100ms response time. ALLOW / WARN / BLOCK.

We offer a 14-day shadow mode pilot — the SDK observes and scores without blocking any transactions. You see what PayGuard would have caught, with zero risk to customers.

Quick demo next week?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa | payguard.africa/demo`));
}

// Ozow, Paystack, PalmPay, Airtel
children.push(...emailBlock("Ozow",
  "0.02% fraud rate is impressive — PayGuard helps keep it there as your attack surface grows",
`Hi [Name],

Ozow's 0.02% fraud rate is industry-leading — and demonstrates strong server-side detection. As instant EFT volumes grow, maintaining that rate gets harder.

PayGuard adds a client-side layer: our SDK captures device intelligence, behavioural signals, and call-state awareness that your server-side detection can't access. It integrates via a single JavaScript snippet for web payments and native SDKs for mobile.

We return a risk score and decision before the EFT is initiated — giving Ozow an additional pre-transaction fraud signal. Shadow mode available for validation.

Worth a quick conversation?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa`));

children.push(...emailBlock("PalmPay",
  "35M users, 300M monthly transactions — PayGuard's call-state detection catches what biometrics miss",
`Hi [Name],

PalmPay's investment in biometric auth, phone-binding, and AI anomaly detection is the right foundation. There's a critical signal these tools don't capture: what's happening during the payment session itself.

PayGuard detects:
• Active phone call during payment (social engineering pattern)
• AI-generated caller voice (deepfake vishing — emerging across Nigeria)
• Remote access tools (RAT scams where victim is "guided" through the transfer)
• Velocity structuring below the NGN 5M CBN reporting threshold

35 rules, < 100ms, works alongside your existing fraud stack. Shadow mode pilot available.

20 minutes for a demo?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa`));

children.push(...emailBlock("Airtel Money",
  "From employee theft to system breaches — PayGuard detects internal and external fraud patterns",
`Hi [Name],

The Sh670M employee theft incident and the 2022 Uganda system breach highlight two distinct fraud vectors. PayGuard's device-level detection catches both:

• Device-on-Multiple-Accounts (RULE_007): When a single device is used across 3+ user accounts — a pattern common in both internal and external fraud rings
• Synthetic Identity Detection (RULE_032): Flags accounts created with mismatched data (new SIM + old account, disposable email, recycled phone number)
• SIM Swap Detection (RULE_006): Catches session-level SIM changes before the transaction completes

Our USSD scoring endpoint also covers feature phone users — no SDK required.

Shadow mode pilot available. Can we schedule a walk-through?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa`));

// ═══════════════════════════════════════════════════════════════════════════
// TIER 3
// ═══════════════════════════════════════════════════════════════════════════

children.push(tierHeading("🟢 TIER 3 — Future-Proofing Emails", GREEN));
children.push(bodyText("Strategy: Position PayGuard's AI fraud rules (RULE_030-035) as forward-looking protection against deepfake and AI-driven threats.", { italics: true, spaceBefore: 0, spaceAfter: 200 }));

// Insurance
children.push(...emailBlock("Old Mutual",
  "AI-generated documents and deepfake liveness — the next wave of insurance fraud is already here",
`Hi [Name],

Old Mutual's use of AI for image and document verification in claims is forward-thinking. The challenge now is that fraudsters are using the same AI tools — generating photorealistic identity documents and deepfake selfies that pass traditional liveness checks.

PayGuard's AI fraud rules were built specifically for this:

• RULE_035 — Document Forgery Scanner: Detects AI-generated documents via EXIF metadata analysis (AI images lack camera EXIF), font consistency checks, micro-pattern analysis, and double-JPEG compression detection.

• RULE_031 — Liveness Spoofing Guard: Catches deepfake presentations (GAN artifacts, moiré patterns from screen replay, 3D depth failures, injection attacks via virtual cameras).

• RULE_030 — Voice Deepfake Shield: For claims calls — detects AI-generated voice (missing breath patterns, uniform pitch variance, spectral artifacts from neural vocoders).

These rules complement your existing AI verification tools by detecting the specific artifacts that generative AI leaves behind. We're POPIA-compliant (we have a DPA document ready for review).

Would you be open to a technical demonstration?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa`));

children.push(...emailBlock("Sanlam",
  "Social media impersonation and fake investments — PayGuard detects AI-powered fraud at the source",
`Hi [Name],

Sanlam's zero-tolerance policy on financial crime and your warnings about social media impersonation show the right posture. The next wave of these attacks will use AI — cloned voices, generated documents, and chatbot-driven social engineering at scale.

PayGuard's RULE_030-035 provide forward-looking protection:
• Voice deepfake detection during phone interactions
• AI conversation detection (identifies chatbot-driven social engineering calls)
• Synthetic identity detection for onboarding fraud
• Document forgery scanning for AI-generated identity documents

We're POPIA-compliant and have a DPA document ready for review. Shadow mode available for risk-free validation.

Worth exploring?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa`));

children.push(...emailBlock("Hollard",
  "Your voice analysis catches humans lying — PayGuard catches AI impersonating humans",
`Hi [Name],

Hollard's use of layered voice-analysis software for claims fraud detection is sophisticated — and effective against human fraudsters. The emerging gap: AI-generated voices that don't exhibit the stress patterns your voice analysis looks for.

PayGuard's RULE_030 (Voice Deepfake Shield) complements your existing voice analysis by detecting synthetic speech markers:
• Missing micro-pauses and breath patterns
• Uniform pitch variance (too perfect = fake)
• Spectral artifacts from neural vocoder output
• Frame-level consistency scoring

Deepfake voices bypass traditional voice stress analysis because they're "calm" by default. PayGuard catches what your current tools can't.

Quick demo?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa`));

// PSPs and remaining
const tier3Generic = [
  ["Peach Payments", "As e-commerce fraud grows across SA, your merchants need client-side protection. PayGuard's SDK adds device intelligence and behavioural signals to every checkout — complementing your existing risk-checking tools."],
  ["Stitch (Stitch Pay)", "Stitch publishes excellent fraud prevention content — your engineering team clearly takes security seriously. PayGuard adds the SDK layer that captures signals your API-based approach can't: call state, device fingerprint, behavioural biometrics."],
  ["DPO Group", "Operating across 21 African markets, DPO Group faces fraud patterns that vary by country. PayGuard's rules include currency-specific thresholds for ZAR, NGN, KES, GHS, and USD — tuned for African payment corridors, not generic global values."],
  ["Yoco", "As Yoco's merchant base grows and card-not-present fraud rises (85.6% of SA credit card fraud), PayGuard's device intelligence adds a pre-transaction fraud signal that protects both merchants and cardholders."],
  ["Mama Money", "Mama Money's proactive fraud education is outstanding. PayGuard adds the technical layer — SIM swap detection, synthetic identity flagging, and beneficiary risk scoring — to complement your educational efforts with real-time protection."],
  ["Hello Paisa", "Customer trust is everything in remittances. PayGuard's SIM swap detection, device binding, and real-time scoring help ensure every transfer is legitimate — protecting both your customers and your brand reputation."],
  ["Chipper Cash", "Chipper Cash's challenge with fraudulent sign-ups is exactly what PayGuard's synthetic identity detection and device binding address. One device = one account. AI-generated profile photos are flagged automatically."],
  ["Vodacom (M-Pesa)", "With M-Pesa operations across Mozambique, Tanzania, and DRC, Vodacom faces mobile money fraud across multiple markets. PayGuard's USSD scoring covers feature phone users, while the SDK protects smartphone M-Pesa."],
  ["WorldRemit (Zepz)", "WorldRemit's brand being exploited for scams in Ghana damages trust. PayGuard's synthetic identity detection and beneficiary risk scoring help ensure the accounts receiving remittances are legitimate."],
  ["Equity Bank", "KSh 270 million in debit card fraud in April 2024 alone demonstrates the scale of the challenge. PayGuard's 35-rule engine detects the device intelligence, behavioural, and call-state signals that card fraud prevention misses."],
];

for (const [company, pitch] of tier3Generic) {
  children.push(...emailBlock(company,
    `Deepfake voice + AI social engineering — Africa's next fraud wave. Is ${company} ready?`,
`Hi [Name],

SABRIC is warning that real-time deepfake audio and video scams will be widespread across Africa in 2025. As AI tools become more accessible, the attack surface expands to every voice call and identity verification.

${pitch}

Our AI fraud rules (RULE_030-035) specifically detect:
• Voice deepfakes during phone calls
• Liveness spoofing (GAN artifacts, injection attacks)
• Synthetic identities (assembled from real + fake data)
• AI-driven social engineering calls
• Remote access tool abuse
• AI-generated document forgery

35 rules. < 100ms. Shadow mode available.

Worth a conversation?

Best regards,
Malcolm
Founder, PayGuard
payguard.africa | payguard.africa/demo`));
}

// Build and save
const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [{ children }],
});

const downloadsPath = path.join("C:", "Users", "616078", "Downloads", "PayGuard_Outreach_Emails.docx");
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(downloadsPath, buffer);
console.log("✅ Document saved to:", downloadsPath);
console.log("   File size:", (buffer.length / 1024).toFixed(1), "KB");
console.log("   Emails generated: 30 companies across 3 tiers");
