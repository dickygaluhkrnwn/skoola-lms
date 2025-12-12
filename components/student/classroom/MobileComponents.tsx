"use client";

import React from "react";
import { ArrowLeft, Bell, LayoutDashboard, Map, Backpack, BookOpen, Scroll, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";

interface ClassroomMobileHeaderProps {
  classData: any;
  isKids: boolean;
  isUni: boolean;
  isSMP: boolean;
}

export function ClassroomMobileHeader({ classData, isKids, isUni, isSMP }: ClassroomMobileHeaderProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isSMA = theme === "sma";

  return (
    <div className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-30 px-4 h-16 flex items-center justify-between border-b shadow-sm transition-all duration-300",
        // THEME STYLES
        isKids ? "bg-white border-primary/20" : 
        isSMP ? "bg-white/80 backdrop-blur-md border-white/20" : 
        
        // UNI THEME: Deep Glass
        isUni ? "bg-slate-950/80 backdrop-blur-xl border-white/5 text-slate-200" :
        
        // SMA THEME: Dark Glass
        isSMA ? "bg-slate-950/80 backdrop-blur-xl border-white/10 text-slate-300" :
        
        "bg-white border-slate-200"
    )}>
       <div className="flex items-center gap-3 overflow-hidden">
          <Button 
             onClick={() => router.push("/learn")} 
             variant="ghost" 
             size="icon" 
             className={cn(
                "rounded-full shrink-0 transition-colors", 
                (isUni || isSMA) ? "text-slate-400 hover:text-white hover:bg-white/10" : "hover:bg-black/5"
             )}
          >
             <ArrowLeft size={20} className={cn(isKids ? "text-primary" : (isUni || isSMA) ? "text-current" : "text-slate-600")} />
          </Button>
          <span className={cn(
              "font-bold truncate text-lg", 
              isKids ? "font-display text-primary" : (isUni || isSMA) ? "text-white tracking-tight" : "text-slate-800"
          )}>
              {classData?.name}
          </span>
       </div>
       <Button variant="ghost" size="icon" className={cn("rounded-full relative", (isUni || isSMA) && "text-slate-400 hover:text-white hover:bg-white/10")}>
          <Bell size={20} className={cn(isKids ? "text-primary" : (isUni || isSMA) ? "text-current" : "text-slate-500")} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
       </Button>
    </div>
  );
}

interface ClassroomMobileNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isKids: boolean;
  isUni: boolean;
  isSMP: boolean;
  theme: string;
}

export function ClassroomMobileNav({ activeTab, setActiveTab, isKids, isUni, isSMP, theme }: ClassroomMobileNavProps) {
  const isSMA = theme === "sma";

  return (
    <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around p-2 pb-safe border-t transition-all duration-300",
        // THEME STYLES
        isKids ? "bg-white border-primary/20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" : 
        isSMP ? "bg-white/80 backdrop-blur-xl border-white/50 rounded-t-2xl shadow-[0_-8px_32px_0_rgba(139,92,246,0.15)] mx-2 mb-2 pb-3" : 
        
        // UNI THEME: Floating Glass Bar
        isUni ? "bg-slate-950/80 backdrop-blur-2xl border-white/10 mx-2 mb-2 pb-3 rounded-2xl border shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" :
        
        // SMA THEME: Sleek Dark Bar
        isSMA ? "bg-slate-950/90 backdrop-blur-xl border-t border-white/10 mx-0 pb-3 text-slate-400 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]" :
        
        "bg-white border-slate-200"
    )}>
       <MobileNavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={isKids ? <LayoutDashboard /> : <LayoutDashboard />} label="Lobi" theme={theme} isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni} />
       <MobileNavItem active={activeTab === "adventure"} onClick={() => setActiveTab("adventure")} icon={<Map />} label="Peta" theme={theme} isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni} />
       <MobileNavItem active={activeTab === "materials"} onClick={() => setActiveTab("materials")} icon={isKids ? <Backpack /> : <BookOpen />} label="Bekal" theme={theme} isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni} />
       <MobileNavItem active={activeTab === "assignments"} onClick={() => setActiveTab("assignments")} icon={isKids ? <Scroll /> : <ClipboardList />} label="Misi" theme={theme} isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni} />
    </div>
  );
}

function MobileNavItem({ active, onClick, icon, label, isKids, isSMP, isSMA, isUni }: any) {
  // Active Color Logic
  const activeColor = isKids ? "text-primary" 
    : isSMP ? "text-violet-600" 
    : isSMA ? "text-teal-400" 
    : isUni ? "text-indigo-400" 
    : "text-blue-600";
  
  return (
     <button onClick={onClick} className={cn(
         "flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative",
         active ? activeColor : "text-slate-400",
         isKids && active && "bg-primary/5 scale-110",
         (isSMA || isUni) && active && "bg-white/5 scale-105",
         (isSMA || isUni) && !active && "text-slate-500 hover:text-slate-300"
     )}>
        {/* Glow Effect for Uni */}
        {isUni && active && <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full" />}
        
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24, className: active ? "fill-current opacity-20 relative z-10" : "relative z-10" }) : icon}
        <span className={cn("text-[10px] font-bold relative z-10", isKids && "font-display tracking-wide")}>{label}</span>
     </button>
  )
}