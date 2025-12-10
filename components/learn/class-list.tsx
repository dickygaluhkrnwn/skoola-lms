"use client";

import React from "react";
import { motion } from "framer-motion";
import { School, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ClassListProps {
  classes: any[]; // TODO: Define proper Class type
  theme: string;
  onOpenJoinModal: () => void;
}

export function ClassList({ classes, theme, onOpenJoinModal }: ClassListProps) {
  const router = useRouter();

  if (classes.length === 0) {
    return (
      <div className={cn(
        "text-center py-12 px-6 border-2 border-dashed",
        theme === "kids" ? "border-sky-200 bg-sky-50 rounded-3xl" : "border-zinc-200 bg-zinc-50 rounded-xl"
      )}>
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors animate-bounce",
          theme === "kids" ? "bg-white border-4 border-sky-100 text-sky-400" : "bg-white text-zinc-400 shadow-sm"
        )}>
          <School size={40} />
        </div>
        <h3 className={cn("font-bold text-lg", theme === "kids" ? "text-sky-800" : "text-foreground")}>
          {theme === "kids" ? "Belum ada kelas seru!" : "Belum masuk kelas"}
        </h3>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          {theme === "kids" ? "Minta kode ajaib dari gurumu untuk mulai belajar bareng teman!" : "Minta Kode Kelas ke gurumu untuk mulai belajar bersama."}
        </p>
        <Button 
          onClick={onOpenJoinModal} 
          className={cn(
            theme === "kids" ? "bg-sky-500 hover:bg-sky-600 text-white rounded-2xl px-8 py-6 shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none transition-all" : "bg-indigo-600 hover:bg-indigo-700 rounded-lg"
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
            "bg-white p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden",
            theme === "kids" ? "rounded-3xl border-2 border-sky-100 hover:border-sky-300 hover:shadow-sky-100" : "rounded-xl border-zinc-200"
          )}
        >
          <div className={cn(
            "absolute top-0 right-0 w-24 h-24 rounded-full -mr-10 -mt-10 opacity-10 transition-colors",
            theme === "kids" ? "bg-sky-400" : "bg-indigo-600"
          )}/>
          
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div className={cn(
              "p-3 rounded-2xl transition-colors",
              theme === "kids" ? "bg-sky-50 text-sky-600 border border-sky-100" : "bg-zinc-100 text-indigo-600"
            )}>
              <School size={28} />
            </div>
            <span className={cn(
              "text-[10px] text-muted-foreground px-2 py-1 font-mono border font-bold",
              theme === "kids" ? "bg-yellow-50 text-yellow-700 border-yellow-200 rounded-lg" : "bg-zinc-50 border-zinc-200 rounded"
            )}>
              {cls.code}
            </span>
          </div>
          
          <h3 className={cn(
            "font-bold text-lg transition-colors relative z-10",
            theme === "kids" ? "text-slate-700 group-hover:text-sky-600" : "text-foreground group-hover:text-indigo-600"
          )}>
            {cls.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-8 relative z-10">
            {cls.description || "Tidak ada deskripsi kelas."}
          </p>
          
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground relative z-10">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                  theme === "kids" ? "bg-orange-100 text-orange-600 border-orange-200" : "bg-gray-200 text-gray-600 border-transparent"
              )}>
                {cls.teacherName?.[0]}
              </div>
              <span className={cn(theme === "kids" && "font-bold text-slate-600")}>{cls.teacherName}</span>
            </div>
            <ChevronRight size={20} className={cn("transition-colors", theme === "kids" ? "text-sky-300 group-hover:text-sky-600" : "text-gray-300 group-hover:text-primary")} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}