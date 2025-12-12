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
          icon={<Star size={20} className={cn(isKids ? "text-yellow-500 fill-yellow-500" : isSMP ? "text-violet-500 fill-violet-500" : "")} />} 
          theme={theme}
          color="yellow"
          isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA}
       />
       <StatBox 
          label="Streak" 
          value={streak} 
          icon={<Flame size={20} className="text-orange-500 fill-orange-500" />} 
          theme={theme}
          color="orange"
          isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA}
       />
       <StatBox 
          label="Badges" 
          value={badgeCount} 
          icon={<Award size={20} className="text-blue-500" />} 
          theme={theme}
          color="blue"
          isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA}
       />
    </div>
  );
}

function StatBox({ icon, label, value, theme, color, isKids, isSMP, isUni, isSMA }: any) {
  const colorMap: any = {
     yellow: isSMP ? "bg-violet-100" : isSMA ? "bg-white/10 text-teal-400" : "bg-yellow-100",
     orange: isSMP ? "bg-fuchsia-100" : isSMA ? "bg-white/10 text-teal-400" : "bg-orange-100",
     blue: isSMP ? "bg-cyan-100" : isSMA ? "bg-white/10 text-teal-400" : "bg-blue-100",
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center border transition-all p-4 rounded-2xl",
      isKids ? "bg-white border-yellow-100 shadow-sm" : 
      isSMP ? "bg-white/70 backdrop-blur-md border-white/60 shadow-sm hover:border-violet-200" :
      isSMA ? "bg-white/5 backdrop-blur-xl border-white/10 shadow-sm hover:border-teal-500/30 text-slate-200" :
      isUni ? "bg-slate-800 border-slate-700 text-slate-200" :
      "bg-white border-slate-100 shadow-sm"
    )}>
      <div className={cn("p-2 rounded-full mb-2", colorMap[color])}>
         {icon}
      </div>
      <div className={cn("font-bold text-xl")}>{value}</div>
      <div className={cn("uppercase font-bold tracking-wider text-[10px]", (isUni || isSMA) ? "text-slate-400" : "text-muted-foreground")}>{label}</div>
    </div>
  );
}