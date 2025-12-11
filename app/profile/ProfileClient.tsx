"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Loader2, BookOpen, 
  Settings, Award, Users, Activity, Lock, Star, Flame, Zap, GraduationCap, School, Shield, Trophy
} from "lucide-react";
import { auth, db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useTheme } from "../../lib/theme-context";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

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
  const [activeTab, setActiveTab] = useState<"achievements" | "friends" | "stats">("achievements");

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMP = theme === "smp";

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
  const bgStyle = isKids ? "bg-yellow-50" : isUni ? "bg-slate-950 text-slate-100" : isSMP ? "bg-slate-50/30" : "bg-slate-50";
  const textMuted = isUni ? "text-slate-400" : "text-slate-500";
  const textPrimary = isUni ? "text-white" : "text-slate-900";

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-500 pb-20", bgStyle)}>
      
       {/* --- SMP THEME: AMBIENT BACKGROUND BLOBS --- */}
       {isSMP && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-400/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px] animate-pulse delay-700" />
            <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-fuchsia-400/20 rounded-full blur-[80px] animate-pulse delay-1000" />
        </div>
      )}

      {/* HEADER NAV (Fixed Top) */}
      <header className={cn(
        "sticky top-0 z-30 px-4 h-16 flex items-center justify-between border-b backdrop-blur-md bg-opacity-80 transition-colors",
        isUni ? "bg-slate-950/80 border-slate-800" : 
        isSMP ? "bg-white/70 border-white/40 shadow-sm" : 
        "bg-white/80 border-slate-200"
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

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 relative z-10">
        
        <div className="grid md:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: PROFILE CARD (Sticky on Desktop) */}
          <div className="md:col-span-4 lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "border shadow-sm relative overflow-hidden transition-all md:sticky md:top-24 flex flex-col items-center p-6",
                isKids ? "rounded-3xl border-yellow-200 bg-white" : 
                isSMP ? "rounded-3xl bg-white/60 backdrop-blur-xl border-white/50 shadow-xl shadow-violet-500/10" :
                isUni ? "rounded-2xl bg-slate-900 border-slate-800" : 
                "rounded-2xl bg-white border-slate-200"
              )}
            >
               {/* Level Badge - Floating Top Right */}
               <div className="absolute top-4 right-4">
                  <div className={cn(
                     "flex flex-col items-center justify-center w-12 h-14 clip-path-badge shadow-sm",
                     isKids ? "bg-yellow-400 text-yellow-900" : 
                     isSMP ? "bg-gradient-to-b from-violet-500 to-fuchsia-500 text-white" :
                     "bg-slate-800 text-white"
                  )}>
                     <span className="text-[8px] font-bold uppercase">LVL</span>
                     <span className="text-xl font-black leading-none">{getLevel()}</span>
                  </div>
               </div>

               {/* Avatar with Ring */}
               <div className="relative mb-4 mt-2">
                  {/* Animated Ring for SMP/Kids */}
                  <div className={cn(
                     "absolute inset-[-4px] rounded-full animate-spin-slow opacity-70",
                     isKids ? "bg-gradient-to-tr from-yellow-400 to-orange-400" :
                     isSMP ? "bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-cyan-500" :
                     "bg-slate-200"
                  )} />
                  
                  <div className={cn(
                    "w-28 h-28 rounded-full border-4 shadow-lg flex items-center justify-center text-5xl select-none overflow-hidden bg-gray-100 relative z-10",
                    isUni ? "border-slate-800" : "border-white"
                  )}>
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>😎</span>
                    )}
                  </div>
                  
                  {/* Role Badge */}
                  <div className={cn(
                     "absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm z-20 whitespace-nowrap",
                     userProfile?.role === "teacher" 
                       ? "bg-blue-600 text-white border-blue-400"
                       : isUni ? "bg-emerald-900 text-emerald-400 border-emerald-800" : "bg-green-500 text-white border-green-400"
                   )}>
                     {userProfile?.role === "teacher" ? "Guru" : "Siswa"}
                   </div>
               </div>

               <div className="text-center w-full">
                  <h2 className={cn("text-2xl font-bold leading-tight mb-1", textPrimary)}>{userProfile?.displayName}</h2>
                  <p className={cn("text-sm", textMuted)}>{userProfile?.email}</p>
                  
                  {/* Bio / School Info */}
                  <div className={cn(
                     "mt-6 p-4 rounded-xl text-left space-y-3 w-full",
                     isKids ? "bg-yellow-50 border border-yellow-100" :
                     isSMP ? "bg-white/50 border border-white/50" :
                     isUni ? "bg-slate-800/50 border border-slate-700" :
                     "bg-slate-50 border border-slate-100"
                  )}>
                     <div className={cn("flex items-center gap-3 text-xs font-medium", textMuted)}>
                        <div className={cn("p-1.5 rounded-lg", isSMP ? "bg-violet-100 text-violet-600" : "bg-slate-200 text-slate-600")}>
                           <GraduationCap size={14} /> 
                        </div>
                        <span className="uppercase tracking-wide">{userProfile?.schoolLevel || 'Umum'}</span>
                     </div>
                     <div className={cn("flex items-center gap-3 text-xs font-medium", textMuted)}>
                        <div className={cn("p-1.5 rounded-lg", isSMP ? "bg-cyan-100 text-cyan-600" : "bg-slate-200 text-slate-600")}>
                           <School size={14} /> 
                        </div>
                        <span className="truncate">{userProfile?.schoolName || "Belum ada sekolah"}</span>
                     </div>
                     {userProfile?.bio && (
                        <p className="text-xs italic border-t pt-3 mt-1 opacity-80 border-dashed border-gray-300 dark:border-gray-700">
                           "{userProfile.bio}"
                        </p>
                     )}
                  </div>
               </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: CONTENT TABS */}
          <div className="md:col-span-8 lg:col-span-8 space-y-6">
            
            {/* 1. Main Stats Horizontal */}
            <div className="grid grid-cols-3 gap-3">
               <StatBox 
                  label="Total XP" 
                  value={getXP()} 
                  icon={<Star size={20} className={cn(isKids ? "text-yellow-500 fill-yellow-500" : isSMP ? "text-violet-500 fill-violet-500" : "")} />} 
                  theme={theme}
                  color="yellow"
               />
               <StatBox 
                  label="Streak" 
                  value={getStreak()} 
                  icon={<Flame size={20} className="text-orange-500 fill-orange-500" />} 
                  theme={theme}
                  color="orange"
               />
               <StatBox 
                  label="Badges" 
                  value={unlockedCount} 
                  icon={<Award size={20} className="text-blue-500" />} 
                  theme={theme}
                  color="blue"
               />
            </div>

            {/* TABS NAVIGATION */}
            <div className={cn(
              "flex p-1 shadow-sm border transition-all sticky top-20 z-20 backdrop-blur-md",
              isKids ? "bg-white/80 rounded-2xl border-sky-100" : 
              isSMP ? "bg-white/60 rounded-xl border-white/50" :
              isUni ? "bg-slate-900/80 rounded-lg border-slate-700" :
              "bg-white/80 rounded-lg border-slate-200"
            )}>
              <TabButton active={activeTab === "achievements"} onClick={() => setActiveTab("achievements")} label="Pencapaian" icon={<Award size={16} />} theme={theme} />
              <TabButton active={activeTab === "stats"} onClick={() => setActiveTab("stats")} label="Statistik" icon={<Activity size={16} />} theme={theme} />
              <TabButton active={activeTab === "friends"} onClick={() => setActiveTab("friends")} label="Teman" icon={<Users size={16} />} theme={theme} />
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[300px]">
              
              {/* TAB: ACHIEVEMENTS */}
              {activeTab === "achievements" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {BADGE_SYSTEM.map((badge, idx) => {
                    const isUnlocked = checkBadge(badge);
                    return (
                      <motion.div 
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          "p-4 border rounded-xl flex flex-col items-center text-center transition-all duration-300 group hover:shadow-md relative overflow-hidden",
                          isUnlocked 
                            ? (isKids ? "bg-white border-yellow-200" : isSMP ? "bg-white/70 border-violet-100 shadow-sm" : isUni ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")
                            : (isUni ? "bg-slate-900 border-slate-800 opacity-40 grayscale" : "bg-gray-50 border-gray-100 opacity-60 grayscale")
                        )}
                      >
                        {isUnlocked && isSMP && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-violet-100 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />}
                        
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
                               isKids ? "bg-green-100 text-green-700" : isSMP ? "bg-fuchsia-100 text-fuchsia-700" : isUni ? "bg-emerald-900/50 text-emerald-400" : "bg-green-50 text-green-700"
                             )}>
                               <Zap size={10} /> Tercapai
                             </div>
                           )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* TAB: STATS (NEW - Placeholder for Heatmap) */}
              {activeTab === "stats" && (
                <div className={cn(
                  "p-6 border rounded-2xl",
                  isUni ? "bg-slate-900 border-slate-700" : isSMP ? "bg-white/60 border-white/60 backdrop-blur-md" : "bg-white border-slate-200"
                )}>
                   <h3 className={cn("font-bold text-lg mb-4 flex items-center gap-2", textPrimary)}>
                      <Activity size={20} className="text-blue-500"/> Aktivitas Belajar
                   </h3>
                   
                   {/* Mockup Contribution Graph */}
                   <div className="flex flex-wrap gap-1 mb-2">
                      {Array.from({ length: 60 }).map((_, i) => {
                         const level = Math.random() > 0.7 ? (Math.random() > 0.5 ? 2 : 1) : 0;
                         return (
                            <div 
                               key={i} 
                               className={cn(
                                  "w-3 h-3 rounded-sm",
                                  level === 0 ? (isUni ? "bg-slate-800" : "bg-slate-100") :
                                  level === 1 ? (isSMP ? "bg-violet-300" : "bg-green-300") :
                                  (isSMP ? "bg-violet-500" : "bg-green-500")
                               )}
                               title={`Hari ke-${i+1}`}
                            />
                         )
                      })}
                   </div>
                   <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>2 Bulan Terakhir</span>
                      <div className="flex items-center gap-1">
                         <span>Kurang</span>
                         <div className={cn("w-2 h-2 rounded-sm", isUni ? "bg-slate-800" : "bg-slate-100")} />
                         <div className={cn("w-2 h-2 rounded-sm", isSMP ? "bg-violet-300" : "bg-green-300")} />
                         <div className={cn("w-2 h-2 rounded-sm", isSMP ? "bg-violet-500" : "bg-green-500")} />
                         <span>Aktif</span>
                      </div>
                   </div>

                   <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-xs text-gray-400 uppercase font-bold">Modul Selesai</p>
                         <p className={cn("text-2xl font-bold", textPrimary)}>{userProfile?.completedModules?.length || 0}</p>
                      </div>
                      <div>
                         <p className="text-xs text-gray-400 uppercase font-bold">Gabung Sejak</p>
                         <p className={cn("text-lg font-bold", textPrimary)}>
                            {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : "-"}
                         </p>
                      </div>
                   </div>
                </div>
              )}

              {/* TAB: FRIENDS */}
              {activeTab === "friends" && (
                <div className={cn(
                  "text-center py-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center",
                  isUni ? "border-slate-800 bg-slate-900/50" : isSMP ? "border-violet-200 bg-white/40" : "border-slate-200 bg-white"
                )}>
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", isUni ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-300")}>
                     <Users size={32} />
                  </div>
                  <h3 className={cn("font-bold mb-1 text-lg", textPrimary)}>Belum Ada Teman</h3>
                  <p className={cn("text-sm max-w-xs mx-auto", textMuted)}>Ajak teman sekelasmu untuk bergabung di Skoola agar bisa saling melihat progress!</p>
                  <Button className={cn("mt-6", isSMP ? "bg-violet-600 hover:bg-violet-700" : "")} variant={isUni ? "outline" : "primary"}>Undang Teman</Button>
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

function StatBox({ icon, label, value, theme, color }: any) {
  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isUni = theme === "uni";
  
  const colorMap: any = {
     yellow: isSMP ? "bg-violet-100" : "bg-yellow-100",
     orange: isSMP ? "bg-fuchsia-100" : "bg-orange-100",
     blue: isSMP ? "bg-cyan-100" : "bg-blue-100",
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center border transition-all p-4 rounded-2xl",
      isKids ? "bg-white border-yellow-100 shadow-sm" : 
      isSMP ? "bg-white/70 backdrop-blur-md border-white/60 shadow-sm hover:border-violet-200" :
      isUni ? "bg-slate-800 border-slate-700 text-slate-200" :
      "bg-white border-slate-100 shadow-sm"
    )}>
      <div className={cn("p-2 rounded-full mb-2", colorMap[color])}>
         {icon}
      </div>
      <div className={cn("font-bold text-xl")}>{value}</div>
      <div className={cn("uppercase font-bold tracking-wider text-[10px]", isUni ? "text-slate-400" : "text-muted-foreground")}>{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon, theme }: any) {
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMP = theme === "smp";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all",
        isKids ? "rounded-xl" : "rounded-md",
        active 
          ? (isKids ? "bg-sky-100 text-sky-700 shadow-sm" : 
             isSMP ? "bg-violet-100 text-violet-700 shadow-sm border border-violet-200" :
             isUni ? "bg-slate-700 text-white shadow-sm border border-slate-600" : 
             "bg-primary/10 text-primary shadow-sm") 
          : (isUni ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50")
      )}
    >
      {icon} {label}
    </button>
  );
}