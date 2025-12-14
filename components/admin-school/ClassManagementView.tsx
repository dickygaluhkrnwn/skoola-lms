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
  AlertCircle,
  Plus,
  Edit,
  GraduationCap,
  X,
  School
} from "lucide-react";
import { 
  collection, 
  query, 
  getDocs, 
  deleteDoc, 
  doc, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";

// --- TYPES ---

interface Classroom {
  id: string;
  name: string; // Nama Kelas (e.g. "X-A Matematika" atau "Kelas 1 SD")
  description?: string;
  teacherId: string; // ID Wali Kelas
  teacherName: string; 
  gradeLevel: string; // 'SD' | 'SMP' | 'SMA' | 'University' (PENTING untuk Generator Jadwal)
  specificLevel?: string; // Tambahan: Tingkat spesifik (1, 2, 10, 11, Semester 1, dll)
  program?: string; // Tambahan: Jurusan/Prodi (IPA, IPS, Teknik Informatika)
  students: string[]; // Array UID siswa
  schoolId: string;
  code: string; // Kode gabung kelas
  createdAt: any;
  studentCount?: number;
}

interface TeacherOption {
  uid: string;
  displayName: string;
  email: string;
}

// Konfigurasi Level Adaptif
const GRADE_OPTIONS = {
  sd: ["1", "2", "3", "4", "5", "6"],
  smp: ["7", "8", "9"],
  sma: ["10", "11", "12"],
  uni: ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"]
};

export default function ClassManagementView() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminSchoolId, setAdminSchoolId] = useState<string | null>(null);
  
  // State Adaptif Sekolah
  const [schoolType, setSchoolType] = useState<'sd' | 'smp' | 'sma' | 'uni' | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teacherId: "",
    specificLevel: "", // Dropdown tingkat (1, 2, 10...)
    program: "",       // Input Jurusan/Prodi
  });

  // 1. Init: Cari Sekolah Admin & Fetch Data
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
           const schoolDoc = schoolSnap.docs[0];
           const sid = schoolDoc.id;
           const sData = schoolDoc.data();
           
           setAdminSchoolId(sid);
           setSchoolType(sData.level || 'sd'); // Set tipe sekolah untuk adaptasi UI
           
           // Fetch Initial Data
           await Promise.all([
             fetchClasses(sid),
             fetchTeachers(sid)
           ]);
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
      const q = query(
        collection(db, "classrooms"), 
        where("schoolId", "==", schoolId)
      );
      
      const snapshot = await getDocs(q);
      const fetchedClasses: Classroom[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedClasses.push({ 
          id: doc.id, 
          ...data,
          studentCount: data.students?.length || 0 // Hitung jumlah siswa
        } as Classroom);
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
      // Pastikan loading dimatikan setelah fetch selesai (terutama jika ini dipanggil ulang)
      setLoading(false); 
    }
  };

  // 3. Fetch Teachers Data (Untuk Dropdown Wali Kelas)
  const fetchTeachers = async (schoolId: string) => {
    try {
      const q = query(
        collection(db, "users"),
        where("schoolId", "==", schoolId),
        where("role", "==", "teacher")
      );
      const snap = await getDocs(q);
      const fetchedTeachers = snap.docs.map(doc => ({
        uid: doc.id,
        displayName: doc.data().displayName || "Guru Tanpa Nama",
        email: doc.data().email
      }));
      setTeachers(fetchedTeachers);
    } catch (error) {
      console.error("Gagal load guru:", error);
    }
  };

  // 4. Handlers
  const handleOpenModal = (cls?: Classroom) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({
        name: cls.name,
        description: cls.description || "",
        teacherId: cls.teacherId,
        specificLevel: cls.specificLevel || "",
        program: cls.program || ""
      });
    } else {
      setEditingClass(null);
      // Reset form, set default level based on school type if possible
      const defaultLevel = schoolType && GRADE_OPTIONS[schoolType] ? GRADE_OPTIONS[schoolType][0] : "";
      setFormData({
        name: "",
        description: "",
        teacherId: "",
        specificLevel: defaultLevel,
        program: ""
      });
    }
    setIsModalOpen(true);
  };

  const generateClassCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSaveClass = async () => {
    if (!formData.name || !formData.teacherId || !adminSchoolId) {
      alert("Mohon lengkapi Nama Kelas dan Wali Kelas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTeacher = teachers.find(t => t.uid === formData.teacherId);
      
      // Tentukan gradeLevel generic (SD/SMP/SMA/Uni) berdasarkan schoolType yang aktif
      // Ini penting untuk kompatibilitas dengan generator jadwal
      const genericLevel = 
        schoolType === 'sd' ? 'SD' :
        schoolType === 'smp' ? 'SMP' :
        schoolType === 'sma' ? 'SMA' : 'University';

      const payload = {
        name: formData.name,
        description: formData.description,
        teacherId: formData.teacherId,
        teacherName: selectedTeacher?.displayName || "Unknown",
        gradeLevel: genericLevel, // Level umum untuk sistem
        specificLevel: formData.specificLevel, // Level spesifik (ex: "10")
        program: formData.program, // Jurusan/Prodi
        schoolId: adminSchoolId,
        updatedAt: serverTimestamp()
      };

      if (editingClass) {
        // Update
        await updateDoc(doc(db, "classrooms", editingClass.id), payload);
      } else {
        // Create
        await addDoc(collection(db, "classrooms"), {
          ...payload,
          students: [], // Init empty array
          code: generateClassCode(),
          createdAt: serverTimestamp()
        });
      }

      setIsModalOpen(false);
      // Fetch ulang agar list terupdate
      setLoading(true); 
      await fetchClasses(adminSchoolId); 
    } catch (error) {
      console.error("Error saving class:", error);
      alert("Gagal menyimpan kelas.");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (confirm("PERINGATAN: Menghapus kelas ini akan menghapus semua materi, tugas, dan nilai di dalamnya. Lanjutkan?")) {
      try {
        await deleteDoc(doc(db, "classrooms", classId));
        setClasses(classes.filter(c => c.id !== classId));
      } catch (error) {
        console.error("Gagal hapus kelas:", error);
        alert("Gagal menghapus kelas.");
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Kode kelas disalin: ${text}`);
  };

  // 5. Filter Logic
  const filteredClasses = classes.filter((cls) => {
    const q = searchQuery.toLowerCase();
    return (
      cls.name.toLowerCase().includes(q) || 
      cls.teacherName.toLowerCase().includes(q) ||
      cls.gradeLevel?.toLowerCase().includes(q) ||
      cls.program?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Memuat data kelas...</p>
      </div>
    );
  }

  // --- HELPER UNTUK LABEL UI ---
  const getLevelLabel = () => {
    if (schoolType === 'uni') return "Semester";
    return "Tingkat Kelas";
  };

  const getProgramLabel = () => {
    if (schoolType === 'uni') return "Program Studi (Prodi)";
    if (schoolType === 'sma') return "Jurusan (IPA/IPS/Lainnya)";
    return "Keterangan Tambahan"; // Untuk SD/SMP opsional
  };

  const getTeacherLabel = () => {
    if (schoolType === 'uni') return "Dosen Wali / PA";
    return "Wali Kelas";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Kelas</h2>
          <p className="text-slate-500 text-sm">
             Kelola kelas, rombel, dan anggota di {schoolType === 'uni' ? 'kampus' : 'sekolah'} Anda.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari kelas atau pengajar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
          
          <Button 
            onClick={() => handleOpenModal()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4 mr-2" /> Buat Kelas
          </Button>
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
              Buat kelas baru untuk memulai kegiatan belajar mengajar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Nama Kelas</th>
                  <th className="px-6 py-4">Tingkat & Program</th>
                  <th className="px-6 py-4">{getTeacherLabel()}</th>
                  <th className="px-6 py-4">Anggota</th>
                  <th className="px-6 py-4">Kode</th>
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
                          <div className="font-bold text-slate-800 text-base">{cls.name}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[150px]">
                            {cls.description || "Tidak ada deskripsi"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit px-2 py-0.5 rounded text-xs font-bold border ${
                          cls.gradeLevel === 'SD' ? 'bg-red-50 text-red-700 border-red-100' :
                          cls.gradeLevel === 'SMP' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          cls.gradeLevel === 'SMA' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {cls.specificLevel ? 
                            (schoolType === 'uni' ? cls.specificLevel : `Kelas ${cls.specificLevel}`) 
                            : (cls.gradeLevel || "Umum")
                          }
                        </span>
                        {cls.program && (
                          <span className="text-xs text-slate-500 font-medium">
                            {cls.program}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700 flex items-center gap-2">
                        <School size={14} className="text-slate-400"/>
                        {cls.teacherName || "Belum ditentukan"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        <span className="font-bold">{cls.studentCount || 0}</span> Siswa
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => copyToClipboard(cls.code)}
                        className="flex items-center gap-2 text-xs font-mono bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 text-slate-600"
                        title="Klik untuk menyalin"
                      >
                        {cls.code} <Copy size={12} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(cls)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                          title="Edit Kelas"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Hapus Kelas"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL CREATE / EDIT CLASS --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingClass ? "Edit Kelas" : "Buat Kelas Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nama Kelas */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Kelas / Rombel</label>
                <input 
                  type="text" 
                  placeholder={schoolType === 'uni' ? "Contoh: IF-01, TI-A" : "Contoh: X-A, 1B"}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Specific Level Dropdown (Adaptif) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{getLevelLabel()}</label>
                <select
                  value={formData.specificLevel}
                  onChange={(e) => setFormData({...formData, specificLevel: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Pilih Tingkat...</option>
                  {schoolType && GRADE_OPTIONS[schoolType]?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Program / Jurusan (Tampil jika SMA/Uni) */}
              {(schoolType === 'sma' || schoolType === 'uni') && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{getProgramLabel()}</label>
                  <input 
                    type="text" 
                    placeholder={schoolType === 'uni' ? "Teknik Informatika" : "IPA / IPS"}
                    value={formData.program}
                    onChange={(e) => setFormData({...formData, program: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Wali Kelas */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{getTeacherLabel()}</label>
                <select 
                  value={formData.teacherId}
                  onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Pilih {getTeacherLabel()}...</option>
                  {teachers.map((t) => (
                    <option key={t.uid} value={t.uid}>{t.displayName}</option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Belum ada data pengajar. Tambahkan di menu User.</p>
                )}
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi (Opsional)</label>
                <textarea 
                  placeholder="Keterangan tambahan..." 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                Batal
              </Button>
              <Button 
                onClick={handleSaveClass} 
                disabled={isSubmitting} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {adminSchoolId && (
        <div className="text-xs text-slate-400 text-center">
          Menampilkan {filteredClasses.length} kelas aktif.
        </div>
      )}

    </div>
  );
}