"use client";

import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, School } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  userProfile: any;
  isKids: boolean;
  isSMP: boolean;
  isSMA: boolean;
  isUni: boolean;
  textPrimary: string;
  textMuted: string;
  getLevel: () => number;
}

export function ProfileCard({ 
  userProfile, 
  isKids, 
  isSMP, 
  isSMA, 
  isUni, 
  textPrimary, 
  textMuted,
  getLevel 
}: ProfileCardProps) {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "border shadow-sm relative overflow-hidden transition-all md:sticky md:top-24 flex flex-col items-center p-6",
        isKids ? "rounded-3xl border-yellow-200 bg-white" : 
        isSMP ? "rounded-3xl bg-white/60 backdrop-blur-xl border-white/50 shadow-xl shadow-violet-500/10" :
        isSMA ? "rounded-2xl bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl hover:bg-white/10" :
        isUni ? "rounded-2xl bg-slate-900 border-slate-800" : 
        "rounded-2xl bg-white border-slate-200"
      )}
    >
       {/* Level Badge - Floating Top Right */}
       <div className="absolute top-4 right-4">
          <div className={cn(
             "flex flex-col items-center justify-center w-12 h-14 clip-path-badge shadow-sm",
             isKids ? "bg-yellow-400 text-yellow-900" : 
             isSMP ? "bg-gradient-to-b from-violet-500 to-fuchsia-500 text-white" :
             isSMA ? "bg-gradient-to-b from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30" :
             "bg-slate-800 text-white"
          )}>
             <span className="text-[8px] font-bold uppercase">LVL</span>
             <span className="text-xl font-black leading-none">{getLevel()}</span>
          </div>
       </div>

       {/* Avatar with Ring */}
       <div className="relative mb-4 mt-2">
          {/* Animated Ring for SMP/Kids/SMA */}
          <div className={cn(
             "absolute inset-[-4px] rounded-full animate-spin-slow opacity-70",
             isKids ? "bg-gradient-to-tr from-yellow-400 to-orange-400" :
             isSMP ? "bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-cyan-500" :
             isSMA ? "bg-gradient-to-tr from-teal-400 to-indigo-500 blur-sm" :
             "bg-slate-200"
          )} />
          
          <div className={cn(
            "w-28 h-28 rounded-full border-4 shadow-lg flex items-center justify-center text-5xl select-none overflow-hidden bg-gray-100 relative z-10",
            isUni ? "border-slate-800" : isSMA ? "border-slate-900 bg-slate-900" : "border-white"
          )}>
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>😎</span>
            )}
          </div>
          
          {/* Role Badge */}
          <div className={cn(
             "absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm z-20 whitespace-nowrap",
             userProfile?.role === "teacher" 
               ? "bg-blue-600 text-white border-blue-400"
               : (isUni || isSMA) ? "bg-teal-900/80 text-teal-300 border-teal-700 backdrop-blur-md" : "bg-green-500 text-white border-green-400"
           )}>
             {userProfile?.role === "teacher" ? "Guru" : "Siswa"}
           </div>
       </div>

       <div className="text-center w-full">
          <h2 className={cn("text-2xl font-bold leading-tight mb-1", textPrimary)}>{userProfile?.displayName}</h2>
          <p className={cn("text-sm", textMuted)}>{userProfile?.email}</p>
          
          {/* Bio / School Info */}
          <div className={cn(
             "mt-6 p-4 rounded-xl text-left space-y-3 w-full",
             isKids ? "bg-yellow-50 border border-yellow-100" :
             isSMP ? "bg-white/50 border border-white/50" :
             isSMA ? "bg-white/5 border border-white/10" :
             isUni ? "bg-slate-800/50 border border-slate-700" :
             "bg-slate-50 border border-slate-100"
          )}>
             <div className={cn("flex items-center gap-3 text-xs font-medium", textMuted)}>
                <div className={cn("p-1.5 rounded-lg", isSMP ? "bg-violet-100 text-violet-600" : isSMA ? "bg-teal-500/20 text-teal-400" : "bg-slate-200 text-slate-600")}>
                   <GraduationCap size={14} /> 
                </div>
                <span className="uppercase tracking-wide">{userProfile?.schoolLevel || 'Umum'}</span>
             </div>
             <div className={cn("flex items-center gap-3 text-xs font-medium", textMuted)}>
                <div className={cn("p-1.5 rounded-lg", isSMP ? "bg-cyan-100 text-cyan-600" : isSMA ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-200 text-slate-600")}>
                   <School size={14} /> 
                </div>
                <span className="truncate">{userProfile?.schoolName || "Belum ada sekolah"}</span>
             </div>
             {userProfile?.bio && (
                <p className="text-xs italic border-t pt-3 mt-1 opacity-80 border-dashed border-gray-300 dark:border-gray-700">
                   "{userProfile.bio}"
                </p>
             )}
          </div>
       </div>
    </motion.div>
  );
}