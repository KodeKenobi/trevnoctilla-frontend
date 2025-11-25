/**
 * Script to delete all test users from the database admin panel
 *
 * Requirements:
 *   - Node.js 18+ (for native fetch support)
 *   - Or install node-fetch: npm install node-fetch
 *
 * Usage:
 *   node test-delete-all-test-users.js
 *
 * This script will:
 * 1. Fetch all users from the database admin panel
 * 2. Filter for test users (emails containing "test" or matching test patterns)
 * 3. Delete each test user
 *
 * Test user patterns:
 *   - Emails containing "test", "testing", "testuser", "testmail"
 *   - Emails starting with "test@", "demo@", "temp@"
 *   - Emails containing "@test."
 *   - Emails ending with "example.com"
 */

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);
if (majorVersion < 18) {
  console.error(
    "❌ This script requires Node.js 18+ for native fetch support."
  );
  console.error(`   Current version: ${nodeVersion}`);
  console.error(
    "   Please upgrade Node.js or install node-fetch: npm install node-fetch"
  );
  process.exit(1);
}

const BASE_URL = "https://web-production-737b.up.railway.app";

// Test user patterns - emails matching these will be deleted
const TEST_USER_PATTERNS = [
  /test/i, // Contains "test"
  /^test@/i, // Starts with "test@"
  /@test\./i, // Contains "@test."
  /testuser/i, // Contains "testuser"
  /testing/i, // Contains "testing"
  /^demo@/i, // Starts with "demo@"
  /^temp@/i, // Starts with "temp@"
  /example\.com$/i, // Ends with "example.com"
  /testmail/i, // Contains "testmail"
];

/**
 * Check if an email matches test user patterns
 */
function isTestUser(email) {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();

  return TEST_USER_PATTERNS.some((pattern) => pattern.test(lowerEmail));
}

/**
 * Fetch all users from the database admin panel
 */
async function fetchAllUsers() {
  try {
    console.log("📡 Fetching users from database admin panel...");
    const response = await fetch(`${BASE_URL}/test/view-database`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success && data.error) {
      throw new Error(data.error);
    }

    const users = data.users || [];
    console.log(`✅ Found ${users.length} total users`);

    return users;
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    throw error;
  }
}

/**
 * Delete a user by email
 */
async function deleteUser(email) {
  try {
    console.log(`🗑️  Deleting user: ${email}`);

    const response = await fetch(`${BASE_URL}/test/delete-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`   ✅ Successfully deleted: ${email}`);
      return true;
    } else {
      console.error(
        `   ❌ Failed to delete ${email}: ${data.error || data.message}`
      );
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error deleting ${email}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Starting test user deletion script...\n");

  try {
    // Fetch all users
    const allUsers = await fetchAllUsers();

    // Filter test users
    const testUsers = allUsers.filter((user) => isTestUser(user.email));

    if (testUsers.length === 0) {
      console.log("✅ No test users found. Nothing to delete.");
      return;
    }

    console.log(`\n📊 Found ${testUsers.length} test user(s) to delete:`);
    testUsers.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.email} (ID: ${user.id}, Role: ${user.role})`
      );
    });

    // Confirm deletion
    console.log(
      "\n⚠️  WARNING: This will permanently delete the above test users!"
    );
    console.log(
      "   This includes all their related data (API keys, usage logs, etc.)\n"
    );

    // Optional: Add interactive confirmation
    // Uncomment the following lines to require manual confirmation:
    /*
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('Type "DELETE TEST USERS" to confirm: ', resolve);
    });
    rl.close();
    
    if (answer !== 'DELETE TEST USERS') {
      console.log('❌ Deletion cancelled.');
      return;
    }
    */

    // Delete each test user
    console.log("\n🗑️  Starting deletion process...\n");
    let successCount = 0;
    let failCount = 0;

    for (const user of testUsers) {
      const success = await deleteUser(user.email);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Deletion Summary:");
    console.log(`   ✅ Successfully deleted: ${successCount}`);
    console.log(`   ❌ Failed to delete: ${failCount}`);
    console.log(`   📝 Total processed: ${testUsers.length}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Script failed:", error.message);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
