"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, FileText, QrCode, Image, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigation } from "@/contexts/NavigationContext";
import SplitText from "@/components/SplitText";
import DecryptedText from "@/components/DecryptedText";
import TextType from "@/components/TextType";

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
    const timer = setTimeout(() => setIsInitialMount(false), 500);
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
      <div className="min-h-screen relative overflow-hidden page-content bg-[#111827]">
        {/* Background Image Layer - Hidden on mobile */}
        <div
          className="absolute inset-0 opacity-30 hidden md:block"
          style={{
            background: 'url("/platform-hero-bg.png") no-repeat center top',
            backgroundSize: "contain",
            backgroundPosition: "center -50px",
          }}
        ></div>
        {/* Background elements removed - no gradients */}

        {/* Hero Section */}
        <main className="relative z-20 px-6 lg:px-12 pt-12 sm:pt-16 lg:pt-24 pb-32">
          <div className="max-w-6xl mx-auto text-center">
            {/* Hero Text Container - CSS animations for faster initial paint */}
            <div className="relative mb-12">
              {/* Main Headline */}
              <h1 className="text-4xl lg:text-6xl font-bold mb-8 leading-tight mt-4 sm:mt-8 lg:mt-14">
                <DecryptedText
                  text="The only file conversion that works where you work"
                  animateOn="view"
                  revealDirection="center"
                  speed={30}
                  maxIterations={15}
                  className="text-white"
                  encryptedClassName="text-gray-400"
                />
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                <DecryptedText
                  text="Transform your media files with our intelligent conversion system. From video to audio, PDF merging to QR generation, manage everything in one place."
                  animateOn="view"
                  revealDirection="start"
                  speed={60}
                  maxIterations={12}
                  viewDelay={600}
                  className="text-gray-400"
                  encryptedClassName="text-gray-600"
                />
              </p>
            </div>

            {/* Stacked Cards */}
            <div className="max-w-2xl mx-auto px-4 sm:px-0">
              <div className="relative h-80 flex flex-col items-center">
                {cardOrder.map((card, index) => {
                  const IconComponent = card.icon;
                  return (
                    <motion.div
                      key={card.text}
                      initial={
                        isInitialMount
                          ? { opacity: 0.9, y: 10 }
                          : { opacity: 1, y: 0 }
                      }
                      animate={{
                        opacity: 1,
                        y: 0,
                        width: `${Math.max(85, 100 - index * 10)}%`,
                        height: `${80 - index * 12}px`,
                        top: `${index * 8}%`,
                      }}
                      transition={{
                        duration: isInitialMount ? 0.2 : 0.4,
                        delay: isInitialMount ? 0.05 + index * 0.03 : 0,
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
                        <DecryptedText
                          text={card.text}
                          animateOn="view"
                          revealDirection="center"
                          speed={25}
                          maxIterations={8}
                          className="text-xs sm:text-sm opacity-90 leading-tight break-words"
                          encryptedClassName="text-gray-500 opacity-60"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-[-120px] flex flex-row items-center justify-center space-x-2 sm:space-x-6 relative z-50">
              {/* Primary Button */}
              <Link
                href="/tools"
                className="bg-white/10 backdrop-blur-xl text-white hover:text-gray-900 font-bold px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-lg 
               transition-all duration-200 flex items-center 
               space-x-1 sm:space-x-2 group text-xs sm:text-sm
               hover:bg-neutral-200 hover:scale-[1.03] active:scale-95 relative z-50"
                title="Free PDF Editor Tools"
              >
                <span>Start Converting</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1 text-[#ec4899]" />
              </Link>

              {/* Secondary Button */}
              <Link
                href="/api-docs"
                className="bg-white text-gray-900 font-bold px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-lg 
               border border-black/20 hover:border-black/40 
               transition-all duration-200 text-xs sm:text-sm
               hover:bg-neutral-200 hover:scale-[1.03] active:scale-95 relative z-50"
                title="PDF Processing API Documentation"
              >
                API Docs
              </Link>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section
          id="features"
          className="relative z-10 px-6 lg:px-12 py-20 mt-[-100px] bg-gray-900"
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <SplitText
                text="Everything you need to convert files"
                tag="h2"
                className="text-4xl font-bold text-white mb-4"
                delay={30}
                duration={0.1}
              />
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                <SplitText
                  text="Edit PDFs, merge documents, convert videos to MP3, transform images, generate QR codes, and more. All processing happens instantly in your browser with no software installation required."
                  delay={10}
                  duration={0.1}
                />
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 pt-8">
              {[
                {
                  title: "Video Processing",
                  description:
                    "Convert videos to MP3 audio and generate animated GIFs with precise control over quality, compression, and output formats for optimal results.",
                  href: "/tools/video-converter",
                },
                {
                  title: "Document Management",
                  description:
                    "Merge, split, sign, and prepare PDFs for real-world use cases including sharing, printing, archiving, and professional document workflows.",
                  href: "/tools/pdf-tools",
                },
                {
                  title: "Image Conversion",
                  description:
                    "Convert images across all popular formats while preserving sharpness, color accuracy, metadata, and image quality throughout the process.",
                  href: "/tools/image-converter",
                },
              ].map((feature, index) => (
                <Link key={feature.title} href={feature.href}>
                  <motion.article
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.12,
                      ease: "easeOut",
                    }}
                    viewport={{ once: true }}
                    whileHover={{ y: -4 }}
                    className="
          group relative h-full
          rounded-xl border border-white/10
          p-6
          transition-all duration-200
          hover:border-white/25
        "
                  >
                    {/* subtle top rule */}
                    <div className="mb-4 h-px w-10 bg-white/20 group-hover:bg-white/40 transition-colors mx-auto md:mx-0" />

                    <div className="text-xl font-medium text-white tracking-tight text-center md:text-left">
                      <TextType
                        text={feature.title}
                        typingSpeed={75}
                        showCursor={false}
                        startOnVisible={true}
                        loop={false}
                      />
                    </div>

                    <div className="mt-3 text-md leading-relaxed text-white text-center md:text-left">
                      <TextType
                        text={feature.description}
                        typingSpeed={10}
                        showCursor={false}
                        startOnVisible={true}
                        loop={false}
                        initialDelay={200}
                      />
                    </div>

                    {/* affordance */}
                    <div className="mt-6 text-sm text-white group-hover:text-neutral-300 transition-colors text-center md:text-left">
                      Open tool →
                    </div>
                  </motion.article>
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
        {/* <section className="relative z-10 px-6 lg:px-12 py-20"></section> */}

        {/* Powerful Tools CTA Section */}
        <section className="py-24 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gray-900"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gray-700/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-700/10 rounded-full blur-3xl"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <SplitText
                text="Powerful Tools for Every Need"
                tag="h2"
                className="text-2xl lg:text-3xl font-bold text-white mb-6"
                delay={50}
                duration={0.1}
              />
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                <SplitText
                  text="From PDF editing to video conversion, our comprehensive toolkit handles all your file processing needs with professional-grade quality. Edit PDFs online for free, merge PDF files, and convert videos - all in your browser."
                  delay={10}
                  duration={0.1}
                />
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {[
                {
                  title: "PDF Powerhouse",
                  description:
                    "Edit, split, merge, and convert PDFs with real-time processing.",
                  features: [
                    "Free PDF Editor",
                    "Split & Merge",
                    "Add Watermarks",
                    "Digital Signatures",
                  ],
                  href: "/tools/pdf-tools",
                },
                {
                  title: "Media Converter",
                  description:
                    "Convert videos, audio, and images between formats with precise quality control.",
                  features: [
                    "All Video Formats",
                    "Audio Conversion",
                    "Image Processing",
                    "Quality Control",
                  ],
                  href: "/tools/video-converter",
                },
                {
                  title: "Smart Tools",
                  description:
                    "Generate QR codes, extract text with OCR, and automate workflows.",
                  features: [
                    "QR Generator",
                    "OCR Text Extraction",
                    "Batch Processing",
                    "API Integration",
                  ],
                  href: "/tools/qr-generator",
                },
              ].map((tool, index) => (
                <Link key={tool.title} href={tool.href}>
                  <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -3 }}
                    className="
          group h-full
          rounded-xl
          border border-neutral-800
          p-6
          transition-colors duration-200
          hover:border-neutral-600
        "
                  >
                    {/* top rule */}
                    <div className="mb-4 h-px w-12 bg-neutral-700 group-hover:bg-neutral-500 transition-colors mx-auto md:mx-0" />

                    <div className="text-xl font-medium text-white tracking-tight text-center md:text-left">
                      <TextType
                        text={tool.title}
                        typingSpeed={75}
                        showCursor={false}
                        startOnVisible={true}
                        loop={false}
                      />
                    </div>

                    <div className="mt-3 text-md leading-relaxed text-white text-center md:text-left">
                      <TextType
                        text={tool.description}
                        typingSpeed={50}
                        showCursor={false}
                        startOnVisible={true}
                        loop={false}
                        initialDelay={200}
                      />
                    </div>

                    <ul className="mt-6 space-y-2 text-sm text-white">
                      {tool.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center justify-center md:justify-start gap-2"
                        >
                          <span className="mt-[6px] block h-1.5 w-1.5 rounded-full bg-neutral-600 flex-shrink-0" />
                          <span className="text-center md:text-left">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 text-xs text-white group-hover:text-neutral-300 transition-colors text-center md:text-left">
                      Open tool →
                    </div>
                  </motion.article>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Developer APIs CTA Section */}
        <section className="relative overflow-hidden bg-[#111827]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <SplitText
                text="Developer APIs for Powerful Computing"
                tag="h2"
                className="text-2xl lg:text-3xl font-bold text-white mb-6"
                delay={50}
                duration={0.1}
              />
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                <SplitText
                  text="Integrate our advanced file processing capabilities into your applications with our comprehensive API suite. Built for developers, by developers."
                  delay={10}
                  duration={0.1}
                />
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {[
                {
                  title: "PDF Processing APIs",
                  description:
                    "Programmatic PDF manipulation including OCR, text extraction, form handling, and document analysis.",
                  features: [
                    "PDF to Text with OCR",
                    "Form Field Detection and Filling",
                    "Document Structure Analysis",
                    "Batch PDF Processing",
                    "Advanced Text Extraction",
                    "Metadata Extraction",
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
                    "Video Format Conversion",
                    "Audio Processing and Compression",
                    "Image Optimization and Resizing",
                    "Real-time Processing",
                    "Custom Quality Settings",
                    "Batch Media Processing",
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

                  <div className="text-xl font-medium text-white tracking-tight text-center md:text-left">
                    <TextType
                      text={api.title}
                      typingSpeed={75}
                      showCursor={false}
                      startOnVisible={true}
                      loop={false}
                    />
                  </div>

                  <div className="mt-3 text-md leading-relaxed text-white text-center md:text-left">
                    <TextType
                      text={api.description}
                      typingSpeed={50}
                      showCursor={false}
                      startOnVisible={true}
                      loop={false}
                      initialDelay={200}
                    />
                  </div>

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
    </>
  );
}
