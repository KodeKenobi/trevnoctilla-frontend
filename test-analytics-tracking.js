const puppeteer = require("puppeteer");

async function testAnalyticsTracking() {
  console.log("🚀 Starting analytics tracking test...\n");

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Enable console logging to see what's happening
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("analytics") ||
        text.includes("Analytics") ||
        text.includes("track")
      ) {
        console.log("📊 Console:", text);
      }
    });

    // Monitor network requests to see if analytics API calls are being made
    const analyticsRequests = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/api/analytics/")) {
        analyticsRequests.push({
          url: url,
          method: request.method(),
          timestamp: new Date().toISOString(),
        });
        console.log("✅ Analytics API Request:", request.method(), url);
      }
    });

    // Monitor responses to see if they're successful
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/api/analytics/")) {
        console.log("📥 Analytics API Response:", response.status(), url);
      }
    });

    console.log("🌐 Navigating to website...");
    await page.goto("https://www.trevnoctilla.com", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("✅ Page loaded. Waiting for analytics to initialize...");
    await page.waitForTimeout(3000);

    // Check if WebsiteTracker is loaded
    const trackerExists = await page.evaluate(() => {
      // Check if internalAnalytics exists
      return (
        typeof window !== "undefined" &&
        (window.internalAnalytics !== undefined ||
          document.querySelector("[data-analytics]") !== null)
      );
    });

    console.log("🔍 Tracker exists:", trackerExists);

    // Try to interact with the page to trigger events
    console.log("🖱️  Simulating user interactions...");

    // Scroll the page
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(1000);

    // Try to click a button or link
    try {
      const clickableElement = await page.$("a, button");
      if (clickableElement) {
        await clickableElement.click();
        await page.waitForTimeout(1000);
        console.log("✅ Clicked an element");
      }
    } catch (e) {
      console.log("⚠️  Could not click element:", e.message);
    }

    // Check what analytics events were queued
    const analyticsState = await page.evaluate(() => {
      if (typeof window !== "undefined" && window.internalAnalytics) {
        return {
          sessionId: window.internalAnalytics.sessionId,
          isInitialized: window.internalAnalytics.isInitialized,
          eventQueueLength: window.internalAnalytics.eventQueue
            ? window.internalAnalytics.eventQueue.length
            : 0,
        };
      }
      return null;
    });

    console.log("📊 Analytics State:", JSON.stringify(analyticsState, null, 2));

    // Wait for analytics to flush (30 seconds or manual flush)
    console.log("⏳ Waiting for analytics to be sent (10 seconds)...");
    await page.waitForTimeout(10000);

    // Check network requests again
    console.log("\n📈 Analytics API Requests Made:", analyticsRequests.length);
    analyticsRequests.forEach((req, idx) => {
      console.log(`  ${idx + 1}. ${req.method} ${req.url} at ${req.timestamp}`);
    });

    // Take a screenshot
    await page.screenshot({
      path: "analytics-test-screenshot.png",
      fullPage: true,
    });
    console.log("📸 Screenshot saved: analytics-test-screenshot.png");

    // Now check the backend to see if events were stored
    console.log("\n🔍 Checking backend for stored events...");

    // You'll need to check your backend API or database directly
    // For now, we'll just report what we saw in the network requests

    if (analyticsRequests.length === 0) {
      console.log("\n❌ PROBLEM: No analytics API requests were made!");
      console.log("   This means the frontend is not sending analytics data.");
      console.log("   Possible causes:");
      console.log("   1. WebsiteTracker component is not loading");
      console.log("   2. internalAnalytics is not initialized");
      console.log("   3. Events are being blocked or filtered out");
      console.log("   4. Network requests are failing silently");
    } else {
      console.log("\n✅ Analytics requests were made!");
      console.log(
        "   Check your backend database to see if events were stored."
      );
    }

    console.log("\n✅ Test completed. Browser will stay open for 5 seconds...");
    await page.waitForTimeout(5000);
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await browser.close();
  }
}

testAnalyticsTracking().catch(console.error);
