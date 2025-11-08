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
 */
function verifyPayFastSignature(data: Record<string, string>): boolean {
  const receivedSignature = data.signature || "";

  // Create parameter string (excluding signature)
  const pfParamString = Object.keys(data)
    .filter((key) => data[key] !== "" && key !== "signature")
    .sort()
    .map(
      (key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`
    )
    .join("&");

  // Add passphrase if provided
  const pfParamStringWithPassphrase = PAYFAST_CONFIG.PASSPHRASE
    ? `${pfParamString}&passphrase=${encodeURIComponent(
        PAYFAST_CONFIG.PASSPHRASE
      )}`
    : pfParamString;

  // Generate expected signature
  const expectedSignature = crypto
    .createHash("md5")
    .update(pfParamStringWithPassphrase)
    .digest("hex");

  return receivedSignature.toLowerCase() === expectedSignature.toLowerCase();
}

/**
 * Handle PayFast ITN (Instant Transaction Notification)
 * This endpoint receives payment status updates from PayFast
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data from PayFast
    const formData = await request.formData();
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Verify signature
    if (!verifyPayFastSignature(data)) {
      console.error("PayFast signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Verify merchant ID and key
    if (
      data.merchant_id !== PAYFAST_CONFIG.MERCHANT_ID ||
      data.merchant_key !== PAYFAST_CONFIG.MERCHANT_KEY
    ) {
      console.error("PayFast merchant credentials mismatch");
      return NextResponse.json(
        { error: "Invalid merchant credentials" },
        { status: 400 }
      );
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
    // PayFast will retry if it doesn't receive a 200 response
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("PayFast ITN processing error:", error);
    // Still return 200 to prevent PayFast from retrying
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

// Also handle GET requests (PayFast may send GET for some notifications)
export async function GET(request: NextRequest) {
  return POST(request);
}
