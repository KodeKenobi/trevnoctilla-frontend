import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CircuitPulseProps {
  className?: string;
}

const pulseVariants = {
  dot1: {
    initial: { y: "-50%", x: "-50%" },
    animate: {
      y: ["-50%", "30%", "30%"],
      transition: {
        duration: 5,
        times: [0, 0.3, 1],
        repeat: Infinity,
        repeatDelay: 2,
        ease: "easeInOut",
      },
    },
  },
  dot2: {
    initial: { y: "-50%", x: "-50%" },
    animate: {
      y: ["-50%", "9.5%", "9.5%"],
      x: ["-50%", "-50%", "9.5%"],
      transition: {
        duration: 4,
        times: [0, 0.5, 1],
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: "easeInOut",
      },
    },
  },
  dot3: {
    initial: { y: "-50%", x: "-50%" },
    animate: {
      y: ["-50%", "30%", "30%"],
      transition: {
        duration: 3.5,
        times: [0, 0.4, 1],
        repeat: Infinity,
        repeatDelay: 2.5,
        ease: "easeInOut",
      },
    },
  },
  dot4: {
    initial: { y: "-50%", x: "-50%" },
    animate: {
      y: ["-50%", "9.5%", "9.5%"],
      x: ["-50%", "-50%", "9.5%"],
      transition: {
        duration: 4.5,
        times: [0, 0.6, 1],
        repeat: Infinity,
        repeatDelay: 1.8,
        ease: "easeInOut",
      },
    },
  },
  glow: {
    initial: { opacity: 0.4 },
    animate: {
      opacity: [0.4, 0.9, 0.4],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  },
};

// Programming language and tech icons (SVG paths)
const langIcons = [
  { name: "Python", color: "#FFD43B", path: "M15.885 3.778c-1.665 0-3.114.127-4.12.357-.988.225-1.458.637-1.458 1.242v2.156h5.787v.732H8.62c-1.664 0-3.124.99-3.582 2.871-.527 2.16-.55 3.506 0 5.762.408 1.679 1.383 2.871 3.047 2.871h1.97v-2.616c0-1.891 1.636-3.558 3.582-3.558h5.778c1.594 0 2.868-1.31 2.868-2.903V5.377c0-1.553-1.31-2.71-2.868-2.871-1.036-.107-2.112-.157-3.53-.728zm-3.104 1.79c.597 0 1.083.493 1.083 1.1 0 .606-.486 1.094-1.083 1.094-.597 0-1.083-.488-1.083-1.094 0-.607.486-1.1 1.083-1.1z" },
  { name: "JavaScript", color: "#F7DF1E", path: "M3 3h18v18H3V3zm16.525 13.707c-.131-.821-.666-1.511-2.252-2.155-.552-.259-1.165-.438-1.349-.854-.068-.248-.078-.382-.034-.529.113-.484.687-.629 1.137-.495.293.09.563.315.732.676.727-.475 1.161-.762 1.161-.762-.133-.207-.201-.293-.29-.382-.315-.29-.742-.438-1.427-.416-.958.037-1.738.42-2.213 1.027-.015.019-.319.414-.319.813 0 .68.359 1.073 1.427 1.446.892.313 1.349.501 1.349 1.084 0 .584-.631.872-1.487.872-.68 0-1.08-.158-1.411-.483-.143-.14-.28-.291-.423-.45l-1.161.667c.189.382.382.667.697.962.894.849 2.252 1.078 3.182.775.584-.191 1.091-.593 1.404-1.246.014-.029.315-.712.315-1.516 0-.68-.36-1.073-1.427-1.446z" },
  { name: "Database", color: "#00758F", path: "M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm6 14c0 .55-2.69 2-6 2s-6-1.45-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V17zm0-4.55c-1.3.95-3.58 1.55-6 1.55s-4.7-.6-6-1.55V9.64c1.47.83 3.61 1.36 6 1.36s4.53-.53 6-1.36v2.81zM12 9C8.69 9 6 7.55 6 7s2.69-2 6-2 6 1.45 6 2-2.69 2-6 2z" },
  { name: "React", color: "#61DAFB", path: "M12 10.11c1.03 0 1.87.84 1.87 1.89 0 1.05-.84 1.89-1.87 1.89s-1.87-.84-1.87-1.89c0-1.05.84-1.89 1.87-1.89zM7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9-.82-.08-1.63-.2-2.4-.36-.51 2.14-.32 3.61.31 3.96zM16.63 4c-.63-.38-2.01.2-3.6 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.31-3.96zM12 17.34c-.74.72-1.45 1.39-2.01 1.93.52.08 1.35.15 2.01.15.66 0 1.49-.07 2.01-.15-.56-.54-1.27-1.21-2.01-1.93zM12 6.66c.74-.72 1.45-1.39 2.01-1.93-.52-.08-1.35-.15-2.01-.15-.66 0-1.49.07-2.01.15.56.54 1.27 1.21 2.01 1.93z" },
  { name: "Node.js", color: "#68A063", path: "M12 1.85c-.27 0-.55.07-.78.2l-7.44 4.3c-.48.28-.78.79-.78 1.34v8.61c0 .55.3 1.06.78 1.34l7.44 4.3c.48.28 1.08.28 1.56 0l7.44-4.3c.48-.28.78-.79.78-1.34V7.69c0-.55-.3-1.06-.78-1.34l-7.44-4.3c-.23-.13-.51-.2-.78-.2zm0 2.84c.05 0 .11.01.16.04l4.46 2.58c.1.06.16.16.16.27v5.15c0 .11-.06.21-.16.27l-4.46 2.58c-.1.06-.22.06-.32 0l-4.46-2.58c-.1-.06-.16-.16-.16-.27V7.58c0-.11.06-.21.16-.27l4.46-2.58c.05-.03.11-.04.16-.04z" },
  { name: "Flask", color: "#FFFFFF", path: "M9 3v5.586l-5.707 5.707A1 1 0 0 0 3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a1 1 0 0 0-.293-.707L15 8.586V3h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1zm4 0v6a1 1 0 0 0 .293.707L18 14.414V19H6v-4.586l4.707-4.707A1 1 0 0 0 11 9V3h2zm-2 12a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" },
  { name: "AI", color: "#FF6B6B", path: "M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" },
  { name: "SQL", color: "#CC2927", path: "M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zm0 6c-3.31 0-6-1.34-6-3s2.69-3 6-3 6 1.34 6 3-2.69 3-6 3zm-6 1.5v2c0 1.66 2.69 3 6 3s6-1.34 6-3v-2c-1.3.95-3.58 1.5-6 1.5s-4.7-.55-6-1.5zm0 4v2c0 1.66 2.69 3 6 3s6-1.34 6-3v-2c-1.3.95-3.58 1.5-6 1.5s-4.7-.55-6-1.5z" },
];

export function CircuitPulse({
  className,
}: CircuitPulseProps) {
  return (
    <div className={cn("relative h-[60vmin] w-[60vmin] max-h-[500px] max-w-[500px]", className)}>
      {[...Array(8)].map((_, i) => {
        const iconConfig = langIcons[i];
        return (
          <div
            key={i}
            className={cn(
              "pointer-events-none absolute h-1/2 w-1/2",
              i < 4
                ? "left-1/2 top-0 origin-bottom -translate-x-1/2"
                : "left-0 top-0 origin-bottom-right",
              i === 1 && "rotate-90",
              i === 2 && "rotate-180",
              i === 3 && "rotate-[270deg]",
              i === 5 && "-scale-x-100",
              i === 6 && "-scale-100",
              i === 7 && "-scale-y-100",
            )}
          >
          <motion.div
            className={cn(
              "opacity-50",
              i < 4
                ? "h-full w-[calc(50%+1px)] border-r-[3px]"
                : "absolute left-[calc(30%-1px)] top-[30%] h-[60%] w-[70%] rounded-br-xl border-b-[3px] border-l-[3px]",
            )}
            style={{ 
              borderColor: iconConfig.color,
              filter: `drop-shadow(0 0 5px ${iconConfig.color}60) drop-shadow(0 0 10px ${iconConfig.color}40)`,
            }}
            variants={pulseVariants.glow}
            initial="initial"
            animate="animate"
          />
            <motion.div
              className={cn(
                "absolute h-full w-full",
                i < 2
                  ? "left-1/2 top-[10%]"
                  : i < 4
                    ? "left-1/2 top-[10%]"
                    : i < 6
                      ? "left-[30%] top-[30%]"
                      : "left-[30%] top-[30%]",
              )}
              variants={
                i < 2
                  ? pulseVariants.dot1
                  : i < 4
                    ? pulseVariants.dot3
                    : i < 6
                      ? pulseVariants.dot2
                      : pulseVariants.dot4
              }
              initial="initial"
              animate="animate"
            >
              <motion.div
                className="absolute left-1/2 top-1/2 h-[12px] w-[12px] sm:h-[20px] sm:w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  backgroundColor: iconConfig.color,
                  boxShadow: `0 0 25px ${iconConfig.color}, 0 0 50px ${iconConfig.color}90, 0 0 75px ${iconConfig.color}60`,
                }}
                variants={pulseVariants.glow}
              />
            </motion.div>
            <motion.div
              className={cn(
                "absolute flex h-[70px] w-[70px] items-center justify-center rounded-full border-[3px]",
                i < 4
                  ? "left-1/2 top-[-35px] -translate-x-1/2"
                  : "left-[30%] top-[30%] -translate-x-1/2 -translate-y-1/2",
              )}
              style={{
                backgroundColor: "#0a0a0a",
                borderColor: iconConfig.color,
                boxShadow: `0 0 30px ${iconConfig.color}80, 0 0 60px ${iconConfig.color}40, inset 0 0 15px ${iconConfig.color}30`,
              }}
              whileHover={{ scale: 1.15 }}
              animate={{
                boxShadow: [
                  `0 0 30px ${iconConfig.color}80, 0 0 60px ${iconConfig.color}40, inset 0 0 15px ${iconConfig.color}30`,
                  `0 0 40px ${iconConfig.color}90, 0 0 80px ${iconConfig.color}50, inset 0 0 20px ${iconConfig.color}40`,
                  `0 0 30px ${iconConfig.color}80, 0 0 60px ${iconConfig.color}40, inset 0 0 15px ${iconConfig.color}30`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div
                className={cn(
                  i === 1 && "-rotate-90",
                  i === 2 && "-rotate-180",
                  i === 3 && "-rotate-[270deg]",
                  i === 5 && "scale-x-100",
                  i === 6 && "scale-100",
                  i === 7 && "scale-y-100",
                )}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="h-10 w-10"
                  fill={iconConfig.color}
                >
                  <path d={iconConfig.path} />
                </svg>
              </div>
            </motion.div>
          </div>
        );
      })}
      <div className="absolute left-1/2 top-1/2 h-[25%] w-[25%] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-900/50 to-blue-900/50"
          style={{
            boxShadow: `0 0 40px rgba(139, 92, 246, 0.4), 0 0 80px rgba(59, 130, 246, 0.2)`,
          }}
          variants={pulseVariants.glow}
          initial="initial"
          animate="animate"
        />
        <motion.div
          className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 bg-white"
          style={{
            borderColor: "#8b5cf6",
            boxShadow: `0 0 30px rgba(139, 92, 246, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.1)`,
          }}
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={80}
            height={80}
            className="object-contain"
          />
        </motion.div>
      </div>
    </div>
  );
}
