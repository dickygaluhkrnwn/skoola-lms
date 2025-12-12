"use client";

import React from "react";
import { Star, Flame, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsOverviewProps {
  xp: number;
  streak: number;
  badgeCount: number;
  theme: string;
  isKids: boolean;
  isSMP: boolean;
  isUni: boolean;
  isSMA: boolean;
}

export function StatsOverview({ 
  xp, 
  streak, 
  badgeCount, 
  theme,
  isKids,
  isSMP,
  isUni,
  isSMA
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
       <StatBox 
          label="Total XP" 
          value={xp} 
          icon={<Star size={20} className={cn(isKids ? "text-yellow-500 fill-yellow-500" : isSMP ? "text-violet-500 fill-violet-500" : isUni ? "text-indigo-400 fill-indigo-400/20" : "")} />} 
          theme={theme}
          color="yellow"
          isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA}
       />
       <StatBox 
          label="Streak" 
          value={streak} 
          icon={<Flame size={20} className={cn("text-orange-500 fill-orange-500", isUni && "text-rose-500 fill-rose-500/20")} />} 
          theme={theme}
          color="orange"
          isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA}
       />
       <StatBox 
          label="Badges" 
          value={badgeCount} 
          icon={<Award size={20} className={cn("text-blue-500", isUni && "text-teal-400")} />} 
          theme={theme}
          color="blue"
          isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA}
       />
    </div>
  );
}

function StatBox({ icon, label, value, theme, color, isKids, isSMP, isUni, isSMA }: any) {
  const colorMap: any = {
     yellow: isSMP ? "bg-violet-100" : isSMA ? "bg-white/10 text-teal-400" : isUni ? "bg-indigo-500/20 text-indigo-300" : "bg-yellow-100",
     orange: isSMP ? "bg-fuchsia-100" : isSMA ? "bg-white/10 text-teal-400" : isUni ? "bg-rose-500/20 text-rose-300" : "bg-orange-100",
     blue: isSMP ? "bg-cyan-100" : isSMA ? "bg-white/10 text-teal-400" : isUni ? "bg-teal-500/20 text-teal-300" : "bg-blue-100",
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center border transition-all p-4 rounded-2xl group",
      isKids ? "bg-white border-yellow-100 shadow-sm" : 
      isSMP ? "bg-white/70 backdrop-blur-md border-white/60 shadow-sm hover:border-violet-200" :
      isSMA ? "bg-white/5 backdrop-blur-xl border-white/10 shadow-sm hover:border-teal-500/30 text-slate-200" :
      // UNI THEME: Glass & Hover Glow
      isUni ? "bg-white/5 backdrop-blur-xl border-white/10 text-slate-200 hover:border-indigo-500/40 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]" :
      "bg-white border-slate-100 shadow-sm"
    )}>
      <div className={cn("p-2 rounded-full mb-2 transition-transform group-hover:scale-110", colorMap[color])}>
         {icon}
      </div>
      <div className={cn("font-bold text-xl", isUni && "text-white")}>{value}</div>
      <div className={cn("uppercase font-bold tracking-wider text-[10px]", (isUni || isSMA) ? "text-slate-400" : "text-muted-foreground")}>{label}</div>
    </div>
  );
}