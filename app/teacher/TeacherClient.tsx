"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Users, BookOpen, Settings, LogOut, Copy, School, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase"; 
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/lib/types/user.types"; // Pakai tipe data yang sudah ada

// Tipe Data Kelas
interface Classroom {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  description: string;
  teacherId: string;
  teacherName: string;
}

export default function TeacherClient() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State Form Buat Kelas
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        // 1. Ambil Profil Guru
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          if (userData.role !== "teacher") {
            router.push("/learn"); // Redirect murid yang nyasar
            return;
          }
          setUserProfile(userData);
        }

        // 2. Ambil Daftar Kelas Milik Guru Ini
        const q = query(collection(db, "classrooms"), where("teacherId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const classes: Classroom[] = [];
        querySnapshot.forEach((doc) => {
          classes.push({ id: doc.id, ...doc.data() } as Classroom);
        });
        setClassrooms(classes);

      } catch (err) {
        console.error("Gagal ambil kelas:", err);
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

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      const code = generateClassCode();
      const newClass = {
        name: newClassName,
        description: newClassDesc,
        code: code,
        teacherId: user.uid,
        teacherName: userProfile?.displayName || "Guru",
        studentCount: 0,
        createdAt: new Date().toISOString()
      };

      // Simpan ke Firestore
      const docRef = await addDoc(collection(db, "classrooms"), newClass);
      
      // Update State Lokal
      setClassrooms([...classrooms, { id: docRef.id, ...newClass } as Classroom]);
      
      setIsModalOpen(false);
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
           <SidebarItem active icon={<School size={20} />} label="Kelas Saya" onClick={() => {}} />
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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daftar Kelas</h1>
            <p className="text-slate-500 text-sm">Kelola murid dan materi pembelajaran Anda di sini.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-200">
            <Plus size={20} /> Buat Kelas Baru
          </Button>
        </header>

        {/* CLASS GRID */}
        {classrooms.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <School size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">Belum ada kelas</h3>
            <p className="text-slate-500 text-sm mb-6">Mulai mengajar dengan membuat kelas pertama Anda.</p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>Buat Kelas Sekarang</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((cls) => (
              <motion.div 
                key={cls.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                onClick={() => router.push(`/teacher/class/${cls.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <BookOpen size={24} />
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); copyCode(cls.code); }}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-mono font-medium text-slate-600 transition-colors"
                    title="Salin Kode Kelas"
                  >
                    {cls.code} <Copy size={12} />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{cls.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{cls.description || "Tidak ada deskripsi."}</p>
                
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-1"><Users size={14} /> {cls.studentCount} Murid</span>
                  <span className="flex items-center gap-1"><BookOpen size={14} /> 0 Materi</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL BUAT KELAS */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-4 text-slate-900">Buat Kelas Baru</h2>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Nama Kelas</label>
                  <input 
                    required 
                    autoFocus
                    placeholder="Contoh: Bahasa Indonesia 5 SD" 
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Deskripsi Singkat</label>
                  <textarea 
                    placeholder="Materi tentang pantun dan puisi..." 
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all min-h-[80px]"
                    value={newClassDesc}
                    onChange={e => setNewClassDesc(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Batal</Button>
                  <Button type="submit" disabled={isCreating} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    {isCreating ? "Membuat..." : "Buat Kelas"}
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