"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Key,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
  Database,
  Shield,
  BarChart3,
  Settings,
  Eye,
  Ban,
  UserCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { getApiUrl, getAuthHeaders } from "../../lib/config";

interface EnterpriseStats {
  totalApiCalls: number;
  monthlyCalls?: number;
  successRate: number;
  activeKeys: number;
  recentCalls: number;
  successCalls: number;
  errorCalls: number;
}

interface UserActivity {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  timestamp: string;
  response_time?: number;
}

interface Job {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

export default function EnterpriseDashboard() {
  const { user, loading: userLoading } = useUser();
  const [stats, setStats] = useState<EnterpriseStats>({
    totalApiCalls: 0,
    monthlyCalls: 0,
    successRate: 0,
    activeKeys: 0,
    recentCalls: 0,
    successCalls: 0,
    errorCalls: 0,
  });
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Authentication guard
  useEffect(() => {
    if (!userLoading && !user) {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }
      const timeout = setTimeout(() => {
        if (!user) {
          window.location.href = "/auth/login";
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (user) {
      // Verify user is enterprise, otherwise redirect to regular dashboard
      const verifyEnterpriseStatus = async () => {
        try {
          const token = localStorage.getItem("auth_token");
          if (!token) return;

          const usageResponse = await fetch(getApiUrl("/api/client/usage"), {
            headers: getAuthHeaders(token),
          });

          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            const isEnterprise =
              usageData.subscription_tier?.toLowerCase() === "enterprise" ||
              usageData.monthly?.limit === -1 ||
              (usageData.monthly?.limit && usageData.monthly.limit >= 100000);

            if (!isEnterprise) {
              // Redirect to regular dashboard if not enterprise
              window.location.href = "/dashboard";
              return;
            }
          }

          // If enterprise, fetch data
          fetchEnterpriseData();
        } catch (error) {
          console.error("Error verifying enterprise status:", error);
        }
      };

      verifyEnterpriseStatus();
    }
  }, [user]);

  const fetchEnterpriseData = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch data from client API endpoints (automatically filtered by user_id)
      const [keysResponse, usageResponse, jobsResponse] = await Promise.all([
        fetch(getApiUrl("/api/client/keys"), {
          headers: getAuthHeaders(token),
        }),
        fetch(getApiUrl("/api/client/usage"), {
          headers: getAuthHeaders(token),
        }),
        fetch(getApiUrl("/api/client/jobs"), {
          headers: getAuthHeaders(token),
        }),
      ]);

      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(keysData);
        setStats((prev) => ({
          ...prev,
          activeKeys: keysData.filter((k: any) => k.is_active).length,
        }));
      }

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        if (usageData.stats) {
          setStats((prev) => ({
            ...prev,
            totalApiCalls: usageData.stats.total_calls || 0,
            recentCalls: usageData.stats.recent_calls || 0,
            successCalls: usageData.stats.success_calls || 0,
            errorCalls: usageData.stats.error_calls || 0,
            successRate: usageData.stats.success_rate || 0,
          }));
        }
        if (usageData.monthly) {
          setStats((prev) => ({
            ...prev,
            monthlyCalls: usageData.monthly.total || 0,
          }));
        }
        if (usageData.recent_activity) {
          setUserActivity(usageData.recent_activity.slice(0, 10));
        }
      }

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        if (jobsData.jobs) {
          setRecentJobs(jobsData.jobs.slice(0, 10));
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching enterprise data:", error);
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
      <div className="bg-card/50 dark:bg-gray-800/50 backdrop-blur-sm border border-border dark:border-gray-700 overflow-hidden shadow-lg rounded-xl hover:bg-card/70 dark:hover:bg-gray-800/70 transition-all duration-300 group">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center text-center md:text-left md:justify-between">
            <div className="flex-1 mb-4 md:mb-0">
              <p className="text-sm font-medium text-muted-foreground dark:text-gray-300 mb-2">
                {title}
              </p>
              <p className="text-3xl font-bold text-foreground dark:text-white">
                {value}
              </p>
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
              <Icon className="h-6 w-6 text-foreground dark:text-white" />
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

  const getStatusIcon = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    } else if (statusCode >= 400) {
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    } else {
      return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getJobStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "failed":
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case "processing":
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  // Show loading while checking authentication
  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-foreground dark:text-gray-300">
            Loading enterprise dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center p-8 bg-card/50 dark:bg-gray-800/50 backdrop-blur-sm border border-border dark:border-gray-700 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground dark:text-gray-400 mb-4">
            You must be logged in to access this page.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
                Account overview and analytics for {user.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Account Active</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total API Calls"
              value={stats.totalApiCalls.toLocaleString()}
              icon={Zap}
              change="All time"
              changeType="neutral"
              color="purple"
            />
            <StatCard
              title="Monthly API Calls"
              value={stats.monthlyCalls?.toLocaleString() || "0"}
              icon={Activity}
              change="Current month"
              changeType="neutral"
              color="blue"
            />
            <StatCard
              title="Success Rate"
              value={`${stats.successRate.toFixed(1)}%`}
              icon={TrendingUp}
              change={`${stats.successCalls} successful`}
              changeType="positive"
              color="green"
            />
            <StatCard
              title="Active API Keys"
              value={stats.activeKeys}
              icon={Key}
              change={`${apiKeys.length} total keys`}
              changeType="neutral"
              color="blue"
              href="/dashboard?tab=settings"
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Recent Calls (24h)"
              value={stats.recentCalls.toLocaleString()}
              icon={Clock}
              color="yellow"
            />
            <StatCard
              title="Successful Calls"
              value={stats.successCalls.toLocaleString()}
              icon={CheckCircle}
              changeType="positive"
              color="green"
            />
            <StatCard
              title="Failed Calls"
              value={stats.errorCalls.toLocaleString()}
              icon={AlertCircle}
              changeType={stats.errorCalls > 0 ? "negative" : "neutral"}
              color={stats.errorCalls > 0 ? "red" : "blue"}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
                  {userActivity.length > 0 ? (
                    userActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(activity.status_code)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {activity.method} {activity.endpoint}
                            </p>
                            <p className="text-xs text-gray-400">
                              Status: {activity.status_code}
                              {activity.response_time &&
                                ` • ${activity.response_time}ms`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Jobs */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl">
              <div className="px-6 py-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Recent Jobs
                  </h3>
                  <Link
                    href="/dashboard?tab=testing"
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    View All →
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentJobs.length > 0 ? (
                    recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getJobStatusIcon(job.status)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {job.job_type}
                            </p>
                            <p className="text-xs text-gray-400">
                              Status: {job.status}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            {new Date(job.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">
                      No recent jobs
                    </p>
                  )}
                </div>
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
                  href="/dashboard?tab=settings"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <Key className="h-6 w-6 text-purple-400 group-hover:text-purple-300" />
                  <span className="text-white font-medium">API Keys</span>
                </Link>
                <Link
                  href="/dashboard?tab=analytics"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <BarChart3 className="h-6 w-6 text-blue-400 group-hover:text-blue-300" />
                  <span className="text-white font-medium">Analytics</span>
                </Link>
                <Link
                  href="/dashboard?tab=testing"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <Activity className="h-6 w-6 text-green-400 group-hover:text-green-300" />
                  <span className="text-white font-medium">Test APIs</span>
                </Link>
                <Link
                  href="/dashboard?tab=settings"
                  className="flex items-center space-x-3 p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <Settings className="h-6 w-6 text-yellow-400 group-hover:text-yellow-300" />
                  <span className="text-white font-medium">Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
