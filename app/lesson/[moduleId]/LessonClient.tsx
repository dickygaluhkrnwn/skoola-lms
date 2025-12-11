"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuizEngine from "../../../components/quiz/quiz-engine";
import { auth, db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { LessonContent } from "../../../lib/types/course.types";
import { useTheme } from "../../../lib/theme-context";
import { cn } from "../../../lib/utils";

interface LessonData {
  title: string;
  xp: number;
  content: LessonContent[];
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

  // 1. Cek Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Redirect jika belum login (opsional, tergantung flow)
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
        // Coba fetch dari 'global_modules' (Legacy BIPA)
        // Nanti bisa dikembangkan untuk fetch dari 'classrooms/materials' jika perlu
        const docRef = doc(db, "global_modules", moduleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          let combinedContent: LessonContent[] = [];

          // Support struktur data
          if (data.lessons && Array.isArray(data.lessons)) {
            data.lessons.forEach((l: any) => {
              if (l.interactiveContent) combinedContent.push(...l.interactiveContent);
              else if (l.quizData) combinedContent.push(...l.quizData);
            });
          } 
          else if (data.questions && Array.isArray(data.questions)) {
            combinedContent = data.questions;
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

    // Hitung XP (Score >= 60% dapat Full XP, di bawah itu dapat 25%)
    const passingScore = 60;
    const isPassed = score >= passingScore;
    const earnedXP = isPassed ? lesson.xp : Math.floor(lesson.xp / 4);
    
    try {
      const userRef = doc(db, "users", userId);
      
      // Update XP & Level Global
      // Kita pakai increment agar aman dari race condition
      await updateDoc(userRef, {
         xp: increment(earnedXP),
         // Jika gamification nested object, perlu dihandle hati-hati atau diflatkan strukturnya di masa depan
         "gamification.xp": increment(earnedXP) 
      });
      
      // Update Status Penyelesaian (JIKA LULUS)
      if (isPassed) {
        await updateDoc(userRef, {
          completedModules: arrayUnion(moduleId), 
          lastActiveModule: moduleId,
          // Opsional: Update streak jika login hari ini (sudah dihandle di Auth/Login biasanya)
        });
      }
      
      // Delay visual
      setTimeout(() => {
        router.push("/learn"); // Kembali ke dashboard
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-500">
        <Loader2 className="animate-spin w-10 h-10 text-primary mb-4" />
        <p className="font-medium animate-pulse">Memuat Materi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Ups, Ada Masalah</h2>
        <p className="text-gray-500 mb-8 max-w-xs">{error}</p>
        <Button onClick={() => router.push("/learn")} className="bg-slate-800 hover:bg-slate-900 text-white gap-2">
          <ArrowLeft size={18} /> Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-500">
        <Loader2 className="animate-spin w-12 h-12 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-green-600 animate-pulse">Menyimpan Progres...</h2>
        <p className="text-sm text-gray-400 mt-2">Jangan tutup halaman ini.</p>
      </div>
    );
  }

  // Tampilan Utama (Wrapper untuk Quiz Engine)
  return (
    <div className={cn(
       "min-h-screen",
       isKids ? "bg-yellow-50" : isUni ? "bg-slate-900" : "bg-slate-50"
    )}>
      {lesson && (
        <QuizEngine 
          lessonTitle={lesson.title}
          content={lesson.content}
          xpReward={lesson.xp}
          // Adaptasi signature callback: QuizEngine kirim (score, answers), kita cuma butuh score di sini
          onComplete={(score) => handleLessonComplete(score)}
          onExit={handleExit}
        />
      )}
    </div>
  );
}