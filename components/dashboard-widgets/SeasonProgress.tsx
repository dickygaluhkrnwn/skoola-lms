import React from "react";
import { Calendar, Lock, Award, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SeasonProgressProps {
  seasonName?: string;    // Contoh: "Petualangan Angkasa"
  month?: string;         // Contoh: "Desember"
  currentPoints?: number;
  maxPoints?: number;
  level?: number;
  isCompleted?: boolean;
  className?: string;
  onClaim?: () => void;
}

export function SeasonProgress({
  seasonName = "Musim Eksplorasi",
  month = "Bulan Ini",
  currentPoints = 350,
  maxPoints = 1000,
  level = 1,
  isCompleted = false,
  className,
  onClaim
}: SeasonProgressProps) {
  
  // Hitung persentase progress (min 0, max 100)
  const progressPercentage = Math.min(100, Math.max(0, (currentPoints / maxPoints) * 100));

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-sm",
      "border-slate-200 dark:border-slate-800",
      className
    )}>
      {/* Background Decor: Radial Gradient halus di pojok */}
      <div className="absolute right-0 top-0 h-40 w-40 -mr-10 -mt-10 rounded-full bg-blue-50 dark:bg-blue-900/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        
        {/* Header: Season Label & Level */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
            <Calendar className="h-3 w-3" />
            <span>Season {month}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
             <Star className="h-3 w-3 fill-slate-300 dark:fill-slate-600 text-slate-300 dark:text-slate-600" />
             <span>Level {level}</span>
          </div>
        </div>

        {/* Main Title */}
        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1 leading-tight">
            {seasonName}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kumpulkan XP untuk membuka Badge Eksklusif bulan ini!
          </p>
        </div>

        {/* Progress Bar Section */}
        <div className="space-y-2 mb-6 mt-auto">
          <div className="flex justify-between text-xs font-bold">
             <span className="text-blue-600 dark:text-blue-400">{currentPoints} XP</span>
             <span className="text-slate-400 dark:text-slate-500">Target: {maxPoints} XP</span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className={cn(
                "h-full transition-all duration-700 ease-out rounded-full",
                isCompleted 
                  ? "bg-gradient-to-r from-green-400 to-emerald-500" 
                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Rewards / Footer Status */}
        <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 transition-colors",
            isCompleted
              ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-500/30"
              : "border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-700 dark:bg-slate-800"
          )}>
            <Award className={cn("h-6 w-6", isCompleted && "fill-emerald-600 animate-bounce")} />
          </div>
          
          <div className="flex-1 min-w-0">
             <p className={cn(
               "text-sm font-bold truncate",
               isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
             )}>
               {isCompleted ? "Badge Terbuka!" : "Badge Misterius"}
             </p>
             <p className="text-xs text-slate-500 truncate">
               {isCompleted ? "Klaim hadiahmu sekarang." : "Selesaikan misi untuk membuka."}
             </p>
          </div>

          {isCompleted ? (
            <Button 
              size="sm" 
              onClick={onClaim}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
            >
              Klaim
            </Button>
          ) : (
             <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
               <Lock className="h-4 w-4" />
             </div>
          )}
        </div>

      </div>
    </div>
  );
}