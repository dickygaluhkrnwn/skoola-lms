"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Zap, GraduationCap, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

interface XPBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
  className?: string;
}

export function XPBar({ currentXP, maxXP, level, className }: XPBarProps) {
  const { theme } = useTheme();
  
  // Hitung persentase untuk lebar bar (max 100%)
  const percentage = Math.min((currentXP / maxXP) * 100, 100);

  // --- THEME CONFIGURATION ---
  const getThemeConfig = () => {
    switch (theme) {
      case 'sd':
        return {
          barBg: "bg-yellow-100 border-yellow-200",
          fillGradient: "from-yellow-400 to-orange-400",
          textColor: "text-orange-600",
          levelBadge: "bg-yellow-400 text-yellow-900 border-2 border-white shadow-md rounded-xl",
          icon: <Star size={12} fill="currentColor" className="animate-spin-slow" />,
          label: "Petualang"
        };
      case 'smp':
        return {
          barBg: "bg-indigo-100 border-indigo-200",
          fillGradient: "from-indigo-500 to-purple-500",
          textColor: "text-indigo-600",
          levelBadge: "bg-indigo-600 text-white shadow-lg shadow-indigo-200 rounded-lg",
          icon: <Zap size={12} fill="currentColor" />,
          label: "Challenger"
        };
      case 'sma':
        return {
          barBg: "bg-emerald-50 border-emerald-100",
          fillGradient: "from-emerald-400 to-teal-500",
          textColor: "text-emerald-700",
          levelBadge: "bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md",
          icon: <Award size={12} />,
          label: "Achiever"
        };
      case 'uni':
        return {
          barBg: "bg-slate-100 border-slate-200",
          fillGradient: "from-slate-700 to-slate-900",
          textColor: "text-slate-600",
          levelBadge: "bg-slate-800 text-white rounded-sm",
          icon: <GraduationCap size={12} />,
          label: "Scholar"
        };
      default: // Fallback same as SD
        return {
          barBg: "bg-gray-100 border-gray-200",
          fillGradient: "from-gray-400 to-gray-500",
          textColor: "text-gray-600",
          levelBadge: "bg-gray-500 text-white rounded-md",
          icon: <Star size={12} />,
          label: "User"
        };
    }
  };

  const config = getThemeConfig();

  return (
    <div className={cn("w-full max-w-sm", className)}>
      
      {/* Header Info */}
      <div className="flex justify-between items-end mb-1.5 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 flex items-center gap-1", config.levelBadge)}>
            LVL {level}
          </span>
          <span className={cn("text-xs font-bold uppercase tracking-wide opacity-80", config.textColor)}>
            {config.label}
          </span>
        </div>
        <span className={cn("text-[10px] font-bold font-mono", config.textColor)}>
          {currentXP} <span className="opacity-60">/ {maxXP} XP</span>
        </span>
      </div>

      {/* Bar Container */}
      <div className={cn("h-3.5 w-full rounded-full overflow-hidden border relative shadow-inner", config.barBg)}>
        {/* Fill Animation */}
        <motion.div
          className={cn("h-full bg-gradient-to-r relative", config.fillGradient)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Shine Effect */}
          <div className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-b from-white/20 to-transparent" />
          
          {/* Particles/Sparkles at the tip (Only for kids/smp to keep it fun) */}
          {(theme === 'sd' || theme === 'smp') && percentage > 0 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-white drop-shadow-sm">
              {config.icon}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}