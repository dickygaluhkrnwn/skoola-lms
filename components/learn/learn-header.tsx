"use client";

import React from "react";
import { Star, Flame, Plus, GraduationCap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/lib/types/user.types";

interface LearnHeaderProps {
  theme: string;
  userProfile: UserProfile | null;
  onOpenJoinModal: () => void;
}

export function LearnHeader({ theme, userProfile, onOpenJoinModal }: LearnHeaderProps) {
  
  // Helper styling based on theme
  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  return (
    <header className={cn(
      "sticky top-0 z-40 backdrop-blur-md border-b shadow-sm px-6 py-4 transition-all duration-300 flex justify-between items-center",
      // Theme Specific Backgrounds
      isKids ? "bg-white/90 border-b-4 border-sky-100" : 
      isSMP ? "bg-white/80 border-violet-100/50" :
      isSMA ? "bg-slate-950/30 border-white/5 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/30" : // HUD Style for SMA
      isUni ? "bg-slate-900/90 border-slate-800 text-white" :
      "bg-white/90 border-zinc-200"
    )}>
      <div>
        <h1 className={cn(
          "text-lg font-bold leading-tight flex items-center gap-2",
          isKids ? "text-sky-900 font-display" : 
          isSMA ? "text-slate-100 tracking-tight" :
          isUni ? "text-white" : 
          "text-zinc-900"
        )}>
          {isSMA && <Sparkles size={16} className="text-teal-400" />}
          {isKids ? "Peta Petualangan 🗺️" : isUni ? "Academic Dashboard" : isSMA ? "Command Center" : "Dashboard Belajar"}
        </h1>
        <p className={cn(
          "text-xs hidden md:block", 
          isKids ? "text-sky-500 font-bold" : 
          isSMA ? "text-slate-400 font-mono text-[10px] tracking-widest uppercase opacity-80" :
          isUni ? "text-slate-400" : 
          "text-zinc-500"
        )}>
          {isKids ? "Ayo kumpulkan semua bintang!" : isSMA ? "SYSTEM ONLINE // READY TO LEARN" : isUni ? "Manage your academic progress." : "Lanjutkan progres belajarmu."}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* XP Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shadow-sm",
          isKids ? "bg-yellow-50 border-yellow-200 text-yellow-700 border-2" : 
          isSMP ? "bg-violet-50 border-violet-100 text-violet-700" :
          isSMA ? "bg-slate-900/50 border-teal-500/30 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.15)]" : // Glowing Tech Badge
          isUni ? "bg-slate-800 border-slate-700 text-slate-300" :
          "bg-zinc-50 border-zinc-200 text-zinc-700"
        )}>
          <Star size={16} className={cn("fill-current", isKids ? "text-yellow-500 animate-pulse" : isSMA ? "text-teal-400" : "text-indigo-500")} />
          <span className={cn("font-bold text-xs", isSMA && "font-mono")}>{userProfile?.gamification?.xp || 0} XP</span>
        </div>

        {/* Streak Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shadow-sm",
          isKids ? "bg-orange-50 border-orange-200 text-orange-700 border-2" : 
          isSMP ? "bg-fuchsia-50 border-fuchsia-100 text-fuchsia-700" :
          isSMA ? "bg-slate-900/50 border-rose-500/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]" : // Glowing Tech Badge
          isUni ? "bg-slate-800 border-slate-700 text-slate-300" :
          "bg-zinc-50 border-zinc-200 text-zinc-700"
        )}>
          <Flame size={16} className={cn("fill-current", isKids ? "text-orange-500 animate-bounce" : isSMA ? "text-rose-500" : "text-red-500")} />
          <span className={cn("font-bold text-xs", isSMA && "font-mono")}>{userProfile?.gamification?.currentStreak || 0}</span>
        </div>

        {/* Join Class Button */}
        <button 
          onClick={onOpenJoinModal} 
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-95 ml-2",
            isKids 
              ? "bg-sky-500 text-white hover:bg-sky-400 border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 rounded-xl" 
              : isSMP
                ? "bg-violet-600 text-white hover:bg-violet-700 rounded-lg shadow-violet-200"
              : isSMA
                ? "bg-teal-500/10 text-teal-400 border border-teal-500/50 hover:bg-teal-500/20 hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] rounded-md tracking-wide uppercase"
              : isUni
                ? "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 rounded-md"
              : "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
          )}
        >
          <Plus size={16} /> <span className="hidden sm:inline">{isSMA ? "Connect" : "Join Kelas"}</span>
        </button>
      </div>
    </header>
  );
}