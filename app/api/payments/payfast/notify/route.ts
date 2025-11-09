import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
 * PayFast ITN signature verification uses URL-encoded values (as PayFast sends them)
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

  // PayFast ITN signature uses URL-encoded values
  // Parameters should be sorted alphabetically by key name (as per PayFast docs)
  // Build parameter string with URL-encoded values
  const sortedKeys = Object.keys(filteredData).sort();
  let pfParamString = "";
  sortedKeys.forEach((key) => {
    const value = filteredData[key];
    // URL-encode value (uppercase encoding, spaces as '+')
    const encodedValue = encodeURIComponent(value)
      .replace(/%20/g, "+")
      .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
    pfParamString += `${key}=${encodedValue}&`;
  });

  // Remove last ampersand
  pfParamString = pfParamString.slice(0, -1);

  // Add passphrase if provided (also URL-encoded)
  if (PAYFAST_CONFIG.PASSPHRASE && PAYFAST_CONFIG.PASSPHRASE.trim()) {
    const passphrase = PAYFAST_CONFIG.PASSPHRASE.trim();
    const encodedPassphrase = encodeURIComponent(passphrase)
      .replace(/%20/g, "+")
      .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
    pfParamString += `&passphrase=${encodedPassphrase}`;
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
  try {
    // Parse form data from PayFast
    // PayFast sends ITN as application/x-www-form-urlencoded
    const formData = await request.formData();
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      // Values are already URL-decoded by Next.js when parsing formData
      data[key] = value.toString();
    });

    // Log received ITN data (for debugging)
    console.log("=== PayFast ITN Received ===");
    console.log("Data:", JSON.stringify(data, null, 2));
    console.log("Merchant ID:", data.merchant_id);
    console.log("Merchant Key:", data.merchant_key);
    console.log("Payment Status:", data.payment_status);
    console.log("Expected Merchant ID:", PAYFAST_CONFIG.MERCHANT_ID);
    console.log("Expected Merchant Key:", PAYFAST_CONFIG.MERCHANT_KEY);
    console.log(
      "Passphrase configured:",
      PAYFAST_CONFIG.PASSPHRASE ? "YES" : "NO"
    );

    // Verify signature first
    if (!verifyPayFastSignature(data)) {
      console.error("PayFast signature verification failed");
      console.error("Received data:", data);
      // Still return 200 to prevent PayFast from retrying, but log the error
      // PayFast expects plain text response
      return new NextResponse("INVALID", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Verify merchant ID and key
    if (
      data.merchant_id !== PAYFAST_CONFIG.MERCHANT_ID ||
      data.merchant_key !== PAYFAST_CONFIG.MERCHANT_KEY
    ) {
      console.error("PayFast merchant credentials mismatch");
      console.error("Expected Merchant ID:", PAYFAST_CONFIG.MERCHANT_ID);
      console.error("Received Merchant ID:", data.merchant_id);
      console.error("Expected Merchant Key:", PAYFAST_CONFIG.MERCHANT_KEY);
      console.error("Received Merchant Key:", data.merchant_key);
      // CRITICAL: PayFast requires 200 OK response, not 400
      // Returning 400 causes PayFast to show "Unable to verify payment"
      // Still return 200 to prevent PayFast from retrying, but log the error
      // PayFast expects plain text response
      return new NextResponse("INVALID", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const paymentStatus = data.payment_status;
    const mPaymentId = data.m_payment_id;
    const pfPaymentId = data.pf_payment_id;
    const amount = parseFloat(data.amount_gross || "0");

    // Log payment notification
    console.log("PayFast ITN received:", {
      payment_status: paymentStatus,
      m_payment_id: mPaymentId,
      pf_payment_id: pfPaymentId,
      amount: amount,
    });

    // Handle different payment statuses
    switch (paymentStatus) {
      case "COMPLETE":
        // Payment successful - update your database, send confirmation email, etc.
        // TODO: Update payment status in database
        // TODO: Grant user access to premium features
        // TODO: Send confirmation email
        console.log(`Payment ${mPaymentId} completed successfully`);
        break;

      case "FAILED":
        // Payment failed
        console.log(`Payment ${mPaymentId} failed`);
        break;

      case "PENDING":
        // Payment is pending (e.g., EFT payment)
        console.log(`Payment ${mPaymentId} is pending`);
        break;

      case "CANCELLED":
        // Payment was cancelled
        console.log(`Payment ${mPaymentId} was cancelled`);
        break;

      default:
        console.log(`Unknown payment status: ${paymentStatus}`);
    }

    // Always return 200 OK to PayFast
    // PayFast expects plain text response, not JSON
    // Return "VALID" to confirm successful processing
    return new NextResponse("VALID", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("PayFast ITN processing error:", error);
    // Still return 200 to prevent PayFast from retrying
    // PayFast expects plain text response
    return new NextResponse("INVALID", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Also handle GET requests (PayFast may send GET for some notifications)
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters from PayFast
    const searchParams = request.nextUrl.searchParams;
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
