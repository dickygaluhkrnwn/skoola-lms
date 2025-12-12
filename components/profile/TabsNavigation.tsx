"use client";

import React from "react";
import { Award, Activity, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabsNavigationProps {
  activeTab: "achievements" | "stats" | "friends";
  setActiveTab: (tab: "achievements" | "stats" | "friends") => void;
  theme: string;
  isKids: boolean;
  isSMP: boolean;
  isSMA: boolean;
  isUni: boolean;
}

export function TabsNavigation({ 
  activeTab, 
  setActiveTab, 
  theme,
  isKids,
  isSMP,
  isSMA,
  isUni
}: TabsNavigationProps) {
  return (
    <div className={cn(
      "flex p-1 shadow-sm border transition-all sticky top-20 z-20 backdrop-blur-xl",
      isKids ? "bg-white/80 rounded-2xl border-sky-100" : 
      isSMP ? "bg-white/60 rounded-xl border-white/50" :
      isSMA ? "bg-slate-950/60 rounded-lg border-white/10" :
      // UNI THEME: Fully Glassy
      isUni ? "bg-slate-950/40 rounded-lg border-white/5" :
      "bg-white/80 rounded-lg border-slate-200"
    )}>
      <TabButton active={activeTab === "achievements"} onClick={() => setActiveTab("achievements")} label="Pencapaian" icon={<Award size={16} />} isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni} />
      <TabButton active={activeTab === "stats"} onClick={() => setActiveTab("stats")} label="Statistik" icon={<Activity size={16} />} isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni} />
      <TabButton active={activeTab === "friends"} onClick={() => setActiveTab("friends")} label="Teman" icon={<Users size={16} />} isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni} />
    </div>
  );
}

function TabButton({ active, onClick, label, icon, isKids, isSMP, isSMA, isUni }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all",
        isKids ? "rounded-xl" : "rounded-md",
        active 
          ? (
             isKids ? "bg-sky-100 text-sky-700 shadow-sm" : 
             isSMP ? "bg-violet-100 text-violet-700 shadow-sm border border-violet-200" :
             isSMA ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm" :
             // UNI THEME: Neon Active State
             isUni ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]" : 
             "bg-primary/10 text-primary shadow-sm"
            ) 
          : ((isUni || isSMA) ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50")
      )}
    >
      {icon} {label}
    </button>
  );
}