// Tipe data untuk fitur Social Feed (Twitter-style)
export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername?: string; // e.g., @budi123
  authorAvatar?: string;
  
  // Identitas Sekolah (Penting untuk Pride)
  authorSchoolId: string;
  authorSchoolName: string;
  authorSchoolColor?: string; // Opsional: untuk border/badge warna sekolah
  authorRole: "student" | "teacher" | "admin";
  authorRankTitle?: string; // e.g., "Explorer", "Senior" (Diambil dari XP)

  content: string;
  imageUrls?: string[]; // Support multiple images
  
  // Interaksi
  likesCount: number;
  commentsCount: number;
  likedBy: string[]; // Array of User IDs yang like (untuk UI state)
  
  createdAt: number; // Timestamp
  updatedAt?: number;
}

export interface SocialComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: number;
}

// --- SKOOLA ARENA (GAMIFIKASI) TYPES ---

// Konfigurasi Season (Musim Kompetisi)
export interface ArenaSeason {
  id: string; // e.g., "season-2024-01"
  title: string; // e.g., "Season 1: Cyber Punk"
  description: string;
  themeColor: string; // Hex code untuk tema UI musim ini
  isActive: boolean;
  startDate: number;
  endDate: number;
}

// Entry untuk Leaderboard
export interface LeaderboardEntry {
  id: string; // userId atau schoolId
  name: string; // Nama User atau Nama Sekolah
  avatarUrl?: string; // Foto User atau Logo Sekolah
  schoolName?: string; // Hanya untuk tipe 'individual', biar tau asal sekolahnya
  
  rank: number; // Posisi 1, 2, 3...
  points: number; // Total Points Arena
  
  // Metadata tambahan untuk display
  tier?: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  change?: number; // Perubahan rangking (e.g., +2, -1)
}

// Tipe Game/Tantangan di Arena
export type ArenaGameType = "trivia" | "word-match" | "word-find" | "math-rush";

export interface ArenaChallenge {
  id: string;
  title: string;
  description: string;
  type: ArenaGameType;
  difficulty: "easy" | "medium" | "hard";
  
  pointsReward: number;
  xpReward: number; // XP biasa juga dapet
  timeLimit: number; // dalam detik
  
  // Status user terhadap challenge ini (untuk Daily Challenge)
  isCompleted?: boolean; 
  playedCount?: number;
}

// Struktur Data Soal Game (Disimpan di sub-collection atau field terpisah)
export interface ArenaQuestion {
  id: string;
  question: string;
  options?: string[]; // Untuk Trivia
  correctAnswer: string | number;
  explanation?: string;
}