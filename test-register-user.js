const puppeteer = require("puppeteer");
const path = require("path");

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const REGISTER_URL = `${BASE_URL}/auth/register`;

// Generate a unique email for testing
const timestamp = Date.now();
const testEmail = `testuser${timestamp}@test.com`;
const testPassword = "TestPassword123!";

async function testRegisterUser() {
  let browser;
  let page;

  try {
    console.log("=".repeat(60));
    console.log("🔐 USER REGISTRATION TEST");
    console.log("=".repeat(60));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Register URL: ${REGISTER_URL}`);
    console.log(`Test Email: ${testEmail}`);
    console.log(`Test Password: ${testPassword}`);
    console.log("=".repeat(60));

    // Launch browser
    console.log("\n📋 Step 1: Launching browser...");
    browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();

    // Set up download behavior
    const outputDir = path.join(__dirname, "test-output-files");
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: outputDir,
    });

    // Navigate to register page
    console.log("\n📋 Step 2: Navigating to register page...");
    console.log(`   ${REGISTER_URL}`);
    await page.goto(REGISTER_URL, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Handle cookie consent
    console.log("\n📋 Step 3: Handling cookie consent...");
    try {
      const [rejectButton] = await page.$x(
        "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reject')]"
      );
      if (rejectButton) {
        await rejectButton.click();
        await page.waitForTimeout(2000);
        console.log("   ✅ Cookie consent handled");
      }
    } catch (e) {
      console.log("   ⚠️  Cookie consent not found or already handled");
    }

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check if page loaded correctly
    console.log("\n📋 Step 4: Verifying page loaded...");
    const pageTitle = await page.title();
    const heading = await page.evaluate(() => {
      const h2 = document.querySelector("h2");
      return h2 ? h2.textContent.trim() : null;
    });
    console.log(`   Page Title: ${pageTitle}`);
    console.log(`   Heading: ${heading}`);

    if (!heading || !heading.includes("Create your account")) {
      throw new Error("Register page did not load correctly");
    }
    console.log("   ✅ Page loaded correctly");

    // Fill in email field
    console.log("\n📋 Step 5: Filling in registration form...");
    const emailInput = await page.$('input[name="email"]');
    if (!emailInput) {
      throw new Error("Email input field not found");
    }
    await emailInput.click();
    await page.waitForTimeout(500);
    await emailInput.type(testEmail, { delay: 100 });
    console.log(`   ✅ Email entered: ${testEmail}`);

    // Fill in password field
    const passwordInput = await page.$('input[name="password"]');
    if (!passwordInput) {
      throw new Error("Password input field not found");
    }
    await passwordInput.click();
    await page.waitForTimeout(500);
    await passwordInput.type(testPassword, { delay: 100 });
    console.log(`   ✅ Password entered`);

    // Fill in confirm password field
    const confirmPasswordInput = await page.$('input[name="confirmPassword"]');
    if (!confirmPasswordInput) {
      throw new Error("Confirm password input field not found");
    }
    await confirmPasswordInput.click();
    await page.waitForTimeout(500);
    await confirmPasswordInput.type(testPassword, { delay: 100 });
    console.log(`   ✅ Confirm password entered`);

    // Wait a bit for validation to complete
    await page.waitForTimeout(1500);

    // Check the REQUIRED terms checkbox
    console.log("   🔍 Looking for terms checkbox...");
    const termsCheckbox = await page.$(
      'input[id="agree-terms"], input[name="agree-terms"]'
    );
    if (!termsCheckbox) {
      throw new Error("Terms checkbox not found - this is REQUIRED");
    }

    // Check if it's already checked
    const isChecked = await page.evaluate((el) => el.checked, termsCheckbox);
    if (!isChecked) {
      await termsCheckbox.click();
      await page.waitForTimeout(500);
      console.log("   ✅ Terms checkbox checked");
    } else {
      console.log("   ✅ Terms checkbox already checked");
    }

    // Verify checkbox is checked
    const isCheckedAfter = await page.evaluate(
      (el) => el.checked,
      termsCheckbox
    );
    if (!isCheckedAfter) {
      throw new Error("Terms checkbox could not be checked");
    }

    // Check for any validation errors before submitting
    const validationErrors = await page.evaluate(() => {
      const errorDiv = document.querySelector(
        '[class*="error"], [class*="red"]'
      );
      return errorDiv ? errorDiv.textContent.trim() : null;
    });
    if (validationErrors) {
      console.log(`   ⚠️  Validation error detected: ${validationErrors}`);
    }

    // Verify submit button is enabled (it's disabled if validation fails)
    console.log("\n📋 Step 6: Verifying form is ready to submit...");
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error("Submit button not found");
    }

    const isSubmitDisabled = await page.evaluate(
      (el) => el.disabled,
      submitButton
    );
    if (isSubmitDisabled) {
      // Check why it's disabled
      const passwordValid = await page.evaluate(() => {
        const password = document.querySelector('input[name="password"]').value;
        return (
          password.length >= 8 &&
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /\d/.test(password)
        );
      });

      const passwordsMatch = await page.evaluate(() => {
        const password = document.querySelector('input[name="password"]').value;
        const confirmPassword = document.querySelector(
          'input[name="confirmPassword"]'
        ).value;
        return password === confirmPassword;
      });

      const termsChecked = await page.evaluate(
        (el) => el.checked,
        termsCheckbox
      );

      console.log(`   ⚠️  Submit button is disabled:`);
      console.log(`      Password valid: ${passwordValid}`);
      console.log(`      Passwords match: ${passwordsMatch}`);
      console.log(`      Terms checked: ${termsChecked}`);

      throw new Error("Submit button is disabled - form validation failed");
    }
    console.log("   ✅ Submit button is enabled and ready");

    // Submit the form
    console.log("\n📋 Step 7: Submitting registration form...");

    // Listen for ALL network responses to capture API calls
    const allResponses = [];
    const apiResponses = [];

    page.on("response", async (response) => {
      const url = response.url();
      const status = response.status();

      allResponses.push({
        url,
        status,
        statusText: response.statusText(),
      });

      // Capture register API response
      if (url.includes("/auth/register")) {
        try {
          const responseBody = await response.text();
          apiResponses.push({
            url,
            status,
            statusText: response.statusText(),
            body: responseBody,
          });
        } catch (e) {
          apiResponses.push({
            url,
            status,
            statusText: response.statusText(),
            body: "Could not read response body",
          });
        }
      }

      // Capture login API response
      if (
        url.includes("/auth/login") ||
        url.includes("/api/auth/callback/credentials")
      ) {
        try {
          const responseBody = await response.text();
          apiResponses.push({
            url,
            status,
            statusText: response.statusText(),
            body: responseBody,
          });
        } catch (e) {
          apiResponses.push({
            url,
            status,
            statusText: response.statusText(),
            body: "Could not read response body",
          });
        }
      }
    });

    // Listen for console messages
    const consoleMessages = [];
    page.on("console", (msg) => {
      const text = msg.text();
      consoleMessages.push({
        type: msg.type(),
        text: text,
      });
      if (msg.type() === "error") {
        console.log(`   ⚠️  Console ${msg.type()}: ${text}`);
      }
    });

    // Click submit button
    await submitButton.click();
    console.log("   ✅ Submit button clicked");

    // Wait for navigation to dashboard (this is the key - wait for the actual redirect)
    console.log("   ⏳ Waiting for registration and redirect to dashboard...");
    console.log(
      "   ⏳ This may take up to 30 seconds (API call + auto-login + redirect)..."
    );

    try {
      // Wait for navigation to dashboard or admin page
      await page.waitForNavigation({
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      const finalUrl = page.url();
      console.log(`   ✅ Navigation completed to: ${finalUrl}`);

      if (finalUrl.includes("/dashboard") || finalUrl.includes("/admin")) {
        console.log(
          "   ✅ SUCCESS: User registered and redirected to dashboard!"
        );
      } else if (finalUrl.includes("/auth/login")) {
        console.log(
          "   ⚠️  Redirected to login page (registration may have failed)"
        );
      } else {
        console.log(`   ⚠️  Unexpected redirect to: ${finalUrl}`);
      }
    } catch (navError) {
      // Navigation timeout - check what happened
      console.log("   ⚠️  Navigation timeout - checking current state...");
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);

      // Check if we're still on register page
      if (currentUrl.includes("/auth/register")) {
        // Check for errors or success messages
        const pageContent = await page.evaluate(
          () => document.body.textContent
        );
        const hasError =
          pageContent.includes("Error") ||
          pageContent.includes("error") ||
          pageContent.includes("failed");
        const hasSuccess =
          pageContent.includes("Success") || pageContent.includes("success");

        if (hasError) {
          console.log("   ❌ Error detected on page");
        } else if (hasSuccess) {
          console.log("   ⚠️  Success message but no redirect - may be stuck");
        } else {
          console.log("   ⚠️  Still on register page with no clear status");
        }
      }
    }

    // Check for success or error messages
    console.log("\n📋 Step 8: Checking registration result...");

    // Check for error message (more thorough)
    const errorMessage = await page.evaluate(() => {
      // Try multiple selectors
      const selectors = [
        '[class*="error"]',
        '[class*="red"]',
        '[role="alert"]',
        ".text-red",
        ".text-red-400",
        ".text-red-300",
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent.trim();
          if (
            text &&
            text.length > 10 &&
            !text.includes("Password requirements")
          ) {
            return text;
          }
        }
      }
      return null;
    });

    // Check for success message (more thorough)
    const successMessage = await page.evaluate(() => {
      const selectors = [
        '[class*="success"]',
        '[class*="green"]',
        ".text-green",
        ".text-green-400",
        ".text-green-300",
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent.trim();
          if (text && text.length > 10 && !text.includes("At least")) {
            return text;
          }
        }
      }
      return null;
    });

    // Also check for any visible error/success text in the page
    const pageText = await page.evaluate(() => document.body.textContent);
    const hasErrorInText =
      pageText.includes("Error") ||
      pageText.includes("error") ||
      pageText.includes("failed");
    const hasSuccessInText =
      pageText.includes("Success") ||
      pageText.includes("success") ||
      pageText.includes("registered");

    // Check current URL
    const currentUrl = page.url();
    console.log(`\n   Final URL: ${currentUrl}`);

    // Log ALL API responses
    if (apiResponses.length > 0) {
      console.log("\n📊 API RESPONSES:");
      apiResponses.forEach((resp, index) => {
        console.log(`\n   ${index + 1}. ${resp.url}`);
        console.log(`      Status: ${resp.status} ${resp.statusText}`);
        if (resp.body && resp.body.length < 500) {
          console.log(`      Body: ${resp.body.substring(0, 200)}`);
        }
      });
    } else {
      console.log("\n⚠️  No API responses captured");
    }

    // Log important network responses
    if (allResponses.length > 0) {
      const importantResponses = allResponses.filter(
        (r) =>
          r.url.includes("/auth/") || r.url.includes("/api/") || r.status >= 400
      );

      if (importantResponses.length > 0) {
        console.log("\n📡 Important Network Responses:");
        importantResponses.forEach((resp, index) => {
          console.log(`   ${index + 1}. ${resp.status} - ${resp.url}`);
        });
      }
    }

    // Check if redirected
    if (
      currentUrl.includes("/dashboard") ||
      currentUrl.includes("/auth/login")
    ) {
      console.log("   ✅ Redirected after registration");
      if (currentUrl.includes("/dashboard")) {
        console.log("   ✅ Registration successful - redirected to dashboard");
      } else {
        console.log("   ⚠️  Redirected to login page (may need to login)");
      }
    }

    // Report results
    console.log("\n" + "=".repeat(60));
    console.log("📊 REGISTRATION TEST RESULTS");
    console.log("=".repeat(60));
    console.log(`Test Email: ${testEmail}`);
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Has Error in Text: ${hasErrorInText ? "Yes" : "No"}`);
    console.log(`Has Success in Text: ${hasSuccessInText ? "Yes" : "No"}`);

    if (errorMessage) {
      console.log(`\n❌ ERROR MESSAGE:`);
      console.log(`   ${errorMessage}`);
    }

    if (successMessage) {
      console.log(`\n✅ SUCCESS MESSAGE:`);
      console.log(`   ${successMessage}`);
    }

    // Check for network errors
    const networkErrors = allResponses.filter((r) => r.status >= 400);
    if (networkErrors.length > 0) {
      console.log(`\n❌ NETWORK ERRORS:`);
      networkErrors.forEach((err) => {
        console.log(`   ${err.status} ${err.statusText} - ${err.url}`);
      });
    }

    // Check console errors
    const consoleErrors = consoleMessages.filter((m) => m.type === "error");
    if (consoleErrors.length > 0) {
      console.log(`\n⚠️  CONSOLE ERRORS:`);
      consoleErrors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.text}`);
      });
    }

    // Removed duplicate responses logging - already logged above

    // Final verification - check if we're on dashboard
    if (currentUrl.includes("/dashboard")) {
      console.log("\n✅ VERIFICATION: User is on dashboard page");

      // Check if user is actually logged in by looking for dashboard content
      const dashboardContent = await page.evaluate(() => {
        const heading = document.querySelector("h1, h2, h3");
        return heading ? heading.textContent.trim() : null;
      });

      if (dashboardContent) {
        console.log(`   Dashboard heading: ${dashboardContent}`);
      }

      // Check for user email or profile info
      const userInfo = await page.evaluate((email) => {
        const text = document.body.textContent;
        return text.includes(email)
          ? "User email found on page"
          : "User email not found";
      }, testEmail);
      console.log(`   ${userInfo}`);

      console.log("\n" + "=".repeat(60));
      console.log("✅ TEST COMPLETED - USER IS ON DASHBOARD");
      console.log("=".repeat(60));
      console.log("\n🛑 BROWSER WILL STAY OPEN FOR 60 SECONDS");
      console.log("   You can inspect the dashboard now...");
      console.log("   Browser will close automatically in 60 seconds...\n");
      
      // Keep browser open for 60 seconds so user can see the dashboard
      await page.waitForTimeout(60000);
      
      // Don't close browser in finally block if we're on dashboard
      browser = null; // Prevent closing
    } else if (currentUrl.includes("/admin")) {
      console.log("\n✅ VERIFICATION: User is on admin page (super admin)");
      console.log("\n🛑 BROWSER WILL STAY OPEN FOR 60 SECONDS");
      console.log("   You can inspect the admin page now...");
      await page.waitForTimeout(60000);
    } else {
      console.log(
        `\n⚠️  VERIFICATION: User is NOT on dashboard. Current URL: ${currentUrl}`
      );
      console.log("\n" + "=".repeat(60));
      console.log("✅ TEST COMPLETED");
      console.log("=".repeat(60));
    }
  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  } finally {
    // Only close browser if we didn't reach dashboard (or if there was an error)
    if (browser) {
      const finalUrl = page ? page.url() : "";
      if (!finalUrl.includes("/dashboard") && !finalUrl.includes("/admin")) {
        console.log("\n🔒 Closing browser...");
        await browser.close();
      } else {
        console.log("\n🛑 Browser will remain open - user is on dashboard/admin page");
        console.log("   Close the browser window manually when done inspecting.");
      }
    }
  }
}

// Run the test
testRegisterUser().catch(console.error);
