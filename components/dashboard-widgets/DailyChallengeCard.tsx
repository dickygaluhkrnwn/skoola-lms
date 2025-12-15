import React from "react";
import { Brain, CheckCircle2, Zap, Trophy, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DailyChallengeCardProps {
  isCompleted?: boolean;
  xpReward?: number;
  type?: "quiz" | "word" | "puzzle";
  onPlay?: () => void;
  className?: string;
}

export function DailyChallengeCard({ 
  isCompleted = false, 
  xpReward = 50, 
  type = "quiz", 
  onPlay,
  className 
}: DailyChallengeCardProps) {
  
  const getChallengeIcon = () => {
    switch(type) {
      case "word": return <Brain className="h-6 w-6" />;
      case "puzzle": return <Zap className="h-6 w-6" />;
      default: return <Trophy className="h-6 w-6" />; // Quiz default
    }
  };

  const getChallengeTitle = () => {
    switch(type) {
      case "word": return "Tebak Kata";
      case "puzzle": return "Logika Cepat";
      default: return "Kuis Kilat";
    }
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all",
      isCompleted 
        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800" 
        : "bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-transparent shadow-lg shadow-indigo-500/20",
      className
    )}>
      
      {/* Decorative Background Elements for Active State */}
      {!isCompleted && (
        <>
          <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
        </>
      )}

      <div className="relative z-10 flex flex-col h-full justify-between">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "p-3 rounded-xl backdrop-blur-md",
            isCompleted ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-white/20 text-white"
          )}>
            {getChallengeIcon()}
          </div>
          
          {isCompleted ? (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
              <CheckCircle2 size={16} />
              <span>Selesai</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-yellow-300 font-bold text-sm bg-white/10 px-3 py-1 rounded-full border border-white/20">
              <Zap size={14} className="fill-yellow-300" />
              <span>+{xpReward} XP</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className={cn(
            "text-lg font-bold mb-1",
            isCompleted ? "text-slate-800 dark:text-slate-200" : "text-white"
          )}>
            {isCompleted ? "Tantangan Selesai!" : "Tantangan Harian"}
          </h3>
          <p className={cn(
            "text-sm",
            isCompleted ? "text-slate-500 dark:text-slate-400" : "text-indigo-100"
          )}>
            {isCompleted 
              ? "Hebat! Kamu sudah mengasah otakmu hari ini." 
              : `Mainkan "${getChallengeTitle()}" untuk menjaga streakmu.`}
          </p>
        </div>

        {/* Action Button */}
        {!isCompleted && (
          <Button 
            onClick={onPlay}
            variant="secondary"
            className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-0 font-bold shadow-lg"
          >
            <Play size={16} className="mr-2 fill-indigo-600" />
            Main Sekarang
          </Button>
        )}
        
        {isCompleted && (
           <div className="mt-auto">
             <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-full" />
             </div>
             <p className="text-xs text-center mt-2 text-emerald-600 dark:text-emerald-400 font-medium">
               Kembali lagi besok!
             </p>
           </div>
        )}

      </div>
    </div>
  );
}