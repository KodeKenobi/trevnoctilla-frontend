# Production Domain Setup Guide

## What is NEXT_PUBLIC_BASE_URL?

`NEXT_PUBLIC_BASE_URL` is your **frontend application's public URL** - the domain where users access your website.

## Where to Get Your Production Domain

### Option 1: If You Have a Custom Domain

If you've connected a custom domain (like `trevnoctilla.com`), use:

```
NEXT_PUBLIC_BASE_URL=https://trevnoctilla.com
```

or

```
NEXT_PUBLIC_BASE_URL=https://www.trevnoctilla.com
```

### Option 2: If Using Railway/Vercel/Netlify

If your app is hosted on Railway, Vercel, or Netlify, use the URL they provide:

**Railway:**

```
NEXT_PUBLIC_BASE_URL=https://your-app-name.up.railway.app
```

**Vercel:**

```
NEXT_PUBLIC_BASE_URL=https://your-app-name.vercel.app
```

**Netlify:**

```
NEXT_PUBLIC_BASE_URL=https://your-app-name.netlify.app
```

## How to Find Your Domain

1. **Check your hosting platform:**

   - Railway: Go to your project → Settings → Domains
   - Vercel: Go to your project → Settings → Domains
   - Netlify: Go to Site settings → Domain management

2. **Check your deployment:**

   - Look at your deployment URL in the hosting dashboard
   - This is usually shown after you deploy

3. **Check your browser:**
   - Visit your live site and check the URL in the address bar
   - That's your production domain

## How to Set It Up

### Step 1: Update `.env.local` (for local development)

Keep it as `http://localhost:3000` for local testing:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 2: Set Environment Variable in Production

**For Railway:**

1. Go to your Railway project
2. Click on your service
3. Go to **Variables** tab
4. Add: `NEXT_PUBLIC_BASE_URL` = `https://your-domain.com`
5. Redeploy

**For Vercel:**

1. Go to your Vercel project
2. Go to **Settings** → **Environment Variables**
3. Add: `NEXT_PUBLIC_BASE_URL` = `https://your-domain.com`
4. Redeploy

**For Netlify:**

1. Go to Site settings → **Environment variables**
2. Add: `NEXT_PUBLIC_BASE_URL` = `https://your-domain.com`
3. Redeploy

## How It's Used in PayFast Integration

The `NEXT_PUBLIC_BASE_URL` is automatically used to create PayFast return URLs:

- **Return URL:** `{NEXT_PUBLIC_BASE_URL}/payment/success`
- **Cancel URL:** `{NEXT_PUBLIC_BASE_URL}/payment/cancel`
- **Notify URL:** `{NEXT_PUBLIC_BASE_URL}/api/payments/payfast/notify`

So if your domain is `https://trevnoctilla.com`, PayFast will redirect users to:

- `https://trevnoctilla.com/payment/success` (after successful payment)
- `https://trevnoctilla.com/payment/cancel` (if user cancels)

## Example Configuration

### Local Development (.env.local):

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Production (Railway/Vercel Environment Variables):

```env
NEXT_PUBLIC_BASE_URL=https://trevnoctilla.com
```

## Important Notes

1. **Must include `https://`** - Don't forget the protocol
2. **No trailing slash** - Don't add `/` at the end
3. **Must be publicly accessible** - PayFast needs to reach your URLs
4. **Set in production environment** - Not just in `.env.local`

## Quick Checklist

- [ ] Found your production domain
- [ ] Set `NEXT_PUBLIC_BASE_URL` in production environment variables
- [ ] Verified the domain is accessible (can visit it in browser)
- [ ] Redeployed after setting the variable
- [ ] Tested PayFast payment flow
