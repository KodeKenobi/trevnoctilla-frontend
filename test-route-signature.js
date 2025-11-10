/**
 * Test the actual API route signature generation
 * This verifies the TypeScript implementation in route.ts
 */

const http = require("http");

function testAPIRoute() {
  return new Promise((resolve, reject) => {
    const testData = {
      amount: "20.00",
      item_name: "Test Payment",
      item_description: "Testing signature generation",
    };

    const postData = JSON.stringify(testData);

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/payments/payfast/initiate",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          resolve({ result, statusCode: res.statusCode });
        } catch (error) {
          reject(
            new Error(
              `Failed to parse response: ${error.message}\nResponse: ${data}`
            )
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout - is the server running?"));
    });

    req.write(postData);
    req.end();
  });
}

console.log("=".repeat(80));
console.log("Testing API Route Signature Generation");
console.log("=".repeat(80));
console.log(
  "\n⚠️  Make sure the Next.js dev server is running on localhost:3000"
);
console.log("   Run: npm run dev\n");

testAPIRoute()
  .then(({ result, statusCode }) => {
    if (statusCode !== 200) {
      console.error(`\n❌ API returned status ${statusCode}`);
      console.error("Response:", JSON.stringify(result, null, 2));
      process.exit(1);
    }

    if (!result.success) {
      console.error("\n❌ API request failed:", result.error);
      process.exit(1);
    }

    const paymentData = result.payment_data;
    const signature = paymentData.signature;

    console.log("\n✅ API Route Test Results:");
    console.log(`  Status Code: ${statusCode}`);
    console.log(`  Signature: ${signature}`);
    console.log(`  Signature Length: ${signature.length} (expected: 32)`);
    console.log(
      `  Signature Format: ${
        /^[a-f0-9]{32}$/.test(signature) ? "Valid MD5" : "Invalid"
      }`
    );

    console.log("\n📋 Payment Data Fields:");
    Object.keys(paymentData).forEach((key) => {
      if (key !== "signature") {
        console.log(`  ${key}: ${paymentData[key]}`);
      }
    });

    // Verify signature is present and valid
    if (
      !signature ||
      signature.length !== 32 ||
      !/^[a-f0-9]{32}$/.test(signature)
    ) {
      console.error("\n❌ Invalid signature format!");
      process.exit(1);
    }

    console.log("\n✅ API Route Signature Generation: PASSED");
    console.log("\n" + "=".repeat(80));
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error.message);
    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("timeout")
    ) {
      console.log("\n💡 Make sure the Next.js dev server is running:");
      console.log("   npm run dev");
    }
    process.exit(1);
  });
