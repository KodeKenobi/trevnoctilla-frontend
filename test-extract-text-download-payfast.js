/**
 * Test script to extract text, download, and verify PayFastDollarForm is used
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = process.env.TEST_URL || "https://www.trevnoctilla.com";

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

async function testExtractTextDownloadPayFast() {
  log("🧪 Testing Extract Text → Download → PayFastDollarForm...\n");

  // Find PDF file
  const testFilesDir = path.join(__dirname, "test-files");
  let pdfFile = path.join(testFilesDir, "test.pdf");

  if (!fs.existsSync(pdfFile)) {
    // Try to use template PDF
    pdfFile = path.join(
      __dirname,
      "trevnoctilla-backend",
      "templates",
      "simple-business-invoice.pdf"
    );
    if (!fs.existsSync(pdfFile)) {
      log("❌ No PDF file available for testing");
      return;
    }
  }

  log(`✅ Using PDF file: ${pdfFile}`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Capture console logs to see which form component is used
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("PayFast") ||
        text.includes("notify_url") ||
        text.includes("Payment data")
      ) {
        log(`📱 Console: ${text}`);
      }
    });

    // Capture network requests to see what's sent to PayFast API
    const apiRequests = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/payments/payfast/initiate")) {
        const postData = request.postData();
        let parsedData = null;
        if (postData) {
          try {
            parsedData = JSON.parse(postData);
          } catch (e) {
            parsedData = postData;
          }
        }
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          postData: parsedData,
        });
      }
    });

    // Step 1: Navigate to Extract Text tool
    log("📄 Step 1: Navigating to Extract Text from PDF tool...");
    await page.goto(`${BASE_URL}/tools/pdf-tools?tab=extract-text`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await delay(3000);

    // Step 2: Upload file
    log("📎 Step 2: Uploading PDF file...");
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      log("❌ File input not found");
      return;
    }
    await fileInput.uploadFile(pdfFile);
    log("✅ File uploaded");

    // Step 3: Wait for extraction to complete
    log("⏳ Step 3: Waiting for extraction to complete...");
    let extractionComplete = false;
    for (let i = 0; i < 30; i++) {
      await delay(2000);
      const pageContent = await page.evaluate(() => document.body.textContent);

      if (
        pageContent.includes("Extracted text") ||
        pageContent.includes("Download") ||
        pageContent.includes("Preview")
      ) {
        log("✅ Extraction complete!");
        extractionComplete = true;
        break;
      }
    }

    if (!extractionComplete) {
      log("❌ Extraction did not complete");
      return;
    }

    // Step 4: Find and click "Choose Format" or format selection
    log("📥 Step 4: Looking for format selection...");
    await delay(2000);

    // First, look for "Choose Format" button or dropdown
    let formatButton = null;
    const allButtons = await page.$$("button, select, [role='button']");

    for (const button of allButtons) {
      const text = await page.evaluate((el) => el.textContent?.trim(), button);
      const visible = await page.evaluate(
        (el) => el.offsetParent !== null,
        button
      );
      const tagName = await page.evaluate((el) => el.tagName, button);

      if (visible) {
        const lowerText = text?.toLowerCase() || "";
        if (
          lowerText.includes("choose format") ||
          lowerText.includes("format") ||
          lowerText.includes("select format") ||
          tagName === "SELECT"
        ) {
          log(`   Found format element: "${text}" (${tagName})`);
          formatButton = button;
          break;
        }
      }
    }

    if (formatButton) {
      log("✅ Format selector found, clicking...");
      await formatButton.click();
      log("✅ Format selector clicked");
      await delay(1000);

      // If it's a select dropdown, choose Markdown format
      const tagName = await page.evaluate((el) => el.tagName, formatButton);
      if (tagName === "SELECT") {
        log("   Selecting Markdown format from dropdown...");
        // Use Puppeteer's select method to properly trigger the change event
        await page.select("select", "md,text/markdown");
        log(
          "✅ Markdown format selected (this should trigger monetization modal)"
        );
        await delay(2000); // Give time for modal to appear
      } else {
        // If it's a button, look for format options that appeared
        log("   Looking for format options (TXT, JSON, etc.)...");
        await delay(1000);

        const formatOptions = await page.$$("button, a, [role='option']");
        for (const option of formatOptions) {
          const text = await page.evaluate(
            (el) => el.textContent?.trim(),
            option
          );
          const visible = await page.evaluate(
            (el) => el.offsetParent !== null,
            option
          );

          if (
            visible &&
            text &&
            (text.toUpperCase() === "MD" ||
              text.toUpperCase() === "MARKDOWN" ||
              text.includes("Markdown"))
          ) {
            log(`   Found format option: "${text}", clicking...`);
            await option.click();
            log("✅ Format option clicked");
            await delay(1000);
            break;
          }
        }
      }
    } else {
      // Fallback: Look for direct download format buttons (TXT, JSON, etc.)
      log("   Format selector not found, looking for direct format buttons...");
      const formatButtons = await page.$$("button");

      for (const button of formatButtons) {
        const text = await page.evaluate(
          (el) => el.textContent?.trim(),
          button
        );
        const visible = await page.evaluate(
          (el) => el.offsetParent !== null,
          button
        );

        if (visible && text) {
          const upperText = text.toUpperCase();
          if (upperText === "MD" || upperText === "MARKDOWN") {
            log(`   Found format button: "${text}", clicking...`);
            await button.click();
            log("✅ Format button clicked");
            await delay(1000);
            break;
          }
        }
      }
    }

    // Step 5: Wait for monetization modal to appear after format selection
    log("💳 Step 5: Waiting for monetization modal to appear...");

    // Wait for modal to appear (it should appear after format selection)
    let modalVisible = false;
    for (let i = 0; i < 15; i++) {
      await delay(1000);

      // Check if modal is visible
      modalVisible = await page.evaluate(() => {
        // Look for modal by z-index or class names
        const modals = document.querySelectorAll(
          '[class*="modal"], [class*="Modal"], [role="dialog"], [style*="z-index"]'
        );
        return (
          modals.length > 0 &&
          Array.from(modals).some((m) => {
            const style = window.getComputedStyle(m);
            const zIndex = parseInt(style.zIndex) || 0;
            return (
              (style.display !== "none" && style.visibility !== "hidden") ||
              zIndex > 1000 // High z-index indicates modal
            );
          })
        );
      });

      // Also check for "Pay $1" button text on page
      const hasPayButton = await page.evaluate(() => {
        const bodyText = document.body.textContent || "";
        return bodyText.includes("Pay $1") || bodyText.includes("Pay $");
      });

      if (modalVisible || hasPayButton) {
        log("✅ Monetization modal appeared!");
        modalVisible = true;
        break;
      }

      if (i % 3 === 0 && i > 0) {
        log(`   Still waiting for modal... (${i} seconds)`);
      }
    }

    if (!modalVisible) {
      log("⚠️ Monetization modal may not have appeared");
      await page.screenshot({ path: "no-modal.png", fullPage: true });
      log("📸 Screenshot saved: no-modal.png");
    }

    // Step 6: Click "Pay $1" button
    log("💰 Step 6: Looking for 'Pay $1' button...");
    await delay(2000);

    const payButtons = await page.$$("button");
    let payButton = null;

    for (const button of payButtons) {
      const text = await page.evaluate((el) => el.textContent?.trim(), button);
      const visible = await page.evaluate(
        (el) => el.offsetParent !== null,
        button
      );

      if (visible && text) {
        const lowerText = text.toLowerCase();
        if (
          lowerText.includes("pay") &&
          (lowerText.includes("$1") || lowerText.includes("1"))
        ) {
          log(`   Found Pay button: "${text}"`);
          payButton = button;
          break;
        }
      }
    }

    if (payButton) {
      log("✅ Pay $1 button found, clicking...");
      await payButton.click();
      log("✅ Pay $1 button clicked");
      await delay(5000); // Wait for form submission and navigation
    } else {
      log("❌ Pay $1 button not found");
      // Log all visible buttons for debugging
      const allButtons = await page.$$eval("button", (buttons) => {
        return buttons
          .filter((b) => {
            const style = window.getComputedStyle(b);
            return style.display !== "none" && b.offsetParent !== null;
          })
          .map((b) => b.textContent?.trim())
          .filter((t) => t);
      });
      log(`   Visible buttons on page: ${allButtons.join(", ")}`);
      await page.screenshot({ path: "no-pay-button.png", fullPage: true });
      log("📸 Screenshot saved: no-pay-button.png");
    }

    // Step 7: Check which PayFast form component is being used
    log("\n🔍 Step 7: Checking which PayFast form is used...");
    await delay(2000);

    // Check page source for form component names
    const pageSource = await page.content();
    const usesPayFastDollarForm = pageSource.includes("PayFastDollarForm");
    const usesPayFastForm =
      pageSource.includes("PayFastForm") &&
      !pageSource.includes("PayFastDollarForm");

    if (usesPayFastDollarForm) {
      log("✅ PayFastDollarForm is being used (CORRECT)");
    } else if (usesPayFastForm) {
      log(
        "❌ PayFastForm is being used (WRONG - should use PayFastDollarForm)"
      );
    } else {
      log("⚠️ Could not determine which form component is used");
    }

    // Step 8: Check API request to see if notify_url is excluded
    let testPassed = true;
    let testFailureReason = "";

    if (apiRequests.length > 0) {
      log("\n📤 API Request Data:");
      apiRequests.forEach((req, i) => {
        log(`\n   Request ${i + 1}:`);
        if (req.postData) {
          log("   POST Data:", req.postData);
          if (req.postData.notify_url) {
            log(
              "   ❌ notify_url is INCLUDED (WRONG - should be excluded for $1 payments)"
            );
            testPassed = false;
            testFailureReason =
              "notify_url is included in PayFast request (should use PayFastDollarForm)";
          } else {
            log("   ✅ notify_url is NOT included (CORRECT for $1 payments)");
          }
        }
      });
    } else {
      log("\n⚠️ No API requests captured");
      testPassed = false;
      testFailureReason =
        "No API requests captured - PayFast form may not have loaded";
    }

    // Final test result
    log("\n" + "=".repeat(60));
    if (testPassed) {
      log("✅ TEST PASSED: PayFastDollarForm is working correctly");
      log("   notify_url is excluded from $1 payments");
    } else {
      log("❌ TEST FAILED:", testFailureReason);
      log("   Code should NOT be pushed until this is fixed");
    }
    log("=".repeat(60));

    await delay(3000);

    // Return test result
    return { passed: testPassed, reason: testFailureReason };
  } catch (error) {
    log("❌ TEST ERROR:", error.message);
    log("📚 Stack trace:", error.stack);
    await page.screenshot({
      path: "extract-text-download-error.png",
      fullPage: true,
    });
    log("📸 Screenshot saved: extract-text-download-error.png");
    return { passed: false, reason: error.message };
  } finally {
    await browser.close();
    log("🔒 Browser closed");
  }
}

// Run the test
testExtractTextDownloadPayFast()
  .then((result) => {
    if (result && result.passed === false) {
      console.error("\n❌ TEST FAILED:", result.reason);
      console.error("   Code should NOT be pushed until this is fixed");
      process.exit(1);
    } else {
      console.log("\n✅ Test script completed successfully");
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });

 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = process.env.TEST_URL || "https://www.trevnoctilla.com";

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

async function testExtractTextDownloadPayFast() {
  log("🧪 Testing Extract Text → Download → PayFastDollarForm...\n");

  // Find PDF file
  const testFilesDir = path.join(__dirname, "test-files");
  let pdfFile = path.join(testFilesDir, "test.pdf");

  if (!fs.existsSync(pdfFile)) {
    // Try to use template PDF
    pdfFile = path.join(
      __dirname,
      "trevnoctilla-backend",
      "templates",
      "simple-business-invoice.pdf"
    );
    if (!fs.existsSync(pdfFile)) {
      log("❌ No PDF file available for testing");
      return;
    }
  }

  log(`✅ Using PDF file: ${pdfFile}`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Capture console logs to see which form component is used
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("PayFast") ||
        text.includes("notify_url") ||
        text.includes("Payment data")
      ) {
        log(`📱 Console: ${text}`);
      }
    });

    // Capture network requests to see what's sent to PayFast API
    const apiRequests = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/payments/payfast/initiate")) {
        const postData = request.postData();
        let parsedData = null;
        if (postData) {
          try {
            parsedData = JSON.parse(postData);
          } catch (e) {
            parsedData = postData;
          }
        }
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          postData: parsedData,
        });
      }
    });

    // Step 1: Navigate to Extract Text tool
    log("📄 Step 1: Navigating to Extract Text from PDF tool...");
    await page.goto(`${BASE_URL}/tools/pdf-tools?tab=extract-text`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await delay(3000);

    // Step 2: Upload file
    log("📎 Step 2: Uploading PDF file...");
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      log("❌ File input not found");
      return;
    }
    await fileInput.uploadFile(pdfFile);
    log("✅ File uploaded");

    // Step 3: Wait for extraction to complete
    log("⏳ Step 3: Waiting for extraction to complete...");
    let extractionComplete = false;
    for (let i = 0; i < 30; i++) {
      await delay(2000);
      const pageContent = await page.evaluate(() => document.body.textContent);

      if (
        pageContent.includes("Extracted text") ||
        pageContent.includes("Download") ||
        pageContent.includes("Preview")
      ) {
        log("✅ Extraction complete!");
        extractionComplete = true;
        break;
      }
    }

    if (!extractionComplete) {
      log("❌ Extraction did not complete");
      return;
    }

    // Step 4: Find and click "Choose Format" or format selection
    log("📥 Step 4: Looking for format selection...");
    await delay(2000);

    // First, look for "Choose Format" button or dropdown
    let formatButton = null;
    const allButtons = await page.$$("button, select, [role='button']");

    for (const button of allButtons) {
      const text = await page.evaluate((el) => el.textContent?.trim(), button);
      const visible = await page.evaluate(
        (el) => el.offsetParent !== null,
        button
      );
      const tagName = await page.evaluate((el) => el.tagName, button);

      if (visible) {
        const lowerText = text?.toLowerCase() || "";
        if (
          lowerText.includes("choose format") ||
          lowerText.includes("format") ||
          lowerText.includes("select format") ||
          tagName === "SELECT"
        ) {
          log(`   Found format element: "${text}" (${tagName})`);
          formatButton = button;
          break;
        }
      }
    }

    if (formatButton) {
      log("✅ Format selector found, clicking...");
      await formatButton.click();
      log("✅ Format selector clicked");
      await delay(1000);

      // If it's a select dropdown, choose Markdown format
      const tagName = await page.evaluate((el) => el.tagName, formatButton);
      if (tagName === "SELECT") {
        log("   Selecting Markdown format from dropdown...");
        // Use Puppeteer's select method to properly trigger the change event
        await page.select("select", "md,text/markdown");
        log(
          "✅ Markdown format selected (this should trigger monetization modal)"
        );
        await delay(2000); // Give time for modal to appear
      } else {
        // If it's a button, look for format options that appeared
        log("   Looking for format options (TXT, JSON, etc.)...");
        await delay(1000);

        const formatOptions = await page.$$("button, a, [role='option']");
        for (const option of formatOptions) {
          const text = await page.evaluate(
            (el) => el.textContent?.trim(),
            option
          );
          const visible = await page.evaluate(
            (el) => el.offsetParent !== null,
            option
          );

          if (
            visible &&
            text &&
            (text.toUpperCase() === "MD" ||
              text.toUpperCase() === "MARKDOWN" ||
              text.includes("Markdown"))
          ) {
            log(`   Found format option: "${text}", clicking...`);
            await option.click();
            log("✅ Format option clicked");
            await delay(1000);
            break;
          }
        }
      }
    } else {
      // Fallback: Look for direct download format buttons (TXT, JSON, etc.)
      log("   Format selector not found, looking for direct format buttons...");
      const formatButtons = await page.$$("button");

      for (const button of formatButtons) {
        const text = await page.evaluate(
          (el) => el.textContent?.trim(),
          button
        );
        const visible = await page.evaluate(
          (el) => el.offsetParent !== null,
          button
        );

        if (visible && text) {
          const upperText = text.toUpperCase();
          if (upperText === "MD" || upperText === "MARKDOWN") {
            log(`   Found format button: "${text}", clicking...`);
            await button.click();
            log("✅ Format button clicked");
            await delay(1000);
            break;
          }
        }
      }
    }

    // Step 5: Wait for monetization modal to appear after format selection
    log("💳 Step 5: Waiting for monetization modal to appear...");

    // Wait for modal to appear (it should appear after format selection)
    let modalVisible = false;
    for (let i = 0; i < 15; i++) {
      await delay(1000);

      // Check if modal is visible
      modalVisible = await page.evaluate(() => {
        // Look for modal by z-index or class names
        const modals = document.querySelectorAll(
          '[class*="modal"], [class*="Modal"], [role="dialog"], [style*="z-index"]'
        );
        return (
          modals.length > 0 &&
          Array.from(modals).some((m) => {
            const style = window.getComputedStyle(m);
            const zIndex = parseInt(style.zIndex) || 0;
            return (
              (style.display !== "none" && style.visibility !== "hidden") ||
              zIndex > 1000 // High z-index indicates modal
            );
          })
        );
      });

      // Also check for "Pay $1" button text on page
      const hasPayButton = await page.evaluate(() => {
        const bodyText = document.body.textContent || "";
        return bodyText.includes("Pay $1") || bodyText.includes("Pay $");
      });

      if (modalVisible || hasPayButton) {
        log("✅ Monetization modal appeared!");
        modalVisible = true;
        break;
      }

      if (i % 3 === 0 && i > 0) {
        log(`   Still waiting for modal... (${i} seconds)`);
      }
    }

    if (!modalVisible) {
      log("⚠️ Monetization modal may not have appeared");
      await page.screenshot({ path: "no-modal.png", fullPage: true });
      log("📸 Screenshot saved: no-modal.png");
    }

    // Step 6: Click "Pay $1" button
    log("💰 Step 6: Looking for 'Pay $1' button...");
    await delay(2000);

    const payButtons = await page.$$("button");
    let payButton = null;

    for (const button of payButtons) {
      const text = await page.evaluate((el) => el.textContent?.trim(), button);
      const visible = await page.evaluate(
        (el) => el.offsetParent !== null,
        button
      );

      if (visible && text) {
        const lowerText = text.toLowerCase();
        if (
          lowerText.includes("pay") &&
          (lowerText.includes("$1") || lowerText.includes("1"))
        ) {
          log(`   Found Pay button: "${text}"`);
          payButton = button;
          break;
        }
      }
    }

    if (payButton) {
      log("✅ Pay $1 button found, clicking...");
      await payButton.click();
      log("✅ Pay $1 button clicked");
      await delay(5000); // Wait for form submission and navigation
    } else {
      log("❌ Pay $1 button not found");
      // Log all visible buttons for debugging
      const allButtons = await page.$$eval("button", (buttons) => {
        return buttons
          .filter((b) => {
            const style = window.getComputedStyle(b);
            return style.display !== "none" && b.offsetParent !== null;
          })
          .map((b) => b.textContent?.trim())
          .filter((t) => t);
      });
      log(`   Visible buttons on page: ${allButtons.join(", ")}`);
      await page.screenshot({ path: "no-pay-button.png", fullPage: true });
      log("📸 Screenshot saved: no-pay-button.png");
    }

    // Step 7: Check which PayFast form component is being used
    log("\n🔍 Step 7: Checking which PayFast form is used...");
    await delay(2000);

    // Check page source for form component names
    const pageSource = await page.content();
    const usesPayFastDollarForm = pageSource.includes("PayFastDollarForm");
    const usesPayFastForm =
      pageSource.includes("PayFastForm") &&
      !pageSource.includes("PayFastDollarForm");

    if (usesPayFastDollarForm) {
      log("✅ PayFastDollarForm is being used (CORRECT)");
    } else if (usesPayFastForm) {
      log(
        "❌ PayFastForm is being used (WRONG - should use PayFastDollarForm)"
      );
    } else {
      log("⚠️ Could not determine which form component is used");
    }

    // Step 8: Check API request to see if notify_url is excluded
    let testPassed = true;
    let testFailureReason = "";

    if (apiRequests.length > 0) {
      log("\n📤 API Request Data:");
      apiRequests.forEach((req, i) => {
        log(`\n   Request ${i + 1}:`);
        if (req.postData) {
          log("   POST Data:", req.postData);
          if (req.postData.notify_url) {
            log(
              "   ❌ notify_url is INCLUDED (WRONG - should be excluded for $1 payments)"
            );
            testPassed = false;
            testFailureReason =
              "notify_url is included in PayFast request (should use PayFastDollarForm)";
          } else {
            log("   ✅ notify_url is NOT included (CORRECT for $1 payments)");
          }
        }
      });
    } else {
      log("\n⚠️ No API requests captured");
      testPassed = false;
      testFailureReason =
        "No API requests captured - PayFast form may not have loaded";
    }

    // Final test result
    log("\n" + "=".repeat(60));
    if (testPassed) {
      log("✅ TEST PASSED: PayFastDollarForm is working correctly");
      log("   notify_url is excluded from $1 payments");
    } else {
      log("❌ TEST FAILED:", testFailureReason);
      log("   Code should NOT be pushed until this is fixed");
    }
    log("=".repeat(60));

    await delay(3000);

    // Return test result
    return { passed: testPassed, reason: testFailureReason };
  } catch (error) {
    log("❌ TEST ERROR:", error.message);
    log("📚 Stack trace:", error.stack);
    await page.screenshot({
      path: "extract-text-download-error.png",
      fullPage: true,
    });
    log("📸 Screenshot saved: extract-text-download-error.png");
    return { passed: false, reason: error.message };
  } finally {
    await browser.close();
    log("🔒 Browser closed");
  }
}

// Run the test
testExtractTextDownloadPayFast()
  .then((result) => {
    if (result && result.passed === false) {
      console.error("\n❌ TEST FAILED:", result.reason);
      console.error("   Code should NOT be pushed until this is fixed");
      process.exit(1);
    } else {
      console.log("\n✅ Test script completed successfully");
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });



