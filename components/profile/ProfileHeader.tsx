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
      "sticky top-0 z-30 px-4 h-16 flex items-center justify-between border-b backdrop-blur-md bg-opacity-80 transition-colors",
      isUni ? "bg-slate-950/80 border-slate-800" : 
      isSMP ? "bg-white/70 border-white/40 shadow-sm" : 
      isSMA ? "bg-slate-950/80 border-white/10" :
      "bg-white/80 border-slate-200"
    )}>
      <div className="flex items-center gap-4 w-full max-w-6xl mx-auto">
        <button 
          onClick={() => router.back()} 
          className={cn(
            "p-2 rounded-full transition-all hover:bg-black/5",
            isKids ? "text-gray-600" : (isUni || isSMA) ? "text-slate-300 hover:bg-white/10" : "text-slate-600"
          )}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={cn("text-lg font-bold flex-1", textPrimary)}>Profil Saya</h1>
        <button 
          onClick={() => router.push('/profile/edit')} 
          className={cn(
            "p-2 rounded-full transition-all",
            isKids ? "text-sky-600 bg-sky-100 hover:bg-sky-200" : 
            (isUni || isSMA) ? "text-slate-300 hover:text-white hover:bg-white/10" :
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