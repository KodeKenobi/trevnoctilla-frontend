"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader,
  ArrowLeft,
  FileText,
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
  const [uploading, setUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/campaigns/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = "Upload failed";
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // If JSON parsing fails, use text
          const errorText = await response.text();
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Invalid response from server. Please try again.");
      }

      console.log('[Upload] API Response:', data);

      setUploadedData({
        filename: file.name,
        size: file.size,
        rows: data.data?.rows || data.companies || [],
        totalRows: data.data?.totalRows || data.totalRows || 0,
        validRows: data.data?.validRows || data.validRows || 0,
        invalidRows: data.data?.invalidRows || data.invalidRows || 0,
        uploadedAt: new Date().toISOString(),
      });
      console.log('[Upload] Set uploadedData:', {
        rowsCount: data.data?.rows?.length || data.companies?.length || 0,
        totalRows: data.data?.totalRows || data.totalRows || 0,
      });
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    if (uploadedData) {
      localStorage.setItem("uploadedCampaignData", JSON.stringify(uploadedData));
      router.push("/campaigns/create");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-12 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-800">
          <button
            onClick={() => router.push("/campaigns")}
            className="group flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to campaigns
          </button>
          <h1 className="text-xl font-medium text-white tracking-tight mb-2">Upload Companies</h1>
          <p className="text-sm text-gray-400 font-mono">CSV with company websites</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!uploadedData ? (
          <div className="space-y-6">
            {/* Upload Zone */}
            <label 
              htmlFor="file-upload" 
              className="block cursor-pointer group"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className={`
                relative border-2 border-dashed py-24 text-center transition-all duration-200 rounded-xl
                ${isDragging ? 'border-white bg-white/5' : 'border-gray-700 hover:border-gray-600'}
                ${uploading ? 'pointer-events-none opacity-50' : ''}
              `}>
                <div className="flex flex-col items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-gray-900 group-hover:bg-gray-800 flex items-center justify-center transition-colors">
                    {uploading ? (
                      <Loader className="w-7 h-7 text-white animate-spin" />
                    ) : (
                      <Upload className="w-7 h-7 text-gray-500 group-hover:text-white transition-colors" />
                    )}
                  </div>
                  <div>
                    <p className="text-base text-gray-300 mb-2">
                      {uploading ? "Processing..." : "Drop CSV file or click to browse"}
                    </p>
                    <p className="text-sm text-gray-500">Must include website_url column</p>
                  </div>
                </div>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>

            {/* Format Info */}
            <div className="border border-gray-800 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-300 font-medium">Required Format</span>
              </div>
              <pre className="text-sm font-mono text-gray-400 bg-gray-900 p-4 border border-gray-800 overflow-x-auto rounded-lg">
{`website_url,company_name,contact_email,phone
https://example.com,Example Inc,hello@example.com,+1234567890
https://another.com,Another Co,hi@another.com,+0987654321`}
              </pre>
              <p className="text-xs text-gray-500 mt-4">
                Only website_url is required • Max 1000 rows
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="border border-emerald-500/30 bg-emerald-500/10 p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-base text-emerald-300 font-medium mb-1">Upload Complete</div>
                    <div className="text-sm text-emerald-400/70 font-mono">{uploadedData.filename}</div>
                  </div>
                </div>
                <button
                  onClick={handleContinue}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors rounded-lg"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total', value: uploadedData.totalRows, color: 'text-gray-300' },
                { label: 'Valid', value: uploadedData.validRows, color: 'text-emerald-400' },
                { label: 'Invalid', value: uploadedData.invalidRows, color: 'text-rose-400' },
                { label: 'Size', value: `${(uploadedData.size / 1024).toFixed(1)}KB`, color: 'text-gray-300' },
              ].map((stat, idx) => (
                <div key={idx} className="border border-gray-800 p-5 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{stat.label}</div>
                  <div className={`text-2xl font-mono ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                <span className="text-sm text-gray-300 font-medium">Preview</span>
                <span className="text-xs text-gray-500 font-mono">First 10 rows</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-800 bg-gray-900">
                    <tr>
                      <th className="text-left py-3 px-5 font-medium text-gray-400 w-12">#</th>
                      <th className="text-left py-3 px-5 font-medium text-gray-400">Website</th>
                      <th className="text-left py-3 px-5 font-medium text-gray-400">Company</th>
                      <th className="text-left py-3 px-5 font-medium text-gray-400">Email</th>
                      <th className="text-left py-3 px-5 font-medium text-gray-400">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedData.rows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                        <td className="py-3 px-5 text-gray-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-5 text-blue-400 font-mono text-sm truncate max-w-xs">
                          {row.website_url}
                        </td>
                        <td className="py-3 px-5 text-gray-300">{row.company_name || '-'}</td>
                        <td className="py-3 px-5 text-gray-400 font-mono text-sm">
                          {row.contact_email || '-'}
                        </td>
                        <td className="py-3 px-5 text-gray-400 font-mono text-sm">
                          {row.phone || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {uploadedData.rows.length > 10 && (
                <div className="px-5 py-3 border-t border-gray-800 bg-gray-900/50 text-xs text-gray-500 font-mono">
                  +{uploadedData.rows.length - 10} more rows
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
