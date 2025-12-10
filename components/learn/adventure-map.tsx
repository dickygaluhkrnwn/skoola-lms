"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CourseModule } from "@/lib/types/course.types";

interface AdventureMapProps {
  modules: CourseModule[];
}

export function AdventureMap({ modules }: AdventureMapProps) {
  const router = useRouter();

  return (
    <div className="relative py-12 px-4">
      {/* Dekorasi Background */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-sky-100 rounded-full blur-3xl -z-10 opacity-50 animate-pulse" />
      <div className="absolute bottom-20 right-0 w-32 h-32 bg-yellow-100 rounded-full blur-3xl -z-10 opacity-50" />

      {/* SVG Path Connector (Kurva Sederhana) */}
      <svg className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none" style={{ minHeight: modules.length * 140 }}>
        <path 
          d={`M ${50}% 40 ${modules.map((_, i) => {
            const y = (i + 1) * 140; 
            const x = i % 2 === 0 ? '20%' : '80%';
            return `Q ${i % 2 === 0 ? '80%' : '20%'} ${y - 70}, ${x} ${y}`;
          }).join(' ')}`}
          fill="none" 
          stroke="#e0f2fe" 
          strokeWidth="12" 
          strokeLinecap="round"
          strokeDasharray="20 20"
          className="animate-[dash_20s_linear_infinite]"
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
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.15, type: "spring" }}
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
                    "w-28 h-28 flex flex-col items-center justify-center transition-all relative rounded-[2rem]",
                    !isLocked 
                      ? "bg-gradient-to-b from-green-400 to-green-500 shadow-[0_8px_0_#15803d] hover:translate-y-1 hover:shadow-[0_4px_0_#15803d] active:translate-y-2 active:shadow-none" 
                      : "bg-slate-200 shadow-[0_4px_0_#94a3b8] cursor-not-allowed grayscale"
                  )}
                >
                  {/* Bintang-bintang di atas tombol (Dekorasi) */}
                  {!isLocked && (
                    <div className="absolute -top-3 flex gap-1">
                      <Star size={16} className="text-yellow-400 fill-current animate-bounce delay-75" />
                      <Star size={20} className="text-yellow-300 fill-current animate-bounce" />
                      <Star size={16} className="text-yellow-400 fill-current animate-bounce delay-150" />
                    </div>
                  )}

                  <span className={cn("text-4xl filter drop-shadow-md mb-1", isLocked && "opacity-40 grayscale")}>
                     {(modul as any).icon || (modul.thumbnailUrl) || "🏝️"}
                  </span>
                  
                  {isLocked && <Lock size={24} className="text-slate-400 absolute bottom-3" />}
                </button>
                
                {/* Label Level Floating */}
                <div className={cn(
                  "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-transform group-hover:scale-110",
                  isLocked ? "bg-slate-100 text-slate-400" : "bg-white text-sky-700 border-2 border-sky-100"
                )}>
                  {modul.title}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Start/Finish Decor */}
      <div className="text-center mt-24 opacity-50">
        <p className="text-sky-300 font-bold text-sm">✨ Petualangan Berlanjut! ✨</p>
      </div>
    </div>
  );
}