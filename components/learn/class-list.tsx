"use client";

import React from "react";
import { motion } from "framer-motion";
import { School, ChevronRight, GraduationCap, Zap, Hash, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ClassListProps {
  classes: any[]; 
  theme: string;
  onOpenJoinModal: () => void;
}

export function ClassList({ classes, theme, onOpenJoinModal }: ClassListProps) {
  const router = useRouter();

  // Helper Theme
  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  if (classes.length === 0) {
    return (
      <div className={cn(
        "text-center py-12 px-6 border-2 border-dashed transition-all",
        isKids ? "border-sky-200 bg-sky-50 rounded-3xl" : 
        isSMP ? "border-violet-300 bg-violet-50/50 backdrop-blur-sm rounded-2xl" :
        isSMA ? "border-white/10 bg-slate-900/50 backdrop-blur-md rounded-xl" :
        isUni ? "border-slate-700 bg-slate-800/50 rounded-xl" :
        "border-zinc-200 bg-zinc-50 rounded-xl"
      )}>
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors",
          isKids ? "bg-white border-4 border-sky-100 text-sky-400 animate-bounce" : 
          isSMP ? "bg-white shadow-lg shadow-violet-200 text-violet-500" :
          isSMA ? "bg-slate-800 border border-white/10 text-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.2)]" :
          isUni ? "bg-slate-700 text-slate-400" :
          "bg-white text-zinc-400 shadow-sm"
        )}>
          {isSMA ? <Zap size={40} /> : <School size={40} />}
        </div>
        <h3 className={cn("font-bold text-lg", 
           isKids ? "text-sky-800" : isSMP ? "text-violet-900" : isSMA ? "text-slate-100" : isUni ? "text-white" : "text-foreground"
        )}>
          {isKids ? "Belum ada kelas seru!" : isSMA ? "No Active Classes" : "Belum masuk kelas"}
        </h3>
        <p className={cn("text-sm mt-2 mb-6", isSMA ? "text-slate-400 font-mono text-xs" : isUni ? "text-slate-400" : "text-muted-foreground")}>
          {isKids ? "Minta kode ajaib dari gurumu untuk mulai belajar bareng teman!" : isSMA ? "Input access code to sync with classroom network." : "Minta Kode Kelas ke gurumu untuk mulai belajar bersama."}
        </p>
        <Button 
          onClick={onOpenJoinModal} 
          className={cn(
            isKids ? "bg-sky-500 hover:bg-sky-600 text-white rounded-2xl px-8 py-6 shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none transition-all" : 
            isSMP ? "bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-200" :
            isSMA ? "bg-teal-600 hover:bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)] border border-teal-400/20 rounded-md uppercase tracking-wider text-xs font-bold" :
            "bg-primary hover:bg-primary/90 rounded-lg"
          )}
        >
          {isSMA ? "Connect Class" : "Join Kelas Sekarang"}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {classes.map((cls) => (
        <motion.div 
          key={cls.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: isKids ? 1.03 : 1.02, translateY: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/classroom/${cls.id}`)}
          className={cn(
            "p-5 border shadow-sm transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-full min-h-[180px]",
            // Styles per Theme
            isKids ? "bg-white rounded-3xl border-2 border-sky-100 hover:border-sky-300 hover:shadow-sky-100 hover:shadow-md" : 
            isSMP ? "bg-white/80 backdrop-blur-md rounded-2xl border-violet-100 hover:border-violet-300 hover:shadow-[0_8px_30px_rgb(139,92,246,0.15)]" :
            isSMA ? "bg-white/5 backdrop-blur-xl border-white/10 hover:border-teal-500/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] rounded-lg" : // Glass Bento
            isUni ? "bg-slate-900/50 border-white/5 hover:bg-white/10 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] rounded-xl" :
            "bg-white rounded-xl border-zinc-200 hover:border-primary/50 hover:shadow-md"
          )}
        >
          {/* Background Decor */}
          <div className={cn(
            "absolute top-0 right-0 w-24 h-24 rounded-full -mr-10 -mt-10 opacity-10 transition-colors pointer-events-none",
            isKids ? "bg-sky-400" : isSMP ? "bg-violet-600" : isSMA ? "bg-teal-400 opacity-20 blur-xl" : isUni ? "bg-indigo-500 blur-2xl opacity-20" : "bg-primary"
          )}/>
          
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div className={cn(
              "p-3 transition-colors flex items-center justify-center",
              isKids ? "bg-sky-50 text-sky-600 border border-sky-100 rounded-2xl" : 
              isSMP ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-200 rounded-2xl" :
              isSMA ? "bg-slate-900 border border-white/10 text-teal-400 shadow-inner rounded-lg" :
              isUni ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-900/50" :
              "bg-primary/10 text-primary rounded-2xl"
            )}>
              <School size={24} />
            </div>
            
            <div className="flex flex-col items-end gap-1">
               <span className={cn(
                 "text-[10px] px-2 py-1 font-mono font-bold border",
                 isKids ? "bg-yellow-50 text-yellow-700 border-yellow-200 rounded-lg" : 
                 isSMP ? "bg-violet-50 text-violet-600 border-violet-100 rounded-lg" :
                 isSMA ? "bg-teal-900/30 text-teal-300 border-teal-500/30 rounded flex items-center gap-1" :
                 isUni ? "bg-slate-950 text-indigo-300 border-indigo-500/30 rounded" :
                 "bg-zinc-50 border-zinc-200 text-zinc-500 rounded"
               )}>
                 {isSMA && <Hash size={10} />}
                 {cls.code}
               </span>
               {cls.category && (
                  <span className={cn(
                    "text-[10px] uppercase font-bold tracking-wider",
                    (isSMA || isUni) ? "text-slate-400" : "text-muted-foreground opacity-60"
                  )}>
                    {cls.category}
                  </span>
               )}
            </div>
          </div>
          
          <div>
             <h3 className={cn(
               "font-bold text-lg transition-colors relative z-10 truncate",
               isKids ? "text-slate-700 group-hover:text-sky-600" : 
               isSMP ? "text-slate-800 group-hover:text-violet-600" :
               isSMA ? "text-slate-200 group-hover:text-teal-300 tracking-tight" :
               isUni ? "text-slate-100 group-hover:text-indigo-300" :
               "text-foreground group-hover:text-primary"
             )}>
               {cls.name}
             </h3>
             <p className={cn(
               "text-xs mt-1 line-clamp-2 h-8 relative z-10",
               (isSMA || isUni) ? "text-slate-400 font-medium" : "text-muted-foreground"
             )}>
               {cls.description || "Tidak ada deskripsi kelas."}
             </p>
          </div>
          
          <div className={cn(
            "mt-4 pt-3 border-t flex justify-between items-center text-xs relative z-10",
            (isSMA || isUni) ? "border-white/5 text-slate-400" : "border-border text-muted-foreground"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                isKids ? "bg-orange-100 text-orange-600 border-orange-200" : 
                isSMP ? "bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200" :
                isSMA ? "bg-indigo-900/50 text-indigo-300 border-indigo-500/30" :
                isUni ? "bg-slate-800 text-slate-300 border-slate-700" :
                "bg-gray-200 text-gray-600 border-transparent"
              )}>
                {cls.teacherName?.[0] || "G"}
              </div>
              <span className={cn(
                 isKids && "font-bold text-slate-600",
                 (isSMA || isUni) && "text-slate-300 font-medium"
              )}>
                 {cls.teacherName || "Guru"}
              </span>
            </div>
            
            <div className={cn(
               "flex items-center gap-1 transition-transform group-hover:translate-x-1",
               isKids ? "text-sky-400" : 
               isSMP ? "text-violet-500 font-bold" : 
               isSMA ? "text-teal-400 font-bold tracking-wide uppercase text-[10px]" :
               isUni ? "text-indigo-400 font-bold" :
               "text-primary"
            )}>
               <span className="font-bold">{isSMA ? "Access" : "Masuk"}</span> <ArrowRight size={14} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}