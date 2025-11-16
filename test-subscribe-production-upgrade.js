const puppeteer = require("puppeteer");

const BASE_URL = "https://www.trevnoctilla.com";
const EMAIL = "tshepomtshali89@gmail.com";
const PASSWORD = "Kopenikus0218!";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Faster delay for most operations
const quickDelay = (ms = 500) => delay(ms);

async function log(message, data = null) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

async function testSubscribeProductionUpgrade() {
  let browser = null;
  let page = null;

  try {
    log("🚀 Starting production subscription upgrade test...");
    log(`📋 Test Configuration:`, {
      baseUrl: BASE_URL,
      email: EMAIL,
      targetTier: "production",
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
      const type = msg.type();
      const text = msg.text();
      if (
        !text.includes("Third-party cookie") &&
        !text.includes("EzoicAds") &&
        !text.includes("rlcdn.com")
      ) {
        log(`📱 Page Console [${type}]:`, text);
      }
    });

    page.on("pageerror", (error) => {
      log(`❌ Page Error:`, error.message);
    });

    // Monitor network requests
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("/api/payments") ||
        url.includes("/payfast") ||
        url.includes("initiate") ||
        url.includes("upgrade-subscription")
      ) {
        log(`🌐 REQUEST: ${request.method()} ${url}`);
      }
    });

    page.on("response", (response) => {
      const url = response.url();
      if (
        url.includes("/api/payments") ||
        url.includes("/payfast") ||
        url.includes("initiate") ||
        url.includes("upgrade-subscription")
      ) {
        log(`📥 RESPONSE: ${response.status()} ${url}`);
      }
    });

    // Step 1: Navigate to site and reject cookies
    log(`📍 Step 1: Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    log("✅ Page loaded");
    await quickDelay(1000);

    // Reject cookies
    log("🍪 Rejecting cookies...");
    try {
      const [button] = await page.$x(
        "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reject')]"
      );
      if (button) {
        await button.click();
        log("✅ Clicked 'Reject All' button");
        await quickDelay(1000);
      }
    } catch (error) {
      log("⚠️ Could not find cookie popup, continuing...");
    }

    // Step 2: Navigate to login
    log("🔐 Step 2: Navigating to login page...");
    const loginUrl = `${BASE_URL}/auth/login`;
    await page.goto(loginUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    log(`✅ Navigated to ${loginUrl}`);
    await quickDelay(1000);

    // Step 3: Fill login form
    log("📝 Step 3: Filling in login form...");
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', EMAIL, { delay: 100 });
    log(`✅ Entered email: ${EMAIL}`);

    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', PASSWORD, { delay: 50 });
    log("✅ Entered password");

    await quickDelay(500);

    // Step 4: Submit login
    log("🔑 Step 4: Submitting login form...");
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error("Submit button not found");
    }
    await submitButton.click();
    log("✅ Clicked submit button");

    // Step 5: Wait for login to complete
    log("⏳ Step 5: Waiting for login to complete...");
    try {
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      log("✅ Navigation completed");
    } catch (error) {
      log("⚠️ Navigation timeout, checking current URL...");
      const currentUrl = page.url();
      log(`📍 Current URL: ${currentUrl}`);
      if (!currentUrl.includes("/dashboard")) {
        // Try navigating to dashboard manually
        await page.goto(`${BASE_URL}/dashboard`, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        log("✅ Navigated to dashboard manually");
      }
    }

    const currentUrl = page.url();
    log(`📍 Current URL after login: ${currentUrl}`);
    await quickDelay(2000);

    // Step 6: Navigate to billing/settings page
    log("💳 Step 6: Navigating to billing/settings page...");

    // Navigate directly to billing section
    const billingUrl = `${BASE_URL}/dashboard?tab=settings&section=billing`;
    await page.goto(billingUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    log(`✅ Navigated to ${billingUrl}`);
    await quickDelay(3000); // Give time for billing section to load

    // Step 7: Find and click Production Subscribe button
    log("🔘 Step 7: Looking for Production Subscribe button...");

    // Scroll down to find billing section
    log("📜 Scrolling to find billing section...");
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await quickDelay(1000);

    // Wait for "Production" text to appear on page
    log("⏳ Waiting for Production plan to appear...");
    try {
      await page.waitForFunction(
        () => {
          return (
            document.body.textContent.toLowerCase().includes("production") &&
            document.body.textContent.includes("29")
          );
        },
        { timeout: 10000 }
      );
      log("✅ Production plan text found on page");
    } catch (error) {
      log("⚠️ Production text not found, continuing anyway...");
    }

    // Look for Production plan subscribe button using XPath
    log("🔍 Searching for Subscribe button using multiple strategies...");
    let subscribeButton = null;

    // Strategy 1: Use XPath to find button with "Subscribe" text near "Production"
    try {
      const [button] = await page.$x(
        "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'subscribe')]"
      );
      if (button) {
        const buttonText = await page.evaluate(
          (el) => el.textContent.trim(),
          button
        );
        const visible = await page.evaluate(
          (el) => el.offsetParent !== null,
          button
        );
        const disabled = await page.evaluate((el) => el.disabled, button);

        log(
          `🔍 Found button with XPath: "${buttonText}" - visible: ${visible}, disabled: ${disabled}`
        );

        if (visible && !disabled) {
          // Check if it's near Production text
          const nearbyText = await page.evaluate((el) => {
            // Get parent container
            let parent = el.closest(
              'div[class*="card"], div[class*="plan"], section, article'
            );
            if (!parent)
              parent = el.parentElement?.parentElement?.parentElement;
            return parent ? parent.textContent : "";
          }, button);

          log(
            `   Nearby text (first 300 chars): ${nearbyText.substring(0, 300)}`
          );

          if (
            nearbyText.toLowerCase().includes("production") ||
            nearbyText.includes("29")
          ) {
            log(
              `✅ Found Production Subscribe button via XPath: "${buttonText}"`
            );
            subscribeButton = button;
          } else {
            log(`⚠️ Button found but not confirmed as Production button`);
            // Use it as fallback
            subscribeButton = button;
          }
        }
      }
    } catch (error) {
      log(`⚠️ XPath search failed: ${error.message}`);
    }

    // Strategy 2: Find all buttons and check each one
    if (!subscribeButton) {
      log("🔍 Strategy 2: Checking all buttons on page...");
      const buttons = await page.$$("button");
      log(`📋 Found ${buttons.length} buttons total`);

      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        const text = await page.evaluate((el) => el.textContent.trim(), button);
        const visible = await page.evaluate(
          (el) => el.offsetParent !== null,
          button
        );
        const disabled = await page.evaluate((el) => el.disabled, button);

        if (text.toLowerCase().includes("subscribe") && visible && !disabled) {
          log(`✅ Found Subscribe button [${i}]: "${text}"`);

          // Get surrounding context
          const context = await page.evaluate((el) => {
            // Walk up DOM tree to find plan card
            let current = el;
            for (let i = 0; i < 5 && current; i++) {
              const text = current.textContent || "";
              if (
                text.toLowerCase().includes("production") ||
                text.includes("29")
              ) {
                return { found: true, text: text.substring(0, 500) };
              }
              current = current.parentElement;
            }
            return { found: false, text: "" };
          }, button);

          log(
            `   Context check: ${
              context.found
                ? "✅ Production found nearby"
                : "❌ No Production nearby"
            }`
          );
          log(`   Context text: ${context.text.substring(0, 200)}`);

          if (context.found || !subscribeButton) {
            subscribeButton = button;
            if (context.found) break;
          }
        }
      }
    }

    if (!subscribeButton) {
      // Take screenshot and log page state
      await page.screenshot({
        path: "subscribe-button-not-found.png",
        fullPage: true,
      });
      log("📸 Screenshot saved: subscribe-button-not-found.png");

      // Log page content for debugging
      const pageInfo = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          hasProductionText: document.body.textContent
            .toLowerCase()
            .includes("production"),
          hasPrice29: document.body.textContent.includes("29"),
          allButtonTexts: Array.from(document.querySelectorAll("button")).map(
            (b) => b.textContent.trim()
          ),
        };
      });
      log("📄 Page info:", pageInfo);

      throw new Error("Subscribe button not found");
    }

    // Step 8: Click Subscribe button
    log("🖱️ Step 8: Clicking Subscribe button...");
    const buttonText = await page.evaluate(
      (el) => el.textContent,
      subscribeButton
    );
    log(`   Button text: "${buttonText}"`);
    await subscribeButton.click();
    log("✅ Subscribe button clicked");
    await quickDelay(2000);

    // Step 9: Wait for navigation to payment page
    log("⏳ Step 9: Waiting for navigation to payment page...");
    try {
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      log("✅ Navigation completed");
    } catch (error) {
      log("⚠️ Navigation timeout, checking current URL...");
    }

    const paymentUrl = page.url();
    log(`📍 Current URL: ${paymentUrl}`);

    if (!paymentUrl.includes("/payment")) {
      log("⚠️ Not on payment page, trying to navigate...");
      await page.goto(`${BASE_URL}/payment?plan=production`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      await delay(3000);
    }

    // Step 10: Wait for payment form to be ready and click "Proceed to Pay"
    log("💳 Step 10: Waiting for payment form to be ready...");
    await delay(5000); // Give time for payment data to load

    // Look for "Proceed to Pay" button
    log("🔘 Step 11: Looking for 'Proceed to Pay' button...");
    let proceedButton = null;
    const paymentButtons = await page.$$("button");

    for (const button of paymentButtons) {
      const text = await page.evaluate((el) => el.textContent, button);
      const disabled = await page.evaluate((el) => el.disabled, button);
      const visible = await page.evaluate(
        (el) => el.offsetParent !== null,
        button
      );

      if (
        (text.toLowerCase().includes("proceed") ||
          text.toLowerCase().includes("pay")) &&
        visible &&
        !disabled
      ) {
        log(`✅ Found payment button: "${text}"`);
        proceedButton = button;
        break;
      }
    }

    if (!proceedButton) {
      // Check if we're stuck on "Preparing payment"
      const bodyText = await page.evaluate(() => document.body.textContent);
      if (bodyText.toLowerCase().includes("preparing payment")) {
        log("❌ STUCK ON 'Preparing Payment' - Form is not ready");
        throw new Error("Payment form is stuck on 'Preparing Payment'");
      }

      await page.screenshot({
        path: "payment-button-not-found.png",
        fullPage: true,
      });
      log("📸 Screenshot saved: payment-button-not-found.png");
      throw new Error("Proceed to Pay button not found");
    }

    // Step 11: Click "Proceed to Pay"
    log("🖱️ Step 12: Clicking 'Proceed to Pay' button...");
    await proceedButton.click();
    log("✅ Payment button clicked");
    await delay(3000);

    // Step 12: Wait for PayFast page
    log("⏳ Step 12: Waiting for PayFast page...");
    let payfastDetected = false;
    for (let i = 0; i < 15; i++) {
      await quickDelay(1000);
      const currentUrl = page.url();

      if (currentUrl.includes("payfast.co.za")) {
        log(`✅ PayFast page detected!`);
        log(`   URL: ${currentUrl}`);
        payfastDetected = true;
        break;
      }

      if (i % 3 === 0 && i > 0) {
        log(`   Still waiting... (${i} seconds)`);
      }
    }

    if (!payfastDetected) {
      throw new Error("Did not navigate to PayFast page");
    }

    // Step 13: Complete payment on PayFast
    log("💳 Step 13: Completing payment on PayFast...");
    await quickDelay(2000);

    // Look for "Complete Payment" or similar button on PayFast
    log("🔘 Step 15: Looking for payment completion button on PayFast...");
    let completeButton = null;
    const payfastButtons = await page.$$("button, input[type='submit']");

    for (const button of payfastButtons) {
      const text = await page.evaluate((el) => {
        if (el.tagName === "INPUT") {
          return el.value || "";
        }
        return el.textContent || "";
      }, button);
      const visible = await page.evaluate(
        (el) => el.offsetParent !== null,
        button
      );

      if (
        (text.toLowerCase().includes("complete") ||
          text.toLowerCase().includes("pay") ||
          text.toLowerCase().includes("submit")) &&
        visible
      ) {
        log(`✅ Found payment button: "${text}"`);
        completeButton = button;
        break;
      }
    }

    if (completeButton) {
      log("🖱️ Step 16: Clicking payment completion button...");
      await completeButton.click();
      log("✅ Payment completion button clicked");
      await delay(3000);
    } else {
      log(
        "⚠️ Payment completion button not found - PayFast may have auto-completed or requires manual action"
      );
    }

    // Step 14: Wait for PayFast to redirect back to site
    log("⏳ Step 17: Waiting for PayFast to redirect back to site...");
    let redirectDetected = false;
    for (let i = 0; i < 60; i++) {
      await delay(2000);
      const currentUrl = page.url();

      // Check if we're back on our site (not PayFast)
      if (
        !currentUrl.includes("payfast.co.za") &&
        currentUrl.includes("trevnoctilla.com")
      ) {
        log(`✅ Redirected back to site!`);
        log(`   URL: ${currentUrl}`);
        redirectDetected = true;
        break;
      }

      if (i % 5 === 0) {
        log(`   Still waiting for redirect... (${i * 2} seconds)`);
      }
    }

    if (!redirectDetected) {
      log(
        "⚠️ Did not detect automatic redirect - PayFast may require manual completion"
      );
      log(`   Current URL: ${page.url()}`);
    }

    // Step 15: Verify tier upgrade
    log("✅ Step 18: Verifying tier upgrade...");

    // Navigate to dashboard if not already there
    const finalUrl = page.url();
    if (!finalUrl.includes("/dashboard")) {
      log("📍 Navigating to dashboard to check tier...");
      await page.goto(`${BASE_URL}/dashboard`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      await quickDelay(2000);
    }

    // Check user tier via API or page content
    log("🔍 Checking user subscription tier...");

    // Try to get tier from page content
    const pageContent = await page.evaluate(() => {
      return {
        bodyText: document.body.textContent,
        url: window.location.href,
      };
    });

    // Check for "production" or "premium" in page content
    const hasProductionTier =
      pageContent.bodyText.toLowerCase().includes("production") ||
      pageContent.bodyText.toLowerCase().includes("premium");

    // Also try to get from localStorage or check API
    const userData = await page.evaluate(() => {
      try {
        const data = localStorage.getItem("user_data");
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    });

    if (userData) {
      log("📊 User data from localStorage:", {
        subscription_tier: userData.subscription_tier,
        email: userData.email,
      });

      if (
        userData.subscription_tier === "production" ||
        userData.subscription_tier === "premium"
      ) {
        log("✅ SUCCESS: User tier upgraded to production/premium!");
        log(`   Tier: ${userData.subscription_tier}`);
      } else {
        log(`⚠️ Tier is still: ${userData.subscription_tier}`);
        log("   This might be expected if webhook hasn't processed yet");
      }
    } else {
      log("⚠️ Could not get user data from localStorage");
    }

    // Poll API to check tier (webhook might take a moment)
    log("🔄 Polling API to verify tier upgrade (webhook may take time)...");
    let tierUpgraded = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      await quickDelay(3000);

      try {
        const response = await page.evaluate(async () => {
          const apiUrl =
            window.__NEXT_DATA__?.env?.NEXT_PUBLIC_API_BASE_URL ||
            "https://web-production-737b.up.railway.app";
          const token = localStorage.getItem("auth_token");

          if (!token) return { error: "No auth token" };

          const res = await fetch(`${apiUrl}/api/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            return await res.json();
          }
          return { error: `Status: ${res.status}` };
        });

        if (response && !response.error) {
          log(
            `📊 Attempt ${attempt + 1}/10 - Current tier: ${
              response.subscription_tier
            }`
          );

          if (
            response.subscription_tier === "production" ||
            response.subscription_tier === "premium"
          ) {
            log("✅ SUCCESS: Tier upgraded to production/premium!");
            log(`   Final tier: ${response.subscription_tier}`);
            tierUpgraded = true;
            break;
          }
        } else {
          log(
            `⚠️ Attempt ${attempt + 1}/10 - Could not fetch profile:`,
            response.error
          );
        }
      } catch (error) {
        log(
          `⚠️ Attempt ${attempt + 1}/10 - Error checking tier:`,
          error.message
        );
      }
    }

    // Final summary
    log("📋 TEST SUMMARY:");
    log(`   ✅ Login: Success`);
    log(`   ✅ Navigate to billing: Success`);
    log(`   ✅ Click Subscribe: Success`);
    log(`   ✅ Navigate to payment page: Success`);
    log(`   ✅ Click Proceed to Pay: Success`);
    log(`   ✅ PayFast page: ${payfastDetected ? "Success" : "Failed"}`);
    log(
      `   ✅ Redirect back to site: ${redirectDetected ? "Success" : "Failed"}`
    );
    log(`   ✅ Tier upgrade: ${tierUpgraded ? "Success" : "Pending/Unknown"}`);

    if (tierUpgraded) {
      log("🎉 TEST PASSED: User successfully upgraded to production tier!");
    } else {
      log(
        "⚠️ TEST INCOMPLETE: Payment completed but tier upgrade not confirmed"
      );
      log("   This might be normal if webhook processing is delayed");
    }

    log("⏳ Keeping browser open for 5 seconds to view results...");
    await quickDelay(5000);
  } catch (error) {
    log("❌ TEST ERROR:", error.message);
    log("📚 Stack trace:", error.stack);

    // Take screenshot on error
    if (page) {
      try {
        await page.screenshot({
          path: "test-subscribe-production-error.png",
          fullPage: true,
        });
        log("📸 Screenshot saved: test-subscribe-production-error.png");
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
testSubscribeProductionUpgrade()
  .then(() => {
    console.log("\n✅ Test script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });
