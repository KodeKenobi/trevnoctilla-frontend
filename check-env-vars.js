/**
 * Check Environment Variables Script
 * 
 * This script checks if PayFast environment variables are set correctly.
 * 
 * Usage: node check-env-vars.js
 */

console.log("=".repeat(80));
console.log("PayFast Environment Variables Check");
console.log("=".repeat(80));

const requiredVars = [
  'NEXT_PUBLIC_PAYFAST_MERCHANT_ID',
  'NEXT_PUBLIC_PAYFAST_MERCHANT_KEY',
  'NEXT_PUBLIC_PAYFAST_PASSPHRASE',
  'NEXT_PUBLIC_PAYFAST_URL',
];

console.log("\n📋 Checking required environment variables:\n");

let allSet = true;
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  const isSet = !!value;
  const length = value ? value.length : 0;
  
  console.log(`${isSet ? '✅' : '❌'} ${varName}:`);
  console.log(`   Set: ${isSet}`);
  if (isSet) {
    console.log(`   Length: ${length}`);
    // Show first and last character for verification (not full value for security)
    console.log(`   Preview: ${value.substring(0, 3)}...${value.substring(value.length - 3)}`);
  } else {
    console.log(`   Value: NOT SET`);
    allSet = false;
  }
  console.log();
});

console.log("=".repeat(80));
if (allSet) {
  console.log("✅ All required environment variables are set!");
} else {
  console.log("❌ Some environment variables are missing!");
  console.log("\nTo set them:");
  console.log("  export NEXT_PUBLIC_PAYFAST_MERCHANT_ID=your_merchant_id");
  console.log("  export NEXT_PUBLIC_PAYFAST_MERCHANT_KEY=your_merchant_key");
  console.log("  export NEXT_PUBLIC_PAYFAST_PASSPHRASE=your_passphrase");
  console.log("  export NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process");
  console.log("\nOr on Railway:");
  console.log("  railway variables --set \"NEXT_PUBLIC_PAYFAST_PASSPHRASE=your_passphrase\"");
}
console.log("=".repeat(80));

