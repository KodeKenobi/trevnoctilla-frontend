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
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: number;
  }>;
  errorRate: number;
  conversionRate: number;
}

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
      // TODO: Replace with actual API call to your backend
      const response = await fetch(
        `/api/analytics/dashboard?range=${timeRange}`
      );
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      // Mock data for demonstration
      setData({
        totalUsers: 1247,
        totalSessions: 2156,
        totalPageViews: 8943,
        totalEvents: 15678,
        averageSessionDuration: 245, // seconds
        topPages: [
          { page: "/", views: 2341 },
          { page: "/tools", views: 1876 },
          { page: "/pdf-tools", views: 1456 },
          { page: "/video-converter", views: 1234 },
          { page: "/api-docs", views: 987 },
        ],
        topEvents: [
          { event: "click", count: 4567 },
          { event: "file_upload", count: 1234 },
          { event: "tool_usage", count: 987 },
          { event: "form_submit", count: 654 },
          { event: "conversion", count: 321 },
        ],
        deviceBreakdown: [
          { device: "desktop", count: 1456 },
          { device: "mobile", count: 567 },
          { device: "tablet", count: 133 },
        ],
        browserBreakdown: [
          { browser: "chrome", count: 1234 },
          { browser: "firefox", count: 456 },
          { browser: "safari", count: 234 },
          { browser: "edge", count: 123 },
        ],
        osBreakdown: [
          { os: "windows", count: 987 },
          { os: "macos", count: 456 },
          { os: "linux", count: 234 },
          { os: "android", count: 345 },
          { os: "ios", count: 123 },
        ],
        recentActivity: [
          {
            id: "1",
            type: "conversion",
            description: "User completed PDF to Word conversion",
            timestamp: Date.now() - 300000,
          },
          {
            id: "2",
            type: "error",
            description: "File upload failed - file too large",
            timestamp: Date.now() - 600000,
          },
          {
            id: "3",
            type: "tool_usage",
            description: "User started video conversion",
            timestamp: Date.now() - 900000,
          },
        ],
        errorRate: 2.3,
        conversionRate: 15.7,
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
    { id: "realtime", label: "Real-time", icon: Eye },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-600">
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
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor your website performance and user behavior
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-cyan-500 text-cyan-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.totalUsers.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.totalSessions.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Page Views
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.totalPageViews.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MousePointer className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Events</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.totalEvents.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Avg. Session Duration
                  </span>
                  <span className="font-semibold">
                    {Math.floor(data.averageSessionDuration / 60)}m{" "}
                    {data.averageSessionDuration % 60}s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-semibold text-green-600">
                    {data.conversionRate}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className="font-semibold text-red-600">
                    {data.errorRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Pages
              </h3>
              <div className="space-y-3">
                {data.topPages.slice(0, 5).map((page, index) => (
                  <div
                    key={page.page}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-600 truncate">
                      {page.page}
                    </span>
                    <span className="font-semibold">
                      {page.views.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Events
              </h3>
              <div className="space-y-3">
                {data.topEvents.slice(0, 5).map((event, index) => (
                  <div
                    key={event.event}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-600">{event.event}</span>
                    <span className="font-semibold">
                      {event.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Devices Tab */}
      {activeTab === "devices" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Device Types
            </h3>
            <div className="space-y-3">
              {data.deviceBreakdown.map((device) => (
                <div
                  key={device.device}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    {device.device === "desktop" && (
                      <Monitor className="w-4 h-4 text-blue-500" />
                    )}
                    {device.device === "mobile" && (
                      <Smartphone className="w-4 h-4 text-green-500" />
                    )}
                    {device.device === "tablet" && (
                      <Tablet className="w-4 h-4 text-purple-500" />
                    )}
                    <span className="text-sm text-gray-600 capitalize">
                      {device.device}
                    </span>
                  </div>
                  <span className="font-semibold">
                    {device.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Browsers
            </h3>
            <div className="space-y-3">
              {data.browserBreakdown.map((browser) => (
                <div
                  key={browser.browser}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-gray-600 capitalize">
                    {browser.browser}
                  </span>
                  <span className="font-semibold">
                    {browser.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Operating Systems
            </h3>
            <div className="space-y-3">
              {data.osBreakdown.map((os) => (
                <div key={os.os} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">
                    {os.os}
                  </span>
                  <span className="font-semibold">
                    {os.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Tab */}
      {activeTab === "realtime" && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {data.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "conversion"
                      ? "bg-green-500"
                      : activity.type === "error"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                ></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
