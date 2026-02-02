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

const handleRapidProcess = async (companyId: number) => {
  const currentCompanyId = companyId;

  try {
    setProcessingCompanyId(currentCompanyId);

    const company = companies.find((c) => c.id === currentCompanyId);
    setRapidCurrentCompany(company?.company_name || `Company ${currentCompanyId}`);
    setRapidProgress(0);
    setRapidStatus("Starting...");

    const response = await fetch(`/api/campaigns/companies/${currentCompanyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "processing" }),
    });

    if (!response.ok) {
      throw new Error("Failed to start rapid processing");
    }

    const cleanup = () => {
      setActiveWebSocket(null);
      setProcessingCompanyId(null);
      setRapidProgress(0);
      setRapidStatus("");
      setRapidCurrentCompany("");
    };

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "wss:";
    const backendUrl = "web-production-737b.up.railway.app";
    const wsUrl = `${wsProtocol}//${backendUrl}/ws/campaign/${campaignId}/monitor/${currentCompanyId}`;

    console.log("[Rapid] Connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);
    setActiveWebSocket(ws);

    ws.onopen = () => {
      setRapidStatus("Connected");
      setRapidProgress(10);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "log") {
        const log = message.data;
        setRapidStatus(log.message || log.action);

        if (log.action?.includes("Navigation")) setRapidProgress(20);
        else if (log.action?.includes("Contact")) setRapidProgress(40);
        else if (log.action?.includes("Form")) setRapidProgress(60);
        else if (log.action?.includes("Submit")) setRapidProgress(80);
        else if (log.action?.includes("Screenshot")) setRapidProgress(90);
      }

      if (message.type === "completed") {
        setRapidProgress(100);
        setRapidStatus("Completed!");

        ws.close();
        cleanup();

        setCompanies((prev) =>
          prev.map((c) =>
            c.id === currentCompanyId ? { ...c, status: "completed" } : c
          )
        );

        if (isRapidAllRunningRef.current) {
          setRapidAllProgress((prev) => prev + 1);
          setTimeout(() => processNextPending(), 200);
        }
      }

      if (message.type === "error") {
        ws.close();
        cleanup();

        setCompanies((prev) =>
          prev.map((c) =>
            c.id === currentCompanyId ? { ...c, status: "failed" } : c
          )
        );

        if (isRapidAllRunningRef.current) {
          setRapidAllProgress((prev) => prev + 1);
          setTimeout(() => processNextPending(), 200);
        }
      }
    };

    ws.onerror = () => {
      ws.close();
      cleanup();
      alert("Failed to process company");
    };
  } catch (error: any) {
    console.error("Failed to start rapid processing:", error);
    alert(`Failed to start processing: ${error.message}`);

    setActiveWebSocket(null);
    setProcessingCompanyId(null);
    setRapidProgress(0);
    setRapidStatus("");
    setRapidCurrentCompany("");
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

  // BATCH processing: Visit website ONCE, submit multiple forms
const rapidProcessBatch = async (batchCompanies: Company[]) => {
  const startTime = Date.now();
  const companyIds = batchCompanies.map(c => c.id);
  const websiteUrl = batchCompanies[0].website_url;

  let pollInterval: NodeJS.Timeout | null = null;

  console.log(`[Batch] Processing ${batchCompanies.length} companies with same URL: ${websiteUrl}`);

  try {
    setProcessingCount((prev) => prev + batchCompanies.length);

    // Start polling for real-time updates
    pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`/api/campaigns/${campaignId}/companies`);
        const statusData = await statusResponse.json();

        if (statusData.companies) {
          setCompanies(statusData.companies);

          const batchProcessed = statusData.companies.filter(
            (c: Company) =>
              companyIds.includes(c.id) &&
              (c.status === 'completed' || c.status === 'failed')
          ).length;

          if (batchProcessed > 0) {
            console.log(
              `[Batch] Real-time progress: ${batchProcessed}/${batchCompanies.length} completed`
            );
          }
        }
      } catch (error) {
        console.error('[Batch] Polling error:', error);
      }
    }, 1000);

    const response = await fetch(
      `/api/campaigns/${campaignId}/rapid-process-batch`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_ids: companyIds }),
      }
    );

    let data: any = {};
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(`Batch request failed (${response.status})`);
    }

    const processingTime = (Date.now() - startTime) / 1000;

    processingTimesRef.current.push(processingTime);
    if (processingTimesRef.current.length > 10) {
      processingTimesRef.current.shift();
    }

    const avgTime =
      processingTimesRef.current.reduce((a, b) => a + b, 0) /
      processingTimesRef.current.length;

    setAvgProcessingTime(avgTime);

    if (data.results && Array.isArray(data.results)) {
      setCompanies((prevCompanies) =>
        prevCompanies.map((c) => {
          const result = data.results.find((r: any) => r.companyId === c.id);
          if (result) {
            return {
              ...c,
              status: result.status,
              screenshot_url: result.screenshotUrl || c.screenshot_url,
              error_message: result.errorMessage
                ? getUserFriendlyError(result.errorMessage)
                : c.error_message,
            };
          }
          return c;
        })
      );
    }

    setRapidAllProgress((prev) => prev + batchCompanies.length);

    console.log(
      `[Batch] Completed ${batchCompanies.length} companies in ${processingTime.toFixed(2)}s`
    );

    return data;
  } catch (error) {
    console.error(`[Batch] Error processing batch:`, error);

    setCompanies((prevCompanies) =>
      prevCompanies.map((c) =>
        companyIds.includes(c.id)
          ? { ...c, status: 'failed', error_message: getUserFriendlyError('Processing error') }
          : c
      )
    );

    setRapidAllProgress((prev) => prev + batchCompanies.length);

    return { success: false, status: 'failed' };
  } finally {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    setProcessingCount((prev) => prev - batchCompanies.length);
  }
};


  // Headless rapid processing (no WebSocket, faster) - for single companies
const rapidProcessCompany = async (companyId: number) => {
  const startTime = Date.now();
  let pollInterval: any;

  try {
    setProcessingCount((prev) => prev + 1);

    // Start polling for real-time updates (backend marks as processing)
    pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(
          `/api/campaigns/${campaignId}/companies`
        );

        if (!statusResponse.ok) return;

        const contentType = statusResponse.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return;

        const statusData = await statusResponse.json();
        if (statusData.companies) {
          setCompanies(statusData.companies);
        }
      } catch (error) {
        console.error("[Rapid] Polling error:", error);
      }
    }, 1000);

    // Start backend processing
    const response = await fetch(
      `/api/campaigns/${campaignId}/companies/${companyId}/rapid-process`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId }),
      }
    );

    // Safely read response ONCE
    let data: any = {};
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const processingTime = (Date.now() - startTime) / 1000;

    // Track processing time for ETA
    processingTimesRef.current.push(processingTime);
    if (processingTimesRef.current.length > 10) {
      processingTimesRef.current.shift();
    }

    const avgTime =
      processingTimesRef.current.reduce((a, b) => a + b, 0) /
      processingTimesRef.current.length;
    setAvgProcessingTime(avgTime);

    // Update company status locally (SAFE MERGE)
    setCompanies((prevCompanies) =>
      prevCompanies.map((c) =>
        c.id === companyId
          ? {
              ...c,
              status: data.status ?? c.status,
              screenshot_url: data.screenshotUrl ?? c.screenshot_url,
              error_message: data.errorMessage
                ? getUserFriendlyError(data.errorMessage)
                : c.error_message,
              contact_method: data.contactMethod ?? c.contact_method,
              detection_method: data.method ?? c.detection_method,
              fields_filled: data.fieldsFilled ?? c.fields_filled,
              contact_info: data.contactInfo ?? c.contact_info,
            }
          : c
      )
    );

    // Increment progress
    setRapidAllProgress((prev) => prev + 1);

    console.log(
      `[Rapid All] Company ${companyId} completed: ${data.status} (${processingTime.toFixed(
        2
      )}s)`
    );

    return data;
  } catch (error) {
    console.error(
      `[Rapid All] Error processing company ${companyId}:`,
      error
    );

    const friendlyError = getUserFriendlyError(
      error instanceof Error ? error.message : String(error)
    );

    // Mark as failed
    setCompanies((prevCompanies) =>
      prevCompanies.map((c) =>
        c.id === companyId
          ? { ...c, status: "failed", error_message: friendlyError }
          : c
      )
    );

    setRapidAllProgress((prev) => prev + 1);

    return { success: false, status: "failed" };
  } finally {
    // ✅ Polling stops ONLY when function is truly finished
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    setProcessingCount((prev) => Math.max(0, prev - 1));
  }
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

  const processNextPending = useCallback(() => {
    // Use refs to avoid stale closures (CRITICAL FIX)
    const currentProgress = rapidAllProgressRef.current;
    const currentLimit = customProcessingLimitRef.current;
    const isRunning = isRapidAllRunningRef.current;

    if (!isRunning) {
      console.log("[Rapid All] Not running, skipping");
      return;
    }

    // Check if we've hit the custom limit
    if (currentLimit && currentProgress >= currentLimit) {
      console.log(
        `[Rapid All] Reached custom limit of ${currentLimit} companies (processed: ${currentProgress})`
      );
      setIsRapidAllRunning(false);
      return;
    }

    // Get latest companies state
    setCompanies((prevCompanies) => {
      const nextPending = prevCompanies.find((c) => c.status === "pending");

      if (nextPending) {
        console.log(
          `[Rapid All] Processing next pending company (${currentProgress + 1}/${currentLimit || 'unlimited'}):`,
          nextPending.company_name
        );
        // Process using headless API (faster, no WebSocket)
        rapidProcessCompany(nextPending.id).then(() => {
          // After completion, check if we should continue
          if (isRapidAllRunningRef.current) {
            setTimeout(() => processNextPending(), 100);
          }
        });
      } else {
        // No more pending companies - stop Rapid All
        console.log("[Rapid All] All companies processed. Campaign complete.");
        setIsRapidAllRunning(false);
        
        // Check for failures and show retry modal
        const failedCompanies = prevCompanies.filter(c => c.status === 'failed');
        if (failedCompanies.length > 0) {
          setTimeout(() => {
            setRetryFailedModalOpen(true);
          }, 500); // Small delay to ensure state is updated
        }
      }
      return prevCompanies;
    });
  }, []); // Empty dependencies - use refs for values

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
    const pendingCompanies = companies.filter((c) => c.status === "pending").slice(0, limit);

    // GROUP COMPANIES BY URL FOR BATCH PROCESSING
    const companyGroups: { [url: string]: Company[] } = {};
    pendingCompanies.forEach((company) => {
      const url = company.website_url;
      if (!companyGroups[url]) {
        companyGroups[url] = [];
      }
      companyGroups[url].push(company);
    });

    const urlGroups = Object.entries(companyGroups);
    const batchCount = urlGroups.filter(([_, companies]) => companies.length > 1).length;

    console.log(`[Rapid All] Starting SMART BATCH processing for ${pendingCompanies.length} companies`);
    console.log(`[Rapid All] Unique URLs: ${urlGroups.length}, Batches: ${batchCount}`);
    
    urlGroups.forEach(([url, companyList]) => {
      if (companyList.length > 1) {
        console.log(`[Batch] ${url} → ${companyList.length} companies (1 visit, ${companyList.length} submissions)`);
      }
    });

    setCustomProcessingLimit(limit);
    setRapidAllTotal(pendingCompanies.length);
    setRapidAllProgress(0);
    setProcessingCount(0);
    setAvgProcessingTime(0);
    processingTimesRef.current = [];
    setIsRapidAllRunning(true);
    isRapidAllRunningRef.current = true; // CRITICAL: Update ref immediately before loop
    setRapidAllModalOpen(false);

    // Process all URL groups (batches for duplicates, single for unique)
    console.log(`[Rapid All] Processing ${urlGroups.length} URL groups`);
    
    for (const [url, groupCompanies] of urlGroups) {
      if (!isRapidAllRunningRef.current) {
        console.log("[Rapid All] Stopped by user");
        break;
      }

      if (groupCompanies.length > 1) {
        // BATCH: Multiple companies with same URL - visit once, submit multiple times
        console.log(`[Batch] Processing batch of ${groupCompanies.length} for ${url}`);
        await rapidProcessBatch(groupCompanies);
      } else {
        // SINGLE: Only one company for this URL
        console.log(`[Single] Processing ${groupCompanies[0].company_name}`);
        await rapidProcessCompany(groupCompanies[0].id);
      }
    }

    console.log("[Rapid All] All batches complete");
    setIsRapidAllRunning(false);
    
    // Check for failures and show retry modal after state updates
    setTimeout(() => {
      setCompanies((currentCompanies) => {
        const failedCompanies = currentCompanies.filter(c => c.status === 'failed');
        if (failedCompanies.length > 0) {
          setRetryFailedModalOpen(true);
        }
        return currentCompanies;
      });
    }, 500);
  };

  // OLD PARALLEL APPROACH - KEPT FOR REFERENCE BUT NOT USED
  const handleStartRapidAllWithLimit_OLD = async (limit: number) => {
    const pendingCompanies = companies.filter((c) => c.status === "pending");

    console.log(
      `[Rapid All] Starting parallel batch processing for ${limit} companies (5 at a time)`
    );
    setCustomProcessingLimit(limit); // Set limit for tracking
    setRapidAllTotal(Math.min(limit, pendingCompanies.length));
    setRapidAllProgress(0);
    setProcessingCount(0);
    setAvgProcessingTime(0);
    processingTimesRef.current = [];
    setIsRapidAllRunning(true);
    setRapidAllModalOpen(false);

    // Start 5 companies in parallel (or fewer if less than 5 pending)
    const PARALLEL_COUNT = 5;
    const initialBatch = pendingCompanies.slice(0, Math.min(PARALLEL_COUNT, limit));
    
    console.log(`[Rapid All] Starting initial batch of ${initialBatch.length} companies`);
    
    for (const company of initialBatch) {
      rapidProcessCompany(company.id).then(() => {
        // After completion, start next pending if we should continue
        if (isRapidAllRunningRef.current) {
          setTimeout(() => {
            const currentProgress = rapidAllProgressRef.current;
            const currentLimit = customProcessingLimitRef.current;
            
            if (currentLimit && currentProgress >= currentLimit) {
              // Reached limit, check if all processing is done
              setProcessingCount((count) => {
                if (count === 0) {
                  setIsRapidAllRunning(false);
                  console.log('[Rapid All] Limit reached. Stopping.');
                }
                return count;
              });
            } else {
              // Start next pending
              setCompanies((prevCompanies) => {
                const nextPending = prevCompanies.find((c) => c.status === "pending");
                if (nextPending) {
                  rapidProcessCompany(nextPending.id);
                } else {
                  // No more pending, check if all done
                  setProcessingCount((count) => {
                    if (count === 0) {
                      setIsRapidAllRunning(false);
                      console.log('[Rapid All] All companies processed!');
                    }
                    return count;
                  });
                }
                return prevCompanies;
              });
            }
          }, 100);
        }
      });
    }
  };

  const handleRetryFailed = async () => {
    setCompanies((prevCompanies) => {
      const failedCompanies = prevCompanies.filter(c => c.status === 'failed');
      
      if (failedCompanies.length === 0) {
        alert("No failed companies to retry");
        return prevCompanies;
      }

      // Reset failed companies to pending status
      const updatedCompanies = prevCompanies.map((c) =>
        c.status === 'failed' ? { ...c, status: 'pending', error_message: null } : c
      );

      // Start rapid all processing for the failed companies
      const limit = failedCompanies.length;
      setCustomProcessingLimit(limit);
      setRapidAllTotal(limit);
      setRapidAllProgress(0);
      setProcessingCount(0);
      setAvgProcessingTime(0);
      processingTimesRef.current = [];
      setIsRapidAllRunning(true);
      isRapidAllRunningRef.current = true;

      // Group by URL for batch processing
      const companyGroups: { [url: string]: Company[] } = {};
      failedCompanies.forEach((company) => {
        const url = company.website_url;
        if (!companyGroups[url]) {
          companyGroups[url] = [];
        }
        companyGroups[url].push(company);
      });

      const urlGroups = Object.entries(companyGroups);

      // Process all URL groups
      (async () => {
        for (const [url, groupCompanies] of urlGroups) {
          if (!isRapidAllRunningRef.current) break;

          if (groupCompanies.length > 1) {
            // BATCH: Multiple companies with same URL
            await rapidProcessBatch(groupCompanies);
          } else {
            // SINGLE: Only one company for this URL
            await rapidProcessCompany(groupCompanies[0].id);
          }
        }

        setIsRapidAllRunning(false);
        
        // Check for failures again after retry
        setTimeout(() => {
          setCompanies((currentCompanies) => {
            const stillFailed = currentCompanies.filter(c => c.status === 'failed');
            if (stillFailed.length > 0) {
              setRetryFailedModalOpen(true);
            }
            return currentCompanies;
          });
        }, 500);
      })();

      return updatedCompanies;
    });
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
                  {isRapidAllRunning
                    ? "Processing All..."
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
                onClick={() => router.push(`/campaigns/${campaignId}/monitor`)}
                className="group flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-medium hover:bg-gray-100 transition-colors rounded-lg"
              >
                <Eye className="w-3.5 h-3.5" />
                Live Monitor
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

        {/* Rapid Progress Bar */}
        {processingCompanyId && (
          <div className="mb-6 border border-white/20 rounded-lg p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                  <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Processing: {rapidCurrentCompany}
                  </div>
                  <div className="text-xs text-white/60 mt-0.5">
                    {rapidStatus}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-mono text-white">
                  {rapidProgress}%
                </div>
                <button
                  onClick={emergencyStopAll}
                  className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  STOP
                </button>
              </div>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${rapidProgress}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-white/40 font-mono">
              {companies.filter((c) => c.status === "completed").length} /{" "}
              {companies.length} companies processed
            </div>
          </div>
        )}

        {/* Rapid All Progress Bar */}
        {isRapidAllRunning && rapidAllTotal > 0 && (
          <div className="mb-6 border border-emerald-500/30 rounded-lg p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    Rapid All Processing (Parallel Mode)
                  </div>
                  <div className="text-xs text-white/60 mt-0.5">
                    {rapidAllProgress}/{rapidAllTotal} completed • {processingCount} processing
                    {avgProcessingTime > 0 && (
                      <span className="ml-2">
                        • ETA: {Math.ceil((rapidAllTotal - rapidAllProgress) * avgProcessingTime / 5)}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-mono text-white font-bold">
                  {Math.round((rapidAllProgress / rapidAllTotal) * 100)}%
                </div>
                <button
                  onClick={emergencyStopAll}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  STOP ALL
                </button>
              </div>
            </div>
            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300 ease-out"
                style={{ width: `${(rapidAllProgress / rapidAllTotal) * 100}%` }}
              />
            </div>
            {avgProcessingTime > 0 && (
              <div className="mt-2 text-[10px] text-white/50 font-mono">
                Avg: {avgProcessingTime.toFixed(1)}s per company • Speed: ~{Math.round(60 / avgProcessingTime * 5)} companies/min (5x parallel)
              </div>
            )}
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
