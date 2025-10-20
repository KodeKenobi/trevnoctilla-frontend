import { Metadata } from "next";
import { motion } from "framer-motion";
import { FileText, PenTool, Shield, Zap } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free PDF Editor Online - Edit PDFs Instantly | Trevnoctilla",
  description:
    "Free online PDF editor to edit, merge, split, and modify PDFs instantly. No registration required. Professional PDF editing tools with advanced features.",
  keywords: [
    "PDF editor",
    "edit PDF online",
    "free PDF editor",
    "PDF editing tools",
    "modify PDF",
    "PDF modification",
    "online PDF editor",
    "PDF editor free",
  ],
};

export default function PDFEditorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Free PDF Editor Online
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Edit, modify, and customize your PDFs instantly with our powerful
            online PDF editor. No software installation required - start editing
            PDFs in your browser right now.
          </p>
          <Link
            href="/pdf-tools"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 inline-block"
          >
            Start Editing PDFs Free
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <FileText className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Edit Text & Images
            </h3>
            <p className="text-gray-300">
              Modify text content, replace images, and update formatting in your
              PDF documents with precision.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <PenTool className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Add Annotations
            </h3>
            <p className="text-gray-300">
              Add comments, highlights, shapes, and annotations to make your
              PDFs more interactive and informative.
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
              Instant Processing
            </h3>
            <p className="text-gray-300">
              Fast and secure PDF editing with real-time preview. Your files are
              processed instantly in the cloud.
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
            Why Choose Our PDF Editor?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-3" />
                  <span>100% Secure - Files deleted after processing</span>
                </li>
                <li className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-400 mr-3" />
                  <span>No registration required</span>
                </li>
                <li className="flex items-center">
                  <FileText className="w-5 h-5 text-purple-400 mr-3" />
                  <span>Works with all PDF versions</span>
                </li>
              </ul>
            </div>
            <div className="text-left">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <PenTool className="w-5 h-5 text-yellow-400 mr-3" />
                  <span>Professional editing tools</span>
                </li>
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-3" />
                  <span>High-quality output</span>
                </li>
                <li className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-400 mr-3" />
                  <span>Mobile-friendly interface</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
