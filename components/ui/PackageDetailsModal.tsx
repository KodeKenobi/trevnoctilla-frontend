"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

interface Plan {
  name: string;
  price: string;
  usdAmount: number;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  isSubscription: boolean;
}

interface PackageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
}

const PackageDetailsModal: React.FC<PackageDetailsModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  const router = useRouter();
  const { user } = useUser();

  const handleSubscribe = () => {
    if (!plan) return;

    // Close modal first
    onClose();

    // If user is not logged in, redirect to auth
    if (!user) {
      // Store the plan info in sessionStorage to redirect after login
      sessionStorage.setItem(
        "pending_subscription",
        JSON.stringify({
          planName: plan.name,
          isSubscription: plan.isSubscription,
          usdAmount: plan.usdAmount,
        })
      );

      // Redirect to register page (they can switch to login if needed)
      router.push("/auth/register");
      return;
    }

    // If user is logged in and it's a subscription, go to dashboard settings
    if (plan.isSubscription) {
      router.push("/dashboard?tab=settings");
      return;
    }

    // If it's the free testing plan, go to dashboard
    if (plan.name === "Testing") {
      router.push("/dashboard");
      return;
    }
  };

  if (!plan) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="max-w-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {plan.name} Plan
                  </h2>
                  {plan.popular && (
                    <span className="inline-block mt-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="text-5xl font-bold text-white mb-2">
                    {plan.price}
                  </div>
                  <p className="text-gray-400">{plan.description}</p>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    What's Included:
                  </h3>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={`${plan.name}-feature-${idx}`}
                        className="flex items-start text-gray-300"
                      >
                        <Check className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Additional Info */}
                {plan.isSubscription && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <p className="text-cyan-300 text-sm">
                      <strong>Subscription Details:</strong> This is a monthly
                      subscription that will automatically renew. You can cancel
                      anytime from your dashboard.
                    </p>
                  </div>
                )}

                {plan.name === "Testing" && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-300 text-sm">
                      <strong>Free Forever:</strong> Perfect for development and
                      testing. No credit card required. Get started immediately!
                    </p>
                  </div>
                )}

                {/* CTA Button */}
                <div className="pt-4">
                  <motion.button
                    onClick={handleSubscribe}
                    className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 ${
                      plan.popular
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                        : plan.name === "Testing"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>
                      {user
                        ? plan.isSubscription
                          ? "Proceed to Billing"
                          : "Go to Dashboard"
                        : plan.cta}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  {!user && (
                    <p className="text-center text-gray-400 text-sm mt-3">
                      You'll be asked to sign in or create an account first
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PackageDetailsModal;
