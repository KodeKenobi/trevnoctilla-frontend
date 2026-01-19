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
  Activity,
  TrendingUp,
  Users,
  Zap,
  Target,
  BarChart3,
  Play,
  Pause,
  Square,
  RefreshCw,
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

  // Calculate stats for dashboard
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'processing').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const totalCompanies = campaigns.reduce((sum, c) => sum + c.total_companies, 0);
  const totalProcessed = campaigns.reduce((sum, c) => sum + c.processed_count, 0);
  const totalSuccess = campaigns.reduce((sum, c) => sum + c.success_count, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Target className="w-10 h-10 text-blue-400" />
                Campaign Dashboard
              </h1>
              <p className="text-lg text-gray-400">
                Monitor and manage your automated outreach campaigns
              </p>
            </div>
            <button
              onClick={() => router.push("/campaigns/upload")}
              className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl border border-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              Create Campaign
            </button>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Total Campaigns</p>
                  <p className="text-3xl font-bold text-white">{totalCampaigns}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Active Now</p>
                  <p className="text-3xl font-bold text-green-400">{activeCampaigns}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Total Companies</p>
                  <p className="text-3xl font-bold text-purple-400">{totalCompanies}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {totalProcessed > 0 ? Math.round((totalSuccess / totalProcessed) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 text-red-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-medium text-red-200 mb-1">Error loading campaigns</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Upgrade Prompts */}
        {!userLoading && !user && (
          <div className="mb-8 bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Guest Access Limited
                </h3>
                <p className="text-gray-300 mb-4">
                  Process up to <strong className="text-amber-300">5 companies</strong> as a guest.
                  Upgrade to unlock <strong className="text-amber-200">50 companies per campaign</strong>.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push("/auth/register")}
                    className="px-6 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-500 transition-colors border border-amber-500/20"
                  >
                    Sign Up Free
                  </button>
                  <button
                    onClick={() => router.push("/auth/login")}
                    className="px-6 py-2.5 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Sign In
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
            <div className="mb-8 bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Free Plan - Limited to 50 Companies
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Upgrade for unlimited campaigns and higher limits:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                      <div className="text-white font-semibold mb-2">
                        Production Plan
                      </div>
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        100 companies
                      </div>
                      <div className="text-sm text-gray-400 mb-3">
                        per campaign
                      </div>
                      <div className="text-lg font-semibold text-blue-300">$9/mo</div>
                    </div>
                    <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
                      <div className="text-white font-semibold mb-2">
                        Enterprise Plan
                      </div>
                      <div className="text-2xl font-bold text-purple-400 mb-1">
                        Unlimited
                      </div>
                      <div className="text-sm text-gray-400 mb-3">
                        no restrictions
                      </div>
                      <div className="text-lg font-semibold text-purple-300">$19/mo</div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/payment?plan=production")}
                    className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors border border-blue-500/20"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          )}

        {campaigns.length === 0 ? (
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Welcome to Campaign Automation
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                Automate your outreach by sending personalized messages to hundreds of companies
                through their contact forms. No more manual data entry.
              </p>
              <button
                onClick={() => router.push("/campaigns/upload")}
                className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-lg font-semibold hover:bg-blue-500 transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl border border-blue-500/20"
              >
                <Plus className="w-6 h-6" />
                Create Your First Campaign
              </button>
            </div>

            {/* Process Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                  How It Works
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Upload Company Data</h4>
                      <p className="text-gray-400 text-sm">Import CSV with company names and websites</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Create Message Template</h4>
                      <p className="text-gray-400 text-sm">Set up your contact info and personalized message</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">AI Automation</h4>
                      <p className="text-gray-400 text-sm">Bot fills and submits forms automatically</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <span className="text-orange-400 font-bold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Track & Analyze</h4>
                      <p className="text-gray-400 text-sm">Monitor success rates and view screenshots</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-emerald-400" />
                  Key Benefits
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">100% Automated</h4>
                      <p className="text-gray-400 text-sm">No manual form filling required</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Screenshot Proof</h4>
                      <p className="text-gray-400 text-sm">Visual verification of every submission</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Scale to Hundreds</h4>
                      <p className="text-gray-400 text-sm">Process 500+ companies in minutes</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Smart Detection</h4>
                      <p className="text-gray-400 text-sm">AI adapts to different form layouts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Preview */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-semibold text-white mb-6 text-center">
                What You'll See After Creating Campaigns
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">--</div>
                  <div className="text-sm text-gray-400">Total Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">--</div>
                  <div className="text-sm text-gray-400">Active Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">--</div>
                  <div className="text-sm text-gray-400">Companies Processed</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">--%</div>
                  <div className="text-sm text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Ready to supercharge your outreach? Create your first campaign now.
              </p>
              <p className="text-sm text-gray-500">
                No credit card required • Setup takes less than 5 minutes
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {campaigns.map((campaign) => {
                const isActive = campaign.status === 'processing';
                const isCompleted = campaign.status === 'completed';
                const isFailed = campaign.status === 'failed';
                const isPaused = campaign.status === 'paused';

                return (
                  <div
                    key={campaign.id}
                    className="bg-[#1a1a1a] border border-gray-800 rounded-xl hover:border-gray-700 transition-all duration-200 group cursor-pointer"
                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                  >
                    {/* Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2 group-hover:text-blue-300 transition-colors">
                            {campaign.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Created {new Date(campaign.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          isActive ? 'bg-green-500/10 text-green-300 border border-green-500/20' :
                          isCompleted ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' :
                          isPaused ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                          isFailed ? 'bg-red-500/10 text-red-300 border border-red-500/20' :
                          'bg-gray-500/10 text-gray-300 border border-gray-500/20'
                        }`}>
                          {getStatusIcon(campaign.status)}
                          <span className="capitalize">{campaign.status}</span>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white font-medium">{campaign.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isActive ? 'bg-green-500' :
                              isCompleted ? 'bg-blue-500' :
                              isFailed ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${campaign.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="px-6 pb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-white mb-1">
                            {campaign.total_companies}
                          </div>
                          <div className="text-xs text-gray-400">Total Companies</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-blue-300 mb-1">
                            {campaign.processed_count}
                          </div>
                          <div className="text-xs text-gray-400">Processed</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-green-300 mb-1">
                            {campaign.success_count}
                          </div>
                          <div className="text-xs text-gray-400">Successful</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-red-300 mb-1">
                            {campaign.failed_count}
                          </div>
                          <div className="text-xs text-gray-400">Failed</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-800">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/campaigns/${campaign.id}`);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors border border-blue-500/20"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>

                        {isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add pause action here
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-500 transition-colors border border-amber-500/20"
                            title="Pause campaign"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}

                        {isPaused && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add resume action here
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 transition-colors border border-green-500/20"
                            title="Resume campaign"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(campaign.id);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-500 transition-colors border border-red-500/20"
                          title="Delete campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
