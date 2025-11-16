const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

async function testPayFastFormStructure() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();

  // Capture console logs
  page.on("console", (msg) => {
    const text = msg.text();
    if (
      text.includes("PayFast") ||
      text.includes("payment") ||
      text.includes("error")
    ) {
      log(`📱 Console: ${text}`);
    }
  });

  try {
    log("🧪 Testing PayFast Form Structure...");

    // Step 1: Navigate to extract text tool
    log("📄 Step 1: Navigating to Extract Text from PDF tool...");
    await page.goto(`${BASE_URL}/tools/pdf-tools?tab=extract-text`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Step 2: Upload PDF
    log("📎 Step 2: Uploading PDF file...");
    const pdfPath = path.join(__dirname, "test-files", "test.pdf");
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      throw new Error("File input not found");
    }

    await fileInput.uploadFile(pdfPath);
    log("✅ File uploaded");
    await delay(3000);

    // Step 3: Wait for extraction
    log("⏳ Step 3: Waiting for extraction to complete...");
    let extractionComplete = false;
    for (let i = 0; i < 30; i++) {
      await delay(1000);
      const hasResult = await page.evaluate(() => {
        const bodyText = document.body.textContent || "";
        return (
          bodyText.length > 500 ||
          document.querySelector('[class*="result"]') !== null ||
          document.querySelector('[class*="extracted"]') !== null ||
          document.querySelector("textarea") !== null ||
          document.querySelector("pre") !== null ||
          document.querySelector("select") !== null // Format selector appears after extraction
        );
      });
      if (hasResult) {
        extractionComplete = true;
        break;
      }
      if (i % 5 === 0 && i > 0) {
        log(`   Still waiting... (${i} seconds)`);
      }
    }
    if (!extractionComplete) {
      log("⚠️ Extraction may not have completed, continuing anyway...");
    } else {
      log("✅ Extraction complete!");
    }
    await delay(2000);

    // Step 4: Select format (Markdown)
    log("📥 Step 4: Selecting Markdown format...");
    // Wait for select element to appear
    let selectElement = null;
    for (let i = 0; i < 10; i++) {
      selectElement = await page.$("select");
      if (selectElement) break;
      await delay(1000);
    }

    if (selectElement) {
      await page.select("select", "md,text/markdown");
      log("✅ Markdown format selected");
      await delay(3000); // Wait for modal to appear
    } else {
      // Try to find format buttons as fallback
      const formatButtons = await page.$$("button");
      let foundFormat = false;
      for (const button of formatButtons) {
        const text = await page.evaluate(
          (el) => el.textContent?.trim(),
          button
        );
        if (
          text &&
          (text.toUpperCase().includes("MD") ||
            text.toUpperCase().includes("MARKDOWN"))
        ) {
          await button.click();
          log(`✅ Format selected via button: "${text}"`);
          foundFormat = true;
          await delay(3000);
          break;
        }
      }
      if (!foundFormat) {
        throw new Error("Format selector not found");
      }
    }

    // Step 5: Wait for monetization modal
    log("💳 Step 5: Waiting for monetization modal...");
    let modalVisible = false;
    for (let i = 0; i < 10; i++) {
      await delay(1000);
      modalVisible = await page.evaluate(() => {
        const bodyText = document.body.textContent || "";
        return (
          bodyText.includes("Pay $1") ||
          bodyText.includes("Continue with Ad") ||
          document.querySelector('[class*="modal"], [class*="overlay"]') !==
            null
        );
      });
      if (modalVisible) break;
    }

    if (!modalVisible) {
      throw new Error("Monetization modal did not appear");
    }
    log("✅ Monetization modal appeared");

    // Step 6: Find and inspect PayFast form
    log("\n🔍 Step 6: Inspecting PayFast form structure...");
    await delay(2000);

    const formData = await page.evaluate(() => {
      // Find all forms on the page
      const forms = Array.from(document.querySelectorAll("form"));
      let payFastForm = null;

      for (const form of forms) {
        const action = form.getAttribute("action") || "";
        if (
          action.includes("payfast") ||
          action.includes("payfast.co.za") ||
          form.querySelector('input[name="merchant_id"]')
        ) {
          payFastForm = form;
          break;
        }
      }

      if (!payFastForm) {
        return { found: false, error: "PayFast form not found" };
      }

      // Extract all hidden inputs
      const inputs = Array.from(
        payFastForm.querySelectorAll('input[type="hidden"]')
      );
      const formFields = {};

      inputs.forEach((input) => {
        const name = input.getAttribute("name");
        const value = input.getAttribute("value");
        if (name) {
          formFields[name] = value || "";
        }
      });

      return {
        found: true,
        action: payFastForm.getAttribute("action"),
        method: payFastForm.getAttribute("method"),
        fields: formFields,
        html: payFastForm.outerHTML,
      };
    });

    if (!formData.found) {
      log(`❌ ${formData.error}`);
      await page.screenshot({ path: "no-form.png", fullPage: true });
      throw new Error("PayFast form not found");
    }

    log("\n📋 PayFast Form Structure:");
    log("=".repeat(60));
    log(`Action: ${formData.action}`);
    log(`Method: ${formData.method || "POST"}`);
    log("\nHidden Input Fields:");

    // Expected fields (from user's example)
    const expectedFields = [
      "merchant_id",
      "merchant_key",
      "return_url",
      "cancel_url",
      // notify_url is EXCLUDED for $1 payments
    ];

    let allFieldsPresent = true;
    const fieldOrder = [];

    // Check each expected field
    for (const fieldName of expectedFields) {
      if (formData.fields[fieldName]) {
        const value = formData.fields[fieldName];
        log(`  ✅ <input type="hidden" name="${fieldName}" value="${value}">`);
        fieldOrder.push(fieldName);
      } else {
        log(
          `  ❌ <input type="hidden" name="${fieldName}" value=""> - MISSING`
        );
        allFieldsPresent = false;
      }
    }

    // Check for notify_url (should NOT be present for $1 payments)
    if (formData.fields["notify_url"]) {
      log(
        `  ❌ <input type="hidden" name="notify_url" value="${formData.fields["notify_url"]}"> - SHOULD NOT BE PRESENT for $1 payments`
      );
      allFieldsPresent = false;
    } else {
      log(`  ✅ notify_url is NOT present (CORRECT for $1 payments)`);
    }

    // Show other fields
    log("\nOther fields in form:");
    for (const [key, value] of Object.entries(formData.fields)) {
      if (!expectedFields.includes(key) && key !== "notify_url") {
        log(`  • ${key}: ${value}`);
      }
    }

    log("=".repeat(60));

    // Generate HTML output matching user's example format
    log("\n📝 Form HTML (matching your example format):");
    log("-".repeat(60));
    log(
      `<form action="${formData.action}" method="${formData.method || "POST"}">`
    );

    // Output in the order from user's example
    if (formData.fields["merchant_id"]) {
      log(
        `  <input type="hidden" name="merchant_id" value="${formData.fields["merchant_id"]}">`
      );
    }
    if (formData.fields["merchant_key"]) {
      log(
        `  <input type="hidden" name="merchant_key" value="${formData.fields["merchant_key"]}">`
      );
    }
    if (formData.fields["return_url"]) {
      log(
        `  <input type="hidden" name="return_url" value="${formData.fields["return_url"]}">`
      );
    }
    if (formData.fields["cancel_url"]) {
      log(
        `  <input type="hidden" name="cancel_url" value="${formData.fields["cancel_url"]}">`
      );
    }
    // notify_url is intentionally excluded
    log(`  <!-- notify_url is EXCLUDED for $1 payments -->`);

    // Show other fields
    for (const [key, value] of Object.entries(formData.fields)) {
      if (
        ![
          "merchant_id",
          "merchant_key",
          "return_url",
          "cancel_url",
          "notify_url",
        ].includes(key)
      ) {
        log(`  <input type="hidden" name="${key}" value="${value}">`);
      }
    }

    log(`</form>`);
    log("-".repeat(60));

    // Final test result
    log("\n" + "=".repeat(60));
    if (allFieldsPresent && !formData.fields["notify_url"]) {
      log("✅ TEST PASSED: PayFast form structure is correct");
      log("   - All required fields present");
      log("   - notify_url correctly excluded for $1 payments");
    } else {
      log("❌ TEST FAILED: PayFast form structure is incorrect");
      if (!allFieldsPresent) {
        log("   - Missing required fields");
      }
      if (formData.fields["notify_url"]) {
        log("   - notify_url should NOT be present for $1 payments");
      }
    }
    log("=".repeat(60));

    await delay(3000);
    return { passed: allFieldsPresent && !formData.fields["notify_url"] };
  } catch (error) {
    log(`❌ TEST ERROR: ${error.message}`);
    await page.screenshot({ path: "form-structure-error.png", fullPage: true });
    log("📸 Screenshot saved: form-structure-error.png");
    return { passed: false, reason: error.message };
  } finally {
    await browser.close();
    log("🔒 Browser closed");
  }
}

// Run the test
testPayFastFormStructure()
  .then((result) => {
    if (result && result.passed === false) {
      console.error(
        "\n❌ TEST FAILED:",
        result.reason || "Form structure incorrect"
      );
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
