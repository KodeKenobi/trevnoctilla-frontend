/**
 * Test script to send PayFast subscription payload and log everything
 * This script mimics the exact payload structure from the API route
 */

const https = require("https");
const querystring = require("querystring");

// PayFast Configuration - Update these with your actual values
const PAYFAST_CONFIG = {
  MERCHANT_ID: process.env.PAYFAST_MERCHANT_ID || "YOUR_MERCHANT_ID",
  MERCHANT_KEY: process.env.PAYFAST_MERCHANT_KEY || "YOUR_MERCHANT_KEY",
  PASSPHRASE: process.env.PAYFAST_PASSPHRASE || "YOUR_PASSPHRASE",
  PAYFAST_URL:
    process.env.PAYFAST_URL || "https://sandbox.payfast.co.za/eng/process",
};

// Test payment data - Update these values as needed
const TEST_PAYMENT = {
  amount: "29.00",
  item_name: "Production Plan - Monthly Subscription",
  subscription_type: "1",
  billing_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD
  recurring_amount: "29.00",
  frequency: "3", // 3 = monthly
  cycles: "0", // 0 = unlimited
  subscription_notify_email: true,
  subscription_notify_webhook: true,
  subscription_notify_buyer: true,
  return_url: "https://www.trevnoctilla.com/payment/success",
  cancel_url: "https://www.trevnoctilla.com/payment/cancel",
  // NOTE: notify_url is NOT included - configured in PayFast dashboard
};

/**
 * Generate PayFast signature exactly like the API route
 * Uses INSERTION ORDER (for...in loop), not alphabetical sorting
 */
function generatePayFastSignature(data) {
  const crypto = require("crypto");

  // CRITICAL: Match PayFast PHP generateSignature() EXACTLY
  // PHP: foreach( $data as $key => $val ) - uses INSERTION ORDER
  // Iterate through data in insertion order (matches PHP: foreach( $data as $key => $val ))

  let pfOutput = "";

  // Use for...in to maintain insertion order
  for (const key in data) {
    if (key === "signature") {
      continue;
    }

    const val = data[key];

    // PHP checks: if($val !== '')
    if (val !== undefined && val !== null && String(val) !== "") {
      const trimmedVal = String(val).trim();
      if (trimmedVal !== "") {
        // PayFast PHP urlencode() style:
        const encodedValue = encodeURIComponent(trimmedVal)
          .replace(/%20/g, "+")
          .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());

        pfOutput += `${key}=${encodedValue}&`;
      }
    }
  }

  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);

  // Add passphrase if it exists
  if (
    PAYFAST_CONFIG.PASSPHRASE !== null &&
    PAYFAST_CONFIG.PASSPHRASE !== undefined
  ) {
    const trimmedPassPhrase = String(PAYFAST_CONFIG.PASSPHRASE).trim();
    if (trimmedPassPhrase !== "") {
      const encodedPassphrase = encodeURIComponent(trimmedPassPhrase)
        .replace(/%20/g, "+")
        .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
      getString += `&passphrase=${encodedPassphrase}`;
    }
  }

  // MD5 hash
  const signature = crypto.createHash("md5").update(getString).digest("hex");

  return signature;
}

/**
 * Build the payment data payload exactly like the API route
 */
function buildPaymentData() {
  const paymentData = {
    merchant_id: PAYFAST_CONFIG.MERCHANT_ID,
    merchant_key: PAYFAST_CONFIG.MERCHANT_KEY,
    amount: parseFloat(TEST_PAYMENT.amount).toFixed(2),
    item_name: String(TEST_PAYMENT.item_name).trim(),
  };

  // Add subscription fields
  if (TEST_PAYMENT.subscription_type) {
    paymentData.subscription_type = String(TEST_PAYMENT.subscription_type);

    if (TEST_PAYMENT.subscription_type === "1") {
      if (TEST_PAYMENT.billing_date && TEST_PAYMENT.billing_date.trim()) {
        paymentData.billing_date = String(TEST_PAYMENT.billing_date).trim();
      }
      if (TEST_PAYMENT.recurring_amount) {
        const recurringAmount = parseFloat(
          String(TEST_PAYMENT.recurring_amount)
        );
        if (!isNaN(recurringAmount) && recurringAmount >= 5.0) {
          paymentData.recurring_amount = recurringAmount.toFixed(2);
        }
      }
      paymentData.frequency = String(TEST_PAYMENT.frequency);
      paymentData.cycles = String(TEST_PAYMENT.cycles);

      // Subscription notification fields
      if (TEST_PAYMENT.subscription_notify_email !== undefined) {
        const isEnabled =
          TEST_PAYMENT.subscription_notify_email === true ||
          TEST_PAYMENT.subscription_notify_email === "true" ||
          TEST_PAYMENT.subscription_notify_email === "1";
        if (isEnabled) {
          paymentData.subscription_notify_email = "true";
        }
      }
      if (TEST_PAYMENT.subscription_notify_webhook !== undefined) {
        const isEnabled =
          TEST_PAYMENT.subscription_notify_webhook === true ||
          TEST_PAYMENT.subscription_notify_webhook === "true" ||
          TEST_PAYMENT.subscription_notify_webhook === "1";
        if (isEnabled) {
          paymentData.subscription_notify_webhook = "true";
        }
      }
      if (TEST_PAYMENT.subscription_notify_buyer !== undefined) {
        const isEnabled =
          TEST_PAYMENT.subscription_notify_buyer === true ||
          TEST_PAYMENT.subscription_notify_buyer === "true" ||
          TEST_PAYMENT.subscription_notify_buyer === "1";
        if (isEnabled) {
          paymentData.subscription_notify_buyer = "true";
        }
      }
    }
  }

  // For subscriptions: NO return_url, cancel_url, or notify_url in payload
  // These are all configured in PayFast dashboard for subscriptions
  // Only add URLs for one-time payments (not subscriptions)

  // Generate signature
  const signature = generatePayFastSignature(paymentData);
  paymentData.signature = signature;

  return paymentData;
}

/**
 * Submit payment data to PayFast
 */
function submitToPayFast(paymentData) {
  return new Promise((resolve, reject) => {
    const payfastUrl = PAYFAST_CONFIG.PAYFAST_URL;
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
    console.log("\n📦 PAYLOAD FIELDS:");
    Object.keys(paymentData).forEach((key) => {
      if (key !== "signature") {
        console.log(`  ${key}: "${paymentData[key]}"`);
      } else {
        console.log(`  ${key}: "${paymentData[key]}" (MD5 hash)`);
      }
    });

    console.log("\n📝 FORM DATA STRING:");
    console.log(formData);

    const req = https.request(options, (res) => {
      let responseData = "";

      console.log("\n📥 PAYFAST RESPONSE:");
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Status Message: ${res.statusMessage}`);
      console.log(`Headers:`, res.headers);

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log("\n📄 RESPONSE BODY:");
        console.log(responseData);

        // Check if successful (PayFast redirects to payment page)
        if (res.statusCode === 302 || res.statusCode === 200) {
          const location = res.headers.location;
          if (location) {
            console.log("\n✅ SUCCESS! Redirect URL:", location);
            resolve({
              success: true,
              statusCode: res.statusCode,
              redirectUrl: location,
              responseBody: responseData,
            });
          } else {
            // Check response body for error
            if (
              responseData.includes("error") ||
              responseData.includes("Error")
            ) {
              console.log("\n❌ ERROR IN RESPONSE BODY");
              reject({
                success: false,
                statusCode: res.statusCode,
                error: "Error message in response body",
                responseBody: responseData,
              });
            } else {
              console.log("\n⚠️  UNEXPECTED RESPONSE (no redirect URL)");
              resolve({
                success: false,
                statusCode: res.statusCode,
                responseBody: responseData,
              });
            }
          }
        } else {
          console.log("\n❌ FAILED - Invalid status code");
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
async function testPayFastPayload() {
  console.log("=".repeat(80));
  console.log("🧪 PAYFAST PAYLOAD TEST SCRIPT");
  console.log("=".repeat(80));

  // Validate configuration
  if (
    PAYFAST_CONFIG.MERCHANT_ID === "YOUR_MERCHANT_ID" ||
    PAYFAST_CONFIG.MERCHANT_KEY === "YOUR_MERCHANT_KEY" ||
    PAYFAST_CONFIG.PASSPHRASE === "YOUR_PASSPHRASE"
  ) {
    console.error(
      "\n❌ ERROR: Please set your PayFast credentials in environment variables:"
    );
    console.error("   PAYFAST_MERCHANT_ID");
    console.error("   PAYFAST_MERCHANT_KEY");
    console.error("   PAYFAST_PASSPHRASE");
    console.error("\nOr update the script with your actual values.");
    process.exit(1);
  }

  console.log("\n⚙️  CONFIGURATION:");
  console.log(`  Merchant ID: ${PAYFAST_CONFIG.MERCHANT_ID}`);
  console.log(
    `  Merchant Key: ${PAYFAST_CONFIG.MERCHANT_KEY.substring(0, 8)}...`
  );
  console.log(`  Passphrase: ${PAYFAST_CONFIG.PASSPHRASE ? "***" : "NOT SET"}`);
  console.log(`  PayFast URL: ${PAYFAST_CONFIG.PAYFAST_URL}`);

  console.log("\n📋 TEST PAYMENT DATA:");
  console.log(JSON.stringify(TEST_PAYMENT, null, 2));

  try {
    // Build payment data
    console.log("\n🔨 BUILDING PAYMENT DATA...");
    const paymentData = buildPaymentData();

    console.log("\n📦 FINAL PAYMENT DATA (with signature):");
    console.log(JSON.stringify(paymentData, null, 2));

    // Reconstruct signature string for debugging (using insertion order)
    let signatureString = "";
    for (const key in paymentData) {
      if (key === "signature") {
        continue;
      }
      const val = paymentData[key];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        const trimmedVal = String(val).trim();
        if (trimmedVal !== "") {
          const encodedValue = encodeURIComponent(trimmedVal)
            .replace(/%20/g, "+")
            .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
          signatureString += `${key}=${encodedValue}&`;
        }
      }
    }
    signatureString = signatureString.slice(0, -1);
    if (PAYFAST_CONFIG.PASSPHRASE && PAYFAST_CONFIG.PASSPHRASE.trim()) {
      const encodedPassphrase = encodeURIComponent(
        PAYFAST_CONFIG.PASSPHRASE.trim()
      )
        .replace(/%20/g, "+")
        .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
      signatureString += `&passphrase=${encodedPassphrase}`;
    }

    console.log("\n🔐 SIGNATURE CALCULATION:");
    console.log("Signature String (before MD5):");
    console.log(signatureString);
    console.log(`Generated Signature: ${paymentData.signature}`);

    // Submit to PayFast
    const result = await submitToPayFast(paymentData);

    console.log("\n" + "=".repeat(80));
    if (result.success) {
      console.log("✅ TEST SUCCESSFUL!");
      console.log(`Redirect URL: ${result.redirectUrl}`);
    } else {
      console.log("❌ TEST FAILED");
      console.log(`Status Code: ${result.statusCode}`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
    }
    console.log("=".repeat(80));
  } catch (error) {
    console.log("\n" + "=".repeat(80));
    console.log("❌ TEST FAILED WITH ERROR:");
    console.error(error);
    console.log("=".repeat(80));
    process.exit(1);
  }
}

// Run the test
testPayFastPayload();
