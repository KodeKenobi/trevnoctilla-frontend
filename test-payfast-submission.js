/**
 * PayFast Form Submission Test Script
 *
 * This script tests the actual PayFast form submission
 * by generating the form HTML and signature.
 *
 * Usage: node test-payfast-submission.js
 */

const crypto = require("crypto");
const https = require("https");
const querystring = require("querystring");

// PayFast Configuration
const PAYFAST_CONFIG = {
  MERCHANT_ID: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || "10043520",
  MERCHANT_KEY: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || "irqvo1c2j9l08",
  PASSPHRASE:
    process.env.NEXT_PUBLIC_PAYFAST_PASSPHRASE || "Trevnoctilla_PayFast_Test",
  PAYFAST_URL:
    process.env.NEXT_PUBLIC_PAYFAST_URL ||
    "https://sandbox.payfast.co.za/eng/process",
};

/**
 * Generate PayFast signature
 */
function generatePayFastSignature(paymentData, passphrase) {
  let paramString = "";

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
        const encodedValue = encodeURIComponent(trimmedValue)
          .replace(/%20/g, "+")
          .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
        paramString += `${key}=${encodedValue}&`;
      }
    }
  }

  if (paramString.endsWith("&")) {
    paramString = paramString.slice(0, -1);
  }

  if (passphrase && passphrase.trim() !== "") {
    const trimmedPassphrase = passphrase.trim();
    const encodedPassphrase = encodeURIComponent(trimmedPassphrase)
      .replace(/%20/g, "+")
      .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
    paramString += `&passphrase=${encodedPassphrase}`;
  }

  const hash = crypto.createHash("md5").update(paramString).digest("hex");
  return { paramString, hash };
}

/**
 * Build payment data
 */
function buildPaymentData() {
  const productionBaseUrl = "https://www.trevnoctilla.com";

  const data = {};
  data.merchant_id = PAYFAST_CONFIG.MERCHANT_ID;
  data.merchant_key = PAYFAST_CONFIG.MERCHANT_KEY;
  data.return_url = `${productionBaseUrl}/payment/success`;
  data.cancel_url = `${productionBaseUrl}/payment/cancel`;
  data.notify_url = `${productionBaseUrl}/payment/notify`;
  data.m_payment_id = `payment_${Date.now()}`;
  data.amount = "20.00";
  data.item_name = "Premium Access";
  data.item_description = "Unlock premium features and remove ads";
  data.custom_str1 = data.m_payment_id;
  data.custom_str2 = `${productionBaseUrl}/tools/pdf-tools`;

  return data;
}

/**
 * Test PayFast submission
 */
function testPayFastSubmission() {
  console.log("=".repeat(80));
  console.log("PayFast Form Submission Test");
  console.log("=".repeat(80));

  const paymentData = buildPaymentData();
  const { paramString, hash } = generatePayFastSignature(
    paymentData,
    PAYFAST_CONFIG.PASSPHRASE
  );

  paymentData.signature = hash;

  console.log("\n📋 Payment Data:");
  Object.keys(paymentData).forEach((key) => {
    if (key !== "signature") {
      console.log(`  ${key}: ${paymentData[key]}`);
    }
  });

  console.log(`\n🔐 Signature: ${hash}`);
  console.log(`\n🔐 Signature String (for verification):`);
  console.log(paramString);

  console.log("\n📝 Passphrase Status:");
  console.log(`  Has passphrase: ${!!PAYFAST_CONFIG.PASSPHRASE}`);
  console.log(
    `  Passphrase length: ${
      PAYFAST_CONFIG.PASSPHRASE ? PAYFAST_CONFIG.PASSPHRASE.length : 0
    }`
  );

  // Generate HTML form
  console.log("\n" + "=".repeat(80));
  console.log("Generated HTML Form");
  console.log("=".repeat(80));

  let htmlForm = `<form action="${PAYFAST_CONFIG.PAYFAST_URL}" method="post">\n`;
  for (const key in paymentData) {
    htmlForm += `  <input type="hidden" name="${key}" value="${paymentData[key]}" />\n`;
  }
  htmlForm += `  <input type="submit" value="Pay Now" />\n`;
  htmlForm += `</form>`;

  console.log("\n" + htmlForm);

  // Generate form data for POST request
  const formData = querystring.stringify(paymentData);

  console.log("\n" + "=".repeat(80));
  console.log("Form Data (URL Encoded)");
  console.log("=".repeat(80));
  console.log(formData);

  // Test POST request to PayFast
  console.log("\n" + "=".repeat(80));
  console.log("Testing POST Request to PayFast");
  console.log("=".repeat(80));

  const url = new URL(PAYFAST_CONFIG.PAYFAST_URL);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(formData),
      "User-Agent": "PayFast-Test-Script/1.0",
    },
  };

  console.log(`\n📡 Sending POST request to: ${PAYFAST_CONFIG.PAYFAST_URL}`);
  console.log(`📦 Data length: ${formData.length} bytes`);

  const req = https.request(options, (res) => {
    console.log(`\n📥 Response Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`📋 Response Headers:`, res.headers);

    let responseData = "";
    res.on("data", (chunk) => {
      responseData += chunk;
    });

    res.on("end", () => {
      console.log(`\n📄 Response Body (first 500 chars):`);
      console.log(responseData.substring(0, 500));

      if (res.statusCode === 200 || res.statusCode === 302) {
        console.log("\n✅ Request successful! PayFast accepted the form.");
      } else if (res.statusCode === 400) {
        console.log("\n❌ Bad Request (400) - Check signature or form data");
        // Try to extract error message
        const errorMatch = responseData.match(/<p[^>]*>([^<]+)<\/p>/i);
        if (errorMatch) {
          console.log(`\nError message: ${errorMatch[1]}`);
        }
      } else {
        console.log(`\n⚠️  Unexpected status code: ${res.statusCode}`);
      }

      console.log("\n" + "=".repeat(80));
      console.log("Test Complete");
      console.log("=".repeat(80));
    });
  });

  req.on("error", (error) => {
    console.error(`\n❌ Request error: ${error.message}`);
  });

  req.write(formData);
  req.end();
}

// Run the test
testPayFastSubmission();

