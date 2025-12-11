"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, BookOpen, Video, FileText, Link as LinkIcon, Loader2, 
  ClipboardList, FileCheck, Clock, LayoutDashboard,
  Users, Trophy, Bell, GraduationCap, Palette, Map, Scroll, Backpack
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme-context"; 
import { cn } from "@/lib/utils";
import { onAuthStateChanged } from "firebase/auth";
import { AdventureMap } from "@/components/learn/adventure-map"; 
import { Button } from "@/components/ui/button";

interface StudentClassroomClientProps {
  classId: string;
}

export default function StudentClassroomClient({ classId }: StudentClassroomClientProps) {
  const router = useRouter();
  const { theme } = useTheme(); 

  const [userId, setUserId] = useState<string | null>(null);
  const [classData, setClassData] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classMembers, setClassMembers] = useState<any[]>([]); 
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "materials" | "assignments" | "people" | "adventure">("dashboard");
  const [loading, setLoading] = useState(true);

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMP = theme === "smp";

  // Auth Check & Fetch Logic
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else router.push("/");
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!classId) return;

    const fetchClassAndMembers = async () => {
      try {
        const docRef = doc(db, "classrooms", classId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setClassData(data);

          if (data.students && Array.isArray(data.students) && data.students.length > 0) {
              const membersPromises = data.students.map(async (uid: string) => {
                const userSnap = await getDoc(doc(db, "users", uid));
                if (userSnap.exists()) {
                   const userData = userSnap.data();
                   return {
                      uid: userSnap.id,
                      displayName: userData.displayName || "Siswa",
                      photoURL: userData.photoURL,
                      email: userData.email,
                      level: userData.level || userData.gamification?.level || 1,
                      xp: userData.xp || userData.gamification?.xp || 0
                   };
                }
                return null;
              });
              const members = await Promise.all(membersPromises);
              setClassMembers(members.filter(m => m !== null));
          }
        } else {
          alert("Kelas tidak ditemukan");
          router.push("/learn");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassAndMembers();

    const materialsRef = collection(db, "classrooms", classId, "materials");
    const qMat = query(materialsRef, orderBy("createdAt", "desc"));
    const unsubMat = onSnapshot(qMat, (snapshot) => {
      const mats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaterials(mats);
    });

    const assignmentsRef = collection(db, "classrooms", classId, "assignments");
    const qAss = query(assignmentsRef, orderBy("createdAt", "desc"));
    const unsubAss = onSnapshot(qAss, (snapshot) => {
      const asses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignments(asses);
    });

    return () => {
      unsubMat();
      unsubAss();
    };
  }, [classId, router]);

  const classTotalXP = classMembers.reduce((total, member) => total + (member.xp || 0), 0);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      {isKids ? (
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity }}>
              <span className="text-6xl">🏰</span>
          </motion.div>
      ) : (
          <Loader2 className="animate-spin w-10 h-10 text-primary mb-4"/> 
      )}
      <p className={cn("font-medium animate-pulse mt-4", isKids && "font-display text-xl text-primary")}>
          {isKids ? "Membuka Gerbang Kelas..." : "Memuat Ruang Kelas..."}
      </p>
    </div>
  );

  const bgSoft = isKids ? "bg-yellow-50" : isUni ? "bg-slate-900" : "bg-slate-50";

  // Data Adapter for Adventure Map
  const mapModules = [...materials, ...assignments].map(item => ({
     id: item.id,
     title: item.title,
     description: item.description,
     isLocked: false, 
     thumbnailUrl: item.type === 'video' ? '📺' : item.type === 'quiz' ? '📝' : item.type === 'essay' ? '✍️' : '📄' 
  }));

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-500 pb-24 md:pb-0 md:flex", bgSoft)}>
      
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className={cn(
          "hidden md:flex w-72 flex-col sticky top-0 h-screen z-20 border-r transition-all",
          isKids ? "bg-white border-r-4 border-primary/20 shadow-xl" : "bg-white border-slate-200",
          isUni && "bg-slate-900 border-slate-800"
      )}>
         <div className={cn(
             "p-6 flex items-center gap-3 transition-colors",
             isKids ? "bg-secondary text-secondary-foreground border-b-4 border-primary/10" : "border-b border-slate-100",
             isUni && "bg-slate-800 border-slate-700 text-white"
         )}>
            <Button 
                variant={isKids ? "secondary" : "ghost"} 
                size="icon"
                onClick={() => router.push("/learn")} 
                className={isKids ? "rounded-xl border-2 shadow-sm shrink-0" : "rounded-full shrink-0"}
            >
               <ArrowLeft size={isKids ? 24 : 20} />
            </Button>
            <div className="overflow-hidden">
                <span className={cn("font-bold text-lg truncate block", isKids && "font-display text-xl")} title={classData?.name}>
                    {classData?.name}
                </span>
                <span className="text-xs opacity-70 truncate block">{classData?.category || "Kelas Umum"}</span>
            </div>
         </div>
         
         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className={cn("px-2 text-xs font-bold uppercase tracking-wider mb-2 opacity-50", isUni ? "text-slate-400" : "text-slate-500")}>
                {isKids ? "Navigasi Markas" : "Menu Kelas"}
            </div>
            
            <NavItem 
                active={activeTab === "dashboard"} 
                onClick={() => setActiveTab("dashboard")} 
                icon={isKids ? <LayoutDashboard size={24}/> : <LayoutDashboard size={20}/>} 
                label={isKids ? "Lobi Utama" : "Beranda"} 
                theme={theme} 
            />
            <NavItem 
                active={activeTab === "adventure"} 
                onClick={() => setActiveTab("adventure")} 
                icon={isKids ? <Map size={24}/> : <Map size={20}/>} 
                label={isKids ? "Peta Misi" : "Peta Belajar"} 
                theme={theme} 
            />
            
            <div className={cn("px-2 text-xs font-bold uppercase tracking-wider mt-6 mb-2 opacity-50", isUni ? "text-slate-400" : "text-slate-500")}>
                {isKids ? "Gudang Ilmu" : "Materi & Tugas"}
            </div>
            <NavItem 
                active={activeTab === "materials"} 
                onClick={() => setActiveTab("materials")} 
                icon={isKids ? <Backpack size={24}/> : <BookOpen size={20}/>} 
                label={isKids ? "Bekal Ilmu" : "Materi"} 
                theme={theme} 
            />
            <NavItem 
                active={activeTab === "assignments"} 
                onClick={() => setActiveTab("assignments")} 
                icon={isKids ? <Scroll size={24}/> : <ClipboardList size={20}/>} 
                label={isKids ? "Misi Rahasia" : "Tugas"} 
                theme={theme} 
            />
            
            <div className={cn("px-2 text-xs font-bold uppercase tracking-wider mt-6 mb-2 opacity-50", isUni ? "text-slate-400" : "text-slate-500")}>
                {isKids ? "Tim Kita" : "Anggota"}
            </div>
            <NavItem 
                active={activeTab === "people"} 
                onClick={() => setActiveTab("people")} 
                icon={isKids ? <Users size={24}/> : <Users size={20}/>} 
                label={isKids ? "Teman Seperjuangan" : "Anggota Kelas"} 
                theme={theme} 
            />
         </nav>

         <div className={cn("p-4 border-t", isKids ? "border-primary/10 bg-yellow-50" : "border-slate-100", isUni && "bg-slate-900 border-slate-800")}>
            <div className={cn("rounded-xl p-4 flex items-center gap-3", isKids ? "bg-white border-2 border-primary/20 shadow-sm" : "bg-slate-50", isUni && "bg-slate-800")}>
               <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", isKids ? "bg-primary text-white shadow-md border-2 border-white" : "bg-blue-100 text-blue-600")}>
                  {classData?.teacherName?.charAt(0) || "G"}
               </div>
               <div className="overflow-hidden">
                  <p className={cn("text-sm font-bold truncate", isKids ? "font-display text-primary" : "text-slate-700", isUni && "text-slate-200")}>{classData?.teacherName}</p>
                  <p className={cn("text-xs truncate opacity-70", isUni ? "text-slate-400" : "text-slate-500")}>{isKids ? "Kapten Kelas" : "Wali Kelas"}</p>
               </div>
            </div>
         </div>
      </aside>

      {/* 2. MOBILE HEADER & NAV */}
      <div className={cn(
          "md:hidden fixed top-0 left-0 right-0 z-30 px-4 h-16 flex items-center justify-between border-b shadow-sm transition-colors",
          isKids ? "bg-white border-primary/20" : isUni ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
         <div className="flex items-center gap-3 overflow-hidden">
            <Button onClick={() => router.push("/learn")} variant="ghost" size="icon" className="rounded-full shrink-0">
               <ArrowLeft size={20} className={isKids ? "text-primary" : isUni ? "text-slate-200" : "text-slate-600"} />
            </Button>
            <span className={cn("font-bold truncate text-lg", isKids ? "font-display text-primary" : isUni ? "text-white" : "text-slate-800")}>
                {classData?.name}
            </span>
         </div>
         <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell size={20} className={isKids ? "text-primary" : isUni ? "text-slate-200" : "text-slate-500"} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
         </Button>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around p-2 pb-safe border-t transition-colors",
          isKids ? "bg-white border-primary/20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" : isUni ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
         <MobileNavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={isKids ? <LayoutDashboard /> : <LayoutDashboard />} label="Lobi" theme={theme} />
         <MobileNavItem active={activeTab === "adventure"} onClick={() => setActiveTab("adventure")} icon={<Map />} label="Peta" theme={theme} />
         <MobileNavItem active={activeTab === "materials"} onClick={() => setActiveTab("materials")} icon={isKids ? <Backpack /> : <BookOpen />} label="Bekal" theme={theme} />
         <MobileNavItem active={activeTab === "assignments"} onClick={() => setActiveTab("assignments")} icon={isKids ? <Scroll /> : <ClipboardList />} label="Misi" theme={theme} />
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <main className={cn("flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto min-h-screen", isUni && "text-slate-200")}>
         <div className="max-w-5xl mx-auto space-y-8">
            
            <AnimatePresence mode="wait">
                {/* VIEW: DASHBOARD */}
                {activeTab === "dashboard" && (
                   <motion.div 
                        key="dashboard"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                      {/* Hero Banner */}
                      <div className={cn(
                          "rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-lg transition-all",
                          isKids ? "bg-primary border-b-8 border-red-700" : 
                          isSMP ? "bg-gradient-to-r from-violet-600 to-indigo-600" :
                          isUni ? "bg-slate-800 border border-slate-700" :
                          "bg-blue-600"
                      )}>
                         {/* Deco */}
                         <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full opacity-10 -mr-16 -mt-16 blur-3xl pointer-events-none" />
                         {isKids && <div className="absolute bottom-4 right-4 text-6xl animate-bounce">🏰</div>}
                         
                         <div className="relative z-10">
                            <div className="flex flex-wrap gap-2 mb-3">
                               <span className="inline-block px-3 py-1 rounded-full bg-white/20 border border-white/30 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                  Kode: {classData?.code}
                               </span>
                               {classData?.gradeLevel && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                     <GraduationCap size={12}/> {classData.gradeLevel}
                                  </span>
                               )}
                               {classData?.category && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                     <Palette size={12}/> {classData.category}
                                  </span>
                               )}
                            </div>
                            <h1 className={cn("text-2xl md:text-4xl font-bold mb-2", isKids && "font-display tracking-wide drop-shadow-md")}>
                                {isKids ? `Selamat Datang di Markas ${classData?.name}! 👋` : `Selamat Datang di ${classData?.name}`}
                            </h1>
                            <p className="text-white/90 max-w-xl text-sm md:text-base font-medium">
                                {classData?.description || (isKids ? "Siap untuk petualangan seru hari ini?" : "Deskripsi kelas belum diatur.")}
                            </p>
                         </div>
                      </div>

                      {/* Shortcuts */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                         <StatCard 
                            icon={isKids ? <Map size={24}/> : <Map size={20}/>} 
                            label={isKids ? "Peta Utama" : "Peta Belajar"} 
                            value={isKids ? "Buka Peta" : "Akses"} 
                            color="blue" 
                            theme={theme} 
                            onClick={() => setActiveTab("adventure")} 
                         />
                         <StatCard 
                            icon={isKids ? <Scroll size={24}/> : <ClipboardList size={20}/>} 
                            label={isKids ? "Misi Rahasia" : "Tugas Aktif"} 
                            value={assignments.length} 
                            color="purple" 
                            theme={theme} 
                            onClick={() => setActiveTab("assignments")} 
                         />
                         <StatCard 
                            icon={<Trophy size={isKids ? 24 : 20}/>} 
                            label={isKids ? "Harta Karun" : "XP Kelas"} 
                            value={classTotalXP} 
                            color="yellow" 
                            theme={theme} 
                         />
                         <StatCard 
                            icon={<Users size={isKids ? 24 : 20}/>} 
                            label={isKids ? "Pasukan" : "Anggota"} 
                            value={classMembers.length || classData?.studentCount || 0} 
                            color="green" 
                            theme={theme} 
                            onClick={() => setActiveTab("people")} 
                         />
                      </div>
                   </motion.div>
                )}

                {/* VIEW: ADVENTURE MAP */}
                {activeTab === "adventure" && (
                    <motion.div 
                        key="adventure"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <h2 className={cn("text-2xl font-bold mb-2", isKids ? "text-primary font-display" : "text-slate-800")}>
                                {isKids ? "🗺️ Peta Perjalanan Belajar" : "Peta Kurikulum"}
                            </h2>
                            <p className="text-slate-500 text-sm">
                                {isKids ? "Ikuti jejak ini untuk menemukan harta karun ilmu!" : "Ikuti alur pembelajaran ini secara berurutan."}
                            </p>
                        </div>
                        {/* Render Adventure Map Component */}
                        {mapModules.length > 0 ? (
                            <AdventureMap modules={mapModules as any} />
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-slate-50 border-slate-200">
                                <Map className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-400 font-medium">Peta masih kosong. Tunggu guru menggambar peta ya!</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* VIEW: MATERIALS */}
                {activeTab === "materials" && (
                   <motion.div key="materials" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                      <div className="flex items-center justify-between">
                          <h2 className={cn("text-xl font-bold", isKids && "font-display text-primary")}>
                              {isKids ? "🎒 Bekal Petualangan" : "Materi Pembelajaran"}
                          </h2>
                      </div>
                      
                      {materials.length === 0 ? (
                          <EmptyState 
                              icon={<BookOpen size={32}/>} 
                              text={isKids ? "Belum ada bekal ilmu dari Kapten Guru." : "Belum ada materi yang diunggah."} 
                              theme={theme}
                          />
                      ) : (
                          <div className="grid md:grid-cols-2 gap-4">
                             {materials.map((item, idx) => (
                                 <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                     <MaterialCard item={item} theme={theme} />
                                 </motion.div>
                             ))}
                          </div>
                      )}
                   </motion.div>
                )}

                {/* VIEW: ASSIGNMENTS */}
                {activeTab === "assignments" && (
                    <motion.div key="assignments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                       <div className="flex items-center justify-between">
                          <h2 className={cn("text-xl font-bold", isKids && "font-display text-primary")}>
                              {isKids ? "📜 Misi Rahasia" : "Daftar Tugas"}
                          </h2>
                      </div>

                       {assignments.length === 0 ? (
                           <EmptyState 
                               icon={<ClipboardList size={32}/>} 
                               text={isKids ? "Wah, tidak ada misi rahasia saat ini. Istirahatlah!" : "Tidak ada tugas aktif."} 
                               theme={theme}
                           />
                       ) : (
                           <div className="grid gap-4">
                               {assignments.map((item, idx) => (
                                   <motion.div 
                                       key={item.id}
                                       initial={{ opacity: 0, x: -10 }}
                                       animate={{ opacity: 1, x: 0 }}
                                       transition={{ delay: idx * 0.1 }}
                                       className={cn(
                                           "p-5 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden",
                                           isKids ? "bg-white border-2 border-b-4 border-slate-100 hover:border-purple-400 hover:shadow-lg" : 
                                           isUni ? "bg-slate-800 border-slate-700 hover:border-blue-500" :
                                           "bg-white border-slate-200 hover:border-purple-300 hover:shadow-md"
                                       )}
                                       onClick={() => router.push(`/classroom/${classId}/assignment/${item.id}`)}
                                   >
                                       <div className="flex items-start justify-between relative z-10">
                                           <div className="flex gap-4">
                                               <div className={cn(
                                                   "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", 
                                                   item.type === 'quiz' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600',
                                                   isKids && "border-2 border-white shadow-md"
                                               )}>
                                                   {item.type === 'quiz' ? <FileCheck size={28} /> : <ClipboardList size={28} />}
                                               </div>
                                               <div>
                                                   <h3 className={cn("font-bold text-lg group-hover:text-purple-600 transition-colors", isUni ? "text-slate-100" : "text-slate-800")}>{item.title}</h3>
                                                   <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                       <span className={cn(
                                                           "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                                                           isKids ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-500"
                                                       )}>
                                                           {item.type === 'quiz' ? (isKids ? 'Tantangan Kuis' : 'Kuis') : (isKids ? 'Laporan Misi' : 'Esai')}
                                                       </span>
                                                       {item.deadline && (
                                                           <span className="text-red-500 font-medium flex items-center gap-1 text-xs bg-red-50 px-2 py-0.5 rounded-full">
                                                           <Clock size={12} /> 
                                                           {new Date(item.deadline.seconds * 1000).toLocaleDateString('id-ID')}
                                                           </span>
                                                       )}
                                                   </div>
                                               </div>
                                           </div>
                                           <Button size="sm" className={cn("hidden md:flex rounded-xl font-bold", isKids && "shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1")}>
                                                {isKids ? "Terima Misi" : "Kerjakan"}
                                           </Button>
                                       </div>
                                   </motion.div>
                               ))}
                           </div>
                       )}
                    </motion.div>
                )}

                {/* VIEW: PEOPLE */}
                {activeTab === "people" && (
                    <motion.div key="people" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                       <h2 className={cn("text-xl font-bold", isKids && "font-display text-primary")}>
                              {isKids ? "👥 Pasukan Kita" : "Anggota Kelas"}
                       </h2>
                       <div className={cn("rounded-3xl border overflow-hidden shadow-sm", isUni ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                           <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                 <thead className={cn("border-b", isUni ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-100")}>
                                     <tr>
                                         <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nama</th>
                                         <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Level</th>
                                         <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">XP</th>
                                     </tr>
                                 </thead>
                                 <tbody className={cn("divide-y", isUni ? "divide-slate-700" : "divide-slate-50")}>
                                     {classMembers.map((member) => (
                                         <tr key={member.uid} className={cn("transition-colors", isUni ? "hover:bg-slate-700" : "hover:bg-slate-50")}>
                                             <td className="px-6 py-4">
                                                 <div className="flex items-center gap-3">
                                                     <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs", isKids ? "bg-primary/10 text-primary border border-primary/20" : "bg-slate-200 text-slate-600")}>
                                                         {member.displayName.charAt(0)}
                                                     </div>
                                                     <span className={cn("font-bold", isUni ? "text-slate-200" : "text-slate-700")}>{member.displayName}</span>
                                                 </div>
                                             </td>
                                             <td className="px-6 py-4">
                                                 <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold", isKids ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-600")}>
                                                     Lvl {member.level}
                                                 </span>
                                             </td>
                                             <td className="px-6 py-4 text-right">
                                                 <span className={cn("font-bold", isKids ? "text-primary" : "text-slate-600")}>{member.xp} XP</span>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                              </table>
                           </div>
                       </div>
                    </motion.div>
                )}
            </AnimatePresence>

         </div>
      </main>

    </div>
  );
}

// ... Sub Components ...
function NavItem({ active, onClick, icon, label, theme }: any) {
   const isKids = theme === "sd";
   const isUni = theme === "uni";
   
   if (isKids) {
       return (
          <button onClick={onClick} className={cn(
              "flex items-center gap-3 w-full px-4 py-3 my-1 rounded-xl transition-all text-sm font-bold border-2 border-transparent",
              active ? "bg-primary text-white shadow-md border-primary transform scale-105" : "text-slate-500 hover:bg-white hover:border-slate-200 hover:shadow-sm"
          )}>
             <span className={cn("transition-transform", active && "animate-bounce")}>{icon}</span> 
             <span className="font-display tracking-wide">{label}</span>
          </button>
       )
   }

   return (
      <button onClick={onClick} className={cn(
          "flex items-center gap-3 w-full px-4 py-3 rounded-r-xl transition-all text-sm font-bold border-l-4 border-transparent",
          active ? (isUni ? "bg-slate-800 text-white border-blue-500" : "bg-blue-50 text-blue-600 border-blue-600") : 
          (isUni ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800")
      )}>
         {icon} {label}
      </button>
   )
}

function MobileNavItem({ active, onClick, icon, label, theme }: any) {
   const isKids = theme === "sd";
   const activeColor = theme === "sd" ? "text-primary" : "text-blue-600";
   
   return (
      <button onClick={onClick} className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-all", active ? activeColor : "text-slate-400", isKids && active && "bg-primary/5 scale-110")}>
         {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24, className: active ? "fill-current opacity-20" : "" }) : icon}
         <span className={cn("text-[10px] font-bold", isKids && "font-display tracking-wide")}>{label}</span>
      </button>
   )
}

function StatCard({ icon, label, value, color, theme, onClick }: any) {
   const isKids = theme === "sd";
   const colors: any = { 
       blue: isKids ? "bg-blue-100 text-blue-600" : "bg-blue-50 text-blue-600", 
       purple: isKids ? "bg-purple-100 text-purple-600" : "bg-purple-50 text-purple-600", 
       yellow: isKids ? "bg-yellow-100 text-yellow-600" : "bg-yellow-50 text-yellow-600", 
       green: isKids ? "bg-green-100 text-green-600" : "bg-green-50 text-green-600" 
   }
   return (
      <div onClick={onClick} className={cn(
          "p-4 rounded-3xl border flex flex-col items-center text-center transition-all h-full justify-between",
          isKids ? "bg-white border-2 border-b-4 border-slate-100 shadow-sm active:border-b-2 active:translate-y-[2px]" : "bg-white border-slate-100 shadow-sm",
          onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]"
      )}>
         <div className={cn("p-3 rounded-2xl mb-2", colors[color])}>{icon}</div>
         <div>
            <div className={cn("text-xl md:text-2xl font-bold text-slate-800", isKids && "font-display text-primary")}>{value}</div>
            <div className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wide">{label}</div>
         </div>
      </div>
   )
}

function MaterialCard({ item, theme }: any) {
   const isKids = theme === "sd";
   const isUni = theme === "uni";

   return (
      <div className={cn(
          "p-5 rounded-3xl border transition-all cursor-pointer group flex items-center gap-4 relative overflow-hidden",
          isKids ? "bg-white border-2 border-b-4 border-slate-100 hover:border-blue-400 hover:shadow-lg" : 
          isUni ? "bg-slate-800 border-slate-700" :
          "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200"
      )} onClick={() => window.open(item.content, "_blank")}>
         
         {isKids && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />}

         <div className={cn(
             "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", 
             item.type === 'video' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600',
             isKids && "border-2 border-white shadow-md"
         )}>
            {item.type === 'video' ? <Video size={26} /> : <FileText size={26} />}
         </div>
         <div className="flex-1 min-w-0 relative z-10">
            <h4 className={cn("font-bold text-lg truncate transition-colors group-hover:text-primary", isUni ? "text-slate-100" : "text-slate-800")}>{item.title}</h4>
            <div className="flex items-center gap-2 mt-1">
                 <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded", isKids ? "bg-slate-100 text-slate-500" : "bg-slate-100 text-slate-500")}>
                    {item.type === 'video' ? 'Video' : 'Bacaan'}
                 </span>
                 <span className="text-xs text-slate-400">• {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Baru'}</span>
            </div>
         </div>
         <div className={cn("p-2 rounded-full transition-colors", isKids ? "bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white" : "bg-slate-50 text-slate-300 group-hover:text-blue-500")}>
             <LinkIcon size={20} />
         </div>
      </div>
   )
}

function EmptyState({ icon, text, theme }: any) {
   const isKids = theme === "sd";
   return (
      <div className={cn(
          "text-center py-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center",
          isKids ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200"
      )}>
         <div className={cn("p-4 rounded-full mb-4", isKids ? "bg-slate-100 text-slate-400" : "bg-white shadow-sm text-slate-300")}>{icon}</div>
         <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">{text}</p>
      </div>
   )
}