"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import {
  ArrowLeft,
  Loader,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  X,
  Activity,
  Trash2,
  Download,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ExportOptionsModal from "@/components/ui/ExportOptionsModal";
import RapidAllLimitModal from "@/components/ui/RapidAllLimitModal";
import RetryFailedModal from "@/components/ui/RetryFailedModal";

interface Campaign {
  id: number;
  name: string;
  status: string;
  total_companies: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  captcha_count: number;
  progress_percentage: number;
  created_at: string;
}

interface ActivityLog {
  company_id?: number;
  company_name?: string;
  action: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

interface Company {
  id: number;
  company_name: string;
  website_url: string;
  contact_email: string;
  phone: string;
  status: string;
  contact_page_found: boolean;
  error_message: string | null;
  screenshot_url?: string;
  // Advanced detection fields
  contact_method?: string;
  detection_method?: string;
  fields_filled?: number;
  contact_info?: {
    emails?: string[];
    phones?: string[];
    social_links?: string[];
  };
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [processingCompanyId, setProcessingCompanyId] = useState<number | null>(
    null
  );
  const [autoStarted, setAutoStarted] = useState(false);
  const [rapidProgress, setRapidProgress] = useState(0);
  const [rapidStatus, setRapidStatus] = useState<string>("");
  const [rapidCurrentCompany, setRapidCurrentCompany] = useState<string>("");
  const [activeWebSocket, setActiveWebSocket] = useState<WebSocket | null>(
    null
  );
  const [isRapidAllRunning, setIsRapidAllRunning] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [rapidAllModalOpen, setRapidAllModalOpen] = useState(false);
  const [retryFailedModalOpen, setRetryFailedModalOpen] = useState(false);
  const [customProcessingLimit, setCustomProcessingLimit] = useState<number | null>(null);
  const [rapidAllProgress, setRapidAllProgress] = useState(0); // Track: X companies processed
  const [rapidAllTotal, setRapidAllTotal] = useState(0); // Track: out of Y total
  const [processingCount, setProcessingCount] = useState(0); // How many are currently processing
  const [avgProcessingTime, setAvgProcessingTime] = useState(0); // Average time per company
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const activityLogsRef = useRef<ActivityLog[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Use refs to avoid stale closures in processNextPending
  const rapidAllProgressRef = useRef(0);
  const customProcessingLimitRef = useRef<number | null>(null);
  const isRapidAllRunningRef = useRef(false);
  const processingTimesRef = useRef<number[]>([]); // Track processing times for ETA

  // Keep refs in sync with state
  useEffect(() => {
    rapidAllProgressRef.current = rapidAllProgress;
  }, [rapidAllProgress]);

  useEffect(() => {
    customProcessingLimitRef.current = customProcessingLimit;
  }, [customProcessingLimit]);

  useEffect(() => {
    isRapidAllRunningRef.current = isRapidAllRunning;
  }, [isRapidAllRunning]);

  // Sync rapidAllProgress with actual company statuses (fixes real-time update issue)
  useEffect(() => {
    if (isRapidAllRunning && rapidAllTotal > 0) {
      const completedCount = companies.filter(
        (c) => c.status === 'completed' || c.status === 'failed'
      ).length;
      
      const processingCountActual = companies.filter(
        (c) => c.status === 'processing'
      ).length;
      
      // Update progress if it doesn't match actual completed count
      if (completedCount !== rapidAllProgress) {
        setRapidAllProgress(completedCount);
      }
      
      // Update processing count if it doesn't match
      if (processingCountActual !== processingCount) {
        setProcessingCount(processingCountActual);
      }
    }
  }, [companies, isRapidAllRunning, rapidAllTotal, rapidAllProgress, processingCount]);

  const campaignId = params?.id as string;

  // Refresh companies data more frequently when rapid processing is running
  useEffect(() => {
    if (isRapidAllRunning && campaignId) {
      const rapidRefreshInterval = setInterval(() => {
        // Silently refresh companies data for real-time stats updates
        fetch(`/api/campaigns/${campaignId}/companies`)
          .then((res) => res.json())
          .then((data) => {
            if (data.companies) {
              setCompanies(data.companies);
            }
          })
          .catch((err) => console.error("Failed to refresh companies:", err));
      }, 3000); // Refresh every 3 seconds during rapid processing
      
      return () => clearInterval(rapidRefreshInterval);
    }
  }, [isRapidAllRunning, campaignId]);

  // Get user's campaign company limit
  const getCampaignLimit = (): number => {
    if (!user) return 5; // Guest
    if (user.subscription_tier === 'free' || user.subscription_tier === 'testing') return 50;
    if (user.subscription_tier === 'premium') return 100; // Production
    if (user.subscription_tier === 'enterprise' || user.subscription_tier === 'client') return Infinity;
    return 5; // Default to guest limit
  };

  const campaignLimit = getCampaignLimit();

  useEffect(() => {
    if (campaignId) {
      console.log('[Campaign Detail] Initial load, campaignId:', campaignId);
      fetchCampaignDetails();
      // Only poll when there's active processing or Rapid All is running
      const interval = setInterval(() => {
        // Poll if there's active processing happening
        const hasProcessing = companies.some((c) => c.status === "processing");
        console.log('[Campaign Detail] Polling check:', {
          isRapidAllRunning,
          processingCompanyId,
          hasProcessing,
          companiesCount: companies.length
        });
        
        if (
          campaign &&
          (isRapidAllRunning || processingCompanyId !== null || hasProcessing) &&
          campaign.status !== "completed" &&
          campaign.status !== "failed" &&
          campaign.status !== "cancelled"
        ) {
          console.log('[Campaign Detail] Fetching updates (silent)');
          fetchCampaignDetails(true);
        }
      }, 3000); // Poll every 3 seconds only during active processing
      return () => {
        console.log('[Campaign Detail] Cleanup interval');
        clearInterval(interval);
      };
    }
  }, [campaignId, campaign?.status, isRapidAllRunning, processingCompanyId]);

  const fetchCampaignDetails = async (silent = false) => {
    console.log('[Campaign Detail] Fetching campaign details, silent:', silent);
    try {
      if (!silent) {
        setLoading(true);
        setRefreshing(true);
      }

      const [campaignRes, companiesRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}`),
        fetch(`/api/campaigns/${campaignId}/companies`),
      ]);

      if (campaignRes.ok) {
        const campaignData = await campaignRes.json();
        console.log('[Campaign Detail] Campaign data loaded:', campaignData.campaign?.name);
        setCampaign(campaignData.campaign);
      } else {
        console.error('[Campaign Detail] Failed to fetch campaign:', campaignRes.status);
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        console.log('[Campaign Detail] Companies loaded:', companiesData.companies?.length || 0);
        setCompanies(companiesData.companies || []);
      } else {
        console.error('[Campaign Detail] Failed to fetch companies:', companiesRes.status);
      }
    } catch (error) {
      console.error("[Campaign Detail] Failed to fetch campaign details:", error);
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignId) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete campaign");
      }

      // Redirect to campaigns list
      router.push("/campaigns");
    } catch (error: any) {
      console.error("Failed to delete campaign:", error);
      alert(`Failed to delete campaign: ${error.message}`);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

const connectToCampaignStream = (id: string) => {
  if (activeWebSocket) {
    activeWebSocket.close();
  }

  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "wss:";
  const backendUrl = "web-production-737b.up.railway.app";
  const wsUrl = `${wsProtocol}//${backendUrl}/ws/campaign/${id}`;

  console.log("[Stream] Connecting to Campaign WebSocket:", wsUrl);
  const ws = new WebSocket(wsUrl);
  setActiveWebSocket(ws);

  ws.onopen = () => {
    console.log("[Stream] Connected to campaign stream");
    setRapidStatus("System Connected");
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log("[Stream] Message received:", message.type);

      if (message.type === "campaign_start") {
        setIsRapidAllRunning(true);
        setRapidAllTotal(message.data.total_companies || 0);
        setRapidAllProgress(0);
        setActivityLogs([]);
        activityLogsRef.current = [];
      }

      if (message.type === "activity") {
        const log: ActivityLog = message.data;
        setActivityLogs(prev => {
          const newLogs = [...prev, log].slice(-50); // Keep last 50
          activityLogsRef.current = newLogs;
          return newLogs;
        });
        setRapidStatus(log.message);
        if (log.company_name) setRapidCurrentCompany(log.company_name);
        
        // Auto-scroll logs
        if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
      }

      if (message.type === "company_completed") {
        const { company_id, status, screenshot_url, progress } = message.data;
        setCompanies(prev => prev.map(c => 
          c.id === company_id ? { ...c, status, screenshot_url } : c
        ));
        setRapidAllProgress(prev => prev + 1);
        setRapidProgress(progress);
      }

      if (message.type === "campaign_complete") {
        setIsRapidAllRunning(false);
        setRapidStatus("Campaign Complete!");
        fetchCampaignDetails(true);
        // ws.close(); // Keep open to see final logs?
      }

      if (message.type === "campaign_stopped") {
        setIsRapidAllRunning(false);
        setIsStopping(false);
        setRapidStatus("Stopped");
        fetchCampaignDetails(true);
      }

      if (message.type === "error") {
        console.error("[Stream] Error:", message.data);
        setRapidStatus(`Error: ${message.data.message}`);
      }
    } catch (e) {
      console.error("[Stream] Failed to parse message:", e);
    }
  };

  ws.onclose = () => {
    console.log("[Stream] WebSocket disconnected");
    setActiveWebSocket(null);
  };

  ws.onerror = (err) => {
    console.error("[Stream] WebSocket error:", err);
  };

  return ws;
};

const handleRapidProcess = async (companyId: number) => {
  // Update single process to use new sequential logic but only for this company
  try {
    setProcessingCompanyId(companyId);
    setRapidCurrentCompany(companies.find(c => c.id === companyId)?.company_name || 'Company');
    
    // Connect to stream first
    connectToCampaignStream(campaignId);

    // Call batch endpoint with just this ID
    const response = await fetch(`/api/campaigns/${campaignId}/rapid-process-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_ids: [companyId] }),
    });

    if (!response.ok) throw new Error("Failed to start processing");
    
  } catch (error: any) {
    console.error("Failed to start rapid processing:", error);
    alert(`Error: ${error.message}`);
    setProcessingCompanyId(null);
  }
};


  const emergencyStopAll = () => {
    console.log("[EMERGENCY STOP] Forcefully stopping all processing");

    // Close active WebSocket
    if (activeWebSocket) {
      try {
        activeWebSocket.close(1000, "Emergency stop by user");
      } catch (e) {
        console.error("Error closing WebSocket:", e);
      }
      setActiveWebSocket(null);
    }

    // Reset all processing states
    setProcessingCompanyId(null);
    setRapidProgress(0);
    setRapidStatus("");
    setRapidCurrentCompany("");
    setAutoStarted(false);
    setIsRapidAllRunning(false); // Stop Rapid All

    // Clear localStorage auto-start flag
    localStorage.removeItem(`campaign_${campaignId}_autostarted`);

    // Refresh data
    fetchCampaignDetails();
  };



  // Convert technical errors to user-friendly messages
  const getUserFriendlyError = (errorMessage: string): string => {
    if (!errorMessage || typeof errorMessage !== 'string') {
      return 'Processing failed. Please try again.';
    }

    // Log raw error for debugging
    if (errorMessage && !errorMessage.includes('success')) {
      console.log(`[Campaign Error] Raw message: "${errorMessage}"`);
    }

    const msg = errorMessage.toLowerCase().trim();

    // Empty or very short messages
    if (msg.length < 3) {
      return 'Processing failed. Please try again.';
    }

    if (msg.includes('attributeerror') || msg.includes('has no attribute')) {
      return 'System error: Data missing or invalid format.';
    }

    if (msg.includes('connectionerror') || msg.includes('max retries exceeded')) {
      return 'Network error: Could not reach the destination site.';
    }

    if (msg.includes('playwright') || msg.includes('browser') || msg.includes('chromium')) {
      return 'Processing system busy. Please try again in 5 seconds.';
    }

    if (msg.includes('blocked') || msg.includes('block')) {
      return 'Access blocked. This website is preventing automated access.';
    }
    
    if (msg.includes('cookie') || msg.includes('session')) {
      return 'Session error. Please try again.';
    }
    
    if (msg.includes('javascript') || msg.includes('js error') || msg.includes('script error')) {
      return 'Website script error. The site may not be fully loaded.';
    }
    
    if (msg.includes('database') || msg.includes('db') || msg.includes('sql')) {
      return 'Data storage error. Please try again or contact support.';
    }
    
    if (msg.includes('typeerror') || msg.includes('valueerror') || msg.includes('keyerror')) {
      return 'Processing data error. Please try again.';
    }
    
    if (msg.includes('undefined') || msg.includes('null') || msg.includes('none')) {
      return 'Missing data error. Please try again.';
    }
    
    if (msg.includes('json') || msg.includes('parse') || msg.includes('serialize')) {
      return 'Data format error. Please try again.';
    }
    
    if (msg.includes('file') && (msg.includes('not found') || msg.includes('cannot') || msg.includes('error'))) {
      return 'File error. Please try again.';
    }
    
    // Default fallback - make it more friendly
    return 'Processing failed. Please try again or contact support if the problem continues.';
  };


  const startRapidAll = () => {
    const pendingCompanies = companies.filter((c) => c.status === "pending");

    if (pendingCompanies.length === 0) {
      alert("No pending companies to process!");
      return;
    }

    // Guests get automatic limit, no modal
    if (!user) {
      handleStartRapidAllWithLimit(5);
      return;
    }

    // Show modal to let authenticated users set custom limit
    setRapidAllModalOpen(true);
  };

  const handleStartRapidAllWithLimit = async (limit: number) => {
    try {
      setRapidAllModalOpen(false);
      setActivityLogs([]);
      activityLogsRef.current = [];
      
      // Connect to stream
      connectToCampaignStream(campaignId);

      // Trigger sequential processing
      // We don't need to specify IDs if we want to process all pending, 
      // but we use limit to slice for now if needed.
      const pendingIds = companies.filter(c => c.status === 'pending').slice(0, limit).map(c => c.id);

      const response = await fetch(`/api/campaigns/${campaignId}/rapid-process-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_ids: pendingIds }),
      });

      if (!response.ok) throw new Error("Failed to start campaign");
      
      const data = await response.json();
      console.log("[Rapid All] Started:", data);

    } catch (error: any) {
      console.error("Failed to start rapid all:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleStopCampaign = async () => {
    if (isStopping) return;
    
    try {
      setIsStopping(true);
      setRapidStatus("Stopping...");
      
      const response = await fetch(`/api/campaigns/${campaignId}/stop`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error("Failed to stop campaign");
      
      console.log("[Stop] Stopping requested");
      
    } catch (error: any) {
      console.error("Failed to stop campaign:", error);
      alert(`Error: ${error.message}`);
      setIsStopping(false);
    }
  };


  const handleRetryFailed = async () => {
    const failedCompanies = companies.filter(c => c.status === 'failed');
    
    if (failedCompanies.length === 0) {
      alert("No failed companies to retry");
      return;
    }

    try {
      setRetryFailedModalOpen(false);
      setActivityLogs([]);
      activityLogsRef.current = [];
      
      // Connect to stream
      connectToCampaignStream(campaignId);

      // Trigger sequential processing for failed IDs
      const failedIds = failedCompanies.map(c => c.id);

      const response = await fetch(`/api/campaigns/${campaignId}/rapid-process-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_ids: failedIds }),
      });

      if (!response.ok) throw new Error("Failed to start retry");
      
      console.log("[Retry] Started batch processing for failed companies");

    } catch (error: any) {
      console.error("Failed to retry failed companies:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleExport = async (options: any) => {
    try {
      setIsExporting(true);

      // Build export URL with options
      const params = new URLSearchParams({
        completedColor: options.completedColor,
        failedColor: options.failedColor,
        includeComments: options.includeComments.toString(),
        commentStyle: options.commentStyle,
      });

      const exportUrl = `/api/campaigns/${campaignId}/export?${params}`;

      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `${campaign?.name || 'campaign'}_results.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportModalOpen(false);
    } catch (error: any) {
      console.error('Failed to export campaign:', error);
      alert(`Failed to export campaign: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // DISABLED: No auto-start. User must manually click "Rapid" for each company.
  // This prevents infinite loops and unwanted processing.

  const filteredCompanies = companies.filter((company) => {
    const statusMatch = filterStatus === "all" ? true : company.status === filterStatus;
    const methodMatch = filterMethod === "all" ? true : company.detection_method === filterMethod;
    return statusMatch && methodMatch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  // Calculate real-time statistics from companies array
  const stats = useMemo(() => {
    const total = campaign?.total_companies || companies.length;
    const processed = companies.filter(c => c.status !== 'pending').length;
    const success = companies.filter((c) => c.status === "completed" || c.status === "success" || c.status === "contact_info_found").length;
    const contactInfoFound = companies.filter((c) => c.status === "contact_info_found").length;
    const failed = companies.filter((c) => c.status === "failed").length;
    const captcha = companies.filter((c) => c.status === "captcha").length;
    // Progress should be based on completed + failed + contact_info_found + captcha, not all non-pending (which includes processing)
    const completedOrFailed = success + failed + captcha;
    const progress = total > 0 ? Math.round((completedOrFailed / total) * 100) : 0;

    return {
      total,
      processed,
      success,
      contactInfoFound,
      failed,
      captcha,
      progress
    };
  }, [companies, campaign]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterMethod]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-400";
      case "contact_info_found":
        return "text-cyan-400";
      case "processing":
        return "text-blue-400";
      case "failed":
        return "text-rose-400";
      case "captcha":
        return "text-amber-400";
      case "success":
        return "text-emerald-400";
      default:
        return "text-white";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return "bg-emerald-400";
      case "contact_info_found":
        return "bg-cyan-400";
      case "processing":
        return "bg-blue-400";
      case "failed":
        return "bg-rose-400";
      case "captcha":
        return "bg-amber-400";
      default:
        return "bg-gray-400"; // pending, queued, etc.
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-3.5 h-3.5";
    switch (status) {
      case "completed":
      case "success":
        return <CheckCircle className={iconClass} />;
      case "contact_info_found":
        return <Eye className={iconClass} />;
      case "processing":
        return <Loader className={`${iconClass} animate-spin`} />;
      case "failed":
        return <XCircle className={iconClass} />;
      case "captcha":
        return <Shield className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black pt-24">
        <Loader className="w-4 h-4 animate-spin text-white" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black pt-24">
        <p className="text-white text-sm">Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-900">
          <button
            onClick={() => router.push("/campaigns")}
            className="group flex items-center gap-2 text-white hover:text-white text-xs mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to campaigns
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h1 className="text-sm font-medium text-white tracking-tight mb-0.5">
                  {campaign.name}
                </h1>
                <p
                  className={`text-[11px] font-mono capitalize ${getStatusColor(
                    campaign.status
                  )}`}
                >
                  {campaign.status}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchCampaignDetails()}
                disabled={refreshing}
                className="p-2 hover:bg-gray-900 text-white hover:text-white transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
              {companies.filter((c) => c.status === "pending").length > 0 && (
                <button
                  onClick={startRapidAll}
                  disabled={isRapidAllRunning || processingCompanyId !== null}
                  className="group flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Activity className="w-3.5 h-3.5" />
                  {isRapidAllRunning || processingCompanyId !== null
                    ? "Mission Control Active"
                    : `Rapid All (${Math.min(
                        companies.filter((c) => c.status === "pending").length,
                        campaignLimit === Infinity ? companies.filter((c) => c.status === "pending").length : campaignLimit
                      )}${campaignLimit !== Infinity ? `/${campaignLimit}` : ''})`}
                </button>
              )}
              <button
                onClick={() => setExportModalOpen(true)}
                className="group flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                Export Results
              </button>
              <button
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleting}
                className="group flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border border-rose-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Deleting..." : "Delete Campaign"}
              </button>
            </div>
          </div>
        </div>

        {/* Mission Control Dashboard */}
        {(isRapidAllRunning || processingCompanyId !== null) && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Progress & Status */}
            <div className="lg:col-span-2 border border-blue-500/30 rounded-lg p-6 bg-gradient-to-br from-blue-500/10 via-black to-purple-500/10 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Live Link Established</span>
                </div>
              </div>

              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    <Activity className="w-6 h-6 text-blue-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Mission Control</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-white/60 font-medium">Currently:</span>
                      <span className="text-xs text-blue-400 font-mono font-bold animate-pulse">{rapidStatus || 'Synchronizing...'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-mono font-black text-white">{rapidProgress || 0}%</div>
                  <div className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Current Step Progress</div>
                </div>
              </div>

              {/* Progress Gauges */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-white/60 mb-2">
                    <span>Campaign Sequence</span>
                    <span>{rapidAllProgress} / {rapidAllTotal} Sites Complete</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                      style={{ width: `${(rapidAllProgress / (rapidAllTotal || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-[9px] text-white/40 uppercase mb-1">Active Target</div>
                    <div className="text-xs text-white font-mono truncate">{rapidCurrentCompany || 'Waiting...'}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-white/40 uppercase mb-1">System Health</div>
                      <div className="text-xs text-emerald-400 font-bold">OPTIMAL</div>
                    </div>
                    <button
                      onClick={handleStopCampaign}
                      disabled={isStopping}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white text-[10px] font-black rounded border border-rose-500/30 transition-all uppercase tracking-widest disabled:opacity-50"
                    >
                      {isStopping ? 'Stopping...' : 'Abort Mission'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Activity Log */}
            <div className="border border-white/10 rounded-lg flex flex-col bg-black/40 backdrop-blur-sm overflow-hidden h-[320px]">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Real-time Stream</span>
                </div>
                <div className="text-[9px] font-mono text-white/40 animate-pulse text-right">
                  Receiving Data...
                </div>
              </div>
              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto p-4 font-mono space-y-2 scrollbar-hide"
              >
                {activityLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-[10px] text-white/20 italic">Awaiting events from server...</p>
                  </div>
                ) : (
                  activityLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 text-[10px] animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-white/20 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                      {log.company_name && <span className="text-blue-500 shrink-0">[{log.company_name}]</span>}
                      <span className={`
                        ${log.level === 'error' ? 'text-rose-400 font-bold' : 
                          log.level === 'success' ? 'text-emerald-400' : 
                          log.level === 'warning' ? 'text-amber-400' : 'text-white/80'}
                      `}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats - Calculate from companies array for real-time updates */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {[
            {
              label: "Total",
              value: stats.total,
              color: "text-white",
              bg: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=200&fit=crop",
            },
            {
              label: "Processed",
              value: stats.processed,
              color: "text-white",
              bg: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop",
            },
            {
              label: "Success",
              value: stats.success,
              color: "text-emerald-400",
              bg: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=200&fit=crop",
            },
            {
              label: "Contact Info",
              value: stats.contactInfoFound,
              color: "text-blue-400",
              bg: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop",
            },
            {
              label: "Failed",
              value: stats.failed,
              color: "text-rose-400",
              bg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop",
            },
            {
              label: "CAPTCHA",
              value: stats.captcha,
              color: "text-amber-400",
              bg: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=200&fit=crop",
            },
            {
              label: "Progress",
              value: `${stats.progress}%`,
              color: "text-white",
              bg: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="relative border border-white/30 p-4 hover:border-white/50 transition-colors overflow-hidden group"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ backgroundImage: `url(${stat.bg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="relative z-10">
                <div className="text-[10px] text-white mb-2 uppercase tracking-wider">
                  {stat.label}
                </div>
                <div className={`text-2xl font-mono ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Companies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs text-white font-medium">
              Companies ({filteredCompanies.length})
            </h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-black border border-gray-900 text-xs text-white
                       hover:border-gray-800 focus:border-white focus:outline-none transition-colors"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="success">Success</option>
              <option value="contact_info_found">Contact Info Found</option>
              <option value="failed">Failed</option>
              <option value="captcha">CAPTCHA</option>
            </select>
            <select
              value={filterMethod || "all"}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-3 py-1.5 bg-black border border-gray-900 text-xs text-white
                       hover:border-gray-800 focus:border-white focus:outline-none transition-colors ml-2"
            >
              <option value="all">All Methods</option>
              <option value="form_submitted">Form Submitted</option>
              <option value="contact_page_only">Contact Page Only</option>
              <option value="form_with_captcha">CAPTCHA Detected</option>
              <option value="no_contact_found">No Contact Found</option>
            </select>
          </div>

          {/* Table Container */}
          <div className="border border-white/20 rounded-lg overflow-hidden">
            {/* Column Headers */}
            <div className="grid grid-cols-[1fr_140px_200px_80px_200px] gap-4 px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="text-[10px] text-white uppercase tracking-wider">
                Company
              </div>
              <div className="text-[10px] text-white uppercase tracking-wider">
                Status
              </div>
              <div className="text-[10px] text-white uppercase tracking-wider">
                Details
              </div>
              <div className="text-[10px] text-white uppercase tracking-wider text-center">
                Screenshot
              </div>
              <div className="text-[10px] text-white uppercase tracking-wider text-center">
                Actions
              </div>
            </div>

            {/* Table Rows - Paginated */}
            <div>
              {paginatedCompanies.map((company, idx) => (
                <div
                  key={company.id}
                  onMouseEnter={() => setHoveredRow(company.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`
                  group relative grid grid-cols-[1fr_140px_200px_80px_200px] gap-4 items-center
                  px-4 py-4 transition-all duration-150
                  ${idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"}
                  ${hoveredRow === company.id ? "bg-white/[0.05]" : ""}
                  ${idx === 0 ? "" : "border-t border-white/5"}
                `}
                >
                  {/* Company */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate group-hover:text-white transition-colors">
                        {company.company_name}
                      </div>
                      <div className="text-[11px] text-white font-mono truncate mt-0.5">
                        {company.website_url}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div
                    className={`flex items-center gap-2 ${getStatusColor(
                      company.status
                    )}`}
                  >
                    {getStatusIcon(company.status)}
                    <span className="text-xs capitalize">{company.status}</span>
                  </div>

                  {/* Details */}
                  <div className="text-xs text-white/80">
                    {company.status === "completed" || company.status === "success" ? (
                      <div className="space-y-0.5">
                        <div className="text-emerald-400">✓ Form submitted successfully</div>
                        {company.fields_filled && (
                          <div className="text-emerald-300 text-[10px]">
                            {company.fields_filled} fields filled
                          </div>
                        )}
                        {company.detection_method && (
                          <div className="text-white/50 text-[9px]">
                            Method: {company.detection_method.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    ) : company.status === "contact_info_found" ? (
                      <div className="space-y-0.5">
                        <div className="text-cyan-400">✓ Contact info extracted</div>
                        <div className="text-white/60 text-[10px]">
                          Found alternative contact methods
                        </div>
                        {company.contact_info && (
                          <div className="text-cyan-300 text-[9px]">
                            {company.contact_info.emails?.length || 0} emails, {company.contact_info.phones?.length || 0} phones
                          </div>
                        )}
                      </div>
                    ) : company.status === "captcha" ? (
                      <div className="space-y-0.5">
                        <div className="text-amber-400">🤖 CAPTCHA detected</div>
                        <div className="text-white/60 text-[10px]">
                          Manual intervention required
                        </div>
                        {company.detection_method && (
                          <div className="text-amber-300 text-[9px]">
                            Method: {company.detection_method.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    ) : company.error_message ? (
                      <div className="space-y-0.5">
                        <span className="text-rose-400 text-xs leading-relaxed">
                          {getUserFriendlyError(company.error_message)}
                        </span>
                        {company.detection_method && company.detection_method !== 'unknown' && (
                          <div className="text-rose-300 text-[9px]">
                            Method: {company.detection_method.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    ) : company.status === "processing" ? (
                      <span className="text-blue-400">In progress...</span>
                    ) : company.contact_page_found ? (
                      <span className="text-white/60">
                        Contact form detected
                      </span>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </div>

                  {/* Proof */}
                  <div className="flex justify-center">
                    {company.screenshot_url ? (
                      <button
                        onClick={() =>
                          setSelectedScreenshot(company.screenshot_url || null)
                        }
                        className="relative group/img"
                      >
                        <img
                          src={company.screenshot_url}
                          alt="Proof"
                          className="w-12 h-12 object-cover border border-gray-800 group-hover/img:border-white transition-colors"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-12 h-12 border border-gray-900 flex items-center justify-center">
                        <span className="text-white text-xs">—</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3">
                    {company.status === "completed" ? (
                      // Completed: Show non-clickable Complete button
                      <>
                        <button
                          disabled
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 cursor-default"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Complete
                        </button>
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusDotColor(
                            company.status
                          )}`}
                        />
                      </>
                    ) : (
                      // Not completed: Show View and Rapid buttons
                      <>
                        <button
                          onClick={() =>
                            router.push(
                              `/campaigns/${campaignId}/monitor?company=${company.id}`
                            )
                          }
                          disabled={
                            processingCompanyId !== null &&
                            processingCompanyId !== company.id
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white hover:text-white hover:bg-white/10 transition-colors border border-white/20 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          onClick={() => handleRapidProcess(company.id)}
                          disabled={
                            processingCompanyId !== null ||
                            company.status === "processing"
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-black bg-white hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
                        >
                          {processingCompanyId === company.id ? (
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Activity className="w-3.5 h-3.5" />
                          )}
                          Rapid
                        </button>
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusDotColor(
                            company.status
                          )}`}
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <div className="text-xs text-gray-400">
                Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, filteredCompanies.length)} of {filteredCompanies.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded text-xs transition-colors ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8 backdrop-blur-sm"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div
            className="relative max-w-6xl max-h-[90vh] overflow-auto border border-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 p-2 bg-black/80 hover:bg-black text-white border border-gray-800 hover:border-white transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={selectedScreenshot}
              alt="Form submission proof"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteCampaign}
        title="Delete Campaign Permanently"
        message={`Are you sure you want to delete "${campaign?.name}"? This will permanently delete the campaign and all ${campaign?.total_companies} companies. This action cannot be undone.`}
        variant="danger"
      />

      {/* Export Options Modal */}
      <ExportOptionsModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        campaignName={campaign?.name || 'Campaign'}
        isExporting={isExporting}
      />

      {/* Rapid All Limit Modal */}
      <RetryFailedModal
        isOpen={retryFailedModalOpen}
        onClose={() => setRetryFailedModalOpen(false)}
        onRetry={handleRetryFailed}
        failedCount={stats.failed}
      />

      <RapidAllLimitModal
        isOpen={rapidAllModalOpen}
        onClose={() => setRapidAllModalOpen(false)}
        onStart={handleStartRapidAllWithLimit}
        maxAvailable={companies.filter((c) => c.status === "pending").length}
        maxSubscriptionTier={campaignLimit === Infinity ? 999999 : campaignLimit}
        subscriptionTier={user?.subscription_tier || 'free'}
        isProcessing={isRapidAllRunning}
      />
    </div>
  );
}
