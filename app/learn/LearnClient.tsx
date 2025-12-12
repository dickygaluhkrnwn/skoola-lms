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
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
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
        // Ambil assignments dari semua kelas (limit 5 global)
        const allAssignmentsPromises = validClasses.map(async (cls) => {
           const assignRef = collection(db, "classrooms", cls.id, "assignments");
           // Filter assignment yang belum deadline (future)
           const q = query(assignRef, orderBy("deadline", "asc"), limit(3)); 
           const snap = await getDocs(q);
           return snap.docs.map(d => ({
              id: d.id,
              classId: cls.id,
              className: cls.name,
              ...d.data()
           }));
        });
        
        const allAssignments = (await Promise.all(allAssignmentsPromises)).flat();
        // Sort ulang client side karena data dari multiple collections
        const sortedAssignments = allAssignments.sort((a: any, b: any) => {
           const dateA = a.deadline ? a.deadline.seconds : 0;
           const dateB = b.deadline ? b.deadline.seconds : 0;
           return dateA - dateB;
        }).slice(0, 5);

        setUpcomingAssignments(sortedAssignments);
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
    <div className={cn("min-h-screen flex items-center justify-center", isUni ? "bg-slate-950 text-white" : "bg-slate-900 text-white")}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className={cn("w-10 h-10 animate-spin", isUni ? "text-indigo-500" : "text-teal-400")} />
        <span className="font-bold text-sm tracking-widest uppercase">Loading Experience...</span>
      </div>
    </div>
  );

  // --- BACKGROUND LOGIC ---
  const mainBgClass = isUni 
    ? "bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200"
    : isSMA 
      ? "bg-slate-950 text-slate-100 selection:bg-teal-500/30 selection:text-teal-200" 
      : isKids 
        ? "bg-yellow-50 text-slate-900"
        : isSMP
          ? "bg-slate-50 text-slate-900"
          : "bg-slate-50 text-slate-900";

  return (
    <div className={cn("flex min-h-screen font-sans transition-colors duration-500 relative overflow-hidden", mainBgClass)}>
      
      {/* --- UNI THEME BACKGROUND: Animated Mesh --- */}
      {isUni && (
         <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1121] to-indigo-950" />
            {/* Animated Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
         </div>
      )}

      {/* --- SMA SPECIAL BACKGROUND --- */}
      {isSMA && (
        <div className="fixed inset-0 z-0">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
           <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
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
        
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* 1. HERO SECTION (DYNAMIC GREETING) */}
          <motion.div 
            variants={itemVariants}
            className={cn(
              "rounded-3xl p-8 relative overflow-hidden transition-all flex flex-col md:flex-row justify-between items-start md:items-end gap-6",
              isKids ? "bg-primary text-white shadow-lg mb-8" : 
              isSMP ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl" :
              // UNI & SMA: Glass Effect
              (isUni || isSMA) ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl" :
              "bg-white border border-slate-200"
            )}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                 {(isUni || isSMA) && <Sparkles size={16} className={cn(isUni ? "text-indigo-400" : "text-teal-400")} />}
                 <span className="text-xs font-bold uppercase tracking-widest">
                    {(isUni || isSMA) ? new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : "Dashboard"}
                 </span>
              </div>
              
              <h1 className={cn("font-bold leading-tight", 
                 isKids ? "text-4xl font-display" : 
                 isUni ? "text-4xl md:text-6xl tracking-tighter font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-indigo-200" :
                 isSMA ? "text-4xl md:text-5xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-white" : 
                 "text-3xl"
              )}>
                {(isUni || isSMA) ? `${getGreeting()},` : isKids ? `Halo, ${userProfile?.displayName?.split(' ')[0]}!` : `Hai, ${userProfile?.displayName}`}
                <br/>
                <span className={cn((isUni || isSMA) ? "text-white" : "")}>
                   {(isUni || isSMA) ? userProfile?.displayName?.split(' ')[0] : ""}
                </span>
              </h1>
              
              <p className={cn("mt-4 max-w-lg text-sm md:text-base leading-relaxed", (isUni || isSMA) ? "text-slate-400" : "opacity-90")}>
                {isUni 
                  ? "Tingkatkan produktivitas akademikmu. Cek jadwal kuliah dan tugas terbaru hari ini." 
                  : isSMA
                    ? "Siap untuk produktif hari ini? Ada beberapa tugas yang menunggu penyelesaianmu."
                    : "Lanjutkan progres belajarmu hari ini."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 flex gap-3">
               <Button 
                  onClick={() => setIsJoinModalOpen(true)}
                  className={cn(
                     "border-0 shadow-lg transition-all",
                     isUni ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20" :
                     isSMA ? "bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/20" :
                     isKids ? "bg-white text-primary hover:bg-white/90" : ""
                  )}
               >
                  <Plus size={18} className="mr-2"/> Gabung Kelas
               </Button>
            </div>
            
            {/* Background Decorations */}
            {(isUni || isSMA) && (
               <div className={cn(
                  "absolute right-0 bottom-0 w-96 h-96 bg-gradient-to-tl blur-3xl pointer-events-none opacity-20",
                  isUni ? "from-indigo-500/30 to-transparent" : "from-teal-500/30 to-transparent"
               )} />
            )}
          </motion.div>

          {/* 2. BENTO GRID LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
             
             {/* LEFT COLUMN: CLASSES (Span 8) */}
             <div className="md:col-span-8 space-y-6">
                
                {/* Stats Row */}
                <motion.div variants={containerVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard 
                    label="Kelas" 
                    value={myClasses.length} 
                    icon={isKids ? <Map /> : <School />} 
                    theme={theme} variants={itemVariants} delay={0}
                  />
                  <StatCard 
                    label="Tugas" 
                    value={upcomingAssignments.length} 
                    icon={isKids ? <Scroll /> : <BookOpen />} 
                    theme={theme} variants={itemVariants} delay={0.1}
                  />
                  <StatCard 
                    label="Hadir" 
                    value="98%" 
                    icon={<CheckCircle />} 
                    theme={theme} variants={itemVariants} delay={0.2}
                  />
                  <StatCard 
                    label="XP" 
                    value={userProfile?.gamification?.xp || userProfile?.xp || 0} 
                    icon={isKids ? <Star className="fill-yellow-400 text-yellow-500" /> : <TrendingUp />} 
                    theme={theme} variants={itemVariants} delay={0.3}
                  />
                </motion.div>

                {/* Class List */}
                <motion.div variants={itemVariants}>
                   <div className="flex items-center justify-between mb-4">
                      <h2 className={cn("text-xl font-bold", (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                         {isKids ? "Peta Petualangan" : "Kelas Saya"}
                      </h2>
                   </div>

                   {myClasses.length === 0 ? (
                      <EmptyClassState isSMA={isSMA} isUni={isUni} isKids={isKids} onJoin={() => setIsJoinModalOpen(true)} />
                   ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {myClasses.map((cls) => (
                            <ClassCard key={cls.id} cls={cls} isSMA={isSMA} isUni={isUni} isKids={isKids} onClick={() => router.push(`/classroom/${cls.id}`)} />
                         ))}
                      </div>
                   )}
                </motion.div>
             </div>

             {/* RIGHT COLUMN: WIDGETS (Span 4) */}
             <div className="md:col-span-4 space-y-6">
                
                {/* Assignments Widget */}
                <motion.div 
                   variants={itemVariants}
                   className={cn(
                      "p-6 rounded-3xl border transition-all h-full",
                      (isUni || isSMA) ? "bg-white/5 border-white/10 backdrop-blur-md" : "bg-white border-gray-200"
                   )}
                >
                   <h3 className={cn("font-bold mb-6 flex items-center gap-2", (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                      <AlertCircle size={18} className={isUni ? "text-indigo-400" : isSMA ? "text-teal-400" : "text-orange-500"} />
                      {isKids ? "Misi Rahasia" : "Deadline Terdekat"}
                   </h3>
                   
                   <div className="space-y-4">
                      {upcomingAssignments.length > 0 ? (
                         upcomingAssignments.map((task, idx) => (
                            <div key={task.id} className={cn("group flex gap-3 items-start p-3 rounded-xl transition-colors cursor-pointer", 
                               (isUni || isSMA) ? "hover:bg-white/5" : "hover:bg-slate-50"
                            )} onClick={() => router.push(`/classroom/${task.classId}/assignment/${task.id}`)}>
                               <div className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", 
                                  isUni ? "bg-indigo-500 group-hover:shadow-[0_0_8px_rgba(99,102,241,0.6)]" : 
                                  isSMA ? "bg-teal-500" : "bg-orange-500"
                               )} />
                               <div>
                                  <p className={cn("text-sm font-bold line-clamp-1 transition-colors", 
                                     isUni ? "text-slate-200 group-hover:text-indigo-300" : isSMA ? "text-slate-200 group-hover:text-teal-300" : "text-gray-700"
                                  )}>{task.title}</p>
                                  <p className={cn("text-xs opacity-60 mb-1", (isUni || isSMA) ? "text-slate-400" : "")}>{task.className}</p>
                                  <div className={cn("flex items-center gap-1 text-[10px]", 
                                     isUni ? "text-indigo-400" : isSMA ? "text-teal-400" : "text-gray-500"
                                  )}>
                                     <Clock size={10} /> 
                                     {task.deadline ? new Date(task.deadline.seconds * 1000).toLocaleDateString() : 'No Deadline'}
                                  </div>
                               </div>
                            </div>
                         ))
                      ) : (
                         <div className="text-center py-10 opacity-50">
                            <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className={cn("text-xs", (isUni || isSMA) ? "text-slate-400" : "")}>Semua tugas selesai!</p>
                         </div>
                      )}
                   </div>
                </motion.div>

                {/* Schedule / Quote Widget (Placeholder) */}
                <motion.div 
                   variants={itemVariants}
                   className={cn(
                      "p-6 rounded-3xl border transition-all relative overflow-hidden",
                      isUni ? "bg-gradient-to-br from-indigo-900/20 to-slate-900/20 border-white/10" :
                      isSMA ? "bg-gradient-to-br from-teal-900/20 to-slate-900/20 border-white/10" : 
                      "bg-white border-gray-200"
                   )}
                >
                   <h3 className={cn("font-bold mb-2 flex items-center gap-2 relative z-10", (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                      <Calendar size={18} className={isUni ? "text-indigo-400" : isSMA ? "text-teal-400" : "text-primary"} />
                      Jadwal Hari Ini
                   </h3>
                   <p className={cn("text-xs italic relative z-10", (isUni || isSMA) ? "text-slate-500" : "opacity-50")}>
                      Fitur sinkronisasi kalender akademik akan segera hadir.
                   </p>
                   {/* Abstract Shape */}
                   <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20", isUni ? "bg-indigo-500" : "bg-teal-500")} />
                </motion.div>

             </div>
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

// --- SUB COMPONENTS ---

function StatCard({ label, value, icon, theme, variants }: any) {
  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  return (
    <motion.div 
      variants={variants}
      className={cn(
        "p-5 flex flex-col justify-between h-32 transition-all cursor-default group",
        isKids ? "bg-white border-2 border-b-4 border-gray-100 hover:-translate-y-1 hover:border-primary hover:shadow-lg rounded-3xl" : 
        // UNI & SMA: Glassmorphism Card
        (isUni || isSMA) ? "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 rounded-2xl" :
        "bg-white border-gray-200 shadow-sm hover:shadow-md rounded-xl"
      )}
    >
      <div className={cn(
        "self-start p-2.5 rounded-xl mb-2 transition-transform group-hover:scale-110",
        isKids ? "bg-secondary text-secondary-foreground shadow-sm" : 
        isUni ? "bg-indigo-500/10 text-indigo-400" :
        isSMA ? "bg-teal-500/10 text-teal-400" :
        "bg-primary/10 text-primary"
      )}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div>
        <h4 className={cn("text-2xl md:text-3xl font-bold leading-none mb-1 tracking-tight", (isUni || isSMA) ? "text-white" : "text-slate-900")}>{value}</h4>
        <p className={cn("text-[10px] font-bold uppercase tracking-wider", (isUni || isSMA) ? "text-slate-500" : "text-gray-500")}>{label}</p>
      </div>
    </motion.div>
  );
}

function ClassCard({ cls, isSMA, isUni, isKids, onClick }: any) {
   return (
      <motion.div 
         whileHover={{ scale: 1.02, y: -4 }}
         whileTap={{ scale: 0.98 }}
         onClick={onClick}
         className={cn(
            "group relative p-6 rounded-3xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between h-full min-h-[180px]",
            // UNI STYLE: Techy & Clean
            isUni ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]" :
            // SMA STYLE: Sleek Dark
            isSMA ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)]" :
            isKids ? "bg-white border-2 border-b-8 border-gray-100 hover:border-primary" : 
            "bg-white border-gray-200 hover:border-primary hover:shadow-md"
         )}
      >
         <div className="flex items-start justify-between mb-4">
            <div className={cn(
               "w-12 h-12 flex items-center justify-center font-bold text-xl rounded-2xl shadow-sm transition-transform group-hover:scale-110",
               isUni ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white" :
               isSMA ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white" :
               "bg-primary/10 text-primary"
            )}>
               {cls.name.charAt(0)}
            </div>
            <span className={cn(
               "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
               (isUni || isSMA) ? "bg-slate-800 text-slate-400 border border-slate-700" :
               "bg-gray-100 text-gray-500"
            )}>
               {cls.category || "Umum"}
            </span>
         </div>
         
         <div>
            <h3 className={cn("font-bold text-lg truncate mb-1 transition-colors", 
               isUni ? "text-slate-100 group-hover:text-indigo-300" :
               isSMA ? "text-slate-100 group-hover:text-teal-300" : 
               "text-slate-800"
            )}>
               {cls.name}
            </h3>
            <p className={cn("text-xs truncate mb-4 line-clamp-2", (isUni || isSMA) ? "text-slate-500" : "text-gray-500")}>
               {cls.description || "Tidak ada deskripsi"}
            </p>
         </div>
         
         <div className={cn(
            "flex items-center text-xs font-bold transition-transform group-hover:translate-x-1 mt-auto pt-4 border-t border-dashed",
            (isUni || isSMA) ? "border-white/10" : "border-gray-100",
            isUni ? "text-indigo-400" : isSMA ? "text-teal-400" : "text-primary"
         )}>
            Masuk Kelas <ArrowRight size={14} className="ml-1" />
         </div>
      </motion.div>
   )
}

function EmptyClassState({ isSMA, isUni, isKids, onJoin }: any) {
   return (
      <div className={cn(
         "text-center p-12 border-2 border-dashed rounded-3xl transition-all",
         (isUni || isSMA) ? "border-slate-800 bg-slate-900/50" : "border-gray-200 bg-gray-50"
      )}>
         <div className={cn("w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center", 
            (isUni || isSMA) ? "bg-slate-800 text-slate-500" : "bg-white text-slate-500 shadow-sm"
         )}>
            <School size={32} />
         </div>
         <h3 className={cn("font-bold mb-1", (isUni || isSMA) ? "text-slate-300" : "text-gray-600")}>
            Belum ada kelas
         </h3>
         <Button onClick={onJoin} variant="outline" className="mt-4">
            Gabung Kelas Sekarang
         </Button>
      </div>
   )
}