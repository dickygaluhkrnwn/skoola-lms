"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, Map, Trash2, Loader2, LogOut, ShieldAlert, Database, Play, CheckCircle
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, getDocs, deleteDoc, doc, query, orderBy, writeBatch 
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// --- IMPORT DATA BIPA 1 ---
import { 
  MODULE_SAPAAN, 
  MODULE_PERKENALAN, 
  MODULE_ANGKA 
} from "@/lib/data/seed_bipa1"; // Part 1

import { 
  MODULE_KELUARGA,
  MODULE_BENDA,
  MODULE_WAKTU 
} from "@/lib/data/seed_bipa1_part2"; // Part 2

// --- IMPORT DATA BIPA 2 ---
import {
  BIPA2_FULL_SET,
  MODULE_RUTINITAS,
  MODULE_HOBI,
  MODULE_LINGKUNGAN
} from "@/lib/data/seed_bipa2"; // Part 1

import {
  BIPA2_PART2_SET,
  MODULE_BELANJA,
  MODULE_KESEHATAN,
  MODULE_TRANSPORTASI
} from "@/lib/data/seed_bipa2_part2"; // Part 2

// --- IMPORT DATA BIPA 3 ---
import {
  BIPA3_FULL_SET,
  MODULE_PENGALAMAN,
  MODULE_CUACA,
  MODULE_CITACITA
} from "@/lib/data/seed_bipa3"; // Part 1

import {
  BIPA3_PART2_SET,
  MODULE_PENDAPAT,
  MODULE_SURAT,
  MODULE_BUDAYA
} from "@/lib/data/seed_bipa3_part2"; // Part 2 (NEW)

import { CourseModule } from "@/lib/types/course.types";

export default function SuperAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"modules" | "users" | "seeder">("modules");
  const [loading, setLoading] = useState(true);
  
  const [modules, setModules] = useState<CourseModule[]>([]); 
  const [users, setUsers] = useState<any[]>([]);
  const [seedLoading, setSeedLoading] = useState(false);

  useEffect(() => {
    fetchModules();
    fetchUsers();
  }, []);

  const fetchModules = async () => {
    try {
      const modQ = query(collection(db, "global_modules"), orderBy("order", "asc"));
      const modSnap = await getDocs(modQ);
      const mods = modSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as unknown as CourseModule[]; 
      setModules(mods);
      setLoading(false);
    } catch (err) {
      console.error("Error fetch modules:", err);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const userSnap = await getDocs(collection(db, "users"));
      const usersData = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm("Hapus modul ini? Data yang dihapus tidak bisa kembali.")) {
      await deleteDoc(doc(db, "global_modules", id));
      setModules(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleSeed = async (dataToSeed: CourseModule[], label: string) => {
    if (!confirm(`Seed ${label} ke database? Data lama dengan ID yang sama akan ditimpa.`)) return;
    
    setSeedLoading(true);
    try {
      const batch = writeBatch(db);
      
      dataToSeed.forEach((modul) => {
        const docRef = doc(db, "global_modules", modul.id); 
        batch.set(docRef, modul);
      });

      await batch.commit();
      alert(`✅ Berhasil Seed ${label}!`);
      fetchModules(); 
      setActiveTab("modules"); 
    } catch (error) {
      console.error("Gagal seeding:", error);
      alert(`Gagal seeding ${label}. Cek console.`);
    } finally {
      setSeedLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <Loader2 className="animate-spin mr-2"/> Loading Admin Center...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex">
      
      {/* SIDEBAR ADMIN */}
      <aside className="w-64 bg-black/20 border-r border-gray-800 flex-col fixed inset-y-0 hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 text-red-500 mb-6">
            <ShieldAlert size={28} />
            <h1 className="font-bold text-xl tracking-tighter text-white">GOD MODE</h1>
          </div>
          <nav className="space-y-2">
            <SidebarBtn active={activeTab === "modules"} onClick={() => setActiveTab("modules")} icon={<Map size={18} />} label="Manajemen Kurikulum" />
            <SidebarBtn active={activeTab === "users"} onClick={() => setActiveTab("users")} icon={<Users size={18} />} label="Data Pengguna" />
            <div className="pt-4 pb-2">
               <p className="text-[10px] uppercase text-gray-500 font-bold px-4">Tools</p>
            </div>
            <SidebarBtn active={activeTab === "seeder"} onClick={() => setActiveTab("seeder")} icon={<Database size={18} />} label="Database Seeder" />
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold">
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-8">
        
        {/* VIEW: MANAJEMEN MODUL */}
        {activeTab === "modules" && (
          <div>
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Kurikulum Global</h2>
                <p className="text-gray-400">Daftar modul pembelajaran yang aktif di aplikasi.</p>
              </div>
            </header>

            <div className="space-y-4">
              {modules.length === 0 ? (
                <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800 border-dashed">
                  <p className="text-gray-500 mb-4">Database kosong. Gunakan menu Seeder untuk isi data.</p>
                  <Button variant="secondary" onClick={() => setActiveTab("seeder")}>
                    Pergi ke Seeder
                  </Button>
                </div>
              ) : (
                modules.map((mod) => (
                  <motion.div 
                    key={mod.id}
                    layout
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex justify-between items-center group hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-2xl">
                        {mod.thumbnailUrl || (mod as any).icon || "📚"}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">{mod.title}</h4>
                        <p className="text-sm text-gray-400">{mod.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge color="blue">Level {mod.level}</Badge>
                          <Badge color="purple">
                            {mod.lessons ? `${mod.lessons.length} Lesson` : `0 Soal`}
                          </Badge>
                          {mod.isLocked && <Badge color="red">Locked</Badge>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteModule(mod.id)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-950/30 rounded-lg transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW: DATABASE SEEDER */}
        {activeTab === "seeder" && (
            <div>
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Database Seeder</h2>
                    <p className="text-gray-400">Injeksi konten kurikulum BIPA standar ke dalam database.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* --- BIPA 1 (A1) --- */}
                    <div className="col-span-full pb-2 border-b border-gray-800 mb-2">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">BIPA 1 (A1) - Pemula</h3>
                    </div>

                    <SeedCard icon="👋" title="1.1 Sapaan" desc="Waktu & Salam" loading={seedLoading} onClick={() => handleSeed([MODULE_SAPAAN], "Modul Sapaan")} />
                    <SeedCard icon="🤝" title="1.2 Intro" desc="Perkenalan Diri" loading={seedLoading} onClick={() => handleSeed([MODULE_PERKENALAN], "Modul Perkenalan")} />
                    <SeedCard icon="1️⃣" title="1.3 Angka" desc="1-10 & Hitungan" loading={seedLoading} onClick={() => handleSeed([MODULE_ANGKA], "Modul Angka")} />
                    <SeedCard icon="👨‍👩‍👧‍👦" title="1.4 Keluarga" desc="Ayah, Ibu, Kata Ganti" loading={seedLoading} onClick={() => handleSeed([MODULE_KELUARGA], "Modul Keluarga")} />
                    <SeedCard icon="🎒" title="1.5 Benda" desc="Sekolah & Preposisi" loading={seedLoading} onClick={() => handleSeed([MODULE_BENDA], "Modul Benda")} />
                    <SeedCard icon="📅" title="1.6 Waktu" desc="Hari, Besok, Kemarin" loading={seedLoading} onClick={() => handleSeed([MODULE_WAKTU], "Modul Waktu")} />

                    {/* --- BIPA 2 (A2) --- */}
                    <div className="col-span-full pb-2 border-b border-gray-800 mb-2 mt-6">
                        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest">BIPA 2 (A2) - Dasar</h3>
                    </div>

                    <div className="col-span-full mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                            onClick={() => handleSeed(BIPA2_FULL_SET, "SEMUA BIPA 2 (Part 1)")} 
                            disabled={seedLoading}
                            className="bg-green-700 hover:bg-green-600 text-white font-bold h-12 rounded-xl shadow-lg"
                        >
                            {seedLoading ? <Loader2 className="animate-spin mr-2"/> : <Database className="mr-2 h-4 w-4"/>}
                            SEED BIPA 2 (Part 1)
                        </Button>
                         <Button 
                            onClick={() => handleSeed(BIPA2_PART2_SET, "SEMUA BIPA 2 (Part 2)")} 
                            disabled={seedLoading}
                            className="bg-green-800 hover:bg-green-700 text-white font-bold h-12 rounded-xl shadow-lg"
                        >
                            {seedLoading ? <Loader2 className="animate-spin mr-2"/> : <Database className="mr-2 h-4 w-4"/>}
                            SEED BIPA 2 (Part 2)
                        </Button>
                    </div>

                    <SeedCard icon="⏰" title="2.1 Rutinitas" desc="Pagi-Malam, Jam" loading={seedLoading} onClick={() => handleSeed([MODULE_RUTINITAS], "Modul Rutinitas")} />
                    <SeedCard icon="🎨" title="2.2 Hobi" desc="Hobi & Frekuensi" loading={seedLoading} onClick={() => handleSeed([MODULE_HOBI], "Modul Hobi")} />
                    <SeedCard icon="🗺️" title="2.3 Lingkungan" desc="Tempat & Arah" loading={seedLoading} onClick={() => handleSeed([MODULE_LINGKUNGAN], "Modul Lingkungan")} />
                    <SeedCard icon="🛍️" title="2.4 Belanja" desc="Pasar & Uang" loading={seedLoading} onClick={() => handleSeed([MODULE_BELANJA], "Modul Belanja")} />
                    <SeedCard icon="🏥" title="2.5 Kesehatan" desc="Tubuh & Penyakit" loading={seedLoading} onClick={() => handleSeed([MODULE_KESEHATAN], "Modul Kesehatan")} />
                    <SeedCard icon="🚎" title="2.6 Transport" desc="Kendaraan & Tiket" loading={seedLoading} onClick={() => handleSeed([MODULE_TRANSPORTASI], "Modul Transportasi")} />

                    {/* --- BIPA 3 (B1) --- */}
                    <div className="col-span-full pb-2 border-b border-gray-800 mb-2 mt-6">
                        <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest">BIPA 3 (B1) - Madya</h3>
                    </div>

                    <div className="col-span-full mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                            onClick={() => handleSeed(BIPA3_FULL_SET, "SEMUA BIPA 3 (Part 1)")} 
                            disabled={seedLoading}
                            className="bg-yellow-700 hover:bg-yellow-600 text-white font-bold h-12 rounded-xl shadow-lg"
                        >
                            {seedLoading ? <Loader2 className="animate-spin mr-2"/> : <Database className="mr-2 h-4 w-4"/>}
                            SEED BIPA 3 (Part 1)
                        </Button>
                        <Button 
                            onClick={() => handleSeed(BIPA3_PART2_SET, "SEMUA BIPA 3 (Part 2)")} 
                            disabled={seedLoading}
                            className="bg-yellow-800 hover:bg-yellow-700 text-white font-bold h-12 rounded-xl shadow-lg"
                        >
                            {seedLoading ? <Loader2 className="animate-spin mr-2"/> : <Database className="mr-2 h-4 w-4"/>}
                            SEED BIPA 3 (Part 2)
                        </Button>
                    </div>

                    {/* Part 1 Cards */}
                    <SeedCard icon="🕰️" title="3.1 Pengalaman" desc="Masa Lalu & Liburan" loading={seedLoading} onClick={() => handleSeed([MODULE_PENGALAMAN], "Modul Pengalaman")} />
                    <SeedCard icon="⛈️" title="3.2 Cuaca" desc="Musim & Bencana" loading={seedLoading} onClick={() => handleSeed([MODULE_CUACA], "Modul Cuaca")} />
                    <SeedCard icon="🎓" title="3.3 Cita-cita" desc="Harapan & Profesi" loading={seedLoading} onClick={() => handleSeed([MODULE_CITACITA], "Modul Cita-cita")} />
                    
                    {/* Part 2 Cards (NEW) */}
                    <SeedCard icon="🗣️" title="3.4 Pendapat" desc="Setuju/Tidak Setuju" loading={seedLoading} onClick={() => handleSeed([MODULE_PENDAPAT], "Modul Pendapat")} />
                    <SeedCard icon="✉️" title="3.5 Surat" desc="Email Formal" loading={seedLoading} onClick={() => handleSeed([MODULE_SURAT], "Modul Surat")} />
                    <SeedCard icon="🎭" title="3.6 Budaya" desc="Tradisi & Batik" loading={seedLoading} onClick={() => handleSeed([MODULE_BUDAYA], "Modul Budaya")} />

                </div>
            </div>
        )}

        {/* VIEW: USERS (READ ONLY) */}
        {activeTab === "users" && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Level</th>
                  <th className="px-6 py-4">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{u.displayName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'teacher' ? 'bg-purple-900/50 text-purple-300' : 'bg-green-900/50 text-green-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">Lvl {u.level || 1}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
      
      <style jsx global>{`
        .admin-input {
          width: 100%;
          background: #111827;
          border: 1px solid #374151;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          outline: none;
          transition: all 0.2s;
        }
        .admin-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
      `}</style>
    </div>
  );
}

// Sub-components
function SeedCard({ icon, title, desc, onClick, loading }: any) {
    return (
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-gray-600 transition-all flex flex-col gap-4 group">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-white text-lg">{title}</h4>
                    <p className="text-sm text-gray-400 leading-tight">{desc}</p>
                </div>
            </div>
            <div className="mt-auto pt-2">
              <Button 
                  variant="secondary" 
                  onClick={onClick} 
                  disabled={loading}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 h-10"
              >
                  <Play size={14} className="mr-2 fill-current" /> Seed
              </Button>
            </div>
        </div>
    )
}

function SidebarBtn({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-xl font-medium transition-all mb-1 border-l-4 ${active ? "bg-blue-900/20 border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:bg-gray-800 hover:text-white"}`}
    >
      {icon} {label}
    </button>
  );
}

function Badge({ children, color }: any) {
    const colors: any = {
        blue: "bg-blue-900/30 text-blue-400 border-blue-900/50",
        purple: "bg-purple-900/30 text-purple-400 border-purple-900/50",
        red: "bg-red-900/30 text-red-400 border-red-900/50",
    }
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded border ${colors[color] || colors.blue}`}>
            {children}
        </span>
    )
}