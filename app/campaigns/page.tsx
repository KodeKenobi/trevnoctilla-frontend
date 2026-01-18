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
      <div className="min-h-screen flex items-center justify-center bg-white pt-24">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-5 h-5 animate-spin text-purple-600" />
          <span className="text-sm text-gray-700 font-medium">Loading campaigns...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-24 pb-12 px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Campaigns</h1>
            <p className="text-base text-gray-600">{campaigns.length} active campaign{campaigns.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => router.push("/campaigns/upload")}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            New Campaign
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="py-32 text-center">
            <div className="inline-flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center shadow-md">
                <Plus className="w-10 h-10 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</p>
                <p className="text-base text-gray-600">Create your first automated outreach campaign</p>
              </div>
              <button
                onClick={() => router.push("/campaigns/upload")}
                className="mt-3 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors rounded-xl shadow-lg"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const bgImages = [
                'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
                'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80',
                'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
                'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
              ];
              const bgImage = bgImages[campaign.id % bgImages.length];
              
              return (
                <div
                  key={campaign.id}
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  style={{ height: '280px' }}
                >
                  {/* Background Image with Overlay */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${bgImage}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
                  
                  {/* Content */}
                  <div className="relative h-full p-6 flex flex-col justify-between">
                    {/* Top: Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                        campaign.status === 'active' ? 'bg-emerald-500/90 text-white' :
                        campaign.status === 'paused' ? 'bg-amber-500/90 text-white' :
                        campaign.status === 'completed' ? 'bg-blue-500/90 text-white' :
                        'bg-gray-500/90 text-white'
                      }`}>
                        {getStatusIcon(campaign.status)}
                        <span className="capitalize">{campaign.status}</span>
                      </div>
                      
                      <div 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(campaign.id);
                          }}
                          className="p-2 bg-rose-500/90 hover:bg-rose-600 rounded-lg backdrop-blur-sm transition-colors"
                          title="Delete campaign"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Middle: Campaign Info */}
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2">
                        {campaign.name}
                      </h3>
                      <p className="text-sm text-gray-300">
                        Created {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    
                    {/* Bottom: Stats */}
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div className="relative">
                        <div className="flex items-center justify-between text-xs text-white font-semibold mb-2">
                          <span>Progress</span>
                          <span>{campaign.progress_percentage}%</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-500 rounded-full"
                            style={{ width: `${campaign.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-white">{campaign.total_companies}</div>
                          <div className="text-xs text-gray-300">Total</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-white">{campaign.processed_count}</div>
                          <div className="text-xs text-gray-300">Done</div>
                        </div>
                        <div className="bg-emerald-500/20 backdrop-blur-sm rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-emerald-300">{campaign.success_count}</div>
                          <div className="text-xs text-gray-300">Success</div>
                        </div>
                        <div className="bg-rose-500/20 backdrop-blur-sm rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-rose-300">{campaign.failed_count}</div>
                          <div className="text-xs text-gray-300">Failed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
