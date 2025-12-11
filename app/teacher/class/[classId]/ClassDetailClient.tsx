"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Users, BookOpen, LayoutDashboard, 
  CalendarCheck, Loader2, ClipboardList, GraduationCap, Palette
} from "lucide-react";
import { db } from "../../../../lib/firebase";
import { 
  doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, serverTimestamp, Timestamp, getCountFromServer 
} from "firebase/firestore";
import { cn } from "../../../../lib/utils";

// --- IMPORT TIPE DATA SENTRAL ---
import { Classroom } from "../../../../lib/types/course.types";
import { UserProfile } from "../../../../lib/types/user.types";

// --- IMPORT KOMPONEN PECAHAN ---
import DashboardView from "../../../../components/teacher/class-detail/DashboardView";
import AttendanceView from "../../../../components/teacher/class-detail/AttendanceView";
import StudentListView from "../../../../components/teacher/class-detail/StudentListView";
import MaterialsView from "../../../../components/teacher/class-detail/MaterialsView";
import AssignmentsView, { AssignmentData } from "../../../../components/teacher/class-detail/AssignmentsView";
import UploadMaterialModal from "../../../../components/teacher/class-detail/UploadMaterialModal";

// --- TIPE DATA LOKAL (YANG BELUM ADA DI CENTRAL) ---
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

interface MaterialData {
  id: string;
  title: string;
  type: "video" | "text";
  content: string;
  createdAt: Timestamp;
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

    const initData = async () => {
      try {
        // A. Hitung Total Modul Global (untuk progress bar)
        const coll = collection(db, "global_modules");
        const snapshot = await getCountFromServer(coll);
        setTotalModules(snapshot.data().count || 10);

        // B. Fetch Data Kelas
        const docRef = doc(db, "classrooms", classId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Menggunakan tipe Classroom yang sudah diupdate (support category & gradeLevel)
          setClassData({ id: docSnap.id, ...data } as Classroom);
          
          // C. Fetch Detail Murid
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
    };

    initData();

    // D. Real-time Listener: MATERI
    const materialsRef = collection(db, "classrooms", classId, "materials");
    const qMat = query(materialsRef, orderBy("createdAt", "desc"));
    const unsubMat = onSnapshot(qMat, (snapshot) => {
      const mats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MaterialData[];
      setMaterials(mats);
    });

    // E. Real-time Listener: TUGAS (Assignments)
    const assignmentsRef = collection(db, "classrooms", classId, "assignments");
    const qAss = query(assignmentsRef, orderBy("createdAt", "desc"));
    const unsubAss = onSnapshot(qAss, (snapshot) => {
      const asses = snapshot.docs.map(doc => ({ id: doc.id, status: "active", ...doc.data() })) as AssignmentData[];
      setAssignments(asses);
    });

    return () => {
      unsubMat();
      unsubAss();
    };
  }, [classId, router]);

  // --- 2. ACTIONS / HANDLERS ---
  
  // Create Content (Materi atau Tugas)
  const handleCreateContent = async (data: any) => {
    setIsUploading(true);
    try {
      // Tentukan koleksi tujuan berdasarkan kategori
      const collectionName = data.category === "assignment" ? "assignments" : "materials";
      
      // Hapus field 'category' sebelum simpan ke DB agar bersih
      const { category, ...payload } = data;

      // 1. SIMPAN KE FIRESTORE & TANGKAP REF DOKUMEN
      const docRef = await addDoc(collection(db, "classrooms", classId, collectionName), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      
      setIsUploadModalOpen(false);
      
      // 2. LOGIKA REDIRECT
      if (category === "assignment") {
        // Redirect ke halaman Assignment Builder untuk input soal
        router.push(`/teacher/class/${classId}/assignment/${docRef.id}`);
      } else {
        alert("Materi berhasil ditambahkan!");
      }

    } catch (error) {
      console.error("Gagal buat konten:", error);
      alert("Terjadi kesalahan.");
    } finally {
      setIsUploading(false);
    }
  };

  // Hapus Materi
  const handleDeleteMaterial = async (materialId: string) => {
    if (confirm("Hapus materi ini?")) {
      await deleteDoc(doc(db, "classrooms", classId, "materials", materialId));
    }
  };

  // Hapus Tugas
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (confirm("Hapus tugas ini? Semua pengumpulan siswa akan hilang.")) {
      await deleteDoc(doc(db, "classrooms", classId, "assignments", assignmentId));
    }
  };

  // Salin Kode Kelas
  const handleCopyCode = () => {
    if (classData?.code) {
        navigator.clipboard.writeText(classData.code);
        alert("Kode kelas disalin!");
    }
  };

  // Hapus Murid (Placeholder)
  const handleDeleteStudent = (studentId: string) => {
    if(confirm("Keluarkan murid ini dari kelas?")) {
      alert("Fitur segera aktif!");
    }
  };

  // Helper Stats
  const averageXP = students.length > 0 
    ? Math.round(students.reduce((acc, curr) => acc + (curr.xp || 0), 0) / students.length)
    : 0;

  // --- RENDER UTAMA ---
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
            label="Daftar Murid" 
          />
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Akademik
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
            <ArrowLeft size={18} /> Keluar Kelas
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* --- CLASS HEADER (NEW: Persisten di semua tab) --- */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {/* Back Button for Mobile */}
              <button onClick={() => router.push("/teacher")} className="md:hidden text-slate-500"><ArrowLeft size={20}/></button>
              
              <h1 className="text-2xl font-bold text-slate-900">{classData?.name}</h1>
              {classData?.gradeLevel && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                  {classData.gradeLevel}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Palette size={14} className="text-slate-400"/> 
                {classData?.category || 'Umum'}
              </span>
              <span className="hidden md:inline text-slate-300">•</span>
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
            classData={classData}
            students={students}
            materials={materials}
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
            materials={materials}
            onOpenUploadModal={() => {
              setInitialModalTab("material");
              setIsUploadModalOpen(true);
            }}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}

        {activeTab === "assignments" && (
          <AssignmentsView 
             assignments={assignments}
             onOpenCreateModal={() => {
                setInitialModalTab("assignment");
                setIsUploadModalOpen(true);
             }}
             onDeleteAssignment={handleDeleteAssignment}
             onViewDetail={(assignmentId) => {
                router.push(`/teacher/class/${classId}/assignment/${assignmentId}`);
             }}
             onGradeAssignment={(assignmentId) => {
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