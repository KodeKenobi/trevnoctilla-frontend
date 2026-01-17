"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader,
  X,
} from "lucide-react";

interface UploadedData {
  filename: string;
  size: number;
  rows: any[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  uploadedAt: string;
}

export default function CampaignUploadPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in
  if (!userLoading && !user) {
    router.push("/auth/login?redirect=/campaigns/upload");
    return null;
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/campaigns/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setUploadedData(data.data);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    if (uploadedData) {
      // Store data in session storage for next step
      sessionStorage.setItem("campaign_upload_data", JSON.stringify(uploadedData));
      router.push("/campaigns/create");
    }
  };

  const handleReset = () => {
    setUploadedData(null);
    setError(null);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
            Upload Contact List
          </h1>
          <p className="text-base sm:text-lg text-gray-400">
            Upload a CSV file with company websites to get started
          </p>
        </motion.div>

        {/* Upload Area */}
        {!uploadedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0F0F0F] border border-gray-800 rounded-2xl shadow-xl p-6 sm:p-8"
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-3 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all ${
                isDragging
                  ? "border-purple-500 bg-purple-950/30"
                  : "border-gray-700 hover:border-purple-400"
              }`}
            >
              <Upload
                className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 ${
                  isDragging ? "text-purple-400" : "text-gray-500"
                }`}
              />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                or click to browse
              </p>

              <label className="inline-block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <span className="px-5 py-2.5 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors cursor-pointer inline-flex items-center">
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Select File
                    </>
                  )}
                </span>
              </label>
            </div>

            {/* Requirements */}
            <div className="mt-6 sm:mt-8 bg-[#1A1A1A] border border-gray-800 rounded-lg p-4 sm:p-6">
              <h4 className="font-semibold text-white mb-3">
                CSV File Requirements:
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    Required columns: <strong>website_url</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    Optional columns: company_name, contact_email, contact_person, phone
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Maximum file size: 10MB</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>UTF-8 encoding recommended</span>
                </li>
              </ul>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 sm:mt-6 bg-red-950/30 border border-red-800 rounded-lg p-4"
              >
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-300 mb-1">
                      Upload Error
                    </h4>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Upload Success */}
        {uploadedData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F0F0F] border border-gray-800 rounded-2xl shadow-xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mr-3" />
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    File Uploaded Successfully
                  </h3>
                  <p className="text-sm text-gray-400">
                    {uploadedData.filename}
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">
                  {uploadedData.totalRows}
                </div>
                <div className="text-sm text-gray-400">Total Rows</div>
              </div>
              <div className="bg-green-950/30 border border-green-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {uploadedData.validRows}
                </div>
                <div className="text-sm text-gray-400">Valid</div>
              </div>
              {uploadedData.invalidRows > 0 && (
                <div className="bg-red-950/30 border border-red-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-400">
                    {uploadedData.invalidRows}
                  </div>
                  <div className="text-sm text-gray-400">Invalid</div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="mb-6">
              <h4 className="font-semibold text-white mb-3">
                Data Preview (first 5 rows):
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1A1A1A] border-b border-gray-800">
                      <th className="px-4 py-2 text-left font-medium text-gray-300">
                        Company Name
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-300">
                        Website
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedData.rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-[#1A1A1A]">
                        <td className="px-4 py-2 text-gray-300">{row.company_name || 'Auto-detect'}</td>
                        <td className="px-4 py-2 text-purple-400">
                          {row.website_url}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              Continue to Create Campaign
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
