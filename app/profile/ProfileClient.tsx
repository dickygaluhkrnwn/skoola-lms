"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Shield, Star, Flame, ArrowLeft, Loader2, BookOpen, 
  Settings, Award, Users, Activity, Lock
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/lib/types/user.types";
import { motion } from "framer-motion";

// --- MOCK DATA (SEMENTARA) ---
const MOCK_BADGES = [
  { id: 1, name: "Murid Teladan", icon: "🎓", description: "Menyelesaikan 10 pelajaran", unlocked: true },
  { id: 2, name: "Jagoan Kuis", icon: "⚡", description: "Skor sempurna di 5 kuis", unlocked: true },
  { id: 3, name: "Si Rajin", icon: "🔥", description: "Streak 7 hari berturut-turut", unlocked: false },
  { id: 4, name: "Penyair Muda", icon: "✍️", description: "Menulis 3 pantun di feed", unlocked: false },
];

const MOCK_FRIENDS = [
  { id: 1, name: "Budi Santoso", avatar: "👦", level: 5 },
  { id: 2, name: "Siti Aminah", avatar: "👧", level: 7 },
  { id: 3, name: "Rizky Billar", avatar: "🧑", level: 3 },
];

const MOCK_ACTIVITIES = [
  { id: 1, text: "Naik ke Level 2!", time: "2 jam lalu", type: "level_up" },
  { id: 2, text: "Menyelesaikan Bab Pantun", time: "Hari ini", type: "finish_lesson" },
  { id: 3, text: "Bergabung dengan Kelas 5A", time: "Kemarin", type: "join_class" },
];

export default function ProfileClient() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"achievements" | "friends" | "feed">("achievements");

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      } catch (error) {
        console.error("Gagal load profil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  }

  // Helper Stats
  const getXP = () => userProfile?.xp || userProfile?.gamification?.xp || 0;
  const getLevel = () => userProfile?.level || userProfile?.gamification?.level || 1;
  const getStreak = () => {
    const s = userProfile?.streak || userProfile?.gamification?.currentStreak;
    return typeof s === 'object' ? s?.currentStreak || 0 : s || 0;
  };

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
              label="XP" 
              value={getXP()} 
            />
            <StatCard 
              theme={theme}
              icon={<Award size={18} className="text-blue-500" />} 
              label="BIPA" 
              value={getLevel()} 
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
          
          {/* TAB: ACHIEVEMENTS */}
          {activeTab === "achievements" && (
            <div className="grid grid-cols-2 gap-4">
              {MOCK_BADGES.map((badge) => (
                <div 
                  key={badge.id}
                  className={cn(
                    "p-4 border rounded-xl flex flex-col items-center text-center transition-all",
                    badge.unlocked 
                      ? (theme === "kids" ? "bg-white border-yellow-200 shadow-sm" : "bg-white border-slate-200")
                      : "bg-gray-50 border-gray-100 opacity-60 grayscale"
                  )}
                >
                  <div className="text-4xl mb-3 filter drop-shadow-sm">{badge.icon}</div>
                  <h3 className="font-bold text-sm text-foreground mb-1">{badge.name}</h3>
                  <p className="text-[10px] text-muted-foreground leading-tight">{badge.description}</p>
                  {!badge.unlocked && <Lock size={12} className="mt-2 text-gray-400" />}
                </div>
              ))}
            </div>
          )}

          {/* TAB: FRIENDS */}
          {activeTab === "friends" && (
            <div className={cn(
              "bg-white border rounded-xl overflow-hidden",
              theme === "kids" ? "rounded-3xl border-sky-100" : "rounded-xl border-slate-200"
            )}>
              {MOCK_FRIENDS.map((friend, idx) => (
                <div key={friend.id} className={cn(
                  "flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors",
                  idx !== MOCK_FRIENDS.length - 1 && "border-b border-gray-100"
                )}>
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-xl">
                    {friend.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">Level {friend.level}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    Sapa 👋
                  </Button>
                </div>
              ))}
              <div className="p-4 text-center border-t border-gray-100">
                <Button variant="ghost" className="text-xs text-primary w-full">
                  + Tambah Teman Baru
                </Button>
              </div>
            </div>
          )}

          {/* TAB: FEED */}
          {activeTab === "feed" && (
            <div className="space-y-4">
              {MOCK_ACTIVITIES.map((act) => (
                <div key={act.id} className={cn(
                  "flex gap-4 bg-white p-4 border rounded-xl",
                  theme === "kids" ? "rounded-2xl border-sky-50 shadow-sm" : "rounded-xl border-slate-200"
                )}>
                  <div className="mt-1">
                    {act.type === 'level_up' && <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600"><Star size={16} /></div>}
                    {act.type === 'finish_lesson' && <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600"><BookOpen size={16} /></div>}
                    {act.type === 'join_class' && <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Users size={16} /></div>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{act.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{act.time}</p>
                  </div>
                </div>
              ))}
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