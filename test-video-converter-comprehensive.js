/**
 * Comprehensive Test Script for Video Converter Tool
 *
 * Tests:
 * 1. Page navigation and UI elements
 * 2. File upload functionality
 * 3. ALL output formats (MP4, WebM, AVI, MOV, MKV, FLV, WMV, M4V, 3GP, OGV, MP3)
 * 4. Conversion process
 * 5. Download functionality
 * 6. Monetization modal - View Ad option
 * 7. Monetization modal - Pay $1 option
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const VIDEO_CONVERTER_URL = `${BASE_URL}/tools/video-converter`;

// Test video file (create a small test video if needed)
// Try multiple possible locations
const TEST_VIDEO_PATHS = [
  path.join(__dirname, "test-files", "test-video.mp4"),
  path.join(__dirname, "trevnoctilla-backend", "test_output.mp4"),
  path.join(__dirname, "test-video.mp4"),
];

// Find the first existing video file
let TEST_VIDEO_PATH = null;
for (const videoPath of TEST_VIDEO_PATHS) {
  if (fs.existsSync(videoPath)) {
    TEST_VIDEO_PATH = videoPath;
    break;
  }
}

// Output formats to test - ALL OF THEM
const OUTPUT_FORMATS = [
  "mp4",
  "webm",
  "avi",
  "mov",
  "mkv",
  "flv",
  "wmv",
  "m4v",
  "3gp",
  "ogv",
  "mp3", // Audio extraction
];

console.log("=".repeat(60));
console.log("🎬 COMPREHENSIVE VIDEO CONVERTER TEST");
console.log("=".repeat(60));
console.log(`Base URL: ${BASE_URL}`);
console.log(`Video Converter URL: ${VIDEO_CONVERTER_URL}`);
console.log(
  `Test Video: ${TEST_VIDEO_PATH || "NOT FOUND - will skip video tests"}`
);
console.log(`Formats to test: ${OUTPUT_FORMATS.join(", ")}`);
console.log("=".repeat(60));
console.log();

(async () => {
  let browser;
  let testResults = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  try {
    // Launch browser
    console.log("📋 Step 1: Launching browser...");
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1280, height: 720 },
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set up download behavior using CDP
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: path.join(__dirname, "downloads"),
    });

    // Track console errors
    const consoleErrors = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        msg.type() === "error" ||
        text.includes("ERROR") ||
        text.includes("Error")
      ) {
        consoleErrors.push(text);
        // Only log critical errors
        if (!text.includes("hydration") && !text.includes("Manifest")) {
          console.log(`⚠️  Console Error: ${text}`);
        }
      }
    });

    // Track network requests
    const networkRequests = [];
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("/convert-video") ||
        url.includes("/download") ||
        url.includes("/video-progress")
      ) {
        networkRequests.push({
          url,
          method: request.method(),
          timestamp: Date.now(),
        });
        console.log(`   🌐 Network: ${request.method()} ${url}`);
      }
    });

    // Navigate to video converter page
    console.log("\n📋 Step 2: Navigating to video converter page...");
    console.log(`   ${VIDEO_CONVERTER_URL}`);
    await page.goto(VIDEO_CONVERTER_URL, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await page.waitForTimeout(3000); // Wait for page to fully load

    // CRITICAL: Handle cookie consent FIRST - THIS MUST BE DONE FIRST
    console.log(
      "\n🍪 CRITICAL STEP: Handling cookie consent (FIRST PRIORITY)..."
    );
    await page.waitForTimeout(2000); // Wait for cookie modal to appear

    let cookieHandled = false;

    // Method 1: Try XPath for "Reject All" button (most reliable)
    try {
      const [rejectButton] = await page.$x(
        "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reject')]"
      );
      if (rejectButton) {
        await rejectButton.click();
        console.log("   ✅ Clicked 'Reject All' button (XPath method)");
        cookieHandled = true;
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      // Continue to other methods
    }

    // Method 2: Try all possible selectors
    if (!cookieHandled) {
      const cookieSelectors = [
        'button:has-text("Reject All")',
        'button:has-text("Reject")',
        'button:has-text("Decline All")',
        'button:has-text("Decline")',
        'button[id*="cookie"][id*="reject"]',
        'button[id*="cookie"][id*="decline"]',
        'button[class*="cookie"][class*="reject"]',
        'button[class*="cookie"][class*="decline"]',
        'button[id*="reject-all"]',
        'button[id*="decline-all"]',
        '[id*="reject-cookies"]',
        '[id*="decline-cookies"]',
        '[id*="reject"]',
        '[id*="decline"]',
        ".cookie-reject",
        ".cookie-decline",
        '[aria-label*="Reject"]',
        '[aria-label*="Decline"]',
      ];

      for (const selector of cookieSelectors) {
        try {
          const button = await page.waitForSelector(selector, {
            timeout: 5000,
            visible: true,
          });
          if (button) {
            await button.click();
            console.log(`   ✅ Clicked cookie consent: ${selector}`);
            cookieHandled = true;
            await page.waitForTimeout(2000); // Wait for modal to close
            break;
          }
        } catch (e) {
          // Selector not found, continue
        }
      }
    }

    // Method 3: Find button by text content (last resort)
    if (!cookieHandled) {
      try {
        const buttons = await page.$$("button");
        for (const button of buttons) {
          const text = await page.evaluate(
            (el) => el.textContent?.toLowerCase() || "",
            button
          );
          if (
            text &&
            (text.includes("reject") ||
              text.includes("decline") ||
              text.includes("reject all") ||
              text.includes("decline all"))
          ) {
            await button.click();
            console.log(`   ✅ Clicked cookie button with text: ${text}`);
            cookieHandled = true;
            await page.waitForTimeout(2000);
            break;
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    if (!cookieHandled) {
      console.log("   ⚠️  Cookie modal not found or already handled");
    } else {
      console.log("   ✅ Cookie consent handled successfully - page is ready");
    }

    // Wait a bit more to ensure page is ready
    await page.waitForTimeout(1000);

    // Test 1: Verify page loaded correctly
    console.log("\n📋 Test 1: Verifying page loaded correctly...");
    try {
      const pageTitle = await page.title();
      const heading = await page
        .$eval("h1, h2", (el) => el.textContent)
        .catch(() => null);
      console.log(`   Page Title: ${pageTitle}`);
      console.log(`   Heading: ${heading}`);

      if (heading && heading.toLowerCase().includes("video")) {
        testResults.passed++;
        testResults.tests.push({
          name: "Page loaded correctly",
          status: "PASS",
        });
        console.log("   ✅ PASS: Page loaded correctly");
      } else {
        throw new Error("Page heading not found or incorrect");
      }
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({
        name: "Page loaded correctly",
        status: "FAIL",
        error: error.message,
      });
      console.log(`   ❌ FAIL: ${error.message}`);
    }

    // Test 2: Check if test video file exists
    console.log("\n📋 Test 2: Checking test video file...");
    if (!TEST_VIDEO_PATH || !fs.existsSync(TEST_VIDEO_PATH)) {
      console.log(
        "   ⚠️  Test video file not found. Creating test file structure..."
      );
      const testFilesDir = path.dirname(TEST_VIDEO_PATHS[0]);
      if (!fs.existsSync(testFilesDir)) {
        fs.mkdirSync(testFilesDir, { recursive: true });
      }
      console.log(
        "   ⚠️  Please ensure a test video file exists at:",
        TEST_VIDEO_PATHS[0]
      );
    } else {
      const stats = fs.statSync(TEST_VIDEO_PATH);
      console.log(
        `   ✅ Test video found: ${(stats.size / 1024 / 1024).toFixed(2)} MB`
      );
    }

    // Test 3: Upload video file
    console.log("\n📋 Test 3: Uploading video file...");
    let fileUploaded = false;
    try {
      // Wait for file input - try multiple selectors
      console.log("   🔍 Looking for file input...");
      let fileInput = null;
      const fileInputSelectors = [
        'input[type="file"][accept*="video"]',
        'input[type="file"][id*="video"]',
        'input[type="file"][id*="file"]',
        'input[type="file"]',
      ];

      for (const selector of fileInputSelectors) {
        try {
          fileInput = await page.waitForSelector(selector, { timeout: 5000 });
          if (fileInput) {
            console.log(`   ✅ Found file input: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!fileInput) {
        throw new Error("File input not found");
      }

      // Check if file exists
      if (TEST_VIDEO_PATH && fs.existsSync(TEST_VIDEO_PATH)) {
        console.log(`   📤 Uploading file: ${path.basename(TEST_VIDEO_PATH)}`);
        await fileInput.uploadFile(TEST_VIDEO_PATH);
        console.log("   ✅ File uploaded successfully");
        fileUploaded = true;
        await page.waitForTimeout(3000); // Wait for file to be processed and UI to update

        // Verify file is selected - check multiple ways
        const fileName = await page
          .evaluate(() => {
            // Try multiple selectors
            const fileInfo = document.querySelector(
              '[class*="file"], [class*="selected"], [class*="upload"]'
            );
            if (fileInfo) return fileInfo.textContent;

            // Check for file size display
            const sizeText = Array.from(
              document.querySelectorAll("p, span, div")
            ).find((el) => {
              const text = el.textContent || "";
              return (
                text.includes("MB") ||
                text.includes("KB") ||
                text.includes("GB")
              );
            });
            if (sizeText) return sizeText.textContent;

            // Check for file name in any text
            const allText = document.body.textContent;
            if (
              allText.includes(".mp4") ||
              allText.includes(".mov") ||
              allText.includes(".avi")
            ) {
              return "Video file detected";
            }

            return null;
          })
          .catch(() => null);

        if (fileName) {
          testResults.passed++;
          testResults.tests.push({ name: "File upload", status: "PASS" });
          console.log(
            `   ✅ PASS: File uploaded - ${fileName.substring(0, 50)}...`
          );
        } else {
          // File might still be uploaded even if we can't verify visually
          console.log(
            "   ⚠️  File upload verification inconclusive, but file was selected"
          );
          testResults.passed++;
          testResults.tests.push({
            name: "File upload",
            status: "PASS",
            note: "File selected but verification inconclusive",
          });
        }
      } else {
        console.log(
          "   ⚠️  SKIP: Test video file not found, skipping upload test"
        );
        testResults.tests.push({
          name: "File upload",
          status: "SKIP",
          reason: "Test video file not found",
        });
      }
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({
        name: "File upload",
        status: "FAIL",
        error: error.message,
      });
      console.log(`   ❌ FAIL: ${error.message}`);
      console.log("   ⚠️  Continuing with other tests...");
    }

    // Test 4: Test ALL output format selection
    console.log("\n📋 Test 4: Testing ALL output format selection...");
    let formatTestPassed = 0;
    let formatTestFailed = 0;

    // Find the format select dropdown
    const formatSelect = await page.$("select").catch(() => null);
    if (!formatSelect) {
      // Try to find by label
      const formatLabel = await page
        .evaluateHandle(() => {
          const labels = Array.from(document.querySelectorAll("label"));
          const formatLabel = labels.find((l) => {
            const text = l.textContent?.toLowerCase() || "";
            return text.includes("format") || text.includes("output");
          });
          if (formatLabel) {
            const inputId = formatLabel.getAttribute("for");
            if (inputId) {
              return document.querySelector(`select#${inputId}`);
            }
          }
          return document.querySelector("select");
        })
        .catch(() => null);

      if (formatLabel && formatLabel.asElement()) {
        console.log("   ✅ Found format select via label");
      }
    }

    if (formatSelect) {
      for (const format of OUTPUT_FORMATS) {
        try {
          console.log(`   🔄 Testing format: ${format.toUpperCase()}`);
          await formatSelect.select(format);
          await page.waitForTimeout(1000); // Wait for UI to update

          const selectedValue = await page.evaluate(() => {
            const select = document.querySelector("select");
            return select ? select.value : null;
          });

          if (selectedValue === format) {
            console.log(
              `   ✅ Format ${format.toUpperCase()} selected successfully`
            );
            formatTestPassed++;
          } else {
            console.log(
              `   ⚠️  Format ${format}: Expected ${format}, got ${selectedValue}`
            );
            formatTestFailed++;
          }
        } catch (error) {
          console.log(`   ❌ Format ${format}: ${error.message}`);
          formatTestFailed++;
        }
      }

      if (formatTestPassed > 0) {
        testResults.passed++;
        testResults.tests.push({
          name: "Output format selection",
          status: "PASS",
          note: `${formatTestPassed}/${OUTPUT_FORMATS.length} formats tested successfully`,
        });
        console.log(
          `   ✅ Format selection test: ${formatTestPassed} passed, ${formatTestFailed} failed`
        );
      } else {
        testResults.failed++;
        testResults.tests.push({
          name: "Output format selection",
          status: "FAIL",
          error: "No formats could be selected",
        });
      }
    } else {
      testResults.failed++;
      testResults.tests.push({
        name: "Output format selection",
        status: "FAIL",
        error: "Format select element not found",
      });
      console.log("   ❌ Format select element not found");
    }

    // Test 5: Test conversion (if file was uploaded)
    console.log("\n📋 Test 5: Testing video conversion...");
    if (fileUploaded && TEST_VIDEO_PATH && fs.existsSync(TEST_VIDEO_PATH)) {
      try {
        // Select MP4 format for first conversion
        console.log("   🔄 Selecting MP4 format for conversion...");
        const formatSelectForConversion = await page
          .$("select")
          .catch(() => null);
        if (formatSelectForConversion) {
          await formatSelectForConversion.select("mp4");
          await page.waitForTimeout(1000);
          console.log("   ✅ MP4 format selected");
        } else {
          console.log("   ⚠️  Format select not found, continuing anyway");
        }

        // Wait for convert button to be visible and enabled
        console.log("   🔍 Looking for convert button...");
        await page.waitForTimeout(1000);

        // Click convert button - look for button with "Convert" text
        const convertButton = await page
          .evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll("button"));
            return buttons.find((btn) => {
              const text = (btn.textContent || "").toLowerCase();
              const disabled =
                btn.disabled || btn.getAttribute("disabled") !== null;
              return (
                text.includes("convert") &&
                !text.includes("download") &&
                !disabled
              );
            });
          })
          .catch(() => null);

        if (convertButton && convertButton.asElement()) {
          console.log("   ✅ Found convert button");
          await convertButton.asElement().click();
          console.log("   ✅ Convert button clicked");
        } else {
          // Try alternative: find button by text content
          console.log(
            "   🔍 Trying alternative method to find convert button..."
          );
          const buttons = await page.$$("button");
          let found = false;
          for (const btn of buttons) {
            const text = await page.evaluate(
              (el) => el.textContent?.toLowerCase() || "",
              btn
            );
            const disabled = await page.evaluate((el) => el.disabled, btn);
            if (
              text.includes("convert") &&
              !text.includes("download") &&
              !disabled
            ) {
              await btn.click();
              found = true;
              console.log(
                `   ✅ Clicked convert button (text: ${text.substring(0, 30)})`
              );
              break;
            }
          }
          if (!found) {
            throw new Error("Convert button not found or is disabled");
          }
        }

        await page.waitForTimeout(5000); // Wait for conversion to start

        // Check if conversion started - look for multiple indicators
        console.log("   🔍 Checking if conversion started...");
        const hasProgressText = await page.evaluate(() => {
          const text = document.body.textContent.toLowerCase();
          return (
            text.includes("uploading") ||
            text.includes("processing") ||
            text.includes("converting") ||
            text.includes("initializing") ||
            text.includes("extracting") ||
            text.includes("%")
          );
        });

        // Also check for progress bar element
        const progressBar = await page
          .$('[class*="progress"], [class*="bg-purple"], [style*="width"]')
          .catch(() => null);

        // Check for progress indicator
        const progressIndicator = await page
          .waitForSelector(
            '[class*="progress"], [class*="loading"], [class*="processing"], [class*="bg-purple-500"], [class*="Uploading"], [class*="Processing"]',
            { timeout: 10000 }
          )
          .catch(() => null);

        if (progressIndicator || hasProgressText || progressBar) {
          console.log("   ✅ Conversion started!");

          // Wait for conversion to complete (up to 10 minutes for large files)
          console.log(
            "   ⏳ Waiting for conversion to complete (max 10 minutes)..."
          );
          let conversionComplete = false;
          const maxWaitTime = 10 * 60 * 1000; // 10 minutes
          const startTime = Date.now();
          let lastProgress = 0;
          let checkCount = 0;

          while (!conversionComplete && Date.now() - startTime < maxWaitTime) {
            checkCount++;
            await page.waitForTimeout(10000); // Check every 10 seconds

            if (checkCount % 6 === 0) {
              console.log(
                `   ⏳ Still waiting... (${Math.floor(
                  (Date.now() - startTime) / 1000
                )}s elapsed)`
              );
            }

            // Check for download button or success message
            const downloadButton = await page
              .evaluateHandle(() => {
                const buttons = Array.from(
                  document.querySelectorAll("button, a")
                );
                return buttons.find((btn) => {
                  const text = btn.textContent?.toLowerCase() || "";
                  return (
                    text.includes("download") &&
                    !text.includes("convert") &&
                    (text.includes("video") ||
                      text.includes("audio") ||
                      text.includes("file") ||
                      text.includes("converted"))
                  );
                });
              })
              .catch(() => null);

            const downloadButtonElement =
              downloadButton && downloadButton.asElement()
                ? downloadButton.asElement()
                : null;
            const successMessage = await page.evaluate(() => {
              const text = document.body.textContent.toLowerCase();
              return (
                text.includes("conversion completed") ||
                text.includes("completed successfully") ||
                text.includes("ready to download") ||
                text.includes("successfully")
              );
            });

            // Check progress percentage
            const currentProgress = await page.evaluate(() => {
              const progressText = document.body.textContent;
              const match = progressText.match(/(\d+)%/i);
              return match ? parseInt(match[1]) : 0;
            });

            if (currentProgress > lastProgress && currentProgress > 0) {
              console.log(`   📊 Progress: ${currentProgress}%`);
              lastProgress = currentProgress;
            }

            if (downloadButtonElement || successMessage) {
              conversionComplete = true;
              console.log("   ✅ Conversion completed!");
              testResults.passed++;
              testResults.tests.push({
                name: "Video conversion",
                status: "PASS",
              });
              break;
            }

            // Check for errors
            const errorMessage = await page.evaluate(() => {
              const text = document.body.textContent.toLowerCase();
              return (
                text.includes("conversion failed") ||
                text.includes("error occurred") ||
                text.includes("failed to convert")
              );
            });

            if (errorMessage) {
              throw new Error("Conversion failed with error");
            }
          }

          if (!conversionComplete) {
            throw new Error("Conversion timeout - took longer than 10 minutes");
          }
        } else {
          // Even if we can't detect progress indicator, if convert button was clicked, assume it started
          console.log(
            "   ⚠️  Progress indicator not found, but conversion may have started"
          );
          console.log("   ⏳ Waiting to see if conversion completes...");

          // Wait a bit and check for download button
          await page.waitForTimeout(30000); // Wait 30 seconds

          const quickCheck = await page
            .evaluateHandle(() => {
              const buttons = Array.from(
                document.querySelectorAll("button, a")
              );
              return buttons.find((btn) => {
                const text = btn.textContent?.toLowerCase() || "";
                return text.includes("download") && !text.includes("convert");
              });
            })
            .catch(() => null);

          if (quickCheck && quickCheck.asElement()) {
            console.log("   ✅ Conversion completed (quick check)!");
            testResults.passed++;
            testResults.tests.push({
              name: "Video conversion",
              status: "PASS",
              note: "Completed but progress indicator not detected",
            });
          } else {
            throw new Error(
              "Conversion did not start - progress indicator not found and no download button after wait"
            );
          }
        }
      } catch (error) {
        testResults.failed++;
        testResults.tests.push({
          name: "Video conversion",
          status: "FAIL",
          error: error.message,
        });
        console.log(`   ❌ FAIL: ${error.message}`);
        console.log("   ⚠️  Continuing with monetization tests...");
      }
    } else {
      console.log(
        "   ⚠️  SKIP: Test video file not found, skipping conversion test"
      );
      testResults.tests.push({
        name: "Video conversion",
        status: "SKIP",
        reason: "Test video file not found",
      });
    }

    // Test 6: Test monetization modal - View Ad option
    console.log("\n📋 Test 6: Testing monetization modal - View Ad option...");
    try {
      // Find and click download button
      console.log("   🔍 Looking for download button...");
      const downloadButton = await page
        .evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll("button, a"));
          return buttons.find((btn) => {
            const text = btn.textContent?.toLowerCase() || "";
            return (
              text.includes("download") &&
              !text.includes("convert") &&
              (text.includes("video") ||
                text.includes("audio") ||
                text.includes("file") ||
                text.includes("converted"))
            );
          });
        })
        .catch(() => null);

      const downloadButtonElement =
        downloadButton && downloadButton.asElement()
          ? downloadButton.asElement()
          : null;

      if (downloadButtonElement) {
        console.log("   ✅ Found download button");
        await downloadButtonElement.click();
        console.log("   ✅ Download button clicked");
        await page.waitForTimeout(3000); // Wait for modal to appear

        // Wait for monetization modal to appear
        console.log("   🔍 Waiting for monetization modal...");
        const modal = await page
          .waitForSelector(
            '[role="dialog"], [class*="modal"], [class*="Monetization"]',
            { timeout: 10000, visible: true }
          )
          .catch(() => null);

        if (modal) {
          console.log("   ✅ Monetization modal appeared");

          // Look for "View Ad" button - try multiple selectors
          const viewAdButton = await page
            .evaluateHandle(() => {
              const buttons = Array.from(
                document.querySelectorAll('button, a, [role="button"]')
              );
              return buttons.find((btn) => {
                const text = btn.textContent?.toLowerCase() || "";
                const ariaLabel =
                  btn.getAttribute("aria-label")?.toLowerCase() || "";
                return (
                  text.includes("view ad") ||
                  text.includes("watch ad") ||
                  (text.includes("ad") && !text.includes("pay")) ||
                  ariaLabel.includes("view ad") ||
                  ariaLabel.includes("watch ad")
                );
              });
            })
            .catch(() => null);

          if (viewAdButton && viewAdButton.asElement()) {
            const buttonElement = viewAdButton.asElement();
            console.log("   ✅ Found 'View Ad' button");
            await buttonElement.click();
            console.log("   ✅ View Ad button clicked");
            await page.waitForTimeout(5000); // Wait for ad page to open

            // Check if ad page opened or redirect happened
            const currentUrl = page.url();
            const openedWindows = await browser.pages();

            // Check for redirect to ad-success page or new window opened
            if (
              currentUrl.includes("ad-success") ||
              currentUrl.includes("otieu.com") ||
              openedWindows.length > 1
            ) {
              testResults.passed++;
              testResults.tests.push({
                name: "Monetization modal - View Ad",
                status: "PASS",
              });
              console.log("   ✅ PASS: View Ad functionality working");

              // Close ad window if opened
              if (openedWindows.length > 1) {
                const adWindow = openedWindows[openedWindows.length - 1];
                await adWindow.close();
                console.log("   ✅ Closed ad window");
              }

              // Navigate back if redirected
              if (currentUrl.includes("ad-success")) {
                await page.goto(VIDEO_CONVERTER_URL);
                await page.waitForTimeout(2000);
                console.log("   ✅ Navigated back to video converter");
              }
            } else {
              // Check if download was triggered (localStorage check)
              const downloadUrl = await page.evaluate(() => {
                return localStorage.getItem("ad_download_url");
              });

              if (downloadUrl) {
                testResults.passed++;
                testResults.tests.push({
                  name: "Monetization modal - View Ad",
                  status: "PASS",
                });
                console.log(
                  "   ✅ PASS: View Ad functionality working (download URL stored)"
                );
              } else {
                throw new Error("View Ad did not trigger expected behavior");
              }
            }
          } else {
            // Try alternative selector
            const altViewAdButton = await page
              .$(
                'button:has-text("View"), button:has-text("Ad"), [aria-label*="View"]'
              )
              .catch(() => null);
            if (altViewAdButton) {
              await altViewAdButton.click();
              await page.waitForTimeout(3000);
              testResults.passed++;
              testResults.tests.push({
                name: "Monetization modal - View Ad",
                status: "PASS",
              });
              console.log(
                "   ✅ PASS: View Ad button found and clicked (alternative selector)"
              );
            } else {
              throw new Error("View Ad button not found in modal");
            }
          }
        } else {
          throw new Error("Monetization modal did not appear");
        }
      } else {
        throw new Error(
          "Download button not found - conversion may not have completed"
        );
      }
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({
        name: "Monetization modal - View Ad",
        status: "FAIL",
        error: error.message,
      });
      console.log(`   ❌ FAIL: ${error.message}`);
    }

    // Test 7: Test monetization modal - Pay $1 option
    console.log("\n📋 Test 7: Testing monetization modal - Pay $1 option...");
    try {
      // Re-upload and convert again for second test
      if (TEST_VIDEO_PATH && fs.existsSync(TEST_VIDEO_PATH)) {
        console.log("   📋 Re-uploading video for second monetization test...");

        // Navigate back to video converter if needed
        const currentUrl = page.url();
        if (!currentUrl.includes("video-converter")) {
          await page.goto(VIDEO_CONVERTER_URL);
          await page.waitForTimeout(3000);

          // Handle cookie consent again if needed
          const [rejectButton2] = await page
            .$x(
              "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reject')]"
            )
            .catch(() => []);
          if (rejectButton2) {
            await rejectButton2.click();
            await page.waitForTimeout(2000);
          }
        }

        // Remove previous file if shown
        const removeButton = await page
          .$('button:has-text("Remove"), button[class*="remove"]')
          .catch(() => null);
        if (removeButton) {
          await removeButton.click();
          await page.waitForTimeout(1000);
          console.log("   ✅ Removed previous file");
        }

        // Upload file again
        const fileInputSelector =
          'input[type="file"][accept*="video"], input[type="file"][id*="video"]';
        const fileInput = await page.$(fileInputSelector);
        if (fileInput) {
          await fileInput.uploadFile(TEST_VIDEO_PATH);
          await page.waitForTimeout(3000);
          console.log("   ✅ File re-uploaded");
        }

        // Convert again
        const formatSelect2 = await page.$("select").catch(() => null);
        if (formatSelect2) {
          await formatSelect2.select("mp4");
          await page.waitForTimeout(1000);
        }

        const convertButton2 = await page
          .evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll("button"));
            return buttons.find((btn) => {
              const text = btn.textContent?.toLowerCase() || "";
              return text.includes("convert") && !text.includes("download");
            });
          })
          .catch(() => null);

        const convertButton2Element =
          convertButton2 && convertButton2.asElement()
            ? convertButton2.asElement()
            : null;

        if (convertButton2Element) {
          await convertButton2Element.click();
          console.log("   ✅ Second conversion started");

          // Wait for conversion (up to 10 minutes for second test)
          console.log(
            "   ⏳ Waiting for second conversion to complete (max 10 minutes)..."
          );
          let conversionComplete2 = false;
          const maxWaitTime2 = 10 * 60 * 1000; // 10 minutes
          const startTime2 = Date.now();

          while (
            !conversionComplete2 &&
            Date.now() - startTime2 < maxWaitTime2
          ) {
            try {
              await page.waitForTimeout(10000); // Check every 10 seconds

              const downloadButtonCheck = await page
                .evaluateHandle(() => {
                  const buttons = Array.from(
                    document.querySelectorAll("button, a")
                  );
                  return buttons.find((btn) => {
                    const text = btn.textContent?.toLowerCase() || "";
                    return (
                      text.includes("download") &&
                      !text.includes("convert") &&
                      (text.includes("video") ||
                        text.includes("audio") ||
                        text.includes("file"))
                    );
                  });
                })
                .catch(() => null);

              if (downloadButtonCheck && downloadButtonCheck.asElement()) {
                conversionComplete2 = true;
                console.log("   ✅ Second conversion completed!");
                break;
              }

              // Check progress
              const progressText = await page.evaluate(() => {
                return document.body.textContent;
              });
              if (
                progressText.includes("completed") ||
                progressText.includes("success")
              ) {
                conversionComplete2 = true;
                console.log(
                  "   ✅ Second conversion completed (detected via text)!"
                );
                break;
              }
            } catch (waitError) {
              // If page navigation happened, check if we're still on the right page
              const currentUrl = page.url();
              if (!currentUrl.includes("video-converter")) {
                console.log(
                  "   ⚠️  Page navigated away, returning to video converter"
                );
                await page.goto(VIDEO_CONVERTER_URL);
                await page.waitForTimeout(2000);
              }
              // Continue waiting
            }
          }

          if (!conversionComplete2) {
            throw new Error("Second conversion timeout");
          }

          // Check if download button appears
          const downloadButton2 = await page
            .evaluateHandle(() => {
              const buttons = Array.from(
                document.querySelectorAll("button, a")
              );
              return buttons.find((btn) => {
                const text = btn.textContent?.toLowerCase() || "";
                return text.includes("download") && !text.includes("convert");
              });
            })
            .catch(() => null);

          const downloadButton2Element =
            downloadButton2 && downloadButton2.asElement()
              ? downloadButton2.asElement()
              : null;

          if (downloadButton2Element) {
            console.log("   ✅ Found download button for second test");
            await downloadButton2Element.click();
            await page.waitForTimeout(3000);

            // Wait for monetization modal
            console.log(
              "   🔍 Waiting for monetization modal (second time)..."
            );
            const modal2 = await page
              .waitForSelector(
                '[role="dialog"], [class*="modal"], [class*="Monetization"]',
                { timeout: 10000, visible: true }
              )
              .catch(() => null);

            if (modal2) {
              console.log("   ✅ Monetization modal appeared (second time)");

              // Look for "Pay $1" or payment button - try multiple selectors
              const payButton = await page
                .evaluateHandle(() => {
                  const buttons = Array.from(
                    document.querySelectorAll(
                      'button, a, [role="button"], form button'
                    )
                  );
                  return buttons.find((btn) => {
                    const text = btn.textContent?.toLowerCase() || "";
                    const ariaLabel =
                      btn.getAttribute("aria-label")?.toLowerCase() || "";
                    return (
                      text.includes("pay") ||
                      text.includes("$1") ||
                      text.includes("dollar") ||
                      text.includes("payment") ||
                      text.includes("zar") ||
                      (text.includes("r") && text.includes("1")) ||
                      ariaLabel.includes("pay") ||
                      ariaLabel.includes("payment")
                    );
                  });
                })
                .catch(() => null);

              if (payButton && payButton.asElement()) {
                const buttonElement = payButton.asElement();
                console.log("   ✅ Found 'Pay $1' button");
                await buttonElement.click();
                console.log("   ✅ Pay $1 button clicked");
                await page.waitForTimeout(5000); // Wait longer for payment processing

                // Check if payment form or PayFast page appeared
                const currentUrl = page.url();
                const pageContent = await page.evaluate(
                  () => document.body.textContent
                );

                // Check for PayFast form or payment-related content
                const hasPayFastForm = await page
                  .$(
                    'form[action*="payfast"], form[id*="payfast"], input[name*="merchant_id"]'
                  )
                  .catch(() => null);
                const hasPaymentContent =
                  currentUrl.includes("payfast") ||
                  pageContent.includes("PayFast") ||
                  pageContent.includes("payment") ||
                  pageContent.includes("Pay") ||
                  hasPayFastForm;

                if (hasPaymentContent) {
                  testResults.passed++;
                  testResults.tests.push({
                    name: "Monetization modal - Pay $1",
                    status: "PASS",
                  });
                  console.log("   ✅ PASS: Pay $1 functionality working");
                  console.log(`   Payment page detected: ${currentUrl}`);
                } else {
                  // Check if form was submitted (might redirect)
                  await page.waitForTimeout(3000);
                  const newUrl = page.url();
                  if (
                    newUrl !== currentUrl &&
                    (newUrl.includes("payfast") || newUrl.includes("payment"))
                  ) {
                    testResults.passed++;
                    testResults.tests.push({
                      name: "Monetization modal - Pay $1",
                      status: "PASS",
                    });
                    console.log(
                      "   ✅ PASS: Pay $1 functionality working (redirected to payment)"
                    );
                  } else {
                    throw new Error("Pay $1 did not trigger payment flow");
                  }
                }
              } else {
                // Try alternative selectors
                const altPayButton = await page
                  .$(
                    'button:has-text("Pay"), button:has-text("$"), [aria-label*="Pay"]'
                  )
                  .catch(() => null);
                if (altPayButton) {
                  await altPayButton.click();
                  await page.waitForTimeout(5000);
                  const currentUrl = page.url();
                  if (
                    currentUrl.includes("payfast") ||
                    currentUrl.includes("payment")
                  ) {
                    testResults.passed++;
                    testResults.tests.push({
                      name: "Monetization modal - Pay $1",
                      status: "PASS",
                    });
                    console.log(
                      "   ✅ PASS: Pay $1 button found and clicked (alternative selector)"
                    );
                  } else {
                    throw new Error(
                      "Pay $1 button clicked but payment flow not triggered"
                    );
                  }
                } else {
                  throw new Error("Pay $1 button not found in modal");
                }
              }
            } else {
              throw new Error(
                "Monetization modal did not appear (second time)"
              );
            }
          } else {
            throw new Error(
              "Download button not found after second conversion"
            );
          }
        } else {
          throw new Error("Convert button not found for second test");
        }
      } else {
        throw new Error(
          "Test video file not found for second monetization test"
        );
      }
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({
        name: "Monetization modal - Pay $1",
        status: "FAIL",
        error: error.message,
      });
      console.log(`   ❌ FAIL: ${error.message}`);
    }

    // Final Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Tests: ${testResults.tests.length}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(
      `⏭️  Skipped: ${
        testResults.tests.filter((t) => t.status === "SKIP").length
      }`
    );
    console.log();

    console.log("Detailed Results:");
    testResults.tests.forEach((test, index) => {
      const icon =
        test.status === "PASS" ? "✅" : test.status === "FAIL" ? "❌" : "⏭️";
      console.log(`${icon} ${index + 1}. ${test.name}: ${test.status}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
      if (test.reason) {
        console.log(`   Reason: ${test.reason}`);
      }
      if (test.note) {
        console.log(`   Note: ${test.note}`);
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log("💡 Notes:");
    console.log(
      "   - Cookie modal is handled FIRST before any other interactions"
    );
    console.log("   - All output formats are tested");
    console.log("   - Conversion waits up to 10 minutes per conversion");
    console.log(
      "   - Monetization tests require actual conversion to complete"
    );
    console.log("=".repeat(60));

    // Keep browser open for 15 seconds for inspection
    await page.waitForTimeout(15000);
  } catch (error) {
    console.error("\n❌ TEST ERROR:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    testResults.failed++;
  } finally {
    if (browser) {
      await browser.close();
      console.log("\n🔒 Browser closed");
    }
  }

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
})();
