import { CourseModule } from "@/lib/types/course.types";

// ==========================================
// BAGIAN 1: RUTINITAS HARIAN (DAILY ROUTINE)
// ==========================================
export const MODULE_RUTINITAS: CourseModule = {
  id: "bipa2-rutinitas",
  title: "Rutinitas Harian",
  description: "Menceritakan kegiatan sehari-hari dari bangun tidur sampai tidur lagi.",
  level: 2,
  order: 7, // Lanjutan dari BIPA 1 (yang berakhir di order 6)
  thumbnailUrl: "⏰",
  themeColor: "bg-orange-500",
  isLocked: true,
  lessons: [
    {
      id: "les-rutin-1",
      title: "Kegiatan Pagi",
      description: "Bangun tidur, mandi, sarapan.",
      order: 1,
      type: "interactive",
      duration: 10,
      xpReward: 100,
      interactiveContent: [
        { id: "fc-bangun", type: "flashcard", front: "Bangun tidur", back: "Wake up" },
        { id: "fc-mandi", type: "flashcard", front: "Mandi", back: "Take a bath/shower" },
        { id: "fc-sarapan", type: "flashcard", front: "Sarapan", back: "Breakfast", explanation: "Makan pagi." },
        {
          id: "q-rutin-1",
          type: "multiple-choice",
          question: "Setelah bangun tidur, biasanya orang...",
          options: ["Tidur lagi", "Mandi", "Pulang"],
          correctAnswer: "Mandi",
          points: 10
        },
        { id: "fc-berangkat", type: "flashcard", front: "Berangkat sekolah/kerja", back: "Go to school/work" }
      ]
    },
    {
      id: "les-rutin-2",
      title: "Keterangan Waktu",
      description: "Jam berapa? Pukul berapa?",
      order: 2,
      type: "interactive",
      duration: 10,
      xpReward: 100,
      interactiveContent: [
        { id: "fc-jam", type: "flashcard", front: "Jam / Pukul", back: "O'clock", explanation: "'Pukul' lebih formal." },
        { id: "fc-setengah", type: "flashcard", front: "Setengah", back: "Half (30 mins)" },
        {
          id: "q-jam-1",
          type: "multiple-choice",
          question: "Jam 07.30 dibaca...",
          options: ["Jam tujuh pas", "Jam setengah delapan", "Jam delapan kurang"],
          correctAnswer: "Jam setengah delapan",
          points: 15,
          explanation: "Dalam bahasa Indonesia, 07.30 sering disebut 'setengah delapan' (half to eight)."
        }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 2: HOBI & KEGEMARAN (HOBBIES)
// ==========================================
export const MODULE_HOBI: CourseModule = {
  id: "bipa2-hobi",
  title: "Hobi & Kegemaran",
  description: "Menceritakan apa yang kamu suka lakukan di waktu luang.",
  level: 2,
  order: 8,
  thumbnailUrl: "🎨",
  themeColor: "bg-pink-500",
  isLocked: true,
  lessons: [
    {
      id: "les-hobi-1",
      title: "Jenis-jenis Hobi",
      description: "Membaca, Berenang, Memasak.",
      order: 1,
      type: "interactive",
      duration: 8,
      xpReward: 75,
      interactiveContent: [
        { id: "fc-baca", type: "flashcard", front: "Membaca", back: "Reading" },
        { id: "fc-renang", type: "flashcard", front: "Berenang", back: "Swimming" },
        { id: "fc-masak", type: "flashcard", front: "Memasak", back: "Cooking" },
        { id: "fc-bola", type: "flashcard", front: "Sepak bola", back: "Football/Soccer" },
        {
          id: "q-hobi-1",
          type: "fill-blank",
          question: "Saya suka _____ buku di perpustakaan.",
          correctAnswer: ["membaca", "Membaca"],
          points: 15
        }
      ]
    },
    {
      id: "les-hobi-2",
      title: "Frekuensi",
      description: "Sering, Jarang, Kadang-kadang.",
      order: 2,
      type: "interactive",
      duration: 5,
      xpReward: 50,
      interactiveContent: [
        { id: "fc-suka", type: "flashcard", front: "Suka / Gemar", back: "Like / Fond of" },
        { id: "fc-sering", type: "flashcard", front: "Sering", back: "Often" },
        { id: "fc-jarang", type: "flashcard", front: "Jarang", back: "Rarely" },
        {
          id: "q-freq-1",
          type: "arrange",
          question: "Susun kalimat: Saya - sering - memasak",
          options: [],
          correctAnswer: ["Saya", "sering", "memasak"],
          points: 20
        }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 3: LINGKUNGAN & ARAH (ENVIRONMENT)
// ==========================================
export const MODULE_LINGKUNGAN: CourseModule = {
  id: "bipa2-lingkungan",
  title: "Lingkungan & Arah",
  description: "Mengenal tempat umum dan cara bertanya jalan.",
  level: 2,
  order: 9,
  thumbnailUrl: "🗺️",
  themeColor: "bg-emerald-500",
  isLocked: true,
  lessons: [
    {
      id: "les-tempat-1",
      title: "Tempat Umum",
      description: "Pasar, Rumah Sakit, Sekolah.",
      order: 1,
      type: "interactive",
      duration: 8,
      xpReward: 75,
      interactiveContent: [
        { id: "fc-pasar", type: "flashcard", front: "Pasar", back: "Market" },
        { id: "fc-rs", type: "flashcard", front: "Rumah Sakit", back: "Hospital" },
        { id: "fc-kantor", type: "flashcard", front: "Kantor", back: "Office" },
        { id: "fc-bank", type: "flashcard", front: "Bank", back: "Bank" },
        {
          id: "q-tempat-1",
          type: "multiple-choice",
          question: "Orang sakit pergi ke...",
          options: ["Pasar", "Rumah Sakit", "Bank"],
          correctAnswer: "Rumah Sakit",
          points: 10
        }
      ]
    },
    {
      id: "les-arah-1",
      title: "Petunjuk Arah",
      description: "Kiri, Kanan, Lurus, Dekat, Jauh.",
      order: 2,
      type: "interactive",
      duration: 10,
      xpReward: 100,
      interactiveContent: [
        { id: "fc-kiri", type: "flashcard", front: "Kiri", back: "Left" },
        { id: "fc-kanan", type: "flashcard", front: "Kanan", back: "Right" },
        { id: "fc-lurus", type: "flashcard", front: "Lurus", back: "Straight" },
        { id: "fc-belok", type: "flashcard", front: "Belok", back: "Turn" },
        {
          id: "q-arah-1",
          type: "multiple-choice",
          question: "Lawan dari 'Kanan' adalah...",
          options: ["Lurus", "Kiri", "Atas"],
          correctAnswer: "Kiri",
          points: 10
        },
        {
          id: "q-arah-2",
          type: "arrange",
          question: "Susun kalimat: Belok - di depan - kiri",
          options: [],
          correctAnswer: ["Belok", "kiri", "di depan"],
          points: 20
        }
      ]
    }
  ]
};

export const BIPA2_FULL_SET = [MODULE_RUTINITAS, MODULE_HOBI, MODULE_LINGKUNGAN];