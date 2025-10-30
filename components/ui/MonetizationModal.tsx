"use client";

import React from "react";
import { X, Play, CreditCard } from "lucide-react";

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
  const [adOpened, setAdOpened] = React.useState(false);
  const [hideWhileWaiting, setHideWhileWaiting] = React.useState(false);
  const waitingReturnRef = React.useRef(false);
  const leftOnceRef = React.useRef(false);
  const [needsManualOpen, setNeedsManualOpen] = React.useState(false);

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
      if (document.visibilityState === "visible" && waitingReturnRef.current && leftOnceRef.current) {
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

  const handlePay = () => {
    // TODO: Integrate payment processing (Stripe, PayPal, etc.)
    // For now, just complete
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
            {/* Initial choice screen */}
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
              {needsManualOpen && (
                <div className="rounded-lg border border-[#2a2a2a] bg-[#111] p-4 text-center">
                  <p className="text-white font-semibold mb-2">Your browser blocked the ad popunder</p>
                  <p className="text-gray-400 text-sm mb-4">Click below to open the ad in a new tab. Return here afterwards to continue your download.</p>
                  <button
                    onClick={handleManualOpenClick}
                    className="inline-block px-5 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
                  >
                    Open Ad in New Tab
                  </button>
                </div>
              )}
              <div className="pt-4 border-t border-[#2a2a2a]">
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
