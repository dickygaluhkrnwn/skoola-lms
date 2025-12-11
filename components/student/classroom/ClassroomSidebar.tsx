"use client";

import React from "react";
import { ArrowLeft, LayoutDashboard, Map, BookOpen, ClipboardList, Users, Backpack, Scroll } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ClassroomSidebarProps {
  classData: any;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isKids: boolean;
  isUni: boolean;
  isSMP: boolean;
  theme: string;
}

export function ClassroomSidebar({ 
  classData, 
  activeTab, 
  setActiveTab, 
  isKids, 
  isUni, 
  isSMP, 
  theme 
}: ClassroomSidebarProps) {
  const router = useRouter();

  return (
    <aside className={cn(
        "hidden md:flex w-72 flex-col sticky top-0 h-screen z-20 border-r transition-all",
        isKids ? "bg-white border-r-4 border-primary/20 shadow-xl" : 
        isSMP ? "m-4 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(139,92,246,0.15)] h-[calc(100vh-2rem)]" :
        isUni ? "bg-slate-900 border-slate-800" :
        "bg-white border-slate-200"
    )}>
       <div className={cn(
           "p-6 flex items-center gap-3 transition-colors",
           isKids ? "bg-secondary text-secondary-foreground border-b-4 border-primary/10" : 
           isSMP ? "bg-gradient-to-b from-white/50 to-transparent rounded-t-3xl border-b border-white/20" :
           isUni ? "bg-slate-800 border-slate-700 text-white border-b" :
           "border-b border-slate-100"
       )}>
          <Button 
              variant={isKids ? "secondary" : "ghost"} 
              size="icon"
              onClick={() => router.push("/learn")} 
              className={isKids ? "rounded-xl border-2 shadow-sm shrink-0" : isSMP ? "rounded-full shrink-0 hover:bg-violet-100 text-violet-600" : "rounded-full shrink-0"}
          >
             <ArrowLeft size={isKids ? 24 : 20} />
          </Button>
          <div className="overflow-hidden">
              <span className={cn("font-bold text-lg truncate block", isKids && "font-display text-xl", isSMP && "text-slate-800")} title={classData?.name}>
                  {classData?.name}
              </span>
              <span className={cn("text-xs truncate block", isSMP ? "text-violet-500 font-medium" : "opacity-70")}>{classData?.category || "Kelas Umum"}</span>
          </div>
       </div>
       
       <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className={cn("px-2 text-xs font-bold uppercase tracking-wider mb-2 opacity-50", isUni ? "text-slate-400" : "text-slate-500")}>
              {isKids ? "Navigasi Markas" : "Menu Kelas"}
          </div>
          
          <NavItem 
              active={activeTab === "dashboard"} 
              onClick={() => setActiveTab("dashboard")} 
              icon={isKids ? <LayoutDashboard size={24}/> : <LayoutDashboard size={20}/>} 
              label={isKids ? "Lobi Utama" : "Beranda"} 
              theme={theme}
              isSMP={isSMP}
              isUni={isUni}
              isKids={isKids}
          />
          <NavItem 
              active={activeTab === "adventure"} 
              onClick={() => setActiveTab("adventure")} 
              icon={isKids ? <Map size={24}/> : <Map size={20}/>} 
              label={isKids ? "Peta Misi" : "Peta Belajar"} 
              theme={theme} 
              isSMP={isSMP}
              isUni={isUni}
              isKids={isKids}
          />
          
          <div className={cn("px-2 text-xs font-bold uppercase tracking-wider mt-6 mb-2 opacity-50", isUni ? "text-slate-400" : "text-slate-500")}>
              {isKids ? "Gudang Ilmu" : "Materi & Tugas"}
          </div>
          <NavItem 
              active={activeTab === "materials"} 
              onClick={() => setActiveTab("materials")} 
              icon={isKids ? <Backpack size={24}/> : <BookOpen size={20}/>} 
              label={isKids ? "Bekal Ilmu" : "Materi"} 
              theme={theme} 
              isSMP={isSMP}
              isUni={isUni}
              isKids={isKids}
          />
          <NavItem 
              active={activeTab === "assignments"} 
              onClick={() => setActiveTab("assignments")} 
              icon={isKids ? <Scroll size={24}/> : <ClipboardList size={20}/>} 
              label={isKids ? "Misi Rahasia" : "Tugas"} 
              theme={theme} 
              isSMP={isSMP}
              isUni={isUni}
              isKids={isKids}
          />
          
          <div className={cn("px-2 text-xs font-bold uppercase tracking-wider mt-6 mb-2 opacity-50", isUni ? "text-slate-400" : "text-slate-500")}>
              {isKids ? "Tim Kita" : "Anggota"}
          </div>
          <NavItem 
              active={activeTab === "people"} 
              onClick={() => setActiveTab("people")} 
              icon={isKids ? <Users size={24}/> : <Users size={20}/>} 
              label={isKids ? "Teman Seperjuangan" : "Anggota Kelas"} 
              theme={theme} 
              isSMP={isSMP}
              isUni={isUni}
              isKids={isKids}
          />
       </nav>

       <div className={cn("p-4 border-t", isKids ? "border-primary/10 bg-yellow-50" : isSMP ? "border-white/20 bg-violet-50/30 rounded-b-3xl" : "border-slate-100", isUni && "bg-slate-900 border-slate-800")}>
          <div className={cn("rounded-xl p-4 flex items-center gap-3", isKids ? "bg-white border-2 border-primary/20 shadow-sm" : isSMP ? "bg-white/60 backdrop-blur-sm border border-white/50" : "bg-slate-50", isUni && "bg-slate-800")}>
             <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", isKids ? "bg-primary text-white shadow-md border-2 border-white" : isSMP ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600")}>
                {classData?.teacherName?.charAt(0) || "G"}
             </div>
             <div className="overflow-hidden">
                <p className={cn("text-sm font-bold truncate", isKids ? "font-display text-primary" : "text-slate-700", isUni && "text-slate-200")}>{classData?.teacherName}</p>
                <p className={cn("text-xs truncate opacity-70", isUni ? "text-slate-400" : "text-slate-500")}>{isKids ? "Kapten Kelas" : "Wali Kelas"}</p>
             </div>
          </div>
       </div>
    </aside>
  );
}

function NavItem({ active, onClick, icon, label, theme, isKids, isUni, isSMP }: any) {
   if (isKids) {
       return (
          <button onClick={onClick} className={cn(
              "flex items-center gap-3 w-full px-4 py-3 my-1 rounded-xl transition-all text-sm font-bold border-2 border-transparent",
              active ? "bg-primary text-white shadow-md border-primary transform scale-105" : "text-slate-500 hover:bg-white hover:border-slate-200 hover:shadow-sm"
          )}>
             <span className={cn("transition-transform", active && "animate-bounce")}>{icon}</span> 
             <span className="font-display tracking-wide">{label}</span>
          </button>
       )
   }

   return (
      <button onClick={onClick} className={cn(
          "flex items-center gap-3 w-full px-4 py-3 rounded-r-xl transition-all text-sm font-bold border-l-4 border-transparent",
          // SMP Style
          isSMP && "rounded-xl my-1 border-l-0",
          isSMP && active ? "bg-violet-500/10 text-violet-700 border border-violet-200 shadow-sm" : 
          
          active ? (isUni ? "bg-slate-800 text-white border-blue-500" : "bg-blue-50 text-blue-600 border-blue-600") : 
          (isUni ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800")
      )}>
         <span className={cn(isSMP && active && "text-violet-600 scale-110")}>{icon}</span> {label}
      </button>
   )
}