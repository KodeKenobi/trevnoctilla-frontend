"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Key,
  Activity,
  TrendingUp,
  Server,
  Database,
  BarChart3,
  Settings,
  Zap,
  Shield,
  CheckCircle,
  AlertCircle,
  Send,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { getApiUrl, getAuthHeaders } from "../../lib/config";

interface EnterpriseStats {
  monthlyCalls: number;
  monthlyLimit: number;
  successRate: number;
  activeKeys: number;
  totalApiCalls: number;
  dataProcessed: number;
  avgResponseTime: number;
}

export default function EnterpriseDashboard() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<EnterpriseStats>({
    monthlyCalls: 0,
    monthlyLimit: -1, // Unlimited for enterprise
    successRate: 0,
    activeKeys: 0,
    totalApiCalls: 0,
    dataProcessed: 0,
    avgResponseTime: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not enterprise tier
  useEffect(() => {
    // Only check after user is loaded
    if (!userLoading) {
      // If no user at all, redirect to login
      if (!user) {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          router.push("/auth/login");
          return;
        }
        // If there's a token but no user yet, wait a bit more
        return;
      }

      // User is loaded, check enterprise status
      const checkEnterpriseStatus = async () => {
        try {
          const token = localStorage.getItem("auth_token");
          if (!token) {
            router.push("/auth/login");
            return;
          }

          const usageResponse = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_BASE_URL ||
              "https://web-production-737b.up.railway.app"
            }/api/client/usage`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            const isEnterprise =
              usageData.subscription_tier?.toLowerCase() === "enterprise" ||
              usageData.monthly?.limit === -1 ||
              (usageData.monthly?.limit && usageData.monthly.limit >= 100000);

            if (!isEnterprise) {
              // Not enterprise, redirect to regular dashboard
              router.push("/dashboard");
              return;
            }
          } else {
            // If usage check fails, still allow access if user has enterprise subscription_tier
            const userIsEnterprise =
              user.subscription_tier?.toLowerCase() === "enterprise" ||
              user.monthly_call_limit === -1 ||
              (user.monthly_call_limit && user.monthly_call_limit >= 100000);

            if (!userIsEnterprise) {
              router.push("/dashboard");
            }
          }
        } catch (error) {
          // On error, check user object as fallback
          const userIsEnterprise =
            user.subscription_tier?.toLowerCase() === "enterprise" ||
            user.monthly_call_limit === -1 ||
            (user.monthly_call_limit && user.monthly_call_limit >= 100000);

          if (!userIsEnterprise) {
            router.push("/dashboard");
          }
        }
      };

      checkEnterpriseStatus();
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
      fetchEnterpriseData();
    }
  }, [user]);

  const fetchEnterpriseData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch usage stats
      const usageResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "https://web-production-737b.up.railway.app"
        }/api/client/usage?days=30`,
        {
          headers: getAuthHeaders(token),
        }
      );

      // Fetch API keys
      const keysResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "https://web-production-737b.up.railway.app"
        }/api/client/keys`,
        {
          headers: getAuthHeaders(token),
        }
      );

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        if (usageData.summary) {
          setStats({
            monthlyCalls: usageData.summary.recent_calls || 0,
            monthlyLimit: usageData.monthly?.limit || -1,
            successRate: usageData.summary.success_rate || 0,
            activeKeys: apiKeys.length,
            totalApiCalls: usageData.summary.total_calls || 0,
            dataProcessed:
              usageData.recent_logs?.reduce(
                (sum: number, log: any) => sum + (log.file_size || 0),
                0
              ) || 0,
            avgResponseTime:
              usageData.recent_logs?.length > 0
                ? usageData.recent_logs.reduce(
                    (sum: number, log: any) =>
                      sum + (log.processing_time || 0) * 1000,
                    0
                  ) / usageData.recent_logs.length
                : 0,
          });
        }

        if (usageData.recent_logs) {
          setActivities(
            usageData.recent_logs.map((log: any) => ({
              id: log.id?.toString() || `${log.timestamp}-${Math.random()}`,
              timestamp: log.timestamp,
              endpoint: log.endpoint,
              status:
                log.status_code >= 200 && log.status_code < 300
                  ? "success"
                  : "error",
              fileSize: log.file_size || 0,
              responseTime: log.processing_time
                ? Math.round(log.processing_time * 1000)
                : 0,
            }))
          );
        }
      }

      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(keysData);
        setStats((prev) => ({ ...prev, activeKeys: keysData.length }));
      }

      setLoading(false);
    } catch (error) {
      
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    changeType = "neutral",
    color = "purple",
    href,
  }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    color?: "purple" | "blue" | "green" | "red" | "yellow";
    href?: string;
  }) => {
    const colorClasses = {
      purple: "from-purple-500 to-pink-500",
      blue: "from-blue-500 to-cyan-500",
      green: "from-green-500 to-emerald-500",
      red: "from-red-500 to-pink-500",
      yellow: "from-yellow-500 to-orange-500",
    };

    const content = (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 overflow-hidden shadow-lg rounded-xl hover:bg-gray-800/70 transition-all duration-300 group">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center text-center md:text-left md:justify-between">
            <div className="flex-1 mb-4 md:mb-0">
              <p className="text-sm font-medium text-gray-300 mb-2">{title}</p>
              <p className="text-3xl font-bold text-white">{value}</p>
              {change && (
                <div className="mt-2">
                  <div
                    className={`text-sm ${
                      changeType === "positive"
                        ? "text-green-400"
                        : changeType === "negative"
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {change}
                  </div>
                </div>
              )}
            </div>
            <div
              className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]} opacity-80 group-hover:opacity-100 transition-opacity mx-auto md:mx-0`}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    );

    if (href) {
      return (
        <Link
          href={href}
          className="block hover:scale-105 transition-transform"
        >
          {content}
        </Link>
      );
    }

    return content;
  };

  // Show loading state while checking authentication
  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading enterprise dashboard...</p>
        </div>
      </div>
    );
  }

  // Only show access denied if we're sure user is not logged in
  // (after loading is complete and there's no user and no token)
  if (!user) {
    const hasToken = typeof window !== "undefined" && localStorage.getItem("auth_token");
    
    // If there's a token, keep loading (user context might still be loading)
    if (hasToken) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Authenticating...</p>
          </div>
        </div>
      );
    }

    // No token and no user - show access denied
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">
            You must be logged in to access this page.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 page-content">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Enterprise Dashboard
              </h1>
              <p className="text-gray-300 text-lg">
                Unlimited API access and premium features for your team
              </p>
            </div>
            <div className="flex items-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Enterprise Plan Active</span>
            </div>
          </div>

          {/* Quick Overview Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Campaigns Card */}
            <Link
              href="/campaigns"
              className="block hover:scale-105 transition-transform"
            >
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all shadow-lg h-full">
                <div className="flex items-center justify-between mb-4">
                  <Send className="w-8 h-8 text-purple-400" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Campaigns</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Automate outreach and contact form submissions
                </p>
                <div className="text-2xl font-bold text-purple-300">
                  Unlimited
                </div>
              </div>
            </Link>

            {/* Team Management Card */}
            <Link
              href="/enterprise/team"
              className="block hover:scale-105 transition-transform"
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition-all shadow-lg h-full">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-400" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Team</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Invite and manage your team members
                </p>
                <div className="text-sm font-medium text-blue-300">
                  Add unlimited members
                </div>
              </div>
            </Link>

            {/* API Access Card */}
            <Link
              href="/dashboard?tab=settings&section=keys"
              className="block hover:scale-105 transition-transform"
            >
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all shadow-lg h-full">
                <div className="flex items-center justify-between mb-4">
                  <Key className="w-8 h-8 text-green-400" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">API Keys</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Manage your API keys and access tokens
                </p>
                <div className="text-sm font-medium text-green-300">
                  {stats.activeKeys} {stats.activeKeys === 1 ? 'key' : 'keys'} active
                </div>
              </div>
            </Link>
          </div>

          {/* Enterprise Features */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl">
            <div className="px-6 py-6">
              <h3 className="text-xl font-semibold text-white mb-6">
                Your Enterprise Benefits
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <CheckCircle className="h-6 w-6 text-green-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">
                    Unlimited API Calls
                  </h4>
                  <p className="text-sm text-gray-400">
                    No monthly limits on API usage
                  </p>
                </div>
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <CheckCircle className="h-6 w-6 text-green-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">
                    Unlimited Campaigns
                  </h4>
                  <p className="text-sm text-gray-400">
                    Run unlimited outreach campaigns
                  </p>
                </div>
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <CheckCircle className="h-6 w-6 text-green-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">
                    Team Collaboration
                  </h4>
                  <p className="text-sm text-gray-400">
                    Add unlimited team members
                  </p>
                </div>
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <CheckCircle className="h-6 w-6 text-green-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">
                    Priority Support
                  </h4>
                  <p className="text-sm text-gray-400">
                    Dedicated support channel
                  </p>
                </div>
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <CheckCircle className="h-6 w-6 text-green-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">
                    All API Endpoints
                  </h4>
                  <p className="text-sm text-gray-400">
                    Access to all available endpoints
                  </p>
                </div>
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <CheckCircle className="h-6 w-6 text-green-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">
                    99.9% SLA Guarantee
                  </h4>
                  <p className="text-sm text-gray-400">
                    Uptime guarantee for your business
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl">
            <div className="px-6 py-6">
              <h3 className="text-xl font-semibold text-white mb-6">
                Resources & Documentation
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link
                  href="/api-docs"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <Settings className="h-6 w-6 text-blue-400 group-hover:text-blue-300" />
                  <span className="text-white font-medium">API Documentation</span>
                </Link>
                <Link
                  href="/dashboard?tab=settings"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <Settings className="h-6 w-6 text-purple-400 group-hover:text-purple-300" />
                  <span className="text-white font-medium">Settings</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <BarChart3 className="h-6 w-6 text-green-400 group-hover:text-green-300" />
                  <span className="text-white font-medium">Usage Dashboard</span>
                </Link>
                <Link
                  href="/enterprise/team"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <Users className="h-6 w-6 text-yellow-400 group-hover:text-yellow-300" />
                  <span className="text-white font-medium">Team Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
