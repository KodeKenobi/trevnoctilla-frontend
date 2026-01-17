"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Loader,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  Eye,
  Trash2,
  Shield,
} from "lucide-react";

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

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/campaigns");
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || "Failed to fetch campaigns");
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      console.error('Failed to fetch campaigns:', err);
      setError(err.message || "Failed to fetch campaigns");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete campaign");
      }

      // Refresh campaigns
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message || "Failed to delete campaign");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-900/30 text-green-300 border border-green-500/30";
      case "processing":
        return "bg-blue-900/30 text-blue-300 border border-blue-500/30";
      case "queued":
        return "bg-purple-900/30 text-purple-300 border border-purple-500/30";
      case "failed":
        return "bg-red-900/30 text-red-300 border border-red-500/30";
      case "paused":
        return "bg-yellow-900/30 text-yellow-300 border border-yellow-500/30";
      default:
        return "bg-gray-800 text-gray-300 border border-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
        return <Loader className="w-4 h-4 animate-spin" />;
      case "queued":
        return <Clock className="w-4 h-4" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      case "paused":
        return <Pause className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] pt-16">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Contact Campaigns
              </h1>
              <p className="text-base sm:text-lg text-gray-400">
                Manage your automated contact campaigns
              </p>
            </div>
            <button
              onClick={() => router.push("/campaigns/upload")}
              className="inline-flex items-center justify-center px-5 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Campaign
            </button>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4"
          >
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-300 mb-1">Error</h4>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {campaigns.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl p-12 text-center"
          >
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first campaign to start automating contact form
              submissions
            </p>
            <button
              onClick={() => router.push("/campaigns/upload")}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Campaign
            </button>
          </motion.div>
        )}

        {/* Campaigns Grid */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg hover:shadow-xl hover:border-gray-600 transition-all p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2 truncate">
                      {campaign.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        campaign.status
                      )}`}
                    >
                      {getStatusIcon(campaign.status)}
                      <span className="ml-1 capitalize">{campaign.status}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-medium text-white">
                      {campaign.progress_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${campaign.progress_percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>
                      {campaign.processed_count} / {campaign.total_companies}{" "}
                      processed
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {campaign.total_companies}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {campaign.success_count}
                    </div>
                    <div className="text-xs text-gray-500">Success</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {campaign.failed_count}
                    </div>
                    <div className="text-xs text-gray-500">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {campaign.captcha_count}
                    </div>
                    <div className="text-xs text-gray-500">CAPTCHA</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="text-xs text-gray-500">
                    Created{" "}
                    {new Date(campaign.created_at).toLocaleDateString()}
                    {campaign.started_at && (
                      <>
                        {" "}
                        • Started{" "}
                        {new Date(campaign.started_at).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
