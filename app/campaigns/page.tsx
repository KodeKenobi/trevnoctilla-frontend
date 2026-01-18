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
      case "completed": return "text-green-400";
      case "processing": return "text-blue-400";
      case "queued": return "text-purple-400";
      case "failed": return "text-red-400";
      case "paused": return "text-yellow-400";
      default: return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-3 h-3";
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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] pt-16">
        <Loader className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 pb-8 px-6">
      <div className="max-w-full mx-auto">
        {/* Minimal Header */}
        <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-3">
          <div>
            <h1 className="text-base font-medium text-gray-200">Campaigns</h1>
            <p className="text-xs text-gray-500 mt-0.5">{campaigns.length} total</p>
          </div>
          <button
            onClick={() => router.push("/campaigns/upload")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Campaign
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/30 border border-red-900 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm mb-3">No campaigns yet</p>
            <button
              onClick={() => router.push("/campaigns/upload")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-medium hover:bg-gray-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Campaign
            </button>
          </div>
        ) : (
          <div className="border border-gray-800 bg-[#111111]">
            <table className="w-full text-xs">
              <thead className="border-b border-gray-800 bg-[#0A0A0A]">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-gray-400">Campaign</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-400">Status</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-400 font-mono">Total</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-400 font-mono">Done</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-400 font-mono">Success</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-400 font-mono">Failed</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-400 font-mono">Progress</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-400">Created</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-[#151515] transition-colors cursor-pointer"
                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                  >
                    <td className="py-2 px-3 text-gray-200">{campaign.name}</td>
                    <td className="py-2 px-3">
                      <div className={`flex items-center gap-1.5 ${getStatusColor(campaign.status)}`}>
                        {getStatusIcon(campaign.status)}
                        <span className="capitalize">{campaign.status}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-300">{campaign.total_companies}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-300">{campaign.processed_count}</td>
                    <td className="py-2 px-3 text-right font-mono text-green-400">{campaign.success_count}</td>
                    <td className="py-2 px-3 text-right font-mono text-red-400">{campaign.failed_count}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-300">{campaign.progress_percentage}%</td>
                    <td className="py-2 px-3 text-gray-400">
                      {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/campaigns/${campaign.id}/monitor`);
                          }}
                          className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                          title="Monitor"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(campaign.id);
                          }}
                          className="p-1 hover:bg-red-950 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Campaign"
        description="Are you sure? This will delete all associated data and cannot be undone."
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
