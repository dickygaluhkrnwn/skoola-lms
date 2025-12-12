"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, X, ArrowRight, RotateCcw, HelpCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuizQuestion } from "@/lib/types/course.types"; 
import { useSound } from "@/hooks/use-sound";
import { useTheme } from "@/lib/theme-context";

// Asumsi struktur Flashcard yang masuk adalah object dengan front/back (atau QuizQuestion yang di-adapt)
interface FlashcardItem {
    type: 'flashcard';
    front: string;
    back: string;
    explanation?: string;
    // ... properti lain jika ada
}

// Menggunakan tipe QuizQuestion sebagai base, dan menambahkan FlashcardItem untuk fleksibilitas
type QuizEngineContent = QuizQuestion | FlashcardItem;

interface QuizEngineProps {
  lessonTitle: string;
  content: QuizEngineContent[]; // Menggunakan union type yang lebih aman
  xpReward: number;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export default function QuizEngine({ 
  lessonTitle, 
  content, 
  xpReward, 
  onComplete, 
  onExit 
}: QuizEngineProps) {
  const { theme } = useTheme(); 
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Quiz State
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [arrangedWords, setArrangedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Score State
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5); 
  const [showResult, setShowResult] = useState(false);

  // Flashcard State
  const [isFlipped, setIsFlipped] = useState(false);

  const { playSound } = useSound(); 

  const currentItem = content[currentIndex] as QuizEngineContent;
  const progress = content.length > 0 ? ((currentIndex) / content.length) * 100 : 0;

  // Helper Theme Colors
  const isSMP = theme === "smp";
  const isKids = theme === "sd";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  // Reset state saat pindah soal
  useEffect(() => {
    setSelectedAnswer(null);
    setTextAnswer("");
    setIsChecked(false);
    setIsCorrect(false);
    setIsFlipped(false);

    if (currentItem?.type === 'arrange') {
      const q = currentItem as QuizQuestion;
      // Memastikan correctAnswer adalah array untuk tipe 'arrange'
      if (Array.isArray(q.correctAnswer)) {
        const shuffled = [...q.correctAnswer].sort(() => Math.random() - 0.5);
        setAvailableWords(shuffled);
        setArrangedWords([]);
      }
    }
  }, [currentIndex, currentItem]);

  // --- ACTIONS ---
  const handleCheck = () => {
    if (isChecked) {
      handleNext();
      return;
    }

    if (currentItem.type === 'flashcard') {
      handleNext();
      return;
    }

    let correct = false;
    const q = currentItem as QuizQuestion;

    // Gabungkan tipe yang menggunakan pilihan (MC, Listening, True-False, Drag-Match)
    if (q.type === 'multiple-choice' || q.type === 'true-false' || q.type === 'drag-match' || (q.type as string) === 'listening') { 
        const correctAnswerString = String(q.correctAnswer); 
        
        // Cek apakah selectedAnswer (index string) cocok dengan correctAnswer (string/number)
        correct = selectedAnswer === correctAnswerString || selectedAnswer === String(q.options?.[Number(q.correctAnswer)]);
    } 
    // Gabungkan tipe yang menggunakan input teks (short-answer, fill-blank)
    else if (q.type === 'short-answer' || (q.type as string) === 'fill-blank') { 
      const correctText = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
      
      // FIX 1 & 3: Pastikan konversi ke string dan casting eksplisit untuk .trim()
      const userAnswerString: string = String(textAnswer);
      const correctTextString: string = String(correctText);
      
      const userAnswerClean = userAnswerString.trim().toLowerCase(); 
      const correctAnswerClean = correctTextString.trim().toLowerCase(); 
      
      correct = userAnswerClean === correctAnswerClean;
    } 
    else if (q.type === 'arrange') {
      const userAnswer = arrangedWords.join(" ");
      const correctAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(" ") : q.correctAnswer;
      correct = userAnswer.trim() === correctAnswer.trim();
    }

    setIsCorrect(correct);
    setIsChecked(true);

    if (correct) {
      setScore(prev => prev + 10); 
      playSound("correct");
    } else {
      setLives(prev => Math.max(0, prev - 1));
      playSound("wrong");
    }
  };

  const handleNext = () => {
    if (lives === 0) {
      onComplete(0);
      return;
    }

    if (currentIndex < content.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowResult(true);
      // Hitung skor akhir berdasarkan persentase jawaban benar (bukan hanya +10)
      const maxScore = content.filter(c => c.type !== 'flashcard').length * 10;
      const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100;

      onComplete(finalScore); // Panggil onComplete dari sini
      playSound("levelUp");
    }
  };

  const handleWordClick = (word: string, fromSource: boolean) => {
    if (isChecked) return;

    if (fromSource) {
      setAvailableWords(prev => prev.filter(w => w !== word));
      setArrangedWords(prev => [...prev, word]);
    } else {
      setArrangedWords(prev => prev.filter(w => w !== word));
      setAvailableWords(prev => [...prev, word]);
    }
    playSound("click");
  };

  // --- RENDERERS ---

  const renderFlashcard = (card: FlashcardItem) => (
    <div className="flex flex-col items-center justify-center py-8">
      <div 
        className="relative w-full max-w-sm aspect-[4/5] perspective-1000 cursor-pointer group"
        onClick={() => { setIsFlipped(!isFlipped); playSound("click"); }}
      >
        <motion.div
          className="w-full h-full relative preserve-3d transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {/* FRONT */}
          <div className={cn(
            "absolute inset-0 backface-hidden rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 text-white border-4 border-white/20",
            isSMP ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-violet-500/30" : 
            isKids ? "bg-gradient-to-br from-blue-400 to-blue-500" : 
            isSMA ? "bg-gradient-to-br from-teal-600 to-slate-800 shadow-teal-500/30 border-teal-500/20" :
            isUni ? "bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]" :
            "bg-slate-800"
          )}>
            <span className="text-6xl mb-6 drop-shadow-md">🤔</span>
            <h3 className="text-3xl font-bold text-center">{card.front}</h3>
            <p className={cn("mt-8 text-sm font-semibold uppercase tracking-widest animate-pulse", (isSMA || isUni) ? "text-teal-200" : "text-white/70")}>Ketuk untuk balik</p>
          </div>

          {/* BACK */}
          <div className={cn(
            "absolute inset-0 backface-hidden rotate-y-180 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 border-4",
            isSMP ? "bg-white border-violet-100" : 
            isKids ? "bg-white border-blue-100" : 
            isSMA ? "bg-slate-900 border-teal-900/50 text-slate-200" :
            isUni ? "bg-slate-950 border-indigo-500/50 text-slate-100" :
            "bg-white border-gray-200"
          )}>
            <span className="text-6xl mb-6">💡</span>
            <h3 className={cn("text-3xl font-bold text-center", isSMA ? "text-teal-400" : isUni ? "text-indigo-400" : "text-slate-800")}>{card.back}</h3>
            {card.explanation && (
              <div className={cn(
                "mt-6 p-3 rounded-xl border w-full",
                isSMP ? "bg-fuchsia-50 border-fuchsia-100 text-fuchsia-800" : 
                isSMA ? "bg-teal-950/50 border-teal-900 text-teal-300" :
                isUni ? "bg-indigo-950/30 border-indigo-900/50 text-indigo-200" :
                "bg-blue-50 border-blue-100 text-slate-600"
              )}>
                <p className="text-sm text-center font-medium">{card.explanation}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderQuiz = (q: QuizQuestion) => {
    switch (q.type) {
      case 'multiple-choice':
      case 'listening' as any: // Cast untuk kompatibilitas legacy data
      case 'true-false': 
      case 'drag-match':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {q.options?.map((option, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!isChecked) {
                    // Simpan jawaban dalam bentuk index string
                    setSelectedAnswer(String(idx)); 
                    playSound("click");
                  }
                }}
                disabled={isChecked}
                className={cn(
                  "p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group shadow-sm",
                  // Default State
                  String(selectedAnswer) === String(idx) 
                    ? (isSMP ? "border-violet-500 bg-violet-50 text-violet-900 shadow-violet-200" : 
                       isSMA ? "border-teal-500 bg-teal-500/10 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.3)]" :
                       isUni ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.4)]" :
                       "border-sky-500 bg-sky-50 text-sky-900")
                    : ((isSMA || isUni) ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10" : 
                       "border-gray-200 hover:border-gray-300 hover:bg-gray-50"),
                  
                  // Correct State
                  isChecked && String(q.correctAnswer) === String(idx) && (
                      (isSMA || isUni) ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]" : 
                      "border-green-500 bg-green-50 text-green-800 ring-2 ring-green-200"
                  ),
                  
                  // Wrong State (jika dipilih salah)
                  isChecked && String(selectedAnswer) === String(idx) && String(selectedAnswer) !== String(q.correctAnswer) && (
                      (isSMA || isUni) ? "border-rose-500 bg-rose-500/20 text-rose-300" : 
                      "border-red-500 bg-red-50 text-red-800 ring-2 ring-red-200"
                  )
                )}
              >
                <div className="flex items-center justify-between">
                   <span className="font-bold text-lg">{option}</span>
                   {isChecked && String(q.correctAnswer) === String(idx) && <CheckCircle2 className={cn((isSMA || isUni) ? "text-emerald-400" : "text-green-600")} size={24} />}
                   {isChecked && String(selectedAnswer) === String(idx) && String(selectedAnswer) !== String(q.correctAnswer) && <XCircle className={cn((isSMA || isUni) ? "text-rose-500" : "text-red-500")} size={24} />}
                </div>
              </motion.button>
            ))}
          </div>
        );

      case 'fill-blank' as any: // Cast untuk kompatibilitas legacy data
      case 'short-answer': 
        return (
          <div className="max-w-md mx-auto mt-8">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={isChecked}
              placeholder="Ketik jawabanmu..."
              className={cn(
                "w-full p-4 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all shadow-sm focus:shadow-md",
                isChecked && isCorrect ? ((isSMA || isUni) ? "border-emerald-500 bg-emerald-950/30 text-emerald-400" : "border-green-500 bg-green-50 text-green-700") :
                isChecked && !isCorrect ? ((isSMA || isUni) ? "border-rose-500 bg-rose-950/30 text-rose-400" : "border-red-500 bg-red-50 text-red-700") :
                (isSMP ? "border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100" : 
                 (isSMA || isUni) ? "bg-slate-900/50 border-white/10 text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-600" :
                 "border-gray-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100")
              )}
            />
            {isChecked && !isCorrect && (
              <div className="mt-4 p-3 rounded-lg text-center font-medium animate-in fade-in slide-in-from-bottom-2 border border-green-200 bg-green-100 text-green-800">
                Jawaban benar: <span className="font-bold">{String(q.correctAnswer)}</span>
              </div>
            )}
          </div>
        );

      case 'arrange':
        return (
          <div className="mt-8 space-y-8">
            {/* Area Jawaban */}
            <div className={cn(
                "min-h-[100px] border-2 border-dashed rounded-2xl flex flex-wrap justify-center gap-2 p-6 transition-colors items-center",
                isSMP ? "bg-violet-50/50 border-violet-200" : 
                (isSMA || isUni) ? "bg-white/5 border-white/10" :
                "bg-slate-50 border-slate-200"
            )}>
                {arrangedWords.length === 0 && !isChecked && (
                  <span className={cn("italic flex items-center gap-2", (isSMA || isUni) ? "text-slate-500" : "text-slate-400")}>
                      <HelpCircle size={16} /> Ketuk kata di bawah untuk menyusun
                  </span>
                )}
                {arrangedWords.map((word, idx) => (
                  <motion.button 
                    layoutId={`word-${word}-${idx}`} // Unik ID untuk animasi
                    key={`arranged-${word}-${idx}`} 
                    onClick={() => handleWordClick(word, false)}
                    className={cn(
                        "px-4 py-2 rounded-xl font-bold shadow-sm transition-colors border-2",
                        isSMP ? "bg-white border-violet-200 text-violet-700 hover:border-red-200 hover:text-red-500" : 
                        (isSMA || isUni) ? "bg-slate-800 border-slate-600 text-slate-200 hover:border-rose-500/50 hover:text-rose-400" :
                        "bg-white border-sky-200 text-sky-700 hover:text-red-500"
                    )}
                  >
                    {word}
                  </motion.button>
                ))}
            </div>

            {/* Area Pilihan Kata */}
            <div className="flex flex-wrap justify-center gap-3">
              {availableWords.map((word, idx) => (
                <motion.button 
                  layoutId={`word-${word}-${idx}`}
                  key={`avail-${word}-${idx}`}
                  onClick={() => handleWordClick(word, true)}
                  disabled={isChecked}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                      "border-2 shadow-sm text-lg px-6 py-3 rounded-xl font-medium transition-all",
                      (isSMA || isUni) ? "bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-700 hover:border-white/20" :
                      "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                  )}
                >
                  {word}
                </motion.button>
              ))}
            </div>

            {isChecked && !isCorrect && (
                <div className="p-4 rounded-xl text-center border bg-green-50 text-green-800 border-green-200">
                    <p className="text-xs font-bold uppercase mb-1 text-green-600">Susunan Benar</p>
                    <p className="font-bold text-lg">{Array.isArray(q.correctAnswer) ? q.correctAnswer.join(" ") : q.correctAnswer}</p>
                </div>
            )}
          </div>
        )

      default:
        return <div className="text-center text-gray-400 py-10">Tipe soal belum didukung.</div>;
    }
  }

  // --- RESULT SCREEN ---
  if (showResult) {
    const maxScore = content.filter(c => c.type !== 'flashcard').length * 10;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100;
    
    return (
      <div className={cn(
          "flex flex-col items-center justify-center min-h-screen p-6 text-center animate-in zoom-in-95 duration-500",
          (isSMA || isUni) ? "bg-slate-950 text-slate-100" : "bg-white"
      )}>
        <div className={cn(
           "w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-lg relative",
           isSMP ? "bg-violet-100" : isSMA ? "bg-teal-900/30 shadow-[0_0_30px_rgba(20,184,166,0.3)]" : isUni ? "bg-indigo-900/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]" : "bg-yellow-100"
        )}>
          <Trophy size={64} className={cn("animate-bounce", isUni ? "text-indigo-400" : "text-teal-400")} />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white dark:border-slate-800">
              {percentage >= 90 ? "A+" : percentage >= 70 ? "B" : "C"}
          </div>
        </div>
        <h1 className={cn("text-3xl font-extrabold mb-2", (isSMA || isUni) ? "text-white" : "text-slate-800")}>Pelajaran Selesai!</h1>
        <p className={cn("mb-8 max-w-xs", (isSMA || isUni) ? "text-slate-400" : "text-slate-500")}>Kamu telah menyelesaikan sesi ini dengan sangat baik.</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          <div className={cn("p-4 rounded-2xl border", 
              isSMP ? "bg-violet-50 border-violet-100" : 
              (isSMA || isUni) ? "bg-white/5 border-white/10" :
              "bg-sky-50 border-sky-100"
          )}>
            <div className="font-bold text-xs uppercase tracking-wider mb-1 text-sky-500">Total XP</div>
            <div className="text-3xl font-black">{xpReward}</div>
          </div>
          <div className className={cn("p-4 rounded-2xl border", 
             (isSMA || isUni) ? "bg-orange-950/30 border-orange-900/50" : "bg-orange-50 border-orange-100"
          )}>
            <div className="text-orange-500 font-bold text-xs uppercase tracking-wider mb-1">Akurasi</div>
            <div className={cn("text-3xl font-black", (isSMA || isUni) ? "text-orange-300" : "text-slate-800")}>{percentage}%</div>
          </div>
        </div>

        <Button 
          onClick={() => onComplete(percentage)} 
          className={cn(
             "w-full max-w-xs font-bold py-4 rounded-xl transition-all hover:translate-y-[-2px]",
             isSMA ? "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/50" : 
             isUni ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50" :
             "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200"
          )}
        >
          Lanjut ke Dashboard
        </Button>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className={cn(
        "min-h-screen flex flex-col max-w-2xl mx-auto shadow-2xl transition-colors duration-500",
        isSMP ? "bg-white/90 backdrop-blur-xl shadow-violet-500/10" : 
        (isSMA || isUni) ? "bg-slate-950/80 backdrop-blur-2xl shadow-black/50 border-x border-white/5" :
        "bg-white shadow-slate-100/50"
    )}>
      
      {/* TOP BAR */}
      <div className={cn("p-4 flex items-center gap-4 border-b sticky top-0 z-20 backdrop-blur-md", 
          (isSMA || isUni) ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-100"
      )}>
        <button onClick={onExit} className={cn("p-2 rounded-full transition-colors", 
           (isSMA || isUni) ? "hover:bg-white/10 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
        )}>
          <X size={24} />
        </button>
        <div className={cn("flex-1 h-3 rounded-full overflow-hidden relative", (isSMA || isUni) ? "bg-slate-800" : "bg-slate-100")}>
          <motion.div 
            className={cn("h-full rounded-full", 
                isSMP ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : 
                isSMA ? "bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_10px_rgba(20,184,166,0.5)]" :
                isUni ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" :
                "bg-green-500"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border",
            (isSMA || isUni) ? "text-rose-400 bg-rose-950/30 border-rose-900/50" : "text-red-500 bg-red-50 border-red-100"
        )}>
          <span>❤️</span>
          <span>{lives}</span>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 p-6 flex flex-col justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* Header Text */}
            {currentItem.type === 'flashcard' ? (
                <div className="text-center mb-6">
                    <span className={cn(
                        "inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3",
                        isSMP ? "bg-violet-100 text-violet-600" : 
                        isSMA ? "bg-teal-950/50 text-teal-400 border border-teal-900" :
                        isUni ? "bg-indigo-950/50 text-indigo-400 border border-indigo-900" :
                        "bg-blue-100 text-blue-600"
                    )}>
                        Kartu Pintar
                    </span>
                    <h2 className={cn("text-2xl font-bold", (isSMA || isUni) ? "text-slate-100" : "text-slate-800")}>Hafalkan Konsep Ini</h2>
                </div>
            ) : (
                <h2 className={cn("text-2xl md:text-3xl font-bold mb-8 text-center leading-relaxed", (isSMA || isUni) ? "text-slate-100" : "text-slate-800")}>
                    {(currentItem as QuizQuestion).text}
                </h2>
            )}

            {/* Media */}
            {currentItem.type !== 'flashcard' && (currentItem as QuizQuestion).mediaUrl && (
              <div className={cn("mb-8 rounded-2xl overflow-hidden shadow-sm border-2", (isSMA || isUni) ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50")}>
                <img src={(currentItem as QuizQuestion).mediaUrl} alt="Soal Visual" className="w-full h-auto object-contain max-h-64 mx-auto" />
              </div>
            )}

            {/* Render Body */}
            {currentItem.type === 'flashcard' 
                ? renderFlashcard(currentItem as FlashcardItem)
                : renderQuiz(currentItem as QuizQuestion)
            }

          </motion.div>
        </AnimatePresence>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className={cn(
        "p-6 border-t transition-colors duration-300 safe-area-pb sticky bottom-0 z-20 backdrop-blur-md",
        isChecked 
          ? (isCorrect || currentItem.type === 'flashcard' 
              ? ((isSMA || isUni) ? "bg-emerald-950/80 border-emerald-900" : "bg-green-50 border-green-200") 
              : ((isSMA || isUni) ? "bg-rose-950/80 border-rose-900" : "bg-red-50 border-red-200")
            ) 
          : ((isSMA || isUni) ? "bg-slate-950/80 border-white/10" : "bg-white border-slate-100")
      )}>
        <div className="max-w-2xl mx-auto flex justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            {isChecked && currentItem.type !== 'flashcard' ? (
                <div className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0", 
                      isCorrect 
                        ? ((isSMA || isUni) ? "bg-emerald-900 text-emerald-400" : "bg-white text-green-500") 
                        : ((isSMA || isUni) ? "bg-rose-900 text-rose-400" : "bg-white text-red-500")
                  )}>
                      {isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </div>
                  <div className="overflow-hidden">
                      <div className={cn("font-bold text-lg leading-tight", 
                          isCorrect 
                            ? ((isSMA || isUni) ? "text-emerald-400" : "text-green-800") 
                            : ((isSMA || isUni) ? "text-rose-400" : "text-red-800")
                      )}>
                          {isCorrect ? "Benar Sekali!" : "Yah, Kurang Tepat..."}
                      </div>
                      {!isCorrect && (currentItem as QuizQuestion).explanation && (
                          <p className={cn("text-sm mt-1 truncate", (isSMA || isUni) ? "text-rose-300/80" : "text-red-700/80")}>{(currentItem as QuizQuestion).explanation}</p>
                      )}
                  </div>
                </div>
            ) : currentItem.type === 'flashcard' ? (
                <div className="text-sm font-medium flex items-center gap-2">
                   <RotateCcw size={16} /> Ketuk kartu untuk membalik
                </div>
            ) : (
                <div className={cn("hidden md:block text-sm font-bold uppercase tracking-wider", (isSMA || isUni) ? "text-slate-500" : "text-slate-400")}>
                    Jawab soal untuk melanjutkan
                </div>
            )}
          </div>

          <Button 
            onClick={handleCheck}
            disabled={!isChecked && currentItem.type !== 'flashcard' && !selectedAnswer && !textAnswer && arrangedWords.length === 0}
            className={cn(
              "px-8 py-6 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 active:shadow-none ml-auto text-lg",
              isChecked || currentItem.type === 'flashcard'
                ? (isCorrect || currentItem.type === 'flashcard' ? "bg-green-500 hover:bg-green-600 shadow-green-200" : "bg-red-500 hover:bg-red-600 shadow-red-200")
                : (isSMP ? "bg-violet-600 hover:bg-violet-700 shadow-violet-200" : isSMA ? "bg-teal-600 hover:bg-teal-500 shadow-teal-500/20" : isUni ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20" : "bg-sky-500 hover:bg-sky-600 shadow-sky-200")
            )}
          >
            {isChecked || currentItem.type === 'flashcard' ? (
                <span className="flex items-center gap-2">Lanjut <ArrowRight size={20}/></span>
            ) : "Periksa"}
          </Button>
        </div>
      </div>
    </div>
  );
}