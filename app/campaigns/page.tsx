"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  ArrowRight,
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
  started_at?: string;
  completed_at?: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/campaigns");
      if (!response.ok) {
        throw new Error("Failed to fetch campaigns");
      }
      const data = await response.json();
      setCampaigns(data.campaigns || []);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch campaigns:", err);
      setError(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (campaignId: number) => {
    setCampaignToDelete(campaignId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;

    try {
      const response = await fetch(`/api/campaigns/${campaignToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete campaign");
      }

      fetchCampaigns();
      setCampaignToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete campaign:", err);
      setError(err.message || "Failed to delete campaign");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-emerald-400";
      case "processing": return "text-blue-400";
      case "queued": return "text-purple-400";
      case "failed": return "text-rose-400";
      case "paused": return "text-amber-400";
      default: return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-4 h-4";
    switch (status) {
      case "completed": return <CheckCircle className={iconClass} />;
      case "processing": return <Loader className={`${iconClass} animate-spin`} />;
      case "queued": return <Clock className={iconClass} />;
      case "failed": return <XCircle className={iconClass} />;
      default: return <Clock className={iconClass} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 pt-16">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-5 h-5 animate-spin text-gray-500" />
          <span className="text-sm text-gray-400 font-mono">Loading campaigns...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-12 px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-xl font-medium text-white tracking-tight mb-2">Campaigns</h1>
            <p className="text-sm text-gray-400 font-mono">{campaigns.length} active</p>
          </div>
          <button
            onClick={() => router.push("/campaigns/upload")}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-medium hover:bg-gray-100 transition-all duration-200 rounded-lg"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            New Campaign
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="py-32 text-center">
            <div className="inline-flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
                <Plus className="w-7 h-7 text-gray-600" />
              </div>
              <div>
                <p className="text-base text-gray-300 mb-2">No campaigns yet</p>
                <p className="text-sm text-gray-500">Create your first automated outreach campaign</p>
              </div>
              <button
                onClick={() => router.push("/campaigns/upload")}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors rounded-lg"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {campaigns.map((campaign, idx) => (
              <div
                key={campaign.id}
                onMouseEnter={() => setHoveredRow(campaign.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => router.push(`/campaigns/${campaign.id}`)}
                className={`
                  group relative grid grid-cols-[1fr_140px_80px_80px_80px_80px_100px_120px_80px] gap-4 items-center
                  px-5 py-4 cursor-pointer transition-all duration-150 rounded-lg
                  ${hoveredRow === campaign.id ? 'bg-gray-900/50 border-gray-700' : 'border-transparent'}
                  ${idx === 0 ? '' : 'border-t border-gray-800'}
                `}
              >
                {/* Campaign Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-gray-700 flex-shrink-0 group-hover:bg-white transition-colors" />
                  <span className="text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                    {campaign.name}
                  </span>
                </div>

                {/* Status */}
                <div className={`flex items-center gap-2 ${getStatusColor(campaign.status)}`}>
                  {getStatusIcon(campaign.status)}
                  <span className="text-sm capitalize">{campaign.status}</span>
                </div>

                {/* Stats - Monospace numbers */}
                <div className="text-right">
                  <div className="text-sm font-mono text-gray-300">{campaign.total_companies}</div>
                  <div className="text-xs text-gray-500">total</div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-mono text-gray-300">{campaign.processed_count}</div>
                  <div className="text-xs text-gray-500">done</div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-mono text-emerald-400">{campaign.success_count}</div>
                  <div className="text-xs text-gray-500">success</div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-mono text-rose-400">{campaign.failed_count}</div>
                  <div className="text-xs text-gray-500">failed</div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${campaign.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-400 w-9 text-right">
                    {campaign.progress_percentage}%
                  </span>
                </div>

                {/* Date */}
                <div className="text-sm text-gray-400 font-mono">
                  {new Date(campaign.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: '2-digit'
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/campaigns/${campaign.id}/monitor`);
                    }}
                    className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors rounded-lg"
                    title="Monitor"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(campaign.id);
                    }}
                    className="p-2 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition-colors rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Hover indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-white rounded-l-lg transition-opacity ${hoveredRow === campaign.id ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Campaign"
        message="Are you sure? This will delete all associated data and cannot be undone."
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </div>
  );
}
