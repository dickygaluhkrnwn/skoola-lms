"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Play, BookOpen, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CourseModule } from "@/lib/types/course.types";
import { useTheme } from "@/lib/theme-context";

interface ModuleListProps {
  modules: CourseModule[];
}

export function ModuleList({ modules }: ModuleListProps) {
  const router = useRouter();
  const { theme } = useTheme();

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between mb-2">
        <h2 className={cn(
           "text-sm font-bold uppercase tracking-wider",
           isUni ? "text-slate-400" : "text-slate-700"
        )}>
           Modul Pembelajaran
        </h2>
        <span className={cn(
           "text-xs px-2 py-1 rounded-md",
           isUni ? "text-slate-300 bg-slate-800" : "text-slate-500 bg-slate-100"
        )}>
           {modules.length} Unit
        </span>
      </div>
      
      <div className="grid gap-3">
        {modules.map((modul, idx) => {
          const isLocked = modul.isLocked;
          
          return (
            <motion.div
              key={modul.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "group relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                // Theme Logic
                isKids 
                  ? (isLocked ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-sky-100 hover:border-sky-300 hover:shadow-sky-100") 
                  : isUni 
                    ? (isLocked ? "bg-slate-900 border-slate-800 opacity-50" : "bg-slate-800 border-slate-700 hover:border-blue-500")
                    : (isLocked ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md")
              )}
              onClick={() => !isLocked && router.push(`/lesson/${modul.id}`)}
            >
              {/* Icon Box */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors",
                isLocked 
                  ? (isUni ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-400 grayscale") 
                  : (isKids ? "bg-sky-50 text-sky-500" : isUni ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600")
              )}>
                {(modul as any).icon || (modul.thumbnailUrl) || <BookOpen size={20} />}
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn(
                     "font-bold text-sm truncate",
                     isLocked 
                        ? (isUni ? "text-slate-500" : "text-slate-400") 
                        : (isKids ? "text-slate-800 group-hover:text-sky-700" : isUni ? "text-slate-200 group-hover:text-white" : "text-slate-800 group-hover:text-blue-700")
                  )}>
                    {modul.title}
                  </h3>
                  {!isLocked && (
                     <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-bold",
                        isKids ? "bg-green-100 text-green-700" : isUni ? "bg-emerald-900/50 text-emerald-400" : "bg-green-100 text-green-700"
                     )}>
                        Terbuka
                     </span>
                  )}
                </div>
                <p className={cn("text-xs line-clamp-1", isUni ? "text-slate-500" : "text-slate-500")}>
                   {modul.description || "Pelajari materi ini untuk lanjut."}
                </p>
              </div>

              {/* Action / Status */}
              <div className="shrink-0">
                {isLocked ? (
                  <Lock size={18} className={cn(isUni ? "text-slate-600" : "text-slate-300")} />
                ) : (
                  <div className={cn(
                     "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                     isKids 
                        ? "bg-sky-100 text-sky-600 group-hover:bg-sky-500 group-hover:text-white" 
                        : isUni 
                           ? "bg-slate-700 text-slate-300 group-hover:bg-blue-600 group-hover:text-white"
                           : "bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white"
                  )}>
                    <Play size={14} className="ml-0.5" />
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