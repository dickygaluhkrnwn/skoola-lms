// Status pelajaran
export type LessonStatus = 'locked' | 'unlocked' | 'in-progress' | 'completed';

// Rekaman hasil pengerjaan Quiz
export interface QuizAttempt {
  id: string; // Unique ID untuk attempt ini
  lessonId: string;
  userId: string;
  score: number; // Nilai (0-100)
  totalQuestions: number;
  correctAnswers: number;
  timestamp: number; // Kapan dikerjakan
  isPassed: boolean; // Apakah lulus passing grade?
}

// Data detail progress per Lesson
export interface LessonProgress {
  lessonId: string;
  moduleId: string;
  status: LessonStatus;
  lastAccessedAt: number;
  bestScore?: number; // Jika tipe lesson adalah quiz
}

// Progress utama siswa (Dokumen tunggal di DB)
export interface StudentProgress {
  userId: string;
  
  // Statistik Global
  totalXp: number;
  currentLevel: number;
  nextLevelXp: number; // Target XP untuk level berikutnya
  
  // Streak Belajar (Login harian berturut-turut)
  streak: {
    currentStreak: number; // Hari ini hari ke-berapa
    longestStreak: number; // Rekor terpanjang
    lastActivityDate: string; // Format YYYY-MM-DD
    freezesRemaining: number; // Nyawa pembeku streak (opsional)
  };

  // Tracking Materi (Untuk akses cepat)
  // Key: lessonId, Value: LessonProgress
  lessons: Record<string, LessonProgress>;
  
  // Tracking Module (Untuk UI dashboard progress bar)
  // Key: moduleId, Value: Persentase (0-100)
  moduleCompletion: Record<string, number>;

  // Daftar Badge/Pencapaian yang sudah didapat
  achievements: {
    badgeId: string;
    unlockedAt: number;
  }[];
}