"use client";

import React from "react";
import { ArrowLeft, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  isUni: boolean;
  isSMP: boolean;
  isSMA: boolean;
  isKids: boolean;
  textPrimary: string;
}

export function ProfileHeader({ isUni, isSMP, isSMA, isKids, textPrimary }: ProfileHeaderProps) {
  const router = useRouter();

  return (
    <header className={cn(
      "sticky top-0 z-30 px-4 h-16 flex items-center justify-between border-b backdrop-blur-md transition-colors",
      // UNI THEME: Fully transparent glass header
      isUni ? "bg-slate-950/40 border-white/5" :
      isSMP ? "bg-white/70 border-white/40 shadow-sm" :
      isSMA ? "bg-slate-950/80 border-white/10" :
      "bg-white/80 border-slate-200"
    )}>
      <div className={cn("flex items-center gap-4 w-full max-w-6xl mx-auto", isUni ? "justify-between" : "")}>
        <button 
          onClick={() => router.back()} 
          className={cn(
            "p-2 rounded-full transition-all",
            isKids ? "text-gray-600 hover:bg-black/5" : 
            // UNI: Subtle hover effect
            isUni ? "text-slate-400 hover:text-white hover:bg-white/10" :
            isSMA ? "text-slate-300 hover:bg-white/10" : 
            "text-slate-600 hover:bg-black/5"
          )}
        >
          <ArrowLeft size={20} />
        </button>
        
        {/* Title is centered or left aligned based on design, keeping it simple here */}
        <h1 className={cn("text-lg font-bold flex-1", textPrimary, isUni && "text-center pr-10")}>Profil Saya</h1>
        
        <button 
          onClick={() => router.push('/profile/edit')} 
          className={cn(
            "p-2 rounded-full transition-all",
            isKids ? "text-sky-600 bg-sky-100 hover:bg-sky-200" : 
            // UNI: Matching glass button
            isUni ? "text-slate-400 hover:text-white hover:bg-white/10" :
            isSMA ? "text-slate-300 hover:text-white hover:bg-white/10" :
            "text-slate-600 hover:bg-slate-100"
          )}
          title="Edit Profil"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}