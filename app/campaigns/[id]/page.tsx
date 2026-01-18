"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Download,
  Eye,
  Filter,
  Image as ImageIcon,
  X,
} from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  message_template: string;
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

interface Company {
  id: number;
  company_name: string;
  website_url: string;
  status: string;
  error_message?: string;
  contact_page_url?: string;
  contact_page_found: boolean;
  form_found: boolean;
  submitted_at?: string;
  screenshot_url?: string;
  processed_at?: string;
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const campaignId = params?.id as string;

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
      fetchCompanies();

      // Set up auto-refresh if campaign is processing
      const interval = setInterval(() => {
        if (campaign?.status === "processing" || campaign?.status === "queued") {
          fetchCampaignDetails(true);
          fetchCompanies(true);
        }
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [campaignId, campaign?.status]);

  const fetchCampaignDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch campaign");
      }

      setCampaign(data.campaign);
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to fetch campaign");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchCompanies = async (silent = false) => {
    try {
      const url = `/api/campaigns/${campaignId}/companies${
        filterStatus !== "all" ? `?status=${filterStatus}` : ""
      }`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch companies");
      }

      setCompanies(data.companies);
    } catch (err: any) {
      if (!silent) console.error("Failed to fetch companies:", err);
    }
  };

  const handleStartCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start campaign");
      }

      // Refresh campaign details
      fetchCampaignDetails();
    } catch (err: any) {
      alert(err.message || "Failed to start campaign");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCampaignDetails(true), fetchCompanies(true)]);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-300 bg-green-900/30 border border-green-500/30";
      case "failed":
        return "text-red-300 bg-red-900/30 border border-red-500/30";
      case "captcha":
        return "text-yellow-300 bg-yellow-900/30 border border-yellow-500/30";
      case "processing":
        return "text-blue-300 bg-blue-900/30 border border-blue-500/30";
      default:
        return "text-gray-300 bg-gray-800 border border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      case "captcha":
        return <Shield className="w-4 h-4" />;
      case "processing":
        return <Loader className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Campaign Not Found
          </h2>
          <button
            onClick={() => router.push("/campaigns")}
            className="text-purple-400 hover:text-purple-300"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const filteredCompanies =
    filterStatus === "all"
      ? companies
      : companies.filter((c) => c.status === filterStatus);

  return (
    <div className="min-h-screen bg-gray-950 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/campaigns")}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Campaigns
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {campaign.name}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                  campaign.status === "completed"
                    ? "bg-green-900/30 text-green-300 border-green-500/30"
                    : campaign.status === "processing"
                    ? "bg-blue-900/30 text-blue-300 border-blue-500/30"
                    : campaign.status === "failed"
                    ? "bg-red-900/30 text-red-300 border-red-500/30"
                    : "bg-gray-800 text-gray-300 border-gray-700"
                }`}
              >
                {campaign.status.charAt(0).toUpperCase() +
                  campaign.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors border border-gray-800"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-5 h-5 text-gray-400 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
              <button
                onClick={() => router.push(`/campaigns/${campaignId}/monitor`)}
                className="inline-flex items-center px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-5 h-5 mr-2" />
                Monitor Live
              </button>
              {campaign.status === "draft" && (
                <button
                  onClick={handleStartCampaign}
                  className="inline-flex items-center px-5 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Campaign
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {campaign.total_companies}
            </div>
            <div className="text-sm text-gray-400">Total Companies</div>
          </div>
          <div className="bg-gray-900 border border-green-500/20 rounded-xl p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-green-400">
              {campaign.success_count}
            </div>
            <div className="text-sm text-gray-400">Successful</div>
          </div>
          <div className="bg-gray-900 border border-red-500/20 rounded-xl p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-red-400">
              {campaign.failed_count}
            </div>
            <div className="text-sm text-gray-400">Failed</div>
          </div>
          <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
              {campaign.captcha_count}
            </div>
            <div className="text-sm text-gray-400">CAPTCHA</div>
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Progress</h3>
            <span className="text-2xl font-bold text-purple-400">
              {campaign.progress_percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${campaign.progress_percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-400 mt-2">
            <span>
              {campaign.processed_count} of {campaign.total_companies} processed
            </span>
          </div>
        </motion.div>

        {/* Companies List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">
              Companies ({filteredCompanies.length})
            </h3>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="captcha">CAPTCHA</option>
            </select>
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No companies found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-300">
                      Company
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300 hidden sm:table-cell">
                      Website
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300 hidden md:table-cell">
                      Details
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-300 hidden lg:table-cell">
                      Proof
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => (
                    <tr
                      key={company.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">
                          {company.company_name}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <a
                          href={company.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-sm"
                        >
                          {company.website_url}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            company.status
                          )}`}
                        >
                          {getStatusIcon(company.status)}
                          <span className="ml-1 capitalize">
                            {company.status}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="text-sm text-gray-400">
                          {company.error_message ? (
                            <span className="text-red-400">
                              {company.error_message}
                            </span>
                          ) : company.contact_page_found ? (
                            <span className="text-green-400">
                              Contact page found
                            </span>
                          ) : (
                            <span className="text-gray-500">Pending</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center hidden lg:table-cell">
                        {company.screenshot_url ? (
                          <button
                            onClick={() => setSelectedScreenshot(company.screenshot_url || null)}
                            className="inline-block relative group"
                            title="View screenshot"
                          >
                            <img
                              src={company.screenshot_url}
                              alt="Form preview"
                              className="w-16 h-16 object-cover rounded border border-gray-700 group-hover:border-purple-500 transition-colors"
                            />
                            <div className="absolute inset-0 bg-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-gray-600 text-xs">No proof</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => router.push(`/campaigns/${campaignId}/monitor?company=${company.id}`)}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Monitor this company"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          Monitor
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Screenshot Modal */}
      <AnimatePresence>
        {selectedScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedScreenshot(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl max-h-[90vh] overflow-auto bg-gray-900 rounded-xl border border-gray-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  Form Submission Proof
                </h3>
                <button
                  onClick={() => setSelectedScreenshot(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-4">
                <img
                  src={selectedScreenshot}
                  alt="Form submission screenshot"
                  className="w-full h-auto rounded-lg border border-gray-800"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
