/**
 * PayFast Signature Verification Tool
 * Based on PayFast Developer Documentation
 *
 * This tool helps verify that your signature calculation matches PayFast's requirements
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load environment variables
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

const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || "10043520";
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || "irqvo1c2j9l08";
const PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE || "Trevnoctilla_PayFast_Test";

console.log("\n" + "=".repeat(70));
console.log("PayFast Signature Verification Tool");
console.log("Based on PayFast Developer Documentation");
console.log("=".repeat(70) + "\n");

// Test data matching a real payment
const testPaymentData = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: "http://localhost:3000/payment/success",
  cancel_url: "http://localhost:3000/payment/cancel",
  notify_url: "http://localhost:3000/api/payments/payfast/notify",
  m_payment_id: "pf_test_12345",
  amount: "1.00",
  item_name: "Test Payment",
  item_description: "Test",
  email_address: "test@example.com",
};

console.log("📋 Test Payment Data:");
console.log(JSON.stringify(testPaymentData, null, 2));
console.log("\n" + "-".repeat(70));

// Method 1: Standard PayFast signature (RAW values)
function generateSignatureMethod1(data, passphrase) {
  console.log("\n🔐 Method 1: Standard PayFast (RAW values, no encoding)");

  // Filter and sort
  const filtered = {};
  Object.keys(data).forEach((key) => {
    if (key !== "signature" && data[key] !== "" && data[key] != null) {
      filtered[key] = String(data[key]).trim();
    }
  });

  const sorted = Object.keys(filtered).sort();
  const paramString = sorted.map((key) => `${key}=${filtered[key]}`).join("&");
  const withPass = passphrase
    ? `${paramString}&passphrase=${passphrase.trim()}`
    : paramString;

  const signature = crypto.createHash("md5").update(withPass).digest("hex");

  console.log("Parameter String:");
  console.log(withPass);
  console.log("Signature:", signature);

  return { paramString: withPass, signature };
}

// Method 2: Alternative (checking if PayFast expects something different)
function generateSignatureMethod2(data, passphrase) {
  console.log("\n🔐 Method 2: Alternative (checking encoding)");

  const filtered = {};
  Object.keys(data).forEach((key) => {
    if (key !== "signature" && data[key] !== "" && data[key] != null) {
      // Don't trim, use as-is
      filtered[key] = String(data[key]);
    }
  });

  const sorted = Object.keys(filtered).sort();
  const paramString = sorted.map((key) => `${key}=${filtered[key]}`).join("&");
  const withPass = passphrase
    ? `${paramString}&passphrase=${passphrase}`
    : paramString;

  const signature = crypto.createHash("md5").update(withPass).digest("hex");

  console.log("Parameter String:");
  console.log(withPass);
  console.log("Signature:", signature);

  return { paramString: withPass, signature };
}

// Run both methods
const result1 = generateSignatureMethod1(testPaymentData, PASSPHRASE);
const result2 = generateSignatureMethod2(testPaymentData, PASSPHRASE);

console.log("\n" + "=".repeat(70));
console.log("📊 Comparison:");
console.log("Signatures match:", result1.signature === result2.signature);
console.log(
  "Parameter strings match:",
  result1.paramString === result2.paramString
);

if (result1.paramString !== result2.paramString) {
  console.log("\n⚠️ Difference found:");
  const len1 = result1.paramString.length;
  const len2 = result2.paramString.length;
  console.log(`Method 1 length: ${len1}`);
  console.log(`Method 2 length: ${len2}`);

  // Find first difference
  for (let i = 0; i < Math.max(len1, len2); i++) {
    if (result1.paramString[i] !== result2.paramString[i]) {
      console.log(`First difference at position ${i}:`);
      console.log(
        `  Method 1: "${
          result1.paramString[i]
        }" (char code: ${result1.paramString.charCodeAt(i)})`
      );
      console.log(
        `  Method 2: "${
          result2.paramString[i]
        }" (char code: ${result2.paramString.charCodeAt(i)})`
      );
      break;
    }
  }
}

console.log("\n" + "=".repeat(70));
console.log("💡 PayFast Signature Requirements (from documentation):");
console.log("1. Sort all parameters alphabetically by key");
console.log("2. Exclude empty values and the signature field itself");
console.log("3. Trim whitespace from all values");
console.log("4. Format as key=value pairs");
console.log("5. Join with &");
console.log("6. Append &passphrase=value (if passphrase is set)");
console.log("7. Use RAW values (NOT URL encoded) for signature calculation");
console.log("8. MD5 hash the entire string (lowercase hex)");
console.log("\n✅ Method 1 should be correct (RAW values, trimmed)");
console.log("=".repeat(70) + "\n");
 * PayFast Signature Verification Tool
 * Based on PayFast Developer Documentation
 *
 * This tool helps verify that your signature calculation matches PayFast's requirements
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load environment variables
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

const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || "10043520";
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || "irqvo1c2j9l08";
const PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE || "Trevnoctilla_PayFast_Test";

console.log("\n" + "=".repeat(70));
console.log("PayFast Signature Verification Tool");
console.log("Based on PayFast Developer Documentation");
console.log("=".repeat(70) + "\n");

// Test data matching a real payment
const testPaymentData = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: "http://localhost:3000/payment/success",
  cancel_url: "http://localhost:3000/payment/cancel",
  notify_url: "http://localhost:3000/api/payments/payfast/notify",
  m_payment_id: "pf_test_12345",
  amount: "1.00",
  item_name: "Test Payment",
  item_description: "Test",
  email_address: "test@example.com",
};

console.log("📋 Test Payment Data:");
console.log(JSON.stringify(testPaymentData, null, 2));
console.log("\n" + "-".repeat(70));

// Method 1: Standard PayFast signature (RAW values)
function generateSignatureMethod1(data, passphrase) {
  console.log("\n🔐 Method 1: Standard PayFast (RAW values, no encoding)");

  // Filter and sort
  const filtered = {};
  Object.keys(data).forEach((key) => {
    if (key !== "signature" && data[key] !== "" && data[key] != null) {
      filtered[key] = String(data[key]).trim();
    }
  });

  const sorted = Object.keys(filtered).sort();
  const paramString = sorted.map((key) => `${key}=${filtered[key]}`).join("&");
  const withPass = passphrase
    ? `${paramString}&passphrase=${passphrase.trim()}`
    : paramString;

  const signature = crypto.createHash("md5").update(withPass).digest("hex");

  console.log("Parameter String:");
  console.log(withPass);
  console.log("Signature:", signature);

  return { paramString: withPass, signature };
}

// Method 2: Alternative (checking if PayFast expects something different)
function generateSignatureMethod2(data, passphrase) {
  console.log("\n🔐 Method 2: Alternative (checking encoding)");

  const filtered = {};
  Object.keys(data).forEach((key) => {
    if (key !== "signature" && data[key] !== "" && data[key] != null) {
      // Don't trim, use as-is
      filtered[key] = String(data[key]);
    }
  });

  const sorted = Object.keys(filtered).sort();
  const paramString = sorted.map((key) => `${key}=${filtered[key]}`).join("&");
  const withPass = passphrase
    ? `${paramString}&passphrase=${passphrase}`
    : paramString;

  const signature = crypto.createHash("md5").update(withPass).digest("hex");

  console.log("Parameter String:");
  console.log(withPass);
  console.log("Signature:", signature);

  return { paramString: withPass, signature };
}

// Run both methods
const result1 = generateSignatureMethod1(testPaymentData, PASSPHRASE);
const result2 = generateSignatureMethod2(testPaymentData, PASSPHRASE);

console.log("\n" + "=".repeat(70));
console.log("📊 Comparison:");
console.log("Signatures match:", result1.signature === result2.signature);
console.log(
  "Parameter strings match:",
  result1.paramString === result2.paramString
);

if (result1.paramString !== result2.paramString) {
  console.log("\n⚠️ Difference found:");
  const len1 = result1.paramString.length;
  const len2 = result2.paramString.length;
  console.log(`Method 1 length: ${len1}`);
  console.log(`Method 2 length: ${len2}`);

  // Find first difference
  for (let i = 0; i < Math.max(len1, len2); i++) {
    if (result1.paramString[i] !== result2.paramString[i]) {
      console.log(`First difference at position ${i}:`);
      console.log(
        `  Method 1: "${
          result1.paramString[i]
        }" (char code: ${result1.paramString.charCodeAt(i)})`
      );
      console.log(
        `  Method 2: "${
          result2.paramString[i]
        }" (char code: ${result2.paramString.charCodeAt(i)})`
      );
      break;
    }
  }
}

console.log("\n" + "=".repeat(70));
console.log("💡 PayFast Signature Requirements (from documentation):");
console.log("1. Sort all parameters alphabetically by key");
console.log("2. Exclude empty values and the signature field itself");
console.log("3. Trim whitespace from all values");
console.log("4. Format as key=value pairs");
console.log("5. Join with &");
console.log("6. Append &passphrase=value (if passphrase is set)");
console.log("7. Use RAW values (NOT URL encoded) for signature calculation");
console.log("8. MD5 hash the entire string (lowercase hex)");
console.log("\n✅ Method 1 should be correct (RAW values, trimmed)");
console.log("=".repeat(70) + "\n");
