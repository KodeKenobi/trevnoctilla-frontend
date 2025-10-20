import { Metadata } from "next";
import { motion } from "framer-motion";
import { Eye, FileText, Zap, Shield } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "OCR Text Extraction - Extract Text from PDF Images | Trevnoctilla",
  description:
    "Extract text from PDF images and scanned documents using advanced OCR technology. Convert image text to editable text instantly with high accuracy.",
  keywords: [
    "OCR text extraction",
    "PDF OCR",
    "text recognition",
    "extract text from image",
    "scanned document OCR",
    "image to text",
    "OCR online",
    "text extraction tool",
  ],
};

export default function OCRTextExtractionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            OCR Text Extraction
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Extract text from PDF images and scanned documents using advanced OCR
            technology. Convert image text to editable text instantly with high
            accuracy.
          </p>
          <Link
            href="/pdf-tools"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 inline-block"
          >
            Extract Text from Images Now
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <Eye className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Advanced OCR Technology
            </h3>
            <p className="text-gray-300">
              State-of-the-art optical character recognition that accurately
              reads text from images, scanned documents, and PDF files.
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
              Multiple Formats
            </h3>
            <p className="text-gray-300">
              Extract text from PDFs, images, scanned documents, and photos.
              Supports JPG, PNG, PDF, and more formats.
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
              Instant Results
            </h3>
            <p className="text-gray-300">
              Get your extracted text in seconds. Download as TXT, DOC, or copy
              to clipboard for immediate use.
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
            Why Choose Our OCR Tool?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-3" />
                  <span>High accuracy text recognition</span>
                </li>
                <li className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-400 mr-3" />
                  <span>Supports multiple languages</span>
                </li>
                <li className="flex items-center">
                  <FileText className="w-5 h-5 text-purple-400 mr-3" />
                  <span>Batch processing available</span>
                </li>
              </ul>
            </div>
            <div className="text-left">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <Eye className="w-5 h-5 text-yellow-400 mr-3" />
                  <span>Handles handwritten text</span>
                </li>
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-3" />
                  <span>Secure file processing</span>
                </li>
                <li className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-400 mr-3" />
                  <span>No registration required</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
