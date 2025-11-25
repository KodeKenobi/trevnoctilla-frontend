/**
 * Find all super admin users in the database
 */

const { Client } = require("pg");

const SUPABASE_URL =
  "postgresql://postgres.pqdxqvxyrahvongbhtdb:Kopenikus0218!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

async function findSuperAdmins() {
  const client = new Client({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("🔍 Searching for super_admin users...\n");

    const result = await client.query(
      "SELECT id, email, role, is_active, created_at FROM users WHERE role = 'super_admin' ORDER BY id"
    );

    if (result.rows.length === 0) {
      console.log("❌ No super_admin users found");
      return [];
    }

    console.log(`✅ Found ${result.rows.length} super_admin user(s):\n`);
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Created: ${user.created_at}`);
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

async function main() {
  const users = await findSuperAdmins();
  
  if (users.length > 0) {
    console.log("💡 To use a specific user, update the script with:");
    console.log(`   Email: ${users[0].email}`);
  }
}

main().catch(console.error);

