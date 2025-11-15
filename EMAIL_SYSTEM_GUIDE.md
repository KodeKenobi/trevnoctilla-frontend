# Email System Guide

## Overview

The email system sends automated emails to users for:

1. **Welcome Email** - Sent when users register (not on sign-in)
2. **Upgrade Email** - Sent when users upgrade their subscription tier

## Email Configuration

Set these environment variables in your backend (or on Railway):

```bash
# Afrihost SMTP Configuration
SMTP_HOST=smtp.afrihost.co.za
SMTP_PORT=465
SMTP_USER=kodekenobi@gmail.com
SMTP_PASSWORD=Kopenikus0218!

# Email Settings
FROM_EMAIL=info@trevnoctilla.com
FROM_NAME=Trevnoctilla Team
```

**Afrihost SMTP Settings:**

- **Server**: `smtp.afrihost.co.za`
- **Port**: `465`
- **Encryption**: SSL (not STARTTLS)
- **Username**: Your full Afrihost email address
- **Password**: Your Afrihost email password

**For Railway Deployment:**

1. Go to your Railway project → Backend service
2. Navigate to **Variables** tab
3. Add each environment variable listed above
4. Redeploy the backend service

See `SMTP_SETUP.md` for detailed Railway configuration instructions.

## Email Content

### Welcome Email

- **Sent on:** User registration
- **Content:**
  - Congratulatory message
  - What they're getting (based on their tier)
  - Next steps (generate API key, check docs)
  - Information about other subscription packages
  - Link to upgrade

### Upgrade Email

- **Sent on:** Subscription tier change (free → premium, premium → enterprise, etc.)
- **Content:**
  - Confirmation of upgrade
  - New benefits and features
  - Link to dashboard

## User Registration Flow

### Current Flow:

1. User registers → Gets **Free Tier** (5 API calls/month)
2. Welcome email sent automatically
3. User can upgrade later via billing section

### Recommended Flow for Direct Premium/Enterprise Signup:

**Option 1: Select Tier During Registration**

- Add tier selection on registration page
- If premium/enterprise selected, redirect to payment
- After payment, complete registration with selected tier
- Send welcome email with correct tier

**Option 2: Upgrade Immediately After Registration**

- User registers for free tier
- Show upgrade prompt immediately after registration
- If they upgrade, send upgrade email instead of welcome email

## Upgrade Flow

### Current Flow:

1. User goes to Settings → Billing
2. Selects plan (Production $29/month or Enterprise $49/month)
3. Redirected to PayFast payment
4. After successful payment:
   - Payment notification calls `/api/payment/upgrade-subscription`
   - User subscription tier updated
   - Upgrade email sent automatically

## API Endpoints

### POST `/api/payment/upgrade-subscription`

Updates user subscription and sends upgrade email.

**Request Body:**

```json
{
  "user_email": "user@example.com",
  "plan_id": "production", // or "enterprise"
  "plan_name": "Production Plan",
  "amount": 29.0,
  "payment_id": "pf_payment_123"
}
```

**Response:**

```json
{
  "message": "Subscription updated successfully",
  "user": { ... },
  "old_tier": "free",
  "new_tier": "premium"
}
```

## Integration with PayFast

In your payment notification handler (`app/payment/notify/route.ts`), after verifying payment:

```typescript
// After payment is verified as COMPLETE
if (paymentStatus === "COMPLETE" && paymentIsSubscription) {
  // Determine plan from amount or item_name
  const planId =
    amountNum === 29 ? "production" : amountNum === 49 ? "enterprise" : "free";

  // Call backend to update subscription
  await fetch(
    "https://web-production-737b.up.railway.app/api/payment/upgrade-subscription",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_email: email_address,
        plan_id: planId,
        plan_name: itemName || `${planId} Plan`,
        amount: amountNum,
        payment_id: pfPaymentId || mPaymentId,
      }),
    }
  );
}
```

## Email Templates

Templates are HTML-responsive and include:

- Brand colors and gradients
- Mobile-friendly design
- Clear call-to-action buttons
- Links to dashboard and documentation

## Testing

To test emails without SMTP:

- If `SMTP_PASSWORD` is not set, emails are skipped (logged but not sent)
- Check backend logs for email sending status

## Recommendations

### What to Send on Registration:

1. **Welcome Email** (always sent):

   - Congratulatory message
   - What they're getting (tier-specific)
   - Next steps
   - Information about other plans
   - Link to dashboard

2. **For Free Tier Users:**

   - Emphasize they can upgrade anytime
   - Show benefits of Production/Enterprise plans
   - Include upgrade link

3. **For Premium/Enterprise Users:**
   - Welcome email with their tier benefits
   - No need to show upgrade options (unless they're on premium)

### Upgrade Flow Recommendations:

1. **Allow Tier Selection During Registration:**

   - Add "Choose Plan" step before registration
   - If paid plan selected, collect payment first
   - Complete registration with selected tier
   - Send appropriate welcome email

2. **Immediate Upgrade Option:**

   - After free tier registration, show upgrade modal
   - "Start with 5 calls or upgrade now for more"
   - If they upgrade, send upgrade email

3. **Upgrade from Dashboard:**
   - Current flow works well
   - User goes to Settings → Billing
   - Selects plan and pays
   - Upgrade email sent automatically

## Next Steps

1. Set up SMTP credentials in environment variables
2. Test welcome email on registration
3. Test upgrade email flow
4. Consider adding tier selection to registration page
5. Update payment notification to call upgrade endpoint
