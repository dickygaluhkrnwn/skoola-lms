export const BADGE_SYSTEM = [
  // Kategori: Pemula
  { 
    id: "badge_newbie", 
    name: "Pendatang Baru", 
    icon: "🌱", 
    desc: "Bergabung dengan Skoola", 
    condition: (u: any) => true 
  },
  
  // Kategori: Modul & Belajar
  { 
    id: "badge_first_step", 
    name: "Langkah Pertama", 
    icon: "👣", 
    desc: "Menyelesaikan 1 Modul", 
    condition: (u: any) => (u.completedModules?.length || 0) >= 1 
  },
  { 
    id: "badge_scholar", 
    name: "Si Kutu Buku", 
    icon: "📚", 
    desc: "Menyelesaikan 3 Modul", 
    condition: (u: any) => (u.completedModules?.length || 0) >= 3 
  },
  { 
    id: "badge_master", 
    name: "Ahli Bahasa", 
    icon: "🎓", 
    desc: "Menyelesaikan 10 Modul", 
    condition: (u: any) => (u.completedModules?.length || 0) >= 10 
  },

  // Kategori: XP (Grinding)
  { 
    id: "badge_rich", 
    name: "Sultan XP", 
    icon: "💎", 
    desc: "Mengumpulkan 500 XP", 
    condition: (u: any) => (u.xp || 0) >= 500 
  },
  { 
    id: "badge_legend", 
    name: "Legenda Skoola", 
    icon: "👑", 
    desc: "Mengumpulkan 2000 XP", 
    condition: (u: any) => (u.xp || 0) >= 2000 
  },

  // Kategori: Streak (Konsistensi)
  { 
    id: "badge_streak_3", 
    name: "Si Rajin", 
    icon: "🔥", 
    desc: "Login 3 Hari Beruntun", 
    condition: (u: any) => (u.streak || 0) >= 3 
  },
  { 
    id: "badge_streak_7", 
    name: "Api Membara", 
    icon: "⚡", 
    desc: "Login 7 Hari Beruntun", 
    condition: (u: any) => (u.streak || 0) >= 7 
  },

  // Kategori: Sosial
  { 
    id: "badge_social", 
    name: "Anak Gaul", 
    icon: "👋", 
    desc: "Bergabung dalam 1 Kelas", 
    condition: (u: any) => (u.enrolledClasses?.length || 0) >= 1 
  }
];