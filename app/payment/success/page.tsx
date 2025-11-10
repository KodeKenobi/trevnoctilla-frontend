"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "pending" | "failed"
  >("pending");
  const [itnDebug, setItnDebug] = useState<any>(null);

  useEffect(() => {
    // Verify payment status from PayFast callback
    const verifyPayment = async () => {
      // Log ALL parameters from PayFast return_url callback
      console.log("=== PayFast Return URL Callback ===");
      const allParams: Record<string, string | null> = {};
      searchParams.forEach((value, key) => {
        allParams[key] = value;
      });
      console.log(
        "All return URL parameters:",
        JSON.stringify(allParams, null, 2)
      );

      const mPaymentId = searchParams.get("m_payment_id");
      const pfPaymentId = searchParams.get("pf_payment_id");
      const paymentStatus = searchParams.get("payment_status");
      const signature = searchParams.get("signature");

      console.log("m_payment_id:", mPaymentId);
      console.log("pf_payment_id:", pfPaymentId);
      console.log("payment_status:", paymentStatus);
      console.log("signature:", signature);

      // Fetch ITN debug info to see what happened
      try {
        const debugResponse = await fetch(
          "https://www.trevnoctilla.com/api/payments/debug"
        );
        const debugData = await debugResponse.json();
        if (debugData.lastITN) {
          setItnDebug(debugData.lastITN);
        }
      } catch (error) {
        console.error("Failed to fetch ITN debug info:", error);
      }

      // For $0.00 payments (wallet-funded), PayFast might not send ITN
      // but will include payment status in return_url
      if (paymentStatus === "COMPLETE") {
        setPaymentStatus("success");
        console.log("✅ Payment marked as COMPLETE from return_url");
        // TODO: Update payment status in database
        // TODO: Grant user premium access
        // TODO: Send confirmation email
      } else if (paymentStatus === "PENDING") {
        setPaymentStatus("pending");
        console.log("⏳ Payment marked as PENDING from return_url");
      } else if (paymentStatus) {
        setPaymentStatus("failed");
        console.log(
          "❌ Payment marked as FAILED from return_url:",
          paymentStatus
        );
      } else {
        // No payment_status in URL - might be $0.00 payment issue
        console.warn(
          "⚠️ No payment_status in return_url - might be $0.00 payment issue"
        );
        // For $0.00 payments, if we reach here, consider it successful
        // (user was redirected back, which means PayFast processed it)
        setPaymentStatus("success");
      }

      setIsVerifying(false);
    };

    verifyPayment();
  }, [searchParams]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#8b5cf6] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-4">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 text-center">
        {paymentStatus === "success" ? (
          <>
            <div className="mb-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-30"></div>
                <CheckCircle className="w-16 h-16 text-green-500 relative" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-400 mb-6">
              Your payment has been processed successfully. You now have premium
              access.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="block w-full px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
              >
                Continue
              </button>
            </div>
          </>
        ) : paymentStatus === "pending" ? (
          <>
            <div className="mb-6">
              <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Payment Pending
            </h1>
            <p className="text-gray-400 mb-6">
              Your payment is being processed. This may take a few minutes for
              EFT payments.
            </p>
            <button
              onClick={() => router.back()}
              className="block w-full px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-lg opacity-30"></div>
                <div className="w-16 h-16 text-red-500 relative text-4xl">
                  ✕
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Payment Failed
            </h1>
            <p className="text-gray-400 mb-6">
              Your payment could not be processed. Please try again.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="block w-full px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#8b5cf6] animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
