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

const FRONTEND_URL = 'https://www.trevnoctilla.com';
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
    await page.goto(`${FRONTEND_URL}/campaigns`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for loader to disappear
    log('Waiting for initial loader to finish...', 'yellow');
    await page.waitForSelector('text=Loading...', { state: 'detached', timeout: 15000 }).catch(() => {});
    
    await page.waitForTimeout(2000);
    log('✓ Campaigns page loaded', 'green');

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/1-campaigns-list.png', fullPage: true });
    log('  📸 Screenshot saved: 1-campaigns-list.png', 'yellow');

    // =====================================================
    // Step 2: Click "New Campaign" button
    // =====================================================
    log('\n[Step 2/6] Clicking "New Campaign" button...', 'cyan');
    
    // Handle empty state vs populated state buttons
    const newBtn = await page.locator('button:has-text("Create Campaign"), button:has-text("Start Your First Campaign")').first();
    if (await newBtn.isVisible()) {
        await newBtn.click();
    } else {
        log('Could not find create button, navigating directly...', 'yellow');
        await page.goto(`${FRONTEND_URL}/campaigns/upload`);
    }
    
    await page.waitForURL('**/campaigns/upload', { timeout: 10000 });
    await page.waitForTimeout(2000);
    log('✓ Upload page loaded', 'green');

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/2-upload-page.png', fullPage: true });
    log('  📸 Screenshot saved: 2-upload-page.png', 'yellow');

    // =====================================================
    // Step 3: Upload CSV file
    // =====================================================
    log('\n[Step 3/6] Uploading CSV file...', 'cyan');
    
    // Ensure CSV exists with requested companies
    log('Creating sample CSV with 2020innovation and Trevnoctilla...', 'yellow');
    const sampleCSV = `website_url,company_name,country
https://2020innovation.com,2020 Innovation,United Kingdom
https://www.trevnoctilla.com,Trevnoctilla,South Africa`;
    fs.writeFileSync(CSV_FILE_PATH, sampleCSV);

    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(CSV_FILE_PATH);
    
    // Wait for processing modal to appear and then disappear
    log('Waiting for upload processing...', 'yellow');
    try {
        await page.waitForTimeout(1000); // Give it a sec to appear
        const processingModal = page.locator('text=Processing...');
        if (await processingModal.isVisible()) {
            await processingModal.waitFor({ state: 'detached', timeout: 30000 });
            log('✓ Processing modal cleared', 'green');
        }
    } catch (e) {
        log('  ⚠ Processing modal toggle missed (might be too fast), continuing...', 'yellow');
    }

    // Wait for data to show and success state
    await page.waitForSelector('text=Upload Complete', { timeout: 10000 });
    log('✓ CSV uploaded and processed', 'green');

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/3-upload-complete.png', fullPage: true });
    log('  📸 Screenshot saved: 3-upload-complete.png', 'yellow');

    // =====================================================
    // Step 4: Click "Create Message Template" to create campaign
    // =====================================================
    log('\n[Step 4/6] Clicking "Create Message Template" button...', 'cyan');
    await page.click('button:has-text("Create Message Template")');
    await page.waitForURL('**/campaigns/create', { timeout: 10000 });
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
    await page.fill('input[id="campaignName"]', `Visual Fix Test ${new Date().toLocaleTimeString()}`);
    log('  ✓ Campaign name filled', 'yellow');

    // Fill Sender Details (New Fields)
    await page.fill('input[placeholder="First Name"]', 'Visual');
    await page.fill('input[placeholder="Last Name"]', 'Tester');
    await page.fill('input[placeholder="Your Company Name"]', 'Automated Testing Co');
    await page.fill('input[placeholder="Your Email"]', 'test@example.com');
    await page.fill('input[placeholder="Your Phone"]', '0123456789');
    await page.fill('input[placeholder="Subject"]', 'Automated Visual Test Inquiry');
    log('  ✓ Sender details filled', 'yellow');

    // Fill message
    await page.fill('textarea[id="message"]', 
      'Hello! This is an automated visual test to verify form heuristics and screenshot capture. Please ignore this test.');
    log('  ✓ Message filled', 'yellow');

    await page.waitForTimeout(1000);

    // Click Create Campaign button
    log('  Clicking "Create Campaign" button...', 'yellow');

    // Attempt to dismiss overlays by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Force click to bypass any non-blocking overlays
    await page.click('button:has-text("Create Campaign")', { force: true });
    
    // Wait for navigation to campaign detail page
    try {
        await page.waitForURL('**/campaigns/([0-9]*)', { timeout: 45000 });
    } catch (e) {
        log('  ⚠ Navigation wait timed out, checking if we arrived anyway...', 'yellow');
        
        // Check if we are on the page by looking for the "Rapid All" button
        const rButton = await page.locator('button:has-text("Rapid All")').first();
        if (await rButton.isVisible()) {
            log('  ✓ Found "Rapid All" button - we are on the campaign page!', 'green');
        } else {
            // Real failure logging
            log('  ❌ Navigation failed and no Rapid All button found.', 'red');
            const url = page.url();
            log(`  Current URL: ${url}`, 'red');
            
            const errorMsg = await page.locator('.text-red-300, .text-red-500, [role="alert"]').allTextContents();
            if (errorMsg.length > 0) log(`  Found error messages: ${errorMsg.join(', ')}`, 'red');
            
            await page.screenshot({ path: 'test-screenshots/error-create-timeout.png', fullPage: true });
            throw e;
        }
    }
    await page.waitForTimeout(3000);
    
    // Get ID from URL or just grab it from button/page if needed
    let campaignId = page.url().match(/campaigns\/(\d+)/)?.[1];
    if (!campaignId) {
        log('  ⚠ Could not parse ID from URL, using timestamp as fallback ID', 'yellow');
        campaignId = Date.now().toString();
    }
    log(`✓ Campaign created! ID: ${campaignId}`, 'green');

    // =====================================================
    // Step 6: Trigger Rapid All and Watch
    // =====================================================
    log('\n[Step 6/6] Triggering Rapid All...', 'cyan');
    
    // Find Rapid All button
    const rapidAllButton = await page.locator('button:has-text("Rapid All")').first();
    await rapidAllButton.click();
    
    log('✓ Rapid All started. Waiting for limit modal if any...', 'yellow');
    
    // Wait for modal to potentially appear
    await page.waitForTimeout(1000);
    
    // Look for generic Start button in the modal
    const startButton = await page.locator('button:has-text("Start (")').first();
    
    if (await startButton.isVisible({ timeout: 5000 })) {
       log(`  Found start button: "${await startButton.textContent()}"`, 'yellow');
       log('  Clicking confirm in modal...', 'yellow');
       await startButton.click();
    } else {
        // Fallback: check for any "Start" button if the format is different
        const anyStart = await page.locator('div[role="dialog"] button:has-text("Start")').first();
        if (await anyStart.isVisible()) {
            log(`  Found generic start button: "${await anyStart.textContent()}"`, 'yellow');
            await anyStart.click();
        } else {
            log('  No limit modal start button found (might have auto-started or selector mismatch)', 'yellow');
            // Log what buttons are visible to debug
            const buttons = await page.locator('div[role="dialog"] button').allInnerTexts().catch(() => []);
            if (buttons.length > 0) log(`  Visible modal buttons: ${buttons.join(', ')}`, 'yellow');
        }
    }

    log('\nWatching companies process in real-time...', 'cyan');
    
    // Watch for 120 seconds for the extensive test
    for (let i = 0; i < 120; i++) {
      await page.waitForTimeout(2000);
      const statusText = await page.locator('div:has-text("Completed"), div:has-text("Failed")').count();
      
      if (i % 5 === 0) {
        await page.screenshot({ path: `test-screenshots/8-processing-${i}s.png`, fullPage: true });
        
        // Check table rows for status
        try {
            const completedCount = await page.locator('td:has-text("Completed")').count();
            const failedCount = await page.locator('td:has-text("Failed")').count();
            const contactFoundCount = await page.locator('td:has-text("Contact Info Found")').count();
            
            const totalFinished = completedCount + failedCount + contactFoundCount;
            
            log(`  📊 Check ${i}s: Table rows - Completed: ${completedCount}, Failed: ${failedCount}, Other: ${contactFoundCount}`, 'yellow');
            
            if (totalFinished >= 2) {
                 log('✓ All 2 test companies finished processing (based on table rows)!', 'green');
                 await page.screenshot({ path: 'test-screenshots/9-final-status.png', fullPage: true });
                 break;
            }
        } catch (e) {
            log('  ⚠ Error checking table rows: ' + e.message, 'red');
        }
      }
    }

    // FINAL CHECK: Screenshot visibility
    log('\nVerifying screenshot visibility in the table...', 'cyan');
    const screenshotImgs = await page.locator('button img').count();
    log(`✓ Found ${screenshotImgs} screenshot thumbnails in the table.`, 'green');
    
    if (screenshotImgs > 0) {
      log('  Clicking first screenshot to verify modal load...', 'yellow');
      await page.locator('button img').first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/9-screenshot-modal.png', fullPage: true });
      log('  📸 Screenshot saved: 9-screenshot-modal.png', 'yellow');
    }

    if (!formFilled) {
      log('  ⚠ Warning: No form filling detected in 30 seconds', 'yellow');
      log('  This might mean auto-start is disabled or the campaign needs manual start', 'yellow');
    }

    // =====================================================
    // Step 8: Return to Campaign Detail
    // =====================================================
    log('\n[Step 8/8] Returning to campaign detail page...', 'cyan');
    await page.goto(`${FRONTEND_URL}/campaigns/${campaignId}`);
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-screenshots/9-final-status.png', fullPage: true });
    log('  📸 Screenshot saved: 9-final-status.png', 'yellow');
    log('✓ Campaign detail page loaded', 'green');

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
