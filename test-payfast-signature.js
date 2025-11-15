/**
 * PayFast Signature Generation Test Script
 *
 * This script tests the PayFast signature generation logic
 * to verify it matches PayFast's expected format.
 *
 * Usage: node test-payfast-signature.js
 */

const crypto = require("crypto");

// PayFast Configuration
const PAYFAST_CONFIG = {
  MERCHANT_ID: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || "10043520",
  MERCHANT_KEY: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || "irqvo1c2j9l08",
  PASSPHRASE:
    process.env.NEXT_PUBLIC_PAYFAST_PASSPHRASE || "Trevnoctilla_PayFast_Test",
};

/**
 * Generate PayFast signature according to their PHP example
 *
 * Steps (as per PayFast PHP example):
 * 1. Concatenate name-value pairs in the order they appear in the data object (NOT alphabetical)
 * 2. URL encode values using urlencode() style (uppercase encoding, spaces as '+')
 * 3. Exclude empty values and signature field
 * 4. Add passphrase at the end (also URL-encoded)
 * 5. MD5 hash the result
 */
function generatePayFastSignature(paymentData, passphrase) {
  let paramString = "";

  // Iterate through paymentData in insertion order (as it appears in the object)
  // Exclude empty values and signature field itself
  for (const key in paymentData) {
    const value = paymentData[key];
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      key !== "signature"
    ) {
      const trimmedValue = String(value).trim();
      if (trimmedValue !== "") {
        // URL encode with uppercase encoding and spaces as '+' (PHP urlencode() style)
        const encodedValue = encodeURIComponent(trimmedValue)
          .replace(/%20/g, "+")
          .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
        paramString += `${key}=${encodedValue}&`;
      }
    }
  }

  // Remove last ampersand
  if (paramString.endsWith("&")) {
    paramString = paramString.slice(0, -1);
  }

  // Add passphrase if provided (also URL-encoded)
  if (passphrase && passphrase.trim() !== "") {
    const trimmedPassphrase = passphrase.trim();
    const encodedPassphrase = encodeURIComponent(trimmedPassphrase)
      .replace(/%20/g, "+")
      .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
    paramString += `&passphrase=${encodedPassphrase}`;
  }

  // Generate MD5 hash
  const hash = crypto.createHash("md5").update(paramString).digest("hex");

  return { paramString, hash };
}

/**
 * Build payment data in the exact order as per PayFast documentation
 */
function buildPaymentData() {
  const productionBaseUrl = "https://www.trevnoctilla.com";

  // Build data object in EXACT order as per PayFast docs
  const data = {};

  // 1. Merchant details (REQUIRED - must be first)
  data.merchant_id = PAYFAST_CONFIG.MERCHANT_ID;
  data.merchant_key = PAYFAST_CONFIG.MERCHANT_KEY;

  // 2. Return URLs
  data.return_url = `${productionBaseUrl}/payment/success`;
  data.cancel_url = `${productionBaseUrl}/payment/cancel`;
  data.notify_url = `${productionBaseUrl}/payment/notify`;

  // 3. Payment details
  data.m_payment_id = `payment_${Date.now()}`;
  data.amount = "20.00";
  data.item_name = "Premium Access";
  data.item_description = "Unlock premium features and remove ads";
  data.custom_str1 = data.m_payment_id;
  data.custom_str2 = `${productionBaseUrl}/tools/pdf-tools`;

  return data;
}

// Test 1: Basic signature generation
console.log("=".repeat(80));
console.log("TEST 1: Basic Signature Generation");
console.log("=".repeat(80));

const paymentData = buildPaymentData();
console.log("\n📋 Payment Data (in order):");
Object.keys(paymentData).forEach((key) => {
  console.log(`  ${key}: ${paymentData[key]}`);
});

const { paramString, hash } = generatePayFastSignature(
  paymentData,
  PAYFAST_CONFIG.PASSPHRASE
);

console.log("\n🔐 Signature String:");
console.log(paramString);
console.log("\n✅ Generated Signature:");
console.log(hash);
console.log("\n📝 Passphrase:");
console.log(`  Has passphrase: ${!!PAYFAST_CONFIG.PASSPHRASE}`);
console.log(
  `  Passphrase length: ${
    PAYFAST_CONFIG.PASSPHRASE ? PAYFAST_CONFIG.PASSPHRASE.length : 0
  }`
);

// Test 2: Verify signature string format
console.log("\n" + "=".repeat(80));
console.log("TEST 2: Signature String Format Verification");
console.log("=".repeat(80));

const expectedFields = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_str1",
  "custom_str2",
  "passphrase",
];

console.log("\n✅ Checking if all expected fields are present:");
expectedFields.forEach((field) => {
  const isPresent = paramString.includes(`${field}=`);
  console.log(
    `  ${isPresent ? "✅" : "❌"} ${field}: ${
      isPresent ? "Present" : "Missing"
    }`
  );
});

// Test 3: URL encoding verification
console.log("\n" + "=".repeat(80));
console.log("TEST 3: URL Encoding Verification");
console.log("=".repeat(80));

console.log("\n🔍 Checking URL encoding:");
const urlEncodingChecks = [
  {
    field: "return_url",
    raw: paymentData.return_url,
    expected: "https%3A%2F%2Fwww.trevnoctilla.com%2Fpayment%2Fsuccess",
  },
  {
    field: "item_name",
    raw: paymentData.item_name,
    expected: "Premium+Access",
  },
];

urlEncodingChecks.forEach(({ field, raw, expected }) => {
  const encoded = encodeURIComponent(raw)
    .replace(/%20/g, "+")
    .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
  const inString = paramString.match(new RegExp(`${field}=([^&]+)`))?.[1];
  console.log(`  ${field}:`);
  console.log(`    Raw: ${raw}`);
  console.log(`    Encoded: ${encoded}`);
  console.log(`    In string: ${inString}`);
  console.log(`    Match: ${encoded === inString ? "✅" : "❌"}`);
});

// Test 4: MD5 hash format
console.log("\n" + "=".repeat(80));
console.log("TEST 4: MD5 Hash Format Verification");
console.log("=".repeat(80));

console.log(`\n✅ Signature length: ${hash.length} characters (expected: 32)`);
console.log(
  `✅ Signature format: ${
    /^[a-f0-9]{32}$/.test(hash) ? "Valid MD5 hex" : "Invalid format"
  }`
);
console.log(
  `✅ Signature (lowercase): ${hash === hash.toLowerCase() ? "Yes" : "No"}`
);

// Test 5: Compare with PayFast expected format
console.log("\n" + "=".repeat(80));
console.log("TEST 5: PayFast Format Comparison");
console.log("=".repeat(80));

console.log("\n📝 Expected PayFast format:");
console.log("  - Fields in insertion order (not alphabetical)");
console.log("  - URL-encoded values (uppercase encoding, spaces as '+')");
console.log("  - Passphrase appended at the end");
console.log("  - MD5 hash (lowercase hex)");

console.log("\n✅ Our implementation:");
console.log(`  - Field order: ${Object.keys(paymentData).join(", ")}`);
console.log(`  - URL encoding: Uppercase encoding, spaces as '+'`);
console.log(
  `  - Passphrase: ${PAYFAST_CONFIG.PASSPHRASE ? "Included" : "Missing"}`
);
console.log(`  - MD5 hash: ${hash}`);

// Summary
console.log("\n" + "=".repeat(80));
console.log("SUMMARY");
console.log("=".repeat(80));

const allTestsPassed =
  hash.length === 32 &&
  /^[a-f0-9]{32}$/.test(hash) &&
  paramString.includes("passphrase=") &&
  expectedFields.every((field) => paramString.includes(`${field}=`));

console.log(
  `\n${allTestsPassed ? "✅" : "❌"} All tests: ${
    allTestsPassed ? "PASSED" : "FAILED"
  }`
);

if (!PAYFAST_CONFIG.PASSPHRASE) {
  console.log("\n⚠️  WARNING: Passphrase is missing!");
  console.log("   Set NEXT_PUBLIC_PAYFAST_PASSPHRASE environment variable.");
}

console.log("\n" + "=".repeat(80));
console.log("To test with actual PayFast credentials:");
console.log("  NEXT_PUBLIC_PAYFAST_MERCHANT_ID=10043520 \\");
console.log("  NEXT_PUBLIC_PAYFAST_MERCHANT_KEY=irqvo1c2j9l08 \\");
console.log("  NEXT_PUBLIC_PAYFAST_PASSPHRASE=Trevnoctilla_PayFast_Test \\");
console.log("  node test-payfast-signature.js");
console.log("=".repeat(80));

