"use client";

import React, { useState, useEffect } from "react";
import { 
  School, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Save, 
  Loader2, 
  Image as ImageIcon,
  Key,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  doc 
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

// Interface untuk Tipe Data Settings
interface SchoolSettings {
  name: string;
  schoolCode: string; // Kode unik sekolah
  address: string;
  email: string;
  phone: string;
  website: string;
  academicYear: string;
  semester: "Ganjil" | "Genap";
  logoUrl?: string;
  level: 'sd' | 'smp' | 'sma' | 'uni'; // Tambahan level
  lessonDuration: number; // Durasi per jam pelajaran (menit) - NEW
}

const DEFAULT_SETTINGS: SchoolSettings = {
  name: "",
  schoolCode: "",
  address: "",
  email: "",
  phone: "",
  website: "",
  academicYear: "2024/2025",
  semester: "Ganjil",
  level: "sma",
  lessonDuration: 45 // Default SMA
};

export default function SettingsView() {
  const [formData, setFormData] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // State untuk Multi-Tenant
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schoolDocId, setSchoolDocId] = useState<string | null>(null); // ID Dokumen di Firestore
  
  // State untuk Validasi Kode
  const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // 1. Auth & Fetch Data Sekolah
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchSchoolData(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSchoolData = async (adminId: string) => {
    try {
      // Query ke collection 'schools' dimana adminId == current user
      const q = query(collection(db, "schools"), where("adminId", "==", adminId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Sekolah ditemukan
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        setSchoolDocId(docSnap.id);
        // Merge data with defaults to ensure new fields like lessonDuration exist
        setFormData({ ...DEFAULT_SETTINGS, ...data } as SchoolSettings);
        if (data.updatedAt) {
          setLastUpdated(data.updatedAt.toDate());
        }
      } else {
        // Belum ada sekolah, gunakan default & auto-generate kode awal
        setFormData(prev => ({...prev, schoolCode: generateRandomCode()}));
      }
    } catch (error) {
      console.error("Gagal mengambil data sekolah:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Generate Random Code
  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Tanpa I, O, 1, 0 biar tidak bingung
    let result = "SKL-";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Helper: Handle Generate Button
  const handleAutoGenerate = () => {
    const newCode = generateRandomCode();
    setFormData(prev => ({ ...prev, schoolCode: newCode }));
    setCodeStatus('idle'); // Reset status cek
  };

  // 2. Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Khusus School Code: Uppercase & Tanpa Spasi
    if (name === 'schoolCode') {
      const formattedCode = value.toUpperCase().replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, [name]: formattedCode }));
      setCodeStatus('idle'); // Reset validasi saat mengetik
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // SMART LEVEL HANDLER
  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = e.target.value as SchoolSettings['level'];
    let defaultDuration = 45;

    // Set default duration based on level
    switch(newLevel) {
      case 'sd': defaultDuration = 35; break;
      case 'smp': defaultDuration = 40; break;
      case 'sma': defaultDuration = 45; break;
      case 'uni': defaultDuration = 50; break; // SKS biasanya 50 menit
    }

    setFormData(prev => ({
      ...prev,
      level: newLevel,
      lessonDuration: defaultDuration
    }));
  };

  // 3. Cek Ketersediaan Kode
  const checkCodeAvailability = async (code: string) => {
    if (!code || code.length < 4) return false;
    setCodeStatus('checking');
    
    try {
      // Query cari sekolah LAIN yang punya kode sama
      const q = query(collection(db, "schools"), where("schoolCode", "==", code));
      const snapshot = await getDocs(q);

      // Valid jika kosong ATAU yang ketemu adalah dokumen kita sendiri
      if (snapshot.empty) {
        setCodeStatus('available');
        return true;
      } else {
        // Cek apakah itu dokumen kita sendiri
        const isMyDoc = schoolDocId && snapshot.docs[0].id === schoolDocId;
        if (isMyDoc) {
          setCodeStatus('available');
          return true;
        } else {
          setCodeStatus('taken');
          return false;
        }
      }
    } catch (err) {
      console.error("Error checking code:", err);
      setCodeStatus('idle');
      return false;
    }
  };

  // 4. Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setSaving(true);

    try {
      // Langkah 1: Validasi Kode Sekolah dulu
      const isCodeValid = await checkCodeAvailability(formData.schoolCode);
      if (!isCodeValid) {
        alert("Kode sekolah sudah digunakan sekolah lain. Silakan ganti.");
        setSaving(false);
        return;
      }

      const payload = {
        ...formData,
        adminId: currentUser.uid, // Link ke Admin
        updatedAt: serverTimestamp(),
        // Jika dokumen baru, tambahkan createdAt
        ...(schoolDocId ? {} : { createdAt: serverTimestamp() }) 
      };

      if (schoolDocId) {
        // UPDATE existing school
        const docRef = doc(db, "schools", schoolDocId);
        await updateDoc(docRef, payload);
      } else {
        // CREATE new school
        const docRef = await addDoc(collection(db, "schools"), payload);
        setSchoolDocId(docRef.id);
      }

      setLastUpdated(new Date());
      alert("Pengaturan sekolah berhasil disimpan! Sistem akan menyesuaikan fitur berdasarkan jenjang.");
    } catch (error) {
      console.error("Gagal menyimpan pengaturan:", error);
      alert("Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Pengaturan Sekolah</h2>
        <p className="text-slate-500 text-sm">
          Kelola identitas, jenjang, dan konfigurasi dasar sekolah.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* SECTION 1: KODE & IDENTITAS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Key className="w-5 h-5 text-indigo-600" />
            Akses & Identitas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* KODE SEKOLAH */}
            <div className="md:col-span-2 bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <label className="block text-sm font-bold text-indigo-900 mb-2">
                Kode Unik Sekolah
              </label>
              <p className="text-xs text-indigo-600 mb-4">
                Kode ini digunakan oleh Siswa dan Guru untuk bergabung ke sekolah Anda. 
                Pastikan kode unik dan mudah diingat.
              </p>
              
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="relative w-full md:w-1/2">
                  <input
                    type="text"
                    name="schoolCode"
                    value={formData.schoolCode}
                    onChange={handleChange}
                    onBlur={() => checkCodeAvailability(formData.schoolCode)}
                    className={cn(
                      "w-full pl-4 pr-10 py-3 text-lg font-mono font-bold tracking-wider rounded-xl border outline-none transition-all uppercase",
                      codeStatus === 'available' ? "border-green-500 focus:ring-green-200 text-green-700 bg-green-50" :
                      codeStatus === 'taken' ? "border-red-500 focus:ring-red-200 text-red-700 bg-red-50" :
                      "border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-indigo-900 bg-white"
                    )}
                    placeholder="CONTOH: SMAN1-JKT"
                  />
                  
                  {/* Status Icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {codeStatus === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />}
                    {codeStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {codeStatus === 'taken' && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-indigo-200 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Acak Kode
                </button>
              </div>

              {/* Feedback Text */}
              <div className="mt-2 text-sm">
                {codeStatus === 'taken' && <span className="text-red-600 font-medium">Maaf, kode ini sudah digunakan sekolah lain.</span>}
                {codeStatus === 'available' && <span className="text-green-600 font-medium">Kode tersedia! Jangan lupa simpan perubahan.</span>}
              </div>
            </div>

            {/* Nama Sekolah */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Nama Resmi Sekolah</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="Contoh: SMA Negeri 1 Jakarta"
              />
            </div>
            
            {/* Jenjang */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Jenjang Pendidikan</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleLevelChange} // Gunakan handler khusus
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
              >
                <option value="sd">SD / MI</option>
                <option value="smp">SMP / MTs</option>
                <option value="sma">SMA / SMK / MA</option>
                <option value="uni">Universitas / Perguruan Tinggi</option>
              </select>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <GraduationCap size={12}/> 
                {formData.level === 'uni' ? 'Mengaktifkan mode SKS & Prodi' : 'Mode Kelas Reguler'}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Sekolah</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Telepon */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nomor Telepon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Alamat */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Alamat Lengkap</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: AKADEMIK */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Konfigurasi Akademik
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Durasi Jam Pelajaran (NEW FEATURE) */}
            <div className="md:col-span-2">
               <label className="block text-sm font-bold text-slate-700 mb-1">
                 Durasi per Jam Pelajaran / SKS (Menit)
               </label>
               <div className="relative max-w-xs">
                 <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                   type="number"
                   name="lessonDuration"
                   value={formData.lessonDuration}
                   onChange={handleChange}
                   className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                 />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Menit</span>
               </div>
               <p className="text-xs text-slate-500 mt-1">
                 Digunakan sebagai default oleh Generator Jadwal Otomatis.
                 {formData.level === 'uni' ? ' (1 SKS)' : ' (1 Jam Pelajaran)'}
               </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tahun Ajaran Aktif</label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
              >
                <option value="2023/2024">2023/2024</option>
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Mengubah ini akan mempengaruhi arsip kelas.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Semester Aktif</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {["Ganjil", "Genap"].map((sem) => (
                  <button
                    type="button"
                    key={sem}
                    onClick={() => setFormData(prev => ({ ...prev, semester: sem as "Ganjil" | "Genap" }))}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                      formData.semester === sem
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Semester {sem}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-slate-400">
            {lastUpdated && `Terakhir disimpan: ${lastUpdated.toLocaleString('id-ID')}`}
          </div>
          <button
            type="submit"
            disabled={saving || codeStatus === 'taken'}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Simpan Perubahan
          </button>
        </div>

      </form>
    </div>
  );
}