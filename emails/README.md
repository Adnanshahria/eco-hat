# Email System

This folder contains all email-related files for Eco-Haat.

## Folder Structure

```
emails/
├── README.md           # This file
├── email-service.ts    # Server-side email functions (for local dev)
└── templates/          # HTML email templates
    ├── 1-confirm-signup.html
    ├── 2-magic-link.html
    ├── 3-reset-password.html
    ├── 4-change-email.html
    ├── admin-notification.html
    ├── new-order-seller.html
    ├── order-confirmation-buyer.html
    ├── order-delivered.html
    └── order-shipped.html
```

## Other Email Files

| File | Location | Purpose |
|------|----------|---------|
| `api/send-email.ts` | Root API folder | Vercel serverless function (SMTP + Resend) |
| `client/src/lib/email.ts` | Frontend lib | Email templates & helper for frontend |
| `server/email.ts` | Server folder | Express email handlers (local dev only) |

## Email Priority

1. **Gmail SMTP** (primary) - Uses `SMTP_*` environment variables
2. **Resend** (fallback) - Uses `RESEND_API_KEY` if SMTP fails

## Environment Variables

Add these to Vercel:
- `SMTP_HOST`: smtp.gmail.com
- `SMTP_PORT`: 587
- `SMTP_USER`: your-email@gmail.com
- `SMTP_PASS`: your-app-password
- `RESEND_API_KEY`: re_xxxxx (fallback)
