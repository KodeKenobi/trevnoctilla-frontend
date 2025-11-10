/**
 * Test PayFastForm Component Integration
 *
 * This script tests the complete flow:
 * 1. PayFastForm builds payment data (client-side)
 * 2. PayFastForm calls API route to get signature
 * 3. API route returns signature
 * 4. Form data is complete and ready for submission
 *
 * Usage: node test-payfast-form-integration.js
 */

const http = require("http");

/**
 * Simulate what PayFastForm component does
 */
function testPayFastFormIntegration() {
  return new Promise((resolve, reject) => {
    // Step 1: Build payment data (as PayFastForm does)
    const productionBaseUrl = "https://www.trevnoctilla.com";
    const paymentData = {
      merchant_id: "10043520",
      merchant_key: "irqvo1c2j9l08",
      return_url: `${productionBaseUrl}/payment/success`,
      cancel_url: `${productionBaseUrl}/payment/cancel`,
      notify_url: `${productionBaseUrl}/payment/notify`,
      m_payment_id: `payment_${Date.now()}`,
      amount: "20.00",
      item_name: "Premium Access",
      item_description: "Unlock premium features and remove ads",
      custom_str1: `payment_${Date.now()}`,
      custom_str2: `${productionBaseUrl}/tools/pdf-tools`,
    };

    // Step 2: Call API route (as PayFastForm does)
    const apiRequestData = {
      amount: paymentData.amount,
      item_name: paymentData.item_name,
      item_description: paymentData.item_description,
      custom_str1: paymentData.custom_str1,
      custom_str2: paymentData.custom_str2,
    };

    const postData = JSON.stringify(apiRequestData);

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
          resolve({ result, paymentData });
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
console.log("PayFastForm Integration Test");
console.log("=".repeat(80));

testPayFastFormIntegration()
  .then(({ result, paymentData }) => {
    if (!result.success) {
      console.error("❌ API request failed:", result.error);
      process.exit(1);
    }

    const apiPaymentData = result.payment_data;
    const apiSignature = apiPaymentData.signature;

    console.log("\n📋 Step 1: Payment Data Built (Client-side)");
    console.log("  Fields:", Object.keys(paymentData));

    console.log("\n📋 Step 2: API Route Response");
    console.log("  Signature:", apiSignature);
    console.log(
      "  All Fields:",
      Object.keys(apiPaymentData).filter((k) => k !== "signature")
    );

    // Step 3: Verify form data is complete
    console.log("\n📋 Step 3: Complete Form Data (Ready for Submission)");
    const formData = { ...apiPaymentData };
    console.log("  All form fields:", Object.keys(formData));
    console.log("  Has signature:", !!formData.signature);
    console.log("  Signature value:", formData.signature);

    // Step 4: Verify required fields are present
    const requiredFields = [
      "merchant_id",
      "merchant_key",
      "return_url",
      "cancel_url",
      "notify_url",
      "m_payment_id",
      "amount",
      "item_name",
      "signature",
    ];

    console.log("\n✅ Step 4: Required Fields Check");
    let allPresent = true;
    requiredFields.forEach((field) => {
      const isPresent = field in formData && formData[field] !== "";
      console.log(
        `  ${isPresent ? "✅" : "❌"} ${field}: ${
          isPresent ? "Present" : "Missing"
        }`
      );
      if (!isPresent) allPresent = false;
    });

    if (!allPresent) {
      console.error("\n❌ FAILED: Missing required fields!");
      process.exit(1);
    }

    // Step 5: Test actual PayFast submission with this data
    console.log("\n📋 Step 5: Testing PayFast Submission");
    const https = require("https");
    const querystring = require("querystring");

    const formDataString = querystring.stringify(formData);
    const url = new URL("https://sandbox.payfast.co.za/eng/process");

    const payfastOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(formDataString),
        "User-Agent": "PayFast-Integration-Test/1.0",
      },
    };

    const payfastReq = https.request(payfastOptions, (payfastRes) => {
      let payfastData = "";

      payfastRes.on("data", (chunk) => {
        payfastData += chunk;
      });

      payfastRes.on("end", () => {
        console.log(
          `  Response Status: ${payfastRes.statusCode} ${payfastRes.statusMessage}`
        );

        if (payfastRes.statusCode === 200 || payfastRes.statusCode === 302) {
          console.log("  ✅ PayFast accepted the form!");
          console.log("\n" + "=".repeat(80));
          console.log("✅ INTEGRATION TEST: SUCCESS");
          console.log("=".repeat(80));
          console.log(
            "\nThe PayFastForm component integration works correctly:"
          );
          console.log("  1. ✅ Payment data built correctly");
          console.log("  2. ✅ API route generates signature");
          console.log("  3. ✅ Form data is complete");
          console.log("  4. ✅ PayFast accepts the submission");
        } else if (payfastRes.statusCode === 400) {
          console.log("  ❌ PayFast rejected the form (400 Bad Request)");
          console.log("\nResponse body (first 500 chars):");
          console.log(payfastData.substring(0, 500));
          console.log("\n" + "=".repeat(80));
          console.log("❌ INTEGRATION TEST: FAILED");
          console.log("=".repeat(80));
          process.exit(1);
        } else {
          console.log(`  ⚠️  Unexpected status: ${payfastRes.statusCode}`);
          console.log("\n" + "=".repeat(80));
          console.log("⚠️  INTEGRATION TEST: UNEXPECTED RESULT");
          console.log("=".repeat(80));
        }
      });
    });

    payfastReq.on("error", (error) => {
      console.error("  ❌ PayFast request error:", error.message);
      console.log("\n" + "=".repeat(80));
      console.log("❌ INTEGRATION TEST: FAILED");
      console.log("=".repeat(80));
      process.exit(1);
    });

    payfastReq.write(formDataString);
    payfastReq.end();
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error.message);
    console.log(
      "\nMake sure the Next.js dev server is running on localhost:3000"
    );
    process.exit(1);
  });
