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
    if (!userLoading && user) {
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
              router.push("/dashboard");
              return;
            }
          }
        } catch (error) {
          
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

  if (!user) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Enterprise Dashboard
              </h1>
              <p className="text-gray-300 text-lg">
                Unlimited API access and advanced features
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Enterprise Active</span>
              </div>
              <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                <span className="text-sm font-medium text-purple-300">
                  Unlimited API Calls
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Monthly API Calls"
              value={stats.monthlyCalls.toLocaleString()}
              icon={Zap}
              change="Unlimited access"
              changeType="positive"
              color="purple"
            />
            <StatCard
              title="Success Rate"
              value={`${stats.successRate}%`}
              icon={TrendingUp}
              change="Excellent performance"
              changeType="positive"
              color="green"
            />
            <StatCard
              title="Active API Keys"
              value={stats.activeKeys}
              icon={Key}
              change={`${stats.activeKeys} keys configured`}
              changeType="neutral"
              color="blue"
              href="/dashboard?tab=settings&section=keys"
            />
            <StatCard
              title="Data Processed"
              value={`${(stats.dataProcessed / 1024 / 1024).toFixed(2)} MB`}
              icon={Database}
              change="This month"
              changeType="neutral"
              color="yellow"
            />
          </div>

          {/* Enterprise Features */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl">
            <div className="px-6 py-6">
              <h3 className="text-xl font-semibold text-white mb-6">
                Enterprise Features
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
                    All API Endpoints
                  </h4>
                  <p className="text-sm text-gray-400">
                    Access to all available endpoints
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
                    Advanced Analytics
                  </h4>
                  <p className="text-sm text-gray-400">
                    Detailed usage insights
                  </p>
                </div>
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <CheckCircle className="h-6 w-6 text-green-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">
                    Custom Integrations
                  </h4>
                  <p className="text-sm text-gray-400">
                    Tailored solutions available
                  </p>
                </div>
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <CheckCircle className="h-6 w-6 text-green-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">SLA Guarantee</h4>
                  <p className="text-sm text-gray-400">
                    99.9% uptime guarantee
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Recent API Activity
                </h3>
                <Link
                  href="/dashboard?tab=analytics"
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {activities.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {activity.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {activity.endpoint}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {activity.responseTime}ms
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl">
            <div className="px-6 py-6">
              <h3 className="text-xl font-semibold text-white mb-6">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link
                  href="/dashboard?tab=testing"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <Zap className="h-6 w-6 text-purple-400 group-hover:text-purple-300" />
                  <span className="text-white font-medium">Test APIs</span>
                </Link>
                <Link
                  href="/dashboard?tab=settings&section=keys"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <Key className="h-6 w-6 text-blue-400 group-hover:text-blue-300" />
                  <span className="text-white font-medium">API Keys</span>
                </Link>
                <Link
                  href="/dashboard?tab=analytics"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <BarChart3 className="h-6 w-6 text-green-400 group-hover:text-green-300" />
                  <span className="text-white font-medium">Analytics</span>
                </Link>
                <Link
                  href="/api-docs"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <Settings className="h-6 w-6 text-yellow-400 group-hover:text-yellow-300" />
                  <span className="text-white font-medium">API Docs</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
