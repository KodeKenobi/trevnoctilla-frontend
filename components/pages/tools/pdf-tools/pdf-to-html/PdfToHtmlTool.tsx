"use client";

import React, { useState, useCallback } from "react";
import { useMonetization } from "@/hooks/useMonetization";
import MonetizationModal from "@/components/ui/MonetizationModal";
import { getApiUrl } from "@/lib/config";
import { FileText, Download, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";

interface PdfToHtmlToolProps {
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  result: { type: "success" | "error"; message: string; data?: any } | null;
  setResult: (
    result: { type: "success" | "error"; message: string; data?: any } | null
  ) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  handleFileUpload: (file: File) => void;
}

export const PdfToHtmlTool: React.FC<PdfToHtmlToolProps> = ({
  uploadedFile,
  setUploadedFile,
  result,
  setResult,
  isProcessing,
  setIsProcessing,
  handleFileUpload,
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  const {
    monetizationState,
    openMonetizationModal,
    closeMonetizationModal,
    handleAdComplete,
    handlePaymentComplete,
  } = useMonetization();

  const convertPdfToHtml = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setLoading(true);
    setProgress(0);
    setConversionResult(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await fetch(`${getApiUrl("")}/convert-pdf-to-html`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error("Failed to convert PDF to HTML");
      }

      const result = await response.json();
      
      // Construct full URL using the backend base URL
      const fullDownloadUrl = result.downloadUrl.startsWith('http') 
        ? result.downloadUrl 
        : `${getApiUrl('')}${result.downloadUrl}`;
      
      setConversionResult(fullDownloadUrl);
      setResult({
        type: "success",
        message: "PDF converted to HTML successfully!",
        data: result,
      });
    } catch (error) {
      console.error("Conversion error:", error);
      setResult({
        type: "error",
        message: "Failed to convert PDF to HTML. Please try again.",
      });
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleView = async () => {
    if (conversionResult) {
      try {
        // Fetch the HTML content
        const response = await fetch(conversionResult);
        const html = await response.text();
        setHtmlContent(html);
        setShowViewer(true);
      } catch (error) {
        console.error('Error fetching HTML content:', error);
        // Fallback to opening in new tab
        window.open(conversionResult, '_blank');
      }
    }
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
  };

  const handleDownload = () => {
    if (conversionResult) {
      openMonetizationModal(
        uploadedFile?.name?.replace('.pdf', '.html') || 'converted.html',
        'html',
        conversionResult
      );
    }
  };

  // File upload state - EXACT COPY from SplitPdfTool
  if (!uploadedFile) {
    return (
      <>
        <div className="w-full max-w-4xl mx-auto min-h-96 bg-gray-800/40 rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                PDF to HTML Converter
              </h2>
              <p className="text-gray-400">
                Convert your PDF documents to HTML format for web viewing
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Choose PDF File
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  className="hidden"
                />
              </div>
              <p className="text-gray-400 text-sm">
                Drag and drop your PDF here, or click to browse
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <div className="w-full max-w-4xl mx-auto min-h-96 bg-gray-800/40 rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Converting PDF to HTML
            </h2>
            <p className="text-gray-400">
              Please wait while we convert your PDF document...
            </p>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin mr-3" />
              <span className="text-white text-lg">Converting... {Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results state
  return (
    <div className="w-full max-w-4xl mx-auto min-h-96 bg-gray-800/40 rounded-lg overflow-hidden">
      <div className="p-6">
        {/* File Info */}
        <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-400" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium break-words">{uploadedFile.name}</p>
              <p className="text-gray-400 text-sm">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={convertPdfToHtml}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert to HTML"
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div
            className={`rounded-lg p-4 mb-6 ${
              result.type === "success"
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            <div className="flex items-center space-x-3 mb-4">
              {result.type === "success" ? (
                <CheckCircle className="h-6 w-6 text-green-400" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-400" />
              )}
              <h3 className={`text-lg font-semibold ${
                result.type === "success" ? "text-green-400" : "text-red-400"
              }`}>
                {result.type === "success" ? "Conversion Successful!" : "Conversion Failed"}
              </h3>
            </div>

            <p className={`mb-4 ${
              result.type === "success" ? "text-green-300" : "text-red-300"
            }`}>
              {result.message}
            </p>

            {result.type === "success" && conversionResult && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleView}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View HTML
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download HTML
                </button>
              </div>
            )}
          </div>
        )}

        {/* HTML Viewer */}
        {showViewer && htmlContent && (
          <div className="bg-gray-700/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">HTML Preview</h3>
              <button
                onClick={handleCloseViewer}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Web Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'code'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Code Editor
              </button>
            </div>
            
            {/* Content Display */}
            <div className="border border-gray-600 rounded-lg overflow-hidden">
              {viewMode === 'preview' ? (
                <div 
                  className="w-full h-[600px] overflow-auto bg-white"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <pre className="w-full h-[600px] overflow-auto p-4 text-sm bg-gray-900 text-gray-100">
                  <code>{htmlContent}</code>
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      <MonetizationModal
        isOpen={monetizationState.isModalOpen}
        onClose={closeMonetizationModal}
        onAdComplete={handleAdComplete}
        onPaymentComplete={handlePaymentComplete}
        fileName={monetizationState.fileName}
        fileType={monetizationState.fileType}
      />
    </div>
  );
};