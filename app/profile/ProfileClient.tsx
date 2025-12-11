"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Loader2, BookOpen, 
  Settings, Award, Users, Activity, Lock, Star, Flame, Zap
} from "lucide-react";
import { auth, db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useTheme } from "../../lib/theme-context";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { UserProfile } from "../../lib/types/user.types";

// --- SISTEM BADGE DINAMIS ---
// Badge ini akan terbuka otomatis jika syarat (condition) terpenuhi oleh data user
const BADGE_SYSTEM = [
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

export default function ProfileClient() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  
  // State User Profile (Any untuk fleksibilitas struktur data)
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"achievements" | "friends" | "feed">("achievements");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/");
      return;
    }

    // Menggunakan onSnapshot agar update badge terjadi secara Real-Time
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Normalisasi Data (Menangani struktur lama dan baru agar tidak error)
        const normalizedData = {
          ...data,
          xp: data.xp ?? data.gamification?.xp ?? 0,
          level: data.level ?? data.gamification?.level ?? 1,
          streak: data.streak ?? data.gamification?.currentStreak ?? 0,
          completedModules: data.completedModules || [],
          enrolledClasses: data.enrolledClasses || []
        };
        
        setUserProfile(normalizedData);
      }
      setLoading(false);
    }, (error) => {
      console.error("Gagal load profil:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fungsi Cek Status Badge
  const checkBadge = (badge: typeof BADGE_SYSTEM[0]) => {
    if (!userProfile) return false;
    return badge.condition(userProfile);
  };

  const unlockedCount = BADGE_SYSTEM.filter(b => checkBadge(b)).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  }

  // Helper Stats
  const getXP = () => userProfile?.xp || 0;
  const getLevel = () => userProfile?.level || 1;
  const getStreak = () => userProfile?.streak || 0;

  return (
    <div className={cn(
      "min-h-screen font-sans transition-colors duration-500 flex flex-col items-center p-4 md:p-6",
      theme === "kids" ? "bg-yellow-50" : "bg-slate-50"
    )}>
      
      {/* 1. HEADER NAV */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6">
        <button 
          onClick={() => router.back()} 
          className={cn(
            "p-2 rounded-full transition-all hover:bg-black/5",
            theme === "kids" ? "text-gray-600" : "text-slate-600"
          )}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Profil Saya</h1>
        <button 
          onClick={() => router.push('/profile/edit')} 
          className={cn(
            "p-2 rounded-full transition-all hover:bg-black/5",
            theme === "kids" ? "text-sky-600 bg-sky-100" : "text-slate-600 bg-white border border-slate-200"
          )}
          title="Edit Profil"
        >
          <Settings size={20} />
        </button>
      </div>

      <main className="w-full max-w-2xl space-y-6">
        
        {/* 2. CARD UTAMA (Profile Header) */}
        <div className={cn(
          "bg-white p-6 border shadow-sm relative overflow-hidden",
          theme === "kids" ? "rounded-3xl border-yellow-200" : "rounded-xl border-slate-200"
        )}>
          {/* Background Decoration */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-24 opacity-20",
            theme === "kids" ? "bg-gradient-to-r from-yellow-400 to-red-400" : "bg-gradient-to-r from-slate-400 to-slate-600"
          )} />

          <div className="relative flex items-end gap-4 mt-8 px-2">
            <div className={cn(
              "w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-4xl bg-gray-100 select-none overflow-hidden shrink-0",
              theme === "kids" ? "bg-sky-50" : "bg-slate-50"
            )}>
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>😎</span>
              )}
            </div>
            
            <div className="flex-1 mb-2">
              <h2 className="text-2xl font-bold text-foreground leading-tight">{userProfile?.displayName}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  userProfile?.role === "teacher" 
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-green-50 text-green-600 border-green-100"
                )}>
                  {userProfile?.role === "teacher" ? "Guru" : "Murid"}
                </span>
                <span>Level {getLevel()}</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <StatCard 
              theme={theme}
              icon={<Star size={18} className="text-yellow-500 fill-yellow-500" />} 
              label="XP Total" 
              value={getXP()} 
            />
            <StatCard 
              theme={theme}
              icon={<Award size={18} className="text-blue-500" />} 
              label="Badges" 
              value={unlockedCount} 
            />
            <StatCard 
              theme={theme}
              icon={<Flame size={18} className="text-orange-500 fill-orange-500" />} 
              label="Streak" 
              value={getStreak()} 
            />
          </div>

          {/* Survey Button (Conditional) */}
          <div className="mt-4 pt-4 border-t border-dashed border-gray-100">
             <Button 
               onClick={() => router.push("/survey")}
               variant="ghost"
               size="sm"
               className={cn(
                 "w-full text-xs font-medium h-8",
                 theme === "kids" ? "text-sky-600 hover:text-sky-700 hover:bg-sky-50" : "text-slate-500 hover:text-slate-700"
               )}
             >
               <BookOpen className="mr-2 h-3 w-3" /> 
               {theme === "kids" ? "Cek Ulang Level Kamu" : "Kalibrasi Level Kompetensi"}
             </Button>
          </div>
        </div>

        {/* 3. TABS NAVIGATION */}
        <div className={cn(
          "flex p-1 shadow-sm border transition-all sticky top-2 z-10 backdrop-blur-md bg-opacity-90",
          theme === "kids" ? "bg-white/80 rounded-2xl border-sky-100" : "bg-white/80 rounded-lg border-border"
        )}>
          <TabButton 
            active={activeTab === "achievements"} 
            onClick={() => setActiveTab("achievements")} 
            label="Pencapaian" 
            icon={<Award size={16} />}
            theme={theme} 
          />
          <TabButton 
            active={activeTab === "friends"} 
            onClick={() => setActiveTab("friends")} 
            label="Teman" 
            icon={<Users size={16} />}
            theme={theme} 
          />
          <TabButton 
            active={activeTab === "feed"} 
            onClick={() => setActiveTab("feed")} 
            label="Aktivitas" 
            icon={<Activity size={16} />}
            theme={theme} 
          />
        </div>

        {/* 4. TAB CONTENT */}
        <div className="min-h-[300px]">
          
          {/* TAB: ACHIEVEMENTS (REAL DATA) */}
          {activeTab === "achievements" && (
            <div className="grid grid-cols-2 gap-4">
              {BADGE_SYSTEM.map((badge) => {
                const isUnlocked = checkBadge(badge);
                return (
                  <div 
                    key={badge.id}
                    className={cn(
                      "p-4 border rounded-xl flex flex-col items-center text-center transition-all duration-300",
                      isUnlocked 
                        ? (theme === "kids" ? "bg-white border-yellow-200 shadow-sm scale-100" : "bg-white border-slate-200")
                        : "bg-gray-50 border-gray-100 opacity-60 grayscale scale-95"
                    )}
                  >
                    <div className={cn(
                      "text-4xl mb-3 filter drop-shadow-sm transition-transform",
                      isUnlocked && "animate-bounce-slow"
                    )}>
                      {badge.icon}
                    </div>
                    <h3 className="font-bold text-sm text-foreground mb-1">{badge.name}</h3>
                    <p className="text-[10px] text-muted-foreground leading-tight h-8 overflow-hidden">{badge.desc}</p>
                    
                    {!isUnlocked && (
                      <div className="mt-2 flex items-center gap-1 px-2 py-1 bg-gray-200 rounded text-[10px] text-gray-500 font-bold">
                        <Lock size={10} /> Terkunci
                      </div>
                    )}
                    
                    {isUnlocked && (
                      <div className={cn(
                        "mt-2 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1",
                        theme === "kids" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                      )}>
                        <Zap size={10} /> Tercapai
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB: FRIENDS (Placeholder) */}
          {activeTab === "friends" && (
            <div className={cn(
              "text-center py-12 border-2 border-dashed rounded-xl bg-gray-50",
              theme === "kids" ? "border-sky-200" : "border-gray-200"
            )}>
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-gray-600 font-bold mb-1">Belum Ada Teman</h3>
              <p className="text-gray-400 text-xs px-8">Ajak teman sekelasmu untuk bergabung agar bisa saling sapa!</p>
            </div>
          )}

          {/* TAB: FEED (Placeholder) */}
          {activeTab === "feed" && (
            <div className={cn(
              "text-center py-12 border-2 border-dashed rounded-xl bg-gray-50",
              theme === "kids" ? "border-sky-200" : "border-gray-200"
            )}>
              <Activity size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-gray-600 font-bold mb-1">Aktivitas Kosong</h3>
              <p className="text-gray-400 text-xs px-8">Mulai selesaikan modul untuk melihat riwayat aktivitasmu di sini.</p>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ icon, label, value, theme }: any) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-3 text-center border transition-all",
      theme === "kids" 
        ? "bg-white/50 rounded-2xl border-white shadow-sm" 
        : "bg-white rounded-lg border-slate-100"
    )}>
      <div className="mb-1">{icon}</div>
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon, theme }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all",
        theme === "kids" ? "rounded-xl" : "rounded-md",
        active 
          ? (theme === "kids" ? "bg-sky-100 text-sky-700 shadow-sm" : "bg-primary/10 text-primary") 
          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
      )}
    >
      {icon} {label}
    </button>
  );
}