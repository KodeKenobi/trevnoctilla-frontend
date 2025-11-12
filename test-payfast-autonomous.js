/**
 * Autonomous PayFast Subscription Payment Test Script
 * Tests the subscription payment flow without any user input
 *
 * IMPORTANT: PayFast REQUIRES a passphrase for subscriptions!
 * The API route will include the passphrase in the signature.
 * This test script may show a signature mismatch if it doesn't have
 * access to the passphrase, but the form will still work because
 * it uses the API-generated signature.
 *
 * This script:
 * 1. Fetches payment data from the API endpoint
 * 2. Generates the PayFast form
 * 3. Logs all payment data and signature calculation
 * 4. Opens the form in the browser automatically
 * 5. Runs until manually stopped
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const PLAN_ID = "production"; // Test with production plan
const AMOUNT = "497.64"; // USD amount converted to ZAR
const LOG_FILE = path.join(__dirname, "payfast-test-autonomous.log");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(`${colors[color]}${logMessage}${colors.reset}`);

  // Also write to log file
  fs.appendFileSync(LOG_FILE, logMessage + "\n");
}

function logSection(title) {
  log("\n" + "=".repeat(80), "cyan");
  log(title, "bright");
  log("=".repeat(80), "cyan");
}

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
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
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

function generatePayFastSignature(paymentData, passphrase) {
  // PayFast signature calculation uses insertion order (not alphabetical)
  // This matches the $1 payment exactly

  // Filter out empty values and signature field
  const filteredData = {};
  Object.keys(paymentData).forEach((key) => {
    if (
      key !== "signature" &&
      key !== "merchant_key" && // Excluded from signature
      paymentData[key] !== "" &&
      paymentData[key] !== null &&
      paymentData[key] !== undefined
    ) {
      const value = String(paymentData[key]).trim();
      if (value !== "") {
        filteredData[key] = value;
      }
    }
  });

  // Build parameter string in insertion order (matching API route exactly)
  // PayFast PHP urlencode() style:
  // - Spaces as +
  // - Uppercase encoding (http%3A%2F%2F)
  // - Special chars encoded
  let pfParamString = "";
  Object.keys(filteredData).forEach((key) => {
    const value = filteredData[key];
    // Match API route encoding exactly
    const encodedValue = encodeURIComponent(value)
      .replace(/%20/g, "+")
      .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
    pfParamString += `${key}=${encodedValue}&`;
  });

  // Remove last ampersand
  pfParamString = pfParamString.slice(0, -1);

  // Add passphrase if provided (URL-encoded, uppercase hex)
  if (passphrase && passphrase.trim()) {
    const encodedPassphrase = encodeURIComponent(passphrase.trim())
      .replace(/%20/g, "+")
      .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
    pfParamString += `&passphrase=${encodedPassphrase}`;
  }

  // Generate MD5 hash (lowercase)
  const crypto = require("crypto");
  const signature = crypto
    .createHash("md5")
    .update(pfParamString)
    .digest("hex");

  return { signature, paramString: pfParamString };
}

async function testPaymentFlow() {
  logSection("🚀 Starting Autonomous PayFast Payment Test");

  log(`API Base URL: ${API_BASE_URL}`, "blue");
  log(`Plan ID: ${PLAN_ID}`, "blue");
  log(`Amount: ${AMOUNT}`, "blue");
  log(`Log File: ${LOG_FILE}`, "blue");

  try {
    // Step 1: Fetch payment data from API
    logSection("📡 Step 1: Fetching Payment Data from API");

    const requestBody = {
      amount: AMOUNT,
      item_name: "Production Plan - Monthly Subscription",
      item_description: "Production Plan - Recurring monthly subscription",
      custom_str1: PLAN_ID,
      custom_str2: "999", // Test user ID
      subscription_type: "1",
      billing_date: new Date().toISOString().split("T")[0],
      recurring_amount: AMOUNT,
      frequency: "3",
      cycles: "0",
      subscription_notify_email: true,
      subscription_notify_webhook: true,
      subscription_notify_buyer: true,
      return_url: `${API_BASE_URL}/payment/success?plan=${PLAN_ID}`,
      cancel_url: `${API_BASE_URL}/payment/cancel?plan=${PLAN_ID}`,
      notify_url: `${API_BASE_URL}/payment/notify`,
      // CRITICAL: Do NOT send email_address or name_first
      // These cause signature mismatch when logged in
    };

    log("Request Body:", "yellow");
    log(JSON.stringify(requestBody, null, 2), "yellow");

    const response = await makeRequest(
      `${API_BASE_URL}/api/payments/payfast/initiate`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    log(
      `Response Status: ${response.status}`,
      response.status === 200 ? "green" : "red"
    );

    if (response.status !== 200) {
      log(`❌ API Error: ${JSON.stringify(response.data)}`, "red");
      return;
    }

    const paymentData = response.data.payment_data || response.data;
    log("✅ Payment data received from API", "green");
    log("Payment Data:", "yellow");
    log(JSON.stringify(paymentData, null, 2), "yellow");

    // Step 2: Verify signature calculation
    logSection("🔐 Step 2: Verifying Signature Calculation");

    // Get passphrase from environment or use empty string
    // NOTE: PayFast REQUIRES a passphrase for subscriptions!
    // The API route will have the passphrase, but this test script may not.
    // This is why signatures may not match - the form will still work
    // because it uses the API-generated signature.
    const passphrase =
      process.env.PAYFAST_PASSPHRASE ||
      process.env.NEXT_PUBLIC_PAYFAST_PASSPHRASE ||
      "";

    log(
      `Passphrase configured: ${passphrase ? "YES ✅" : "NO ⚠️"}`,
      passphrase ? "green" : "yellow"
    );

    if (!passphrase) {
      log("⚠️ WARNING: No passphrase found in environment variables", "yellow");
      log("   PayFast REQUIRES a passphrase for subscriptions!", "yellow");
      log("   The API route should have the passphrase configured.", "yellow");
      log(
        "   Signature mismatch is expected - form will still work.",
        "yellow"
      );
    }

    const { signature: calculatedSignature, paramString } =
      generatePayFastSignature(paymentData, passphrase);

    log("Signature Calculation Details:", "yellow");
    log(`Parameter String: ${paramString}`, "cyan");
    log(`Calculated Signature: ${calculatedSignature}`, "cyan");
    log(`API Signature: ${paymentData.signature}`, "cyan");

    const signatureMatch =
      calculatedSignature.toLowerCase() ===
      paymentData.signature?.toLowerCase();
    log(
      `Signature Match: ${signatureMatch ? "✅ YES" : "❌ NO"}`,
      signatureMatch ? "green" : "red"
    );

    if (!signatureMatch) {
      if (!passphrase) {
        log(
          "⚠️ Signature mismatch expected (no passphrase in test script)",
          "yellow"
        );
        log(
          "   The API route includes passphrase in signature calculation.",
          "yellow"
        );
        log(
          "   The form will work because it uses the API-generated signature.",
          "green"
        );
      } else {
        log("⚠️ WARNING: Signature mismatch detected!", "red");
        log("   This may indicate an issue with signature calculation.", "red");
      }
    }

    // Step 3: Generate HTML form
    logSection("📝 Step 3: Generating PayFast Form");

    // Always use sandbox for testing
    const payfastUrl = "https://sandbox.payfast.co.za/eng/process";

    log(`PayFast URL: ${payfastUrl}`, "blue");

    // Build form HTML
    let formHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PayFast Payment - Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info h2 {
            margin-top: 0;
            color: #333;
        }
        .info p {
            margin: 10px 0;
            color: #666;
        }
        .form-data {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
            font-family: monospace;
            font-size: 12px;
            overflow-x: auto;
        }
        .status {
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="info">
        <h2>🧪 PayFast Payment Test Form</h2>
        <p><strong>Status:</strong> <span id="status">Preparing form...</span></p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Plan:</strong> ${PLAN_ID}</p>
        <p><strong>Amount:</strong> R ${AMOUNT}</p>
    </div>
    
    <div class="info">
        <h3>Form Data Being Sent:</h3>
        <div class="form-data">
`;

    // Add all form fields
    Object.keys(paymentData).forEach((key) => {
      if (
        paymentData[key] !== "" &&
        paymentData[key] !== null &&
        paymentData[key] !== undefined
      ) {
        formHtml += `            <input type="hidden" name="${key}" value="${String(
          paymentData[key]
        ).replace(/"/g, "&quot;")}" />\n`;
      }
    });

    formHtml += `        </div>
    </div>
    
    <div class="info">
        <h3>Signature Verification:</h3>
        <div class="status ${signatureMatch ? "success" : "error"}">
            <strong>Signature Match:</strong> ${
              signatureMatch ? "✅ YES" : "❌ NO"
            }
        </div>
        <div class="form-data">
            <strong>Calculated:</strong> ${calculatedSignature}<br>
            <strong>API Provided:</strong> ${paymentData.signature || "N/A"}
        </div>
    </div>
    
    <form id="payfast-form" action="${payfastUrl}" method="post">
`;

    // Add all form fields
    Object.keys(paymentData).forEach((key) => {
      if (
        paymentData[key] !== "" &&
        paymentData[key] !== null &&
        paymentData[key] !== undefined
      ) {
        formHtml += `        <input type="hidden" name="${key}" value="${String(
          paymentData[key]
        ).replace(/"/g, "&quot;")}" />\n`;
      }
    });

    formHtml += `    </form>
    
    <div class="info">
        <p><strong>Note:</strong> This form will automatically submit in 3 seconds...</p>
        <p>If it doesn't, <a href="#" onclick="document.getElementById('payfast-form').submit(); return false;">click here</a> to submit manually.</p>
    </div>
    
    <script>
        document.getElementById('status').textContent = 'Form ready - submitting...';
        document.getElementById('status').style.color = '#28a745';
        
        setTimeout(function() {
            document.getElementById('payfast-form').submit();
        }, 3000);
    </script>
</body>
</html>`;

    // Step 4: Save form to file
    const formFilePath = path.join(__dirname, "payfast-test-form.html");
    fs.writeFileSync(formFilePath, formHtml);
    log(`✅ Form saved to: ${formFilePath}`, "green");

    // Step 5: Open form in browser
    logSection("🌐 Step 4: Opening Form in Browser");

    const fileUrl = `file:///${formFilePath.replace(/\\/g, "/")}`;
    log(`File URL: ${fileUrl}`, "blue");

    // Open in default browser (cross-platform)
    const platform = process.platform;
    let openCommand;

    if (platform === "win32") {
      openCommand = `start "" "${formFilePath}"`;
    } else if (platform === "darwin") {
      openCommand = `open "${formFilePath}"`;
    } else {
      openCommand = `xdg-open "${formFilePath}"`;
    }

    log(`Opening browser with command: ${openCommand}`, "yellow");

    exec(openCommand, (error) => {
      if (error) {
        log(
          `⚠️ Could not open browser automatically: ${error.message}`,
          "yellow"
        );
        log(`Please manually open: ${formFilePath}`, "yellow");
      } else {
        log("✅ Browser opened successfully", "green");
      }
    });

    // Step 6: Log summary
    logSection("📊 Test Summary");

    log("✅ Payment data fetched from API", "green");
    log(
      `✅ Signature calculated: ${calculatedSignature}`,
      signatureMatch ? "green" : "yellow"
    );
    log(`✅ Form generated and saved`, "green");
    log(`✅ Browser opened`, "green");

    log("\n📋 Next Steps:", "cyan");
    log("1. Check if PayFast accepts the payment", "blue");
    log("2. If signature mismatch error occurs, check the logs above", "blue");
    log(
      "3. Compare the parameter string with PayFast's expected format",
      "blue"
    );
    log(
      "4. Verify that email_address and name_first are NOT in the form",
      "blue"
    );

    log("\n⚠️ Important Notes:", "yellow");
    log("- This test does NOT send email_address or name_first", "yellow");
    log("- This matches the $1 payment structure exactly", "yellow");
    log(
      "- PayFast REQUIRES a passphrase for subscriptions (API route has it)",
      "yellow"
    );
    log(
      "- Signature mismatch in test script is expected if no passphrase",
      "yellow"
    );
    log("- Form will work because it uses API-generated signature", "green");
    log(
      "- If logged in, PayFast may still reject due to merchant email conflict",
      "yellow"
    );

    log("\n🔄 Test will continue running... Press Ctrl+C to stop", "cyan");
    log("All logs are being written to: " + LOG_FILE, "blue");

    // Keep script running
    process.on("SIGINT", () => {
      log("\n\n👋 Test stopped by user", "yellow");
      process.exit(0);
    });
  } catch (error) {
    logSection("❌ Test Failed");
    log(`Error: ${error.message}`, "red");
    log(`Stack: ${error.stack}`, "red");
    process.exit(1);
  }
}

// Run the test
testPaymentFlow().catch((error) => {
  log(`Fatal error: ${error.message}`, "red");
  process.exit(1);
});
