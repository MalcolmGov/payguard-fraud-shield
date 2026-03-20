import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const {
      name, firstName, lastName, email, phone, company,
      institutionType, role, useCase, volume, txVolume,
      interests, message, source,
    } = req.body;

    const contactName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';
    const contactCompany = company || 'Not provided';
    const contactRole = role || 'Not provided';
    const contactVolume = volume || txVolume || 'Not provided';
    const contactUseCase = useCase || (interests && interests.length ? interests.join(', ') : 'Not specified');
    const formSource = source || 'Website';

    // 1) Send notification to sales team
    const { error: salesError } = await resend.emails.send({
      from: 'PayGuard <onboarding@resend.dev>',
      to: ['malcolmgov24@gmail.com'],
      replyTo: email || undefined,
      subject: `[PayGuard Sales] New Enquiry — ${contactCompany} (${contactName})`,
      html: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:'Inter','Segoe UI',sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a1a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;">
            <span style="color:#fff;">PayGuard</span><span style="color:#FF1744;">.</span>
          </div>
        </td></tr>
        <tr><td style="background:linear-gradient(135deg,rgba(255,23,68,0.08) 0%,rgba(15,15,35,0.95) 50%,rgba(255,23,68,0.05) 100%);border:1px solid rgba(255,23,68,0.15);border-radius:16px;padding:40px 36px;">
          <h1 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:800;">New Sales Enquiry</h1>
          <p style="margin:0 0 24px;color:#64748b;font-size:13px;">From: ${formSource}</p>
          <table width="100%" cellspacing="0" cellpadding="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
            ${[
              ['Name', contactName],
              ['Email', email || 'Not provided'],
              ['Phone', phone || 'Not provided'],
              ['Company', contactCompany],
              ['Institution Type', institutionType || 'Not provided'],
              ['Role', contactRole],
              ['Use Case / Interests', contactUseCase],
              ['Transaction Volume', contactVolume],
            ].map(([label, value]) => `
            <tr><td style="padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.04);">
              <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${label}</div>
              <div style="color:#e2e8f0;font-size:14px;margin-top:4px;">${value}</div>
            </td></tr>`).join('')}
            ${message ? `
            <tr><td style="padding:12px 20px;">
              <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</div>
              <div style="color:#e2e8f0;font-size:14px;margin-top:4px;line-height:1.7;white-space:pre-wrap;">${message}</div>
            </td></tr>` : ''}
          </table>
          <p style="margin:24px 0 0;color:#334155;font-size:12px;text-align:center;">
            Reply directly to <a href="mailto:${email}" style="color:#0EA5E9;text-decoration:none;">${email}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });

    if (salesError) {
      console.error('Resend error (sales notification):', JSON.stringify(salesError));
      return res.status(500).json({ error: 'Failed to send notification', details: salesError });
    }

    // NOTE: Confirmation email to the contact is disabled on Resend free tier.
    // To enable: verify payguard.africa domain in Resend dashboard,
    // then change 'from' to 'noreply@payguard.africa' and uncomment below.
    // if (email) { ... }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
