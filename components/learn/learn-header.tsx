"use client";

import React from "react";
import { Star, Flame, Plus, GraduationCap, Sparkles, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/lib/types/user.types";
import { Button } from "@/components/ui/button";

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
      "sticky top-0 z-40 backdrop-blur-md border-b shadow-sm px-4 md:px-8 py-4 transition-all duration-300 flex justify-between items-center",
      // Theme Specific Backgrounds
      isKids ? "bg-white/90 border-b-4 border-sky-100" : 
      isSMP ? "bg-white/80 border-violet-100/50" :
      isSMA ? "bg-slate-950/80 border-white/5 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/50" : // HUD Style for SMA
      isUni ? "bg-slate-900/80 border-slate-800 text-white backdrop-blur-md" :
      "bg-white/90 border-zinc-200"
    )}>
      
      {/* LEFT SECTION: Logo/Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Avatar (Optional) */}
        <div className={cn(
            "md:hidden w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border",
            isUni ? "bg-indigo-900 border-indigo-700" : "bg-slate-100 border-slate-200"
        )}>
            {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="User" className="w-full h-full object-cover" />
            ) : (
                <User size={16} className={cn(isUni ? "text-indigo-300" : "text-slate-400")} />
            )}
        </div>

        <div>
            <h1 className={cn(
            "text-lg font-bold leading-tight flex items-center gap-2",
            isKids ? "text-sky-900 font-display" : 
            isSMA ? "text-slate-100 tracking-tight font-mono" :
            isUni ? "text-white tracking-wide" : 
            "text-zinc-900"
            )}>
            {isSMA && <Sparkles size={16} className="text-teal-400" />}
            {isKids ? "Peta Petualangan 🗺️" : isUni ? "Academic Dashboard" : isSMA ? "COMMAND CENTER" : "Ruang Belajar"}
            </h1>
            <p className={cn(
            "text-xs hidden md:block", 
            isKids ? "text-sky-500 font-bold" : 
            isSMA ? "text-teal-500/70 font-mono text-[10px] tracking-widest uppercase" :
            isUni ? "text-indigo-300/70" : 
            "text-zinc-500"
            )}>
            {isKids ? "Ayo kumpulkan semua bintang!" : isSMA ? "SYSTEM ONLINE // READY" : isUni ? "Manage your academic progress." : "Lanjutkan progres belajarmu."}
            </p>
        </div>
      </div>

      {/* RIGHT SECTION: Stats & Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Stats Container */}
        <div className="flex items-center gap-2">
            {/* XP Badge */}
            <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border transition-all shadow-sm",
            isKids ? "bg-yellow-50 border-yellow-200 text-yellow-700 border-2" : 
            isSMP ? "bg-violet-50 border-violet-100 text-violet-700" :
            isSMA ? "bg-slate-900/50 border-teal-500/30 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.15)]" : // Glowing Tech Badge
            isUni ? "bg-slate-800 border-slate-700 text-slate-300" :
            "bg-zinc-50 border-zinc-200 text-zinc-700"
            )}>
            <Star size={14} className={cn("fill-current", isKids ? "text-yellow-500 animate-pulse" : isSMA ? "text-teal-400" : "text-indigo-500")} />
            <span className={cn("font-bold text-xs", isSMA && "font-mono")}>{userProfile?.gamification?.xp || 0} XP</span>
            </div>

            {/* Streak Badge (Hidden on very small screens) */}
            <div className={cn(
            "hidden sm:flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border transition-all shadow-sm",
            isKids ? "bg-orange-50 border-orange-200 text-orange-700 border-2" : 
            isSMP ? "bg-fuchsia-50 border-fuchsia-100 text-fuchsia-700" :
            isSMA ? "bg-slate-900/50 border-rose-500/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]" : // Glowing Tech Badge
            isUni ? "bg-slate-800 border-slate-700 text-slate-300" :
            "bg-zinc-50 border-zinc-200 text-zinc-700"
            )}>
            <Flame size={14} className={cn("fill-current", isKids ? "text-orange-500 animate-bounce" : isSMA ? "text-rose-500" : "text-red-500")} />
            <span className={cn("font-bold text-xs", isSMA && "font-mono")}>{userProfile?.gamification?.currentStreak || 0}</span>
            </div>
        </div>

        {/* Join Class Button (Desktop Text, Mobile Icon) */}
        <Button 
          onClick={onOpenJoinModal} 
          size="sm"
          className={cn(
            "h-9 px-4 text-xs font-bold transition-all shadow-sm active:scale-95 ml-2",
            isKids 
              ? "bg-sky-500 text-white hover:bg-sky-400 border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 rounded-xl" 
              : isSMP
                ? "bg-violet-600 text-white hover:bg-violet-700 rounded-lg shadow-violet-200"
              : isSMA
                ? "bg-teal-500/10 text-teal-400 border border-teal-500/50 hover:bg-teal-500/20 hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] rounded-md tracking-wide uppercase"
              : isUni
                ? "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 shadow-indigo-500/20 rounded-md"
              : "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
          )}
        >
          <Plus size={16} className="md:mr-2" /> 
          <span className="hidden md:inline">{isSMA ? "Connect" : "Join Kelas"}</span>
        </Button>
      </div>
    </header>
  );
}