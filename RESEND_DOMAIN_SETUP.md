# Resend Domain Verification Setup

## Step 1: Add DNS Records to Your Domain Provider

Go to your domain provider (where you registered `trevnoctilla.com`) and add these DNS records:

### Domain Verification (Required)

**TXT Record:**

- **Type:** `TXT`
- **Name:** `resend._domainkey` (or just `resend._domainkey.trevnoctilla.com` depending on your provider)
- **Content/Value:**
  ```
  p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDWK0EGULYs67DqzPv/RS6aeTrHnc38WmCMamiYJSZh8SBmHYI158Ec2ILt+5/d4BmEtow7vG8uljvjdoA8zh5h1xBvHAFEYjsrF9G0vNjbtKigS81uPvai6M+ttJK5o1e+Ca9IF0C6a/qxL540IjTJSu5WJiolXEsg5Un1+VL5wIDAQAB
  ```
- **TTL:** Auto (or 3600)

### Enable Sending (Required)

**MX Record:**

- **Type:** `MX`
- **Name:** `send` (or `send.trevnoctilla.com`)
- **Content/Value:** `feedback-smtp.eu-west-1.amazonses.com`
- **TTL:** Auto (or 3600)
- **Priority:** `10`

**TXT Record (SPF):**

- **Type:** `TXT`
- **Name:** `send` (or `send.trevnoctilla.com`)
- **Content/Value:** `v=spf1 include:amazonses.com ~all`
- **TTL:** Auto (or 3600)

**TXT Record (DMARC - Optional but Recommended):**

- **Type:** `TXT`
- **Name:** `_dmarc` (or `_dmarc.trevnoctilla.com`)
- **Content/Value:** `v=DMARC1; p=none;`
- **TTL:** Auto (or 3600)

### Enable Receiving (Optional - Only if you want to receive emails)

**MX Record:**

- **Type:** `MX`
- **Name:** `@` (or `trevnoctilla.com`)
- **Content/Value:** `inbound-smtp.eu-west-1.amazonaws.com`
- **TTL:** Auto (or 3600)
- **Priority:** `9`

## Step 2: Wait for DNS Propagation

After adding the records:

1. Wait 5-60 minutes for DNS propagation
2. Go back to Resend dashboard
3. Click "Verify Domain" or refresh the page
4. Resend will check if the records are correct

## Step 3: Update Environment Variables

Once your domain is verified, update these environment variables:

### In Railway (Next.js Service):

```env
FROM_EMAIL=Trevnoctilla <noreply@trevnoctilla.com>
```

Or if you prefer a different email address:

```env
FROM_EMAIL=Trevnoctilla <hello@trevnoctilla.com>
```

### In Railway (Backend Service):

```env
FROM_EMAIL=Trevnoctilla <noreply@trevnoctilla.com>
```

## Step 4: Redeploy

After updating environment variables:

1. Redeploy your Next.js service on Railway
2. Redeploy your backend service on Railway
3. Test email sending again

## Common Domain Providers

### Cloudflare

1. Go to your domain → DNS → Records
2. Click "Add record"
3. Select the Type, enter Name, and paste Content/Value
4. Click "Save"

### GoDaddy

1. Go to DNS Management
2. Click "Add" to create new record
3. Select Type, enter Host/Name, and paste Value
4. Click "Save"

### Namecheap

1. Go to Domain List → Manage → Advanced DNS
2. Click "Add New Record"
3. Select Type, enter Host, and paste Value
4. Click "Save"

### Google Domains

1. Go to DNS → Custom records
2. Click "Add record"
3. Select Type, enter Name, and paste Data/Value
4. Click "Save"

## Verification Checklist

- [ ] Added `resend._domainkey` TXT record
- [ ] Added `send` MX record
- [ ] Added `send` TXT record (SPF)
- [ ] Added `_dmarc` TXT record (optional)
- [ ] Waited 5-60 minutes for DNS propagation
- [ ] Verified domain in Resend dashboard
- [ ] Updated `FROM_EMAIL` environment variable in Railway
- [ ] Redeployed services
- [ ] Tested email sending

## Testing

After setup, test email sending:

```bash
node test-auth-registration.js
```

Or register a new user on your website - they should receive the welcome email!
