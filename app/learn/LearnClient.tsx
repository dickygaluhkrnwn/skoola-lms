"use client";

import React, { useState, useEffect } from "react";
import { 
  School, LayoutDashboard, Clock, Calendar, CheckCircle, 
  AlertCircle, BookOpen, TrendingUp, Plus, ArrowRight, Star, Map, Scroll, Zap, Sparkles, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { 
  doc, getDoc, collection, query, orderBy, limit, onSnapshot, updateDoc, arrayUnion, increment, getDocs 
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
import { Classroom } from "@/lib/types/course.types";
import { ClassList } from "../../components/learn/class-list";
import { ModuleList } from "../../components/learn/module-list";
import { LearnHeader } from "../../components/learn/learn-header";

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
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"classes" | "modules">("classes");
  
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
          // Note: Logic fetchClasses untuk list sudah dipindah ke ClassList component.
          // Kita hanya perlu fetch assignments untuk widget dashboard.
          if (enrolled.length > 0) {
            fetchAssignments(enrolled);
          } else {
            setLoading(false);
          }
        }
      });

      return () => unsubUser();
    });

    return () => unsubscribeAuth();
  }, [router]);

  // Fetch Assignments Only (Classes fetch moved to ClassList)
  const fetchAssignments = async (classIds: string[]) => {
    try {
      // Ambil detail kelas dulu untuk nama kelas (bisa dioptimasi nanti)
      const classesPromises = classIds.map(async (cid) => {
        const cDoc = await getDoc(doc(db, "classrooms", cid));
        return cDoc.exists() ? { id: cDoc.id, ...cDoc.data() } as Classroom : null;
      });
      const classesRes = await Promise.all(classesPromises);
      const validClasses = classesRes.filter((c): c is Classroom => c !== null);

      if (validClasses.length > 0) {
        const allAssignmentsPromises = validClasses.map(async (cls) => {
           const assignRef = collection(db, "classrooms", cls.id, "assignments");
           const q = query(assignRef, orderBy("deadline", "asc"), limit(5)); 
           const snap = await getDocs(q);
           return snap.docs.map(d => ({
             id: d.id,
             classId: cls.id,
             className: cls.name,
             ...d.data()
           }));
        });
        
        const allAssignments = (await Promise.all(allAssignmentsPromises)).flat();
        
        // Filter & Sort client side
        const now = Date.now();
        const sortedAssignments = allAssignments
            .filter((a: any) => {
                if (!a.deadline) return true;
                const d = a.deadline.seconds ? a.deadline.seconds * 1000 : a.deadline;
                return d > now; 
            })
            .sort((a: any, b: any) => {
               const dateA = a.deadline ? (a.deadline.seconds ? a.deadline.seconds * 1000 : a.deadline) : Infinity;
               const dateB = b.deadline ? (b.deadline.seconds ? b.deadline.seconds * 1000 : b.deadline) : Infinity;
               return dateA - dateB;
            })
            .slice(0, 5);

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
      // Logic validasi sudah ada di Modal (JoinClassModal)
      // Disini tinggal eksekusi update DB setelah validasi sukses
      
      // Kita query lagi untuk dapat ID (redundant tapi safe)
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const q = query(collection(db, "classrooms"), where("code", "==", code));
      const snap = await getDocs(q);

      if (snap.empty) {
        // Should not happen if modal validates correctly
        alert("Kode kelas tidak ditemukan.");
        setJoining(false);
        return;
      }

      const classDoc = snap.docs[0];
      const classId = classDoc.id;

      // Cek duplikasi
      if (userProfile?.enrolledClasses?.includes(classId)) {
         alert("Anda sudah terdaftar di kelas ini.");
         setJoining(false);
         return;
      }

      // Update Classroom
      await updateDoc(doc(db, "classrooms", classId), {
        students: arrayUnion(user.uid),
        studentCount: increment(1)
      });

      // Update User
      await updateDoc(doc(db, "users", user.uid), {
        enrolledClasses: arrayUnion(classId)
      });

      alert("Berhasil bergabung!");
      setIsJoinModalOpen(false);
      // Reload handled by onSnapshot in ClassList component automatically

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
      
      {/* Backgrounds */}
      {isUni && (
         <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1121] to-indigo-950" />
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
         </div>
      )}
      {isSMA && (
        <div className="fixed inset-0 z-0">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
           <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
           <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      )}
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
          
          <LearnHeader 
             theme={theme}
             activeTab={activeTab}
             setActiveTab={setActiveTab}
          />

          {/* 1. HERO SECTION (DYNAMIC GREETING) */}
          <motion.div 
            variants={itemVariants}
            className={cn(
              "rounded-3xl p-8 relative overflow-hidden transition-all flex flex-col md:flex-row justify-between items-start md:items-end gap-6",
              isKids ? "bg-primary text-white shadow-lg mb-8" : 
              isSMP ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl" :
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
                    value={userProfile?.enrolledClasses?.length || 0} 
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

                {/* Class List OR Modules */}
                <motion.div variants={itemVariants}>
                   {activeTab === "classes" ? (
                      <ClassList theme={theme} onOpenJoinModal={() => setIsJoinModalOpen(true)} />
                   ) : (
                      <ModuleList theme={theme} />
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
                                     {task.deadline && typeof task.deadline === 'object' && 'seconds' in task.deadline 
                                        ? new Date(task.deadline.seconds * 1000).toLocaleDateString()
                                        : task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'
                                     }
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