"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Users, BookOpen, LayoutDashboard, 
  CalendarCheck, Loader2, ClipboardList, GraduationCap, Palette,
  Info
} from "lucide-react";
// Import Storage untuk upload file
import { db, storage, auth } from "../../../../lib/firebase"; 
import { 
  doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, serverTimestamp, Timestamp, getCountFromServer, where, getDocs 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { cn } from "../../../../lib/utils";
import { onAuthStateChanged } from "firebase/auth";

// --- IMPORT TIPE DATA SENTRAL ---
import { Classroom as BaseClassroom, MaterialType, CourseSubject } from "../../../../lib/types/course.types"; 

// --- PERBAIKAN INTERFACE ---
// Menggunakan Omit untuk menghapus definisi 'gradeLevel' lama agar bisa di-override menjadi string
interface Classroom extends Omit<BaseClassroom, 'gradeLevel'> {
  schoolId?: string;
  gradeLevel?: string; 
}

// --- IMPORT KOMPONEN PECAHAN ---
import DashboardView from "../../../../components/teacher/class-detail/DashboardView";
import AttendanceView from "../../../../components/teacher/class-detail/AttendanceView";
import StudentListView from "../../../../components/teacher/class-detail/StudentListView";
import MaterialsView from "../../../../components/teacher/class-detail/MaterialsView";
import AssignmentsView, { AssignmentData as BaseAssignmentData } from "../../../../components/teacher/class-detail/AssignmentsView";
import UploadMaterialModal from "../../../../components/teacher/class-detail/UploadMaterialModal";

// Extend AssignmentData locally
interface AssignmentData extends BaseAssignmentData {
  subjectId?: string;
}

// --- TIPE DATA LOKAL ---
interface StudentData {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  xp?: number;
  level?: number;
  completedModules?: string[];
  lastActiveModule?: string;
  lastStudyTimestamp?: any;
}

// Update Interface agar support semua tipe materi baru
interface MaterialData {
  id: string;
  title: string;
  type: MaterialType; 
  content?: string; 
  url?: string;     
  locationData?: any; 
  createdAt: Timestamp;
  subjectId?: string; // New: Tag Materi ini milik mapel apa
  subjectName?: string; // New
  createdBy?: string; // New: ID Guru pembuat
}

interface ClassDetailClientProps {
  classId: string;
}

export default function ClassDetailClient({ classId }: ClassDetailClientProps) {
  const router = useRouter();

  // --- STATE UTAMA ---
  const [classData, setClassData] = useState<Classroom | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "attendance" | "students" | "materials" | "assignments">("dashboard");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Context State (Peran Guru di Kelas Ini)
  const [teacherRole, setTeacherRole] = useState<'homeroom' | 'subject'>('subject');
  const [mySubject, setMySubject] = useState<{id: string, name: string} | null>(null);
  const [schoolType, setSchoolType] = useState<'sd' | 'smp' | 'sma' | 'uni'>('sd');

  // Data Real
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [totalModules, setTotalModules] = useState(0); 

  // Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [initialModalTab, setInitialModalTab] = useState<"material" | "assignment">("material");

  // --- 1. FETCH DATA (INIT) ---
  useEffect(() => {
    if (!classId) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }
      setCurrentUser(user);

      try {
        const currentAppId = (typeof window !== 'undefined' && (window as any).__app_id) || 'skoola-lms-default';

        // A. Hitung Total Modul Global (untuk progress bar) - Placeholder logic
        // const coll = collection(db, "global_modules");
        // const snapshot = await getCountFromServer(coll);
        // setTotalModules(snapshot.data().count || 10);
        setTotalModules(10); // Default sementara

        // B. Fetch Data Kelas
        const docRef = doc(db, "classrooms", classId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Casting data ke tipe Classroom lokal
          const classroom = { id: docSnap.id, ...data } as Classroom;
          setClassData(classroom);
          
          // C. Tentukan Peran Guru & Konteks Mapel
          if (classroom.teacherId === user.uid) {
             setTeacherRole('homeroom'); // Wali Kelas = Dewa (Bisa lihat semua)
          } else {
             // Cek di jadwal, guru ini mengajar apa di kelas ini?
             const scheduleRef = collection(db, 'artifacts', currentAppId, 'public', 'data', 'schedules');
             const qSchedule = query(
                scheduleRef, 
                where("classId", "==", classId),
                where("teacherId", "==", user.uid)
             );
             const scheduleSnap = await getDocs(qSchedule);
             
             if (!scheduleSnap.empty) {
                const sData = scheduleSnap.docs[0].data();
                setTeacherRole('subject');
                setMySubject({ id: sData.subjectId, name: sData.subjectName });
             } else {
                // Guru tidak terdaftar di kelas ini (Harusnya tidak bisa akses, tapi kita biarkan view only)
                setTeacherRole('subject');
             }
          }

          // D. Fetch School Type untuk UI Adaptif
          if (classroom.schoolId) {
             const schoolDoc = await getDoc(doc(db, "schools", classroom.schoolId));
             if (schoolDoc.exists()) {
                setSchoolType(schoolDoc.data().level || 'sd');
             }
          }

          // E. Fetch Detail Murid
          if (data.students && data.students.length > 0) {
            const studentPromises = data.students.map(async (uid: string) => {
               const userSnap = await getDoc(doc(db, "users", uid));
               if (userSnap.exists()) {
                 const uData = userSnap.data();
                 return { 
                   uid: userSnap.id, 
                   displayName: uData.displayName,
                   email: uData.email,
                   photoURL: uData.photoURL,
                   xp: uData.xp ?? uData.gamification?.xp ?? 0,
                   level: uData.level ?? uData.gamification?.level ?? 1,
                   completedModules: uData.completedModules || [],
                   lastActiveModule: uData.lastActiveModule,
                   lastStudyTimestamp: uData.lastStudyTimestamp
                 } as StudentData;
               }
               return null;
            });
            const studentsData = await Promise.all(studentPromises);
            setStudents(studentsData.filter((s): s is StudentData => s !== null));
          }
        } else {
          alert("Kelas tidak ditemukan!");
          router.push("/teacher");
        }
      } catch (error) {
        console.error("Error init data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [classId, router]);

  // --- 2. REALTIME LISTENERS (MATERIALS & ASSIGNMENTS) ---
  useEffect(() => {
    if (!classId) return;

    // D. Real-time Listener: MATERI
    const materialsRef = collection(db, "classrooms", classId, "materials");
    // const qMat = query(materialsRef, orderBy("createdAt", "desc")); // Fetch All dulu, filter di client
    const unsubMat = onSnapshot(materialsRef, (snapshot) => {
      const mats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MaterialData[];
      
      // Filter Logic:
      // Jika Wali Kelas -> Lihat Semua
      // Jika Guru Mapel -> Lihat Materi Mapel Sendiri
      // (Untuk sementara kita fetch semua, filtering tampilan ada di render)
      setMaterials(mats.sort((a:any, b:any) => b.createdAt - a.createdAt));
    });

    // E. Real-time Listener: TUGAS
    const assignmentsRef = collection(db, "classrooms", classId, "assignments");
    const unsubAss = onSnapshot(assignmentsRef, (snapshot) => {
      const asses = snapshot.docs.map(doc => ({ id: doc.id, status: "active", ...doc.data() })) as AssignmentData[];
      setAssignments(asses.sort((a:any, b:any) => b.createdAt - a.createdAt));
    });

    return () => {
      unsubMat();
      unsubAss();
    };
  }, [classId]); // Dependencies minimal agar tidak re-subscribe terus

  // --- 3. ACTIONS / HANDLERS ---
  
  const handleCreateContent = async (data: any) => {
    setIsUploading(true);
    try {
      const collectionName = data.category === "assignment" ? "assignments" : "materials";
      const { category, file, ...basePayload } = data;
      
      const payload: any = { ...basePayload };

      // Tagging Subject ID (Critical for Context)
      if (teacherRole === 'subject' && mySubject) {
         payload.subjectId = mySubject.id;
         payload.subjectName = mySubject.name;
      }
      payload.createdBy = currentUser?.uid;

      // 1. Upload File
      if (file) {
         try {
            const uniqueName = `${Date.now()}_${file.name}`;
            const storageRef = ref(storage, `classrooms/${classId}/uploads/${uniqueName}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            payload.url = downloadUrl;
         } catch (uploadError) {
             console.error("Upload failed", uploadError);
             alert("Gagal mengupload file.");
             setIsUploading(false);
             return;
         }
      }

      // 2. Normalisasi
      if (payload.type === 'video' || payload.type === 'link') {
         payload.url = payload.content; 
         delete payload.content;
      }

      // 3. Simpan
      const docRef = await addDoc(collection(db, "classrooms", classId, collectionName), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      
      setIsUploadModalOpen(false);
      
      if (category === "assignment") {
        router.push(`/teacher/class/${classId}/assignment/${docRef.id}`);
      }

    } catch (error) {
      console.error("Gagal buat konten:", error);
      alert("Terjadi kesalahan.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (confirm("Hapus materi ini?")) {
      await deleteDoc(doc(db, "classrooms", classId, "materials", materialId));
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (confirm("Hapus tugas ini?")) {
      await deleteDoc(doc(db, "classrooms", classId, "assignments", assignmentId));
    }
  };

  const handleCopyCode = () => {
    if (classData?.code) {
        navigator.clipboard.writeText(classData.code);
        alert("Kode kelas disalin!");
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    if(confirm(`Keluarkan ${schoolType === 'uni' ? 'mahasiswa' : 'murid'} ini dari kelas?`)) {
      alert("Fitur segera aktif!");
    }
  };

  const averageXP = students.length > 0 
    ? Math.round(students.reduce((acc, curr) => acc + (curr.xp || 0), 0) / students.length)
    : 0;

  // --- FILTERED DATA (CONTEXT AWARE) ---
  // Jika Wali Kelas -> Tampilkan Semua
  // Jika Guru Mapel -> Tampilkan hanya milik Mapel dia
  const filteredMaterials = teacherRole === 'homeroom' 
    ? materials 
    : materials.filter(m => !m.subjectId || m.subjectId === mySubject?.id);

  const filteredAssignments = teacherRole === 'homeroom'
    ? assignments
    : assignments.filter(a => !a.subjectId || a.subjectId === mySubject?.id);

  // --- UI LABELS ---
  const getStudentLabel = () => schoolType === 'uni' ? 'Mahasiswa' : 'Siswa';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-600">
        <Loader2 className="animate-spin w-8 h-8 mr-2"/> 
        <span>Memuat Kelas...</span>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-40">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <LayoutDashboard size={18} />
             </div>
             Guru<span className="text-slate-900">App</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <SidebarItem 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard Kelas" 
          />
          <SidebarItem 
            active={activeTab === "attendance"} 
            onClick={() => setActiveTab("attendance")} 
            icon={<CalendarCheck size={20} />} 
            label="Presensi" 
          />
          <SidebarItem 
            active={activeTab === "students"} 
            onClick={() => setActiveTab("students")} 
            icon={<Users size={20} />} 
            label={`Daftar ${getStudentLabel()}`} 
          />
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Akademik {mySubject ? `(${mySubject.name})` : ''}
          </div>
          <SidebarItem 
            active={activeTab === "materials"} 
            onClick={() => setActiveTab("materials")} 
            icon={<BookOpen size={20} />} 
            label="Materi Belajar" 
          />
          <SidebarItem 
            active={activeTab === "assignments"} 
            onClick={() => setActiveTab("assignments")} 
            icon={<ClipboardList size={20} />} 
            label="Tugas & Ujian" 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
              onClick={() => router.push("/teacher")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors px-4 py-2 text-sm font-medium w-full"
          >
            <ArrowLeft size={18} /> Kembali ke Menu
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* --- CLASS HEADER --- */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => router.push("/teacher")} className="md:hidden text-slate-500"><ArrowLeft size={20}/></button>
              
              <h1 className="text-2xl font-bold text-slate-900">{classData?.name}</h1>
              {classData?.gradeLevel && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                  {classData.gradeLevel}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
              {mySubject && (
                 <span className="flex items-center gap-1.5 text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">
                    <BookOpen size={14}/> 
                    Mapel Anda: {mySubject.name}
                 </span>
              )}
              
              <div className="flex items-center gap-2">
                <span className="opacity-70">Kode Kelas:</span>
                <button 
                  onClick={handleCopyCode}
                  className="font-mono bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold transition-colors text-xs"
                  title="Klik untuk salin"
                >
                  {classData?.code}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* --- DYNAMIC VIEW SWITCHER --- */}
        
        {activeTab === "dashboard" && (
          <DashboardView 
            classData={classData as BaseClassroom} // Explicit cast for DashboardView compatibility
            students={students}
            materials={filteredMaterials}
            averageXP={averageXP}
            onCopyCode={handleCopyCode}
            onChangeTab={(tab: any) => setActiveTab(tab)}
          />
        )}

        {activeTab === "attendance" && (
          <AttendanceView students={students} />
        )}

        {activeTab === "students" && (
          <StudentListView 
            students={students}
            totalModules={totalModules}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === "materials" && (
          <MaterialsView 
            materials={filteredMaterials}
            onOpenUploadModal={() => {
              setInitialModalTab("material");
              setIsUploadModalOpen(true);
            }}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}

        {activeTab === "assignments" && (
          <AssignmentsView 
             assignments={filteredAssignments}
             onOpenCreateModal={() => {
                setInitialModalTab("assignment");
                setIsUploadModalOpen(true);
             }}
             onDeleteAssignment={handleDeleteAssignment}
             onViewDetail={(assignmentId: string) => {
                router.push(`/teacher/class/${classId}/assignment/${assignmentId}`);
             }}
             onGradeAssignment={(assignmentId: string) => {
                router.push(`/teacher/class/${classId}/assignment/${assignmentId}/grade`);
             }}
          />
        )}

      </main>

      {/* --- MODAL KOMPONEN --- */}
      <UploadMaterialModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleCreateContent}
        isUploading={isUploading}
        initialTab={initialModalTab}
        {...({ subjectName: mySubject?.name } as any)} 
      />

    </div>
  );
}

// Sub-Component Kecil untuk Sidebar Item
function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all",
        active 
          ? "bg-blue-50 text-blue-700 font-bold shadow-sm" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {icon} {label}
    </button>
  );
}