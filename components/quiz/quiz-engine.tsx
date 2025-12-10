"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuizQuestion } from "@/lib/types/course.types"; // Menggunakan tipe data dari lib utama
import { useSound } from "@/hooks/use-sound"; // Import hook Anda

interface QuizEngineProps {
  lessonTitle: string;
  questions: QuizQuestion[]; 
  xpReward: number;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export default function QuizEngine({ 
  lessonTitle, 
  questions, 
  xpReward, 
  onComplete, 
  onExit 
}: QuizEngineProps) {
  // --- STATE ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null); // Untuk Multiple Choice
  const [textAnswer, setTextAnswer] = useState(""); // Untuk Fill Blank
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5); 
  const [showResult, setShowResult] = useState(false);

  // --- SOUNDS INTEGRATION (FIXED) ---
  // Kita panggil hook sekali saja sesuai definisi di file Anda
  const { playSound } = useSound(); 

  const currentQuestion = questions[currentIndex];
  // Hitung progress bar (0 sampai 100)
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  // --- ACTIONS ---
  const handleCheck = () => {
    if (isChecked) {
      handleNext();
      return;
    }

    let correct = false;

    // Logika pengecekan berdasarkan tipe soal
    if (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'listening') {
      correct = selectedAnswer === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === 'fill-blank') {
      // Normalisasi jawaban (case insensitive & trim whitespace)
      const correctText = Array.isArray(currentQuestion.correctAnswer) 
        ? currentQuestion.correctAnswer[0] 
        : currentQuestion.correctAnswer;
        
      const userAnswerClean = textAnswer.trim().toLowerCase();
      const correctAnswerClean = String(correctText).trim().toLowerCase();
      
      correct = userAnswerClean === correctAnswerClean;
    }

    setIsCorrect(correct);
    setIsChecked(true);

    if (correct) {
      setScore(prev => prev + 10); 
      playSound("correct"); // Panggil sesuai key di hooks/use-sound.ts
    } else {
      setLives(prev => Math.max(0, prev - 1));
      playSound("wrong"); // Panggil sesuai key di hooks/use-sound.ts
    }
  };

  const handleNext = () => {
    if (lives === 0) {
      onExit(); // Game Over
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setTextAnswer("");
      setIsChecked(false);
      setIsCorrect(false);
    } else {
      setShowResult(true);
      playSound("levelUp"); // Fanfare saat selesai
    }
  };

  // --- RENDERERS ---
  const renderContent = () => {
    switch (currentQuestion.type) {
      case 'multiple-choice':
      case 'listening': 
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options?.map((option, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!isChecked) {
                    setSelectedAnswer(option);
                    playSound("click");
                  }
                }}
                disabled={isChecked}
                className={cn(
                  "p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden",
                  selectedAnswer === option 
                    ? "border-sky-500 bg-sky-50 text-sky-700" 
                    : "border-gray-200 hover:bg-gray-50",
                  isChecked && option === currentQuestion.correctAnswer && "border-green-500 bg-green-100 text-green-700",
                  isChecked && selectedAnswer === option && !isCorrect && "border-red-500 bg-red-100 text-red-700"
                )}
              >
                <span className="font-bold text-lg">{option}</span>
                {isChecked && option === currentQuestion.correctAnswer && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </motion.button>
            ))}
          </div>
        );

      case 'fill-blank':
        return (
          <div className="max-w-md mx-auto mt-8">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={isChecked}
              placeholder="Ketik jawabanmu..."
              className={cn(
                "w-full p-4 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all",
                isChecked && isCorrect ? "border-green-500 bg-green-50 text-green-700" :
                isChecked && !isCorrect ? "border-red-500 bg-red-50 text-red-700" :
                "border-gray-300 focus:border-sky-500"
              )}
            />
            {isChecked && !isCorrect && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-center font-medium animate-in fade-in slide-in-from-bottom-2">
                Jawaban benar: <span className="font-bold">{String(currentQuestion.correctAnswer)}</span>
              </div>
            )}
          </div>
        );

      default:
        return <div className="text-center text-gray-400 py-10">Tipe soal ini ({currentQuestion.type}) belum didukung sepenuhnya.</div>;
    }
  };

  // --- RESULT SCREEN ---
  if (showResult) {
    const maxScore = questions.length * 10;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center animate-in zoom-in-95 duration-500">
        <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <span className="text-6xl">🏆</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Pelajaran Selesai!</h1>
        <p className="text-slate-500 mb-8">Kamu hebat! Terus tingkatkan kemampuanmu.</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
            <div className="text-sky-500 font-bold text-sm uppercase tracking-wider">Total XP</div>
            <div className="text-3xl font-black text-slate-800">+{xpReward}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
            <div className="text-orange-500 font-bold text-sm uppercase tracking-wider">Akurasi</div>
            <div className="text-3xl font-black text-slate-800">{percentage}%</div>
          </div>
        </div>

        <Button 
          onClick={() => onComplete(percentage)} 
          className="w-full max-w-xs bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all hover:translate-y-[-2px]"
        >
          Lanjut
        </Button>
      </div>
    );
  }

  // --- MAIN QUIZ UI ---
  return (
    <div className="min-h-screen flex flex-col bg-white max-w-2xl mx-auto shadow-2xl shadow-slate-100">
      
      {/* TOP BAR */}
      <div className="p-4 flex items-center gap-4 border-b border-slate-100">
        <button onClick={onExit} className="text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex items-center gap-1 text-red-500 font-bold">
          <span>❤️</span>
          <span>{lives}</span>
        </div>
      </div>

      {/* QUESTION AREA */}
      <div className="flex-1 p-6 flex flex-col justify-center">
        <motion.div
          key={currentIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center leading-relaxed">
            {currentQuestion.question}
          </h2>

          {currentQuestion.mediaUrl && (
            <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-slate-100">
              <img src={currentQuestion.mediaUrl} alt="Soal" className="w-full h-auto object-cover max-h-60" />
            </div>
          )}

          {renderContent()}
        </motion.div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className={cn(
        "p-4 border-t transition-colors duration-300",
        isChecked 
          ? (isCorrect ? "bg-green-100 border-green-200" : "bg-red-100 border-red-200") 
          : "bg-white border-slate-100"
      )}>
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          {isChecked ? (
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-white", isCorrect ? "text-green-500" : "text-red-500")}>
                {isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
              </div>
              <div>
                <div className={cn("font-bold text-lg", isCorrect ? "text-green-700" : "text-red-700")}>
                  {isCorrect ? "Benar Sekali!" : "Yah, Kurang Tepat..."}
                </div>
                {!isCorrect && currentQuestion.explanation && (
                  <p className="text-xs text-red-600/80">{currentQuestion.explanation}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:block text-slate-400 text-sm font-bold uppercase tracking-wider">
              Jawab soal untuk lanjut
            </div>
          )}

          <Button 
            onClick={handleCheck}
            disabled={!isChecked && !selectedAnswer && !textAnswer}
            className={cn(
              "px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md active:translate-y-[2px]",
              isChecked 
                ? (isCorrect ? "bg-green-500 hover:bg-green-600 shadow-green-200" : "bg-red-500 hover:bg-red-600 shadow-red-200")
                : "bg-sky-500 hover:bg-sky-600 shadow-sky-200"
            )}
          >
            {isChecked ? "Lanjut" : "Periksa"}
          </Button>
        </div>
      </div>

    </div>
  );
}