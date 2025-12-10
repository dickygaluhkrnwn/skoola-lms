import { CourseModule } from "@/lib/types/course.types";

// ==========================================
// BAGIAN 4: KELUARGA & KATA GANTI
// ==========================================
export const MODULE_KELUARGA: CourseModule = {
  id: "bipa1-keluarga",
  title: "Keluarga Saya",
  description: "Mengenal anggota keluarga inti dan kata ganti orang.",
  level: 1,
  order: 4,
  thumbnailUrl: "👨‍👩‍👧‍👦",
  themeColor: "bg-pink-500",
  isLocked: true,
  lessons: [
    {
      id: "les-kel-1",
      title: "Anggota Keluarga",
      description: "Ayah, Ibu, Kakak, dan Adik.",
      order: 1,
      type: "interactive",
      duration: 8,
      xpReward: 75,
      interactiveContent: [
        { id: "fc-ayah", type: "flashcard", front: "Ayah / Bapak", back: "Father", explanation: "'Bapak' lebih formal, 'Ayah' lebih akrab." },
        { id: "fc-ibu", type: "flashcard", front: "Ibu", back: "Mother" },
        {
          id: "q-kel-1",
          type: "multiple-choice",
          question: "Siapa pasangan dari Ayah?",
          options: ["Nenek", "Ibu", "Kakak"],
          correctAnswer: "Ibu",
          points: 10
        },
        { id: "fc-kakak", type: "flashcard", front: "Kakak", back: "Older Sibling", explanation: "Kakak laki-laki atau perempuan." },
        { id: "fc-adik", type: "flashcard", front: "Adik", back: "Younger Sibling" },
        {
          id: "q-kel-2",
          type: "fill-blank",
          question: "Saudara yang lebih muda dipanggil...",
          correctAnswer: ["Adik", "adik"],
          points: 15
        }
      ]
    },
    {
      id: "les-kel-2",
      title: "Kata Ganti Orang",
      description: "Saya, Kamu, Dia, Mereka.",
      order: 2,
      type: "interactive",
      duration: 10,
      xpReward: 100,
      interactiveContent: [
        { id: "fc-saya", type: "flashcard", front: "Saya / Aku", back: "I / Me", explanation: "'Saya' (Formal), 'Aku' (Informal)." },
        { id: "fc-kamu", type: "flashcard", front: "Kamu / Anda", back: "You", explanation: "'Anda' (Sangat Formal)." },
        { id: "fc-dia", type: "flashcard", front: "Dia", back: "He / She", explanation: "Tidak membedakan gender." },
        {
          id: "q-prn-1",
          type: "multiple-choice",
          question: "Bahasa Indonesia dari 'She' adalah...",
          options: ["Kamu", "Dia", "Mereka"],
          correctAnswer: "Dia",
          points: 10
        },
        { id: "fc-mereka", type: "flashcard", front: "Mereka", back: "They" },
        { id: "fc-kita", type: "flashcard", front: "Kita", back: "We (inclusive)", explanation: "Termasuk orang yang diajak bicara." }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 5: BENDA & LINGKUNGAN
// ==========================================
export const MODULE_BENDA: CourseModule = {
  id: "bipa1-benda",
  title: "Di Sekitar Kita",
  description: "Nama benda sehari-hari dan kata tunjuk lokasi.",
  level: 1,
  order: 5,
  thumbnailUrl: "🎒",
  themeColor: "bg-purple-500",
  isLocked: true,
  lessons: [
    {
      id: "les-benda-1",
      title: "Benda Sekolah",
      description: "Buku, Pena, Meja, Kursi.",
      order: 1,
      type: "interactive",
      duration: 5,
      xpReward: 50,
      interactiveContent: [
        { id: "fc-buku", type: "flashcard", front: "Buku", back: "Book" },
        { id: "fc-pena", type: "flashcard", front: "Pena / Pulpen", back: "Pen" },
        { id: "fc-meja", type: "flashcard", front: "Meja", back: "Table" },
        { id: "fc-kursi", type: "flashcard", front: "Kursi", back: "Chair" },
        {
          id: "q-benda-1",
          type: "multiple-choice",
          question: "Benda untuk duduk adalah...",
          options: ["Meja", "Kursi", "Buku"],
          correctAnswer: "Kursi",
          points: 10
        }
      ]
    },
    {
      id: "les-benda-2",
      title: "Kata Tunjuk & Posisi",
      description: "Ini, Itu, Di atas, Di dalam.",
      order: 2,
      type: "interactive",
      duration: 8,
      xpReward: 75,
      interactiveContent: [
        { id: "fc-ini", type: "flashcard", front: "Ini", back: "This", explanation: "Untuk benda dekat." },
        { id: "fc-itu", type: "flashcard", front: "Itu", back: "That", explanation: "Untuk benda jauh." },
        {
          id: "q-tunjuk-1",
          type: "multiple-choice",
          question: "A: Apa ...? (Jauh)\nB: Itu meja.",
          options: ["ini", "itu", "apa"],
          correctAnswer: "itu",
          points: 10
        },
        { id: "fc-atas", type: "flashcard", front: "Di atas", back: "On top of" },
        { id: "fc-dalam", type: "flashcard", front: "Di dalam", back: "Inside" },
        {
          id: "q-posisi-1",
          type: "fill-blank",
          question: "Buku ada _____ tas. (Inside)",
          correctAnswer: ["di dalam", "Di dalam"],
          points: 15
        }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 6: WAKTU (HARI & AKTIVITAS)
// ==========================================
export const MODULE_WAKTU: CourseModule = {
  id: "bipa1-waktu",
  title: "Waktu & Hari",
  description: "Nama-nama hari dan keterangan waktu.",
  level: 1,
  order: 6,
  thumbnailUrl: "📅",
  themeColor: "bg-teal-500",
  isLocked: true,
  lessons: [
    {
      id: "les-hari-1",
      title: "Nama Hari",
      description: "Senin sampai Minggu.",
      order: 1,
      type: "interactive",
      duration: 5,
      xpReward: 50,
      interactiveContent: [
        { id: "fc-senin", type: "flashcard", front: "Senin", back: "Monday" },
        { id: "fc-selasa", type: "flashcard", front: "Selasa", back: "Tuesday" },
        { id: "fc-rabu", type: "flashcard", front: "Rabu", back: "Wednesday" },
        { id: "fc-kamis", type: "flashcard", front: "Kamis", back: "Thursday" },
        { id: "fc-jumat", type: "flashcard", front: "Jumat", back: "Friday" },
        { id: "fc-sabtu", type: "flashcard", front: "Sabtu", back: "Saturday" },
        { id: "fc-minggu", type: "flashcard", front: "Minggu", back: "Sunday" },
        {
          id: "q-hari-1",
          type: "multiple-choice",
          question: "Hari setelah Senin adalah...",
          options: ["Rabu", "Selasa", "Minggu"],
          correctAnswer: "Selasa",
          points: 10
        }
      ]
    },
    {
      id: "les-hari-2",
      title: "Konsep Waktu",
      description: "Besok, Kemarin, Hari ini.",
      order: 2,
      type: "interactive",
      duration: 5,
      xpReward: 50,
      interactiveContent: [
        { id: "fc-hariini", type: "flashcard", front: "Hari ini", back: "Today" },
        { id: "fc-besok", type: "flashcard", front: "Besok", back: "Tomorrow" },
        { id: "fc-kemarin", type: "flashcard", front: "Kemarin", back: "Yesterday" },
        {
          id: "q-waktu-1",
          type: "fill-blank",
          question: "Hari ini Senin. _____ adalah Selasa.",
          correctAnswer: ["Besok", "besok"],
          points: 15
        }
      ]
    }
  ]
};

// Export Group
export const BIPA1_PART2_SET = [MODULE_KELUARGA, MODULE_BENDA, MODULE_WAKTU];