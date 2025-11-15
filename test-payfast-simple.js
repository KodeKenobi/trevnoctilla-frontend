/**
 * Simple PayFast submission test
 * Submits a basic form to PayFast and shows the response
 */

const https = require("https");
const querystring = require("querystring");
const crypto = require("crypto");

// PayFast credentials
const MERCHANT_ID = "10043520";
const MERCHANT_KEY = "irqvo1c2j9l08";
const PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE || "Trevnoctilla_PayFast_Test";

// Payment data (matching the form example with subscription fields)
// Testing with extra fields like the API route sends
const paymentData = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  amount: "100.00",
  item_name: "Test Product",
  subscription_type: "1",
  billing_date: "2020-01-01",
  recurring_amount: "123.45",
  frequency: "3",
  cycles: "12",
  subscription_notify_email: "true",
  subscription_notify_webhook: "true",
  subscription_notify_buyer: "true",
  name_first: "John",
  name_last: "Doe",
  email_address: "john@example.com",
  item_description: "A test product",
  return_url: "https://www.trevnoctilla.com/payment/success",
  cancel_url: "https://www.trevnoctilla.com/payment/cancel",
  notify_url: "https://www.trevnoctilla.com/payment/notify",
  m_payment_id: "pf_1234567890_test",
};

// Generate signature (matching PayFast PHP generateSignature exactly)
function generateSignature(data, passphrase) {
  let pfOutput = "";

  // Iterate in insertion order (PHP foreach)
  for (const key in data) {
    const val = data[key];
    if (val !== undefined && val !== null && String(val) !== "") {
      const trimmedVal = String(val).trim();
      if (trimmedVal !== "") {
        // URL encode (PHP urlencode style)
        const encodedValue = encodeURIComponent(trimmedVal)
          .replace(/%20/g, "+")
          .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
        pfOutput += `${key}=${encodedValue}&`;
      }
    }
  }

  // Remove last &
  let getString = pfOutput.slice(0, -1);

  // Add passphrase if provided
  if (passphrase && passphrase.trim()) {
    const encodedPassphrase = encodeURIComponent(passphrase.trim())
      .replace(/%20/g, "+")
      .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
    getString += `&passphrase=${encodedPassphrase}`;
  }

  // MD5 hash
  return crypto.createHash("md5").update(getString).digest("hex");
}

// Add signature to payment data
paymentData.signature = generateSignature(paymentData, PASSPHRASE);

console.log("Payment Data:");
console.log(JSON.stringify(paymentData, null, 2));
console.log("\nSignature String (for verification):");
let sigString = "";
for (const key in paymentData) {
  if (key !== "signature") {
    const val = paymentData[key];
    if (val !== undefined && val !== null && String(val) !== "") {
      const trimmedVal = String(val).trim();
      if (trimmedVal !== "") {
        const encodedValue = encodeURIComponent(trimmedVal)
          .replace(/%20/g, "+")
          .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
        sigString += `${key}=${encodedValue}&`;
      }
    }
  }
}
sigString = sigString.slice(0, -1);
if (PASSPHRASE && PASSPHRASE.trim()) {
  const encodedPassphrase = encodeURIComponent(PASSPHRASE.trim())
    .replace(/%20/g, "+")
    .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
  sigString += `&passphrase=${encodedPassphrase}`;
}
console.log(sigString);
console.log("\nGenerated Signature:", paymentData.signature);

// Submit to PayFast
const formData = querystring.stringify(paymentData);

const options = {
  hostname: "sandbox.payfast.co.za",
  port: 443,
  path: "/eng/process",
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Content-Length": Buffer.byteLength(formData),
  },
};

console.log("\n" + "=".repeat(80));
console.log("Submitting to PayFast...");
console.log("=".repeat(80));

const req = https.request(options, (res) => {
  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    console.log("\nResponse Status:", res.statusCode);
    console.log("Response Headers:", res.headers);

    if (res.statusCode === 302 || res.statusCode === 301) {
      console.log("\n✅ SUCCESS! PayFast accepted the payment!");
      console.log("Redirect Location:", res.headers.location);
    } else if (res.statusCode === 400) {
      console.log("\n❌ ERROR 400: Bad Request");
      // Try to extract error message
      const errorMatch = responseData.match(
        /<span class="err-msg">([^<]+)<\/span>/i
      );
      if (errorMatch) {
        console.log("Error:", errorMatch[1]);
      }
      console.log("\nResponse HTML (first 1000 chars):");
      console.log(responseData.substring(0, 1000));
    } else {
      console.log("\nResponse (first 1000 chars):");
      console.log(responseData.substring(0, 1000));
    }

    process.exit(res.statusCode === 302 || res.statusCode === 301 ? 0 : 1);
  });
});

req.on("error", (error) => {
  console.error("\n❌ Request error:", error.message);
  process.exit(1);
});

req.write(formData);
req.end();
