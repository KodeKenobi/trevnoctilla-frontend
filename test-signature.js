/**
 * Test PayFast Signature Generation
 * This will help debug the signature mismatch issue
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

console.log("\n🔍 PayFast Signature Test\n");
console.log("=".repeat(60));

// Test data matching what we send
const testData = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: "http://localhost:3000/payment/success",
  cancel_url: "http://localhost:3000/payment/cancel",
  notify_url: "http://localhost:3000/api/payments/payfast/notify",
  m_payment_id: "pf_test_123",
  amount: "1.00",
  item_name: "Test Payment",
  item_description: "Automated test",
  email_address: "test@example.com",
};

console.log("\n📋 Test Data:");
console.log(JSON.stringify(testData, null, 2));

// Method 1: Our current method
function generateSignature1(data, passphrase) {
  const filtered = {};
  Object.keys(data).forEach((key) => {
    if (key !== "signature" && data[key] !== "" && data[key] !== null) {
      const value = String(data[key]).trim();
      if (value !== "") {
        filtered[key] = value;
      }
    }
  });

  const sorted = Object.keys(filtered).sort();
  const paramString = sorted.map((key) => `${key}=${filtered[key]}`).join("&");
  const withPass = passphrase
    ? `${paramString}&passphrase=${passphrase.trim()}`
    : paramString;

  return {
    paramString: withPass,
    signature: crypto.createHash("md5").update(withPass).digest("hex"),
  };
}

// Method 2: Alternative (no trimming in signature calc)
function generateSignature2(data, passphrase) {
  const filtered = {};
  Object.keys(data).forEach((key) => {
    if (key !== "signature" && data[key] !== "" && data[key] !== null) {
      filtered[key] = String(data[key]);
    }
  });

  const sorted = Object.keys(filtered).sort();
  const paramString = sorted.map((key) => `${key}=${filtered[key]}`).join("&");
  const withPass = passphrase
    ? `${paramString}&passphrase=${passphrase}`
    : paramString;

  return {
    paramString: withPass,
    signature: crypto.createHash("md5").update(withPass).digest("hex"),
  };
}

console.log("\n🧪 Method 1 (with trimming):");
const result1 = generateSignature1(testData, PASSPHRASE);
console.log("Parameter String:");
console.log(result1.paramString);
console.log("Signature:", result1.signature);

console.log("\n🧪 Method 2 (no trimming in calc):");
const result2 = generateSignature2(testData, PASSPHRASE);
console.log("Parameter String:");
console.log(result2.paramString);
console.log("Signature:", result2.signature);

console.log("\n📊 Comparison:");
console.log("Signatures match:", result1.signature === result2.signature);
console.log(
  "Parameter strings match:",
  result1.paramString === result2.paramString
);

// Show exact byte representation
console.log("\n🔬 Byte Analysis:");
console.log("Method 1 param string length:", result1.paramString.length);
console.log("Method 2 param string length:", result2.paramString.length);
console.log(
  "Method 1 bytes:",
  Buffer.from(result1.paramString).toString("hex")
);
console.log(
  "Method 2 bytes:",
  Buffer.from(result2.paramString).toString("hex")
);

console.log("\n" + "=".repeat(60));
console.log("\n💡 If signatures don't match PayFast, check:");
console.log("1. Passphrase is exactly: " + PASSPHRASE);
console.log("2. All values are trimmed consistently");
console.log("3. No extra whitespace or special characters");
console.log("4. Parameter order is alphabetical");
 * Test PayFast Signature Generation
 * This will help debug the signature mismatch issue
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

console.log("\n🔍 PayFast Signature Test\n");
console.log("=".repeat(60));

// Test data matching what we send
const testData = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: "http://localhost:3000/payment/success",
  cancel_url: "http://localhost:3000/payment/cancel",
  notify_url: "http://localhost:3000/api/payments/payfast/notify",
  m_payment_id: "pf_test_123",
  amount: "1.00",
  item_name: "Test Payment",
  item_description: "Automated test",
  email_address: "test@example.com",
};

console.log("\n📋 Test Data:");
console.log(JSON.stringify(testData, null, 2));

// Method 1: Our current method
function generateSignature1(data, passphrase) {
  const filtered = {};
  Object.keys(data).forEach((key) => {
    if (key !== "signature" && data[key] !== "" && data[key] !== null) {
      const value = String(data[key]).trim();
      if (value !== "") {
        filtered[key] = value;
      }
    }
  });

  const sorted = Object.keys(filtered).sort();
  const paramString = sorted.map((key) => `${key}=${filtered[key]}`).join("&");
  const withPass = passphrase
    ? `${paramString}&passphrase=${passphrase.trim()}`
    : paramString;

  return {
    paramString: withPass,
    signature: crypto.createHash("md5").update(withPass).digest("hex"),
  };
}

// Method 2: Alternative (no trimming in signature calc)
function generateSignature2(data, passphrase) {
  const filtered = {};
  Object.keys(data).forEach((key) => {
    if (key !== "signature" && data[key] !== "" && data[key] !== null) {
      filtered[key] = String(data[key]);
    }
  });

  const sorted = Object.keys(filtered).sort();
  const paramString = sorted.map((key) => `${key}=${filtered[key]}`).join("&");
  const withPass = passphrase
    ? `${paramString}&passphrase=${passphrase}`
    : paramString;

  return {
    paramString: withPass,
    signature: crypto.createHash("md5").update(withPass).digest("hex"),
  };
}

console.log("\n🧪 Method 1 (with trimming):");
const result1 = generateSignature1(testData, PASSPHRASE);
console.log("Parameter String:");
console.log(result1.paramString);
console.log("Signature:", result1.signature);

console.log("\n🧪 Method 2 (no trimming in calc):");
const result2 = generateSignature2(testData, PASSPHRASE);
console.log("Parameter String:");
console.log(result2.paramString);
console.log("Signature:", result2.signature);

console.log("\n📊 Comparison:");
console.log("Signatures match:", result1.signature === result2.signature);
console.log(
  "Parameter strings match:",
  result1.paramString === result2.paramString
);

// Show exact byte representation
console.log("\n🔬 Byte Analysis:");
console.log("Method 1 param string length:", result1.paramString.length);
console.log("Method 2 param string length:", result2.paramString.length);
console.log(
  "Method 1 bytes:",
  Buffer.from(result1.paramString).toString("hex")
);
console.log(
  "Method 2 bytes:",
  Buffer.from(result2.paramString).toString("hex")
);

console.log("\n" + "=".repeat(60));
console.log("\n💡 If signatures don't match PayFast, check:");
console.log("1. Passphrase is exactly: " + PASSPHRASE);
console.log("2. All values are trimmed consistently");
console.log("3. No extra whitespace or special characters");
console.log("4. Parameter order is alphabetical");
