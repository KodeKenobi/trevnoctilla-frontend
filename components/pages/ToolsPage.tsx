"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  FileText,
  QrCode,
  Image as ImageIcon,
  Zap,
  Layout,
  ArrowRight,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import clsx from "clsx";
import DecryptedText from "@/components/DecryptedText";
import { cn } from "@/lib/utils";
import { ScrollObserver } from "@/components/ScrollObserver";
import React from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ToolsPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-title", {
        opacity: 0,
        y: 100,
        duration: 1.2,
        ease: "power4.out",
      });

      gsap.from(".hero-subtitle", {
        opacity: 0,
        y: 50,
        duration: 1,
        delay: 0.3,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const tools = [
    {
      title: "Campaigns Automation",
      content: "Automate business outreach at scale with AI-powered form filling that saves you hours of work.",
      features: ["Auto Form Fill", "Real-time Tracking", "Visual Proof", "Batch Upload"],
      href: "/campaigns",
      color: "from-purple-500/10 to-indigo-500/10",
      accent: "bg-purple-500",
      icon: <Zap className="w-12 h-12 text-purple-400" />
    },
    {
      title: "PDF Powerhouse",
      content: "Edit, split, merge, and convert PDFs with professional-grade speed and precision.",
      features: ["Free PDF Editor", "Split & Merge", "Add Watermarks", "Digital Signatures"],
      href: "/tools/pdf-tools",
      color: "from-blue-500/10 to-cyan-500/10",
      accent: "bg-blue-500",
      icon: <FileText className="w-12 h-12 text-blue-400" />
    },
    {
      title: "Media Converter",
      content: "Convert videos, audio, and images between formats with precise quality control across all platforms.",
      features: ["All Video Formats", "Audio Conversion", "Image Processing", "Quality Control"],
      href: "/tools/video-converter",
      color: "from-orange-500/10 to-amber-500/10",
      accent: "bg-orange-500",
      icon: <ImageIcon className="w-12 h-12 text-orange-400" />
    },
    {
      title: "Smart Tools",
      content: "Generate QR codes, extract text with OCR, and automate complex workflows instantly.",
      features: ["QR Generator", "OCR Text Extraction", "Batch Processing", "API Integration"],
      href: "/tools/qr-generator",
      color: "from-emerald-500/10 to-teal-500/10",
      accent: "bg-emerald-500",
      icon: <QrCode className="w-12 h-12 text-emerald-400" />
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0d] text-white selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Hero Section - Distinct Color/Style */}
      <section className="min-h-[70vh] flex items-center justify-center relative overflow-hidden px-6 bg-[#111827]">
        <div className="text-center max-w-4xl relative z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-sm mb-8"
          >
            <Zap className="w-4 h-4 fill-cyan-400" />
            <span>Powering 10,000+ conversions daily</span>
          </motion.div>
          
          <h1 className="hero-title text-5xl md:text-8xl font-bold text-white mb-8 tracking-tighter leading-[0.9]">
            Professional Tools <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              For Every File
            </span>
          </h1>
          
          <p className="hero-subtitle text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            <DecryptedText
              text="Transform, convert, and optimize your files with our suite of professional-grade tools. All completely free, secure, and browser-first."
              animateOn="view"
              revealDirection="center"
              speed={30}
              maxIterations={15}
              className="text-gray-400"
              encryptedClassName="text-gray-500"
            />
          </p>

          <div className="flex flex-wrap justify-center gap-4">
             <Link href="/campaigns" className="px-8 py-4 rounded-2xl bg-white text-black font-semibold hover:bg-gray-200 transition-all">
                Start Automating
             </Link>
             <Link href="#tools" className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all">
                Explore Tools
             </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-20 pointer-events-none" />
      </section>

      {/* Scrollytelling Tools Section */}
      <section id="tools" className="py-24 relative z-10 bg-[#0a0a0d]">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollObserver className="relative lg:grid lg:grid-cols-2 gap-32">
            {(isHidden) => (
              <>
                <ScrollObserver.TriggerGroup className="py-[10vh] lg:py-[30vh]">
                  {tools.map((tool, index) => (
                    <ScrollObserver.Trigger 
                      id={`features-${index}`} 
                      key={index} 
                      className="relative scroll-mt-[30vh] md:scroll-mt-[50vh] mb-[40vh] lg:mb-[60vh]"
                      index={index}
                    >
                      {(isActive) => (
                        <div
                          className={clsx(
                            isActive ? "opacity-100 translate-x-0" : "opacity-20 -translate-x-4",
                            "relative transition-all duration-700 ease-out py-8"
                          )}
                        >
                          <div className="flex items-center gap-4 mb-6">
                             <div className={cn("p-3 rounded-xl bg-white/5 border border-white/10", isActive && "border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]")}>
                                {tool.icon}
                             </div>
                             <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                          </div>

                          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                            {tool.title}
                          </h2>

                          <p className="text-xl text-gray-400 mb-8 max-w-lg leading-relaxed">
                            {tool.content}
                          </p>

                          <div className="flex flex-wrap gap-3 mb-10">
                            {tool.features.map(f => (
                              <span key={f} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
                                {f}
                              </span>
                            ))}
                          </div>

                          <Link 
                            href={tool.href}
                            className="inline-flex items-center gap-2 text-cyan-400 group hover:text-cyan-300 transition-colors font-semibold text-lg"
                          >
                            Open this tool
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </div>
                      )}
                    </ScrollObserver.Trigger>
                  ))}
                </ScrollObserver.TriggerGroup>

                {/* Sticky Visual Content (Right Side) */}
                <div className="hidden lg:block sticky top-0 h-[100vh] overflow-hidden">
                  <div className={clsx(
                    isHidden ? "opacity-0 scale-95" : "opacity-100 scale-100",
                    "absolute inset-0 flex items-center transition-all duration-1000 ease-in-out"
                  )}>
                    <div className="relative w-full aspect-square max-w-[500px] mx-auto">
                       {/* Background card glow */}
                       <div className="absolute inset-0 bg-cyan-500/5 rounded-[40px] blur-3xl scale-110" />
                       
                       <ScrollObserver.ReactorGroup className="relative w-full h-full rounded-[40px] bg-[#111827] border border-white/10 overflow-hidden shadow-2xl">
                        {tools.map((tool, index) => (
                          <ScrollObserver.Reactor key={index} className="absolute inset-0 flex items-center justify-center">
                            {(isActive) => (
                              <div
                                className={clsx(
                                  isActive ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-110 translate-y-8",
                                  "w-full h-full p-12 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]"
                                )}
                              >
                                <div className={cn(
                                  "w-full h-full rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-inner border border-white/5",
                                  tool.color
                                )}>
                                   {/* Placeholder content until we have actual images */}
                                   <div className="relative group p-12 flex flex-col items-center text-center">
                                      <div className={cn("absolute inset-0 blur-3xl opacity-30 transition-all duration-500", tool.accent)} />
                                      {React.cloneElement(tool.icon as React.ReactElement, { className: "w-40 h-40 relative mb-8 drop-shadow-2xl" })}
                                      <div className="text-2xl font-bold opacity-50 tracking-widest uppercase">
                                        {tool.title.split(' ')[0]}
                                      </div>
                                   </div>
                                </div>
                              </div>
                            )}
                          </ScrollObserver.Reactor>
                        ))}
                      </ScrollObserver.ReactorGroup>
                    </div>
                  </div>
                </div>
              </>
            )}
          </ScrollObserver>
        </div>
      </section>

      {/* Why Choose Trevnoctilla */}
      <section className="py-32 border-t border-white/5 bg-[#0a0a0d]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Why <span className="text-cyan-400">Trevnoctilla</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Enterprise-grade performance meeting minimalist browser-first design.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            {[
              {
                title: "Processing Power",
                description: "Optimized multi-threaded processing ensures your files are handled in seconds, not minutes.",
                icon: <Zap className="w-8 h-8 text-cyan-400" />
              },
              {
                title: "Edge Privacy",
                description: "Your data stays yours. Files are processed ephemerally and wiped immediately after conversion.",
                icon: <FileText className="w-8 h-8 text-blue-400" />
              },
              {
                title: "Cross-Platform",
                description: "Built for the modern web. Works perfectly on desktop, tablet, and mobile browsers.",
                icon: <Layout className="w-8 h-8 text-purple-400" />
              },
            ].map((feature, index) => (
              <div key={feature.title} className="relative group">
                <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 w-fit group-hover:border-cyan-500/30 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                   {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-[#0a0a0d]">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-br from-[#111827] to-[#0a0a0d] border border-white/10 p-12 md:p-24 text-center relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-4xl md:text-7xl font-bold mb-8 tracking-tighter">Ready to transform?</h2>
              <Link href="/campaigns" className="inline-flex items-center gap-3 px-12 py-6 rounded-2xl bg-cyan-500 text-white font-bold text-2xl hover:bg-cyan-400 transition-all shadow-[0_0_50px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95">
                Get Started Now <ArrowRight className="w-8 h-8" />
              </Link>
           </div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
        </div>
      </section>
    </div>
  );
}
