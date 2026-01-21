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
    initial: { opacity: 0.3 },
    animate: {
      opacity: [0.3, 0.7, 0.3],
      transition: { duration: 2, repeat: Infinity },
    },
  },
};

// Programming language icons (SVG paths)
const langIcons = [
  { name: "Python", color: "#3776AB", path: "M15.885 3.778c-1.665 0-3.114.127-4.12.357-.988.225-1.458.637-1.458 1.242v2.156h5.787v.732H8.62c-1.664 0-3.124.99-3.582 2.871-.527 2.16-.55 3.506 0 5.762.408 1.679 1.383 2.871 3.047 2.871h1.97v-2.616c0-1.891 1.636-3.558 3.582-3.558h5.778c1.594 0 2.868-1.31 2.868-2.903V5.377c0-1.553-1.31-2.71-2.868-2.871-1.036-.107-2.112-.157-3.53-.728zm-3.104 1.79c.597 0 1.083.493 1.083 1.1 0 .606-.486 1.094-1.083 1.094-.597 0-1.083-.488-1.083-1.094 0-.607.486-1.1 1.083-1.1z" },
  { name: "JavaScript", color: "#F7DF1E", path: "M3 3h18v18H3V3zm16.525 13.707c-.131-.821-.666-1.511-2.252-2.155-.552-.259-1.165-.438-1.349-.854-.068-.248-.078-.382-.034-.529.113-.484.687-.629 1.137-.495.293.09.563.315.732.676.727-.475 1.161-.762 1.161-.762-.133-.207-.201-.293-.29-.382-.315-.29-.742-.438-1.427-.416-.958.037-1.738.42-2.213 1.027-.015.019-.319.414-.319.813 0 .68.359 1.073 1.427 1.446.892.313 1.349.501 1.349 1.084 0 .584-.631.872-1.487.872-.68 0-1.08-.158-1.411-.483-.143-.14-.28-.291-.423-.45l-1.161.667c.189.382.382.667.697.962.894.849 2.252 1.078 3.182.775.584-.191 1.091-.593 1.404-1.246.014-.029.315-.712.315-1.516 0-.68-.36-1.073-1.427-1.446z" },
  { name: "TypeScript", color: "#3178C6", path: "M3 3h18v18H3V3zm14.734 11.852c.463.316 1.013.55 1.649.55.636 0 1.034-.318 1.034-.779 0-.55-.403-.746-1.082-1.066l-.371-.159c-1.073-.459-1.785-.034-1.785-1.513 0-.753.574-1.326 1.471-1.326.638 0 1.098.222 1.428.804l-.782.502c-.172-.31-.358-.431-.646-.431-.294 0-.481.187-.481.431 0 .302.187.424.62.612l.371.159c1.264.542 1.977.873 1.977 1.862 0 .861-.677 1.398-1.587 1.398-.892 0-1.469-.425-1.75-0.983l.829-.477zM10.204 13.5h1.078v-2.977h1.362v-.954h-3.802v.954h1.362V13.5z" },
  { name: "React", color: "#61DAFB", path: "M12 10.11c1.03 0 1.87.84 1.87 1.89 0 1.05-.84 1.89-1.87 1.89s-1.87-.84-1.87-1.89c0-1.05.84-1.89 1.87-1.89zM7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9-.82-.08-1.63-.2-2.4-.36-.51 2.14-.32 3.61.31 3.96zM16.63 4c-.63-.38-2.01.2-3.6 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.31-3.96zM12 17.34c-.74.72-1.45 1.39-2.01 1.93.52.08 1.35.15 2.01.15.66 0 1.49-.07 2.01-.15-.56-.54-1.27-1.21-2.01-1.93zM12 6.66c.74-.72 1.45-1.39 2.01-1.93-.52-.08-1.35-.15-2.01-.15-.66 0-1.49.07-2.01.15.56.54 1.27 1.21 2.01 1.93z" },
  { name: "Node.js", color: "#339933", path: "M12 1.85c-.27 0-.55.07-.78.2l-7.44 4.3c-.48.28-.78.79-.78 1.34v8.61c0 .55.3 1.06.78 1.34l7.44 4.3c.48.28 1.08.28 1.56 0l7.44-4.3c.48-.28.78-.79.78-1.34V7.69c0-.55-.3-1.06-.78-1.34l-7.44-4.3c-.23-.13-.51-.2-.78-.2zm0 2.84c.05 0 .11.01.16.04l4.46 2.58c.1.06.16.16.16.27v5.15c0 .11-.06.21-.16.27l-4.46 2.58c-.1.06-.22.06-.32 0l-4.46-2.58c-.1-.06-.16-.16-.16-.27V7.58c0-.11.06-.21.16-.27l4.46-2.58c.05-.03.11-.04.16-.04z" },
  { name: "Vue", color: "#4FC08D", path: "M2 3h3.5L12 15.5 18.5 3H22L12 22 2 3zm4.5 0h3L12 8.5 14.5 3h3L12 15.5 4.5 3z" },
  { name: "Angular", color: "#DD0031", path: "M12 2.5L3.5 6.5l1.3 11.3L12 21.5l7.2-3.7 1.3-11.3L12 2.5zm0 2.2l6.4 10.8h-2.1l-1.3-3.2H9l-1.3 3.2H5.6L12 4.7zm0 3.8L9.9 12h4.2L12 8.5z" },
  { name: "Git", color: "#F05032", path: "M21.62 11.108l-8.731-8.729a1.292 1.292 0 0 0-1.823 0L9.257 4.19l2.299 2.3a1.532 1.532 0 0 1 1.939 1.95l2.214 2.217a1.53 1.53 0 0 1 1.583 2.531c-.599.6-1.566.6-2.166 0a1.536 1.536 0 0 1-.337-1.662l-2.074-2.063V14.9c.146.071.286.169.407.29a1.537 1.537 0 0 1 0 2.166 1.536 1.536 0 0 1-2.174 0 1.528 1.528 0 0 1 0-2.164c.152-.15.322-.264.504-.342v-5.305a1.58 1.58 0 0 1-.504-.341 1.533 1.533 0 0 1-.34-1.686L7.03 5.222 2.38 9.867a1.286 1.286 0 0 0 0 1.817l8.73 8.729a1.285 1.285 0 0 0 1.821 0l8.69-8.729a1.287 1.287 0 0 0 0-1.817" },
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
                "opacity-40",
                i < 4
                  ? "h-full w-[calc(50%+1px)] border-r-2"
                  : "absolute left-[calc(30%-1px)] top-[30%] h-[60%] w-[70%] rounded-br-xl border-b-2 border-l-2",
              )}
              style={{ 
                borderColor: iconConfig.color,
                filter: `drop-shadow(0 0 3px ${iconConfig.color}40)`,
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
                className="absolute left-1/2 top-1/2 h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  backgroundColor: iconConfig.color,
                  boxShadow: `0 0 20px ${iconConfig.color}, 0 0 40px ${iconConfig.color}80`,
                }}
                variants={pulseVariants.glow}
              />
            </motion.div>
            <motion.div
              className={cn(
                "absolute flex h-[42px] w-[42px] items-center justify-center rounded-full border-2",
                i < 4
                  ? "left-1/2 top-0 -translate-x-1/2"
                  : "left-[30%] top-[30%] -translate-x-1/2 -translate-y-1/2",
              )}
              style={{
                backgroundColor: "#111827",
                borderColor: iconConfig.color,
                boxShadow: `0 0 20px ${iconConfig.color}60, inset 0 0 10px ${iconConfig.color}20`,
              }}
              whileHover={{ scale: 1.1 }}
            >
              <svg 
                viewBox="0 0 24 24" 
                className="h-6 w-6"
                fill={iconConfig.color}
              >
                <path d={iconConfig.path} />
              </svg>
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
