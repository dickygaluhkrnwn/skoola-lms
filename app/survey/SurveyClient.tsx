"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, Trophy, Loader2, Sparkles, Brain, Palette, Calculator, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

// --- DATA SOAL MINAT BAKAT ---
type Question = {
  id: number;
  question: string;
  category: "logic" | "creative" | "social" | "practical";
  options: { text: string; score: number }[];
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "logic",
    question: "Saat ada masalah sulit, apa yang biasanya kamu lakukan?",
    options: [
      { text: "Menganalisis penyebabnya secara detail.", score: 3 },
      { text: "Mencari solusi kreatif yang unik.", score: 1 },
      { text: "Bertanya kepada teman untuk saran.", score: 2 },
      { text: "Langsung mencoba memperbaikinya.", score: 2 }
    ]
  },
  {
    id: 2,
    category: "creative",
    question: "Pelajaran apa yang paling membuatmu bersemangat?",
    options: [
      { text: "Matematika atau Sains.", score: 1 },
      { text: "Seni, Musik, atau Bahasa.", score: 3 },
      { text: "Sejarah atau Sosiologi.", score: 2 },
      { text: "Olahraga atau Prakarya.", score: 1 }
    ]
  },
  {
    id: 3,
    category: "social",
    question: "Dalam kerja kelompok, peran apa yang kamu ambil?",
    options: [
      { text: "Penyusun strategi dan data.", score: 1 },
      { text: "Pemberi ide-ide baru.", score: 2 },
      { text: "Pemimpin yang mengatur tim.", score: 3 },
      { text: "Pelaksana tugas teknis.", score: 1 }
    ]
  },
  {
    id: 4,
    category: "practical",
    question: "Apa kegiatan favoritmu di waktu luang?",
    options: [
      { text: "Memecahkan teka-teki/puzzle.", score: 2 },
      { text: "Menggambar atau menulis cerita.", score: 1 },
      { text: "Nongkrong bareng teman.", score: 2 },
      { text: "Memperbaiki barang atau berkebun.", score: 3 }
    ]
  },
  {
    id: 5,
    category: "creative",
    question: "Jika kamu bisa punya kekuatan super, kamu pilih apa?",
    options: [
      { text: "Membaca pikiran (Analisis).", score: 2 },
      { text: "Menciptakan benda dari imajinasi.", score: 3 },
      { text: "Berbicara dengan semua orang/hewan.", score: 1 },
      { text: "Kekuatan fisik super.", score: 1 }
    ]
  }
];

// Tipe Hasil Bakat
const ARCHETYPES = {
  logic: { label: "The Thinker 🧠", desc: "Kamu jago analisis dan memecahkan masalah rumit!", color: "text-blue-600", bg: "bg-blue-100" },
  creative: { label: "The Creator 🎨", desc: "Imajinasimu luar biasa, penuh ide-ide segar!", color: "text-purple-600", bg: "bg-purple-100" },
  social: { label: "The Leader 🤝", desc: "Kamu punya jiwa kepemimpinan dan sosial yang tinggi.", color: "text-orange-600", bg: "bg-orange-100" },
  practical: { label: "The Maker 🛠️", desc: "Kamu suka praktik langsung dan hasil nyata.", color: "text-green-600", bg: "bg-green-100" }
};

export default function SurveyClient() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState({ logic: 0, creative: 0, social: 0, practical: 0 });
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<keyof typeof ARCHETYPES | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const currentQuestion = QUESTIONS[currentIndex];

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";

  const handleAnswer = () => {
    if (selectedOption === null) return;

    // Update Score
    const selectedScore = currentQuestion.options[selectedOption].score;
    const category = currentQuestion.category;
    
    setScores(prev => ({
      ...prev,
      [category]: prev[category] + selectedScore
    }));

    // Next or Finish
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      calculateResult();
    }
  };

  const calculateResult = async () => {
    // Cari skor tertinggi
    let maxScore = 0;
    let finalType: keyof typeof ARCHETYPES = "logic";

    (Object.keys(scores) as Array<keyof typeof ARCHETYPES>).forEach(key => {
       if (scores[key] > maxScore) {
          maxScore = scores[key];
          finalType = key;
       }
    });

    setResult(finalType);
    
    // Simpan ke Firestore
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          talentArchetype: finalType,
          surveyCompleted: true
        });
        
        setTimeout(() => {
          router.push("/learn");
        }, 4000);
      } catch (error) {
        console.error("Gagal simpan hasil:", error);
      }
    }
  };

  // Styles Helpers
  const bgStyle = isKids ? "bg-yellow-50" : isUni ? "bg-slate-950 text-slate-200" : "bg-slate-50";
  const cardStyle = isKids 
    ? "bg-white border-yellow-200 rounded-3xl border-4" 
    : isUni 
      ? "bg-slate-900 border-slate-700 text-slate-200 rounded-xl border" 
      : "bg-white border-slate-200 rounded-xl border";

  if (showIntro) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6 transition-colors font-sans", bgStyle)}>
        <div className={cn("max-w-md w-full p-8 shadow-xl text-center", cardStyle)}>
          <div className={cn(
            "w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 text-5xl shadow-sm animate-bounce",
            isKids ? "bg-sky-100" : isUni ? "bg-slate-800" : "bg-white border border-slate-100"
          )}>
            ✨
          </div>
          <h1 className={cn("text-2xl font-bold mb-3", isUni ? "text-white" : "text-slate-900")}>
            Tes Minat & Bakat
          </h1>
          <p className={cn("mb-8 leading-relaxed", isUni ? "text-slate-400" : "text-slate-500")}>
            Yuk cari tahu potensi tersembunyi kamu! Apakah kamu seorang pemikir, seniman, atau pemimpin?
          </p>
          <Button 
            onClick={() => setShowIntro(false)} 
            className={cn(
              "w-full py-6 text-lg font-bold shadow-lg transition-all active:scale-95",
              isKids 
                ? "rounded-xl bg-sky-500 hover:bg-sky-600 text-white" 
                : isUni 
                  ? "rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
            )}
          >
            Mulai Petualangan
          </Button>
          <button 
             onClick={() => router.push("/learn")}
             className={cn("mt-6 text-xs hover:underline block mx-auto", isUni ? "text-slate-500" : "text-slate-400")}
          >
             Lewati tes ini
          </button>
        </div>
      </div>
    );
  }

  // Tampilan Hasil
  if (result) {
    const archetype = ARCHETYPES[result];
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6 font-sans", bgStyle)}>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md w-full"
        >
          <div className="mb-8 relative inline-block">
            <div className={cn(
               "w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-xl mx-auto border-4 border-white",
               archetype.bg
            )}>
               {result === 'logic' && <Brain className={archetype.color} size={64}/>}
               {result === 'creative' && <Palette className={archetype.color} size={64}/>}
               {result === 'social' && <Users className={archetype.color} size={64}/>}
               {result === 'practical' && <Calculator className={archetype.color} size={64}/>}
            </div>
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.5 }} 
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-xs font-bold border-2 border-white whitespace-nowrap shadow-sm"
            >
              Hasil Kamu
            </motion.div>
          </div>
          
          <h2 className={cn("text-3xl font-extrabold mb-2", isUni ? "text-white" : "text-slate-900")}>
             {archetype.label}
          </h2>
          <p className={cn("mb-8 text-lg font-medium", isUni ? "text-slate-400" : "text-slate-600")}>
            {archetype.desc}
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
            <Loader2 className="animate-spin" size={16} />
            Menyesuaikan profil kamu...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex flex-col font-sans transition-colors duration-500", bgStyle)}>
      {/* Header Progress */}
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">
            Pertanyaan {currentIndex + 1} / {QUESTIONS.length}
          </span>
          <div className="flex gap-1">
             {QUESTIONS.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                     "w-2 h-2 rounded-full transition-colors",
                     i <= currentIndex ? (isKids ? "bg-yellow-400" : "bg-blue-600") : "bg-gray-200"
                  )}
                />
             ))}
          </div>
        </div>
      </div>

      {/* Soal Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 -mt-20">
        <div className="max-w-xl w-full space-y-8">
          
          <motion.h2 
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("text-2xl md:text-3xl font-bold text-center leading-snug", isUni ? "text-white" : "text-slate-800")}
          >
            {currentQuestion.question}
          </motion.h2>

          <div className="grid gap-4">
            {currentQuestion.options.map((option, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                   setSelectedOption(idx);
                   // Opsional: Auto advance setelah delay dikit biar smooth
                }}
                className={cn(
                  "p-5 rounded-2xl border-2 text-left font-medium text-lg transition-all flex items-center justify-between group shadow-sm",
                  selectedOption === idx 
                    ? (isKids ? "border-sky-400 bg-sky-50 text-sky-800" : "border-blue-600 bg-blue-50 text-blue-800")
                    : (isUni ? "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600" : "border-slate-100 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50")
                )}
              >
                {option.text}
                {selectedOption === idx && (
                  <CheckCircle2 className={cn("w-6 h-6", isKids ? "text-sky-500" : "text-blue-600")} />
                )}
              </motion.button>
            ))}
          </div>

          <div className="pt-6">
            <Button
              disabled={selectedOption === null}
              onClick={handleAnswer}
              className={cn(
                "w-full py-7 text-lg font-bold shadow-lg transition-all",
                selectedOption === null ? "opacity-50 cursor-not-allowed" : "hover:translate-y-[-2px] active:translate-y-0",
                isKids 
                  ? "rounded-xl bg-green-500 hover:bg-green-600 text-white" 
                  : isUni 
                    ? "rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-900 hover:bg-slate-800 rounded-xl text-white"
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