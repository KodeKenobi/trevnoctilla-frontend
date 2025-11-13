#!/bin/bash
# Test script to send welcome email - Run this on Railway backend
# Usage: railway run bash test-welcome-email-railway.sh

cd trevnoctilla-backend || exit 1

python3 << 'PYTHON_SCRIPT'
import sys
import os
sys.path.insert(0, os.getcwd())

from email_service import send_welcome_email

recipient = "kodekenobi@gmail.com"
tier = "free"

print("=" * 60)
print("Sending Welcome Email Test")
print("=" * 60)
print(f"\nTo: {recipient}")
print(f"Tier: {tier}\n")

try:
    success = send_welcome_email(recipient, tier)
    if success:
        print(f"\n✅ SUCCESS: Email sent to {recipient}")
        sys.exit(0)
    else:
        print(f"\n❌ FAILED: Could not send email")
        sys.exit(1)
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_SCRIPT

