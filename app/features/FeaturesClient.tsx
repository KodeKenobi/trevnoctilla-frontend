"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  Merge,
  Split,
  PenTool,
  Video,
  Music,
  Image,
  QrCode,
  Zap,
  Shield,
  Globe,
  Download,
  Cloud,
  Lock,
  Smartphone,
  Monitor,
  Clock,
  Settings,
  FileCheck,
  Layers,
  Maximize,
  Eye,
  Type,
  Stamp,
  ArrowRight,
} from "lucide-react";

const pdfFeatures = [
  {
    icon: FileText,
    title: "PDF Editor",
    description: "Edit PDF files directly in your browser. Add text, images, shapes, and annotations without any software installation.",
    keywords: "edit pdf online, pdf editor free, modify pdf",
  },
  {
    icon: Merge,
    title: "Merge PDFs",
    description: "Combine multiple PDF files into a single document. Arrange pages in any order before merging.",
    keywords: "merge pdf, combine pdf files, join pdfs",
  },
  {
    icon: Split,
    title: "Split PDF",
    description: "Split large PDF documents into smaller files. Extract specific pages or split by page ranges.",
    keywords: "split pdf, extract pages, separate pdf",
  },
  {
    icon: PenTool,
    title: "Digital Signatures",
    description: "Add legally binding digital signatures to your PDF documents. Draw, type, or upload your signature.",
    keywords: "sign pdf online, digital signature, e-signature",
  },
  {
    icon: Maximize,
    title: "Compress PDF",
    description: "Reduce PDF file size while maintaining quality. Perfect for email attachments and web uploads.",
    keywords: "compress pdf, reduce pdf size, shrink pdf",
  },
  {
    icon: Stamp,
    title: "Watermark",
    description: "Add text or image watermarks to protect your PDF documents. Customize position, opacity, and rotation.",
    keywords: "pdf watermark, add watermark, protect pdf",
  },
  {
    icon: Eye,
    title: "OCR Text Extraction",
    description: "Extract text from scanned documents and images using advanced OCR technology.",
    keywords: "ocr pdf, extract text, scan to text",
  },
  {
    icon: Type,
    title: "Add Text & Annotations",
    description: "Add text boxes, highlights, underlines, and comments to your PDF documents.",
    keywords: "annotate pdf, add text to pdf, pdf comments",
  },
];

const mediaFeatures = [
  {
    icon: Video,
    title: "Video Converter",
    description: "Convert videos between all major formats: MP4, AVI, MOV, MKV, WebM, FLV, and more. Maintain quality with optimized encoding.",
    keywords: "video converter, convert mp4, change video format",
    href: "/tools/video-converter",
  },
  {
    icon: Music,
    title: "Audio Converter",
    description: "Convert audio files between MP3, WAV, FLAC, AAC, OGG, M4A, and more. Perfect for music and podcast production.",
    keywords: "audio converter, mp3 converter, convert audio",
    href: "/tools/audio-converter",
  },
  {
    icon: Image,
    title: "Image Converter",
    description: "Convert images between JPG, PNG, WebP, GIF, BMP, TIFF, and more. Resize and optimize images for web.",
    keywords: "image converter, jpg to png, convert images",
    href: "/tools/image-converter",
  },
  {
    icon: QrCode,
    title: "QR Code Generator",
    description: "Generate custom QR codes for URLs, text, contact info, WiFi, and more. Download in PNG, SVG, or PDF format.",
    keywords: "qr code generator, create qr code, qr maker",
    href: "/tools/qr-generator",
  },
];

const platformFeatures = [
  {
    icon: Globe,
    title: "100% Browser-Based",
    description: "No software to download or install. All tools work directly in your web browser on any device.",
  },
  {
    icon: Shield,
    title: "Secure Processing",
    description: "Your files are processed securely. We don't store your documents on our servers after processing.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized processing engines deliver results in seconds, not minutes. No waiting around.",
  },
  {
    icon: Lock,
    title: "No Registration Required",
    description: "Start using our tools immediately. No account creation, no email verification, no hassle.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Fully responsive design works perfectly on smartphones, tablets, and desktops.",
  },
  {
    icon: Cloud,
    title: "Cloud Processing",
    description: "Heavy lifting happens in the cloud, so even complex operations work on any device.",
  },
  {
    icon: Download,
    title: "Instant Downloads",
    description: "Processed files are ready for immediate download. No email required, no waiting period.",
  },
  {
    icon: Settings,
    title: "REST API Access",
    description: "Integrate our tools into your workflow with our powerful API. Perfect for developers.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export default function FeaturesClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20">
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
              All Features Included Free
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Complete File Toolkit
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                All Features, Zero Cost
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Edit PDFs, convert videos, audio & images, generate QR codes — all in your browser. 
              No software to install, no registration required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/tools"
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25"
              >
                Try All Tools Free
              </Link>
              <Link
                href="/tools/pdf-tools"
                className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                Start with PDF Editor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PDF Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              PDF Editor Features
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to edit, merge, split, sign, and process PDF documents online.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {pdfFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="group p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl hover:border-cyan-500/50 hover:bg-gray-800/80 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="text-center mt-8">
            <Link
              href="/tools/pdf-tools"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Open PDF Tools <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Media Conversion Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Media Conversion Tools
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Convert videos, audio files, and images between all popular formats with just a few clicks.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {mediaFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="group relative"
                >
                  <Link
                    href={feature.href}
                    className="block p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl hover:border-purple-500/50 hover:bg-gray-800/80 transition-all duration-300 h-full"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Try Now <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose Trevnoctilla?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built for speed, security, and simplicity. Here's what makes our platform stand out.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {platformFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="p-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30 rounded-xl"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-gray-300" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                All tools are free to use. No registration, no credit card, no hidden fees. 
                Just open and start converting.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/tools"
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25"
                >
                  Browse All Tools
                </Link>
                <Link
                  href="/api-docs"
                  className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
                >
                  API Documentation
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

