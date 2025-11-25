/**
 * Check which super admin exists in production and reset password
 */

const axios = require("axios");

const PROD_API = "https://web-production-737b.up.railway.app";

async function checkProductionSuperAdmins() {
  try {
    const response = await axios.get(`${PROD_API}/test/view-database`);
    const superAdmins = response.data.users.filter(
      (u) => u.role === "super_admin"
    );

    console.log("🔍 Super admins in production:\n");
    if (superAdmins.length === 0) {
      console.log("❌ No super_admin users found in production");
      return null;
    }

    superAdmins.forEach((u, index) => {
      console.log(`${index + 1}. ${u.email}`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Active: ${u.is_active}`);
      console.log(`   Tier: ${u.subscription_tier}`);
      console.log("");
    });

    return superAdmins[0]; // Return first one
  } catch (error) {
    console.error("❌ Error checking production:", error.message);
    return null;
  }
}

async function resetPassword(email, password) {
  console.log(`\n🔐 Resetting password for: ${email}`);
  try {
    const response = await axios.post(
      `${PROD_API}/auth/admin/update-password`,
      {
        email: email,
        password: password,
      }
    );

    console.log("✅ Password reset successful!");
    return true;
  } catch (error) {
    console.error(
      `❌ Password reset failed: ${error.response?.status} - ${error.response?.data?.error || error.message}`
    );
    return false;
  }
}

async function testLogin(email, password) {
  console.log(`\n🔐 Testing login...`);
  try {
    const response = await axios.post(`${PROD_API}/auth/login`, {
      email,
      password,
    });

    console.log("✅ Login successful!");
    console.log(`   User: ${response.data.user?.email}`);
    console.log(`   Role: ${response.data.user?.role}`);
    return true;
  } catch (error) {
    console.error(
      `❌ Login failed: ${error.response?.status} - ${error.response?.data?.error || error.message}`
    );
    return false;
  }
}

async function main() {
  console.log("🔍 Checking Production Super Admins\n");
  console.log("=".repeat(60));

  const superAdmin = await checkProductionSuperAdmins();

  if (!superAdmin) {
    console.log("\n❌ No super admin found. Cannot proceed.");
    process.exit(1);
  }

  const password = "admin123";

  // Reset password
  const resetSuccess = await resetPassword(superAdmin.email, password);

  if (resetSuccess) {
    // Test login
    await testLogin(superAdmin.email, password);

    console.log("\n" + "=".repeat(60));
    console.log("✅ READY TO USE:");
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: ${password}`);
    console.log("=".repeat(60));
  }
}

main().catch(console.error);

