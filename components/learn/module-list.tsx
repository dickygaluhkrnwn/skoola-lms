"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CourseModule } from "@/lib/types/course.types";

interface ModuleListProps {
  modules: CourseModule[];
}

export function ModuleList({ modules }: ModuleListProps) {
  const router = useRouter();

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Modul Pembelajaran</h2>
        <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">{modules.length} Unit</span>
      </div>
      
      <div className="grid gap-3">
        {modules.map((modul) => {
          const isLocked = modul.isLocked;
          return (
            <motion.div
              key={modul.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "group relative flex items-center gap-4 p-4 rounded-lg border bg-white transition-all",
                isLocked 
                  ? "border-zinc-200 opacity-60 bg-zinc-50" 
                  : "border-zinc-200 hover:border-indigo-300 hover:shadow-md cursor-pointer"
              )}
              onClick={() => !isLocked && router.push(`/lesson/${modul.id}`)}
            >
              {/* Icon Box */}
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 transition-colors",
                isLocked ? "bg-zinc-200 grayscale" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
              )}>
                {(modul as any).icon || (modul.thumbnailUrl) || "📚"}
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn("font-bold text-sm", isLocked ? "text-zinc-500" : "text-zinc-900")}>
                    {modul.title}
                  </h3>
                  {!isLocked && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold">Terbuka</span>}
                </div>
                <p className="text-xs text-zinc-500 line-clamp-1">{modul.description}</p>
              </div>

              {/* Action / Status */}
              <div className="shrink-0">
                {isLocked ? (
                  <Lock size={18} className="text-zinc-400" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
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