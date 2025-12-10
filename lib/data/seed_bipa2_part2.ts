import { CourseModule } from "@/lib/types/course.types";

// ==========================================
// BAGIAN 4: BERBELANJA (SHOPPING)
// ==========================================
export const MODULE_BELANJA: CourseModule = {
  id: "bipa2-belanja",
  title: "Berbelanja",
  description: "Tawar-menawar di pasar dan membeli barang kebutuhan.",
  level: 2,
  order: 10,
  thumbnailUrl: "🛍️",
  themeColor: "bg-red-500",
  isLocked: true,
  lessons: [
    {
      id: "les-belanja-1",
      title: "Di Pasar",
      description: "Menanyakan harga dan menawar.",
      order: 1,
      type: "interactive",
      duration: 10,
      xpReward: 100,
      interactiveContent: [
        { id: "fc-harga", type: "flashcard", front: "Berapa harganya?", back: "How much is it?" },
        { id: "fc-mahal", type: "flashcard", front: "Mahal", back: "Expensive" },
        { id: "fc-murah", type: "flashcard", front: "Murah", back: "Cheap" },
        { id: "fc-tawar", type: "flashcard", front: "Boleh kurang?", back: "Can you lower the price?", explanation: "Kalimat sakti untuk menawar di pasar tradisional." },
        {
          id: "q-belanja-1",
          type: "multiple-choice",
          question: "Jika harga terlalu tinggi, kamu bilang...",
          options: ["Wah, murah sekali!", "Wah, mahal sekali!", "Wah, bagus sekali!"],
          correctAnswer: "Wah, mahal sekali!",
          points: 10
        }
      ]
    },
    {
      id: "les-belanja-2",
      title: "Uang & Pembayaran",
      description: "Mata uang Rupiah dan cara bayar.",
      order: 2,
      type: "interactive",
      duration: 8,
      xpReward: 75,
      interactiveContent: [
        { id: "fc-uang", type: "flashcard", front: "Uang", back: "Money" },
        { id: "fc-kembalian", type: "flashcard", front: "Uang kembalian", back: "Change" },
        { id: "fc-tunai", type: "flashcard", front: "Tunai / Cash", back: "Cash" },
        {
          id: "q-belanja-2",
          type: "arrange",
          question: "Susun kalimat: bayar - Saya - tunai - pakai",
          options: [],
          correctAnswer: ["Saya", "bayar", "pakai", "tunai"],
          points: 20
        }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 5: KESEHATAN (HEALTH)
// ==========================================
export const MODULE_KESEHATAN: CourseModule = {
  id: "bipa2-kesehatan",
  title: "Kesehatan",
  description: "Menyebutkan bagian tubuh dan gejala sakit.",
  level: 2,
  order: 11,
  thumbnailUrl: "🏥",
  themeColor: "bg-teal-500",
  isLocked: true,
  lessons: [
    {
      id: "les-sehat-1",
      title: "Anggota Tubuh",
      description: "Kepala, perut, tangan, kaki.",
      order: 1,
      type: "interactive",
      duration: 8,
      xpReward: 75,
      interactiveContent: [
        { id: "fc-kepala", type: "flashcard", front: "Kepala", back: "Head" },
        { id: "fc-perut", type: "flashcard", front: "Perut", back: "Stomach" },
        { id: "fc-tangan", type: "flashcard", front: "Tangan", back: "Hand/Arm" },
        { id: "fc-kaki", type: "flashcard", front: "Kaki", back: "Foot/Leg" },
        {
          id: "q-tubuh-1",
          type: "multiple-choice",
          question: "Kita berjalan menggunakan...",
          options: ["Tangan", "Kepala", "Kaki"],
          correctAnswer: "Kaki",
          points: 10
        }
      ]
    },
    {
      id: "les-sehat-2",
      title: "Saya Sakit",
      description: "Mengungkapkan rasa sakit ke dokter.",
      order: 2,
      type: "interactive",
      duration: 10,
      xpReward: 100,
      interactiveContent: [
        { id: "fc-sakit", type: "flashcard", front: "Sakit", back: "Sick / Pain" },
        { id: "fc-pusing", type: "flashcard", front: "Pusing / Sakit Kepala", back: "Headache / Dizzy" },
        { id: "fc-demam", type: "flashcard", front: "Demam / Panas", back: "Fever" },
        { id: "fc-obat", type: "flashcard", front: "Obat", back: "Medicine" },
        {
          id: "q-sakit-1",
          type: "fill-blank",
          question: "Badan saya panas, saya kena _____.",
          correctAnswer: ["demam", "Demam"],
          points: 15
        }
      ]
    }
  ]
};

// ==========================================
// BAGIAN 6: TRANSPORTASI (TRANSPORT)
// ==========================================
export const MODULE_TRANSPORTASI: CourseModule = {
  id: "bipa2-transport",
  title: "Transportasi",
  description: "Jenis kendaraan dan cara bepergian.",
  level: 2,
  order: 12,
  thumbnailUrl: "🚎",
  themeColor: "bg-blue-600",
  isLocked: true,
  lessons: [
    {
      id: "les-trans-1",
      title: "Kendaraan Umum",
      description: "Bus, Kereta, Angkot, Ojek.",
      order: 1,
      type: "interactive",
      duration: 8,
      xpReward: 75,
      interactiveContent: [
        { id: "fc-mobil", type: "flashcard", front: "Mobil", back: "Car" },
        { id: "fc-motor", type: "flashcard", front: "Sepeda Motor", back: "Motorcycle", explanation: "Kendaraan paling umum di Indonesia." },
        { id: "fc-kereta", type: "flashcard", front: "Kereta Api", back: "Train" },
        { id: "fc-ojek", type: "flashcard", front: "Ojek", back: "Motorcycle Taxi" },
        {
          id: "q-trans-1",
          type: "multiple-choice",
          question: "Kendaraan roda dua yang bisa disewa disebut...",
          options: ["Bus", "Ojek", "Kereta"],
          correctAnswer: "Ojek",
          points: 10
        }
      ]
    },
    {
      id: "les-trans-2",
      title: "Pergi Liburan",
      description: "Tiket, Bandara, Stasiun.",
      order: 2,
      type: "interactive",
      duration: 8,
      xpReward: 75,
      interactiveContent: [
        { id: "fc-tiket", type: "flashcard", front: "Tiket / Karcis", back: "Ticket" },
        { id: "fc-bandara", type: "flashcard", front: "Bandara", back: "Airport" },
        { id: "fc-stasiun", type: "flashcard", front: "Stasiun", back: "Station (Train)" },
        {
          id: "q-trans-2",
          type: "fill-blank",
          question: "Saya pergi ke Bali naik _____ terbang.",
          correctAnswer: ["pesawat", "Pesawat"],
          points: 15
        }
      ]
    }
  ]
};

// Export Group
export const BIPA2_PART2_SET = [MODULE_BELANJA, MODULE_KESEHATAN, MODULE_TRANSPORTASI];