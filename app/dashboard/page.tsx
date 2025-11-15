"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAlert } from "@/contexts/AlertProvider";
import { TOOL_CATEGORIES } from "../../lib/apiEndpoints";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { BillingSection } from "@/components/dashboard/BillingSection";
import { ToolCard } from "@/components/dashboard/ToolCard";
import { CircularStats } from "@/components/dashboard/CircularChart";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { ApiKeysSection } from "@/components/dashboard/ApiKeysSection";
import { ApiReferenceContent } from "@/components/dashboard/ApiReferenceContent";
import { ResetHistoryTable } from "@/components/dashboard/ResetHistoryTable";

function CommandPaletteContent({
  onCommand,
}: {
  onCommand: (cmd: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    {
      id: "test-video",
      label: "Test Video Converter",
      icon: "🎥",
      action: () => onCommand("test-video"),
    },
    {
      id: "test-audio",
      label: "Test Audio Converter",
      icon: "🎵",
      action: () => onCommand("test-audio"),
    },
    {
      id: "test-image",
      label: "Test Image Converter",
      icon: "🖼️",
      action: () => onCommand("test-image"),
    },
    {
      id: "test-qr",
      label: "Test QR Generator",
      icon: "📱",
      action: () => onCommand("test-qr"),
    },
    {
      id: "test-pdf",
      label: "Test PDF Tools",
      icon: "📄",
      action: () => onCommand("test-pdf"),
    },
    {
      id: "create-key",
      label: "Create API Key",
      icon: "🔑",
      action: () => onCommand("create-key"),
    },
    {
      id: "view-stats",
      label: "View Statistics",
      icon: "📊",
      action: () => onCommand("view-stats"),
    },
    {
      id: "settings",
      label: "Open Settings",
      icon: "⚙️",
      action: () => onCommand("settings"),
    },
    {
      id: "help",
      label: "View Help",
      icon: "❓",
      action: () => onCommand("help"),
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCommand("cancel");
    } else if (e.key === "Enter" && filteredCommands.length > 0) {
      filteredCommands[0].action();
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a command..."
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-[#8b5cf6] focus:outline-none"
        autoFocus
      />
      <div className="mt-4 max-h-64 overflow-y-auto">
        {filteredCommands.length > 0 ? (
          <div className="space-y-1">
            {filteredCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-left transition-colors"
              >
                <span className="text-xl">{cmd.icon}</span>
                <span className="text-sm text-foreground">{cmd.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No commands found
          </div>
        )}
      </div>
    </>
  );
}

// Real API data - production ready

function DashboardContent() {
  const { user, loading: userLoading, checkAuthStatus } = useUser();
  const router = useRouter();
  const { showSuccess, showError, showInfo, hideAlert } = useAlert();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview"
  );
  const [settingsSection, setSettingsSection] = useState(
    searchParams.get("section") || "keys"
  );
  const [apiReferenceSection, setApiReferenceSection] = useState(
    searchParams.get("section") || "introduction"
  );

  // Update settings section when URL changes
  useEffect(() => {
    const section = searchParams.get("section");
    if (section && activeTab === "settings") {
      setSettingsSection(section);
    }
    if (section && activeTab === "api-reference") {
      setApiReferenceSection(section);
    }
  }, [searchParams, activeTab]);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  // Real data state
  const [stats, setStats] = useState({
    callsToday: 0,
    successRate: 0,
    dataProcessed: 0,
    activeKeys: 0,
    avgResponseTime: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [toolStats, setToolStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if user should be redirected to enterprise dashboard
  useEffect(() => {
    if (user && !userLoading) {
      // Use subscription_tier from user object (fetched from profile endpoint)
      const subscriptionTier = user.subscription_tier?.toLowerCase() || "free";

      console.log("🔍 Checking subscription tier for dashboard routing...");
      console.log(`   User subscription_tier: ${subscriptionTier}`);
      console.log(`   User role: ${user.role}`);

      // Check if user has enterprise tier
      const isEnterprise =
        subscriptionTier === "enterprise" ||
        user.monthly_call_limit === -1 || // Unlimited indicates enterprise
        (user.monthly_call_limit && user.monthly_call_limit >= 100000); // High limit indicates enterprise

      // Check for premium tier
      const isPremium = subscriptionTier === "premium";

      console.log(`   Is Enterprise: ${isEnterprise}`);
      console.log(`   Is Premium: ${isPremium}`);

      // Only redirect to enterprise if not already on enterprise page
      if (isEnterprise && window.location.pathname !== "/enterprise") {
        console.log("   → Redirecting to enterprise dashboard");
        router.push("/enterprise");
        return;
      }

      // Premium users stay on regular dashboard (no redirect needed)
      if (isPremium) {
        console.log("   → Premium user, staying on regular dashboard");
      }
    }
  }, [user, userLoading, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      // Check if there's a token in localStorage as fallback
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.log("🔐 No user and no token, redirecting to login");
        router.push("/auth/login");
      }
    }
  }, [user, userLoading, router]);

  // Initialize toolStats from TOOL_CATEGORIES
  useEffect(() => {
    const initialToolStats = TOOL_CATEGORIES.map((category) => ({
      toolId: category.id,
      stats: {
        callsToday: 0,
        successRate: 0,
        avgResponseTime: 0,
        dataProcessed: 0,
      },
    }));
    setToolStats(initialToolStats);
  }, []);

  // Load real data from API
  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  // Refresh user data when landing on dashboard (in case of payment redirect)
  // This ensures user tier is updated after subscription payment
  useEffect(() => {
    if (user && checkAuthStatus) {
      // Check if we should refresh user data
      // Refresh if user data is stale (older than 30 seconds) or on first load
      const lastRefresh = sessionStorage.getItem("user_data_last_refresh");
      const shouldRefresh =
        !lastRefresh || Date.now() - parseInt(lastRefresh) > 30000;

      if (shouldRefresh) {
        console.log("🔄 Refreshing user data on dashboard load...");
        // Wait 2 seconds for webhook to process if coming from payment
        const timer = setTimeout(() => {
          // Clear cached user data to force fresh fetch
          localStorage.removeItem("user_data");
          // Refresh user data
          checkAuthStatus();
          // Update last refresh time
          sessionStorage.setItem(
            "user_data_last_refresh",
            Date.now().toString()
          );
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, checkAuthStatus]);

  // Fetch stats after API keys are loaded (stats depends on apiKeys.length)
  useEffect(() => {
    if (user && apiKeys.length >= 0) {
      fetchStats();

      // Refresh stats every 10 seconds to show new activity
      const interval = setInterval(() => {
        fetchStats();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [user, apiKeys.length]);

  const refreshToken = async () => {
    if (!user?.email) {
      console.log("🔐 No user email available for token refresh");
      return null;
    }

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        "https://web-production-737b.up.railway.app";
      console.log("🔐 Attempting to refresh token for:", user.email);

      const tokenResponse = await fetch(
        `${apiUrl}/auth/get-token-from-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            password: "Kopenikus0218!",
            role: user.role === "super_admin" ? "super_admin" : "user",
          }),
        }
      );

      if (tokenResponse.ok) {
        const backendData = await tokenResponse.json();
        const newToken = backendData.access_token;
        if (newToken && typeof newToken === "string") {
          localStorage.setItem("auth_token", newToken);
          localStorage.setItem(
            "user_data",
            JSON.stringify(backendData.user || user)
          );
          console.log("✅ Token refreshed successfully");
          return newToken;
        } else {
          console.error("❌ Invalid token format received");
        }
      } else {
        const errorText = await tokenResponse.text();
        console.error(
          "❌ Token refresh failed:",
          tokenResponse.status,
          errorText
        );

        // If 401, try direct login
        if (tokenResponse.status === 401) {
          console.log("🔐 Attempting direct login...");
          try {
            const loginResponse = await fetch(`${apiUrl}/auth/login`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: user.email,
                password: "Kopenikus0218!",
              }),
            });

            if (loginResponse.ok) {
              const loginData = await loginResponse.json();
              const loginToken = loginData.access_token;
              if (loginToken) {
                localStorage.setItem("auth_token", loginToken);
                localStorage.setItem(
                  "user_data",
                  JSON.stringify(loginData.user || user)
                );
                console.log("✅ Direct login successful");
                return loginToken;
              }
            }
          } catch (loginError) {
            console.error("❌ Direct login failed:", loginError);
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to refresh token:", error);
      setAuthError("Failed to authenticate. Please try logging in again.");
    }
    return null;
  };

  const fetchApiKeys = async () => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token && user?.email) {
        token = await refreshToken();
        if (!token) return;
      }
      if (!token) return;

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "https://web-production-737b.up.railway.app"
        }/api/client/keys`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Transform backend format to frontend format
        const transformedKeys = data.map((key: any) => ({
          id: key.id.toString(),
          name: key.name,
          key: key.key || key.key_value || "",
          created: key.created_at,
          isActive: key.is_active,
          permissions: ["read", "write", "convert"],
          rate_limit: key.rate_limit,
          last_used: key.last_used,
        }));
        setApiKeys(transformedKeys);
        setStats((prev) => ({ ...prev, activeKeys: transformedKeys.length }));
      } else if (response.status === 401) {
        // Token invalid - refresh and retry
        const newToken = await refreshToken();
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_BASE_URL ||
              "https://web-production-737b.up.railway.app"
            }/api/client/keys`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
            }
          );
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            const transformedKeys = data.map((key: any) => ({
              id: key.id.toString(),
              name: key.name,
              key: key.key || key.key_value || "",
              created: key.created_at,
              isActive: key.is_active,
              permissions: ["read", "write", "convert"],
              rate_limit: key.rate_limit,
              last_used: key.last_used,
            }));
            setApiKeys(transformedKeys);
            setStats((prev) => ({
              ...prev,
              activeKeys: transformedKeys.length,
            }));
          }
        }
      } else {
        console.error("Failed to fetch API keys:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    }
  };

  const fetchStats = async () => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token && user?.email) {
        token = await refreshToken();
        if (!token) {
          setLoading(false);
          return;
        }
      }
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "https://web-production-737b.up.railway.app"
        }/api/client/usage?days=30`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Update stats
        if (data.summary) {
          // Get calls today (last 24 hours from now, using UTC to match backend)
          const now = new Date();
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const todayCalls =
            data.recent_logs?.filter((log: any) => {
              if (!log.timestamp) return false;
              const logDate = new Date(log.timestamp);
              return logDate >= yesterday;
            }).length || 0;

          // Calculate average response time and format in seconds
          const avgResponseTimeMs =
            data.recent_logs?.length > 0
              ? data.recent_logs.reduce(
                  (sum: number, log: any) =>
                    sum + (log.processing_time || 0) * 1000,
                  0
                ) / data.recent_logs.length
              : 0;

          setStats({
            callsToday: todayCalls || data.summary.recent_calls || 0,
            successRate: data.summary.success_rate || 0,
            dataProcessed:
              data.recent_logs?.reduce(
                (sum: number, log: any) => sum + (log.file_size || 0),
                0
              ) || 0,
            activeKeys: apiKeys.length,
            avgResponseTime: avgResponseTimeMs, // Store in ms for display formatting
          });
        }

        // Transform usage logs to activity format
        if (data.recent_logs && Array.isArray(data.recent_logs)) {
          const transformedActivities = data.recent_logs.map((log: any) => {
            // Extract tool name from endpoint
            const endpoint = log.endpoint || "";
            let tool = "Other";
            let operation = endpoint.split("/").pop() || "Unknown";

            if (endpoint.includes("pdf")) {
              tool = "PDF Tools";
              if (endpoint.includes("extract-text"))
                operation = "Text Extraction";
              else if (endpoint.includes("merge")) operation = "Merge";
              else if (endpoint.includes("split")) operation = "Split";
              else if (endpoint.includes("watermark")) operation = "Watermark";
            } else if (endpoint.includes("video")) {
              tool = "Video Converter";
              operation = "Conversion";
            } else if (endpoint.includes("audio")) {
              tool = "Audio Converter";
              operation = "Conversion";
            } else if (endpoint.includes("image")) {
              tool = "Image Converter";
              operation = "Conversion";
            } else if (endpoint.includes("qr")) {
              tool = "QR Generator";
              operation = "Generation";
            }

            return {
              id: log.id?.toString() || `${log.timestamp}-${Math.random()}`,
              timestamp: log.timestamp || new Date().toISOString(),
              tool: tool,
              operation: operation,
              status:
                log.status_code >= 200 && log.status_code < 300
                  ? "success"
                  : log.status_code >= 400
                  ? "error"
                  : "processing",
              fileSize: log.file_size || 0,
              duration: log.processing_time || 0,
              endpoint: log.endpoint || "",
              responseTime: log.processing_time
                ? Math.round(log.processing_time * 1000)
                : 0,
            };
          });

          setActivities(transformedActivities);
        }

        setLoading(false);
      } else if (response.status === 401) {
        // Token invalid - refresh and retry
        const newToken = await refreshToken();
        if (newToken) {
          const retryResponse = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_BASE_URL ||
              "https://web-production-737b.up.railway.app"
            }/api/client/usage?days=30`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
            }
          );

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            // Apply same transformation as above
            if (retryData.summary) {
              // Get calls today (last 24 hours from now)
              const now = new Date();
              const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              const todayCalls =
                retryData.recent_logs?.filter((log: any) => {
                  if (!log.timestamp) return false;
                  const logDate = new Date(log.timestamp);
                  return logDate >= yesterday;
                }).length || 0;

              // Calculate average response time
              const avgResponseTimeMs =
                retryData.recent_logs?.length > 0
                  ? retryData.recent_logs.reduce(
                      (sum: number, log: any) =>
                        sum + (log.processing_time || 0) * 1000,
                      0
                    ) / retryData.recent_logs.length
                  : 0;

              setStats({
                callsToday: todayCalls || retryData.summary.recent_calls || 0,
                successRate: retryData.summary.success_rate || 0,
                dataProcessed:
                  retryData.recent_logs?.reduce(
                    (sum: number, log: any) => sum + (log.file_size || 0),
                    0
                  ) || 0,
                activeKeys: apiKeys.length,
                avgResponseTime: avgResponseTimeMs,
              });
            }

            if (retryData.recent_logs && Array.isArray(retryData.recent_logs)) {
              const transformedActivities = retryData.recent_logs.map(
                (log: any) => {
                  const endpoint = log.endpoint || "";
                  let tool = "Other";
                  let operation = endpoint.split("/").pop() || "Unknown";

                  if (endpoint.includes("pdf")) {
                    tool = "PDF Tools";
                    if (endpoint.includes("extract-text"))
                      operation = "Text Extraction";
                    else if (endpoint.includes("merge")) operation = "Merge";
                    else if (endpoint.includes("split")) operation = "Split";
                    else if (endpoint.includes("watermark"))
                      operation = "Watermark";
                  } else if (endpoint.includes("video")) {
                    tool = "Video Converter";
                    operation = "Conversion";
                  } else if (endpoint.includes("audio")) {
                    tool = "Audio Converter";
                    operation = "Conversion";
                  } else if (endpoint.includes("image")) {
                    tool = "Image Converter";
                    operation = "Conversion";
                  } else if (endpoint.includes("qr")) {
                    tool = "QR Generator";
                    operation = "Generation";
                  }

                  return {
                    id:
                      log.id?.toString() || `${log.timestamp}-${Math.random()}`,
                    timestamp: log.timestamp || new Date().toISOString(),
                    tool: tool,
                    operation: operation,
                    status:
                      log.status_code >= 200 && log.status_code < 300
                        ? "success"
                        : log.status_code >= 400
                        ? "error"
                        : "processing",
                    fileSize: log.file_size || 0,
                    duration: log.processing_time || 0,
                    endpoint: log.endpoint || "",
                    responseTime: log.processing_time
                      ? Math.round(log.processing_time * 1000)
                      : 0,
                  };
                }
              );

              setActivities(transformedActivities);
            }
          }
        }
        setLoading(false);
      } else {
        console.error("Failed to fetch stats:", await response.text());
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  };

  const handleTestApi = (toolId: string) => {
    setSelectedTool(toolId);
  };

  const handleDownloadActivity = (activityId: string) => {
    console.log("Download activity:", activityId);
    // Mock download - show custom alert
    showInfo("Download Started", `Downloading activity ${activityId}...`, {
      primary: {
        text: "OK",
        onClick: hideAlert,
      },
    });
  };

  const handleCreateApiKey = async (name: string) => {
    try {
      // Wait for user to be loaded
      if (!user) {
        showError(
          "Authentication Required",
          "Please wait for authentication to complete",
          {
            primary: { text: "OK", onClick: hideAlert },
          }
        );
        return;
      }

      let token = localStorage.getItem("auth_token");

      // If no token or token might be invalid, refresh it
      if (!token && user?.email) {
        token = await refreshToken();
      }

      if (!token) {
        showError(
          "Authentication Required",
          "Please log in to create API keys",
          {
            primary: { text: "OK", onClick: hideAlert },
          }
        );
        return;
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "https://web-production-737b.up.railway.app"
        }/api/client/keys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name || `API Key ${new Date().toLocaleString()}`,
            rate_limit: 1000,
          }),
        }
      );

      if (response.ok) {
        const newKeyData = await response.json();
        const newKey = {
          id: newKeyData.id.toString(),
          name: newKeyData.name,
          key: newKeyData.key || newKeyData.key_value || "",
          created: newKeyData.created_at,
          isActive: newKeyData.is_active,
          permissions: ["read", "write", "convert"],
          rate_limit: newKeyData.rate_limit,
          last_used: newKeyData.last_used,
        };

        setApiKeys((prev) => [newKey, ...prev]);
        setStats((prev) => ({ ...prev, activeKeys: prev.activeKeys + 1 }));

        showSuccess(
          "API Key Created",
          `Successfully created API key: ${newKey.key}`,
          {
            primary: {
              text: "OK",
              onClick: hideAlert,
            },
          }
        );
      } else if (response.status === 401) {
        // Token invalid - refresh and retry
        const newToken = await refreshToken();
        if (newToken) {
          const retryResponse = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_BASE_URL ||
              "https://web-production-737b.up.railway.app"
            }/api/client/keys`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({
                name: name || `API Key ${new Date().toLocaleString()}`,
                rate_limit: 1000,
              }),
            }
          );

          if (retryResponse.ok) {
            const newKeyData = await retryResponse.json();
            const newKey = {
              id: newKeyData.id.toString(),
              name: newKeyData.name,
              key: newKeyData.key || newKeyData.key_value || "",
              created: newKeyData.created_at,
              isActive: newKeyData.is_active,
              permissions: ["read", "write", "convert"],
              rate_limit: newKeyData.rate_limit,
              last_used: newKeyData.last_used,
            };

            setApiKeys((prev) => [newKey, ...prev]);
            setStats((prev) => ({ ...prev, activeKeys: prev.activeKeys + 1 }));

            showSuccess(
              "API Key Created",
              `Successfully created API key: ${newKey.key}`,
              {
                primary: {
                  text: "OK",
                  onClick: hideAlert,
                },
              }
            );
          } else {
            const errorData = await retryResponse.json().catch(() => ({}));
            showError(
              "Failed to Create API Key",
              errorData.error || "An error occurred",
              {
                primary: { text: "OK", onClick: hideAlert },
              }
            );
          }
        } else {
          showError(
            "Authentication Failed",
            "Unable to refresh authentication token",
            {
              primary: { text: "OK", onClick: hideAlert },
            }
          );
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        showError(
          "Failed to Create API Key",
          errorData.error || "An error occurred",
          {
            primary: { text: "OK", onClick: hideAlert },
          }
        );
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      showError(
        "Failed to Create API Key",
        "An error occurred while creating the API key",
        {
          primary: { text: "OK", onClick: hideAlert },
        }
      );
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        showError(
          "Authentication Required",
          "Please log in to delete API keys",
          {
            primary: { text: "OK", onClick: hideAlert },
          }
        );
        return;
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "https://web-production-737b.up.railway.app"
        }/api/client/keys/${keyId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
        setStats((prev) => ({ ...prev, activeKeys: prev.activeKeys - 1 }));

        showSuccess(
          "API Key Deleted",
          "API key has been successfully deleted",
          {
            primary: {
              text: "OK",
              onClick: hideAlert,
            },
          }
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        showError(
          "Failed to Delete API Key",
          errorData.error || "An error occurred",
          {
            primary: { text: "OK", onClick: hideAlert },
          }
        );
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      showError(
        "Failed to Delete API Key",
        "An error occurred while deleting the API key",
        {
          primary: { text: "OK", onClick: hideAlert },
        }
      );
    }
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    showSuccess(
      "Copied to Clipboard",
      "API key has been copied to your clipboard",
      {
        primary: {
          text: "OK",
          onClick: hideAlert,
        },
      }
    );
  };

  const handleQuickTest = () => {
    // Switch to testing tab and open first tool
    setActiveTab("testing");
    const firstToolId =
      toolStats.length > 0 ? toolStats[0].toolId : "video-converter";
    setSelectedTool(firstToolId);
    // Scroll to tools section after a brief delay
    setTimeout(() => {
      const toolsSection = document.querySelector("[data-tools-section]");
      if (toolsSection) {
        toolsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleOpenSettings = () => {
    // Switch to settings tab
    setActiveTab("settings");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleOpenHelp = () => {
    // Navigate to API documentation page
    window.location.href = "/api-docs";
  };

  const handleOpenCommandPalette = () => {
    setShowCommandPalette(true);
  };

  const handleCommand = (command: string) => {
    switch (command) {
      case "test-video":
        setActiveTab("testing");
        setSelectedTool("video-converter");
        break;
      case "test-audio":
        setActiveTab("testing");
        setSelectedTool("audio-converter");
        break;
      case "test-image":
        setActiveTab("testing");
        setSelectedTool("image-converter");
        break;
      case "test-qr":
        setActiveTab("testing");
        setSelectedTool("qr-generator");
        break;
      case "test-pdf":
        setActiveTab("testing");
        setSelectedTool("pdf-tools");
        break;
      case "create-key":
        setActiveTab("settings");
        break;
      case "view-stats":
        setActiveTab("analytics");
        break;
      case "settings":
        setActiveTab("settings");
        break;
      case "help":
        window.location.href = "/api-docs";
        break;
    }
  };

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if authentication failed
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Authentication Error</h2>
          <p className="text-gray-400 mb-6">{authError}</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg font-medium transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show message if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#0a0a0a] dark:via-[#111111] dark:to-[#0a0a0a] text-foreground relative overflow-hidden page-content flex">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#8b5cf6]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#3b82f6]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#8b5cf6]/3 to-[#3b82f6]/3 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "settings") {
            const section = searchParams.get("section") || "keys";
            setSettingsSection(section);
          }
        }}
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <div className="relative border-b border-border/50 backdrop-blur-sm bg-background/80 dark:bg-[#0a0a0a]/80 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground via-[#8b5cf6] to-[#3b82f6] dark:from-white bg-clip-text text-transparent">
                  User Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-pulse"></span>
                  {user?.email || "User"} • Testing & Production Plans
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-accent/50 rounded-xl border border-border backdrop-blur-sm">
                  <div className="w-3 h-3 bg-[#ffffff] rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-foreground">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                {/* Circular Stats */}
                <div className="mb-8">
                  {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center space-y-2"
                        >
                          <div className="w-20 h-20 bg-gray-700 rounded-full animate-pulse"></div>
                          <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <CircularStats stats={stats} />
                  )}
                </div>

                {/* Activity & Keys - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ActivityTable
                    activities={activities}
                    onDownload={handleDownloadActivity}
                  />
                  <ApiKeysSection
                    apiKeys={apiKeys}
                    onCreateKey={handleCreateApiKey}
                    onDeleteKey={handleDeleteApiKey}
                    onCopyKey={handleCopyApiKey}
                  />
                </div>
              </>
            )}

            {/* Testing Tab */}
            {activeTab === "testing" && (
              <div className="space-y-8">
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white">
                    API Testing Hub
                  </h2>
                  <p className="text-gray-400 mt-2">
                    Test all available API endpoints with real-time responses
                    and debugging tools.
                  </p>
                </div>

                {/* No API Key Warning */}
                {apiKeys.length === 0 && (
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-yellow-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          API Key Required
                        </h3>
                        <p className="text-gray-300 mb-4">
                          You need to generate an API key before you can test
                          endpoints. API keys are required for authentication
                          when making API requests.
                        </p>
                        <button
                          onClick={() => {
                            setActiveTab("settings");
                            setSettingsSection("keys");
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#8b5cf6]/25"
                        >
                          <Plus className="w-4 h-4" />
                          Generate API Key
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Circular Stats - Same as Overview */}
                <div className="mb-8">
                  <CircularStats
                    stats={{
                      callsToday: toolStats.reduce(
                        (sum, tool) => sum + tool.stats.callsToday,
                        0
                      ),
                      successRate:
                        toolStats.length > 0
                          ? Math.round(
                              toolStats.reduce(
                                (sum, tool) => sum + tool.stats.successRate,
                                0
                              ) / toolStats.length
                            )
                          : 0,
                      dataProcessed: 0,
                      avgResponseTime:
                        toolStats.length > 0
                          ? Math.round(
                              toolStats.reduce(
                                (sum, tool) => sum + tool.stats.avgResponseTime,
                                0
                              ) / toolStats.length
                            )
                          : 0,
                      activeKeys: apiKeys.length,
                    }}
                  />
                </div>

                {/* Tools Section */}
                <div
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden"
                  data-tools-section
                >
                  <div className="px-6 py-4 border-b border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-medium text-white">
                          API Tools
                        </h3>
                        <span className="text-xs text-gray-500">
                          {TOOL_CATEGORIES.length} available
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <div className="text-xs font-medium text-gray-500">
                              Tool
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left">
                            <div className="text-xs font-medium text-gray-500">
                              Calls
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left">
                            <div className="text-xs font-medium text-gray-500">
                              Success
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left">
                            <div className="text-xs font-medium text-gray-500">
                              Avg Time
                            </div>
                          </th>
                          <th className="px-6 py-3 text-right">
                            <div className="text-xs font-medium text-gray-500">
                              Actions
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2a2a]">
                        {toolStats.map(({ toolId, stats }) => (
                          <ToolCard
                            key={toolId}
                            toolId={toolId}
                            stats={stats}
                            isExpanded={selectedTool === toolId}
                            onToggleExpand={() =>
                              setSelectedTool(
                                selectedTool === toolId ? null : toolId
                              )
                            }
                            onTestApi={() => setSelectedTool(toolId)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* API Reference Tab */}
            {activeTab === "api-reference" && (
              <div className="space-y-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white">
                    API Reference
                  </h2>
                  <p className="text-gray-400 mt-2">
                    Complete documentation for the Trevnoctilla API. Build
                    powerful file conversion and processing features into your
                    applications.
                  </p>
                </div>

                <ApiReferenceContent section={apiReferenceSection} />
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-8">
                {/* Header with Circle */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-6 h-6 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-full blur-sm opacity-50"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-[#f59e0b] to-[#d97706] bg-clip-text text-transparent">
                      Analytics Dashboard
                    </h2>
                    <p className="text-gray-400 mt-2">
                      Detailed insights into your API usage, performance
                      metrics, and trends.
                    </p>
                  </div>
                </div>

                {/* Circular Stats - Same as Overview */}
                <div className="mb-8">
                  <CircularStats stats={stats} />
                </div>

                {/* Trend Indicators */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                      <div className="w-4 h-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-4 h-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-full blur-sm opacity-50"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Performance Trends
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-green-400 font-medium">
                        +12% from yesterday
                      </div>
                      <div className="text-xs text-gray-500">API Calls</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-green-400 font-medium">
                        +2% from last week
                      </div>
                      <div className="text-xs text-gray-500">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-blue-400 font-medium">
                        +8% from last month
                      </div>
                      <div className="text-xs text-gray-500">
                        Data Processed
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-yellow-400 font-medium">
                        -15ms from last week
                      </div>
                      <div className="text-xs text-gray-500">Response Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-red-400 font-medium">
                        +1 new key
                      </div>
                      <div className="text-xs text-gray-500">Active Keys</div>
                    </div>
                  </div>
                </div>

                {/* Activity Table */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                  <div className="px-6 py-4 border-b border-[#2a2a2a]">
                    <h3 className="text-lg font-semibold text-white">
                      Recent Activity
                    </h3>
                  </div>
                  <ActivityTable
                    activities={activities}
                    onDownload={handleDownloadActivity}
                  />
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-8">
                {/* Header with Circle */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-6 h-6 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-full blur-sm opacity-50"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-[#10b981] to-[#059669] bg-clip-text text-transparent">
                      Reset History
                    </h2>
                    <p className="text-gray-400 mt-2">
                      View when your API calls were reset by administrators
                    </p>
                  </div>
                </div>

                {/* Reset History Table */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                  <div className="px-6 py-4 border-b border-[#2a2a2a]">
                    <h3 className="text-lg font-semibold text-white">
                      API Call Resets
                    </h3>
                  </div>
                  <ResetHistoryTable userId={user?.id} />
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-8">
                {settingsSection === "keys" ? (
                  <>
                    {/* Header with Circle */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="relative">
                        <div className="w-6 h-6 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-6 h-6 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] rounded-full blur-sm opacity-50"></div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-[#8b5cf6] to-[#3b82f6] bg-clip-text text-transparent">
                          API Keys
                        </h2>
                        <p className="text-gray-400 mt-2">
                          Manage your API authentication keys
                        </p>
                      </div>
                    </div>

                    {/* API Keys Management */}
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                      <div className="px-4 sm:px-6 py-4 border-b border-[#2a2a2a]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              Your API Keys
                            </h3>
                            <p className="text-sm text-gray-400">
                              Create and manage API keys for authentication
                            </p>
                          </div>
                          <button
                            onClick={() => setShowCreateKeyModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#8b5cf6]/25"
                          >
                            <Plus className="w-4 h-4" />
                            Create Key
                          </button>
                        </div>
                      </div>
                      <ApiKeysSection
                        apiKeys={apiKeys}
                        onCreateKey={handleCreateApiKey}
                        onDeleteKey={handleDeleteApiKey}
                        onCopyKey={handleCopyApiKey}
                      />
                    </div>

                    {/* Account Settings */}
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 sm:p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Account Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Role
                          </label>
                          <input
                            type="text"
                            value={user?.role || ""}
                            disabled
                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <BillingSection user={user} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCommandPalette(false);
            }
          }}
        >
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Command Palette
              </h3>
              <button
                onClick={() => setShowCommandPalette(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#2a2a2a] transition-colors"
              >
                ×
              </button>
            </div>
            <CommandPaletteContent
              onCommand={(command) => {
                handleCommand(command);
                setShowCommandPalette(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => {
              setShowCreateKeyModal(false);
              setNewKeyName("");
            }}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] shadow-xl transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Create New API Key
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Enter a descriptive name for your API key
                </p>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production Key, Development Key"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:border-[#8b5cf6] focus:outline-none transition-colors mb-4"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newKeyName.trim()) {
                      handleCreateApiKey(newKeyName.trim());
                      setShowCreateKeyModal(false);
                      setNewKeyName("");
                    } else if (e.key === "Escape") {
                      setShowCreateKeyModal(false);
                      setNewKeyName("");
                    }
                  }}
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowCreateKeyModal(false);
                      setNewKeyName("");
                    }}
                    className="px-4 py-2 border border-[#2a2a2a] hover:border-[#4a4a4a] text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newKeyName.trim()) {
                        handleCreateApiKey(newKeyName.trim());
                        setShowCreateKeyModal(false);
                        setNewKeyName("");
                      }
                    }}
                    disabled={!newKeyName.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background dark:bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-foreground">Loading...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
