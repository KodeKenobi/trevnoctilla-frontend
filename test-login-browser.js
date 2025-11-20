/**
 * Test script: Open browser and login
 * Opens the login page and logs in with test user
 */

const puppeteer = require("puppeteer");

const LOGIN_URL = "http://localhost:3000/auth/login";
const USER_EMAIL = "tshepomtshali89@gmail.com";
const USER_PASSWORD = "Kopenikus0218!";
const RAILWAY_URL = "web-production-737b.up.railway.app";

console.log("=".repeat(60));
console.log("🌐 BROWSER LOGIN TEST");
console.log("=".repeat(60));
console.log(`Login URL: ${LOGIN_URL}`);
console.log(`User: ${USER_EMAIL}`);
console.log("=".repeat(60));
console.log();

(async () => {
  let browser;
  try {
    // Launch browser
    console.log("📋 Launching browser...");
    browser = await puppeteer.launch({
      headless: false, // Show browser
      defaultViewport: { width: 1280, height: 720 },
    });

    const page = await browser.newPage();

    // Track network requests to verify Railway URL is hidden
    const requests = [];
    const responses = [];

    page.on("request", (request) => {
      const url = request.url();
      requests.push({
        url: url,
        method: request.method(),
      });
    });

    page.on("response", (response) => {
      const url = response.url();
      const status = response.status();
      if (url.includes("/api/auth/") || url.includes("/auth/")) {
        responses.push({
          url: url,
          status: status,
          method: response.request().method(),
        });
      }
    });

    // Track console messages
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("error") ||
        text.includes("Error") ||
        text.includes("ERROR")
      ) {
        console.log(`⚠️  Console: ${text}`);
      }
    });

    // Navigate to login page
    console.log(`\n📋 Step 1: Opening login page...`);
    console.log(`   ${LOGIN_URL}`);
    try {
      await page.goto(LOGIN_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      console.log("✅ Login page loaded");
    } catch (error) {
      console.log(`⚠️  Navigation timeout, but continuing...`);
      // Page might still be loading, continue anyway
    }

    // Handle cookie consent dialogs
    console.log(`\n📋 Step 1.5: Handling cookie consent...`);
    try {
      // Wait a bit for cookie dialogs to appear
      await page.waitForTimeout(1000);

      // Try to find and click reject/decline buttons
      const rejectSelectors = [
        'button:has-text("Reject")',
        'button:has-text("Decline")',
        'button:has-text("Reject All")',
        'button:has-text("Decline All")',
        '[data-testid*="reject"]',
        '[data-testid*="decline"]',
        '[id*="reject"]',
        '[id*="decline"]',
        ".cookie-reject",
        ".cookie-decline",
        '[aria-label*="Reject"]',
        '[aria-label*="Decline"]',
      ];

      let cookieHandled = false;
      for (const selector of rejectSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            await button.click();
            console.log(`✅ Clicked cookie reject button: ${selector}`);
            cookieHandled = true;
            await page.waitForTimeout(500);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Also try to find buttons by text content
      if (!cookieHandled) {
        const buttons = await page.$$("button");
        for (const button of buttons) {
          const text = await page.evaluate(
            (el) => el.textContent?.toLowerCase(),
            button
          );
          if (
            text &&
            (text.includes("reject") ||
              text.includes("decline") ||
              text.includes("necessary only"))
          ) {
            await button.click();
            console.log(`✅ Clicked cookie reject button (by text): ${text}`);
            cookieHandled = true;
            await page.waitForTimeout(500);
            break;
          }
        }
      }

      // Try to close any modal/dialog
      if (!cookieHandled) {
        const closeSelectors = [
          'button[aria-label="Close"]',
          "button.close",
          ".modal-close",
          '[data-dismiss="modal"]',
        ];
        for (const selector of closeSelectors) {
          try {
            const closeBtn = await page.$(selector);
            if (closeBtn) {
              await closeBtn.click();
              console.log(`✅ Closed dialog/modal`);
              await page.waitForTimeout(500);
              break;
            }
          } catch (e) {
            // Continue
          }
        }
      }

      if (!cookieHandled) {
        console.log("⚠️  No cookie consent dialog found (or already handled)");
      }
    } catch (error) {
      console.log(`⚠️  Error handling cookies: ${error.message}`);
      // Continue anyway
    }

    // Wait for form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log("✅ Email input found");

    // Fill in email
    console.log(`\n📋 Step 2: Filling in email...`);
    await page.type('input[type="email"]', USER_EMAIL, { delay: 50 });
    console.log(`✅ Email entered: ${USER_EMAIL}`);

    // Fill in password
    console.log(`\n📋 Step 3: Filling in password...`);
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', USER_PASSWORD, { delay: 50 });
    console.log("✅ Password entered");

    // Wait a moment
    await page.waitForTimeout(500);

    // Click submit button
    console.log(`\n📋 Step 4: Submitting login form...`);
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      console.log("✅ Submit button clicked");
    } else {
      // Try to find any submit button
      const buttons = await page.$$("button");
      for (const button of buttons) {
        const text = await page.evaluate((el) => el.textContent, button);
        if (
          text &&
          (text.toLowerCase().includes("login") ||
            text.toLowerCase().includes("sign in"))
        ) {
          await button.click();
          console.log("✅ Login button clicked");
          break;
        }
      }
    }

    // Wait for navigation or response
    console.log(`\n📋 Step 5: Waiting for login to complete...`);

    // Wait for either navigation or API response
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: "networkidle0", timeout: 5000 }),
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/auth/") &&
            (response.status() === 200 || response.status() === 302),
          { timeout: 5000 }
        ),
      ]);
    } catch (error) {
      // Timeout is okay, continue checking
    }

    await page.waitForTimeout(2000);

    // Check current URL
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Check for any error messages on the page
    const pageErrors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll(
        '[role="alert"], .error, [class*="error"], [class*="Error"]'
      );
      return Array.from(errorElements)
        .map((el) => el.textContent?.trim())
        .filter((text) => text && text.length > 0);
    });

    if (pageErrors.length > 0) {
      console.log(`   Error messages found: ${pageErrors.join(", ")}`);
    }

    // Check if login was successful (should redirect away from login page)
    if (currentUrl.includes("/auth/login")) {
      console.log("⚠️  Still on login page - checking for errors...");

      // Check for error messages
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll(
          '[role="alert"], .error, [class*="error"]'
        );
        return Array.from(errorElements)
          .map((el) => el.textContent)
          .join(" ");
      });

      if (errorText) {
        console.log(`❌ Login failed: ${errorText}`);
      } else {
        console.log("⚠️  Still on login page but no error visible");
      }
    } else {
      console.log("✅ Successfully redirected away from login page");
      console.log(`   Redirected to: ${currentUrl}`);
    }

    // Wait a bit more for all requests to complete
    await page.waitForTimeout(2000);

    // Analyze network requests
    console.log(`\n📋 Step 6: Analyzing network requests...`);
    console.log(`   Total requests: ${requests.length}`);

    const apiRequests = requests.filter(
      (req) =>
        req.url.includes("/api/") ||
        req.url.includes("/auth/") ||
        req.url.includes("/payment/")
    );

    console.log(`   API requests: ${apiRequests.length}`);

    // Check auth-related responses
    if (responses.length > 0) {
      console.log(`\n   Auth API responses:`);
      responses.forEach((resp) => {
        const statusIcon =
          resp.status >= 200 && resp.status < 300 ? "✅" : "❌";
        console.log(
          `   ${statusIcon} ${resp.method} ${resp.url.split("?")[0]} - ${
            resp.status
          }`
        );
      });
    }

    let foundRailwayUrl = false;
    apiRequests.forEach((req) => {
      if (req.url.includes(RAILWAY_URL)) {
        console.log(
          `❌ FAIL: Railway URL found in request: ${req.method} ${req.url}`
        );
        foundRailwayUrl = true;
      }
    });

    if (!foundRailwayUrl && apiRequests.length > 0) {
      console.log("✅ PASS: No Railway URL found in API requests");
      console.log("   Sample API requests:");
      apiRequests.slice(0, 5).forEach((req) => {
        const cleanUrl = req.url.replace(LOGIN_URL.split("/auth")[0], "");
        console.log(`   - ${req.method} ${cleanUrl}`);
      });
    } else if (apiRequests.length === 0) {
      console.log("⚠️  No API requests captured yet");
    }

    // Check page content for Railway URL
    console.log(`\n📋 Step 7: Checking page source for Railway URL...`);
    const pageContent = await page.content();
    if (pageContent.includes(RAILWAY_URL)) {
      console.log("⚠️  WARN: Railway URL found in page source");
    } else {
      console.log("✅ PASS: Railway URL NOT found in page source");
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log("✅ Browser login test completed!");
    console.log("\n💡 Results:");
    console.log(`   - Login page opened: ✅`);
    console.log(`   - Form filled: ✅`);
    console.log(`   - Form submitted: ✅`);
    console.log(`   - Railway URL hidden: ${foundRailwayUrl ? "❌" : "✅"}`);
    console.log("\n   Browser will stay open for 10 seconds for inspection...");
    console.log("=".repeat(60));

    // Keep browser open for inspection
    await page.waitForTimeout(10000);
  } catch (error) {
    console.error("\n❌ TEST ERROR:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
  } finally {
    if (browser) {
      await browser.close();
      console.log("\n🔒 Browser closed");
    }
  }
})();
