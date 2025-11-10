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
 * This function exactly matches PayFast's PHP generateSignature() function:
 *
 * PHP version:
 * function generateSignature($data, $passPhrase = null) {
 *   $pfOutput = '';
 *   foreach( $data as $key => $val ) {
 *     if($val !== '') {
 *       $pfOutput .= $key .'='. urlencode( trim( $val ) ) .'&';
 *     }
 *   }
 *   $getString = substr( $pfOutput, 0, -1 );
 *   if( $passPhrase !== null ) {
 *     $getString .= '&passphrase='. urlencode( trim( $passPhrase ) );
 *   }
 *   return md5( $getString );
 * }
 *
 * Key requirements:
 * 1. Iterate through data in insertion order (as it appears)
 * 2. Exclude empty values (val !== '')
 * 3. Exclude signature field itself
 * 4. URL-encode values using urlencode() style (spaces as +, uppercase encoding)
 * 5. Add passphrase at the end if provided (also URL-encoded)
 * 6. MD5 hash the entire string (lowercase hex)
 */
function generatePayFastSignature(data: Record<string, string>): string {
  // Create parameter string (matches PHP: $pfOutput = '')
  let pfOutput = "";

  // Iterate through data in insertion order (matches PHP: foreach( $data as $key => $val ))
  for (const key in data) {
    // Exclude signature field (not in PHP example, but standard practice)
    if (key === "signature") {
      continue;
    }

    const val = data[key];

    // PHP checks: if($val !== '')
    // In TypeScript, we need to handle undefined/null, but match PHP behavior for empty strings
    if (val !== undefined && val !== null && String(val) !== "") {
      // PHP: urlencode( trim( $val ) )
      const trimmedVal = String(val).trim();
      if (trimmedVal !== "") {
        // PayFast PHP urlencode() style:
        // - Spaces as +
        // - Uppercase encoding (http%3A%2F%2F)
        // - Special chars encoded
        const encodedValue = encodeURIComponent(trimmedVal)
          .replace(/%20/g, "+")
          .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());

        // PHP: $pfOutput .= $key .'='. urlencode( trim( $val ) ) .'&';
        pfOutput += `${key}=${encodedValue}&`;
      }
    }
  }

  // PHP: $getString = substr( $pfOutput, 0, -1 );
  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);

  // PHP: if( $passPhrase !== null ) {
  //       $getString .= '&passphrase='. urlencode( trim( $passPhrase ) );
  //     }
  if (
    PAYFAST_CONFIG.PASSPHRASE !== null &&
    PAYFAST_CONFIG.PASSPHRASE !== undefined
  ) {
    const trimmedPassPhrase = String(PAYFAST_CONFIG.PASSPHRASE).trim();
    if (trimmedPassPhrase !== "") {
      const encodedPassphrase = encodeURIComponent(trimmedPassPhrase)
        .replace(/%20/g, "+")
        .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
      getString += `&passphrase=${encodedPassphrase}`;
    }
  }

  // CRITICAL DEBUG: Log the exact string being hashed
  console.log("🔐 EXACT SIGNATURE STRING (copy this to verify):");
  console.log(getString);
  console.log("🔐 String length:", getString.length);

  // PHP: return md5( $getString );
  // Generate MD5 hash (lowercase hex)
  const signature = crypto.createHash("md5").update(getString).digest("hex");

  console.log("Generated Signature:", signature);

  return signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      item_name,
      item_description,
      custom_str1,
      custom_str2,
      // Subscription fields
      subscription_type,
      billing_date,
      recurring_amount,
      frequency,
      cycles,
      subscription_notify_email,
      subscription_notify_webhook,
      subscription_notify_buyer,
    } = body;

    // Validate required fields
    if (!amount || !item_name) {
      return NextResponse.json(
        { error: "Amount and item_name are required" },
        { status: 400 }
      );
    }

    // Validate subscription fields if subscription_type is provided
    if (subscription_type) {
      // subscription_type: 1 = subscription, 2 = tokenization
      if (subscription_type !== "1" && subscription_type !== "2") {
        return NextResponse.json(
          {
            error:
              "subscription_type must be '1' (subscription) or '2' (tokenization)",
          },
          { status: 400 }
        );
      }

      // For subscriptions (type 1), frequency and cycles are REQUIRED
      if (subscription_type === "1") {
        if (!frequency || !cycles) {
          return NextResponse.json(
            { error: "frequency and cycles are required for subscriptions" },
            { status: 400 }
          );
        }
        // Validate frequency (1-6)
        if (!["1", "2", "3", "4", "5", "6"].includes(String(frequency))) {
          return NextResponse.json(
            {
              error:
                "frequency must be 1-6 (Daily, Weekly, Monthly, Quarterly, Biannually, Annual)",
            },
            { status: 400 }
          );
        }
        // Validate cycles (0 for indefinite, or positive integer)
        const cyclesNum = parseInt(String(cycles));
        if (isNaN(cyclesNum) || cyclesNum < 0) {
          return NextResponse.json(
            { error: "cycles must be 0 (indefinite) or a positive integer" },
            { status: 400 }
          );
        }
        // CRITICAL: Passphrase is REQUIRED for subscriptions
        if (
          !PAYFAST_CONFIG.PASSPHRASE ||
          PAYFAST_CONFIG.PASSPHRASE.trim() === ""
        ) {
          return NextResponse.json(
            {
              error:
                "PASSPHRASE is REQUIRED for subscriptions. Please set PAYFAST_PASSPHRASE environment variable.",
            },
            { status: 400 }
          );
        }
      }
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

    // Build payment data in EXACT order as per PayFast documentation
    // Match the test script structure that successfully works with PayFast
    const paymentData: Record<string, string> = {
      // 1. Merchant details (REQUIRED - must be first)
      merchant_id: PAYFAST_CONFIG.MERCHANT_ID,
      merchant_key: PAYFAST_CONFIG.MERCHANT_KEY,

      // 2. Return URLs
      return_url:
        PAYFAST_CONFIG.RETURN_URL || `${finalBaseUrl}/payment/success`,
      cancel_url: PAYFAST_CONFIG.CANCEL_URL || `${finalBaseUrl}/payment/cancel`,
      notify_url: PAYFAST_CONFIG.NOTIFY_URL || `${finalBaseUrl}/payment/notify`,

      // 3. Payment details
      m_payment_id: paymentId,
      amount: parseFloat(amount).toFixed(2),
      item_name: String(item_name).trim(),
    };

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
    // Add optional fields if provided
    if (item_description && item_description.trim())
      paymentData.item_description = item_description.trim();
    if (custom_str1 && custom_str1.trim())
      paymentData.custom_str1 = custom_str1.trim();
    if (custom_str2 && custom_str2.trim())
      paymentData.custom_str2 = custom_str2.trim();

    // Add subscription fields if provided
    if (subscription_type) {
      paymentData.subscription_type = String(subscription_type);

      // Subscription-specific fields (type 1)
      if (subscription_type === "1") {
        paymentData.frequency = String(frequency);
        paymentData.cycles = String(cycles);

        if (billing_date && billing_date.trim()) {
          paymentData.billing_date = String(billing_date).trim();
        }
        if (recurring_amount) {
          const recurringAmount = parseFloat(String(recurring_amount));
          if (!isNaN(recurringAmount) && recurringAmount >= 5.0) {
            paymentData.recurring_amount = recurringAmount.toFixed(2);
          }
        }
        if (subscription_notify_email !== undefined) {
          paymentData.subscription_notify_email = String(
            subscription_notify_email === true ||
              subscription_notify_email === "true"
          );
        }
        if (subscription_notify_webhook !== undefined) {
          paymentData.subscription_notify_webhook = String(
            subscription_notify_webhook === true ||
              subscription_notify_webhook === "true"
          );
        }
        if (subscription_notify_buyer !== undefined) {
          paymentData.subscription_notify_buyer = String(
            subscription_notify_buyer === true ||
              subscription_notify_buyer === "true"
          );
        }
      }
    }

    // Generate signature
    // CRITICAL: For subscriptions, passphrase MUST be included in signature
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
