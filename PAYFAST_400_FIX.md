# PayFast 400 Bad Request Fix

## The Problem
PayFast is returning `400 Bad Request` when submitting payment.

## Root Cause
Your merchant credentials (23594634 / x3qn7phd3g5xg) are **PRODUCTION credentials**, but you're trying to use them with the **SANDBOX URL**.

PayFast sandbox requires **separate test credentials** that you get from your PayFast sandbox account.

## Solutions

### Option 1: Get Sandbox Test Credentials (Recommended for Testing)

1. Go to [PayFast Sandbox](https://sandbox.payfast.co.za/)
2. Sign up for a sandbox account (separate from production)
3. Get your sandbox Merchant ID and Merchant Key
4. Update `.env.local`:
   ```env
   PAYFAST_MERCHANT_ID=your_sandbox_merchant_id
   PAYFAST_MERCHANT_KEY=your_sandbox_merchant_key
   PAYFAST_PASSPHRASE=your_sandbox_passphrase
   NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process
   ```
5. Restart your dev server

### Option 2: Use Production URL with Production Credentials

If you want to test with real credentials (be careful - small test amounts only):

1. Update `.env.local`:
   ```env
   PAYFAST_MERCHANT_ID=23594634
   PAYFAST_MERCHANT_KEY=x3qn7phd3g5xg
   PAYFAST_PASSPHRASE=Trevnoctilla_PayFast_Nov_2025
   NEXT_PUBLIC_PAYFAST_URL=https://www.payfast.co.za/eng/process
   ```
2. Restart your dev server
3. **WARNING**: This will process REAL payments!

### Option 3: Check PayFast Account Settings

1. Log into your PayFast account
2. Go to Settings → Developer Settings
3. Check if sandbox mode is enabled
4. Some accounts allow using production credentials with sandbox URL, but you may need to enable this feature

## Quick Test

After updating credentials, run:
```bash
node test-payfast-full.js
```

This will show you exactly what PayFast returns.

## Common Issues

- **400 Bad Request**: Wrong credentials for the URL (production creds with sandbox URL or vice versa)
- **403 Forbidden**: Can't pay yourself (merchant email same as customer email)
- **Invalid Signature**: Passphrase mismatch or signature calculation error


## The Problem
PayFast is returning `400 Bad Request` when submitting payment.

## Root Cause
Your merchant credentials (23594634 / x3qn7phd3g5xg) are **PRODUCTION credentials**, but you're trying to use them with the **SANDBOX URL**.

PayFast sandbox requires **separate test credentials** that you get from your PayFast sandbox account.

## Solutions

### Option 1: Get Sandbox Test Credentials (Recommended for Testing)

1. Go to [PayFast Sandbox](https://sandbox.payfast.co.za/)
2. Sign up for a sandbox account (separate from production)
3. Get your sandbox Merchant ID and Merchant Key
4. Update `.env.local`:
   ```env
   PAYFAST_MERCHANT_ID=your_sandbox_merchant_id
   PAYFAST_MERCHANT_KEY=your_sandbox_merchant_key
   PAYFAST_PASSPHRASE=your_sandbox_passphrase
   NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process
   ```
5. Restart your dev server

### Option 2: Use Production URL with Production Credentials

If you want to test with real credentials (be careful - small test amounts only):

1. Update `.env.local`:
   ```env
   PAYFAST_MERCHANT_ID=23594634
   PAYFAST_MERCHANT_KEY=x3qn7phd3g5xg
   PAYFAST_PASSPHRASE=Trevnoctilla_PayFast_Nov_2025
   NEXT_PUBLIC_PAYFAST_URL=https://www.payfast.co.za/eng/process
   ```
2. Restart your dev server
3. **WARNING**: This will process REAL payments!

### Option 3: Check PayFast Account Settings

1. Log into your PayFast account
2. Go to Settings → Developer Settings
3. Check if sandbox mode is enabled
4. Some accounts allow using production credentials with sandbox URL, but you may need to enable this feature

## Quick Test

After updating credentials, run:
```bash
node test-payfast-full.js
```

This will show you exactly what PayFast returns.

## Common Issues

- **400 Bad Request**: Wrong credentials for the URL (production creds with sandbox URL or vice versa)
- **403 Forbidden**: Can't pay yourself (merchant email same as customer email)
- **Invalid Signature**: Passphrase mismatch or signature calculation error

