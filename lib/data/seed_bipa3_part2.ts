import { CourseModule } from "@/lib/types/course.types";

// ==========================================
// BAGIAN 4: PENDAPAT & DISKUSI (OPINIONS)
// ==========================================
export const MODULE_PENDAPAT: CourseModule = {
  id: "bipa3-pendapat",
  title: "Menyampaikan Pendapat",
  description: "Setuju, Tidak Setuju, dan memberikan alasan (Menurut saya...).",
  level: 3,
  order: 16,
  thumbnailUrl: "🗣️",
  themeColor: "bg-orange-600",
  isLocked: true,
  lessons: [
    {
      id: "les-opini-1",
      title: "Memberikan Opini",
      description: "Menurut saya, Saya pikir.",
      order: 1,
      type: "interactive",
      duration: 10,
      xpReward: 120,
      interactiveContent: [
        { id: "fc-menurut", type: "flashcard", front: "Menurut saya...", back: "In my opinion...", explanation: "Frasa standar untuk memulai opini." },
        { id: "fc-pikir", type: "flashcard", front: "Saya pikir...", back: "I think..." },
        { id: "fc-setuju", type: "flashcard", front: "Setuju", back: "Agree" },
        { id: "fc-tidak-setuju", type: "flashcard", front: "Tidak setuju", back: "Disagree" },
        {
          id: "q-opini-1",
          type: "arrange",
          question: "Susun: saya - film - bagus - Menurut - ini",
          options: [],
          correctAnswer: ["Menurut", "saya", "film", "ini", "bagus"],
          points: 25
        }
      ]
    },
    {
      id: "les-opini-2",
      title: "Debat Sederhana",
      description: "Menyanggah dengan sopan.",
      order: 2,
      type: "interactive",
      duration: 12,
      xpReward: 130,
      interactiveContent: [
        { id: "fc-maaf-beda", type: "flashcard", front: "Maaf, saya kurang setuju", back: "Sorry, I disagree (Polite)", explanation: "Cara sopan menolak pendapat." },
        { id: "fc-betul-tapi", type: "flashcard", front: "Betul, tetapi...", back: "True, but...", explanation: "Menyetujui sebagian lalu menyanggah." },
        {
          id: "q-opini-2",
          type: "multiple-choice",
          question: "Manakah cara sopan untuk tidak setuju?",
          options: ["Kamu salah!", "Itu ide bodoh.", "Maaf, saya kurang sependapat."],
          correctAnswer: "Maaf, saya kurang sependapat.",
          points: 15
        }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 5: SURAT & EMAIL (CORRESPONDENCE)
// ==========================================
export const MODULE_SURAT: CourseModule = {
  id: "bipa3-surat",
  title: "Surat & Email Formal",
  description: "Menulis pesan resmi, lamaran kerja, atau izin.",
  level: 3,
  order: 17,
  thumbnailUrl: "✉️",
  themeColor: "bg-slate-600",
  isLocked: true,
  lessons: [
    {
      id: "les-surat-1",
      title: "Struktur Surat",
      description: "Kepada Yth, Hormat Saya.",
      order: 1,
      type: "interactive",
      duration: 10,
      xpReward: 120,
      interactiveContent: [
        { id: "fc-yth", type: "flashcard", front: "Kepada Yth.", back: "Dear (Formal)", explanation: "Singkatan dari 'Yang Terhormat'." },
        { id: "fc-hormat", type: "flashcard", front: "Hormat saya", back: "Sincerely yours", explanation: "Salam penutup formal." },
        { id: "fc-lampiran", type: "flashcard", front: "Lampiran", back: "Attachment" },
        {
          id: "q-surat-1",
          type: "fill-blank",
          question: "Salam pembuka surat resmi biasanya: Kepada _____.",
          correctAnswer: ["Yth", "Yth.", "yth"],
          points: 20
        }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 6: BUDAYA & TRADISI (CULTURE)
// ==========================================
export const MODULE_BUDAYA: CourseModule = {
  id: "bipa3-budaya",
  title: "Budaya Indonesia",
  description: "Batik, Gotong Royong, dan tradisi lokal.",
  level: 3,
  order: 18,
  thumbnailUrl: "🎭",
  themeColor: "bg-amber-700",
  isLocked: true,
  lessons: [
    {
      id: "les-budaya-1",
      title: "Simbol Budaya",
      description: "Batik, Angklung, Wayang.",
      order: 1,
      type: "interactive",
      duration: 10,
      xpReward: 120,
      interactiveContent: [
        { id: "fc-batik", type: "flashcard", front: "Batik", back: "Batik", explanation: "Kain tradisional bergambar khas Indonesia." },
        { id: "fc-gotong", type: "flashcard", front: "Gotong Royong", back: "Mutual Cooperation", explanation: "Bekerja bersama-sama tanpa bayaran." },
        { id: "fc-ramah", type: "flashcard", front: "Ramah", back: "Friendly", explanation: "Sifat khas orang Indonesia." },
        {
          id: "q-budaya-1",
          type: "multiple-choice",
          question: "Apa arti 'Gotong Royong'?",
          options: ["Kerja sendiri", "Kerja sama", "Tidur siang"],
          correctAnswer: "Kerja sama",
          points: 15
        }
      ]
    },
    {
      id: "les-budaya-2",
      title: "Hari Raya",
      description: "Lebaran, Nyepi, Natal.",
      order: 2,
      type: "interactive",
      duration: 10,
      xpReward: 120,
      interactiveContent: [
        { id: "fc-lebaran", type: "flashcard", front: "Lebaran / Idul Fitri", back: "Eid al-Fitr" },
        { id: "fc-mudik", type: "flashcard", front: "Mudik", back: "Homecoming", explanation: "Tradisi pulang kampung saat hari raya." },
        { id: "fc-thr", type: "flashcard", front: "THR", back: "Holiday Allowance", explanation: "Uang bonus hari raya." },
        {
          id: "q-budaya-2",
          type: "fill-blank",
          question: "Tradisi pulang kampung disebut _____.",
          correctAnswer: ["mudik", "Mudik"],
          points: 20
        }
      ]
    }
  ]
};

// Export Group
export const BIPA3_PART2_SET = [MODULE_PENDAPAT, MODULE_SURAT, MODULE_BUDAYA];