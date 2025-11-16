import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { storePendingPayment } from "@/lib/pending-payments";

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
  // CRITICAL: Match PayFast PHP generateSignature() EXACTLY
  // PHP: foreach( $data as $key => $val ) - uses INSERTION ORDER
  // This matches the working $1 payment and the official PHP example

  // Create parameter string (matches PHP: $pfOutput = '')
  let pfOutput = "";

  // Iterate through data in insertion order (matches PHP: foreach( $data as $key => $val ))
  // CRITICAL: The simple payment test shows merchant_key IS included in signature
  // Only exclude signature field itself - match the working simple script exactly
  for (const key in data) {
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
      // CRITICAL: Passphrase is also URL-encoded (PHP urlencode() style)
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
    // Get user email from session - CRITICAL: Use headers() for App Router
    const headersList = await headers();
    const session = await getServerSession({
      ...authOptions,
      req: {
        headers: headersList,
      } as any,
    });

    const userEmail = session?.user?.email;

    console.log("🔐 [PAYMENT INITIATE] Session check:", {
      hasSession: !!session,
      userEmail: userEmail || "none",
      sessionUser: session?.user ? Object.keys(session.user) : "none",
      cookieHeader: headersList.get("cookie") ? "present" : "missing",
    });

    if (!userEmail) {
      console.error(
        "❌ [PAYMENT INITIATE] No user email in session - returning 401"
      );
      console.error("   Session:", session);
      console.error("   Request headers:", {
        cookie: headersList.get("cookie") ? "present" : "missing",
        authorization: headersList.get("authorization") ? "present" : "missing",
      });
      return NextResponse.json(
        { error: "User must be authenticated to initiate payment" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      amount,
      item_name,
      item_description,
      custom_str1,
      custom_str2,
      // Return URLs (for one-time payments)
      return_url,
      cancel_url,
      notify_url,
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
          console.error(
            "❌ CRITICAL ERROR: Passphrase is missing for subscription!"
          );
          console.error(
            "PAYFAST_CONFIG.PASSPHRASE:",
            PAYFAST_CONFIG.PASSPHRASE
          );
          console.error(
            "process.env.PAYFAST_PASSPHRASE:",
            process.env.PAYFAST_PASSPHRASE
          );
          console.error(
            "process.env.NEXT_PUBLIC_PAYFAST_PASSPHRASE:",
            process.env.NEXT_PUBLIC_PAYFAST_PASSPHRASE
          );
          return NextResponse.json(
            {
              error:
                "PASSPHRASE is REQUIRED for subscriptions. Please set PAYFAST_PASSPHRASE environment variable.",
            },
            { status: 400 }
          );
        }
        console.log(
          "✅ Passphrase configured for subscription (length:",
          PAYFAST_CONFIG.PASSPHRASE.length,
          "chars)"
        );
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

    // Build payment data matching test script order
    // Test script order: merchant_id, merchant_key, return_url, cancel_url, notify_url, amount, item_name
    const paymentData: Record<string, string> = {
      merchant_id: PAYFAST_CONFIG.MERCHANT_ID,
      merchant_key: PAYFAST_CONFIG.MERCHANT_KEY,
    };

    // Add return URLs for all payments
    // PayFast requires return_url in payload to redirect users back after payment
    // For subscriptions: redirect to dashboard, for one-time payments: redirect to success page
    const isSubscription =
      subscription_type === "1" ||
      subscription_type === "2" ||
      subscription_type === 1 ||
      subscription_type === 2;

    // Use provided URLs from request body, or construct from config
    // CRITICAL: Always replace localhost URLs with production URLs
    // PayFast requires publicly accessible URLs
    const sanitizeUrl = (url: string | undefined): string => {
      if (!url) return "";
      // Replace any localhost URLs with production URL
      if (url.includes("localhost") || url.includes("127.0.0.1")) {
        return url.replace(/https?:\/\/[^/]+/, productionBaseUrl);
      }
      return url;
    };

    const returnUrl =
      sanitizeUrl(return_url) ||
      (isSubscription
        ? `${finalBaseUrl}/dashboard` // Subscriptions go to dashboard
        : PAYFAST_CONFIG.RETURN_URL || `${finalBaseUrl}/payment/success`); // One-time payments go to success page
    const cancelUrl =
      sanitizeUrl(cancel_url) ||
      PAYFAST_CONFIG.CANCEL_URL ||
      `${finalBaseUrl}/payment/cancel`;

    // Always include return_url and cancel_url for redirects
    paymentData.return_url = returnUrl;
    paymentData.cancel_url = cancelUrl;

    // Always include notify_url for both one-time payments and subscriptions
    // PayFast requires notify_url to know where to send webhook notifications
    const notifyUrl =
      sanitizeUrl(notify_url) ||
      PAYFAST_CONFIG.NOTIFY_URL ||
      `${finalBaseUrl}/payment/notify`;
    paymentData.notify_url = notifyUrl;

    // Add amount and item_name (matching test script order)
    paymentData.amount = parseFloat(amount).toFixed(2);
    paymentData.item_name = String(item_name).trim();

    // Add subscription fields in EXACT order as working form
    if (subscription_type) {
      paymentData.subscription_type = String(subscription_type);

      if (subscription_type === "1") {
        if (billing_date && billing_date.trim()) {
          paymentData.billing_date = String(billing_date).trim();
        }
        if (recurring_amount) {
          const recurringAmount = parseFloat(String(recurring_amount));
          if (!isNaN(recurringAmount) && recurringAmount >= 5.0) {
            paymentData.recurring_amount = recurringAmount.toFixed(2);
          }
        }
        paymentData.frequency = String(frequency);
        paymentData.cycles = String(cycles);

        // PayFast accepts "true" for subscription notification fields (tested and confirmed)
        if (subscription_notify_email !== undefined) {
          const isEnabled =
            subscription_notify_email === true ||
            subscription_notify_email === "true" ||
            subscription_notify_email === "1";
          if (isEnabled) {
            paymentData.subscription_notify_email = "true";
          }
        }
        if (subscription_notify_webhook !== undefined) {
          const isEnabled =
            subscription_notify_webhook === true ||
            subscription_notify_webhook === "true" ||
            subscription_notify_webhook === "1";
          if (isEnabled) {
            paymentData.subscription_notify_webhook = "true";
          }
        }
        if (subscription_notify_buyer !== undefined) {
          const isEnabled =
            subscription_notify_buyer === true ||
            subscription_notify_buyer === "true" ||
            subscription_notify_buyer === "1";
          if (isEnabled) {
            paymentData.subscription_notify_buyer = "true";
          }
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
    // Include debug info in development to see signature string
    const response: any = {
      success: true,
      payment_url: finalUrl,
      payment_data: paymentData,
      payment_id: paymentId,
      debug: {
        url_source: process.env.NEXT_PUBLIC_PAYFAST_URL ? "env" : "default",
        url_value: finalUrl,
        is_sandbox: finalUrl.includes("sandbox"),
      },
    };

    // In development, include the signature string for debugging
    if (process.env.NODE_ENV === "development") {
      // Reconstruct signature string using the SAME logic as generatePayFastSignature
      // This must match exactly - use INSERTION ORDER, only exclude signature
      let debugString = "";
      const debugFieldOrder: string[] = [];
      for (const key in paymentData) {
        if (key !== "signature") {
          const val = paymentData[key];
          if (val !== undefined && val !== null && String(val) !== "") {
            const trimmedVal = String(val).trim();
            if (trimmedVal !== "") {
              debugFieldOrder.push(key);
              const encodedValue = encodeURIComponent(trimmedVal)
                .replace(/%20/g, "+")
                .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
              debugString += `${key}=${encodedValue}&`;
            }
          }
        }
      }
      debugString = debugString.slice(0, -1);
      if (PAYFAST_CONFIG.PASSPHRASE && PAYFAST_CONFIG.PASSPHRASE.trim()) {
        const encodedPassphrase = encodeURIComponent(
          PAYFAST_CONFIG.PASSPHRASE.trim()
        )
          .replace(/%20/g, "+")
          .replace(/%([0-9A-F]{2})/g, (match) => match.toUpperCase());
        debugString += `&passphrase=${encodedPassphrase}`;
      }
      response.debug.signature_string = debugString;
      response.debug.field_order = debugFieldOrder;
    }

    // Store pending payment for this user
    // Extract plan from item_name (e.g., "Production Plan - Monthly Subscription" -> "production")
    const planMatch = item_name.match(/(production|premium|enterprise)/i);
    const plan = planMatch ? planMatch[1].toLowerCase() : "production"; // Default to production

    storePendingPayment(userEmail, plan, paymentData.amount);
    console.log(
      `💾 [PAYMENT INITIATE] Stored pending payment for ${userEmail}: ${plan} plan (${paymentData.amount})`
    );

    return NextResponse.json(response);
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
