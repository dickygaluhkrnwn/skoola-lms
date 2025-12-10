"use client";

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, Map, Plus, Trash2, Save, 
  Edit, Loader2, LogOut, ShieldAlert, CheckCircle2, XCircle
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy 
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// Tipe Data Soal
interface Question {
  id: string;
  type: "multiple-choice";
  question: string;
  options: string[];
  correctAnswer: string;
}

// Tipe Data Modul Global (Updated)
interface GlobalModule {
  id: string;
  title: string;
  desc: string;
  level: "basic" | "intermediate" | "advanced";
  xpReward: number;
  icon: string;
  order: number;
  questions: Question[]; // Array Soal
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"modules" | "users">("modules");
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [modules, setModules] = useState<GlobalModule[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Form State (Untuk Edit/Add Modul)
  const [isEditing, setIsEditing] = useState(false);
  const [currentModule, setCurrentModule] = useState<Partial<GlobalModule>>({
    title: "", desc: "", level: "basic", xpReward: 100, icon: "📚", order: 1, questions: []
  });

  // State Lokal untuk Form Tambah Soal
  const [tempQuestion, setTempQuestion] = useState<Partial<Question>>({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: ""
  });

  // 1. FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        // router.push("/"); // Uncomment untuk proteksi
      }

      try {
        const modQ = query(collection(db, "global_modules"), orderBy("order", "asc"));
        const modSnap = await getDocs(modQ);
        // FIX: Tambahkan 'as unknown' sebelum 'as GlobalModule[]' untuk bypass error TS
        const mods = modSnap.docs.map(doc => ({ 
          id: doc.id, 
          questions: [], // Default empty array jika field belum ada
          ...doc.data() 
        })) as unknown as GlobalModule[]; 
        setModules(mods);

        const userSnap = await getDocs(collection(db, "users"));
        const usersData = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);

      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. LOGIC SOAL (CLIENT SIDE ONLY SEBELUM SAVE)
  const handleAddQuestion = () => {
    if (!tempQuestion.question || !tempQuestion.correctAnswer) return alert("Soal dan Kunci Jawaban wajib diisi!");
    if (tempQuestion.options?.some(opt => opt === "")) return alert("Semua opsi jawaban harus diisi!");

    const newQ: Question = {
      id: Date.now().toString(),
      type: "multiple-choice",
      question: tempQuestion.question!,
      options: tempQuestion.options!,
      correctAnswer: tempQuestion.correctAnswer!
    };

    setCurrentModule(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQ]
    }));

    // Reset Form Soal
    setTempQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: ""
    });
  };

  const handleDeleteQuestion = (qId: string) => {
    setCurrentModule(prev => ({
      ...prev,
      questions: prev.questions?.filter(q => q.id !== qId)
    }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(tempQuestion.options || [])];
    newOptions[index] = value;
    setTempQuestion({ ...tempQuestion, options: newOptions });
  };

  // 3. CRUD MODULES
  const handleSaveModule = async () => {
    if (!currentModule.title) return alert("Judul wajib diisi!");
    
    try {
      if (currentModule.id) {
        // Edit Existing
        const { id, ...data } = currentModule as any;
        await updateDoc(doc(db, "global_modules", id), data);
        setModules(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
      } else {
        // Create New
        const docRef = await addDoc(collection(db, "global_modules"), currentModule);
        setModules(prev => [...prev, { id: docRef.id, ...currentModule } as GlobalModule]);
      }
      
      setIsEditing(false);
      setCurrentModule({ title: "", desc: "", level: "basic", xpReward: 100, icon: "📚", order: modules.length + 1, questions: [] });
      alert("Modul berhasil disimpan!");
    } catch (error) {
      console.error("Gagal simpan:", error);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm("Hapus modul ini? Data yang dihapus tidak bisa kembali.")) {
      await deleteDoc(doc(db, "global_modules", id));
      setModules(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleEditClick = (modul: GlobalModule) => {
    setCurrentModule(modul);
    setIsEditing(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><Loader2 className="animate-spin mr-2"/> Loading Admin Center...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex">
      
      {/* SIDEBAR ADMIN */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 flex-col fixed inset-y-0 hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 text-red-500 mb-6">
            <ShieldAlert size={28} />
            <h1 className="font-bold text-xl tracking-tighter text-white">GOD MODE</h1>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Menu Utama</p>
          <nav className="space-y-2">
            <SidebarBtn active={activeTab === "modules"} onClick={() => setActiveTab("modules")} icon={<Map size={18} />} label="Manajemen Kurikulum" />
            <SidebarBtn active={activeTab === "users"} onClick={() => setActiveTab("users")} icon={<Users size={18} />} label="Data Pengguna" />
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
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {activeTab === "modules" ? "Kurikulum Global" : "Database Pengguna"}
            </h2>
            <p className="text-gray-400">Kelola konten website secara dinamis dari sini.</p>
          </div>
          {activeTab === "modules" && !isEditing && (
            <Button onClick={() => setIsEditing(true)} className="bg-red-600 hover:bg-red-700 text-white">
              <Plus size={18} className="mr-2" /> Tambah Modul
            </Button>
          )}
        </header>

        {/* TAB: MODULES MANAGEMENT */}
        {activeTab === "modules" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* List Modul (Kiri) */}
            <div className="lg:col-span-2 space-y-4">
              {modules.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/50 rounded-2xl border border-gray-700 border-dashed">
                  <p className="text-gray-500">Belum ada modul. Tambahkan sekarang!</p>
                </div>
              ) : (
                modules.map((mod) => (
                  <motion.div 
                    key={mod.id}
                    layout
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center group hover:border-gray-500 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                        {mod.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{mod.title}</h4>
                        <p className="text-xs text-gray-400">{mod.desc}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-900">XP: {mod.xpReward}</span>
                          <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-900">Urutan: {mod.order}</span>
                          <span className="text-[10px] bg-green-900/50 text-green-300 px-2 py-0.5 rounded border border-green-900">{mod.questions?.length || 0} Soal</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(mod)} className="p-2 bg-gray-700 hover:bg-blue-600 rounded-lg text-white transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteModule(mod.id)} className="p-2 bg-gray-700 hover:bg-red-600 rounded-lg text-white transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Form Editor (Kanan) */}
            <div className="lg:col-span-1">
              <AnimatePresence>
                {isEditing && (
                  <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="bg-gray-800 p-6 rounded-2xl border border-gray-700 sticky top-8 shadow-xl max-h-[90vh] overflow-y-auto"
                  >
                    <h3 className="font-bold text-xl mb-4 text-white border-b border-gray-700 pb-2">
                      {currentModule.id ? "Edit Modul" : "Modul Baru"}
                    </h3>
                    
                    {/* Basic Info */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Judul Modul</label>
                        <input 
                          className="admin-input" 
                          value={currentModule.title} 
                          onChange={e => setCurrentModule({...currentModule, title: e.target.value})}
                          placeholder="Contoh: Tata Bahasa Dasar"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Deskripsi</label>
                        <input 
                          className="admin-input" 
                          value={currentModule.desc} 
                          onChange={e => setCurrentModule({...currentModule, desc: e.target.value})}
                          placeholder="Penjelasan singkat..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase">Ikon (Emoji)</label>
                          <input 
                            className="admin-input text-center text-xl" 
                            value={currentModule.icon} 
                            onChange={e => setCurrentModule({...currentModule, icon: e.target.value})}
                            maxLength={2}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase">XP Reward</label>
                          <input 
                            type="number"
                            className="admin-input" 
                            value={currentModule.xpReward} 
                            onChange={e => setCurrentModule({...currentModule, xpReward: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase">Urutan</label>
                          <input 
                            type="number"
                            className="admin-input" 
                            value={currentModule.order} 
                            onChange={e => setCurrentModule({...currentModule, order: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase">Level</label>
                          <select 
                            className="admin-input"
                            value={currentModule.level}
                            onChange={e => setCurrentModule({...currentModule, level: e.target.value as any})}
                          >
                            <option value="basic">Basic</option>
                            <option value="intermediate">Medium</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Question Builder Area */}
                    <div className="border-t border-gray-700 pt-4">
                      <h4 className="font-bold text-white mb-3 text-sm uppercase">Manajemen Soal ({currentModule.questions?.length})</h4>
                      
                      {/* List Soal Existing */}
                      <div className="space-y-2 mb-4">
                        {currentModule.questions?.map((q, idx) => (
                           <div key={q.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-start text-xs group">
                              <div>
                                <span className="font-bold text-blue-300">#{idx + 1}:</span> {q.question}
                                <div className="text-gray-400 mt-1">Kunci: <span className="text-green-400">{q.correctAnswer}</span></div>
                              </div>
                              <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-400 hover:text-red-200"><Trash2 size={14}/></button>
                           </div>
                        ))}
                      </div>

                      {/* Add New Question Form */}
                      <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 space-y-3">
                         <div>
                            <label className="text-[10px] text-gray-400 uppercase">Pertanyaan Baru</label>
                            <textarea 
                              className="admin-input text-sm h-16 resize-none" 
                              placeholder="Tulis soal di sini..."
                              value={tempQuestion.question}
                              onChange={e => setTempQuestion({...tempQuestion, question: e.target.value})}
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                            {tempQuestion.options?.map((opt, i) => (
                               <input 
                                  key={i}
                                  className={`admin-input text-xs ${tempQuestion.correctAnswer === opt && opt !== "" ? "border-green-500 bg-green-900/20" : ""}`}
                                  placeholder={`Opsi ${String.fromCharCode(65+i)}`}
                                  value={opt}
                                  onChange={e => updateOption(i, e.target.value)}
                               />
                            ))}
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-400 uppercase">Kunci Jawaban</label>
                            <select 
                               className="admin-input text-sm"
                               value={tempQuestion.correctAnswer}
                               onChange={e => setTempQuestion({...tempQuestion, correctAnswer: e.target.value})}
                            >
                               <option value="">Pilih Jawaban Benar</option>
                               {tempQuestion.options?.map((opt, i) => (
                                 opt && <option key={i} value={opt}>{opt}</option>
                               ))}
                            </select>
                         </div>
                         <Button onClick={handleAddQuestion} variant="secondary" size="sm" className="w-full bg-blue-600 text-white border-none hover:bg-blue-700">
                            <Plus size={14} className="mr-1"/> Tambah Soal
                         </Button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-6 border-t border-gray-700 mt-4">
                      <Button onClick={() => setIsEditing(false)} variant="secondary" className="flex-1 bg-gray-700 text-white border-none hover:bg-gray-600">Batal</Button>
                      <Button onClick={handleSaveModule} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        <Save size={16} className="mr-2" /> Simpan Modul
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}

        {/* TAB: USER DATABASE */}
        {activeTab === "users" && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/50 text-gray-400 uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Level / XP</th>
                  <th className="px-6 py-4">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{u.displayName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'teacher' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{u.level} <span className="text-gray-500">({u.xp} XP)</span></td>
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

function SidebarBtn({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${active ? "bg-red-600 text-white shadow-lg shadow-red-900/50" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
    >
      {icon} {label}
    </button>
  );
}