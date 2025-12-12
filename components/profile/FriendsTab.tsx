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
      "text-center py-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center",
      isUni ? "border-slate-800 bg-slate-900/50" : isSMP ? "border-violet-200 bg-white/40" : isSMA ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
    )}>
      <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", (isUni || isSMA) ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-300")}>
         <Users size={32} />
      </div>
      <h3 className={cn("font-bold mb-1 text-lg", textPrimary)}>Belum Ada Teman</h3>
      <p className={cn("text-sm max-w-xs mx-auto", textMuted)}>Ajak teman sekelasmu untuk bergabung di Skoola agar bisa saling melihat progress!</p>
      <Button className={cn("mt-6", isSMP ? "bg-violet-600 hover:bg-violet-700" : isSMA ? "bg-teal-600 hover:bg-teal-700 text-white" : "")} variant={isUni || isSMA ? "outline" : "primary"}>Undang Teman</Button>
    </div>
  );
}