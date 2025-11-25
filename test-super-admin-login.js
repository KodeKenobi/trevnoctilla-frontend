/**
 * Test script to find super admin user in database and test login
 *
 * Usage: node test-super-admin-login.js
 */

const axios = require("axios");
const { Client } = require("pg");

// Database connection (Supabase)
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.pqdxqvxyrahvongbhtdb:Kopenikus0218!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

// API base URL
const API_BASE_URL =
  process.env.API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://web-production-737b.up.railway.app"
    : "http://localhost:5000");

async function findSuperAdminUsers() {
  console.log("🔍 Connecting to database...");
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Query for super admin users
    const query = `
      SELECT 
        id,
        email,
        role,
        is_active,
        subscription_tier,
        created_at,
        last_login
      FROM users
      WHERE role = 'super_admin'
      ORDER BY created_at ASC
    `;

    console.log("🔍 Searching for super_admin users...");
    const result = await client.query(query);

    if (result.rows.length === 0) {
      console.log("❌ No super_admin users found in database");
      return null;
    }

    console.log(`\n✅ Found ${result.rows.length} super_admin user(s):\n`);
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Tier: ${user.subscription_tier}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Last Login: ${user.last_login || "Never"}`);
      console.log("");
    });

    return result.rows;
  } catch (error) {
    console.error("❌ Database error:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function testLogin(email, password) {
  console.log(`\n🔐 Testing login for: ${email}`);
  console.log(`   API URL: ${API_BASE_URL}/auth/login`);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      {
        email: email,
        password: password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.status === 200 && response.data.access_token) {
      console.log("✅ Login successful!");
      console.log(
        `   Access Token: ${response.data.access_token.substring(0, 50)}...`
      );
      console.log(`   User ID: ${response.data.user?.id}`);
      console.log(`   User Role: ${response.data.user?.role}`);
      console.log(`   User Email: ${response.data.user?.email}`);
      console.log(
        `   Subscription Tier: ${response.data.user?.subscription_tier}`
      );
      console.log(`   Token Expires In: ${response.data.expires_in} seconds`);
      return response.data;
    } else {
      console.log("❌ Login failed - invalid response");
      console.log("   Response:", JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.log(
        `❌ Login failed: ${error.response.status} ${error.response.statusText}`
      );
      console.log(
        "   Error:",
        error.response.data?.error ||
          error.response.data?.message ||
          "Unknown error"
      );
    } else if (error.request) {
      console.log("❌ Login failed: No response from server");
      console.log("   Error:", error.message);
    } else {
      console.log("❌ Login failed:", error.message);
    }
    return null;
  }
}

async function main() {
  console.log("🚀 Super Admin Login Test Script\n");
  console.log("=".repeat(60));

  try {
    // Step 1: Find super admin users
    const superAdmins = await findSuperAdminUsers();

    if (!superAdmins || superAdmins.length === 0) {
      console.log("\n⚠️  No super admin users found. Cannot test login.");
      console.log("   You may need to create a super admin user first.");
      process.exit(1);
    }

    // Step 2: Test login for each super admin
    console.log("\n" + "=".repeat(60));
    console.log("🔐 Attempting login with common passwords...\n");

    // Try the first super admin
    const firstSuperAdmin = superAdmins[0];

    // Common passwords to try
    const commonPasswords = [
      "admin123", // Default for admin@trevnoctilla.com
      "admin",
      "password",
      "123456",
      "password123",
    ];

    // Check if password was provided as command line argument
    const providedPassword = process.argv[2];
    if (providedPassword) {
      commonPasswords.unshift(providedPassword); // Try provided password first
    }

    let loginResult = null;
    for (const password of commonPasswords) {
      console.log(
        `   Trying password: ${
          password === providedPassword ? password : "***"
        }`
      );
      loginResult = await testLogin(firstSuperAdmin.email, password);
      if (loginResult) {
        break; // Success, stop trying
      }
    }

    if (loginResult) {
      console.log("\n" + "=".repeat(60));
      console.log("✅ Test completed successfully!");
      console.log("=".repeat(60));
      process.exit(0);
    } else {
      console.log("\n" + "=".repeat(60));
      console.log("❌ Login test failed");
      console.log("=".repeat(60));
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test failed with error:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run the test
main();
