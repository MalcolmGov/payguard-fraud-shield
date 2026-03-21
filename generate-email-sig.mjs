import fs from "fs";
import path from "path";

// Read logo and convert to base64
const logoPath = "C:/Users/616078/.gemini/antigravity/scratch/randbridge/website/public/swifter-icon.png";
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Email Signature - Malcolm Govender</title></head>
<body style="margin:20px;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">

<div style="max-width:480px;">

  <!-- Name row with logo -->
  <table cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="vertical-align:middle;padding-right:14px;">
      <img src="${logoBase64}" width="60" height="60"
           style="width:60px;height:60px;border-radius:12px;display:block;" alt="Swifter"/>
    </td>
    <td style="vertical-align:middle;">
      <span style="font-size:17px;font-weight:bold;color:#0F172A;">Malcolm Govender</span><br/>
      <span style="font-size:12px;font-weight:600;color:#3B82F6;letter-spacing:1px;">FOUNDER &amp; CEO</span>
    </td>
  </tr></table>

  <!-- Blue accent line -->
  <div style="margin:10px 0;border-top:2px solid #3B82F6;width:90px;"></div>

  <!-- Contact -->
  <div style="font-size:13px;color:#374151;line-height:2.2;">
    ✉️ <a href="mailto:malcolm@swifter.digital" style="color:#374151;text-decoration:none;">malcolm@swifter.digital</a><br/>
    📱 <a href="tel:+27834654639" style="color:#374151;text-decoration:none;">+27 83 465 4639</a>
  </div>

  <!-- Separator -->
  <div style="margin:10px 0;border-top:1px solid #E2E8F0;"></div>

  <!-- Product links -->
  <div style="font-size:13px;line-height:2;">
    <a href="https://swifter.digital" style="color:#0F172A;text-decoration:none;font-weight:bold;">💸 Swifter Send</a>
    &nbsp;&middot;&nbsp;
    <a href="https://payguard.africa" style="color:#0F172A;text-decoration:none;font-weight:bold;">🛡️ PayGuard</a>
    &nbsp;&middot;&nbsp;
    <a href="https://payguard.africa/demo" style="color:#0F172A;text-decoration:none;font-weight:bold;">🎯 Live Demo</a>
  </div>

  <!-- Tagline -->
  <div style="margin-top:8px;font-size:11px;color:#94A3B8;font-style:italic;">
    🚀 Building Africa&apos;s fraud prevention &amp; cross-border payment infrastructure
  </div>

  <!-- Legal -->
  <div style="margin-top:10px;font-size:9px;color:#CBD5E1;">
    Swifter Technologies (Pty) Ltd &middot; South Africa
  </div>

</div>
</body>
</html>`;

const outPath = "C:/Users/616078/Downloads/email_signature.html";
fs.writeFileSync(outPath, html);
console.log("✅ Signature saved with embedded logo");
console.log("   Size:", (Buffer.byteLength(html) / 1024).toFixed(1), "KB");
