"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Star,
  Gift,
  Crown,
  Award,
  TrendingUp,
  Coins,
  X,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";

export type AchievementType = "payment" | "ad_view" | "upgrade";

interface SuccessGamificationProps {
  isOpen: boolean;
  onClose: () => void;
  achievementType: AchievementType;
  title?: string;
  message?: string;
  points?: number;
  tier?: string;
  apiCalls?: string;
  streak?: number;
  duration?: number;
}

// Eye icon component (for ad_view) - must be defined before achievementConfig
const Eye = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const achievementConfig = {
  payment: {
    icon: Coins,
    color: "from-yellow-400 via-orange-500 to-red-500",
    bgGradient: "from-yellow-500/20 via-orange-500/20 to-red-500/20",
    borderColor: "border-yellow-400/50",
    emoji: "💰",
    defaultTitle: "Payment Successful!",
    defaultMessage:
      "Your Production Plan subscription is now active! You now have 5,000 API calls per month, priority support, and access to all premium features including PDF operations, video/audio conversion, and image processing.",
  },
  ad_view: {
    icon: Eye,
    color: "from-blue-400 via-purple-500 to-pink-500",
    bgGradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20",
    borderColor: "border-blue-400/50",
    emoji: "👁️",
    defaultTitle: "Ad Viewed - Reward Unlocked!",
    defaultMessage:
      "Thank you for supporting us! You've earned 25 bonus credits and 5 additional API calls. Use them for PDF conversions, image processing, or save them for later.",
  },
  upgrade: {
    icon: Crown,
    color: "from-amber-400 via-yellow-500 to-orange-500",
    bgGradient: "from-amber-500/20 via-yellow-500/20 to-orange-500/20",
    borderColor: "border-amber-400/50",
    emoji: "👑",
    defaultTitle: "Subscription Upgraded!",
    defaultMessage:
      "Welcome to Enterprise! You now have unlimited API calls, dedicated support, custom SLAs, white-label options, and access to all enterprise features. Your account has been upgraded successfully.",
  },
};

export function SuccessGamification({
  isOpen,
  onClose,
  achievementType,
  title,
  message,
  points = 100,
  tier,
  apiCalls,
  streak = 0,
  duration = 5000,
}: SuccessGamificationProps) {
  const [showParticles, setShowParticles] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const particleIdRef = useRef(0);

  const config = achievementConfig[achievementType];
  const Icon = config.icon;

  useEffect(() => {
    if (isOpen) {
      setShowParticles(true);

      // Generate floating particles
      const generateParticles = () => {
        const newParticles = Array.from({ length: 20 }, (_, i) => ({
          id: particleIdRef.current++,
          x: Math.random() * 100,
          y: Math.random() * 100,
        }));
        setParticles(newParticles);
      };

      generateParticles();
      const particleInterval = setInterval(generateParticles, 2000);

      // Auto-close after duration
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => {
        clearInterval(particleInterval);
        clearTimeout(timer);
      };
    } else {
      setShowParticles(false);
      setParticles([]);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8,
              }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-2xl max-h-[90vh] mx-auto my-auto p-1 rounded-3xl bg-gradient-to-br ${config.bgGradient} border-2 ${config.borderColor} shadow-2xl overflow-hidden overflow-y-auto`}
            >
              {/* Animated Background Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1],
                }}
                style={{ willChange: "transform, opacity" }}
                className={`absolute inset-0 bg-gradient-to-br ${config.color} blur-3xl -z-10`}
              />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Content */}
              <div className="relative bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl p-6 text-center">
                {/* Floating Particles */}
                {showParticles && (
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    {particles.map((particle) => (
                      <motion.div
                        key={particle.id}
                        initial={{
                          x: `${particle.x}%`,
                          y: `${particle.y}%`,
                          scale: 0,
                          opacity: 0,
                        }}
                        animate={{
                          y: [`${particle.y}%`, `${particle.y - 20}%`],
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: [0.4, 0, 0.6, 1],
                        }}
                        style={{ willChange: "transform, opacity" }}
                        className="absolute"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Main Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    mass: 0.7,
                    delay: 0.1,
                  }}
                  className="relative mx-auto mb-4 w-20 h-20"
                >
                  {/* Glowing Ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.color} opacity-20 blur-xl`}
                  />

                  {/* Icon Container */}
                  <div
                    className={`relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br ${config.color} shadow-2xl`}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: [0.4, 0, 0.6, 1],
                      }}
                      style={{ willChange: "transform" }}
                    >
                      <Icon
                        className="w-10 h-10 text-white"
                        strokeWidth={2.5}
                      />
                    </motion.div>

                    {/* Sparkle Effects */}
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.4,
                          ease: [0.4, 0, 0.6, 1],
                        }}
                        className="absolute"
                        style={{
                          top: `${50 + 60 * Math.cos((i * Math.PI) / 2)}%`,
                          left: `${50 + 60 * Math.sin((i * Math.PI) / 2)}%`,
                          willChange: "transform, opacity",
                        }}
                      >
                        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Emoji */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.2,
                  }}
                  className="text-3xl mb-2"
                >
                  {config.emoji}
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, ease: "easeOut" }}
                  className={`text-2xl font-bold mb-2 bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}
                >
                  {title || config.defaultTitle}
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, ease: "easeOut" }}
                  className="text-gray-300 mb-4 text-sm"
                >
                  {message || config.defaultMessage}
                </motion.p>

                {/* Stats Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, ease: "easeOut" }}
                  className="grid grid-cols-2 gap-4 mb-4"
                >
                  {/* Credits */}
                  <div className="bg-white/5 rounded-xl p-5 backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center">
                    <Gift className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                    <div className="text-2xl font-bold text-white mb-1">
                      {points}
                    </div>
                    <div className="text-xs text-gray-400">Credits</div>
                  </div>

                  {/* Tier */}
                  {tier && (
                    <div className="bg-white/5 rounded-xl p-5 backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center">
                      <Crown className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                      <div className="text-xl font-bold text-white text-center px-2">
                        {tier}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Tier</div>
                    </div>
                  )}
                </motion.div>

                {/* API Calls - Full Width */}
                {apiCalls && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, ease: "easeOut" }}
                    className="bg-white/5 rounded-xl p-5 backdrop-blur-sm border border-white/10 mb-4 flex flex-col items-center justify-center"
                  >
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                    <div className="text-xl font-bold text-white text-center px-4">
                      {apiCalls}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">API Calls</div>
                  </motion.div>
                )}

                {/* Action Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, ease: "easeOut" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={`w-full py-3 px-6 rounded-xl bg-gradient-to-r ${config.color} text-white font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Continue
                </motion.button>

                {/* Floating Badges */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute top-4 left-4"
                >
                  <Award className="w-8 h-8 text-yellow-400" />
                </motion.div>

                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute bottom-4 right-4"
                >
                  <PartyPopper className="w-8 h-8 text-pink-400" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
