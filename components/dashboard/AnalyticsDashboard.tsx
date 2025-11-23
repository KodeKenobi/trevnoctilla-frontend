"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Eye,
  MousePointer,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  Activity,
  FileText,
  Download,
  Search,
  AlertTriangle,
  Zap,
  Timer,
  Percent,
  AlertCircle,
  MapPin,
} from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  totalSessions: number;
  totalPageViews: number;
  totalEvents: number;
  averageSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  topEvents: Array<{ event: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  osBreakdown: Array<{ os: string; count: number }>;
  countryBreakdown: Array<{ country: string; count: number }>;
  cityBreakdown: Array<{ city: string; country: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    event_name?: string;
    properties?: Record<string, any>;
    page_url?: string;
    page_title?: string;
    timestamp: number;
  }>;
  errorRate: number;
  conversionRate: number;
}

// Helper function to format duration
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ${
      remainingSeconds > 0
        ? `${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`
        : ""
    }`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hour${hours !== 1 ? "s" : ""} ${
    remainingMinutes > 0
      ? `${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`
      : ""
  }`;
};

// Helper function to format numbers with proper labels
const formatNumber = (num: number): string => {
  if (num === 0) return "0";
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
};

// Helper function to format page URLs
const formatPageUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname || "/";
  } catch {
    return url.length > 50 ? url.substring(0, 50) + "..." : url;
  }
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log(
        `[AnalyticsDashboard] Fetching analytics data for range: ${timeRange}`
      );

      const response = await fetch(
        `/api/analytics/dashboard?range=${timeRange}`
      );

      console.log(`[AnalyticsDashboard] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[AnalyticsDashboard] Failed to fetch analytics: ${response.status} - ${errorText}`
        );
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const analyticsData = await response.json();
      console.log(`[AnalyticsDashboard] Received data:`, {
        totalUsers: analyticsData.totalUsers,
        totalSessions: analyticsData.totalSessions,
        totalPageViews: analyticsData.totalPageViews,
        totalEvents: analyticsData.totalEvents,
        hasTopPages:
          !!analyticsData.topPages && analyticsData.topPages.length > 0,
        hasTopEvents:
          !!analyticsData.topEvents && analyticsData.topEvents.length > 0,
      });

      // Validate data structure
      if (analyticsData && typeof analyticsData === "object") {
        setData(analyticsData);
      } else {
        throw new Error("Invalid analytics data format");
      }
    } catch (error) {
      console.error(
        "[AnalyticsDashboard] Error fetching analytics data:",
        error
      );
      // Set empty data structure instead of mock data
      setData({
        totalUsers: 0,
        totalSessions: 0,
        totalPageViews: 0,
        totalEvents: 0,
        averageSessionDuration: 0,
        topPages: [],
        topEvents: [],
        deviceBreakdown: [],
        browserBreakdown: [],
        osBreakdown: [],
        countryBreakdown: [],
        cityBreakdown: [],
        recentActivity: [],
        errorRate: 0,
        conversionRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "pages", label: "Pages", icon: FileText },
    { id: "events", label: "Events", icon: Activity },
    { id: "devices", label: "Devices", icon: Monitor },
    { id: "regions", label: "Regions", icon: MapPin },
    { id: "realtime", label: "Real-time", icon: Eye },
  ];

  const timeRangeLabels: Record<string, string> = {
    "1h": "Last Hour",
    "24h": "Last 24 Hours",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          No Data Available
        </h3>
        <p className="text-gray-400">
          Analytics data will appear here once users start interacting with your
          site.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Monitor your website performance and user behavior
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {data.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Unique visitors in{" "}
                    {timeRangeLabels[timeRange].toLowerCase()}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    Sessions
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {data.totalSessions.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    User sessions started
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    Page Views
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {data.totalPageViews.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total pages viewed
                  </p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Eye className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    Events
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {data.totalEvents.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    User interactions tracked
                  </p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <MousePointer className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">
                  Performance Metrics
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      Average Session Duration
                    </span>
                  </div>
                  <span className="font-semibold text-white">
                    {formatDuration(data.averageSessionDuration)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">
                      Conversion Rate
                    </span>
                  </div>
                  <span className="font-semibold text-green-400">
                    {data.conversionRate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-gray-300">Error Rate</span>
                  </div>
                  <span className="font-semibold text-red-400">
                    {data.errorRate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Top Pages</h3>
              </div>
              <div className="space-y-3">
                {data.topPages.length > 0 ? (
                  data.topPages.slice(0, 5).map((page, index) => (
                    <div
                      key={page.page}
                      className="flex justify-between items-center p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="text-xs text-gray-500 w-6">
                          #{index + 1}
                        </span>
                        <span
                          className="text-sm text-gray-300 truncate"
                          title={page.page}
                        >
                          {formatPageUrl(page.page)}
                        </span>
                      </div>
                      <span className="font-semibold text-white ml-2">
                        {page.views.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No page views yet
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Top Events</h3>
              </div>
              <div className="space-y-3">
                {data.topEvents.length > 0 ? (
                  data.topEvents.slice(0, 5).map((event, index) => (
                    <div
                      key={event.event}
                      className="flex justify-between items-center p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="text-xs text-gray-500 w-6">
                          #{index + 1}
                        </span>
                        <span
                          className="text-sm text-gray-300 truncate"
                          title={event.event}
                        >
                          {event.event}
                        </span>
                      </div>
                      <span className="font-semibold text-white ml-2">
                        {event.count.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No events tracked yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                User Analytics
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Total Unique Users</p>
                <p className="text-2xl font-bold text-white">
                  {data.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Users who visited in{" "}
                  {timeRangeLabels[timeRange].toLowerCase()}
                </p>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Total Sessions</p>
                <p className="text-2xl font-bold text-white">
                  {data.totalSessions.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Average{" "}
                  {data.totalUsers > 0
                    ? (data.totalSessions / data.totalUsers).toFixed(1)
                    : 0}{" "}
                  sessions per user
                </p>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">
                  Average Session Duration
                </p>
                <p className="text-2xl font-bold text-white">
                  {formatDuration(data.averageSessionDuration)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  How long users stay on average
                </p>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Pages per Session</p>
                <p className="text-2xl font-bold text-white">
                  {data.totalSessions > 0
                    ? (data.totalPageViews / data.totalSessions).toFixed(1)
                    : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Average pages viewed per session
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === "pages" && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Page Performance
              </h3>
            </div>
            {data.topPages.length > 0 ? (
              <div className="space-y-3">
                {data.topPages.map((page, index) => {
                  const percentage =
                    data.totalPageViews > 0
                      ? ((page.views / data.totalPageViews) * 100).toFixed(1)
                      : 0;
                  return (
                    <div
                      key={page.page}
                      className="p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-400 w-8">
                            #{index + 1}
                          </span>
                          <span
                            className="text-sm text-gray-300 truncate"
                            title={page.page}
                          >
                            {formatPageUrl(page.page)}
                          </span>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-semibold text-white">
                            {page.views.toLocaleString()} views
                          </p>
                          <p className="text-xs text-gray-500">
                            {percentage}% of total
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No page views tracked yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                Event Tracking
              </h3>
            </div>
            {data.topEvents.length > 0 ? (
              <div className="space-y-3">
                {data.topEvents.map((event, index) => {
                  const percentage =
                    data.totalEvents > 0
                      ? ((event.count / data.totalEvents) * 100).toFixed(1)
                      : 0;
                  return (
                    <div
                      key={event.event}
                      className="p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-400 w-8">
                            #{index + 1}
                          </span>
                          <span
                            className="text-sm text-gray-300 truncate"
                            title={event.event}
                          >
                            {event.event}
                          </span>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-semibold text-white">
                            {event.count.toLocaleString()} times
                          </p>
                          <p className="text-xs text-gray-500">
                            {percentage}% of total
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No events tracked yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Devices Tab */}
      {activeTab === "devices" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Monitor className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Device Types</h3>
            </div>
            <div className="space-y-3">
              {data.deviceBreakdown.length > 0 ? (
                data.deviceBreakdown.map((device) => {
                  const total = data.deviceBreakdown.reduce(
                    (sum, d) => sum + d.count,
                    0
                  );
                  const percentage =
                    total > 0 ? ((device.count / total) * 100).toFixed(1) : 0;
                  return (
                    <div
                      key={device.device}
                      className="p-3 rounded-lg bg-gray-700/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {device.device === "desktop" && (
                            <Monitor className="w-4 h-4 text-blue-400" />
                          )}
                          {device.device === "mobile" && (
                            <Smartphone className="w-4 h-4 text-green-400" />
                          )}
                          {device.device === "tablet" && (
                            <Tablet className="w-4 h-4 text-purple-400" />
                          )}
                          <span className="text-sm text-gray-300 capitalize">
                            {device.device || "Unknown"}
                          </span>
                        </div>
                        <span className="font-semibold text-white">
                          {device.count.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            device.device === "desktop"
                              ? "bg-blue-500"
                              : device.device === "mobile"
                              ? "bg-green-500"
                              : "bg-purple-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {percentage}% of traffic
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No device data available
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Browsers</h3>
            </div>
            <div className="space-y-3">
              {data.browserBreakdown.length > 0 ? (
                data.browserBreakdown.map((browser) => {
                  const total = data.browserBreakdown.reduce(
                    (sum, b) => sum + b.count,
                    0
                  );
                  const percentage =
                    total > 0 ? ((browser.count / total) * 100).toFixed(1) : 0;
                  return (
                    <div
                      key={browser.browser}
                      className="p-3 rounded-lg bg-gray-700/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300 capitalize">
                          {browser.browser || "Unknown"}
                        </span>
                        <span className="font-semibold text-white">
                          {browser.count.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {percentage}% of traffic
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No browser data available
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Monitor className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                Operating Systems
              </h3>
            </div>
            <div className="space-y-3">
              {data.osBreakdown.length > 0 ? (
                data.osBreakdown.map((os) => {
                  const total = data.osBreakdown.reduce(
                    (sum, o) => sum + o.count,
                    0
                  );
                  const percentage =
                    total > 0 ? ((os.count / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={os.os} className="p-3 rounded-lg bg-gray-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300 capitalize">
                          {os.os || "Unknown"}
                        </span>
                        <span className="font-semibold text-white">
                          {os.count.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {percentage}% of traffic
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No OS data available
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Regions Tab */}
      {activeTab === "regions" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
              <div className="flex items-center space-x-2 mb-6">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">
                  Top Countries
                </h3>
              </div>
              <div className="space-y-3">
                {data.countryBreakdown && data.countryBreakdown.length > 0 ? (
                  data.countryBreakdown.map((country, index) => {
                    const total = data.countryBreakdown.reduce(
                      (sum, c) => sum + c.count,
                      0
                    );
                    const percentage =
                      total > 0
                        ? ((country.count / total) * 100).toFixed(1)
                        : 0;
                    return (
                      <div
                        key={country.country}
                        className="p-3 rounded-lg bg-gray-700/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 w-6">
                              #{index + 1}
                            </span>
                            <span className="text-sm text-gray-300 capitalize">
                              {country.country || "Unknown"}
                            </span>
                          </div>
                          <span className="font-semibold text-white">
                            {country.count.toLocaleString()} sessions
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {percentage}% of total sessions
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                      No country data available yet
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Location data will appear once users start visiting your
                      site
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Top Cities</h3>
              </div>
              <div className="space-y-3">
                {data.cityBreakdown && data.cityBreakdown.length > 0 ? (
                  data.cityBreakdown.map((city, index) => {
                    const total = data.cityBreakdown.reduce(
                      (sum, c) => sum + c.count,
                      0
                    );
                    const percentage =
                      total > 0 ? ((city.count / total) * 100).toFixed(1) : 0;
                    return (
                      <div
                        key={`${city.city}-${city.country}`}
                        className="p-3 rounded-lg bg-gray-700/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-xs text-gray-500 w-6">
                              #{index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-gray-300 capitalize block truncate">
                                {city.city || "Unknown"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {city.country || "Unknown"}
                              </span>
                            </div>
                          </div>
                          <span className="font-semibold text-white ml-2">
                            {city.count.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-purple-500 h-1.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {percentage}% of total sessions
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No city data available yet</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Location data will appear once users start visiting your
                      site
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">
                Geographic Summary
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Countries Tracked</p>
                <p className="text-2xl font-bold text-white">
                  {data.countryBreakdown?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Unique countries with visitors
                </p>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Cities Tracked</p>
                <p className="text-2xl font-bold text-white">
                  {data.cityBreakdown?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Unique cities with visitors
                </p>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Total Sessions</p>
                <p className="text-2xl font-bold text-white">
                  {data.totalSessions.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Sessions with location data
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Tab */}
      {activeTab === "realtime" && (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-lg">
          <div className="flex items-center space-x-2 mb-6">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">
              Recent Activity
            </h3>
          </div>
          <div className="space-y-3">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((activity) => {
                const date = new Date(activity.timestamp);
                const timeAgo = Math.floor(
                  (Date.now() - date.getTime()) / 1000
                );
                let timeLabel = "";
                if (timeAgo < 60) {
                  timeLabel = `${timeAgo} second${
                    timeAgo !== 1 ? "s" : ""
                  } ago`;
                } else if (timeAgo < 3600) {
                  const minutes = Math.floor(timeAgo / 60);
                  timeLabel = `${minutes} minute${
                    minutes !== 1 ? "s" : ""
                  } ago`;
                } else if (timeAgo < 86400) {
                  const hours = Math.floor(timeAgo / 3600);
                  timeLabel = `${hours} hour${hours !== 1 ? "s" : ""} ago`;
                } else {
                  timeLabel = date.toLocaleDateString();
                }

                // Determine icon and color based on event type
                const getEventIcon = () => {
                  const eventName = activity.event_name || "";
                  if (eventName.includes("api_call")) return "🌐";
                  if (eventName.includes("api_error")) return "❌";
                  if (eventName.includes("page_load") || eventName.includes("pageview")) return "📄";
                  if (eventName.includes("navigation") || eventName.includes("click")) return "🔗";
                  if (eventName.includes("user_interaction")) return "👆";
                  return "📊";
                };

                const getEventColor = () => {
                  const eventName = activity.event_name || "";
                  if (eventName.includes("error")) return "bg-red-500";
                  if (eventName.includes("api_call")) return "bg-blue-500";
                  if (eventName.includes("page_load") || eventName.includes("pageview")) return "bg-green-500";
                  if (eventName.includes("navigation")) return "bg-purple-500";
                  if (activity.type === "conversion") return "bg-green-500";
                  return "bg-blue-500";
                };

                return (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5 text-lg">
                      {getEventIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {activity.description}
                      </p>
                      {activity.page_url && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {activity.page_url.length > 60
                            ? activity.page_url.substring(0, 60) + "..."
                            : activity.page_url}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`w-2 h-2 rounded-full ${getEventColor()}`}
                        ></span>
                        <p className="text-xs text-gray-500">
                          {timeLabel} • {date.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
