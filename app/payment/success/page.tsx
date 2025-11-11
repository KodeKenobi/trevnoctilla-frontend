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
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [returnPath, setReturnPath] = useState<string | null>(null);
  const [isSubscription, setIsSubscription] = useState(false);
  const [isDownloadPayment, setIsDownloadPayment] = useState(false);

  // Helper function to get download URL from anywhere
  const getDownloadUrl = (): string | null => {
    if (downloadUrl) return downloadUrl;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("payment_download_url");
      if (stored && stored.trim().startsWith("http")) return stored;
      // Check recent downloads
      const recent = JSON.parse(
        localStorage.getItem("recent_downloads") || "[]"
      );
      if (recent.length > 0) {
        const mostRecent = recent[0];
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (mostRecent.timestamp > oneDayAgo && mostRecent.url) {
          return mostRecent.url;
        }
      }
    }
    return null;
  };

  // Check localStorage for download URL IMMEDIATELY on page load
  // This is critical because PayFast may not return parameters in the URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if download URL was stored before payment
      const storedDownloadUrl = localStorage.getItem("payment_download_url");
      if (storedDownloadUrl && storedDownloadUrl.trim()) {
        setDownloadUrl(storedDownloadUrl);
        setIsDownloadPayment(true);
        setPaymentStatus("success");
        console.log(
          "✅ Found download URL in localStorage:",
          storedDownloadUrl
        );
        // Don't clear it - keep it for later access
      }

      // Check for return path
      const storedReturnPath = localStorage.getItem("payment_return_path");
      if (storedReturnPath) {
        setReturnPath(storedReturnPath);
      }

      // Check for recent downloads (in case user closed modal before downloading)
      // This will be updated when payment data is loaded, but check here as fallback
      if (!storedDownloadUrl || !storedDownloadUrl.trim()) {
        const recentDownloads = JSON.parse(
          localStorage.getItem("recent_downloads") || "[]"
        );
        if (recentDownloads.length > 0) {
          // Show most recent download if available
          const mostRecent = recentDownloads[0];
          // Only show if it's recent (within last 24 hours)
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          if (mostRecent.timestamp > oneDayAgo && mostRecent.url) {
            setDownloadUrl(mostRecent.url);
            setIsDownloadPayment(true);
            setPaymentStatus("success");
            console.log(
              "✅ Found download URL in recent downloads:",
              mostRecent.url
            );
          }
        }
      }
    }
  }, []);

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
      const amount = searchParams.get("amount");
      const itemName = searchParams.get("item_name");
      const subscriptionType = searchParams.get("subscription_type");

      // Get download URL from custom_str1 (stored by MonetizationModal)
      const urlFromParams = searchParams.get("custom_str1");
      const pathFromParams = searchParams.get("custom_str2");

      // Determine if this is a $1 download payment or subscription
      // $1 payments: amount ~= 1.00, no subscription_type, downloadUrl in custom_str1
      // Subscriptions: has subscription_type, or item_name contains "Subscription"
      const paymentIsSubscription =
        !!subscriptionType ||
        (itemName?.toLowerCase().includes("subscription") ?? false);

      // Check for download URL from params OR localStorage
      const storedDownloadUrl =
        typeof window !== "undefined"
          ? localStorage.getItem("payment_download_url")
          : null;
      const hasDownloadUrl =
        urlFromParams?.startsWith("http") ||
        storedDownloadUrl?.startsWith("http");

      // If there's a download URL, it's ALWAYS a download payment (unless it's a subscription)
      // Also check if amount is around $1 (download payment)
      const amountNum = amount ? parseFloat(amount) : null;
      const isOneDollarPayment = amountNum
        ? amountNum >= 0.99 && amountNum <= 1.01
        : false;

      const paymentIsDownload =
        !paymentIsSubscription && (!!hasDownloadUrl || isOneDollarPayment);

      setIsSubscription(!!paymentIsSubscription);
      setIsDownloadPayment(!!paymentIsDownload);

      // Store in state for use in UI
      // Use download URL from params if available, otherwise use localStorage
      const finalDownloadUrl = urlFromParams?.startsWith("http")
        ? urlFromParams
        : storedDownloadUrl?.startsWith("http")
        ? storedDownloadUrl
        : null;

      if (finalDownloadUrl) {
        setDownloadUrl(finalDownloadUrl);
        // Store download URL with payment ID for later access
        if (mPaymentId && typeof window !== "undefined") {
          const downloadData = {
            url: finalDownloadUrl,
            paymentId: mPaymentId,
            timestamp: Date.now(),
            itemName: itemName || "File Download",
          };
          localStorage.setItem(
            `download_${mPaymentId}`,
            JSON.stringify(downloadData)
          );
          // Also store in a list of recent downloads
          const recentDownloads = JSON.parse(
            localStorage.getItem("recent_downloads") || "[]"
          );
          recentDownloads.unshift(downloadData);
          // Keep only last 10 downloads
          const limitedDownloads = recentDownloads.slice(0, 10);
          localStorage.setItem(
            "recent_downloads",
            JSON.stringify(limitedDownloads)
          );
        }
      }
      if (pathFromParams) setReturnPath(pathFromParams);

      console.log("m_payment_id:", mPaymentId);
      console.log("pf_payment_id:", pfPaymentId);
      console.log("payment_status:", paymentStatus);
      console.log("signature:", signature);
      console.log("download_url:", downloadUrl);
      console.log("return_path:", returnPath);

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
        // Don't auto-download - let user click the button for better UX and to avoid popup blockers

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
        // No payment_status in URL - PayFast sometimes doesn't return params
        console.warn(
          "⚠️ No payment_status in return_url - PayFast may not have returned parameters"
        );
        // If user reached success page, payment likely succeeded
        // Check if we have download URL in localStorage to confirm it's a $1 payment
        if (typeof window !== "undefined") {
          const storedDownloadUrl = localStorage.getItem(
            "payment_download_url"
          );
          if (storedDownloadUrl && storedDownloadUrl.trim()) {
            // User paid $1 and we have download URL - mark as success
            setPaymentStatus("success");
            if (!downloadUrl) {
              setDownloadUrl(storedDownloadUrl);
              setIsDownloadPayment(true);
            }
          } else {
            // Check recent downloads as fallback
            const recentDownloads = JSON.parse(
              localStorage.getItem("recent_downloads") || "[]"
            );
            if (recentDownloads.length > 0) {
              const mostRecent = recentDownloads[0];
              const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
              if (mostRecent.timestamp > oneDayAgo && mostRecent.url) {
                setPaymentStatus("success");
                if (!downloadUrl) {
                  setDownloadUrl(mostRecent.url);
                  setIsDownloadPayment(true);
                }
              } else {
                setPaymentStatus("success"); // Default to success if redirected here
              }
            } else {
              setPaymentStatus("success"); // Default to success if redirected here
            }
          }
        } else {
          setPaymentStatus("success"); // Default to success if redirected here
        }
      }

      // ALWAYS check localStorage again after processing (in case it wasn't set initially)
      // This ensures we find the download URL even if PayFast doesn't return it
      if (typeof window !== "undefined" && !downloadUrl) {
        const storedDownloadUrl = localStorage.getItem("payment_download_url");
        if (storedDownloadUrl && storedDownloadUrl.trim()) {
          setDownloadUrl(storedDownloadUrl);
          setIsDownloadPayment(true);
        } else {
          // Check recent downloads one more time
          const recentDownloads = JSON.parse(
            localStorage.getItem("recent_downloads") || "[]"
          );
          if (recentDownloads.length > 0) {
            const mostRecent = recentDownloads[0];
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            if (mostRecent.timestamp > oneDayAgo && mostRecent.url) {
              setDownloadUrl(mostRecent.url);
              setIsDownloadPayment(true);
            }
          }
        }
      }

      setIsVerifying(false);
    };

    verifyPayment();
  }, [searchParams]);

  // Handle download - triggers file save dialog
  const handleDownload = () => {
    const url = getDownloadUrl();
    if (url) {
      // Create anchor element to trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = ""; // Let browser determine filename
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Also open in new tab as fallback
      window.open(url, "_blank");
    }
  };

  // Handle close - return to where user was (not PayFast)
  const handleClose = () => {
    if (returnPath) {
      router.push(returnPath);
    } else {
      // Fallback to home if no return path
      router.push("/");
    }
  };

  if (isVerifying) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#8b5cf6] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop - blocks all interaction with website */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />

      {/* Modal Content - centered overlay */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="max-w-md w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 text-center shadow-2xl pointer-events-auto">
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
                {(() => {
                  const url = getDownloadUrl();
                  if (url && !isSubscription) {
                    return "Your payment has been processed successfully. Click the button below to download your file.";
                  }
                  if (isSubscription) {
                    return "Your subscription has been activated successfully. You now have premium access.";
                  }
                  return "Your payment has been processed successfully.";
                })()}
              </p>
              <div className="space-y-3">
                {(() => {
                  const url = getDownloadUrl();
                  // ALWAYS show download button if URL exists and it's not a subscription
                  if (url && !isSubscription) {
                    return (
                      <>
                        <button
                          onClick={handleDownload}
                          className="block w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-lg font-medium transition-all shadow-lg"
                        >
                          Download File
                        </button>
                        <button
                          onClick={handleClose}
                          className="block w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                        >
                          Close
                        </button>
                      </>
                    );
                  }
                  // For subscriptions or other payments, show standard button
                  return (
                    <button
                      onClick={() => {
                        if (isSubscription) {
                          router.push("/dashboard");
                        } else {
                          handleClose();
                        }
                      }}
                      className="block w-full px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
                    >
                      {isSubscription ? "Go to Dashboard" : "Close"}
                    </button>
                  );
                })()}
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
                onClick={handleClose}
                className="block w-full px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
              >
                Close
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
                  onClick={handleClose}
                  className="block w-full px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
          <div className="fixed inset-0 z-[101] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#8b5cf6] animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        </>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
