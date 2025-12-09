"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Server,
  Database,
  Mail,
  Bell,
  Key,
  Globe,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";

export default function AdminSettingsPage() {
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    siteName: "Trevnoctilla",
    siteUrl: "https://www.trevnoctilla.com",
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "",
    enableRegistration: true,
    enableEmailNotifications: true,
    defaultRateLimit: 1000,
    maintenanceMode: false,
  });

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

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    // Simulate save - in production, this would call an API
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">
            You do not have the necessary permissions to view this page.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Login as Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
              <p className="text-gray-300 text-lg">
                Configure system settings and preferences
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : saved ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </div>

          {/* General Settings */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">General Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) =>
                    setSettings({ ...settings, siteName: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Site URL
                </label>
                <input
                  type="url"
                  value={settings.siteUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, siteUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Base URL
                </label>
                <input
                  type="url"
                  value={settings.apiBaseUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, apiBaseUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Security Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Enable User Registration
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    Allow new users to create accounts
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      enableRegistration: !settings.enableRegistration,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableRegistration
                      ? "bg-purple-600"
                      : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableRegistration
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Maintenance Mode
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    Temporarily disable the site for maintenance
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      maintenanceMode: !settings.maintenanceMode,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.maintenanceMode ? "bg-red-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.maintenanceMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* API Settings */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Key className="h-6 w-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">API Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Rate Limit (requests per minute)
                </label>
                <input
                  type="number"
                  value={settings.defaultRateLimit}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultRateLimit: parseInt(e.target.value) || 1000,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="h-6 w-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">
                Notification Settings
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Enable Email Notifications
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    Send email notifications for important events
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      enableEmailNotifications:
                        !settings.enableEmailNotifications,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableEmailNotifications
                      ? "bg-green-600"
                      : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableEmailNotifications
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Server className="h-6 w-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">
                System Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Environment</p>
                <p className="text-white font-medium">
                  {process.env.NODE_ENV || "development"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Database</p>
                <p className="text-white font-medium">Supabase PostgreSQL</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

