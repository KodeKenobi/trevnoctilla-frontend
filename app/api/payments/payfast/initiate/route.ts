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
 *
 * PayFast signature requirements (from PHP example in docs):
 * 1. Iterate through data array in order (as it appears)
 * 2. Exclude empty values and signature field
 * 3. URL-encode values using urlencode() style (spaces as +, uppercase encoding)
 * 4. Exclude merchant_key from signature
 * 5. Add passphrase at the end (also URL-encoded)
 * 6. MD5 hash the entire string (lowercase hex)
 *
 * CRITICAL: PayFast PHP example iterates array in insertion order, not sorted!
 * The order matters - must match how fields appear in the data object.
 */
function generatePayFastSignature(data: Record<string, string>): string {
  // PayFast PHP example:
  // foreach( $data as $key => $val ) {
  //   if($val !== '') {
  //     $pfOutput .= $key .'='. urlencode( trim( $val ) ) .'&';
  //   }
  // }
  // $getString = substr( $pfOutput, 0, -1 );
  // if( $passPhrase !== null ) {
  //   $getString .= '&passphrase='. urlencode( trim( $passPhrase ) );
  // }
  // return md5( $getString );

  // Build parameter string following PayFast PHP example exactly
  // PayFast PHP example:
  // foreach( $data as $key => $val ) {
  //   if($val !== '') {
  //     $pfOutput .= $key .'='. urlencode( trim( $val ) ) .'&';
  //   }
  // }
  // $getString = substr( $pfOutput, 0, -1 );
  // if( $passPhrase !== null ) {
  //   $getString .= '&passphrase='. urlencode( trim( $passPhrase ) );
  // }
  // return md5( $getString );

  // Iterate through data in insertion order (as it appears in object)
  // Exclude: signature, merchant_key, return_url, cancel_url, notify_url
  // Redirect URLs are sent to PayFast but NOT included in signature
  let pfParamString = "";

  for (const key in data) {
    if (
      key !== "signature" &&
      key !== "merchant_key" &&
      key !== "return_url" &&
      key !== "cancel_url" &&
      key !== "notify_url" &&
      data[key] !== undefined &&
      data[key] !== null &&
      data[key] !== ""
    ) {
      const value = String(data[key]).trim();
      if (value !== "") {
        // PayFast PHP urlencode() style:
        // - Spaces as +
        // - Uppercase encoding (http%3A%2F%2F)
        // - Special chars encoded
        const encodedValue = encodeURIComponent(value)
          .replace(/%20/g, "+")
          .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
        pfParamString += `${key}=${encodedValue}&`;
      }
    }
  }

  // Remove last ampersand
  pfParamString = pfParamString.slice(0, -1);

  // Add passphrase if provided (also URL-encoded, matching PHP example)
  if (PAYFAST_CONFIG.PASSPHRASE && PAYFAST_CONFIG.PASSPHRASE.trim() !== "") {
    const passphrase = String(PAYFAST_CONFIG.PASSPHRASE).trim();
    const encodedPassphrase = encodeURIComponent(passphrase)
      .replace(/%20/g, "+")
      .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
    pfParamString += `&passphrase=${encodedPassphrase}`;
  }

  // CRITICAL DEBUG: Log the exact string being hashed
  console.log("🔐 EXACT SIGNATURE STRING (copy this to verify):");
  console.log(pfParamString);
  console.log("🔐 String length:", pfParamString.length);

  // Generate MD5 hash (lowercase hex)
  const signature = crypto
    .createHash("md5")
    .update(pfParamString)
    .digest("hex");

  console.log("Generated Signature:", signature);

  return signature;
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

    // Generate unique payment ID (PayFast requires max 80 chars, alphanumeric and underscores only)
    const paymentId = `pf_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;

    // Prepare payment data
    // Note: email_address is optional in PayFast - they'll collect it on their page if not provided
    // CRITICAL: Use production domain for redirects even when testing with sandbox
    // PayFast requires publicly accessible URLs - localhost won't work
    const productionBaseUrl = "https://www.trevnoctilla.com";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || productionBaseUrl;

    // Always use production domain for redirects (even in local testing with sandbox)
    // PayFast needs publicly accessible URLs for return_url, cancel_url, and notify_url
    const finalBaseUrl = baseUrl.includes("localhost")
      ? productionBaseUrl
      : baseUrl;

    // PayFast minimum required fields (exactly what testing form asks for)
    // CRITICAL: Only merchant_id, amount, item_name are in signature
    // return_url, cancel_url, notify_url are sent but NOT in signature
    const paymentData: Record<string, string> = {
      merchant_id: PAYFAST_CONFIG.MERCHANT_ID,
      merchant_key: PAYFAST_CONFIG.MERCHANT_KEY,
      amount: parseFloat(amount).toFixed(2),
      item_name: String(item_name).trim(),
    };

    // Add redirect URLs (required for PayFast to know where to send user)
    // NOTE: These are sent to PayFast but NOT included in signature calculation
    paymentData.return_url =
      PAYFAST_CONFIG.RETURN_URL || `${finalBaseUrl}/payment/success`;
    paymentData.cancel_url =
      PAYFAST_CONFIG.CANCEL_URL || `${finalBaseUrl}/payment/cancel`;
    paymentData.notify_url =
      PAYFAST_CONFIG.NOTIFY_URL ||
      `${finalBaseUrl}/api/payments/payfast/notify`;

    // Only add optional fields if provided (empty values cause signature mismatch)
    if (body.name_first && body.name_first.trim())
      paymentData.name_first = body.name_first.trim();
    if (body.name_last && body.name_last.trim())
      paymentData.name_last = body.name_last.trim();
    // CRITICAL: PayFast doesn't allow payments from merchant's own email
    // Solution: Don't send email_address - let PayFast collect it on their page
    // This prevents "Merchant is unable to receive payments from the same account" error
    // Only add email if explicitly requested and it's not empty
    // For testing, it's safer to not send email and let PayFast handle it
    // if (body.email_address && body.email_address.trim()) {
    //   paymentData.email_address = body.email_address.trim();
    // }
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
    console.log("=== PayFast Payment Initiation ===");
    console.log("Payment Data:", JSON.stringify(paymentData, null, 2));
    console.log("Signature:", signature);
    console.log("Passphrase exists:", !!PAYFAST_CONFIG.PASSPHRASE);
    console.log("PayFast URL:", PAYFAST_CONFIG.PAYFAST_URL);
    console.log("Return URL:", paymentData.return_url);
    console.log("Cancel URL:", paymentData.cancel_url);
    console.log("Notify URL:", paymentData.notify_url);
    console.log("Merchant ID:", PAYFAST_CONFIG.MERCHANT_ID);
    console.log("Merchant Key:", PAYFAST_CONFIG.MERCHANT_KEY);
    console.log("All fields for form submission:");
    Object.keys(paymentData).forEach((key) => {
      console.log(
        `  ${key}: "${paymentData[key]}" (type: ${typeof paymentData[
          key
        ]}, length: ${String(paymentData[key]).length})`
      );
    });

    // CRITICAL: Ensure we're using the correct URL
    const finalUrl = PAYFAST_CONFIG.PAYFAST_URL;

    // Double-check URL is correct
    if (
      !finalUrl.includes("sandbox") &&
      finalUrl.includes("www.payfast.co.za")
    ) {
      console.error(
        "❌ CRITICAL: Using PRODUCTION URL! This should not happen in development."
      );
      console.error("PAYFAST_CONFIG.PAYFAST_URL:", finalUrl);
      console.error(
        "NEXT_PUBLIC_PAYFAST_URL env:",
        process.env.NEXT_PUBLIC_PAYFAST_URL
      );
    }

    // Return payment data and URL
    return NextResponse.json({
      success: true,
      payment_url: finalUrl,
      payment_data: paymentData,
      payment_id: paymentId,
      debug: {
        url_source: process.env.NEXT_PUBLIC_PAYFAST_URL ? "env" : "default",
        url_value: finalUrl,
        is_sandbox: finalUrl.includes("sandbox"),
      },
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
