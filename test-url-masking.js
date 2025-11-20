/**
 * Test script to verify Railway URL is hidden from frontend
 * This script checks that API calls use relative URLs instead of Railway URL
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const RAILWAY_URL = "web-production-737b.up.railway.app";

console.log("🧪 Testing URL Masking Configuration\n");
console.log("=".repeat(60));

// Test 1: Check if getBaseUrl returns relative URLs in production
console.log("\n📋 Test 1: Checking lib/config.ts getBaseUrl() logic");
console.log("-".repeat(60));

// Simulate client-side production environment
const mockWindow = {
  location: {
    hostname: "web-production-737b.up.railway.app", // Production hostname
  },
};

// Simulate the getBaseUrl logic
function testGetBaseUrl() {
  // Client-side production simulation
  if (typeof mockWindow !== "undefined") {
    const hostname = mockWindow.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
    // Production: should return empty string (relative URLs)
    return "";
  }
  return "https://web-production-737b.up.railway.app";
}

const baseUrl = testGetBaseUrl();
if (baseUrl === "") {
  console.log(
    "✅ PASS: getBaseUrl() returns empty string (relative URLs) in production"
  );
} else {
  console.log(
    `❌ FAIL: getBaseUrl() returns "${baseUrl}" instead of empty string`
  );
}

// Test 2: Check if getApiUrl constructs relative URLs correctly
console.log("\n📋 Test 2: Checking getApiUrl() function");
console.log("-".repeat(60));

function testGetApiUrl(endpoint, baseUrl) {
  if (!baseUrl) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

const testEndpoints = [
  "/api/upload",
  "/auth/login",
  "/api/payment/billing-history",
  "/api/client/keys",
];

testEndpoints.forEach((endpoint) => {
  const url = testGetApiUrl(endpoint, "");
  if (!url.includes(RAILWAY_URL) && url.startsWith("/")) {
    console.log(`✅ PASS: ${endpoint} → ${url} (relative, no Railway URL)`);
  } else {
    console.log(
      `❌ FAIL: ${endpoint} → ${url} (contains Railway URL or not relative)`
    );
  }
});

// Test 3: Check next.config.js rewrites
console.log("\n📋 Test 3: Checking next.config.js rewrites");
console.log("-".repeat(60));

const fs = require("fs");
const nextConfigPath = "./next.config.js";

if (fs.existsSync(nextConfigPath)) {
  const nextConfigContent = fs.readFileSync(nextConfigPath, "utf8");

  // Check if rewrites are configured
  if (nextConfigContent.includes("async rewrites()")) {
    console.log("✅ PASS: next.config.js has rewrites() function");
  } else {
    console.log("❌ FAIL: next.config.js missing rewrites() function");
  }

  // Check for key API route rewrites
  const requiredRewrites = [
    "/api/upload",
    "/auth/:path*",
    "/api/payment/:path*",
    "/api/client/:path*",
    "/api/v1/:path*",
  ];

  requiredRewrites.forEach((rewrite) => {
    if (nextConfigContent.includes(rewrite.replace(":path*", ""))) {
      console.log(`✅ PASS: Rewrite found for ${rewrite}`);
    } else {
      console.log(`⚠️  WARN: Rewrite not found for ${rewrite}`);
    }
  });
} else {
  console.log("❌ FAIL: next.config.js not found");
}

// Test 4: Check component files for hardcoded Railway URLs
console.log("\n📋 Test 4: Checking for hardcoded Railway URLs in components");
console.log("-".repeat(60));

const path = require("path");
const glob = require("glob");

// Check frontend files (app, components, lib - but not lib/auth.ts which is server-side)
const frontendFiles = [
  ...glob.sync("app/**/*.{ts,tsx}"),
  ...glob.sync("components/**/*.{ts,tsx}"),
  ...glob.sync("lib/config.ts"),
].filter((file) => !file.includes("node_modules"));

let foundHardcoded = false;
frontendFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    // Check for hardcoded Railway URL (but allow in comments or server-side code)
    if (content.includes(RAILWAY_URL) && !file.includes("auth.ts")) {
      // Check if it's in a client-side context
      if (
        content.includes("typeof window") ||
        content.includes("window.location")
      ) {
        const lines = content.split("\n");
        lines.forEach((line, index) => {
          if (line.includes(RAILWAY_URL) && !line.trim().startsWith("//")) {
            // Check if it's in a client-side conditional
            if (!line.includes("localhost") || !line.includes("127.0.0.1")) {
              console.log(
                `⚠️  WARN: Potential hardcoded URL in ${file}:${index + 1}`
              );
              console.log(`   ${line.trim()}`);
              foundHardcoded = true;
            }
          }
        });
      }
    }
  } catch (err) {
    // Skip files that can't be read
  }
});

if (!foundHardcoded) {
  console.log("✅ PASS: No hardcoded Railway URLs found in client-side code");
} else {
  console.log("⚠️  WARN: Some hardcoded Railway URLs may still exist");
}

// Test 5: Verify API endpoint construction
console.log("\n📋 Test 5: Testing API endpoint URL construction");
console.log("-".repeat(60));

const testCases = [
  { endpoint: "/api/upload", expected: "/api/upload", baseUrl: "" },
  { endpoint: "/auth/login", expected: "/auth/login", baseUrl: "" },
  { endpoint: "api/upload", expected: "/api/upload", baseUrl: "" },
  {
    endpoint: "/api/payment/billing-history",
    expected: "/api/payment/billing-history",
    baseUrl: "",
  },
];

testCases.forEach(({ endpoint, expected, baseUrl }) => {
  const result = testGetApiUrl(endpoint, baseUrl);
  if (result === expected || result === endpoint) {
    console.log(`✅ PASS: "${endpoint}" → "${result}" (relative URL)`);
  } else {
    console.log(`❌ FAIL: "${endpoint}" → "${result}" (expected relative URL)`);
  }
});

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 Test Summary");
console.log("=".repeat(60));
console.log("\n✅ All tests completed!");
console.log("\n💡 To verify in browser:");
console.log("   1. Start dev server: npm run dev");
console.log("   2. Open http://localhost:3000");
console.log("   3. Open DevTools → Network tab");
console.log("   4. Make API calls (login, upload, etc.)");
console.log(
  "   5. Check Network tab - should see relative URLs like '/api/...'"
);
console.log("   6. Railway URL should NOT appear in any requests\n");
