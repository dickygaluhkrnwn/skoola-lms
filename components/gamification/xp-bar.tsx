"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface XPBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
  className?: string;
}

export function XPBar({ currentXP, maxXP, level, className }: XPBarProps) {
  // Hitung persentase untuk lebar bar (max 100%)
  const percentage = Math.min((currentXP / maxXP) * 100, 100);

  return (
    <div className={cn("w-full max-w-sm", className)}>
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-center gap-2">
          <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-sm">
            LVL {level}
          </span>
          <span className="text-xs font-bold text-gray-600">
            Pejuang Bahasa
          </span>
        </div>
        <span className="text-xs font-bold text-sky-600">
          {currentXP} <span className="text-gray-400">/ {maxXP} XP</span>
        </span>
      </div>

      {/* Bar Container */}
      <div className="h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300 relative shadow-inner">
        {/* Fill Animation */}
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Shine Effect */}
          <div className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-b from-white/30 to-transparent" />
          
          {/* Particles/Sparkles di ujung bar (Opsional, hiasan) */}
          {percentage > 0 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-white">
              <Star size={10} fill="currentColor" className="animate-spin-slow" />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}