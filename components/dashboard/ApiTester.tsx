"use client";

import React, { useState, useRef } from "react";
import {
  Send,
  Download,
  Copy,
  Key,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Info,
} from "lucide-react";
import { useAlert } from "@/contexts/AlertProvider";
import { API_ENDPOINTS } from "../../lib/apiEndpoints";
import { apiTestClient, ApiTestResult } from "../../lib/apiTestClient";
import { getApiUrl } from "@/lib/config";
import { useSession } from "next-auth/react";

interface ApiTesterProps {
  toolId: string;
}

export function ApiTester({ toolId }: ApiTesterProps) {
  const { showSuccess, showError, hideAlert } = useAlert();
  const { data: session } = useSession();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [apiKey, setApiKey] = useState<string>("");
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiTestResult | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const endpoints = API_ENDPOINTS[toolId] || [];
  const currentEndpoint = endpoints.find((ep) => ep.id === selectedEndpoint);

  // Auto-generate API key if not present
  const ensureApiKey = async () => {
    if (apiKey) return true;

    const hasSession = session?.user;
    const authToken = localStorage.getItem("auth_token");
    let backendToken: string | null = authToken;

    if (hasSession && !backendToken && session?.user?.email) {
      try {
        const tokenResponse = await fetch(
          getApiUrl("/auth/get-token-from-session"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session.user.email,
              password: "Kopenikus0218!",
              role:
                (session.user as any)?.role === "super_admin"
                  ? "super_admin"
                  : "user",
            }),
          }
        );

        if (tokenResponse.ok) {
          const backendData = await tokenResponse.json();
          const token = backendData.access_token;
          if (token && typeof token === "string") {
            backendToken = token;
            localStorage.setItem("auth_token", token);
            if (backendData.user) {
              localStorage.setItem(
                "user_data",
                JSON.stringify(backendData.user)
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to get backend token:", error);
      }
    }

    if (!backendToken) {
      showError("Authentication Required", "Please log in to test APIs", {
        primary: { text: "OK", onClick: hideAlert },
      });
      return false;
    }

    setIsGeneratingKey(true);
    try {
      const response = await fetch(getApiUrl("/api/client/keys"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${backendToken}`,
        },
        body: JSON.stringify({
          name: `Test Key ${new Date().toLocaleString()}`,
          rate_limit: 1000,
        }),
      });

      if (response.ok) {
        const newKey = await response.json();
        setApiKey(newKey.key);
        showSuccess("API Key Generated", "Your test key is ready to use", {
          primary: { text: "OK", onClick: hideAlert },
        });
        return true;
      } else {
        const error = await response.json();
        showError("Failed to Generate Key", error.error || "Unknown error", {
          primary: { text: "OK", onClick: hideAlert },
        });
        return false;
      }
    } catch (error) {
      showError("Error", "Failed to generate API key", {
        primary: { text: "OK", onClick: hideAlert },
      });
      return false;
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const executeRequest = async () => {
    if (!currentEndpoint) return;

    // Ensure API key exists
    const hasKey = await ensureApiKey();
    if (!hasKey) return;

    // Validate required fields
    const missingFields: string[] = [];
    currentEndpoint.parameters.forEach((param) => {
      if (param.required) {
        if (param.type === "file") {
          if (!files[param.name]) {
            missingFields.push(param.name);
          }
        } else {
          const value = parameters[param.name];
          if (value === undefined || value === null || value === "") {
            missingFields.push(param.name);
          }
        }
      }
    });

    if (missingFields.length > 0) {
      showError(
        "Missing Required Fields",
        `Please fill in: ${missingFields.join(", ")}`,
        { primary: { text: "OK", onClick: hideAlert } }
      );
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      Object.entries(files).forEach(([name, file]) => {
        if (file) formData.append(name, file);
      });
      Object.entries(parameters).forEach(([name, value]) => {
        if (value !== undefined && value !== "") {
          formData.append(name, value.toString());
        }
      });

      const result = await apiTestClient.testEndpoint({
        url: currentEndpoint.path,
        method: currentEndpoint.method,
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        status: 0,
        duration: 0,
        headers: {},
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResult = () => {
    if (result?.data?.downloadUrl) {
      apiTestClient.downloadFile(result.data.downloadUrl, result.data.filename);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4 md:p-6">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">API Tester</h2>
          <p className="text-sm text-gray-400">Test API endpoints with ease</p>
        </div>
        {!apiKey && (
          <button
            onClick={ensureApiKey}
            disabled={isGeneratingKey}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
          >
            {isGeneratingKey ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                Get API Key
              </>
            )}
          </button>
        )}
        {apiKey && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/20 border border-green-800 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400 font-mono">
              {apiKey.slice(0, 8)}...
            </span>
          </div>
        )}
      </div>

      {/* Step 1: Select Endpoint */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-semibold text-sm">
            1
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Choose Endpoint
            </h3>
            <p className="text-xs text-gray-400">
              Select an API endpoint to test
            </p>
          </div>
        </div>
        <select
          value={selectedEndpoint}
          onChange={(e) => {
            setSelectedEndpoint(e.target.value);
            setParameters({});
            setFiles({});
            setResult(null);
          }}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
        >
          <option value="">Select endpoint...</option>
          {endpoints.map((endpoint) => (
            <option key={endpoint.id} value={endpoint.id}>
              {endpoint.method} {endpoint.name}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: Fill Parameters */}
      {currentEndpoint && (
        <>
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 md:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-400 font-semibold text-sm">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Parameters</h3>
                <p className="text-xs text-gray-400">
                  {currentEndpoint.description ||
                    "Fill in the required parameters"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {currentEndpoint.parameters.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No parameters required for this endpoint
                </div>
              ) : (
                currentEndpoint.parameters.map((param) => (
                  <div key={param.name} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      {param.name}
                      {param.required && (
                        <span className="text-red-400 text-xs">*</span>
                      )}
                      {param.description && (
                        <div title={param.description} className="inline-flex">
                          <Info className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                      )}
                    </label>

                    {param.type === "file" ? (
                      <div className="space-y-2">
                        <input
                          ref={(el) => {
                            fileInputRefs.current[param.name] = el;
                          }}
                          type="file"
                          onChange={(e) =>
                            setFiles((prev) => ({
                              ...prev,
                              [param.name]: e.target.files?.[0] || null,
                            }))
                          }
                          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-colors"
                        />
                        {files[param.name] && (
                          <p className="text-xs text-gray-400">
                            Selected: {files[param.name]?.name}
                          </p>
                        )}
                      </div>
                    ) : param.type === "select" ? (
                      <select
                        value={parameters[param.name] || ""}
                        onChange={(e) =>
                          setParameters((prev) => ({
                            ...prev,
                            [param.name]: e.target.value,
                          }))
                        }
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select {param.name}...</option>
                        {param.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : param.type === "boolean" ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={parameters[param.name] || false}
                          onChange={(e) =>
                            setParameters((prev) => ({
                              ...prev,
                              [param.name]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-blue-500 bg-[#1a1a1a] border-[#2a2a2a] rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">
                          {param.description || `Enable ${param.name}`}
                        </span>
                      </label>
                    ) : (
                      <input
                        type={param.type === "number" ? "number" : "text"}
                        value={parameters[param.name] || ""}
                        onChange={(e) =>
                          setParameters((prev) => ({
                            ...prev,
                            [param.name]:
                              param.type === "number"
                                ? parseFloat(e.target.value) || 0
                                : e.target.value,
                          }))
                        }
                        placeholder={param.description || `Enter ${param.name}`}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Step 3: Send & View Response */}
          <div className="space-y-4">
            <button
              onClick={executeRequest}
              disabled={isLoading || !apiKey}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Request
                </>
              )}
            </button>

            {result && (
              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Response
                      </h3>
                      <p className="text-xs text-gray-400">
                        Status {result.status} • {result.duration}ms
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.data?.downloadUrl && (
                      <button
                        onClick={downloadResult}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(result.data || result.error, null, 2)
                        );
                        showSuccess("Copied!", "Response copied to clipboard", {
                          primary: { text: "OK", onClick: hideAlert },
                        });
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
                      title="Copy response"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-lg p-4 max-h-96 overflow-auto">
                  {result.data?.downloadUrl ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300">
                        File ready for download:
                      </p>
                      <p className="text-sm text-white font-mono">
                        {result.data.filename}
                      </p>
                      <p className="text-xs text-gray-400">
                        Size: {(result.data.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                      {result.error || JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!currentEndpoint && (
        <div className="text-center py-12 text-gray-400">
          <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select an endpoint to get started</p>
        </div>
      )}
    </div>
  );
}
