"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, BookOpen, Video, FileText, Link as LinkIcon, Loader2, 
  ClipboardList, FileCheck, Clock, CheckCircle2, LayoutDashboard,
  Users, Trophy, Bell, User, GraduationCap, Palette, Map
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context"; 
import { cn } from "@/lib/utils";
import { onAuthStateChanged } from "firebase/auth";
import { AdventureMap } from "@/components/learn/adventure-map"; 

export default function StudentClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme(); 
  const classId = params.classId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [classData, setClassData] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classMembers, setClassMembers] = useState<any[]>([]); 
  
  // FIX: Pastikan tipe activeTab mencakup "adventure"
  const [activeTab, setActiveTab] = useState<"dashboard" | "materials" | "assignments" | "people" | "adventure">("dashboard");
  const [loading, setLoading] = useState(true);

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
      <Loader2 className="animate-spin w-10 h-10 text-primary mb-4"/> 
      <p className="font-medium animate-pulse">Memasuki Ruang Kelas...</p>
    </div>
  );

  const accentColor = isKids ? "bg-red-500" : isUni ? "bg-slate-800" : "bg-blue-600";
  const bgSoft = isKids ? "bg-yellow-50" : isUni ? "bg-slate-100" : "bg-slate-50";

  // Data Adapter for Adventure Map
  // Mengubah data materi & tugas menjadi format modul untuk Adventure Map
  const mapModules = [...materials, ...assignments].map(item => ({
     id: item.id,
     title: item.title,
     description: item.description, // Tambahan description jika ada
     isLocked: false, // Sementara unlock all, nanti bisa tambah logika locking
     // Tentukan ikon/thumbnail berdasarkan tipe
     thumbnailUrl: item.type === 'video' ? '📺' : item.type === 'quiz' ? '📝' : item.type === 'essay' ? '✍️' : '📄' 
  }));

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-500 pb-20 md:pb-0 md:flex", bgSoft)}>
      
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen z-20">
         <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <button onClick={() => router.push("/learn")} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
               <ArrowLeft size={20} />
            </button>
            <span className="font-bold text-lg text-slate-800 truncate" title={classData?.name}>{classData?.name}</span>
         </div>
         
         <nav className="flex-1 p-4 space-y-1">
            <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={20}/>} label="Beranda" theme={theme} />
            {/* TAB BARU: PETUALANGAN */}
            <NavItem active={activeTab === "adventure"} onClick={() => setActiveTab("adventure")} icon={<Map size={20}/>} label="Peta Belajar" theme={theme} />
            
            <NavItem active={activeTab === "materials"} onClick={() => setActiveTab("materials")} icon={<BookOpen size={20}/>} label="Materi" theme={theme} />
            <NavItem active={activeTab === "assignments"} onClick={() => setActiveTab("assignments")} icon={<ClipboardList size={20}/>} label="Tugas" theme={theme} />
            <NavItem active={activeTab === "people"} onClick={() => setActiveTab("people")} icon={<Users size={20}/>} label="Anggota Kelas" theme={theme} />
         </nav>

         <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-4">
               <p className="text-xs font-bold text-slate-400 uppercase mb-2">Guru Pengajar</p>
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                     {classData?.teacherName?.charAt(0) || "G"}
                  </div>
                  <div className="overflow-hidden">
                     <p className="text-sm font-bold text-slate-700 truncate">{classData?.teacherName}</p>
                     <p className="text-xs text-slate-400 truncate">Wali Kelas</p>
                  </div>
               </div>
            </div>
         </div>
      </aside>

      {/* 2. MOBILE HEADER & NAV */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-30 px-4 h-16 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={() => router.push("/learn")} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
               <ArrowLeft size={20} />
            </button>
            <span className="font-bold text-slate-800 truncate max-w-[200px]">{classData?.name}</span>
         </div>
         <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
         </button>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex justify-around p-2 pb-safe">
         <MobileNavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={20}/>} label="Beranda" theme={theme} />
         {/* Adventure Shortcut Mobile */}
         <MobileNavItem active={activeTab === "adventure"} onClick={() => setActiveTab("adventure")} icon={<Map size={20}/>} label="Peta" theme={theme} />
         <MobileNavItem active={activeTab === "materials"} onClick={() => setActiveTab("materials")} icon={<BookOpen size={20}/>} label="Materi" theme={theme} />
         <MobileNavItem active={activeTab === "assignments"} onClick={() => setActiveTab("assignments")} icon={<ClipboardList size={20}/>} label="Tugas" theme={theme} />
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto min-h-screen">
         <div className="max-w-5xl mx-auto space-y-8">
            
            {/* VIEW: DASHBOARD */}
            {activeTab === "dashboard" && (
               <div className="space-y-6">
                  {/* Hero Banner */}
                  <div className={cn("rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-lg transition-colors", accentColor)}>
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full opacity-10 -mr-16 -mt-16 blur-3xl pointer-events-none" />
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
                        <h1 className="text-2xl md:text-4xl font-bold mb-2">Selamat Datang di {classData?.name}! 👋</h1>
                        <p className="text-white/80 max-w-xl">{classData?.description || "Siap untuk belajar hal baru hari ini?"}</p>
                     </div>
                  </div>

                  {/* Shortcuts */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                     <StatCard icon={<Map size={20}/>} label="Peta Belajar" value="Mulai" color="blue" theme={theme} onClick={() => setActiveTab("adventure")} />
                     <StatCard icon={<ClipboardList size={20}/>} label="Tugas Aktif" value={assignments.length} color="purple" theme={theme} onClick={() => setActiveTab("assignments")} />
                     <StatCard icon={<Trophy size={20}/>} label="XP Kelas" value={classTotalXP} color="yellow" theme={theme} />
                     <StatCard icon={<Users size={20}/>} label="Teman Kelas" value={classMembers.length || classData?.studentCount || 0} color="green" theme={theme} onClick={() => setActiveTab("people")} />
                  </div>
                  
                  {/* Reuse existing widgets if needed... */}
               </div>
            )}

            {/* NEW VIEW: ADVENTURE MAP */}
            {activeTab === "adventure" && (
                <div className="space-y-6">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">Peta Perjalanan Belajar</h2>
                        <p className="text-slate-500 text-sm">Ikuti jalur ini untuk menguasai materi kelas secara bertahap!</p>
                    </div>
                    {/* Render Adventure Map Component */}
                    {mapModules.length > 0 ? (
                        // Cast mapModules ke any jika tipe CourseModule strict di AdventureMap belum diupdate untuk terima assignment
                        <AdventureMap modules={mapModules as any} />
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50">
                            <p className="text-slate-400">Guru belum menambahkan materi ke dalam peta belajar.</p>
                        </div>
                    )}
                </div>
            )}

            {/* VIEW: MATERIALS (Same as before) */}
            {activeTab === "materials" && (
               <div className="space-y-6">
                  {/* ... Existing Materials UI ... */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {materials.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                            <MaterialCard item={item} theme={theme} />
                        </motion.div>
                    ))}
                  </div>
               </div>
            )}

            {/* VIEW: ASSIGNMENTS (Same as before) */}
            {activeTab === "assignments" && (
                <div className="grid gap-4">
                    {assignments.map((item, idx) => (
                        <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => router.push(`/classroom/${classId}/assignment/${item.id}`)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", item.type === 'quiz' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600')}>
                                    {item.type === 'quiz' ? <FileCheck size={24} /> : <ClipboardList size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-purple-600 transition-colors">{item.title}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-sm">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500 text-xs font-bold uppercase tracking-wide">
                                            {item.type === 'quiz' ? 'Kuis' : 'Esai'}
                                        </span>
                                        {item.deadline && (
                                            <span className="text-red-500 font-medium flex items-center gap-1 text-xs">
                                            <Clock size={12} /> 
                                            Deadline: {new Date(item.deadline.seconds * 1000).toLocaleDateString('id-ID')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                </div>
                                <button className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-primary/20 group-hover:bg-primary/90 transition-all">
                                Kerjakan
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* VIEW: PEOPLE (Same as before) */}
            {activeTab === "people" && (
                <div className="space-y-6">
                    {/* ... Existing People UI ... */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nama</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Level</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">XP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {classMembers.map((member) => (
                                    <tr key={member.uid} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4"><span className="font-bold text-slate-700">{member.displayName}</span></td>
                                        <td className="px-6 py-4"><span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-lg text-xs font-bold">Lvl {member.level}</span></td>
                                        <td className="px-6 py-4 text-right"><span className="font-bold text-slate-600">{member.xp} XP</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

         </div>
      </main>

    </div>
  );
}

// ... Sub Components (NavItem, MobileNavItem, StatCard, MaterialCard, EmptyState) ...
// Pastikan komponen ini ada di bagian bawah file (copy dari versi sebelumnya jika hilang)
function NavItem({ active, onClick, icon, label, theme }: any) {
   const isKids = theme === "sd";
   const activeClass = isKids 
      ? "bg-sky-50 text-sky-600 border-r-4 border-sky-500" 
      : "bg-blue-50 text-blue-600 border-r-4 border-blue-600";
   return (
      <button onClick={onClick} className={cn("flex items-center gap-3 w-full px-4 py-3 rounded-r-xl transition-all text-sm font-bold", active ? activeClass : "text-slate-500 hover:bg-slate-50 hover:text-slate-800")}>
         {icon} {label}
      </button>
   )
}

function MobileNavItem({ active, onClick, icon, label, theme }: any) {
   const activeColor = theme === "sd" ? "text-sky-600" : "text-blue-600";
   return (
      <button onClick={onClick} className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-colors", active ? activeColor : "text-slate-400")}>
         {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24, className: active ? "fill-current opacity-20" : "" }) : icon}
         <span className="text-[10px] font-bold">{label}</span>
      </button>
   )
}

function StatCard({ icon, label, value, color, theme, onClick }: any) {
   const colors: any = { blue: "bg-blue-50 text-blue-600", purple: "bg-purple-50 text-purple-600", yellow: "bg-yellow-50 text-yellow-600", green: "bg-green-50 text-green-600" }
   return (
      <div onClick={onClick} className={cn("bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center transition-all", onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95")}>
         <div className={cn("p-2.5 rounded-xl mb-2", colors[color])}>{icon}</div>
         <div className="text-xl md:text-2xl font-bold text-slate-800">{value}</div>
         <div className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wide">{label}</div>
      </div>
   )
}

function MaterialCard({ item, theme }: any) {
   return (
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex items-center gap-4" onClick={() => window.open(item.content, "_blank")}>
         <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-colors", item.type === 'video' ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100')}>
            {item.type === 'video' ? <Video size={24} /> : <FileText size={24} />}
         </div>
         <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-800 truncate transition-colors group-hover:text-primary">{item.title}</h4>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
               {item.type === 'video' ? 'Video Pembelajaran' : 'Artikel Bacaan'}
               <span>•</span><span>{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Baru'}</span>
            </p>
         </div>
         <div className="p-2 rounded-full bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors"><LinkIcon size={18} /></div>
      </div>
   )
}

function EmptyState({ icon, text }: any) {
   return (
      <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
         <div className="inline-flex p-3 rounded-full bg-white shadow-sm text-slate-300 mb-3">{icon}</div>
         <p className="text-sm font-medium text-slate-500">{text}</p>
      </div>
   )
}