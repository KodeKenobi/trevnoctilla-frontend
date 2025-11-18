"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import PayFastForm from "@/components/ui/PayFastForm";
import { convertUSDToZAR } from "@/lib/currency";
import { Loader2, ArrowLeft, CreditCard } from "lucide-react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: userLoading, checkAuthStatus } = useUser();
  const [zarAmount, setZarAmount] = useState<string>("");
  const [usdAmount, setUsdAmount] = useState<number>(0);
  const [planId, setPlanId] = useState<string>("");
  const [planName, setPlanName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormReady, setIsFormReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDataLoaded, setPaymentDataLoaded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isFormReadyRef = useRef(false); // Use ref to avoid closure issues

  // Plan configurations
  const planConfig = {
    production: {
      name: "Production Plan",
      usdPrice: 29,
      description: "5,000 API calls per month",
      tier: "premium",
    },
    enterprise: {
      name: "Enterprise Plan",
      usdPrice: 49,
      description: "Unlimited API calls",
      tier: "enterprise",
    },
  };

  useEffect(() => {
    // Check if user is authenticated
    if (!userLoading && !user) {
      router.push("/auth/login?redirect=/payment");
      return;
    }

    // CRITICAL: Wait for user context to be fully loaded after registration
    // After registration, user might be in localStorage but UserContext hasn't loaded it yet
    if (userLoading) {
      // Still loading, wait
      return;
    }

    // If user is not in context but exists in localStorage, trigger checkAuthStatus
    if (!user) {
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("user_data") : null;
      if (storedUser && checkAuthStatus) {
        // User exists in storage but context hasn't loaded it - trigger refresh
        checkAuthStatus();
        return;
      }
    }

    // Get plan and amount from query params
    const plan = searchParams.get("plan");
    const amountParam = searchParams.get("amount");
    const usdAmountParam = searchParams.get("usdAmount");

    if (!plan) {
      setError("No plan specified");
      setIsLoading(false);
      return;
    }

    // Validate plan
    if (plan !== "production" && plan !== "enterprise") {
      setError("Invalid plan. Please select Production or Enterprise.");
      setIsLoading(false);
      return;
    }

    const config = planConfig[plan as keyof typeof planConfig];
    setPlanId(plan);
    setPlanName(config.name);

    // If amount is provided in query params, use it
    if (amountParam) {
      setZarAmount(parseFloat(amountParam).toFixed(2));
      setUsdAmount(config.usdPrice);
      setIsLoading(false);
    } else if (usdAmountParam) {
      // Convert USD to ZAR
      const usd = parseFloat(usdAmountParam);
      setUsdAmount(usd);
      convertUSDToZAR(usd)
        .then((zar) => {
          setZarAmount(zar.toFixed(2));
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to convert currency:", err);
          setError("Failed to convert currency. Please try again.");
          setIsLoading(false);
        });
    } else {
      // Use default price for the plan
      setUsdAmount(config.usdPrice);
      convertUSDToZAR(config.usdPrice)
        .then((zar) => {
          setZarAmount(zar.toFixed(2));
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to convert currency:", err);
          setError("Failed to convert currency. Please try again.");
          setIsLoading(false);
        });
    }
  }, [searchParams, user, userLoading, router]);

  // Calculate first billing date (today - when subscription starts)
  const getBillingDate = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calculate next billing date (1 month after first billing date)
  const getNextBillingDate = (): string => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1); // 1 month from today
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Monitor form readiness - check when payment data is loaded
  useEffect(() => {
    if (isFormReady || !zarAmount) return;

    const checkFormReady = () => {
      if (!formRef.current) {
        console.log("🔍 [Payment] Form ref not available yet");
        return;
      }

      // First check if form has any inputs at all (means paymentData was loaded)
      const allInputs = formRef.current.querySelectorAll("input");
      if (allInputs.length === 0) {
        console.log(
          "🔍 [Payment] Form has no inputs yet - paymentData not loaded"
        );
        return;
      }

      const requiredFields = [
        "merchant_id",
        "merchant_key",
        "amount",
        "item_name",
        "signature",
      ];

      const fieldStatus: Record<string, boolean> = {};
      const allFieldsPresent = requiredFields.every((field) => {
        const input = formRef.current?.querySelector(`input[name="${field}"]`);
        const hasValue = input && (input as HTMLInputElement).value;
        fieldStatus[field] = !!hasValue;
        if (!hasValue) {
          console.log(`❌ [Payment] Missing field: ${field}`);
        }
        return hasValue;
      });

      if (allFieldsPresent) {
        console.log(
          "✅ [Payment] Form is ready! All fields present:",
          fieldStatus
        );
        isFormReadyRef.current = true;
        setIsFormReady(true);
        setPaymentDataLoaded(true);
      } else {
        console.log(
          "⚠️ [Payment] Form not ready yet. Field status:",
          fieldStatus
        );
        console.log(
          `📋 [Payment] Total form inputs found: ${allInputs.length}`
        );
        allInputs.forEach((input) => {
          console.log(
            `   - ${input.name}: ${
              (input as HTMLInputElement).value ? "✅" : "❌"
            }`
          );
        });
      }
    };

    let interval: NodeJS.Timeout | null = null;
    let timeout: NodeJS.Timeout | null = null;

    // Wait a bit for form to render, then check
    const initialDelay = setTimeout(() => {
      checkFormReady();

      // Check periodically until form is ready (max 15 seconds to account for API delay)
      interval = setInterval(() => {
        checkFormReady();
      }, 500);

      // Timeout after 15 seconds
      timeout = setTimeout(() => {
        if (interval) clearInterval(interval);
        if (!isFormReady) {
          console.error(
            "❌ [Payment] Form readiness check timed out after 15 seconds"
          );
          console.error(
            "   This usually means paymentData was not loaded or form fields are missing"
          );
        }
      }, 15000);
    }, 1000);

    // Cleanup
    return () => {
      clearTimeout(initialDelay);
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [isFormReady, zarAmount]);

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#8b5cf6] mx-auto mb-4" />
          <p className="text-gray-300">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 text-center">
          <div className="text-red-400 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard?tab=settings")}
            className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!zarAmount || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard?tab=settings")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your Subscription
          </h1>
          <p className="text-gray-400">
            You're subscribing to the {planName}. Complete your payment below to
            activate your subscription.
          </p>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Subscription Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Plan:</span>
              <span className="text-white font-medium">{planName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Monthly Amount:</span>
              <span className="text-white font-medium">
                ${usdAmount.toFixed(2)} USD
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Billing Cycle:</span>
              <span className="text-white font-medium">Monthly</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">First Billing Date:</span>
              <span className="text-white font-medium">{getBillingDate()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Next Billing Date:</span>
              <span className="text-white font-medium">
                {getNextBillingDate()}
              </span>
            </div>
          </div>
        </div>

        {/* PayFast Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Payment Method
          </h2>
          <p className="text-gray-400 mb-6">
            You'll be redirected to our payment gateway to complete your payment
            securely. Your subscription will be activated automatically after
            payment.
          </p>

          <PayFastForm
            formRef={formRef}
            amount={zarAmount}
            item_name={`${planName} - Monthly Subscription`}
            item_description={`${
              planConfig[planId as keyof typeof planConfig].description
            } - Recurring monthly subscription`}
            return_url={`https://www.trevnoctilla.com/dashboard`}
            cancel_url={`https://www.trevnoctilla.com/payment/cancel?plan=${planId}`}
            notify_url={`https://www.trevnoctilla.com/payment/notify`}
            // CRITICAL: Do NOT send email_address or name_first when logged in
            // These cause signature mismatch - PayFast rejects payments from merchant email
            // email_address={user.email}
            // name_first={user.email.split("@")[0]}
            custom_str1={planId}
            custom_str2={user.id.toString()}
            subscription_type="1"
            billing_date={getBillingDate()}
            recurring_amount={zarAmount}
            frequency="3"
            cycles="0"
            subscription_notify_email={true}
            subscription_notify_webhook={true}
            subscription_notify_buyer={true}
            autoSubmit={false}
            onPaymentDataLoaded={() => {
              // Store payment info in sessionStorage before redirecting to PayFast
              // This allows dashboard to trigger upgrade even if PayFast doesn't send URL params
              sessionStorage.setItem(
                "pending_payment_upgrade",
                JSON.stringify({
                  plan_id: planId,
                  plan_name: planName,
                  user_id: user.id,
                  user_email: user.email,
                  amount: zarAmount,
                  timestamp: Date.now(),
                })
              );
              console.log("✅ [Payment] Payment data loaded callback received");
              setPaymentDataLoaded(true);
              // Trigger form readiness check immediately and repeatedly until ready
              let attempts = 0;
              const maxAttempts = 20; // Check for up to 10 seconds (20 * 500ms)

              const checkInterval = setInterval(() => {
                attempts++;
                // Use ref to avoid closure issues
                if (formRef.current && !isFormReadyRef.current) {
                  const requiredFields = [
                    "merchant_id",
                    "merchant_key",
                    "amount",
                    "item_name",
                    "signature",
                  ];
                  const allFieldsPresent = requiredFields.every((field) => {
                    const input = formRef.current?.querySelector(
                      `input[name="${field}"]`
                    );
                    return input && (input as HTMLInputElement).value;
                  });

                  if (allFieldsPresent) {
                    console.log(
                      "✅ [Payment] Form ready after payment data loaded!"
                    );
                    isFormReadyRef.current = true;
                    setIsFormReady(true);
                    clearInterval(checkInterval);
                  } else if (attempts >= maxAttempts) {
                    console.error(
                      "❌ [Payment] Form readiness check timed out in callback"
                    );
                    console.error(
                      "   This means form fields are not being rendered correctly"
                    );
                    clearInterval(checkInterval);
                  } else if (attempts % 5 === 0) {
                    // Log every 5 attempts to avoid spam
                    console.log(
                      `🔍 [Payment] Checking form readiness (attempt ${attempts}/${maxAttempts})...`
                    );
                    const allInputs = formRef.current.querySelectorAll("input");
                    console.log(`   Found ${allInputs.length} form inputs`);
                  }
                } else if (isFormReadyRef.current) {
                  clearInterval(checkInterval);
                }
              }, 500);
            }}
          />

          {/* Submit Button */}
          <button
            onClick={() => {
              console.log("🖱️ [Payment] Button clicked!");
              console.log("   formRef.current:", !!formRef.current);
              console.log("   isFormReady:", isFormReady);
              console.log("   isSubmitting:", isSubmitting);

              if (formRef.current && isFormReady) {
                console.log("✅ [Payment] Submitting form...");
                setIsSubmitting(true);

                // Verify form has all fields before submitting
                const requiredFields = [
                  "merchant_id",
                  "merchant_key",
                  "amount",
                  "item_name",
                  "signature",
                ];
                const missingFields: string[] = [];
                requiredFields.forEach((field) => {
                  const input = formRef.current?.querySelector(
                    `input[name="${field}"]`
                  );
                  if (!input || !(input as HTMLInputElement).value) {
                    missingFields.push(field);
                  }
                });

                if (missingFields.length > 0) {
                  console.error(
                    "❌ [Payment] Cannot submit - missing fields:",
                    missingFields
                  );
                  setIsSubmitting(false);
                  return;
                }

                console.log("🚀 [Payment] Form submission starting...");
                console.log("   Form action:", formRef.current.action);
                formRef.current.submit();
                console.log("✅ [Payment] Form submit() called");
              } else {
                console.error("❌ [Payment] Cannot submit form:");
                console.error("   formRef.current:", !!formRef.current);
                console.error("   isFormReady:", isFormReady);
              }
            }}
            disabled={!isFormReady || isSubmitting}
            className={`w-full mt-6 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isFormReady && !isSubmitting
                ? "bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white shadow-lg hover:shadow-[#8b5cf6]/25 transform hover:scale-105"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redirecting to PayFast...</span>
              </>
            ) : !isFormReady ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Preparing payment...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Proceed to Pay</span>
              </>
            )}
          </button>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> This is a recurring subscription. You'll be
              charged monthly until you cancel. You can manage your subscription
              from your dashboard after activation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#8b5cf6] mx-auto mb-4" />
            <p className="text-gray-300">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
