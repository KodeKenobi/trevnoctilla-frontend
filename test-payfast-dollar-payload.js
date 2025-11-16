/**
 * Test script to verify PayFastDollarForm payload is sent to PayFast
 * Tests the $1 payment flow with minimal fields (no notify_url)
 */

const https = require("https");
const http = require("http");
const querystring = require("querystring");
const { exec } = require("child_process");

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

// Test payment data for $1 payment (matching PayFastDollarForm)
const TEST_PAYMENT = {
  amount: "1.00",
  item_name: "Premium Access",
  item_description: "Unlock premium features and remove ads",
  return_url: "https://www.trevnoctilla.com/payment/success",
  cancel_url: "https://www.trevnoctilla.com/payment/cancel",
  // NOTE: notify_url is intentionally NOT included for $1 payments
};

/**
 * Fetch payment data from API (same as PayFastDollarForm does)
 */
async function fetchPaymentData() {
  console.log("\n" + "=".repeat(80));
  console.log("📡 STEP 1: Fetching payment data from API");
  console.log("=".repeat(80));
  console.log(`API Endpoint: ${BASE_URL}/api/payments/payfast/initiate`);
  console.log("Request Data:", JSON.stringify(TEST_PAYMENT, null, 2));

  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}/api/payments/payfast/initiate`);
    const postData = JSON.stringify(TEST_PAYMENT);

    const isHttps = url.protocol === "https:";
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = httpModule.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode !== 200) {
          console.error(`❌ API Error: ${res.statusCode}`);
          console.error("Response:", responseData);
          reject(new Error(`API returned ${res.statusCode}`));
          return;
        }

        try {
          const data = JSON.parse(responseData);
          if (data.payment_data) {
            console.log("✅ API Response received");
            console.log("Payment Data Fields:", Object.keys(data.payment_data));
            resolve(data.payment_data);
          } else {
            console.error("❌ No payment_data in response");
            console.error("Response:", data);
            reject(new Error("No payment_data in response"));
          }
        } catch (error) {
          console.error("❌ Failed to parse API response");
          console.error("Response:", responseData);
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ Request error:", error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Verify payload structure (should match PayFastDollarForm requirements)
 */
function verifyPayloadStructure(paymentData) {
  console.log("\n" + "=".repeat(80));
  console.log("🔍 STEP 2: Verifying Payload Structure");
  console.log("=".repeat(80));

  const requiredFields = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "amount",
    "item_name",
    "signature",
  ];

  let allValid = true;

  // Check required fields are present
  console.log("\n✅ Required Fields Check:");
  requiredFields.forEach((field) => {
    const isPresent = field in paymentData && paymentData[field] !== "";
    console.log(
      `  ${isPresent ? "✅" : "❌"} ${field}: ${
        isPresent ? `"${paymentData[field]}"` : "MISSING"
      }`
    );
    if (!isPresent) allValid = false;
  });

  // Check notify_url is NOT present (for $1 payments)
  console.log("\n✅ notify_url Check (should be EXCLUDED for $1 payments):");
  if (paymentData.notify_url) {
    console.log(
      `  ❌ notify_url is present: "${paymentData.notify_url}" - SHOULD NOT BE PRESENT`
    );
    allValid = false;
  } else {
    console.log("  ✅ notify_url is correctly excluded");
  }

  // Show all fields
  console.log("\n📋 All Fields in Payload:");
  Object.keys(paymentData).forEach((key) => {
    const value = paymentData[key];
    if (key === "signature") {
      console.log(`  ${key}: "${value}" (MD5 hash)`);
    } else {
      console.log(`  ${key}: "${value}"`);
    }
  });

  if (!allValid) {
    throw new Error("Payload structure validation failed");
  }

  console.log("\n✅ Payload structure is valid!");
  return true;
}

/**
 * Submit payload to PayFast
 */
function submitToPayFast(paymentData) {
  return new Promise((resolve, reject) => {
    const payfastUrl =
      process.env.PAYFAST_URL || "https://sandbox.payfast.co.za/eng/process";
    const urlObj = new URL(payfastUrl);

    // Build form data (URL encoded)
    const formData = querystring.stringify(paymentData);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(formData),
        "User-Agent": "PayFastDollarForm-Test/1.0",
      },
    };

    console.log("\n" + "=".repeat(80));
    console.log("🚀 STEP 3: Submitting Payload to PayFast");
    console.log("=".repeat(80));
    console.log(`PayFast URL: ${payfastUrl}`);
    console.log(`Form Data Length: ${formData.length} bytes`);

    console.log("\n📦 Payload Fields Being Sent:");
    Object.keys(paymentData).forEach((key) => {
      if (key !== "signature") {
        console.log(`  ${key} = "${paymentData[key]}"`);
      } else {
        console.log(`  ${key} = "${paymentData[key]}" (MD5 hash)`);
      }
    });

    console.log("\n📝 Form Data String (URL Encoded):");
    console.log(formData);

    const req = https.request(options, (res) => {
      let responseData = "";

      console.log("\n📥 PayFast Response:");
      console.log(`  Status Code: ${res.statusCode}`);
      console.log(`  Status Message: ${res.statusMessage}`);
      console.log(`  Headers:`, JSON.stringify(res.headers, null, 2));

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log("\n📄 Response Body (first 1000 chars):");
        console.log(responseData.substring(0, 1000));

        // PayFast typically returns 302 redirect or 200 with payment page
        if (res.statusCode === 302 || res.statusCode === 200) {
          const location = res.headers.location;
          if (location) {
            console.log("\n✅ SUCCESS! PayFast accepted the payload");
            console.log(`Redirect URL: ${location}`);
            resolve({
              success: true,
              statusCode: res.statusCode,
              redirectUrl: location,
              responseBody: responseData,
            });
          } else if (res.statusCode === 200) {
            // Check if response contains PayFast payment page
            if (
              responseData.includes("PayFast") ||
              responseData.includes("payfast")
            ) {
              console.log("\n✅ SUCCESS! PayFast payment page returned");
              resolve({
                success: true,
                statusCode: res.statusCode,
                responseBody: responseData,
              });
            } else {
              console.log(
                "\n⚠️  Unexpected response (no redirect, no PayFast page)"
              );
              resolve({
                success: false,
                statusCode: res.statusCode,
                responseBody: responseData,
              });
            }
          } else {
            resolve({
              success: true,
              statusCode: res.statusCode,
              responseBody: responseData,
            });
          }
        } else if (res.statusCode === 400) {
          console.log("\n❌ BAD REQUEST (400) - Check signature or payload");
          // Try to extract error message
          const errorMatch = responseData.match(/<p[^>]*>([^<]+)<\/p>/i);
          if (errorMatch) {
            console.log(`Error message: ${errorMatch[1]}`);
          }
          reject({
            success: false,
            statusCode: res.statusCode,
            error: "Bad Request - signature or payload issue",
            responseBody: responseData,
          });
        } else {
          console.log(`\n❌ FAILED - Status Code: ${res.statusCode}`);
          reject({
            success: false,
            statusCode: res.statusCode,
            error: `Unexpected status code: ${res.statusCode}`,
            responseBody: responseData,
          });
        }
      });
    });

    req.on("error", (error) => {
      console.log("\n❌ REQUEST ERROR:");
      console.error(error);
      reject({
        success: false,
        error: error.message,
      });
    });

    req.write(formData);
    req.end();
  });
}

/**
 * Main test function
 */
async function testPayFastDollarPayload() {
  console.log("=".repeat(80));
  console.log("🧪 PAYFAST DOLLAR FORM PAYLOAD TEST");
  console.log("=".repeat(80));
  console.log("Testing $1 payment with minimal fields (no notify_url)");
  console.log("=".repeat(80));

  try {
    // Step 1: Fetch payment data from API
    const paymentData = await fetchPaymentData();

    // Step 2: Verify payload structure
    verifyPayloadStructure(paymentData);

    // Step 3: Submit to PayFast
    const result = await submitToPayFast(paymentData);

    // Final result
    console.log("\n" + "=".repeat(80));
    if (result.success) {
      console.log("✅ TEST PASSED!");
      console.log("   Payload was successfully sent to PayFast");
      console.log(`   Status Code: ${result.statusCode}`);
      if (result.redirectUrl) {
        console.log(`   Redirect URL: ${result.redirectUrl}`);
        console.log("\n🌐 Opening PayFast payment page in browser...");

        // Open the PayFast payment page in the default browser
        const platform = process.platform;
        let command;

        if (platform === "win32") {
          command = `start "" "${result.redirectUrl}"`;
        } else if (platform === "darwin") {
          command = `open "${result.redirectUrl}"`;
        } else {
          command = `xdg-open "${result.redirectUrl}"`;
        }

        exec(command, (error) => {
          if (error) {
            console.log(
              `\n⚠️  Could not open browser automatically. Please open this URL manually:`
            );
            console.log(`   ${result.redirectUrl}`);
          } else {
            console.log("✅ Browser opened with PayFast payment page");
          }
        });
      }
    } else {
      console.log("❌ TEST FAILED");
      console.log(`   Status Code: ${result.statusCode}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    console.log("=".repeat(80));

    // Don't exit immediately - give time for browser to open
    setTimeout(() => {
      process.exit(result.success ? 0 : 1);
    }, 2000);
  } catch (error) {
    console.log("\n" + "=".repeat(80));
    console.log("❌ TEST FAILED WITH ERROR:");
    console.error(error);
    console.log("=".repeat(80));
    process.exit(1);
  }
}

// Run the test
testPayFastDollarPayload();
