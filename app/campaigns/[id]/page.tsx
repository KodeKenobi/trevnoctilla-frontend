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
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const campaignId = params?.id as string;

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
      const interval = setInterval(() => {
        if (campaign?.status === "processing" || campaign?.status === "queued") {
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

  const filteredCompanies = companies.filter((company) =>
    filterStatus === "all" ? true : company.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-400";
      case "processing": return "text-blue-400";
      case "failed": return "text-red-400";
      case "captcha": return "text-yellow-400";
      default: return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-3 h-3";
    switch (status) {
      case "completed": return <CheckCircle className={iconClass} />;
      case "processing": return <Loader className={`${iconClass} animate-spin`} />;
      case "failed": return <XCircle className={iconClass} />;
      case "captcha": return <Shield className={iconClass} />;
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

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] pt-16">
        <p className="text-gray-500 text-sm">Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 pb-8 px-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-4 border-b border-gray-800 pb-3">
          <button
            onClick={() => router.push("/campaigns")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs mb-3 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-medium text-gray-200">{campaign.name}</h1>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">{campaign.status}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchCampaignDetails()}
                disabled={refreshing}
                className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => router.push(`/campaigns/${campaignId}/monitor`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-3 h-3" />
                Monitor
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="border border-gray-800 bg-[#111111] p-3">
            <div className="text-[10px] text-gray-500 mb-1">TOTAL</div>
            <div className="text-lg font-mono text-gray-200">{campaign.total_companies}</div>
          </div>
          <div className="border border-gray-800 bg-[#111111] p-3">
            <div className="text-[10px] text-gray-500 mb-1">PROCESSED</div>
            <div className="text-lg font-mono text-gray-300">{campaign.processed_count}</div>
          </div>
          <div className="border border-gray-800 bg-[#111111] p-3">
            <div className="text-[10px] text-gray-500 mb-1">SUCCESS</div>
            <div className="text-lg font-mono text-green-400">{campaign.success_count}</div>
          </div>
          <div className="border border-gray-800 bg-[#111111] p-3">
            <div className="text-[10px] text-gray-500 mb-1">FAILED</div>
            <div className="text-lg font-mono text-red-400">{campaign.failed_count}</div>
          </div>
          <div className="border border-gray-800 bg-[#111111] p-3">
            <div className="text-[10px] text-gray-500 mb-1">PROGRESS</div>
            <div className="text-lg font-mono text-gray-200">{campaign.progress_percentage}%</div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="border border-gray-800 bg-[#111111]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-[#0A0A0A]">
            <h2 className="text-xs font-medium text-gray-400">
              Companies ({filteredCompanies.length})
            </h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 bg-[#111111] border border-gray-800 text-xs text-gray-300 focus:border-white focus:outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="captcha">CAPTCHA</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-gray-800 bg-[#0A0A0A]">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">#</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Company</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Website</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Details</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-500">Proof</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredCompanies.map((company, idx) => (
                  <tr key={company.id} className="hover:bg-[#151515] transition-colors">
                    <td className="py-2 px-3 text-gray-600 font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 text-gray-200">{company.company_name}</td>
                    <td className="py-2 px-3">
                      <a
                        href={company.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline font-mono text-[11px]"
                      >
                        {company.website_url}
                      </a>
                    </td>
                    <td className="py-2 px-3">
                      <div className={`flex items-center gap-1.5 ${getStatusColor(company.status)}`}>
                        {getStatusIcon(company.status)}
                        <span className="capitalize">{company.status}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-400 text-[11px]">
                      {company.error_message ? (
                        <span className="text-red-400">{company.error_message}</span>
                      ) : company.contact_page_found ? (
                        <span className="text-green-400">Contact found</span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {company.screenshot_url ? (
                        <button
                          onClick={() => setSelectedScreenshot(company.screenshot_url || null)}
                          className="inline-block"
                        >
                          <img
                            src={company.screenshot_url}
                            alt="Proof"
                            className="w-10 h-10 object-cover border border-gray-700 hover:border-white transition-colors"
                          />
                        </button>
                      ) : (
                        <span className="text-gray-700 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => router.push(`/campaigns/${campaignId}/monitor?company=${company.id}`)}
                        className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div
            className="relative max-w-6xl max-h-[90vh] overflow-auto border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-white"
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
    </div>
  );
}
