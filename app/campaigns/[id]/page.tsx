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
        return "text-gray-600";
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
      <div className="min-h-screen flex items-center justify-center bg-black pt-16">
        <Loader className="w-4 h-4 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black pt-16">
        <p className="text-gray-600 text-sm">Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-12 px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-900">
          <button
            onClick={() => router.push("/campaigns")}
            className="group flex items-center gap-2 text-gray-600 hover:text-white text-xs mb-4 transition-colors"
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
                className="p-2 hover:bg-gray-900 text-gray-600 hover:text-white transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
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

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "Total",
              value: campaign.total_companies,
              color: "text-gray-400",
            },
            {
              label: "Processed",
              value: campaign.processed_count,
              color: "text-gray-400",
            },
            {
              label: "Success",
              value: campaign.success_count,
              color: "text-emerald-400",
            },
            {
              label: "Failed",
              value: campaign.failed_count,
              color: "text-rose-400",
            },
            {
              label: "Progress",
              value: `${campaign.progress_percentage}%`,
              color: "text-white",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="border border-gray-900 p-4 hover:border-gray-800 transition-colors"
            >
              <div className="text-[10px] text-gray-700 mb-2 uppercase tracking-wider">
                {stat.label}
              </div>
              <div className={`text-2xl font-mono ${stat.color}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Companies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs text-gray-500 font-medium">
              Companies ({filteredCompanies.length})
            </h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-black border border-gray-900 text-xs text-gray-400 
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

          <div className="space-y-2">
            {filteredCompanies.map((company, idx) => (
              <div
                key={company.id}
                onMouseEnter={() => setHoveredRow(company.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`
                  group relative grid grid-cols-[1fr_140px_200px_80px_200px] gap-4 items-center
                  px-4 py-3 transition-all duration-150
                  ${
                    hoveredRow === company.id
                      ? "bg-gray-950/50 border-gray-800"
                      : "border-transparent"
                  }
                  ${idx === 0 ? "" : "border-t border-gray-900"}
                `}
              >
                {/* Company */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-800 flex-shrink-0 group-hover:bg-white transition-colors" />
                  <div className="min-w-0">
                    <div className="text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                      {company.company_name}
                    </div>
                    <div className="text-[11px] text-gray-600 font-mono truncate mt-0.5">
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
                <div className="text-xs text-gray-500 truncate">
                  {company.error_message ? (
                    <span className="text-rose-400">
                      {company.error_message}
                    </span>
                  ) : company.contact_page_found ? (
                    <span className="text-emerald-400">
                      ✓ Contact form found
                    </span>
                  ) : (
                    <span className="text-gray-700">—</span>
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
                      <span className="text-gray-800 text-xs">—</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() =>
                      router.push(
                        `/campaigns/${campaignId}/monitor?company=${company.id}`
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-white hover:bg-gray-900 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Monitor
                  </button>
                </div>

                {/* Hover indicator */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-0.5 bg-white transition-opacity ${
                    hoveredRow === company.id ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            ))}
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
