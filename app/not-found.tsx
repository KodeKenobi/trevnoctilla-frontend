"use client";

import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function NotFound() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const floatingElements = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 4,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingElements.map((element) => (
          <motion.div
            key={element.id}
            className="absolute w-2 h-2 bg-cyan-400/20 rounded-full"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: element.duration,
              delay: element.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Mouse Follower */}
      <motion.div
        className="absolute w-6 h-6 bg-cyan-400/30 rounded-full pointer-events-none z-10"
        animate={{
          x: mousePosition.x - 12,
          y: mousePosition.y - 12,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 28,
        }}
      />

      {/* Main Content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* 404 Number */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
            className="relative mb-8"
          >
            <h1 className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 leading-none">
              404
            </h1>
            <motion.div
              className="absolute inset-0 text-9xl md:text-[12rem] font-black text-cyan-400/20 blur-sm"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              404
            </motion.div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Oops! Page Not Found
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              The page you're looking for seems to have vanished into the
              digital void. Don't worry, even the best explorers sometimes take
              a wrong turn!
            </p>
          </motion.div>

          {/* Interactive Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mb-12"
          >
            <div className="relative max-w-md mx-auto">
              <motion.input
                type="text"
                placeholder="Search for what you need..."
                className="w-full px-6 py-4 pr-12 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300"
                whileFocus={{ scale: 1.02 }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              />
              <motion.div
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
                animate={{
                  scale: isHovering ? 1.1 : 1,
                  rotate: isHovering ? 10 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                <Search className="w-5 h-5 text-gray-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              onClick={() => router.push("/")}
            >
              <Home className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Go Home</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center space-x-2 px-8 py-4 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-cyan-400/50 text-gray-300 hover:text-white rounded-2xl font-semibold transition-all duration-300"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Go Back</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center space-x-2 px-8 py-4 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 hover:border-purple-400/50 text-gray-300 hover:text-white rounded-2xl font-semibold transition-all duration-300"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Refresh</span>
            </motion.button>
          </motion.div>

          {/* Fun Facts */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-16"
          >
            <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4">
                Did you know? 🤔
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                The first 404 error was recorded in 1992 at CERN. The room where
                the web's central database was located was called "Room 404" -
                hence the error code!
              </p>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="mt-12"
          >
            <p className="text-gray-400 mb-4">Popular destinations:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { name: "PDF Tools", href: "/tools" },
                { name: "Video Converter", href: "/tools/video-converter" },
                { name: "Audio Converter", href: "/tools/audio-converter" },
                { name: "Image Tools", href: "/tools/image-tools" },
              ].map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="inline-block px-4 py-2 bg-gray-800/50 hover:bg-cyan-500/20 border border-gray-700/50 hover:border-cyan-400/50 text-gray-300 hover:text-cyan-400 rounded-lg text-sm font-medium transition-all duration-300"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 50 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
