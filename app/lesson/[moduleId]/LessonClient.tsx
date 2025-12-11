"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuizEngine from "../../../components/quiz/quiz-engine";
import { addUserXP } from "../../../lib/progress-service";
import { auth, db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { LessonContent } from "../../../lib/types/course.types";

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
  
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Cek Auth State secara real-time
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        console.warn("User belum login.");
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Module Data
  useEffect(() => {
    const fetchModule = async () => {
      if (!moduleId) return;

      try {
        const docRef = doc(db, "global_modules", moduleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          let combinedContent: LessonContent[] = [];

          // Support struktur baru (lessons -> interactiveContent)
          if (data.lessons && Array.isArray(data.lessons)) {
            data.lessons.forEach((l: any) => {
              if (l.interactiveContent) combinedContent.push(...l.interactiveContent);
              else if (l.quizData) combinedContent.push(...l.quizData);
            });
          } 
          // Support struktur lama (questions)
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
            setError("Modul ini belum memiliki konten belajar. Harap lapor ke admin.");
          }
        } else {
          setError("Modul tidak ditemukan di database.");
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

  // 3. Handle Penyelesaian
  const handleLessonComplete = async (score: number) => {
    console.log("🏁 Lesson Complete! Score:", score);

    // Validasi User
    if (!userId) {
      alert("Anda belum login! Progres tidak dapat disimpan. Silakan login terlebih dahulu.");
      router.push("/auth/login");
      return;
    }

    if (!lesson) return;

    setIsSaving(true);

    // Hitung XP (Score >= 60% dapat Full XP, di bawah itu dapat 25%)
    const passingScore = 60;
    const isPassed = score >= passingScore;
    const earnedXP = isPassed ? lesson.xp : Math.floor(lesson.xp / 4);
    
    console.log(`💰 Calculating XP: Reward=${lesson.xp}, Score=${score}%, Earned=${earnedXP}`);

    try {
      // A. Simpan XP ke Firestore (Global)
      await addUserXP(userId, earnedXP);
      
      // B. Update Status Penyelesaian (JIKA LULUS)
      // LOGIKA BARU: Menyimpan ID modul ke array completedModules user
      if (isPassed) {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          completedModules: arrayUnion(moduleId), 
          lastActiveModule: moduleId
        });
        console.log("✅ Module marked as COMPLETED in Firestore!");
      }

      console.log("✅ XP Saved Successfully!");
      
      // Delay visual agar user melihat loading, lalu redirect dan refresh dashboard
      setTimeout(() => {
        router.refresh(); 
        router.push("/learn");
      }, 1500);

    } catch (err) {
      console.error("❌ Gagal save progress:", err);
      alert("Terjadi kesalahan saat menyimpan progres. Coba lagi.");
      setIsSaving(false); 
      router.push("/learn");
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
        <Button onClick={() => router.push("/learn")} className="bg-gray-800 hover:bg-gray-900 text-white gap-2">
          <ArrowLeft size={18} /> Kembali ke Peta Belajar
        </Button>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-500">
        <Loader2 className="animate-spin w-10 h-10 text-green-500 mb-4" />
        <p className="font-bold text-green-600 animate-pulse">Menyimpan Progres Kamu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {lesson && (
        <QuizEngine 
          lessonTitle={lesson.title}
          content={lesson.content}
          xpReward={lesson.xp}
          onComplete={handleLessonComplete}
          onExit={handleExit}
        />
      )}
    </div>
  );
}