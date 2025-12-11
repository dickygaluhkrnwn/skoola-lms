"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Users, BookOpen, Settings, LogOut, Copy, School, Loader2, 
  GraduationCap, Palette, MessageSquare, Hash
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase"; 
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/lib/types/user.types";
import { Classroom } from "@/lib/types/course.types"; 

// Opsi Kategori Mata Pelajaran & Jenjang (Sama seperti sebelumnya)
const SUBJECT_CATEGORIES = [
  "Matematika", "IPA (Sains)", "IPS (Sosial)", "Bahasa Indonesia", 
  "Bahasa Inggris", "Seni Budaya", "TIK / Coding", "Pendidikan Agama", 
  "Olah Raga", "Umum / Lainnya"
];

const GRADE_LEVELS = [
  { id: 'sd', label: 'SD (Sekolah Dasar)' },
  { id: 'smp', label: 'SMP (Sekolah Menengah)' },
  { id: 'sma', label: 'SMA / SMK' },
  { id: 'uni', label: 'Universitas / Kuliah' },
  { id: 'umum', label: 'Umum' },
];

export default function TeacherClient() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"classes" | "community">("classes");

  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isForumModalOpen, setIsForumModalOpen] = useState(false);
  
  // Form Buat Kelas
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [newCategory, setNewCategory] = useState(SUBJECT_CATEGORIES[0]);
  const [newLevel, setNewLevel] = useState("sd");
  
  // Form Buat Forum
  const [newForumName, setNewForumName] = useState("");
  const [newForumType, setNewForumType] = useState<"school" | "major">("school");

  const [isCreating, setIsCreating] = useState(false);

  // Load Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          if (userData.role !== "teacher") {
            router.push("/learn");
            return;
          }
          setUserProfile(userData);
        }

        const q = query(collection(db, "classrooms"), where("teacherId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const classes: Classroom[] = [];
        querySnapshot.forEach((doc) => {
          classes.push({ id: doc.id, ...doc.data() } as Classroom);
        });
        setClassrooms(classes);

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

  const generateClassCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // --- CREATE CLASS ---
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      const code = generateClassCode();
      const newClass: Omit<Classroom, 'id'> = {
        name: newClassName,
        description: newClassDesc,
        code: code,
        teacherId: user.uid,
        teacherName: userProfile?.displayName || "Guru",
        studentCount: 0,
        createdAt: new Date().toISOString(),
        category: newCategory,
        gradeLevel: newLevel as any,
        students: []
      };

      const docRef = await addDoc(collection(db, "classrooms"), newClass);
      
      // Auto-create Forum Channel for this Class (Opsional, tapi bagus untuk integrasi)
      // await addDoc(collection(db, "channels"), { ... }); 

      setClassrooms([...classrooms, { id: docRef.id, ...newClass } as Classroom]);
      
      setIsClassModalOpen(false);
      setNewClassName("");
      setNewClassDesc("");
      alert(`Kelas berhasil dibuat! Kode: ${code}`);
    } catch (err) {
      console.error("Gagal buat kelas:", err);
      alert("Terjadi kesalahan.");
    } finally {
      setIsCreating(false);
    }
  };

  // --- CREATE FORUM CHANNEL ---
  const handleCreateForum = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
        // Kita simpan ke koleksi 'channels' atau bisa langsung dipanggil di SocialClient
        // Untuk MVP kita simpan di root 'groups' atau struktur khusus
        // Di sini kita simulasi saja atau simpan ke 'groups' dengan tipe khusus
        await addDoc(collection(db, "groups"), { // Menggunakan 'groups' sebagai wadah generik channel
            name: newForumName,
            type: newForumType, // 'school' atau 'major'
            createdBy: auth.currentUser?.uid,
            createdAt: serverTimestamp(),
            members: [], // Public channel usually logic-based, but field required
            isOfficial: true // Penanda ini channel resmi buatan guru
        });
        
        setIsForumModalOpen(false);
        setNewForumName("");
        alert("Forum diskusi berhasil dibuat!");
    } catch (err) {
        console.error("Gagal buat forum:", err);
    } finally {
        setIsCreating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Kode kelas disalin!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 text-blue-600">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        <span>Memuat Ruang Guru...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      
      {/* SIDEBAR GURU */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 z-50">
        <div className="p-6">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-sm font-bold text-blue-600 tracking-wide">RUANG GURU</span>
           </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
           <SidebarItem 
             active={activeTab === "classes"} 
             onClick={() => setActiveTab("classes")} 
             icon={<School size={20} />} 
             label="Manajemen Kelas" 
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

        <div className="p-4 border-t border-slate-100">
           <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="Guru" className="w-full h-full object-cover" />
                ) : (
                    userProfile?.displayName?.[0] || "G"
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{userProfile?.displayName}</p>
                <p className="text-xs text-slate-500 truncate">Guru</p>
              </div>
           </div>
           <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg w-full text-sm font-medium transition-all">
             <LogOut size={18} /> Keluar
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        
        {/* VIEW: CLASS MANAGEMENT */}
        {activeTab === "classes" && (
            <>
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Daftar Kelas</h1>
                    <p className="text-slate-500 text-sm">Kelola murid dan materi pembelajaran Anda di sini.</p>
                </div>
                <Button onClick={() => setIsClassModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-200">
                    <Plus size={20} /> Buat Kelas Baru
                </Button>
                </header>

                {/* CLASS GRID */}
                {classrooms.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                    <School size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">Belum ada kelas</h3>
                    <p className="text-slate-500 text-sm mb-6">Mulai mengajar dengan membuat kelas pertama Anda.</p>
                    <Button variant="outline" onClick={() => setIsClassModalOpen(true)}>Buat Kelas Sekarang</Button>
                </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classrooms.map((cls) => (
                    <motion.div 
                        key={cls.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                        onClick={() => router.push(`/teacher/class/${cls.id}`)}
                    >
                        <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                            {cls.category}
                        </div>

                        <div className="flex justify-between items-start mb-4 mt-2">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                            <BookOpen size={24} />
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); copyCode(cls.code); }}
                            className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-mono font-medium text-slate-600 transition-colors mr-16"
                            title="Salin Kode Kelas"
                        >
                            {cls.code} <Copy size={12} />
                        </button>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors truncate pr-4">{cls.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{cls.description || "Tidak ada deskripsi."}</p>
                        
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-4 border-t border-slate-100">
                        <span className="flex items-center gap-1"><Users size={14} /> {cls.studentCount} Murid</span>
                        <span className="flex items-center gap-1 uppercase"><GraduationCap size={14} /> {cls.gradeLevel}</span>
                        </div>
                    </motion.div>
                    ))}
                </div>
                )}
            </>
        )}

        {/* VIEW: COMMUNITY MANAGEMENT */}
        {activeTab === "community" && (
            <>
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Forum Komunitas</h1>
                    <p className="text-slate-500 text-sm">Buat ruang diskusi untuk sekolah atau jurusan.</p>
                </div>
                <Button onClick={() => setIsForumModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-lg shadow-purple-200">
                    <Plus size={20} /> Buat Forum Baru
                </Button>
                </header>

                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <MessageSquare size={48} className="mx-auto text-purple-200 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">Pusat Kontrol Forum</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                        Di sini Anda bisa membuat channel diskusi resmi (Sekolah/Jurusan) yang akan muncul di menu sosial semua siswa.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                        <div className="p-4 border rounded-xl bg-slate-50">
                            <h4 className="font-bold flex items-center gap-2"><School size={16}/> Forum Sekolah</h4>
                            <p className="text-xs text-slate-500 mt-1">Untuk pengumuman global dan diskusi umum satu sekolah.</p>
                        </div>
                        <div className="p-4 border rounded-xl bg-slate-50">
                            <h4 className="font-bold flex items-center gap-2"><Hash size={16}/> Forum Jurusan</h4>
                            <p className="text-xs text-slate-500 mt-1">Untuk diskusi spesifik bidang studi (IPA, IPS, Bahasa, dll).</p>
                        </div>
                    </div>
                </div>
            </>
        )}

      </main>

      {/* MODAL BUAT KELAS */}
      <AnimatePresence>
        {isClassModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsClassModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg relative z-10 shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
                <School className="text-blue-600" /> Buat Kelas Baru
              </h2>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Nama Kelas</label>
                  <input 
                    required autoFocus placeholder="Contoh: Matematika Diskrit A" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium"
                    value={newClassName} onChange={e => setNewClassName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-bold text-slate-700 block mb-1">Mata Pelajaran</label>
                        <select 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none appearance-none bg-white"
                            value={newCategory} onChange={e => setNewCategory(e.target.value)}
                        >
                            {SUBJECT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-700 block mb-1">Jenjang</label>
                        <select 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none appearance-none bg-white"
                            value={newLevel} onChange={e => setNewLevel(e.target.value)}
                        >
                            {GRADE_LEVELS.map(lvl => <option key={lvl.id} value={lvl.id}>{lvl.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Deskripsi Singkat</label>
                  <textarea 
                    placeholder="Jelaskan secara singkat..." 
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 outline-none min-h-[80px]"
                    value={newClassDesc} onChange={e => setNewClassDesc(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsClassModalOpen(false)} className="flex-1 rounded-xl">Batal</Button>
                  <Button type="submit" disabled={isCreating} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200">
                    {isCreating ? "Membuat..." : "Buat Kelas Sekarang"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL BUAT FORUM */}
      <AnimatePresence>
        {isForumModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsForumModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
                <MessageSquare className="text-purple-600" /> Buat Forum Diskusi
              </h2>
              <form onSubmit={handleCreateForum} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Nama Forum</label>
                  <input 
                    required autoFocus placeholder="Contoh: Info Akademik, Klub Robotik..." 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all font-medium"
                    value={newForumName} onChange={e => setNewForumName(e.target.value)}
                  />
                </div>
                <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Tipe Forum</label>
                    <div className="flex gap-2">
                        <button 
                           type="button"
                           onClick={() => setNewForumType("school")}
                           className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 ${newForumType === 'school' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500'}`}
                        >
                           Tingkat Sekolah
                        </button>
                        <button 
                           type="button"
                           onClick={() => setNewForumType("major")}
                           className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 ${newForumType === 'major' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500'}`}
                        >
                           Tingkat Jurusan
                        </button>
                    </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsForumModalOpen(false)} className="flex-1 rounded-xl">Batal</Button>
                  <Button type="submit" disabled={isCreating} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-200">
                    {isCreating ? "Membuat..." : "Buat Forum"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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