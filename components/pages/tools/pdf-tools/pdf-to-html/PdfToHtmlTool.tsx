"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMonetization } from "@/hooks/useMonetization";
import MonetizationModal from "@/components/ui/MonetizationModal";
import { getApiUrl } from "@/lib/config";
import { FileText, Upload, Download, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";

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
  const [file, setFile] = useState<File | null>(uploadedFile);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [warning, setWarning] = useState("");
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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const pdfFile = acceptedFiles[0];
      if (pdfFile && pdfFile.type === "application/pdf") {
        setFile(pdfFile);
        setUploadedFile(pdfFile);
        handleFileUpload(pdfFile);
        setProgress(0);
        setWarning("");
        setConversionResult(null);
        setShowViewer(false);
        setHtmlContent(null);
      } else {
        setWarning("Please upload a valid PDF file.");
      }
    },
    [setUploadedFile, handleFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  const convertPdfToHtml = async () => {
    if (!file) return;

    setIsProcessing(true);
    setLoading(true);
    setProgress(0);
    setConversionResult(null);
    setWarning("");

    try {
      const formData = new FormData();
      formData.append("file", file);

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
        file?.name?.replace('.pdf', '.html') || 'converted.html',
        'html',
        conversionResult
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">PDF to HTML Converter</h2>
          <p className="text-gray-400">
            Convert your PDF documents to HTML format for web viewing
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
            isDragActive
              ? "border-cyan-400 bg-cyan-400/10"
              : "border-gray-600"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-2">
            {isDragActive
              ? "Drop your PDF file here"
              : "Drag and drop your PDF file here or click to browse"}
          </p>
          <p className="text-sm text-gray-500">Supports PDF files only</p>
        </div>

        {warning && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{warning}</p>
          </div>
        )}

        {file && (
          <div className="mt-4 p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium break-words">{file.name}</p>
                <p className="text-gray-400 text-sm">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={convertPdfToHtml}
          disabled={!file || loading}
          className="w-full mt-6 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Converting... {Math.round(progress)}%
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-2" />
              Convert to HTML
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div
          className={`rounded-2xl p-6 border ${
            result.type === "success"
              ? "bg-green-500/10 border-green-500/20"
              : "bg-red-500/10 border-red-500/20"
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
                className="bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center"
              >
                <FileText className="h-5 w-5 mr-2" />
                View HTML
              </button>
              <button
                onClick={handleDownload}
                className="bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Download HTML
              </button>
            </div>
          )}
        </div>
      )}

      {/* HTML Viewer */}
      {showViewer && htmlContent && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
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
          <div className="border border-gray-600 rounded-lg overflow-hidden bg-white">
            {viewMode === 'preview' ? (
              <div 
                className="w-full h-[600px] overflow-auto"
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