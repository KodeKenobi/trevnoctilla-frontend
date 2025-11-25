/**
 * Reset admin password in production database
 */

const axios = require("axios");

const PROD_API = "https://web-production-737b.up.railway.app";

async function resetAdminPassword(email, newPassword) {
  console.log(`🔐 Resetting password for: ${email}`);
  console.log(`   New password: ${newPassword}`);
  console.log(`   API: ${PROD_API}/auth/admin/update-password`);

  try {
    const response = await axios.post(
      `${PROD_API}/auth/admin/update-password`,
      {
        email: email,
        password: newPassword,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    console.log("✅ Password reset successful!");
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ Password reset failed: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`❌ Request failed: ${error.message}`);
    }
    return false;
  }
}

async function testLogin(email, password) {
  console.log(`\n🔐 Testing login with new password...`);
  try {
    const response = await axios.post(
      `${PROD_API}/auth/login`,
      { email, password },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    console.log("✅ Login successful!");
    console.log(`   User: ${response.data.user?.email}`);
    console.log(`   Role: ${response.data.user?.role}`);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ Login failed: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function main() {
  const email = "admin@trevnoctilla.com";
  const newPassword = "admin123";

  console.log("🔧 Admin Password Reset\n");
  console.log("=".repeat(60));

  // Check if admin/update-password endpoint exists
  console.log("⚠️  NOTE: This requires admin authentication.");
  console.log(
    "   If the endpoint requires auth, we need to find another way.\n"
  );

  const success = await resetAdminPassword(email, newPassword);

  if (success) {
    await testLogin(email, newPassword);
  }

  console.log("\n" + "=".repeat(60));
}

main().catch(console.error);
