"use client";

import React from "react";
import { X, Play, CreditCard } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { API_CONFIG } from "@/lib/config";
import PayFastForm from "./PayFastForm";
import { convertUSDToZAR } from "@/lib/currency";

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void; // Called when user views ad or pays
  title?: string;
  message?: string;
  downloadUrl?: string; // URL to download after payment
  fileName?: string; // Name of file being downloaded
}

const MonetizationModal: React.FC<MonetizationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  title = "Continue with Ad or Payment",
  message = "Choose how you'd like to proceed",
  downloadUrl,
  fileName,
}) => {
  const { user } = useUser();
  const [adOpened, setAdOpened] = React.useState(false);
  const [hideWhileWaiting, setHideWhileWaiting] = React.useState(false);
  const waitingReturnRef = React.useRef(false);
  const leftOnceRef = React.useRef(false);
  const [needsManualOpen, setNeedsManualOpen] = React.useState(false);
  const [zarAmount, setZarAmount] = React.useState<string | null>(null);
  const [isLoadingRate, setIsLoadingRate] = React.useState(false);
  const [rateError, setRateError] = React.useState<string | null>(null);

  // Complete when user returns to the tab/window after viewing the ad
  React.useEffect(() => {
    if (!isOpen) return;

    const handleFocus = () => {
      if (waitingReturnRef.current && leftOnceRef.current) {
        waitingReturnRef.current = false;
        leftOnceRef.current = false;
        onComplete();
        onClose();
        setHideWhileWaiting(false);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        leftOnceRef.current = true;
      }
      if (
        document.visibilityState === "visible" &&
        waitingReturnRef.current &&
        leftOnceRef.current
      ) {
        waitingReturnRef.current = false;
        leftOnceRef.current = false;
        onComplete();
        onClose();
        setHideWhileWaiting(false);
      }
    };

    const handleBlur = () => {
      leftOnceRef.current = true;
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isOpen, onClose, onComplete]);
  const handleViewAd = () => {
    const monetagUrl = "https://otieu.com/4/10115019";
    console.log("🎯 Opening monetag link:", monetagUrl);
    try {
      // Always open as a regular tab
      let popTab = window.open(monetagUrl, "_blank", "noopener,noreferrer");
      // If blocked, prompt manual open (button)
      if (!popTab) {
        waitingReturnRef.current = true;
        setAdOpened(true);
        setNeedsManualOpen(true);
        setHideWhileWaiting(false);
        return;
      }
      waitingReturnRef.current = true;
      setAdOpened(true);
      setHideWhileWaiting(true);
    } catch (error) {
      console.error("❌ Error opening link:", error);
      // If we error, prompt manual open
      waitingReturnRef.current = true;
      setAdOpened(true);
      setNeedsManualOpen(true);
      setHideWhileWaiting(false);
    }
  };

  const handleManualOpenClick = () => {
    const monetagUrl = "https://otieu.com/4/10115019";
    window.open(monetagUrl, "_blank", "noopener,noreferrer");
    leftOnceRef.current = true;
    setHideWhileWaiting(true);
    setNeedsManualOpen(false);
  };

  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [showEmailField, setShowEmailField] = React.useState(false);
  const payFastFormRef = React.useRef<HTMLFormElement>(null);

  // Fetch exchange rate when modal opens
  React.useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setZarAmount(null);
      setRateError(null);
      setIsLoadingRate(false);
      return;
    }

    // Fetch rate when modal opens (only if not already loaded)
    if (!zarAmount && !isLoadingRate) {
      setIsLoadingRate(true);
      setRateError(null);

      convertUSDToZAR(1.0)
        .then((zar) => {
          setZarAmount(zar.toFixed(2));
          setIsLoadingRate(false);
        })
        .catch((error) => {
          console.error("Failed to fetch exchange rate:", error);
          setRateError(
            error instanceof Error
              ? error.message
              : "Failed to fetch exchange rate. Please check your internet connection and try again."
          );
          setIsLoadingRate(false);
        });
    }
  }, [isOpen, zarAmount, isLoadingRate]);

  const handlePay = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setPaymentError(null);

    // Fetch exchange rate silently if not already loaded
    let finalZarAmount = zarAmount;
    if (!finalZarAmount) {
      // Try to get from cache first (instant, no loading)
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("usd_to_zar_rate");
        if (cached) {
          try {
            const cache = JSON.parse(cached);
            finalZarAmount = cache.rate.toFixed(2);
            setZarAmount(finalZarAmount);
          } catch (e) {
            // Cache invalid, will fetch below
          }
        }
      }

      // If no cache, fetch from API (silently, no user-visible loading)
      if (!finalZarAmount) {
        try {
          const zar = await convertUSDToZAR(1.0);
          finalZarAmount = zar.toFixed(2);
          setZarAmount(finalZarAmount);
        } catch (error) {
          console.error("Failed to fetch exchange rate:", error);
          // If API fails and no cache, try expired cache as last resort
          if (typeof window !== "undefined") {
            const cached = localStorage.getItem("usd_to_zar_rate");
            if (cached) {
              try {
                const cache = JSON.parse(cached);
                finalZarAmount = cache.rate.toFixed(2);
                setZarAmount(finalZarAmount);
              } catch (e) {
                // All options exhausted - will use form default
              }
            }
          }
        }
      }
    }

    // Update form amount if needed
    if (finalZarAmount && payFastFormRef.current) {
      const amountInput = payFastFormRef.current.querySelector(
        'input[name="amount"]'
      ) as HTMLInputElement;
      if (amountInput) {
        amountInput.value = finalZarAmount;
      }
    }

    // Store the current page URL and download URL so we can return here if payment is cancelled
    // Also store download URL for success page fallback
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem("payment_return_path", currentPath);
      if (downloadUrl) {
        localStorage.setItem("payment_download_url", downloadUrl);
      }
    }

    // Submit PayFast form immediately - no visible delay
    if (payFastFormRef.current) {
      payFastFormRef.current.submit();
      // Close modal immediately
      onClose();
    } else {
      console.error("PayFast form ref is null!");
      setPaymentError("Payment form not found. Please refresh and try again.");
      setIsProcessingPayment(false);
    }
  };

  const handlePayWithEmail = (customEmail: string) => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    // Close modal before redirect
    onClose();
    // Form will auto-submit via PayFastForm component
  };

  // Test function: Log download URL and trigger download (same as View Ad - no PayFast)
  const handlePayTest = (e: React.MouseEvent) => {
    e.preventDefault();

    // Log the download URL from prop (same source View Ad uses)
    console.log("📥 [TEST] Download URL:", downloadUrl);
    console.log("📥 [TEST] File name:", fileName);

    // Just call onComplete() like View Ad does - this triggers the download in the parent component
    // The parent component (tool) handles the actual download with window.open(downloadUrl)
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100000] overflow-y-auto ${
        hideWhileWaiting ? "pointer-events-none opacity-0" : ""
      }`}
    >
      {/* Backdrop - covers everything including header */}
      <div
        className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"
        style={{ zIndex: 100000 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="flex min-h-full items-center justify-center p-4"
        style={{ zIndex: 100001, position: "relative" }}
      >
        <div
          className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: 100001 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-[#2a2a2a] rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Initial choice screen */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* View Ad Option */}
                <button
                  onClick={handleViewAd}
                  className="group relative p-4 bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] rounded-lg border border-[#8b5cf6]/30 hover:border-[#8b5cf6] transition-all hover:shadow-lg hover:shadow-[#8b5cf6]/20 h-full"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="bg-white/20 p-2.5 rounded-lg">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-base font-medium text-white mb-0.5">
                        View Ad
                      </h4>
                      <p className="text-xs text-white/70">
                        Watch a short advertisement
                      </p>
                    </div>
                  </div>
                </button>

                {/* Pay Option */}
                <div className="flex flex-col">
                  {showEmailField && (
                    <div className="mb-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <label
                        htmlFor="payment-email"
                        className="block text-xs font-medium text-yellow-400 mb-1.5"
                      >
                        Alternative Payment Email
                      </label>
                      <input
                        id="payment-email"
                        type="email"
                        defaultValue={user?.email || ""}
                        placeholder="Enter a different email"
                        className="w-full px-3 py-1.5 text-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                        disabled={isProcessingPayment}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isProcessingPayment) {
                            const email = (e.target as HTMLInputElement).value;
                            if (email && email.includes("@")) {
                              handlePayWithEmail(email);
                            }
                          }
                        }}
                      />
                      <p className="mt-1 text-xs text-yellow-500/70">
                        Your account email matches the merchant account. Use a
                        different email.
                      </p>
                    </div>
                  )}
                  <PayFastForm
                    amount={zarAmount || "1.00"}
                    item_name="Premium Access"
                    item_description="Unlock premium features and remove ads"
                    return_url={API_CONFIG.PAYFAST.RETURN_URL}
                    cancel_url={API_CONFIG.PAYFAST.CANCEL_URL}
                    notify_url={API_CONFIG.PAYFAST.NOTIFY_URL}
                    custom_str1={downloadUrl || ""} // Pass download URL so it's available after payment
                    custom_str2={window.location.href} // Pass current page URL for return
                    formRef={payFastFormRef}
                  />
                  <button
                    onClick={handlePayTest}
                    disabled={isProcessingPayment}
                    className="w-full group relative p-4 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-lg border border-[#22c55e]/30 hover:border-[#22c55e] transition-all hover:shadow-lg hover:shadow-[#22c55e]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="bg-white/20 p-2.5 rounded-lg">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-base font-medium text-white mb-0.5">
                          Pay $1
                        </h4>
                        <p className="text-xs text-white/70">
                          Instant access, no ads
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
              {paymentError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
                  <p className="text-red-400 font-semibold mb-2">
                    Payment Error
                  </p>
                  <p className="text-red-300 text-sm">{paymentError}</p>
                  <button
                    onClick={() => setPaymentError(null)}
                    className="mt-3 inline-block px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}
              {needsManualOpen && (
                <div className="rounded-lg border border-[#2a2a2a] bg-[#111] p-4 text-center">
                  <p className="text-white font-semibold mb-2">
                    Your browser blocked the ad popunder
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    Click below to open the ad in a new tab. Return here
                    afterwards to continue your download.
                  </p>
                  <button
                    onClick={handleManualOpenClick}
                    className="inline-block px-5 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
                  >
                    Open Ad in New Tab
                  </button>
                </div>
              )}
              <div className="pt-3 border-t border-[#2a2a2a]">
                <p className="text-xs text-gray-500 text-center">
                  By continuing, you agree to view advertisements or complete
                  payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonetizationModal;
