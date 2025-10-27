"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Play,
  Zap,
  FileText,
  QrCode,
  Image,
  Sparkles,
  Clock,
  Shield,
  Zap as Lightning,
} from "lucide-react";

export default function ToolsPage() {
  const tools = [
    {
      title: "Video Converter",
      description:
        "Convert videos between all formats with compression and quality control. MP4, AVI, MOV, MKV, WEBM, and more.",
      page: "video-converter" as const,
      icon: Play,
      gradient: "from-red-500 to-pink-500",
      features: ["All Formats", "Compression", "Quality Control"],
    },
    {
      title: "Audio Converter",
      description:
        "Convert audio between all formats with bitrate and quality control. MP3, WAV, AAC, FLAC, OGG, and more.",
      page: "audio-converter" as const,
      icon: Zap,
      gradient: "from-green-500 to-cyan-500",
      features: ["All Formats", "Bitrate Control", "High Quality"],
    },
    {
      title: "Image Converter",
      description:
        "Convert images between all formats with resize and quality control. JPG, PNG, WEBP, GIF, and more.",
      page: "image-converter" as const,
      icon: Image,
      gradient: "from-blue-500 to-purple-500",
      features: ["All Formats", "Resize", "Quality Control"],
    },
    {
      title: "PDF Tools",
      description:
        "Comprehensive PDF processing: extract text/images, merge, split, edit, sign, watermark, and compress PDFs.",
      page: "pdf-tools" as const,
      icon: FileText,
      gradient: "from-yellow-500 to-orange-500",
      features: [
        "Text Extraction",
        "Image Extraction",
        "Merge & Split",
        "Digital Signatures",
        "Watermarks",
        "Compression",
      ],
    },
    {
      title: "QR Generator",
      description:
        "Generate custom QR codes for any text, URL, or contact information.",
      page: "qr-generator" as const,
      icon: QrCode,
      gradient: "from-purple-500 to-pink-500",
      features: ["Custom Design", "High Resolution", "Multiple Formats"],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 page-content">
      {/* Header Section */}
      <section className="pt-24 pb-16 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5"></div>
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-2xl lg:text-3xl font-bold text-white mb-6 leading-tight"
            >
              Powerful Tools
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              Transform, convert, and optimize your files with our comprehensive
              suite of professional-grade tools.
              <span className="text-cyan-400 font-semibold">
                {" "}
                All completely free and secure.
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>No Registration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Instant Processing</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-16 relative">
        {/* Background transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center md:justify-items-stretch">
            {tools.map((tool, index) => {
              const href =
                tool.page === "pdf-tools"
                  ? "/tools/pdf-tools"
                  : tool.page === "video-converter"
                  ? "/tools/video-converter"
                  : tool.page === "audio-converter"
                  ? "/tools/audio-converter"
                  : tool.page === "image-converter"
                  ? "/tools/image-converter"
                  : tool.page === "qr-generator"
                  ? "/tools/qr-generator"
                  : "/";

              return (
                <motion.div
                  key={tool.page}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="card card-hover p-8 group animate-fade-in-up text-center md:text-left w-full max-w-md md:max-w-none mx-auto"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col md:flex-row items-center mb-6">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-r ${tool.gradient} flex items-center justify-center mb-4 md:mb-0 md:mr-4 group-hover:scale-110 transition-transform`}
                    >
                      <tool.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {tool.title}
                    </h3>
                  </div>

                  <p className="text-gray-300 mb-6 leading-relaxed text-center md:text-left">
                    {tool.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
                    {tool.features.map((feature, featureIndex) => (
                      <span
                        key={`${tool.page}-feature-${featureIndex}`}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-cyan-400 border border-cyan-500/30"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center text-cyan-400 group-hover:text-cyan-300 justify-center md:justify-start">
                    <span className="font-medium">Try it now</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <Link
                    href={href}
                    className="absolute inset-0"
                    aria-label={tool.title}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Powerful Tools CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6">
              Why Choose Trevnoctilla?
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Our tools are designed with professionals in mind, offering
              enterprise-grade features with a simple, intuitive interface.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                title: "Lightning Fast",
                description:
                  "Process files in seconds, not minutes. Our optimized algorithms ensure maximum speed.",
                features: [
                  "Instant Processing",
                  "Cloud-Powered",
                  "No Queues",
                  "Real-time Updates",
                ],
                gradient: "from-yellow-500 to-orange-500",
              },
              {
                title: "100% Secure",
                description:
                  "Your files are processed securely and never stored permanently on our servers.",
                features: [
                  "End-to-End Encryption",
                  "No Data Storage",
                  "GDPR Compliant",
                  "Privacy First",
                ],
                gradient: "from-green-500 to-emerald-500",
              },
              {
                title: "Professional Quality",
                description:
                  "Get results that match or exceed professional software standards.",
                features: [
                  "High-Quality Output",
                  "Lossless Conversion",
                  "Advanced Algorithms",
                  "Batch Processing",
                ],
                gradient: "from-purple-500 to-pink-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 text-center md:text-left"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0`}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li
                      key={`${feature.title}-item-${idx}`}
                      className="flex items-center text-gray-400 justify-center md:justify-start"
                    >
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer APIs CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6">
              Developer APIs for Powerful Computing
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Integrate our advanced file processing capabilities into your
              applications with our comprehensive API suite. Built for
              developers, by developers.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 text-center md:text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                PDF Processing APIs
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Advanced PDF manipulation with OCR, text extraction, form
                filling, and document analysis capabilities.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "PDF to Text with OCR",
                  "Form Field Detection & Filling",
                  "Document Structure Analysis",
                  "Batch PDF Processing",
                  "Advanced Text Extraction",
                  "Metadata Extraction",
                ].map((feature, idx) => (
                  <li
                    key={`api-feature-${idx}`}
                    className="flex items-center text-gray-400 justify-center md:justify-start"
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              <motion.button
                onClick={() => window.open("/api-docs", "_blank")}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                View API Documentation
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 text-center md:text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Media Conversion APIs
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                High-performance media processing with support for all major
                formats and advanced compression algorithms.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Video Format Conversion",
                  "Audio Processing & Compression",
                  "Image Optimization & Resizing",
                  "Real-time Processing",
                  "Custom Quality Settings",
                  "Batch Media Processing",
                ].map((feature, idx) => (
                  <li
                    key={`media-feature-${idx}`}
                    className="flex items-center text-gray-400 justify-center md:justify-start"
                  >
                    <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              <motion.button
                onClick={() => window.open("/auth/register", "_self")}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get API Access
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
