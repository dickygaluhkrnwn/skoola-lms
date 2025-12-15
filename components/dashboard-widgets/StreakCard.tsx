import React from "react";
import { Flame, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCardProps {
  streak?: number;
  isActive?: boolean; // Apakah sudah mengerjakan tantangan hari ini?
  className?: string;
}

export function StreakCard({ streak = 0, isActive = false, className }: StreakCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      {/* Background Pattern (Optional decoration) */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-100/50 dark:bg-orange-900/20 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Streak Harian
            </h3>
            <div className="group relative">
              <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              <div className="absolute left-0 top-6 hidden w-48 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600 shadow-lg group-hover:block z-10 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                Belajar setiap hari untuk menjaga api semangatmu tetap menyala!
              </div>
            </div>
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {streak}
            </span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Hari
            </span>
          </div>

          <p className="mt-2 text-xs font-medium text-orange-600 dark:text-orange-400">
            {isActive 
              ? "Api menyala! 🔥" 
              : "Ayo belajar agar api tidak padam!"}
          </p>
        </div>

        {/* Icon Visual */}
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
          isActive 
            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600" 
            : "bg-slate-100 dark:bg-slate-800 text-slate-400 grayscale"
        )}>
          <Flame 
            className={cn(
              "h-8 w-8",
              isActive && "fill-orange-600 animate-pulse"
            )} 
          />
        </div>
      </div>
    </div>
  );
}