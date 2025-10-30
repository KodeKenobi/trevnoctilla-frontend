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
  const handleViewAd = () => {
    const monetagUrl = "https://otieu.com/4/10115019";
    console.log("🎯 Opening monetag link:", monetagUrl);

    // Immediately try to open the link
    try {
      // Try opening as popunder first
      let popunder = window.open(
        monetagUrl,
        "_blank",
        "width=1,height=1,left=-1000,top=-1000,noopener,noreferrer"
      );

      // If that fails, try normal popup
      if (!popunder) {
        popunder = window.open(
          monetagUrl,
          "_blank",
          "width=600,height=400,noopener,noreferrer"
        );
      }

      // If still blocked, try to open as regular link
      if (!popunder) {
        console.log("⚠️ Popup blocked, opening in same window");
        window.location.href = monetagUrl;
        // Complete after navigation
        setTimeout(() => {
          onComplete();
          onClose();
        }, 500);
        return;
      }

      // If popunder opened, focus back to main window
      setTimeout(() => {
        try {
          window.focus();
          if (popunder && !popunder.closed) {
            try {
              popunder.blur();
            } catch (e) {
              // Cross-origin, ignore
            }
          }
        } catch (e) {
          // Ignore focus errors
        }
      }, 100);

      // Mark as complete and close modal
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1000);
    } catch (error) {
      console.error("❌ Error opening link:", error);
      // Still complete to allow user to proceed
      onComplete();
      onClose();
    }
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
