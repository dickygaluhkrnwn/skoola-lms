import { CourseModule } from "@/lib/types/course.types";

// ==========================================
// BAGIAN 1: PENGALAMAN (EXPERIENCES)
// ==========================================
export const MODULE_PENGALAMAN: CourseModule = {
  id: "bipa3-pengalaman",
  title: "Pengalaman Masa Lalu",
  description: "Menceritakan kejadian yang sudah terjadi (Sudah, Pernah, Dulu).",
  level: 3, // Level Madya
  order: 13, // Lanjutan dari BIPA 2 (Order 12)
  thumbnailUrl: "🕰️", // FIX: Emoji dipindah ke sini
  themeColor: "bg-indigo-600",
  isLocked: true,
  lessons: [
    {
      id: "les-exp-1",
      title: "Sudah & Pernah",
      description: "Menyatakan pengalaman hidup.",
      order: 1,
      type: "interactive",
      duration: 10,
      xpReward: 120, // XP lebih besar untuk level Madya
      interactiveContent: [
        { id: "fc-sudah", type: "flashcard", front: "Sudah", back: "Already", explanation: "Menandakan aktivitas selesai." },
        { id: "fc-belum", type: "flashcard", front: "Belum", back: "Not yet", explanation: "Lawan dari 'Sudah'." },
        { id: "fc-pernah", type: "flashcard", front: "Pernah", back: "Have ever / Once", explanation: "Saya pernah ke Bali." },
        {
          id: "q-exp-1",
          type: "multiple-choice",
          question: "A: Apakah kamu _____ makan Durian?\nB: Tidak, saya tidak suka.",
          options: ["akan", "pernah", "sedang"],
          correctAnswer: "pernah",
          points: 15
        },
        {
          id: "q-exp-2",
          type: "arrange",
          question: "Susun kalimat: Saya - belum - ke - pernah - Jakarta",
          options: [],
          correctAnswer: ["Saya", "belum", "pernah", "ke", "Jakarta"],
          points: 25
        }
      ]
    },
    {
      id: "les-exp-2",
      title: "Cerita Liburan",
      description: "Menggunakan kata keterangan waktu lampau.",
      order: 2,
      type: "interactive",
      duration: 12,
      xpReward: 120,
      interactiveContent: [
        { id: "fc-kemarin-dulu", type: "flashcard", front: "Kemarin dulu", back: "The day before yesterday" },
        { id: "fc-minggu-lalu", type: "flashcard", front: "Minggu lalu", back: "Last week" },
        { id: "fc-dulu", type: "flashcard", front: "Dulu", back: "In the past / Used to" },
        {
          id: "q-exp-3",
          type: "fill-blank",
          question: "Waktu kecil, saya _____ tinggal di Desa.",
          correctAnswer: ["dulu", "pernah"],
          points: 20
        }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 2: CUACA & MUSIM (WEATHER)
// ==========================================
export const MODULE_CUACA: CourseModule = {
  id: "bipa3-cuaca",
  title: "Cuaca & Iklim",
  description: "Mengenal musim di Indonesia dan bencana alam.",
  level: 3,
  order: 14,
  thumbnailUrl: "⛈️", // FIX
  themeColor: "bg-sky-600",
  isLocked: true,
  lessons: [
    {
      id: "les-cuaca-1",
      title: "Musim di Indonesia",
      description: "Hanya ada dua musim.",
      order: 1,
      type: "interactive",
      duration: 10,
      xpReward: 120,
      interactiveContent: [
        { id: "fc-hujan", type: "flashcard", front: "Musim Hujan", back: "Rainy Season", explanation: "Biasanya Oktober - Maret." },
        { id: "fc-kemarau", type: "flashcard", front: "Musim Kemarau", back: "Dry Season", explanation: "Biasanya April - September." },
        { id: "fc-panas", type: "flashcard", front: "Panas", back: "Hot" },
        { id: "fc-dingin", type: "flashcard", front: "Dingin", back: "Cold" },
        {
          id: "q-cuaca-1",
          type: "multiple-choice",
          question: "Indonesia tidak memiliki musim...",
          options: ["Hujan", "Salju", "Kemarau"],
          correctAnswer: "Salju",
          points: 15
        }
      ]
    },
    {
      id: "les-cuaca-2",
      title: "Bencana Alam",
      description: "Banjir, Gempa, Gunung Meletus.",
      order: 2,
      type: "interactive",
      duration: 10,
      xpReward: 120,
      interactiveContent: [
        { id: "fc-banjir", type: "flashcard", front: "Banjir", back: "Flood", explanation: "Sering terjadi jika hujan deras." },
        { id: "fc-gempa", type: "flashcard", front: "Gempa Bumi", back: "Earthquake" },
        { id: "fc-gunung", type: "flashcard", front: "Gunung Meletus", back: "Volcanic Eruption" },
        {
          id: "q-cuaca-2",
          type: "fill-blank",
          question: "Jangan buang sampah di sungai agar tidak _____.",
          correctAnswer: ["banjir", "Banjir"],
          points: 20
        }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 3: CITA-CITA (HOPES & FUTURE)
// ==========================================
export const MODULE_CITACITA: CourseModule = {
  id: "bipa3-citacita",
  title: "Cita-cita & Harapan",
  description: "Membicarakan rencana masa depan (Akan, Ingin).",
  level: 3,
  order: 15,
  thumbnailUrl: "🎓", // FIX
  themeColor: "bg-yellow-600",
  isLocked: true,
  lessons: [
    {
      id: "les-future-1",
      title: "Rencana Masa Depan",
      description: "Saya akan, Saya ingin.",
      order: 1,
      type: "interactive",
      duration: 10,
      xpReward: 120,
      interactiveContent: [
        { id: "fc-akan", type: "flashcard", front: "Akan", back: "Will", explanation: "Saya akan pergi besok." },
        { id: "fc-ingin", type: "flashcard", front: "Ingin / Mau", back: "Want to" },
        { id: "fc-cita", type: "flashcard", front: "Cita-cita", back: "Dream/Ambition" },
        {
          id: "q-future-1",
          type: "arrange",
          question: "Susun: menjadi - ingin - dokter - Saya",
          options: [],
          correctAnswer: ["Saya", "ingin", "menjadi", "dokter"],
          points: 25
        }
      ]
    },
    {
      id: "les-future-2",
      title: "Profesi",
      description: "Dokter, Guru, Polisi, Pengusaha.",
      order: 2,
      type: "interactive",
      duration: 10,
      xpReward: 120,
      interactiveContent: [
        { id: "fc-guru", type: "flashcard", front: "Guru", back: "Teacher" },
        { id: "fc-dokter", type: "flashcard", front: "Dokter", back: "Doctor" },
        { id: "fc-pengusaha", type: "flashcard", front: "Pengusaha", back: "Entrepreneur/Businessman" },
        {
          id: "q-profesi-1",
          type: "multiple-choice",
          question: "Orang yang mengajar di sekolah adalah...",
          options: ["Dokter", "Guru", "Polisi"],
          correctAnswer: "Guru",
          points: 15
        }
      ]
    }
  ]
};

// Export Group
export const BIPA3_FULL_SET = [MODULE_PENGALAMAN, MODULE_CUACA, MODULE_CITACITA];