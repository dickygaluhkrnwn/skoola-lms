"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Lock, MapPin, Flag, Zap, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
// Hapus import CourseModule yang error
import { useTheme } from "@/lib/theme-context";

// Update Interface: Gunakan 'any' atau definisikan struktur minimal yang dibutuhkan
interface AdventureMapProps {
  modules: any[]; // Menggunakan any[] agar fleksibel menerima data dari Classroom maupun Global
  isClassroomContext?: boolean;
  classId?: string;
}

export function AdventureMap({ modules, isClassroomContext = false, classId }: AdventureMapProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  // Helper untuk navigasi
  const handleItemClick = (item: any) => {
      if (isClassroomContext && classId) {
          // Logika navigasi dalam kelas
          if (item.type === 'quiz' || item.type === 'game' || item.type === 'essay' || item.type === 'project') {
              router.push(`/classroom/${classId}/assignment/${item.id}`);
          } else if (item.url) {
              window.open(item.url, '_blank');
          } else if (item.type === 'map' && item.locationData) {
              window.open(`https://www.google.com/maps/search/?api=1&query=${item.locationData.lat},${item.locationData.lng}`, '_blank');
          } else {
              // Fallback or specific logic for rich-text/video if needed within app
              // For now, assume it might be handled or just open url if exists
              if (item.content && item.type === 'video') window.open(item.content, '_blank');
          }
      } else {
          // Logika navigasi global (Belajar Mandiri)
          router.push(`/lesson/${item.id}`);
      }
  };

  return (
    <div className="relative py-12 px-4">
      {/* Dekorasi Background */}
      <div className={cn(
          "absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -z-10 opacity-40 animate-pulse",
          isKids ? "bg-sky-200" : 
          isSMP ? "bg-violet-300" :
          isSMA ? "bg-teal-900/40" : 
          isUni ? "bg-slate-700" : 
          "bg-blue-200"
      )} />
      <div className={cn(
          "absolute bottom-20 right-0 w-64 h-64 rounded-full blur-3xl -z-10 opacity-40",
          isKids ? "bg-yellow-200" : 
          isSMP ? "bg-fuchsia-300" :
          isSMA ? "bg-indigo-900/40" :
          isUni ? "bg-slate-800" : 
          "bg-purple-200"
      )} />

      {/* SVG Path Connector */}
      <svg className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none" style={{ minHeight: modules.length * 140 }}>
        <defs>
          {/* Gradient Khusus SMA */}
          <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" /> {/* Teal-400 */}
            <stop offset="100%" stopColor="#6366f1" /> {/* Indigo-500 */}
          </linearGradient>
        </defs>
        
        <path 
          d={`M ${50}% 40 ${modules.map((_, i) => {
            const y = (i + 1) * 140; 
            const x = i % 2 === 0 ? '20%' : '80%';
            // SMA: Gunakan Garis Lurus (Circuit Style)
            if (isSMA) {
               return `L ${x} ${y}`;
            }
            // Default: Kurva Bezier
            return `Q ${i % 2 === 0 ? '80%' : '20%'} ${y - 70}, ${x} ${y}`;
          }).join(' ')}`}
          fill="none" 
          stroke={isSMA ? "url(#cyberGradient)" : isUni ? "#334155" : isSMP ? "#ddd6fe" : "#e0f2fe"} 
          strokeWidth={isKids ? "12" : isSMA ? "2" : "4"} 
          strokeLinecap={isSMA ? "square" : "round"}
          strokeDasharray={isSMA ? "0" : "20 20"}
          className={cn(
              !isSMA && "animate-[dash_60s_linear_infinite]",
              isSMA && "drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]"
          )}
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
                  onClick={() => handleItemClick(modul)}
                  className={cn(
                    "flex flex-col items-center justify-center transition-all relative",
                    // Shape & Size
                    isKids ? "w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem]" : 
                    "w-24 h-24 sm:w-28 sm:h-28 rounded-full",

                    // Backgrounds & Borders
                    isKids 
                        ? "bg-gradient-to-b from-green-400 to-green-500 shadow-[0_8px_0_#15803d]" 
                        : isSMP
                          ? "bg-white border-4 border-violet-200 shadow-[0_0_20px_rgba(139,92,246,0.3)] text-violet-600"
                        : isSMA
                          ? "bg-slate-950 border border-teal-500/30 shadow-[0_0_15px_rgba(45,212,191,0.15)] text-teal-400 backdrop-blur-md"
                        : isUni
                          ? "rounded-xl bg-slate-800 border-2 border-slate-700 shadow-lg text-slate-400"
                          : "bg-white border-4 border-blue-100 shadow-xl text-slate-700",
                    
                    // Hover Effects
                    !isLocked && (isKids 
                        ? "hover:translate-y-1 hover:shadow-[0_4px_0_#15803d] active:translate-y-2 active:shadow-none"
                        : isSMA 
                          ? "hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] hover:border-teal-400 hover:scale-110 hover:z-20"
                        : "hover:scale-105 hover:border-primary"),
                    
                    // Locked State
                    isLocked && (
                        isSMA ? "bg-slate-900/50 border-white/5 text-slate-700 shadow-none grayscale" :
                        isUni ? "bg-slate-900 border-slate-800 opacity-60 grayscale" : 
                        "bg-slate-100 shadow-none cursor-not-allowed grayscale opacity-80"
                    )
                  )}
                >
                  {/* SMA Specific Ping Effect */}
                  {isSMA && !isLocked && (
                     <div className="absolute inset-0 rounded-full border-2 border-teal-500/20 animate-ping opacity-20" />
                  )}

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
                      {(modul as any).icon || (modul.thumbnailUrl) || (isUni ? "📑" : isSMA ? <Zap size={32} /> : "🏝️")}
                  </span>
                  
                  {isLocked && <Lock size={24} className={cn("absolute bottom-3", isUni || isSMA ? "text-slate-600" : "text-slate-400")} />}
                </button>
                
                {/* Label Level Floating */}
                <div className={cn(
                  "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 font-bold text-sm shadow-sm transition-transform group-hover:scale-105 pointer-events-none",
                  isKids 
                      ? "rounded-xl bg-white text-sky-700 border-2 border-sky-100" 
                      : isSMP
                        ? "rounded-xl bg-white/80 backdrop-blur text-violet-700 border border-violet-200"
                      : isSMA
                        ? "rounded bg-slate-900/80 backdrop-blur-md text-teal-400 border border-teal-500/30 text-xs tracking-widest uppercase font-mono shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
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
        {isUni ? <Flag className="text-slate-500" /> : isSMA ? <Target className="text-teal-600" size={32} /> : <MapPin className="text-sky-300" />}
        <p className={cn("font-bold text-sm", isUni ? "text-slate-500 uppercase tracking-widest" : isSMA ? "text-teal-700 font-mono uppercase tracking-[0.2em]" : "text-sky-300")}>
           {isUni ? "Kurikulum Selesai" : isSMA ? "SYSTEM ENDPOINT" : "✨ Petualangan Berlanjut! ✨"}
        </p>
      </div>
    </div>
  );
}