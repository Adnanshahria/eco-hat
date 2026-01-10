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
    if (!email || !orderId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const { sendOrderStatusEmail } = await import("./email");
      await sendOrderStatusEmail(email, parseInt(orderId), orderNumber || `${orderId}`, status, note || "");
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending order status email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // New Order Notification to Seller (Pending Approval)
  app.post("/api/notifications/seller/new-order", async (req, res) => {
    const { email, orderNumber, productName, quantity, earning } = req.body;
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
    if (!email || !orderNumber || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const { sendOrderStatusEmailToSeller } = await import("./email");
      await sendOrderStatusEmailToSeller(email, orderNumber, status, buyerName || "Customer");
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending seller order status email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // New Order Notification to Admin
  app.post("/api/notifications/admin/new-order", async (req, res) => {
    const { email, orderNumber, total, buyerName } = req.body;
    if (!email || !orderNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const { sendNewOrderNotificationToAdmin } = await import("./email");
      await sendNewOrderNotificationToAdmin(email, orderNumber, parseFloat(total) || 0, buyerName || "Customer");
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending admin notification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Order Status Email to Admin
  app.post("/api/notifications/admin/order-status", async (req, res) => {
    const { email, orderNumber, status, note } = req.body;
    if (!email || !orderNumber || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const { sendOrderStatusEmailToAdmin } = await import("./email");
      await sendOrderStatusEmailToAdmin(email, orderNumber, status, note || "");
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending admin order status email:", error);
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
