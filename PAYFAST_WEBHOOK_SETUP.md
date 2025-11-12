# PayFast Webhook Configuration Guide

## Promotional Subscriptions Setup

PayFast supports promotional subscriptions (free trials, introductory offers) and can send notifications when trials are about to end.

### Configuration Steps

1. **Log in to PayFast Dashboard**

   - Go to https://www.payfast.co.za/
   - Navigate to **Settings** → **Recurring Billing**

2. **Configure Notification Settings**

   In the "Recurring Billing" section, you'll see:

   - **Notify the buyer that their free trial is coming to an end:**

     - Set to **Enabled On**

   - **I would like to receive promotional subscription notifications via email:**

     - Set to **Enabled On**
     - This sends email notifications to your merchant email when trials are ending

   - **Notification webhook URL:**
     - Enter: `https://www.trevnoctilla.com/payment/notify`
     - This is where PayFast will send webhook notifications

### What This Does

- **Free Trial Notifications**: PayFast will notify you (and optionally the buyer) when a free trial is about to end
- **Promotional Subscriptions**: If you set the initial amount to $0 (free trial) or a lower amount (introductory offer), PayFast will track these and send notifications
- **Webhook Notifications**: All subscription events (trial ending, payment due, payment received, etc.) will be sent to your webhook URL

### Webhook URL Details

**Production URL:**

```
https://www.trevnoctilla.com/payment/notify
```

**What PayFast Sends:**

- Payment status updates
- Subscription lifecycle events (trial ending, renewal, cancellation)
- Payment confirmations
- Failed payment notifications

### Testing

1. **Sandbox Testing:**

   - Use PayFast sandbox: `https://sandbox.payfast.co.za/`
   - Test webhook URL: `https://www.trevnoctilla.com/payment/notify` (same URL works for both)
   - Create a test subscription with `amount: "0.00"` for free trial

2. **Verify Webhook:**
   - Check your backend logs for webhook calls
   - Check the Admin Dashboard → Notifications for subscription events
   - PayFast will retry failed webhooks up to 3 times

### Important Notes

- **Webhook URL must be publicly accessible** (no authentication required)
- **Webhook must respond with 200 OK** and return "VALID" or "INVALID" as plain text
- **HTTPS is required** for production webhooks
- **Webhook timeout**: PayFast expects a response within 30 seconds

### Notification Types You'll Receive

1. **Trial Ending**: When a free trial is about to expire
2. **Payment Due**: When a subscription payment is due
3. **Payment Received**: When a subscription payment is successful
4. **Payment Failed**: When a subscription payment fails
5. **Subscription Cancelled**: When a subscription is cancelled

All these notifications will appear in your **Admin Dashboard → Notifications** section.
