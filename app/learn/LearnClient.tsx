"use client";

import React, { useState, useEffect } from "react";
import { 
  School, LayoutDashboard, Clock, Calendar, CheckCircle, 
  AlertCircle, BookOpen, TrendingUp, Plus, ArrowRight, Star, Map, Scroll, Zap, Sparkles, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { 
  doc, getDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot, updateDoc, arrayUnion, increment 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { motion, Variants } from "framer-motion";

// --- IMPORTS ---
import { StudentSidebar } from "../../components/layout/student-sidebar";
import { MobileNav } from "../../components/layout/mobile-nav";
import { JoinClassModal } from "../../components/learn/join-class-modal";
import { useTheme } from "../../lib/theme-context";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0, scale: 0.9 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 12
    }
  }
};

export default function LearnClient() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // State
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);

  // Helper Theme Logic
  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  // --- INITIAL FETCH ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const unsubUser = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserProfile(userData);

          const enrolled = userData.enrolledClasses || [];
          if (enrolled.length > 0) {
            fetchClassesAndAssignments(enrolled);
          } else {
            setLoading(false);
          }
        }
      });

      return () => unsubUser();
    });

    return () => unsubscribeAuth();
  }, [router]);

  const fetchClassesAndAssignments = async (classIds: string[]) => {
    try {
      const classesPromises = classIds.map(async (cid) => {
        const cDoc = await getDoc(doc(db, "classrooms", cid));
        return cDoc.exists() ? { id: cDoc.id, ...cDoc.data() } as any : null;
      });
      const classesRes = await Promise.all(classesPromises);
      const validClasses = classesRes.filter(c => c !== null);
      setMyClasses(validClasses);

      if (validClasses.length > 0) {
        const firstClassId = validClasses[0].id;
        const assignRef = collection(db, "classrooms", firstClassId, "assignments");
        
        const q = query(assignRef, orderBy("deadline", "asc"), limit(3));
        const assignSnap = await getDocs(q);
        
        const assigns = assignSnap.docs.map(d => ({ 
          id: d.id, 
          classId: firstClassId, 
          className: validClasses[0].name, 
          ...d.data() 
        }));
        setUpcomingAssignments(assigns);
      }
      
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (code: string) => {
    setJoining(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      const codeUpper = code.toUpperCase();
      
      if (myClasses.some(c => c.code === codeUpper)) {
        alert(isKids ? "Kamu sudah punya tiket ke petualangan ini!" : "Anda sudah terdaftar di kelas ini.");
        setJoining(false);
        return;
      }

      const q = query(collection(db, "classrooms"), where("code", "==", codeUpper));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert(isKids ? "Kode peta harta karun salah!" : "Kode kelas tidak ditemukan.");
        setJoining(false);
        return;
      }

      const classDoc = querySnapshot.docs[0];
      const classId = classDoc.id;
      
      await updateDoc(doc(db, "classrooms", classId), {
        students: arrayUnion(user.uid),
        studentCount: increment(1)
      });
      await updateDoc(doc(db, "users", user.uid), {
        enrolledClasses: arrayUnion(classId)
      });

      alert("Berhasil bergabung!");
      setIsJoinModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Gagal bergabung. Coba lagi nanti.");
    } finally {
      setJoining(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 15) return "Good Afternoon";
    if (hour < 18) return "Good Evening";
    return "Good Night";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-400" />
        <span className="font-bold text-sm tracking-widest uppercase">Loading Experience...</span>
      </div>
    </div>
  );

  // --- BACKGROUND LOGIC ---
  // Kita paksa background berwarna gelap/gradien untuk SMA agar tidak putih polos
  const mainBgClass = isSMA 
    ? "bg-slate-950 text-slate-100 selection:bg-teal-500/30 selection:text-teal-200" 
    : isKids 
      ? "bg-yellow-50 text-slate-900"
      : isSMP
        ? "bg-slate-50 text-slate-900"
        : "bg-slate-50 text-slate-900";

  return (
    <div className={cn("flex min-h-screen font-sans transition-colors duration-500 relative overflow-hidden", mainBgClass)}>
      
      {/* --- SMA SPECIAL BACKGROUND: AURORA MESH --- */}
      {isSMA && (
        <div className="fixed inset-0 z-0">
           {/* Base Dark Gradient */}
           <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
           
           {/* Animated Orbs/Blobs */}
           <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
           <div className="absolute top-[40%] left-[40%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse delay-500" />
           
           {/* Noise Texture Overlay (Optional for grit) */}
           <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      )}

      {/* --- SMP THEME BLOBS --- */}
      {isSMP && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-400/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px] animate-pulse delay-700" />
        </div>
      )}

      <StudentSidebar />

      <motion.div 
        className="flex-1 md:ml-64 relative pb-24 p-4 md:p-8 z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* 1. WELCOME HERO SECTION */}
          <motion.div 
            variants={itemVariants}
            className={cn(
              "rounded-3xl p-8 relative overflow-hidden transition-all",
              isKids ? "bg-primary text-white shadow-lg mb-8" : 
              isSMP ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl" :
              // SMA: Transparent Glass Dark Mode
              isSMA ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl" :
              "bg-white border border-slate-200"
            )}
          >
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 opacity-80">
                   {isSMA && <Sparkles size={16} className="text-teal-400" />}
                   <span className="text-xs font-bold uppercase tracking-widest">
                      {isSMA ? new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : "Dashboard"}
                   </span>
                </div>
                <h1 className={cn("font-bold leading-tight", 
                   isKids ? "text-4xl font-display" : 
                   isSMA ? "text-4xl md:text-5xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-white" : 
                   "text-3xl"
                )}>
                  {isSMA ? `${getGreeting()},` : isKids ? `Halo, ${userProfile?.displayName?.split(' ')[0]}!` : `Hai, ${userProfile?.displayName}`}
                  <br/>
                  <span className={cn(isSMA ? "text-white" : "")}>{isSMA ? userProfile?.displayName?.split(' ')[0] : ""}</span>
                </h1>
                <p className={cn("mt-2 max-w-lg", isSMA ? "text-slate-400" : "opacity-90")}>
                  {isSMA 
                    ? "Siap untuk produktif hari ini? Ada beberapa tugas yang menunggu penyelesaianmu." 
                    : "Lanjutkan progres belajarmu hari ini."}
                </p>
              </div>

              {/* Action Button for SMA */}
              {isSMA && (
                 <Button className="bg-teal-600 hover:bg-teal-500 text-white border-0 shadow-[0_0_20px_rgba(20,184,166,0.3)] rounded-full px-6">
                    Lihat Jadwal <ArrowRight size={16} className="ml-2"/>
                 </Button>
              )}
            </div>
            
            {/* Decorations */}
            {isSMA && (
               <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-teal-500/20 to-transparent blur-3xl pointer-events-none" />
            )}
          </motion.div>

          {/* 2. STATS GRID (BENTO STYLE) */}
          <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label={isKids ? "Petualangan" : "Kelas Diikuti"} 
              value={myClasses.length} 
              icon={isKids ? <Map /> : <School />} 
              theme={theme}
              variants={itemVariants}
              delay={0}
            />
            <StatCard 
              label={isKids ? "Misi Aktif" : "Tugas Pending"} 
              value={upcomingAssignments.length} 
              icon={isKids ? <Scroll /> : <BookOpen />} 
              theme={theme}
              variants={itemVariants}
              delay={0.1}
            />
            <StatCard 
              label={isKids ? "Kehadiran" : "Presensi"} 
              value="98%" 
              icon={<CheckCircle />} 
              theme={theme}
              variants={itemVariants}
              delay={0.2}
            />
            <StatCard 
              label={isKids ? "Bintang XP" : "Total XP"} 
              value={userProfile?.gamification?.xp || userProfile?.xp || 0} 
              icon={isKids ? <Star className="fill-yellow-400 text-yellow-500" /> : <TrendingUp />} 
              theme={theme}
              variants={itemVariants}
              delay={0.3}
            />
          </motion.div>

          {/* 3. MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: CLASS LIST */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", 
                   isSMA ? "text-white" : "text-slate-800"
                )}>
                  {isKids ? "Peta Petualangan" : "Daftar Kelas"}
                </h2>
                <Button 
                  onClick={() => setIsJoinModalOpen(true)}
                  variant={isKids ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                      isSMA && "text-teal-400 hover:text-teal-300 hover:bg-teal-950/30"
                  )}
                >
                  <Plus size={16} className="mr-2" /> Gabung Kelas
                </Button>
              </div>

              {myClasses.length === 0 ? (
                <div className={cn(
                    "text-center p-12 border-2 border-dashed rounded-3xl transition-all",
                    isSMA ? "border-slate-800 bg-slate-900/50" : "border-gray-200 bg-gray-50"
                )}>
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                    <School size={32} />
                  </div>
                  <h3 className={cn("font-bold mb-1", isSMA ? "text-slate-300" : "text-gray-600")}>
                      Belum ada kelas
                  </h3>
                  <Button onClick={() => setIsJoinModalOpen(true)} variant="outline" className="mt-4">
                    Gabung Kelas Sekarang
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myClasses.map((cls) => (
                    <motion.div 
                      key={cls.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/classroom/${cls.id}`)}
                      className={cn(
                        "group relative p-6 rounded-3xl border transition-all cursor-pointer overflow-hidden",
                        // SMA CARD STYLE: Dark Glass
                        isSMA ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)]" :
                        isKids ? "bg-white border-2 border-b-8 border-gray-100 hover:border-primary" : 
                        "bg-white border-gray-200 hover:border-primary hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "w-12 h-12 flex items-center justify-center font-bold text-xl rounded-2xl shadow-sm",
                          isSMA ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white" :
                          "bg-primary/10 text-primary"
                        )}>
                          {cls.name.charAt(0)}
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                          isSMA ? "bg-slate-800 text-slate-400 border border-slate-700" :
                          "bg-gray-100 text-gray-500"
                        )}>
                          {cls.category || "Umum"}
                        </span>
                      </div>
                      
                      <h3 className={cn("font-bold text-lg truncate mb-1", isSMA ? "text-slate-100" : "text-slate-800")}>
                          {cls.name}
                      </h3>
                      <p className={cn("text-xs truncate mb-6", isSMA ? "text-slate-500" : "text-gray-500")}>
                          {cls.description || "Tidak ada deskripsi"}
                      </p>
                      
                      <div className={cn(
                          "flex items-center text-xs font-bold transition-transform group-hover:translate-x-1",
                          isSMA ? "text-teal-400" : "text-primary"
                      )}>
                        Masuk Kelas <ArrowRight size={14} className="ml-1" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* RIGHT: TASKS & WIDGETS */}
            <motion.div variants={itemVariants} className="space-y-6">
              
              {/* Task Widget */}
              <div className={cn(
                "p-6 rounded-3xl border transition-all",
                isSMA ? "bg-white/5 border-white/10 backdrop-blur-md" : "bg-white border-gray-200"
              )}>
                <h3 className={cn("font-bold mb-4 flex items-center gap-2", 
                    isSMA ? "text-white" : "text-slate-800"
                )}>
                  <AlertCircle size={18} className={isSMA ? "text-rose-400" : "text-orange-500"} />
                  Tugas Segera
                </h3>
                
                <div className="space-y-3">
                  {upcomingAssignments.length > 0 ? (
                    upcomingAssignments.map((task) => (
                      <div key={task.id} className={cn("flex gap-3 items-start pb-3 border-b border-dashed last:border-0", isSMA ? "border-white/10" : "border-gray-100")}>
                        <div className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", isSMA ? "bg-rose-500" : "bg-orange-500")} />
                        <div>
                          <p className={cn("text-sm font-bold line-clamp-1", isSMA ? "text-slate-200" : "text-gray-700")}>{task.title}</p>
                          <p className={cn("text-xs opacity-60 mb-1", isSMA ? "text-slate-400" : "")}>{task.className}</p>
                          <p className={cn(
                              "text-[10px] font-mono px-1.5 py-0.5 rounded inline-block",
                              isSMA ? "bg-slate-800 text-slate-300" : "bg-gray-100 text-gray-600"
                          )}>
                             {task.deadline ? new Date(task.deadline.seconds * 1000).toLocaleDateString() : 'No Deadline'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 opacity-50">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className={cn("text-xs", isSMA ? "text-slate-400" : "")}>Tidak ada tugas aktif.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Widget */}
              <div className={cn(
                "p-6 rounded-3xl border transition-all",
                isSMA ? "bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border-white/10" : "bg-white border-gray-200"
              )}>
                <h3 className={cn("font-bold mb-4 flex items-center gap-2", isSMA ? "text-white" : "text-slate-800")}>
                  <Calendar size={18} className={isSMA ? "text-indigo-400" : "text-primary"} />
                  Jadwal Hari Ini
                </h3>
                <div className="text-center py-4">
                  <p className={cn("text-xs italic", isSMA ? "text-slate-500" : "opacity-50")}>Fitur Jadwal akan segera hadir.</p>
                </div>
              </div>

            </motion.div>

          </div>
        </div>
      </motion.div>

      <MobileNav />

      <JoinClassModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
        onJoin={handleJoinClass}
        isLoading={joining}
        theme={theme}
      />
    </div>
  );
}

// Simple Stat Card Component
function StatCard({ label, value, icon, theme, variants, delay }: any) {
  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";

  return (
    <motion.div 
      variants={variants}
      className={cn(
        "p-5 flex flex-col justify-between h-32 transition-all cursor-default",
        isKids ? "bg-white border-2 border-b-4 border-gray-100 hover:-translate-y-1 hover:border-primary hover:shadow-lg rounded-3xl" : 
        // SMA: Ultra Clean Glass Card
        isSMA ? "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 rounded-2xl" :
        "bg-white border-gray-200 shadow-sm hover:shadow-md rounded-xl"
      )}
    >
      <div className={cn(
        "self-start p-2.5 rounded-xl mb-2",
        isKids ? "bg-secondary text-secondary-foreground shadow-sm" : 
        isSMA ? "bg-white/10 text-teal-400" :
        "bg-primary/10 text-primary"
      )}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div>
        <h4 className={cn("text-3xl font-bold leading-none mb-1", isSMA ? "text-white" : "text-slate-900")}>{value}</h4>
        <p className={cn("text-[10px] font-bold uppercase tracking-wider", isSMA ? "text-slate-500" : "text-gray-500")}>{label}</p>
      </div>
    </motion.div>
  );
}