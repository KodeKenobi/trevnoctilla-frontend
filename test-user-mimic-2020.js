#!/usr/bin/env node

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const BASE_URL = "https://www.trevnoctilla.com";
const CSV_FILE_PATH = path.join(__dirname, "mimic_2020.csv");

async function runMimicryTest() {
  let browser;
  let page;

  try {
    log("\n=== 100% User Mimicry Test: Campaign Flow ===", "bright");
    log(`Target: ${BASE_URL}`, "yellow");
    log("Starting browser...", "cyan");

    browser = await chromium.launch({
      headless: true, // Run unattended for script check
      slowMo: 200,
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();

    // =====================================================
    // Step 1: Go to Homepage
    // =====================================================
    log("\n[Step 1] Visiting Trevnoctilla Homepage...", "cyan");
    await page.goto(BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    // Dismiss cookie banner if it exists
    try {
      const cookieBtn = page
        .locator(
          'button:has-text("Accept All"), button:has-text("Accept"), button:has-text("Got it")'
        )
        .first();
      if (await cookieBtn.isVisible({ timeout: 5000 })) {
        log("  🍪 Dismissing cookie banner...", "yellow");
        await cookieBtn.click();
      }
    } catch (e) {
      log("  (No cookie banner found or timed out)", "yellow");
    }

    await page.screenshot({ path: "mimic-screenshots/1-homepage.png" });
    log("  ✓ Homepage loaded", "green");

    // =====================================================
    // Step 2: Navigate to Campaigns
    // =====================================================
    log('\n[Step 2] Finding "Campaigns" in Navigation...', "cyan");
    const campaignsLink = page
      .locator(
        'header nav a:has-text("Campaigns"), header a:has-text("Campaigns")'
      )
      .first();
    await campaignsLink.click();
    await page.waitForURL("**/campaigns", { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "mimic-screenshots/2-campaigns-landing.png",
    });
    log("  ✓ Campaigns page discovered and loaded", "green");

    // =====================================================
    // Step 3: Start New Campaign
    // =====================================================
    log(
      '\n[Step 3] Clicking "Create Campaign/Start Your First Campaign"...',
      "cyan"
    );
    const createBtn = page
      .locator(
        'button:has-text("Create Campaign"), button:has-text("Start Your First Campaign")'
      )
      .first();
    await createBtn.click();
    await page.waitForURL("**/campaigns/upload", { timeout: 30000 });
    await page.screenshot({ path: "mimic-screenshots/3-upload-page.png" });
    log("  ✓ Navigated to Upload page", "green");

    // =====================================================
    // Step 4: Upload CSV
    // =====================================================
    log("\n[Step 4] Uploading CSV with 2020 Innovation...", "cyan");
    const csvContent =
      "website_url,company_name\nhttps://www.2020innovation.com,2020 Innovation";
    fs.writeFileSync(CSV_FILE_PATH, csvContent);

    const fileInput = page.locator('input[id="file-upload"]');
    await fileInput.setInputFiles(CSV_FILE_PATH);

    // Wait for "Upload Complete" or the button to appear
    await page.waitForSelector("text=Upload Complete", { timeout: 30000 });
    await page.screenshot({ path: "mimic-screenshots/4-upload-success.png" });
    log("  ✓ CSV uploaded successfully", "green");

    // =====================================================
    // Step 5: Configure Message Template
    // =====================================================
    log('\n[Step 5] Clicking "Create Message Template"...', "cyan");
    await page.click('button:has-text("Create Message Template")');
    await page.waitForURL("**/campaigns/create", { timeout: 30000 });
    await page.screenshot({ path: "mimic-screenshots/5-create-form.png" });
    log("  ✓ Navigated to Create Campaign form", "green");

    // Fill form
    log("Filling campaign details...", "yellow");
    await page.fill(
      'input[id="campaignName"]',
      `2020 Innovation Test - ${new Date().toLocaleTimeString()}`
    );
    await page.fill('input[placeholder="First Name"]', "User");
    await page.fill('input[placeholder="Last Name"]', "Mimic");
    await page.fill('input[placeholder="Your Company Name"]', "Mimicry Labs");
    await page.fill('input[placeholder="Your Email"]', "test@trevnoctilla.com");
    await page.fill('input[placeholder="Your Phone"]', "+1 555 123 4567");
    await page.selectOption("select", "United Kingdom");
    await page.fill(
      'textarea[id="message"]',
      "Hello 2020 Innovation team, this is a test of our automated campaign flow. No action is required."
    );

    await page.screenshot({ path: "mimic-screenshots/6-form-filled.png" });

    log("Submitting campaign...", "yellow");
    await page.click('button[type="submit"]');

    // Wait for redirect to campaign detail
    await page.waitForURL(/\/campaigns\/\d+/, { timeout: 60000 });
    log("  ✓ Campaign created successfully", "green");
    await page.screenshot({ path: "mimic-screenshots/7-campaign-detail.png" });

    // =====================================================
    // Step 6: Trigger Processing
    // =====================================================
    log("\n[Step 6] Triggering Rapid All Processing...", "cyan");
    // Button text is "Rapid All (1)" or "Rapid All (1/5)" and only appears after companies load
    await page.waitForTimeout(3000); // Let companies fetch and button render
    const rapidAllBtn = page
      .locator("button")
      .filter({ hasText: /Rapid All/i })
      .first();
    await rapidAllBtn.waitFor({ state: "visible", timeout: 20000 });
    await rapidAllBtn.scrollIntoViewIfNeeded();
    log("  ✓ Rapid All button found, clicking...", "green");
    await rapidAllBtn.click();

    // NEW: Handle the Start Processing Limit modal
    try {
      log("  🛡️  Waiting for Limit Modal...", "yellow");
      const startBtn = page
        .locator('button:has-text("Start ("), button:has-text("Start")')
        .first();
      if (await startBtn.isVisible({ timeout: 5000 })) {
        log("  🚀 Clicking Start in modal...", "green");
        await startBtn.click();
      }
    } catch (e) {
      log("  (Modal did not appear or was already handled)", "yellow");
    }

    log(
      "Waiting for processing to complete (check every 2s, exit as soon as done)...",
      "yellow"
    );

    // UI uses a grid of divs, not <table>/<td>. Detect done via status text or disabled "Complete" button.
    const maxChecks = 60;
    let done = false;
    for (let i = 0; i < maxChecks && !done; i++) {
      await page.waitForTimeout(2000);

      try {
        const modal = page.locator("text=Processing Complete").first();
        if (await modal.isVisible({ timeout: 500 })) {
          log(
            "  🔔 Processing Complete modal detected. Dismissing...",
            "yellow"
          );
          await page
            .locator('button:has-text("Cancel"), button:has-text("Close")')
            .first()
            .click()
            .catch(() => {});
          await page.waitForTimeout(500);
        }
      } catch (e) {}

      // Detect completion: grid shows status in span.capitalize and "Complete" disabled button when done
      const statusSpans = await page
        .locator("span.text-xs.capitalize")
        .allInnerTexts();
      const hasCompletedButton = await page
        .locator('button:disabled:has-text("Complete")')
        .first()
        .isVisible()
        .catch(() => false);
      const hasCompletedText = await page
        .getByText("Form submitted successfully")
        .first()
        .isVisible()
        .catch(() => false);
      const hasStatusDone = statusSpans.some((s) => {
        const t = s.trim().toLowerCase();
        return (
          t === "completed" ||
          t === "failed" ||
          t === "contact_info_found" ||
          t.includes("contact info")
        );
      });

      const isDone = hasCompletedButton || hasCompletedText || hasStatusDone;
      log(
        `  Check ${i + 1}/${maxChecks} (${(i + 1) * 2}s)... statuses: [${
          statusSpans.map((s) => s.trim()).join(", ") || "—"
        }], done=${isDone}`,
        "cyan"
      );

      if (i % 5 === 0 || i < 3) {
        await page
          .screenshot({
            path: `mimic-screenshots/8-processing-${i}.png`,
            fullPage: true,
          })
          .catch(() => {});
      }

      if (isDone) {
        log(
          "  ✓ Processing finished detected (company completed/failed).",
          "green"
        );
        done = true;
        break;
      }

      const modalVisible = await page
        .locator("text=Processing Complete")
        .isVisible()
        .catch(() => false);
      if (modalVisible && i >= 2) {
        log("  ✓ Processing likely finished (modal seen).", "green");
        done = true;
        break;
      }
    }
    if (!done)
      log("  ⚠ Stopped after max wait (table may not have updated).", "yellow");

    // =====================================================
    // Step 7: Final Result Screenshot
    // =====================================================
    log("\n[Step 7] Capturing final frontend table screenshot...", "cyan");

    // Ensure modal is gone
    try {
      const modal = page.locator("text=Processing Complete").first();
      if (await modal.isVisible({ timeout: 1000 })) {
        await page
          .click('button:has-text("Cancel")', { force: true })
          .catch(() => {});
      }
    } catch (e) {}

    await page.waitForTimeout(2000);
    // UI uses grid, not table — capture main content or full page
    const grid = page.locator('[class*="grid-cols-[1fr_140px"]').first();
    if (await grid.isVisible().catch(() => false)) {
      await grid
        .screenshot({ path: "mimic-screenshots/9-final-table-result.png" })
        .catch(() => {});
    }
    if (!fs.existsSync("mimic-screenshots/9-final-table-result.png")) {
      await page.screenshot({
        path: "mimic-screenshots/9-final-table-result.png",
        fullPage: true,
      });
    }
    log(
      "  📸 FINAL SCREENSHOT SAVED: mimic-screenshots/9-final-table-result.png",
      "bright"
    );

    // Check what the API actually returns (definitive: backend sending screenshot_url or not)
    const campaignIdMatch = page.url().match(/\/campaigns\/(\d+)/);
    const campaignId = campaignIdMatch ? campaignIdMatch[1] : null;
    if (campaignId) {
      try {
        const apiUrl = `${BASE_URL}/api/campaigns/${campaignId}/companies`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        const companies = data.companies || [];
        log("  [API] Companies from backend:", "cyan");
        for (const c of companies) {
          const hasUrl = !!(c.screenshot_url || c.screenshotUrl);
          log(
            `    id=${c.id} status=${c.status} screenshot_url=${
              hasUrl ? "SET" : "NULL"
            } ${c.screenshot_url || c.screenshotUrl || ""}`,
            hasUrl ? "green" : "red"
          );
        }
        if (
          companies.length > 0 &&
          !companies.some((c) => c.screenshot_url || c.screenshotUrl)
        ) {
          log(
            "  ❌ BACKEND RETURNED NO screenshot_url FOR ANY COMPANY (fix backend/upload)",
            "red"
          );
        }
      } catch (e) {
        log(`  [API] Failed to fetch companies: ${e.message}`, "yellow");
      }
    }

    // Check if company screenshot img is visible in UI
    const screenshotImgs = await page
      .locator(
        'img[src*="screenshot"], img[src*="supabase"], img[src*="campaign_"]'
      )
      .all();
    let visibleCount = 0;
    for (const img of screenshotImgs) {
      const src = await img.getAttribute("src").catch(() => "");
      const visible = await img.isVisible().catch(() => false);
      if (src && visible) visibleCount++;
    }
    if (visibleCount > 0) {
      log(`  ✅ SCREENSHOT IN UI: yes (${visibleCount} img visible)`, "green");
    } else {
      log(
        "  ❌ SCREENSHOT IN UI: no (no img with screenshot/supabase src visible)",
        "red"
      );
    }

    log("\n=== TEST COMPLETED SUCCESSFULLY ===", "green");
  } catch (error) {
    log(`\n❌ TEST FAILED: ${error.message}`, "red");
    if (page) {
      await page.screenshot({ path: "mimic-screenshots/error-mimicry.png" });
      log(
        "  📸 Error screenshot saved: mimic-screenshots/error-mimicry.png",
        "yellow"
      );
    }
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    if (fs.existsSync(CSV_FILE_PATH)) fs.unlinkSync(CSV_FILE_PATH);
  }
}

// Create screenshots directory
const screenshotsDir = path.join(__dirname, "mimic-screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

runMimicryTest()
  .then(() => {
    log("\nExiting.", "cyan");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
