export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number; // Timestamp
  lastLogin: number; // Timestamp
  
  // Data Akademik (Penting untuk hierarki Forum & Sekolah Digital)
  institutionId?: string; // ID Sekolah/Kampus (Persiapan jika nanti multi-sekolah)
  department?: string; // Jurusan/Program Studi (e.g. "Teknik Informatika", "IPA")
  identityNumber?: string; // NIS/NIM/NIP

  // Gamification Stats (Khusus Student)
  gamification?: {
    xp: number;
    level: number;
    currentStreak: number;
    lastStreakDate?: string; // ISO Date string YYYY-MM-DD
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
}

// Tipe data ringkas untuk Leaderboard/UI list agar hemat bandwidth
export interface UserSummary {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: UserRole; // Ditambahkan agar mudah membedakan Guru/Siswa di list Forum
  xp: number;
  level: number;
}