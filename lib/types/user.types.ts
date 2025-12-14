export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number; // Timestamp
  lastLogin: number; // Timestamp
  lastActivityDate?: number; // <-- NEW: Timestamp aktivitas terakhir untuk hitung streak harian
  
  // Data Akademik
  institutionId?: string; 
  schoolId?: string; // Field kunci untuk isolasi data sekolah
  department?: string; 
  identityNumber?: string; 
  schoolLevel?: 'sd' | 'smp' | 'sma' | 'uni'; // Jenjang sekolah

  // Gamification Stats (Khusus Student)
  gamification?: {
    xp: number;
    level: number;
    currentStreak: number;
    maxStreak: number; // <-- NEW: Rekor streak tertinggi
    lastStreakDate?: string; // Format YYYY-MM-DD untuk cek harian
    totalBadges: number;
  };

  // Arena Stats (New for Skoola Arena)
  arenaStats?: {
    totalPoints: number;      // Akumulasi poin seumur hidup
    currentSeasonPoints: number; // Poin musim ini (reset tiap season)
    currentRank?: number;     // Ranking Global saat ini
    currentTier?: "bronze" | "silver" | "gold" | "platinum" | "diamond";
    gamesPlayed: number;
    gamesWon: number;
  };

  // Metadata tambahan
  bio?: string;
  location?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  
  // Sekolah/Institusi (Opsional, jika nanti ada fitur multi-sekolah)
  schoolName?: string;
  
  // Class Enrollment
  enrolledClasses?: string[];
  completedModules?: string[];
}

// Definisi tipe data untuk Sekolah (Collection 'schools')
export interface School {
  id: string; // Document ID di Firestore
  name: string;
  schoolCode: string; // Kode unik untuk join (misal: SKL-8X92)
  address?: string;
  level: 'sd' | 'smp' | 'sma' | 'uni';
  adminId: string; // UID Admin yang mengelola sekolah ini
  createdAt: number;
  
  // Arena Stats untuk Sekolah (Guild War)
  arenaStats?: {
    totalPoints: number;
    globalRank?: number;
  };
}

// Tipe data ringkas untuk Leaderboard/UI list agar hemat bandwidth
export interface UserSummary {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: UserRole; 
  xp: number;
  level: number;
  schoolName?: string; // Penting untuk leaderboard global
}