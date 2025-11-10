/**
 * Test API Route Signature Generation
 *
 * This script tests that the API route generates the same signature
 * as the standalone test script for the same payment data.
 *
 * Usage: node test-api-signature.js
 */

const crypto = require("crypto");
const https = require("https");
const http = require("http");

// PayFast Configuration (same as test script)
const PAYFAST_CONFIG = {
  MERCHANT_ID: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || "10043520",
  MERCHANT_KEY: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || "irqvo1c2j9l08",
  PASSPHRASE:
    process.env.NEXT_PUBLIC_PAYFAST_PASSPHRASE || "Trevnoctilla_PayFast_Test",
};

/**
 * Generate signature using test script logic (includes ALL fields)
 */
function generateTestScriptSignature(paymentData, passphrase) {
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

  return crypto.createHash("md5").update(paramString).digest("hex");
}

/**
 * Test API route signature
 */
function testAPISignature() {
  return new Promise((resolve, reject) => {
    const testData = {
      amount: "20.00",
      item_name: "Premium Access",
      item_description: "Unlock premium features and remove ads",
      custom_str1: `test_${Date.now()}`,
      custom_str2: "https://www.trevnoctilla.com/tools/pdf-tools",
    };

    const postData = JSON.stringify(testData);

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/payments/payfast/initiate",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          resolve({ result, testData });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run test
console.log("=".repeat(80));
console.log("API Route Signature Test");
console.log("=".repeat(80));

testAPISignature()
  .then(({ result, testData }) => {
    if (!result.success) {
      console.error("❌ API request failed:", result.error);
      process.exit(1);
    }

    const apiPaymentData = result.payment_data;
    const apiSignature = apiPaymentData.signature;

    console.log("\n📋 API Response:");
    console.log("  Signature:", apiSignature);
    console.log(
      "  Payment Data Fields:",
      Object.keys(apiPaymentData).filter((k) => k !== "signature")
    );

    // Generate expected signature using test script logic
    const expectedSignature = generateTestScriptSignature(
      apiPaymentData,
      PAYFAST_CONFIG.PASSPHRASE
    );

    console.log("\n🔐 Signature Comparison:");
    console.log("  API Signature:    ", apiSignature);
    console.log("  Expected Signature:", expectedSignature);
    console.log(
      "  Match:            ",
      apiSignature === expectedSignature ? "✅" : "❌"
    );

    if (apiSignature === expectedSignature) {
      console.log("\n✅ SUCCESS: API route signature matches test script!");
    } else {
      console.log("\n❌ FAILED: Signatures don't match!");
      console.log(
        "\nThis means the API route signature generation differs from the test script."
      );
      process.exit(1);
    }

    // Verify field order matches test script
    const expectedOrder = [
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
    ];

    const actualOrder = Object.keys(apiPaymentData).filter(
      (k) => k !== "signature"
    );

    console.log("\n📋 Field Order Comparison:");
    console.log("  Expected:", expectedOrder.join(", "));
    console.log("  Actual:  ", actualOrder.join(", "));
    console.log(
      "  Match:   ",
      JSON.stringify(expectedOrder) === JSON.stringify(actualOrder)
        ? "✅"
        : "❌"
    );

    console.log("\n" + "=".repeat(80));
    console.log("Test Complete");
    console.log("=".repeat(80));
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error.message);
    console.log(
      "\nMake sure the Next.js dev server is running on localhost:3000"
    );
    process.exit(1);
  });
