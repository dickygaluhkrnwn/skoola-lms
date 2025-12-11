"use client";

import React, { useState, useEffect } from "react";
import { 
  School, LayoutDashboard, Clock, Calendar, CheckCircle, 
  AlertCircle, BookOpen, TrendingUp, Plus, ArrowRight, Star, Map, Scroll
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { 
  doc, getDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot, updateDoc, arrayUnion, increment 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion"; // Animasi Engine

// --- IMPORTS ---
import { StudentSidebar } from "../../components/layout/student-sidebar";
import { MobileNav } from "../../components/layout/mobile-nav";
import { JoinClassModal } from "../../components/learn/join-class-modal";
import { useTheme } from "../../lib/theme-context";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const, // FIX: Tambahkan 'as const' agar dikenali sebagai literal type
      stiffness: 100,
      damping: 10
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
  const isUni = theme === "uni";
  const isSMA = theme === "sma";

  // --- INITIAL FETCH ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      // 1. Fetch User Profile Realtime
      const unsubUser = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserProfile(userData);

          // 2. Fetch Classes
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
      // A. Fetch Classes Detail
      const classesPromises = classIds.map(async (cid) => {
        const cDoc = await getDoc(doc(db, "classrooms", cid));
        return cDoc.exists() ? { id: cDoc.id, ...cDoc.data() } as any : null;
      });
      const classesRes = await Promise.all(classesPromises);
      const validClasses = classesRes.filter(c => c !== null);
      setMyClasses(validClasses);

      // B. Fetch Upcoming Assignments (Simple aggregation from first class for demo)
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
      
      // Cek apakah sudah join di state lokal
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

      alert(isKids ? "Hore! Berhasil bergabung ke petualangan baru!" : "Berhasil bergabung!");
      setIsJoinModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Gagal bergabung. Coba lagi nanti.");
    } finally {
      setJoining(false);
    }
  };


  // --- RENDER HELPERS ---
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        {isKids ? (
            <motion.div 
                animate={{ y: [0, -20, 0] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="text-4xl"
            >
                🚀
            </motion.div>
        ) : (
            <School className="w-10 h-10 animate-pulse text-primary" />
        )}
        <span className={cn("font-bold", isKids ? "text-xl font-display text-primary" : "text-sm text-slate-500")}>
          {isKids ? "Sedang Membuka Peta..." : "Memuat Dashboard..."}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground transition-colors duration-500">
      <StudentSidebar />

      <motion.div 
        className="flex-1 md:ml-64 relative pb-24 p-4 md:p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        
        {/* HEADER SECTION: GREETING & STATS */}
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* 1. Welcome Banner */}
          <motion.div 
            variants={itemVariants}
            className={cn(
              "rounded-3xl p-8 relative overflow-hidden transition-all",
              isKids ? "bg-primary text-white shadow-[0_8px_0_rgba(0,0,0,0.15)] mb-8" : 
              isSMP ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30" :
              isUni ? "bg-slate-900 text-white border border-slate-800" :
              "bg-white border border-slate-200 text-slate-800"
            )}
          >
            <div className="relative z-10">
              <h1 className={cn("font-bold mb-2", isKids ? "text-4xl font-display drop-shadow-md" : "text-2xl md:text-3xl")}>
                {isKids ? `Halo, Petualang ${userProfile?.displayName?.split(' ')[0]}! 👋` : 
                 isSMP ? `Yo, ${userProfile?.displayName?.split(' ')[0]}! 🔥` :
                 isUni ? `Selamat Datang, ${userProfile?.displayName}` : 
                 `Hai, ${userProfile?.displayName}!`}
              </h1>
              <p className={cn("max-w-xl opacity-90", isUni ? "text-slate-300" : "")}>
                {isKids ? "Siap menaklukkan misi belajar hari ini? Ayo kumpulkan bintang!" : 
                 isSMP ? "Cek jadwal dan tugas terbaru kamu. Jangan sampai streak putus!" :
                 isUni ? "Fokus pada akademik dan pengembangan riset Anda." : 
                 "Semoga harimu menyenangkan dan produktif."}
              </p>
            </div>
            
            {/* Background Decorations */}
            <div className={cn(
              "absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none",
              isKids ? "bg-yellow-300" : "bg-primary"
            )} />
            
            {isKids && (
                <div className="absolute bottom-0 right-8 text-6xl opacity-20 rotate-12 pointer-events-none">
                    🎒
                </div>
            )}
          </motion.div>

          {/* 2. Quick Stats Grid */}
          <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label={isKids ? "Petualangan" : "Kelas"} 
              value={myClasses.length} 
              icon={isKids ? <Map /> : <School />} 
              theme={theme}
              variants={itemVariants}
            />
            <StatCard 
              label={isKids ? "Misi Aktif" : "Tugas Pending"} 
              value={upcomingAssignments.length} 
              icon={isKids ? <Scroll /> : <BookOpen />} 
              theme={theme}
              variants={itemVariants}
            />
            <StatCard 
              label={isKids ? "Kehadiran" : "Presensi"} 
              value="100%" 
              icon={<CheckCircle />} 
              theme={theme}
              variants={itemVariants}
            />
            <StatCard 
              label={isKids ? "Bintang XP" : "Total XP"} 
              value={userProfile?.gamification?.xp || userProfile?.xp || 0} 
              icon={isKids ? <Star className="fill-yellow-400 text-yellow-500" /> : <TrendingUp />} 
              theme={theme}
              variants={itemVariants}
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: CLASSES */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", isKids && "font-display text-2xl text-primary")}>
                  {isKids ? <Map className="w-6 h-6" /> : <School className="w-5 h-5" />}
                  {isKids ? "Peta Petualangan" : "Daftar Kelas"}
                </h2>
                <Button 
                  onClick={() => setIsJoinModalOpen(true)}
                  variant={isKids ? "secondary" : "primary"}
                  size="sm"
                  className={isKids ? "shadow-sm border-2" : ""}
                >
                  <Plus size={16} className="mr-2" /> {isKids ? "Gabung Tim Baru" : "Gabung Kelas"}
                </Button>
              </div>

              {myClasses.length === 0 ? (
                <div className={cn(
                    "text-center p-12 border-2 border-dashed rounded-3xl",
                    isKids ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-gray-50"
                )}>
                  <div className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                      isKids ? "bg-white shadow-md text-primary" : "bg-gray-200 text-gray-500"
                  )}>
                    <School size={32} />
                  </div>
                  <h3 className={cn("font-bold mb-1", isKids ? "text-xl text-primary font-display" : "text-gray-600")}>
                      {isKids ? "Belum Ada Peta!" : "Belum ada kelas"}
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                      {isKids ? "Minta kode rahasia dari guru untuk mulai berpetualang." : "Minta Kode Kelas dari gurumu untuk bergabung."}
                  </p>
                  <Button onClick={() => setIsJoinModalOpen(true)} variant={isKids ? "primary" : "outline"}>
                    {isKids ? "Masukkan Kode Rahasia" : "Gabung Kelas Sekarang"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myClasses.map((cls, index) => (
                    <motion.div 
                      key={cls.id}
                      whileHover={{ scale: isKids ? 1.03 : 1.01, translateY: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/classroom/${cls.id}`)}
                      className={cn(
                        "group relative p-6 rounded-3xl border transition-all cursor-pointer overflow-hidden",
                        isKids ? "bg-white border-2 border-b-8 border-gray-100 hover:border-primary hover:shadow-xl shadow-sm" : 
                        isSMP ? "bg-white hover:shadow-indigo-500/20 hover:shadow-lg border-transparent hover:border-indigo-200" :
                        isUni ? "bg-slate-800 border-slate-700 hover:border-primary" :
                        "bg-white border-gray-200 hover:border-primary hover:shadow-md"
                      )}
                    >
                      {/* Class Icon / Initials */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm",
                          isKids ? "bg-secondary text-secondary-foreground border-2 border-orange-200" : 
                          isSMP ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white" :
                          "bg-primary/10 text-primary"
                        )}>
                          {cls.name.charAt(0)}
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                          isKids ? "bg-blue-100 text-blue-700 border border-blue-200" :
                          isUni ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-500"
                        )}>
                          {cls.category || "Umum"}
                        </span>
                      </div>
                      
                      <h3 className={cn("font-bold text-lg truncate mb-1", isKids && "font-display text-xl", isUni && "text-white")}>
                          {cls.name}
                      </h3>
                      <p className={cn("text-xs truncate mb-6", isKids ? "text-gray-400" : "text-gray-500")}>
                          {cls.description || (isKids ? "Ayo jelajahi dunia ini!" : "Tidak ada deskripsi")}
                      </p>
                      
                      <div className={cn(
                          "flex items-center text-xs font-bold transition-transform group-hover:translate-x-1",
                          isKids ? "text-primary uppercase tracking-widest" : "text-primary"
                      )}>
                        {isKids ? "Mulai Petualangan" : "Masuk Kelas"} <ArrowRight size={14} className="ml-1" />
                      </div>

                      {/* Decoration for Kids */}
                      {isKids && (
                          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary/5 rounded-full" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* RIGHT COLUMN: SCHEDULE & TASKS */}
            <motion.div variants={itemVariants} className="space-y-6">
              
              {/* Upcoming Assignments */}
              <div className={cn(
                "p-6 rounded-3xl border",
                isKids ? "bg-white border-2 border-b-4 border-orange-100 shadow-sm" :
                isUni ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200"
              )}>
                <h3 className={cn("font-bold mb-4 flex items-center gap-2", isKids && "text-orange-600 font-display text-lg")}>
                  {isKids ? <Scroll size={20} /> : <AlertCircle size={18} className="text-orange-500" />}
                  {isKids ? "Papan Misi" : "Tugas Segera"}
                </h3>
                
                <div className="space-y-3">
                  {upcomingAssignments.length > 0 ? (
                    upcomingAssignments.map((task) => (
                      <div key={task.id} className="flex gap-3 items-start pb-3 border-b border-dashed last:border-0 border-gray-100">
                        <div className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", isKids ? "bg-orange-400" : "bg-orange-500")} />
                        <div>
                          <p className={cn("text-sm font-bold line-clamp-1", isKids && "text-gray-700")}>{task.title}</p>
                          <p className="text-xs opacity-60 mb-1">{task.className}</p>
                          <p className={cn(
                              "text-[10px] font-mono px-1.5 py-0.5 rounded inline-block",
                              isKids ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600 dark:bg-slate-700"
                          )}>
                             {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 opacity-50">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">{isKids ? "Semua misi selesai! Hebat!" : "Tidak ada tugas aktif."}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Mockup */}
              <div className={cn(
                "p-6 rounded-3xl border",
                isKids ? "bg-blue-50 border-2 border-blue-100" :
                isUni ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200"
              )}>
                <h3 className={cn("font-bold mb-4 flex items-center gap-2", isKids && "text-blue-600 font-display text-lg")}>
                  <Calendar size={18} className={isKids ? "text-blue-500" : "text-primary"} />
                  {isKids ? "Agenda Petualang" : "Jadwal Hari Ini"}
                </h3>
                {/* Mock Empty State for now */}
                <div className="text-center py-4">
                  <p className="text-xs opacity-50 italic">{isKids ? "Belum ada agenda hari ini. Waktunya bermain!" : "Fitur Jadwal akan segera hadir."}</p>
                </div>
              </div>

            </motion.div>

          </div>
        </div>
      </motion.div>

      <MobileNav />

      {/* Modal Join Class */}
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
function StatCard({ label, value, icon, theme, variants }: any) {
  const isKids = theme === "sd";
  const isUni = theme === "uni";

  return (
    <motion.div 
      variants={variants}
      className={cn(
        "p-5 rounded-3xl border flex flex-col justify-between h-32 transition-all",
        isKids ? "bg-white border-2 border-b-4 border-gray-100 hover:-translate-y-1 hover:border-primary hover:shadow-lg" : 
        isUni ? "bg-slate-800 border-slate-700 text-white" :
        "bg-white border-gray-200 shadow-sm hover:shadow-md"
      )}
    >
      <div className={cn(
        "self-start p-2.5 rounded-xl mb-2",
        isKids ? "bg-secondary text-secondary-foreground shadow-sm" : "bg-primary/10 text-primary"
      )}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div>
        <h4 className={cn("text-3xl font-bold leading-none mb-1", isKids && "font-display text-primary")}>{value}</h4>
        <p className={cn("text-[10px] font-bold uppercase tracking-wider opacity-60", isKids && "text-gray-500")}>{label}</p>
      </div>
    </motion.div>
  );
}