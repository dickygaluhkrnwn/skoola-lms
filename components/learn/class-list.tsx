"use client";

import React from "react";
import { motion } from "framer-motion";
import { School, ChevronRight, GraduationCap } from "lucide-react";
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
  const isUni = theme === "uni";

  if (classes.length === 0) {
    return (
      <div className={cn(
        "text-center py-12 px-6 border-2 border-dashed",
        isKids ? "border-sky-200 bg-sky-50 rounded-3xl" : 
        isUni ? "border-slate-700 bg-slate-800/50 rounded-xl" :
        "border-zinc-200 bg-zinc-50 rounded-xl"
      )}>
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors animate-bounce",
          isKids ? "bg-white border-4 border-sky-100 text-sky-400" : 
          isUni ? "bg-slate-700 text-slate-400" :
          "bg-white text-zinc-400 shadow-sm"
        )}>
          <School size={40} />
        </div>
        <h3 className={cn("font-bold text-lg", isKids ? "text-sky-800" : isUni ? "text-white" : "text-foreground")}>
          {isKids ? "Belum ada kelas seru!" : "Belum masuk kelas"}
        </h3>
        <p className={cn("text-sm mt-2 mb-6", isUni ? "text-slate-400" : "text-muted-foreground")}>
          {isKids ? "Minta kode ajaib dari gurumu untuk mulai belajar bareng teman!" : "Minta Kode Kelas ke gurumu untuk mulai belajar bersama."}
        </p>
        <Button 
          onClick={onOpenJoinModal} 
          className={cn(
            isKids ? "bg-sky-500 hover:bg-sky-600 text-white rounded-2xl px-8 py-6 shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none transition-all" : 
            "bg-primary hover:bg-primary/90 rounded-lg"
          )}
        >
          Join Kelas Sekarang
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {classes.map((cls) => (
        <motion.div 
          key={cls.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => router.push(`/classroom/${cls.id}`)}
          className={cn(
            "p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden",
            isKids ? "bg-white rounded-3xl border-2 border-sky-100 hover:border-sky-300 hover:shadow-sky-100" : 
            isUni ? "bg-slate-800 border-slate-700 hover:border-slate-600 rounded-xl" :
            "bg-white rounded-xl border-zinc-200 hover:border-primary/50"
          )}
        >
          {/* Background Decor */}
          <div className={cn(
            "absolute top-0 right-0 w-24 h-24 rounded-full -mr-10 -mt-10 opacity-10 transition-colors pointer-events-none",
            isKids ? "bg-sky-400" : isUni ? "bg-white" : "bg-primary"
          )}/>
          
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div className={cn(
              "p-3 rounded-2xl transition-colors",
              isKids ? "bg-sky-50 text-sky-600 border border-sky-100" : 
              isUni ? "bg-slate-700 text-white border border-slate-600" :
              "bg-primary/10 text-primary"
            )}>
              <School size={28} />
            </div>
            
            <div className="flex flex-col items-end gap-1">
               <span className={cn(
                 "text-[10px] px-2 py-1 font-mono font-bold border",
                 isKids ? "bg-yellow-50 text-yellow-700 border-yellow-200 rounded-lg" : 
                 isUni ? "bg-slate-900 text-slate-400 border-slate-700 rounded" :
                 "bg-zinc-50 border-zinc-200 text-zinc-500 rounded"
               )}>
                 {cls.code}
               </span>
               {cls.category && (
                  <span className={cn(
                    "text-[10px] uppercase font-bold tracking-wider",
                    isUni ? "text-slate-500" : "text-muted-foreground opacity-60"
                  )}>
                    {cls.category}
                  </span>
               )}
            </div>
          </div>
          
          <h3 className={cn(
            "font-bold text-lg transition-colors relative z-10",
            isKids ? "text-slate-700 group-hover:text-sky-600" : 
            isUni ? "text-white group-hover:text-blue-400" :
            "text-foreground group-hover:text-primary"
          )}>
            {cls.name}
          </h3>
          <p className={cn(
            "text-xs mt-1 line-clamp-2 h-8 relative z-10",
            isUni ? "text-slate-400" : "text-muted-foreground"
          )}>
            {cls.description || "Tidak ada deskripsi kelas."}
          </p>
          
          <div className={cn(
            "mt-4 pt-3 border-t flex justify-between items-center text-xs relative z-10",
            isUni ? "border-slate-700 text-slate-400" : "border-border text-muted-foreground"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                isKids ? "bg-orange-100 text-orange-600 border-orange-200" : 
                isUni ? "bg-slate-700 text-slate-300 border-slate-600" :
                "bg-gray-200 text-gray-600 border-transparent"
              )}>
                {cls.teacherName?.[0] || "G"}
              </div>
              <span className={cn(isKids && "font-bold text-slate-600")}>{cls.teacherName || "Guru"}</span>
            </div>
            
            <div className={cn(
               "flex items-center gap-1 transition-transform group-hover:translate-x-1",
               isKids ? "text-sky-400" : "text-primary"
            )}>
               <span className="font-bold">Masuk</span> <ChevronRight size={16} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}