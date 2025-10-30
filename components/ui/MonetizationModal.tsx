"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Play, CreditCard, Loader2 } from "lucide-react";

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void; // Called when user views ad or pays
  title?: string;
  message?: string;
}

const MonetizationModal: React.FC<MonetizationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  title = "Continue with Ad or Payment",
  message = "Choose how you'd like to proceed",
}) => {
  const [showAd, setShowAd] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adComplete, setAdComplete] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setShowAd(false);
      setAdLoading(false);
      setAdComplete(false);
      scriptLoadedRef.current = false;
    }
  }, [isOpen]);

  // Load monetag script when user clicks "View Ad"
  useEffect(() => {
    if (showAd && !scriptLoadedRef.current && adContainerRef.current) {
      setAdLoading(true);
      scriptLoadedRef.current = true;

      // Remove any existing monetag scripts
      const existingScripts = document.querySelectorAll(
        'script[src*="otieu.com"]'
      );
      existingScripts.forEach((script) => script.remove());

      // Clear container
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = "";
      }

      // Create ad container div for monetag
      const adContainer = document.createElement("div");
      adContainer.id = "monetag-ad-container";
      adContainer.setAttribute("data-zone-id", "10115019");
      adContainer.className =
        "w-full min-h-[400px] flex items-center justify-center bg-gray-900 rounded-lg";

      if (adContainerRef.current) {
        adContainerRef.current.appendChild(adContainer);
      }

      // Load monetag script - using the direct link URL
      // Direct link format: https://otieu.com/4/zone_id
      const script = document.createElement("script");
      script.src = "https://otieu.com/4/10115019";
      script.async = true;

      // Track ad loading attempts
      let adCheckInterval: NodeJS.Timeout;
      let checkCount = 0;
      const maxChecks = 15; // 15 seconds max

      script.onload = () => {
        console.log("✅ Monetag script loaded successfully");

        // Start polling to check if ad content appeared
        adCheckInterval = setInterval(() => {
          checkCount++;
          const container = document.getElementById("monetag-ad-container");

          if (container) {
            // Check for various ad indicators
            const hasIframe = container.querySelector("iframe");
            const hasImg = container.querySelector("img");
            const hasAdContent = container.innerHTML.length > 100;
            const hasChildren = container.children.length > 0;

            if (hasIframe || hasImg || (hasAdContent && hasChildren)) {
              console.log("✅ Ad content detected");
              clearInterval(adCheckInterval);
              setAdLoading(false);
              setAdComplete(true);
              // Give user time to see the ad
              setTimeout(() => {
                onComplete();
                onClose();
              }, 4000); // 4 seconds for user to view
              return;
            }
          }

          // Timeout after max checks
          if (checkCount >= maxChecks) {
            console.log("⚠️ Ad check timeout - allowing completion anyway");
            clearInterval(adCheckInterval);
            setAdLoading(false);
            // Even if ad doesn't show, allow user to continue
            // (ads might be blocked or unavailable)
            setAdComplete(true);
            setTimeout(() => {
              onComplete();
              onClose();
            }, 1000);
          }
        }, 1000); // Check every second
      };

      script.onerror = (error) => {
        // Suppress console error - ad might be blocked or unavailable
        // Allow user to continue anyway
        clearInterval(adCheckInterval);
        setAdLoading(false);
        scriptLoadedRef.current = false;
        // Don't show alert - just allow completion (ads might be blocked)
        console.log(
          "⚠️ Ad script failed to load (may be blocked or unavailable) - allowing user to continue"
        );
        setAdComplete(true);
        setTimeout(() => {
          onComplete();
          onClose();
        }, 1000);
      };

      // Append to document head or body (monetag prefers body)
      document.body.appendChild(script);
    }
  }, [showAd, onComplete, onClose]);

  const handleViewAd = () => {
    setShowAd(true);
  };

  const handlePay = () => {
    // TODO: Integrate payment processing (Stripe, PayPal, etc.)
    // For now, just complete
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] overflow-y-auto">
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
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-sm text-gray-400 mt-1">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2a2a2a] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showAd ? (
              // Initial choice screen
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* View Ad Option */}
                  <button
                    onClick={handleViewAd}
                    className="group relative p-6 bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] rounded-lg border border-[#8b5cf6]/30 hover:border-[#8b5cf6] transition-all hover:scale-105"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-white rounded-full blur-lg opacity-30"></div>
                        <div className="relative bg-white/10 p-4 rounded-full">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-white mb-1">
                          View Ad
                        </h4>
                        <p className="text-sm text-white/80">
                          Watch a short advertisement to continue
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Pay Option */}
                  <button
                    onClick={handlePay}
                    className="group relative p-6 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-lg border border-[#22c55e]/30 hover:border-[#22c55e] transition-all hover:scale-105"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-white rounded-full blur-lg opacity-30"></div>
                        <div className="relative bg-white/10 p-4 rounded-full">
                          <CreditCard className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-white mb-1">
                          Pay $1
                        </h4>
                        <p className="text-sm text-white/80">
                          Instant access, no ads
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="pt-4 border-t border-[#2a2a2a]">
                  <p className="text-xs text-gray-500 text-center">
                    By continuing, you agree to view advertisements or complete
                    payment
                  </p>
                </div>
              </div>
            ) : (
              // Ad display screen
              <div className="space-y-4">
                {adLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-[#8b5cf6] animate-spin mb-4" />
                    <p className="text-gray-400">Loading advertisement...</p>
                  </div>
                ) : adComplete ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-30"></div>
                      <div className="relative bg-green-500/10 p-4 rounded-full">
                        <svg
                          className="w-12 h-12 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <p className="text-white font-semibold mb-2">
                      Thank you for viewing the ad!
                    </p>
                    <p className="text-gray-400 text-sm">Redirecting...</p>
                  </div>
                ) : (
                  <div>
                    <div
                      ref={adContainerRef}
                      className="w-full min-h-[400px] flex items-center justify-center bg-gray-900 rounded-lg"
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonetizationModal;
