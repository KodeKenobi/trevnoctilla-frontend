/**
 * Test script that actually SUBMITS to PayFast and captures the response
 * This will tell us if PayFast accepts or rejects the payment
 */

const http = require("http");
const https = require("https");
const querystring = require("querystring");

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const PLAN_ID = "production";
const AMOUNT = "497.64";

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    if (options.body) {
      requestOptions.headers["Content-Type"] = "application/json";
      requestOptions.headers["Content-Length"] = Buffer.byteLength(
        options.body
      );
    }

    const req = client.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers,
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function submitToPayFast(paymentData) {
  return new Promise((resolve, reject) => {
    const payfastUrl = "https://sandbox.payfast.co.za/eng/process";
    const urlObj = new URL(payfastUrl);

    // Build form data
    const formData = querystring.stringify(paymentData);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(formData),
      },
      maxRedirects: 0, // Don't follow redirects, we want the response
    };

    console.log("\n" + "=".repeat(80));
    console.log("🚀 SUBMITTING TO PAYFAST");
    console.log("=".repeat(80));
    console.log(`URL: ${payfastUrl}`);
    console.log(`Form Data Length: ${formData.length} bytes`);
    console.log("\nForm Fields:");
    Object.keys(paymentData).forEach((key) => {
      if (key !== "signature") {
        console.log(`  ${key}: ${paymentData[key]}`);
      } else {
        console.log(`  ${key}: ${paymentData[key]} (hidden for security)`);
      }
    });

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log("\n" + "=".repeat(80));
        console.log("📥 PAYFAST RESPONSE");
        console.log("=".repeat(80));
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response Headers:`, res.headers);
        console.log(`Response Length: ${responseData.length} bytes`);

        // Check for redirect (success)
        if (res.statusCode === 302 || res.statusCode === 301) {
          const location = res.headers.location || "";
          console.log(`\n✅ REDIRECT (${res.statusCode}) - Payment accepted!`);
          console.log(`Location: ${location}`);
          resolve({
            success: true,
            statusCode: res.statusCode,
            location,
            responseData: responseData.substring(0, 500),
          });
        } else if (res.statusCode === 200) {
          // Check for error messages in HTML
          const errorPatterns = [
            /Generated signature does not match[^<]+/i,
            /Merchant is unable to receive[^<]+/i,
            /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
            /<title>([^<]+)<\/title>/i,
            /Error[:\s]+([^<\n]+)/i,
            /Unfortunately[^<]+/i,
            /could not process[^<]+/i,
          ];

          let errorMessage = null;
          for (const pattern of errorPatterns) {
            const match = responseData.match(pattern);
            if (match && (match[1] || match[0])) {
              errorMessage = (match[1] || match[0]).trim();
              break;
            }
          }

          if (errorMessage) {
            console.log(`\n❌ ERROR DETECTED: ${errorMessage}`);
            console.log(`\nResponse HTML (first 2000 chars):`);
            console.log(responseData.substring(0, 2000));
            resolve({
              success: false,
              statusCode: res.statusCode,
              error: errorMessage,
              responseData: responseData.substring(0, 2000),
            });
          } else {
            console.log(
              `\n⚠️  Status 200 but no clear success/error indicator`
            );
            console.log(`\nResponse HTML (first 2000 chars):`);
            console.log(responseData.substring(0, 2000));
            resolve({
              success: false,
              statusCode: res.statusCode,
              error: "Unknown response",
              responseData: responseData.substring(0, 2000),
            });
          }
        } else if (res.statusCode === 400) {
          console.log(`\n❌ ERROR 400: Bad Request`);
          const errorPatterns = [
            /Generated signature does not match[^<]+/i,
            /Merchant is unable to receive[^<]+/i,
            /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
            /<title>([^<]+)<\/title>/i,
            /Error[:\s]+([^<\n]+)/i,
          ];

          let errorMessage = "Bad Request";
          for (const pattern of errorPatterns) {
            const match = responseData.match(pattern);
            if (match && (match[1] || match[0])) {
              errorMessage = (match[1] || match[0]).trim();
              break;
            }
          }

          console.log(`\n❌ Error Message: ${errorMessage}`);
          console.log(`\nResponse HTML (first 2000 chars):`);
          console.log(responseData.substring(0, 2000));
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: errorMessage,
            responseData: responseData.substring(0, 2000),
          });
        } else {
          console.log(`\n⚠️  Unexpected status: ${res.statusCode}`);
          console.log(`\nResponse (first 2000 chars):`);
          console.log(responseData.substring(0, 2000));
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: `Unexpected status ${res.statusCode}`,
            responseData: responseData.substring(0, 2000),
          });
        }
      });
    });

    req.on("error", (error) => {
      console.error(`\n❌ Request error: ${error.message}`);
      reject(error);
    });

    req.write(formData);
    req.end();
  });
}

async function test() {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🧪 PAYFAST SUBMISSION TEST");
    console.log("=".repeat(80));

    // Step 1: Get payment data from API
    console.log("\n📡 Step 1: Fetching payment data from API...");
    // Using PayFast subscription example structure exactly
    const billingDate = new Date();
    billingDate.setMonth(billingDate.getMonth() + 1); // Next month
    const requestBody = {
      amount: AMOUNT,
      item_name: "Test Item",
      item_description: "A test product",
      name_first: "John",
      name_last: "Doe",
      email_address: "john@example.com",
      subscription_type: "1",
      billing_date: billingDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
      recurring_amount: AMOUNT,
      frequency: "3", // Monthly
      cycles: "0", // Indefinite
      subscription_notify_email: true,
      subscription_notify_webhook: true,
      subscription_notify_buyer: true,
      return_url: `${API_BASE_URL}/payment/success?plan=${PLAN_ID}`,
      cancel_url: `${API_BASE_URL}/payment/cancel?plan=${PLAN_ID}`,
      notify_url: `${API_BASE_URL}/payment/notify`,
    };

    const response = await makeRequest(
      `${API_BASE_URL}/api/payments/payfast/initiate`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    if (response.status !== 200) {
      console.error(`\n❌ API Error: ${JSON.stringify(response.data)}`);
      process.exit(1);
    }

    const paymentData = response.data.payment_data || response.data;
    console.log("✅ Payment data received");
    console.log(`Signature: ${paymentData.signature}`);
    
    // Show debug info if available
    if (response.data.debug && response.data.debug.signature_string) {
      console.log("\n🔐 DEBUG: Signature String from Server:");
      console.log(response.data.debug.signature_string);
      console.log("\n🔐 DEBUG: Field Order:");
      console.log(response.data.debug.field_order);
    }

    // Step 2: Submit to PayFast
    console.log("\n📤 Step 2: Submitting to PayFast...");
    const result = await submitToPayFast(paymentData);

    // Step 3: Report results
    console.log("\n" + "=".repeat(80));
    console.log("📊 TEST RESULTS");
    console.log("=".repeat(80));
    if (result.success) {
      console.log("✅ SUCCESS: PayFast accepted the payment!");
      console.log(`Redirect Location: ${result.location}`);
    } else {
      console.log("❌ FAILED: PayFast rejected the payment");
      console.log(`Status Code: ${result.statusCode}`);
      console.log(`Error: ${result.error}`);
    }
    console.log("=".repeat(80) + "\n");

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
