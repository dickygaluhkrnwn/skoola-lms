"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Calendar, Clock, Flame, Layout, 
  Sparkles, Star, Trophy 
} from "lucide-react";
import { useTheme } from "@/lib/theme-context"; 
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { UserProfile } from "@/lib/types/user.types";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

// Import Widgets Baru
import { StreakCard } from "@/components/dashboard-widgets/StreakCard";
import { DailyChallengeCard } from "@/components/dashboard-widgets/DailyChallengeCard";
import { SeasonProgress } from "@/components/dashboard-widgets/SeasonProgress";
import { QuickMenu } from "@/components/dashboard-widgets/QuickMenu";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function DashboardClient() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);

  // Theme Helpers
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/"); 
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
           const data = userDoc.data() as UserProfile;
           setUserProfile(data);

           // Fetch recent assignments logic (unchanged)
           if (data.enrolledClasses && data.enrolledClasses.length > 0) {
              const assignPromises = data.enrolledClasses.slice(0, 3).map(async (cid) => {
                  const q = query(collection(db, "classrooms", cid, "assignments"), orderBy("deadline", "asc"), limit(2));
                  const snap = await getDocs(q);
                  return snap.docs.map(d => ({ id: d.id, classId: cid, ...d.data() }));
              });
              const assigns = (await Promise.all(assignPromises)).flat();
              // Sort by closest deadline manually because we fetched from multiple collections
              assigns.sort((a: any, b: any) => (a.deadline?.seconds || 0) - (b.deadline?.seconds || 0));
              setUpcomingAssignments(assigns.slice(0, 4));
           }
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Selamat Pagi";
      if (hour < 15) return "Selamat Siang";
      if (hour < 18) return "Selamat Sore";
      return "Selamat Malam";
  };

  // Logic Dummy untuk Widget (Nanti bisa dihubungkan ke Firebase)
  const currentMonth = new Date().toLocaleString('id-ID', { month: 'long' });
  const seasonName = `Musim ${currentMonth}`;
  
  // Handlers Placeholder
  const handlePlayDaily = () => {
    // TODO: Arahkan ke modal game
    alert("Fitur Game Harian akan segera hadir! Persiapkan dirimu!");
  };

  const handleClaimBadge = () => {
    // TODO: Update Firebase
    alert("Badge berhasil diklaim! (Simulasi)");
  };

  const bgStyle = isKids ? "bg-yellow-50" : isUni ? "bg-slate-950 text-slate-100" : isSMA ? "bg-slate-950 text-slate-200" : "bg-slate-50";

  if (loading) return <div className={cn("min-h-screen flex items-center justify-center", bgStyle)}>Loading...</div>;

  return (
    <div className={cn("flex min-h-screen font-sans transition-colors duration-500 relative overflow-hidden", bgStyle)}>
        {/* Background Decor */}
        {isUni && <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />}
        
        <StudentSidebar />

        <motion.div 
            className="flex-1 md:ml-64 relative pb-24 p-4 md:p-8 z-10 overflow-y-auto h-screen scrollbar-hide"
            initial="hidden" animate="visible" variants={containerVariants}
        >
            <div className="max-w-6xl mx-auto space-y-6">
            
            {/* HEADER AREA */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                <div>
                    <div className="flex items-center gap-2 text-sm font-bold opacity-60 uppercase tracking-wider mb-2">
                        <Calendar size={16} /> {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <h1 className={cn("text-3xl md:text-4xl font-black mb-1", (isUni || isSMA) ? "text-white" : "text-slate-900")}>
                        {getGreeting()}, <span className={cn(isKids ? "text-orange-500" : isUni ? "text-indigo-400" : isSMA ? "text-teal-400" : "text-blue-600")}>{userProfile?.displayName?.split(" ")[0]}</span>!
                    </h1>
                    <p className={cn("text-base", (isUni || isSMA) ? "text-slate-400" : "text-slate-600")}>
                         {isUni ? "Targetkan produktivitas maksimal hari ini." : "Siap untuk petualangan baru?"}
                    </p>
                </div>

                {/* Level Badge (Simple Profile Summary) */}
                <div className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-sm",
                  (isUni || isSMA) ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200 shadow-sm"
                )}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-yellow-900 font-bold text-xs shadow-sm">
                       <Star size={14} fill="currentColor"/>
                    </div>
                    <div>
                        <p className={cn("text-xs uppercase font-bold opacity-70", (isUni || isSMA) ? "text-slate-400" : "text-slate-500")}>Current Level</p>
                        <p className={cn("text-sm font-bold", (isUni || isSMA) ? "text-white" : "text-slate-900")}>{userProfile?.gamification?.level || 1} - Explorer</p>
                    </div>
                </div>
            </header>

            {/* WIDGET GRID ROW 1: GAMIFICATION CENTER */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Kiri: Streak & Season (4 Kolom pada Desktop) */}
                <div className="md:col-span-5 lg:col-span-4 space-y-6">
                    <motion.div variants={itemVariants}>
                      <StreakCard 
                        streak={userProfile?.gamification?.currentStreak || 0}
                        isActive={false} // Logic cek apakah sudah login/main hari ini
                      />
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <SeasonProgress 
                         seasonName={seasonName}
                         month={currentMonth}
                         currentPoints={350} // Dummy data progress sementara
                         maxPoints={1000}
                         level={userProfile?.gamification?.level || 1}
                         onClaim={handleClaimBadge}
                      />
                    </motion.div>
                </div>

                {/* Kanan: Daily Challenge & Shortcuts (8 Kolom pada Desktop) */}
                <div className="md:col-span-7 lg:col-span-8 space-y-6">
                    <motion.div variants={itemVariants}>
                      <DailyChallengeCard 
                        isCompleted={false} // Logic cek apakah sudah main
                        onPlay={handlePlayDaily}
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                       <h3 className={cn("font-bold mb-4 flex items-center gap-2", (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                          <Sparkles size={18} className="text-yellow-500 fill-yellow-500" />
                          Akses Cepat
                       </h3>
                       <QuickMenu /> 
                       {/* QuickMenu menggunakan default items yang sudah di-set di komponennya */}
                    </motion.div>
                </div>

            </div>

            {/* WIDGET ROW 2: CONTENT & TASKS */}
            <motion.div variants={itemVariants} className="pt-4">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className={cn("font-bold text-lg", (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                      Tugas & Agenda
                    </h3>
                    <button className={cn("text-xs font-bold hover:underline", (isUni || isSMA) ? "text-indigo-400" : "text-blue-600")}>
                      Lihat Semua
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingAssignments.length > 0 ? (
                       upcomingAssignments.map((task, index) => (
                          <div 
                            key={task.id}
                            onClick={() => router.push(`/classroom/${task.classId}/assignment/${task.id}`)} 
                            className={cn(
                              "group cursor-pointer relative p-4 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md",
                              (isUni || isSMA) 
                                ? "bg-slate-900/40 border-slate-800 hover:border-indigo-500/50" 
                                : "bg-white border-slate-200 hover:border-blue-300"
                            )}
                          >
                             <div className="flex items-start justify-between mb-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center",
                                  index === 0 ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
                                  "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                )}>
                                   <Clock size={20} />
                                </div>
                                {index === 0 && (
                                  <span className="text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">
                                    Segera
                                  </span>
                                )}
                             </div>
                             
                             <h4 className={cn("font-bold text-sm mb-1 line-clamp-1", (isUni || isSMA) ? "text-slate-200 group-hover:text-white" : "text-slate-800")}>
                                {task.title}
                             </h4>
                             <p className={cn("text-xs mb-3", (isUni || isSMA) ? "text-slate-500" : "text-slate-500")}>
                                Deadline: {task.deadline ? new Date(task.deadline.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }) : "-"}
                             </p>

                             <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={cn("h-full w-2/3 rounded-full", index===0 ? "bg-red-500" : "bg-blue-500")} />
                             </div>
                          </div>
                       ))
                    ) : (
                       <div className={cn("col-span-full p-8 rounded-2xl border border-dashed text-center", (isUni || isSMA) ? "border-slate-800 text-slate-500" : "border-slate-300 text-slate-500")}>
                          <p>Tidak ada tugas yang mendesak. Nikmati harimu!</p>
                       </div>
                    )}
                 </div>
            </motion.div>

            </div>
        </motion.div>
        <MobileNav />
    </div>
  );
}