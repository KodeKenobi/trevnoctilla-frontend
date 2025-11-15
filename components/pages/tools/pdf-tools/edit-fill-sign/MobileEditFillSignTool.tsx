"use client";

import React, { useState, useRef, useCallback } from "react";
import { useAlertModal } from "@/hooks/useAlertModal";
import AlertModal from "@/components/ui/AlertModal";
import { MobilePDFEditorLayout } from "@/components/ui/MobilePDFEditorLayout";
import { PDFProcessingModal } from "@/components/ui/PDFProcessingModal";
import { SignatureCanvas } from "@/components/ui/signature-canvas";
import { useMonetization } from "@/contexts/MonetizationProvider";
import { getApiUrl } from "@/lib/config";
import { X, Type, PenTool, Image as ImageIcon } from "lucide-react";

interface MobileEditFillSignToolProps {
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

export const MobileEditFillSignTool: React.FC<MobileEditFillSignToolProps> = ({
  uploadedFile,
  setUploadedFile,
  result,
  setResult,
  isProcessing,
  setIsProcessing,
  handleFileUpload,
}) => {
  const { showModal: showMonetizationModal } = useMonetization();
  const alertModal = useAlertModal();

  // Core state
  const [activeTool, setActiveTool] = useState<string>("select");
  const [editorUrl, setEditorUrl] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedFilename, setUploadedFilename] = useState<string>("");

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 1.0 = 100%

  // View and download flow state
  const [showViewModal, setShowViewModal] = useState(false);
  const [showViewButton, setShowViewButton] = useState(false); // Show after save
  const [showDownloadButton, setShowDownloadButton] = useState(false); // Show after view
  const [hasViewedPdf, setHasViewedPdf] = useState(false);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    id: string;
    message: string;
  } | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Signature modal state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");

  // Refs
  const isProcessingRef = useRef<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Process document function
  const handleProcessDocument = useCallback(async () => {
    if (!uploadedFile || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setUploadProgress(0);

    // Smooth progress simulation
    const simulateProgress = () => {
      return new Promise<void>((resolve) => {
        let progress = 0;
        const updateInterval = 100;
        const totalDuration = 8000;
        const totalSteps = totalDuration / updateInterval;
        const progressIncrement = 100 / totalSteps;

        const interval = setInterval(() => {
          progress += progressIncrement;
          const clampedProgress = Math.min(progress, 100);
          setUploadProgress(clampedProgress);

          if (clampedProgress >= 100) {
            clearInterval(interval);
            resolve();
          }
        }, updateInterval);
      });
    };

    try {
      await simulateProgress();
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Upload PDF
      console.log("🚀 [Mobile Edit Fill Sign] Starting PDF upload...");
      const formData = new FormData();
      formData.append("pdf", uploadedFile);

      const uploadResponse = await fetch(`${getApiUrl("")}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload PDF");
      }

      const uploadData = await uploadResponse.json();
      const filename = uploadData.filename || uploadedFile.name;
      setUploadedFilename(filename);
      console.log("✅ [Mobile Edit Fill Sign] Upload successful:", filename);

      // Get PDF info
      const pdfInfoResponse = await fetch(
        `${getApiUrl("")}/api/pdf_info/${encodeURIComponent(filename)}`
      );
      if (pdfInfoResponse.ok) {
        const pdfInfo = await pdfInfoResponse.json();
        setTotalPages(pdfInfo.page_count);
      } else {
        setTotalPages(1);
      }

      // Set editor URL with mobile parameter
      const cacheBuster = Date.now();
      setEditorUrl(
        `${getApiUrl("")}/convert/${encodeURIComponent(
          filename
        )}?v=${cacheBuster}&mobile=true`
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("PDF conversion error:", error);
      alertModal.showError("Error", "Failed to process PDF");
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [uploadedFile, setIsProcessing, alertModal]);

  // Auto-process document when file is uploaded
  React.useEffect(() => {
    if (uploadedFile && !editorUrl && !isProcessingRef.current) {
      handleProcessDocument();
    }
  }, [uploadedFile, editorUrl, handleProcessDocument]);

  // Handle tool selection
  const handleToolSelect = (toolId: string) => {
    console.log("🔧 [Mobile Edit Fill Sign] Tool button clicked:", toolId);
    console.log("🔧 [Mobile Edit Fill Sign] Previous active tool:", activeTool);
    setActiveTool(toolId);

    // Handle special tools
    if (toolId === "sign") {
      console.log("🔧 [Mobile Edit Fill Sign] Opening signature modal");
      setShowSignatureModal(true);
      return;
    }

    if (toolId === "text") {
      console.log(
        "🔧 [Mobile Edit Fill Sign] Add text tool selected - sending message to iframe"
      );
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "SET_EDIT_MODE",
            mode: "text",
          },
          "*"
        );
        console.log(
          "🔧 [Mobile Edit Fill Sign] SET_EDIT_MODE message sent with mode: text"
        );
      }
      return;
    }

    // Send message to iframe for other tools
    console.log(
      "🔧 [Mobile Edit Fill Sign] Sending SET_EDIT_MODE message to iframe with mode:",
      toolId
    );
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: "SET_EDIT_MODE",
          mode: toolId,
        },
        "*"
      );
      console.log(
        "🔧 [Mobile Edit Fill Sign] SET_EDIT_MODE message sent successfully"
      );
    } else {
      console.error(
        "❌ [Mobile Edit Fill Sign] Iframe not found or no contentWindow"
      );
    }
  };

  // Handle signature save
  const handleSignatureSave = () => {
    console.log("🔧 [Mobile Edit Fill Sign] Save signature button clicked");
    if (!signatureData) {
      console.log(
        "❌ [Mobile Edit Fill Sign] No signature data, showing error"
      );
      alertModal.showError("Error", "Please draw a signature first");
      return;
    }

    console.log(
      "🔧 [Mobile Edit Fill Sign] Sending INSERT_SIGNATURE message to iframe"
    );
    console.log("🔧 [Mobile Edit Fill Sign] Current page:", currentPage);
    // Send signature to iframe
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: "INSERT_SIGNATURE",
          signatureData: signatureData,
          page: currentPage,
        },
        "*"
      );
      console.log(
        "✅ [Mobile Edit Fill Sign] INSERT_SIGNATURE message sent successfully"
      );
    } else {
      console.error(
        "❌ [Mobile Edit Fill Sign] Iframe not found for signature insertion"
      );
    }

    setShowSignatureModal(false);
    setSignatureData("");
    setActiveTool("edit-text");
    alertModal.showSuccess("Success", "Signature added to document");
  };

  // Listen for messages from iframe
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "SAVE_COMPLETE") {
        alertModal.showSuccess("Success", "PDF saved successfully!");
      } else if (event.data.type === "PDF_GENERATED_FOR_PREVIEW") {
        setGeneratedPdfUrl(event.data.pdfUrl);
        setShowViewButton(true); // Show Preview button after save
        setShowDownloadButton(false); // Don't show Download until user views
        setIsSaving(false);
      } else if (event.data.type === "EDIT_MODE_SET") {
        console.log(
          "🔧 [Mobile Edit Fill Sign] Edit mode set to:",
          event.data.mode
        );
        setActiveTool(event.data.mode);
      } else if (event.data.type === "SIGNATURE_INSERTED") {
        console.log(
          "✅ [Mobile Edit Fill Sign] Signature inserted successfully"
        );
      } else if (event.data.type === "SHOW_CONFIRMATION") {
        console.log("❓ Confirmation requested:", event.data.message);
        console.log("❓ Confirmation ID:", event.data.id);
        console.log("❓ Setting confirmation modal state");
        const modalState = {
          isOpen: true,
          id: event.data.id,
          message: event.data.message,
        };
        setConfirmationModal(modalState);
        console.log("❓ Confirmation modal state set:", modalState);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [alertModal]);

  // Debug: Log when confirmation modal state changes
  React.useEffect(() => {
    if (confirmationModal) {
      console.log("❓ Confirmation modal state updated:", confirmationModal);
      console.log("❓ Modal should be visible:", confirmationModal.isOpen);
    } else {
      console.log("❓ Confirmation modal cleared");
    }
  }, [confirmationModal]);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    console.log(
      "🔧 [Mobile Edit Fill Sign] Page change button clicked:",
      pageNumber
    );
    console.log("🔧 [Mobile Edit Fill Sign] Previous page:", currentPage);
    setCurrentPage(pageNumber);

    // Send message to iframe to change page
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: "CHANGE_PAGE",
          pageNumber: pageNumber,
        },
        "*"
      );
      console.log(
        "✅ [Mobile Edit Fill Sign] CHANGE_PAGE message sent successfully"
      );
    } else {
      console.error(
        "❌ [Mobile Edit Fill Sign] Iframe not found for page change"
      );
    }
  };

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    console.log("🔧 [Mobile Edit Fill Sign] Zoom in button clicked");
    setZoomLevel((prev) => {
      const newZoom = Math.min(prev + 0.25, 3.0); // Max 300%
      console.log(
        "🔧 [Mobile Edit Fill Sign] Zoom level changed from",
        prev,
        "to",
        newZoom
      );
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "MOBILE_ZOOM",
            zoom: newZoom,
          },
          "*"
        );
        console.log(
          "✅ [Mobile Edit Fill Sign] MOBILE_ZOOM message sent with zoom:",
          newZoom
        );
      }
      return newZoom;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    console.log("🔧 [Mobile Edit Fill Sign] Zoom out button clicked");
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.25, 0.25); // Min 25%
      console.log(
        "🔧 [Mobile Edit Fill Sign] Zoom level changed from",
        prev,
        "to",
        newZoom
      );
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "MOBILE_ZOOM",
            zoom: newZoom,
          },
          "*"
        );
        console.log(
          "✅ [Mobile Edit Fill Sign] MOBILE_ZOOM message sent with zoom:",
          newZoom
        );
      }
      return newZoom;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    console.log("🔧 [Mobile Edit Fill Sign] Zoom reset button clicked");
    setZoomLevel(1.0);
    console.log("🔧 [Mobile Edit Fill Sign] Zoom level reset to 1.0");
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: "MOBILE_ZOOM",
          zoom: 1.0,
        },
        "*"
      );
      console.log(
        "✅ [Mobile Edit Fill Sign] MOBILE_ZOOM message sent with zoom: 1.0"
      );
    }
  }, []);

  // Send initial zoom and edit mode when iframe loads
  React.useEffect(() => {
    if (editorUrl && iframeRef.current?.contentWindow) {
      const initializeEditor = () => {
        if (iframeRef.current?.contentWindow) {
          // Send initial zoom
          iframeRef.current.contentWindow.postMessage(
            {
              type: "MOBILE_ZOOM",
              zoom: zoomLevel,
            },
            "*"
          );

          // Send initial edit mode (select)
          iframeRef.current.contentWindow.postMessage(
            {
              type: "SET_EDIT_MODE",
              mode: "select",
            },
            "*"
          );
        }
      };
      const timeoutId = setTimeout(initializeEditor, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [editorUrl, zoomLevel]);

  // Generate page thumbnails
  const generatePageThumbnails = () => {
    if (!uploadedFile) return [];

    return Array.from({ length: totalPages }, (_, index) => ({
      pageNumber: index + 1,
      isActive: currentPage === index + 1,
      thumbnailUrl: `${getApiUrl("")}/api/pdf_thumbnail/${encodeURIComponent(
        uploadedFilename || uploadedFile.name
      )}/${index + 1}`,
      onClick: () => handlePageChange(index + 1),
    }));
  };

  // Handle save changes
  const handleSaveChanges = () => {
    console.log("🔧 [Mobile Edit Fill Sign] Save button clicked");
    setIsSaving(true);
    console.log("🔧 [Mobile Edit Fill Sign] Setting isSaving to true");

    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: "GENERATE_PDF_FOR_PREVIEW",
        },
        "*"
      );
      console.log(
        "✅ [Mobile Edit Fill Sign] GENERATE_PDF_FOR_PREVIEW message sent successfully"
      );
    } else {
      console.error("❌ [Mobile Edit Fill Sign] Iframe not found for save");
    }
  };

  // Handle view PDF
  const handleViewPdf = () => {
    console.log("🔧 [Mobile Edit Fill Sign] Preview button clicked");
    setShowViewModal(true);
    setHasViewedPdf(true);
    setShowDownloadButton(true); // Show Download button after user views
    console.log(
      "🔧 [Mobile Edit Fill Sign] View modal opened, download button enabled"
    );
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    console.log(
      "🔧 [Mobile Edit Fill Sign] Close preview modal button clicked"
    );
    setShowViewModal(false);
    console.log("🔧 [Mobile Edit Fill Sign] View modal closed");
  };

  // Handle download PDF
  const handleDownloadPdf = async () => {
    console.log("🔧 [Mobile Edit Fill Sign] Download button clicked");
    if (generatedPdfUrl) {
      console.log("🔧 [Mobile Edit Fill Sign] Opening monetization modal");
      const completed = await showMonetizationModal({
        title: "Download PDF",
        message: `Choose how you'd like to download ${
          uploadedFile?.name || "this PDF"
        }`,
        fileName: uploadedFile?.name || "document.pdf",
        fileType: "PDF",
        downloadUrl: generatedPdfUrl,
      });

      if (completed) {
        console.log(
          "✅ [Mobile Edit Fill Sign] Monetization completed, opening PDF URL"
        );
        window.open(generatedPdfUrl, "_blank");
      } else {
        console.log("❌ [Mobile Edit Fill Sign] Monetization cancelled");
      }
    } else {
      console.error(
        "❌ [Mobile Edit Fill Sign] No generated PDF URL available"
      );
    }
  };

  // Define tools for mobile
  const tools = [
    { id: "edit-text", name: "Edit Text", icon: "T" },
    { id: "text", name: "Add Text", icon: "+" },
    { id: "sign", name: "Sign", icon: "S" },
  ];

  // File upload state
  if (!uploadedFile) {
    return (
      <div className="w-full max-w-4xl mx-auto min-h-96 bg-gray-800/40 rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Edit, Fill & Sign PDF
            </h2>
            <p className="text-gray-400">
              Upload a PDF to start editing, filling forms, and adding
              signatures
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
                htmlFor="mobile-fill-sign-file-upload"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Choose PDF File
              </label>
              <input
                id="mobile-fill-sign-file-upload"
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
    );
  }

  // Processing state - show modal instead of inline progress
  if (isProcessing && !editorUrl) {
    return (
      <>
        <PDFProcessingModal
          isOpen={true}
          progress={uploadProgress}
          fileName={uploadedFile?.name}
        />
        {/* Keep the file upload UI visible but dimmed */}
        <div className="w-full max-w-4xl mx-auto min-h-96 bg-gray-800/40 rounded-lg overflow-hidden opacity-30 pointer-events-none">
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Edit, Fill & Sign PDF
              </h2>
              <p className="text-gray-400">
                Upload a PDF to start editing, filling forms, and adding
                signatures
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Editor interface
  if (editorUrl) {
    return (
      <div data-editor-active="true">
        <div style={{ display: showViewModal ? "none" : "block" }}>
          <MobilePDFEditorLayout
            title="Edit, Fill & Sign"
            fileName={uploadedFile?.name}
            instructionText="Select a tool to edit, add text, or sign"
            onBack={() => {
              console.log("🔧 [Mobile Edit Fill Sign] Back button clicked");
              setUploadedFile(null);
              setEditorUrl("");
              setActiveTool("edit-text");
              setResult(null);
              console.log(
                "🔧 [Mobile Edit Fill Sign] Editor reset, returning to file upload"
              );
            }}
            activeTool={activeTool}
            onToolSelect={handleToolSelect}
            tools={tools}
            pages={generatePageThumbnails()}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onSave={handleSaveChanges}
            isProcessing={isSaving}
            showViewButton={showViewButton}
            showDownloadButton={showDownloadButton}
            hasViewedPdf={hasViewedPdf}
            onViewPdf={handleViewPdf}
            onDownloadPdf={handleDownloadPdf}
          >
            {/* PDF Editor - Mobile Optimized */}
            <div
              className="w-full h-full"
              style={{
                display: "block",
                overflow: "hidden",
                width: "100%",
                height: "100%",
                margin: 0,
                padding: 0,
                position: "relative",
              }}
            >
              <iframe
                ref={iframeRef}
                src={editorUrl}
                className="border-0"
                title="PDF Editor"
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  margin: 0,
                  padding: 0,
                  border: "none",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
                onLoad={() => {
                  // Document loaded - initialize edit mode
                  if (iframeRef.current?.contentWindow) {
                    setTimeout(() => {
                      if (iframeRef.current?.contentWindow) {
                        iframeRef.current.contentWindow.postMessage(
                          {
                            type: "SET_EDIT_MODE",
                            mode: "select",
                          },
                          "*"
                        );
                        console.log(
                          "📱 [Mobile Edit Fill Sign] Initial edit mode sent"
                        );
                      }
                    }, 1000);
                  }
                }}
                onError={async () => {
                  console.error(
                    "❌ [Mobile Edit Fill Sign] Iframe failed to load"
                  );
                  if (editorUrl) {
                    try {
                      const response = await fetch(editorUrl);
                      let errorData;
                      try {
                        errorData = await response.json();
                      } catch {
                        const errorText = await response.text();
                        errorData = { error: errorText };
                      }
                      console.error(
                        "❌ [Mobile Edit Fill Sign] Backend error:",
                        errorData
                      );
                      alertModal.showError(
                        "Error Loading PDF",
                        errorData.error ||
                          `Failed to load PDF: ${response.status}`
                      );
                    } catch (err) {
                      console.error(
                        "❌ [Mobile Edit Fill Sign] Error fetching details:",
                        err
                      );
                      alertModal.showError(
                        "Error",
                        "Failed to load PDF document. Please check backend console for details."
                      );
                    }
                  }
                }}
              />
            </div>
          </MobilePDFEditorLayout>
        </div>

        {/* Signature Modal - Mobile Full Screen */}
        {showSignatureModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[10000]">
            <div className="w-full h-full flex flex-col bg-white">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Draw Signature
                </h3>
                <button
                  onClick={() => {
                    setShowSignatureModal(false);
                    setSignatureData("");
                    setActiveTool("select");
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Signature Canvas - Full Screen */}
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                  <SignatureCanvas
                    onSignatureChange={setSignatureData}
                    width={window.innerWidth - 32}
                    height={Math.min(window.innerHeight * 0.4, 300)}
                    showSizeControls={false}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t flex items-center justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowSignatureModal(false);
                    setSignatureData("");
                    setActiveTool("select");
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignatureSave}
                  disabled={!signatureData}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Add Signature
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF View Modal - Mobile Responsive */}
        {showViewModal && generatedPdfUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-1">
            <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-full max-h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">PDF Preview</h3>
                <button
                  onClick={handleCloseViewModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 p-4 overflow-hidden">
                <div className="w-full h-full border border-gray-300 rounded-lg overflow-hidden">
                  <iframe
                    src={
                      generatedPdfUrl.startsWith("data:")
                        ? generatedPdfUrl
                        : generatedPdfUrl.startsWith("blob:")
                        ? generatedPdfUrl
                        : `${generatedPdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
                    }
                    className="w-full h-full border-0"
                    title="PDF Preview"
                    style={{
                      pointerEvents: "auto",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmationModal && confirmationModal.isOpen && (
          <AlertModal
            isOpen={true}
            onClose={() => {
              console.log("❓ Confirmation modal onClose called");
              // Send cancel response
              const iframe = iframeRef.current;
              console.log("❓ Iframe ref:", iframe);
              if (iframe?.contentWindow) {
                console.log(
                  "❓ Sending CONFIRMATION_RESPONSE (cancel):",
                  confirmationModal.id
                );
                iframe.contentWindow.postMessage(
                  {
                    type: "CONFIRMATION_RESPONSE",
                    id: confirmationModal.id,
                    confirmed: false,
                  },
                  "*"
                );
              } else {
                console.error("❓ Iframe or contentWindow not available");
              }
              setConfirmationModal(null);
            }}
            title="Confirm Action"
            message={confirmationModal.message}
            type="warning"
            primaryButton={{
              text: "Cancel",
              onClick: () => {
                console.log("❓ Cancel button clicked");
                // Send cancel response
                const iframe = iframeRef.current;
                console.log("❓ Iframe ref:", iframe);
                if (iframe?.contentWindow) {
                  console.log(
                    "❓ Sending CONFIRMATION_RESPONSE (cancel):",
                    confirmationModal.id
                  );
                  iframe.contentWindow.postMessage(
                    {
                      type: "CONFIRMATION_RESPONSE",
                      id: confirmationModal.id,
                      confirmed: false,
                    },
                    "*"
                  );
                } else {
                  console.error("❓ Iframe or contentWindow not available");
                }
                setConfirmationModal(null);
              },
              variant: "secondary",
            }}
            secondaryButton={{
              text: "Confirm",
              onClick: () => {
                console.log("❓ Confirm button clicked");
                // Send confirm response
                const iframe = iframeRef.current;
                console.log("❓ Iframe ref:", iframe);
                if (iframe?.contentWindow) {
                  console.log(
                    "❓ Sending CONFIRMATION_RESPONSE (confirm):",
                    confirmationModal.id
                  );
                  iframe.contentWindow.postMessage(
                    {
                      type: "CONFIRMATION_RESPONSE",
                      id: confirmationModal.id,
                      confirmed: true,
                    },
                    "*"
                  );
                } else {
                  console.error("❓ Iframe or contentWindow not available");
                }
                setConfirmationModal(null);
              },
              variant: "danger",
            }}
            showCloseButton={false}
          />
        )}
      </div>
    );
  }

  return null;
};
