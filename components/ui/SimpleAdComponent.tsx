"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import { Play, X, CheckCircle } from "lucide-react";

interface SimpleAdComponentProps {
  onComplete: () => void;
}

const SimpleAdComponent = memo(({ onComplete }: SimpleAdComponentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adCompleted, setAdCompleted] = useState(false);
  const hasCompletedRef = useRef(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  console.log("🎬 SimpleAdComponent rendered - onComplete:", onComplete);

  const startAd = () => {
    console.log("🎬 Starting simple ad");
    setIsLoading(true);
    setIsPlaying(true);
    setAdProgress(0);
    setAdCompleted(false);
    hasCompletedRef.current = false;

    // Simulate ad loading
    setTimeout(() => {
      setIsLoading(false);

      // Start progress animation
      progressIntervalRef.current = setInterval(() => {
        setAdProgress((prev) => {
          const newProgress = prev + 2;
          if (newProgress >= 100) {
            clearInterval(progressIntervalRef.current!);
            completeAd();
            return 100;
          }
          return newProgress;
        });
      }, 100);
    }, 1000);
  };

  const completeAd = () => {
    console.log("🎬 Ad completed - calling onComplete");
    hasCompletedRef.current = true;
    setIsPlaying(false);
    setAdCompleted(true);

    // Call the completion callback
    try {
      onComplete();
      console.log("🎬 onComplete called successfully");
    } catch (error) {
      console.error("🎬 Error calling onComplete:", error);
    }
  };

  // Auto-start the ad
  useEffect(() => {
    console.log("🎬 Auto-starting ad");
    startAd();

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-500/30 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          {adCompleted ? (
            <CheckCircle className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {adCompleted ? "Ad Complete!" : "Watch Ad"}
        </h3>
        <p className="text-gray-400 text-sm">
          {adCompleted
            ? "Thank you for supporting Trevnoctilla!"
            : "Support Trevnoctilla by watching this ad"}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading ad...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Ad Content */}
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-white font-medium mb-2">
              {adCompleted ? "✓ Advertisement Complete" : "Advertisement"}
            </div>
            <div className="text-gray-400 text-sm mb-3">
              {adCompleted
                ? "You can now download your file"
                : "Please wait while the ad plays..."}
            </div>

            {/* Mock Ad Content */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-3 text-white text-sm">
              <div className="font-semibold mb-1">Sample Advertisement</div>
              <div className="text-xs opacity-90">
                This is a test ad for demonstration
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {!adCompleted && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Ad Progress</span>
                <span>{adProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${adProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          )}

          {/* Completion Message */}
          {adCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-4 bg-green-900/20 border border-green-500/30 rounded-lg"
            >
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-medium">
                Ad completed successfully!
              </p>
              <p className="text-green-300 text-sm">
                You can now download your file.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
});

SimpleAdComponent.displayName = "SimpleAdComponent";

export default SimpleAdComponent;
