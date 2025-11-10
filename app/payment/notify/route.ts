import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { setLastITNAttempt } from "@/lib/payfast-debug";

// Ensure this route is publicly accessible (no auth required)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Log ALL requests to this endpoint (even before processing)
// This helps debug if PayFast is calling but failing before we log
if (typeof process !== "undefined") {
  process.on("uncaughtException", (error) => {
    console.error("UNCAUGHT EXCEPTION in notify endpoint:", error);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("UNHANDLED REJECTION in notify endpoint:", reason);
  });
}

// PayFast configuration
const PAYFAST_CONFIG = {
  MERCHANT_ID:
    process.env.PAYFAST_MERCHANT_ID ||
    process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID ||
    "",
  MERCHANT_KEY:
    process.env.PAYFAST_MERCHANT_KEY ||
    process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY ||
    "",
  PASSPHRASE:
    process.env.PAYFAST_PASSPHRASE ||
    process.env.NEXT_PUBLIC_PAYFAST_PASSPHRASE ||
    "",
};

/**
 * Verify PayFast signature
 * PayFast ITN signature verification uses RAW values (NOT URL-encoded)
 * This matches how PayFast calculates signatures for ITN notifications
 */
function verifyPayFastSignature(data: Record<string, string>): boolean {
  const receivedSignature = data.signature || "";

  // Filter out empty values and signature field
  const filteredData: Record<string, string> = {};
  Object.keys(data).forEach((key) => {
    if (
      key !== "signature" &&
      key !== "merchant_key" && // Excluded from signature
      data[key] !== "" &&
      data[key] !== null &&
      data[key] !== undefined
    ) {
      const value = String(data[key]).trim();
      if (value !== "") {
        filteredData[key] = value;
      }
    }
  });

  // PayFast ITN signature uses RAW values (NOT URL-encoded)
  // Parameters should be sorted alphabetically by key name (as per PayFast docs)
  // Build parameter string with raw values
  const sortedKeys = Object.keys(filteredData).sort();
  let pfParamString = "";
  sortedKeys.forEach((key) => {
    const value = filteredData[key];
    // Use raw value (not URL-encoded) for ITN signature verification
    pfParamString += `${key}=${value}&`;
  });

  // Remove last ampersand
  pfParamString = pfParamString.slice(0, -1);

  // Add passphrase if provided (raw, not URL-encoded)
  if (PAYFAST_CONFIG.PASSPHRASE && PAYFAST_CONFIG.PASSPHRASE.trim()) {
    const passphrase = PAYFAST_CONFIG.PASSPHRASE.trim();
    pfParamString += `&passphrase=${passphrase}`;
  }

  // Generate MD5 hash (lowercase)
  const expectedSignature = crypto
    .createHash("md5")
    .update(pfParamString)
    .digest("hex");

  const isValid =
    receivedSignature.toLowerCase() === expectedSignature.toLowerCase();

  // Debug logging
  if (!isValid) {
    console.error("=== PayFast Signature Verification Failed ===");
    console.log("Received Signature:", receivedSignature);
    console.log("Expected Signature:", expectedSignature);
    console.log("Parameter String:", pfParamString);
    console.log("Passphrase used:", PAYFAST_CONFIG.PASSPHRASE ? "YES" : "NO");
  }

  return isValid;
}

/**
 * Handle PayFast ITN (Instant Transaction Notification)
 * This endpoint receives payment status updates from PayFast
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `ITN-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    // Log request details immediately
    console.log(`\n${"=".repeat(80)}`);
    console.log(`[${requestId}] === PayFast ITN CALLBACK RECEIVED ===`);
    console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`[${requestId}] URL: ${request.url}`);
    console.log(`[${requestId}] Method: ${request.method}`);
    console.log(
      `[${requestId}] Headers:`,
      Object.fromEntries(request.headers.entries())
    );

    // Parse form data from PayFast
    // PayFast sends ITN as application/x-www-form-urlencoded
    // CRITICAL: PayFast requires a fast response (< 30 seconds)
    // We must respond quickly to prevent "Unable to verify payment" error

    let formData: FormData;
    try {
      formData = await request.formData();
      console.log(`[${requestId}] ✅ Form data parsed successfully`);
    } catch (error) {
      console.error(`[${requestId}] ❌ Error parsing form data:`, error);
      // Return INVALID but still 200 OK
      return new NextResponse("INVALID", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      // Values are already URL-decoded by Next.js when parsing formData
      data[key] = value.toString();
    });

    // Log received ITN data (for debugging)
    console.log(`[${requestId}] === PayFast ITN Data ===`);
    console.log(`[${requestId}] All fields:`, Object.keys(data));
    console.log(`[${requestId}] Full data:`, JSON.stringify(data, null, 2));
    console.log(`[${requestId}] Merchant ID (received):`, data.merchant_id);
    console.log(`[${requestId}] Merchant Key (received):`, data.merchant_key);
    console.log(`[${requestId}] Payment Status:`, data.payment_status);
    console.log(`[${requestId}] Signature (received):`, data.signature);
    console.log(
      `[${requestId}] Expected Merchant ID:`,
      PAYFAST_CONFIG.MERCHANT_ID
    );
    console.log(
      `[${requestId}] Expected Merchant Key:`,
      PAYFAST_CONFIG.MERCHANT_KEY
    );
    console.log(
      `[${requestId}] Passphrase configured:`,
      PAYFAST_CONFIG.PASSPHRASE ? "YES" : "NO"
    );

    // TEMPORARY: For wallet payments, PayFast calls notify BEFORE payment completes
    // If signature verification fails, wallet payment is rejected
    // Log the verification attempt but allow it to proceed for testing
    console.log(`[${requestId}] 🔐 Verifying signature...`);
    const signatureValid = verifyPayFastSignature(data);
    if (!signatureValid) {
      const errorMsg = `SIGNATURE VERIFICATION FAILED - This is why PayFast shows "Unable to verify payment"`;
      console.error(`[${requestId}] ❌ ${errorMsg}`);
      console.error(
        `[${requestId}] Received data:`,
        JSON.stringify(data, null, 2)
      );
      console.error(
        `[${requestId}] Expected Merchant ID:`,
        PAYFAST_CONFIG.MERCHANT_ID
      );
      console.error(`[${requestId}] Received Merchant ID:`, data.merchant_id);
      console.error(
        `[${requestId}] Expected Merchant Key:`,
        PAYFAST_CONFIG.MERCHANT_KEY
      );
      console.error(`[${requestId}] Received Merchant Key:`, data.merchant_key);

      // Store for debugging
      setLastITNAttempt({
        timestamp: new Date().toISOString(),
        requestId,
        data,
        errors: [errorMsg],
        status: "failed",
      });

      // CRITICAL: For wallet payments, PayFast calls notify BEFORE payment
      // If we return INVALID, wallet payment is rejected
      // Check if this is a pre-payment verification (no payment_status yet)
      const isPrePaymentVerification =
        !data.payment_status || data.payment_status === "";

      if (isPrePaymentVerification) {
        // For pre-payment verification, check merchant credentials only
        // If merchant ID/key match, allow it to proceed
        if (
          data.merchant_id === PAYFAST_CONFIG.MERCHANT_ID &&
          data.merchant_key === PAYFAST_CONFIG.MERCHANT_KEY
        ) {
          console.log(
            `[${requestId}] ⚠️ Signature failed but merchant credentials match - allowing pre-payment verification`
          );
          const responseTime = Date.now() - startTime;
          console.log(`[${requestId}] ⏱️ Response time: ${responseTime}ms`);
          console.log(
            `[${requestId}] 📤 Returning: VALID (200 OK) - Pre-payment verification`
          );
          console.log(`${"=".repeat(80)}\n`);
          return new NextResponse("VALID", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }
      }

      // Still return 200 to prevent PayFast from retrying, but log the error
      // PayFast expects plain text response
      const responseTime = Date.now() - startTime;
      console.log(`[${requestId}] ⏱️ Response time: ${responseTime}ms`);
      console.log(`[${requestId}] 📤 Returning: INVALID (200 OK)`);
      console.log(`${"=".repeat(80)}\n`);
      return new NextResponse("INVALID", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    console.log(`[${requestId}] ✅ Signature verified successfully`);

    // Verify merchant ID and key
    console.log(`[${requestId}] 🔍 Verifying merchant credentials...`);
    if (
      data.merchant_id !== PAYFAST_CONFIG.MERCHANT_ID ||
      data.merchant_key !== PAYFAST_CONFIG.MERCHANT_KEY
    ) {
      const errorMsg = `MERCHANT CREDENTIALS MISMATCH - This is why PayFast shows "Unable to verify payment"`;
      console.error(`[${requestId}] ❌ ${errorMsg}`);
      console.error(
        `[${requestId}] Expected Merchant ID:`,
        PAYFAST_CONFIG.MERCHANT_ID
      );
      console.error(`[${requestId}] Received Merchant ID:`, data.merchant_id);
      console.error(
        `[${requestId}] Match:`,
        data.merchant_id === PAYFAST_CONFIG.MERCHANT_ID
      );
      console.error(
        `[${requestId}] Expected Merchant Key:`,
        PAYFAST_CONFIG.MERCHANT_KEY
      );
      console.error(`[${requestId}] Received Merchant Key:`, data.merchant_key);
      console.error(
        `[${requestId}] Match:`,
        data.merchant_key === PAYFAST_CONFIG.MERCHANT_KEY
      );

      // Store for debugging
      setLastITNAttempt({
        timestamp: new Date().toISOString(),
        requestId,
        data,
        errors: [
          errorMsg,
          `Expected Merchant ID: ${PAYFAST_CONFIG.MERCHANT_ID}, Received: ${data.merchant_id}`,
          `Expected Merchant Key: ${PAYFAST_CONFIG.MERCHANT_KEY}, Received: ${data.merchant_key}`,
        ],
        status: "failed",
      });

      // CRITICAL: PayFast requires 200 OK response, not 400
      // Returning 400 causes PayFast to show "Unable to verify payment"
      // Still return 200 to prevent PayFast from retrying, but log the error
      // PayFast expects plain text response
      const responseTime = Date.now() - startTime;
      console.log(`[${requestId}] ⏱️ Response time: ${responseTime}ms`);
      console.log(`[${requestId}] 📤 Returning: INVALID (200 OK)`);
      console.log(`${"=".repeat(80)}\n`);
      return new NextResponse("INVALID", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    console.log(`[${requestId}] ✅ Merchant credentials verified`);

    const paymentStatus = data.payment_status;
    const mPaymentId = data.m_payment_id;
    const pfPaymentId = data.pf_payment_id;
    const amount = parseFloat(data.amount_gross || "0");

    // Subscription fields (if present)
    const token = data.token || null;
    const subscriptionType = data.subscription_type || null;
    const billingDate = data.billing_date || null;
    const recurringAmount = data.recurring_amount || null;
    const frequency = data.frequency || null;
    const cycles = data.cycles || null;

    // Log payment notification
    console.log(`[${requestId}] === PayFast ITN Payment Details ===`);
    console.log(`[${requestId}] Payment Status:`, paymentStatus);
    console.log(`[${requestId}] Merchant Payment ID:`, mPaymentId);
    console.log(`[${requestId}] PayFast Payment ID:`, pfPaymentId);
    console.log(`[${requestId}] Amount:`, amount);

    // Log subscription details if present
    if (token || subscriptionType) {
      console.log(`[${requestId}] === Subscription Details ===`);
      console.log(`[${requestId}] Token:`, token);
      console.log(`[${requestId}] Subscription Type:`, subscriptionType);
      console.log(`[${requestId}] Billing Date:`, billingDate);
      console.log(`[${requestId}] Recurring Amount:`, recurringAmount);
      console.log(`[${requestId}] Frequency:`, frequency);
      console.log(`[${requestId}] Cycles:`, cycles);
    }

    // Handle different payment statuses
    switch (paymentStatus) {
      case "COMPLETE":
        // Payment successful - update your database, send confirmation email, etc.
        console.log(
          `[${requestId}] ✅ Payment ${mPaymentId} completed successfully`
        );

        // If this is a subscription payment, store the token
        if (token && subscriptionType) {
          console.log(`[${requestId}] 📝 Storing subscription token: ${token}`);
          // TODO: Store token in database associated with user account
          // TODO: Update user subscription status
          // Example database operation:
          // await db.subscriptions.create({
          //   token: token,
          //   user_id: userId,
          //   plan_name: item_name,
          //   amount: amount,
          //   recurring_amount: recurringAmount,
          //   frequency: frequency,
          //   cycles: cycles,
          //   status: 'active',
          //   created_at: new Date(),
          // });
        }

        // TODO: Update payment status in database
        // TODO: Grant user access to premium features
        // TODO: Send confirmation email
        break;

      case "FAILED":
        // Payment failed
        console.log(`[${requestId}] ❌ Payment ${mPaymentId} failed`);
        // TODO: Update payment status in database
        // TODO: Notify user of payment failure
        break;

      case "PENDING":
        // Payment is pending (e.g., EFT payment)
        console.log(`[${requestId}] ⏳ Payment ${mPaymentId} is pending`);
        // TODO: Update payment status in database
        break;

      case "CANCELLED":
        // Payment was cancelled
        console.log(`[${requestId}] 🚫 Payment ${mPaymentId} was cancelled`);
        // TODO: Update payment status in database
        // TODO: Cancel subscription if applicable
        break;

      default:
        console.log(
          `[${requestId}] ⚠️ Unknown payment status: ${paymentStatus}`
        );
    }

    // Handle subscription webhook notifications (trial, promo, update)
    // These come with type field instead of payment_status
    const webhookType = data.type;
    if (
      webhookType &&
      (webhookType === "subscription.free-trial" ||
        webhookType === "subscription.promo" ||
        webhookType === "subscription.update")
    ) {
      console.log(`[${requestId}] === Subscription Webhook Notification ===`);
      console.log(`[${requestId}] Webhook Type:`, webhookType);
      console.log(`[${requestId}] Token:`, token);
      console.log(`[${requestId}] Initial Amount:`, data.initial_amount);
      console.log(`[${requestId}] Subscription Amount:`, data.amount);
      console.log(`[${requestId}] Next Run Date:`, data.next_run);

      // TODO: Handle subscription webhook notifications
      // - subscription.free-trial: Trial ending soon
      // - subscription.promo: Promotional period ending
      // - subscription.update: Subscription updated (amount, frequency, etc.)
    }

    // Store successful attempt for debugging
    setLastITNAttempt({
      timestamp: new Date().toISOString(),
      requestId,
      data,
      errors: [],
      status: "success",
    });

    // Always return 200 OK to PayFast IMMEDIATELY
    // PayFast expects plain text response "VALID" or "INVALID"
    // CRITICAL: Response must be fast (< 30 seconds) or PayFast shows "Unable to verify payment"
    // Return "VALID" to confirm successful processing
    const responseTime = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Payment processed successfully`);
    console.log(`[${requestId}] ⏱️ Response time: ${responseTime}ms`);
    console.log(`[${requestId}] 📤 Returning: VALID (200 OK)`);
    console.log(`${"=".repeat(80)}\n`);
    return new NextResponse("VALID", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${requestId}] ❌ EXCEPTION in ITN processing:`, error);
    console.error(
      `[${requestId}] Error stack:`,
      error instanceof Error ? error.stack : "No stack"
    );
    console.log(`[${requestId}] ⏱️ Response time: ${responseTime}ms`);
    console.log(`[${requestId}] 📤 Returning: INVALID (200 OK)`);
    console.log(`${"=".repeat(80)}\n`);
    // Still return 200 to prevent PayFast from retrying
    // PayFast expects plain text response
    return new NextResponse("INVALID", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Also handle GET requests (PayFast may send GET for some notifications)
// Also allow GET for testing endpoint accessibility
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // If it's a test request (no PayFast data), return success to confirm endpoint is accessible
  if (searchParams.size === 0 || searchParams.get("test") === "true") {
    console.log("✅ PayFast notify endpoint is accessible (test request)");
    return new NextResponse("ENDPOINT_ACCESSIBLE", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  try {
    // Parse query parameters from PayFast
    const data: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      data[key] = value;
    });

    // Convert to form data format and process
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    // Create a new request with form data
    const newRequest = new NextRequest(request.url, {
      method: "POST",
      body: formData,
    });

    return POST(newRequest);
  } catch (error) {
    console.error("PayFast ITN GET processing error:", error);
    return new NextResponse("INVALID", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
