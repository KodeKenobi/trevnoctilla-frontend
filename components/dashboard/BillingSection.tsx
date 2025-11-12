"use client";

import React, { useState, useEffect } from "react";
import { Check, Download } from "lucide-react";
import { convertUSDToZAR } from "@/lib/currency";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  isActive?: boolean;
  isSubscription?: boolean;
}

interface BillingHistory {
  id: string;
  invoice: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending" | "Failed";
}

interface BillingSectionProps {
  user?: {
    email?: string;
  };
}

const plans: Plan[] = [
  {
    id: "testing",
    name: "Testing",
    price: 0,
    description: "Perfect for development and testing",
    features: [
      "5 API calls/month",
      "PDF text extraction",
      "Basic image conversion",
      "QR code generation",
      "Admin dashboard access",
      "Community support",
    ],
    isActive: true,
    isSubscription: false,
  },
  {
    id: "production",
    name: "Production",
    price: 29,
    description: "For production applications",
    features: [
      "5,000 API calls/month",
      "PDF operations (merge, split, extract)",
      "Video/audio conversion",
      "Image processing",
      "QR code generation",
      "Admin dashboard access",
      "Priority support",
    ],
    isSubscription: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 49,
    description: "For large-scale applications",
    features: [
      "Unlimited API calls",
      "All file processing capabilities",
      "Enterprise client dashboard",
      "Dedicated support",
      "Custom SLAs",
      "White-label options",
    ],
    isSubscription: true,
  },
];

export function BillingSection({ user }: BillingSectionProps) {
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch billing history (mock for now)
    setTimeout(() => {
      setBillingHistory([
        {
          id: "1",
          invoice: "Testing Plan - Dec 2024",
          amount: 0,
          date: "Dec 1, 2024",
          status: "Paid",
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    // Convert USD to ZAR for PayFast payment
    if (plan.isSubscription && plan.price > 0) {
      try {
        const zarAmount = await convertUSDToZAR(plan.price);
        // Store plan info and ZAR amount for payment processing
        sessionStorage.setItem(
          "pending_subscription",
          JSON.stringify({
            planId: plan.id,
            planName: plan.name,
            usdAmount: plan.price,
            zarAmount: zarAmount,
            description: plan.description,
          })
        );
        // Redirect to payment page with converted amount
        window.location.href = `/payment?plan=${plan.id}&amount=${zarAmount}`;
      } catch (error) {
        console.error("Failed to convert currency:", error);
        // Fallback: redirect without conversion (payment page should handle it)
        window.location.href = `/payment?plan=${plan.id}&usdAmount=${plan.price}`;
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
          Plans and billing
        </h2>
        <p className="text-muted-foreground dark:text-gray-400">
          Manage your plan and billing details.
        </p>
      </div>

      {/* Subscription Plans */}
      <div>
        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
          Subscription Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`
                relative bg-card dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-lg p-6 flex flex-col
                ${
                  plan.isActive
                    ? "border-[#8b5cf6] shadow-lg shadow-[#8b5cf6]/20"
                    : "hover:border-[#3a3a3a]"
                }
              `}
            >
              {plan.isActive && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-[#8b5cf6] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-foreground dark:text-white mb-1">
                  {plan.name}
                </h4>
                <div className="flex items-baseline gap-2">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-bold text-foreground dark:text-white">
                      Free
                    </span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-foreground dark:text-white">
                        ${plan.price}
                      </span>
                      <span className="text-muted-foreground dark:text-gray-400 text-sm">
                        /month
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                  {plan.description}
                </p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#8b5cf6] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground/90 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              {!plan.isActive && plan.price > 0 && (
                <button
                  onClick={() => handleSubscribe(plan)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all mt-auto"
                >
                  Subscribe
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground dark:text-white">
            Billing history
          </h3>
          {billingHistory.length > 0 && (
            <button className="flex items-center gap-2 px-4 py-2 bg-card dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] hover:border-[#3a3a3a] text-foreground dark:text-white rounded-lg text-sm font-medium transition-colors">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>
        <div className="bg-card dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground dark:text-gray-400">
              Loading...
            </div>
          ) : billingHistory.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground dark:text-gray-400">
              No billing history available
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          className="rounded border-[#2a2a2a] bg-[#0a0a0a]"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {billingHistory.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#0a0a0a]/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-[#2a2a2a] bg-[#0a0a0a]"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {item.invoice}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          USD ${item.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {item.date}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`
                              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${
                                item.status === "Paid"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : item.status === "Pending"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }
                            `}
                          >
                            {item.status === "Paid" && (
                              <Check className="w-3 h-3 mr-1" />
                            )}
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden divide-y divide-[#2a2a2a]">
                {billingHistory.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-[#2a2a2a] bg-[#0a0a0a]"
                        />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {item.invoice}
                          </p>
                          <p className="text-sm text-white mt-1">
                            USD ${item.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            item.status === "Paid"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : item.status === "Pending"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }
                        `}
                      >
                        {item.status === "Paid" && (
                          <Check className="w-3 h-3 mr-1" />
                        )}
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
