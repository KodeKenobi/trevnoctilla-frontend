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
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();

      setUploadedData({
        filename: file.name,
        size: file.size,
        rows: data.companies || [],
        totalRows: data.totalRows || 0,
        validRows: data.validRows || 0,
        invalidRows: data.invalidRows || 0,
        uploadedAt: new Date().toISOString(),
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
    <div className="min-h-screen bg-black pt-20 pb-12 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-900">
          <button
            onClick={() => router.push("/campaigns")}
            className="group flex items-center gap-2 text-gray-600 hover:text-white text-xs mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to campaigns
          </button>
          <h1 className="text-sm font-medium text-white tracking-tight mb-1">Upload Companies</h1>
          <p className="text-[11px] text-gray-600 font-mono">CSV with company websites</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
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
                relative border-2 border-dashed py-20 text-center transition-all duration-200
                ${isDragging ? 'border-white bg-white/5' : 'border-gray-800 hover:border-gray-700'}
                ${uploading ? 'pointer-events-none opacity-50' : ''}
              `}>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-900 group-hover:bg-gray-800 flex items-center justify-center transition-colors">
                    {uploading ? (
                      <Loader className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      {uploading ? "Processing..." : "Drop CSV file or click to browse"}
                    </p>
                    <p className="text-xs text-gray-700">Must include website_url column</p>
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
            <div className="border border-gray-900 p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-500 font-medium">Required Format</span>
              </div>
              <pre className="text-[11px] font-mono text-gray-600 bg-black p-4 border border-gray-900 overflow-x-auto">
{`website_url,company_name,contact_email,phone
https://example.com,Example Inc,hello@example.com,+1234567890
https://another.com,Another Co,hi@another.com,+0987654321`}
              </pre>
              <p className="text-[10px] text-gray-700 mt-3">
                Only website_url is required • Max 1000 rows
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm text-emerald-400 font-medium mb-0.5">Upload Complete</div>
                    <div className="text-xs text-emerald-400/60 font-mono">{uploadedData.filename}</div>
                  </div>
                </div>
                <button
                  onClick={handleContinue}
                  className="group flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-medium hover:bg-gray-100 transition-colors"
                >
                  Continue
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total', value: uploadedData.totalRows, color: 'text-gray-400' },
                { label: 'Valid', value: uploadedData.validRows, color: 'text-emerald-400' },
                { label: 'Invalid', value: uploadedData.invalidRows, color: 'text-rose-400' },
                { label: 'Size', value: `${(uploadedData.size / 1024).toFixed(1)}KB`, color: 'text-gray-400' },
              ].map((stat, idx) => (
                <div key={idx} className="border border-gray-900 p-4">
                  <div className="text-[10px] text-gray-700 mb-2 uppercase tracking-wider">{stat.label}</div>
                  <div className={`text-xl font-mono ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="border border-gray-900">
              <div className="px-4 py-3 border-b border-gray-900 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Preview</span>
                <span className="text-[10px] text-gray-700 font-mono">First 10 rows</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b border-gray-900 bg-black">
                    <tr>
                      <th className="text-left py-2 px-4 font-medium text-gray-600 w-12">#</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Website</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Company</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Email</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedData.rows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-900 hover:bg-gray-950/50 transition-colors">
                        <td className="py-2 px-4 text-gray-700 font-mono">{idx + 1}</td>
                        <td className="py-2 px-4 text-blue-400 font-mono text-[11px] truncate max-w-xs">
                          {row.website_url}
                        </td>
                        <td className="py-2 px-4 text-gray-400">{row.company_name || '-'}</td>
                        <td className="py-2 px-4 text-gray-500 font-mono text-[11px]">
                          {row.contact_email || '-'}
                        </td>
                        <td className="py-2 px-4 text-gray-500 font-mono text-[11px]">
                          {row.phone || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {uploadedData.rows.length > 10 && (
                <div className="px-4 py-2 border-t border-gray-900 bg-black text-[10px] text-gray-700 font-mono">
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
