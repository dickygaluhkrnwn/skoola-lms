"use client";

import React from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsTabProps {
  userProfile: any;
  isSMP: boolean;
  isSMA: boolean;
  isUni: boolean;
  textPrimary: string;
}

export function StatsTab({ 
  userProfile, 
  isSMP, 
  isSMA, 
  isUni, 
  textPrimary 
}: StatsTabProps) {
  return (
    <div className={cn(
      "p-6 border rounded-2xl",
      isUni ? "bg-slate-900 border-slate-700" : isSMP ? "bg-white/60 border-white/60 backdrop-blur-md" : isSMA ? "bg-white/5 border-white/10 backdrop-blur-md" : "bg-white border-slate-200"
    )}>
       <h3 className={cn("font-bold text-lg mb-4 flex items-center gap-2", textPrimary)}>
          <Activity size={20} className={cn(isSMA ? "text-teal-500" : "text-blue-500")}/> Aktivitas Belajar
       </h3>
       
       {/* Mockup Contribution Graph */}
       <div className="flex flex-wrap gap-1 mb-2">
          {Array.from({ length: 60 }).map((_, i) => {
             const level = Math.random() > 0.7 ? (Math.random() > 0.5 ? 2 : 1) : 0;
             return (
                <div 
                   key={i} 
                   className={cn(
                      "w-3 h-3 rounded-sm",
                      level === 0 ? ((isUni || isSMA) ? "bg-white/10" : "bg-slate-100") :
                      level === 1 ? (isSMP ? "bg-violet-300" : isSMA ? "bg-teal-800" : "bg-green-300") :
                      (isSMP ? "bg-violet-500" : isSMA ? "bg-teal-500" : "bg-green-500")
                   )}
                   title={`Hari ke-${i+1}`}
                />
             )
          })}
       </div>
       <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>2 Bulan Terakhir</span>
          <div className="flex items-center gap-1">
             <span>Kurang</span>
             <div className={cn("w-2 h-2 rounded-sm", (isUni || isSMA) ? "bg-white/10" : "bg-slate-100")} />
             <div className={cn("w-2 h-2 rounded-sm", isSMP ? "bg-violet-300" : isSMA ? "bg-teal-800" : "bg-green-300")} />
             <div className={cn("w-2 h-2 rounded-sm", isSMP ? "bg-violet-500" : isSMA ? "bg-teal-500" : "bg-green-500")} />
             <span>Aktif</span>
          </div>
       </div>

       <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
          <div>
             <p className="text-xs text-gray-400 uppercase font-bold">Modul Selesai</p>
             <p className={cn("text-2xl font-bold", textPrimary)}>{userProfile?.completedModules?.length || 0}</p>
          </div>
          <div>
             <p className="text-xs text-gray-400 uppercase font-bold">Gabung Sejak</p>
             <p className={cn("text-lg font-bold", textPrimary)}>
                {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : "-"}
             </p>
          </div>
       </div>
    </div>
  );
}