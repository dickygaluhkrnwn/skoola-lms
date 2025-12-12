"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuizEngine from "../../../components/quiz/quiz-engine";
import { auth, db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { QuizQuestion } from "../../../lib/types/course.types"; // CORRECTED IMPORT
import { useTheme } from "../../../lib/theme-context";
import { cn } from "../../../lib/utils";
import { motion } from "framer-motion";

interface LessonData {
  title: string;
  xp: number;
  content: QuizQuestion[]; // UPDATED TYPE
}

interface LessonClientProps {
  moduleId: string;
}

export default function LessonClient({ moduleId }: LessonClientProps) {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";

  // 1. Cek Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Redirect jika belum login (opsional)
        // router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Fetch Module Data
  useEffect(() => {
    const fetchModule = async () => {
      if (!moduleId) return;

      try {
        const docRef = doc(db, "global_modules", moduleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          let combinedContent: QuizQuestion[] = [];

          if (data.lessons && Array.isArray(data.lessons)) {
            data.lessons.forEach((l: any) => {
              // Asumsi interactiveContent dan quizData berisi QuizQuestion atau format yang kompatibel
              if (l.interactiveContent) combinedContent.push(...l.interactiveContent);
              else if (l.quizData) combinedContent.push(...l.quizData);
            });
          } 
          else if (data.questions && Array.isArray(data.questions)) {
            combinedContent = data.questions as QuizQuestion[];
          }
          
          if (combinedContent.length > 0) {
            setLesson({
              title: data.title,
              xp: data.xpReward || 50,
              content: combinedContent
            });
          } else {
            setError("Modul ini belum memiliki konten belajar.");
          }
        } else {
          setError("Modul tidak ditemukan.");
        }
      } catch (err) {
        console.error("Error fetching lesson:", err);
        setError("Gagal memuat pelajaran.");
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [moduleId]);

  // 3. Handle Penyelesaian
  const handleLessonComplete = async (score: number) => {
    if (!userId) {
      alert("Anda belum login! Progres tidak tersimpan.");
      router.push("/");
      return;
    }

    if (!lesson) return;

    setIsSaving(true);

    const passingScore = 60;
    const isPassed = score >= passingScore;
    const earnedXP = isPassed ? lesson.xp : Math.floor(lesson.xp / 4);
    
    try {
      const userRef = doc(db, "users", userId);
      
      await updateDoc(userRef, {
           // Ensure nested updates handle missing structures gracefully
           xp: increment(earnedXP),
           "gamification.xp": increment(earnedXP) 
      });
      
      if (isPassed) {
        await updateDoc(userRef, {
          completedModules: arrayUnion(moduleId), 
          lastActiveModule: moduleId,
        });
      }
      
      setTimeout(() => {
        router.push("/learn"); 
        router.refresh(); 
      }, 1500);

    } catch (err) {
      console.error("Gagal save progress:", err);
      alert("Gagal menyimpan progres. Coba lagi.");
      setIsSaving(false); 
    }
  };

  const handleExit = () => {
    if (confirm("Yakin ingin keluar? Progresmu tidak akan tersimpan.")) {
      router.push("/learn");
    }
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center", (isSMA || isUni) ? "bg-slate-950 text-white" : "bg-white text-gray-500")}>
        <Loader2 className={cn("animate-spin w-10 h-10 mb-4", (isSMA || isUni) ? "text-teal-500" : "text-primary")} />
        <p className="font-medium animate-pulse">Memuat Materi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center p-6 text-center", (isSMA || isUni) ? "bg-slate-950 text-slate-200" : "bg-white")}>
        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6", (isSMA || isUni) ? "bg-red-900/20 text-red-500" : "bg-red-100 text-red-500")}>
          <AlertCircle size={40} />
        </div>
        <h2 className={cn("text-xl font-bold mb-2", (isSMA || isUni) ? "text-white" : "text-gray-800")}>Ups, Ada Masalah</h2>
        <p className={cn("mb-8 max-w-xs", (isSMA || isUni) ? "text-slate-400" : "text-gray-500")}>{error}</p>
        <Button onClick={() => router.push("/learn")} className={cn("gap-2", (isSMA || isUni) ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-800 hover:bg-slate-900 text-white")}>
          <ArrowLeft size={18} /> Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center", (isSMA || isUni) ? "bg-slate-950 text-white" : "bg-white text-gray-500")}>
        <Loader2 className="animate-spin w-12 h-12 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-green-600 animate-pulse">Menyimpan Progres...</h2>
        <p className={cn("text-sm mt-2", (isSMA || isUni) ? "text-slate-400" : "text-gray-400")}>Jangan tutup halaman ini.</p>
      </div>
    );
  }

  // Tampilan Utama (Wrapper untuk Quiz Engine)
  return (
    <div className={cn(
        "min-h-screen relative overflow-hidden font-sans transition-colors duration-500",
        isKids ? "bg-yellow-50" : isUni ? "bg-slate-950" : isSMP ? "bg-slate-50/30" : isSMA ? "bg-slate-950" : "bg-slate-50"
    )}>
      
      {/* --- UNI THEME: Animated Mesh --- */}
      {isUni && (
         <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1121] to-indigo-950" />
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
         </div>
      )}

      {/* --- SMA THEME: AURORA MESH --- */}
      {isSMA && (
        <div className="fixed inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
           <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-teal-600/20 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
           <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      )}

      {/* --- SMP THEME: AMBIENT BLOBS --- */}
      {isSMP && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-400/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px] animate-pulse delay-700" />
        </div>
      )}

      {/* Content Wrapper */}
      <div className="relative z-10">
        {lesson && (
          <QuizEngine 
            lessonTitle={lesson.title}
            content={lesson.content}
            xpReward={lesson.xp}
            onComplete={(score) => handleLessonComplete(score)}
            onExit={handleExit}
          />
        )}
      </div>
    </div>
  );
}