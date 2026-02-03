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

const BASE_URL = 'https://www.trevnoctilla.com';
const CSV_FILE_PATH = path.join(__dirname, 'mimic_2020.csv');

async function runMimicryTest() {
  let browser;
  let page;

  try {
    log('\n=== 100% User Mimicry Test: Campaign Flow ===', 'bright');
    log(`Target: ${BASE_URL}`, 'yellow');
    log('Starting browser...', 'cyan');

    browser = await chromium.launch({
      headless: false, // Visual verification in the user's environment
      slowMo: 1000,    // Slow down for better visibility
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    page = await context.newPage();

    // =====================================================
    // Step 1: Go to Homepage
    // =====================================================
    log('\n[Step 1] Visiting Trevnoctilla Homepage...', 'cyan');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Dismiss cookie banner if it exists
    try {
      const cookieBtn = page.locator('button:has-text("Accept All"), button:has-text("Accept"), button:has-text("Got it")').first();
      if (await cookieBtn.isVisible({ timeout: 5000 })) {
        log('  🍪 Dismissing cookie banner...', 'yellow');
        await cookieBtn.click();
      }
    } catch (e) {
      log('  (No cookie banner found or timed out)', 'yellow');
    }

    await page.screenshot({ path: 'mimic-screenshots/1-homepage.png' });
    log('  ✓ Homepage loaded', 'green');

    // =====================================================
    // Step 2: Navigate to Campaigns
    // =====================================================
    log('\n[Step 2] Finding "Campaigns" in Navigation...', 'cyan');
    const campaignsLink = page.locator('header nav a:has-text("Campaigns"), header a:has-text("Campaigns")').first();
    await campaignsLink.click();
    await page.waitForURL('**/campaigns', { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'mimic-screenshots/2-campaigns-landing.png' });
    log('  ✓ Campaigns page discovered and loaded', 'green');

    // =====================================================
    // Step 3: Start New Campaign
    // =====================================================
    log('\n[Step 3] Clicking "Create Campaign/Start Your First Campaign"...', 'cyan');
    const createBtn = page.locator('button:has-text("Create Campaign"), button:has-text("Start Your First Campaign")').first();
    await createBtn.click();
    await page.waitForURL('**/campaigns/upload', { timeout: 30000 });
    await page.screenshot({ path: 'mimic-screenshots/3-upload-page.png' });
    log('  ✓ Navigated to Upload page', 'green');

    // =====================================================
    // Step 4: Upload CSV
    // =====================================================
    log('\n[Step 4] Uploading CSV with 2020 Innovation...', 'cyan');
    const csvContent = 'website_url,company_name\nhttps://www.2020innovation.com,2020 Innovation';
    fs.writeFileSync(CSV_FILE_PATH, csvContent);
    
    const fileInput = page.locator('input[id="file-upload"]');
    await fileInput.setInputFiles(CSV_FILE_PATH);
    
    // Wait for "Upload Complete" or the button to appear
    await page.waitForSelector('text=Upload Complete', { timeout: 30000 });
    await page.screenshot({ path: 'mimic-screenshots/4-upload-success.png' });
    log('  ✓ CSV uploaded successfully', 'green');

    // =====================================================
    // Step 5: Configure Message Template
    // =====================================================
    log('\n[Step 5] Clicking "Create Message Template"...', 'cyan');
    await page.click('button:has-text("Create Message Template")');
    await page.waitForURL('**/campaigns/create', { timeout: 30000 });
    await page.screenshot({ path: 'mimic-screenshots/5-create-form.png' });
    log('  ✓ Navigated to Create Campaign form', 'green');

    // Fill form
    log('Filling campaign details...', 'yellow');
    await page.fill('input[id="campaignName"]', `2020 Innovation Test - ${new Date().toLocaleTimeString()}`);
    await page.fill('input[placeholder="First Name"]', 'User');
    await page.fill('input[placeholder="Last Name"]', 'Mimic');
    await page.fill('input[placeholder="Your Company Name"]', 'Mimicry Labs');
    await page.fill('input[placeholder="Your Email"]', 'test@trevnoctilla.com');
    await page.fill('input[placeholder="Your Phone"]', '+1 555 123 4567');
    await page.selectOption('select', 'United Kingdom');
    await page.fill('textarea[id="message"]', 'Hello 2020 Innovation team, this is a test of our automated campaign flow. No action is required.');
    
    await page.screenshot({ path: 'mimic-screenshots/6-form-filled.png' });
    
    log('Submitting campaign...', 'yellow');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to campaign detail
    await page.waitForURL(/\/campaigns\/\d+/, { timeout: 60000 });
    log('  ✓ Campaign created successfully', 'green');
    await page.screenshot({ path: 'mimic-screenshots/7-campaign-detail.png' });

    // =====================================================
    // Step 6: Trigger Processing
    // =====================================================
    log('\n[Step 6] Triggering Rapid All Processing...', 'cyan');
    const rapidAllBtn = page.locator('button:has-text("Rapid All")').first();
    await rapidAllBtn.click();
    
    // NEW: Handle the Start Processing Limit modal
    try {
        log('  🛡️  Waiting for Limit Modal...', 'yellow');
        const startBtn = page.locator('button:has-text("Start ("), button:has-text("Start")').first();
        if (await startBtn.isVisible({ timeout: 5000 })) {
            log('  🚀 Clicking Start in modal...', 'green');
            await startBtn.click();
        }
    } catch (e) {
        log('  (Modal did not appear or was already handled)', 'yellow');
    }

    log('Waiting for processing to complete...', 'yellow');
    
    // Mimic user watching the table
    for (let i = 0; i < 40; i++) {
        await page.waitForTimeout(5000);
        
        // 1. Check for the "Processing Complete" modal and dismiss it
        try {
            const modal = page.locator('text=Processing Complete').first();
            if (await modal.isVisible({ timeout: 1000 })) {
                log('  🔔 Processing Complete modal detected. Dismissing...', 'yellow');
                // Click "Cancel" or "Close" button in the modal to see the table
                const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close"), svg').first();
                await closeBtn.click();
                await page.waitForTimeout(1000);
            }
        } catch (e) {}

        // 2. Get statuses from the table
        const statuses = await page.locator('td').allInnerTexts();
        
        log(`  Checking status (${(i+1)*5}s)...`, 'cyan');
        if (statuses.length > 0) {
            log(`  Found statuses: ${statuses.map(s => `"${s.trim()}"`).join(', ')}`, 'yellow');
        } else {
            log('  (No table data found yet)', 'yellow');
        }
        
        const isDone = statuses.some(s => 
            s.toLowerCase().includes('completed') || 
            s.toLowerCase().includes('success') ||
            s.toLowerCase().includes('failed') ||
            s.toLowerCase().includes('not found') ||
            s.toLowerCase().includes('error')
        );
        
        await page.screenshot({ path: `mimic-screenshots/8-processing-${i}.png`, fullPage: true });
        
        if (isDone) {
            log('  ✓ Processing finished detected in table!', 'green');
            break;
        }
        
        // Backup: Check if Processing Complete modal was seen but table is empty
        const modalVisible = await page.locator('text=Processing Complete').isVisible().catch(() => false);
        if (modalVisible && i > 5) {
            log('  ✓ Processing likely finished (modal seen).', 'green');
            break;
        }
    }

    // =====================================================
    // Step 7: Final Result Screenshot
    // =====================================================
    log('\n[Step 7] Capturing final frontend table screenshot...', 'cyan');
    
    // Ensure modal is gone
    try {
        const modal = page.locator('text=Processing Complete').first();
        if (await modal.isVisible({ timeout: 1000 })) {
            await page.click('button:has-text("Cancel")', { force: true }).catch(() => {});
        }
    } catch (e) {}

    await page.waitForTimeout(2000);
    // Focus on the table
    const table = page.locator('table').first();
    if (await table.isVisible()) {
        await table.screenshot({ path: 'mimic-screenshots/9-final-table-result.png' });
    } else {
        await page.screenshot({ path: 'mimic-screenshots/9-final-table-result.png', fullPage: true });
    }
    log('  📸 FINAL SCREENSHOT SAVED: mimic-screenshots/9-final-table-result.png', 'bright');

    log('\n=== TEST COMPLETED SUCCESSFULLY ===', 'green');

  } catch (error) {
    log(`\n❌ TEST FAILED: ${error.message}`, 'red');
    if (page) {
      await page.screenshot({ path: 'mimic-screenshots/error-mimicry.png' });
      log('  📸 Error screenshot saved: mimic-screenshots/error-mimicry.png', 'yellow');
    }
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    if (fs.existsSync(CSV_FILE_PATH)) fs.unlinkSync(CSV_FILE_PATH);
  }
}

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'mimic-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

runMimicryTest();
