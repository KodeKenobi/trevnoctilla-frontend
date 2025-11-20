/**
 * Script to generate NEXTAUTH_SECRET and provide Railway CLI command
 * 
 * Usage: node set-railway-nextauth-secret.js
 */

const crypto = require("crypto");

// Generate a secure random secret
const secret = crypto.randomBytes(32).toString("base64");

console.log("=".repeat(60));
console.log("🔐 NEXTAUTH_SECRET GENERATOR FOR RAILWAY");
console.log("=".repeat(60));
console.log();
console.log("📋 Generated secure NEXTAUTH_SECRET:");
console.log(`   ${secret}`);
console.log();
console.log("=".repeat(60));
console.log("📋 Run this command to set it in Railway:");
console.log("=".repeat(60));
console.log();
console.log(`railway variables --set "NEXTAUTH_SECRET=${secret}"`);
console.log();
console.log("=".repeat(60));
console.log("💡 After setting, restart your Railway service");
console.log("=".repeat(60));
