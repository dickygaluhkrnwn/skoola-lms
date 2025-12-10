"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, X, Volume2, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LessonContent, QuizQuestion, FlashcardContent } from "@/lib/types/course.types"; 
import { useSound } from "@/hooks/use-sound";

interface QuizEngineProps {
  lessonTitle: string;
  content: LessonContent[]; // Bisa Quiz atau Flashcard
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
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Quiz State
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [arrangedWords, setArrangedWords] = useState<string[]>([]); // Untuk tipe arrange
  const [availableWords, setAvailableWords] = useState<string[]>([]); // Untuk tipe arrange
  
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Score State
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5); 
  const [showResult, setShowResult] = useState(false);

  // Flashcard State
  const [isFlipped, setIsFlipped] = useState(false);

  const { playSound } = useSound(); 

  const currentItem = content[currentIndex];
  const progress = content.length > 0 ? ((currentIndex) / content.length) * 100 : 0;

  // Reset state saat pindah soal/materi
  useEffect(() => {
    setSelectedAnswer(null);
    setTextAnswer("");
    setIsChecked(false);
    setIsCorrect(false);
    setIsFlipped(false);

    // Setup khusus untuk tipe ARRANGE
    if (currentItem?.type === 'arrange') {
      const q = currentItem as QuizQuestion;
      // Jika correct answer array, acak untuk jadi opsi
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

    // Jika item adalah Flashcard, tombol berfungsi sebagai "Lanjut" (dianggap benar)
    if (currentItem.type === 'flashcard') {
      handleNext();
      return;
    }

    // Logic Pengecekan Quiz
    let correct = false;
    const q = currentItem as QuizQuestion;

    if (q.type === 'multiple-choice' || q.type === 'listening') {
      correct = selectedAnswer === q.correctAnswer;
    } 
    else if (q.type === 'fill-blank') {
      const correctText = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
      const userAnswerClean = textAnswer.trim().toLowerCase();
      const correctAnswerClean = String(correctText).trim().toLowerCase();
      correct = userAnswerClean === correctAnswerClean;
    } 
    else if (q.type === 'arrange') {
      const userAnswer = arrangedWords.join(" ");
      const correctAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(" ") : q.correctAnswer;
      correct = userAnswer === correctAnswer;
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
      onExit();
      return;
    }

    if (currentIndex < content.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowResult(true);
      playSound("levelUp");
    }
  };

  // --- ARRANGE UTILS ---
  const handleWordClick = (word: string, fromSource: boolean) => {
    if (isChecked) return; // Lock jika sudah dicek

    if (fromSource) {
      // Pindah dari Available ke Arranged
      setAvailableWords(prev => prev.filter(w => w !== word));
      setArrangedWords(prev => [...prev, word]);
    } else {
      // Pindah dari Arranged ke Available (Undo)
      setArrangedWords(prev => prev.filter(w => w !== word));
      setAvailableWords(prev => [...prev, word]);
    }
    playSound("click");
  };

  // --- RENDERERS ---

  const renderFlashcard = (card: FlashcardContent) => (
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
          <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 text-white border-4 border-blue-400">
            <span className="text-6xl mb-6">🇮🇩</span>
            <h3 className="text-3xl font-bold text-center">{card.front}</h3>
            <p className="mt-8 text-blue-200 text-sm font-semibold uppercase tracking-widest animate-pulse">Ketuk untuk balik</p>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 border-4 border-gray-200">
            <span className="text-6xl mb-6">🇬🇧</span>
            <h3 className="text-3xl font-bold text-slate-800 text-center">{card.back}</h3>
            {card.explanation && (
              <div className="mt-6 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-slate-600 text-center">{card.explanation}</p>
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
      case 'listening': 
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {q.options?.map((option, idx) => (
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
                  isChecked && option === q.correctAnswer && "border-green-500 bg-green-100 text-green-700",
                  isChecked && selectedAnswer === option && !isCorrect && "border-red-500 bg-red-100 text-red-700"
                )}
              >
                <span className="font-bold text-lg">{option}</span>
                {isChecked && option === q.correctAnswer && (
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
                Jawaban benar: <span className="font-bold">{String(q.correctAnswer)}</span>
              </div>
            )}
          </div>
        );

      case 'arrange':
        return (
          <div className="mt-8 space-y-8">
            {/* Area Jawaban */}
            <div className="min-h-[80px] border-b-2 border-slate-200 flex flex-wrap justify-center gap-2 p-4 transition-colors">
               {arrangedWords.length === 0 && !isChecked && (
                 <span className="text-slate-300 italic self-center">Ketuk kata di bawah untuk menyusun</span>
               )}
               {arrangedWords.map((word, idx) => (
                 <Button 
                    key={`${word}-${idx}`} 
                    onClick={() => handleWordClick(word, false)}
                    variant="outline"
                    className="bg-white border-sky-200 text-sky-700 hover:bg-red-50 hover:text-red-500"
                 >
                   {word}
                 </Button>
               ))}
            </div>

            {/* Area Pilihan Kata */}
            <div className="flex flex-wrap justify-center gap-3">
              {availableWords.map((word, idx) => (
                <Button 
                  key={`${word}-${idx}`}
                  onClick={() => handleWordClick(word, true)}
                  disabled={isChecked}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-sm text-lg py-6"
                >
                  {word}
                </Button>
              ))}
            </div>

            {isChecked && !isCorrect && (
               <div className="p-3 bg-green-100 text-green-800 rounded-lg text-center font-medium">
                  Susunan benar: <span className="font-bold">{Array.isArray(q.correctAnswer) ? q.correctAnswer.join(" ") : q.correctAnswer}</span>
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
    // Jika hanya flashcard, score 100%
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100;
    
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

  // --- MAIN RENDER ---
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

      {/* CONTENT AREA */}
      <div className="flex-1 p-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header Text (Question or Instruction) */}
            {currentItem.type === 'flashcard' ? (
                <div className="text-center mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-2">Kartu Baru</span>
                    <h2 className="text-2xl font-bold text-slate-800">Hafalkan Kata Ini</h2>
                </div>
            ) : (
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center leading-relaxed">
                    {(currentItem as QuizQuestion).question}
                </h2>
            )}

            {/* Media if Exists */}
            {currentItem.type !== 'flashcard' && (currentItem as QuizQuestion).mediaUrl && (
              <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-slate-100">
                <img src={(currentItem as QuizQuestion).mediaUrl} alt="Soal" className="w-full h-auto object-cover max-h-60" />
              </div>
            )}

            {/* Render Content Body */}
            {currentItem.type === 'flashcard' 
                ? renderFlashcard(currentItem as FlashcardContent)
                : renderQuiz(currentItem as QuizQuestion)
            }

          </motion.div>
        </AnimatePresence>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className={cn(
        "p-4 border-t transition-colors duration-300",
        isChecked 
          ? (isCorrect || currentItem.type === 'flashcard' ? "bg-green-100 border-green-200" : "bg-red-100 border-red-200") 
          : "bg-white border-slate-100"
      )}>
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          
          {/* Feedback Text */}
          <div className="flex-1">
            {isChecked && currentItem.type !== 'flashcard' ? (
                <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-white", isCorrect ? "text-green-500" : "text-red-500")}>
                    {isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                    <div className={cn("font-bold text-lg", isCorrect ? "text-green-700" : "text-red-700")}>
                        {isCorrect ? "Benar Sekali!" : "Yah, Kurang Tepat..."}
                    </div>
                    {!isCorrect && (currentItem as QuizQuestion).explanation && (
                        <p className="text-xs text-red-600/80">{(currentItem as QuizQuestion).explanation}</p>
                    )}
                </div>
                </div>
            ) : currentItem.type === 'flashcard' ? (
                <div className="text-slate-500 text-sm font-medium">Ketuk kartu untuk melihat arti</div>
            ) : (
                <div className="hidden md:block text-slate-400 text-sm font-bold uppercase tracking-wider">
                Jawab soal untuk lanjut
                </div>
            )}
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleCheck}
            // Disable logic: Flashcard always enabled. Quiz needs selection/answer.
            disabled={!isChecked && currentItem.type !== 'flashcard' && !selectedAnswer && !textAnswer && arrangedWords.length === 0}
            className={cn(
              "px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md active:translate-y-[2px] ml-4",
              isChecked || currentItem.type === 'flashcard'
                ? (isCorrect || currentItem.type === 'flashcard' ? "bg-green-500 hover:bg-green-600 shadow-green-200" : "bg-red-500 hover:bg-red-600 shadow-red-200")
                : "bg-sky-500 hover:bg-sky-600 shadow-sky-200"
            )}
          >
            {isChecked || currentItem.type === 'flashcard' ? (
                <span className="flex items-center gap-2">Lanjut <ArrowRight size={18}/></span>
            ) : "Periksa"}
          </Button>
        </div>
      </div>

    </div>
  );
}