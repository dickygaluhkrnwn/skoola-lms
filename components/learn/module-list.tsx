"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Play, BookOpen, CheckCircle, ShieldAlert, Terminal, Cpu, FileText, Gamepad2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

// Kita gunakan interface yang lebih fleksibel untuk modul
interface ModuleItem {
  id: string;
  title: string;
  description?: string;
  type?: 'video' | 'quiz' | 'game' | 'article' | 'map' | string;
  isLocked?: boolean;
  thumbnailUrl?: string;
  // Field lain yang mungkin ada
}

interface ModuleListProps {
  modules: ModuleItem[];
}

export function ModuleList({ modules }: ModuleListProps) {
  const router = useRouter();
  const { theme } = useTheme();

  // Helper Theme
  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  // Helper Icon
  const getIcon = (type?: string) => {
      switch(type) {
          case 'video': return <Play size={20} className="ml-0.5" />;
          case 'quiz': return <FileText size={20} />;
          case 'game': return <Gamepad2 size={20} />;
          case 'map': return <MapPin size={20} />;
          default: return <BookOpen size={20} />;
      }
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between mb-2">
        <h2 className={cn(
           "text-sm font-bold uppercase tracking-wider",
           isKids ? "text-slate-700" :
           isSMA ? "text-teal-400 font-mono tracking-[0.2em] text-xs" : // SMA Tech Font
           isUni ? "text-slate-400" : "text-slate-700"
        )}>
           {isSMA ? "// QUEST LOG" : "Modul Pembelajaran"}
        </h2>
        <span className={cn(
           "text-xs px-2 py-1 rounded-md font-mono font-bold",
           isSMP ? "bg-violet-100 text-violet-700" :
           isSMA ? "bg-teal-950/50 text-teal-300 border border-teal-500/30 shadow-[0_0_10px_rgba(45,212,191,0.2)]" : // SMA Tech Badge
           isUni ? "text-slate-300 bg-slate-800" : "text-slate-500 bg-slate-100"
        )}>
           {modules.length} {isSMA ? "NODES" : "Unit"}
        </span>
      </div>
      
      <div className="grid gap-3">
        {modules.map((modul, idx) => {
          const isLocked = modul.isLocked;
          
          return (
            <motion.div
              key={modul.id}
              initial={{ opacity: 0, x: -20 }} // Tech slide-in effect
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={!isLocked ? { scale: 1.01, x: 4 } : {}}
              className={cn(
                "group relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer overflow-hidden",
                // Theme Logic
                isKids 
                  ? (isLocked ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-sky-100 hover:border-sky-300 hover:shadow-sky-100") 
                  : isSMP
                    ? (isLocked 
                        ? "bg-white/40 border-slate-100 opacity-60 grayscale" 
                        : "bg-white/80 backdrop-blur-sm border-white/60 shadow-sm hover:shadow-md hover:border-violet-300")
                  : isSMA
                    ? (isLocked
                        ? "bg-slate-900/40 border-white/5 opacity-50 grayscale" // Darker locked state
                        : "bg-slate-950/60 backdrop-blur-md border-white/10 hover:border-teal-500/40 hover:bg-slate-900/80 hover:shadow-[0_0_20px_rgba(45,212,191,0.1)]") // Techy unlocked
                  : isUni 
                    ? (isLocked ? "bg-slate-900 border-slate-800 opacity-50" : "bg-slate-800 border-slate-700 hover:border-blue-500")
                    : (isLocked ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md")
              )}
              onClick={() => !isLocked && router.push(`/lesson/${modul.id}`)}
            >
              {/* SMP Accent Line */}
              {isSMP && !isLocked && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              
              {/* SMA Tech Decoration (Side Glow & Corner Accent) */}
              {isSMA && !isLocked && (
                  <>
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-teal-500 to-transparent shadow-[0_0_8px_#2dd4bf]" />
                    <div className="absolute right-0 top-0 w-4 h-4 border-t border-r border-teal-500/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </>
              )}

              {/* Icon Box */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors z-10",
                isLocked 
                  ? (isUni || isSMA ? "bg-slate-800/50 text-slate-600 border border-white/5" : "bg-slate-100 text-slate-400 grayscale") 
                  : (isKids ? "bg-sky-50 text-sky-500" : 
                     isSMP ? "bg-gradient-to-br from-violet-100 to-fuchsia-50 text-violet-600 group-hover:from-violet-500 group-hover:to-fuchsia-500 group-hover:text-white shadow-sm" :
                     isSMA ? "bg-slate-900 border border-teal-500/20 text-teal-400 shadow-[inset_0_0_10px_rgba(45,212,191,0.1)] group-hover:text-teal-300 group-hover:shadow-[0_0_15px_rgba(45,212,191,0.2)] transition-all" :
                     isUni ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600")
              )}>
                {/* Tech Icons for SMA */}
                {isSMA 
                    ? (isLocked ? <ShieldAlert size={20} /> : <Terminal size={20} />) 
                    : getIcon(modul.type)
                }
              </div>

              {/* Text Content */}
              <div className={cn("flex-1 min-w-0 z-10", isSMA && "font-sans")}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn(
                     "font-bold text-sm truncate transition-colors",
                     isLocked 
                        ? (isUni || isSMA ? "text-slate-500" : "text-slate-400") 
                        : (isKids ? "text-slate-800 group-hover:text-sky-700" : 
                           isSMP ? "text-slate-800 group-hover:text-violet-700" :
                           isSMA ? "text-slate-200 group-hover:text-teal-300 tracking-wide" :
                           isUni ? "text-slate-200 group-hover:text-white" : "text-slate-800 group-hover:text-blue-700")
                  )}>
                    {modul.title}
                  </h3>
                  {!isLocked && (
                     <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                        isKids ? "bg-green-100 text-green-700" : 
                        isSMP ? "bg-fuchsia-100 text-fuchsia-700" :
                        isSMA ? "bg-teal-950/50 text-teal-400 border border-teal-500/30 font-mono" :
                        isUni ? "bg-emerald-900/50 text-emerald-400" : "bg-green-100 text-green-700"
                     )}>
                        {isSMA ? "ACTIVE" : "Terbuka"}
                     </span>
                  )}
                </div>
                <p className={cn(
                    "text-xs line-clamp-1", 
                    (isUni || isSMA) ? "text-slate-500" : "text-slate-500",
                    isSMA && "font-mono text-[10px] opacity-70"
                )}>
                   {modul.description || "Pelajari materi ini untuk lanjut."}
                </p>
              </div>

              {/* Action / Status */}
              <div className="shrink-0 z-10">
                {isLocked ? (
                  <Lock size={18} className={cn((isUni || isSMA) ? "text-slate-600" : "text-slate-300")} />
                ) : (
                  <div className={cn(
                     "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                     isKids 
                        ? "bg-sky-100 text-sky-600 group-hover:bg-sky-500 group-hover:text-white" 
                        : isSMP 
                           ? "bg-white text-violet-500 shadow-sm group-hover:scale-110 group-hover:text-fuchsia-600 border border-violet-100"
                        : isSMA
                           ? "bg-transparent text-teal-500 border border-teal-500/30 group-hover:bg-teal-500 group-hover:text-slate-900 group-hover:shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                        : isUni 
                           ? "bg-slate-700 text-slate-300 group-hover:bg-blue-600 group-hover:text-white"
                           : "bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white"
                  )}>
                    {isSMA ? <Cpu size={14} className={cn("transition-transform group-hover:rotate-90")} /> : <Play size={14} className="ml-0.5" />}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}