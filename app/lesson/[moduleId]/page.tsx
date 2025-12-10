"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import QuizEngine, { Question } from "@/components/quiz/quiz-engine"; // Pastikan path ini benar
import { addUserXP } from "@/lib/progress-service"; // Import logic XP
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

// --- MOCK DATA SOAL (Nanti bisa dipindah ke database) ---
// Kita buat dictionary soal berdasarkan Module ID
const lessonData: Record<string, { title: string; xp: number; questions: Question[] }> = {
  "1": {
    title: "Sapaan Dasar",
    xp: 100,
    questions: [
      {
        id: "q1",
        type: "multiple-choice",
        question: "Apa bahasa Indonesia dari 'Good Morning'?",
        options: ["Selamat Malam", "Selamat Pagi", "Selamat Tidur", "Halo"],
        correctAnswer: "Selamat Pagi"
      },
      {
        id: "q2",
        type: "multiple-choice",
        question: "Manakah kata sapaan yang sopan?",
        options: ["Woi", "Heh", "Permisi", "Minggir"],
        correctAnswer: "Permisi"
      },
      {
        id: "q3",
        type: "multiple-choice",
        question: "Lengkapi kalimat: '___ kabar?'",
        options: ["Apa", "Siapa", "Kapan", "Kenapa"],
        correctAnswer: "Apa"
      }
    ]
  },
  "2": {
    title: "Benda Sekitar",
    xp: 150,
    questions: [
      {
        id: "q1",
        type: "multiple-choice",
        question: "Benda untuk duduk adalah...",
        options: ["Meja", "Kursi", "Lemari", "Lantai"],
        correctAnswer: "Kursi"
      },
      {
        id: "q2",
        type: "multiple-choice",
        question: "Kita menulis menggunakan...",
        options: ["Sendok", "Pensil", "Gelas", "Sepatu"],
        correctAnswer: "Pensil"
      }
    ]
  }
};

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  // Pastikan params.moduleId adalah string, jika array ambil yang pertama
  const moduleId = Array.isArray(params?.moduleId) ? params.moduleId[0] : params?.moduleId as string;
  
  const [lesson, setLesson] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Validasi Module ID
    if (moduleId && lessonData[moduleId]) {
      setLesson(lessonData[moduleId]);
    } else {
      // Jika modul tidak ditemukan, kembalikan ke dashboard
      // router.push("/learn");
    }
  }, [moduleId, router]);

  const handleLessonComplete = async (score: number) => {
    setIsSaving(true);
    const user = auth.currentUser;
    
    if (user && lesson) {
      // Hitung XP yang didapat (Bisa dibuat dinamis berdasarkan score)
      // Misal: Jika benar semua dapat full XP
      const finalXP = lesson.xp; 

      // 1. Simpan ke Database
      await addUserXP(user.uid, finalXP);
      
      // 2. Redirect ke Dashboard (dengan sedikit delay agar user sadar sudah selesai)
      setTimeout(() => {
        router.push("/learn");
      }, 1000);
    } else {
      // Fallback jika user reload halaman dan auth state hilang
      router.push("/");
    }
  };

  const handleExit = () => {
    if (confirm("Yakin ingin keluar? Progresmu tidak akan tersimpan.")) {
      router.push("/learn");
    }
  };

  if (!lesson || isSaving) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-500">
        <Loader2 className="animate-spin w-10 h-10 text-sky-500 mb-4" />
        <p>{isSaving ? "Menyimpan Progres..." : "Memuat Pelajaran..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <QuizEngine 
        lessonTitle={lesson.title}
        questions={lesson.questions}
        xpReward={lesson.xp}
        onComplete={handleLessonComplete}
        onExit={handleExit}
      />
    </div>
  );
}