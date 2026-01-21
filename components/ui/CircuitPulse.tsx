import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Mail,
  Send,
  Globe,
  Users,
  MessageSquare,
  Target,
  Zap,
  TrendingUp,
  LucideIcon,
} from "lucide-react";

interface CircuitPulseProps {
  className?: string;
  color?: string;
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
    initial: { opacity: 0.2 },
    animate: {
      opacity: [0.2, 0.5, 0.2],
      transition: { duration: 2, repeat: Infinity },
    },
  },
};

interface IconConfig {
  Icon: LucideIcon;
  position: string;
}

const icons: IconConfig[] = [
  { Icon: Mail, position: "rotate-0" },
  { Icon: Send, position: "rotate-45" },
  { Icon: Globe, position: "rotate-90" },
  { Icon: Users, position: "rotate-135" },
  { Icon: MessageSquare, position: "rotate-180" },
  { Icon: Target, position: "rotate-[225deg]" },
  { Icon: Zap, position: "rotate-[270deg]" },
  { Icon: TrendingUp, position: "rotate-[315deg]" },
];

export function CircuitPulse({
  className,
  color = "#06b6d4", // Cyan color that matches the site
}: CircuitPulseProps) {
  return (
    <div className={cn("relative h-[60vmin] w-[60vmin] max-h-[500px] max-w-[500px]", className)}>
      {[...Array(8)].map((_, i) => (
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
              "opacity-30",
              i < 4
                ? "h-full w-[calc(50%+1px)] border-r"
                : "absolute left-[calc(30%-1px)] top-[30%] h-[60%] w-[70%] rounded-br-xl border-b border-l",
            )}
            style={{ borderColor: color }}
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
              className="absolute left-1/2 top-1/2 h-[8px] w-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 12px ${color}`,
              }}
              variants={pulseVariants.glow}
            />
          </motion.div>
          <div
            className={cn(
              "absolute flex h-[36px] w-[36px] items-center justify-center rounded-full",
              i < 4
                ? "left-1/2 top-0 -translate-x-1/2"
                : "left-[30%] top-[30%] -translate-x-1/2 -translate-y-1/2",
            )}
            style={{
              backgroundColor: color,
              boxShadow: `0 0 18px ${color}80`,
            }}
          >
            <div className={icons[i].position}>
              {React.createElement(icons[i].Icon, {
                className: "h-4 w-4 text-white",
                strokeWidth: 1.5, // Thin icons
              })}
            </div>
          </div>
        </div>
      ))}
      <div className="absolute left-1/2 top-1/2 h-[25%] w-[25%] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#111827]/90 shadow-lg"
          style={{
            boxShadow: `0 0 30px ${color}40`,
          }}
          variants={pulseVariants.glow}
          initial="initial"
          animate="animate"
        />
        <motion.div
          className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 25px ${color}`,
          }}
        >
          <MessageSquare className="size-14 text-white" strokeWidth={1.5} />
        </motion.div>
      </div>
    </div>
  );
}
