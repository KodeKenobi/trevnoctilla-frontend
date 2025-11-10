/**
 * Live PayFast Test - Actually submits to PayFast and shows result
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");

// Step 1: Get payment data from API
function getPaymentData() {
  return new Promise((resolve, reject) => {
    const testData = {
      amount: "1.00",
      item_name: "Live Test Payment",
      item_description: "Testing actual PayFast submission",
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
      timeout: 10000,
    };

    console.log("=".repeat(80));
    console.log("STEP 1: Getting Payment Data from API");
    console.log("=".repeat(80));
    console.log(
      `\n📡 Calling: http://localhost:3000/api/payments/payfast/initiate`
    );
    console.log(`📦 Request data:`, testData);

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200 && result.success) {
            console.log(`\n✅ API Response: ${res.statusCode}`);
            console.log(`🔐 Signature: ${result.payment_data.signature}`);
            console.log(`🔗 PayFast URL: ${result.payment_url}`);
            resolve(result);
          } else {
            reject(
              new Error(
                `API Error: ${res.statusCode} - ${JSON.stringify(result)}`
              )
            );
          }
        } catch (error) {
          reject(
            new Error(
              `Failed to parse response: ${error.message}\nResponse: ${data}`
            )
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(
        new Error(
          `Request failed: ${error.message}\nMake sure the dev server is running: npm run dev`
        )
      );
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout - is the server running?"));
    });

    req.write(postData);
    req.end();
  });
}

// Step 2: Submit to PayFast
function submitToPayFast(paymentData) {
  return new Promise((resolve, reject) => {
    const payfastUrl = new URL(paymentData.payment_url);

    // Build form data
    const formData = new URLSearchParams();
    Object.keys(paymentData.payment_data).forEach((key) => {
      formData.append(key, String(paymentData.payment_data[key]));
    });

    const options = {
      hostname: payfastUrl.hostname,
      port: 443,
      path: payfastUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(formData.toString()),
        "User-Agent": "PayFast-Test/1.0",
      },
      timeout: 30000,
    };

    console.log("\n" + "=".repeat(80));
    console.log("STEP 2: Submitting to PayFast");
    console.log("=".repeat(80));
    console.log(`\n📡 Target: ${paymentData.payment_url}`);
    console.log(`📦 Form data length: ${formData.toString().length} bytes`);
    console.log(`\n📋 Payment Data being sent:`);
    Object.keys(paymentData.payment_data).forEach((key) => {
      if (key === "signature") {
        console.log(
          `  ${key}: ${paymentData.payment_data[key]} (${paymentData.payment_data[key].length} chars)`
        );
      } else {
        console.log(`  ${key}: ${paymentData.payment_data[key]}`);
      }
    });

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log(`\n📥 PayFast Response:`);
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`   Headers:`);
        Object.keys(res.headers).forEach((key) => {
          console.log(`     ${key}: ${res.headers[key]}`);
        });

        const location = res.headers.location;
        if (location) {
          console.log(`\n🔗 Redirect Location: ${location}`);
        }

        // Check for errors
        if (res.statusCode === 200 || res.statusCode === 302) {
          console.log(`\n✅ SUCCESS! PayFast accepted the payment!`);
          if (res.statusCode === 302 && location) {
            console.log(`   Redirecting to: ${location}`);
          }
          resolve({
            success: true,
            statusCode: res.statusCode,
            location,
            responseData,
          });
        } else if (res.statusCode === 400) {
          console.log(`\n❌ ERROR 400: Bad Request - Signature or data issue`);

          // Try to extract error message
          const errorPatterns = [
            /Generated signature does not match[^<]+/i,
            /Merchant is unable to receive[^<]+/i,
            /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
            /<title>([^<]+)<\/title>/i,
            /Error[:\s]+([^<\n]+)/i,
          ];

          let errorMessage = "Unknown error";
          for (const pattern of errorPatterns) {
            const match = responseData.match(pattern);
            if (match && (match[1] || match[0])) {
              errorMessage = (match[1] || match[0]).trim();
              break;
            }
          }

          console.log(`\n❌ Error Message: ${errorMessage}`);
          console.log(`\n📄 Response HTML (first 2000 chars):`);
          console.log(responseData.substring(0, 2000));

          reject({
            success: false,
            statusCode: res.statusCode,
            error: errorMessage,
            responseData,
          });
        } else {
          console.log(`\n⚠️  Unexpected status: ${res.statusCode}`);
          console.log(`\n📄 Response (first 2000 chars):`);
          console.log(responseData.substring(0, 2000));
          resolve({ success: false, statusCode: res.statusCode, responseData });
        }
      });
    });

    req.on("error", (error) => {
      console.error(`\n❌ Request error: ${error.message}`);
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.write(formData.toString());
    req.end();
  });
}

// Run the test
async function runTest() {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("PAYFAST LIVE SUBMISSION TEST");
    console.log("=".repeat(80));
    console.log("\n⚠️  Make sure the Next.js dev server is running:");
    console.log("   npm run dev\n");

    const paymentData = await getPaymentData();
    const result = await submitToPayFast(paymentData);

    console.log("\n" + "=".repeat(80));
    console.log("TEST COMPLETE");
    console.log("=".repeat(80));

    if (result.success) {
      console.log("\n✅ PAYFAST ACCEPTED THE PAYMENT!");
      console.log("   The signature generation is working correctly.");
    } else {
      console.log("\n❌ PAYFAST REJECTED THE PAYMENT");
      console.log("   Check the error message above.");
    }
  } catch (error) {
    console.error("\n" + "=".repeat(80));
    console.error("TEST FAILED");
    console.error("=".repeat(80));
    console.error(`\n❌ Error: ${error.message}`);
    if (error.stack) {
      console.error(`\nStack trace:\n${error.stack}`);
    }
    process.exit(1);
  }
}

runTest();
