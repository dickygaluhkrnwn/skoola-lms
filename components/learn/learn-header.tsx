"use client";

import React from "react";
import { Star, Flame, Plus, GraduationCap } from "lucide-react";
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
  const isUni = theme === "uni";

  return (
    <header className={cn(
      "sticky top-0 z-40 backdrop-blur-md border-b shadow-sm px-6 py-4 transition-colors duration-300 flex justify-between items-center",
      isKids ? "bg-white/90 border-b-4 border-sky-100" : 
      isUni ? "bg-slate-900/90 border-slate-800 text-white" :
      "bg-white/90 border-zinc-200"
    )}>
      <div>
        <h1 className={cn(
          "text-lg font-bold leading-tight",
          isKids ? "text-sky-900 font-display" : isUni ? "text-white" : "text-zinc-900"
        )}>
          {isKids ? "Peta Petualangan 🗺️" : isUni ? "Academic Dashboard" : "Dashboard Belajar"}
        </h1>
        <p className={cn(
          "text-xs hidden md:block", 
          isKids ? "text-sky-500 font-bold" : isUni ? "text-slate-400" : "text-zinc-500"
        )}>
          {isKids ? "Ayo kumpulkan semua bintang!" : isUni ? "Manage your academic progress." : "Lanjutkan progres belajarmu."}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* XP Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all shadow-sm",
          isKids ? "bg-yellow-50 border-yellow-200 text-yellow-700" : 
          isUni ? "bg-slate-800 border-slate-700 text-slate-300" :
          "bg-zinc-50 border-zinc-200 text-zinc-700"
        )}>
          <Star size={16} className={cn("fill-current animate-pulse", isKids ? "text-yellow-500" : "text-indigo-500")} />
          <span className="font-bold text-xs">{userProfile?.gamification?.xp || 0} XP</span>
        </div>

        {/* Streak Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all shadow-sm",
          isKids ? "bg-orange-50 border-orange-200 text-orange-700" : 
          isUni ? "bg-slate-800 border-slate-700 text-slate-300" :
          "bg-zinc-50 border-zinc-200 text-zinc-700"
        )}>
          <Flame size={16} className={cn("fill-current", isKids ? "text-orange-500 animate-bounce" : "text-red-500")} />
          <span className="font-bold text-xs">{userProfile?.gamification?.currentStreak || 0}</span>
        </div>

        {/* Join Class Button */}
        <button 
          onClick={onOpenJoinModal} 
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-95 ml-2",
            isKids 
              ? "bg-sky-500 text-white hover:bg-sky-400 border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 rounded-xl" 
              : "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
          )}
        >
          <Plus size={16} /> <span className="hidden sm:inline">Join Kelas</span>
        </button>
      </div>
    </header>
  );
}