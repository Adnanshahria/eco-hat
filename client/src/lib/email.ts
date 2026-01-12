// Email helper for sending emails via Resend API (Vercel serverless function)

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Email send failed:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Email send error:', err);
        return false;
    }
}

// Email templates
export function getOrderConfirmationEmail(orderNumber: string, total: number, buyerName: string): SendEmailOptions & { template: string } {
    return {
        template: 'order_confirmation',
        subject: `🌱 Order Confirmed - ${orderNumber}`,
        to: '',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981, #059669);">
                    <h1 style="color: white; margin: 0;">🌱 Eco-Haat</h1>
                </div>
                <div style="padding: 30px; background: #f0fdf4;">
                    <h2 style="color: #166534;">Thank you for your order, ${buyerName}!</h2>
                    <p style="color: #374151;">Your order <strong>${orderNumber}</strong> has been placed successfully.</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 18px;"><strong>Total: ৳${total}</strong></p>
                    </div>
                    <p style="color: #6b7280;">You'll receive updates as your order progresses.</p>
                    <a href="https://eco-hat-bd.vercel.app/shop/orders" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">Track Order</a>
                </div>
                <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                    <p>Thank you for shopping eco-friendly! 🌿</p>
                </div>
            </div>
        `,
    };
}

export function getSellerOrderEmail(orderNumber: string, productName: string, quantity: number, earning: number): SendEmailOptions & { template: string } {
    return {
        template: 'seller_order',
        subject: `🛒 New Order - ${orderNumber}`,
        to: '',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981, #059669);">
                    <h1 style="color: white; margin: 0;">🌱 Eco-Haat Seller</h1>
                </div>
                <div style="padding: 30px; background: #f0fdf4;">
                    <h2 style="color: #166534;">🎉 New Order Received!</h2>
                    <p style="color: #374151;">You have a new order that needs your approval.</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Order:</strong> ${orderNumber}</p>
                        <p><strong>Product:</strong> ${productName}</p>
                        <p><strong>Quantity:</strong> ${quantity}</p>
                        <p style="font-size: 18px; color: #059669;"><strong>Your Earning: ৳${earning}</strong></p>
                    </div>
                    <a href="https://eco-hat-bd.vercel.app/seller" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px;">View Order</a>
                </div>
            </div>
        `,
    };
}

export function getAdminOrderEmail(orderNumber: string, total: number, buyerName: string): SendEmailOptions & { template: string } {
    return {
        template: 'admin_order',
        subject: `📦 New Order - ${orderNumber}`,
        to: '',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #6366f1, #4f46e5);">
                    <h1 style="color: white; margin: 0;">📊 Admin Dashboard</h1>
                </div>
                <div style="padding: 30px; background: #f5f3ff;">
                    <h2 style="color: #4338ca;">New Order Placed</h2>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Order:</strong> ${orderNumber}</p>
                        <p><strong>Customer:</strong> ${buyerName}</p>
                        <p style="font-size: 18px;"><strong>Total: ৳${total}</strong></p>
                    </div>
                    <a href="https://eco-hat-bd.vercel.app/admin/orders" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">View in Dashboard</a>
                </div>
            </div>
        `,
    };
}
