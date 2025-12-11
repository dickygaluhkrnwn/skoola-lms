"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Lock, MapPin, Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CourseModule } from "@/lib/types/course.types";
import { useTheme } from "@/lib/theme-context";

interface AdventureMapProps {
  modules: CourseModule[];
}

export function AdventureMap({ modules }: AdventureMapProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const isKids = theme === "sd";
  const isUni = theme === "uni";

  return (
    <div className="relative py-12 px-4">
      {/* Dekorasi Background */}
      <div className={cn(
         "absolute top-0 left-0 w-40 h-40 rounded-full blur-3xl -z-10 opacity-40 animate-pulse",
         isKids ? "bg-sky-200" : isUni ? "bg-slate-700" : "bg-blue-200"
      )} />
      <div className={cn(
         "absolute bottom-20 right-0 w-40 h-40 rounded-full blur-3xl -z-10 opacity-40",
         isKids ? "bg-yellow-200" : isUni ? "bg-slate-800" : "bg-purple-200"
      )} />

      {/* SVG Path Connector (Kurva Sederhana) */}
      <svg className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none" style={{ minHeight: modules.length * 140 }}>
        <path 
          d={`M ${50}% 40 ${modules.map((_, i) => {
            const y = (i + 1) * 140; 
            const x = i % 2 === 0 ? '20%' : '80%';
            return `Q ${i % 2 === 0 ? '80%' : '20%'} ${y - 70}, ${x} ${y}`;
          }).join(' ')}`}
          fill="none" 
          stroke={isUni ? "#334155" : "#e0f2fe"} 
          strokeWidth={isKids ? "12" : "4"} 
          strokeLinecap="round"
          strokeDasharray="20 20"
          className="animate-[dash_60s_linear_infinite]"
        />
      </svg>
      
      <div className="space-y-24 relative mt-8">
        {modules.map((modul, index) => {
          const isLeft = index % 2 === 0; // Zigzag pattern
          const isLocked = modul.isLocked; 
          
          return (
            <motion.div
              key={modul.id}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className={cn(
                "flex relative z-10",
                isLeft ? "justify-end md:justify-center md:translate-x-12" : "justify-start md:justify-center md:-translate-x-12"
              )}
            >
              <div className="relative group">
                {/* Tombol Level Besar */}
                <button
                  disabled={isLocked}
                  onClick={() => router.push(`/lesson/${modul.id}`)}
                  className={cn(
                    "w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center transition-all relative",
                    isKids 
                       ? "rounded-[2rem] bg-gradient-to-b from-green-400 to-green-500 shadow-[0_8px_0_#15803d]" 
                       : isUni
                          ? "rounded-xl bg-slate-800 border-2 border-slate-700 shadow-lg"
                          : "rounded-full bg-white border-4 border-blue-100 shadow-xl",
                    !isLocked && (isKids 
                       ? "hover:translate-y-1 hover:shadow-[0_4px_0_#15803d] active:translate-y-2 active:shadow-none"
                       : "hover:scale-105 hover:border-blue-300"),
                    isLocked && (isUni ? "bg-slate-900 border-slate-800 opacity-60 grayscale" : "bg-slate-100 shadow-none cursor-not-allowed grayscale opacity-80")
                  )}
                >
                  {/* Dekorasi Bintang (Hanya Kids) */}
                  {!isLocked && isKids && (
                    <div className="absolute -top-3 flex gap-1">
                      <Star size={16} className="text-yellow-400 fill-current animate-bounce delay-75" />
                      <Star size={20} className="text-yellow-300 fill-current animate-bounce" />
                      <Star size={16} className="text-yellow-400 fill-current animate-bounce delay-150" />
                    </div>
                  )}

                  <span className={cn(
                     "text-4xl filter drop-shadow-md mb-1 transition-transform group-hover:scale-110", 
                     isLocked && "opacity-40 grayscale"
                  )}>
                     {(modul as any).icon || (modul.thumbnailUrl) || (isUni ? "📑" : "🏝️")}
                  </span>
                  
                  {isLocked && <Lock size={24} className={cn("absolute bottom-3", isUni ? "text-slate-500" : "text-slate-400")} />}
                </button>
                
                {/* Label Level Floating */}
                <div className={cn(
                  "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 font-bold text-sm shadow-sm transition-transform group-hover:scale-105 pointer-events-none",
                  isKids 
                     ? "rounded-xl bg-white text-sky-700 border-2 border-sky-100" 
                     : isUni
                        ? "rounded bg-slate-900 text-slate-300 border border-slate-700 text-xs tracking-wider uppercase"
                        : "rounded-full bg-white text-slate-700 border border-slate-200"
                )}>
                  {modul.title}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Start/Finish Decor */}
      <div className="text-center mt-24 opacity-50 flex flex-col items-center gap-2">
        {isUni ? <Flag className="text-slate-500" /> : <MapPin className="text-sky-300" />}
        <p className={cn("font-bold text-sm", isUni ? "text-slate-500 uppercase tracking-widest" : "text-sky-300")}>
           {isUni ? "Kurikulum Selesai" : "✨ Petualangan Berlanjut! ✨"}
        </p>
      </div>
    </div>
  );
}