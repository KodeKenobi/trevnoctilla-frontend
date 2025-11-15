/**
 * Test script: Profile Refresh + Upgrade Flow
 * Tests:
 * 1. Profile endpoint returns subscription_tier
 * 2. Webhook processes upgrade
 * 3. Profile endpoint reflects updated subscription_tier
 * 4. Dashboard refresh logic (simulated)
 */

const https = require("https");
const http = require("http");

// Configuration
const USER_EMAIL = "tshepomtshali89@gmail.com";
const USER_PASSWORD = "Kopenikus0218!";
const USER_ID = "2";
const PLAN_ID = "production";
const PLAN_NAME = "Production Plan";
const AMOUNT = "29.00";

// API URLs
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://web-production-737b.up.railway.app";
const NEXTJS_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.trevnoctilla.com";

// PayFast credentials (for webhook signature)
const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || "10043520";
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || "irqvo1c2j9l08";
const PASSPHRASE =
  process.env.PAYFAST_PASSPHRASE || "Trevnoctilla_PayFast_Test";

console.log("=".repeat(80));
console.log("🧪 PROFILE REFRESH + UPGRADE FLOW TEST");
console.log("=".repeat(80));
console.log(`User: ${USER_EMAIL} (ID: ${USER_ID})`);
console.log(`Plan: ${PLAN_NAME} (${PLAN_ID})`);
console.log(`Amount: R${AMOUNT}`);
console.log("=".repeat(80));
console.log();

// Helper: Make HTTP request
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + (urlObj.search || ""),
      method: options.method || "GET",
      headers: options.headers || {},
    };

    if (data) {
      requestOptions.headers["Content-Length"] = Buffer.byteLength(data);
    }

    const req = client.request(requestOptions, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

// Step 1: Login to get token
async function login() {
  console.log("📝 Step 1: Logging in to get auth token...");
  const loginData = JSON.stringify({
    email: USER_EMAIL,
    password: USER_PASSWORD,
  });

  const response = await makeRequest(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
    loginData
  );

  if (response.statusCode !== 200) {
    throw new Error(`Login failed: ${response.statusCode} - ${response.data}`);
  }

  const data = JSON.parse(response.data);
  if (!data.access_token) {
    throw new Error("No access token in login response");
  }

  console.log(`   ✅ Login successful`);
  console.log(`   User ID: ${data.user?.id || "N/A"}`);
  console.log(`   Current tier: ${data.user?.subscription_tier || "free"}`);
  console.log();

  return {
    token: data.access_token,
    userId: data.user?.id?.toString() || USER_ID,
    currentTier: data.user?.subscription_tier || "free",
  };
}

// Step 2: Test profile endpoint (before upgrade)
async function testProfileEndpoint(token, stepName) {
  console.log(`📊 ${stepName}: Testing profile endpoint...`);
  console.log(`   GET ${API_BASE_URL}/auth/profile`);

  const response = await makeRequest(`${API_BASE_URL}/auth/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(
      `Profile endpoint failed: ${response.statusCode} - ${response.data}`
    );
  }

  const userData = JSON.parse(response.data);
  console.log(`   ✅ Profile data received`);
  console.log(`   User ID: ${userData.id}`);
  console.log(`   Email: ${userData.email}`);
  console.log(
    `   Subscription tier: ${userData.subscription_tier || "NOT FOUND"}`
  );
  console.log(`   Monthly call limit: ${userData.monthly_call_limit || "N/A"}`);
  console.log(`   Monthly used: ${userData.monthly_used || "N/A"}`);
  console.log();

  // Log full profile data
  console.log("   Full profile data:");
  console.log(JSON.stringify(userData, null, 2));
  console.log();

  return userData;
}

// Step 3: Generate webhook signature (matching webhook verification)
function generateWebhookSignature(data, passphrase) {
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

// Step 4: Send webhook (simulate PayFast notification)
async function sendWebhook() {
  console.log(
    "🔄 Step 4: Sending webhook (simulating PayFast notification)..."
  );
  console.log(`   POST ${NEXTJS_BASE_URL}/payment/notify`);

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
    email_address: USER_EMAIL,
  };

  // Generate signature
  webhookData.signature = generateWebhookSignature(webhookData, PASSPHRASE);

  console.log("   Webhook payload:");
  console.log(JSON.stringify(webhookData, null, 2));
  console.log();
  console.log(`   🔑 Key fields for upgrade:`);
  console.log(`      - custom_str1 (plan_id): ${webhookData.custom_str1}`);
  console.log(`      - custom_str2 (user_id): ${webhookData.custom_str2}`);
  console.log(`      - email_address: ${webhookData.email_address}`);
  console.log(`      - payment_status: ${webhookData.payment_status}`);
  console.log();

  // Build form data
  const formData = new URLSearchParams();
  for (const key in webhookData) {
    formData.append(key, String(webhookData[key]));
  }

  const response = await makeRequest(
    `${NEXTJS_BASE_URL}/payment/notify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
    formData.toString()
  );

  console.log(`   Response status: ${response.statusCode}`);
  console.log(`   Response: ${response.data}`);
  console.log();

  if (response.statusCode === 200) {
    if (response.data.trim() === "VALID") {
      console.log("   ✅ Webhook processed successfully (VALID)");
      console.log(
        "   📋 Next: Webhook should call backend /api/payment/upgrade-subscription"
      );
      console.log(
        "   📋 Backend should update user subscription_tier to 'premium'"
      );
    } else if (response.data.trim() === "INVALID") {
      throw new Error(
        "Webhook rejected (INVALID) - signature verification failed"
      );
    } else {
      console.log(`   ⚠️  Unexpected response: ${response.data}`);
    }
  } else {
    throw new Error(`Webhook failed with status ${response.statusCode}`);
  }

  // Wait for webhook to process and backend to update
  console.log("   ⏳ Waiting 5 seconds for webhook and backend to process...");
  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log();
}

// Main test flow
async function main() {
  try {
    // Step 1: Login
    const auth = await login();

    // Step 2: Test profile endpoint BEFORE upgrade
    const profileBefore = await testProfileEndpoint(auth.token, "Step 2");

    // Step 3: Check if user needs upgrade
    const needsUpgrade =
      profileBefore.subscription_tier !== "premium" &&
      profileBefore.subscription_tier !== PLAN_ID;

    if (!needsUpgrade) {
      console.log("⚠️  User is already on premium tier, skipping upgrade test");
      console.log("   (You can manually reset the user tier to test upgrade)");
      console.log();
    } else {
      // Step 4: Send webhook to trigger upgrade
      await sendWebhook();

      // Step 5: Test profile endpoint AFTER upgrade (simulating dashboard refresh)
      console.log(
        "🔄 Step 5: Testing profile endpoint AFTER upgrade (simulating dashboard refresh)..."
      );
      console.log(
        "   (This simulates what happens when dashboard calls checkAuthStatus)"
      );
      console.log();
      console.log("   ⚠️  CRITICAL: If user tier is still 'free', check:");
      console.log(
        "      1. Backend logs for upgrade-subscription endpoint call"
      );
      console.log(
        "      2. Backend logs for user update (subscription_tier change)"
      );
      console.log(
        "      3. If user was recreated (check created_at timestamp)"
      );
      console.log("      4. Backend database for user subscription_tier value");
      console.log();

      // Wait a bit more for backend to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const profileAfter = await testProfileEndpoint(auth.token, "Step 5");

      // Check if user was recreated (created_at changed)
      const beforeCreatedAt = new Date(profileBefore.created_at).getTime();
      const afterCreatedAt = new Date(profileAfter.created_at).getTime();
      const timeDiff = Math.abs(afterCreatedAt - beforeCreatedAt);

      if (timeDiff > 1000) {
        // More than 1 second difference
        console.log("   ⚠️  WARNING: User created_at timestamp changed!");
        console.log(`      Before: ${profileBefore.created_at}`);
        console.log(`      After: ${profileAfter.created_at}`);
        console.log(
          `      This indicates the user was RECREATED, which would reset subscription_tier!`
        );
        console.log();
      }

      // Step 6: Verify upgrade
      console.log("=".repeat(80));
      console.log("📊 TEST RESULTS");
      console.log("=".repeat(80));
      console.log(
        `Before upgrade tier: ${profileBefore.subscription_tier || "free"}`
      );
      console.log(
        `After upgrade tier: ${profileAfter.subscription_tier || "free"}`
      );
      console.log();

      const upgradeSuccess =
        profileAfter.subscription_tier === "premium" ||
        profileAfter.subscription_tier === PLAN_ID;

      if (upgradeSuccess) {
        console.log("✅ UPGRADE TEST PASSED!");
        console.log(
          `   - User tier updated from "${profileBefore.subscription_tier}" to "${profileAfter.subscription_tier}"`
        );
        console.log(
          `   - Profile endpoint returns subscription_tier correctly`
        );
        console.log(`   - Dashboard refresh will show updated tier`);
      } else {
        console.log("❌ UPGRADE TEST FAILED!");
        console.log(`   - User tier did not update`);
        console.log(`   - Expected: "premium" or "${PLAN_ID}"`);
        console.log(`   - Got: "${profileAfter.subscription_tier || "free"}"`);
        console.log(`   - Check webhook logs and backend upgrade endpoint`);
      }
      console.log("=".repeat(80));
    }

    // Final: Test profile endpoint one more time (simulating multiple dashboard refreshes)
    console.log();
    console.log(
      "🔄 Final: Testing profile endpoint again (simulating multiple refreshes)..."
    );
    const profileFinal = await testProfileEndpoint(auth.token, "Final");

    console.log("=".repeat(80));
    console.log("✅ PROFILE ENDPOINT TEST COMPLETE");
    console.log("=".repeat(80));
    console.log(
      `Final subscription_tier: ${
        profileFinal.subscription_tier || "NOT FOUND"
      }`
    );
    console.log(
      `Profile endpoint is working: ${
        profileFinal.subscription_tier ? "✅ YES" : "❌ NO"
      }`
    );
    console.log("=".repeat(80));
  } catch (error) {
    console.error();
    console.error("❌ TEST ERROR:", error.message);
    console.error();
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
