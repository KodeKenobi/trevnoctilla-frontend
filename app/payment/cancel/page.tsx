"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-4">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-yellow-500 rounded-full blur-lg opacity-30"></div>
            <XCircle className="w-16 h-16 text-yellow-500 relative" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-400 mb-6">
          You cancelled the payment process. No charges were made.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="block w-full px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
          >
            Go Back
          </button>
          <Link
            href="/dashboard"
            className="block w-full px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 rounded-lg font-medium transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
