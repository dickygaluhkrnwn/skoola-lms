"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuizEngine from "@/components/quiz/quiz-engine";
import { addUserXP } from "@/lib/progress-service";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizQuestion } from "@/lib/types/course.types";

interface LessonData {
  title: string;
  xp: number;
  questions: QuizQuestion[];
}

interface LessonClientProps {
  moduleId: string;
}

export default function LessonClient({ moduleId }: LessonClientProps) {
  const router = useRouter();
  
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchModule = async () => {
      if (!moduleId) return;

      try {
        const docRef = doc(db, "global_modules", moduleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Validasi apakah modul memiliki soal
          if (data.questions && data.questions.length > 0) {
            setLesson({
              title: data.title,
              xp: data.xpReward || 50,
              questions: data.questions as QuizQuestion[] 
            });
          } else {
            setError("Modul ini belum memiliki soal. Harap lapor ke admin.");
          }
        } else {
          setError("Modul tidak ditemukan.");
        }
      } catch (err) {
        console.error("Error fetching lesson:", err);
        setError("Gagal memuat pelajaran. Periksa koneksi internet.");
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [moduleId]);

  const handleLessonComplete = async (score: number) => {
    setIsSaving(true);
    const user = auth.currentUser;
    
    if (user && lesson) {
      // Logic XP: Jika score > 50%, dapat full XP. Jika tidak, dapat setengah.
      const passingGrade = lesson.questions.length / 2;
      const earnedXP = score >= passingGrade ? lesson.xp : Math.floor(lesson.xp / 2);

      try {
        await addUserXP(user.uid, earnedXP);
        
        // Delay sedikit agar user melihat indikator saving
        setTimeout(() => {
          router.push("/learn");
        }, 1000);
      } catch (err) {
        console.error("Gagal save XP:", err);
        router.push("/learn"); // Tetap redirect meski error save (bisa dihandle lebih baik nanti)
      }
    } else {
      router.push("/");
    }
  };

  const handleExit = () => {
    if (confirm("Yakin ingin keluar? Progresmu tidak akan tersimpan.")) {
      router.push("/learn");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-500">
        <Loader2 className="animate-spin w-10 h-10 text-sky-500 mb-4" />
        <p>Memuat Pelajaran...</p>
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
        <Button onClick={() => router.push("/learn")} className="bg-sky-500 hover:bg-sky-600">
          Kembali ke Peta Belajar
        </Button>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-500">
        <Loader2 className="animate-spin w-10 h-10 text-green-500 mb-4" />
        <p>Menyimpan Progres Kamu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {lesson && (
        <QuizEngine 
          lessonTitle={lesson.title}
          questions={lesson.questions}
          xpReward={lesson.xp}
          onComplete={handleLessonComplete}
          onExit={handleExit}
        />
      )}
    </div>
  );
}