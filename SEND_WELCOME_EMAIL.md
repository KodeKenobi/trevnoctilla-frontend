# How to Send Test Welcome Email

The test script `test-welcome-email.py` is ready, but it needs to run where SMTP port 465 is accessible.

## Solution: Run on Railway Backend

### Option 1: Using Railway CLI (Recommended)

```bash
# Make sure you're in the project root
cd trevnoctilla-backend
railway run python ../test-welcome-email.py
```

### Option 2: Using Railway Dashboard

1. Go to Railway dashboard
2. Select your **backend service**
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **Shell** or **View Logs**
6. Run: `python test-welcome-email.py`

### Option 3: Using the Shell Script

```bash
railway run bash test-welcome-email-railway.sh
```

## Why Local Doesn't Work

Your local machine likely has:
- Firewall blocking port 465
- Network restrictions
- ISP blocking SMTP connections

Railway backend has full network access and can connect to SMTP servers.

## The Script

The script `test-welcome-email.py` is complete and ready. It will:
- Send a welcome email to kodekenobi@gmail.com
- Use the configured SMTP settings
- Show detailed logs of the process

Just run it on Railway where SMTP is accessible.

