import os
import sys
import json
import time

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'trevnoctilla-backend'))

# Enable simulation mode for safe testing
os.environ['SIMULATION_MODE'] = 'true'

from services.fast_campaign_processor import FastCampaignProcessor
from playwright.sync_api import sync_playwright

def test_single_company():
    company_data = {
        'id': 123,
        'company_name': '2020 Innovation',
        'website_url': 'https://www.2020innovation.com/',
        'contact_email': 'testuser2024@outlook.com',
        'contact_person': 'Test User'
    }
    
    message_template = "Hi {company_name}, I saw your site at {website_url}."
    
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True) # match live behavior
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        processor = FastCampaignProcessor(
            page=page,
            company_data=company_data,
            message_template=message_template,
            campaign_id=1,
            company_id=123,
            subject="Test Subject"
        )
        
        # Override take_screenshot to always do full page for debugging
        def debug_screenshot(prefix):
            path = f"{prefix}_{int(time.time())}.png"
            page.screenshot(path=path, full_page=True)
            print(f"Debug screenshot: {path}")
            return path
        
        processor.take_screenshot = debug_screenshot
        
        print(f"Processing {company_data['website_url']}...")
        result = processor.process_company()
        
        # Take a final screenshot regardless of result
        page.screenshot(path="final_state_full.png", full_page=True)
        print("Final screenshot saved to final_state_full.png")
        
        print("\n--- RESULTS ---")
        print(json.dumps(result, indent=2))
        
        browser.close()

if __name__ == "__main__":
    test_single_company()
