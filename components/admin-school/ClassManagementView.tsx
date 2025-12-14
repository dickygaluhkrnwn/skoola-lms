"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Trash2, 
  BookOpen, 
  Users, 
  Loader2,
  MoreVertical,
  Copy,
  AlertCircle
} from "lucide-react";
import { collection, query, getDocs, deleteDoc, doc, where, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface Classroom {
  id: string;
  name: string; // Nama Kelas (e.g. "Matematika X-A")
  subject?: string; // Mapel
  className?: string; // Legacy field support
  teacherId: string;
  teacherName?: string; // Optional: Nama guru snapshot
  students?: string[]; // Array UID siswa
  schoolId?: string;
  code?: string; // Kode gabung kelas
  createdAt: any;
}

export default function ClassManagementView() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminSchoolId, setAdminSchoolId] = useState<string | null>(null);

  // 1. Init: Cari Sekolah Admin & Fetch Classes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        setLoading(true);
        // A. Cari Sekolah milik Admin ini
        const schoolQuery = query(
           collection(db, "schools"), 
           where("adminId", "==", user.uid)
        );
        const schoolSnap = await getDocs(schoolQuery);

        if (!schoolSnap.empty) {
           const sid = schoolSnap.docs[0].id;
           setAdminSchoolId(sid);
           await fetchClasses(sid);
        } else {
           setLoading(false);
        }
      } catch (err) {
        console.error("Error init class view:", err);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Classes Data
  const fetchClasses = async (schoolId: string) => {
    try {
      // Query classes by schoolId
      // Note: Jika 'schoolId' belum ada di dokumen classrooms lama, data tidak akan muncul.
      // Solusi masa depan: Update fitur "Buat Kelas" di sisi Guru untuk inject schoolId.
      const q = query(
        collection(db, "classrooms"), 
        where("schoolId", "==", schoolId)
      );
      
      const snapshot = await getDocs(q);
      const fetchedClasses: Classroom[] = [];
      
      snapshot.forEach((doc) => {
        fetchedClasses.push({ id: doc.id, ...doc.data() } as Classroom);
      });

      // Client-side sorting (Terbaru diatas)
      fetchedClasses.sort((a, b) => {
         const timeA = a.createdAt?.seconds || 0;
         const timeB = b.createdAt?.seconds || 0;
         return timeB - timeA;
      });

      setClasses(fetchedClasses);
    } catch (error) {
      console.error("Gagal mengambil data kelas:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Filter Logic
  const filteredClasses = classes.filter((cls) => {
    const q = searchQuery.toLowerCase();
    const name = cls.name || cls.className || "";
    return (
      name.toLowerCase().includes(q) || 
      (cls.subject && cls.subject.toLowerCase().includes(q)) ||
      (cls.teacherName && cls.teacherName.toLowerCase().includes(q))
    );
  });

  // Action: Delete Class
  const handleDeleteClass = async (classId: string) => {
    if (confirm("PERINGATAN: Menghapus kelas ini akan menghapus semua materi, tugas, dan nilai di dalamnya. Lanjutkan?")) {
      try {
        await deleteDoc(doc(db, "classrooms", classId));
        setClasses(classes.filter(c => c.id !== classId));
        alert("Kelas berhasil dihapus.");
      } catch (error) {
        console.error("Gagal hapus kelas:", error);
        alert("Gagal menghapus kelas.");
      }
    }
  };

  // Helper: Copy Code
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Kode kelas disalin: ${text}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Memuat data kelas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Kelas</h2>
          <p className="text-slate-500 text-sm">
             Pantau aktivitas belajar mengajar di sekolah Anda.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari kelas, mapel, atau guru..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-72"
            />
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {!adminSchoolId ? (
           <div className="p-12 text-center text-slate-400 flex flex-col items-center">
             <AlertCircle size={48} className="mb-4 text-slate-300" />
             <p className="font-bold text-slate-600">Sekolah Belum Dikonfigurasi</p>
           </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-600">Belum ada kelas aktif</p>
            <p className="text-sm mt-1 max-w-xs">
              Minta guru untuk membuat kelas baru. Pastikan akun guru sudah terhubung ke sekolah ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Informasi Kelas</th>
                  <th className="px-6 py-4">Guru Pengampu</th>
                  <th className="px-6 py-4">Statistik</th>
                  <th className="px-6 py-4">Kode Gabung</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                           <BookOpen size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-base">{cls.name || cls.className}</div>
                          <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">
                            {cls.subject || "Umum"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">
                        {cls.teacherName || "Guru Tidak Terdeteksi"}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        ID: {cls.teacherId.substring(0, 6)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        <span className="font-bold">{cls.students?.length || 0}</span> Siswa
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {cls.code ? (
                        <button 
                          onClick={() => copyToClipboard(cls.code || "")}
                          className="flex items-center gap-2 text-xs font-mono bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 text-slate-600"
                          title="Klik untuk menyalin"
                        >
                          {cls.code} <Copy size={12} />
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Tidak ada kode</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteClass(cls.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Hapus Kelas Paksa"
                      >
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
      
      {adminSchoolId && (
        <div className="text-xs text-slate-400 text-center">
          Menampilkan {filteredClasses.length} kelas aktif.
        </div>
      )}

    </div>
  );
}