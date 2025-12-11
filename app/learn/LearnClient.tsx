"use client";

import React, { useState, useEffect } from "react";
import { 
  School, LayoutDashboard, Clock, Calendar, CheckCircle, 
  AlertCircle, BookOpen, TrendingUp, Plus, ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { 
  doc, getDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot, updateDoc, arrayUnion, increment 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// --- IMPORTS ---
import { StudentSidebar } from "../../components/layout/student-sidebar";
import { MobileNav } from "../../components/layout/mobile-nav";
import { JoinClassModal } from "../../components/learn/join-class-modal";
import { useTheme } from "../../lib/theme-context";
import { cn } from "../../lib/utils";

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
  const isUni = theme === "uni";

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
        // FIX: Cast as any agar properti .name terbaca
        return cDoc.exists() ? { id: cDoc.id, ...cDoc.data() } as any : null;
      });
      const classesRes = await Promise.all(classesPromises);
      const validClasses = classesRes.filter(c => c !== null);
      setMyClasses(validClasses);

      // B. Fetch Upcoming Assignments (Simple aggregation)
      if (validClasses.length > 0) {
        // Ambil ID kelas pertama untuk contoh tugas
        const firstClassId = validClasses[0].id;
        const assignRef = collection(db, "classrooms", firstClassId, "assignments");
        
        const q = query(assignRef, orderBy("deadline", "asc"), limit(3));
        const assignSnap = await getDocs(q);
        
        const assigns = assignSnap.docs.map(d => ({ 
          id: d.id, 
          classId: firstClassId, 
          className: validClasses[0].name, // Sekarang aman karena validClasses[0] sudah any
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
        alert("Kamu sudah bergabung di kelas ini!");
        setJoining(false);
        return;
      }

      const q = query(collection(db, "classrooms"), where("code", "==", codeUpper));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Kode kelas tidak ditemukan!");
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
      // Data akan auto-update karena ada listener onSnapshot di useEffect
    } catch (error) {
      console.error(error);
      alert("Gagal bergabung. Coba lagi nanti.");
    } finally {
      setJoining(false);
    }
  };


  // --- RENDER HELPERS ---
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground animate-pulse">
      <div className="flex flex-col items-center gap-2">
        <School className="w-10 h-10 animate-bounce text-primary" />
        <span className="font-bold">Memuat Sekolah Digital...</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground transition-colors duration-500">
      <StudentSidebar />

      <div className="flex-1 md:ml-64 relative pb-24 p-4 md:p-8">
        
        {/* HEADER SECTION: GREETING & STATS */}
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* 1. Welcome Banner */}
          <div className={cn(
            "rounded-3xl p-8 relative overflow-hidden transition-all",
            isKids ? "bg-primary text-white shadow-card" : 
            isUni ? "bg-slate-800 text-white border border-slate-700" :
            "bg-white border border-slate-200 text-slate-800"
          )}>
            <div className="relative z-10">
              <h1 className={cn("font-bold mb-2", isKids ? "text-3xl font-display" : "text-2xl md:text-3xl")}>
                {isKids ? `Halo, Petualang ${userProfile?.displayName?.split(' ')[0]}! 🚀` : 
                 isUni ? `Selamat Datang, ${userProfile?.displayName}` : 
                 `Hai, ${userProfile?.displayName}! 👋`}
              </h1>
              <p className={cn("max-w-xl opacity-90", isUni ? "text-slate-300" : "")}>
                {isKids ? "Siap untuk belajar hal baru hari ini? Ayo kumpulkan bintang!" : 
                 isUni ? "Lanjutkan riset dan pembelajaran akademik Anda." : 
                 "Cek jadwal kelas dan tugas terbaru kamu di sini."}
              </p>
            </div>
            
            {/* Background Decorations */}
            <div className={cn(
              "absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none",
              isKids ? "bg-yellow-300" : "bg-primary"
            )} />
          </div>

          {/* 2. Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label={isKids ? "Kelas Seru" : "Kelas Aktif"} 
              value={myClasses.length} 
              icon={<School />} 
              theme={theme}
            />
            <StatCard 
              label={isKids ? "Tugas PR" : "Tugas Pending"} 
              value={upcomingAssignments.length} 
              icon={<BookOpen />} 
              theme={theme}
            />
            <StatCard 
              label="Kehadiran" 
              value="100%" 
              icon={<CheckCircle />} 
              theme={theme}
            />
            <StatCard 
              label={isKids ? "Koin XP" : "Total XP"} 
              value={userProfile?.gamification?.xp || userProfile?.xp || 0} 
              icon={<TrendingUp />} 
              theme={theme}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: CLASSES */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", isKids && "font-display text-primary")}>
                  <School className="w-5 h-5" />
                  {isKids ? "Kelasku" : "Daftar Kelas"}
                </h2>
                <button 
                  onClick={() => setIsJoinModalOpen(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all",
                    isKids ? "bg-secondary text-secondary-foreground hover:scale-105" : "bg-primary text-white hover:bg-primary/90"
                  )}
                >
                  <Plus size={14} /> Gabung Kelas
                </button>
              </div>

              {myClasses.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-2xl border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <School size={32} />
                  </div>
                  <h3 className="font-bold text-gray-600 mb-1">Belum ada kelas</h3>
                  <p className="text-sm text-gray-400 mb-4">Minta Kode Kelas dari gurumu untuk bergabung.</p>
                  <button 
                    onClick={() => setIsJoinModalOpen(true)}
                    className="text-primary font-bold text-sm hover:underline"
                  >
                    Gabung Kelas Sekarang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myClasses.map((cls) => (
                    <div 
                      key={cls.id}
                      onClick={() => router.push(`/classroom/${cls.id}`)}
                      className={cn(
                        "group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden",
                        isKids ? "bg-white border-2 border-b-4 border-gray-100 hover:border-primary hover:shadow-lg" : 
                        isUni ? "bg-slate-800 border-slate-700 hover:border-primary" :
                        "bg-white border-gray-200 hover:border-primary hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                          isKids ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"
                        )}>
                          {cls.name.charAt(0)}
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                          isUni ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-500"
                        )}>
                          {cls.category || "Umum"}
                        </span>
                      </div>
                      <h3 className={cn("font-bold text-lg truncate mb-1", isUni && "text-white")}>{cls.name}</h3>
                      <p className="text-xs text-gray-500 truncate mb-4">{cls.description || "Tidak ada deskripsi"}</p>
                      
                      <div className="flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                        Masuk Kelas <ArrowRight size={14} className="ml-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: SCHEDULE & TASKS */}
            <div className="space-y-6">
              
              {/* Upcoming Assignments */}
              <div className={cn(
                "p-6 rounded-2xl border",
                isUni ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200"
              )}>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <AlertCircle size={18} className="text-orange-500" />
                  {isKids ? "PR Kamu" : "Tugas Segera"}
                </h3>
                
                <div className="space-y-3">
                  {upcomingAssignments.length > 0 ? (
                    upcomingAssignments.map((task) => (
                      <div key={task.id} className="flex gap-3 items-start pb-3 border-b border-dashed last:border-0 border-gray-100">
                        <div className="mt-1 w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                        <div>
                          <p className="text-sm font-bold line-clamp-1">{task.title}</p>
                          <p className="text-xs opacity-60 mb-1">{task.className}</p>
                          <p className="text-[10px] font-mono opacity-50 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded inline-block">
                             {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 opacity-50">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Tidak ada tugas aktif.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Mockup */}
              <div className={cn(
                "p-6 rounded-2xl border",
                isUni ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200"
              )}>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-primary" />
                  Jadwal Hari Ini
                </h3>
                {/* Mock Empty State for now */}
                <div className="text-center py-4">
                  <p className="text-xs opacity-50 italic">Fitur Jadwal akan segera hadir.</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

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
function StatCard({ label, value, icon, theme }: any) {
  const isKids = theme === "sd";
  const isUni = theme === "uni";

  return (
    <div className={cn(
      "p-4 rounded-2xl border flex flex-col justify-between h-28 transition-all hover:scale-[1.02]",
      isKids ? "bg-white border-2 border-b-4 border-gray-100" : 
      isUni ? "bg-slate-800 border-slate-700 text-white" :
      "bg-white border-gray-200"
    )}>
      <div className={cn(
        "self-start p-2 rounded-lg mb-2",
        isKids ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"
      )}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div>
        <h4 className={cn("text-2xl font-bold leading-none mb-1", isKids && "font-display")}>{value}</h4>
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p>
      </div>
    </div>
  );
}