"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Save,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

interface ToolbarTool {
  id: string;
  name: string;
  icon: string;
}

interface PageThumbnail {
  pageNumber: number;
  isActive: boolean;
  thumbnailUrl?: string;
  onClick: () => void;
}

interface MobilePDFEditorLayoutProps {
  // Header props
  title?: string;
  fileName?: string;
  onDone?: () => void;
  onBack?: () => void;
  instructionText?: string;

  // Toolbar props
  tools?: ToolbarTool[];
  activeTool?: string;
  onToolSelect?: (toolId: string) => void;

  // Page navigation
  pages?: PageThumbnail[];
  currentPage?: number;
  onPageChange?: (pageNumber: number) => void;

  // Zoom controls
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;

  // Main content
  children: React.ReactNode;

  // Additional actions
  onSave?: () => void;
  isProcessing?: boolean;

  // View and download flow
  showViewButton?: boolean;
  showDownloadButton?: boolean;
  onViewPdf?: () => void;
  onDownloadPdf?: () => void;
  hasViewedPdf?: boolean;
}

export const MobilePDFEditorLayout: React.FC<MobilePDFEditorLayoutProps> = ({
  title = "Trevnoctilla",
  fileName,
  onBack,
  instructionText,
  activeTool,
  onToolSelect,
  pages = [],
  currentPage = 1,
  onPageChange,
  zoomLevel = 1.0,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  children,
  onSave,
  isProcessing = false,
  showViewButton = false,
  showDownloadButton = false,
  onViewPdf,
  onDownloadPdf,
}) => {
  const [showPageMenu, setShowPageMenu] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-[9999]">
      {/* Top Header - Mobile Optimized */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Title */}
          <span className="font-bold text-white text-base truncate">
            {title}
          </span>

          {/* File name */}
          {fileName && (
            <span className="text-xs text-gray-400 truncate hidden sm:block">
              {fileName}
            </span>
          )}
        </div>

        {/* Page Navigation */}
        {pages.length > 0 && (
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPageMenu(true)}
              className="px-2 py-1 text-xs text-white bg-gray-700 hover:bg-gray-600 rounded flex items-center space-x-1"
            >
              <FileText className="w-3 h-3" />
              <span>
                {currentPage}/{pages.length}
              </span>
            </button>
            <button
              onClick={() =>
                onPageChange?.(Math.min(pages.length, currentPage + 1))
              }
              disabled={currentPage === pages.length}
              className="p-1.5 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Instruction Text */}
      {instructionText && (
        <div className="bg-gray-800/50 border-b border-gray-700 px-4 py-2">
          <p className="text-xs text-gray-400 text-center">{instructionText}</p>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className="flex-1 bg-gray-900 overflow-hidden relative"
        style={{ margin: 0, padding: 0 }}
      >
        {children}
      </div>

      {/* Bottom Toolbar - Mobile Optimized */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="bg-gray-800 border-t border-gray-700"
          >
            {/* Zoom Controls */}
            {(onZoomIn || onZoomOut || onZoomReset) && (
              <div className="flex items-center justify-center px-4 py-2 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onZoomOut}
                    disabled={zoomLevel <= 0.25}
                    className="p-2 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onZoomReset}
                    className="px-3 py-1.5 text-white hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                    aria-label="Reset zoom"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    onClick={onZoomIn}
                    disabled={zoomLevel >= 3.0}
                    className="p-2 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex items-center justify-center px-4 py-3">
              <div className="flex items-center space-x-2">
                {onSave && (
                  <button
                    onClick={onSave}
                    disabled={isProcessing}
                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                )}
                {showViewButton && onViewPdf && (
                  <button
                    onClick={onViewPdf}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Preview
                  </button>
                )}
                {showDownloadButton && onDownloadPdf && (
                  <button
                    onClick={onDownloadPdf}
                    className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Selection Menu - Mobile */}
      <AnimatePresence>
        {showPageMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[10000]"
              onClick={() => setShowPageMenu(false)}
            />
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[10001] bg-gray-800 border-t border-gray-700 rounded-t-2xl p-4 max-h-[60vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">
                  Select Page
                </h3>
                <button
                  onClick={() => setShowPageMenu(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[50vh]">
                {pages.map((page) => (
                  <button
                    key={page.pageNumber}
                    onClick={() => {
                      page.onClick();
                      setShowPageMenu(false);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      page.isActive
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-gray-700 bg-gray-700/50 hover:border-gray-600"
                    }`}
                  >
                    {page.thumbnailUrl ? (
                      <img
                        src={page.thumbnailUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-auto rounded mb-2"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-gray-600 rounded mb-2 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="text-center text-white text-sm font-medium">
                      Page {page.pageNumber}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
