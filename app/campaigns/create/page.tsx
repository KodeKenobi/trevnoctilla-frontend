"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Loader,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [campaignName, setCampaignName] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load upload data from session storage
  useEffect(() => {
    const data = sessionStorage.getItem("campaign_upload_data");
    if (data) {
      setUploadData(JSON.parse(data));
    } else {
      // Redirect back to upload if no data
      router.push("/campaigns/upload");
    }
    setLoading(false);
  }, [router]);

  const handleBack = () => {
    router.push("/campaigns/upload");
  };

  const getPreviewMessage = () => {
    if (!messageTemplate || !uploadData?.rows?.[0]) return "";

    let preview = messageTemplate;
    const firstRow = uploadData.rows[0];

    // Replace variables
    Object.keys(firstRow).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      preview = preview.replace(regex, firstRow[key] || "");
    });

    return preview;
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      setError("Campaign name is required");
      return;
    }

    if (!messageTemplate.trim()) {
      setError("Message template is required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "demo@example.com", // Public campaign - no user email needed
          name: campaignName,
          message_template: messageTemplate,
          companies: uploadData.rows,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create campaign");
      }

      // Clear session storage
      sessionStorage.removeItem("campaign_upload_data");

      // Redirect directly to live monitor page to streamline flow
      router.push(`/campaigns/${data.campaign.id}/monitor`);
    } catch (err: any) {
      setError(err.message || "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  };

  if (loading || !uploadData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pt-24 pb-6 px-4 sm:pb-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Upload
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Create Campaign
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Set up your message template and campaign details
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8"
        >
          {/* Campaign Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Q1 Outreach Campaign"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Message Template */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900">
                Message Template
              </label>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center text-sm text-purple-600 hover:text-purple-700 transition-colors"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    Show Preview
                  </>
                )}
              </button>
            </div>
            <textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              placeholder="Hello {company_name},&#10;&#10;I noticed your website at {website_url} and wanted to reach out...&#10;&#10;Best regards"
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono text-sm resize-none"
            />
          </div>

          {/* Variable Info */}
          <div className="mb-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Available Variables:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {uploadData?.rows?.[0] &&
                    Object.keys(uploadData.rows[0]).map((key) => (
                      <code
                        key={key}
                        className="px-2 py-1 bg-white rounded text-sm text-purple-600 border border-purple-200"
                      >
                        {`{${key}}`}
                      </code>
                    ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Use these variables in your message template. They will be
                  replaced with actual values for each company.
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && messageTemplate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <h4 className="font-semibold text-gray-900 mb-2">
                Preview (using first company):
              </h4>
              <div className="bg-white rounded p-4 whitespace-pre-wrap text-sm">
                {getPreviewMessage()}
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Campaign Stats */}
          <div className="mb-6 bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Campaign Summary:
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Companies</div>
                <div className="text-2xl font-bold text-purple-600">
                  {uploadData.validRows}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">File</div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {uploadData.filename}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <button
              onClick={handleCreateCampaign}
              disabled={creating}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Campaign
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
