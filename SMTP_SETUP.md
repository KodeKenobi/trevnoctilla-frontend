# SMTP Configuration for Railway

This document explains how to configure SMTP email settings for the Trevnoctilla backend on Railway.

## Environment Variables

Set the following environment variables in your Railway backend service:

### Afrihost SMTP Configuration

```env
SMTP_HOST=smtp.afrihost.co.za
SMTP_PORT=465
SMTP_USER=kodekenobi@gmail.com
SMTP_PASSWORD=Kopenikus0218!
```

### Email Settings

```env
FROM_EMAIL=info@trevnoctilla.com
FROM_NAME=Trevnoctilla Team
```

## How to Set on Railway

1. Go to your Railway project dashboard
2. Select your **backend service** (not the frontend)
3. Go to the **Variables** tab
4. Click **+ New Variable** for each variable above
5. Enter the variable name and value
6. Click **Add**
7. Redeploy your backend service

## SMTP Server Details

- **Server**: `smtp.afrihost.co.za`
- **Port**: `465`
- **Encryption**: SSL (not STARTTLS)
- **Authentication**: Required (username and password)

## Testing

After setting the environment variables, test the email system by:

1. Registering a new user (should receive welcome email)
2. Upgrading a subscription (should receive upgrade email)

Check the backend logs for email sending status:

- ✅ `Email sent successfully to {email}`
- ❌ `Error sending email to {email}: {error}`

## Security Notes

- **Never commit** `.env` files with real passwords to Git
- Use Railway's environment variables for production
- The `.env.example` file in the project root shows the required variables without sensitive data
