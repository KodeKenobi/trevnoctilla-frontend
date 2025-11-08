import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// PayFast configuration
const PAYFAST_CONFIG = {
  // Use sandbox for testing, production for live
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
 * PayFast signature requirements:
 * 1. Sort parameters alphabetically
 * 2. Exclude empty values and signature field
 * 3. Trim whitespace from values
 * 4. URL encode values (uppercase encoding, space becomes +)
 * 5. Join with &
 * 6. Append passphrase if provided
 * 7. Generate MD5 hash (lowercase)
 */
function generatePayFastSignature(data: Record<string, string>): string {
  // Filter out empty values and signature field, trim whitespace
  const filteredData: Record<string, string> = {};
  Object.keys(data).forEach((key) => {
    if (
      key !== "signature" &&
      data[key] !== "" &&
      data[key] !== null &&
      data[key] !== undefined
    ) {
      // Trim whitespace as required by PayFast
      const value = String(data[key]).trim();
      if (value !== "") {
        filteredData[key] = value;
      }
    }
  });

  // Create parameter string - PayFast requires PHP's urlencode() format
  // PHP urlencode(): space -> +, special chars -> %XX (uppercase)
  // Important: encodeURIComponent already handles most encoding, we just need to:
  // 1. Replace %20 with + (space encoding)
  // 2. Ensure hex codes are uppercase
  const pfParamString = Object.keys(filteredData)
    .sort()
    .map((key) => {
      const value = filteredData[key];
      // Encode the value
      let encoded = encodeURIComponent(value);
      // Replace %20 with + (PHP urlencode format)
      encoded = encoded.replace(/%20/g, "+");
      // Convert hex codes to uppercase (e.g., %3a -> %3A)
      encoded = encoded.replace(
        /%([0-9a-f]{2})/gi,
        (match, hex) => `%${hex.toUpperCase()}`
      );
      return `${key}=${encoded}`;
    })
    .join("&");

  // Add passphrase if provided (PayFast requires this at the end)
  // PayFast expects passphrase to be appended WITHOUT URL encoding
  let pfParamStringWithPassphrase = pfParamString;
  if (PAYFAST_CONFIG.PASSPHRASE && PAYFAST_CONFIG.PASSPHRASE.trim()) {
    const passphrase = PAYFAST_CONFIG.PASSPHRASE.trim();
    // Append passphrase WITHOUT encoding (PayFast requirement)
    pfParamStringWithPassphrase = `${pfParamString}&passphrase=${passphrase}`;
  }

  // Debug: log the parameter string and signature components
  console.log("=== PayFast Signature Debug ===");
  console.log("Parameter String (for signature):", pfParamStringWithPassphrase);
  console.log("Passphrase used:", PAYFAST_CONFIG.PASSPHRASE ? "YES" : "NO");
  console.log("Passphrase length:", PAYFAST_CONFIG.PASSPHRASE?.length || 0);

  // Generate MD5 hash (lowercase)
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
      console.error("PayFast config missing:", {
        MERCHANT_ID: PAYFAST_CONFIG.MERCHANT_ID ? "exists" : "missing",
        MERCHANT_KEY: PAYFAST_CONFIG.MERCHANT_KEY ? "exists" : "missing",
        PASSPHRASE: PAYFAST_CONFIG.PASSPHRASE ? "exists" : "missing",
        env_check: {
          PAYFAST_MERCHANT_ID: !!process.env.PAYFAST_MERCHANT_ID,
          NEXT_PUBLIC_PAYFAST_MERCHANT_ID:
            !!process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID,
          PAYFAST_MERCHANT_KEY: !!process.env.PAYFAST_MERCHANT_KEY,
          NEXT_PUBLIC_PAYFAST_MERCHANT_KEY:
            !!process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY,
        },
      });
      return NextResponse.json(
        {
          error:
            "PayFast configuration is missing. Please set PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, and PAYFAST_PASSPHRASE environment variables in your hosting platform.",
        },
        { status: 500 }
      );
    }

    // Generate unique payment ID
    const paymentId = `payment_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Prepare payment data
    // Note: email_address is optional in PayFast - they'll collect it on their page if not provided
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
      m_payment_id: paymentId,
      amount: parseFloat(amount).toFixed(2),
      item_name: item_name,
      item_description: item_description || item_name,
    };

    // Only add optional fields if provided (empty values cause signature mismatch)
    if (body.name_first && body.name_first.trim())
      paymentData.name_first = body.name_first.trim();
    if (body.name_last && body.name_last.trim())
      paymentData.name_last = body.name_last.trim();
    if (body.email_address && body.email_address.trim())
      paymentData.email_address = body.email_address.trim();
    if (body.cell_number && body.cell_number.trim())
      paymentData.cell_number = body.cell_number.trim();
    if (custom_str1 && custom_str1.trim())
      paymentData.custom_str1 = custom_str1.trim();
    if (custom_str2 && custom_str2.trim())
      paymentData.custom_str2 = custom_str2.trim();

    // Generate signature
    const signature = generatePayFastSignature(paymentData);
    paymentData.signature = signature;

    // Debug logging (remove in production)
    console.log("PayFast Payment Data:", JSON.stringify(paymentData, null, 2));
    console.log("PayFast Signature:", signature);
    console.log("PayFast Passphrase exists:", !!PAYFAST_CONFIG.PASSPHRASE);

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
      {
        error: `Failed to initiate payment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
