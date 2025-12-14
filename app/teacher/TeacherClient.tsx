"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Users, BookOpen, Settings, LogOut, Copy, School, Loader2, 
  GraduationCap, Palette, MessageSquare, Hash, Calendar, Briefcase
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase"; 
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "../../components/ui/button";
import { UserProfile } from "../../lib/types/user.types";
import { Classroom, ClassLevel, CourseSubject } from "../../lib/types/course.types"; 

// --- TYPES ---
interface ExtendedClassroom extends Classroom {
  role: 'homeroom' | 'teacher'; // Peran guru di kelas ini
  subjectName?: string; // Jika role teacher, mengajar apa?
}

export default function TeacherClient() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [classrooms, setClassrooms] = useState<ExtendedClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [appId, setAppId] = useState<string>("");
  const [schoolType, setSchoolType] = useState<'sd' | 'smp' | 'sma' | 'uni'>('sd');
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"classes" | "community">("classes");

  // Modal States (Simplified for now, focus on Dashboard Logic)
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isForumModalOpen, setIsForumModalOpen] = useState(false);

  // 1. INITIAL FETCH
  useEffect(() => {
    const currentAppId = (typeof window !== 'undefined' && (window as any).__app_id) || 'skoola-lms-default';
    setAppId(currentAppId);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        setLoading(true);

        // A. Get User Profile & School ID
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return;
        
        const userData = userDoc.data() as UserProfile;
        if (userData.role !== "teacher") {
          router.push("/learn");
          return;
        }
        setUserProfile(userData);

        // B. Get School Settings (For Adaptive UI)
        if (userData.schoolId) {
           const schoolDoc = await getDoc(doc(db, "schools", userData.schoolId));
           if (schoolDoc.exists()) {
              setSchoolType(schoolDoc.data().level || 'sd');
           }
        }

        // C. FETCH CLASSES (DUAL SOURCE STRATEGY)
        const myClassesMap = new Map<string, ExtendedClassroom>();

        // C1. Source 1: Sebagai Wali Kelas (Homeroom)
        const homeroomQuery = query(collection(db, "classrooms"), where("teacherId", "==", user.uid));
        const homeroomSnap = await getDocs(homeroomQuery);
        
        homeroomSnap.forEach((doc) => {
           const data = doc.data() as Classroom;
           myClassesMap.set(doc.id, {
             ...data,
             id: doc.id, // Explicit ID assignment
             role: 'homeroom'
           });
        });

        // C2. Source 2: Sebagai Pengajar Mapel (Subject Teacher from Schedules)
        // Query schedules where teacherId == uid
        const scheduleRef = collection(db, 'artifacts', currentAppId, 'public', 'data', 'schedules');
        const scheduleQuery = query(scheduleRef, where("teacherId", "==", user.uid));
        const scheduleSnap = await getDocs(scheduleQuery);

        // Kumpulkan ID kelas unik dari jadwal
        const scheduleClassIds = new Set<string>();
        const classSubjects = new Map<string, string>(); // Map ClassID -> SubjectName

        scheduleSnap.forEach((doc) => {
           const sData = doc.data();
           scheduleClassIds.add(sData.classId);
           // Simpan nama mapel (bisa multiple, ambil yg pertama atau join)
           classSubjects.set(sData.classId, sData.subjectName); 
        });

        // Fetch detail kelas untuk jadwal tersebut (jika belum ada di map)
        for (const classId of Array.from(scheduleClassIds)) {
           if (!myClassesMap.has(classId)) {
              const classDoc = await getDoc(doc(db, "classrooms", classId));
              if (classDoc.exists()) {
                 const data = classDoc.data() as Classroom;
                 myClassesMap.set(classId, {
                    ...data,
                    id: classId, // Explicit ID assignment
                    role: 'teacher',
                    subjectName: classSubjects.get(classId)
                 });
              }
           }
        }

        // Convert Map to Array & Sort
        const combinedClasses = Array.from(myClassesMap.values()).sort((a, b) => b.createdAt - a.createdAt);
        setClassrooms(combinedClasses);

      } catch (err) {
        console.error("Gagal ambil data:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // Helper Labels
  const getStudentLabel = () => schoolType === 'uni' ? 'Mahasiswa' : 'Siswa';
  const getClassLabel = () => schoolType === 'uni' ? 'Kelas / Seksi' : 'Kelas';
  // Helper for teacher label inside component scope
  const getTeacherLabel = () => schoolType === 'uni' ? 'Dosen' : 'Guru';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 text-blue-600">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        <span>Memuat Ruang {schoolType === 'uni' ? 'Dosen' : 'Guru'}...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      
      {/* SIDEBAR GURU */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 z-50">
        <div className="p-6">
           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-bold text-blue-600 tracking-wide uppercase">
                PORTAL {schoolType === 'uni' ? 'DOSEN' : 'GURU'}
              </span>
           </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
           <SidebarItem 
             active={activeTab === "classes"} 
             onClick={() => setActiveTab("classes")} 
             icon={<School size={20} />} 
             label={`Daftar ${getClassLabel()}`} 
           />
           <SidebarItem 
             active={activeTab === "community"} 
             onClick={() => setActiveTab("community")} 
             icon={<MessageSquare size={20} />} 
             label="Forum Komunitas" 
           />
           <SidebarItem icon={<BookOpen size={20} />} label="Bank Soal" onClick={() => alert("Segera Hadir!")} />
           <SidebarItem icon={<Settings size={20} />} label="Pengaturan" onClick={() => {}} />
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 px-3 py-3 mb-2">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-blue-200">
                {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="Guru" className="w-full h-full object-cover" />
                ) : (
                    userProfile?.displayName?.[0] || "G"
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-800">{userProfile?.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{schoolType === 'uni' ? 'Dosen' : 'Guru Pengajar'}</p>
              </div>
           </div>
           <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent rounded-xl w-full text-xs font-bold transition-all">
             <LogOut size={16} /> Keluar
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        
        {/* VIEW: CLASS MANAGEMENT */}
        {activeTab === "classes" && (
            <>
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-in fade-in slide-in-from-bottom-4">
                  <div>
                      <h1 className="text-2xl font-bold text-slate-900">Jadwal & Kelas Anda</h1>
                      <p className="text-slate-500 text-sm">
                        Kelola {getStudentLabel().toLowerCase()} dan materi pembelajaran untuk kelas yang Anda ampu.
                      </p>
                  </div>
                  {/* Tombol Buat Kelas dihilangkan agar Guru fokus pada kelas yang di-assign Admin. 
                      Jika ingin dikembalikan, uncomment logic modal class. */}
                </header>

                {/* CLASS GRID */}
                {classrooms.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                      <School size={48} className="mx-auto text-slate-300 mb-4" />
                      <h3 className="text-lg font-bold text-slate-700">Belum ada kelas aktif</h3>
                      <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                        Anda belum ditambahkan sebagai Wali {getClassLabel()} atau Pengajar di jadwal manapun. Hubungi Admin Sekolah.
                      </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {classrooms.map((cls) => (
                      <motion.div 
                          key={cls.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ y: -4 }}
                          className="bg-white p-0 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col"
                          onClick={() => router.push(`/teacher/class/${cls.id}`)}
                      >
                          {/* Banner Card */}
                          <div className={`h-24 ${
                            cls.role === 'homeroom' 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                              : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                          } p-5 relative overflow-hidden`}>
                             
                             {/* Badge Role */}
                             <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 shadow-sm uppercase tracking-wider">
                                {cls.role === 'homeroom' ? (schoolType === 'uni' ? 'Dosen Wali' : 'Wali Kelas') : 'Pengajar'}
                             </div>

                             <h3 className="text-xl font-bold text-white mb-1 relative z-10">{cls.name}</h3>
                             <p className="text-white/80 text-xs relative z-10 flex items-center gap-1">
                                <GraduationCap size={12}/> {cls.gradeLevel} 
                                {cls.role === 'teacher' && cls.subjectName && (
                                   <span className="font-semibold text-white ml-1">• {cls.subjectName}</span>
                                )}
                             </p>

                             {/* Decoration */}
                             <BookOpen className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12" />
                          </div>

                          {/* Content */}
                          <div className="p-5 flex-1 flex flex-col">
                             <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10 flex-1">
                               {cls.description || "Tidak ada deskripsi kelas."}
                             </p>
                             
                             <div className="flex items-center justify-between text-xs font-medium text-slate-500 pt-4 border-t border-slate-100 mt-auto">
                                <span className="flex items-center gap-1.5">
                                   <Users size={14} className="text-slate-400" /> 
                                   <strong className="text-slate-700">{cls.studentCount || 0}</strong> {getStudentLabel()}
                                </span>
                                {cls.role === 'homeroom' && (
                                   <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                      <Briefcase size={12}/> Full Access
                                   </span>
                                )}
                             </div>
                          </div>
                      </motion.div>
                      ))}
                  </div>
                )}
            </>
        )}

        {/* VIEW: COMMUNITY (Placeholder) */}
        {activeTab === "community" && (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400 text-center">
               <MessageSquare size={48} className="mb-4 text-slate-300" />
               <h3 className="text-lg font-bold text-slate-700">Forum Komunitas</h3>
               <p className="text-sm max-w-sm">Fitur diskusi antar {getTeacherLabel().toLowerCase()} dan {getStudentLabel().toLowerCase()} sedang dikembangkan.</p>
            </div>
        )}

      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`
        flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all text-sm font-bold
        ${active 
          ? "bg-blue-50 text-blue-600 border-2 border-blue-100" 
          : "text-slate-500 hover:bg-slate-50 border-2 border-transparent hover:text-slate-900"
        }
      `}
    >
      {icon} {label}
    </button>
  );
}