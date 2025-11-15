#!/usr/bin/env python3
"""
Test script to send a welcome email to kodekenobi@gmail.com
Standalone version that doesn't require templates
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Email configuration - Afrihost SMTP
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.afrihost.co.za')
SMTP_PORT = int(os.getenv('SMTP_PORT', '465'))
SMTP_USER = os.getenv('SMTP_USER', 'kodekenobi@gmail.com')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', 'Kopenikus0218!')
FROM_EMAIL = 'info@trevnoctilla.com'
FROM_NAME = 'Trevnoctilla Team'

def send_welcome_email_test(to_email: str, tier: str = 'free') -> bool:
    """
    Send a welcome email (test version without templates)
    
    Args:
        to_email: Recipient email address
        tier: Subscription tier (free, premium, enterprise)
    
    Returns:
        True if email sent successfully, False otherwise
    """
    tier_info = {
        'free': {
            'name': 'Free Tier',
            'calls': '5 API calls per month',
            'features': [
                'PDF text extraction',
                'Basic image conversion',
                'QR code generation',
                'Admin dashboard access',
                'Community support'
            ]
        },
        'premium': {
            'name': 'Production Plan',
            'calls': '5,000 API calls per month',
            'features': [
                'PDF operations (merge, split, extract)',
                'Video/audio conversion',
                'Image processing',
                'QR code generation',
                'Admin dashboard access',
                'Priority support'
            ]
        },
        'enterprise': {
            'name': 'Enterprise Plan',
            'calls': 'Unlimited API calls',
            'features': [
                'All file processing capabilities',
                'Enterprise client dashboard',
                'Dedicated support',
                'Custom SLAs',
                'White-label options',
                'Unlimited API calls'
            ]
        }
    }
    
    info = tier_info.get(tier.lower(), tier_info['free'])
    
    # Create HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .feature-list {{ list-style: none; padding: 0; }}
            .feature-list li {{ padding: 10px; margin: 5px 0; background: white; border-left: 4px solid #667eea; }}
            .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to Trevnoctilla!</h1>
            </div>
            <div class="content">
                <p>Hi there,</p>
                <p>Welcome to Trevnoctilla! Your <strong>{info['name']}</strong> account has been activated.</p>
                
                <h2>What you're getting:</h2>
                <ul class="feature-list">
                    <li>📊 <strong>{info['calls']}</strong></li>
                    {''.join([f'<li>✅ {feature}</li>' for feature in info['features']])}
                </ul>
                
                <p>Get started by:</p>
                <ol>
                    <li>Visit your <a href="https://trevnoctilla.com/dashboard">Dashboard</a> to generate your API key</li>
                    <li>Check out our <a href="https://trevnoctilla.com/api-docs">API Documentation</a> for integration guides</li>
                    <li>Start making API calls and building amazing things!</li>
                </ol>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Happy coding!<br>The Trevnoctilla Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Create plain text content
    text_content = f"""
Welcome to Trevnoctilla!

Hi there,

Welcome to Trevnoctilla! Your {info['name']} account has been activated.

What you're getting:
- {info['calls']}
{chr(10).join([f'- {feature}' for feature in info['features']])}

Get started by:
1. Visit your Dashboard: https://trevnoctilla.com/dashboard
2. Check out our API Documentation: https://trevnoctilla.com/api-docs
3. Start making API calls and building amazing things!

If you have any questions, feel free to reach out to our support team.

Happy coding!
The Trevnoctilla Team
    """
    
    subject = f"Welcome to Trevnoctilla - {info['name']} Activated! 🎉"
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add text and HTML parts
        text_part = MIMEText(text_content, 'plain')
        msg.attach(text_part)
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Check if password is set
        if not SMTP_PASSWORD:
            print(f"⚠️ SMTP_PASSWORD not set, cannot send email")
            return False
        
        print(f"🔌 Connecting to {SMTP_HOST}:{SMTP_PORT}...")
        
        # Use SSL for port 465 (Afrihost requires SSL, not STARTTLS)
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            print(f"✅ Connected to SMTP server")
            print(f"🔐 Logging in as {SMTP_USER}...")
            server.login(SMTP_USER, SMTP_PASSWORD)
            print(f"✅ Logged in successfully")
            print(f"📤 Sending email...")
            server.send_message(msg)
        
        print(f"✅ Email sent successfully to {to_email}")
        return True
        
    except (smtplib.SMTPConnectError, TimeoutError, OSError) as e:
        print(f"❌ Connection error: Could not connect to SMTP server")
        print(f"   Error: {e}")
        print(f"   Possible causes:")
        print(f"   - Firewall blocking port {SMTP_PORT}")
        print(f"   - Network connectivity issues")
        print(f"   - SMTP server might be down")
        print(f"   - Try running from Railway/deployment environment where SMTP is accessible")
        return False
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ Authentication error: Invalid credentials")
        print(f"   Error: {e}")
        print(f"   Check SMTP_USER and SMTP_PASSWORD")
        return False
    except Exception as e:
        print(f"❌ Error sending email: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Send welcome email to kodekenobi@gmail.com"""
    recipient_email = "kodekenobi@gmail.com"
    tier = "free"  # Can be 'free', 'premium', or 'enterprise'
    
    print("=" * 60)
    print("Welcome Email Test Script")
    print("=" * 60)
    print(f"\n📋 Configuration:")
    print(f"   SMTP Host: {SMTP_HOST}")
    print(f"   SMTP Port: {SMTP_PORT}")
    print(f"   SMTP User: {SMTP_USER}")
    print(f"   From Email: {FROM_EMAIL}")
    print(f"   SMTP Password: {'*' * len(SMTP_PASSWORD) if SMTP_PASSWORD else 'NOT SET'}")
    
    print(f"\n📧 Sending welcome email...")
    print(f"   To: {recipient_email}")
    print(f"   Tier: {tier}")
    print(f"   Subject: Welcome to Trevnoctilla - Free Tier Activated! 🎉\n")
    
    success = send_welcome_email_test(recipient_email, tier)
    
    print("\n" + "=" * 60)
    if success:
        print("✅ SUCCESS: Welcome email sent!")
        return 0
    else:
        print("❌ FAILED: Could not send welcome email")
        print("   Check the error messages above for details")
        return 1

if __name__ == "__main__":
    import sys
    exit_code = main()
    sys.exit(exit_code)
