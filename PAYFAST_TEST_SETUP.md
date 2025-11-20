# PayFast Test Setup Guide

This guide will help you set up and test PayFast payment gateway integration.

## Quick Start for Testing

### 1. Get Your PayFast Sandbox Credentials

PayFast provides sandbox credentials for testing. You have two options:

#### Option A: Use Sandbox Test Account (Recommended)

1. Go to [PayFast Sandbox](https://sandbox.payfast.co.za/)
2. Sign up for a sandbox account (separate from production)
3. Get your sandbox Merchant ID and Merchant Key from the sandbox dashboard
4. Set a passphrase in sandbox settings

#### Option B: Use Your Production Account in Sandbox Mode

1. Log in to your PayFast account: [https://www.payfast.co.za/](https://www.payfast.co.za/)
2. Go to **Settings** → **Developer Settings**
3. Copy your **Merchant ID** and **Merchant Key**
4. Set or copy your **Passphrase**

**Note:** According to PayFast documentation, you can use your production credentials with the sandbox URL for testing.

### 2. Create `.env.local` File

Create a `.env.local` file in your project root (same folder as `package.json`) with the following:

```env
# PayFast Configuration
# Use your actual credentials from PayFast dashboard
PAYFAST_MERCHANT_ID=23594634
PAYFAST_MERCHANT_KEY=x3qn7phd3g5xg
PAYFAST_PASSPHRASE=your_passphrase_here

# PayFast URLs - Use SANDBOX for testing
NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process

# Your Application URLs
# For local development:
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# For production (when ready):
# NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# PayFast Return URLs (auto-generated from BASE_URL if not set)
NEXT_PUBLIC_PAYFAST_RETURN_URL=http://localhost:3000/payment/success
NEXT_PUBLIC_PAYFAST_CANCEL_URL=http://localhost:3000/payment/cancel
NEXT_PUBLIC_PAYFAST_NOTIFY_URL=http://localhost:3000/api/payments/payfast/notify

# Note: NEXT_PUBLIC_API_BASE_URL is no longer required
# The backend Railway URL is automatically masked through Next.js rewrites
# All API calls use relative URLs that proxy to the backend
```

**Important:**

- Replace `your_passphrase_here` with your actual passphrase from PayFast
- For local testing, use `http://localhost:3000`
- For production, use your actual domain with HTTPS

### 3. Test Card Numbers (Sandbox)

When testing in sandbox mode, use these test card numbers:

**Visa Test Card:**

- Card Number: `4000000000000002`
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)
- Name: Any name

**Mastercard Test Card:**

- Card Number: `5200000000000007`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

**Note:** These are PayFast's standard test cards. Check PayFast documentation for the latest test card numbers.

### 4. Testing the Payment Flow

1. **Start your development server:**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. **Open your app** in the browser (usually `http://localhost:3000`)

3. **Trigger the payment modal:**

   - Navigate to a page that shows the monetization modal
   - Click the "Pay $1" button

4. **Complete the test payment:**

   - You should be redirected to PayFast's sandbox payment page
   - Use one of the test card numbers above
   - Complete the payment form
   - Submit the payment

5. **Verify the flow:**
   - After payment, you should be redirected to `/payment/success`
   - Check your server logs for ITN (Instant Transaction Notification) from PayFast
   - The ITN should be received at `/api/payments/payfast/notify`

### 5. Common Issues and Solutions

#### Issue: "PayFast configuration is missing"

**Solution:**

- Make sure `.env.local` file exists in the project root
- Verify all environment variables are set correctly
- Restart your development server after creating/updating `.env.local`

#### Issue: "Invalid signature" error

**Solution:**

- Verify your passphrase is correct (case-sensitive, no extra spaces)
- Check that you're using the same credentials for both initiate and notify
- Ensure passphrase matches what's set in PayFast dashboard

#### Issue: Payment form doesn't redirect

**Solution:**

- Check browser console for errors
- Verify `NEXT_PUBLIC_PAYFAST_URL` is set to sandbox URL
- Check that payment data is being generated correctly (check server logs)

#### Issue: ITN not received

**Solution:**

- For local testing, ITN won't work because PayFast can't reach `localhost`
- Use a tunneling service like ngrok for local ITN testing:
  ```bash
  ngrok http 3000
  ```
  Then update `NEXT_PUBLIC_PAYFAST_NOTIFY_URL` to your ngrok URL
- In production, ensure your notify URL is publicly accessible via HTTPS

#### Issue: "Merchant credentials mismatch"

**Solution:**

- Verify Merchant ID and Merchant Key match your PayFast account
- Ensure you're using sandbox credentials with sandbox URL
- Check that credentials don't have extra spaces or characters

### 6. Testing ITN (Instant Transaction Notification) Locally

Since PayFast can't reach `localhost`, you need a public URL for ITN testing:

1. **Install ngrok:**

   ```bash
   npm install -g ngrok
   # or download from https://ngrok.com/
   ```

2. **Start ngrok tunnel:**

   ```bash
   ngrok http 3000
   ```

3. **Update your `.env.local`:**

   ```env
   NEXT_PUBLIC_PAYFAST_NOTIFY_URL=https://your-ngrok-url.ngrok.io/api/payments/payfast/notify
   NEXT_PUBLIC_PAYFAST_RETURN_URL=https://your-ngrok-url.ngrok.io/payment/success
   NEXT_PUBLIC_PAYFAST_CANCEL_URL=https://your-ngrok-url.ngrok.io/payment/cancel
   NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
   ```

4. **Restart your server** and test again

### 7. Debugging

Enable detailed logging by checking your server console. The integration logs:

- Payment initiation data
- Signature generation
- ITN received data
- Signature verification results

Look for these log messages:

- `=== PayFast Payment Initiation ===`
- `=== PayFast ITN Received ===`
- `=== PayFast Signature Verification Failed ===` (if there's an issue)

### 8. Production Checklist

Before going live:

- [ ] Replace sandbox URL with production URL: `https://www.payfast.co.za/eng/process`
- [ ] Use production Merchant ID and Merchant Key
- [ ] Ensure all URLs use HTTPS
- [ ] Verify notify URL is publicly accessible
- [ ] Test with a small real transaction first
- [ ] Remove or reduce debug logging
- [ ] Set up proper error monitoring
- [ ] Test ITN notifications are working

### 9. PayFast Documentation

For more details, refer to:

- [PayFast Developer Docs](https://developers.payfast.co.za/docs)
- [PayFast Quick Start](https://developers.payfast.co.za/docs#quickstart)
- [PayFast Integration Guide](https://developers.payfast.co.za/docs#integration)

### Support

If you encounter issues:

1. Check PayFast's [Support Center](https://support.payfast.help/)
2. Review server logs for error messages
3. Verify all credentials match your PayFast dashboard
4. Test with sandbox first before production

This guide will help you set up and test PayFast payment gateway integration.

## Quick Start for Testing

### 1. Get Your PayFast Sandbox Credentials

PayFast provides sandbox credentials for testing. You have two options:

#### Option A: Use Sandbox Test Account (Recommended)

1. Go to [PayFast Sandbox](https://sandbox.payfast.co.za/)
2. Sign up for a sandbox account (separate from production)
3. Get your sandbox Merchant ID and Merchant Key from the sandbox dashboard
4. Set a passphrase in sandbox settings

#### Option B: Use Your Production Account in Sandbox Mode

1. Log in to your PayFast account: [https://www.payfast.co.za/](https://www.payfast.co.za/)
2. Go to **Settings** → **Developer Settings**
3. Copy your **Merchant ID** and **Merchant Key**
4. Set or copy your **Passphrase**

**Note:** According to PayFast documentation, you can use your production credentials with the sandbox URL for testing.

### 2. Create `.env.local` File

Create a `.env.local` file in your project root (same folder as `package.json`) with the following:

```env
# PayFast Configuration
# Use your actual credentials from PayFast dashboard
PAYFAST_MERCHANT_ID=23594634
PAYFAST_MERCHANT_KEY=x3qn7phd3g5xg
PAYFAST_PASSPHRASE=your_passphrase_here

# PayFast URLs - Use SANDBOX for testing
NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process

# Your Application URLs
# For local development:
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# For production (when ready):
# NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# PayFast Return URLs (auto-generated from BASE_URL if not set)
NEXT_PUBLIC_PAYFAST_RETURN_URL=http://localhost:3000/payment/success
NEXT_PUBLIC_PAYFAST_CANCEL_URL=http://localhost:3000/payment/cancel
NEXT_PUBLIC_PAYFAST_NOTIFY_URL=http://localhost:3000/api/payments/payfast/notify

# Note: NEXT_PUBLIC_API_BASE_URL is no longer required
# The backend Railway URL is automatically masked through Next.js rewrites
# All API calls use relative URLs that proxy to the backend
```

**Important:**

- Replace `your_passphrase_here` with your actual passphrase from PayFast
- For local testing, use `http://localhost:3000`
- For production, use your actual domain with HTTPS

### 3. Test Card Numbers (Sandbox)

When testing in sandbox mode, use these test card numbers:

**Visa Test Card:**

- Card Number: `4000000000000002`
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)
- Name: Any name

**Mastercard Test Card:**

- Card Number: `5200000000000007`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

**Note:** These are PayFast's standard test cards. Check PayFast documentation for the latest test card numbers.

### 4. Testing the Payment Flow

1. **Start your development server:**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. **Open your app** in the browser (usually `http://localhost:3000`)

3. **Trigger the payment modal:**

   - Navigate to a page that shows the monetization modal
   - Click the "Pay $1" button

4. **Complete the test payment:**

   - You should be redirected to PayFast's sandbox payment page
   - Use one of the test card numbers above
   - Complete the payment form
   - Submit the payment

5. **Verify the flow:**
   - After payment, you should be redirected to `/payment/success`
   - Check your server logs for ITN (Instant Transaction Notification) from PayFast
   - The ITN should be received at `/api/payments/payfast/notify`

### 5. Common Issues and Solutions

#### Issue: "PayFast configuration is missing"

**Solution:**

- Make sure `.env.local` file exists in the project root
- Verify all environment variables are set correctly
- Restart your development server after creating/updating `.env.local`

#### Issue: "Invalid signature" error

**Solution:**

- Verify your passphrase is correct (case-sensitive, no extra spaces)
- Check that you're using the same credentials for both initiate and notify
- Ensure passphrase matches what's set in PayFast dashboard

#### Issue: Payment form doesn't redirect

**Solution:**

- Check browser console for errors
- Verify `NEXT_PUBLIC_PAYFAST_URL` is set to sandbox URL
- Check that payment data is being generated correctly (check server logs)

#### Issue: ITN not received

**Solution:**

- For local testing, ITN won't work because PayFast can't reach `localhost`
- Use a tunneling service like ngrok for local ITN testing:
  ```bash
  ngrok http 3000
  ```
  Then update `NEXT_PUBLIC_PAYFAST_NOTIFY_URL` to your ngrok URL
- In production, ensure your notify URL is publicly accessible via HTTPS

#### Issue: "Merchant credentials mismatch"

**Solution:**

- Verify Merchant ID and Merchant Key match your PayFast account
- Ensure you're using sandbox credentials with sandbox URL
- Check that credentials don't have extra spaces or characters

### 6. Testing ITN (Instant Transaction Notification) Locally

Since PayFast can't reach `localhost`, you need a public URL for ITN testing:

1. **Install ngrok:**

   ```bash
   npm install -g ngrok
   # or download from https://ngrok.com/
   ```

2. **Start ngrok tunnel:**

   ```bash
   ngrok http 3000
   ```

3. **Update your `.env.local`:**

   ```env
   NEXT_PUBLIC_PAYFAST_NOTIFY_URL=https://your-ngrok-url.ngrok.io/api/payments/payfast/notify
   NEXT_PUBLIC_PAYFAST_RETURN_URL=https://your-ngrok-url.ngrok.io/payment/success
   NEXT_PUBLIC_PAYFAST_CANCEL_URL=https://your-ngrok-url.ngrok.io/payment/cancel
   NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
   ```

4. **Restart your server** and test again

### 7. Debugging

Enable detailed logging by checking your server console. The integration logs:

- Payment initiation data
- Signature generation
- ITN received data
- Signature verification results

Look for these log messages:

- `=== PayFast Payment Initiation ===`
- `=== PayFast ITN Received ===`
- `=== PayFast Signature Verification Failed ===` (if there's an issue)

### 8. Production Checklist

Before going live:

- [ ] Replace sandbox URL with production URL: `https://www.payfast.co.za/eng/process`
- [ ] Use production Merchant ID and Merchant Key
- [ ] Ensure all URLs use HTTPS
- [ ] Verify notify URL is publicly accessible
- [ ] Test with a small real transaction first
- [ ] Remove or reduce debug logging
- [ ] Set up proper error monitoring
- [ ] Test ITN notifications are working

### 9. PayFast Documentation

For more details, refer to:

- [PayFast Developer Docs](https://developers.payfast.co.za/docs)
- [PayFast Quick Start](https://developers.payfast.co.za/docs#quickstart)
- [PayFast Integration Guide](https://developers.payfast.co.za/docs#integration)

### Support

If you encounter issues:

1. Check PayFast's [Support Center](https://support.payfast.help/)
2. Review server logs for error messages
3. Verify all credentials match your PayFast dashboard
4. Test with sandbox first before production
