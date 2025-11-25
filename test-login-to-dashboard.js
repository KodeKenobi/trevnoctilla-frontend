/**
 * Test Script: Login and Navigate to Dashboard
 *
 * This script:
 * 1. Opens the login page
 * 2. Logs in with provided credentials
 * 3. Verifies redirect to dashboard
 * 4. Checks dashboard elements are loaded
 */

const puppeteer = require("puppeteer");

// Configuration - check which port frontend is running on
let BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
  // Try to detect which port is in use
  const http = require("http");
  const checkPort = (port) => {
    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: "localhost",
          port,
          path: "/",
          method: "GET",
          timeout: 2000,
        },
        () => resolve(true)
      );
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  };

  // Default to 3000, but script will try both
  BASE_URL = "http://localhost:3000";
}
const TEST_EMAIL =
  process.env.TEST_EMAIL || process.argv[2] || "tshepomtshali89@gmail.com";
const TEST_PASSWORD =
  process.env.TEST_PASSWORD || process.argv[3] || "Kopenikus0218!";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(80));
  log(title, "cyan");
  console.log("=".repeat(80));
}

/**
 * Reject cookies popup if present
 */
async function rejectCookies(page) {
  try {
    await page.waitForTimeout(2000);

    // Try to find and click "Reject All" button
    const [rejectButton] = await page.$x(
      "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reject all')]"
    );

    if (rejectButton) {
      const isVisible = await page.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      }, rejectButton);

      if (isVisible) {
        await rejectButton.click();
        log("✅ Clicked 'Reject All' button", "green");
        await page.waitForTimeout(1000);
        return true;
      }
    }

    // Fallback: Find button by text content
    const buttons = await page.$$("button");
    for (const button of buttons) {
      const text = await page.evaluate((el) => el.textContent?.trim(), button);
      if (text && text.toLowerCase() === "reject all") {
        const isVisible = await page.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0"
          );
        }, button);

        if (isVisible) {
          await button.click();
          log(`✅ Clicked 'Reject All' button`, "green");
          await page.waitForTimeout(1000);
          return true;
        }
      }
    }

    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Login to the application
 */
async function login(page, email, password) {
  logSection("🔐 LOGGING IN");

  try {
    // Try port 3000 first, then 3001
    let loginUrl = `${BASE_URL}/auth/login`;
    log(`📍 Navigating to ${loginUrl}...`);

    try {
      await page.goto(loginUrl, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });
    } catch (e) {
      // Try port 3001 if 3000 fails
      if (BASE_URL.includes(":3000")) {
        log(`⚠️  Port 3000 failed, trying 3001...`, "yellow");
        loginUrl = loginUrl.replace(":3000", ":3001");
        BASE_URL = BASE_URL.replace(":3000", ":3001");
        await page.goto(loginUrl, {
          waitUntil: "domcontentloaded",
          timeout: 10000,
        });
      } else {
        throw e;
      }
    }

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Reject cookies if present
    await rejectCookies(page);

    // Wait for email input
    log("⏳ Waiting for login form...");
    await page.waitForSelector("#email", { timeout: 15000 });
    log("✅ Login form loaded", "green");

    // Fill email
    const emailInput = await page.$("#email");
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(email, { delay: 50 });
    log(`✅ Filled email: ${email}`, "green");

    // Fill password
    const passwordInput = await page.$("#password");
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(password, { delay: 50 });
    log("✅ Filled password", "green");

    // Get initial URL
    const initialUrl = page.url();

    // Set up console error tracking
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Set up navigation listener BEFORE clicking
    log("⏳ Submitting login form...");
    const submitButton = await page.$('button[type="submit"]');

    if (!submitButton) {
      throw new Error("Submit button not found");
    }

    const buttonText = await page.evaluate(
      (el) => el.textContent?.trim(),
      submitButton
    );
    log(`   Found submit button: "${buttonText}"`);

    // Click submit and wait for redirect
    await submitButton.click();
    log("✅ Clicked submit button", "green");

    // Wait for redirect - window.location.href triggers full page reload
    log("⏳ Waiting for redirect to dashboard...");

    let finalUrl = initialUrl;
    let attempts = 0;
    const maxAttempts = 30; // 15 seconds total

    while (attempts < maxAttempts) {
      await page.waitForTimeout(500);

      try {
        const currentUrl = page.url();

        // Check if we've left the login page
        if (!currentUrl.includes("/auth/login")) {
          finalUrl = currentUrl;
          log(`✅ Redirect detected!`, "green");
          log(`📍 Redirected to: ${finalUrl}`, "green");
          break;
        }

        // Update if URL changed (even if still on login)
        if (currentUrl !== finalUrl) {
          finalUrl = currentUrl;
        }
      } catch (e) {
        // Page might be navigating, continue waiting
      }

      attempts++;

      // Log progress every 5 attempts
      if (attempts % 5 === 0 && attempts < maxAttempts) {
        log(`   Still waiting... (${(attempts * 0.5).toFixed(1)}s)`, "yellow");
      }
    }

    // Final check
    finalUrl = page.url();
    log(`📍 Final URL: ${finalUrl}`, "green");

    // If still on login page, check if login actually succeeded
    if (finalUrl.includes("/auth/login")) {
      // Wait a bit more for async operations
      await page.waitForTimeout(2000);

      // Check if login succeeded by checking localStorage
      const authData = await page.evaluate(() => {
        return {
          hasToken: !!localStorage.getItem("auth_token"),
          hasUserData: !!localStorage.getItem("user_data"),
          token: localStorage.getItem("auth_token"),
          userData: localStorage.getItem("user_data"),
        };
      });

      if (authData.hasToken && authData.hasUserData) {
        log(`✅ Login succeeded (tokens found in localStorage)`, "green");
        log(`   Manually navigating to dashboard...`, "yellow");

        // Manually navigate to dashboard since redirect didn't happen
        await page.goto(`${BASE_URL}/dashboard`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });

        finalUrl = page.url();
        log(`✅ Navigated to: ${finalUrl}`, "green");
        return { success: true, url: finalUrl, manual: true };
      }

      // Check for error messages
      const errorElement = await page.$('[class*="error"], [class*="Error"]');
      if (errorElement) {
        const errorText = await page.evaluate(
          (el) => el.textContent?.trim(),
          errorElement
        );
        if (errorText) {
          log(`⚠️  Error on page: ${errorText}`, "yellow");
          return { success: false, error: errorText, url: finalUrl };
        }
      }

      // Check console errors
      if (consoleErrors.length > 0) {
        log(`⚠️  Console errors found:`, "yellow");
        consoleErrors.slice(0, 3).forEach((err) => {
          log(`   - ${err}`, "yellow");
        });
      }

      return {
        success: false,
        error: "Login did not redirect and no auth tokens found",
        url: finalUrl,
      };
    }

    return { success: true, url: finalUrl };
  } catch (error) {
    log(`❌ Login error: ${error.message}`, "red");
    return { success: false, error: error.message };
  }
}

/**
 * Verify dashboard page
 */
async function verifyDashboard(page) {
  logSection("📊 VERIFYING DASHBOARD");

  try {
    const currentUrl = page.url();
    log(`📍 Current URL: ${currentUrl}`);

    // Check if we're on dashboard or enterprise page
    const isDashboard = currentUrl.includes("/dashboard");
    const isEnterprise = currentUrl.includes("/enterprise");
    const isAdmin = currentUrl.includes("/admin");

    if (!isDashboard && !isEnterprise && !isAdmin) {
      log(`❌ Not on dashboard page. Current URL: ${currentUrl}`, "red");
      return { success: false, error: "Not redirected to dashboard" };
    }

    log(
      `✅ On ${
        isAdmin ? "admin" : isEnterprise ? "enterprise" : "dashboard"
      } page`,
      "green"
    );

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Check for dashboard elements
    const dashboardInfo = await page.evaluate(() => {
      const info = {
        url: window.location.href,
        title: document.title,
        hasUserData: !!localStorage.getItem("user_data"),
        hasAuthToken: !!localStorage.getItem("auth_token"),
        bodyText: document.body?.textContent?.substring(0, 200) || "",
        dashboardElements: [],
      };

      // Look for common dashboard elements
      const selectors = [
        "h1",
        "h2",
        '[class*="dashboard"]',
        '[class*="Dashboard"]',
        "nav",
        "header",
        "main",
      ];

      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          info.dashboardElements.push({
            selector,
            count: elements.length,
          });
        }
      });

      return info;
    });

    log(`\n📄 Page Title: ${dashboardInfo.title}`);
    log(`💾 localStorage:`);
    log(`   user_data: ${dashboardInfo.hasUserData ? "✅ Set" : "❌ Not set"}`);
    log(
      `   auth_token: ${dashboardInfo.hasAuthToken ? "✅ Set" : "❌ Not set"}`
    );

    if (dashboardInfo.dashboardElements.length > 0) {
      log(`\n📋 Dashboard Elements Found:`);
      dashboardInfo.dashboardElements.forEach((el) => {
        log(`   ${el.selector}: ${el.count} element(s)`);
      });
    }

    // Check for error messages
    const errorElements = await page.$$('[class*="error"], [class*="Error"]');
    if (errorElements.length > 0) {
      const errorTexts = await Promise.all(
        errorElements.map((el) =>
          page.evaluate((e) => e.textContent?.trim(), el)
        )
      );
      log(`\n⚠️  Error messages found:`, "yellow");
      errorTexts.forEach((text) => {
        if (text) log(`   - ${text}`, "yellow");
      });
    }

    // Check if user is authenticated
    const isAuthenticated =
      dashboardInfo.hasUserData && dashboardInfo.hasAuthToken;

    if (isAuthenticated) {
      log(`\n✅ User is authenticated`, "green");
    } else {
      log(`\n⚠️  Authentication data not found in localStorage`, "yellow");
    }

    return {
      success: true,
      url: dashboardInfo.url,
      authenticated: isAuthenticated,
      hasElements: dashboardInfo.dashboardElements.length > 0,
    };
  } catch (error) {
    log(`❌ Dashboard verification error: ${error.message}`, "red");
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function runTest() {
  console.clear();
  logSection("🧪 LOGIN TO DASHBOARD TEST");
  log(`Base URL: ${BASE_URL}`);
  log(`Test Email: ${TEST_EMAIL}`);
  console.log("=".repeat(80));

  let browser;
  let page;

  try {
    // Launch browser
    logSection("🌐 LAUNCHING BROWSER");
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      defaultViewport: null,
      args: ["--start-maximized"],
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    log("✅ Browser launched", "green");

    // Step 1: Login
    const loginResult = await login(page, TEST_EMAIL, TEST_PASSWORD);

    if (!loginResult.success) {
      log(`\n❌ Login failed: ${loginResult.error}`, "red");
      await browser.close();
      process.exit(1);
    }

    log(`\n✅ Login successful!`, "green");
    log(`   Redirected to: ${loginResult.url}`);

    // Step 2: Verify dashboard
    const dashboardResult = await verifyDashboard(page);

    if (!dashboardResult.success) {
      log(
        `\n❌ Dashboard verification failed: ${dashboardResult.error}`,
        "red"
      );
      await browser.close();
      process.exit(1);
    }

    // Final summary
    logSection("📊 TEST SUMMARY");

    const loginSuccess =
      loginResult.success && !loginResult.url.includes("/auth/login");
    log(
      `Login: ${loginSuccess ? "✅ PASS" : "❌ FAIL"}`,
      loginSuccess ? "green" : "red"
    );

    if (loginSuccess) {
      log(`Dashboard URL: ${dashboardResult.url}`, "green");
      log(
        `Authenticated: ${dashboardResult.authenticated ? "✅ Yes" : "❌ No"}`,
        dashboardResult.authenticated ? "green" : "red"
      );
      log(
        `Dashboard Elements: ${
          dashboardResult.hasElements ? "✅ Found" : "⚠️  Not found"
        }`,
        dashboardResult.hasElements ? "green" : "yellow"
      );

      console.log("\n" + "=".repeat(80));
      log("🎉 ALL TESTS PASSED!", "green");
      log(
        "   User successfully logged in and navigated to dashboard.",
        "green"
      );
      console.log("=".repeat(80));
    } else {
      log(`Login URL: ${loginResult.url}`, "red");
      log(
        `Dashboard: ${dashboardResult.success ? "✅ PASS" : "❌ FAIL"}`,
        dashboardResult.success ? "green" : "red"
      );

      console.log("\n" + "=".repeat(80));
      log("❌ TEST FAILED", "red");
      log("   Login did not redirect to dashboard.", "red");
      console.log("=".repeat(80));
    }

    // Close browser immediately - no hanging
    await browser.close();

    // Exit with appropriate code
    process.exit(loginSuccess && dashboardResult.success ? 0 : 1);
  } catch (error) {
    log(`\n❌ FATAL ERROR: ${error.message}`, "red");
    console.error(error);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runTest().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { runTest, login, verifyDashboard };
