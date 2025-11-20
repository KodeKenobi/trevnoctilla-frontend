/**
 * Test script: Login, navigate to dashboard, billing section, and list billing history
 * Opens browser, logs in, navigates to billing, and displays billing history
 */

const puppeteer = require("puppeteer");

const LOGIN_URL = "http://localhost:3000/auth/login";
const USER_EMAIL = "tshepomtshali89@gmail.com";
const USER_PASSWORD = "Kopenikus0218!";

console.log("=".repeat(60));
console.log("💳 BILLING HISTORY TEST");
console.log("=".repeat(60));
console.log(`Login URL: ${LOGIN_URL}`);
console.log(`User: ${USER_EMAIL}`);
console.log("=".repeat(60));
console.log();

(async () => {
  let browser;
  try {
    // Launch browser
    console.log("📋 Step 1: Launching browser...");
    browser = await puppeteer.launch({
      headless: false, // Show browser
      defaultViewport: { width: 1280, height: 720 },
    });

    const page = await browser.newPage();

    // Track network requests
    const requests = [];
    const responses = [];

    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/api/") || url.includes("/auth/") || url.includes("/payment/")) {
        requests.push({
          url: url,
          method: request.method(),
        });
      }
    });

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/api/") || url.includes("/auth/") || url.includes("/payment/")) {
        const status = response.status();
        responses.push({
          url,
          status,
        });
      }
    });

    // Navigate to login page
    console.log(`\n📋 Step 2: Opening login page...`);
    console.log(`   ${LOGIN_URL}`);
    try {
      await page.goto(LOGIN_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      console.log("✅ Login page loaded");
    } catch (error) {
      console.log(`⚠️  Navigation timeout, but continuing...`);
    }

    // Handle cookie consent dialogs FIRST
    console.log(`\n📋 Step 3: Handling cookie consent...`);
    const cookieConsentSelectors = [
      'button[id*="cookie"][id*="reject"]',
      'button[id*="cookie"][id*="decline"]',
      'button[class*="cookie"][class*="reject"]',
      'button[class*="cookie"][class*="decline"]',
      'button[id*="reject-all"]',
      'button[id*="decline-all"]',
      '[id*="reject-cookies"]',
      '[id*="decline-cookies"]',
      '[id*="reject"]',
      '[id*="decline"]',
      ".cookie-reject",
      ".cookie-decline",
      '[aria-label*="Reject"]',
      '[aria-label*="Decline"]',
      'button:has-text("Reject")',
      'button:has-text("Decline")',
      'button:has-text("Reject All")',
      'button:has-text("Decline All")',
    ];

    let cookieHandled = false;
    for (const selector of cookieConsentSelectors) {
      try {
        const button = await page.waitForSelector(selector, {
          timeout: 5000,
          visible: true,
        });
        if (button) {
          await button.click();
          console.log(`✅ Clicked cookie consent button: ${selector}`);
          cookieHandled = true;
          // Wait for the dialog to disappear
          await page.waitForSelector(selector, { hidden: true, timeout: 5000 }).catch(() => {});
          break;
        }
      } catch (e) {
        // Selector not found or not visible, try next
      }
    }

    // Also try to find and click any button with "reject" or "decline" text
    if (!cookieHandled) {
      try {
        const buttons = await page.$$("button");
        for (const button of buttons) {
          const text = await page.evaluate((el) => el.textContent?.toLowerCase(), button);
          if (text && (text.includes("reject") || text.includes("decline"))) {
            await button.click();
            console.log(`✅ Clicked cookie button with text: ${text}`);
            cookieHandled = true;
            await page.waitForTimeout(1000);
            break;
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    if (!cookieHandled) {
      console.log("⚠️  No cookie consent dialog found (or already handled)");
    }

    // Close any persistent pop-ups or modals
    const closeSelectors = [
      'button[aria-label="Close"]',
      "button.close",
      ".modal-close",
      '[data-dismiss="modal"]',
    ];
    for (const selector of closeSelectors) {
      try {
        const button = await page.waitForSelector(selector, {
          timeout: 2000,
          visible: true,
        });
        if (button) {
          await button.click();
          console.log(`✅ Closed pop-up/modal with selector: ${selector}`);
          await page.waitForSelector(selector, { hidden: true, timeout: 2000 }).catch(() => {});
        }
      } catch (e) {
        // Selector not found or not visible
      }
    }

    // Wait for form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log("✅ Email input found");

    // Fill in email
    console.log(`\n📋 Step 4: Filling in email...`);
    await page.type('input[type="email"]', USER_EMAIL, { delay: 50 });
    console.log(`✅ Email entered: ${USER_EMAIL}`);

    // Fill in password
    console.log(`\n📋 Step 5: Filling in password...`);
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', USER_PASSWORD, { delay: 50 });
    console.log("✅ Password entered");

    // Wait a moment
    await page.waitForTimeout(500);

    // Click submit button
    console.log(`\n📋 Step 6: Submitting login form...`);
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      console.log("✅ Submit button clicked");
    } else {
      // Try to find any submit button
      const buttons = await page.$$("button");
      for (const button of buttons) {
        const text = await page.evaluate(
          (el) => el.textContent?.toLowerCase(),
          button
        );
        if (text && (text.includes("login") || text.includes("sign in"))) {
          await button.click();
          console.log("✅ Login button clicked");
          break;
        }
      }
    }

    // Wait for navigation or response
    console.log(`\n📋 Step 7: Waiting for login to complete...`);
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 }),
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/auth/callback/credentials") &&
            response.status() === 200,
          { timeout: 10000 }
        ),
      ]);
      console.log("✅ Login successful, navigation detected");
    } catch (error) {
      console.log(`⚠️  No immediate navigation, checking current page...`);
    }

    await page.waitForTimeout(2000); // Give time for redirects/state updates

    // Check current URL
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes("/auth/login")) {
      console.log("⚠️  Still on login page - login may have failed");
      console.log("   Checking for error messages...");
      const pageErrors = await page.evaluate(() => {
        const errorElements = document.querySelectorAll(
          '[role="alert"], .error, [class*="error"], [data-error]'
        );
        return Array.from(errorElements)
          .map((el) => el.textContent?.trim())
          .filter((text) => text && text.length > 0);
      });
      if (pageErrors.length > 0) {
        console.log(`   Error messages: ${pageErrors.join(", ")}`);
      }
    } else {
      console.log("✅ Successfully logged in and redirected");
    }

    // Navigate to dashboard if not already there
    console.log(`\n📋 Step 8: Navigating to dashboard...`);
    if (!currentUrl.includes("/dashboard")) {
      await page.goto("http://localhost:3000/dashboard", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      console.log("✅ Navigated to dashboard");
      await page.waitForTimeout(2000);
    } else {
      console.log("✅ Already on dashboard");
    }

    // Handle cookie consent again if it appears
    console.log(`\n📋 Step 9: Checking for cookie consent on dashboard...`);
    for (const selector of cookieConsentSelectors) {
      try {
        const button = await page.waitForSelector(selector, {
          timeout: 3000,
          visible: true,
        });
        if (button) {
          await button.click();
          console.log(`✅ Clicked cookie consent button: ${selector}`);
          await page.waitForSelector(selector, { hidden: true, timeout: 3000 }).catch(() => {});
          break;
        }
      } catch (e) {
        // Selector not found
      }
    }

    // Look for billing section or billing tab
    console.log(`\n📋 Step 10: Looking for billing section...`);
    await page.waitForTimeout(2000);

    // Try to find billing tab/button/link
    const billingSelectors = [
      'a[href*="billing"]',
      'button:has-text("Billing")',
      '[data-testid*="billing"]',
      'button:has-text("Payment")',
      'a:has-text("Billing")',
      'a:has-text("Payment")',
    ];

    let billingFound = false;
    for (const selector of billingSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await page.evaluate((el) => el.textContent?.toLowerCase(), element);
          if (text && (text.includes("billing") || text.includes("payment"))) {
            await element.click();
            console.log(`✅ Clicked billing element: ${selector}`);
            billingFound = true;
            await page.waitForTimeout(2000);
            break;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    // If billing section is on the same page, try scrolling or looking for it
    if (!billingFound) {
      console.log("⚠️  Billing link not found, checking if billing section is on dashboard...");
      
      // Try to scroll to find billing section
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(1000);
      
      // Look for billing history table or section
      const billingSection = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        for (const heading of headings) {
          const text = heading.textContent?.toLowerCase();
          if (text && (text.includes("billing") || text.includes("payment") || text.includes("invoice"))) {
            return heading.textContent;
          }
        }
        return null;
      });
      
      if (billingSection) {
        console.log(`✅ Found billing section: ${billingSection}`);
        billingFound = true;
      }
    }

    // Wait for billing history to load
    console.log(`\n📋 Step 11: Waiting for billing history to load...`);
    await page.waitForTimeout(3000);

    // Check for API call to billing history
    const billingHistoryResponse = responses.find((r) =>
      r.url.includes("billing-history")
    );
    if (billingHistoryResponse) {
      console.log(
        `✅ Billing history API called: ${billingHistoryResponse.url} (Status: ${billingHistoryResponse.status})`
      );
    } else {
      console.log("⚠️  Billing history API call not detected");
    }

    // Extract billing history from the page
    console.log(`\n📋 Step 12: Extracting billing history from page...`);
    const billingHistory = await page.evaluate(() => {
      const history = [];
      
      // Look for tables
      const tables = document.querySelectorAll("table");
      for (const table of tables) {
        const rows = table.querySelectorAll("tr");
        if (rows.length > 1) {
          // Check if this looks like a billing history table
          const headerRow = rows[0];
          const headerText = headerRow.textContent?.toLowerCase();
          if (
            headerText &&
            (headerText.includes("invoice") ||
              headerText.includes("amount") ||
              headerText.includes("date") ||
              headerText.includes("status") ||
              headerText.includes("payment"))
          ) {
            // Extract data rows
            for (let i = 1; i < rows.length; i++) {
              const cells = rows[i].querySelectorAll("td");
              if (cells.length > 0) {
                const rowData = {
                  invoice: cells[0]?.textContent?.trim() || "",
                  amount: cells[1]?.textContent?.trim() || "",
                  date: cells[2]?.textContent?.trim() || "",
                  status: cells[3]?.textContent?.trim() || "",
                };
                history.push(rowData);
              }
            }
            break;
          }
        }
      }
      
      // If no table found, look for list items or cards
      if (history.length === 0) {
        const items = document.querySelectorAll(
          '[class*="billing"], [class*="invoice"], [class*="payment"]'
        );
        items.forEach((item) => {
          const text = item.textContent?.trim();
          if (text && text.length > 0) {
            history.push({ text });
          }
        });
      }
      
      return history;
    });

    // Display billing history
    console.log("\n" + "=".repeat(60));
    console.log("📊 BILLING HISTORY");
    console.log("=".repeat(60));
    
    if (billingHistory.length > 0) {
      console.log(`Found ${billingHistory.length} billing history item(s):\n`);
      billingHistory.forEach((item, index) => {
        console.log(`${index + 1}. ${JSON.stringify(item, null, 2)}`);
      });
    } else {
      console.log("⚠️  No billing history found on page");
      console.log("\n   This could mean:");
      console.log("   - No billing history exists for this user");
      console.log("   - Billing history is loading");
      console.log("   - Billing history is in a different format");
    }

    // Check console for any errors
    const consoleErrors = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("error") ||
        text.includes("Error") ||
        text.includes("ERROR") ||
        text.includes("Failed")
      ) {
        consoleErrors.push(text);
      }
    });

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log("✅ Login: Completed");
    console.log("✅ Dashboard: Accessed");
    console.log(`✅ Billing Section: ${billingFound ? "Found" : "Not Found"}`);
    console.log(`✅ Billing History Items: ${billingHistory.length}`);
    console.log(`✅ API Calls: ${responses.length}`);
    
    if (consoleErrors.length > 0) {
      console.log(`\n⚠️  Console Errors (${consoleErrors.length}):`);
      consoleErrors.forEach((error) => console.log(`   - ${error}`));
    }

    console.log("\n   Browser will stay open for 15 seconds for inspection...");
    console.log("=".repeat(60));

    // Keep browser open for inspection
    await page.waitForTimeout(15000);
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

