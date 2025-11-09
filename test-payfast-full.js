/**
 * Full PayFast Payment Test - Actually submits to PayFast
 * This will show you exactly what's being sent and what PayFast returns
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnvFile();

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const PAYFAST_URL =
  process.env.NEXT_PUBLIC_PAYFAST_URL ||
  "https://sandbox.payfast.co.za/eng/process";

console.log("\n🧪 Testing FULL PayFast Payment Flow\n");
console.log("=".repeat(60));

async function testFullPaymentFlow() {
  try {
    // Step 1: Get payment data from your API
    console.log("\n1️⃣ Getting payment data from API...");
    const paymentData = {
      amount: "1.00",
      item_name: "Test Payment",
      item_description: "Full flow test",
      email_address: "test@example.com",
    };

    const response = await fetch(
      `${API_BASE_URL}/api/payments/payfast/initiate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ API Error:", error);
      return;
    }

    const data = await response.json();
    console.log("✓ Payment data received");
    console.log("Payment URL:", data.payment_url);

    // Check if using sandbox
    if (!data.payment_url.includes("sandbox")) {
      console.error("\n❌ ERROR: Using PRODUCTION URL!");
      console.error("Expected: https://sandbox.payfast.co.za/eng/process");
      console.error("Got:", data.payment_url);
      console.error("\nFix: Restart your dev server to load .env.local");
      return;
    }

    console.log("✓ Using SANDBOX URL - Good!");

    // Step 2: Show what will be sent to PayFast
    console.log("\n2️⃣ Payment data that will be sent to PayFast:");
    console.log(JSON.stringify(data.payment_data, null, 2));

    // Step 3: Create form data
    const formData = new URLSearchParams();
    Object.keys(data.payment_data).forEach((key) => {
      formData.append(key, String(data.payment_data[key]));
    });

    console.log("\n3️⃣ Form data (URL encoded):");
    console.log(formData.toString());

    // Step 4: Submit to PayFast
    console.log("\n4️⃣ Submitting to PayFast...");
    console.log("URL:", data.payment_url);

    const payfastResponse = await fetch(data.payment_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      redirect: "manual", // Don't follow redirects
    });

    console.log("\n5️⃣ PayFast Response:");
    console.log("Status:", payfastResponse.status);
    console.log("Status Text:", payfastResponse.statusText);
    console.log(
      "Headers:",
      Object.fromEntries(payfastResponse.headers.entries())
    );

    const responseText = await payfastResponse.text();

    if (payfastResponse.status === 302 || payfastResponse.status === 200) {
      console.log("\n✓ PayFast accepted the request!");
      const location = payfastResponse.headers.get("location");
      if (location) {
        console.log("Redirect to:", location);
      }
    } else {
      console.error(
        "\n❌ PayFast returned error status:",
        payfastResponse.status
      );
      console.log("Response body length:", responseText.length);

      // Try multiple patterns to extract error message
      const errorPatterns = [
        /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
        /<title>([^<]+)<\/title>/i,
        /Error[:\s]+([^<\n]+)/i,
        /<p[^>]*class="[^"]*error[^"]*"[^>]*>([^<]+)<\/p>/i,
        /<div[^>]*class="[^"]*error[^"]*"[^>]*>([^<]+)<\/div>/i,
        /Unfortunately[^<]+/i,
        /could not process[^<]+/i,
        /Generated signature does not match[^<]+/i,
        /Merchant is unable to receive[^<]+/i,
        /Invalid merchant[^<]+/i,
        /Merchant key invalid[^<]+/i,
      ];

      let errorMessage = null;
      for (const pattern of errorPatterns) {
        const match = responseText.match(pattern);
        if (match && (match[1] || match[0])) {
          errorMessage = (match[1] || match[0]).trim();
          break;
        }
      }

      if (errorMessage) {
        console.error("\n❌ PayFast Error Message:", errorMessage);
      } else {
        console.log("\nResponse body (first 1000 chars):");
        console.log(responseText.substring(0, 1000));

        // Try to extract text content
        const textContent = responseText
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (textContent) {
          console.log("\nText content:", textContent.substring(0, 500));
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Test complete!");
    console.log("\nIf you see a 400 error, common causes:");
    console.log("1. Wrong merchant credentials for sandbox");
    console.log("2. Invalid signature");
    console.log("3. Missing required fields");
    console.log("4. Using production credentials with sandbox URL");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("Make sure your dev server is running on", API_BASE_URL);
    }
  }
}

testFullPaymentFlow();

 * This will show you exactly what's being sent and what PayFast returns
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnvFile();

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const PAYFAST_URL =
  process.env.NEXT_PUBLIC_PAYFAST_URL ||
  "https://sandbox.payfast.co.za/eng/process";

console.log("\n🧪 Testing FULL PayFast Payment Flow\n");
console.log("=".repeat(60));

async function testFullPaymentFlow() {
  try {
    // Step 1: Get payment data from your API
    console.log("\n1️⃣ Getting payment data from API...");
    const paymentData = {
      amount: "1.00",
      item_name: "Test Payment",
      item_description: "Full flow test",
      email_address: "test@example.com",
    };

    const response = await fetch(
      `${API_BASE_URL}/api/payments/payfast/initiate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ API Error:", error);
      return;
    }

    const data = await response.json();
    console.log("✓ Payment data received");
    console.log("Payment URL:", data.payment_url);

    // Check if using sandbox
    if (!data.payment_url.includes("sandbox")) {
      console.error("\n❌ ERROR: Using PRODUCTION URL!");
      console.error("Expected: https://sandbox.payfast.co.za/eng/process");
      console.error("Got:", data.payment_url);
      console.error("\nFix: Restart your dev server to load .env.local");
      return;
    }

    console.log("✓ Using SANDBOX URL - Good!");

    // Step 2: Show what will be sent to PayFast
    console.log("\n2️⃣ Payment data that will be sent to PayFast:");
    console.log(JSON.stringify(data.payment_data, null, 2));

    // Step 3: Create form data
    const formData = new URLSearchParams();
    Object.keys(data.payment_data).forEach((key) => {
      formData.append(key, String(data.payment_data[key]));
    });

    console.log("\n3️⃣ Form data (URL encoded):");
    console.log(formData.toString());

    // Step 4: Submit to PayFast
    console.log("\n4️⃣ Submitting to PayFast...");
    console.log("URL:", data.payment_url);

    const payfastResponse = await fetch(data.payment_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      redirect: "manual", // Don't follow redirects
    });

    console.log("\n5️⃣ PayFast Response:");
    console.log("Status:", payfastResponse.status);
    console.log("Status Text:", payfastResponse.statusText);
    console.log(
      "Headers:",
      Object.fromEntries(payfastResponse.headers.entries())
    );

    const responseText = await payfastResponse.text();

    if (payfastResponse.status === 302 || payfastResponse.status === 200) {
      console.log("\n✓ PayFast accepted the request!");
      const location = payfastResponse.headers.get("location");
      if (location) {
        console.log("Redirect to:", location);
      }
    } else {
      console.error(
        "\n❌ PayFast returned error status:",
        payfastResponse.status
      );
      console.log("Response body length:", responseText.length);

      // Try multiple patterns to extract error message
      const errorPatterns = [
        /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
        /<title>([^<]+)<\/title>/i,
        /Error[:\s]+([^<\n]+)/i,
        /<p[^>]*class="[^"]*error[^"]*"[^>]*>([^<]+)<\/p>/i,
        /<div[^>]*class="[^"]*error[^"]*"[^>]*>([^<]+)<\/div>/i,
        /Unfortunately[^<]+/i,
        /could not process[^<]+/i,
        /Generated signature does not match[^<]+/i,
        /Merchant is unable to receive[^<]+/i,
        /Invalid merchant[^<]+/i,
        /Merchant key invalid[^<]+/i,
      ];

      let errorMessage = null;
      for (const pattern of errorPatterns) {
        const match = responseText.match(pattern);
        if (match && (match[1] || match[0])) {
          errorMessage = (match[1] || match[0]).trim();
          break;
        }
      }

      if (errorMessage) {
        console.error("\n❌ PayFast Error Message:", errorMessage);
      } else {
        console.log("\nResponse body (first 1000 chars):");
        console.log(responseText.substring(0, 1000));

        // Try to extract text content
        const textContent = responseText
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (textContent) {
          console.log("\nText content:", textContent.substring(0, 500));
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Test complete!");
    console.log("\nIf you see a 400 error, common causes:");
    console.log("1. Wrong merchant credentials for sandbox");
    console.log("2. Invalid signature");
    console.log("3. Missing required fields");
    console.log("4. Using production credentials with sandbox URL");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("Make sure your dev server is running on", API_BASE_URL);
    }
  }
}

testFullPaymentFlow();
