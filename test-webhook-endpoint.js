const https = require("https");
const http = require("http");

async function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: "GET",
      headers: {
        "User-Agent": "PayFast-Webhook-Test",
      },
    };

    const req = client.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

async function testWebhookEndpoints() {
  console.log("=".repeat(80));
  console.log("Testing Webhook Endpoints");
  console.log("=".repeat(80));
  console.log("");

  // Test 1: Check if notify endpoint is accessible
  console.log("1. Testing /payment/notify endpoint...");
  try {
    const notifyResult = await testEndpoint(
      "https://www.trevnoctilla.com/payment/notify"
    );
    console.log(`   Status: ${notifyResult.status}`);
    console.log(`   Response: ${notifyResult.body.substring(0, 200)}`);
    console.log(`   ✅ Endpoint is accessible`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  // Test 2: Check debug API for last ITN attempt
  console.log("2. Checking debug API for last ITN attempt...");
  try {
    const debugResult = await testEndpoint(
      "https://www.trevnoctilla.com/api/payments/debug"
    );
    const debugData = JSON.parse(debugResult.body);
    console.log(`   Status: ${debugResult.status}`);
    if (debugData.lastITN) {
      console.log(`   ✅ Last ITN attempt found:`);
      console.log(`      Timestamp: ${debugData.lastITN.timestamp}`);
      console.log(`      Status: ${debugData.lastITN.status}`);
      console.log(`      Request ID: ${debugData.lastITN.requestId}`);
      console.log(
        `      Payment Status: ${
          debugData.lastITN.data?.payment_status || "N/A"
        }`
      );
      if (debugData.lastITN.errors.length > 0) {
        console.log(`      ❌ Errors: ${debugData.lastITN.errors.join(", ")}`);
      } else {
        console.log(`      ✅ No errors`);
      }
    } else {
      console.log(`   ⚠️  No ITN attempts recorded yet`);
      console.log(
        `   This means PayFast has not sent any webhooks to the endpoint`
      );
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  // Test 3: Check if endpoint responds to POST (simulate PayFast)
  console.log("3. Testing POST to /payment/notify (simulating PayFast)...");
  try {
    const postResult = await new Promise((resolve, reject) => {
      const urlObj = new URL("https://www.trevnoctilla.com/payment/notify");
      const postData = "test=1&merchant_id=test&merchant_key=test";

      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(postData),
          "User-Agent": "PayFast",
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body: data,
          });
        });
      });

      req.on("error", reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.write(postData);
      req.end();
    });

    console.log(`   Status: ${postResult.status}`);
    console.log(`   Response: ${postResult.body.substring(0, 200)}`);
    if (postResult.status === 200) {
      console.log(`   ✅ Endpoint accepts POST requests`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  console.log("=".repeat(80));
  console.log("Summary:");
  console.log("=".repeat(80));
  console.log(
    "1. If endpoint is accessible: ✅ PayFast can reach your webhook URL"
  );
  console.log(
    "2. If no ITN attempts found: ⚠️  PayFast has not sent webhooks yet"
  );
  console.log("3. If ITN attempts found: Check status and errors above");
  console.log("=".repeat(80));
}

testWebhookEndpoints().catch(console.error);
