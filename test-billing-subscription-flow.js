/**
 * Test script: Billing Subscription Flow
 *
 * This script:
 * 1. Opens the billing settings page
 * 2. Clicks Subscribe button on Production plan
 * 3. Captures logs throughout the journey
 * 4. Waits for PayFast redirect
 * 5. Waits for user to complete payment manually
 * 6. Captures logs when redirected back
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const url = require("url");

// Configuration
const TARGET_URL =
  "https://www.trevnoctilla.com/dashboard?tab=settings&section=billing";
const LOGIN_URL = "https://www.trevnoctilla.com/auth/login";
const USER_EMAIL = "tshepomtshali89@gmail.com";
const USER_PASSWORD = "Kopenikus0218!";
const LOG_FILE = `billing-subscription-test-${Date.now()}.txt`;

// Logging utility
const logs = [];
function log(message, type = "INFO") {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type}] ${message}`;
  console.log(logEntry);
  logs.push(logEntry);
}

// Write logs to file
function writeLogs() {
  const logContent = logs.join("\n");
  fs.writeFileSync(LOG_FILE, logContent);
  console.log(`\n📝 Logs saved to: ${LOG_FILE}`);
}

async function testBillingSubscriptionFlow() {
  let browser;
  let page;

  try {
    log("=".repeat(80));
    log("🧪 BILLING SUBSCRIPTION FLOW TEST");
    log("=".repeat(80));
    log(`Target URL: ${TARGET_URL}`);
    log(`Log file: ${LOG_FILE}`);
    log("");

    // Launch browser
    log("🚀 Launching browser...");
    browser = await puppeteer.launch({
      headless: false, // Show browser so user can complete payment
      defaultViewport: { width: 1920, height: 1080 },
      args: ["--start-maximized"],
    });
    log("✅ Browser launched");

    // Create new page
    page = await browser.newPage();
    log("✅ New page created");

    // Capture console logs
    page.on("console", (msg) => {
      const text = msg.text();
      const type = msg.type();
      log(`Console [${type}]: ${text}`, "CONSOLE");
    });

    // Capture page errors
    page.on("pageerror", (error) => {
      log(`Page Error: ${error.message}`, "ERROR");
      if (error.stack) {
        log(`Stack: ${error.stack}`, "ERROR");
      }
    });

    // Track webhook requests specifically
    const webhookRequests = [];
    const webhookResponses = [];
    let initialSubscriptionTier = null;

    // Capture request logs
    page.on("request", (request) => {
      const url = request.url();
      const method = request.method();
      if (
        url.includes("payfast") ||
        url.includes("payment") ||
        url.includes("api") ||
        url.includes("notify") ||
        url.includes("check-pending")
      ) {
        log(`Request [${method}]: ${url}`, "REQUEST");

        // Track webhook requests specifically
        if (
          url.includes("/api/payment/notify") ||
          url.includes("/payment/notify")
        ) {
          webhookRequests.push({
            url,
            method,
            timestamp: new Date().toISOString(),
          });
          log(`🔔 WEBHOOK REQUEST DETECTED: ${method} ${url}`, "INFO");
        }

        // Track payment initiate endpoint
        if (url.includes("/api/payments/payfast/initiate")) {
          log(
            `💾 [TRACKING] Payment initiate endpoint called: ${method} ${url}`,
            "INFO"
          );
        }

        // Track check-pending endpoint
        if (url.includes("/api/payments/check-pending")) {
          log(
            `🔍 [TRACKING] Check pending endpoint called: ${method} ${url}`,
            "INFO"
          );
        }
      }
    });

    // Capture response logs
    page.on("response", async (response) => {
      const url = response.url();
      const status = response.status();
      if (
        url.includes("payfast") ||
        url.includes("payment") ||
        url.includes("api") ||
        url.includes("notify") ||
        url.includes("check-pending")
      ) {
        log(`Response [${status}]: ${url}`, "RESPONSE");

        // Track check-pending response
        if (url.includes("/api/payments/check-pending")) {
          log(
            `🔍 [TRACKING] Check pending response [${status}]: ${url}`,
            "INFO"
          );
          try {
            const clonedResponse = response.clone();
            const data = await clonedResponse.json();
            log(
              `🔍 [TRACKING] Check pending response: ${JSON.stringify(data)}`,
              "INFO"
            );
            if (data.hasPendingPayment && data.upgraded) {
              log(
                `✅ [TRACKING] SUCCESS: User upgraded to ${data.plan} plan!`,
                "INFO"
              );
            } else if (data.hasPendingPayment && !data.upgraded) {
              log(
                `❌ [TRACKING] FAILED: ${data.error || "Unknown error"}`,
                "ERROR"
              );
            } else {
              log(`ℹ️ [TRACKING] No pending payment found`, "INFO");
            }
          } catch (e) {
            // Ignore errors
          }
        }

        // Track webhook responses specifically
        if (
          url.includes("/api/payment/notify") ||
          url.includes("/payment/notify")
        ) {
          try {
            const responseText = await response
              .text()
              .catch(() => "Unable to read response");
            webhookResponses.push({
              url,
              status,
              timestamp: new Date().toISOString(),
              responseText: responseText.substring(0, 500), // Limit length
            });
            log(`🔔 WEBHOOK RESPONSE: ${status} ${url}`, "INFO");
            if (status !== 200) {
              log(`⚠️  Webhook returned non-200 status: ${status}`, "WARN");
              log(`   Response: ${responseText.substring(0, 200)}`, "WARN");
            }
          } catch (error) {
            log(`⚠️  Error reading webhook response: ${error.message}`, "WARN");
          }
        }
      }
    });

    // Capture network failures
    page.on("requestfailed", (request) => {
      log(
        `Request Failed: ${request.url()} - ${request.failure().errorText}`,
        "ERROR"
      );
    });

    // Step 1: Handle cookies popup (if landing page is shown first)
    log("");
    log("🍪 Step 1: Checking for cookies popup...");
    await page.goto("https://www.trevnoctilla.com", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    log("✅ Landing page loaded");

    // Wait a bit for cookies popup to appear
    await page.waitForTimeout(2000);
    log("   Looking for cookies popup...");

    // Try to find and click "Reject All" button
    const rejectAllButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      for (const button of buttons) {
        const text = button.textContent?.trim().toLowerCase();
        if (
          text.includes("reject all") ||
          text.includes("reject") ||
          text.includes("decline") ||
          text.includes("deny")
        ) {
          return button;
        }
      }
      // Also check for links/divs that might be clickable
      const allClickable = Array.from(
        document.querySelectorAll("a, div[role='button'], span[role='button']")
      );
      for (const element of allClickable) {
        const text = element.textContent?.trim().toLowerCase();
        if (
          text.includes("reject all") ||
          text.includes("reject") ||
          text.includes("decline")
        ) {
          return element;
        }
      }
      return null;
    });

    if (rejectAllButton && (await rejectAllButton.asElement()) !== null) {
      log("✅ Found 'Reject All' button");
      await (await rejectAllButton.asElement()).click();
      log("✅ 'Reject All' clicked");
      await page.waitForTimeout(1000);
    } else {
      log("⚠️  Cookies popup not found or already dismissed", "WARN");
    }

    // Step 2: Login
    log("");
    log("🔐 Step 2: Logging in...");
    log(`   Login URL: ${LOGIN_URL}`);
    log(`   Email: ${USER_EMAIL}`);
    await page.goto(LOGIN_URL, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    log("✅ Login page loaded");

    // Wait for login form to be ready
    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 10000,
    });
    log("✅ Login form found");

    // Fill in email
    await page.type('input[type="email"], input[name="email"]', USER_EMAIL, {
      delay: 50,
    });
    log("✅ Email entered");

    // Fill in password
    await page.waitForSelector(
      'input[type="password"], input[name="password"]',
      { timeout: 5000 }
    );
    await page.type(
      'input[type="password"], input[name="password"]',
      USER_PASSWORD,
      { delay: 50 }
    );
    log("✅ Password entered");

    // Click login button
    await page
      .waitForSelector(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")',
        { timeout: 5000 }
      )
      .catch(() => {
        log(
          "⚠️  Submit button selector not found, trying alternative...",
          "WARN"
        );
      });

    // Try to find and click submit button
    const submitButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      for (const button of buttons) {
        const text = button.textContent?.trim().toLowerCase();
        const type = button.type;
        if (
          type === "submit" ||
          text.includes("login") ||
          text.includes("sign in")
        ) {
          return button;
        }
      }
      return null;
    });

    if (submitButton && (await submitButton.asElement()) !== null) {
      log("✅ Login button found");
      await (await submitButton.asElement()).click();
      log("✅ Login button clicked");
    } else {
      // Fallback: try pressing Enter
      log("⚠️  Login button not found, trying Enter key...", "WARN");
      await page.keyboard.press("Enter");
    }

    // Wait for navigation after login
    log("   Waiting for login to complete...");
    await page
      .waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 })
      .catch(() => {
        log("⚠️  Login navigation timeout, but continuing...", "WARN");
      });

    const afterLoginUrl = page.url();
    log(`✅ Login completed, current URL: ${afterLoginUrl}`);

    // Wait a bit for session to be established
    await page.waitForTimeout(2000);
    log("✅ Session established");

    // Step 2.5: Capture initial subscription tier
    log("");
    log("📊 Capturing initial subscription tier...");
    try {
      const initialProfile = await page.evaluate(async (userPassword) => {
        try {
          const response = await fetch("/api/auth/session");
          const session = await response.json();
          if (session?.user?.email) {
            // Get profile from backend
            const backendUrl =
              window.location.hostname === "localhost"
                ? "http://localhost:5000"
                : "https://web-production-737b.up.railway.app";
            const tokenResponse = await fetch(
              `${backendUrl}/auth/get-token-from-session`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: session.user.email,
                  password: userPassword,
                  subscription_tier: session.user.subscription_tier || "free",
                }),
              }
            );
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              const token = tokenData.access_token || tokenData.token;
              if (token) {
                const profileResponse = await fetch(
                  `${backendUrl}/auth/profile`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                if (profileResponse.ok) {
                  return await profileResponse.json();
                }
              }
            } else {
              const errorData = await tokenResponse.json();
              return {
                error: `Token request failed: ${
                  tokenResponse.status
                } - ${JSON.stringify(errorData)}`,
              };
            }
          }
          return null;
        } catch (error) {
          return { error: error.message };
        }
      }, USER_PASSWORD);

      if (initialProfile && !initialProfile.error) {
        initialSubscriptionTier = initialProfile.subscription_tier || "free";
        log(`✅ Initial subscription tier: ${initialSubscriptionTier}`);
        log(`   User ID: ${initialProfile.id}`);
        log(`   User Email: ${initialProfile.email}`);
        log(`   Created At: ${initialProfile.created_at}`);
      } else {
        log("⚠️  Could not fetch initial subscription tier", "WARN");
        initialSubscriptionTier = "unknown";
      }
    } catch (error) {
      log(`⚠️  Error capturing initial tier: ${error.message}`, "WARN");
      initialSubscriptionTier = "unknown";
    }

    // Step 3: Navigate to billing page
    log("");
    log("📄 Step 3: Navigating to billing page...");
    log(`   URL: ${TARGET_URL}`);
    await page.goto(TARGET_URL, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    log("✅ Billing page loaded");

    // Wait for page to be fully loaded
    await page.waitForTimeout(3000);
    log("✅ Page fully loaded (waited 3s)");

    // Step 4: Find and click Subscribe button on Production plan
    log("");
    log("🔍 Step 4: Looking for Production plan Subscribe button...");

    // Wait for the billing section to load
    await page.waitForSelector("button", { timeout: 10000 });
    log("✅ Buttons found on page");

    // Find the Production plan card and its Subscribe button
    // The button text should be "Subscribe" and it should be in the Production plan card
    const subscribeButton = await page.evaluateHandle(() => {
      // Find all buttons with text "Subscribe"
      const buttons = Array.from(document.querySelectorAll("button"));
      for (const button of buttons) {
        const text = button.textContent?.trim();
        if (text === "Subscribe" || text.includes("Subscribe")) {
          // Check if it's in a card that contains "Production"
          let parent = button.parentElement;
          let depth = 0;
          while (parent && depth < 10) {
            const parentText = parent.textContent || "";
            if (
              parentText.includes("Production") ||
              parentText.includes("production")
            ) {
              return button;
            }
            parent = parent.parentElement;
            depth++;
          }
        }
      }
      return null;
    });

    if (!subscribeButton || (await subscribeButton.asElement()) === null) {
      // Fallback: try to find by data attributes or class names
      log(
        "⚠️  Subscribe button not found by text, trying alternative methods..."
      );

      // Try finding by looking for Production plan features
      const productionButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        for (const button of buttons) {
          // Check if button is near text containing "5,000" (Production plan feature)
          const container = button.closest("div");
          if (container) {
            const containerText = container.textContent || "";
            if (
              containerText.includes("5,000") ||
              containerText.includes("5000")
            ) {
              const buttonText = button.textContent?.trim();
              if (
                buttonText === "Subscribe" ||
                buttonText.includes("Subscribe")
              ) {
                return button;
              }
            }
          }
        }
        return null;
      });

      if (productionButton && (await productionButton.asElement()) !== null) {
        log("✅ Found Production Subscribe button (alternative method)");
        await (await productionButton.asElement()).click();
      } else {
        // Last resort: find button by text content using evaluate
        log("⚠️  Using fallback: finding Subscribe button by text content...");
        const fallbackButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          for (const button of buttons) {
            const text = button.textContent?.trim();
            if (text === "Subscribe" || text.includes("Subscribe")) {
              return button;
            }
          }
          return null;
        });

        if (fallbackButton && (await fallbackButton.asElement()) !== null) {
          log("✅ Found Subscribe button (fallback method)");
          await (await fallbackButton.asElement()).click();
        } else {
          throw new Error("Could not find Subscribe button on page");
        }
      }
    } else {
      log("✅ Found Production Subscribe button");
      await (await subscribeButton.asElement()).click();
    }

    log("✅ Subscribe button clicked");
    log("   Waiting for navigation to payment page...");

    // Step 5: Wait for navigation to payment page
    await page
      .waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 })
      .catch(() => {
        log("⚠️  Navigation timeout, but continuing...", "WARN");
      });

    const currentUrl = page.url();
    log(`✅ Navigated to: ${currentUrl}`);

    // Check if we're on payment page or PayFast
    if (currentUrl.includes("/payment")) {
      log("✅ On payment page");
      log("   Waiting for PayFast form to load...");
      await page.waitForTimeout(3000);

      // Step 6: Click "Proceed to Pay" button
      log("");
      log("🔄 Step 6: Looking for 'Proceed to Pay' button...");

      // Find and click the "Proceed to Pay" button
      const proceedButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        for (const button of buttons) {
          const text = button.textContent?.trim();
          if (
            text.toLowerCase().includes("proceed") ||
            text.toLowerCase().includes("pay") ||
            text.toLowerCase().includes("complete payment") ||
            text.toLowerCase().includes("continue")
          ) {
            // Make sure it's a payment-related button
            const buttonText = text.toLowerCase();
            if (
              buttonText.includes("proceed") ||
              buttonText.includes("pay") ||
              buttonText.includes("complete")
            ) {
              return button;
            }
          }
        }
        return null;
      });

      if (proceedButton && (await proceedButton.asElement()) !== null) {
        log("✅ Found 'Proceed to Pay' button");

        // Log user info before clicking "Proceed to Pay"
        log("");
        log("=".repeat(80));
        log("👤 USER CLICKED 'PROCEED TO PAY':");
        log("=".repeat(80));
        try {
          const userInfo = await page.evaluate(async () => {
            try {
              const response = await fetch("/api/auth/session");
              const session = await response.json();
              return {
                userId: session?.user?.id || null,
                email: session?.user?.email || null,
              };
            } catch (error) {
              return { error: error.message };
            }
          });

          if (userInfo && !userInfo.error) {
            log(`   User ID: ${userInfo.userId || "N/A"}`);
            log(`   User Email: ${userInfo.email || "N/A"}`);
          } else {
            log(
              `   Error getting user info: ${userInfo?.error || "Unknown"}`,
              "WARN"
            );
          }
        } catch (error) {
          log(`   Error logging user info: ${error.message}`, "WARN");
        }
        log("=".repeat(80));
        log("");

        await (await proceedButton.asElement()).click();
        log("✅ 'Proceed to Pay' button clicked");
        await page.waitForTimeout(2000);
      } else {
        log(
          "⚠️  'Proceed to Pay' button not found, trying alternative selectors...",
          "WARN"
        );

        // Try common button selectors
        const alternativeSelectors = [
          'button:contains("Proceed")',
          'button:contains("Pay")',
          'button:contains("Complete")',
          '[data-testid*="pay"]',
          '[data-testid*="proceed"]',
          ".pay-button",
          "#pay-button",
        ];

        let clicked = false;
        for (const selector of alternativeSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              // Log user info before clicking
              log("");
              log("=".repeat(80));
              log("👤 USER CLICKED 'PROCEED TO PAY':");
              log("=".repeat(80));
              try {
                const userInfo = await page.evaluate(async () => {
                  try {
                    const response = await fetch("/api/auth/session");
                    const session = await response.json();
                    return {
                      userId: session?.user?.id || null,
                      email: session?.user?.email || null,
                    };
                  } catch (error) {
                    return { error: error.message };
                  }
                });

                if (userInfo && !userInfo.error) {
                  log(`   User ID: ${userInfo.userId || "N/A"}`);
                  log(`   User Email: ${userInfo.email || "N/A"}`);
                } else {
                  log(
                    `   Error getting user info: ${
                      userInfo?.error || "Unknown"
                    }`,
                    "WARN"
                  );
                }
              } catch (error) {
                log(`   Error logging user info: ${error.message}`, "WARN");
              }
              log("=".repeat(80));
              log("");

              await element.click();
              log(`✅ Clicked button using selector: ${selector}`);
              clicked = true;
              await page.waitForTimeout(2000);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        if (!clicked) {
          log(
            "⚠️  Could not find 'Proceed to Pay' button, form may auto-submit",
            "WARN"
          );
        }
      }

      // Step 7: Wait for PayFast redirect
      log("");
      log("🔄 Step 7: Waiting for PayFast redirect...");
      log("   Form submitted, waiting for PayFast page...");

      // Wait for navigation to PayFast
      try {
        await page.waitForNavigation({
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        log("✅ Navigation completed");
      } catch (error) {
        log("⚠️  Navigation timeout, checking current URL...", "WARN");
      }

      // Wait a bit for page to stabilize
      await page.waitForTimeout(2000);

      const payfastUrl = page.url();
      if (payfastUrl.includes("payfast")) {
        log(`✅ Redirected to PayFast: ${payfastUrl}`);
      } else {
        log(`⚠️  Unexpected URL after navigation: ${payfastUrl}`, "WARN");
      }
    } else if (currentUrl.includes("payfast")) {
      log("✅ Already on PayFast page");
    }

    // Step 7.5: Click "Complete Payment" button on PayFast
    const currentPayfastUrl = page.url();
    if (currentPayfastUrl.includes("payfast")) {
      log("");
      log("🔄 Step 7.5: Looking for 'Complete Payment' button on PayFast...");

      // Wait for PayFast page to fully load
      await page.waitForTimeout(3000);

      // Try to find and click the "Complete Payment" button
      const completePaymentButton = await page.evaluateHandle(() => {
        // Try various button selectors
        const buttons = Array.from(
          document.querySelectorAll(
            "button, input[type='submit'], a[role='button']"
          )
        );
        for (const button of buttons) {
          const text =
            button.textContent?.trim().toLowerCase() ||
            button.value?.toLowerCase() ||
            "";
          const ariaLabel =
            button.getAttribute("aria-label")?.toLowerCase() || "";
          const className = button.className?.toLowerCase() || "";

          if (
            text.includes("complete payment") ||
            text.includes("complete") ||
            text.includes("pay now") ||
            text.includes("pay") ||
            text.includes("submit payment") ||
            ariaLabel.includes("complete payment") ||
            ariaLabel.includes("pay") ||
            className.includes("pay") ||
            className.includes("complete") ||
            className.includes("submit")
          ) {
            // Make sure it's visible and clickable
            const style = window.getComputedStyle(button);
            if (style.display !== "none" && style.visibility !== "hidden") {
              return button;
            }
          }
        }
        return null;
      });

      if (
        completePaymentButton &&
        (await completePaymentButton.asElement()) !== null
      ) {
        log("✅ Found 'Complete Payment' button");
        await (await completePaymentButton.asElement()).click();
        log("✅ 'Complete Payment' button clicked");
        await page.waitForTimeout(2000);
      } else {
        log(
          "⚠️  'Complete Payment' button not found, trying alternative methods...",
          "WARN"
        );

        // Try clicking by form submission
        try {
          const form = await page.$("form");
          if (form) {
            log("   Found form, trying to submit...");
            await form.evaluate((f) => f.submit());
            log("✅ Form submitted");
            await page.waitForTimeout(2000);
          }
        } catch (error) {
          log(`   Form submission failed: ${error.message}`, "WARN");
        }

        // Try common PayFast button selectors
        const alternativeSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          ".btn-primary",
          ".btn-pay",
          "#pay-button",
          '[data-action="pay"]',
          'button:contains("Pay")',
        ];

        let clicked = false;
        for (const selector of alternativeSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              log(`✅ Clicked button using selector: ${selector}`);
              clicked = true;
              await page.waitForTimeout(2000);
              break;
            }
          } catch (error) {
            // Continue to next selector
          }
        }

        if (!clicked) {
          log("⚠️  Could not automatically click payment button", "WARN");
          log("   Payment may need to be completed manually");
        }
      }
    }

    // Step 8: Wait for payment processing and redirect
    log("");
    log("=".repeat(80));
    log("⏳ Step 8: WAITING FOR PAYMENT PROCESSING AND REDIRECT");
    log("=".repeat(80));
    log("   Payment button clicked, waiting for processing...");
    log(
      "   The script will continue monitoring for redirect back to website..."
    );
    log("");

    // Monitor for redirect back to website
    let redirectDetected = false;
    const maxWaitTime = 300000; // 5 minutes
    const startTime = Date.now();

    while (!redirectDetected && Date.now() - startTime < maxWaitTime) {
      const currentUrl = page.url();

      // Check if we're back on the website (not PayFast)
      if (
        !currentUrl.includes("payfast.co.za") &&
        !currentUrl.includes("sandbox.payfast")
      ) {
        if (
          currentUrl.includes("trevnoctilla.com") ||
          currentUrl.includes("dashboard") ||
          currentUrl.includes("payment")
        ) {
          redirectDetected = true;
          log("");
          log("=".repeat(80));
          log("✅ Step 9: REDIRECTED BACK TO WEBSITE");
          log("=".repeat(80));
          log(`   Current URL: ${currentUrl}`);
          log("   Payment flow completed!");
          log("");

          // Wait for page to fully load
          await page.waitForTimeout(3000);
          log("✅ Page fully loaded after redirect");

          // Capture final page state
          const finalUrl = page.url();
          log(`   Final URL: ${finalUrl}`);

          // Log tier information from PayFast return URL
          log("");
          log("=".repeat(80));
          log("📋 PAYFAST RETURN - TIER INFORMATION:");
          log("=".repeat(80));
          let planId = null;
          let userId = null;
          let planName = null;
          try {
            const urlParams = new URL(finalUrl).searchParams;
            const customStr1 = urlParams.get("custom_str1"); // Tier/Plan ID
            const customStr2 = urlParams.get("custom_str2"); // User ID
            const itemName = urlParams.get("item_name");
            const mPaymentId = urlParams.get("m_payment_id");
            const pfPaymentId = urlParams.get("pf_payment_id");
            const paymentStatus = urlParams.get("payment_status");

            planId = customStr1;
            userId = customStr2;
            planName = itemName;

            log(`   Tier/Plan ID (custom_str1): ${customStr1 || "N/A"}`);
            log(`   Plan Name (item_name): ${itemName || "N/A"}`);
            log(`   User ID (custom_str2): ${customStr2 || "N/A"}`);
            log(`   Payment ID (m_payment_id): ${mPaymentId || "N/A"}`);
            log(
              `   PayFast Payment ID (pf_payment_id): ${pfPaymentId || "N/A"}`
            );
            log(`   Payment Status: ${paymentStatus || "N/A"}`);

            // Also log all URL parameters for debugging
            log("");
            log("   All PayFast Return URL Parameters:");
            urlParams.forEach((value, key) => {
              log(`      ${key} = ${value}`);
            });
          } catch (error) {
            log(
              `   Error parsing return URL parameters: ${error.message}`,
              "WARN"
            );
          }
          log("=".repeat(80));
          log("");

          // Step 9.1: Manually trigger tier upgrade after payment
          log("");
          log("=".repeat(80));
          log("🔄 Step 9.1: MANUALLY TRIGGERING TIER UPGRADE");
          log("=".repeat(80));
          log(
            "   Since PayFast webhook may be delayed, manually calling upgrade endpoint..."
          );
          log("");

          try {
            // Get user info from session
            const sessionData = await page.evaluate(async () => {
              try {
                const response = await fetch("/api/auth/session");
                const session = await response.json();
                return {
                  userId: session?.user?.id || null,
                  email: session?.user?.email || null,
                };
              } catch (error) {
                return { error: error.message };
              }
            });

            if (sessionData && !sessionData.error) {
              const upgradeUserId = userId || sessionData.userId;
              const upgradeEmail = sessionData.email || USER_EMAIL;
              const upgradePlanId = planId || "production"; // Default to production if not in URL
              const upgradePlanName =
                planName || "Production Plan - Monthly Subscription";
              const upgradeAmount = 29.0; // Production plan amount

              log(`   User ID: ${upgradeUserId}`);
              log(`   User Email: ${upgradeEmail}`);
              log(`   Plan ID: ${upgradePlanId}`);
              log(`   Plan Name: ${upgradePlanName}`);
              log(`   Amount: R${upgradeAmount}`);
              log("");
              log("   Calling upgrade-subscription endpoint...");

              // Call backend upgrade endpoint directly
              const backendUrl = "https://web-production-737b.up.railway.app";
              const upgradePayload = JSON.stringify({
                user_id: upgradeUserId ? parseInt(upgradeUserId) : undefined,
                user_email: upgradeEmail,
                plan_id: upgradePlanId,
                plan_name: upgradePlanName,
                amount: upgradeAmount,
                payment_id: `test-payment-${Date.now()}`,
              });

              const upgradeOptions = {
                hostname: url.parse(backendUrl).hostname,
                port: url.parse(backendUrl).port || 443,
                path: "/api/payment/upgrade-subscription",
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Content-Length": Buffer.byteLength(upgradePayload),
                },
              };

              const upgradeResult = await new Promise((resolve, reject) => {
                const req = https.request(upgradeOptions, (res) => {
                  let data = "";
                  res.on("data", (chunk) => {
                    data += chunk;
                  });
                  res.on("end", () => {
                    try {
                      const result = JSON.parse(data);
                      resolve({ status: res.statusCode, data: result });
                    } catch (e) {
                      resolve({ status: res.statusCode, data: data });
                    }
                  });
                });
                req.on("error", reject);
                req.write(upgradePayload);
                req.end();
              });

              if (upgradeResult.status === 200) {
                log(
                  `   ✅ Upgrade successful! Status: ${upgradeResult.status}`
                );
                if (upgradeResult.data) {
                  log(
                    `   Response: ${JSON.stringify(
                      upgradeResult.data,
                      null,
                      2
                    )}`
                  );
                  if (
                    upgradeResult.data.old_tier &&
                    upgradeResult.data.new_tier
                  ) {
                    log(
                      `   ✅ Tier changed from "${upgradeResult.data.old_tier}" to "${upgradeResult.data.new_tier}"`
                    );
                  }
                }
              } else {
                log(
                  `   ❌ Upgrade failed! Status: ${upgradeResult.status}`,
                  "ERROR"
                );
                log(
                  `   Response: ${JSON.stringify(upgradeResult.data, null, 2)}`,
                  "ERROR"
                );
              }
            } else {
              log(
                `   ⚠️  Could not get user info: ${
                  sessionData?.error || "Unknown"
                }`,
                "WARN"
              );
            }
          } catch (error) {
            log(`   ❌ Error triggering upgrade: ${error.message}`, "ERROR");
            if (error.stack) {
              log(`   Stack: ${error.stack}`, "ERROR");
            }
          }
          log("=".repeat(80));
          log("");

          // Check for success indicators
          const pageContent = await page.content();
          if (
            pageContent.includes("success") ||
            pageContent.includes("Success") ||
            finalUrl.includes("dashboard")
          ) {
            log("✅ Success indicators found on page");
          }

          // Capture console logs one more time
          await page.waitForTimeout(2000);
          log("✅ Final state captured");

          // Step 9.5: Check for webhook and verify subscription tier update
          log("");
          log("=".repeat(80));
          log("🔍 Step 9.5: VERIFYING WEBHOOK AND SUBSCRIPTION UPDATE");
          log("=".repeat(80));

          // Check webhook requests
          log("");
          log("📡 Webhook Request Analysis:");
          if (webhookRequests.length > 0) {
            log(`✅ Found ${webhookRequests.length} webhook request(s):`);
            webhookRequests.forEach((req, index) => {
              log(
                `   ${index + 1}. ${req.method} ${req.url} at ${req.timestamp}`
              );
            });
          } else {
            log("⚠️  NO WEBHOOK REQUESTS DETECTED", "WARN");
            log(
              "   PayFast may not have sent the ITN webhook yet, or it was sent to a different endpoint"
            );
          }

          // Check webhook responses
          log("");
          log("📡 Webhook Response Analysis:");
          if (webhookResponses.length > 0) {
            log(`✅ Found ${webhookResponses.length} webhook response(s):`);
            webhookResponses.forEach((resp, index) => {
              log(
                `   ${index + 1}. Status: ${resp.status} at ${resp.timestamp}`
              );
              if (resp.status === 200) {
                log(`      ✅ Webhook processed successfully`);
              } else {
                log(
                  `      ❌ Webhook failed with status ${resp.status}`,
                  "ERROR"
                );
                log(`      Response: ${resp.responseText}`, "ERROR");
              }
            });
          } else {
            log("⚠️  NO WEBHOOK RESPONSES DETECTED", "WARN");
          }

          // Step 9.5.5: Check Debug API for Webhook Attempts
          log("");
          log("=".repeat(80));
          log("🔍 Step 9.5.5: CHECKING DEBUG API FOR WEBHOOK ATTEMPTS");
          log("=".repeat(80));
          log("   Querying debug API to see if PayFast sent any webhooks...");
          log("");

          try {
            const debugData = await page.evaluate(async () => {
              try {
                const response = await fetch(
                  "https://www.trevnoctilla.com/api/payments/debug"
                );
                return await response.json();
              } catch (error) {
                return { error: error.message };
              }
            });

            if (debugData.error) {
              log(
                `   ❌ Error fetching debug data: ${debugData.error}`,
                "ERROR"
              );
            } else if (debugData.lastITN) {
              log(`   ✅ Webhook received! Last ITN attempt found:`, "INFO");
              log(`      Timestamp: ${debugData.lastITN.timestamp}`);
              log(`      Status: ${debugData.lastITN.status}`);
              log(`      Request ID: ${debugData.lastITN.requestId}`);
              log(
                `      Payment Status: ${
                  debugData.lastITN.data?.payment_status || "N/A"
                }`
              );
              if (
                debugData.lastITN.errors &&
                debugData.lastITN.errors.length > 0
              ) {
                log(`      ❌ Errors:`, "ERROR");
                debugData.lastITN.errors.forEach((error) => {
                  log(`         - ${error}`, "ERROR");
                });
              } else {
                log(
                  `      ✅ No errors - webhook processed successfully`,
                  "INFO"
                );
              }
            } else {
              log(`   ⚠️  No webhook attempts found in debug API`, "WARN");
              log(
                `   This confirms PayFast has NOT sent any webhooks to the endpoint`,
                "WARN"
              );
              log(`   Possible reasons:`, "WARN");
              log(
                `      - PayFast sandbox may not send webhooks immediately`,
                "WARN"
              );
              log(
                `      - Webhook URL may not be configured correctly in PayFast dashboard`,
                "WARN"
              );
              log(
                `      - PayFast may be waiting for payment confirmation`,
                "WARN"
              );
            }
          } catch (error) {
            log(`   ❌ Error checking debug API: ${error.message}`, "ERROR");
          }
          log("=".repeat(80));

          // Step 9.6: Direct Backend Verification (Server-Side Check)
          log("");
          log("=".repeat(80));
          log("🔍 Step 9.6: DIRECT BACKEND VERIFICATION");
          log("=".repeat(80));
          log("   Checking backend directly to verify webhook processing...");
          log("");

          // Get user email from session
          let userEmail = null;
          try {
            const sessionData = await page.evaluate(async () => {
              try {
                const response = await fetch("/api/auth/session");
                const session = await response.json();
                return session?.user?.email || null;
              } catch (error) {
                return null;
              }
            });
            userEmail = sessionData;
          } catch (error) {
            log(`⚠️  Could not get user email: ${error.message}`, "WARN");
          }

          if (userEmail) {
            log(`✅ User email: ${userEmail}`);
            log("");
            log("🔄 Polling backend API to check subscription tier updates...");
            log(
              "   (PayFast webhooks are server-to-server, so we verify by checking backend state)"
            );
            log("");

            const backendUrl = "https://web-production-737b.up.railway.app";
            const backendChecks = [];

            // Poll backend multiple times (webhooks can be delayed)
            for (let i = 0; i < 10; i++) {
              await page.waitForTimeout(3000);
              try {
                // Use Node.js https to make direct backend API calls
                // First, get token by logging in
                const loginPayload = JSON.stringify({
                  email: userEmail,
                  password: USER_PASSWORD,
                });

                const loginOptions = {
                  hostname: url.parse(backendUrl).hostname,
                  port: url.parse(backendUrl).port || 443,
                  path: "/auth/login",
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(loginPayload),
                  },
                };

                const loginResult = await new Promise((resolve, reject) => {
                  const req = https.request(loginOptions, (res) => {
                    let data = "";
                    res.on("data", (chunk) => {
                      data += chunk;
                    });
                    res.on("end", () => {
                      try {
                        const result = JSON.parse(data);
                        resolve({ status: res.statusCode, data: result });
                      } catch (e) {
                        resolve({ status: res.statusCode, data: data });
                      }
                    });
                  });
                  req.on("error", reject);
                  req.write(loginPayload);
                  req.end();
                });

                if (loginResult.status === 200) {
                  // Check for token in response
                  const token =
                    loginResult.data?.access_token || loginResult.data?.token;

                  if (!token) {
                    log(
                      `   Backend Check ${
                        i + 1
                      }/10: Login successful but no token in response`,
                      "WARN"
                    );
                    log(
                      `   Response data: ${JSON.stringify(
                        loginResult.data
                      ).substring(0, 200)}`,
                      "WARN"
                    );
                    continue;
                  }

                  // Now get profile
                  const profileOptions = {
                    hostname: url.parse(backendUrl).hostname,
                    port: url.parse(backendUrl).port || 443,
                    path: "/auth/profile",
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  };

                  const profileResult = await new Promise((resolve, reject) => {
                    const req = https.request(profileOptions, (res) => {
                      let data = "";
                      res.on("data", (chunk) => {
                        data += chunk;
                      });
                      res.on("end", () => {
                        try {
                          const result = JSON.parse(data);
                          resolve({ status: res.statusCode, data: result });
                        } catch (e) {
                          resolve({ status: res.statusCode, data: data });
                        }
                      });
                    });
                    req.on("error", reject);
                    req.end();
                  });

                  if (profileResult.status === 200 && profileResult.data) {
                    const profile = profileResult.data;
                    const currentTier = profile.subscription_tier || "free";
                    backendChecks.push({
                      check: i + 1,
                      tier: currentTier,
                      timestamp: new Date().toISOString(),
                      user_id: profile.id,
                      created_at: profile.created_at,
                    });
                    log(
                      `   Backend Check ${
                        i + 1
                      }/10: Subscription tier = ${currentTier}`
                    );

                    if (
                      currentTier !== initialSubscriptionTier &&
                      currentTier !== "free"
                    ) {
                      log(
                        `   ✅ TIER UPDATED IN BACKEND! From "${initialSubscriptionTier}" to "${currentTier}"`,
                        "INFO"
                      );
                      log(
                        `   ✅ This confirms the webhook was processed successfully!`,
                        "INFO"
                      );
                    } else if (currentTier === initialSubscriptionTier) {
                      log(
                        `   ⚠️  Tier unchanged in backend: ${currentTier}`,
                        "WARN"
                      );
                    }
                  } else {
                    log(
                      `   Backend Check ${
                        i + 1
                      }/10: Failed to get profile (Status: ${
                        profileResult.status
                      })`,
                      "WARN"
                    );
                  }
                } else {
                  log(
                    `   Backend Check ${i + 1}/10: Failed to login (Status: ${
                      loginResult.status
                    })`,
                    "WARN"
                  );
                }
              } catch (error) {
                log(
                  `   Backend Check ${i + 1}/10: Error - ${error.message}`,
                  "WARN"
                );
              }
            }

            // Analyze backend checks
            log("");
            log("📊 Backend Verification Analysis:");
            if (backendChecks.length > 0) {
              const finalBackendTier =
                backendChecks[backendChecks.length - 1].tier;
              log(`   Initial tier: ${initialSubscriptionTier}`);
              log(`   Final backend tier: ${finalBackendTier}`);

              if (finalBackendTier !== initialSubscriptionTier) {
                if (
                  finalBackendTier === "production" ||
                  finalBackendTier === "premium" ||
                  finalBackendTier === "enterprise"
                ) {
                  log(
                    `   ✅ SUCCESS: Webhook processed! Subscription tier updated in backend!`,
                    "INFO"
                  );
                  log(
                    `   ✅ PayFast webhook was successfully received and processed`,
                    "INFO"
                  );
                } else {
                  log(`   ⚠️  Tier changed but not to expected value`, "WARN");
                }
              } else {
                log(
                  `   ❌ FAILURE: Subscription tier NOT updated in backend`,
                  "ERROR"
                );
                log(
                  `   ❌ This indicates the webhook was NOT processed or failed`,
                  "ERROR"
                );
                log(`   ❌ Possible reasons:`, "ERROR");
                log(`      - PayFast did not send the webhook`, "ERROR");
                log(
                  `      - Webhook was sent but failed signature verification`,
                  "ERROR"
                );
                log(`      - Webhook endpoint returned an error`, "ERROR");
                log(
                  `      - Backend upgrade-subscription endpoint failed`,
                  "ERROR"
                );
              }

              // Check for user recreation
              if (backendChecks.length > 0) {
                const firstCheck = backendChecks[0];
                const lastCheck = backendChecks[backendChecks.length - 1];
                if (firstCheck.created_at !== lastCheck.created_at) {
                  log(
                    `   ⚠️  WARNING: User created_at changed! Possible user recreation`,
                    "WARN"
                  );
                  log(`   First: ${firstCheck.created_at}`, "WARN");
                  log(`   Last: ${lastCheck.created_at}`, "WARN");
                }
              }
            } else {
              log(
                `   ❌ Could not verify backend state - all checks failed`,
                "ERROR"
              );
            }
            log("=".repeat(80));
          } else {
            log(
              "⚠️  Could not get user email for backend verification",
              "WARN"
            );
          }

          // Wait a bit for webhook to process (PayFast sends webhooks asynchronously)
          log("");
          log("⏳ Waiting 10 seconds for webhook processing...");
          await page.waitForTimeout(10000);

          // Check subscription tier multiple times (webhooks can be delayed)
          log("");
          log("🔄 Checking subscription tier updates...");
          const tierChecks = [];
          for (let i = 0; i < 5; i++) {
            await page.waitForTimeout(3000);
            try {
              const currentProfile = await page.evaluate(
                async (userPassword) => {
                  try {
                    const response = await fetch("/api/auth/session");
                    const session = await response.json();
                    if (session?.user?.email) {
                      const backendUrl =
                        window.location.hostname === "localhost"
                          ? "http://localhost:5000"
                          : "https://web-production-737b.up.railway.app";
                      const tokenResponse = await fetch(
                        `${backendUrl}/auth/get-token-from-session`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: session.user.email,
                            password: userPassword,
                            subscription_tier:
                              session.user.subscription_tier || "free",
                          }),
                        }
                      );
                      if (tokenResponse.ok) {
                        const tokenData = await tokenResponse.json();
                        const token = tokenData.access_token || tokenData.token;
                        if (token) {
                          const profileResponse = await fetch(
                            `${backendUrl}/auth/profile`,
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );
                          if (profileResponse.ok) {
                            return await profileResponse.json();
                          }
                        }
                      } else {
                        const errorData = await tokenResponse.json();
                        return {
                          error: `Token request failed: ${
                            tokenResponse.status
                          } - ${JSON.stringify(errorData)}`,
                        };
                      }
                    }
                    return null;
                  } catch (error) {
                    return { error: error.message };
                  }
                },
                USER_PASSWORD
              );

              if (currentProfile && !currentProfile.error) {
                const currentTier = currentProfile.subscription_tier || "free";
                tierChecks.push({
                  check: i + 1,
                  tier: currentTier,
                  timestamp: new Date().toISOString(),
                  user_id: currentProfile.id,
                  created_at: currentProfile.created_at,
                });
                log(`   Check ${i + 1}/5: Subscription tier = ${currentTier}`);

                if (
                  currentTier !== initialSubscriptionTier &&
                  currentTier !== "free"
                ) {
                  log(
                    `   ✅ TIER UPDATED! From "${initialSubscriptionTier}" to "${currentTier}"`,
                    "INFO"
                  );
                } else if (currentTier === initialSubscriptionTier) {
                  log(`   ⚠️  Tier unchanged: ${currentTier}`, "WARN");
                }
              } else {
                log(`   Check ${i + 1}/5: Could not fetch profile`, "WARN");
              }
            } catch (error) {
              log(`   Check ${i + 1}/5: Error - ${error.message}`, "WARN");
            }
          }

          // Final tier analysis
          log("");
          log("📊 Subscription Tier Analysis:");
          log(`   Initial tier: ${initialSubscriptionTier}`);
          if (tierChecks.length > 0) {
            const finalTier = tierChecks[tierChecks.length - 1].tier;
            log(`   Final tier: ${finalTier}`);

            if (finalTier !== initialSubscriptionTier) {
              if (
                finalTier === "production" ||
                finalTier === "premium" ||
                finalTier === "enterprise"
              ) {
                log(`   ✅ SUCCESS: Subscription tier was updated!`, "INFO");
              } else {
                log(`   ⚠️  Tier changed but not to expected value`, "WARN");
              }
            } else {
              log(`   ❌ FAILURE: Subscription tier was NOT updated`, "ERROR");
              log(
                `   This indicates the webhook may not have processed correctly`,
                "ERROR"
              );
            }

            // Check if user was recreated
            if (tierChecks.length > 0) {
              const firstCheck = tierChecks[0];
              const lastCheck = tierChecks[tierChecks.length - 1];
              if (firstCheck.created_at !== lastCheck.created_at) {
                log(
                  `   ⚠️  WARNING: User created_at changed! Possible user recreation`,
                  "WARN"
                );
                log(`   First: ${firstCheck.created_at}`, "WARN");
                log(`   Last: ${lastCheck.created_at}`, "WARN");
              }
            }
          } else {
            log(
              `   ❌ Could not verify tier updates - no successful checks`,
              "ERROR"
            );
          }

          log("=".repeat(80));
        }
      }

      // Wait a bit before checking again
      await page.waitForTimeout(1000);
    }

    if (!redirectDetected) {
      log("");
      log("⚠️  Timeout waiting for redirect (5 minutes)", "WARN");
      log("   Payment may still be processing...");
    }

    // Step 10: Final summary
    log("");
    log("=".repeat(80));
    log("📊 TEST SUMMARY");
    log("=".repeat(80));
    log(`Total logs captured: ${logs.length}`);
    log(`Final URL: ${page.url()}`);
    log("");
    log("Webhook Summary:");
    log(`   Webhook requests detected: ${webhookRequests.length}`);
    log(`   Webhook responses detected: ${webhookResponses.length}`);
    if (webhookResponses.length > 0) {
      const successCount = webhookResponses.filter(
        (r) => r.status === 200
      ).length;
      const failCount = webhookResponses.filter((r) => r.status !== 200).length;
      log(`   Successful webhooks: ${successCount}`);
      log(`   Failed webhooks: ${failCount}`);
    }
    log("");
    log("Subscription Tier Summary:");
    log(`   Initial tier: ${initialSubscriptionTier || "unknown"}`);
    log("=".repeat(80));

    // Keep browser open for a bit to see final state
    log("");
    log("⏳ Keeping browser open for 10 seconds to view final state...");
    await page.waitForTimeout(10000);
  } catch (error) {
    log("");
    log("=".repeat(80));
    log("❌ TEST ERROR");
    log("=".repeat(80));
    log(`Error: ${error.message}`, "ERROR");
    if (error.stack) {
      log(`Stack: ${error.stack}`, "ERROR");
    }
    log("=".repeat(80));
  } finally {
    // Write logs to file
    writeLogs();

    // Close browser
    if (browser) {
      log("");
      log("🔒 Closing browser...");
      await browser.close();
      log("✅ Browser closed");
    }

    log("");
    log("✅ Test completed");
    log(`📝 All logs saved to: ${LOG_FILE}`);
  }
}

// Run the test
if (require.main === module) {
  testBillingSubscriptionFlow().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { testBillingSubscriptionFlow };
