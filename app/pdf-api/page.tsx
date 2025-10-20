import { Metadata } from "next";
import { motion } from "framer-motion";
import { Code, Zap, Shield, FileText } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PDF API - File Processing API Documentation | Trevnoctilla",
  description:
    "Powerful PDF API for developers. Convert, edit, merge, split PDFs programmatically. RESTful API with comprehensive documentation and examples.",
  keywords: [
    "PDF API",
    "file conversion API",
    "PDF processing API",
    "document API",
    "PDF merge API",
    "PDF split API",
    "OCR API",
    "file converter API",
  ],
};

export default function PDFAPIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            PDF API Documentation
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Powerful PDF API for developers. Convert, edit, merge, split PDFs
            programmatically with our RESTful API and comprehensive
            documentation.
          </p>
          <Link
            href="/api-docs"
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 inline-block"
          >
            View API Documentation
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <Code className="w-12 h-12 text-indigo-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">
              RESTful API
            </h3>
            <p className="text-gray-300">
              Clean REST API endpoints with JSON responses. Easy integration
              with any programming language or framework.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <FileText className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">
              PDF Processing
            </h3>
            <p className="text-gray-300">
              Merge, split, compress, watermark, and extract text from PDFs
              programmatically with high accuracy.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <Zap className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">
              File Conversion
            </h3>
            <p className="text-gray-300">
              Convert videos, audio, images, and documents between formats with
              quality control and batch processing.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-6">
            API Features & Benefits
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-3" />
                  <span>Secure API authentication</span>
                </li>
                <li className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-400 mr-3" />
                  <span>High processing speed</span>
                </li>
                <li className="flex items-center">
                  <FileText className="w-5 h-5 text-purple-400 mr-3" />
                  <span>Comprehensive documentation</span>
                </li>
              </ul>
            </div>
            <div className="text-left">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <Code className="w-5 h-5 text-yellow-400 mr-3" />
                  <span>Code examples in multiple languages</span>
                </li>
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-3" />
                  <span>99.9% uptime guarantee</span>
                </li>
                <li className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-400 mr-3" />
                  <span>Scalable infrastructure</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
