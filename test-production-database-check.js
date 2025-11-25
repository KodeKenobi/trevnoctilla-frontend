/**
 * Check what database production backend is using
 * Test if we can determine the exact issue
 */

const axios = require("axios");

const PROD_API = "https://web-production-737b.up.railway.app";

async function checkBackendHealth() {
  console.log("🔍 Checking production backend health...");
  try {
    const response = await axios.get(`${PROD_API}/health`, { timeout: 5000 });
    console.log("✅ Backend is accessible");
    console.log("   Response:", JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`⚠️  Backend responded: ${error.response.status}`);
    } else {
      console.log("❌ Backend not accessible");
    }
    return false;
  }
}

async function testLoginWithDetails(email, password) {
  console.log(`\n🔐 Testing login with detailed error checking...`);

  try {
    const response = await axios.post(
      `${PROD_API}/auth/login`,
      { email, password },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
        validateStatus: () => true, // Don't throw on any status
      }
    );

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);

    if (response.status === 200) {
      console.log("✅ Login successful");
      return true;
    } else if (response.status === 401) {
      console.log("❌ 401 Unauthorized");
      const errorMsg = response.data?.error || "";

      // The backend returns "Invalid credentials" for both:
      // 1. User not found: User.query.filter_by(email=email, is_active=True).first() returns None
      // 2. Password wrong: user.check_password(password) returns False

      console.log("\n📝 Backend login logic:");
      console.log(
        "   1. Queries: User.query.filter_by(email=email, is_active=True).first()"
      );
      console.log(
        "   2. If user not found OR password wrong → 'Invalid credentials'"
      );
      console.log("\n🔍 Since we can't distinguish, the issue is:");
      console.log("   - User doesn't exist in production database, OR");
      console.log("   - Password is wrong in production database");
      console.log("\n💡 Production backend database:");
      console.log("   - Checks DATABASE_URL env var");
      console.log(
        "   - If Railway DB detected → uses SUPABASE_DATABASE_URL if set"
      );
      console.log("   - Otherwise uses hardcoded Supabase connection");
      console.log(
        "\n   Most likely: Production is using Railway database (not Supabase)"
      );
      console.log("   Solution: Set SUPABASE_DATABASE_URL in Railway env vars");

      return false;
    } else {
      console.log(`❌ Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🔍 Production Database Investigation\n");
  console.log("=".repeat(60));

  // Check backend health
  await checkBackendHealth();

  // Test login
  await testLoginWithDetails("admin@trevnoctilla.com", "admin123");

  console.log("\n" + "=".repeat(60));
  console.log("📊 CONCLUSION");
  console.log("=".repeat(60));
  console.log(
    "The production backend returns 'Invalid credentials' which means:"
  );
  console.log("  - Either user doesn't exist in production database");
  console.log("  - Or password is incorrect");
  console.log("\nSince user EXISTS in Supabase but login FAILS:");
  console.log("  → Production backend is likely using Railway database");
  console.log("  → User doesn't exist in Railway database");
  console.log("\n✅ SOLUTION:");
  console.log(
    "  1. Set SUPABASE_DATABASE_URL in Railway environment variables"
  );
  console.log("  2. Or create/reset user in Railway database");
  console.log("  3. Or check Railway logs to see which database it's using");
  console.log("=".repeat(60));
}

main().catch(console.error);
