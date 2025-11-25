/**
 * Check if user exists in production database
 * This will help us understand if production is using Supabase or Railway DB
 */

const { Client } = require("pg");
const axios = require("axios");

// Supabase connection
const SUPABASE_URL =
  "postgresql://postgres.pqdxqvxyrahvongbhtdb:Kopenikus0218!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

// Production API
const PROD_API = "https://web-production-737b.up.railway.app";

async function checkUserInSupabase(email) {
  console.log("🔍 Checking user in Supabase database...");
  const client = new Client({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(
      "SELECT id, email, role, is_active, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      console.log("❌ User NOT found in Supabase");
      return null;
    }

    const user = result.rows[0];
    console.log("✅ User found in Supabase:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.is_active}`);
    console.log(`   Password Hash: ${user.password_hash.substring(0, 20)}...`);
    return user;
  } catch (error) {
    console.error("❌ Supabase error:", error.message);
    return null;
  } finally {
    await client.end();
  }
}

async function testProductionLogin(email, password) {
  console.log(`\n🔐 Testing production login...`);
  console.log(`   API: ${PROD_API}/auth/login`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);

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
    console.log(`   Status: ${response.status}`);
    console.log(`   User ID: ${response.data.user?.id}`);
    console.log(`   User Role: ${response.data.user?.role}`);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ Login failed: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);

      // Check if it's a user not found or password issue
      if (error.response.status === 401) {
        const errorMsg = error.response.data?.error || "";
        if (errorMsg.includes("Invalid credentials")) {
          console.log("\n📝 Analysis:");
          console.log("   - Backend returned 'Invalid credentials'");
          console.log("   - This means either:");
          console.log("     1. User doesn't exist in production database");
          console.log("     2. Password is incorrect");
          console.log("     3. User is inactive");
        }
      }
    } else if (error.request) {
      console.log("❌ No response from server");
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log("🔍 Production User Investigation\n");
  console.log("=".repeat(60));

  const email = "admin@trevnoctilla.com";
  const password = "admin123";

  // Step 1: Check if user exists in Supabase
  const supabaseUser = await checkUserInSupabase(email);

  if (!supabaseUser) {
    console.log("\n❌ User not found in Supabase. Cannot proceed.");
    process.exit(1);
  }

  // Step 2: Test production login
  const loginSuccess = await testProductionLogin(email, password);

  // Step 3: Analysis
  console.log("\n" + "=".repeat(60));
  console.log("📊 ANALYSIS");
  console.log("=".repeat(60));

  if (loginSuccess) {
    console.log("✅ Login works - user exists in production database");
    console.log("   Production backend is using the same database as Supabase");
  } else {
    console.log("❌ Login failed");
    console.log("\n🔍 Possible causes:");
    console.log(
      "   1. Production backend uses Railway database (not Supabase)"
    );
    console.log("   2. User exists in Supabase but not in Railway database");
    console.log("   3. Password hash is different in production");
    console.log("   4. User is inactive in production database");
    console.log("\n💡 To fix:");
    console.log("   - Check Railway env vars: SUPABASE_DATABASE_URL");
    console.log("   - Check if user exists in Railway database");
    console.log("   - Reset password in production database");
  }

  console.log("=".repeat(60));
}

main().catch(console.error);
