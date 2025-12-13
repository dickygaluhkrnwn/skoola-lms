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
  Image as ImageIcon 
} from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

// Interface untuk Tipe Data Settings
interface SchoolSettings {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  academicYear: string;
  semester: "Ganjil" | "Genap";
  logoUrl?: string; // Placeholder untuk masa depan
}

const DEFAULT_SETTINGS: SchoolSettings = {
  name: "Sekolah Skoola Indonesia",
  address: "Jl. Pendidikan No. 1, Jakarta",
  email: "admin@skoola.id",
  phone: "021-1234567",
  website: "www.skoola.id",
  academicYear: "2024/2025",
  semester: "Ganjil"
};

export default function SettingsView() {
  const [formData, setFormData] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 1. Fetch Settings Data
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "school_settings", "profile");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({ ...DEFAULT_SETTINGS, ...data } as SchoolSettings);
          if (data.updatedAt) {
            setLastUpdated(data.updatedAt.toDate());
          }
        }
      } catch (error) {
        console.error("Gagal mengambil pengaturan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 2. Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const docRef = doc(db, "school_settings", "profile");
      await setDoc(docRef, {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true }); // Merge agar field lain tidak hilang

      setLastUpdated(new Date());
      alert("Pengaturan sekolah berhasil disimpan!");
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
          Kelola profil sekolah dan konfigurasi akademik.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* SECTION 1: PROFIL SEKOLAH */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <School className="w-5 h-5 text-indigo-600" />
            Identitas Sekolah
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Placeholder */}
            <div className="md:col-span-2 flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Logo Sekolah</p>
                <p className="text-xs text-slate-500 mb-2">Format: PNG, JPG. Maks 2MB.</p>
                <button type="button" disabled className="text-xs px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed">
                  Upload Logo (Segera Hadir)
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Nama Sekolah</label>
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

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Resmi</label>
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
            disabled={saving}
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