import { CourseModule } from "@/lib/types/course.types";

// ==========================================
// BAGIAN 1: SAPAAN & SALAM (GREETINGS)
// ==========================================
export const MODULE_SAPAAN: CourseModule = {
  id: "bipa1-sapaan",
  title: "Sapaan & Salam",
  description: "Belajar menyapa orang Indonesia dengan sopan sesuai waktu.",
  level: 1,
  order: 1,
  thumbnailUrl: "👋",
  themeColor: "bg-sky-500",
  isLocked: false, // Terbuka di awal
  lessons: [
    {
      id: "les-sapaan-1",
      title: "Mengenal Waktu",
      description: "Sapaan Pagi, Siang, Sore, dan Malam.",
      order: 1,
      type: "interactive",
      duration: 5,
      xpReward: 50,
      interactiveContent: [
        {
          id: "fc-pagi",
          type: "flashcard",
          front: "Selamat Pagi",
          back: "Good Morning",
          explanation: "Diucapkan dari jam 00:00 sampai sekitar jam 10:00 pagi."
        },
        {
          id: "fc-siang",
          type: "flashcard",
          front: "Selamat Siang",
          back: "Good Day / Noon",
          explanation: "Diucapkan dari jam 11:00 sampai jam 15:00 saat matahari terik."
        },
        {
          id: "fc-sore",
          type: "flashcard",
          front: "Selamat Sore",
          back: "Good Afternoon",
          explanation: "Diucapkan dari jam 15:00 sampai matahari terbenam (sekitar 18:00)."
        },
        {
          id: "fc-malam",
          type: "flashcard",
          front: "Selamat Malam",
          back: "Good Evening / Night",
          explanation: "Diucapkan setelah matahari terbenam."
        },
        {
          id: "quiz-sapaan-1",
          type: "multiple-choice",
          question: "Kamu bertemu temanmu jam 14.00 (jam 2 siang). Kamu mengucapkan...",
          options: ["Selamat Pagi", "Selamat Siang", "Selamat Malam", "Selamat Tidur"],
          correctAnswer: "Selamat Siang",
          points: 10,
          explanation: "Jam 14.00 termasuk waktu siang hari."
        }
      ]
    },
    {
      id: "les-sapaan-2",
      title: "Menanyakan Kabar",
      description: "Apa kabar? Terima kasih.",
      order: 2,
      type: "interactive",
      duration: 5,
      xpReward: 50,
      interactiveContent: [
        {
          id: "fc-kabar",
          type: "flashcard",
          front: "Apa kabar?",
          back: "How are you?",
          explanation: "Jawabannya biasanya: 'Kabar baik' (Good news/I'm fine)."
        },
        {
          id: "fc-terimakasih",
          type: "flashcard",
          front: "Terima kasih",
          back: "Thank you",
          explanation: "Bisa disingkat 'Makasih' dalam situasi informal."
        },
        {
          id: "fc-samasama",
          type: "flashcard",
          front: "Sama-sama",
          back: "You are welcome",
          explanation: "Jawaban untuk 'Terima kasih'."
        },
        {
          id: "quiz-sapaan-2",
          type: "fill-blank",
          question: "A: Terima kasih ya! \nB: _____-sama!",
          correctAnswer: ["Sama", "sama"],
          points: 10,
          explanation: "Balasan standar untuk terima kasih adalah 'Sama-sama'."
        }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 2: PERKENALAN DIRI (INTRODUCTION)
// ==========================================
export const MODULE_PERKENALAN: CourseModule = {
  id: "bipa1-intro",
  title: "Perkenalan Diri",
  description: "Cara memperkenalkan diri kepada orang baru.",
  level: 1,
  order: 2,
  thumbnailUrl: "🤝",
  themeColor: "bg-orange-500",
  isLocked: true, // Terkunci sampai Modul 1 selesai
  lessons: [
    {
      id: "les-intro-1",
      title: "Nama & Asal",
      description: "Nama saya... Saya dari...",
      order: 1,
      type: "interactive",
      duration: 8,
      xpReward: 75,
      interactiveContent: [
        {
          id: "fc-nama",
          type: "flashcard",
          front: "Nama saya...",
          back: "My name is...",
          explanation: "Contoh: Nama saya Budi."
        },
        {
          id: "fc-asal",
          type: "flashcard",
          front: "Saya berasal dari...",
          back: "I come from...",
          explanation: "Contoh: Saya berasal dari Australia."
        },
        {
          id: "quiz-intro-1",
          type: "multiple-choice",
          question: "Apa arti 'Saya berasal dari Jepang'?",
          options: ["My name is Japan", "I come from Japan", "I like Japan"],
          correctAnswer: "I come from Japan",
          points: 15
        },
        {
          id: "quiz-intro-arrange",
          type: "fill-blank",
          question: "Lengkapi: Nama _____ Sarah.",
          correctAnswer: ["saya", "Saya"],
          points: 15,
          explanation: "Struktur kalimat: Nama (Subjek) + saya (Milik) + [Nama Orang]."
        }
      ]
    },
    {
      id: "les-intro-2",
      title: "Tempat Tinggal",
      description: "Di mana kamu tinggal?",
      order: 2,
      type: "interactive",
      duration: 7,
      xpReward: 75,
      interactiveContent: [
        {
          id: "fc-tinggal",
          type: "flashcard",
          front: "Saya tinggal di...",
          back: "I live in...",
          explanation: "Contoh: Saya tinggal di Jakarta."
        },
        {
          id: "fc-alamat",
          type: "flashcard",
          front: "Jalan",
          back: "Street / Road",
          explanation: "Contoh: Jalan Sudirman No. 5."
        },
        {
          id: "quiz-intro-2",
          type: "multiple-choice",
          question: "Manakah kalimat yang benar?",
          options: [
            "Saya tinggal di Bali",
            "Saya nama di Bali",
            "Saya kabar di Bali"
          ],
          correctAnswer: "Saya tinggal di Bali",
          points: 15
        }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 3: ANGKA DASAR (NUMBERS)
// ==========================================
export const MODULE_ANGKA: CourseModule = {
  id: "bipa1-angka",
  title: "Angka 1-20",
  description: "Berhitung dasar untuk belanja dan kebutuhan sehari-hari.",
  level: 1,
  order: 3,
  thumbnailUrl: "1️⃣",
  themeColor: "bg-green-500",
  isLocked: true,
  lessons: [
    {
      id: "les-angka-1",
      title: "Angka 1-10",
      description: "Menghafal angka dasar.",
      order: 1,
      type: "interactive",
      duration: 10,
      xpReward: 100,
      interactiveContent: [
        { id: "fc-1", type: "flashcard", front: "Satu", back: "One" },
        { id: "fc-2", type: "flashcard", front: "Dua", back: "Two" },
        { id: "fc-3", type: "flashcard", front: "Tiga", back: "Three" },
        { id: "fc-4", type: "flashcard", front: "Empat", back: "Four" },
        { id: "fc-5", type: "flashcard", front: "Lima", back: "Five" },
        {
          id: "quiz-angka-1",
          type: "multiple-choice",
          question: "Berapa jumlah roda mobil?",
          options: ["Dua", "Tiga", "Empat", "Lima"],
          correctAnswer: "Empat",
          points: 10
        },
        { id: "fc-6", type: "flashcard", front: "Enam", back: "Six" },
        { id: "fc-7", type: "flashcard", front: "Tujuh", back: "Seven" },
        { id: "fc-8", type: "flashcard", front: "Delapan", back: "Eight" },
        { id: "fc-9", type: "flashcard", front: "Sembilan", back: "Nine" },
        { id: "fc-10", type: "flashcard", front: "Sepuluh", back: "Ten" }
      ]
    },
    {
      id: "les-angka-2",
      title: "Latihan Berhitung",
      description: "Kuis matematika sederhana.",
      order: 2,
      type: "quiz", // Tipe Lesson khusus Quiz (tanpa materi)
      duration: 5,
      xpReward: 50,
      quizData: [
        {
          id: "q-math-1",
          type: "multiple-choice",
          question: "Satu ditambah Dua sama dengan...",
          options: ["Tiga", "Empat", "Lima"],
          correctAnswer: "Tiga",
          points: 20
        },
        {
          id: "q-math-2",
          type: "fill-blank",
          question: "Lima dikurang Dua sama dengan...",
          correctAnswer: ["Tiga", "tiga", "3"],
          points: 20
        },
        {
          id: "q-math-3",
          type: "multiple-choice",
          question: "Angka setelah Sembilan adalah...",
          options: ["Delapan", "Sepuluh", "Tujuh"],
          correctAnswer: "Sepuluh",
          points: 20
        }
      ]
    }
  ]
};

// ==========================================
// EXPORT GABUNGAN (OPTIONAL)
// ==========================================
export const BIPA1_FULL_SET = [
  MODULE_SAPAAN,
  MODULE_PERKENALAN,
  MODULE_ANGKA
];