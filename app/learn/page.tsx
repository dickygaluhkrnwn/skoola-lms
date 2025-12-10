"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // FIX: Import AnimatePresence
import { 
  Map, Star, Lock, Flame, User, School, Plus, LogOut, BookOpen, ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { 
  doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, increment, orderBy 
} from "firebase/firestore";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State Data Dinamis
  const [modules, setModules] = useState<any[]>([]); // Modul dari Firestore
  const [myClasses, setMyClasses] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<"map" | "classes">("map");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const user = auth.currentUser;
      if (!user) {
        const unsubscribe = auth.onAuthStateChanged((u) => { if (!u) router.push("/"); });
        return () => unsubscribe();
      }

      try {
        // 1. Fetch User
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        let userData: any = {}; // FIX: Tambahkan tipe 'any' agar tidak error properti
        
        if (docSnap.exists()) {
          userData = docSnap.data();
          setUserProfile(userData);
          
          // Fetch Kelas
          if (userData.enrolledClasses && userData.enrolledClasses.length > 0) {
            const classesPromises = userData.enrolledClasses.map(async (classId: string) => {
              const classDoc = await getDoc(doc(db, "classrooms", classId));
              return classDoc.exists() ? { id: classDoc.id, ...classDoc.data() } : null;
            });
            const classes = await Promise.all(classesPromises);
            // FIX: Tambahkan tipe (c: any) pada filter
            setMyClasses(classes.filter((c: any) => c !== null));
          }
        }

        // 2. Fetch Modules Global dari Firestore (Dibuat Admin)
        const modQ = query(collection(db, "global_modules"), orderBy("order", "asc"));
        const modSnap = await getDocs(modQ);
        
        if (!modSnap.empty) {
          const fetchedModules = modSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setModules(fetchedModules);
        } else {
          // Fallback jika belum ada modul dari admin (Tampilkan dummy agar tidak kosong)
          setModules([
            { id: "dummy1", title: "Selamat Datang!", desc: "Modul pertama dari Admin", xpReward: 50, icon: "👋", status: "active" }
          ]);
        }

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    setTimeout(() => initData(), 800);
  }, [router]);

  // LOGIC JOIN (Sama seperti sebelumnya)
  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      const codeUpper = classCode.toUpperCase();
      if (myClasses.some(c => c.code === codeUpper)) {
        alert("Kamu sudah bergabung di kelas ini!");
        setJoining(false);
        return;
      }
      const q = query(collection(db, "classrooms"), where("code", "==", codeUpper));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Kode kelas tidak ditemukan!");
        setJoining(false);
        return;
      }
      const classDoc = querySnapshot.docs[0];
      const classId = classDoc.id;
      
      await updateDoc(doc(db, "classrooms", classId), {
        students: arrayUnion(user.uid),
        studentCount: increment(1)
      });
      await updateDoc(doc(db, "users", user.uid), {
        enrolledClasses: arrayUnion(classId)
      });

      setMyClasses(prev => [...prev, { id: classId, ...classDoc.data() }]);
      alert("Berhasil bergabung!");
      setIsJoinModalOpen(false);
      setClassCode("");
      setActiveTab("classes");
    } catch (error) {
      console.error(error);
      alert("Gagal bergabung.");
    } finally {
      setJoining(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sky-50">Loading SKOOLA...</div>;

  return (
    <div className="flex min-h-screen bg-sky-50 font-sans text-gray-800">
      <StudentSidebar />

      <div className="flex-1 md:ml-64 relative pb-24">
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-sky-100 shadow-sm px-4 py-3">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200">
                <Star size={16} className="text-yellow-600 fill-yellow-600" />
                <span className="font-bold text-yellow-700 text-xs">{userProfile?.xp || 0} XP</span>
              </div>
              <div className="flex items-center gap-1 bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                <Flame size={16} className="text-orange-600 fill-orange-600" />
                <span className="font-bold text-orange-700 text-xs">{userProfile?.streak || 0}</span>
              </div>
            </div>
            <button onClick={() => setIsJoinModalOpen(true)} className="flex items-center gap-2 bg-sky-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-sky-700 transition-all shadow-sm">
              <Plus size={16} /> Join Kelas
            </button>
          </div>
        </header>

        {/* TABS */}
        <div className="max-w-md mx-auto px-4 mt-6 mb-4">
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-sky-100">
            <button onClick={() => setActiveTab("map")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "map" ? "bg-sky-100 text-sky-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>Peta Belajar</button>
            <button onClick={() => setActiveTab("classes")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "classes" ? "bg-sky-100 text-sky-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>Kelas Saya</button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="max-w-lg mx-auto px-4 relative min-h-[50vh]">
          
          {/* TAB 1: PETA BELAJAR (DINAMIS DARI FIRESTORE) */}
          {activeTab === "map" && (
            <div className="space-y-12 py-8">
              <div className="absolute left-1/2 top-10 bottom-10 w-2 bg-sky-200 -ml-1 rounded-full -z-10" />
              
              {modules.map((modul, index) => {
                const isLeft = index % 2 === 0;
                // Logic Status (Sederhana dulu: Basic terbuka, yang lain terkunci)
                // Nanti bisa dikembangkan cek userProfile.completedModules
                const isLocked = modul.level !== "basic" && index > 0; 
                
                return (
                  <motion.div
                    key={modul.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${isLeft ? "justify-start" : "justify-end"} relative`}
                  >
                    <div className={`absolute top-1/2 w-1/2 h-2 bg-sky-200 -z-10 ${isLeft ? "left-1/2 rounded-r-full" : "right-1/2 rounded-l-full"}`} />
                    <div className="relative group">
                      <button
                        onClick={() => router.push(`/lesson/${modul.id}`)}
                        className={`
                          w-24 h-24 rounded-full flex items-center justify-center shadow-[0_6px_0_rgb(0,0,0,0.2)] transition-all active:shadow-none active:translate-y-[6px] border-4 border-white bg-green-500
                          ${isLocked ? "bg-gray-200 grayscale cursor-not-allowed" : "hover:bg-green-400"}
                        `}
                      >
                        <span className="text-4xl filter drop-shadow-md">{modul.icon}</span>
                      </button>
                      
                      {/* Tooltip Dinamis */}
                      <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-44 bg-white p-3 rounded-2xl shadow-xl text-center z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-2 border border-gray-100 transform scale-90 group-hover:scale-100 duration-200">
                        <p className="font-bold text-gray-800 text-sm">{modul.title}</p>
                        <p className="text-[10px] text-gray-500 mb-1">{modul.desc}</p>
                        <div className="text-[10px] bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full inline-block">+{modul.xpReward} XP</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* TAB 2: KELAS SAYA */}
          {activeTab === "classes" && (
            <div className="space-y-4">
              {myClasses.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4 text-sky-400"><School size={40} /></div>
                  <h3 className="font-bold text-gray-700">Belum masuk kelas apapun</h3>
                  <p className="text-sm text-gray-500 mt-2 mb-4">Minta Kode Kelas ke gurumu untuk bergabung.</p>
                  <Button onClick={() => setIsJoinModalOpen(true)} className="bg-sky-500 hover:bg-sky-600">Join Kelas</Button>
                </div>
              ) : (
                myClasses.map((cls) => (
                  <motion.div 
                    key={cls.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => router.push(`/classroom/${cls.id}`)}
                    className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-sky-50 rounded-lg text-sky-600"><School size={24} /></div>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">{cls.code}</span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-sky-600 transition-colors">{cls.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{cls.description}</p>
                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                      <span>Guru: {cls.teacherName}</span>
                      <ChevronRight size={16} />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <MobileNav />

      {/* MODAL JOIN CLASS */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div onClick={() => setIsJoinModalOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Gabung Kelas</h2>
                <p className="text-gray-500 text-sm">Masukkan kode unik dari gurumu.</p>
              </div>
              <form onSubmit={handleJoinClass} className="space-y-4">
                <input required placeholder="Kode (Misal: A1B2C)" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sky-500 text-center font-mono text-lg uppercase tracking-widest outline-none transition-all" value={classCode} onChange={e => setClassCode(e.target.value)} />
                <Button type="submit" disabled={joining} className="w-full bg-sky-600 hover:bg-sky-700 text-white">{joining ? "Memproses..." : "Gabung Sekarang"}</Button>
                <button type="button" onClick={() => setIsJoinModalOpen(false)} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">Batal</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}