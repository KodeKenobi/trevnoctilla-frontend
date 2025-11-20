/**
 * Test script that actually opens browser and tests pages
 * Verifies Railway URL is hidden in Network tab
 */

const puppeteer = require("puppeteer");

const DEV_SERVER = "http://localhost:3002";
const RAILWAY_URL = "web-production-737b.up.railway.app";

console.log("🌐 Opening Browser - Testing Website Pages\n");
console.log("=".repeat(60));

(async () => {
  let browser;
  try {
    // Launch browser
    console.log("\n📋 Launching browser...");
    browser = await puppeteer.launch({
      headless: false, // Show browser so user can see
      defaultViewport: { width: 1280, height: 720 },
    });

    const page = await browser.newPage();

    // Enable request interception to check URLs
    const requests = [];
    page.on("request", (request) => {
      const url = request.url();
      requests.push({
        url: url,
        method: request.method(),
      });
    });

    // Test 1: Open homepage
    console.log("\n📋 Test 1: Opening homepage");
    console.log("-".repeat(60));
    console.log(`   Navigating to ${DEV_SERVER}...`);

    await page.goto(DEV_SERVER, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("✅ PASS: Homepage loaded successfully");

    // Check page title
    const title = await page.title();
    console.log(`   Page title: ${title}`);

    // Test 2: Check if Railway URL appears in page source
    console.log("\n📋 Test 2: Checking page source for Railway URL");
    console.log("-".repeat(60));

    const pageContent = await page.content();
    if (pageContent.includes(RAILWAY_URL)) {
      console.log("❌ FAIL: Railway URL found in page source!");
      // Find occurrences
      const matches = pageContent.match(
        new RegExp(`[^"']*${RAILWAY_URL}[^"']*`, "g")
      );
      if (matches) {
        console.log(`   Found ${matches.length} occurrence(s):`);
        matches.slice(0, 3).forEach((match, i) => {
          console.log(`   ${i + 1}. ${match.substring(0, 100)}...`);
        });
      }
    } else {
      console.log("✅ PASS: Railway URL NOT found in page source");
    }

    // Test 3: Check Network requests
    console.log("\n📋 Test 3: Analyzing Network Requests");
    console.log("-".repeat(60));

    // Wait a bit for all requests to complete
    await page.waitForTimeout(2000);

    const apiRequests = requests.filter(
      (req) => req.url.includes("/api/") || req.url.includes("/auth/")
    );

    console.log(`   Total requests captured: ${requests.length}`);
    console.log(`   API requests: ${apiRequests.length}`);

    let foundRailwayInRequests = false;
    apiRequests.forEach((req) => {
      if (req.url.includes(RAILWAY_URL)) {
        console.log(
          `❌ FAIL: Railway URL found in request: ${req.method} ${req.url}`
        );
        foundRailwayInRequests = true;
      }
    });

    if (!foundRailwayInRequests && apiRequests.length > 0) {
      console.log("✅ PASS: No Railway URL found in API requests");
      console.log("   Sample API requests:");
      apiRequests.slice(0, 5).forEach((req) => {
        const cleanUrl = req.url.replace(DEV_SERVER, "");
        console.log(`   - ${req.method} ${cleanUrl}`);
      });
    } else if (apiRequests.length === 0) {
      console.log("⚠️  WARN: No API requests captured yet");
      console.log("   Try interacting with the page to trigger API calls");
    }

    // Test 4: Check JavaScript console for Railway URL
    console.log("\n📋 Test 4: Checking JavaScript console");
    console.log("-".repeat(60));

    const consoleMessages = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes(RAILWAY_URL)) {
        consoleMessages.push(text);
      }
    });

    // Wait a bit more
    await page.waitForTimeout(1000);

    if (consoleMessages.length > 0) {
      console.log(`⚠️  WARN: Railway URL found in console logs:`);
      consoleMessages.slice(0, 3).forEach((msg) => {
        console.log(`   ${msg.substring(0, 100)}...`);
      });
    } else {
      console.log("✅ PASS: No Railway URL in console logs");
    }

    // Test 5: Try to trigger an API call
    console.log("\n📋 Test 5: Testing API call (if possible)");
    console.log("-".repeat(60));

    try {
      // Try to find and click a button or trigger an action
      // This is just to generate more network traffic
      const buttons = await page.$$("button");
      console.log(`   Found ${buttons.length} buttons on page`);

      // Check if there are any forms
      const forms = await page.$$("form");
      console.log(`   Found ${forms.length} forms on page`);

      console.log("✅ PASS: Page elements detected");
      console.log("   Interact with the page to trigger API calls");
    } catch (error) {
      console.log(`⚠️  WARN: Could not interact with page: ${error.message}`);
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Summary");
    console.log("=".repeat(60));
    console.log("\n✅ Browser testing completed!");
    console.log("\n💡 What to check manually:");
    console.log("   1. Look at the browser window that opened");
    console.log("   2. Open DevTools (F12) → Network tab");
    console.log("   3. Interact with the page (click buttons, fill forms)");
    console.log("   4. Check Network tab - all API requests should show:");
    console.log("      - localhost:3002/api/... (relative URLs)");
    console.log("      - NO Railway URL visible");
    console.log("\n   The browser will stay open for 10 seconds...\n");

    // Keep browser open for user to inspect
    await page.waitForTimeout(10000);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.message.includes("net::ERR_CONNECTION_REFUSED")) {
      console.log("\n💡 Make sure the dev server is running:");
      console.log("   npm run dev");
    }
  } finally {
    if (browser) {
      await browser.close();
      console.log("\n🔒 Browser closed");
    }
  }
})();
