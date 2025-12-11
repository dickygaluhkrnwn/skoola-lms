"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Loader2, BookOpen, 
  Settings, Award, Users, Activity, Lock, Star, Flame, Zap, GraduationCap, School
} from "lucide-react";
import { auth, db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useTheme } from "../../lib/theme-context";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { onAuthStateChanged } from "firebase/auth";

// --- SISTEM BADGE DINAMIS ---
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
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"achievements" | "friends" | "feed">("achievements");

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const normalizedData = {
            ...data,
            xp: data.xp ?? data.gamification?.xp ?? 0,
            level: data.level ?? data.gamification?.level ?? 1,
            streak: data.streak ?? data.gamification?.currentStreak ?? 0,
            completedModules: data.completedModules || [],
            enrolledClasses: data.enrolledClasses || [],
            schoolLevel: data.schoolLevel || 'sd', 
            schoolName: data.schoolName || 'Sekolah Skoola'
          };
          setUserProfile(normalizedData);
        }
        setLoading(false);
      }, (error) => {
        console.error("Gagal load profil:", error);
        setLoading(false);
      });

      return () => unsubscribeDoc();
    });

    return () => unsubscribeAuth();
  }, [router]);

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

  const getXP = () => userProfile?.xp || 0;
  const getLevel = () => userProfile?.level || 1;
  const getStreak = () => userProfile?.streak || 0;

  // --- STYLING HELPERS ---
  const bgStyle = isKids ? "bg-yellow-50" : isUni ? "bg-slate-950 text-slate-100" : "bg-slate-50";
  const cardBg = isUni ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textMuted = isUni ? "text-slate-400" : "text-slate-500";
  const textPrimary = isUni ? "text-white" : "text-slate-900";

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-500", bgStyle)}>
      
      {/* HEADER NAV (Fixed Top) */}
      <header className={cn(
        "sticky top-0 z-30 px-4 h-16 flex items-center justify-between border-b backdrop-blur-md bg-opacity-80 transition-colors",
        isUni ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"
      )}>
        <div className="flex items-center gap-4 w-full max-w-6xl mx-auto">
          <button 
            onClick={() => router.back()} 
            className={cn(
              "p-2 rounded-full transition-all hover:bg-black/5",
              isKids ? "text-gray-600" : isUni ? "text-slate-300 hover:bg-white/10" : "text-slate-600"
            )}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className={cn("text-lg font-bold flex-1", textPrimary)}>Profil Saya</h1>
          <button 
            onClick={() => router.push('/profile/edit')} 
            className={cn(
              "p-2 rounded-full transition-all",
              isKids ? "text-sky-600 bg-sky-100 hover:bg-sky-200" : 
              isUni ? "text-slate-300 hover:text-white hover:bg-slate-800" :
              "text-slate-600 hover:bg-slate-100"
            )}
            title="Edit Profil"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="grid md:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: PROFILE CARD (Sticky on Desktop) */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <div className={cn(
              "border shadow-sm relative overflow-hidden transition-all md:sticky md:top-24",
              isKids ? "rounded-3xl border-yellow-200 bg-white" : "rounded-2xl",
              cardBg
            )}>
              {/* Cover Banner */}
              <div className={cn(
                "h-24 w-full",
                isKids ? "bg-gradient-to-r from-yellow-400 to-orange-400" : 
                isUni ? "bg-gradient-to-r from-slate-800 to-slate-900" :
                "bg-gradient-to-r from-blue-500 to-indigo-600"
              )} />

              <div className="px-6 pb-6 -mt-10 relative">
                <div className="flex justify-center md:justify-start">
                  <div className={cn(
                    "w-20 h-20 rounded-full border-4 shadow-md flex items-center justify-center text-3xl select-none overflow-hidden bg-gray-100",
                    isUni ? "border-slate-800" : "border-white"
                  )}>
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>😎</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 text-center md:text-left">
                  <h2 className={cn("text-xl font-bold leading-tight", textPrimary)}>{userProfile?.displayName}</h2>
                  <p className={cn("text-sm mt-1", textMuted)}>{userProfile?.email}</p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                     <span className={cn(
                       "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                       userProfile?.role === "teacher" 
                         ? "bg-blue-50 text-blue-600 border-blue-100"
                         : isUni ? "bg-emerald-900/30 text-emerald-400 border-emerald-800" : "bg-green-50 text-green-600 border-green-100"
                     )}>
                       {userProfile?.role === "teacher" ? "Guru" : "Siswa"}
                     </span>
                     <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border", isUni ? "border-slate-700 text-slate-300" : "bg-gray-100 border-gray-200 text-gray-600")}>
                        Level {getLevel()}
                     </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-slate-700 space-y-2">
                     <div className={cn("flex items-center gap-2 text-xs", textMuted)}>
                        <GraduationCap size={14} /> 
                        <span className="uppercase font-semibold">{userProfile?.schoolLevel || 'Umum'}</span>
                     </div>
                     <div className={cn("flex items-center gap-2 text-xs", textMuted)}>
                        <School size={14} /> 
                        <span className="truncate">{userProfile?.schoolName || "Belum ada sekolah"}</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Only: Quick Stats Vertical */}
            <div className="hidden md:flex flex-col gap-3">
               <StatCard theme={theme} icon={<Star size={18} className="text-yellow-500 fill-yellow-500" />} label="XP Total" value={getXP()} />
               <StatCard theme={theme} icon={<Flame size={18} className="text-orange-500 fill-orange-500" />} label="Streak" value={getStreak()} />
               <StatCard theme={theme} icon={<Award size={18} className="text-blue-500" />} label="Badges" value={unlockedCount} />
            </div>
          </div>

          {/* RIGHT COLUMN: CONTENT TABS */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            
            {/* Mobile Only: Horizontal Stats */}
            <div className="grid grid-cols-3 gap-3 md:hidden">
              <StatCard theme={theme} icon={<Star size={18} className="text-yellow-500 fill-yellow-500" />} label="XP" value={getXP()} compact />
              <StatCard theme={theme} icon={<Flame size={18} className="text-orange-500 fill-orange-500" />} label="Streak" value={getStreak()} compact />
              <StatCard theme={theme} icon={<Award size={18} className="text-blue-500" />} label="Badges" value={unlockedCount} compact />
            </div>

            {/* TABS NAVIGATION */}
            <div className={cn(
              "flex p-1 shadow-sm border transition-all sticky top-20 z-20 backdrop-blur-md",
              isKids ? "bg-white/80 rounded-2xl border-sky-100" : 
              isUni ? "bg-slate-900/80 rounded-lg border-slate-700" :
              "bg-white/80 rounded-lg border-slate-200"
            )}>
              <TabButton active={activeTab === "achievements"} onClick={() => setActiveTab("achievements")} label="Pencapaian" icon={<Award size={16} />} theme={theme} />
              <TabButton active={activeTab === "friends"} onClick={() => setActiveTab("friends")} label="Teman" icon={<Users size={16} />} theme={theme} />
              <TabButton active={activeTab === "feed"} onClick={() => setActiveTab("feed")} label="Aktivitas" icon={<Activity size={16} />} theme={theme} />
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[400px]">
              
              {/* TAB: ACHIEVEMENTS */}
              {activeTab === "achievements" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {BADGE_SYSTEM.map((badge) => {
                    const isUnlocked = checkBadge(badge);
                    return (
                      <div 
                        key={badge.id}
                        className={cn(
                          "p-4 border rounded-xl flex flex-col items-center text-center transition-all duration-300 group hover:shadow-md",
                          isUnlocked 
                            ? (isKids ? "bg-white border-yellow-200" : isUni ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")
                            : (isUni ? "bg-slate-900 border-slate-800 opacity-40 grayscale" : "bg-gray-50 border-gray-100 opacity-60 grayscale")
                        )}
                      >
                        <div className={cn(
                          "text-4xl mb-3 filter drop-shadow-sm transition-transform group-hover:scale-110",
                          isUnlocked && "animate-bounce-slow"
                        )}>
                          {badge.icon}
                        </div>
                        <h3 className={cn("font-bold text-sm mb-1", textPrimary)}>{badge.name}</h3>
                        <p className={cn("text-[10px] leading-tight h-8 overflow-hidden line-clamp-2", textMuted)}>{badge.desc}</p>
                        
                        <div className="mt-3 w-full">
                           {!isUnlocked ? (
                             <div className={cn("flex items-center justify-center gap-1 py-1 rounded text-[10px] font-bold w-full", isUni ? "bg-slate-700 text-slate-400" : "bg-gray-200 text-gray-500")}>
                               <Lock size={10} /> Terkunci
                             </div>
                           ) : (
                             <div className={cn(
                               "text-[10px] font-bold py-1 rounded flex items-center justify-center gap-1 w-full",
                               isKids ? "bg-green-100 text-green-700" : isUni ? "bg-emerald-900/50 text-emerald-400" : "bg-green-50 text-green-700"
                             )}>
                               <Zap size={10} /> Tercapai
                             </div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB: FRIENDS */}
              {activeTab === "friends" && (
                <div className={cn(
                  "text-center py-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center",
                  isUni ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white"
                )}>
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", isUni ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-300")}>
                     <Users size={32} />
                  </div>
                  <h3 className={cn("font-bold mb-1 text-lg", textPrimary)}>Belum Ada Teman</h3>
                  <p className={cn("text-sm max-w-xs mx-auto", textMuted)}>Ajak teman sekelasmu untuk bergabung di Skoola agar bisa saling melihat progress!</p>
                  <Button className="mt-6" variant={isUni ? "outline" : "primary"}>Undang Teman</Button>
                </div>
              )}

              {/* TAB: FEED */}
              {activeTab === "feed" && (
                <div className={cn(
                  "text-center py-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center",
                  isUni ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white"
                )}>
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", isUni ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-300")}>
                     <Activity size={32} />
                  </div>
                  <h3 className={cn("font-bold mb-1 text-lg", textPrimary)}>Aktivitas Kosong</h3>
                  <p className={cn("text-sm max-w-xs mx-auto", textMuted)}>Mulai selesaikan modul dan tugas untuk melihat riwayat aktivitasmu di sini.</p>
                  <Button className="mt-6" onClick={() => router.push('/learn')}>Mulai Belajar</Button>
                </div>
              )}

            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ icon, label, value, theme, compact = false }: any) {
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center border transition-all",
      compact ? "p-2 rounded-xl" : "p-4 rounded-2xl",
      isKids ? "bg-white border-yellow-100 shadow-sm" : 
      isUni ? "bg-slate-800 border-slate-700 text-slate-200" :
      "bg-white border-slate-100 shadow-sm"
    )}>
      <div className="mb-1">{icon}</div>
      <div className={cn("font-bold", compact ? "text-base" : "text-xl")}>{value}</div>
      <div className={cn("uppercase font-bold tracking-wider", compact ? "text-[8px]" : "text-[10px]", isUni ? "text-slate-400" : "text-muted-foreground")}>{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon, theme }: any) {
  const isKids = theme === "sd";
  const isUni = theme === "uni";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all",
        isKids ? "rounded-xl" : "rounded-md",
        active 
          ? (isKids ? "bg-sky-100 text-sky-700 shadow-sm" : isUni ? "bg-slate-700 text-white shadow-sm border border-slate-600" : "bg-primary/10 text-primary shadow-sm") 
          : (isUni ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50")
      )}
    >
      {icon} {label}
    </button>
  );
}