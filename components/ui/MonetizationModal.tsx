"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, CreditCard, Download, Star, CheckCircle } from "lucide-react";

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdComplete: () => void;
  onPaymentComplete: () => void;
  fileName: string;
  fileType: string;
  downloadUrl?: string;
}

// MonetizationScript removed - now using video-ad-loader.js directly

const PaymentComponent = ({ onComplete }: { onComplete: () => void }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsProcessing(false);
    onComplete();
  };

  return (
    <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/30 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Quick Payment</h3>
        <p className="text-gray-400 text-sm">
          Support Trevnoctilla with a small contribution
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">$1.00</div>
          <div className="text-gray-400 text-sm">One-time payment</div>
        </div>

        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
            Instant download access
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
            Support development
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
            No recurring charges
          </div>
        </div>

        <motion.button
          onClick={handlePayment}
          disabled={isProcessing}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Pay $1.00
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
};

const MonetizationModal: React.FC<MonetizationModalProps> = ({
  isOpen,
  onClose,
  onAdComplete,
  onPaymentComplete,
  fileName,
  fileType,
  downloadUrl,
}) => {
  const [currentStep, setCurrentStep] = useState<"ad" | "payment" | "complete">(
    "ad"
  );
  const [showDownload, setShowDownload] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const hasCompletedRef = useRef(false);

  const handleAdComplete = useCallback(() => {
    console.log("🎬 MonetizationModal - Ad completed");
      onAdComplete();
    setCurrentStep("complete");
    setShowDownload(true);
    hasCompletedRef.current = true;
  }, [onAdComplete]);

  const handlePaymentComplete = useCallback(() => {
    console.log("💰 MonetizationModal - Payment completed");
    onPaymentComplete();
    setCurrentStep("complete");
    setShowDownload(true);
  }, [onPaymentComplete]);

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  const handleClose = () => {
    setCurrentStep("ad");
    setShowDownload(false);
    onClose();
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("ad");
      setShowDownload(false);
      setIsAdLoading(false);
      hasCompletedRef.current = false;
      
      // Load video ad system
      const videoScript = document.createElement('script');
      videoScript.src = '/video-ad-loader.js';
      videoScript.async = true;
      document.head.appendChild(videoScript);
      
      // Wire real ad completion callback
      (window as any)._fgiomte = () => {
        console.log("[Monetization] _fgiomte fired - video ad completed");
        if (!hasCompletedRef.current) {
          handleAdComplete();
        }
      };

      return () => {
        // Clean up video script when modal closes
        try {
          document.head.removeChild(videoScript);
        } catch (e) {
          console.log("[Monetization] Video script cleanup:", e);
        }
        (window as any)._fgiomte = undefined;
      };
    }
  }, [isOpen, handleAdComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
        >
          <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Download {fileName}
              </h2>
              <p className="text-gray-400 text-sm">
                Choose how to support Trevnoctilla
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
                </div>

          {/* Content */}
          <div className="space-y-6" data-modal-content>
            {currentStep === "ad" && (
              <div className="space-y-4">
                {/* Ezoic video ad loading */}
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <h3 className="text-white font-semibold mb-2">
                    Loading video ad…
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Please watch the video ad to unlock your download.
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    Ezoic Video Player - Premium video ads
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-gray-400 text-sm mb-4">Or</div>
                  <motion.button
                    onClick={() => setCurrentStep("payment")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
                  >
                    Make a quick payment instead
                  </motion.button>
                </div>
              </div>
            )}

            {currentStep === "payment" && (
              <div className="space-y-4">
                <PaymentComponent onComplete={handlePaymentComplete} />

                <div className="text-center">
                  <div className="text-gray-400 text-sm mb-4">Or</div>
                  <motion.button
                    onClick={() => setCurrentStep("ad")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
                  >
                    Watch an ad instead
                  </motion.button>
                </div>
              </div>
            )}

            {currentStep === "complete" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>

              <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Thank You!
                  </h3>
                  <p className="text-gray-400">
                    Your {fileType} file is ready for download
                  </p>
                </div>

                {showDownload && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleDownload}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center">
                      <Download className="w-6 h-6 mr-2" />
                      Download {fileName}
                    </div>
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MonetizationModal;
