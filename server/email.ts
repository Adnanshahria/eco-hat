import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// ============================================
// SMTP CONFIGURATION & ERROR HANDLING
// ============================================

// Configuration check
const SMTP_CONFIG = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
};

// Check if SMTP is properly configured
const isSmtpConfigured = (): boolean => {
    return !!(SMTP_CONFIG.user && SMTP_CONFIG.pass);
};

// Log configuration status on startup
if (!isSmtpConfigured()) {
    console.error("❌ [SMTP] CRITICAL: SMTP credentials not configured!");
    console.error("   Required environment variables:");
    console.error("   - SMTP_USER:", SMTP_CONFIG.user ? "✓ Set" : "✗ Missing");
    console.error("   - SMTP_PASS:", SMTP_CONFIG.pass ? "✓ Set" : "✗ Missing");
    console.error("   - SMTP_HOST:", SMTP_CONFIG.host);
    console.error("   - SMTP_PORT:", SMTP_CONFIG.port);
    console.error("   📧 All emails will fail until SMTP is configured!");
} else {
    console.log("✅ [SMTP] Configuration found for:", SMTP_CONFIG.user);
}

// Create transporter lazily to allow for connection verification
let transporter: Transporter | null = null;
let transporterVerified = false;

async function getTransporter(): Promise<Transporter> {
    if (!isSmtpConfigured()) {
        throw new Error("SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.");
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: SMTP_CONFIG.host,
            port: SMTP_CONFIG.port,
            secure: false,
            auth: {
                user: SMTP_CONFIG.user,
                pass: SMTP_CONFIG.pass,
            },
            // Connection timeout settings
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 30000,
        });
    }

    // Verify connection on first use
    if (!transporterVerified) {
        try {
            await transporter.verify();
            console.log("✅ [SMTP] Connection verified successfully");
            transporterVerified = true;
        } catch (error) {
            console.error("❌ [SMTP] Connection verification failed:", error);
            // Reset transporter so next attempt creates a fresh connection
            transporter = null;
            throw new Error(`SMTP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    return transporter;
}

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < maxRetries) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
                console.warn(`⚠️ [SMTP] Attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                // Reset transporter for retry
                transporterVerified = false;
            }
        }
    }

    throw lastError;
}

// ============================================
// BASE EMAIL TEMPLATE WITH BRANDING
// ============================================
const LOGO_URL = "https://ecohaat.bd/logo-en.png"; // Replace with actual hosted logo URL
const PRIMARY_COLOR = "#059669"; // Emerald-600
const SECONDARY_COLOR = "#10B981"; // Emerald-500

function getEmailTemplate(content: string, preheader?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eco-Haat</title>
    ${preheader ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0fdf4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%);padding:30px;text-align:center;">
                            <img src="${LOGO_URL}" alt="Eco-Haat" height="48" style="height:48px;"/>
                            <p style="color:rgba(255,255,255,0.9);font-size:12px;margin:10px 0 0 0;letter-spacing:1px;">🌱 SUSTAINABLE MARKETPLACE</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding:40px 30px;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background:#f0fdf4;padding:25px 30px;text-align:center;border-top:1px solid #d1fae5;">
                            <p style="font-size:12px;color:#6b7280;margin:0 0 10px 0;">
                                Thank you for supporting local artisans and sustainable living! 🌿
                            </p>
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
}

function getButton(text: string, url: string): string {
    return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:14px;margin:20px 0;">${text}</a>`;
}

// ============================================
// CORE EMAIL SENDER WITH RETRY LOGIC
// ============================================
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string; }): Promise<boolean> {
    // Early validation
    if (!isSmtpConfigured()) {
        console.error(`❌ [SMTP] Cannot send email to ${to} - SMTP not configured`);
        console.error("   Please set SMTP_USER and SMTP_PASS environment variables");
        return false;
    }

    if (!to || !subject) {
        console.error("❌ [SMTP] Invalid email parameters: missing 'to' or 'subject'");
        return false;
    }

    console.log(`📧 [SMTP] Sending email to: ${to} | Subject: ${subject.substring(0, 50)}...`);

    try {
        const result = await retryWithBackoff(async () => {
            const transport = await getTransporter();
            const info = await transport.sendMail({
                from: SMTP_CONFIG.from || `"Eco-Haat" <${SMTP_CONFIG.user}>`,
                to,
                subject,
                html,
            });
            return info;
        }, 3, 1000); // 3 retries with 1s base delay

        console.log(`✅ [SMTP] Email sent successfully to ${to} | MessageID: ${result.messageId}`);
        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ [SMTP] Failed to send email to ${to} after 3 attempts`);
        console.error(`   Error: ${errorMessage}`);

        // Log additional debug info for common errors
        if (errorMessage.includes("EAUTH") || errorMessage.includes("authentication")) {
            console.error("   💡 Hint: Check your SMTP_USER and SMTP_PASS credentials");
            console.error("   💡 For Gmail: Use an App Password (not your regular password)");
        } else if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ETIMEDOUT")) {
            console.error("   💡 Hint: Check your SMTP_HOST and SMTP_PORT settings");
            console.error("   💡 Make sure your firewall allows outbound SMTP connections");
        }

        return false;
    }
}

// ============================================
// USER EMAILS
// ============================================

export async function sendWelcomeEmail(email: string, name: string) {
    const content = `
        <h1 style="color:${PRIMARY_COLOR};font-size:28px;margin:0 0 20px 0;">Welcome to Eco-Haat! 🌱</h1>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 15px 0;">
            Hi <strong>${name}</strong>,
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 15px 0;">
            Thank you for joining our community of sustainable shoppers and local artisans. 
            We're thrilled to have you as part of the Eco-Haat family!
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 25px 0;">
            Start exploring our collection of fresh, organic, and eco-friendly products today.
        </p>
        <div style="text-align:center;">
            ${getButton("🛒 Start Shopping", "https://ecohaat.bd/shop")}
        </div>
    `;
    return sendEmail({ to: email, subject: "Welcome to Eco-Haat! 🌱", html: getEmailTemplate(content, "Welcome to the sustainable marketplace!") });
}

// ============================================
// ORDER EMAILS - BUYER
// ============================================

export async function sendOrderConfirmationEmail(email: string, orderId: number, total: number) {
    const content = `
        <div style="text-align:center;margin-bottom:30px;">
            <div style="display:inline-block;background:#dcfce7;border-radius:50%;padding:20px;">
                <span style="font-size:40px;">🛒</span>
            </div>
        </div>
        <h1 style="color:${PRIMARY_COLOR};font-size:24px;text-align:center;margin:0 0 15px 0;">Order Placed Successfully!</h1>
        <p style="color:#6b7280;text-align:center;margin:0 0 30px 0;">Order #${orderId}</p>
        
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:25px;">
            <table width="100%">
                <tr>
                    <td style="color:#6b7280;font-size:14px;">Order Total</td>
                    <td align="right" style="color:${PRIMARY_COLOR};font-size:24px;font-weight:700;">৳${total}</td>
                </tr>
            </table>
        </div>
        
        <p style="color:#374151;font-size:15px;line-height:1.6;">
            Your order is now <strong>pending approval</strong> from the seller. You'll receive another email once it's confirmed.
        </p>
        
        <div style="text-align:center;">
            ${getButton("📦 Track Your Order", `https://ecohaat.bd/track/${orderId}`)}
        </div>
    `;
    return sendEmail({ to: email, subject: `Order Confirmed #${orderId} - Eco-Haat`, html: getEmailTemplate(content) });
}

export async function sendOrderStatusEmail(email: string, orderId: number, orderNumber: string, status: string, note: string) {
    const statusEmojis: Record<string, string> = {
        confirmed: "✅", processing: "⚙️", shipped: "🚚", at_station: "📍",
        reached_destination: "🎯", delivered: "🎉", cancelled: "❌", denied: "❌"
    };
    const statusColors: Record<string, string> = {
        confirmed: "#3b82f6", processing: "#8b5cf6", shipped: "#6366f1", at_station: "#06b6d4",
        reached_destination: "#14b8a6", delivered: PRIMARY_COLOR, cancelled: "#ef4444", denied: "#ef4444"
    };

    const emoji = statusEmojis[status] || "📦";
    const color = statusColors[status] || PRIMARY_COLOR;

    const content = `
        <div style="text-align:center;margin-bottom:30px;">
            <span style="font-size:50px;">${emoji}</span>
        </div>
        <h1 style="color:${color};font-size:24px;text-align:center;margin:0 0 10px 0;">Order Update</h1>
        <p style="color:#6b7280;text-align:center;font-size:14px;margin:0 0 25px 0;">Order #${orderNumber}</p>
        
        <div style="background:#f9fafb;border-radius:12px;padding:20px;text-align:center;margin-bottom:25px;">
            <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Current Status</p>
            <p style="color:${color};font-size:20px;font-weight:700;margin:0;text-transform:capitalize;">${status.replace(/_/g, ' ')}</p>
        </div>
        
        <p style="color:#374151;font-size:15px;line-height:1.6;text-align:center;">${note}</p>
        
        <div style="text-align:center;margin-top:25px;">
            ${getButton("📦 View Order Details", `https://ecohaat.bd/shop/orders`)}
        </div>
    `;
    return sendEmail({ to: email, subject: `${emoji} Order #${orderNumber} - ${status.replace(/_/g, ' ')}`, html: getEmailTemplate(content) });
}

// ============================================
// SELLER EMAILS
// ============================================

export async function sendNewOrderNotificationToSeller(email: string, orderNumber: string, productName: string, quantity: number, earning: number) {
    const content = `
        <div style="text-align:center;margin-bottom:25px;">
            <span style="font-size:50px;">🛒</span>
        </div>
        <h1 style="color:${PRIMARY_COLOR};font-size:24px;text-align:center;margin:0 0 25px 0;">New Order Received!</h1>
        
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:20px;margin-bottom:25px;">
            <p style="color:#92400e;font-size:14px;font-weight:600;margin:0 0 5px 0;">⚠️ Action Required</p>
            <p style="color:#78350f;font-size:13px;margin:0;">This order is waiting for your approval. Please review and accept or deny it.</p>
        </div>
        
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:25px;">
            <table width="100%">
                <tr><td style="color:#6b7280;padding:8px 0;font-size:14px;">Order Number</td><td align="right" style="font-weight:600;">#${orderNumber}</td></tr>
                <tr><td style="color:#6b7280;padding:8px 0;font-size:14px;">Product</td><td align="right" style="font-weight:600;">${productName}</td></tr>
                <tr><td style="color:#6b7280;padding:8px 0;font-size:14px;">Quantity</td><td align="right" style="font-weight:600;">×${quantity}</td></tr>
                <tr style="border-top:1px solid #d1fae5;"><td style="color:${PRIMARY_COLOR};padding:12px 0 0 0;font-size:16px;font-weight:600;">Your Earning</td><td align="right" style="color:${PRIMARY_COLOR};font-size:20px;font-weight:700;padding:12px 0 0 0;">৳${earning}</td></tr>
            </table>
        </div>
        
        <div style="text-align:center;">
            ${getButton("📋 Go to Dashboard", "https://ecohaat.bd/seller/orders")}
        </div>
    `;
    return sendEmail({ to: email, subject: `🛒 New Order #${orderNumber} - Action Required`, html: getEmailTemplate(content, "New order waiting for approval!") });
}

export async function sendOrderStatusEmailToSeller(email: string, orderNumber: string, status: string, buyerName: string) {
    const statusMessages: Record<string, string> = {
        delivered: `Great news! Order #${orderNumber} has been delivered to ${buyerName}. The earnings will be credited to your account.`,
        cancelled: `Order #${orderNumber} has been cancelled. No further action is required.`,
    };

    const content = `
        <h1 style="color:${PRIMARY_COLOR};font-size:24px;text-align:center;margin:0 0 25px 0;">Order Update</h1>
        <p style="color:#374151;font-size:15px;line-height:1.6;text-align:center;">
            ${statusMessages[status] || `Order #${orderNumber} status changed to ${status}.`}
        </p>
        <div style="text-align:center;margin-top:25px;">
            ${getButton("View Orders", "https://ecohaat.bd/seller/orders")}
        </div>
    `;
    return sendEmail({ to: email, subject: `Order #${orderNumber} - ${status}`, html: getEmailTemplate(content) });
}

// ============================================
// ADMIN EMAILS
// ============================================

export async function sendNewOrderNotificationToAdmin(email: string, orderNumber: string, total: number, buyerName: string) {
    const content = `
        <h1 style="color:${PRIMARY_COLOR};font-size:24px;text-align:center;margin:0 0 20px 0;">📦 New Order Placed</h1>
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:20px;">
            <table width="100%">
                <tr><td style="color:#6b7280;font-size:14px;">Order</td><td align="right" style="font-weight:600;">#${orderNumber}</td></tr>
                <tr><td style="color:#6b7280;font-size:14px;">Buyer</td><td align="right" style="font-weight:600;">${buyerName}</td></tr>
                <tr><td style="color:#6b7280;font-size:14px;">Total</td><td align="right" style="font-weight:700;color:${PRIMARY_COLOR};">৳${total}</td></tr>
            </table>
        </div>
        <p style="color:#6b7280;font-size:13px;text-align:center;">Order is awaiting seller approval.</p>
    `;
    return sendEmail({ to: email, subject: `New Order #${orderNumber}`, html: getEmailTemplate(content) });
}

export async function sendOrderStatusEmailToAdmin(email: string, orderNumber: string, status: string, note: string) {
    const content = `
        <h1 style="color:${PRIMARY_COLOR};font-size:22px;margin:0 0 15px 0;">Order #${orderNumber} Update</h1>
        <p style="color:#374151;font-size:15px;"><strong>Status:</strong> ${status.replace(/_/g, ' ')}</p>
        <p style="color:#6b7280;font-size:14px;">${note}</p>
    `;
    return sendEmail({ to: email, subject: `Order #${orderNumber} - ${status}`, html: getEmailTemplate(content) });
}

// ============================================
// OTP AUTHENTICATION EMAILS
// ============================================

const OTP_PURPOSES: Record<string, { title: string; message: string; emoji: string }> = {
    registration: {
        title: "Verify Your Email",
        message: "You're almost there! Use this code to verify your email and complete your registration.",
        emoji: "✉️"
    },
    forgot_password: {
        title: "Reset Your Password",
        message: "We received a request to reset your password. Use this code to proceed.",
        emoji: "🔐"
    },
    login: {
        title: "Login Verification",
        message: "Use this code to log in to your Eco-Haat account.",
        emoji: "🔑"
    }
};

export async function sendOTPEmail(email: string, code: string, purpose: 'registration' | 'forgot_password' | 'login') {
    const { title, message, emoji } = OTP_PURPOSES[purpose] || OTP_PURPOSES.registration;

    const content = `
        <div style="text-align:center;margin-bottom:30px;">
            <span style="font-size:50px;">${emoji}</span>
        </div>
        <h1 style="color:${PRIMARY_COLOR};font-size:24px;text-align:center;margin:0 0 15px 0;">${title}</h1>
        <p style="color:#374151;font-size:15px;text-align:center;margin:0 0 30px 0;">${message}</p>
        
        <div style="background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);border:2px dashed ${PRIMARY_COLOR};border-radius:12px;padding:25px;text-align:center;margin-bottom:25px;">
            <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px 0;">Your Verification Code</p>
            <p style="color:${PRIMARY_COLOR};font-size:36px;font-weight:700;letter-spacing:8px;margin:0;font-family:'Courier New',monospace;">${code}</p>
        </div>
        
        <p style="color:#6b7280;font-size:13px;text-align:center;">
            This code expires in <strong>5 minutes</strong>. Do not share this code with anyone.
        </p>
        
        <div style="background:#fef3c7;border-radius:8px;padding:15px;margin-top:25px;">
            <p style="color:#92400e;font-size:12px;margin:0;">
                ⚠️ If you didn't request this code, please ignore this email. Your account is safe.
            </p>
        </div>
    `;

    const subjects: Record<string, string> = {
        registration: `${code} is your Eco-Haat verification code`,
        forgot_password: `${code} - Reset your Eco-Haat password`,
        login: `${code} - Your Eco-Haat login code`
    };

    return sendEmail({
        to: email,
        subject: subjects[purpose] || `Your Eco-Haat code: ${code}`,
        html: getEmailTemplate(content, `Your code is ${code}`)
    });
}
