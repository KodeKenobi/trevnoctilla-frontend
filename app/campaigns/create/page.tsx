"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader,
  ArrowLeft,
  ArrowRight,
  Sparkles,
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

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          message_template: messageTemplate,
          companies: uploadedData.rows,
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to create campaign";
        try {
          const data = await response.json();
          errorMsg = data.error || errorMsg;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMsg = `Failed to create campaign (${response.status})`;
        }
        throw new Error(errorMsg);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-12 px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-800">
          <button
            onClick={() => router.push("/campaigns/upload")}
            className="group flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-xl font-medium text-white tracking-tight">Create Campaign</h1>
          </div>
          <p className="text-sm text-gray-400 font-mono ml-13">
            {uploadedData.validRows} companies ready to contact
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div>
            <label htmlFor="campaignName" className="block text-sm text-gray-300 font-medium mb-3">
              Campaign Name
            </label>
            <input
              id="campaignName"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-base text-gray-200 
                       focus:border-white focus:outline-none transition-colors rounded-lg
                       hover:border-gray-700 placeholder:text-gray-600"
              placeholder="Q1 2026 Outreach Campaign"
              required
            />
          </div>

          {/* Message Template */}
          <div>
            <label htmlFor="messageTemplate" className="block text-sm text-gray-300 font-medium mb-3">
              Message Template
            </label>
            <textarea
              id="messageTemplate"
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-base text-gray-200 leading-relaxed
                       focus:border-white focus:outline-none transition-colors resize-none rounded-lg
                       hover:border-gray-700 font-mono placeholder:text-gray-600"
              placeholder={`Hello,

I'd like to discuss potential collaboration opportunities.

Looking forward to connecting!

Best regards`}
              required
            />
            <p className="text-xs text-gray-500 mt-3 font-mono">
              This message will be sent via each company's contact form
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push("/campaigns/upload")}
              className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-medium 
                       hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Campaign
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
