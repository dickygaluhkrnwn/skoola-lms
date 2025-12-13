"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LayoutDashboard, ShieldCheck } from "lucide-react";
import { auth, db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
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
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"achievements" | "friends" | "stats">("achievements");

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";

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

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 relative z-10">
        
        {/* === TEACHER DASHBOARD ACCESS BANNER === */}
        {userProfile?.role === 'teacher' && (
          <div className={cn(
            "rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500",
            isUni ? "bg-indigo-900/40 border border-indigo-500/30 backdrop-blur-md" : 
            isSMA ? "bg-teal-900/40 border border-teal-500/30 backdrop-blur-md" :
            "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-lg backdrop-blur-sm", 
                (isUni || isSMA) ? "bg-white/10" : "bg-white/20"
              )}>
                 <LayoutDashboard size={28} className={cn((isUni || isSMA) ? "text-white" : "text-white")} />
              </div>
              <div className="text-center md:text-left">
                <h3 className={cn("font-bold text-lg", (isUni || isSMA) ? "text-white" : "text-white")}>
                  Mode Guru Aktif
                </h3>
                <p className={cn("text-sm max-w-md", (isUni || isSMA) ? "text-slate-300" : "text-blue-100")}>
                  Anda terdeteksi sebagai Guru. Akses dashboard pengelolaan kelas dan siswa Anda di sini.
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/teacher')}
              className={cn(
                "px-6 py-2.5 font-bold rounded-lg transition-all shadow-sm w-full md:w-auto",
                isUni ? "bg-indigo-600 hover:bg-indigo-500 text-white" :
                isSMA ? "bg-teal-600 hover:bg-teal-500 text-white" :
                "bg-white text-blue-600 hover:bg-blue-50"
              )}
            >
              Buka Dashboard Guru
            </button>
          </div>
        )}
        
        {/* === ADMIN SCHOOL DASHBOARD ACCESS BANNER === */}
        {userProfile?.role === 'admin' && (
          <div className={cn(
            "rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500",
            isUni ? "bg-purple-900/40 border border-purple-500/30 backdrop-blur-md" : 
            isSMA ? "bg-slate-800/60 border border-slate-600/30 backdrop-blur-md" :
            "bg-gradient-to-r from-slate-800 to-slate-900 text-white"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-lg backdrop-blur-sm", 
                (isUni || isSMA) ? "bg-white/10" : "bg-white/20"
              )}>
                 <ShieldCheck size={28} className={cn((isUni || isSMA) ? "text-white" : "text-white")} />
              </div>
              <div className="text-center md:text-left">
                <h3 className={cn("font-bold text-lg", (isUni || isSMA) ? "text-white" : "text-white")}>
                  Mode Operator Sekolah
                </h3>
                <p className={cn("text-sm max-w-md", (isUni || isSMA) ? "text-slate-300" : "text-slate-200")}>
                  Akses panel admin untuk mengelola data sekolah, pengguna, dan forum.
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/admin-school')}
              className={cn(
                "px-6 py-2.5 font-bold rounded-lg transition-all shadow-sm w-full md:w-auto",
                isUni ? "bg-purple-600 hover:bg-purple-500 text-white" :
                isSMA ? "bg-slate-600 hover:bg-slate-500 text-white" :
                "bg-white text-slate-900 hover:bg-slate-50"
              )}
            >
              Buka Dashboard Admin
            </button>
          </div>
        )}
        {/* === END DASHBOARD BANNERS === */}

        <div className="grid md:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: PROFILE CARD */}
          <div className="md:col-span-4 lg:col-span-4 space-y-6">
            <ProfileCard 
              userProfile={userProfile} 
              isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni}
              textPrimary={textPrimary} textMuted={textMuted}
              getLevel={getLevel}
            />
          </div>

          {/* RIGHT COLUMN: CONTENT TABS */}
          <div className="md:col-span-8 lg:col-span-8 space-y-6">
            
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
            <div className="min-h-[300px]">
              
              {/* TAB: ACHIEVEMENTS */}
              {activeTab === "achievements" && (
                <AchievementsTab 
                   userProfile={userProfile} 
                   isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni}
                   textPrimary={textPrimary} textMuted={textMuted}
                />
              )}

              {/* TAB: STATS */}
              {activeTab === "stats" && (
                <StatsTab 
                   userProfile={userProfile} 
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