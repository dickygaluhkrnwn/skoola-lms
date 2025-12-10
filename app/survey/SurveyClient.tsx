"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, BookOpen, Trophy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

// --- DATA SOAL ADAPTIF (BIPA 1 - 7) ---
type Question = {
  level: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index jawaban benar (0-3)
};

const QUESTIONS: Question[] = [
  // BIPA 1 (Pemula A1) - Basic Greeting
  {
    level: 1,
    question: "Apa jawaban yang tepat untuk sapaan: 'Selamat pagi, apa kabar?'",
    options: ["Saya mau makan.", "Kabar baik, terima kasih.", "Ini buku saya.", "Saya tidur kemarin."],
    correctAnswer: 1
  },
  // BIPA 2 (Dasar A2) - Daily Routine
  {
    level: 2,
    question: "Lengkapi kalimat ini: 'Setiap hari Minggu, saya _____ ke pasar bersama ibu.'",
    options: ["pergi", "tidur", "minum", "baca"],
    correctAnswer: 0
  },
  // BIPA 3 (Madya B1) - Formal vs Informal
  {
    level: 3,
    question: "Manakah kalimat yang paling sopan untuk berbicara dengan guru?",
    options: [
      "Woi Pak, minta tugas dong.", 
      "Pak, bagi tugasnya sekarang.", 
      "Mohon maaf Pak, apakah saya boleh meminta tugas tambahan?", 
      "Tugas mana tugas?"
    ],
    correctAnswer: 2
  },
  // BIPA 4 (Madya Lanjut B2) - Opinion/Complex Sentence
  {
    level: 4,
    question: "Pilih kata hubung yang tepat: 'Dia tetap berangkat sekolah _____ hujan turun sangat deras.'",
    options: ["karena", "sehingga", "meskipun", "dan"],
    correctAnswer: 2
  },
  // BIPA 5 (Mahir C1) - Academic/Context
  {
    level: 5,
    question: "Sinonim dari kata 'signifikan' dalam konteks data statistik adalah...",
    options: ["biasa saja", "berarti", "kecil", "membosankan"],
    correctAnswer: 1
  },
  // BIPA 6 (Mahir Lanjut C2) - Abstract/Idiom
  {
    level: 6,
    question: "Apa makna peribahasa 'Besar pasak daripada tiang'?",
    options: [
      "Tiang rumahnya sangat besar.",
      "Pengeluaran lebih besar daripada pendapatan.",
      "Orang yang sangat kuat.",
      "Membangun rumah butuh pasak."
    ],
    correctAnswer: 1
  },
  // BIPA 7 (Ahli) - Nuance & Formal Structure
  {
    level: 7,
    question: "Manakah kalimat efektif yang baku di bawah ini?",
    options: [
      "Para hadirin sekalian dimohon berdiri.",
      "Hadirin dimohon berdiri.",
      "Banyak para hadirin silahkan berdiri.",
      "Kepada hadirin waktu dan tempat dipersilahkan."
    ],
    correctAnswer: 1
  }
];

export default function SurveyClient() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // State Game Logic
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [determinedLevel, setDeterminedLevel] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const currentQuestion = QUESTIONS[currentIndex];

  const handleAnswer = async () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    
    // Logika Adaptive
    if (isCorrect) {
      setConsecutiveWrong(0);
      
      if (currentIndex < QUESTIONS.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
      } else {
        finishSurvey(7);
      }
    } else {
      const newWrongCount = consecutiveWrong + 1;
      setConsecutiveWrong(newWrongCount);

      if (newWrongCount >= 2) {
        const finalLevel = Math.max(1, currentQuestion.level - 1);
        finishSurvey(finalLevel);
      } else {
        if (currentIndex < QUESTIONS.length - 1) {
           setCurrentIndex(prev => prev + 1);
           setSelectedOption(null);
        } else {
           finishSurvey(Math.max(1, currentQuestion.level - 1));
        }
      }
    }
  };

  const finishSurvey = async (level: number) => {
    setDeterminedLevel(level);
    setIsSaving(true);
    
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          level: level, 
          xp: level * 100, 
          surveyCompleted: true
        });
        
        setTimeout(() => {
          router.push("/learn");
        }, 3000);
      } catch (error) {
        console.error("Gagal simpan level:", error);
      }
    }
  };

  if (showIntro) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-6 transition-colors font-sans",
        theme === "kids" ? "bg-yellow-50" : "bg-slate-50"
      )}>
        <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl text-center border-2 border-slate-100">
          <div className={cn(
            "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 text-4xl shadow-sm",
            theme === "kids" ? "bg-sky-100" : "bg-slate-100"
          )}>
            🧐
          </div>
          <h1 className="text-2xl font-bold mb-3 text-slate-900">Cek Kemampuanmu!</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Jawab beberapa pertanyaan singkat agar Skoola bisa menyesuaikan materi belajar yang pas buat kamu.
          </p>
          <Button 
            onClick={() => setShowIntro(false)} 
            className={cn(
              "w-full py-6 text-lg rounded-xl font-bold shadow-lg transition-all active:scale-95",
              theme === "kids" ? "bg-sky-500 hover:bg-sky-600" : "bg-slate-800 hover:bg-slate-900"
            )}
          >
            Mulai Survey
          </Button>
        </div>
      </div>
    );
  }

  // Tampilan Hasil Survey
  if (determinedLevel !== null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md w-full"
        >
          <div className="mb-6 relative inline-block">
            <Trophy size={80} className="text-yellow-400 mx-auto drop-shadow-lg" />
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.5 }} // FIX: Pindahkan delay ke dalam prop transition
              className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white"
            >
              {determinedLevel}
            </motion.div>
          </div>
          
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Luar Biasa!</h2>
          <p className="text-slate-500 mb-8">
            Kamu berada di level <span className="font-bold text-sky-600">BIPA {determinedLevel}</span>. 
            <br/>Materi belajar telah disesuaikan.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
            <Loader2 className="animate-spin" size={16} />
            Menyiapkan dashboard kamu...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-sans transition-colors duration-500",
      theme === "kids" ? "bg-sky-50" : "bg-slate-50"
    )}>
      {/* Header Progress */}
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Level {currentQuestion.level} dari 7
          </span>
          <span className="text-xs font-bold text-slate-400">
            Soal {currentIndex + 1}
          </span>
        </div>
        <div className="max-w-2xl mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className={cn("h-full rounded-full", theme === "kids" ? "bg-yellow-400" : "bg-slate-800")}
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Soal Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 -mt-10">
        <div className="max-w-2xl w-full space-y-8">
          
          <motion.h2 
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold text-center text-slate-800 leading-snug"
          >
            {currentQuestion.question}
          </motion.h2>

          <div className="grid gap-3">
            {currentQuestion.options.map((option, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedOption(idx)}
                className={cn(
                  "p-5 rounded-2xl border-2 text-left font-medium text-lg transition-all flex items-center justify-between group",
                  selectedOption === idx 
                    ? (theme === "kids" ? "border-sky-400 bg-sky-50 text-sky-800" : "border-slate-800 bg-slate-50 text-slate-900")
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                {option}
                {selectedOption === idx && (
                  <CheckCircle2 className={cn("w-6 h-6", theme === "kids" ? "text-sky-500" : "text-slate-800")} />
                )}
              </motion.button>
            ))}
          </div>

          <div className="pt-4">
            <Button
              disabled={selectedOption === null}
              onClick={handleAnswer}
              className={cn(
                "w-full py-7 text-lg font-bold rounded-xl shadow-lg transition-all",
                selectedOption === null ? "opacity-50 cursor-not-allowed" : "hover:translate-y-[-2px] active:translate-y-0",
                theme === "kids" ? "bg-green-500 hover:bg-green-600" : "bg-slate-900 hover:bg-slate-800"
              )}
            >
              Lanjut <ArrowRight className="ml-2" />
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
}