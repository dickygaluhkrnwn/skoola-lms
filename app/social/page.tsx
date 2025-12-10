"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Heart, MessageCircle, Crown, Medal, User } from "lucide-react";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useTheme } from "@/lib/theme-context"; 
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";

// Tipe Data User untuk Leaderboard
interface LeaderboardUser {
  uid: string;
  displayName: string;
  xp: number;
  level: string;
  photoURL?: string;
}

// Mock Feed (Sementara, karena belum ada tabel 'activities')
const mockFeed = [
  {
    id: 1,
    user: "Sistem Skoola",
    avatar: "🤖",
    action: "menyambut semua murid baru!",
    time: "Baru saja",
    likes: 99,
    comments: 0,
    type: "system"
  },
];

export default function SocialPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"feed" | "leaderboard">("leaderboard"); // Default ke Leaderboard biar rame
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<LeaderboardUser | null>(null);

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Ambil Top 10 User berdasarkan XP
        const q = query(
          collection(db, "users"), 
          where("role", "==", "student"), // Hanya murid yg masuk leaderboard
          orderBy("xp", "desc"), 
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const users: LeaderboardUser[] = [];
        
        querySnapshot.forEach((doc) => {
          users.push(doc.data() as LeaderboardUser);
        });
        setLeaderboardData(users);

        // 2. Ambil data user yang sedang login (untuk highlight posisi sendiri)
        const currentUser = auth.currentUser;
        if (currentUser) {
           const myData = users.find(u => u.uid === currentUser.uid);
           if (myData) {
             setCurrentUserData(myData);
           }
        }

      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground transition-colors duration-500">
      
      <StudentSidebar />

      <div className="flex-1 md:ml-64 relative pb-24">
        
        {/* HEADER */}
        <header className={cn(
          "sticky top-0 z-40 backdrop-blur-md border-b shadow-sm px-4 py-3 flex justify-between items-center transition-colors",
          theme === "kids" 
            ? "bg-white/80 border-sky-100" 
            : "bg-background/80 border-border"
        )}>
          <h1 className={cn(
            "text-xl font-bold flex items-center gap-2",
            theme === "kids" ? "text-sky-900" : "text-foreground"
          )}>
            <Users className={cn(theme === "kids" ? "text-sky-500" : "text-primary")} /> Komunitas
          </h1>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm text-xl transition-all",
            theme === "kids" ? "bg-sky-100 border-white" : "bg-secondary border-border"
          )}>
             🏆
          </div>
        </header>

        <div className="max-w-md mx-auto px-4 pt-6">
          
          {/* TABS */}
          <div className={cn(
            "flex p-1 shadow-sm border mb-6 transition-all",
            theme === "kids" ? "bg-white rounded-2xl border-sky-100" : "bg-secondary/30 rounded-lg border-border"
          )}>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={cn(
                "flex-1 py-2 text-sm font-bold transition-all",
                theme === "kids" ? "rounded-xl" : "rounded-md",
                activeTab === "leaderboard" 
                  ? (theme === "kids" ? "bg-yellow-100 text-yellow-700 shadow-sm" : "bg-background text-foreground shadow-sm") 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              Peringkat Global
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              className={cn(
                "flex-1 py-2 text-sm font-bold transition-all",
                theme === "kids" ? "rounded-xl" : "rounded-md",
                activeTab === "feed" 
                  ? (theme === "kids" ? "bg-sky-100 text-sky-700 shadow-sm" : "bg-background text-foreground shadow-sm") 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              Kabar Teman
            </button>
          </div>

          {/* VIEW 1: LEADERBOARD (REAL) */}
          {activeTab === "leaderboard" && (
            <div className="space-y-4">
               {/* Top 3 Podium (Visual Only for Kids Mode maybe? Or general) */}
               {/* Untuk simplisitas fase ini, kita pakai list dulu */}
               
               {loading ? (
                 <div className="text-center py-10 text-gray-400">Memuat data juara...</div>
               ) : leaderboardData.length === 0 ? (
                 <div className="text-center py-10 text-gray-400">Belum ada data. Jadilah yang pertama!</div>
               ) : (
                 <div className="space-y-3">
                    {leaderboardData.map((user, idx) => {
                      // Logic Styling Juara 1, 2, 3
                      let rankStyle = "bg-white border-gray-100";
                      let rankIcon = null;
                      
                      if (idx === 0) {
                        rankStyle = theme === "kids" ? "bg-yellow-50 border-yellow-200" : "bg-yellow-500/10 border-yellow-500/30";
                        rankIcon = <Crown size={20} className="text-yellow-500" fill="currentColor" />;
                      } else if (idx === 1) {
                        rankStyle = theme === "kids" ? "bg-gray-50 border-gray-200" : "bg-slate-500/10 border-slate-500/30";
                        rankIcon = <Medal size={20} className="text-gray-400" fill="currentColor" />;
                      } else if (idx === 2) {
                        rankStyle = theme === "kids" ? "bg-orange-50 border-orange-200" : "bg-orange-500/10 border-orange-500/30";
                        rankIcon = <Medal size={20} className="text-orange-500" fill="currentColor" />;
                      } else {
                        rankStyle = theme === "kids" ? "bg-white border-gray-100" : "bg-card border-border";
                      }

                      return (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={cn(
                            "flex items-center gap-4 p-4 border transition-all relative overflow-hidden",
                            theme === "kids" ? "rounded-2xl shadow-sm" : "rounded-lg",
                            rankStyle,
                            // Highlight user sendiri
                            currentUserData?.uid === user.uid && (theme === "kids" ? "ring-2 ring-sky-400" : "ring-1 ring-primary")
                          )}
                        >
                          <div className={cn(
                            "font-bold text-lg w-8 text-center",
                            idx < 3 ? "text-yellow-600" : "text-gray-400"
                          )}>
                            {idx + 1}
                          </div>
                          
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-xl border",
                            theme === "kids" ? "bg-white border-gray-100" : "bg-secondary border-border"
                          )}>
                            {user.photoURL ? (
                               // Placeholder for real image later
                               <span>😎</span> 
                            ) : (
                               // Default Avatar based on Name Initials
                               <span className="text-sm font-bold text-gray-500">{user.displayName?.charAt(0).toUpperCase()}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-bold truncate",
                              theme === "kids" ? "text-gray-800" : "text-foreground",
                              currentUserData?.uid === user.uid && "text-primary"
                            )}>
                              {user.displayName} {currentUserData?.uid === user.uid && "(Saya)"}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                              Level {user.level || "Novice"}
                            </p>
                          </div>

                          <div className="text-right">
                             <span className={cn(
                               "font-bold text-sm",
                               theme === "kids" ? "text-sky-600" : "text-primary"
                             )}>
                               {user.xp} XP
                             </span>
                             <div className="absolute right-2 top-2">
                                {rankIcon}
                             </div>
                          </div>
                        </motion.div>
                      );
                    })}
                 </div>
               )}
            </div>
          )}

          {/* VIEW 2: FEED (MOCKUP UNTUK FASE LANJUT) */}
          {activeTab === "feed" && (
            <div className="space-y-4">
              <div className={cn(
                "p-4 shadow-sm border flex gap-3 items-center transition-all",
                theme === "kids" ? "bg-white rounded-2xl border-sky-50" : "bg-card rounded-xl border-border"
              )}>
                 <div className="w-10 h-10 bg-secondary rounded-full flex-shrink-0 flex items-center justify-center">📢</div>
                 <input 
                    placeholder="Apa yang kamu pelajari hari ini?" 
                    className={cn(
                      "flex-1 border-none px-4 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground",
                      theme === "kids" 
                        ? "bg-gray-50 rounded-full focus:ring-2 focus:ring-sky-200" 
                        : "bg-secondary/50 rounded-md focus:ring-1 focus:ring-primary"
                    )} 
                  />
              </div>

              {mockFeed.map((post, idx) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 shadow-sm border transition-all",
                    theme === "kids" ? "bg-white rounded-2xl border-sky-50" : "bg-card rounded-xl border-border"
                  )}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                      {post.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{post.user}</p>
                      <p className="text-xs text-muted-foreground">{post.time}</p>
                    </div>
                  </div>
                  
                  <p className="text-foreground text-sm mb-4">
                    {post.action}
                  </p>

                  <div className="flex items-center gap-4 border-t border-border pt-3">
                    <button className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-pink-500 transition-colors">
                      <Heart size={16} /> {post.likes}
                    </button>
                    <button className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-primary transition-colors">
                      <MessageCircle size={16} /> {post.comments}
                    </button>
                  </div>
                </motion.div>
              ))}
              
              <div className="text-center py-8 text-muted-foreground text-xs">
                 Fitur Feed lengkap akan hadir segera! 🚀
              </div>
            </div>
          )}

        </div>
      </div>

      <MobileNav />

    </div>
  );
}