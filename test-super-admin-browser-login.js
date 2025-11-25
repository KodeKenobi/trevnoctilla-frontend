/**
 * Test script: Find super admin from database and login in browser
 * Opens browser, finds super admin user, and logs in visually
 */

const puppeteer = require("puppeteer");
const { Client } = require("pg");
const axios = require("axios");

// Database connection (Supabase)
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.pqdxqvxyrahvongbhtdb:Kopenikus0218!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

// API base URL - use production
const API_BASE_URL =
  process.env.API_BASE_URL || "https://web-production-737b.up.railway.app";

// Frontend URL
const FRONTEND_URL = process.env.FRONTEND_URL || "https://trevnoctilla.com";

// Common passwords to try
const COMMON_PASSWORDS = ["admin123", "admin", "password", "123456"];

async function findSuperAdminUsers() {
  console.log("🔍 Connecting to database...");
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

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
      WHERE role = 'super_admin' AND is_active = true
        AND email IN ('admin@trevnoctilla.com', 'admin@gmail.com', 'kodekenobi@gmail.com')
      ORDER BY 
        CASE email
          WHEN 'admin@trevnoctilla.com' THEN 1
          WHEN 'admin@gmail.com' THEN 2
          WHEN 'kodekenobi@gmail.com' THEN 3
          ELSE 4
        END
      LIMIT 1
    `;

    console.log("🔍 Searching for super_admin user...");
    const result = await client.query(query);

    if (result.rows.length === 0) {
      console.log("❌ No super_admin users found in database");
      return null;
    }

    const user = result.rows[0];
    console.log(`\n✅ Found super_admin user:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tier: ${user.subscription_tier}`);
    console.log("");

    return user;
  } catch (error) {
    console.error("❌ Database error:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function findWorkingPassword(email) {
  console.log(`🔐 Testing passwords for: ${email}`);
  console.log(`   API URL: ${API_BASE_URL}/auth/login`);
  console.log(
    `\n⚠️  NOTE: Production backend may be using a different database than Supabase.`
  );
  console.log(
    `   The user exists in Supabase, but production might use Railway's database.`
  );
  console.log(
    `   If all passwords fail, the user may need to be created/reset in production.\n`
  );

  for (const password of COMMON_PASSWORDS) {
    try {
      console.log(`   Trying: ${password}`);
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        }
      );

      if (response.status === 200 && response.data.access_token) {
        console.log(`✅ Password found: ${password}`);
        return password;
      }
    } catch (error) {
      if (error.response) {
        console.log(
          `   ❌ ${password}: ${error.response.status} - ${
            error.response.data?.error || "Invalid credentials"
          }`
        );
      } else if (error.request) {
        console.log(`   ❌ ${password}: No response from server`);
      } else {
        console.log(`   ❌ ${password}: ${error.message}`);
      }
    }
  }

  console.log("\n❌ No working password found");
  console.log("   Possible reasons:");
  console.log("   1. Production backend uses Railway database (not Supabase)");
  console.log("   2. Password is different in production");
  console.log("   3. User doesn't exist in production database");
  console.log("\n   You can:");
  console.log(
    "   - Provide password manually: node test-super-admin-browser-login.js <password>"
  );
  console.log("   - Reset password in production database");
  console.log(
    "   - Check Railway environment variables (SUPABASE_DATABASE_URL)"
  );
  return null;
}

async function loginInBrowser(page, email, password) {
  const LOGIN_URL = `${FRONTEND_URL}/auth/login`;

  console.log(`\n🌐 Opening browser login page...`);
  console.log(`   URL: ${LOGIN_URL}`);

  try {
    await page.goto(LOGIN_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    console.log("✅ Login page loaded");

    // Handle cookie consent
    await page.waitForTimeout(1000);
    try {
      const cookieButtons = await page.$$("button");
      for (const button of cookieButtons) {
        const text = await page.evaluate(
          (el) => el.textContent?.toLowerCase(),
          button
        );
        if (text && (text.includes("reject") || text.includes("decline"))) {
          await button.click();
          console.log("✅ Cookie consent handled");
          await page.waitForTimeout(500);
          break;
        }
      }
    } catch (e) {
      // No cookie dialog
    }

    // Wait for email input - use id selector from actual page
    console.log("🔍 Looking for email input...");
    await page.waitForSelector("#email", { timeout: 15000 });
    const emailInput = await page.$("#email");
    console.log("✅ Email input found");

    // Fill email
    console.log(`\n📝 Filling in email: ${email}`);
    await emailInput.type(email, { delay: 50 });
    await page.waitForTimeout(500);

    // Fill password - use id selector from actual page
    console.log(`📝 Filling in password...`);
    await page.waitForSelector("#password", { timeout: 10000 });
    const passwordInput = await page.$("#password");
    console.log("✅ Password input found");
    await passwordInput.type(password, { delay: 50 });
    await page.waitForTimeout(500);

    // Click submit
    console.log(`\n🔘 Clicking login button...`);
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
    } else {
      // Try to find login button by text
      const buttons = await page.$$("button");
      for (const button of buttons) {
        const text = await page.evaluate(
          (el) => el.textContent?.toLowerCase(),
          button
        );
        if (text && (text.includes("login") || text.includes("sign in"))) {
          await button.click();
          break;
        }
      }
    }

    console.log("✅ Login form submitted");

    // Wait for navigation or response
    console.log(`\n⏳ Waiting for login to complete...`);

    // Set up console logging to see errors
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("error") ||
        text.includes("Error") ||
        text.includes("401") ||
        text.includes("Unauthorized")
      ) {
        console.log(`   🔴 Browser Console: ${text}`);
      }
    });

    // Set up request/response logging
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/api/auth/") || url.includes("/auth/login")) {
        const status = response.status();
        console.log(`   📡 API Response: ${status} ${url}`);

        // Check for callback/credentials specifically
        if (url.includes("/api/auth/callback/credentials")) {
          if (status !== 200 && status !== 302) {
            response
              .text()
              .then((text) => {
                console.log(
                  `      ❌ Callback error: ${text.substring(0, 200)}`
                );
              })
              .catch(() => {});
          } else {
            console.log(`      ✅ Callback successful (${status})`);
          }
        }

        if (status !== 200 && status !== 302 && status !== 304) {
          response
            .text()
            .then((text) => {
              if (text.length < 200) {
                console.log(`      Error body: ${text}`);
              }
            })
            .catch(() => {});
        }
      }
    });

    try {
      // Wait specifically for the credentials callback
      console.log(`   ⏳ Waiting for NextAuth callback...`);
      await Promise.race([
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/auth/callback/credentials") &&
            (response.status() === 200 || response.status() === 302),
          { timeout: 15000 }
        ),
        page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }),
      ]);
      console.log(`   ✅ Callback received or navigation occurred`);
    } catch (e) {
      console.log(`   ⚠️  Callback timeout: ${e.message}`);
      // Wait a bit more to see if anything happens
      await page.waitForTimeout(3000);
    }

    // Wait a bit for any redirect
    await page.waitForTimeout(3000);

    // Check if we've been redirected
    let currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);

    // If still on login page, try navigating to dashboard
    if (currentUrl.includes("/auth/login")) {
      console.log(`\n🔄 Still on login page, checking session...`);

      // Check session via API
      const sessionCheck = await page.evaluate(async () => {
        try {
          const response = await fetch("/api/auth/session");
          const data = await response.json();
          return data;
        } catch (e) {
          return { error: e.message };
        }
      });

      if (sessionCheck?.user) {
        console.log(`✅ Session exists! User: ${sessionCheck.user.email}`);
        console.log(`   Redirecting to dashboard...`);

        // Navigate to dashboard with shorter timeout
        try {
          await page.goto(`${FRONTEND_URL}/dashboard`, {
            waitUntil: "domcontentloaded",
            timeout: 10000,
          });
          await page.waitForTimeout(2000);
          currentUrl = page.url();
          console.log(`📍 URL after dashboard navigation: ${currentUrl}`);
        } catch (navError) {
          console.log(`⚠️  Navigation timeout, but session is valid`);
          console.log(`   Current URL: ${page.url()}`);
          // Still consider it a success since session exists
        }
      } else {
        console.log(`❌ No session found: ${JSON.stringify(sessionCheck)}`);
      }
    }

    // Refresh page to ensure session is loaded
    console.log(`\n🔄 Refreshing page to verify session...`);
    await page.reload({ waitUntil: "networkidle0", timeout: 15000 });
    await page.waitForTimeout(2000);

    // Check result after refresh
    currentUrl = page.url();
    console.log(`\n📍 Current URL after refresh: ${currentUrl}`);

    if (currentUrl.includes("/auth/login")) {
      // Check for errors - more thorough
      const errorInfo = await page.evaluate(() => {
        // Check for error elements
        const errorSelectors = [
          '[role="alert"]',
          ".error",
          '[class*="error"]',
          '[class*="Error"]',
          '[id*="error"]',
          "p.text-red",
          "div.text-red",
          '[class*="text-red"]',
        ];

        let errorText = "";
        for (const selector of errorSelectors) {
          const els = document.querySelectorAll(selector);
          for (const el of els) {
            const text = el.textContent?.trim();
            if (
              text &&
              text.length > 0 &&
              !text.toLowerCase().includes("cookie")
            ) {
              errorText = text;
              break;
            }
          }
          if (errorText) break;
        }

        // Also check page text for error keywords
        const bodyText = document.body.innerText.toLowerCase();
        const errorKeywords = [
          "invalid email or password",
          "login failed",
          "authentication failed",
          "incorrect",
        ];
        for (const keyword of errorKeywords) {
          if (bodyText.includes(keyword)) {
            errorText = errorText || `Found error: ${keyword}`;
            break;
          }
        }

        return errorText;
      });

      if (errorInfo) {
        console.log(`❌ Login failed: ${errorInfo}`);
      } else {
        console.log("⚠️  Still on login page - no error message visible");
        console.log("   This might mean:");
        console.log("   - Password is incorrect");
        console.log("   - API is not responding");
        console.log("   - Network issue");
      }
      return false;
    } else {
      // Check if we have a session (even if still on login page)
      const finalSessionCheck = await page.evaluate(async () => {
        try {
          const response = await fetch("/api/auth/session");
          const data = await response.json();
          return data;
        } catch (e) {
          return null;
        }
      });

      if (finalSessionCheck?.user) {
        console.log("✅ Successfully logged in!");
        console.log(`   User: ${finalSessionCheck.user.email}`);
        console.log(`   Role: ${finalSessionCheck.user.role}`);
        console.log(`   Current URL: ${currentUrl}`);
      } else {
        console.log("⚠️  No session found after login");
        return false;
      }

      // Refresh page to ensure session is loaded
      console.log(`\n🔄 Refreshing page to verify session...`);
      await page.reload({ waitUntil: "networkidle0", timeout: 15000 });
      await page.waitForTimeout(2000);

      // Check if we're still logged in after refresh
      const urlAfterRefresh = page.url();
      console.log(`📍 URL after refresh: ${urlAfterRefresh}`);

      if (urlAfterRefresh.includes("/auth/login")) {
        console.log("⚠️  Redirected back to login page after refresh");
        console.log("   Session may not have been established");
        return false;
      }

      // Try to find user-specific elements to confirm login
      const loggedIn = await page.evaluate(() => {
        // Check for common logged-in indicators
        const indicators = [
          document.querySelector('[data-testid="user-menu"]'),
          document.querySelector('[data-testid="dashboard"]'),
          document.querySelector('a[href*="dashboard"]'),
          document.querySelector('a[href*="profile"]'),
          document.body.innerText.includes("Dashboard"),
          document.body.innerText.includes("Logout"),
          document.body.innerText.includes("Sign out"),
        ];
        return indicators.some((ind) => ind !== null && ind !== false);
      });

      if (loggedIn) {
        console.log(
          "✅ Confirmed: User is logged in (found logged-in indicators)"
        );
      } else {
        console.log(
          "⚠️  Could not find logged-in indicators, but URL suggests success"
        );
      }

      return true;
    }
  } catch (error) {
    console.error(`❌ Browser login error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Super Admin Browser Login Test\n");
  console.log("=".repeat(60));

  let browser;
  try {
    // Step 1: Find super admin from database
    const superAdmin = await findSuperAdminUsers();

    if (!superAdmin) {
      console.log("\n❌ No super admin user found. Cannot proceed.");
      process.exit(1);
    }

    // Step 2: Find working password
    // Check if password was provided as command line argument
    const providedPassword = process.argv[2];
    let password = providedPassword;

    if (!password) {
      password = await findWorkingPassword(superAdmin.email);
      if (!password) {
        console.log("\n❌ Could not find working password. Cannot proceed.");
        console.log(
          "   Usage: node test-super-admin-browser-login.js <password>"
        );
        process.exit(1);
      }
    } else {
      console.log(`\n🔐 Using provided password...`);
    }

    // Step 3: Open browser and login
    console.log("\n" + "=".repeat(60));
    console.log("🌐 OPENING BROWSER");
    console.log("=".repeat(60));

    browser = await puppeteer.launch({
      headless: false, // Show browser
      defaultViewport: { width: 1280, height: 720 },
    });

    const page = await browser.newPage();

    const loginSuccess = await loginInBrowser(page, superAdmin.email, password);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Super Admin: ${superAdmin.email}`);
    console.log(`Password: ${password}`);
    console.log(`Login: ${loginSuccess ? "✅ SUCCESS" : "❌ FAILED"}`);
    console.log("\n💡 Browser will stay open for 30 seconds for inspection...");
    console.log("=".repeat(60));

    // Keep browser open
    await page.waitForTimeout(30000);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.stack) {
      console.error("\nStack:", error.stack);
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log("\n🔒 Browser closed");
    }
  }
}

main();
