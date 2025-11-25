/**
 * Local Login Functionality Test
 *
 * Tests login functionality locally by:
 * 1. Checking if backend is running on localhost:5000
 * 2. Testing backend login endpoint directly
 * 3. Testing NextAuth configuration
 * 4. Testing full login flow via browser (optional)
 */

const http = require("http");

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
// Use a real test email if available, otherwise prompt user
const TEST_EMAIL =
  process.env.TEST_EMAIL || process.argv[2] || "test@example.com";
const TEST_PASSWORD =
  process.env.TEST_PASSWORD || process.argv[3] || "testpassword123";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(80));
  log(title, "cyan");
  console.log("=".repeat(80));
}

/**
 * Check if a server is running on a given URL
 */
async function checkServer(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: "/health",
      method: "GET",
      timeout: 3000,
    };

    const req = http.request(options, (res) => {
      resolve({ running: true, status: res.statusCode });
    });

    req.on("error", () => {
      resolve({ running: false, error: "Connection refused" });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ running: false, error: "Timeout" });
    });

    req.end();
  });
}

/**
 * Test backend health endpoint
 */
async function testBackendHealth() {
  logSection("🔍 CHECKING BACKEND HEALTH");

  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.text();
      log(`✅ Backend is running on ${BACKEND_URL}`, "green");
      log(`   Status: ${response.status}`, "green");
      log(`   Response: ${data.substring(0, 100)}`, "green");
      return true;
    } else {
      log(`⚠️  Backend responded with status ${response.status}`, "yellow");
      return false;
    }
  } catch (error) {
    log(`❌ Backend is not accessible: ${error.message}`, "red");
    log(`   Make sure the backend is running on ${BACKEND_URL}`, "yellow");
    log(`   Start it with: cd trevnoctilla-backend && python app.py`, "yellow");
    return false;
  }
}

/**
 * Test backend login endpoint directly
 */
async function testBackendLogin(email, password) {
  logSection("🔐 TESTING BACKEND LOGIN ENDPOINT");

  log(`Email: ${email}`);
  log(`Backend URL: ${BACKEND_URL}/auth/login`);

  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const responseText = await response.text();

    log(
      `\n📊 Response Status: ${response.status}`,
      response.ok ? "green" : "red"
    );
    log(`📊 Response Body: ${responseText.substring(0, 500)}`);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        log(`\n✅ Login successful!`, "green");
        log(`   User ID: ${data.user?.id || "N/A"}`);
        log(`   User Email: ${data.user?.email || "N/A"}`);
        log(`   User Role: ${data.user?.role || "N/A"}`);
        log(
          `   Access Token: ${data.access_token ? "Present ✅" : "Missing ❌"}`
        );
        log(`   Subscription Tier: ${data.user?.subscription_tier || "N/A"}`);
        return { success: true, data };
      } catch (parseError) {
        log(`\n⚠️  Response is not valid JSON`, "yellow");
        return { success: false, error: "Invalid JSON response" };
      }
    } else {
      log(`\n❌ Login failed`, "red");
      try {
        const errorData = JSON.parse(responseText);
        log(`   Error: ${errorData.error || "Unknown error"}`, "red");
      } catch (e) {
        log(`   Error: ${responseText}`, "red");
      }
      return { success: false, error: responseText };
    }
  } catch (error) {
    log(`\n❌ Network error: ${error.message}`, "red");
    return { success: false, error: error.message };
  }
}

/**
 * Test NextAuth endpoint
 */
async function testNextAuth() {
  logSection("🔑 TESTING NEXTAUTH CONFIGURATION");

  try {
    // Test if NextAuth route exists
    const response = await fetch(`${FRONTEND_URL}/api/auth/providers`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      log(`✅ NextAuth is configured`, "green");
      log(`   Available providers: ${Object.keys(data).join(", ")}`);
      return true;
    } else {
      log(`⚠️  NextAuth endpoint returned status ${response.status}`, "yellow");
      return false;
    }
  } catch (error) {
    log(`❌ NextAuth endpoint not accessible: ${error.message}`, "red");
    log(`   Make sure the frontend is running on ${FRONTEND_URL}`, "yellow");
    log(`   Start it with: npm run dev`, "yellow");
    return false;
  }
}

/**
 * Test frontend login page
 */
async function testLoginPage() {
  logSection("🌐 TESTING LOGIN PAGE");

  try {
    const response = await fetch(`${FRONTEND_URL}/auth/login`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const html = await response.text();
      const hasEmailInput =
        html.includes('id="email"') || html.includes('name="email"');
      const hasPasswordInput =
        html.includes('id="password"') || html.includes('name="password"');
      const hasSubmitButton =
        html.includes('type="submit"') || html.includes("button");

      log(`✅ Login page is accessible`, "green");
      log(`   Email input: ${hasEmailInput ? "✅ Found" : "❌ Not found"}`);
      log(
        `   Password input: ${hasPasswordInput ? "✅ Found" : "❌ Not found"}`
      );
      log(`   Submit button: ${hasSubmitButton ? "✅ Found" : "❌ Not found"}`);

      return hasEmailInput && hasPasswordInput && hasSubmitButton;
    } else {
      log(`⚠️  Login page returned status ${response.status}`, "yellow");
      return false;
    }
  } catch (error) {
    log(`❌ Login page not accessible: ${error.message}`, "red");
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.clear();
  logSection("🧪 LOCAL LOGIN FUNCTIONALITY TEST");
  log(`Backend URL: ${BACKEND_URL}`);
  log(`Frontend URL: ${FRONTEND_URL}`);
  log(`Test Email: ${TEST_EMAIL}`);
  console.log("=".repeat(80));

  const results = {
    backendHealth: false,
    backendLogin: false,
    nextAuth: false,
    loginPage: false,
  };

  // Test 1: Backend Health
  results.backendHealth = await testBackendHealth();

  if (!results.backendHealth) {
    log("\n⚠️  Backend is not running. Some tests will be skipped.", "yellow");
    log("   Please start the backend first:", "yellow");
    log("   cd trevnoctilla-backend", "yellow");
    log("   python app.py", "yellow");
  }

  // Test 2: Backend Login (only if backend is running)
  if (results.backendHealth) {
    const loginResult = await testBackendLogin(TEST_EMAIL, TEST_PASSWORD);
    results.backendLogin = loginResult.success;

    if (!loginResult.success) {
      log("\n💡 TIP: Make sure the test user exists in the database", "yellow");
      log("   You can create a test user or use an existing one", "yellow");
    }
  }

  // Test 3: Frontend Health
  logSection("🔍 CHECKING FRONTEND HEALTH");
  try {
    const response = await fetch(`${FRONTEND_URL}`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      log(`✅ Frontend is running on ${FRONTEND_URL}`, "green");
    } else {
      log(`⚠️  Frontend returned status ${response.status}`, "yellow");
    }
  } catch (error) {
    log(`❌ Frontend is not accessible: ${error.message}`, "red");
    log(`   Make sure the frontend is running on ${FRONTEND_URL}`, "yellow");
    log(`   Start it with: npm run dev`, "yellow");
  }

  // Test 4: NextAuth Configuration
  results.nextAuth = await testNextAuth();

  // Test 5: Login Page
  results.loginPage = await testLoginPage();

  // Final Summary
  logSection("📊 TEST SUMMARY");

  log(
    `Backend Health: ${results.backendHealth ? "✅ PASS" : "❌ FAIL"}`,
    results.backendHealth ? "green" : "red"
  );
  log(
    `Backend Login: ${results.backendLogin ? "✅ PASS" : "❌ FAIL"}`,
    results.backendLogin ? "green" : "red"
  );
  log(
    `NextAuth Config: ${results.nextAuth ? "✅ PASS" : "❌ FAIL"}`,
    results.nextAuth ? "green" : "red"
  );
  log(
    `Login Page: ${results.loginPage ? "✅ PASS" : "❌ FAIL"}`,
    results.loginPage ? "green" : "red"
  );

  const allPassed = Object.values(results).every((r) => r);

  console.log("\n" + "=".repeat(80));
  if (allPassed) {
    log("🎉 ALL TESTS PASSED!", "green");
    log("   Login functionality is working correctly locally.", "green");
  } else {
    log("⚠️  SOME TESTS FAILED", "yellow");
    log("   Please fix the issues above before proceeding.", "yellow");
  }
  console.log("=".repeat(80));

  return allPassed;
}

// Run tests
if (require.main === module) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      log(`\n❌ FATAL ERROR: ${error.message}`, "red");
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runTests, testBackendLogin, testBackendHealth };
