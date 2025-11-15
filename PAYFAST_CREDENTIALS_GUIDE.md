# Where to Find Your PayFast Credentials

This guide shows you exactly where to find each PayFast credential in your PayFast account.

## Step-by-Step Guide

### 1. Log in to PayFast

1. Go to [https://www.payfast.co.za/](https://www.payfast.co.za/)
2. Click **"Log In"** in the top right corner
3. Enter your email and password

### 2. Find Your Merchant ID and Merchant Key

1. Once logged in, click on your **profile/account icon** (usually top right)
2. Go to **"Settings"** or **"My Account"**
3. Navigate to **"Developer Settings"** or **"Integration"** section
4. You'll see:
   - **Merchant ID**: A unique identifier (usually a number like `10000100`)
   - **Merchant Key**: A long alphanumeric string (like `46f0cd694581a`)

**Alternative Path:**

- Go to **"Settings"** → **"Integration"** → **"Developer Settings"**
- Or look for **"API Credentials"** section

### 3. Set Your Passphrase

1. In the same **"Developer Settings"** or **"Integration"** section
2. Look for **"Passphrase"** or **"Security Passphrase"** field
3. If you haven't set one:
   - Click **"Set Passphrase"** or **"Generate Passphrase"**
   - Enter a secure passphrase (or let PayFast generate one)
   - **Save it securely** - you'll need it for signature generation
4. Copy the passphrase

**Important:** The passphrase is used to generate secure signatures. Keep it secret!

### 4. Get Sandbox Credentials (For Testing)

If you want to test with PayFast's sandbox:

1. Look for **"Sandbox"** or **"Test Mode"** section in your account
2. You'll find separate **Sandbox Merchant ID** and **Sandbox Merchant Key**
3. Use these for testing before going live

**Note:** Some PayFast accounts have sandbox credentials in a separate section or you may need to enable sandbox mode.

### 5. PayFast URLs

These are standard PayFast URLs - you don't need to find them, just use:

**For Testing (Sandbox):**

```
NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process
```

**For Production (Live):**

```
NEXT_PUBLIC_PAYFAST_URL=https://www.payfast.co.za/eng/process
```

### 6. Your Base URL

This is your application's domain:

**For Local Development:**

```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**For Production:**

```
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

(Replace `yourdomain.com` with your actual domain, e.g., `https://trevnoctilla.com`)

## Visual Guide

Here's what the PayFast dashboard typically looks like:

```
PayFast Dashboard
├── My Account
│   ├── Settings
│   │   ├── Developer Settings / Integration
│   │   │   ├── Merchant ID: [10000100]
│   │   │   ├── Merchant Key: [46f0cd694581a...]
│   │   │   └── Passphrase: [Set/View Passphrase]
│   │   └── Sandbox Settings (if available)
│   │       ├── Sandbox Merchant ID: [10000100]
│   │       └── Sandbox Merchant Key: [test_key...]
```

## Example .env.local File

Once you have all the credentials, create or update your `.env.local` file:

```env
# PayFast Credentials (from Developer Settings)
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=your_secure_passphrase_here

# PayFast URLs
NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process
NEXT_PUBLIC_PAYFAST_RETURN_URL=http://localhost:3000/payment/success
NEXT_PUBLIC_PAYFAST_CANCEL_URL=http://localhost:3000/payment/cancel
NEXT_PUBLIC_PAYFAST_NOTIFY_URL=http://localhost:3000/api/payments/payfast/notify

# Your Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**For Production**, update to:

```env
NEXT_PUBLIC_PAYFAST_URL=https://www.payfast.co.za/eng/process
NEXT_PUBLIC_PAYFAST_RETURN_URL=https://yourdomain.com/payment/success
NEXT_PUBLIC_PAYFAST_CANCEL_URL=https://yourdomain.com/payment/cancel
NEXT_PUBLIC_PAYFAST_NOTIFY_URL=https://yourdomain.com/api/payments/payfast/notify
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Troubleshooting

### Can't Find Developer Settings?

1. Make sure your PayFast account is **verified**
2. Some accounts may have it under **"Settings"** → **"Integration"**
3. Try looking for **"API Settings"** or **"Webhook Settings"**

### No Sandbox Credentials?

1. Sandbox may not be available for all account types
2. You can still test with your live credentials using small amounts
3. Contact PayFast support if you need sandbox access

### Passphrase Not Working?

1. Make sure you're using the exact passphrase (case-sensitive)
2. Check for extra spaces when copying
3. If you reset it, update your `.env.local` file

## Security Notes

⚠️ **Important Security Tips:**

1. **Never commit** `.env.local` to git (it should be in `.gitignore`)
2. **Never share** your Merchant Key or Passphrase publicly
3. **Use different credentials** for development and production
4. **Rotate credentials** if you suspect they've been compromised

## Need Help?

If you still can't find your credentials:

1. Check PayFast's documentation: [https://developers.payfast.co.za/docs](https://developers.payfast.co.za/docs)
2. Contact PayFast support: [https://support.payfast.help/](https://support.payfast.help/)
3. Look for "Help" or "Support" in your PayFast dashboard
