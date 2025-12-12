"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { BADGE_SYSTEM } from "@/lib/data/badge-system";

interface AchievementsTabProps {
  userProfile: any;
  isKids: boolean;
  isSMP: boolean;
  isSMA: boolean;
  isUni: boolean;
  textPrimary: string;
  textMuted: string;
}

export function AchievementsTab({ 
  userProfile, 
  isKids, 
  isSMP, 
  isSMA, 
  isUni,
  textPrimary,
  textMuted
}: AchievementsTabProps) {

  const checkBadge = (badge: typeof BADGE_SYSTEM[0]) => {
    if (!userProfile) return false;
    return badge.condition(userProfile);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {BADGE_SYSTEM.map((badge, idx) => {
        const isUnlocked = checkBadge(badge);
        return (
          <motion.div 
            key={badge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "p-4 border rounded-xl flex flex-col items-center text-center transition-all duration-300 group hover:shadow-md relative overflow-hidden",
              isUnlocked 
                ? (
                    isKids ? "bg-white border-yellow-200" : 
                    isSMP ? "bg-white/70 border-violet-100 shadow-sm" : 
                    isSMA ? "bg-white/5 border-white/10 hover:border-teal-500/40 hover:bg-white/10" : 
                    isUni ? "bg-white/5 border-white/10 hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:bg-white/10" : 
                    "bg-white border-slate-200"
                  )
                : (
                    (isUni || isSMA) 
                        ? "bg-slate-950/40 border-white/5 opacity-50 grayscale hover:opacity-70 transition-opacity" 
                        : "bg-gray-50 border-gray-100 opacity-60 grayscale"
                  )
            )}
          >
            {/* Corner Accents for specific themes */}
            {isUnlocked && isSMP && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-violet-100 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />}
            {isUnlocked && isSMA && <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />}
            {isUnlocked && isUni && <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />}
            
            <div className={cn(
              "text-4xl mb-3 filter drop-shadow-sm transition-transform group-hover:scale-110",
              isUnlocked && "animate-bounce-slow",
              isUnlocked && isUni && "drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            )}>
              {badge.icon}
            </div>
            <h3 className={cn("font-bold text-sm mb-1 line-clamp-1", textPrimary)}>{badge.name}</h3>
            <p className={cn("text-[10px] leading-tight h-8 overflow-hidden line-clamp-2", textMuted)}>{badge.desc}</p>
            
            <div className="mt-3 w-full">
               {!isUnlocked ? (
                 <div className={cn("flex items-center justify-center gap-1 py-1 rounded text-[10px] font-bold w-full", (isUni || isSMA) ? "bg-white/5 text-slate-500 border border-white/5" : "bg-gray-200 text-gray-500")}>
                   <Lock size={10} /> Terkunci
                 </div>
               ) : (
                 <div className={cn(
                   "text-[10px] font-bold py-1 rounded flex items-center justify-center gap-1 w-full",
                   isKids ? "bg-green-100 text-green-700" : 
                   isSMP ? "bg-fuchsia-100 text-fuchsia-700" : 
                   isSMA ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : 
                   isUni ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : 
                   "bg-green-50 text-green-700"
                 )}>
                   <Zap size={10} /> Tercapai
                 </div>
               )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}