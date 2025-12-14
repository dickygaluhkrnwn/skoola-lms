"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LayoutDashboard, ShieldCheck, School, CheckCircle2 } from "lucide-react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useTheme } from "../../lib/theme-context";
import { cn } from "../../lib/utils";
import { onAuthStateChanged } from "firebase/auth";

// Import Refactored Components
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { StatsOverview } from "@/components/profile/StatsOverview";
import { TabsNavigation } from "@/components/profile/TabsNavigation";
import { AchievementsTab } from "@/components/profile/AchievementsTab";
import { StatsTab } from "@/components/profile/StatsTab";
import { FriendsTab } from "@/components/profile/FriendsTab";

// Import Data
import { BADGE_SYSTEM } from "@/lib/data/badge-system";

export default function ProfileClient() {
  const router = useRouter();
  const { theme } = useTheme(); // Theme dari context global (jika masih dipakai)
  const [loading, setLoading] = useState(true);
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [schoolData, setSchoolData] = useState<any>(null); // State baru untuk data sekolah
  const [activeTab, setActiveTab] = useState<"achievements" | "friends" | "stats">("achievements");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      // Gunakan onSnapshot untuk realtime update User
      const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const normalizedData = {
            ...data,
            xp: data.xp ?? data.gamification?.xp ?? 0,
            level: data.level ?? data.gamification?.level ?? 1,
            streak: data.streak ?? data.gamification?.currentStreak ?? 0,
            completedModules: data.completedModules || [],
            enrolledClasses: data.enrolledClasses || [],
            schoolId: data.schoolId || null
          };
          setUserProfile(normalizedData);

          // FETCH DATA SEKOLAH (Source of Truth)
          // Jika user punya schoolId, ambil data sekolah terbaru untuk memastikan level/jenjang sinkron
          if (data.schoolId) {
             try {
                const schoolSnap = await getDoc(doc(db, "schools", data.schoolId));
                if (schoolSnap.exists()) {
                   setSchoolData(schoolSnap.data());
                }
             } catch (err) {
                console.error("Gagal ambil data sekolah:", err);
             }
          }
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

  // --- LOGIC ADAPTIF (CORE FIX) ---
  // Tentukan Level Sekolah yang AKURAT
  // Prioritas 1: Data dari dokumen 'schools' (Real-time & Admin controlled)
  // Prioritas 2: Data dari dokumen 'users' (Legacy / User input)
  // Default: 'sd'
  const realSchoolLevel = schoolData?.level || userProfile?.schoolLevel || 'sd';
  
  // Update variabel helper theme berdasarkan realSchoolLevel
  const isKids = realSchoolLevel === "sd";
  const isUni = realSchoolLevel === "uni";
  const isSMP = realSchoolLevel === "smp";
  const isSMA = realSchoolLevel === "sma";

  const checkBadge = (badge: typeof BADGE_SYSTEM[0]) => {
    if (!userProfile) return false;
    return badge.condition(userProfile);
  };

  const unlockedCount = BADGE_SYSTEM.filter(b => checkBadge(b)).length;

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isUni ? "bg-slate-950 text-white" : "bg-slate-900 text-white")}>
        <Loader2 className={cn("animate-spin w-10 h-10", isUni ? "text-indigo-500" : "text-teal-500")} />
      </div>
    );
  }

  const getXP = () => userProfile?.xp || 0;
  const getLevel = () => userProfile?.level || 1;
  const getStreak = () => userProfile?.streak || 0;

  // --- STYLING HELPERS ---
  const bgStyle = isKids ? "bg-yellow-50" 
    : isUni ? "bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200" 
    : isSMP ? "bg-slate-50/30" 
    : isSMA ? "bg-transparent text-slate-100" 
    : "bg-slate-50";
  
  const textMuted = (isUni || isSMA) ? "text-slate-400" : "text-slate-500";
  const textPrimary = (isUni || isSMA) ? "text-white" : "text-slate-900";

  // Override profile data for display to components
  // Kita inject data sekolah yang benar ke dalam object userProfile yang dilempar ke komponen anak
  const displayProfile = {
      ...userProfile,
      schoolName: schoolData?.name || userProfile?.schoolName || "Sekolah Skoola",
      schoolLevel: realSchoolLevel // Paksa level ikut data sekolah
  };

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-500 pb-20 relative overflow-hidden", bgStyle)}>
      
      {/* --- UNI THEME BACKGROUND: Animated Mesh --- */}
      {isUni && (
         <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1121] to-indigo-950" />
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
         </div>
      )}

      {/* --- SMA SPECIAL BACKGROUND: AURORA MESH --- */}
      {isSMA && (
        <div className="fixed inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
           <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-teal-600/20 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
           <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      )}

       {/* --- SMP THEME: AMBIENT BACKGROUND BLOBS --- */}
       {isSMP && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-400/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px] animate-pulse delay-700" />
            <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-fuchsia-400/20 rounded-full blur-[80px] animate-pulse delay-1000" />
        </div>
      )}

      {/* HEADER NAV */}
      <ProfileHeader 
        isUni={isUni} isSMP={isSMP} isSMA={isSMA} isKids={isKids} textPrimary={textPrimary}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 relative z-10">
        
        {/* === TEACHER DASHBOARD ACCESS BANNER === */}
        {userProfile?.role === 'teacher' && (
          <div className={cn(
            "rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 border overflow-hidden relative",
            isUni ? "bg-indigo-950/60 border-indigo-500/30 backdrop-blur-md" : 
            isSMA ? "bg-teal-900/60 border-teal-500/30 backdrop-blur-md" :
            "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-transparent"
          )}>
            <div className="flex items-center gap-5 z-10">
              <div className={cn(
                "p-4 rounded-xl backdrop-blur-sm shadow-inner", 
                (isUni || isSMA) ? "bg-white/10" : "bg-white/20"
              )}>
                  <LayoutDashboard size={32} className="text-white" />
              </div>
              <div className="text-center md:text-left">
                <h3 className={cn("font-bold text-xl", (isUni || isSMA) ? "text-white" : "text-white")}>
                  Portal {isUni ? "Dosen" : "Guru"}
                </h3>
                <p className={cn("text-sm max-w-lg mt-1", (isUni || isSMA) ? "text-slate-300" : "text-blue-100")}>
                  Akses dashboard untuk mengelola kelas, materi, dan memantau perkembangan {isUni ? "mahasiswa" : "siswa"} Anda.
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/teacher')}
              className={cn(
                "px-8 py-3 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 w-full md:w-auto z-10",
                isUni ? "bg-indigo-500 hover:bg-indigo-400 text-white" :
                isSMA ? "bg-teal-500 hover:bg-teal-400 text-white" :
                "bg-white text-indigo-700 hover:bg-blue-50"
              )}
            >
              Masuk Dashboard
            </button>
            {/* Decoration */}
            <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12 pointer-events-none" />
          </div>
        )}
        
        {/* === ADMIN SCHOOL DASHBOARD ACCESS BANNER === */}
        {userProfile?.role === 'admin' && (
          <div className={cn(
            "rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 border overflow-hidden relative",
            isUni ? "bg-purple-950/60 border-purple-500/30 backdrop-blur-md" : 
            isSMA ? "bg-slate-800/80 border-slate-600/30 backdrop-blur-md" :
            "bg-gradient-to-br from-slate-800 to-slate-900 text-white border-transparent"
          )}>
            <div className="flex items-center gap-5 z-10">
              <div className={cn(
                "p-4 rounded-xl backdrop-blur-sm shadow-inner", 
                (isUni || isSMA) ? "bg-white/10" : "bg-white/20"
              )}>
                  <ShieldCheck size={32} className="text-white" />
              </div>
              <div className="text-center md:text-left">
                <h3 className={cn("font-bold text-xl", (isUni || isSMA) ? "text-white" : "text-white")}>
                  Operator {isUni ? "Kampus" : "Sekolah"}
                </h3>
                <p className={cn("text-sm max-w-lg mt-1", (isUni || isSMA) ? "text-slate-300" : "text-slate-300")}>
                  Panel admin untuk mengelola identitas {isUni ? "kampus" : "sekolah"}, verifikasi pengguna, dan forum diskusi.
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/admin-school')}
              className={cn(
                "px-8 py-3 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 w-full md:w-auto z-10",
                isUni ? "bg-purple-600 hover:bg-purple-500 text-white" :
                isSMA ? "bg-slate-600 hover:bg-slate-500 text-white" :
                "bg-white text-slate-900 hover:bg-slate-100"
              )}
            >
              Kelola {isUni ? "Kampus" : "Sekolah"}
            </button>
            {/* Decoration */}
            <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-12 pointer-events-none" />
          </div>
        )}

        {/* === STUDENT VERIFIED SCHOOL BANNER (NEW) === */}
        {userProfile?.schoolId && userProfile?.role !== 'admin' && userProfile?.role !== 'teacher' && (
          <div className={cn(
            "rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 border relative overflow-hidden group",
            isUni ? "bg-slate-900/50 border-emerald-500/30 hover:border-emerald-500/50 transition-colors" : 
            isSMA ? "bg-slate-800/50 border-emerald-500/30 hover:border-emerald-500/50 transition-colors" :
            "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100"
          )}>
            <div className="flex items-center gap-5 relative z-10">
              <div className={cn(
                "p-3 rounded-xl flex items-center justify-center shadow-sm", 
                (isUni || isSMA) ? "bg-emerald-500/10 text-emerald-400" : "bg-white text-emerald-600"
              )}>
                  <School size={32} />
              </div>
              <div className="text-center md:text-left">
                <h3 className={cn("font-bold text-lg flex flex-col md:flex-row items-center md:items-end gap-2", (isUni || isSMA) ? "text-white" : "text-emerald-950")}>
                  Afiliasi {isUni ? "Kampus" : "Sekolah"} Terverifikasi
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold mb-0.5", 
                    (isUni || isSMA) ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-emerald-100 border-emerald-200 text-emerald-700"
                  )}>
                    Aktif
                  </span>
                </h3>
                <p className={cn("text-sm mt-0.5", (isUni || isSMA) ? "text-slate-400" : "text-emerald-700")}>
                  Anda terdaftar resmi sebagai {isUni ? "mahasiswa" : "siswa"} di <span className="font-bold border-b border-dotted border-current cursor-help" title={`ID: ${userProfile.schoolId}`}>{schoolData?.name || userProfile.schoolName}</span>.
                </p>
              </div>
            </div>
            
             <div className={cn(
               "w-12 h-12 rounded-full flex items-center justify-center relative z-10 shadow-sm",
               (isUni || isSMA) ? "bg-emerald-500/20 text-emerald-400" : "bg-white text-emerald-600"
             )}>
               <CheckCircle2 size={24} />
             </div>

             {/* Background Decoration */}
             <div className={cn("absolute right-0 top-0 w-48 h-full bg-gradient-to-l opacity-20 transform skew-x-12", isUni || isSMA ? "from-emerald-500" : "from-emerald-400")} />
          </div>
        )}
        {/* === END BANNERS === */}

        {/* LAYOUT GRID UTAMA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: PROFILE CARD */}
          <div className="lg:col-span-3 space-y-6 sticky top-24">
            <ProfileCard 
              userProfile={displayProfile} // Gunakan data yang sudah di-override
              isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni}
              textPrimary={textPrimary} textMuted={textMuted}
              getLevel={getLevel}
            />
          </div>

          {/* RIGHT COLUMN: CONTENT TABS */}
          <div className="lg:col-span-9 space-y-6 min-w-0">
            
            {/* 1. Main Stats Horizontal */}
            <StatsOverview 
              xp={getXP()} streak={getStreak()} badgeCount={unlockedCount} 
              theme={theme} isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA}
            />

            {/* TABS NAVIGATION */}
            <TabsNavigation 
               activeTab={activeTab} setActiveTab={setActiveTab} theme={theme}
               isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni}
            />

            {/* TAB CONTENT */}
            <div className="min-h-[300px] animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* TAB: ACHIEVEMENTS */}
              {activeTab === "achievements" && (
                <AchievementsTab 
                   userProfile={displayProfile} 
                   isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni}
                   textPrimary={textPrimary} textMuted={textMuted}
                />
              )}

              {/* TAB: STATS */}
              {activeTab === "stats" && (
                <StatsTab 
                   userProfile={displayProfile} 
                   isSMP={isSMP} isSMA={isSMA} isUni={isUni}
                   textPrimary={textPrimary} 
                />
              )}

              {/* TAB: FRIENDS */}
              {activeTab === "friends" && (
                <FriendsTab 
                   isSMP={isSMP} isSMA={isSMA} isUni={isUni} 
                   textPrimary={textPrimary} textMuted={textMuted}
                />
              )}

            </div>
          </div>
        </div>

      </main>
    </div>
  );
}