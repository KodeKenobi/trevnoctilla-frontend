const puppeteer = require("puppeteer");

const BASE_URL = "https://www.trevnoctilla.com";
const EMAIL = "tshepomtshali89@gmail.com";
const PASSWORD = "Kopenikus0218!";
const PAYMENT_URL = `${BASE_URL}/payment?plan=production&amount=495.61`;

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

async function testPaymentHang() {
  let browser = null;
  let page = null;

  try {
    log("🚀 Starting payment hang test...");
    log(`📋 Test Configuration:`, {
      baseUrl: BASE_URL,
      paymentUrl: PAYMENT_URL,
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
        url.includes("initiate")
      ) {
        log(`🌐 REQUEST: ${request.method()} ${url}`);
        log(`   Headers:`, request.headers());
      }
    });

    page.on("response", (response) => {
      const url = response.url();
      if (
        url.includes("/api/payments") ||
        url.includes("/payfast") ||
        url.includes("initiate")
      ) {
        log(`📥 RESPONSE: ${response.status()} ${url}`);
        response
          .text()
          .then((text) => {
            if (text) {
              try {
                const json = JSON.parse(text);
                log(`   Body:`, json);
              } catch (e) {
                log(`   Body (text):`, text.substring(0, 500));
              }
            }
          })
          .catch((e) => {
            log(`   Could not read response body:`, e.message);
          });
      }
    });

    // Step 1: Navigate to site and reject cookies
    log(`📍 Step 1: Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    log("✅ Page loaded");
    await delay(2000);

    // Reject cookies
    log("🍪 Rejecting cookies...");
    try {
      const [button] = await page.$x(
        "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reject')]"
      );
      if (button) {
        await button.click();
        log("✅ Clicked 'Reject All' button");
        await delay(2000);
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
    await delay(2000);

    // Step 3: Fill login form
    log("📝 Step 3: Filling in login form...");
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', EMAIL, { delay: 100 });
    log(`✅ Entered email: ${EMAIL}`);

    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', PASSWORD, { delay: 100 });
    log("✅ Entered password");

    await delay(1000);

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
    await delay(3000);

    // Step 6: Navigate to payment page
    log(`💳 Step 6: Navigating to payment page: ${PAYMENT_URL}...`);
    await page.goto(PAYMENT_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    log("✅ Payment page loaded");
    await delay(3000);

    // Step 7: Check page content
    log("🔍 Step 7: Checking payment page content...");
    const pageContent = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return {
        title: document.title,
        url: window.location.href,
        allButtons: buttons.map((btn) => ({
          text: btn.textContent.trim(),
          disabled: btn.disabled,
          visible: btn.offsetParent !== null,
        })),
        loadingElements: Array.from(
          document.querySelectorAll(
            "[class*='loading'], [class*='spinner'], [class*='preparing']"
          )
        ).map((el) => ({
          text: el.textContent.trim(),
          visible: el.offsetParent !== null,
        })),
        errorElements: Array.from(
          document.querySelectorAll("[class*='error'], [role='alert']")
        ).map((el) => ({
          text: el.textContent.trim(),
          visible: el.offsetParent !== null,
        })),
        formFields: Array.from(document.querySelectorAll("form input")).map(
          (input) => ({
            name: input.name,
            value: input.value ? input.value.substring(0, 50) : "",
            type: input.type,
          })
        ),
        bodyText: document.body.textContent.substring(0, 500),
      };
    });
    log("📄 Page Content:", pageContent);

    // Step 8: Look for "Proceed to Pay" or similar button
    log("🔘 Step 8: Looking for payment button...");

    // Wait a bit for form to potentially become ready
    await delay(3000);

    // Check current state again
    const currentState = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return {
        buttons: buttons.map((btn) => ({
          text: btn.textContent.trim(),
          disabled: btn.disabled,
          visible: btn.offsetParent !== null,
        })),
        hasPreparingText: document.body.textContent
          .toLowerCase()
          .includes("preparing"),
        formInputs: Array.from(
          document.querySelectorAll("form input[name]")
        ).map((input) => ({
          name: input.name,
          hasValue: !!input.value,
        })),
      };
    });
    log("📊 Current State:", currentState);

    let paymentButton = null;
    const buttons = await page.$$("button");
    for (const button of buttons) {
      const text = await page.evaluate((el) => el.textContent, button);
      const disabled = await page.evaluate((el) => el.disabled, button);
      const visible = await page.evaluate(
        (el) => el.offsetParent !== null,
        button
      );

      log(`🔍 Button: "${text}" - disabled: ${disabled}, visible: ${visible}`);

      if (
        (text.toLowerCase().includes("proceed") ||
          text.toLowerCase().includes("pay") ||
          text.toLowerCase().includes("continue")) &&
        visible
      ) {
        if (!disabled) {
          log(`✅ Found enabled payment button: "${text}"`);
          paymentButton = button;
          break;
        } else {
          log(`⚠️ Found disabled payment button: "${text}"`);
        }
      }
    }

    if (!paymentButton) {
      // Check if we're stuck on "Preparing payment"
      const bodyText = await page.evaluate(() => document.body.textContent);
      if (bodyText.toLowerCase().includes("preparing payment")) {
        log("❌ STUCK ON 'Preparing Payment' - Form is not ready");
        log("   This means the form fields are not being populated correctly");
      }

      // Take screenshot
      await page.screenshot({
        path: "payment-page-no-button.png",
        fullPage: true,
      });
      log("📸 Screenshot saved: payment-page-no-button.png");
      throw new Error("Payment button not found or disabled");
    }

    // Step 9: Click payment button
    log("🖱️ Step 9: Clicking payment button...");
    try {
      const buttonText = await page.evaluate(
        (el) => el?.textContent || "",
        paymentButton
      );
      log(`   Button text: "${buttonText}"`);
      await paymentButton.click();
      log("✅ Payment button clicked");
      await delay(2000);
    } catch (error) {
      log(`⚠️ Error clicking button: ${error.message}`);
      // Try alternative click method
      await page.evaluate((btn) => btn?.click(), paymentButton);
      log("✅ Clicked button using evaluate");
      await delay(2000);
    }

    // Step 10: Monitor for "Preparing Payment" state
    log("⏳ Step 10: Monitoring payment preparation...");
    let preparingPaymentFound = false;
    let preparingPaymentCount = 0;
    const maxChecks = 30; // Check for 30 seconds

    for (let i = 0; i < maxChecks; i++) {
      await delay(1000);

      const pageState = await page.evaluate(() => {
        return {
          url: window.location.href,
          bodyText: document.body?.textContent || "",
          loadingElements: Array.from(
            document.querySelectorAll(
              "[class*='loading'], [class*='spinner'], [class*='preparing'], [class*='processing']"
            )
          ).map((el) => ({
            text: el?.textContent?.trim() || "",
            visible: el?.offsetParent !== null,
            class: el?.className || "",
          })),
          errorElements: Array.from(
            document.querySelectorAll("[class*='error'], [role='alert']")
          ).map((el) => ({
            text: el?.textContent?.trim() || "",
            visible: el?.offsetParent !== null,
          })),
          buttons: Array.from(document.querySelectorAll("button")).map(
            (btn) => ({
              text: btn?.textContent?.trim() || "",
              disabled: btn?.disabled || false,
              visible: btn?.offsetParent !== null,
            })
          ),
        };
      });

      // Check if "Preparing Payment" or similar text is visible
      const hasPreparingText =
        pageState.bodyText.toLowerCase().includes("preparing") ||
        pageState.bodyText.toLowerCase().includes("processing") ||
        pageState.loadingElements.some((el) => el.visible);

      if (hasPreparingText && !preparingPaymentFound) {
        preparingPaymentFound = true;
        log(`⚠️ "Preparing Payment" state detected at ${i + 1} seconds`);
        log(`   Loading elements:`, pageState.loadingElements);
      }

      if (preparingPaymentFound) {
        preparingPaymentCount++;
        if (preparingPaymentCount % 5 === 0) {
          log(
            `⏳ Still preparing payment... (${preparingPaymentCount} seconds)`
          );
          log(`   Current URL: ${pageState.url}`);
          log(
            `   Visible loading elements:`,
            pageState.loadingElements.filter((el) => el.visible)
          );
        }
      }

      // Check for errors
      if (pageState.errorElements.some((el) => el.visible)) {
        log(
          `❌ Error detected:`,
          pageState.errorElements.filter((el) => el.visible)
        );
      }

      // Check if we navigated away (payment succeeded)
      if (!pageState.url.includes("/payment")) {
        log(`✅ Navigated away from payment page!`);
        log(`   New URL: ${pageState.url}`);
        break;
      }

      // Check if PayFast form appeared
      if (
        pageState.bodyText.includes("PayFast") ||
        pageState.url.includes("payfast")
      ) {
        log(`✅ PayFast page detected!`);
        log(`   URL: ${pageState.url}`);
        break;
      }
    }

    if (preparingPaymentFound && preparingPaymentCount >= maxChecks) {
      log(
        `❌ TEST RESULT: Payment is STUCK on "Preparing Payment" for ${preparingPaymentCount} seconds`
      );

      // Take screenshot
      await page.screenshot({
        path: "payment-stuck.png",
        fullPage: true,
      });
      log("📸 Screenshot saved: payment-stuck.png");

      // Get final page state
      const finalState = await page.evaluate(() => {
        return {
          url: window.location.href,
          bodyText: document.body.textContent.substring(0, 1000),
          consoleErrors: window.consoleErrors || [],
        };
      });
      log("📄 Final Page State:", finalState);
    } else if (!preparingPaymentFound) {
      log(`✅ TEST RESULT: Payment did not get stuck (or completed quickly)`);
    }

    log("✅ Test completed!");
    log("⏳ Keeping browser open for 10 seconds to view results...");
    await delay(10000);
  } catch (error) {
    log("❌ TEST ERROR:", error.message);
    log("📚 Stack trace:", error.stack);

    // Take screenshot on error
    if (page) {
      try {
        await page.screenshot({
          path: "test-payment-hang-error.png",
          fullPage: true,
        });
        log("📸 Screenshot saved: test-payment-hang-error.png");
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
testPaymentHang()
  .then(() => {
    console.log("\n✅ Test script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });
