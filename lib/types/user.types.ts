export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number; // Timestamp
  lastLogin: number; // Timestamp
  
  // Data Akademik
  institutionId?: string; 
  schoolId?: string; // <-- UPDATE: Field kunci untuk isolasi data sekolah
  department?: string; 
  identityNumber?: string; 
  schoolLevel?: 'sd' | 'smp' | 'sma' | 'uni'; // Tambahan untuk jenjang sekolah

  // Gamification Stats (Khusus Student)
  gamification?: {
    xp: number;
    level: number;
    currentStreak: number;
    lastStreakDate?: string; 
    totalBadges: number;
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

// UPDATE: Definisi tipe data untuk Sekolah (Collection 'schools')
export interface School {
  id: string; // Document ID di Firestore
  name: string;
  schoolCode: string; // Kode unik untuk join (misal: SKL-8X92)
  address?: string;
  level: 'sd' | 'smp' | 'sma' | 'uni';
  adminId: string; // UID Admin yang mengelola sekolah ini
  createdAt: number;
}

// Tipe data ringkas untuk Leaderboard/UI list agar hemat bandwidth
export interface UserSummary {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: UserRole; 
  xp: number;
  level: number;
}