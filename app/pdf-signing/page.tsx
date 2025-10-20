import { Metadata } from "next";
import { motion } from "framer-motion";
import { PenTool, Shield, Zap, CheckCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign PDF Online Free - Digital PDF Signatures | Trevnoctilla",
  description:
    "Sign PDF documents online for free. Add digital signatures, initials, and stamps to PDFs instantly. Secure PDF signing with legal validity.",
  keywords: [
    "sign PDF online",
    "PDF signature",
    "digital signature PDF",
    "sign PDF free",
    "PDF signing tool",
    "electronic signature",
    "PDF signer",
    "document signing",
  ],
};

export default function PDFSigningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Sign PDF Online Free
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Add digital signatures to your PDF documents instantly. Draw, type,
            or upload your signature for secure and legally valid document
            signing.
          </p>
          <Link
            href="/pdf-tools"
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 inline-block"
          >
            Sign PDF Documents Now
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <PenTool className="w-12 h-12 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Draw Signature
            </h3>
            <p className="text-gray-300">
              Use your mouse, touchpad, or stylus to draw your signature
              directly on the PDF document.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <CheckCircle className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Type Signature
            </h3>
            <p className="text-gray-300">
              Type your name and choose from multiple signature fonts for a
              professional look.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <Shield className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Upload Signature
            </h3>
            <p className="text-gray-300">
              Upload an image of your signature for the most authentic and
              personalized signing experience.
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
            Secure PDF Signing Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-3" />
                  <span>Legally valid digital signatures</span>
                </li>
                <li className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-400 mr-3" />
                  <span>Instant processing and download</span>
                </li>
                <li className="flex items-center">
                  <PenTool className="w-5 h-5 text-purple-400 mr-3" />
                  <span>Multiple signature styles</span>
                </li>
              </ul>
            </div>
            <div className="text-left">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-yellow-400 mr-3" />
                  <span>Position signatures anywhere</span>
                </li>
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-3" />
                  <span>Bank-level security</span>
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
