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
import TextType from "@/components/TextType";

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
              <span className="text-white font-semibold">
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
              const hrefMap: Record<string, string> = {
                "pdf-tools": "/tools/pdf-tools",
                "video-converter": "/tools/video-converter",
                "audio-converter": "/tools/audio-converter",
                "image-converter": "/tools/image-converter",
                "qr-generator": "/tools/qr-generator",
              };
              const href = hrefMap[tool.page] || "/";

              return (
                <Link key={tool.page} href={href} className="block">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    className="card card-hover p-8 group animate-fade-in-up text-center w-full max-w-md md:max-w-none mx-auto relative"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col items-center mb-6">
                      <div className="text-2xl font-bold text-white group-hover:text-white transition-colors text-center">
                        <TextType
                          text={tool.title}
                          typingSpeed={75}
                          showCursor={false}
                          startOnVisible={true}
                          loop={false}
                        />
                      </div>
                    </div>

                    <div className="text-gray-300 mb-6 leading-relaxed text-center">
                      <TextType
                        text={tool.description}
                        typingSpeed={0}
                        showCursor={false}
                        startOnVisible={true}
                        loop={false}
                        initialDelay={0}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6 justify-center">
                      {tool.features.map((feature, featureIndex) => (
                        <span
                          key={`${tool.page}-feature-${featureIndex}`}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-white border border-cyan-500/30"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center text-white group-hover:text-cyan-300 justify-center">
                      <span className="font-medium">Try it now</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </Link>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              {
                title: "Lightning fast",
                description:
                  "Files are processed in seconds using optimized pipelines designed for low latency.",
                features: [
                  "Instant processing",
                  "Cloud execution",
                  "No queueing",
                  "Live status updates",
                ],
              },
              {
                title: "Secure by default",
                description:
                  "Files are handled ephemerally and never stored longer than required for processing.",
                features: [
                  "End-to-end encryption",
                  "No persistent storage",
                  "GDPR-aligned handling",
                  "Privacy-first design",
                ],
              },
              {
                title: "Professional output",
                description:
                  "Results match professional desktop software with consistent, repeatable quality.",
                features: [
                  "High-quality output",
                  "Lossless conversion",
                  "Advanced algorithms",
                  "Batch processing",
                ],
              },
            ].map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="
        group h-full
        rounded-xl
        border border-neutral-800
        p-6
        transition-colors
        hover:border-neutral-600
      "
              >
                {/* top rule */}
                <div className="mb-4 h-px w-10 bg-neutral-700 group-hover:bg-neutral-500 transition-colors mx-auto md:mx-0" />

                <div className="text-lg font-medium text-white tracking-tight text-center md:text-left">
                  <TextType
                    text={feature.title}
                    typingSpeed={75}
                    showCursor={false}
                    startOnVisible={true}
                    loop={false}
                  />
                </div>

                <div className="mt-3 text-sm leading-relaxed text-white text-center md:text-left">
                  <TextType
                    text={feature.description}
                    typingSpeed={0}
                    showCursor={false}
                    startOnVisible={true}
                    loop={false}
                    initialDelay={0}
                  />
                </div>

                <ul className="mt-6 space-y-2 text-sm text-white">
                  {feature.features.map((item) => (
                    <li
                      key={item}
                      className="flex items-center justify-center md:justify-start gap-2"
                    >
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-neutral-600 flex-shrink-0" />
                      <span className="text-center md:text-left">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
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
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {[
              {
                title: "PDF Processing APIs",
                description:
                  "Programmatic PDF manipulation including OCR, text extraction, form handling, and document analysis.",
                features: [
                  "PDF to text with OCR",
                  "Form field detection and filling",
                  "Document structure analysis",
                  "Batch PDF processing",
                  "Advanced text extraction",
                  "Metadata extraction",
                ],
                action: {
                  label: "View API documentation",
                  onClick: () => window.open("/api-docs", "_blank"),
                },
                motion: { x: -20 },
              },
              {
                title: "Media Conversion APIs",
                description:
                  "High-performance media processing with support for modern formats and configurable compression.",
                features: [
                  "Video format conversion",
                  "Audio processing and compression",
                  "Image optimization and resizing",
                  "Real-time processing",
                  "Custom quality settings",
                  "Batch media processing",
                ],
                action: {
                  label: "Request API access",
                  onClick: () => window.open("/auth/register", "_self"),
                },
                motion: { x: 20 },
              },
            ].map((api, index) => (
              <motion.article
                key={api.title}
                initial={{ opacity: 0, ...api.motion }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="
        group h-full
        rounded-xl
        border border-neutral-800
        p-6
        transition-colors
        hover:border-neutral-600
      "
              >
                {/* top rule */}
                <div className="mb-4 h-px w-12 bg-neutral-700 group-hover:bg-neutral-500 transition-colors mx-auto md:mx-0" />

                <h3 className="text-lg font-medium text-white tracking-tight text-center md:text-left">
                  {api.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-white text-center md:text-left">
                  {api.description}
                </p>

                <ul className="mt-6 space-y-2 text-sm text-white">
                  {api.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center justify-center md:justify-start gap-2"
                    >
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-neutral-600 flex-shrink-0" />
                      <span className="text-center md:text-left">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* footer action */}
                <button
                  onClick={api.action.onClick}
                  className="
          mt-6 flex w-full items-center justify-center md:justify-between
          border-t border-neutral-800 pt-4
          text-sm text-white
          transition-colors
          hover:text-neutral-200
        "
                >
                  <span>{api.action.label}</span>
                  <span className="text-white">→</span>
                </button>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
