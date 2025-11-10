/**
 * Automated Test Script for Payment Flow
 * Tests: Modal → Payment → localStorage → Success Page → Download
 *
 * Run with: node test-payment-flow.js
 */

const fs = require("fs");
const path = require("path");

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const prefix =
    type === "pass"
      ? "✅"
      : type === "fail"
      ? "❌"
      : type === "warn"
      ? "⚠️"
      : "ℹ️";
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function test(name, fn) {
  try {
    const result = fn();
    if (result === true || (result && result.passed)) {
      results.passed.push(name);
      log(`${name} - PASSED`, "pass");
      return true;
    } else {
      results.failed.push(name);
      log(
        `${name} - FAILED: ${result?.message || "Test returned false"}`,
        "fail"
      );
      return false;
    }
  } catch (error) {
    results.failed.push(name);
    log(`${name} - ERROR: ${error.message}`, "fail");
    return false;
  }
}

function warn(message) {
  results.warnings.push(message);
  log(message, "warn");
}

// Test 1: Check if test page exists
test("Test page file exists", () => {
  const testPagePath = path.join(
    __dirname,
    "app",
    "test-payment-flow",
    "page.tsx"
  );
  return fs.existsSync(testPagePath);
});

// Test 2: Check if test page has required components
test("Test page imports required components", () => {
  const testPagePath = path.join(
    __dirname,
    "app",
    "test-payment-flow",
    "page.tsx"
  );
  if (!fs.existsSync(testPagePath)) return false;

  const content = fs.readFileSync(testPagePath, "utf8");
  const hasMonetizationModal = content.includes("MonetizationModal");
  const hasRouter = content.includes("useRouter");
  const hasState = content.includes("useState");
  const hasEffects = content.includes("useEffect");

  return hasMonetizationModal && hasRouter && hasState && hasEffects;
});

// Test 3: Check if test page has all 8 test steps
test("Test page has all 8 test steps defined", () => {
  const testPagePath = path.join(
    __dirname,
    "app",
    "test-payment-flow",
    "page.tsx"
  );
  if (!fs.existsSync(testPagePath)) return false;

  const content = fs.readFileSync(testPagePath, "utf8");
  const steps = [
    "Open Monetization Modal",
    "Click Pay $1 Button",
    "Store Download URL in localStorage",
    "Simulate Payment Success",
    "Navigate to Success Page",
    "Retrieve Download URL from localStorage",
    "Show Download Button",
    "Test Download Functionality",
  ];

  const allStepsPresent = steps.every((step) => content.includes(step));
  return allStepsPresent;
});

// Test 4: Check if MonetizationModal component exists
test("MonetizationModal component exists", () => {
  const modalPath = path.join(
    __dirname,
    "components",
    "ui",
    "MonetizationModal.tsx"
  );
  return fs.existsSync(modalPath);
});

// Test 5: Check if MonetizationModal stores download URL in localStorage
test("MonetizationModal stores download URL in localStorage", () => {
  const modalPath = path.join(
    __dirname,
    "components",
    "ui",
    "MonetizationModal.tsx"
  );
  if (!fs.existsSync(modalPath)) return false;

  const content = fs.readFileSync(modalPath, "utf8");
  const storesDownloadUrl =
    content.includes("payment_download_url") &&
    content.includes("localStorage.setItem");
  return storesDownloadUrl;
});

// Test 6: Check if success page retrieves download URL from localStorage
test("Success page retrieves download URL from localStorage", () => {
  const successPagePath = path.join(
    __dirname,
    "app",
    "payment",
    "success",
    "page.tsx"
  );
  if (!fs.existsSync(successPagePath)) return false;

  const content = fs.readFileSync(successPagePath, "utf8");
  const retrievesDownloadUrl =
    content.includes("payment_download_url") &&
    content.includes("localStorage.getItem");
  return retrievesDownloadUrl;
});

// Test 7: Check if success page shows download button when URL is found
test("Success page shows download button when download URL exists", () => {
  const successPagePath = path.join(
    __dirname,
    "app",
    "payment",
    "success",
    "page.tsx"
  );
  if (!fs.existsSync(successPagePath)) return false;

  const content = fs.readFileSync(successPagePath, "utf8");
  const showsDownloadButton =
    content.includes("Download File") &&
    content.includes("isDownloadPayment") &&
    content.includes("downloadUrl");
  return showsDownloadButton;
});

// Test 8: Check if PayFastForm component exists
test("PayFastForm component exists", () => {
  const formPath = path.join(__dirname, "components", "ui", "PayFastForm.tsx");
  return fs.existsSync(formPath);
});

// Test 9: Check if PayFastForm accepts custom_str1 (download URL)
test("PayFastForm accepts custom_str1 for download URL", () => {
  const formPath = path.join(__dirname, "components", "ui", "PayFastForm.tsx");
  if (!fs.existsSync(formPath)) return false;

  const content = fs.readFileSync(formPath, "utf8");
  const acceptsCustomStr1 = content.includes("custom_str1");
  return acceptsCustomStr1;
});

// Test 10: Check if payment initiate API route exists
test("Payment initiate API route exists", () => {
  const apiPath = path.join(
    __dirname,
    "app",
    "api",
    "payments",
    "payfast",
    "initiate",
    "route.ts"
  );
  return fs.existsSync(apiPath);
});

// Test 11: Check if payment initiate API handles custom_str1
test("Payment initiate API handles custom_str1", () => {
  const apiPath = path.join(
    __dirname,
    "app",
    "api",
    "payments",
    "payfast",
    "initiate",
    "route.ts"
  );
  if (!fs.existsSync(apiPath)) return false;

  const content = fs.readFileSync(apiPath, "utf8");
  const handlesCustomStr1 = content.includes("custom_str1");
  return handlesCustomStr1;
});

// Test 12: Verify localStorage keys are consistent
test("localStorage keys are consistent across components", () => {
  const modalPath = path.join(
    __dirname,
    "components",
    "ui",
    "MonetizationModal.tsx"
  );
  const successPath = path.join(
    __dirname,
    "app",
    "payment",
    "success",
    "page.tsx"
  );

  if (!fs.existsSync(modalPath) || !fs.existsSync(successPath)) return false;

  const modalContent = fs.readFileSync(modalPath, "utf8");
  const successContent = fs.readFileSync(successPath, "utf8");

  // Check if both use the same localStorage key
  const modalUsesKey =
    modalContent.includes('"payment_download_url"') ||
    modalContent.includes("'payment_download_url'");
  const successUsesKey =
    successContent.includes('"payment_download_url"') ||
    successContent.includes("'payment_download_url'");

  return modalUsesKey && successUsesKey;
});

// Run all tests
console.log("\n🧪 Running Payment Flow Tests...\n");
console.log("=".repeat(60));

const startTime = Date.now();

// Execute all tests
const testResults = [
  test("Test page file exists", () => {
    const testPagePath = path.join(
      __dirname,
      "app",
      "test-payment-flow",
      "page.tsx"
    );
    return fs.existsSync(testPagePath);
  }),
  test("Test page imports required components", () => {
    const testPagePath = path.join(
      __dirname,
      "app",
      "test-payment-flow",
      "page.tsx"
    );
    if (!fs.existsSync(testPagePath)) return false;
    const content = fs.readFileSync(testPagePath, "utf8");
    return (
      content.includes("MonetizationModal") &&
      content.includes("useRouter") &&
      content.includes("useState")
    );
  }),
  test("Test page has all 8 test steps", () => {
    const testPagePath = path.join(
      __dirname,
      "app",
      "test-payment-flow",
      "page.tsx"
    );
    if (!fs.existsSync(testPagePath)) return false;
    const content = fs.readFileSync(testPagePath, "utf8");
    return (
      content.includes("Open Monetization Modal") &&
      content.includes("Click Pay $1 Button") &&
      content.includes("Store Download URL in localStorage") &&
      content.includes("Simulate Payment Success") &&
      content.includes("Navigate to Success Page") &&
      content.includes("Retrieve Download URL from localStorage") &&
      content.includes("Show Download Button") &&
      content.includes("Test Download Functionality")
    );
  }),
  test("MonetizationModal stores download URL", () => {
    const modalPath = path.join(
      __dirname,
      "components",
      "ui",
      "MonetizationModal.tsx"
    );
    if (!fs.existsSync(modalPath)) return false;
    const content = fs.readFileSync(modalPath, "utf8");
    return (
      content.includes("payment_download_url") &&
      content.includes("localStorage.setItem")
    );
  }),
  test("Success page retrieves download URL", () => {
    const successPath = path.join(
      __dirname,
      "app",
      "payment",
      "success",
      "page.tsx"
    );
    if (!fs.existsSync(successPath)) return false;
    const content = fs.readFileSync(successPath, "utf8");
    return (
      content.includes("payment_download_url") &&
      content.includes("localStorage.getItem")
    );
  }),
  test("Success page shows download button", () => {
    const successPath = path.join(
      __dirname,
      "app",
      "payment",
      "success",
      "page.tsx"
    );
    if (!fs.existsSync(successPath)) return false;
    const content = fs.readFileSync(successPath, "utf8");
    return (
      content.includes("Download File") && content.includes("isDownloadPayment")
    );
  }),
  test("PayFastForm accepts custom_str1", () => {
    const formPath = path.join(
      __dirname,
      "components",
      "ui",
      "PayFastForm.tsx"
    );
    if (!fs.existsSync(formPath)) return false;
    const content = fs.readFileSync(formPath, "utf8");
    return content.includes("custom_str1");
  }),
  test("Payment API handles custom_str1", () => {
    const apiPath = path.join(
      __dirname,
      "app",
      "api",
      "payments",
      "payfast",
      "initiate",
      "route.ts"
    );
    if (!fs.existsSync(apiPath)) return false;
    const content = fs.readFileSync(apiPath, "utf8");
    return content.includes("custom_str1");
  }),
  test("localStorage keys are consistent", () => {
    const modalPath = path.join(
      __dirname,
      "components",
      "ui",
      "MonetizationModal.tsx"
    );
    const successPath = path.join(
      __dirname,
      "app",
      "payment",
      "success",
      "page.tsx"
    );
    if (!fs.existsSync(modalPath) || !fs.existsSync(successPath)) return false;
    const modalContent = fs.readFileSync(modalPath, "utf8");
    const successContent = fs.readFileSync(successPath, "utf8");
    return (
      (modalContent.includes("payment_download_url") ||
        modalContent.includes("payment_download_url")) &&
      (successContent.includes("payment_download_url") ||
        successContent.includes("payment_download_url"))
    );
  }),
];

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

// Print summary
console.log("\n" + "=".repeat(60));
console.log("📊 Test Summary");
console.log("=".repeat(60));
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log(`⏱️  Duration: ${duration}s`);
console.log("=".repeat(60));

if (results.failed.length > 0) {
  console.log("\n❌ Failed Tests:");
  results.failed.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test}`);
  });
}

if (results.warnings.length > 0) {
  console.log("\n⚠️  Warnings:");
  results.warnings.forEach((warning, index) => {
    console.log(`   ${index + 1}. ${warning}`);
  });
}

// Exit with appropriate code
process.exit(results.failed.length > 0 ? 1 : 0);
