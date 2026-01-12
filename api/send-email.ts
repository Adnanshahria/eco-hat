import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

// Environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

// Try Resend first, then fallback to SMTP
async function sendViaResend(payload: EmailPayload): Promise<boolean> {
    if (!RESEND_API_KEY) return false;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: payload.from || 'Eco-Haat <onboarding@resend.dev>',
                to: [payload.to],
                subject: payload.subject,
                html: payload.html,
            }),
        });

        if (response.ok) {
            console.log('[Email] Sent via Resend:', payload.to);
            return true;
        }

        const error = await response.json();
        console.error('[Email] Resend error:', error);
        return false;
    } catch (err) {
        console.error('[Email] Resend failed:', err);
        return false;
    }
}

// Fallback: SMTP (Gmail) 
async function sendViaSMTP(payload: EmailPayload): Promise<boolean> {
    if (!SMTP_USER || !SMTP_PASS) return false;

    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: payload.from || `Eco-Haat <${SMTP_USER}>`,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
        });

        console.log('[Email] Sent via SMTP:', payload.to);
        return true;
    } catch (err) {
        console.error('[Email] SMTP failed:', err);
        return false;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, subject, html, from } = req.body as EmailPayload;

        if (!to || !subject || !html) {
            return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
        }

        const payload: EmailPayload = { to, subject, html, from };

        // Try Gmail SMTP first (primary)
        let sent = await sendViaSMTP(payload);

        // Fallback to Resend if SMTP fails
        if (!sent) {
            sent = await sendViaResend(payload);
        }

        if (sent) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: 'All email providers failed' });
        }
    } catch (error: any) {
        console.error('[Email] Handler error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
