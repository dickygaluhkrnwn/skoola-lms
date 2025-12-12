"use client";

import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, School, QrCode, CreditCard } from "lucide-react";
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
        "relative overflow-hidden transition-all md:sticky md:top-24 flex flex-col items-center",
        // Base container styles: Uni gets no padding/border here as it handles its own card
        isUni ? "bg-transparent p-0 border-none shadow-none" : 
        "border shadow-sm p-6",
        
        // Theme specific container styles for others
        isKids ? "rounded-3xl border-yellow-200 bg-white" : 
        isSMP ? "rounded-3xl bg-white/60 backdrop-blur-xl border-white/50 shadow-xl shadow-violet-500/10" :
        isSMA ? "rounded-2xl bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl hover:bg-white/10" :
        !isUni && "rounded-2xl bg-white border-slate-200"
      )}
    >
       {/* --- UNI THEME: DIGITAL ID CARD LAYOUT --- */}
       {isUni ? (
         <div className="w-full relative group perspective-1000">
            {/* The ID Card */}
            <div className="relative w-full aspect-[1.58/1] bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl transition-transform duration-500 group-hover:rotate-y-2 group-hover:scale-[1.02]">
                
                {/* Holographic Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20" style={{ mixBlendMode: 'overlay' }} />
                
                {/* Background Pattern & Glows */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)]" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[60px]" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/10 rounded-full blur-[60px]" />

                {/* Card Content */}
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                    {/* Top Row: Logo & Chip */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">S</div>
                           <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Skoola ID</span>
                        </div>
                        <CreditCard className="text-amber-200/80 drop-shadow-md" size={32} />
                    </div>

                    {/* Middle Row: Avatar & Details */}
                    <div className="flex items-center gap-5 mt-4">
                        <div className="w-20 h-20 rounded-xl border-2 border-white/10 bg-slate-800 overflow-hidden shadow-inner shrink-0 relative">
                             {userProfile?.photoURL ? (
                                <img src={userProfile.photoURL} alt="ID" className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">😎</div>
                             )}
                             {/* Glossy overlay on photo */}
                             <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                        </div>
                        <div className="flex-1 min-w-0">
                             <h2 className="text-xl font-bold text-white truncate">{userProfile?.displayName}</h2>
                             <p className="text-xs text-indigo-300 font-mono mb-2 truncate">{userProfile?.email}</p>
                             <div className="flex gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                   LVL {getLevel()}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                                   {userProfile?.role === "teacher" ? "Lecturer" : "Student"}
                                </span>
                             </div>
                        </div>
                    </div>

                    {/* Bottom Row: School & QR */}
                    <div className="mt-auto pt-4 flex justify-between items-end border-t border-white/5">
                        <div>
                             <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Institution</p>
                             <p className="text-xs text-slate-300 font-medium truncate max-w-[180px]">{userProfile?.schoolName || "Universitas Skoola"}</p>
                        </div>
                        <QrCode className="text-white/20" size={32} />
                    </div>
                </div>
            </div>
            
            {/* Bio Section below card for Uni */}
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                 <p className="text-xs text-slate-400 italic text-center">
                    "{userProfile?.bio || "Learning is a journey, not a destination."}"
                 </p>
            </div>
         </div>
       ) : (
         /* --- STANDARD / OTHER THEMES LAYOUT --- */
         <>
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
              <div className={cn(
                 "absolute inset-[-4px] rounded-full animate-spin-slow opacity-70",
                 isKids ? "bg-gradient-to-tr from-yellow-400 to-orange-400" :
                 isSMP ? "bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-cyan-500" :
                 isSMA ? "bg-gradient-to-tr from-teal-400 to-indigo-500 blur-sm" :
                 "bg-slate-200"
              )} />
              
              <div className={cn(
                "w-28 h-28 rounded-full border-4 shadow-lg flex items-center justify-center text-5xl select-none overflow-hidden bg-gray-100 relative z-10",
                isSMA ? "border-slate-900 bg-slate-900" : "border-white"
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
                   : isSMA ? "bg-teal-900/80 text-teal-300 border-teal-700 backdrop-blur-md" : "bg-green-500 text-white border-green-400"
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
         </>
       )}
    </motion.div>
  );
}