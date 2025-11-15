/**
 * Manual webhook test script
 * Simulates PayFast webhook notification for subscription payment
 */

const https = require("https");
const http = require("http");

// Configuration
const USER_ID = "2"; // From test
const PLAN_ID = "production";
const PLAN_NAME = "Production Plan";
const AMOUNT = "29.00";

// PayFast credentials (for signature generation)
const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || "10043520";
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || "irqvo1c2j9l08";
const PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE || "Trevnoctilla_PayFast_Test";

const NEXTJS_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.trevnoctilla.com";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://web-production-737b.up.railway.app";

console.log("=".repeat(80));
console.log("🧪 MANUAL WEBHOOK TEST");
console.log("=".repeat(80));
console.log(`User ID: ${USER_ID}`);
console.log(`Plan: ${PLAN_NAME} (${PLAN_ID})`);
console.log(`Amount: R${AMOUNT}`);
console.log(`Webhook URL: ${NEXTJS_BASE_URL}/payment/notify`);
console.log("=".repeat(80));
console.log();

// Generate PayFast signature (matching webhook verification)
// Webhook uses: sorted keys alphabetically, RAW values (not URL-encoded)
// Webhook EXCLUDES: signature, merchant_key
function generateSignature(data, passphrase) {
  // Filter out empty values, signature, and merchant_key (excluded from signature)
  const filteredData = {};
  for (const key in data) {
    if (key === "signature" || key === "merchant_key") continue;
    const val = data[key];
    if (val !== undefined && val !== null && String(val) !== "") {
      const trimmedVal = String(val).trim();
      if (trimmedVal !== "") {
        filteredData[key] = trimmedVal;
      }
    }
  }

  // Sort keys alphabetically (as per webhook verification)
  const sortedKeys = Object.keys(filteredData).sort();
  let pfParamString = "";
  sortedKeys.forEach((key) => {
    const value = filteredData[key];
    // Use raw value (not URL-encoded) for ITN signature verification
    pfParamString += `${key}=${value}&`;
  });

  // Remove last ampersand
  pfParamString = pfParamString.slice(0, -1);

  // Add passphrase if provided (raw, not URL-encoded)
  if (passphrase && passphrase.trim()) {
    pfParamString += `&passphrase=${passphrase.trim()}`;
  }

  // Generate MD5 hash (lowercase)
  return require("crypto")
    .createHash("md5")
    .update(pfParamString)
    .digest("hex");
}

// Build webhook payload (what PayFast sends)
const webhookData = {
  // PayFast standard fields
  m_payment_id: `pf_${Date.now()}_test`,
  pf_payment_id: `12345${Date.now()}`,
  payment_status: "COMPLETE",
  item_name: `${PLAN_NAME} - Monthly Subscription`,
  item_description: `${PLAN_NAME} - Recurring monthly subscription`,
  amount_gross: AMOUNT,
  amount_fee: "0.00",
  amount_net: AMOUNT,

  // Subscription fields
  subscription_type: "1",
  token: `token_${Date.now()}`,
  billing_date: new Date().toISOString().split("T")[0],
  recurring_amount: AMOUNT,
  frequency: "3",
  cycles: "0",

  // Custom fields (what we sent)
  custom_str1: PLAN_ID,
  custom_str2: USER_ID,

  // Merchant fields
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,

  // Email
  email_address: "tshepomtshali89@gmail.com",
};

// Generate signature
webhookData.signature = generateSignature(webhookData, PASSPHRASE);

console.log("📦 Webhook Payload:");
console.log(JSON.stringify(webhookData, null, 2));
console.log();

// Send webhook
const url = new URL(`${NEXTJS_BASE_URL}/payment/notify`);
const formData = new URLSearchParams();
for (const key in webhookData) {
  formData.append(key, String(webhookData[key]));
}

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === "https:" ? 443 : 80),
  path: url.pathname,
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Content-Length": Buffer.byteLength(formData.toString()),
  },
};

const client = url.protocol === "https:" ? https : http;

console.log("🔄 Sending webhook to PayFast notify endpoint...");
console.log(`   POST ${url.toString()}`);
console.log();

const req = client.request(options, (res) => {
  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    console.log(`   Response status: ${res.statusCode}`);
    console.log(`   Response: ${responseData}`);
    console.log();

    if (res.statusCode === 200) {
      if (responseData.trim() === "VALID") {
        console.log("✅ Webhook processed successfully (VALID)");
      } else if (responseData.trim() === "INVALID") {
        console.log(
          "❌ Webhook rejected (INVALID) - signature verification failed"
        );
      } else {
        console.log(`⚠️  Unexpected response: ${responseData}`);
      }
    } else {
      console.log(`❌ Webhook failed with status ${res.statusCode}`);
    }

    console.log();
    console.log("⏳ Waiting 2 seconds for webhook to process...");
    setTimeout(() => {
      checkUserUpgrade();
    }, 2000);
  });
});

req.on("error", (error) => {
  console.error(`❌ Request error: ${error.message}`);
  process.exit(1);
});

req.write(formData.toString());
req.end();

// Check if user was upgraded
function checkUserUpgrade() {
  const loginData = JSON.stringify({
    email: "tshepomtshali89@gmail.com",
    password: "Kopenikus0218!",
  });

  const url = new URL(`${API_BASE_URL}/auth/login`);
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === "https:" ? 443 : 80),
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(loginData),
    },
  };

  const client = url.protocol === "https:" ? https : http;

  console.log();
  console.log("✅ Checking if user was upgraded...");
  const req = client.request(options, (res) => {
    let responseData = "";

    res.on("data", (chunk) => {
      responseData += chunk;
    });

    res.on("end", () => {
      if (res.statusCode === 200) {
        try {
          const data = JSON.parse(responseData);
          if (data.user) {
            const tier = data.user.subscription_tier || "free";
            console.log(`   Current tier: ${tier}`);
            if (tier === "premium" || tier === PLAN_ID) {
              console.log(`   ✅ User successfully upgraded to ${tier}!`);
            } else {
              console.log(`   ❌ User tier is still ${tier}, upgrade failed`);
            }
          }
        } catch (e) {
          console.log(`   ⚠️  Could not parse response`);
        }
      }
      console.log();
      console.log("=".repeat(80));
      process.exit(0);
    });
  });

  req.on("error", (error) => {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
  });

  req.write(loginData);
  req.end();
}
