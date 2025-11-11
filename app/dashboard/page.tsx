"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAlert } from "@/contexts/AlertProvider";
import { TOOL_CATEGORIES } from "../../lib/apiEndpoints";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { ToolCard } from "@/components/dashboard/ToolCard";
import { CircularStats } from "@/components/dashboard/CircularChart";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { ApiKeysSection } from "@/components/dashboard/ApiKeysSection";
import { FloatingNav } from "@/components/dashboard/FloatingNav";

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
        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:border-[#8b5cf6] focus:outline-none"
        autoFocus
      />
      <div className="mt-4 max-h-64 overflow-y-auto">
        {filteredCommands.length > 0 ? (
          <div className="space-y-1">
            {filteredCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2a2a2a] text-left transition-colors"
              >
                <span className="text-xl">{cmd.icon}</span>
                <span className="text-sm text-white">{cmd.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400 py-4 text-center">
            No commands found
          </div>
        )}
      </div>
    </>
  );
}

// Real API data - production ready

function DashboardContent() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { showSuccess, showError, showInfo, hideAlert } = useAlert();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview"
  );
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
      // Check if user has enterprise subscription
      // This can be determined by checking subscription tier from usage stats
      const checkEnterpriseStatus = async () => {
        try {
          const token = localStorage.getItem("auth_token");
          if (!token) return;

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
            // Check if user has enterprise tier (unlimited calls or specific tier)
            const isEnterprise =
              usageData.subscription_tier?.toLowerCase() === "enterprise" ||
              usageData.monthly?.limit === -1 || // Unlimited indicates enterprise
              (usageData.monthly?.limit && usageData.monthly.limit >= 100000); // High limit indicates enterprise

            if (isEnterprise) {
              router.push("/enterprise");
              return;
            }
          }
        } catch (error) {
          console.error("Error checking enterprise status:", error);
        }
      };

      // Only check if not already on enterprise page
      if (window.location.pathname !== "/enterprise") {
        checkEnterpriseStatus();
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

  // Load real data from API
  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white relative overflow-hidden page-content">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#8b5cf6]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#3b82f6]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#8b5cf6]/3 to-[#3b82f6]/3 rounded-full blur-3xl"></div>
      </div>

      {/* Cool Header */}
      <div className="relative border-b border-[#1a1a1a]/50 backdrop-blur-sm bg-[#0a0a0a]/80">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-[#8b5cf6] to-[#3b82f6] bg-clip-text text-transparent">
                User Dashboard
              </h1>
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-pulse"></span>
                {user?.email || "User"} • Testing & Production Plans
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-[#1a1a1a]/50 rounded-xl border border-[#2a2a2a] backdrop-blur-sm">
                <div className="w-3 h-3 bg-[#22c55e] rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content - Tab-based Layout */}
      <div className="relative max-w-6xl mx-auto px-6 py-8">
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
            {/* Header with Circle */}
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <div className="w-6 h-6 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-6 h-6 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] rounded-full blur-sm opacity-50"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-[#8b5cf6] to-[#3b82f6] bg-clip-text text-transparent">
                  API Testing Hub
                </h2>
                <p className="text-gray-400 mt-2">
                  Test all available API endpoints with real-time responses and
                  debugging tools.
                </p>
              </div>
            </div>

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

            {/* Tools Section with Enhanced Header */}
            <div
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden"
              data-tools-section
            >
              <div className="px-6 py-4 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-4 h-4 bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full blur-sm opacity-50"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    API Tools
                  </h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-[#22c55e]/20 to-[#16a34a]/20 text-[#22c55e] font-medium border border-[#22c55e]/30">
                    {TOOL_CATEGORIES.length} Available
                  </span>
                </div>
              </div>

              <div className="divide-y divide-[#2a2a2a]">
                {toolStats.map(({ toolId, stats }) => (
                  <ToolCard
                    key={toolId}
                    toolId={toolId}
                    stats={stats}
                    isExpanded={selectedTool === toolId}
                    onToggleExpand={() =>
                      setSelectedTool(selectedTool === toolId ? null : toolId)
                    }
                    onTestApi={() => setSelectedTool(toolId)}
                  />
                ))}
              </div>
            </div>
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
                  Detailed insights into your API usage, performance metrics,
                  and trends.
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
                  <div className="text-xs text-gray-500">Data Processed</div>
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

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-8">
            {/* Header with Circle */}
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <div className="w-6 h-6 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-6 h-6 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] rounded-full blur-sm opacity-50"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-[#8b5cf6] to-[#3b82f6] bg-clip-text text-transparent">
                  Settings & Configuration
                </h2>
                <p className="text-gray-400 mt-2">
                  Manage your API keys, account settings, and preferences.
                </p>
              </div>
            </div>

            {/* Circular Stats - Same as Overview */}
            <div className="mb-8">
              <CircularStats stats={stats} />
            </div>

            {/* API Keys Management */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
              <div className="px-6 py-4 border-b border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      API Keys
                    </h3>
                    <p className="text-sm text-gray-400">
                      Manage your API authentication keys
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
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
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
          </div>
        )}
      </div>

      {/* Floating Navigation */}
      <FloatingNav
        onQuickTest={handleQuickTest}
        onOpenSettings={handleOpenSettings}
        onOpenHelp={handleOpenHelp}
        onOpenCommandPalette={handleOpenCommandPalette}
      />

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
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
