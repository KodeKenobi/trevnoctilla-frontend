#!/usr/bin/env python3
import sys
import os
from datetime import datetime
from typing import Optional
import base64
import uuid
import requests
from jinja2 import Environment, FileSystemLoader
from pathlib import Path

backend_dir = os.path.join(os.path.dirname(__file__), 'trevnoctilla-backend')
template_dir = Path(backend_dir) / 'templates' / 'emails'
env = Environment(loader=FileSystemLoader([str(template_dir), str(Path(backend_dir) / 'templates')]))

NEXTJS_URL = os.getenv('NEXTJS_API_URL', 'https://www.trevnoctilla.com')
BACKEND_URL = os.getenv('BACKEND_URL', 'https://web-production-737b.up.railway.app')
if not BACKEND_URL.startswith('http'):
    BACKEND_URL = f'https://{BACKEND_URL}'

def generate_subscription_pdf(tier, amount, user_email, subscription_id, payment_id, payment_date, billing_cycle="Monthly", payment_method="PayFast", old_tier=None):
    try:
        tier_names = {'free': 'Free Tier', 'premium': 'Production Plan', 'enterprise': 'Enterprise Plan'}
        subscription_date_obj = payment_date if payment_date else datetime.now()
        subscription_date_str = subscription_date_obj.strftime('%B %d, %Y')
        try:
            from dateutil.relativedelta import relativedelta
            next_billing_date_obj = subscription_date_obj + relativedelta(months=1) if billing_cycle.lower() != "yearly" else subscription_date_obj + relativedelta(years=1)
        except ImportError:
            from datetime import timedelta
            next_billing_date_obj = subscription_date_obj + timedelta(days=30) if billing_cycle.lower() != "yearly" else subscription_date_obj + timedelta(days=365)
        next_billing_date_str = next_billing_date_obj.strftime('%B %d, %Y')
        if not subscription_id:
            subscription_id = f"SUB-{subscription_date_obj.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        logo_base64 = None
        try:
            logo_response = requests.get("https://www.trevnoctilla.com/logo.png", timeout=10)
            if logo_response.status_code == 200:
                logo_base64 = base64.b64encode(logo_response.content).decode('utf-8')
                logo_data_uri = f"data:image/png;base64,{logo_base64}"
        except:
            pass
        subscription_template = env.get_template('upgrade.html')
        old_tier_name = tier_names.get(old_tier.lower(), old_tier) if old_tier else "Free Tier"
        new_tier_name = tier_names.get(tier.lower(), tier)
        subscription_html = subscription_template.render(
            old_tier_name=old_tier_name,
            new_tier_name=new_tier_name
        )
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
            f.write(subscription_html)
            html_path = f.name
        with open(html_path, 'rb') as html_file:
            files = {'html': ('subscription.html', html_file, 'text/html')}
            response = requests.post(f"{BACKEND_URL}/convert_html_to_pdf", files=files, timeout=30)
        try:
            os.unlink(html_path)
        except:
            pass
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success' and data.get('download_url'):
                pdf_url = data['download_url']
                if not pdf_url.startswith('http'):
                    pdf_url = f"{BACKEND_URL}{pdf_url}"
                pdf_response = requests.get(pdf_url, timeout=30)
                if pdf_response.status_code == 200:
                    return pdf_response.content
        return None
    except Exception as e:
        print(f"Error generating subscription PDF: {e}")
        return None

def generate_invoice_pdf(tier, amount, user_email, payment_id, payment_date, item_description, template_name='subscription-invoice.html'):
    try:
        tier_names = {'free': 'Free Tier', 'premium': 'Production Plan', 'enterprise': 'Enterprise Plan'}
        invoice_amount = amount if amount > 0 else {'free': 0.00, 'premium': 29.00, 'enterprise': 49.00}.get(tier.lower(), 0.0)
        invoice_date_obj = payment_date if payment_date else datetime.now()
        invoice_date_str = invoice_date_obj.strftime('%B %d, %Y')
        invoice_number = f"INV-{invoice_date_obj.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        logo_base64 = None
        try:
            logo_response = requests.get("https://www.trevnoctilla.com/logo.png", timeout=10)
            if logo_response.status_code == 200:
                logo_base64 = base64.b64encode(logo_response.content).decode('utf-8')
                logo_data_uri = f"data:image/png;base64,{logo_base64}"
        except:
            pass
        invoice_template = env.get_template(template_name)
        final_item_description = item_description or f"{tier_names.get(tier.lower(), tier)} Subscription"
        if template_name == 'subscription-invoice.html':
            invoice_html = invoice_template.render(
                invoice_number=invoice_number, invoice_date=invoice_date_str, user_email=user_email,
                tier_name=tier_names.get(tier.lower(), tier), item_description=final_item_description,
                unit_price=f"{invoice_amount:.2f}", total_amount=f"{invoice_amount:.2f}",
                amount=f"{invoice_amount:.2f}", currency_symbol="$", tax_amount=0.0, tax_rate=0,
                status="Paid" if invoice_amount > 0 else "Free"
            )
        else:
            invoice_html = invoice_template.render(
                invoice_number=invoice_number, invoice_date=invoice_date_str, user_email=user_email,
                tier_name=tier_names.get(tier.lower(), tier), item_description=final_item_description,
                unit_price=f"{invoice_amount:.2f}", total_amount=f"{invoice_amount:.2f}",
                currency_symbol="$", tax_amount=0.0, tax_rate=0,
                status="Paid" if invoice_amount > 0 else "Free",
                status_class="status-paid" if invoice_amount > 0 else "status-free",
                logo_url=logo_data_uri if logo_base64 else "https://www.trevnoctilla.com/logo.png"
            )
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
            f.write(invoice_html)
            html_path = f.name
        with open(html_path, 'rb') as html_file:
            files = {'html': ('invoice.html', html_file, 'text/html')}
            response = requests.post(f"{BACKEND_URL}/convert_html_to_pdf", files=files, timeout=30)
        try:
            os.unlink(html_path)
        except:
            pass
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success' and data.get('download_url'):
                pdf_url = data['download_url']
                if not pdf_url.startswith('http'):
                    pdf_url = f"{BACKEND_URL}{pdf_url}"
                pdf_response = requests.get(pdf_url, timeout=30)
                if pdf_response.status_code == 200:
                    return pdf_response.content
        return None
    except Exception as e:
        print(f"Error generating invoice PDF: {e}")
        return None

def send_email(to_email, subject, html_content, text_content=None, attachments=None):
    try:
        email_api_url = f"{NEXTJS_URL}/api/email/send"
        payload = {'to': to_email, 'subject': subject, 'html': html_content}
        if text_content:
            payload['text'] = text_content
        if attachments:
            payload['attachments'] = attachments
        response = requests.post(email_api_url, json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                return True
        return False
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def get_upgrade_email_html(user_email, old_tier, new_tier):
    tier_names = {'free': 'Free Tier', 'premium': 'Production Plan', 'enterprise': 'Enterprise Plan'}
    old_tier_name = tier_names.get(old_tier.lower(), old_tier)
    new_tier_name = tier_names.get(new_tier.lower(), new_tier)
    html_template = env.get_template('upgrade.html')
    html_content = html_template.render(old_tier_name=old_tier_name, new_tier_name=new_tier_name)
    text_template = env.get_template('upgrade.txt')
    text_content = text_template.render(old_tier_name=old_tier_name, new_tier_name=new_tier_name)
    return html_content, text_content

def send_upgrade_email(user_email, old_tier, new_tier, amount=0.0, payment_id="", payment_date=None):
    html_content, text_content = get_upgrade_email_html(user_email, old_tier, new_tier)
    tier_names = {'free': 'Free Tier', 'premium': 'Production Plan', 'enterprise': 'Enterprise Plan'}
    subject = f"Trevnoctilla - Successfully Upgraded to {tier_names.get(new_tier.lower(), new_tier)}! 🚀"
    attachments = []
    try:
        subscription_pdf = generate_subscription_pdf(new_tier, amount, user_email, payment_id, payment_id, payment_date, "Monthly", "PayFast", old_tier)
        if subscription_pdf:
            pdf_base64 = base64.b64encode(subscription_pdf).decode('utf-8')
            date_str = payment_date.strftime("%Y%m%d") if payment_date else datetime.now().strftime("%Y%m%d")
            attachments.append({'filename': f'subscription_{new_tier}_{date_str}.pdf', 'content': pdf_base64, 'contentType': 'application/pdf'})
    except Exception as e:
        pass
    return send_email(user_email, subject, html_content, text_content, attachments if attachments else None)

TEST_EMAIL = "tshepomtshali89@gmail.com"
OLD_TIER = "free"
NEW_TIER = "premium"
AMOUNT = 29.0
PAYMENT_ID = f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}"
PAYMENT_DATE = datetime.now()

email_sent = send_upgrade_email(TEST_EMAIL, OLD_TIER, NEW_TIER, amount=AMOUNT, payment_id=PAYMENT_ID, payment_date=PAYMENT_DATE)

if email_sent:
    print(f"SUCCESS: Upgrade email sent to {TEST_EMAIL}")
else:
    print(f"FAILED: Could not send upgrade email to {TEST_EMAIL}")
    sys.exit(1)
