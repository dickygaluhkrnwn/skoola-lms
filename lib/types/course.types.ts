// Tipe soal quiz yang didukung
export type QuestionType = 'multiple-choice' | 'fill-blank' | 'drag-match' | 'listening';

// Struktur Data untuk Soal Quiz
export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  mediaUrl?: string; // URL audio/gambar jika ada
  
  // Opsi jawaban (untuk multiple choice)
  options?: string[];
  correctAnswer: string | string[]; // Bisa string tunggal atau array jawaban benar
  
  // Penjelasan saat user salah jawab (feedback)
  explanation?: string;
  
  // Poin yang didapat jika benar
  points: number;
}

// Struktur untuk Lesson (Materi Belajar)
export interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number; // Urutan lesson dalam module
  type: 'video' | 'article' | 'quiz';
  
  // Konten (tergantung tipe)
  content?: string; // Markdown/HTML content
  videoUrl?: string;
  quizData?: QuizQuestion[]; // Jika tipe = quiz
  
  // Estimasi waktu pengerjaan (menit)
  duration: number;
  xpReward: number;
}

// Struktur untuk Module (Unit Belajar Besar)
export interface CourseModule {
  id: string;
  title: string;
  description: string;
  level: number; // 1 = Pemula, 2 = Menengah, dst.
  order: number;
  thumbnailUrl?: string;
  
  // Warna tema modul (untuk UI yang cantik)
  themeColor?: string;
  
  // Daftar pelajaran dalam modul ini
  lessons: Lesson[];
  
  // Status akses (apakah terkunci?)
  isLocked?: boolean;
}