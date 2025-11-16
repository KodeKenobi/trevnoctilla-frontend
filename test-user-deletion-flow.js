const puppeteer = require("puppeteer");

const BASE_URL = "https://www.trevnoctilla.com";
const ADMIN_URL =
  "https://web-production-737b.up.railway.app/test/database-admin";
const EMAIL = "tshepomtshali89@gmail.com";
const PASSWORD = "Kopenikus0218!";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function log(message, data = null) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

async function testUserDeletion() {
  let browser = null;
  let page = null;

  try {
    log("🚀 Starting user deletion test...");
    log(`📋 Test Configuration:`, {
      baseUrl: BASE_URL,
      adminUrl: ADMIN_URL,
      email: EMAIL,
    });

    // Launch browser
    log("🌐 Launching browser...");
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ["--start-maximized"],
    });
    log("✅ Browser launched");

    page = await browser.newPage();
    log("✅ New page created");

    // Enable console logging from page
    page.on("console", (msg) => {
      log(`📱 Page Console [${msg.type()}]:`, msg.text());
    });

    page.on("pageerror", (error) => {
      log(`❌ Page Error:`, error.message);
    });

    // Step 1: Navigate to trevnoctilla.com
    log(`📍 Step 1: Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    log("✅ Page loaded");
    await delay(2000);

    // Step 2: Reject all cookies
    log("🍪 Step 2: Looking for cookie popup...");
    try {
      // Try multiple strategies to find and click "Reject All"
      const rejectSelectors = [
        'button:has-text("Reject All")',
        'button:has-text("Reject")',
        'button[aria-label*="Reject"]',
        'button[aria-label*="reject"]',
        'button[id*="reject"]',
        'button[class*="reject"]',
      ];

      let cookieRejected = false;
      for (const selector of rejectSelectors) {
        try {
          // Use XPath for text-based matching
          const [button] = await page.$x(
            "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reject')]"
          );
          if (button) {
            log(`✅ Found reject button using XPath`);
            await button.click();
            log("✅ Clicked 'Reject All' button");
            cookieRejected = true;
            await delay(2000);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Alternative: Try to find any button with reject-related text
      if (!cookieRejected) {
        const buttons = await page.$$("button");
        for (const button of buttons) {
          const text = await page.evaluate((el) => el.textContent, button);
          if (text && text.toLowerCase().includes("reject")) {
            log(`✅ Found reject button by text: "${text}"`);
            await button.click();
            log("✅ Clicked 'Reject All' button");
            cookieRejected = true;
            await delay(2000);
            break;
          }
        }
      }

      if (!cookieRejected) {
        log("⚠️ Could not find cookie popup - continuing anyway");
      }
    } catch (error) {
      log("⚠️ Error handling cookie popup:", error.message);
      log("⚠️ Continuing anyway...");
    }

    // Step 3: Navigate to login page
    log("🔐 Step 3: Navigating to login page...");
    const loginUrl = `${BASE_URL}/auth/login`;
    await page.goto(loginUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    log(`✅ Navigated to ${loginUrl}`);
    await delay(2000);

    // Step 4: Fill in login form
    log("📝 Step 4: Filling in login form...");
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    log("✅ Email input found");

    await page.type('input[type="email"]', EMAIL, { delay: 100 });
    log(`✅ Entered email: ${EMAIL}`);

    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    log("✅ Password input found");

    await page.type('input[type="password"]', PASSWORD, { delay: 100 });
    log("✅ Entered password");

    await delay(1000);

    // Step 5: Submit login form
    log("🔑 Step 5: Submitting login form...");
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error("Submit button not found");
    }
    await submitButton.click();
    log("✅ Clicked submit button");

    // Step 6: Wait for login to complete
    log("⏳ Step 6: Waiting for login to complete...");
    await page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    log("✅ Navigation completed");

    const currentUrl = page.url();
    log(`📍 Current URL after login: ${currentUrl}`);

    // Check if we're on dashboard
    if (currentUrl.includes("/dashboard")) {
      log("✅ Successfully logged in and redirected to dashboard");
    } else {
      log(`⚠️ Unexpected URL after login: ${currentUrl}`);
      // Try navigating to dashboard manually
      log("📍 Attempting to navigate to dashboard manually...");
      await page.goto(`${BASE_URL}/dashboard`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      log("✅ Navigated to dashboard");
    }

    await delay(3000);

    // Step 7: Navigate to admin panel
    log(`🔧 Step 7: Navigating to admin panel: ${ADMIN_URL}...`);
    await page.goto(ADMIN_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    log("✅ Admin panel loaded");
    await delay(3000);

    // Step 8: Wait for users table to load
    log("📊 Step 8: Waiting for users table to load...");
    try {
      // Wait for table to appear (not "Loading...")
      await page.waitForFunction(
        (email) => {
          const table = document.querySelector("table");
          if (!table) return false;
          const text = table.textContent;
          return text && !text.includes("Loading...") && text.includes(email);
        },
        { timeout: 30000 },
        EMAIL
      );
      log("✅ Users table loaded");
    } catch (error) {
      log("⚠️ Table might still be loading, continuing anyway...");
    }

    await delay(2000);

    // Step 9: Find and click delete button for the user
    log(`🗑️ Step 9: Looking for delete button for user: ${EMAIL}...`);

    // Get all table rows
    const rows = await page.$$("table tbody tr");
    log(`📋 Found ${rows.length} rows in users table`);

    let deleteButton = null;
    let userRow = null;

    for (const row of rows) {
      const rowText = await page.evaluate((el) => el.textContent, row);
      log(`🔍 Checking row: ${rowText.substring(0, 100)}...`);

      if (rowText.includes(EMAIL)) {
        log(`✅ Found user row for ${EMAIL}`);
        userRow = row;

        // Look for delete button in this row
        const buttons = await row.$$("button");
        for (const button of buttons) {
          const buttonText = await page.evaluate(
            (el) => el.textContent,
            button
          );
          log(`🔍 Checking button: "${buttonText}"`);

          if (
            buttonText.toLowerCase().includes("delete") ||
            buttonText.toLowerCase().includes("remove")
          ) {
            log(`✅ Found delete button: "${buttonText}"`);
            deleteButton = button;
            break;
          }
        }

        if (deleteButton) break;
      }
    }

    if (!deleteButton) {
      throw new Error(`Could not find delete button for user ${EMAIL}`);
    }

    // Step 10: Click delete button
    log("🗑️ Step 10: Clicking delete button...");
    await deleteButton.click();
    log("✅ Delete button clicked");
    await delay(2000);

    // Step 11: Confirm deletion in alert/prompt
    log("⚠️ Step 11: Handling confirmation dialog...");
    page.on("dialog", async (dialog) => {
      log(`💬 Dialog appeared: ${dialog.type()} - ${dialog.message()}`);
      if (dialog.type() === "confirm" || dialog.type() === "alert") {
        await dialog.accept();
        log("✅ Dialog accepted");
      }
    });

    // Wait a bit for any async operations
    await delay(3000);

    // Step 12: Verify deletion (check if user is gone from table)
    log("✅ Step 12: Verifying user deletion...");
    await delay(2000);

    // Refresh the admin page to see updated table
    log("🔄 Refreshing admin page...");
    await page.reload({ waitUntil: "networkidle2", timeout: 30000 });
    await delay(3000);

    // Check if user is still in table
    const tableContent = await page.evaluate(() => {
      const table = document.querySelector("table");
      return table ? table.textContent : "";
    });

    if (tableContent.includes(EMAIL)) {
      log(`⚠️ WARNING: User ${EMAIL} still appears in table after deletion`);
    } else {
      log(`✅ SUCCESS: User ${EMAIL} no longer appears in table`);
    }

    // Step 13: Navigate back to trevnoctilla dashboard
    log("🏠 Step 13: Navigating back to trevnoctilla dashboard...");
    await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    log("✅ Navigated to dashboard");
    await delay(2000);

    // Step 14: Refresh the dashboard
    log("🔄 Step 14: Refreshing dashboard...");
    await page.reload({ waitUntil: "networkidle2", timeout: 30000 });
    log("✅ Dashboard refreshed");
    await delay(3000);

    // Step 15: Check if user is logged out
    log("🔍 Step 15: Checking if user was logged out...");
    const finalUrl = page.url();
    log(`📍 Final URL: ${finalUrl}`);

    if (finalUrl.includes("/auth/login")) {
      log("✅ SUCCESS: User was automatically logged out after deletion");
    } else if (finalUrl.includes("/dashboard")) {
      log(
        "⚠️ WARNING: User is still on dashboard - may not have been logged out"
      );

      // Check for error messages or auth issues
      const pageContent = await page.evaluate(() => document.body.textContent);
      if (pageContent.includes("login") || pageContent.includes("sign in")) {
        log("✅ User appears to be logged out (login prompts visible)");
      } else {
        log("⚠️ User might still be logged in");
      }
    }

    log("✅ Test completed successfully!");
    log("📊 Summary:", {
      userDeleted: !tableContent.includes(EMAIL),
      userLoggedOut: finalUrl.includes("/auth/login"),
      finalUrl: finalUrl,
    });

    // Keep browser open for a bit to see results
    log("⏳ Keeping browser open for 5 seconds to view results...");
    await delay(5000);
  } catch (error) {
    log("❌ TEST ERROR:", error.message);
    log("📚 Stack trace:", error.stack);

    // Take screenshot on error
    if (page) {
      try {
        await page.screenshot({
          path: "test-user-deletion-error.png",
          fullPage: true,
        });
        log("📸 Screenshot saved: test-user-deletion-error.png");
      } catch (screenshotError) {
        log("⚠️ Could not take screenshot:", screenshotError.message);
      }
    }
  } finally {
    if (browser) {
      log("🔒 Closing browser...");
      await browser.close();
      log("✅ Browser closed");
    }
  }
}

// Run the test
testUserDeletion()
  .then(() => {
    console.log("\n✅ Test script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });
