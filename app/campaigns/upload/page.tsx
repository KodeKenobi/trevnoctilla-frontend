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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    <div className="min-h-screen bg-[#0A0A0A] pt-20 pb-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 border-b border-gray-800 pb-3">
          <button
            onClick={() => router.push("/campaigns")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs mb-3 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>
          <h1 className="text-base font-medium text-gray-200">Upload Companies</h1>
          <p className="text-xs text-gray-500 mt-0.5">CSV file with company websites</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/30 border border-red-900 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!uploadedData ? (
          <div className="border border-gray-800 bg-[#111111] p-6">
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="border-2 border-dashed border-gray-700 hover:border-gray-600 py-12 text-center transition-colors">
                <Upload className="w-8 h-8 mx-auto text-gray-600 mb-3" />
                <p className="text-sm text-gray-400 mb-1">
                  {uploading ? "Uploading..." : "Click to select CSV file"}
                </p>
                <p className="text-xs text-gray-600">Must include 'website_url' column</p>
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

            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader className="w-3.5 h-3.5 animate-spin" />
                <span>Processing CSV...</span>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2 font-medium">CSV Format:</p>
              <pre className="text-[10px] font-mono text-gray-600 bg-[#0A0A0A] p-3 border border-gray-800 overflow-x-auto">
{`website_url,company_name,contact_email,phone
https://example.com,Example Inc,hello@example.com,+1234567890`}
              </pre>
              <p className="text-[10px] text-gray-600 mt-2">
                * Only website_url is required • Max 1000 rows per upload
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Success Header */}
            <div className="border border-green-900/50 bg-green-950/20 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">Upload Complete</span>
                </div>
                <button
                  onClick={handleContinue}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  Continue
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="border border-gray-800 bg-[#111111] p-3">
                <div className="text-xs text-gray-500 mb-1">Total Rows</div>
                <div className="text-lg font-mono text-gray-200">{uploadedData.totalRows}</div>
              </div>
              <div className="border border-gray-800 bg-[#111111] p-3">
                <div className="text-xs text-gray-500 mb-1">Valid</div>
                <div className="text-lg font-mono text-green-400">{uploadedData.validRows}</div>
              </div>
              <div className="border border-gray-800 bg-[#111111] p-3">
                <div className="text-xs text-gray-500 mb-1">Invalid</div>
                <div className="text-lg font-mono text-red-400">{uploadedData.invalidRows}</div>
              </div>
              <div className="border border-gray-800 bg-[#111111] p-3">
                <div className="text-xs text-gray-500 mb-1">File Size</div>
                <div className="text-lg font-mono text-gray-200">
                  {(uploadedData.size / 1024).toFixed(1)}KB
                </div>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-gray-800 bg-[#111111]">
              <div className="px-3 py-2 border-b border-gray-800 bg-[#0A0A0A]">
                <h3 className="text-xs font-medium text-gray-400">Preview (first 10 rows)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b border-gray-800 bg-[#0A0A0A]">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">#</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Website URL</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Company Name</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Email</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {uploadedData.rows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#151515]">
                        <td className="py-2 px-3 text-gray-600 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 text-blue-400 font-mono text-[11px]">
                          {row.website_url}
                        </td>
                        <td className="py-2 px-3 text-gray-300">{row.company_name || '-'}</td>
                        <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">
                          {row.contact_email || '-'}
                        </td>
                        <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">
                          {row.phone || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {uploadedData.rows.length > 10 && (
                <div className="px-3 py-2 border-t border-gray-800 bg-[#0A0A0A] text-[10px] text-gray-600">
                  + {uploadedData.rows.length - 10} more rows
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
