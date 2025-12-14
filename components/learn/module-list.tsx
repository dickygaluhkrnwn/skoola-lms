"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { BookOpen, PlayCircle, FileText, Lock, Gamepad2, MapPin } from "lucide-react"; 
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Kita gunakan interface yang lebih fleksibel untuk modul
interface ModuleItem {
  id: string;
  title: string;
  description?: string;
  type?: 'video' | 'quiz' | 'game' | 'article' | 'map' | string;
  isLocked?: boolean;
  thumbnailUrl?: string;
  duration?: string;
  readTime?: string;
  questions?: number;
}

interface ModuleListProps {
  theme: string;
}

export function ModuleList({ theme }: ModuleListProps) {
  const router = useRouter();

  // Helper Theme
  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  // Dummy Data untuk Modul (Nanti bisa diganti fetch real data)
  const modules: ModuleItem[] = [
    { id: "1", title: "Pengantar Aljabar Linear", type: "video", duration: "10 min" },
    { id: "2", title: "Dasar Pemrograman Python", type: "quiz", questions: 15 },
    { id: "3", title: "Sejarah Revolusi Industri", type: "reading", readTime: "5 min" },
  ];

  // Helper Icon
  const getIcon = (type?: string) => {
      switch(type) {
          case 'video': return <PlayCircle size={24} />;
          case 'quiz': return <FileText size={24} />;
          case 'game': return <Gamepad2 size={24} />;
          case 'map': return <MapPin size={24} />;
          default: return <BookOpen size={24} />;
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
      
      {modules.length === 0 ? (
         <div className={cn(
            "text-center py-12 px-6 border-2 border-dashed rounded-xl",
            (isUni || isSMA) ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"
         )}>
            <p className={cn("text-sm", (isUni || isSMA) ? "text-slate-500" : "text-slate-400")}>
               Belum ada modul pembelajaran tersedia.
            </p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod, idx) => (
               <motion.div 
                 key={mod.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.05 }}
                 className={cn(
                    "p-5 rounded-xl border transition-all cursor-pointer group flex items-start gap-4",
                    isKids ? "bg-white border-sky-100 hover:shadow-lg hover:border-sky-300" :
                    isUni ? "bg-slate-900/50 border-white/5 hover:border-indigo-500/50 hover:bg-slate-800" :
                    isSMA ? "bg-slate-900 border-slate-800 hover:border-teal-500/30" :
                    "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
                 )}
               >
                  <div className={cn(
                     "p-3 rounded-lg flex items-center justify-center shrink-0",
                     isKids ? "bg-sky-50 text-sky-500" :
                     isUni ? "bg-indigo-500/10 text-indigo-400" :
                     isSMA ? "bg-teal-500/10 text-teal-400" :
                     "bg-indigo-50 text-indigo-600"
                  )}>
                     {getIcon(mod.type)}
                  </div>
                  <div>
                     <h4 className={cn(
                        "font-bold text-sm mb-1 line-clamp-2",
                        (isUni || isSMA) ? "text-slate-200" : "text-slate-800"
                     )}>
                        {mod.title}
                     </h4>
                     <p className={cn(
                        "text-xs",
                        (isUni || isSMA) ? "text-slate-500" : "text-slate-500"
                     )}>
                        {mod.type === 'video' ? mod.duration : mod.type === 'quiz' ? `${mod.questions} Soal` : mod.readTime}
                     </p>
                  </div>
               </motion.div>
            ))}
         </div>
      )}
    </div>
  );
}