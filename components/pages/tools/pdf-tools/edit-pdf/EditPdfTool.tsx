"use client";

import React, { useState, useRef, useCallback } from "react";
import { useAlertModal } from "@/hooks/useAlertModal";
import AlertModal from "@/components/ui/AlertModal";
import { PDFEditorLayout } from "@/components/ui/PDFEditorLayout";
import { useMonetization } from "@/contexts/MonetizationProvider";
import { getApiUrl } from "@/lib/config";

// Simple button component
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, disabled, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${className}`}
  >
    {children}
  </button>
);

interface EditPdfToolProps {
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

export const EditPdfTool: React.FC<EditPdfToolProps> = ({
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
  const [activeTool, setActiveTool] = useState<string>("edit-text");
  const [editorUrl, setEditorUrl] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentUploadStep, setCurrentUploadStep] = useState<number>(0);
  const [uploadedFilename, setUploadedFilename] = useState<string>("");

  // View and download flow state
  const [showViewModal, setShowViewModal] = useState(false);
  const [showViewButton, setShowViewButton] = useState(false);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [hasViewedPdf, setHasViewedPdf] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    id: string;
    message: string;
  } | null>(null);

  // Refs
  const isProcessingRef = useRef<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Process document function
  const handleProcessDocument = useCallback(async () => {
    if (!uploadedFile || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setUploadProgress(0);
    setCurrentUploadStep(0);

    // Smooth progress simulation with realistic timing
    const simulateProgress = () => {
      return new Promise<void>((resolve) => {
        let progress = 0;
        let step = 0;
        let interval: NodeJS.Timeout | null = null;
        const totalDuration = 8000; // 8 seconds total for better UX
        const updateInterval = 100; // Update every 100ms for smoother feel
        const totalSteps = totalDuration / updateInterval;
        const progressIncrement = 100 / totalSteps;

        const updateProgress = () => {
          // Smooth, predictable progress increments with occasional pauses
          let increment = progressIncrement;

          // Add slight pauses at key milestones for realism
          if (
            (progress >= 20 && progress < 25) ||
            (progress >= 55 && progress < 60)
          ) {
            increment = progressIncrement * 0.3; // Slower progress at transitions
          }

          progress += increment;

          // Smooth step transitions based on progress
          if (progress >= 25 && step === 0) {
            step = 1;
            setCurrentUploadStep(1);
          } else if (progress >= 60 && step === 1) {
            step = 2;
            setCurrentUploadStep(2);
          }

          // Ensure progress doesn't exceed 100
          const clampedProgress = Math.min(progress, 100);
          setUploadProgress(clampedProgress);

          if (clampedProgress >= 100) {
            if (interval) {
              clearInterval(interval);
            }
            resolve();
          }
        };

        // Start with a delay for smoothness
        setTimeout(() => {
          interval = setInterval(updateProgress, updateInterval);
        }, 800);
      });
    };

    try {
      // Simulate realistic processing time
      await simulateProgress();

      // Brief pause before showing completion
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Save PDF file first, then convert using template
      console.log("🚀 [Edit PDF] Starting PDF upload...");
      const formData = new FormData();
      formData.append("pdf", uploadedFile);

      const uploadResponse = await fetch(`${getApiUrl("")}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        console.error(
          "❌ [Edit PDF] Upload failed:",
          uploadResponse.status,
          uploadResponse.statusText
        );
        throw new Error("Failed to upload PDF");
      }

      // Get the unique filename from the upload response
      const uploadData = await uploadResponse.json();
      const filename = uploadData.filename || uploadedFile.name;
      setUploadedFilename(filename);
      console.log("✅ [Edit PDF] Upload successful:", filename);

      // Get PDF info including page count
      console.log("📊 [Edit PDF] Fetching PDF info...");
      const pdfInfoResponse = await fetch(
        `${getApiUrl("")}/api/pdf_info/${encodeURIComponent(filename)}`
      );
      if (pdfInfoResponse.ok) {
        const pdfInfo = await pdfInfoResponse.json();
        console.log("📄 [Edit PDF] PDF info:", pdfInfo);
        setTotalPages(pdfInfo.page_count);
      } else {
        console.warn(
          "⚠️ [Edit PDF] Failed to get PDF info, defaulting to 1 page"
        );
        setTotalPages(1);
      }

      // Set the converted HTML URL using the backend API URL
      // Add cache-busting parameter to force reload
      // Detect mobile and add mobile parameter
      const isMobile =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const cacheBuster = Date.now();
      const mobileParam = isMobile ? "&mobile=true" : "";
      setEditorUrl(
        `${getApiUrl("")}/convert/${encodeURIComponent(
          filename
        )}?v=${cacheBuster}${mobileParam}`
      );

      // Brief pause before showing completion
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
  }, [uploadedFile, editorUrl]);

  // Reset processing ref when component unmounts or file changes
  React.useEffect(() => {
    return () => {
      isProcessingRef.current = false;
    };
  }, [uploadedFile]);

  // Clean up when component unmounts or editorUrl changes
  React.useEffect(() => {
    return () => {
      // No cleanup needed for HTML URLs
    };
  }, [editorUrl]);

  // Reset processing ref when editorUrl changes (processing complete)
  React.useEffect(() => {
    if (editorUrl) {
      isProcessingRef.current = false;
    }
  }, [editorUrl]);

  // Improved zoom controls with smooth transitions
  const handleZoomIn = useCallback(() => {
    console.log("🔍 Zoom In button clicked");
    setZoomLevel((prev) => {
      const newZoom = Math.min(prev + 10, 300);
      console.log("🔍 Zoom In: updating from", prev, "to", newZoom);
      return newZoom;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    console.log("🔍 Zoom Out button clicked");
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 10, 25);
      console.log("🔍 Zoom Out: updating from", prev, "to", newZoom);
      return newZoom;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    console.log("🔍 Zoom Reset clicked");
    setZoomLevel(100);
  }, []);

  const handleZoomChange = (value: number) => {
    setZoomLevel(value);
  };

  // Send zoom level to iframe when it changes
  React.useEffect(() => {
    if (!editorUrl) {
      console.log("❌ Editor URL not set, skipping zoom message");
      return;
    }

    console.log(
      "🔍 Zoom level changed to:",
      zoomLevel,
      "editorUrl:",
      editorUrl
    );

    const sendZoomMessage = () => {
      if (iframeRef.current?.contentWindow) {
        const zoomValue = zoomLevel / 100; // Convert percentage to decimal (100% = 1.0)
        console.log(
          "🔍 Sending zoom message to iframe:",
          zoomValue,
          "from zoomLevel:",
          zoomLevel,
          "iframe ref exists:",
          !!iframeRef.current
        );
        iframeRef.current.contentWindow.postMessage(
          {
            type: "CHANGE_ZOOM",
            zoom: zoomValue,
          },
          "*"
        );
      } else {
        console.log("❌ Iframe ref not ready, retrying in 100ms...");
        // Retry after a short delay if iframe isn't ready
        setTimeout(sendZoomMessage, 100);
      }
    };

    // Small delay to ensure iframe is loaded
    const timeoutId = setTimeout(sendZoomMessage, 100);
    return () => clearTimeout(timeoutId);
  }, [zoomLevel, editorUrl]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === "-") {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === "0") {
          e.preventDefault();
          handleZoomReset();
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleZoomIn, handleZoomOut, handleZoomReset]);

  // Log scrollbar position
  React.useEffect(() => {
    const logScrollPosition = () => {
      // Find the scrollable container (PDFEditorLayout's document area)
      const scrollContainer = document.querySelector(
        ".flex-1.bg-gray-900.overflow-auto"
      ) as HTMLElement;
      if (scrollContainer) {
        console.log("📜 SCROLL POSITION:", {
          scrollLeft: scrollContainer.scrollLeft,
          scrollTop: scrollContainer.scrollTop,
          scrollWidth: scrollContainer.scrollWidth,
          scrollHeight: scrollContainer.scrollHeight,
          clientWidth: scrollContainer.clientWidth,
          clientHeight: scrollContainer.clientHeight,
        });
      }
    };

    // Log on scroll
    const scrollContainer = document.querySelector(
      ".flex-1.bg-gray-900.overflow-auto"
    ) as HTMLElement;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", logScrollPosition);
      return () => {
        scrollContainer.removeEventListener("scroll", logScrollPosition);
      };
    }
  }, []);

  // Handle tool selection
  const handleToolSelect = (toolId: string) => {
    console.log("🔧 Tool selected:", toolId);
    console.log("🔧 Previous active tool:", activeTool);

    // Handle undo/redo buttons
    if (toolId === "undo") {
      // Send message to iframe to perform undo
      const iframe = document.querySelector(
        'iframe[title="PDF Editor"]'
      ) as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "UNDO" }, "*");
      }
      return;
    }

    if (toolId === "redo") {
      // Send message to iframe to perform redo
      const iframe = document.querySelector(
        'iframe[title="PDF Editor"]'
      ) as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "REDO" }, "*");
      }
      return;
    }

    setActiveTool(toolId);

    // Send message to iframe to set edit mode
    const iframe = document.querySelector(
      'iframe[title="PDF Editor"]'
    ) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      console.log("📤 Sending SET_EDIT_MODE message to iframe:", toolId);
      iframe.contentWindow.postMessage(
        {
          type: "SET_EDIT_MODE",
          mode: toolId,
        },
        "*"
      );
      console.log("📤 Message sent successfully");
    } else {
      console.log("❌ Iframe not found or no contentWindow");
    }
  };

  // Listen for messages from iframe
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("📨 Message received from iframe:", event.data);

      if (event.data.type === "SAVE_COMPLETE") {
        console.log("✅ PDF saved successfully:", event.data.filename);
        alertModal.showSuccess("Success", "PDF saved successfully!");
      } else if (event.data.type === "PDF_GENERATED") {
        console.log("✅ PDF generation completed");
      } else if (event.data.type === "TEXT_ADDED") {
        console.log("📝 Text added:", event.data);
      } else if (event.data.type === "EDIT_MODE_SET") {
        console.log("🎯 Edit mode set in iframe:", event.data.mode);
        setActiveTool(event.data.mode);
      } else if (event.data.type === "PDF_GENERATED_FOR_PREVIEW") {
        console.log("📄 PDF generated for preview:", event.data.pdfUrl);

        // Use blob URL directly - it works fine in iframes and allows hash parameters
        console.log("📄 Using blob URL for iframe preview");
        setGeneratedPdfUrl(event.data.pdfUrl);

        setShowViewButton(true); // Show View button
        setShowDownloadButton(true); // Show Download button
        setIsSaving(false); // Clear loading state
      } else if (event.data.type === "SHOW_CONFIRMATION") {
        console.log("❓ Confirmation requested:", event.data.message);
        setConfirmationModal({
          isOpen: true,
          id: event.data.id,
          message: event.data.message,
        });
      } else {
        console.log("❓ Unknown message type:", event.data.type);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [alertModal]);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    console.log("📄 Changing to page:", pageNumber);
    setCurrentPage(pageNumber);

    // Send message to iframe to change page
    const iframe = document.querySelector(
      'iframe[title="PDF Editor"]'
    ) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      console.log("📤 Sending CHANGE_PAGE message to iframe:", pageNumber);
      iframe.contentWindow.postMessage(
        {
          type: "CHANGE_PAGE",
          pageNumber: pageNumber,
        },
        "*"
      );
    } else {
      console.log("❌ Iframe not found for page change");
    }
  };

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

  // Handle save changes - show view button first
  const handleSaveChanges = () => {
    console.log("💾 [Edit PDF] Save clicked - generating PDF for preview");
    setIsSaving(true);

    // Send message to iframe to generate PDF (without download)
    const iframe = document.querySelector(
      'iframe[title="PDF Editor"]'
    ) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      console.log(
        "📤 [Edit PDF] Sending GENERATE_PDF_FOR_PREVIEW message to iframe"
      );
      iframe.contentWindow.postMessage(
        {
          type: "GENERATE_PDF_FOR_PREVIEW",
        },
        "*"
      );
    } else {
      console.error("❌ [Edit PDF] Could not find PDF Editor iframe");
    }
  };

  // Handle view PDF
  const handleViewPdf = () => {
    console.log("🔍 Setting showViewModal to true");
    setShowViewModal(true);
    setHasViewedPdf(true);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    // Keep both buttons visible after closing modal
  };

  // Handle download PDF (with monetization)
  const handleDownloadPdf = async () => {
    console.log("📥 handleDownloadPdf called");
    console.log("📥 generatedPdfUrl:", generatedPdfUrl);
    console.log("📥 uploadedFile?.name:", uploadedFile?.name);

    if (generatedPdfUrl) {
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
        window.open(generatedPdfUrl, "_blank");
      }
    } else {
      console.log("📥 No generatedPdfUrl, cannot download");
    }
  };

  // File upload state
  if (!uploadedFile) {
    return (
      <>
        <div className="w-full max-w-4xl mx-auto min-h-96 bg-gray-800/40 rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Edit PDF Content
              </h2>
              <p className="text-gray-400">
                Upload a PDF to start editing text, images, and more
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
  if (isProcessing && !editorUrl) {
    // Determine status text based on progress
    let statusText = "Processing PDF...";
    if (uploadProgress < 30) {
      statusText = "Uploading PDF...";
    } else if (uploadProgress < 60) {
      statusText = "Analyzing document structure...";
    } else if (uploadProgress < 90) {
      statusText = "Preparing editor...";
    } else {
      statusText = "Almost done...";
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-gray-800/40 rounded-lg overflow-hidden">
        <div className="p-6 flex items-center justify-center">
          <div className="w-full max-w-lg">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">
                  Progress
                </span>
                <span className="text-sm font-semibold text-white">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            {/* Status Text */}
            <p className="text-center text-sm text-gray-400">{statusText}</p>
          </div>
        </div>
      </div>
    );
  }

  // Editor interface
  if (editorUrl) {
    return (
      <div data-editor-active="true">
        <div style={{ display: showViewModal ? "none" : "block" }}>
          <PDFEditorLayout
            title="Trevnoctilla"
            fileName={uploadedFile?.name}
            instructionText="💡 Click on any text in the document to edit it"
            onBack={() => {
              setUploadedFile(null);
              setEditorUrl("");
              setActiveTool("edit-text");
              setResult(null);
            }}
            onDone={() => {
              setUploadedFile(null);
              setEditorUrl("");
              setActiveTool("edit-text");
              setResult(null);
            }}
            onSearch={() => {
              console.log("Search clicked");
            }}
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            activeTool={activeTool}
            onToolSelect={handleToolSelect}
            tools={[{ id: "edit-text", name: "Edit Text", icon: "✏" }]}
            hideDrawingTools={true}
            pages={generatePageThumbnails()}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onUploadNew={() => {
              setUploadedFile(null);
              setEditorUrl("");
              setResult(null);
            }}
            onSave={handleSaveChanges}
            isProcessing={isSaving}
            showViewButton={showViewButton}
            showDownloadButton={showDownloadButton}
            hasViewedPdf={hasViewedPdf}
            isInPreviewMode={false}
            onViewPdf={handleViewPdf}
            onDownloadPdf={handleDownloadPdf}
          >
            {/* PDF Editor - Professional Editor Experience */}
            <div
              className="w-full h-full bg-gray-900"
              style={{
                display: "block",
                overflow: "auto",
                width: "100%",
                height: "100%",
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
                }}
                onLoad={() => {
                  // Send initial zoom when iframe loads
                  if (iframeRef.current?.contentWindow) {
                    const zoomValue = zoomLevel / 100;
                    console.log(
                      "🖼️ Iframe loaded, sending initial zoom:",
                      zoomValue
                    );
                    iframeRef.current.contentWindow.postMessage(
                      {
                        type: "CHANGE_ZOOM",
                        zoom: zoomValue,
                      },
                      "*"
                    );
                  }
                }}
              />
            </div>
          </PDFEditorLayout>
        </div>

        {/* PDF View Modal - Mobile Responsive */}
        {showViewModal && generatedPdfUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-1 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-full max-h-full flex flex-col">
              <div className="flex items-center justify-between p-2 sm:p-4 border-b">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Preview PDF
                </h3>
                <button
                  onClick={handleCloseViewModal}
                  className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 p-1 sm:p-4 overflow-hidden">
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
        {confirmationModal && (
          <AlertModal
            isOpen={confirmationModal.isOpen}
            onClose={() => {
              // Send cancel response
              const iframe = document.querySelector(
                'iframe[title="PDF Editor"]'
              ) as HTMLIFrameElement;
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(
                  {
                    type: "CONFIRMATION_RESPONSE",
                    id: confirmationModal.id,
                    confirmed: false,
                  },
                  "*"
                );
              }
              setConfirmationModal(null);
            }}
            title="Confirm Action"
            message={confirmationModal.message}
            type="warning"
            primaryButton={{
              text: "Cancel",
              onClick: () => {
                // Send cancel response
                const iframe = document.querySelector(
                  'iframe[title="PDF Editor"]'
                ) as HTMLIFrameElement;
                if (iframe && iframe.contentWindow) {
                  iframe.contentWindow.postMessage(
                    {
                      type: "CONFIRMATION_RESPONSE",
                      id: confirmationModal.id,
                      confirmed: false,
                    },
                    "*"
                  );
                }
                setConfirmationModal(null);
              },
              variant: "secondary",
            }}
            secondaryButton={{
              text: "Confirm",
              onClick: () => {
                // Send confirm response
                const iframe = document.querySelector(
                  'iframe[title="PDF Editor"]'
                ) as HTMLIFrameElement;
                if (iframe && iframe.contentWindow) {
                  iframe.contentWindow.postMessage(
                    {
                      type: "CONFIRMATION_RESPONSE",
                      id: confirmationModal.id,
                      confirmed: true,
                    },
                    "*"
                  );
                }
                setConfirmationModal(null);
              },
              variant: "danger",
            }}
            showCloseButton={false}
          />
        )}

        {/* Monetization removed - using Google AdSense only */}
      </div>
    );
  }

  // Results
  if (result) {
    return (
      <div className="w-full max-w-4xl mx-auto min-h-96 bg-gray-800/40 rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              {result.type === "success" ? "Success!" : "Error"}
            </h2>
            <p className="text-gray-400 mb-6">{result.message}</p>
            <Button
              onClick={() => {
                setResult(null);
                setUploadedFile(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Process Another PDF
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
