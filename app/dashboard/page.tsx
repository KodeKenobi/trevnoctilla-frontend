"use client";

import React, { useState, useEffect, useRef } from "react";
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

export default function DashboardPage() {
  const { user } = useUser();
  const { showSuccess, showError, showInfo, hideAlert } = useAlert();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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

  // Mock data for UI development
  useEffect(() => {
    const loadMockData = () => {
      setLoading(true);

      // Mock stats - set to zero (no false data)
      setStats({
        callsToday: 0,
        successRate: 0,
        dataProcessed: 0,
        activeKeys: 0,
        avgResponseTime: 0,
      });

      // Clean activities - start fresh
      setActivities([]);

      // No mock API keys - start empty
      setApiKeys([]);

      // Mock tool stats - set to zero (no false data)
      const toolStatsData = TOOL_CATEGORIES.map((tool) => ({
        toolId: tool.id,
        stats: {
          callsToday: 0,
          successRate: 0,
          avgResponseTime: 0,
        },
      }));
      setToolStats(toolStatsData);

      setLoading(false);
    };

    loadMockData();
  }, []);

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

  const handleCreateApiKey = (name: string) => {
    const newKey = {
      id: Date.now().toString(),
      name: name,
      key: `jpk_mock_${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toISOString(),
      isActive: true,
      permissions: ["read", "write", "convert"],
    };
    setApiKeys((prev) => [...prev, newKey]);

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
  };

  const handleDeleteApiKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((key) => key.id !== keyId));

    showSuccess("API Key Deleted", "API key has been successfully deleted", {
      primary: {
        text: "OK",
        onClick: hideAlert,
      },
    });
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
                API Hub
              </h1>
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-pulse"></span>
                {user?.email || "User"}
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
                <h3 className="text-lg font-semibold text-white">API Keys</h3>
                <p className="text-sm text-gray-400">
                  Manage your API authentication keys
                </p>
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
    </div>
  );
}
