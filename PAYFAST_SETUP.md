# PayFast Payment Gateway Integration Guide

This guide will help you set up PayFast payment gateway integration in your application.

## Prerequisites

1. **PayFast Account**: Sign up at [https://payfast.io/](https://payfast.io/)
2. **Account Verification**: Complete the verification process to accept card payments
3. **Merchant Credentials**: Get your Merchant ID, Merchant Key, and set a Passphrase

## Setup Steps

### 1. Get PayFast Credentials

1. Log in to your PayFast account
2. Go to **Settings** > **Developer Settings**
3. Copy your **Merchant ID** and **Merchant Key**
4. Set a **Passphrase** (this is used for signature generation)

### 2. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# PayFast Configuration
PAYFAST_MERCHANT_ID=your_merchant_id_here
PAYFAST_MERCHANT_KEY=your_merchant_key_here
PAYFAST_PASSPHRASE=your_passphrase_here

# PayFast URLs (for testing, use sandbox)
NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process
NEXT_PUBLIC_PAYFAST_RETURN_URL=https://yourdomain.com/payment/success
NEXT_PUBLIC_PAYFAST_CANCEL_URL=https://yourdomain.com/payment/cancel
NEXT_PUBLIC_PAYFAST_NOTIFY_URL=https://yourdomain.com/api/payments/payfast/notify

# Base URL for your application
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 3. Testing with PayFast Sandbox

For testing, use PayFast's sandbox environment:

- **Sandbox URL**: `https://sandbox.payfast.co.za/eng/process`
- **Test Cards**: Use PayFast's test card numbers (see their documentation)
- **Test Credentials**: Use sandbox merchant credentials from your PayFast account

### 4. Production Setup

When ready for production:

1. Replace sandbox URLs with production URLs:
   - **Production URL**: `https://www.payfast.co.za/eng/process`
2. Use your live Merchant ID and Merchant Key
3. Ensure your `NOTIFY_URL` is publicly accessible (PayFast needs to reach it)
4. Test a real transaction with a small amount first

## How It Works

### Payment Flow

1. **User Initiates Payment**: User clicks "Pay" button in the monetization modal
2. **Payment Request**: Frontend calls `/api/payments/payfast/initiate`
3. **Payment Form**: Server generates PayFast payment form with signature
4. **Redirect to PayFast**: User is redirected to PayFast payment page
5. **Payment Processing**: User completes payment on PayFast
6. **Return to App**: User is redirected back to success/cancel page
7. **ITN Notification**: PayFast sends Instant Transaction Notification to `/api/payments/payfast/notify`

### API Endpoints

#### POST `/api/payments/payfast/initiate`

Initiates a PayFast payment. Returns payment data and URL.

**Request Body:**

```json
{
  "amount": "1.00",
  "item_name": "Premium Access",
  "item_description": "Unlock premium features",
  "email_address": "user@example.com",
  "name_first": "John",
  "name_last": "Doe",
  "custom_str1": "payment_123",
  "custom_str2": "https://yourdomain.com/page"
}
```

**Response:**

```json
{
  "success": true,
  "payment_url": "https://sandbox.payfast.co.za/eng/process",
  "payment_data": {
    "merchant_id": "...",
    "merchant_key": "...",
    "amount": "1.00",
    "item_name": "Premium Access",
    "signature": "...",
    ...
  },
  "payment_id": "payment_1234567890_abc123"
}
```

#### POST `/api/payments/payfast/notify`

Receives Instant Transaction Notifications (ITN) from PayFast. This endpoint:

- Verifies the payment signature
- Updates payment status in your database
- Grants user premium access
- Sends confirmation emails

**Note**: This endpoint must return HTTP 200 to PayFast, otherwise PayFast will retry.

### Payment Pages

- **Success Page**: `/payment/success` - Shown after successful payment
- **Cancel Page**: `/payment/cancel` - Shown if user cancels payment

## Security Considerations

1. **Signature Verification**: All PayFast requests are verified using MD5 signatures
2. **Passphrase**: Keep your passphrase secure and never expose it to the frontend
3. **HTTPS**: Always use HTTPS in production for secure payment processing
4. **ITN Verification**: Always verify ITN signatures before processing payments

## Customization

### Change Payment Amount

Edit `components/ui/MonetizationModal.tsx`:

```typescript
amount: "1.00", // Change to your desired amount
```

### Customize Payment Items

Modify the payment request in `handlePay` function:

```typescript
item_name: "Premium Access",
item_description: "Unlock premium features and remove ads",
```

### Handle Payment Completion

After successful payment, you can:

1. Update user's premium status in database
2. Send confirmation email
3. Grant access to premium features
4. Log payment transaction

Edit `/api/payments/payfast/notify/route.ts` to add your custom logic.

## Troubleshooting

### Payment Not Processing

1. Check that all environment variables are set correctly
2. Verify Merchant ID and Key are correct
3. Ensure Passphrase matches your PayFast account
4. Check that return URLs are accessible

### ITN Not Received

1. Ensure your `NOTIFY_URL` is publicly accessible
2. Check server logs for ITN requests
3. Verify PayFast can reach your server (no firewall blocking)
4. Ensure the endpoint returns HTTP 200

### Signature Verification Fails

1. Verify Passphrase is correct
2. Check that parameter names match PayFast's expected format
3. Ensure URL encoding is correct
4. Check PayFast documentation for latest signature requirements

## Resources

- [PayFast Developer Documentation](https://developers.payfast.co.za/docs)
- [PayFast Integration Guide](https://payfast.io/wp-content/uploads/2023/07/Chapter-4-Setting-up-a-payment-gateway-Payfast-Guide-to-Going-Online.pdf)
- [PayFast Support](https://support.payfast.help/)

## Support

If you encounter issues:

1. Check PayFast's knowledge base
2. Review server logs for error messages
3. Test with PayFast sandbox first
4. Contact PayFast support if needed
