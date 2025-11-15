/**
 * Full flow test script: Payment → Webhook → Upgrade → Email
 * Tests the complete subscription upgrade process
 */

const https = require("https");
const http = require("http");
const { exec } = require("child_process");
const readline = require("readline");
const crypto = require("crypto");

// Configuration
const USER_EMAIL = "tshepomtshali89@gmail.com";
const USER_PASSWORD = "Kopenikus0218!";
const PLAN_ID = "production";
const PLAN_NAME = "Production Plan";
const AMOUNT = "29.00";

// API URLs
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://web-production-737b.up.railway.app";
const NEXTJS_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.trevnoctilla.com";

console.log("=".repeat(80));
console.log("🧪 FULL SUBSCRIPTION UPGRADE FLOW TEST");
console.log("=".repeat(80));
console.log(`User: ${USER_EMAIL}`);
console.log(`Plan: ${PLAN_NAME} (${PLAN_ID})`);
console.log(`Amount: R${AMOUNT}`);
console.log("=".repeat(80));
console.log();

// Step 1: Get user info (login)
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

// Step 2: Build payment data exactly as shown in log file
// This matches EXACTLY what the website sends - NO API CALLS
function buildPaymentData(userId) {
  const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || "10043520";
  const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || "irqvo1c2j9l08";
  const PASSPHRASE =
    process.env.PAYFAST_PASSPHRASE || "Trevnoctilla_PayFast_Test";

  // Build payment data with return_url for testing redirect
  const returnUrl = `${NEXTJS_BASE_URL}/dashboard`;
  const cancelUrl = `${NEXTJS_BASE_URL}/payment/cancel`;

  const paymentData = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    amount: AMOUNT,
    item_name: `${PLAN_NAME} - Monthly Subscription`,
    subscription_type: "1",
    billing_date: getBillingDate(),
    recurring_amount: AMOUNT,
    frequency: "3",
    cycles: "0",
    subscription_notify_email: "true",
    subscription_notify_webhook: "true",
    subscription_notify_buyer: "true",
    // notify_url is NOT included - configured in PayFast dashboard
  };

  // Generate signature
  let pfOutput = "";
  for (const key in paymentData) {
    const val = paymentData[key];
    if (val !== undefined && val !== null && String(val) !== "") {
      const trimmedVal = String(val).trim();
      if (trimmedVal !== "") {
        const encodedValue = encodeURIComponent(trimmedVal)
          .replace(/%20/g, "+")
          .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
        pfOutput += `${key}=${encodedValue}&`;
      }
    }
  }

  let getString = pfOutput.slice(0, -1);
  if (PASSPHRASE && PASSPHRASE.trim()) {
    const encodedPassphrase = encodeURIComponent(PASSPHRASE.trim())
      .replace(/%20/g, "+")
      .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
    getString += `&passphrase=${encodedPassphrase}`;
  }

  paymentData.signature = crypto
    .createHash("md5")
    .update(getString)
    .digest("hex");

  return paymentData;
}

// Step 3: Submit form to PayFast (same as form.submit() does)
async function submitToPayFast(paymentData, userInfo) {
  return new Promise((resolve, reject) => {
    // Log user info when clicking "Proceed to Pay"
    console.log();
    console.log("=".repeat(80));
    console.log("👤 USER CLICKED 'PROCEED TO PAY':");
    console.log("=".repeat(80));
    console.log(`   User ID: ${userInfo.userId}`);
    console.log(`   User Email: ${userInfo.email}`);
    console.log("=".repeat(80));
    console.log();

    // Build form data from paymentData (same as PayFastForm does)
    const formData = new URLSearchParams();
    for (const key in paymentData) {
      const value = paymentData[key];
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, String(value));
      }
    }

    // Log the exact payload being sent
    console.log();
    console.log("=".repeat(80));
    console.log("📦 EXACT PAYLOAD BEING SENT TO PAYFAST:");
    console.log("=".repeat(80));
    console.log("Form Data String (URL encoded):");
    console.log(formData.toString());
    console.log();
    console.log("Payment Data Object:");
    console.log(JSON.stringify(paymentData, null, 2));
    console.log();
    console.log("Field-by-field breakdown:");
    for (const key in paymentData) {
      const value = paymentData[key];
      if (value !== undefined && value !== null && value !== "") {
        console.log(`   ${key} = ${value}`);
      }
    }
    console.log("=".repeat(80));
    console.log();

    // PayFast URL (sandbox or production)
    const payfastUrl =
      process.env.PAYFAST_URL || "https://sandbox.payfast.co.za/eng/process";
    const url = new URL(payfastUrl);

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

    console.log();
    console.log("🚀 Step 3: Submitting payment to PayFast...");
    console.log(`   POST ${payfastUrl}`);
    console.log(`   This simulates clicking "Proceed to Pay" button`);
    console.log();
    console.log("📦 PayFast Form Data Being Sent (should match website log):");
    console.log("=".repeat(80));
    const sortedKeys = Object.keys(paymentData).sort();
    for (const key of sortedKeys) {
      const value = paymentData[key];
      if (value !== undefined && value !== null && value !== "") {
        console.log(`   ${key} = ${value}`);
      }
    }
    console.log("=".repeat(80));
    console.log();
    console.log(
      "✅ Testing with return_url and cancel_url for subscription redirect"
    );
    console.log(
      `   Has return_url: ${
        paymentData.return_url ? `✅ YES: ${paymentData.return_url}` : "❌ NO"
      }`
    );
    console.log(
      `   Has cancel_url: ${
        paymentData.cancel_url ? `✅ YES: ${paymentData.cancel_url}` : "❌ NO"
      }`
    );
    console.log(
      `   Has notify_url: ${
        paymentData.notify_url
          ? "❌ YES (WRONG)"
          : "✅ NO (CORRECT - configured in dashboard)"
      }`
    );
    console.log();

    const req = client.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log(`   PayFast response status: ${res.statusCode}`);

        if (res.statusCode === 302 || res.statusCode === 301) {
          // PayFast redirects to payment page
          const redirectUrl = res.headers.location;
          console.log(`   ✅ Payment form submitted successfully!`);
          console.log(`   Redirect URL: ${redirectUrl}`);

          // Log tier information that PayFast received
          // When PayFast returns, it will include this tier in the return URL
          const tierFromItemName = paymentData.item_name?.includes(PLAN_NAME)
            ? PLAN_ID
            : null;
          console.log();
          console.log("=".repeat(80));
          console.log("📋 TIER INFORMATION PAYFAST RECEIVED:");
          console.log("=".repeat(80));
          console.log(`   Tier/Plan: ${tierFromItemName || PLAN_ID}`);
          console.log(
            `   Plan Name (item_name): ${paymentData.item_name || "N/A"}`
          );
          console.log("=".repeat(80));
          console.log();

          resolve({
            success: true,
            redirectUrl: redirectUrl,
            statusCode: res.statusCode,
            tier: tierFromItemName || PLAN_ID,
          });
        } else if (res.statusCode === 400) {
          // PayFast error
          console.log(`   ❌ PayFast returned error 400`);
          console.log(`   Response: ${responseData.substring(0, 500)}`);
          reject(new Error(`PayFast error: ${responseData.substring(0, 200)}`));
        } else {
          console.log(`   ⚠️  Unexpected response: ${res.statusCode}`);
          console.log(`   Response: ${responseData.substring(0, 500)}`);
          resolve({
            success: true,
            statusCode: res.statusCode,
            response: responseData.substring(0, 500),
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    req.write(formData.toString());
    req.end();
  });
}

// Step 3: Verify user was upgraded
async function verifyUpgrade(userId) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}/auth/login`);
    const loginData = JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    });

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
    console.log("✅ Step 4: Verifying user upgrade...");
    console.log(`   Checking if user tier changed...`);

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
              const newTier = data.user.subscription_tier || "free";
              console.log(`   Current tier: ${newTier}`);

              if (newTier === "premium" || newTier === PLAN_ID) {
                console.log(`   ✅ User successfully upgraded to ${newTier}!`);
                resolve({
                  upgraded: true,
                  tier: newTier,
                });
              } else {
                console.log(
                  `   ❌ User tier is still ${newTier}, upgrade failed`
                );
                resolve({
                  upgraded: false,
                  tier: newTier,
                });
              }
            } else {
              reject(new Error("User data not found in response"));
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

// Helper: Get billing date
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
    const originalTier = userInfo.currentTier;
    console.log();

    // Step 2: Build payment data exactly as shown in log file
    const paymentData = buildPaymentData(userInfo.userId);
    console.log();
    console.log(
      "💳 Step 2: Building payment data (matching log file exactly)..."
    );
    console.log(`   ✅ Payment data built`);

    // Step 3: Submit to PayFast (same as form.submit() does)
    const payfastResult = await submitToPayFast(paymentData, {
      userId: userInfo.userId,
      email: USER_EMAIL,
    });

    // Open PayFast payment page in browser
    if (payfastResult.redirectUrl) {
      console.log();
      console.log("🌐 Opening PayFast payment page in browser...");
      const command =
        process.platform === "win32"
          ? `start "" "${payfastResult.redirectUrl}"`
          : process.platform === "darwin"
          ? `open "${payfastResult.redirectUrl}"`
          : `xdg-open "${payfastResult.redirectUrl}"`;

      exec(command, (error) => {
        if (error) {
          console.log(`   ⚠️  Could not open browser: ${error.message}`);
          console.log(`   Please manually open: ${payfastResult.redirectUrl}`);
        } else {
          console.log(`   ✅ Browser opened!`);
        }
      });
    }

    console.log();
    console.log("=".repeat(80));
    console.log("⏸️  WAITING FOR PAYMENT COMPLETION");
    console.log("=".repeat(80));
    console.log("Please complete the payment on PayFast.");
    console.log(
      "After payment, press ENTER to continue checking upgrade status..."
    );
    console.log("=".repeat(80));

    // Wait for user to press Enter
    console.log("Press ENTER to continue...");
    await new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on("line", (input) => {
        rl.close();
        resolve();
      });

      // Also handle if stdin is closed
      process.stdin.on("end", () => {
        rl.close();
        resolve();
      });
    });

    console.log();
    console.log("⏳ Checking upgrade status...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 4: Verify upgrade
    const upgradeResult = await verifyUpgrade(userInfo.userId);

    console.log();
    console.log("=".repeat(80));
    console.log("📊 TEST RESULTS");
    console.log("=".repeat(80));
    console.log(`Original tier: ${originalTier}`);
    console.log(`New tier: ${upgradeResult.tier}`);
    console.log(
      `Upgrade successful: ${upgradeResult.upgraded ? "✅ YES" : "❌ NO"}`
    );
    console.log();

    if (upgradeResult.upgraded) {
      console.log("✅ FULL FLOW TEST PASSED!");
      console.log("   - Webhook processed successfully");
      console.log("   - User upgraded correctly");
      console.log("   - Email should have been sent (check backend logs)");
    } else {
      console.log("❌ FULL FLOW TEST FAILED!");
      console.log("   - Webhook may have processed, but user was not upgraded");
      console.log("   - Check webhook logs and backend upgrade endpoint");
    }
    console.log("=".repeat(80));
  } catch (error) {
    console.error();
    console.error("❌ TEST ERROR:", error.message);
    console.error();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
