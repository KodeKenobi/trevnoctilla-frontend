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
import { useUser } from "@/contexts/UserContext";

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
  const { user, loading: userLoading } = useUser();
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
      case "completed":
        return "text-emerald-400";
      case "processing":
        return "text-blue-400";
      case "queued":
        return "text-purple-400";
      case "failed":
        return "text-rose-400";
      case "paused":
        return "text-amber-400";
      default:
        return "text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-4 h-4";
    switch (status) {
      case "completed":
        return <CheckCircle className={iconClass} />;
      case "processing":
        return <Loader className={`${iconClass} animate-spin`} />;
      case "queued":
        return <Clock className={iconClass} />;
      case "failed":
        return <XCircle className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-sm text-gray-300 font-medium">
            Loading campaigns...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12 px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 pb-6 border-b border-gray-700">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Campaigns
            </h1>
            <p className="text-base text-gray-300">
              {campaigns.length} active campaign
              {campaigns.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => router.push("/campaigns/upload")}
            className="group flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            New Campaign
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-start gap-3 rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-semibold mb-1">Error loading campaigns</p>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* User Tier Awareness Banners */}
        {!userLoading && !user && (
          <div className="mb-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">👋</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  You're Using Campaigns as a Guest
                </h3>
                <p className="text-gray-300 mb-4">
                  Guest users can process{" "}
                  <strong className="text-white">5 companies</strong> to try it
                  out. Sign up free to unlock{" "}
                  <strong className="text-amber-300">
                    50 companies per campaign!
                  </strong>
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push("/auth/register")}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Sign Up Free - Get 50 Companies
                  </button>
                  <button
                    onClick={() => router.push("/auth/login")}
                    className="px-6 py-2.5 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Already Have Account? Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!userLoading &&
          user &&
          (user.subscription_tier === "free" ||
            user.subscription_tier === "testing") && (
            <div className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎯</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    You're on the Free Plan - 50 Companies Per Campaign
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Upgrade to process more companies per campaign:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                      <div className="text-white font-semibold mb-1">
                        Production - $9/mo
                      </div>
                      <div className="text-3xl font-bold text-blue-400 mb-2">
                        100
                      </div>
                      <div className="text-sm text-gray-400">
                        companies per campaign
                      </div>
                    </div>
                    <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
                      <div className="text-white font-semibold mb-1">
                        Enterprise - $19/mo
                      </div>
                      <div className="text-3xl font-bold text-purple-400 mb-2">
                        Unlimited
                      </div>
                      <div className="text-sm text-gray-400">
                        no restrictions
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/payment?plan=production")}
                    className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          )}

        {campaigns.length === 0 ? (
          <div className="max-w-4xl mx-auto py-12">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">
                Automate Your Outreach
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Send personalized messages to hundreds of companies
                automatically by filling out their contact forms
              </p>
            </div>

            {/* What It Does */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                How It Works
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">
                      Upload Your Company List
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Upload a CSV file with company names and websites you want
                      to contact
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">
                      Create Your Message Template
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Write your contact info (name, email, phone) and custom
                      message once
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">
                      Let the Bot Do the Work
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Our AI bot visits each company's website, finds their
                      contact form, fills it with your info, and submits it
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">
                      Track Results
                    </h4>
                    <p className="text-gray-400 text-sm">
                      See which forms were submitted successfully, with
                      screenshots as proof
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
                <h4 className="text-white font-semibold mb-2 text-sm">
                  Fully Automated
                </h4>
                <p className="text-gray-400 text-xs">
                  No manual form filling. Click once and let it run.
                </p>
              </div>
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5">
                <h4 className="text-white font-semibold mb-2 text-sm">
                  Screenshot Proof
                </h4>
                <p className="text-gray-400 text-xs">
                  Every submission includes a screenshot for verification.
                </p>
              </div>
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                seeing that
                <h4 className="text-white font-semibold mb-2 text-sm">
                  Process Hundreds
                </h4>
                <p className="text-gray-400 text-xs">
                  Contact 500+ companies in minutes, not days.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <button
                onClick={() => router.push("/campaigns/upload")}
                className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-lg font-semibold hover:bg-blue-700 transition-all duration-200 rounded-xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-0.5"
              >
                Create Your First Campaign
                <ArrowRight className="w-6 h-6" />
              </button>
              <p className="text-sm text-gray-400 mt-3">
                No credit card required • Takes less than 5 minutes
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const bgImages = [
                "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
                "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
                "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
                "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
              ];
              const bgImage = bgImages[campaign.id % bgImages.length];

              return (
                <div
                  key={campaign.id}
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  style={{ height: "280px" }}
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
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                          campaign.status === "active"
                            ? "bg-emerald-500/90 text-white"
                            : campaign.status === "paused"
                            ? "bg-amber-500/90 text-white"
                            : campaign.status === "completed"
                            ? "bg-blue-500/90 text-white"
                            : "bg-gray-500/90 text-white"
                        }`}
                      >
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
                      <p className="text-sm text-white">
                        Created{" "}
                        {new Date(campaign.created_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
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
                            style={{
                              width: `${campaign.progress_percentage}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-white">
                            {campaign.total_companies}
                          </div>
                          <div className="text-xs text-white">Total</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-white">
                            {campaign.processed_count}
                          </div>
                          <div className="text-xs text-white">Done</div>
                        </div>
                        <div className="bg-emerald-500/20 backdrop-blur-sm rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-emerald-300">
                            {campaign.success_count}
                          </div>
                          <div className="text-xs text-white">Success</div>
                        </div>
                        <div className="bg-rose-500/20 backdrop-blur-sm rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-rose-300">
                            {campaign.failed_count}
                          </div>
                          <div className="text-xs text-white">Failed</div>
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
