import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// PayFast configuration
const PAYFAST_CONFIG = {
  // Use sandbox for testing, production for live
  MERCHANT_ID: process.env.PAYFAST_MERCHANT_ID || "",
  MERCHANT_KEY: process.env.PAYFAST_MERCHANT_KEY || "",
  PASSPHRASE: process.env.PAYFAST_PASSPHRASE || "",
  // Use sandbox URL for testing: https://sandbox.payfast.co.za/eng/process
  // Use production URL for live: https://www.payfast.co.za/eng/process
  PAYFAST_URL:
    process.env.NEXT_PUBLIC_PAYFAST_URL ||
    "https://sandbox.payfast.co.za/eng/process",
  RETURN_URL: process.env.NEXT_PUBLIC_PAYFAST_RETURN_URL || "",
  CANCEL_URL: process.env.NEXT_PUBLIC_PAYFAST_CANCEL_URL || "",
  NOTIFY_URL: process.env.NEXT_PUBLIC_PAYFAST_NOTIFY_URL || "",
};

/**
 * Generate PayFast signature for payment data
 */
function generatePayFastSignature(data: Record<string, string>): string {
  // Create parameter string
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

  // Generate MD5 hash
  return crypto
    .createHash("md5")
    .update(pfParamStringWithPassphrase)
    .digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, item_name, item_description, custom_str1, custom_str2 } =
      body;

    // Validate required fields
    if (!amount || !item_name) {
      return NextResponse.json(
        { error: "Amount and item_name are required" },
        { status: 400 }
      );
    }

    // Validate PayFast configuration
    if (!PAYFAST_CONFIG.MERCHANT_ID || !PAYFAST_CONFIG.MERCHANT_KEY) {
      return NextResponse.json(
        { error: "PayFast configuration is missing" },
        { status: 500 }
      );
    }

    // Generate unique payment ID
    const paymentId = `payment_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Prepare payment data
    const paymentData: Record<string, string> = {
      merchant_id: PAYFAST_CONFIG.MERCHANT_ID,
      merchant_key: PAYFAST_CONFIG.MERCHANT_KEY,
      return_url:
        PAYFAST_CONFIG.RETURN_URL ||
        `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/payment/success`,
      cancel_url:
        PAYFAST_CONFIG.CANCEL_URL ||
        `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/payment/cancel`,
      notify_url:
        PAYFAST_CONFIG.NOTIFY_URL ||
        `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/api/payments/payfast/notify`,
      name_first: body.name_first || "",
      name_last: body.name_last || "",
      email_address: body.email_address || "",
      cell_number: body.cell_number || "",
      m_payment_id: paymentId,
      amount: parseFloat(amount).toFixed(2),
      item_name: item_name,
      item_description: item_description || item_name,
      custom_str1: custom_str1 || "",
      custom_str2: custom_str2 || "",
    };

    // Generate signature
    const signature = generatePayFastSignature(paymentData);
    paymentData.signature = signature;

    // Return payment data and URL
    return NextResponse.json({
      success: true,
      payment_url: PAYFAST_CONFIG.PAYFAST_URL,
      payment_data: paymentData,
      payment_id: paymentId,
    });
  } catch (error) {
    console.error("PayFast initiate payment error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
