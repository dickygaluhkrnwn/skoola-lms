"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BookOpen, Trophy, Users, Star, 
  Compass, Clock, ArrowRight, Zap, 
  Layout, Calendar, Flame
} from "lucide-react";
import { useTheme } from "@/lib/theme-context"; 
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { UserProfile } from "@/lib/types/user.types";
import { XPBar } from "@/components/gamification/xp-bar";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

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

// Shortcut Card
const ShortcutCard = ({ title, subtitle, icon, color, onClick, isUni, isSMA }: any) => (
  <motion.button
    variants={itemVariants}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "relative overflow-hidden p-5 rounded-2xl text-left border transition-all h-full w-full flex flex-col justify-between group",
      isUni 
        ? "bg-slate-900/50 border-white/10 hover:border-indigo-500/50 hover:bg-slate-800/80" 
        : isSMA
          ? "bg-slate-900/60 border-teal-500/20 hover:border-teal-500/50 backdrop-blur-md"
          : "bg-white border-slate-100 shadow-sm hover:shadow-md"
    )}
  >
    <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110", color)} />
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
      isUni ? "bg-white/5 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white" :
      isSMA ? "bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-900" :
      "bg-slate-50 text-slate-600 group-hover:bg-slate-900 group-hover:text-white"
    )}>
      {icon}
    </div>
    <div>
      <h3 className={cn("font-bold text-base mb-1", (isUni || isSMA) ? "text-slate-200" : "text-slate-800")}>{title}</h3>
      <p className={cn("text-xs leading-relaxed", (isUni || isSMA) ? "text-slate-400" : "text-slate-500")}>{subtitle}</p>
    </div>
  </motion.button>
);

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

           // Fetch recent assignments (Example logic)
           if (data.enrolledClasses && data.enrolledClasses.length > 0) {
              const assignPromises = data.enrolledClasses.slice(0, 3).map(async (cid) => {
                  const q = query(collection(db, "classrooms", cid, "assignments"), orderBy("deadline", "asc"), limit(2));
                  const snap = await getDocs(q);
                  return snap.docs.map(d => ({ id: d.id, classId: cid, ...d.data() }));
              });
              const assigns = (await Promise.all(assignPromises)).flat();
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

  const bgStyle = isKids ? "bg-yellow-50" : isUni ? "bg-slate-950 text-slate-100" : isSMP ? "bg-slate-50/50" : isSMA ? "bg-slate-950 text-slate-200" : "bg-slate-50";

  if (loading) return <div className={cn("min-h-screen flex items-center justify-center", bgStyle)}>Loading...</div>;

  return (
    <div className={cn("flex min-h-screen font-sans transition-colors duration-500 relative overflow-hidden", bgStyle)}>
        {/* Background Decor */}
        {isUni && <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />}
        
        <StudentSidebar />

        <motion.div 
            className="flex-1 md:ml-64 relative pb-24 p-4 md:p-8 z-10 overflow-y-auto h-screen"
            initial="hidden" animate="visible" variants={containerVariants}
        >
            <div className="max-w-6xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-2 text-sm font-bold opacity-60 uppercase tracking-wider mb-2">
                        <Calendar size={16} /> {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <h1 className={cn("text-3xl md:text-5xl font-black mb-2", (isUni || isSMA) ? "text-white" : "text-slate-900")}>
                        {getGreeting()}, <span className={cn(isKids ? "text-orange-500" : isUni ? "text-indigo-400" : isSMA ? "text-teal-400" : "text-blue-600")}>{userProfile?.displayName?.split(" ")[0]}</span>!
                    </h1>
                    <p className={cn("text-lg", (isUni || isSMA) ? "text-slate-400" : "text-slate-600")}>
                        {isUni ? "Siap produktif hari ini?" : "Ayo lanjutkan petualangan belajarmu!"}
                    </p>
                </div>

                {/* Stats Widget */}
                <motion.div variants={itemVariants} className={cn("flex items-center gap-6 p-4 rounded-2xl border backdrop-blur-md", 
                    isUni ? "bg-slate-900/50 border-white/10" : isSMA ? "bg-slate-900/50 border-teal-500/20" : "bg-white/80 border-slate-200 shadow-sm"
                )}>
                    <div className="text-center px-2">
                        <div className="text-xs font-bold opacity-50 uppercase mb-1">Level</div>
                        <div className={cn("text-2xl font-black", (isUni || isSMA) ? "text-white" : "text-slate-900")}>{userProfile?.gamification?.level || 1}</div>
                    </div>
                    <div className="w-px h-8 bg-slate-500/20" />
                    <div className="text-center px-2">
                        <div className="text-xs font-bold opacity-50 uppercase mb-1">Streak</div>
                        <div className="text-2xl font-black text-orange-500 flex items-center gap-1">
                            <Flame size={20} fill="currentColor" /> {userProfile?.gamification?.currentStreak || 0}
                        </div>
                    </div>
                    <div className="w-px h-8 bg-slate-500/20" />
                    <div className="text-center px-2 min-w-[100px]">
                        <div className="text-xs font-bold opacity-50 uppercase mb-2">XP Progress</div>
                        <XPBar currentXP={userProfile?.gamification?.xp || 0} maxXP={1000} level={userProfile?.gamification?.level || 1} className="h-2"/>
                    </div>
                </motion.div>
            </div>

            {/* SHORTCUTS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ShortcutCard title="Kelas Saya" subtitle="Akses materi & modul" icon={<BookOpen size={20} />} color="bg-blue-500" onClick={() => router.push("/learn")} isUni={isUni} isSMA={isSMA} />
                <ShortcutCard title="Arena Sosial" subtitle="Tanding & Diskusi" icon={<Trophy size={20} />} color="bg-yellow-500" onClick={() => router.push("/social")} isUni={isUni} isSMA={isSMA} />
                <ShortcutCard title="Profil Kamu" subtitle="Cek Badge & Statistik" icon={<Users size={20} />} color="bg-purple-500" onClick={() => router.push("/profile")} isUni={isUni} isSMA={isSMA} />
                <ShortcutCard title="Survey / Quiz" subtitle="Tugas Pending" icon={<Zap size={20} />} color="bg-green-500" onClick={() => router.push("/survey")} isUni={isUni} isSMA={isSMA} />
            </div>

            {/* UPCOMING TASKS (Optional Widget) */}
            <motion.div variants={itemVariants} className={cn("p-6 rounded-3xl border", isUni ? "bg-slate-900/30 border-white/10" : "bg-white border-slate-200")}>
                <h3 className={cn("font-bold mb-4", (isUni || isSMA) ? "text-white" : "text-slate-800")}>Tugas Terdekat</h3>
                {upcomingAssignments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcomingAssignments.map(task => (
                            <div key={task.id} className="p-3 rounded-xl border border-slate-200/50 bg-slate-50/50 dark:bg-white/5 dark:border-white/10 flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/classroom/${task.classId}/assignment/${task.id}`)}>
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Clock size={18}/></div>
                                <div>
                                    <p className={cn("text-sm font-bold", (isUni || isSMA) ? "text-slate-200" : "text-slate-800")}>{task.title}</p>
                                    <p className="text-xs opacity-60">Deadline: {task.deadline ? new Date(task.deadline.seconds * 1000).toLocaleDateString() : "-"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm opacity-50">Tidak ada tugas mendesak.</p>
                )}
            </motion.div>

            </div>
        </motion.div>
        <MobileNav />
    </div>
  );
}