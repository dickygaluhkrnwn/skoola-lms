"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Users, BookOpen, Copy, Plus, 
  Video, FileText, Trash2, Link as LinkIcon, Loader2 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, serverTimestamp, Timestamp 
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- TIPE DATA ---
interface ClassData {
  id: string;
  name: string;
  description: string;
  code: string;
  students: string[]; // Array of UID
}

interface StudentData {
  uid: string;
  displayName: string;
  email: string;
  xp?: number;
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

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "materials">("students");
  const [loading, setLoading] = useState(true);

  // Data Real dari Firebase
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);

  // State Modal Upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [matTitle, setMatTitle] = useState("");
  const [matType, setMatType] = useState<"video" | "text">("video");
  const [matContent, setMatContent] = useState(""); 

  // 1. FETCH DATA KELAS & STUDENTS
  useEffect(() => {
    if (!classId) return;

    const fetchClassInfo = async () => {
      try {
        const docRef = doc(db, "classrooms", classId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setClassData({ id: docSnap.id, ...data } as ClassData);
          
          // Fetch Students Data
          if (data.students && data.students.length > 0) {
            const studentPromises = data.students.map(async (uid: string) => {
               const userSnap = await getDoc(doc(db, "users", uid));
               return userSnap.exists() ? { uid: userSnap.id, ...userSnap.data() } : null;
            });
            const studentsData = await Promise.all(studentPromises);
            setStudents(studentsData.filter((s): s is StudentData => s !== null));
          }
        } else {
          alert("Kelas tidak ditemukan!");
          router.push("/teacher");
        }
      } catch (error) {
        console.error("Error fetch class:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassInfo();

    // Real-time Listener untuk Materi
    const materialsRef = collection(db, "classrooms", classId, "materials");
    const q = query(materialsRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MaterialData[];
      setMaterials(mats);
    });

    return () => unsubscribe();
  }, [classId, router]);

  // 2. FUNGSI UPLOAD MATERI
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      await addDoc(collection(db, "classrooms", classId, "materials"), {
        title: matTitle,
        type: matType,
        content: matContent,
        createdAt: serverTimestamp(),
      });

      setIsUploadModalOpen(false);
      setMatTitle("");
      setMatContent("");
      alert("Materi berhasil ditambahkan!");
    } catch (error) {
      console.error("Gagal upload:", error);
      alert("Gagal menambahkan materi.");
    } finally {
      setIsUploading(false);
    }
  };

  // 3. HAPUS MATERI
  const handleDeleteMaterial = async (materialId: string) => {
    if (confirm("Hapus materi ini secara permanen?")) {
      await deleteDoc(doc(db, "classrooms", classId, "materials", materialId));
    }
  };

  const copyCode = () => {
    if (classData?.code) {
        navigator.clipboard.writeText(classData.code);
        alert("Kode kelas disalin!");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 text-blue-600">
        <Loader2 className="animate-spin w-8 h-8 mr-2"/> 
        <span>Memuat Kelas...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      
      {/* HEADER NAV */}
      <div className="max-w-4xl mx-auto mb-8">
        <button 
          onClick={() => router.push("/teacher")} 
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-4 transition-colors font-medium"
        >
          <ArrowLeft size={18} /> Kembali ke Dashboard
        </button>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{classData?.name}</h1>
            <p className="text-slate-500">{classData?.description}</p>
          </div>
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors" onClick={copyCode}>
            <div className="text-right">
              <p className="text-[10px] uppercase text-blue-400 font-bold tracking-wider">Kode Kelas</p>
              <p className="text-xl font-mono font-bold text-blue-700">{classData?.code}</p>
            </div>
            <Copy size={18} className="text-blue-600"/>
          </div>
        </div>
      </div>

      {/* TABS & CONTENT */}
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-6 w-fit">
          <button 
            onClick={() => setActiveTab("students")}
            className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === "students" ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Daftar Murid
          </button>
          <button 
            onClick={() => setActiveTab("materials")}
            className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === "materials" ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Materi Belajar
          </button>
        </div>

        {/* TAB: DAFTAR MURID */}
        {activeTab === "students" && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {students.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Belum ada murid yang bergabung.</p>
                <p className="text-sm text-slate-400">Bagikan kode <span className="font-mono font-bold text-slate-600">{classData?.code}</span> kepada murid Anda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nama Murid</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Progress</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.uid} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">{student.displayName}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{student.email}</td>
                        <td className="px-6 py-4">
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
                            {student.xp || 0} XP
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-red-500 transition-colors" title="Keluarkan Murid">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: MATERI BELAJAR */}
        {activeTab === "materials" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Daftar Materi</h3>
              <Button onClick={() => setIsUploadModalOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus size={16} /> Tambah Materi
              </Button>
            </div>

            {materials.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-400 text-sm">Belum ada materi yang diupload.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                {materials.map((item) => (
                    <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-all"
                    >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === "video" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
                        {item.type === "video" ? <Video size={20} /> : <FileText size={20} />}
                        </div>
                        <div>
                        <p className="font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-400">
                            {item.type === 'video' ? 'Video YouTube' : 'Teks Bacaan'} • {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Baru saja'}
                        </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => window.open(item.content, "_blank")} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                            <LinkIcon size={18} />
                        </button>
                        <button onClick={() => handleDeleteMaterial(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                    </motion.div>
                ))}
                </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL UPLOAD MATERI */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-4 text-slate-900">Tambah Materi Baru</h2>
              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Judul Materi</label>
                  <input 
                    required 
                    placeholder="Contoh: Video Pengenalan Pantun" 
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    value={matTitle}
                    onChange={e => setMatTitle(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div 
                        onClick={() => setMatType("video")}
                        className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${matType === "video" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}
                    >
                        <Video size={20} />
                        <span className="text-xs font-bold">Video YouTube</span>
                    </div>
                    <div 
                        onClick={() => setMatType("text")}
                        className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${matType === "text" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}
                    >
                        <FileText size={20} />
                        <span className="text-xs font-bold">Artikel / Teks</span>
                    </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    {matType === "video" ? "Link YouTube" : "Isi Materi / Link Dokumen"}
                  </label>
                  {matType === "video" ? (
                      <input 
                        required 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        value={matContent}
                        onChange={e => setMatContent(e.target.value)}
                      />
                  ) : (
                      <textarea 
                        required 
                        placeholder="Tulis materi di sini..." 
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all min-h-[100px]"
                        value={matContent}
                        onChange={e => setMatContent(e.target.value)}
                      />
                  )}
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)} className="flex-1">Batal</Button>
                  <Button type="submit" disabled={isUploading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    {isUploading ? "Menyimpan..." : "Simpan Materi"}
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