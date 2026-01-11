import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createClient } from "@supabase/supabase-js";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  // Email Notifications
  app.post("/api/notifications/welcome", async (req, res) => {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }

    try {
      // Dynamic import to avoid issues if email service fails to initialize
      const { sendWelcomeEmail } = await import("./email");
      const sent = await sendWelcomeEmail(email, name);
      if (sent) {
        res.json({ success: true, message: "Welcome email sent" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/notifications/order-confirmation", async (req, res) => {
    const { email, orderId, total } = req.body;
    if (!email || !orderId || !total) {
      return res.status(400).json({ error: "Email, orderId, and total are required" });
    }

    try {
      const { sendOrderConfirmationEmail } = await import("./email");
      const sent = await sendOrderConfirmationEmail(email, parseInt(orderId), parseFloat(total));
      if (sent) {
        res.json({ success: true, message: "Order confirmation email sent" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending order confirmation email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Order Status Change Email (Buyer)
  app.post("/api/notifications/order-status", async (req, res) => {
    const { email, orderId, orderNumber, status, note } = req.body;
    console.log(`📧 [Buyer Notification] Request for Order #${orderNumber}, Status: ${status}, Email: ${email}`);

    if (!email || !orderId || !status) {
      console.error(`❌ [Buyer Notification] Missing fields:`, { email, orderId, status });
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const { sendOrderStatusEmail } = await import("./email");
      const success = await sendOrderStatusEmail(email, parseInt(orderId), orderNumber || `${orderId}`, status, note || "");
      if (success) {
        console.log(`✅ [Buyer Notification] Email sent successfully to ${email}`);
        res.json({ success: true });
      } else {
        console.error(`❌ [Buyer Notification] Failed to send email to ${email}`);
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("❌ [Buyer Notification] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // New Order Notification to Seller (Pending Approval)
  app.post("/api/notifications/seller/new-order", async (req, res) => {
    const { email, orderNumber, productName, quantity, earning } = req.body;
    console.log(`📧 [Seller Notification] New Order #${orderNumber}, Email: ${email}`);

    if (!email || !orderNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const { sendNewOrderNotificationToSeller } = await import("./email");
      await sendNewOrderNotificationToSeller(email, orderNumber, productName || "Product", parseInt(quantity) || 1, parseFloat(earning) || 0);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending seller notification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Order Status Email to Seller
  app.post("/api/notifications/seller/order-status", async (req, res) => {
    const { email, orderNumber, status, buyerName } = req.body;
    console.log(`📧 [Seller Notification] Order #${orderNumber} Update, Status: ${status}, Email: ${email}`);

    if (!email || !orderNumber || !status) {
      console.error(`❌ [Seller Notification] Missing fields:`, { email, orderNumber, status });
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const { sendOrderStatusEmailToSeller } = await import("./email");
      const success = await sendOrderStatusEmailToSeller(email, orderNumber, status, buyerName || "Customer");
      if (success) {
        console.log(`✅ [Seller Notification] Email sent successfully to ${email}`);
        res.json({ success: true });
      } else {
        console.error(`❌ [Seller Notification] Failed to send email to ${email}`);
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("❌ [Seller Notification] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // New Order Notification to All Admins
  app.post("/api/notifications/admin/new-order", async (req, res) => {
    const { orderNumber, total, buyerName } = req.body;
    console.log(`📧 [Admin Notification] New Order #${orderNumber}`);

    if (!orderNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const { sendNewOrderNotificationToAdmin } = await import("./email");
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Fetch all admin users from database
      const admins = await db.select({ email: users.email }).from(users).where(eq(users.role, "admin"));

      const recipients = new Set<string>();
      admins.forEach(a => { if (a.email) recipients.add(a.email); });
      if (process.env.ADMIN_EMAIL) recipients.add(process.env.ADMIN_EMAIL);

      console.log(`📧 [Admin Notification] Found ${recipients.size} unique recipients (DB + Env)`);

      if (recipients.size === 0) {
        console.warn("⚠️ No admin emails found (DB or env)");
        return res.json({ success: true, message: "No admins to notify" });
      }

      // Send email to each unique admin
      for (const email of Array.from(recipients)) {
        console.log(`📧 Sending to admin: ${email}`);
        await sendNewOrderNotificationToAdmin(email, orderNumber, parseFloat(total) || 0, buyerName || "Customer").catch(
          err => console.error(`Failed to email admin ${email}:`, err)
        );
      }

      console.log(`✅ New order emails sent to ${recipients.size} admins`);
      res.json({ success: true, adminCount: recipients.size });
    } catch (error) {
      console.error("Error sending admin notification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Order Status Email to All Admins
  app.post("/api/notifications/admin/order-status", async (req, res) => {
    const { orderNumber, status, note } = req.body;
    console.log(`📧 [Admin Notification] Order #${orderNumber} Update, Status: ${status}`);

    if (!orderNumber || !status) {
      return res.status(400).json({ error: "Missing required fields (orderNumber, status)" });
    }

    try {
      const { sendOrderStatusEmailToAdmin } = await import("./email");
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Fetch all admin users from database
      const admins = await db.select({ email: users.email }).from(users).where(eq(users.role, "admin"));

      const recipients = new Set<string>();
      admins.forEach(a => { if (a.email) recipients.add(a.email); });
      if (process.env.ADMIN_EMAIL) recipients.add(process.env.ADMIN_EMAIL);

      console.log(`📧 [Admin Notification] Found ${recipients.size} unique recipients (DB + Env)`);

      if (recipients.size === 0) {
        console.warn("⚠️ No admin emails found (DB or env)");
        return res.json({ success: true, message: "No admins to notify" });
      }

      // Send email to each unique admin
      for (const email of Array.from(recipients)) {
        console.log(`📧 Sending to admin: ${email}`);
        await sendOrderStatusEmailToAdmin(email, orderNumber, status, note || "").catch(
          err => console.error(`Failed to email admin ${email}:`, err)
        );
      }

      console.log(`✅ Admin order status emails sent to ${recipients.size} admins`);
      res.json({ success: true, adminCount: recipients.size });
    } catch (error) {
      console.error("Error sending admin order status emails:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Custom Notification (sends email to any user)
  app.post("/api/notifications/admin/send", async (req, res) => {
    const { email, title, message, type } = req.body;
    if (!email || !title || !message) {
      return res.status(400).json({ error: "Email, title, and message are required" });
    }

    try {
      const { sendEmail } = await import("./email");

      // Build custom notification email
      const typeEmojis: Record<string, string> = {
        info: "📢", success: "✅", warning: "⚠️", error: "❌"
      };
      const emoji = typeEmojis[type] || "📢";

      const content = `
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
      `;

      // Use the existing template wrapper
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
                            ${content}
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

      await sendEmail({ to: email, subject: `${emoji} ${title} - EcoHaat`, html });
      res.json({ success: true, message: "Notification email sent" });
    } catch (error) {
      console.error("Error sending custom notification email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // OTP AUTHENTICATION
  // ============================================

  // Generate 6-digit OTP
  function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP to email
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ error: "Email and purpose are required" });
    }

    try {
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP in Supabase (requires otp_codes table)
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );

      // Delete any existing OTPs for this email/purpose
      await supabase
        .from("otp_codes")
        .delete()
        .eq("email", email)
        .eq("purpose", purpose);

      // Insert new OTP
      const { error: insertError } = await supabase.from("otp_codes").insert({
        email,
        code,
        purpose,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

      if (insertError) {
        console.error("Failed to store OTP:", insertError);
        return res.status(500).json({ error: "Failed to generate OTP. Please ensure otp_codes table exists." });
      }

      // Send OTP email
      const { sendOTPEmail } = await import("./email");
      await sendOTPEmail(email, code, purpose);

      res.json({ success: true, message: "OTP sent to email" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  // Verify OTP
  app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, code, purpose } = req.body;
    if (!email || !code || !purpose) {
      return res.status(400).json({ error: "Email, code, and purpose are required" });
    }

    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );

      // Find valid OTP
      const { data: otpData, error: fetchError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("email", email)
        .eq("code", code)
        .eq("purpose", purpose)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (fetchError || !otpData) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Mark OTP as used
      await supabase
        .from("otp_codes")
        .update({ used: true })
        .eq("id", otpData.id);

      res.json({ success: true, message: "OTP verified" });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  return httpServer;
}
