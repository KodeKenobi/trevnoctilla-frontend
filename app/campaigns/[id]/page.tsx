"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
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
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "captcha":
        return "text-yellow-600 bg-yellow-50";
      case "processing":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
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

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Campaign Not Found
          </h2>
          <button
            onClick={() => router.push("/campaigns")}
            className="text-purple-600 hover:text-purple-700"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pt-24 pb-6 px-4 sm:pb-12 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <button
            onClick={() => router.push("/campaigns")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Campaigns
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {campaign.name}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  campaign.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : campaign.status === "processing"
                    ? "bg-blue-100 text-blue-800"
                    : campaign.status === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
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
                className="p-2 hover:bg-white rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-5 h-5 text-gray-600 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
              {campaign.status === "draft" && (
                <button
                  onClick={handleStartCampaign}
                  className="inline-flex items-center px-5 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
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
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {campaign.total_companies}
            </div>
            <div className="text-sm text-gray-600">Total Companies</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {campaign.success_count}
            </div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">
              {campaign.failed_count}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
              {campaign.captcha_count}
            </div>
            <div className="text-sm text-gray-600">CAPTCHA</div>
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
            <span className="text-2xl font-bold text-purple-600">
              {campaign.progress_percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all"
              style={{ width: `${campaign.progress_percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
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
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Companies ({filteredCompanies.length})
            </h3>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No companies found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Company
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 hidden sm:table-cell">
                      Website
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 hidden md:table-cell">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => (
                    <tr
                      key={company.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {company.company_name}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <a
                          href={company.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
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
                        <div className="text-sm text-gray-600">
                          {company.error_message ? (
                            <span className="text-red-600">
                              {company.error_message}
                            </span>
                          ) : company.contact_page_found ? (
                            <span className="text-green-600">
                              Contact page found
                            </span>
                          ) : (
                            <span className="text-gray-500">Pending</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
