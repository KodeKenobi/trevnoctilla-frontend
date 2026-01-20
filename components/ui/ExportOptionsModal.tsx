"use client";

import { useState } from "react";
import { Download, X, Palette, FileText, Eye } from "lucide-react";

interface ExportOptions {
  completedColor: string;
  failedColor: string;
  includeComments: boolean;
  commentStyle: 'success' | 'detailed' | 'minimal';
}

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  campaignName: string;
  isExporting?: boolean;
}

const colorOptions = [
  { name: 'Yellow (Default)', value: '#FEF3C7', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { name: 'Light Green', value: '#DCFCE7', bg: 'bg-green-100', text: 'text-green-800' },
  { name: 'Light Blue', value: '#DBEAFE', bg: 'bg-blue-100', text: 'text-blue-800' },
  { name: 'Light Purple', value: '#F3E8FF', bg: 'bg-purple-100', text: 'text-purple-800' },
];

const failedColorOptions = [
  { name: 'Red (Default)', value: '#FECACA', bg: 'bg-red-100', text: 'text-red-800' },
  { name: 'Orange', value: '#FED7AA', bg: 'bg-orange-100', text: 'text-orange-800' },
  { name: 'Pink', value: '#FCE7F3', bg: 'bg-pink-100', text: 'text-pink-800' },
  { name: 'Gray', value: '#F3F4F6', bg: 'bg-gray-100', text: 'text-gray-800' },
];

export default function ExportOptionsModal({
  isOpen,
  onClose,
  onExport,
  campaignName,
  isExporting = false
}: ExportOptionsModalProps) {
  const [options, setOptions] = useState<ExportOptions>({
    completedColor: '#FEF3C7',
    failedColor: '#FECACA',
    includeComments: true,
    commentStyle: 'success',
  });

  const handleExport = () => {
    onExport(options);
  };

  const resetToDefaults = () => {
    setOptions({
      completedColor: '#FEF3C7',
      failedColor: '#FECACA',
      includeComments: true,
      commentStyle: 'success',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Export Results</h2>
              <p className="text-sm text-gray-600">{campaignName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Color Options */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">Row Colors</h3>
            </div>

            {/* Completed Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completed Sites
              </label>
              <div className="grid grid-cols-2 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setOptions(prev => ({ ...prev, completedColor: color.value }))}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      options.completedColor === color.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`inline-block w-4 h-4 rounded ${color.bg} mr-2`} />
                    <span className="text-sm">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Failed Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Failed/Broken Sites
              </label>
              <div className="grid grid-cols-2 gap-2">
                {failedColorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setOptions(prev => ({ ...prev, failedColor: color.value }))}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      options.failedColor === color.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`inline-block w-4 h-4 rounded ${color.bg} mr-2`} />
                    <span className="text-sm">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Comments Options */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">Comments Column</h3>
            </div>

            {/* Include Comments Toggle */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeComments}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeComments: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include comments column</span>
              </label>
            </div>

            {/* Comment Style */}
            {options.includeComments && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment Style
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'success', label: 'Success Focused', desc: 'Simple ✓/✗ indicators with key details' },
                    { value: 'detailed', label: 'Detailed', desc: 'Full explanations and error details' },
                    { value: 'minimal', label: 'Minimal', desc: 'Just status icons and brief text' },
                  ].map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setOptions(prev => ({ ...prev, commentStyle: style.value as any }))}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        options.commentStyle === style.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">{style.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">Preview</h3>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="text-xs text-gray-600 mb-2">Sample export columns:</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Company Name | Website URL | Contact Email | Status</span>
                  {options.includeComments && <span>| Comments</span>}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Completed rows will be highlighted in your chosen color
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}