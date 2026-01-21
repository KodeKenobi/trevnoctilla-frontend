"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Play,
  Zap,
  Image,
  QrCode,
  Upload,
  Download,
  Clock,
  Star,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

interface FileConversionCardProps {
  theme?: "modern-dark" | "modern-light" | "classic";
  tool: {
    name: string;
    description: string;
    category: string;
    icon: React.ComponentType<{ className?: string }>;
    inputFormats: string[];
    outputFormats: string[];
    features: string[];
    processingSpeed: "Instant" | "Fast" | "Standard";
    quality: "Lossless" | "High" | "Standard";
    maxFileSize: string;
    popularity: number; // 1-5 stars
    usageCount: number;
    isFree: boolean;
    isMobileOptimized: boolean;
  };
  onClick?: () => void;
  className?: string;
}

const FileConversionCard: React.FC<FileConversionCardProps> = ({
  theme = "modern-dark",
  tool,
  onClick,
  className = "",
}) => {
  const getThemeStyles = () => {
    switch (theme) {
      case "modern-dark":
        return {
          card: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50",
          text: "text-white",
          textSecondary: "text-gray-400",
          textMuted: "text-gray-500",
          border: "border-gray-700/50",
          hover: "hover:border-gray-600/70",
          accent: "text-cyan-400",
          badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
          successBadge: "bg-green-500/20 text-green-400 border-green-500/30",
        };
      case "modern-light":
        return {
          card: "bg-gradient-to-br from-white via-gray-50 to-gray-100 border-gray-200",
          text: "text-gray-900",
          textSecondary: "text-gray-600",
          textMuted: "text-gray-500",
          border: "border-gray-200",
          hover: "hover:border-gray-300",
          accent: "text-blue-600",
          badge: "bg-blue-500/20 text-blue-600 border-blue-500/30",
          successBadge: "bg-green-500/20 text-green-600 border-green-500/30",
        };
      case "classic":
        return {
          card: "bg-white border-gray-200 shadow-lg",
          text: "text-gray-900",
          textSecondary: "text-gray-600",
          textMuted: "text-gray-500",
          border: "border-gray-200",
          hover: "hover:border-gray-300",
          accent: "text-blue-600",
          badge: "bg-blue-500/20 text-blue-600 border-blue-500/30",
          successBadge: "bg-green-500/20 text-green-600 border-green-500/30",
        };
      default:
        return {
          card: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50",
          text: "text-white",
          textSecondary: "text-gray-400",
          textMuted: "text-gray-500",
          border: "border-gray-700/50",
          hover: "hover:border-gray-600/70",
          accent: "text-cyan-400",
          badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
          successBadge: "bg-green-500/20 text-green-400 border-green-500/30",
        };
    }
  };

  const styles = getThemeStyles();
  const IconComponent = tool.icon;

  const formatUsageCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case "Instant":
        return "text-green-400";
      case "Fast":
        return "text-yellow-400";
      case "Standard":
        return "text-orange-400";
      default:
        return styles.textSecondary;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "Lossless":
        return "text-green-400";
      case "High":
        return "text-blue-400";
      case "Standard":
        return "text-orange-400";
      default:
        return styles.textSecondary;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-6 ${styles.card}
        border backdrop-blur-sm ${styles.hover} transition-all duration-300
        group cursor-pointer ${className}
      `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-current to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-current to-transparent rounded-full transform -translate-x-12 translate-y-12"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-3 rounded-xl ${styles.badge} border`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-semibold text-lg truncate ${styles.text}`}>
                  {tool.name}
                </h3>
                {tool.isFree && (
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${styles.successBadge}`}>
                    Free
                  </span>
                )}
              </div>
              <p className={`text-sm ${styles.textSecondary} truncate`}>
                {tool.category}
              </p>
            </div>
          </div>
          <ExternalLink className={`w-5 h-5 ${styles.textMuted} group-hover:${styles.accent} transition-colors flex-shrink-0`} />
        </div>

        {/* Description */}
        <p className={`text-sm leading-relaxed mb-4 line-clamp-2 ${styles.textSecondary}`}>
          {tool.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <Upload className={`w-4 h-4 ${styles.textMuted}`} />
            <span className={`text-sm font-medium ${styles.text}`}>
              {tool.inputFormats.length}+ in
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Download className={`w-4 h-4 ${styles.textMuted}`} />
            <span className={`text-sm font-medium ${styles.text}`}>
              {tool.outputFormats.length}+ out
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className={`w-4 h-4 ${getSpeedColor(tool.processingSpeed)}`} />
            <span className={`text-sm font-medium ${styles.text}`}>
              {tool.processingSpeed}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className={`w-4 h-4 ${getQualityColor(tool.quality)}`} />
            <span className={`text-sm font-medium ${styles.text}`}>
              {tool.quality}
            </span>
          </div>
        </div>

        {/* File Size & Usage */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${styles.textSecondary}`}>Max: {tool.maxFileSize}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-sm ${styles.textMuted}`}>
              {formatUsageCount(tool.usageCount)} uses
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < tool.popularity
                    ? "text-yellow-400 fill-yellow-400"
                    : styles.textMuted
                }`}
              />
            ))}
            <span className={`text-xs ml-2 ${styles.textMuted}`}>
              {tool.popularity}/5 rating
            </span>
          </div>
        </div>

        {/* Format Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tool.inputFormats.slice(0, 3).map((format) => (
            <span
              key={`input-${format}`}
              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                theme === "modern-dark"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
            >
              {format}
            </span>
          ))}
          {tool.inputFormats.length > 3 && (
            <span className={`text-xs ${styles.textMuted} px-2 py-1`}>
              +{tool.inputFormats.length - 3}
            </span>
          )}
        </div>

        {/* Features List */}
        <div className="flex flex-wrap gap-2">
          {tool.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                theme === "modern-dark"
                  ? "bg-gray-800/50 border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                  : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {feature}
            </span>
          ))}
          {tool.features.length > 3 && (
            <span className={`text-xs ${styles.textMuted} px-2 py-1`}>
              +{tool.features.length - 3} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export { FileConversionCard };