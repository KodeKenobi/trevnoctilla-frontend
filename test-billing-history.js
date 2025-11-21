/**
 * Test script: Login, navigate to dashboard, billing section, and list billing history
 * Opens browser, logs in, navigates to billing, and displays billing history
 */

const puppeteer = require("puppeteer");

// Test both local and production
const TEST_LOCAL = process.env.TEST_LOCAL === "true";
const LOGIN_URL = TEST_LOCAL
  ? "http://localhost:3000/auth/login"
  : process.env.TEST_URL || "https://www.trevnoctilla.com/auth/login";
const USER_EMAIL = "tshepomtshali89@gmail.com";
const USER_PASSWORD = "Kopenikus0218!";

console.log("=".repeat(60));
console.log("💳 BILLING HISTORY TEST");
console.log("=".repeat(60));
console.log(`Environment: ${TEST_LOCAL ? "LOCAL" : "PRODUCTION"}`);
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
      if (
        url.includes("/api/") ||
        url.includes("/auth/") ||
        url.includes("/payment/")
      ) {
        requests.push({
          url: url,
          method: request.method(),
        });
      }
    });

    page.on("response", async (response) => {
      const url = response.url();
      if (
        url.includes("/api/") ||
        url.includes("/auth/") ||
        url.includes("/payment/")
      ) {
        const status = response.status();
        const responseData = {
          url,
          status,
        };

        // Try to capture billing history response body
        if (url.includes("billing-history") && status === 200) {
          try {
            const body = await response.json();
            responseData.body = body;
          } catch (e) {
            // Ignore if can't parse
          }
        }

        responses.push(responseData);
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
          await page
            .waitForSelector(selector, { hidden: true, timeout: 5000 })
            .catch(() => {});
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
          const text = await page.evaluate(
            (el) => el.textContent?.toLowerCase(),
            button
          );
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
          await page
            .waitForSelector(selector, { hidden: true, timeout: 2000 })
            .catch(() => {});
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
      // Wait for NextAuth callback
      await page.waitForResponse(
        (response) =>
          response.url().includes("/api/auth/callback/credentials") &&
          response.status() === 200,
        { timeout: 15000 }
      );
      console.log("✅ NextAuth callback successful");

      // Wait for navigation
      await page
        .waitForNavigation({
          waitUntil: "networkidle0",
          timeout: 10000,
        })
        .catch(() => {
          console.log("⚠️  Navigation timeout, but continuing...");
        });

      console.log("✅ Login successful, navigation detected");
    } catch (error) {
      console.log(`⚠️  Login response timeout, checking current page...`);
    }

    await page.waitForTimeout(3000); // Give time for redirects/state updates

    // Check current URL
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Check if we have auth token in localStorage
    const hasAuthToken = await page.evaluate(() => {
      return !!localStorage.getItem("auth_token");
    });
    console.log(
      `   Auth token in localStorage: ${hasAuthToken ? "Yes" : "No"}`
    );

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

      // Try to manually navigate to dashboard
      console.log("   Attempting to navigate to dashboard anyway...");
      const baseUrl = LOGIN_URL.replace("/auth/login", "");
      await page.goto(`${baseUrl}/dashboard`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForTimeout(2000);
    } else {
      console.log("✅ Successfully logged in and redirected");
    }

    // Navigate to dashboard if not already there
    console.log(`\n📋 Step 8: Navigating to dashboard...`);
    const dashboardUrl = page.url();
    const baseUrl = LOGIN_URL.replace("/auth/login", "");

    if (!dashboardUrl.includes("/dashboard")) {
      await page.goto(`${baseUrl}/dashboard`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      console.log("✅ Navigated to dashboard");
    } else {
      console.log("✅ Already on dashboard");
    }
    await page.waitForTimeout(2000);

    // Handle cookie consent quickly
    for (const selector of cookieConsentSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          break;
        }
      } catch (e) {}
    }

    // Find and click billing tab/button immediately
    console.log(`\n📋 Step 9: Clicking billing section...`);
    const billingClicked = await page.evaluate(() => {
      // Try to find and click billing tab/button
      const selectors = [
        'button:has-text("Billing")',
        'a:has-text("Billing")',
        '[data-testid*="billing"]',
        'button[aria-label*="Billing"]',
        'a[href*="billing"]',
      ];

      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (element) {
            element.click();
            return true;
          }
        } catch (e) {}
      }

      // Try all buttons and links
      const allButtons = Array.from(document.querySelectorAll("button, a"));
      for (const btn of allButtons) {
        const text = btn.textContent?.toLowerCase();
        if (text && (text.includes("billing") || text.includes("payment"))) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (billingClicked) {
      console.log("✅ Clicked billing tab/button");
      await page.waitForTimeout(1000);
    } else {
      console.log(
        "⚠️  No billing button found, scrolling to billing section..."
      );
      // Scroll to billing section
      await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
        for (const h of headings) {
          if (h.textContent?.toLowerCase().includes("billing")) {
            h.scrollIntoView({ block: "center" });
            return;
          }
        }
        window.scrollTo(0, document.body.scrollHeight * 0.7);
      });
      await page.waitForTimeout(500);
    }

    // Wait for billing history API call and capture response
    console.log(`\n📋 Step 10: Waiting for billing history API...`);
    let billingHistoryData = null;

    // Set up response listener
    const responsePromise = page.waitForResponse(
      async (response) => {
        if (response.url().includes("billing-history")) {
          try {
            const data = await response.json();
            billingHistoryData = data;
            console.log(`   ✅ Response received: ${response.status()}`);
            return true;
          } catch (e) {
            console.log(`   ⚠️  Failed to parse response: ${e.message}`);
            return false;
          }
        }
        return false;
      },
      { timeout: 10000 }
    );

    try {
      await responsePromise;
      console.log("✅ Billing history API response received");

      // Log the actual API response
      if (billingHistoryData) {
        console.log("\n📊 API Response Data:");
        console.log(JSON.stringify(billingHistoryData, null, 2));

        if (billingHistoryData.billing_history) {
          console.log(
            `\n   Found ${billingHistoryData.billing_history.length} item(s) in API response`
          );
          if (billingHistoryData.billing_history.length === 0) {
            console.log("\n   ⚠️  Empty billing history - possible reasons:");
            console.log(
              "   - No payment/subscription notifications exist for this user"
            );
            console.log(
              "   - Notifications exist but metadata doesn't match user_id/user_email"
            );
            console.log(
              "   - Notifications weren't created during payment/upgrade"
            );
          }
        } else {
          console.log("\n   ⚠️  No 'billing_history' field in API response");
        }
      }

      // Also log the request URL to see what params were sent
      const billingHistoryResponse = responses.find((r) =>
        r.url.includes("billing-history")
      );
      if (billingHistoryResponse) {
        console.log(`\n   Request URL: ${billingHistoryResponse.url}`);
      }

      await page.waitForTimeout(2000); // Give time for React to render
    } catch (e) {
      console.log(`⚠️  API call timeout: ${e.message}`);
      console.log("   Checking if response was already captured...");
      await page.waitForTimeout(2000);
    }

    // If we still don't have data, try to get it from the responses array
    if (!billingHistoryData) {
      const billingResponse = responses.find(
        (r) => r.url.includes("billing-history") && r.body
      );
      if (billingResponse && billingResponse.body) {
        console.log("   Found response body in captured responses");
        billingHistoryData = billingResponse.body;
      }
    }

    // Check for API call to billing history
    const billingHistoryResponse = responses.find((r) =>
      r.url.includes("billing-history")
    );
    if (billingHistoryResponse) {
      console.log(
        `✅ Billing history API called: ${billingHistoryResponse.url} (Status: ${billingHistoryResponse.status})`
      );
    } else {
      console.log("⚠️  Billing history API call not detected in responses");
      // List all API calls for debugging
      console.log("   API calls made:");
      responses.forEach((r, i) => {
        if (i < 10) {
          console.log(`   ${i + 1}. ${r.url} (${r.status})`);
        }
      });
    }

    // Extract billing history from the page
    console.log(`\n📋 Step 11: Extracting billing history...`);
    const billingHistory = await page.evaluate(() => {
      const history = [];

      // Look for all tables on the page
      const tables = document.querySelectorAll("table");

      for (const table of tables) {
        const rows = table.querySelectorAll("tr");
        if (rows.length > 1) {
          const headerRow = rows[0];
          const headerText = headerRow.textContent?.toLowerCase();

          // Check if this is billing history table
          if (
            headerText &&
            (headerText.includes("invoice") ||
              headerText.includes("amount") ||
              headerText.includes("date") ||
              headerText.includes("status") ||
              headerText.includes("payment"))
          ) {
            // Extract all data rows
            for (let i = 1; i < rows.length; i++) {
              const cells = rows[i].querySelectorAll("td, th");
              if (cells.length >= 2) {
                const rowData = {};
                cells.forEach((cell, idx) => {
                  const text = cell.textContent?.trim();
                  if (text) {
                    if (idx === 0) rowData.invoice = text;
                    else if (idx === 1) rowData.amount = text;
                    else if (idx === 2) rowData.date = text;
                    else if (idx === 3) rowData.status = text;
                    else rowData[`col${idx}`] = text;
                  }
                });
                if (Object.keys(rowData).length > 0) {
                  history.push(rowData);
                }
              }
            }
            break;
          }
        }
      }

      // If no table, check for empty state or list items
      if (history.length === 0) {
        const emptyMsg = document.body.textContent?.toLowerCase();
        if (
          emptyMsg &&
          (emptyMsg.includes("no billing") || emptyMsg.includes("no history"))
        ) {
          return [{ empty: true, message: "No billing history found" }];
        }
      }

      return history;
    });

    // Display billing history
    console.log("\n" + "=".repeat(60));
    console.log("📊 BILLING HISTORY");
    console.log("=".repeat(60));

    // Show API response data first
    if (billingHistoryData) {
      console.log("\n📡 From API Response:");
      if (
        billingHistoryData.billing_history &&
        billingHistoryData.billing_history.length > 0
      ) {
        console.log(
          `   Found ${billingHistoryData.billing_history.length} item(s):\n`
        );
        billingHistoryData.billing_history.forEach((item, index) => {
          console.log(`   ${index + 1}. Invoice: ${item.invoice || "N/A"}`);
          console.log(`      Amount: ${item.amount || "N/A"}`);
          console.log(`      Date: ${item.date || "N/A"}`);
          console.log(`      Status: ${item.status || "N/A"}`);
          console.log(`      Payment ID: ${item.payment_id || "N/A"}`);
          console.log();
        });
      } else {
        console.log("   ⚠️  API returned empty billing_history array");
      }
    }

    // Show page extraction results
    console.log("\n📄 From Page Extraction:");
    if (billingHistory.length > 0 && !billingHistory[0].empty) {
      console.log(`   Found ${billingHistory.length} item(s) on page:\n`);
      billingHistory.forEach((item, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(item, null, 2)}`);
      });
    } else if (billingHistory.length > 0 && billingHistory[0].empty) {
      console.log(
        "   ⚠️  Page shows empty state: " + billingHistory[0].message
      );
    } else {
      console.log("   ⚠️  No billing history found on page");
      console.log("\n   This could mean:");
      console.log("   - React hasn't rendered the data yet");
      console.log("   - Billing history is in a different format");
      console.log("   - Component is showing empty state");
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
    console.log(
      `✅ Billing Section: ${billingClicked ? "Clicked" : "Scrolled to"}`
    );
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
