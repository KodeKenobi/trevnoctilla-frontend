"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [uploadedData, setUploadedData] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("uploadedCampaignData");
    if (!data) {
      router.push("/campaigns/upload");
      return;
    }
    setUploadedData(JSON.parse(data));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignName.trim()) {
      setError("Campaign name is required");
      return;
    }

    if (!messageTemplate.trim()) {
      setError("Message template is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          message_template: messageTemplate,
          companies: uploadedData.rows,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create campaign");
      }

      const data = await response.json();
      localStorage.removeItem("uploadedCampaignData");
      router.push(`/campaigns/${data.campaign.id}`);
    } catch (err: any) {
      console.error("Failed to create campaign:", err);
      setError(err.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  if (!uploadedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <Loader className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 pb-8 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 border-b border-gray-800 pb-3">
          <button
            onClick={() => router.push("/campaigns/upload")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs mb-3 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>
          <h1 className="text-base font-medium text-gray-200">Create Campaign</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {uploadedData.validRows} companies ready
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/30 border border-red-900 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campaign Name */}
          <div className="border border-gray-800 bg-[#111111] p-4">
            <label htmlFor="campaignName" className="block text-xs text-gray-400 mb-2 font-medium">
              Campaign Name
            </label>
            <input
              id="campaignName"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0A0A] border border-gray-800 text-sm text-gray-200 focus:border-white focus:outline-none transition-colors"
              placeholder="e.g. Q1 2026 Outreach"
              required
            />
          </div>

          {/* Message Template */}
          <div className="border border-gray-800 bg-[#111111] p-4">
            <label htmlFor="messageTemplate" className="block text-xs text-gray-400 mb-2 font-medium">
              Message Template
            </label>
            <textarea
              id="messageTemplate"
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 bg-[#0A0A0A] border border-gray-800 text-sm text-gray-200 focus:border-white focus:outline-none transition-colors font-mono resize-none"
              placeholder={`Hello,

I'd like to discuss potential collaboration opportunities.

Looking forward to connecting!

Best regards`}
              required
            />
            <p className="text-[10px] text-gray-600 mt-2">
              This message will be submitted via each company's contact form
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/campaigns/upload")}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-black text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-3 h-3 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Campaign
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
