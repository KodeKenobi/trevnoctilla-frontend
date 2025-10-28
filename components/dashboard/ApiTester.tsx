"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Download,
  Copy,
  FileUp,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Plus,
} from "lucide-react";
import { useAlert } from "@/contexts/AlertProvider";
import { API_ENDPOINTS } from "../../lib/apiEndpoints";
import { apiTestClient, ApiTestResult } from "../../lib/apiTestClient";
import { getApiUrl } from "@/lib/config";

interface ApiTesterProps {
  toolId: string;
}

interface ApiKey {
  id: number;
  name: string;
  key?: string;
  created_at: string;
  is_active: boolean;
}

export function ApiTester({ toolId }: ApiTesterProps) {
  const { showSuccess, showError, hideAlert } = useAlert();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [selectedApiKey, setSelectedApiKey] = useState<string>("");
  const [availableKeys, setAvailableKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [showKeyGenerator, setShowKeyGenerator] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiTestResult | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const endpoints = API_ENDPOINTS[toolId] || [];
  const currentEndpoint = endpoints.find((ep) => ep.id === selectedEndpoint);

  // Fetch available API keys
  useEffect(() => {
    fetchApiKeys();
  }, []);

  // Update headers when API key changes
  useEffect(() => {
    if (selectedApiKey) {
      const selectedKey = availableKeys.find(
        (k) => k.id.toString() === selectedApiKey
      );
      console.log("🔍 Looking for key with ID:", selectedApiKey);
      console.log("🔍 Found key:", selectedKey);
      if (selectedKey && selectedKey.key) {
        console.log(
          "✅ Setting Authorization header for API key:",
          selectedKey.name
        );
        setHeaders((prev) => ({
          ...prev,
          Authorization: `Bearer ${selectedKey.key}`,
        }));
      } else {
        console.warn("⚠️ Selected key does not have a key value");
      }
    }
  }, [selectedApiKey, availableKeys]);

  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        console.log("No auth token found");
        setLoadingKeys(false);
        return;
      }

      const response = await fetch(getApiUrl("/api/client/keys"), {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const keys = await response.json();
        console.log("🔑 Fetched API keys:", keys);
        console.log(
          "📝 First key structure:",
          keys.length > 0 ? keys[0] : "No keys"
        );
        setAvailableKeys(keys);
        if (keys.length > 0 && !selectedApiKey) {
          setSelectedApiKey(keys[0].id.toString());
        }
      } else {
        console.error("Failed to fetch API keys:", response.status);
        const errorData = await response.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    } finally {
      setLoadingKeys(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      showError("Error", "Please enter a name for the API key", {
        primary: { text: "OK", onClick: hideAlert },
      });
      return;
    }

    setIsGeneratingKey(true);
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        showError(
          "Authentication Required",
          "Please log in to create API keys",
          {
            primary: { text: "OK", onClick: hideAlert },
          }
        );
        return;
      }

      const response = await fetch(getApiUrl("/api/client/keys"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newKeyName,
          rate_limit: 1000,
        }),
      });

      if (response.ok) {
        const newKey = await response.json();
        setAvailableKeys((prev) => [newKey, ...prev]);
        setSelectedApiKey(newKey.id.toString());
        setNewKeyName("");
        setShowKeyGenerator(false);
        showSuccess(
          "API Key Created",
          `Your new API key "${newKey.name}" has been created and selected for testing.`,
          {
            primary: { text: "OK", onClick: hideAlert },
          }
        );
      } else {
        const error = await response.json();
        showError(
          "Failed to Create Key",
          error.error || "Unknown error occurred",
          {
            primary: { text: "OK", onClick: hideAlert },
          }
        );
      }
    } catch (error) {
      showError("Error", "Failed to create API key. Please try again.", {
        primary: { text: "OK", onClick: hideAlert },
      });
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleFileChange = (paramName: string, file: File | null) => {
    setFiles((prev) => ({
      ...prev,
      [paramName]: file,
    }));
  };

  const handleHeaderChange = (key: string, value: string) => {
    setHeaders((prev) => {
      const newHeaders = { ...prev };
      newHeaders[key] = value;

      // If changing Authorization header, clear the selected API key
      if (key === "Authorization" && value !== prev.Authorization) {
        setSelectedApiKey("");
      }

      return newHeaders;
    });
  };

  const addHeader = () => {
    const newKey = `header-${Date.now()}`;
    setHeaders((prev) => ({
      ...prev,
      [newKey]: "",
    }));
  };

  const removeHeader = (key: string) => {
    setHeaders((prev) => {
      const newHeaders = { ...prev };
      delete newHeaders[key];

      // If removing Authorization header, clear the selected API key
      if (key === "Authorization") {
        setSelectedApiKey("");
      }

      return newHeaders;
    });
  };

  const executeRequest = async () => {
    if (!currentEndpoint) return;

    // Validate required fields
    const missingFields: string[] = [];

    currentEndpoint.parameters.forEach((param) => {
      if (param.required) {
        if (param.type === "file") {
          const file = files[param.name];
          console.log(
            `🔍 Checking file param "${param.name}":`,
            file,
            "Type:",
            typeof file
          );
          if (!file || file === null || file === undefined) {
            console.log(`❌ File "${param.name}" is missing or invalid`);
            missingFields.push(param.name);
          } else {
            console.log(`✅ File "${param.name}" is present`);
          }
        } else {
          const value = parameters[param.name];
          console.log(`🔍 Checking param "${param.name}":`, value);
          if (value === undefined || value === null || value === "") {
            console.log(`❌ Parameter "${param.name}" is missing`);
            missingFields.push(param.name);
          }
        }
      }
    });

    console.log("🔍 Validation check:", {
      missingFields,
      filesObject: files,
      parametersObject: parameters,
      requiredParams: currentEndpoint.parameters.filter((p) => p.required),
    });

    if (missingFields.length > 0) {
      console.log("❌ Validation failed, missing fields:", missingFields);
      showError(
        "Missing Required Fields",
        `Please fill in the following required fields: ${missingFields.join(
          ", "
        )}`,
        {
          primary: {
            text: "OK",
            onClick: hideAlert,
          },
        }
      );
      return;
    }

    console.log("✅ Validation passed");

    // Check if Authorization header exists
    if (
      !headers.Authorization ||
      headers.Authorization === "Bearer your-api-key-here"
    ) {
      showError(
        "API Key Required",
        "Please select or create an API key using the dropdown above.",
        {
          primary: {
            text: "OK",
            onClick: hideAlert,
          },
        }
      );
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();

      // Add files
      Object.entries(files).forEach(([paramName, file]) => {
        if (file) {
          formData.append(paramName, file);
        }
      });

      // Add other parameters
      Object.entries(parameters).forEach(([paramName, value]) => {
        if (value !== undefined && value !== "") {
          formData.append(paramName, value.toString());
        }
      });

      console.log("🚀 Sending request with headers:", headers);
      console.log("🔑 Selected API key:", selectedApiKey);
      console.log("📦 FormData entries:", Array.from(formData.entries()));

      const result = await apiTestClient.testEndpoint({
        url: currentEndpoint.path,
        method: currentEndpoint.method,
        headers,
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

  const copyCurl = () => {
    if (currentEndpoint) {
      const curlCommand = apiTestClient.generateCurlCommand({
        url: currentEndpoint.path,
        method: currentEndpoint.method,
        headers,
        body: undefined,
      });
      apiTestClient.copyToClipboard(curlCommand);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Circle */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="w-4 h-4 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-4 h-4 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] rounded-full blur-sm opacity-50"></div>
        </div>
        <h3 className="text-lg font-semibold text-white">
          API Testing Interface
        </h3>
      </div>

      {/* Endpoint Selection */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-full"></div>
          <label className="text-sm font-medium text-white">
            Select API Endpoint
          </label>
        </div>
        <select
          value={selectedEndpoint}
          onChange={(e) => setSelectedEndpoint(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:border-[#8b5cf6] focus:outline-none transition-colors"
        >
          <option value="">Choose an endpoint...</option>
          {endpoints.map((endpoint) => (
            <option key={endpoint.id} value={endpoint.id}>
              {endpoint.method} - {endpoint.name}
            </option>
          ))}
        </select>
      </div>

      {currentEndpoint && (
        <div className="space-y-6">
          {/* Request Builder - Full Width */}
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full"></div>
              <h4 className="text-lg font-semibold text-white">
                Request Builder
              </h4>
            </div>

            {/* API Key Selector */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#8b5cf6]" />
                <label className="text-sm font-medium text-gray-300">
                  Select API Key
                </label>
              </div>

              {loadingKeys ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
                  Loading API keys...
                </div>
              ) : availableKeys.length > 0 ? (
                <div className="space-y-3">
                  <select
                    value={selectedApiKey}
                    onChange={(e) => setSelectedApiKey(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:border-[#8b5cf6] focus:outline-none"
                  >
                    {availableKeys.map((key) => (
                      <option key={key.id} value={key.id.toString()}>
                        {key.name} - Created{" "}
                        {new Date(key.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowKeyGenerator(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8b5cf6]/20 to-[#3b82f6]/20 hover:from-[#8b5cf6]/30 hover:to-[#3b82f6]/30 text-white text-sm font-medium rounded-lg border border-[#8b5cf6]/30 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create New API Key
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    No API keys available. Create one to start testing.
                  </p>
                  <button
                    onClick={() => setShowKeyGenerator(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] text-white text-sm font-medium rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First API Key
                  </button>
                </div>
              )}
            </div>

            {/* Parameters */}
            <div className="space-y-3">
              {currentEndpoint.parameters.map((param) => (
                <div key={param.name}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {param.name}
                    {param.required && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </label>

                  {param.type === "file" ? (
                    <div>
                      <input
                        ref={(el) => {
                          fileInputRefs.current[param.name] = el;
                        }}
                        type="file"
                        onChange={(e) =>
                          handleFileChange(
                            param.name,
                            e.target.files?.[0] || null
                          )
                        }
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-[#8b5cf6] file:text-white hover:file:bg-[#7c3aed] transition-colors"
                      />
                      {files[param.name] && (
                        <p className="text-xs text-gray-400 mt-1">
                          Selected: {files[param.name]?.name}
                        </p>
                      )}
                    </div>
                  ) : param.type === "select" ? (
                    <select
                      value={parameters[param.name] || ""}
                      onChange={(e) =>
                        handleParameterChange(param.name, e.target.value)
                      }
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:border-[#8b5cf6] focus:outline-none"
                    >
                      <option value="">Select {param.name}...</option>
                      {param.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : param.type === "boolean" ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={parameters[param.name] || false}
                        onChange={(e) =>
                          handleParameterChange(param.name, e.target.checked)
                        }
                        className="w-4 h-4 text-[#8b5cf6] bg-[#0a0a0a] border-[#2a2a2a] rounded focus:ring-[#8b5cf6] focus:ring-2"
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
                        handleParameterChange(
                          param.name,
                          param.type === "number"
                            ? parseFloat(e.target.value) || 0
                            : e.target.value
                        )
                      }
                      placeholder={param.description || `Enter ${param.name}`}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:border-[#8b5cf6] focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Headers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-full"></div>
                  <label className="text-sm font-medium text-gray-300">
                    Headers
                  </label>
                </div>
                <button
                  onClick={addHeader}
                  className="text-xs text-[#8b5cf6] hover:text-[#7c3aed]"
                >
                  + Add Header
                </button>
              </div>

              {/* Create New API Key */}
              {showKeyGenerator && (
                <div className="bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#8b5cf6]" />
                      <h4 className="text-sm font-medium text-white">
                        Create New API Key
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowKeyGenerator(false)}
                      className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Create a new API key for testing endpoints. The key will be
                    saved to your account and can be used for production API
                    calls.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Enter a name for your API key (e.g., Development Key)"
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white text-sm focus:border-[#8b5cf6] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          createApiKey();
                        }
                      }}
                    />
                    <button
                      onClick={createApiKey}
                      disabled={isGeneratingKey || !newKeyName.trim()}
                      className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] disabled:from-gray-600 disabled:to-gray-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
                    >
                      {isGeneratingKey ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          Create API Key
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Show Authorization header as read-only badge when API key is selected */}
              {selectedApiKey && headers.Authorization && (
                <div className="bg-[#1a1a1a] border border-[#22c55e]/30 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#22c55e]" />
                  <span className="text-sm text-gray-300">Authorization:</span>
                  <span className="text-xs text-[#22c55e] font-mono bg-[#0a0a0a] px-2 py-1 rounded flex-1 truncate">
                    {headers.Authorization.substring(0, 40)}...
                  </span>
                  <button
                    onClick={() => removeHeader("Authorization")}
                    className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-[#2a2a2a] transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}

              {Object.entries(headers)
                .filter(([key]) => key !== "Authorization")
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => {
                        const newHeaders = { ...headers };
                        delete newHeaders[key];
                        newHeaders[e.target.value] = value;
                        setHeaders(newHeaders);
                      }}
                      placeholder="Header name"
                      className="col-span-5 bg-[#0a0a0a] border border-[#2a2a2a] rounded px-3 py-2 text-white text-sm focus:border-[#8b5cf6] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleHeaderChange(key, e.target.value)}
                      placeholder="Header value"
                      className="col-span-6 bg-[#0a0a0a] border border-[#2a2a2a] rounded px-3 py-2 text-white text-sm focus:border-[#8b5cf6] focus:outline-none"
                    />
                    <button
                      onClick={() => removeHeader(key)}
                      className="col-span-1 text-gray-400 hover:text-red-400 p-2 rounded hover:bg-[#2a2a2a] transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
            </div>

            {/* Send Button */}
            <button
              onClick={executeRequest}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] hover:from-[#7c3aed] hover:to-[#2563eb] disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Request
                </>
              )}
            </button>
          </div>

          {/* Response Viewer - Full Width Below */}
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-gradient-to-r from-[#ef4444] to-[#dc2626] rounded-full"></div>
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                {result?.success ? (
                  <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                ) : result ? (
                  <XCircle className="w-4 h-4 text-[#ef4444]" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400" />
                )}
                Response
                {result && (
                  <span className="text-sm font-normal text-gray-400">
                    ({result.status} - {result.duration}ms)
                  </span>
                )}
              </h4>
            </div>

            {result ? (
              <div className="space-y-4">
                {/* Response Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        result.success
                          ? "bg-green-900/20 text-green-400 border border-green-800"
                          : "bg-red-900/20 text-red-400 border border-red-800"
                      }`}
                    >
                      {result.success ? "Success" : "Error"}
                    </span>
                    {result.data?.downloadUrl && (
                      <button
                        onClick={downloadResult}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={copyCurl}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Copy cURL command"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Response Data */}
                <div className="bg-[#0a0a0a] rounded-lg p-4 max-h-96 overflow-auto">
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
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {result.error || JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  Send a request to see the response
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
