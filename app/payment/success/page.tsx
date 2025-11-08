"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "pending" | "failed"
  >("pending");

  useEffect(() => {
    // Verify payment status from PayFast callback
    const verifyPayment = async () => {
      const mPaymentId = searchParams.get("m_payment_id");
      const pfPaymentId = searchParams.get("pf_payment_id");
      const paymentStatus = searchParams.get("payment_status");

      if (paymentStatus === "COMPLETE") {
        setPaymentStatus("success");
        // TODO: Update payment status in your database
        // TODO: Grant user premium access
        // TODO: Send confirmation email
      } else if (paymentStatus === "PENDING") {
        setPaymentStatus("pending");
      } else {
        setPaymentStatus("failed");
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
              <Link
                href="/dashboard"
                className="block w-full px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => router.back()}
                className="block w-full px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 rounded-lg font-medium transition-all"
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
            <Link
              href="/dashboard"
              className="block w-full px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
            >
              Go to Dashboard
            </Link>
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
              <Link
                href="/dashboard"
                className="block w-full px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 rounded-lg font-medium transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#8b5cf6] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
