import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, title, message, type } = req.body;

    if (!email || !title || !message) {
        return res.status(400).json({ error: 'Email, title, and message are required' });
    }

    // Check SMTP credentials
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP credentials not set');
        return res.status(500).json({ error: 'SMTP not configured' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Type emoji mapping
        const typeEmojis: Record<string, string> = {
            info: '📢', success: '✅', warning: '⚠️', error: '❌'
        };
        const emoji = typeEmojis[type] || '📢';

        // Build HTML email
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0fdf4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                    <tr>
                        <td style="background:linear-gradient(135deg, #059669 0%, #10B981 100%);padding:30px;text-align:center;">
                            <h1 style="color:#ffffff;font-size:24px;margin:0;">🌱 EcoHaat</h1>
                            <p style="color:rgba(255,255,255,0.9);font-size:12px;margin:10px 0 0 0;">NOTIFICATION</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 30px;">
                            <div style="text-align:center;margin-bottom:25px;">
                                <span style="font-size:50px;">${emoji}</span>
                            </div>
                            <h1 style="color:#059669;font-size:24px;text-align:center;margin:0 0 20px 0;">${title}</h1>
                            <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:25px;">
                                <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;">${message}</p>
                            </div>
                            <div style="text-align:center;">
                                <a href="https://ecohaat.bd" style="display:inline-block;background:linear-gradient(135deg, #059669 0%, #10B981 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:14px;">Visit EcoHaat</a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f0fdf4;padding:25px 30px;text-align:center;border-top:1px solid #d1fae5;">
                            <p style="font-size:11px;color:#9ca3af;margin:0;">
                                © ${new Date().getFullYear()} Eco-Haat Bangladesh. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();

        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Eco-Haat" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `${emoji} ${title} - EcoHaat`,
            html,
        });

        console.log('✅ Email sent to', email);
        return res.status(200).json({ success: true, message: 'Email sent' });
    } catch (error) {
        console.error('❌ Email error:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
