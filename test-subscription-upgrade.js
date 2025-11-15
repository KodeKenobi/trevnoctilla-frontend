/**
 * Test script to upgrade user subscription via PayFast
 * Upgrades: tshepomtshali89@gmail.com from free tier to production
 */

const https = require("https");
const http = require("http");
const { exec } = require("child_process");
const querystring = require("querystring");

// Configuration
const USER_EMAIL = "tshepomtshali89@gmail.com";
const USER_PASSWORD = "Kopenikus0218!";
const PLAN_ID = "production";
const PLAN_NAME = "Production Plan";
const AMOUNT = "29.00"; // R29.00 for Production plan

// API URLs
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://web-production-737b.up.railway.app";
const NEXTJS_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.trevnoctilla.com";

console.log("=".repeat(80));
console.log("🧪 SUBSCRIPTION UPGRADE TEST SCRIPT");
console.log("=".repeat(80));
console.log(`User: ${USER_EMAIL}`);
console.log(`Plan: ${PLAN_NAME} (${PLAN_ID})`);
console.log(`Amount: R${AMOUNT}`);
console.log(`Backend API: ${API_BASE_URL}`);
console.log(`Next.js API: ${NEXTJS_BASE_URL}`);
console.log("=".repeat(80));
console.log();

// Step 1: Get user ID by logging in
async function getUserInfo() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD,
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

    console.log("📝 Step 1: Getting user info...");
    console.log(`   POST ${url.toString()}`);

    const req = client.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(responseData);
            if (data.user && data.user.id) {
              console.log(`   ✅ User found: ID ${data.user.id}`);
              console.log(
                `   Current tier: ${data.user.subscription_tier || "free"}`
              );
              resolve({
                userId: data.user.id.toString(),
                currentTier: data.user.subscription_tier || "free",
                token: data.access_token,
              });
            } else {
              reject(new Error("User ID not found in response"));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(
            new Error(
              `Login failed: ${res.statusCode} - ${responseData.substring(
                0,
                200
              )}`
            )
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    req.write(loginData);
    req.end();
  });
}

// Step 2: Initiate PayFast payment
async function initiatePayFastPayment(userId) {
  return new Promise((resolve, reject) => {
    const paymentData = {
      amount: AMOUNT,
      item_name: `${PLAN_NAME} - Monthly Subscription`,
      item_description: `${PLAN_NAME} - Recurring monthly subscription`,
      custom_str1: PLAN_ID,
      custom_str2: userId,
      subscription_type: "1",
      billing_date: getBillingDate(),
      recurring_amount: AMOUNT,
      frequency: "3", // Monthly
      cycles: "0", // Unlimited
      subscription_notify_email: true,
      subscription_notify_webhook: true,
      subscription_notify_buyer: true,
      // Note: return_url, cancel_url, notify_url are NOT included for subscriptions
      // They are configured in PayFast dashboard
    };

    const requestData = JSON.stringify(paymentData);

    const url = new URL(`${NEXTJS_BASE_URL}/api/payments/payfast/initiate`);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestData),
      },
    };

    const client = url.protocol === "https:" ? https : http;

    console.log();
    console.log("💳 Step 2: Initiating PayFast payment...");
    console.log(`   POST ${url.toString()}`);
    console.log(`   Payment Data:`, JSON.stringify(paymentData, null, 2));

    const req = client.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(responseData);
            if (data.success && data.payment_url) {
              console.log(`   ✅ Payment initiated successfully!`);
              console.log(`   Payment URL: ${data.payment_url}`);
              console.log(`   Payment ID: ${data.payment_id || "N/A"}`);

              // Show exact PayFast payload
              if (data.payment_data) {
                console.log();
                console.log("=".repeat(80));
                console.log(
                  "📦 EXACT PAYFAST PAYLOAD (what gets sent to PayFast):"
                );
                console.log("=".repeat(80));
                console.log(JSON.stringify(data.payment_data, null, 2));
                console.log("=".repeat(80));
                console.log();
                console.log("📋 PayFast Form Fields (in order):");
                Object.keys(data.payment_data).forEach((key, index) => {
                  console.log(
                    `   ${index + 1}. ${key} = ${data.payment_data[key]}`
                  );
                });
                console.log("=".repeat(80));
              }

              resolve(data.payment_url);
            } else {
              reject(
                new Error(
                  `Payment initiation failed: ${data.error || "Unknown error"}`
                )
              );
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(
            new Error(
              `Request failed: ${res.statusCode} - ${responseData.substring(
                0,
                500
              )}`
            )
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    req.write(requestData);
    req.end();
  });
}

// Step 3: Open PayFast payment page in browser
function openPayFastPage(paymentUrl) {
  console.log();
  console.log("🌐 Step 3: Opening PayFast payment page...");
  console.log(`   URL: ${paymentUrl}`);

  const command =
    process.platform === "win32"
      ? `start "" "${paymentUrl}"`
      : process.platform === "darwin"
      ? `open "${paymentUrl}"`
      : `xdg-open "${paymentUrl}"`;

  exec(command, (error) => {
    if (error) {
      console.log(
        `   ⚠️  Could not open browser automatically: ${error.message}`
      );
      console.log(`   Please manually open: ${paymentUrl}`);
    } else {
      console.log(`   ✅ Browser opened successfully!`);
    }
  });
}

// Step 4: Check upgrade status (optional - can be called after payment)
async function checkUpgradeStatus(userId, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}/api/payment/upgrade-subscription`);
    const checkData = JSON.stringify({
      user_id: userId,
      plan_id: PLAN_ID,
    });

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Length": Buffer.byteLength(checkData),
      },
    };

    const client = url.protocol === "https:" ? https : http;

    console.log();
    console.log("🔍 Step 4: Checking upgrade status...");
    console.log(`   POST ${url.toString()}`);

    const req = client.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(responseData);
            console.log(`   ✅ Upgrade status:`, JSON.stringify(data, null, 2));
            resolve(data);
          } catch (e) {
            console.log(`   ⚠️  Response: ${responseData.substring(0, 500)}`);
            resolve(null);
          }
        } else {
          console.log(
            `   ⚠️  Status check failed: ${
              res.statusCode
            } - ${responseData.substring(0, 200)}`
          );
          resolve(null);
        }
      });
    });

    req.on("error", (error) => {
      console.log(`   ⚠️  Error checking status: ${error.message}`);
      resolve(null);
    });

    req.write(checkData);
    req.end();
  });
}

// Helper: Get billing date (first of next month)
function getBillingDate() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const year = nextMonth.getFullYear();
  const month = String(nextMonth.getMonth() + 1).padStart(2, "0");
  const day = String(nextMonth.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Main execution
async function main() {
  try {
    // Step 1: Get user info
    const userInfo = await getUserInfo();
    console.log();

    // Step 2: Initiate payment
    const paymentUrl = await initiatePayFastPayment(userInfo.userId);
    console.log();

    // Step 3: Open PayFast page
    openPayFastPage(paymentUrl);
    console.log();

    console.log("=".repeat(80));
    console.log("✅ TEST SCRIPT COMPLETED");
    console.log("=".repeat(80));
    console.log();
    console.log("📋 Next Steps:");
    console.log("   1. Complete the payment on PayFast");
    console.log("   2. PayFast will send webhook to: /payment/notify");
    console.log("   3. Webhook will upgrade user and send email");
    console.log("   4. You should be redirected back to the site");
    console.log();
    console.log("💡 To check upgrade status manually, run:");
    console.log(
      `   node -e "require('./test-subscription-upgrade.js').checkStatus('${userInfo.userId}', '${userInfo.token}')"`
    );
    console.log("=".repeat(80));
  } catch (error) {
    console.error();
    console.error("❌ ERROR:", error.message);
    console.error();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for manual status check
module.exports = { checkUpgradeStatus };
