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
      default: return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-3.5 h-3.5";
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
      <div className="min-h-screen flex items-center justify-center bg-black pt-16">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-4 h-4 animate-spin text-gray-600" />
          <span className="text-xs text-gray-700 font-mono">Loading campaigns...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-12 px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header - More breathing room */}
        <div className="flex items-end justify-between mb-8 pb-6 border-b border-gray-900">
          <div>
            <h1 className="text-sm font-medium text-white tracking-tight mb-1">Campaigns</h1>
            <p className="text-[11px] text-gray-600 font-mono">{campaigns.length} active</p>
          </div>
          <button
            onClick={() => router.push("/campaigns/upload")}
            className="group flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-medium hover:bg-gray-100 transition-all duration-200"
          >
            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
            New Campaign
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="py-32 text-center">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                <Plus className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">No campaigns yet</p>
                <p className="text-xs text-gray-700">Create your first automated outreach campaign</p>
              </div>
              <button
                onClick={() => router.push("/campaigns/upload")}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
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
                  px-4 py-3 cursor-pointer transition-all duration-150
                  ${hoveredRow === campaign.id ? 'bg-gray-950/50 border-gray-800' : 'border-transparent'}
                  ${idx === 0 ? '' : 'border-t border-gray-900'}
                `}
              >
                {/* Campaign Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-800 flex-shrink-0 group-hover:bg-white transition-colors" />
                  <span className="text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                    {campaign.name}
                  </span>
                </div>

                {/* Status */}
                <div className={`flex items-center gap-2 ${getStatusColor(campaign.status)}`}>
                  {getStatusIcon(campaign.status)}
                  <span className="text-xs capitalize">{campaign.status}</span>
                </div>

                {/* Stats - Monospace numbers */}
                <div className="text-right">
                  <div className="text-xs font-mono text-gray-400">{campaign.total_companies}</div>
                  <div className="text-[10px] text-gray-700">total</div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-gray-400">{campaign.processed_count}</div>
                  <div className="text-[10px] text-gray-700">done</div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-emerald-400">{campaign.success_count}</div>
                  <div className="text-[10px] text-gray-700">success</div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-rose-400">{campaign.failed_count}</div>
                  <div className="text-[10px] text-gray-700">failed</div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${campaign.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-600 w-8 text-right">
                    {campaign.progress_percentage}%
                  </span>
                </div>

                {/* Date */}
                <div className="text-xs text-gray-600 font-mono">
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
                    className="p-1.5 hover:bg-gray-900 text-gray-600 hover:text-white transition-colors"
                    title="Monitor"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(campaign.id);
                    }}
                    className="p-1.5 hover:bg-rose-500/10 text-gray-600 hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Hover indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-0.5 bg-white transition-opacity ${hoveredRow === campaign.id ? 'opacity-100' : 'opacity-0'}`} />
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
