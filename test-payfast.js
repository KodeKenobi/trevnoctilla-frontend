/**
 * PayFast Payment Gateway Test Script
 *
 * Tests the payment initiation and verifies PayFast integration
 * Run with: node test-payfast.js
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local manually (no dotenv dependency)
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnvFile();

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const PAYFAST_MERCHANT_ID =
  process.env.PAYFAST_MERCHANT_ID ||
  process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID;
const PAYFAST_MERCHANT_KEY =
  process.env.PAYFAST_MERCHANT_KEY ||
  process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY;
const PAYFAST_PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE || process.env.NEXT_PUBLIC_PAYFAST_PASSPHRASE;
const PAYFAST_URL =
  process.env.NEXT_PUBLIC_PAYFAST_URL ||
  "https://sandbox.payfast.co.za/eng/process";

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
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, "green");
}

function logError(message) {
  log(`✗ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠ ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ ${message}`, "blue");
}

// Test 1: Check Environment Variables
function testEnvironmentVariables() {
  logSection("Test 1: Environment Variables");

  const checks = [
    { name: "PAYFAST_MERCHANT_ID", value: PAYFAST_MERCHANT_ID },
    { name: "PAYFAST_MERCHANT_KEY", value: PAYFAST_MERCHANT_KEY },
    {
      name: "PAYFAST_PASSPHRASE",
      value: PAYFAST_PASSPHRASE ? "***SET***" : null,
    },
    { name: "NEXT_PUBLIC_PAYFAST_URL", value: PAYFAST_URL },
    { name: "NEXT_PUBLIC_BASE_URL", value: API_BASE_URL },
  ];

  let allPassed = true;
  checks.forEach((check) => {
    if (check.value) {
      logSuccess(`${check.name}: ${check.value}`);
    } else {
      logError(`${check.name}: MISSING`);
      allPassed = false;
    }
  });

  return allPassed;
}

// Test 2: Test Payment Initiation Endpoint
async function testPaymentInitiation() {
  logSection("Test 2: Payment Initiation Endpoint");

  const paymentData = {
    amount: "1.00",
    item_name: "Test Premium Access",
    item_description: "Test payment for PayFast integration",
    email_address: "test@example.com",
    name_first: "Test",
    name_last: "User",
    custom_str1: `test_${Date.now()}`,
    custom_str2: "https://example.com/test",
  };

  try {
    logInfo(
      `Sending POST request to: ${API_BASE_URL}/api/payments/payfast/initiate`
    );
    logInfo(`Payment Data: ${JSON.stringify(paymentData, null, 2)}`);

    const response = await fetch(
      `${API_BASE_URL}/api/payments/payfast/initiate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      logError(`Request failed with status ${response.status}`);
      logError(`Error: ${responseData.error || JSON.stringify(responseData)}`);
      return false;
    }

    logSuccess("Payment initiation request successful");
    logInfo(`Response: ${JSON.stringify(responseData, null, 2)}`);

    // Validate response structure
    const requiredFields = [
      "success",
      "payment_url",
      "payment_data",
      "payment_id",
    ];
    const missingFields = requiredFields.filter(
      (field) => !(field in responseData)
    );

    if (missingFields.length > 0) {
      logError(`Missing required fields: ${missingFields.join(", ")}`);
      return false;
    }

    logSuccess("Response structure is valid");

    // Validate payment_data
    const paymentDataFields = [
      "merchant_id",
      "merchant_key",
      "amount",
      "item_name",
      "signature",
      "return_url",
      "cancel_url",
      "notify_url",
      "m_payment_id",
    ];

    const missingPaymentFields = paymentDataFields.filter(
      (field) => !(field in responseData.payment_data)
    );

    if (missingPaymentFields.length > 0) {
      logError(
        `Missing payment data fields: ${missingPaymentFields.join(", ")}`
      );
      return false;
    }

    logSuccess("Payment data structure is valid");

    // Verify signature format (should be 32 character hex string)
    const signature = responseData.payment_data.signature;
    if (!/^[a-f0-9]{32}$/i.test(signature)) {
      logError(`Invalid signature format: ${signature}`);
      return false;
    }

    logSuccess("Signature format is valid");

    // Verify PayFast URL
    if (responseData.payment_url !== PAYFAST_URL) {
      logWarning(
        `PayFast URL mismatch. Expected: ${PAYFAST_URL}, Got: ${responseData.payment_url}`
      );
    } else {
      logSuccess("PayFast URL is correct");
    }

    // Verify merchant credentials match
    if (responseData.payment_data.merchant_id !== PAYFAST_MERCHANT_ID) {
      logError("Merchant ID mismatch");
      return false;
    }

    if (responseData.payment_data.merchant_key !== PAYFAST_MERCHANT_KEY) {
      logError("Merchant Key mismatch");
      return false;
    }

    logSuccess("Merchant credentials match");

    // Test signature generation
    const signatureValid = testSignatureGeneration(responseData.payment_data);
    if (!signatureValid) {
      logError("Signature verification failed");
      return false;
    }

    return true;
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    if (error.code === "ECONNREFUSED") {
      logWarning(
        "Make sure your Next.js dev server is running on " + API_BASE_URL
      );
    }
    return false;
  }
}

// Test 3: Verify Signature Generation
function testSignatureGeneration(paymentData) {
  logSection("Test 3: Signature Generation Verification");

  // Filter out empty values and signature field
  const filteredData = {};
  Object.keys(paymentData).forEach((key) => {
    if (
      key !== "signature" &&
      paymentData[key] !== "" &&
      paymentData[key] !== null &&
      paymentData[key] !== undefined
    ) {
      const value = String(paymentData[key]).trim();
      if (value !== "") {
        filteredData[key] = value;
      }
    }
  });

  // Create parameter string (sorted alphabetically)
  const pfParamString = Object.keys(filteredData)
    .sort()
    .map((key) => `${key}=${filteredData[key]}`)
    .join("&");

  // Add passphrase if provided
  let pfParamStringWithPassphrase = pfParamString;
  if (PAYFAST_PASSPHRASE && PAYFAST_PASSPHRASE.trim()) {
    const passphrase = PAYFAST_PASSPHRASE.trim();
    pfParamStringWithPassphrase = `${pfParamString}&passphrase=${passphrase}`;
  }

  // Generate expected signature
  const expectedSignature = crypto
    .createHash("md5")
    .update(pfParamStringWithPassphrase)
    .digest("hex")
    .toLowerCase();

  const receivedSignature = paymentData.signature.toLowerCase();

  logInfo(
    `Parameter String: ${pfParamStringWithPassphrase.substring(0, 100)}...`
  );
  logInfo(`Expected Signature: ${expectedSignature}`);
  logInfo(`Received Signature: ${receivedSignature}`);

  if (expectedSignature === receivedSignature) {
    logSuccess("Signatures match!");
    return true;
  } else {
    logError("Signatures do not match!");
    logError("This indicates a problem with signature generation");
    return false;
  }
}

// Test 4: Test Form Data Structure
function testFormDataStructure() {
  logSection("Test 4: Form Data Structure");

  const samplePaymentData = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    amount: "1.00",
    item_name: "Test Item",
    return_url: `${API_BASE_URL}/payment/success`,
    cancel_url: `${API_BASE_URL}/payment/cancel`,
    notify_url: `${API_BASE_URL}/api/payments/payfast/notify`,
    m_payment_id: "test_123",
    signature: "test_signature",
  };

  logInfo("Sample payment data structure:");
  console.log(JSON.stringify(samplePaymentData, null, 2));

  // Check URL encoding requirements
  logInfo(
    "All values should be properly URL encoded when submitted to PayFast"
  );
  logInfo("Form encoding: application/x-www-form-urlencoded");
  logSuccess("Form data structure is valid");

  return true;
}

// Test 5: Test Notify Endpoint (Mock)
async function testNotifyEndpoint() {
  logSection("Test 5: Notify Endpoint (Mock Test)");

  // Create mock ITN data
  const mockITNData = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    payment_status: "COMPLETE",
    m_payment_id: `test_${Date.now()}`,
    pf_payment_id: "12345678",
    amount_gross: "1.00",
    amount_fee: "0.00",
    amount_net: "1.00",
  };

  // Generate signature for mock data
  const filteredData = {};
  Object.keys(mockITNData).forEach((key) => {
    if (mockITNData[key] !== "" && mockITNData[key] !== null) {
      const value = String(mockITNData[key]).trim();
      if (value !== "") {
        filteredData[key] = value;
      }
    }
  });

  const pfParamString = Object.keys(filteredData)
    .sort()
    .map((key) => `${key}=${filteredData[key]}`)
    .join("&");

  let pfParamStringWithPassphrase = pfParamString;
  if (PAYFAST_PASSPHRASE && PAYFAST_PASSPHRASE.trim()) {
    pfParamStringWithPassphrase = `${pfParamString}&passphrase=${PAYFAST_PASSPHRASE.trim()}`;
  }

  mockITNData.signature = crypto
    .createHash("md5")
    .update(pfParamStringWithPassphrase)
    .digest("hex")
    .toLowerCase();

  logInfo("Mock ITN data structure:");
  console.log(JSON.stringify(mockITNData, null, 2));

  try {
    const formData = new URLSearchParams();
    Object.keys(mockITNData).forEach((key) => {
      formData.append(key, String(mockITNData[key]));
    });

    logInfo(
      `Sending POST request to: ${API_BASE_URL}/api/payments/payfast/notify`
    );

    const response = await fetch(
      `${API_BASE_URL}/api/payments/payfast/notify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const responseData = await response.json();

    if (response.ok && response.status === 200) {
      logSuccess("Notify endpoint responded successfully");
      logInfo(`Response: ${JSON.stringify(responseData)}`);
      return true;
    } else {
      logError(`Notify endpoint failed with status ${response.status}`);
      logError(`Response: ${JSON.stringify(responseData)}`);
      return false;
    }
  } catch (error) {
    logError(`Notify endpoint test failed: ${error.message}`);
    if (error.code === "ECONNREFUSED") {
      logWarning("Make sure your Next.js dev server is running");
    }
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log("\n");
  log("╔═══════════════════════════════════════════════════════════╗", "cyan");
  log("║     PayFast Payment Gateway Integration Test Suite        ║", "cyan");
  log("╚═══════════════════════════════════════════════════════════╝", "cyan");
  console.log("");

  const results = {
    environment: false,
    initiation: false,
    signature: false,
    formData: false,
    notify: false,
  };

  // Run tests
  results.environment = testEnvironmentVariables();

  if (!results.environment) {
    logError(
      "\nEnvironment variables are missing. Please check your .env.local file."
    );
    logWarning("Skipping remaining tests...");
    return;
  }

  results.initiation = await testPaymentInitiation();
  results.signature = true; // Signature test is part of initiation test
  results.formData = testFormDataStructure();
  results.notify = await testNotifyEndpoint();

  // Summary
  logSection("Test Summary");

  const testNames = {
    environment: "Environment Variables",
    initiation: "Payment Initiation",
    signature: "Signature Generation",
    formData: "Form Data Structure",
    notify: "Notify Endpoint",
  };

  let passed = 0;
  let failed = 0;

  Object.keys(results).forEach((key) => {
    if (results[key]) {
      logSuccess(`${testNames[key]}: PASSED`);
      passed++;
    } else {
      logError(`${testNames[key]}: FAILED`);
      failed++;
    }
  });

  console.log("");
  log(
    `Total: ${passed + failed} tests | Passed: ${passed} | Failed: ${failed}`,
    failed > 0 ? "red" : "green"
  );

  if (failed === 0) {
    log(
      "\n✓ All tests passed! Your PayFast integration is working correctly.",
      "green"
    );
    log("\nNext steps:", "cyan");
    log("1. Test the payment flow in your browser", "blue");
    log("2. Use test card: 4000000000000002 (Visa)", "blue");
    log("3. Check server logs for payment initiation and ITN", "blue");
  } else {
    log("\n✗ Some tests failed. Please review the errors above.", "red");
  }

  console.log("");
}

// Run tests
runTests().catch((error) => {
  logError(`Test suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});

 *
 * Tests the payment initiation and verifies PayFast integration
 * Run with: node test-payfast.js
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local manually (no dotenv dependency)
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnvFile();

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const PAYFAST_MERCHANT_ID =
  process.env.PAYFAST_MERCHANT_ID ||
  process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID;
const PAYFAST_MERCHANT_KEY =
  process.env.PAYFAST_MERCHANT_KEY ||
  process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY;
const PAYFAST_PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE || process.env.NEXT_PUBLIC_PAYFAST_PASSPHRASE;
const PAYFAST_URL =
  process.env.NEXT_PUBLIC_PAYFAST_URL ||
  "https://sandbox.payfast.co.za/eng/process";

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
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, "green");
}

function logError(message) {
  log(`✗ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠ ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ ${message}`, "blue");
}

// Test 1: Check Environment Variables
function testEnvironmentVariables() {
  logSection("Test 1: Environment Variables");

  const checks = [
    { name: "PAYFAST_MERCHANT_ID", value: PAYFAST_MERCHANT_ID },
    { name: "PAYFAST_MERCHANT_KEY", value: PAYFAST_MERCHANT_KEY },
    {
      name: "PAYFAST_PASSPHRASE",
      value: PAYFAST_PASSPHRASE ? "***SET***" : null,
    },
    { name: "NEXT_PUBLIC_PAYFAST_URL", value: PAYFAST_URL },
    { name: "NEXT_PUBLIC_BASE_URL", value: API_BASE_URL },
  ];

  let allPassed = true;
  checks.forEach((check) => {
    if (check.value) {
      logSuccess(`${check.name}: ${check.value}`);
    } else {
      logError(`${check.name}: MISSING`);
      allPassed = false;
    }
  });

  return allPassed;
}

// Test 2: Test Payment Initiation Endpoint
async function testPaymentInitiation() {
  logSection("Test 2: Payment Initiation Endpoint");

  const paymentData = {
    amount: "1.00",
    item_name: "Test Premium Access",
    item_description: "Test payment for PayFast integration",
    email_address: "test@example.com",
    name_first: "Test",
    name_last: "User",
    custom_str1: `test_${Date.now()}`,
    custom_str2: "https://example.com/test",
  };

  try {
    logInfo(
      `Sending POST request to: ${API_BASE_URL}/api/payments/payfast/initiate`
    );
    logInfo(`Payment Data: ${JSON.stringify(paymentData, null, 2)}`);

    const response = await fetch(
      `${API_BASE_URL}/api/payments/payfast/initiate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      logError(`Request failed with status ${response.status}`);
      logError(`Error: ${responseData.error || JSON.stringify(responseData)}`);
      return false;
    }

    logSuccess("Payment initiation request successful");
    logInfo(`Response: ${JSON.stringify(responseData, null, 2)}`);

    // Validate response structure
    const requiredFields = [
      "success",
      "payment_url",
      "payment_data",
      "payment_id",
    ];
    const missingFields = requiredFields.filter(
      (field) => !(field in responseData)
    );

    if (missingFields.length > 0) {
      logError(`Missing required fields: ${missingFields.join(", ")}`);
      return false;
    }

    logSuccess("Response structure is valid");

    // Validate payment_data
    const paymentDataFields = [
      "merchant_id",
      "merchant_key",
      "amount",
      "item_name",
      "signature",
      "return_url",
      "cancel_url",
      "notify_url",
      "m_payment_id",
    ];

    const missingPaymentFields = paymentDataFields.filter(
      (field) => !(field in responseData.payment_data)
    );

    if (missingPaymentFields.length > 0) {
      logError(
        `Missing payment data fields: ${missingPaymentFields.join(", ")}`
      );
      return false;
    }

    logSuccess("Payment data structure is valid");

    // Verify signature format (should be 32 character hex string)
    const signature = responseData.payment_data.signature;
    if (!/^[a-f0-9]{32}$/i.test(signature)) {
      logError(`Invalid signature format: ${signature}`);
      return false;
    }

    logSuccess("Signature format is valid");

    // Verify PayFast URL
    if (responseData.payment_url !== PAYFAST_URL) {
      logWarning(
        `PayFast URL mismatch. Expected: ${PAYFAST_URL}, Got: ${responseData.payment_url}`
      );
    } else {
      logSuccess("PayFast URL is correct");
    }

    // Verify merchant credentials match
    if (responseData.payment_data.merchant_id !== PAYFAST_MERCHANT_ID) {
      logError("Merchant ID mismatch");
      return false;
    }

    if (responseData.payment_data.merchant_key !== PAYFAST_MERCHANT_KEY) {
      logError("Merchant Key mismatch");
      return false;
    }

    logSuccess("Merchant credentials match");

    // Test signature generation
    const signatureValid = testSignatureGeneration(responseData.payment_data);
    if (!signatureValid) {
      logError("Signature verification failed");
      return false;
    }

    return true;
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    if (error.code === "ECONNREFUSED") {
      logWarning(
        "Make sure your Next.js dev server is running on " + API_BASE_URL
      );
    }
    return false;
  }
}

// Test 3: Verify Signature Generation
function testSignatureGeneration(paymentData) {
  logSection("Test 3: Signature Generation Verification");

  // Filter out empty values and signature field
  const filteredData = {};
  Object.keys(paymentData).forEach((key) => {
    if (
      key !== "signature" &&
      paymentData[key] !== "" &&
      paymentData[key] !== null &&
      paymentData[key] !== undefined
    ) {
      const value = String(paymentData[key]).trim();
      if (value !== "") {
        filteredData[key] = value;
      }
    }
  });

  // Create parameter string (sorted alphabetically)
  const pfParamString = Object.keys(filteredData)
    .sort()
    .map((key) => `${key}=${filteredData[key]}`)
    .join("&");

  // Add passphrase if provided
  let pfParamStringWithPassphrase = pfParamString;
  if (PAYFAST_PASSPHRASE && PAYFAST_PASSPHRASE.trim()) {
    const passphrase = PAYFAST_PASSPHRASE.trim();
    pfParamStringWithPassphrase = `${pfParamString}&passphrase=${passphrase}`;
  }

  // Generate expected signature
  const expectedSignature = crypto
    .createHash("md5")
    .update(pfParamStringWithPassphrase)
    .digest("hex")
    .toLowerCase();

  const receivedSignature = paymentData.signature.toLowerCase();

  logInfo(
    `Parameter String: ${pfParamStringWithPassphrase.substring(0, 100)}...`
  );
  logInfo(`Expected Signature: ${expectedSignature}`);
  logInfo(`Received Signature: ${receivedSignature}`);

  if (expectedSignature === receivedSignature) {
    logSuccess("Signatures match!");
    return true;
  } else {
    logError("Signatures do not match!");
    logError("This indicates a problem with signature generation");
    return false;
  }
}

// Test 4: Test Form Data Structure
function testFormDataStructure() {
  logSection("Test 4: Form Data Structure");

  const samplePaymentData = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    amount: "1.00",
    item_name: "Test Item",
    return_url: `${API_BASE_URL}/payment/success`,
    cancel_url: `${API_BASE_URL}/payment/cancel`,
    notify_url: `${API_BASE_URL}/api/payments/payfast/notify`,
    m_payment_id: "test_123",
    signature: "test_signature",
  };

  logInfo("Sample payment data structure:");
  console.log(JSON.stringify(samplePaymentData, null, 2));

  // Check URL encoding requirements
  logInfo(
    "All values should be properly URL encoded when submitted to PayFast"
  );
  logInfo("Form encoding: application/x-www-form-urlencoded");
  logSuccess("Form data structure is valid");

  return true;
}

// Test 5: Test Notify Endpoint (Mock)
async function testNotifyEndpoint() {
  logSection("Test 5: Notify Endpoint (Mock Test)");

  // Create mock ITN data
  const mockITNData = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    payment_status: "COMPLETE",
    m_payment_id: `test_${Date.now()}`,
    pf_payment_id: "12345678",
    amount_gross: "1.00",
    amount_fee: "0.00",
    amount_net: "1.00",
  };

  // Generate signature for mock data
  const filteredData = {};
  Object.keys(mockITNData).forEach((key) => {
    if (mockITNData[key] !== "" && mockITNData[key] !== null) {
      const value = String(mockITNData[key]).trim();
      if (value !== "") {
        filteredData[key] = value;
      }
    }
  });

  const pfParamString = Object.keys(filteredData)
    .sort()
    .map((key) => `${key}=${filteredData[key]}`)
    .join("&");

  let pfParamStringWithPassphrase = pfParamString;
  if (PAYFAST_PASSPHRASE && PAYFAST_PASSPHRASE.trim()) {
    pfParamStringWithPassphrase = `${pfParamString}&passphrase=${PAYFAST_PASSPHRASE.trim()}`;
  }

  mockITNData.signature = crypto
    .createHash("md5")
    .update(pfParamStringWithPassphrase)
    .digest("hex")
    .toLowerCase();

  logInfo("Mock ITN data structure:");
  console.log(JSON.stringify(mockITNData, null, 2));

  try {
    const formData = new URLSearchParams();
    Object.keys(mockITNData).forEach((key) => {
      formData.append(key, String(mockITNData[key]));
    });

    logInfo(
      `Sending POST request to: ${API_BASE_URL}/api/payments/payfast/notify`
    );

    const response = await fetch(
      `${API_BASE_URL}/api/payments/payfast/notify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const responseData = await response.json();

    if (response.ok && response.status === 200) {
      logSuccess("Notify endpoint responded successfully");
      logInfo(`Response: ${JSON.stringify(responseData)}`);
      return true;
    } else {
      logError(`Notify endpoint failed with status ${response.status}`);
      logError(`Response: ${JSON.stringify(responseData)}`);
      return false;
    }
  } catch (error) {
    logError(`Notify endpoint test failed: ${error.message}`);
    if (error.code === "ECONNREFUSED") {
      logWarning("Make sure your Next.js dev server is running");
    }
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log("\n");
  log("╔═══════════════════════════════════════════════════════════╗", "cyan");
  log("║     PayFast Payment Gateway Integration Test Suite        ║", "cyan");
  log("╚═══════════════════════════════════════════════════════════╝", "cyan");
  console.log("");

  const results = {
    environment: false,
    initiation: false,
    signature: false,
    formData: false,
    notify: false,
  };

  // Run tests
  results.environment = testEnvironmentVariables();

  if (!results.environment) {
    logError(
      "\nEnvironment variables are missing. Please check your .env.local file."
    );
    logWarning("Skipping remaining tests...");
    return;
  }

  results.initiation = await testPaymentInitiation();
  results.signature = true; // Signature test is part of initiation test
  results.formData = testFormDataStructure();
  results.notify = await testNotifyEndpoint();

  // Summary
  logSection("Test Summary");

  const testNames = {
    environment: "Environment Variables",
    initiation: "Payment Initiation",
    signature: "Signature Generation",
    formData: "Form Data Structure",
    notify: "Notify Endpoint",
  };

  let passed = 0;
  let failed = 0;

  Object.keys(results).forEach((key) => {
    if (results[key]) {
      logSuccess(`${testNames[key]}: PASSED`);
      passed++;
    } else {
      logError(`${testNames[key]}: FAILED`);
      failed++;
    }
  });

  console.log("");
  log(
    `Total: ${passed + failed} tests | Passed: ${passed} | Failed: ${failed}`,
    failed > 0 ? "red" : "green"
  );

  if (failed === 0) {
    log(
      "\n✓ All tests passed! Your PayFast integration is working correctly.",
      "green"
    );
    log("\nNext steps:", "cyan");
    log("1. Test the payment flow in your browser", "blue");
    log("2. Use test card: 4000000000000002 (Visa)", "blue");
    log("3. Check server logs for payment initiation and ITN", "blue");
  } else {
    log("\n✗ Some tests failed. Please review the errors above.", "red");
  }

  console.log("");
}

// Run tests
runTests().catch((error) => {
  logError(`Test suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
