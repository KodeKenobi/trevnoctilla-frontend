# Quick PayFast Setup Guide

## ✅ What You Already Have:

- **Merchant ID:** `23594634`
- **Merchant Key:** `x3qn7phd3g5xg`

## 🔑 What You Still Need:

### 1. Get Your Passphrase

1. Log in to your PayFast account: [https://www.payfast.co.za/](https://www.payfast.co.za/)
2. Go to **Settings** → **Developer Settings** (or **Integration** → **Developer Settings**)
3. Look for **"Passphrase"** or **"Security Passphrase"** field
4. If you haven't set one:
   - Click **"Set Passphrase"** or **"Generate Passphrase"**
   - Enter a secure passphrase (or let PayFast generate one)
   - **Save it securely** - you'll need it for the `.env.local` file
5. Copy the passphrase

### 2. Create `.env.local` File

Create a file named `.env.local` in your project root (same folder as `package.json`) with this content:

```env
# PayFast Configuration
PAYFAST_MERCHANT_ID=23594634
PAYFAST_MERCHANT_KEY=x3qn7phd3g5xg
PAYFAST_PASSPHRASE=your_passphrase_here

# PayFast URLs (use sandbox for testing)
NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process

# Your Application URL
# For local development:
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# For production (replace with your domain):
# NEXT_PUBLIC_BASE_URL=https://trevnoctilla.com

# Backend API URL
NEXT_PUBLIC_API_BASE_URL=https://web-production-737b.up.railway.app
```

**Important:** Replace `your_passphrase_here` with the actual passphrase from step 1.

### 3. Choose Sandbox or Production

**For Testing (Recommended First):**

- Use: `https://sandbox.payfast.co.za/eng/process`
- Test with PayFast's test card numbers
- No real money is processed

**For Production (When Ready):**

- Use: `https://www.payfast.co.za/eng/process`
- Real payments will be processed
- Make sure your account is verified

### 4. Restart Your Development Server

After creating `.env.local`:

1. Stop your Next.js server (Ctrl+C)
2. Start it again: `npm run dev` or `pnpm dev`
3. The environment variables will be loaded

## 🧪 Testing

1. Go to your app and click "Pay" in the monetization modal
2. You should be redirected to PayFast's payment page
3. Use PayFast's test credentials to complete a test payment
4. You should be redirected back to your success page

## 📝 Checklist

- [ ] Got Passphrase from PayFast dashboard
- [ ] Created `.env.local` file with all credentials
- [ ] Replaced `your_passphrase_here` with actual passphrase
- [ ] Set `NEXT_PUBLIC_BASE_URL` to your domain (for production)
- [ ] Restarted development server
- [ ] Tested payment flow

## ⚠️ Security Notes

- **Never commit** `.env.local` to git (it should be in `.gitignore`)
- **Never share** your Merchant Key or Passphrase publicly
- Use different credentials for development and production if possible

## 🆘 Need Help?

If you can't find the Passphrase:

1. Check PayFast's documentation: [https://developers.payfast.co.za/docs](https://developers.payfast.co.za/docs)
2. Contact PayFast support: [https://support.payfast.help/](https://support.payfast.help/)
3. Look for "Security Settings" or "API Settings" in your PayFast dashboard
