"use client";

import React, { useState, useRef, useCallback } from "react";
import { useAlertModal } from "@/hooks/useAlertModal";
import AlertModal from "@/components/ui/AlertModal";
import { PDFEditorLayout } from "@/components/ui/PDFEditorLayout";
import { PDFProcessingModal } from "@/components/ui/PDFProcessingModal";
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
      
      const formData = new FormData();
      formData.append("pdf", uploadedFile);

      const uploadResponse = await fetch(`${getApiUrl("")}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        
        throw new Error("Failed to upload PDF");
      }

      // Get the unique filename from the upload response
      const uploadData = await uploadResponse.json();
      const filename = uploadData.filename || uploadedFile.name;
      setUploadedFilename(filename);
      

      // Get PDF info including page count
      
      const pdfInfoResponse = await fetch(
        `${getApiUrl("")}/api/pdf_info/${encodeURIComponent(filename)}`
      );
      if (pdfInfoResponse.ok) {
        const pdfInfo = await pdfInfoResponse.json();
        
        setTotalPages(pdfInfo.page_count);
      } else {
        
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
    
    setZoomLevel((prev) => {
      const newZoom = Math.min(prev + 10, 300);
      
      return newZoom;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 10, 25);
      
      return newZoom;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    
    setZoomLevel(100);
  }, []);

  const handleZoomChange = (value: number) => {
    setZoomLevel(value);
  };

  // Send zoom level to iframe when it changes
  React.useEffect(() => {
    if (!editorUrl) {
      
      return;
    }

    

    const sendZoomMessage = () => {
      if (iframeRef.current?.contentWindow) {
        const zoomValue = zoomLevel / 100; // Convert percentage to decimal (100% = 1.0)
        
        iframeRef.current.contentWindow.postMessage(
          {
            type: "CHANGE_ZOOM",
            zoom: zoomValue,
          },
          "*"
        );
      } else {
        
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
      
      iframe.contentWindow.postMessage(
        {
          type: "SET_EDIT_MODE",
          mode: toolId,
        },
        "*"
      );
      
    } else {
      
    }
  };

  // Listen for messages from iframe
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("PDF Editor received message:", event.data);

      if (event.data.type === "SAVE_COMPLETE") {
        console.log("PDF save completed");
        alertModal.showSuccess("Success", "PDF saved successfully!");
      } else if (event.data.type === "PDF_GENERATED") {
        console.log("PDF generated for download");
      } else if (event.data.type === "TEXT_ADDED") {
        console.log("Text added to PDF");
      } else if (event.data.type === "EDIT_MODE_SET") {
        console.log("Edit mode set:", event.data.mode);
        setActiveTool(event.data.mode);
      } else if (event.data.type === "PDF_GENERATED_FOR_PREVIEW") {
        console.log("=== PDF_GENERATED_FOR_PREVIEW RECEIVED ===");
        console.log("Full event data:", event.data);
        console.log("PDF URL:", event.data.pdfUrl);
        console.log("PDF filename:", event.data.filename);

        // Validate the blob URL
        if (event.data.pdfUrl && event.data.pdfUrl.startsWith("blob:")) {
          console.log("Valid blob URL received:", event.data.pdfUrl);

          // Try to fetch the blob to verify it contains data
          fetch(event.data.pdfUrl)
            .then(response => {
              console.log("=== BLOB VALIDATION START ===");
              console.log("Blob fetch response:", response);
              console.log("Blob response status:", response.status);
              console.log("Blob response ok:", response.ok);
              console.log("Blob response headers:", Object.fromEntries(response.headers.entries()));
              console.log("Blob size from headers:", response.headers.get('content-length'));
              return response.blob();
            })
            .then(blob => {
              console.log("Blob received, size:", blob.size, "type:", blob.type);

              if (blob.size === 0) {
                console.error("ERROR: Blob is empty!");
              } else if (!blob.type.includes('pdf')) {
                console.warn("WARNING: Blob type is not PDF:", blob.type);
              } else {
                console.log("SUCCESS: Valid PDF blob detected");

                // Try to read the first few bytes to check if it's actually a PDF
                blob.slice(0, 8).arrayBuffer().then(buffer => {
                  const bytes = new Uint8Array(buffer);
                  const header = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
                  console.log("PDF header bytes (hex):", header);

                  // PDF files should start with "%PDF-"
                  const headerString = String.fromCharCode.apply(null, Array.from(bytes));
                  console.log("PDF header string:", headerString);

                  if (headerString.startsWith('%PDF-')) {
                    console.log("✅ PDF header is valid - file appears to be a proper PDF");
                  } else {
                    console.error("❌ PDF header is invalid - file may be corrupted");
                  }
                }).catch(err => {
                  console.error("Error reading PDF header:", err);
                });

                // Log blob details
                console.log("Blob size:", blob.size);
                console.log("Blob type:", blob.type);
              }

              console.log("=== BLOB VALIDATION END ===");
            })
            .catch(error => {
              console.error("ERROR fetching blob:", error);
              console.error("Error name:", error.name);
              console.error("Error message:", error.message);
              console.error("Error stack:", error.stack);
            });
        } else {
          console.error("ERROR: Invalid or missing blob URL:", event.data.pdfUrl);
        }

        // Use blob URL directly - it works fine in iframes and allows hash parameters
        setGeneratedPdfUrl(event.data.pdfUrl);
        console.log("Set generatedPdfUrl to:", event.data.pdfUrl);

        setShowViewButton(true); // Show View button
        setShowDownloadButton(true); // Show Download button
        setIsSaving(false); // Clear loading state
        console.log("PDF preview ready - buttons should now be visible");
      } else if (event.data.type === "SHOW_CONFIRMATION") {
        
        setConfirmationModal({
          isOpen: true,
          id: event.data.id,
          message: event.data.message,
        });
      } else {
        
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [alertModal]);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    
    setCurrentPage(pageNumber);

    // Send message to iframe to change page
    const iframe = document.querySelector(
      'iframe[title="PDF Editor"]'
    ) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      
      iframe.contentWindow.postMessage(
        {
          type: "CHANGE_PAGE",
          pageNumber: pageNumber,
        },
        "*"
      );
    } else {
      
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
    
    setIsSaving(true);

    // Send message to iframe to generate PDF (without download)
    const iframe = document.querySelector(
      'iframe[title="PDF Editor"]'
    ) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      
      iframe.contentWindow.postMessage(
        {
          type: "GENERATE_PDF_FOR_PREVIEW",
        },
        "*"
      );
    } else {
      
    }
  };

  // Handle view PDF
  const handleViewPdf = () => {
    console.log("=== VIEW PDF BUTTON CLICKED ===");
    console.log("View PDF clicked");
    console.log("generatedPdfUrl:", generatedPdfUrl);
    console.log("showViewButton:", showViewButton);
    console.log("showDownloadButton:", showDownloadButton);
    console.log("isSaving:", isSaving);
    console.log("URL is blob:", generatedPdfUrl?.startsWith("blob:"));
    console.log("URL is data:", generatedPdfUrl?.startsWith("data:"));
    console.log("URL length:", generatedPdfUrl?.length);

    if (!generatedPdfUrl) {
      console.error("No PDF URL available for preview");
      alert("PDF not ready for preview yet. Please wait for generation to complete.");
      return;
    }

    // Since iframe PDF preview doesn't work reliably, download the PDF instead
    console.log("Opening PDF in new tab for viewing (iframe preview not working)");
    window.open(generatedPdfUrl, '_blank');

    console.log("=== VIEW PDF BUTTON CLICKED END ===");
    // Don't show modal since we're opening in new tab
    // setShowViewModal(true);
    // setHasViewedPdf(true);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    // Keep both buttons visible after closing modal
  };

  // Handle download PDF (with monetization)
  const handleDownloadPdf = async () => {
    
    
    

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
                Edit PDF Content
              </h2>
              <p className="text-gray-400">
                Upload a PDF file to start editing
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
                  {generatedPdfUrl ? (() => {
                    const iframeSrc = generatedPdfUrl.startsWith("data:")
                      ? generatedPdfUrl
                      : generatedPdfUrl.startsWith("blob:")
                      ? generatedPdfUrl
                      : `${generatedPdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

                    console.log("=== IFRAME SRC CALCULATION ===");
                    console.log("generatedPdfUrl:", generatedPdfUrl);
                    console.log("Calculated iframe src:", iframeSrc);
                    console.log("Src starts with blob:", iframeSrc.startsWith("blob:"));
                    console.log("Src starts with data:", iframeSrc.startsWith("data:"));
                    console.log("=== IFRAME SRC CALCULATION END ===");

                    return (
                      <iframe
                        src={iframeSrc}
                        className="w-full h-full border-0"
                        title="PDF Preview"
                        style={{
                          pointerEvents: "auto",
                        }}
                        sandbox="allow-same-origin allow-scripts allow-downloads"
                        allow="fullscreen"
                        onLoad={() => {
                          console.log("=== PDF PREVIEW IFRAME LOAD START ===");
                          console.log("PDF preview iframe loaded, src:", iframeSrc);
                          const iframe = document.querySelector('iframe[title="PDF Preview"]') as HTMLIFrameElement;
                          console.log("Iframe element found:", !!iframe);
                          console.log("Iframe contentWindow:", !!iframe?.contentWindow);

                          // Check iframe attributes
                          console.log("Iframe sandbox:", iframe.sandbox);
                          console.log("Iframe allow:", iframe.allow);
                          console.log("Iframe referrerPolicy:", iframe.referrerPolicy);

                      if (iframe?.contentWindow) {
                        console.log("Iframe contentWindow exists, checking document...");

                        // Wait a bit for the iframe content to load
                        setTimeout(() => {
                          try {
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                            console.log("Iframe document:", !!iframeDoc);
                            console.log("Iframe document readyState:", iframeDoc?.readyState);
                            console.log("Iframe document URL:", iframeDoc?.URL);
                            console.log("Iframe document title:", iframeDoc?.title);
                            console.log("Iframe document body:", iframeDoc?.body?.outerHTML?.substring(0, 500));

                            // Check if there's any content in the iframe
                            const bodyContent = iframeDoc?.body?.textContent || '';
                            console.log("Iframe body text content length:", bodyContent.length);
                            console.log("Iframe body text content preview:", bodyContent.substring(0, 200));

                            // Check for any error messages
                            const errorElements = iframeDoc?.querySelectorAll('[class*="error"], [id*="error"]');
                            console.log("Error elements found in iframe:", errorElements?.length || 0);

                            // Check for PDF viewer elements
                            const pdfElements = iframeDoc?.querySelectorAll('[class*="pdf"], [id*="pdf"], embed, object');
                            console.log("PDF elements found in iframe:", pdfElements?.length || 0);

                            // Check iframe dimensions
                            console.log("Iframe offsetWidth:", iframe.offsetWidth);
                            console.log("Iframe offsetHeight:", iframe.offsetHeight);
                            console.log("Iframe clientWidth:", iframe.clientWidth);
                            console.log("Iframe clientHeight:", iframe.clientHeight);

                          } catch (e) {
                            console.error("Error accessing iframe content:", e);
                          }
                        }, 2000); // Wait 2 seconds for content to load
                      } else {
                        console.error("Iframe contentWindow is null or undefined");
                      }

                      console.log("=== PDF PREVIEW IFRAME LOAD END ===");
                    }}
                    onError={(e) => {
                      console.error("=== IFRAME LOAD ERROR ===");
                      console.error("Iframe failed to load:", e);
                      console.error("Failed URL:", iframeSrc);
                      console.error("Error type:", e.type);
                      console.error("Error target:", e.target);
                      console.error("=== IFRAME LOAD ERROR END ===");
                    }}
                    />
                    );
                  })() : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <div className="text-gray-500 mb-2">Generating PDF preview...</div>
                        <div className="text-sm text-gray-400">generatedPdfUrl: {generatedPdfUrl ? 'set' : 'null'}</div>
                      </div>
                    </div>
                  )}
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
