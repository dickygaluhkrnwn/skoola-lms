"use client";

import React from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FriendsTabProps {
  isSMP: boolean;
  isSMA: boolean;
  isUni: boolean;
  textPrimary: string;
  textMuted: string;
}

export function FriendsTab({ 
  isSMP, 
  isSMA, 
  isUni, 
  textPrimary, 
  textMuted 
}: FriendsTabProps) {
  return (
    <div className={cn(
      "text-center py-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all",
      // UNI & SMA: Glass effect dashed border
      (isUni || isSMA) ? "border-white/10 bg-white/5 backdrop-blur-sm" : 
      isSMP ? "border-violet-200 bg-white/40" : 
      "border-slate-200 bg-white"
    )}>
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
        isUni ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]" :
        isSMA ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" :
        isSMP ? "bg-violet-100 text-violet-600" :
        "bg-slate-100 text-slate-300"
      )}>
         <Users size={32} />
      </div>
      <h3 className={cn("font-bold mb-1 text-lg", textPrimary)}>Belum Ada Teman</h3>
      <p className={cn("text-sm max-w-xs mx-auto mb-6", textMuted)}>
        Ajak teman sekelasmu untuk bergabung di Skoola agar bisa saling melihat progress!
      </p>
      
      <Button 
        className={cn(
           "font-bold px-8",
           isSMP ? "bg-violet-600 hover:bg-violet-700" : 
           isSMA ? "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20" : 
           isUni ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border-0" : 
           ""
        )} 
        variant={isUni || isSMA ? "primary" : "outline"} // Uni use primary for CTA punch
      >
        Undang Teman
      </Button>
    </div>
  );
}