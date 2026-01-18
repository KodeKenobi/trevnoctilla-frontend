"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

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
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
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

  const campaignId = params?.id as string;

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
      const interval = setInterval(() => {
        if (
          campaign?.status === "processing" ||
          campaign?.status === "queued"
        ) {
          fetchCampaignDetails(true);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [campaignId, campaign?.status]);

  const fetchCampaignDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);

      const [campaignRes, companiesRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}`),
        fetch(`/api/campaigns/${campaignId}/companies`),
      ]);

      if (campaignRes.ok) {
        const campaignData = await campaignRes.json();
        setCampaign(campaignData.campaign);
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData.companies || []);
      }
    } catch (error) {
      console.error("Failed to fetch campaign details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    try {
      setProcessingCompanyId(companyId);

      // Find company name for display
      const company = companies.find((c) => c.id === companyId);
      setRapidCurrentCompany(company?.company_name || `Company ${companyId}`);
      setRapidProgress(0);
      setRapidStatus("Starting...");

      // Update company status to processing
      const response = await fetch(`/api/campaigns/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "processing" }),
      });

      if (!response.ok) {
        throw new Error("Failed to start rapid processing");
      }

      // Start processing in background via WebSocket (but don't navigate to monitor page)
      // The backend will handle it and update the status
      const wsProtocol =
        window.location.protocol === "https:" ? "wss:" : "wss:";
      const backendUrl = "web-production-737b.up.railway.app";
      const wsUrl = `${wsProtocol}//${backendUrl}/ws/campaign/${campaignId}/monitor/${companyId}`;

      console.log("[Rapid] Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);
      setActiveWebSocket(ws); // Store WebSocket reference for emergency stop

      ws.onopen = () => {
        console.log(`[Rapid] Started processing company ${companyId}`);
        setRapidStatus("Connected");
        setRapidProgress(10);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        // Update progress based on message type
        if (message.type === "log") {
          const log = message.data;
          setRapidStatus(log.message || log.action);

          // Map actions to progress percentages
          if (log.action?.includes("Navigation")) setRapidProgress(20);
          else if (log.action?.includes("Contact")) setRapidProgress(40);
          else if (log.action?.includes("Form")) setRapidProgress(60);
          else if (log.action?.includes("Submit")) setRapidProgress(80);
          else if (log.action?.includes("Screenshot")) setRapidProgress(90);
        } else if (message.type === "completed") {
          setRapidProgress(100);
          setRapidStatus("Completed!");
          ws.close();
          setActiveWebSocket(null);
          setProcessingCompanyId(null);
          fetchCampaignDetails(); // Refresh to show updated status

          // Reset progress display after a delay
          setTimeout(() => {
            setRapidProgress(0);
            setRapidStatus("");
            setRapidCurrentCompany("");
          }, 2000);

          // Auto-process next ONLY if "Rapid All" is running
          if (isRapidAllRunning) {
            processNextPending();
          }
        } else if (message.type === "error") {
          setRapidProgress(0);
          setRapidStatus("Failed");
          ws.close();
          setActiveWebSocket(null);
          setProcessingCompanyId(null);
          fetchCampaignDetails();

          setTimeout(() => {
            setRapidStatus("");
            setRapidCurrentCompany("");
          }, 3000);
        }
      };

      ws.onerror = () => {
        setActiveWebSocket(null);
        setProcessingCompanyId(null);
        setRapidProgress(0);
        setRapidStatus("Connection error");
        setRapidCurrentCompany("");
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

  const processNextPending = () => {
    // Find next pending company and auto-process it
    const nextPending = companies.find((c) => c.status === "pending");

    // Only process if there's a pending company AND no other company is currently processing
    if (nextPending && processingCompanyId === null && isRapidAllRunning) {
      console.log(
        "[Rapid All] Processing next pending company:",
        nextPending.company_name
      );
      setTimeout(() => {
        handleRapidProcess(nextPending.id);
      }, 1000); // Small delay between companies
    } else if (!nextPending) {
      // No more pending companies - stop Rapid All
      console.log("[Rapid All] All companies processed. Campaign complete.");
      setIsRapidAllRunning(false);
    }
  };

  const startRapidAll = () => {
    const pendingCompanies = companies.filter((c) => c.status === "pending");

    if (pendingCompanies.length === 0) {
      alert("No pending companies to process!");
      return;
    }

    console.log(
      `[Rapid All] Starting batch processing for ${pendingCompanies.length} companies`
    );
    setIsRapidAllRunning(true);

    // Start with the first pending company
    handleRapidProcess(pendingCompanies[0].id);
  };

  // DISABLED: No auto-start. User must manually click "Rapid" for each company.
  // This prevents infinite loops and unwanted processing.

  const filteredCompanies = companies.filter((company) =>
    filterStatus === "all" ? true : company.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-400";
      case "processing":
        return "text-blue-400";
      case "failed":
        return "text-rose-400";
      case "captcha":
        return "text-amber-400";
      default:
        return "text-white";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-400";
      case "failed":
        return "bg-rose-400";
      default:
        return "bg-amber-400"; // pending, processing, queued, etc.
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-3.5 h-3.5";
    switch (status) {
      case "completed":
        return <CheckCircle className={iconClass} />;
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
                    : `Rapid All (${
                        companies.filter((c) => c.status === "pending").length
                      })`}
                </button>
              )}
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

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "Total",
              value: campaign.total_companies,
              color: "text-white",
              bg: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=200&fit=crop",
            },
            {
              label: "Processed",
              value: campaign.processed_count,
              color: "text-white",
              bg: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop",
            },
            {
              label: "Success",
              value: campaign.success_count,
              color: "text-emerald-400",
              bg: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=200&fit=crop",
            },
            {
              label: "Failed",
              value: campaign.failed_count,
              color: "text-rose-400",
              bg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop",
            },
            {
              label: "Progress",
              value: `${campaign.progress_percentage}%`,
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
              <option value="failed">Failed</option>
              <option value="captcha">CAPTCHA</option>
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

            {/* Table Rows */}
            <div>
              {filteredCompanies.map((company, idx) => (
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
                    {company.status === "completed" ? (
                      <div className="space-y-0.5">
                        <div className="text-emerald-400">✓ Form submitted</div>
                        {company.contact_email && (
                          <div className="text-white/40 font-mono text-[10px]">
                            {company.contact_email}
                          </div>
                        )}
                      </div>
                    ) : company.error_message ? (
                      <span className="text-rose-400">
                        {company.error_message}
                      </span>
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
    </div>
  );
}
