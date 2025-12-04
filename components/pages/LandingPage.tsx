"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, FileText, QrCode, Image, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigation } from "@/contexts/NavigationContext";

export default function LandingPage() {
  const { navigateTo } = useNavigation();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [cardOrder, setCardOrder] = useState([
    { text: "Convert videos to high-quality MP3 audio", icon: Play },
    { text: "Create animated GIFs from video content", icon: ArrowRight },
    { text: "Merge multiple PDF files seamlessly", icon: FileText },
    { text: "Generate custom QR codes instantly", icon: QrCode },
    { text: "Convert images between formats", icon: Image },
  ]);
  const [isInitialMount, setIsInitialMount] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialMount(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCardOrder((prev) => {
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background/95 to-background dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 page-content">
        {/* Background Image Layer - Temporarily disabled */}
        {/* <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'url("/platform-hero-bg.png") no-repeat center top',
            backgroundSize: "contain",
            backgroundPosition: "center -50px",
          }}
        ></div> */}
        {/* Background glow orbs - CSS animations for better performance */}
        <div className="absolute w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[150px] top-[-200px] left-[-200px] animate-fade-in"></div>
        <div
          className="absolute w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[120px] top-[-100px] right-[-100px] animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="absolute w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] bottom-[-100px] left-1/2 transform -translate-x-1/2 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="absolute w-[300px] h-[300px] bg-orange-500/15 rounded-full blur-[80px] top-1/2 right-1/4 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        ></div>

        {/* Hero Section */}
        <main className="relative z-20 px-6 lg:px-12 pt-12 sm:pt-16 lg:pt-24 pb-32">
          <div className="max-w-6xl mx-auto text-center">
            {/* Hero Text Container - CSS animations for faster initial paint */}
            <div className="relative mb-12 animate-slide-up">
              {/* Main Headline */}
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground dark:text-white mb-8 leading-tight mt-4 sm:mt-8 lg:mt-14">
                The only file conversion that{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  works where you work
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="text-xl text-muted-foreground dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in"
                style={{ animationDelay: "0.1s" }}
              >
                Transform your media files with our intelligent conversion
                system. From video to audio, PDF merging to QR generation,
                manage everything in one place.
              </p>
            </div>

            {/* Stacked Cards */}
            <div
              className="max-w-2xl mx-auto px-4 sm:px-0 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="relative h-80 flex flex-col items-center">
                {cardOrder.map((card, index) => {
                  const IconComponent = card.icon;
                  return (
                    <motion.div
                      key={card.text}
                      initial={isInitialMount ? { opacity: 0, y: 20 } : false}
                      animate={{
                        opacity: 1,
                        y: 0,
                        width: `${Math.max(85, 100 - index * 10)}%`,
                        height: `${80 - index * 12}px`,
                        top: `${index * 8}%`,
                      }}
                      transition={{
                        duration: isInitialMount ? 0.6 : 0.4,
                        delay: isInitialMount ? 1 + index * 0.1 : 0,
                        ease: "easeInOut",
                      }}
                      whileHover={{
                        scale: 1.02,
                        y: -2,
                        transition: { duration: 0.2 },
                      }}
                      className="absolute bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white transition-all duration-300 hover:bg-white/20 hover:border-white/40"
                      style={{
                        zIndex: 5 - index,
                        padding: `${16 - index * 2}px 20px`,
                      }}
                    >
                      <div className="flex items-center justify-center h-full text-center px-2">
                        <IconComponent className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                        <span className="text-xs sm:text-sm opacity-90 leading-tight break-words">
                          {card.text}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* CTA Buttons */}
            <div
              className="mt-[-120px] flex flex-row items-center justify-center space-x-2 sm:space-x-6 relative z-50 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <Link
                href="/tools"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-1 sm:space-x-2 group text-sm sm:text-base hover:scale-105 active:scale-95 relative z-50"
                title="Free PDF Editor Tools"
              >
                <span>Start Converting</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/api-docs"
                className="text-gray-300 hover:text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-200 text-sm sm:text-base hover:scale-105 active:scale-95 relative z-50"
                title="PDF Processing API Documentation"
              >
                API Docs
              </Link>
            </div>

            {/* Ezoic Ad Placement - Above Features */}
            <div id="ezoic-pub-ad-placeholder-101"></div>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if (typeof ezstandalone !== 'undefined') {
                    ezstandalone.cmd.push(function () {
                      ezstandalone.showAds(101);
                    });
                  }
                `,
              }}
            />
          </div>
        </main>

        {/* Features Section */}
        <section
          id="features"
          className="relative z-10 px-6 lg:px-12 py-20 mt-[-100px]"
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Everything you need to convert files
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                From simple file conversion to complex media processing,
                Trevnoctilla has you covered with powerful features. Use our{" "}
                <Link
                  href="/tools/pdf-tools"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  free PDF editor
                </Link>{" "}
                to{" "}
                <Link
                  href="/tools/pdf-tools"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  merge PDF files
                </Link>
                ,{" "}
                <Link
                  href="/tools/video-converter"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  convert videos to MP3
                </Link>
                , and{" "}
                <Link
                  href="/tools/image-converter"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  convert images
                </Link>{" "}
                - all in your browser.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 pt-8">
              {[
                {
                  icon: Play,
                  title: "Video Processing",
                  description:
                    "Convert videos to MP3 audio and create animated GIFs with high quality output.",
                  color: "from-green-500 to-emerald-500",
                  href: "/tools/video-converter",
                },
                {
                  icon: FileText,
                  title: "Document Management",
                  description:
                    "Merge PDF files seamlessly and generate custom QR codes for any content.",
                  color: "from-blue-500 to-cyan-500",
                  href: "/tools/pdf-tools",
                },
                {
                  icon: Image,
                  title: "Image Conversion",
                  description:
                    "Convert images between different formats with quality preservation.",
                  color: "from-purple-500 to-pink-500",
                  href: "/tools/image-converter",
                },
              ].map((feature, index) => (
                <Link
                  key={`feature-${index}`}
                  href={feature.href}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.9, rotateY: -15 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.2,
                      type: "spring",
                      stiffness: 100,
                    }}
                    viewport={{ once: true }}
                    whileHover={{
                      y: -10,
                      scale: 1.02,
                      rotateY: 5,
                      transition: { duration: 0.3 },
                    }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 text-center md:text-left cursor-pointer"
                  >
                    <motion.div
                      className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0`}
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: index * 0.2 + 0.3,
                        type: "spring",
                        stiffness: 200,
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <motion.h3
                      className="text-xl font-semibold text-white mb-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 + 0.4 }}
                    >
                      {feature.title}
                    </motion.h3>
                    <motion.p
                      className="text-gray-400 leading-relaxed"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 + 0.5 }}
                    >
                      {feature.description}
                    </motion.p>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Ezoic Ad Placement - Between Features and Stats */}
            <div id="ezoic-pub-ad-placeholder-102"></div>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if (typeof ezstandalone !== 'undefined') {
                    ezstandalone.cmd.push(function () {
                      ezstandalone.showAds(102);
                    });
                  }
                `,
              }}
            />
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative z-10 px-6 lg:px-12 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-8 text-center">
              {[
                { number: "5+", label: "File Types" },
                { number: "∞", label: "Unlimited Conversions" },
                { number: "24/7", label: "Access" },
              ].map((stat, index) => (
                <motion.div
                  key={`stat-${index}`}
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.2,
                    type: "spring",
                    stiffness: 100,
                  }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.div
                    className="text-4xl font-bold text-white mb-2"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.2 + 0.3,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    {stat.number}
                  </motion.div>
                  <motion.div
                    className="text-gray-400"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 + 0.4 }}
                  >
                    {stat.label}
                  </motion.div>
                </motion.div>
              ))}
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
                Powerful Tools for Every Need
              </h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                From{" "}
                <Link
                  href="/tools/pdf-tools"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  PDF editing
                </Link>{" "}
                to{" "}
                <Link
                  href="/tools/video-converter"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  video conversion
                </Link>
                , our comprehensive toolkit handles all your file processing
                needs with professional-grade quality.{" "}
                <Link
                  href="/tools/pdf-tools"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Edit PDFs online for free
                </Link>
                ,{" "}
                <Link
                  href="/tools/pdf-tools"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  merge PDF files
                </Link>
                , and{" "}
                <Link
                  href="/tools/video-converter"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  convert videos
                </Link>{" "}
                - all in your browser.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {[
                {
                  title: "PDF Powerhouse",
                  description:
                    "Edit, split, merge, and convert PDFs with precision. Add watermarks, signatures, and more. All tools work in your browser with no download required.",
                  features: [
                    "Free PDF Editor",
                    "Split & Merge",
                    "Add Watermarks",
                    "Digital Signatures",
                  ],
                  gradient: "from-red-500 to-pink-500",
                  href: "/tools/pdf-tools",
                },
                {
                  title: "Media Converter",
                  description:
                    "Convert videos, audio, and images between any format with advanced quality control.",
                  features: [
                    "All Video Formats",
                    "Audio Conversion",
                    "Image Processing",
                    "Quality Control",
                  ],
                  gradient: "from-green-500 to-cyan-500",
                  href: "/tools/video-converter",
                },
                {
                  title: "Smart Tools",
                  description:
                    "Generate QR codes, extract text with OCR, and automate your workflow.",
                  features: [
                    "QR Generator",
                    "OCR Text Extraction",
                    "Batch Processing",
                    "API Integration",
                  ],
                  gradient: "from-blue-500 to-purple-500",
                  href: "/tools/qr-generator",
                },
              ].map((tool, index) => (
                <Link key={tool.title} href={tool.href} className="block">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 text-center md:text-left cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${tool.gradient} rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0`}
                    >
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {tool.title}
                    </h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {tool.description}
                    </p>
                    <ul className="space-y-2">
                      {tool.features.map((feature, idx) => (
                        <li
                          key={`${tool.title}-feature-${idx}`}
                          className="flex items-center text-gray-400 justify-center md:justify-start"
                        >
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </Link>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <motion.button
                onClick={() => navigateTo("tools")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore All Tools
              </motion.button>
            </motion.div>
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
                      key={`pdf-feature-${idx}`}
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
    </>
  );
}
