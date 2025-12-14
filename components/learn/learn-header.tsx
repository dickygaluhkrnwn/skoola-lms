"use client";

import React from "react";
import { Star, Flame, Plus, GraduationCap, Sparkles, User, Bell, Grid, BookOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/lib/types/user.types";
import { Button } from "@/components/ui/button";

interface LearnHeaderProps {
  theme: string;
  userProfile?: UserProfile | null;
  onOpenJoinModal?: () => void;
  activeTab: "classes" | "modules";
  setActiveTab: (tab: "classes" | "modules") => void;
}

export function LearnHeader({ theme, userProfile, onOpenJoinModal, activeTab, setActiveTab }: LearnHeaderProps) {
  
  // Helper styling based on theme
  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  return (
    <header className={cn(
      "sticky top-0 z-40 backdrop-blur-md border-b shadow-sm px-4 md:px-8 py-4 transition-all duration-300 flex flex-col md:flex-row justify-between items-center gap-4",
      // Theme Specific Backgrounds
      isKids ? "bg-white/90 border-b-4 border-sky-100" : 
      isSMP ? "bg-white/80 border-violet-100/50" :
      isSMA ? "bg-slate-950/80 border-white/5 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/50" : // HUD Style for SMA
      isUni ? "bg-slate-900/80 border-slate-800 text-white backdrop-blur-md" :
      "bg-white/90 border-zinc-200"
    )}>
      
      {/* LEFT SECTION: Search Bar */}
      <div className={cn("relative flex-1 w-full md:max-w-lg", isKids ? "order-2 md:order-1" : "")}>
        <Search className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5",
          (isUni || isSMA) ? "text-slate-500" : "text-slate-400"
        )} />
        <input 
          type="text" 
          placeholder={isKids ? "Cari petualangan..." : "Cari kelas atau materi..."}
          className={cn(
            "w-full pl-12 pr-4 py-3 rounded-2xl outline-none transition-all",
            isKids ? "border-2 border-sky-100 focus:border-sky-300 bg-white placeholder:text-sky-300 text-sky-800" : 
            isSMP ? "border border-violet-200 focus:border-violet-400 bg-white placeholder:text-slate-400" :
            isSMA ? "bg-slate-900 border border-slate-700 focus:border-teal-500 text-slate-200 placeholder:text-slate-600 rounded-lg" :
            isUni ? "bg-slate-900/50 border border-white/10 focus:border-indigo-500/50 text-white placeholder:text-slate-500 backdrop-blur-sm" :
            "border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20"
          )}
        />
      </div>

      {/* RIGHT SECTION: Tabs & Actions */}
      <div className={cn("flex items-center gap-3 w-full md:w-auto justify-end", isKids ? "order-1 md:order-2" : "")}>
        
        {/* Tab Switcher (Visible on Desktop) */}
        <div className={cn(
          "hidden md:flex p-1 rounded-xl gap-1 mr-2",
          (isUni || isSMA) ? "bg-slate-900 border border-white/10" : "bg-white border border-slate-100"
        )}>
           <button
             onClick={() => setActiveTab("classes")}
             className={cn(
               "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
               activeTab === "classes" 
                 ? (isUni ? "bg-indigo-600 text-white" : isSMA ? "bg-teal-600 text-slate-900" : "bg-slate-100 text-slate-800")
                 : "text-slate-500 hover:text-slate-700"
             )}
           >
             <Grid size={16} /> Kelas
           </button>
           <button
             onClick={() => setActiveTab("modules")}
             className={cn(
               "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
               activeTab === "modules" 
                 ? (isUni ? "bg-indigo-600 text-white" : isSMA ? "bg-teal-600 text-slate-900" : "bg-slate-100 text-slate-800")
                 : "text-slate-500 hover:text-slate-700"
             )}
           >
             <BookOpen size={16} /> Modul
           </button>
        </div>

        {/* Notification */}
        <Button 
          variant="ghost" 
          size="icon"
          className={cn(
            "rounded-xl relative",
            isKids ? "bg-white text-orange-400 hover:bg-orange-50 hover:text-orange-500 shadow-sm" : 
            (isUni || isSMA) ? "text-slate-400 hover:text-white hover:bg-white/10" :
            "text-slate-500 hover:bg-slate-100"
          )}
        >
          <Bell size={isKids ? 24 : 20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
        </Button>

      </div>
    </header>
  );
}