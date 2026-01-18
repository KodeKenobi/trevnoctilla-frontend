#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.trevnoctilla.com';
const CSV_FILE_PATH = path.join(__dirname, 'sample_companies.csv');

async function testCampaignBrowserFlow() {
  let browser;
  let page;

  try {
    log('\n=== Campaign Browser Flow Test ===', 'bright');
    log(`Frontend: ${FRONTEND_URL}`, 'yellow');
    log('Opening browser...', 'cyan');

    // Launch browser in headed mode so you can see it
    browser = await chromium.launch({
      headless: false, // Set to false to see the browser
      slowMo: 1000, // Slow down by 1 second between actions
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();

    // =====================================================
    // Step 1: Go to Campaigns Page
    // =====================================================
    log('\n[Step 1/6] Opening campaigns page...', 'cyan');
    await page.goto(`${FRONTEND_URL}/campaigns`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    log('✓ Campaigns page loaded', 'green');

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/1-campaigns-list.png', fullPage: true });
    log('  📸 Screenshot saved: 1-campaigns-list.png', 'yellow');

    // =====================================================
    // Step 2: Click "New Campaign" button
    // =====================================================
    log('\n[Step 2/6] Clicking "New Campaign" button...', 'cyan');
    await page.click('button:has-text("New Campaign")');
    await page.waitForURL('**/campaigns/upload', { timeout: 5000 });
    await page.waitForTimeout(2000);
    log('✓ Upload page loaded', 'green');

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/2-upload-page.png', fullPage: true });
    log('  📸 Screenshot saved: 2-upload-page.png', 'yellow');

    // =====================================================
    // Step 3: Upload CSV file
    // =====================================================
    log('\n[Step 3/6] Uploading CSV file...', 'cyan');
    
    // Ensure CSV exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      log('Creating sample CSV...', 'yellow');
      const sampleCSV = `website_url,company_name,contact_email,phone
https://www.trevnoctilla.com,Trevnoctilla,info@trevnoctilla.com,+27630291420
https://www.google.com,Google,contact@google.com,+1234567890`;
      fs.writeFileSync(CSV_FILE_PATH, sampleCSV);
    }

    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(CSV_FILE_PATH);
    
    // Wait for upload to complete and data to show
    await page.waitForTimeout(3000);
    log('✓ CSV uploaded', 'green');

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/3-upload-complete.png', fullPage: true });
    log('  📸 Screenshot saved: 3-upload-complete.png', 'yellow');

    // =====================================================
    // Step 4: Click "Continue" to create campaign
    // =====================================================
    log('\n[Step 4/6] Clicking "Continue" button...', 'cyan');
    await page.click('button:has-text("Continue")');
    await page.waitForURL('**/campaigns/create', { timeout: 5000 });
    await page.waitForTimeout(2000);
    log('✓ Create campaign page loaded', 'green');

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/4-create-campaign.png', fullPage: true });
    log('  📸 Screenshot saved: 4-create-campaign.png', 'yellow');

    // =====================================================
    // Step 5: Fill campaign form and create
    // =====================================================
    log('\n[Step 5/6] Filling campaign form...', 'cyan');
    
    // Fill campaign name
    await page.fill('input[id="campaignName"]', `Browser Test Campaign ${new Date().toLocaleTimeString()}`);
    log('  ✓ Campaign name filled', 'yellow');

    // Fill message template
    await page.fill('textarea[id="messageTemplate"]', 
      'Hello! This is a test message from our automated browser test. Please ignore this test message.');
    log('  ✓ Message template filled', 'yellow');

    await page.waitForTimeout(1000);

    // Take screenshot before submitting
    await page.screenshot({ path: 'test-screenshots/5-form-filled.png', fullPage: true });
    log('  📸 Screenshot saved: 5-form-filled.png', 'yellow');

    // Click Create Campaign button
    log('  Clicking "Create Campaign" button...', 'yellow');
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        log(`  ❌ Browser Error: ${msg.text()}`, 'red');
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      log(`  ❌ Page Error: ${error.message}`, 'red');
    });

    await page.click('button:has-text("Create Campaign")');
    
    // Wait for navigation to campaign detail page
    try {
      await page.waitForURL('**/campaigns/**', { timeout: 10000 });
    } catch (e) {
      log('  ❌ Failed to navigate to campaign page!', 'red');
      log(`  Current URL: ${page.url()}`, 'yellow');
      
      // Check for error messages on page
      const errorText = await page.locator('text=/error|failed/i').first().textContent().catch(() => null);
      if (errorText) {
        log(`  Error message: ${errorText}`, 'red');
      }
      throw new Error('Campaign creation failed - did not navigate to detail page');
    }
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const campaignId = currentUrl.match(/campaigns\/(\d+)/)?.[1];
    
    if (!campaignId) {
      log(`  ❌ Could not extract campaign ID from URL: ${currentUrl}`, 'red');
      throw new Error('Campaign ID not found in URL');
    }
    
    log(`✓ Campaign created! ID: ${campaignId}`, 'green');

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/6-campaign-detail.png', fullPage: true });
    log('  📸 Screenshot saved: 6-campaign-detail.png', 'yellow');

    // =====================================================
    // Step 6: Open Monitor Page
    // =====================================================
    log('\n[Step 6/6] Opening live monitor...', 'cyan');
    
    // Look for the monitor button
    const monitorButton = await page.locator('button:has-text("Live Monitor"), button:has-text("Monitor")').first();
    if (await monitorButton.isVisible()) {
      await monitorButton.click();
      await page.waitForURL('**/monitor', { timeout: 5000 });
      await page.waitForTimeout(3000);
      log('✓ Monitor page loaded', 'green');

      // Take screenshot
      await page.screenshot({ path: 'test-screenshots/7-monitor-page.png', fullPage: true });
      log('  📸 Screenshot saved: 7-monitor-page.png', 'yellow');
    } else {
      log('  ⚠ Monitor button not found, navigating directly...', 'yellow');
      await page.goto(`${FRONTEND_URL}/campaigns/${campaignId}/monitor`);
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-screenshots/7-monitor-page.png', fullPage: true });
      log('  📸 Screenshot saved: 7-monitor-page.png', 'yellow');
    }

    // =====================================================
    // Summary
    // =====================================================
    log('\n=== Test Summary ===', 'bright');
    log('✓ Browser opened and visible', 'green');
    log('✓ Campaigns page loaded', 'green');
    log('✓ CSV uploaded successfully', 'green');
    log('✓ Campaign form filled', 'green');
    log('✓ Campaign created', 'green');
    log('✓ Monitor page loaded', 'green');
    log(`✓ All screenshots saved to test-screenshots/`, 'green');
    log('\n✓ BROWSER FLOW TEST PASSED!', 'green');
    log(`\n📋 Campaign URL: ${FRONTEND_URL}/campaigns/${campaignId}`, 'blue');
    log(`🖥️  Monitor URL: ${FRONTEND_URL}/campaigns/${campaignId}/monitor`, 'blue');

    // Keep browser open for 10 seconds so you can see the result
    log('\n⏳ Keeping browser open for 10 seconds...', 'cyan');
    await page.waitForTimeout(10000);

  } catch (error) {
    log('\n✗ TEST FAILED!', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.stack) {
      log('\nStack trace:', 'yellow');
      console.error(error.stack);
    }

    // Take error screenshot
    if (page) {
      try {
        await page.screenshot({ path: 'test-screenshots/error.png', fullPage: true });
        log('  📸 Error screenshot saved: error.png', 'yellow');
      } catch (e) {
        // Ignore screenshot errors
      }
    }

    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      log('\n🔒 Browser closed.', 'cyan');
    }
  }
}

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Run the test
testCampaignBrowserFlow();
