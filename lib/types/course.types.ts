// Tipe soal quiz yang didukung
// UPDATE: Menambahkan 'arrange' agar tidak error saat seeding BIPA 2
export type QuestionType = 'multiple-choice' | 'fill-blank' | 'drag-match' | 'listening' | 'arrange';

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

// --- Tambahan untuk BIPA 1 (Materi Bacaan/Flashcard) ---
export interface FlashcardContent {
  id: string;
  type: 'flashcard';
  front: string;
  back: string;
  image?: string;
  audio?: string;
  explanation?: string;
}

// Union Type untuk konten interaktif
export type LessonContent = QuizQuestion | FlashcardContent;

// Struktur untuk Lesson (Materi Belajar)
export interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number; // Urutan lesson dalam module
  type: 'video' | 'article' | 'quiz' | 'interactive'; // 'interactive' ditambahkan untuk BIPA
  
  // Konten (tergantung tipe)
  content?: string; // Markdown/HTML content
  videoUrl?: string;
  
  quizData?: QuizQuestion[]; // Legacy: Jika tipe = quiz
  interactiveContent?: LessonContent[]; // New: Jika tipe = interactive
  
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

// Struktur Data Kelas (Classroom) - SKOOLA 2.0
export interface Classroom {
  id: string;
  name: string;
  code: string;
  description: string;
  
  teacherId: string;
  teacherName: string;
  
  studentCount: number;
  students?: string[]; // Array of User UIDs
  
  createdAt: string;
  
  // New Fields for Categorization
  category: string; // e.g. "Matematika", "Sains", "Bahasa"
  gradeLevel: 'sd' | 'smp' | 'sma' | 'uni' | 'umum'; // Jenjang target
  
  themeColor?: string; // Optional: Override warna kelas
}