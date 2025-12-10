"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, RefreshCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useSound } from "@/hooks/use-sound"; // Import Hook Suara

// Tipe Data untuk Soal
export type Question = {
  id: string;
  type: "multiple-choice" | "arrange";
  question: string;
  image?: string; 
  options: string[];
  correctAnswer: string;
};

interface QuizEngineProps {
  lessonTitle: string;
  questions: Question[];
  xpReward: number;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export default function QuizEngine({ lessonTitle, questions, xpReward, onComplete, onExit }: QuizEngineProps) {
  const { playSound } = useSound(); // Init Sound
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  // Handle Cek Jawaban
  const handleCheck = () => {
    if (!selectedOption) return;

    if (selectedOption === currentQuestion.correctAnswer) {
      setStatus("correct");
      setScore(prev => prev + 1);
      playSound("correct"); // SOUND ON!
    } else {
      setStatus("wrong");
      playSound("wrong"); // SOUND ON!
    }
  };

  // Handle Lanjut Soal
  const handleNext = () => {
    playSound("click"); // Efek klik
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setStatus("idle");
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsCompleted(true);
    playSound("levelUp"); // Suara Selesai
    
    // Trigger Confetti jika nilai bagus
    if (score > questions.length / 2) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // --- TAMPILAN HASIL (RESULT SCREEN) ---
  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in zoom-in">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🏆</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Lesson Complete!</h2>
        <p className="text-gray-500 mb-8">Kamu menjawab {score} dari {questions.length} soal dengan benar.</p>
        
        <div className="flex items-center gap-2 bg-yellow-50 px-6 py-3 rounded-xl border border-yellow-200 mb-8">
          <span className="text-yellow-600 font-bold text-xl">+{xpReward} XP</span>
        </div>

        <Button onClick={() => onComplete(score)} size="lg" className="w-full max-w-xs bg-sky-500 hover:bg-sky-600">
          Lanjut
        </Button>
      </div>
    );
  }

  // --- TAMPILAN KUIS ---
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto relative">
      
      {/* 1. Header & Progress Bar */}
      <div className="flex items-center gap-4 p-4 md:p-6">
        <button onClick={onExit} className="text-gray-400 hover:text-gray-600 transition-colors">
          <XCircle size={24} />
        </button>
        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-sky-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 2. Soal Area */}
      <div className="flex-1 flex flex-col justify-center p-4 md:p-6 overflow-y-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 leading-snug">
          {currentQuestion.question}
        </h2>

        {/* Gambar Soal (Jika Ada) */}
        {currentQuestion.image && (
           <div className="mb-6 rounded-2xl overflow-hidden border-2 border-gray-100 max-h-60 w-fit mx-auto shadow-sm">
              <img src={currentQuestion.image} alt="Soal" className="object-cover h-full" />
           </div>
        )}

        {/* Pilihan Jawaban (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            let btnColor = "border-gray-200 hover:bg-gray-50 bg-white hover:border-gray-300";
            
            if (isSelected) {
              btnColor = "border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-200";
              if (status === "correct") btnColor = "border-green-500 bg-green-100 text-green-800 ring-2 ring-green-200";
              if (status === "wrong") btnColor = "border-red-500 bg-red-100 text-red-800 ring-2 ring-red-200";
            } else if (status === "wrong" && option === currentQuestion.correctAnswer) {
               btnColor = "border-green-500 bg-white text-green-600 border-dashed"; 
            }

            return (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                   if (status === 'idle') {
                     setSelectedOption(option);
                     playSound("click");
                   }
                }}
                disabled={status !== "idle"}
                className={cn(
                  "p-4 rounded-xl border-2 text-left font-medium text-lg transition-all shadow-sm",
                  btnColor
                )}
              >
                <div className="flex items-center justify-between">
                  {option}
                  {isSelected && status === "correct" && <CheckCircle2 className="text-green-600" />}
                  {isSelected && status === "wrong" && <XCircle className="text-red-600" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 3. Footer Action */}
      <div className={cn(
        "p-4 md:p-6 border-t transition-colors duration-300 pb-8",
        status === "correct" ? "bg-green-100 border-green-200" : 
        status === "wrong" ? "bg-red-100 border-red-200" : "bg-white border-gray-100"
      )}>
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          
          <div className="flex-1">
            {status === "correct" && (
              <div className="flex items-center gap-2 text-green-800 font-bold text-xl animate-in slide-in-from-bottom-2">
                <CheckCircle2 size={28} />
                <span>Kerja Bagus!</span>
              </div>
            )}
            {status === "wrong" && (
              <div className="flex flex-col animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-red-800 font-bold text-xl">
                  <XCircle size={28} />
                  <span>Kurang Tepat...</span>
                </div>
                <p className="text-red-700 text-sm ml-9">Jawaban benar: <span className="font-bold">{currentQuestion.correctAnswer}</span></p>
              </div>
            )}
          </div>

          <Button 
            size="lg" 
            className={cn(
              "px-8 font-bold text-lg min-w-[140px] transition-all",
              status === "idle" ? "bg-gray-200 text-gray-400 hover:bg-gray-200 cursor-not-allowed" : "",
              selectedOption && status === "idle" ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[4px]" : "",
              status === "correct" ? "bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_0_rgb(20,83,45)]" : "",
              status === "wrong" ? "bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_0_rgb(127,29,29)]" : ""
            )}
            onClick={status === "idle" ? handleCheck : handleNext}
            disabled={!selectedOption && status === "idle"}
          >
            {status === "idle" ? "Cek" : "Lanjut"}
          </Button>
        </div>
      </div>

    </div>
  );
}