import { Metadata } from "next";
import { motion } from "framer-motion";
import { RefreshCw, Zap, Shield, FileText } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "File Converter Online - Convert Videos, Audio, Images | Trevnoctilla",
  description:
    "Convert files between all major formats online. Video, audio, image, and document conversion with high quality and fast processing. Free file converter.",
  keywords: [
    "file converter",
    "video converter",
    "audio converter",
    "image converter",
    "convert files online",
    "file conversion",
    "format converter",
    "online converter",
  ],
};

export default function FileConverterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            File Converter Online
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Convert files between all major formats online. Video, audio, image,
            and document conversion with high quality and fast processing.
          </p>
          <Link
            href="/tools"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 inline-block"
          >
            Start Converting Files
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <RefreshCw className="w-12 h-12 text-orange-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Video Conversion
            </h3>
            <p className="text-gray-300">
              Convert videos between MP4, AVI, MOV, MKV, WEBM and more formats
              with quality control and compression options.
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
              Audio Conversion
            </h3>
            <p className="text-gray-300">
              Convert audio files between MP3, WAV, AAC, FLAC, OGG and other
              formats with bitrate control.
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
              Image Conversion
            </h3>
            <p className="text-gray-300">
              Convert images between JPG, PNG, GIF, BMP, TIFF, WEBP formats with
              quality and size optimization.
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
            Why Choose Our File Converter?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-3" />
                  <span>High-quality conversion</span>
                </li>
                <li className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-400 mr-3" />
                  <span>Fast processing speed</span>
                </li>
                <li className="flex items-center">
                  <FileText className="w-5 h-5 text-purple-400 mr-3" />
                  <span>Batch conversion support</span>
                </li>
              </ul>
            </div>
            <div className="text-left">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <RefreshCw className="w-5 h-5 text-yellow-400 mr-3" />
                  <span>All major formats supported</span>
                </li>
                <li className="flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-3" />
                  <span>Secure file processing</span>
                </li>
                <li className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-400 mr-3" />
                  <span>No software installation</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
