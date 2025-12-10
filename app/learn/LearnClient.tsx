"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, Flame, School, Plus, ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { 
  doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, increment, orderBy 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/lib/types/user.types"; // Pakai tipe data kita
import { CourseModule } from "@/lib/types/course.types"; // Pakai tipe data kita

export default function LearnClient() {
  const router = useRouter();
  const { theme } = useTheme(); 
  
  // State dengan Tipe Data yang Benar
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<CourseModule[]>([]); 
  const [myClasses, setMyClasses] = useState<any[]>([]); // TODO: Buat type Class nanti
  
  const [activeTab, setActiveTab] = useState<"map" | "classes">("map");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        // 1. Fetch User Data
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserProfile;
          setUserProfile(userData);
          
          // 2. Fetch Classes (jika ada enrolledClasses)
          // Note: Kita cast ke any dulu karena properti enrolledClasses belum ada di interface UserProfile standar kita (perlu diupdate nanti)
          const enrolled = (userData as any).enrolledClasses || [];
          if (enrolled.length > 0) {
            const classesPromises = enrolled.map(async (classId: string) => {
              const classDoc = await getDoc(doc(db, "classrooms", classId));
              return classDoc.exists() ? { id: classDoc.id, ...classDoc.data() } : null;
            });
            const classes = await Promise.all(classesPromises);
            setMyClasses(classes.filter((c: any) => c !== null));
          }
        }

        // 3. Fetch Modules
        const modQ = query(collection(db, "global_modules"), orderBy("order", "asc"));
        const modSnap = await getDocs(modQ);
        
        if (!modSnap.empty) {
          const fetchedModules = modSnap.docs.map(d => ({ id: d.id, ...d.data() })) as unknown as CourseModule[];
          setModules(fetchedModules);
        } else {
          // Dummy data jika kosong, disesuaikan dengan struktur CourseModule
          setModules([
            { 
              id: "dummy1", 
              title: "Selamat Datang!", 
              description: "Modul pertama dari Admin", 
              level: 1,
              order: 1,
              xpReward: 50, // Perlu penyesuaian di type jika property ini belum ada
              lessons: [] 
            } as any
          ]);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

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
      // Update di user juga
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground animate-pulse">
      <div className="flex flex-col items-center gap-2">
        <School className="w-10 h-10 animate-bounce text-primary" />
        <span>Memuat Petualangan...</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground transition-colors duration-500">
      <StudentSidebar />

      <div className="flex-1 md:ml-64 relative pb-24">
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border shadow-sm px-4 py-3 transition-colors duration-300">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full border transition-all",
                theme === "kids" ? "bg-yellow-100 border-yellow-200 text-yellow-700" : "bg-secondary border-border text-foreground"
              )}>
                <Star size={16} className={cn("fill-current", theme === "kids" ? "text-yellow-600" : "text-primary")} />
                <span className="font-bold text-xs">{userProfile?.gamification?.xp || 0} XP</span>
              </div>
              <div className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full border transition-all",
                theme === "kids" ? "bg-orange-100 border-orange-200 text-orange-700" : "bg-secondary border-border text-foreground"
              )}>
                <Flame size={16} className={cn("fill-current", theme === "kids" ? "text-orange-600" : "text-red-500")} />
                <span className="font-bold text-xs">{userProfile?.gamification?.currentStreak || 0}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsJoinModalOpen(true)} 
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-95",
                theme === "kids" 
                  ? "bg-sky-500 text-white hover:bg-sky-600 rounded-full" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
              )}
            >
              <Plus size={16} /> Join Kelas
            </button>
          </div>
        </header>

        {/* TABS */}
        <div className="max-w-md mx-auto px-4 mt-8 mb-6">
          <div className={cn(
            "flex p-1 shadow-sm border transition-all",
            theme === "kids" ? "bg-white rounded-2xl border-sky-100" : "bg-secondary/50 rounded-lg border-border"
          )}>
            <button onClick={() => setActiveTab("map")} className={cn(
              "flex-1 py-2.5 text-sm font-bold transition-all",
              theme === "kids" ? "rounded-xl" : "rounded-md",
              activeTab === "map" 
                ? (theme === "kids" ? "bg-sky-100 text-sky-700 shadow-sm" : "bg-background text-foreground shadow-sm")
                : "text-gray-400 hover:text-gray-600"
            )}>Peta Belajar</button>
            <button onClick={() => setActiveTab("classes")} className={cn(
              "flex-1 py-2.5 text-sm font-bold transition-all",
              theme === "kids" ? "rounded-xl" : "rounded-md",
              activeTab === "classes" 
                ? (theme === "kids" ? "bg-sky-100 text-sky-700 shadow-sm" : "bg-background text-foreground shadow-sm")
                : "text-gray-400 hover:text-gray-600"
            )}>Kelas Saya</button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="max-w-lg mx-auto px-4 relative min-h-[50vh]">
          
          {/* TAB 1: PETA BELAJAR */}
          {activeTab === "map" && (
            <div className="space-y-12 py-8">
              {/* Garis Jalur (Path) */}
              <div className={cn(
                "absolute left-1/2 top-10 bottom-10 w-2 -ml-1 rounded-full -z-10 transition-colors",
                theme === "kids" ? "bg-sky-200" : "bg-border"
              )} />
              
              {modules.map((modul, index) => {
                const isLeft = index % 2 === 0;
                // Logika kunci sederhana: Level module > Level user (Contoh)
                const isLocked = (modul.isLocked); 
                
                return (
                  <motion.div
                    key={modul.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${isLeft ? "justify-start" : "justify-end"} relative`}
                  >
                    {/* Connector Horizontal */}
                    <div className={cn(
                      "absolute top-1/2 w-1/2 h-2 -z-10 transition-colors",
                      theme === "kids" ? "bg-sky-200" : "bg-border",
                      isLeft ? "left-1/2 rounded-r-full" : "right-1/2 rounded-l-full"
                    )} />
                    
                    <div className="relative group">
                      <button
                        disabled={isLocked}
                        onClick={() => router.push(`/lesson/${modul.id}`)}
                        className={cn(
                          "w-24 h-24 flex items-center justify-center transition-all border-4 relative overflow-hidden",
                          theme === "kids" 
                            ? "rounded-full shadow-[0_6px_0_rgb(0,0,0,0.2)] active:translate-y-[6px] active:shadow-none border-white"
                            : "rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 border-white bg-white",
                          !isLocked 
                            ? (theme === "kids" ? "bg-green-500 hover:bg-green-400" : "bg-white border-primary/20")
                            : "bg-gray-200 grayscale cursor-not-allowed"
                        )}
                      >
                        {/* ICON Placeholder - Nanti bisa diganti image dari modul */}
                        <span className={cn("text-3xl filter drop-shadow-md", isLocked && "opacity-20")}>
                           {(modul as any).icon || "📚"}
                        </span>
                      </button>
                      
                      {/* Tooltip Dinamis */}
                      <div className={cn(
                        "absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 bg-white p-3 shadow-xl text-center z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-2 border transform scale-90 group-hover:scale-100 duration-200",
                        theme === "kids" ? "rounded-2xl border-gray-100" : "rounded-lg border-border"
                      )}>
                        <p className="font-bold text-foreground text-sm">{modul.title}</p>
                        <p className="text-[10px] text-muted-foreground mb-1.5 line-clamp-2">{modul.description}</p>
                        <div className={cn(
                          "text-[10px] font-bold px-2 py-0.5 inline-block",
                          theme === "kids" ? "bg-yellow-100 text-yellow-700 rounded-full" : "bg-secondary text-primary rounded"
                        )}>
                          {/* Menggunakan casting any sementara jika xpReward belum ada di type */}
                          +{(modul as any).xpReward || 10} XP
                        </div>
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
                <div className={cn(
                  "text-center py-12 px-6 border-2 border-dashed rounded-3xl",
                  theme === "kids" ? "border-sky-200 bg-sky-50" : "border-border bg-secondary/20 rounded-xl"
                )}>
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors",
                    theme === "kids" ? "bg-sky-100 text-sky-400" : "bg-white text-gray-400 shadow-sm"
                  )}>
                    <School size={40} />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">Belum masuk kelas</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-6">Minta Kode Kelas ke gurumu untuk mulai belajar bersama.</p>
                  <Button 
                    onClick={() => setIsJoinModalOpen(true)} 
                    className={cn(
                      theme === "kids" ? "bg-sky-500 hover:bg-sky-600 rounded-full px-8" : "bg-primary hover:bg-primary/90"
                    )}
                  >
                    Join Kelas Sekarang
                  </Button>
                </div>
              ) : (
                myClasses.map((cls) => (
                  <motion.div 
                    key={cls.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => router.push(`/classroom/${cls.id}`)}
                    className={cn(
                      "bg-white p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden",
                      theme === "kids" ? "rounded-3xl border-sky-100" : "rounded-xl border-border"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0 right-0 w-24 h-24 rounded-full -mr-10 -mt-10 opacity-10 transition-colors",
                      theme === "kids" ? "bg-sky-400" : "bg-primary"
                    )}/>
                    
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        theme === "kids" ? "bg-sky-50 text-sky-600" : "bg-secondary text-primary"
                      )}>
                        <School size={24} />
                      </div>
                      <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-1 rounded-md font-mono border border-border">
                        {cls.code}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors relative z-10">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-8 relative z-10">
                      {cls.description || "Tidak ada deskripsi kelas."}
                    </p>
                    
                    <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground relative z-10">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold">
                          {cls.teacherName?.[0]}
                        </div>
                        <span>{cls.teacherName}</span>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
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
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsJoinModalOpen(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "bg-white p-6 w-full max-w-sm relative z-10 shadow-2xl",
                theme === "kids" ? "rounded-3xl" : "rounded-xl"
              )}
            >
              <div className="text-center mb-6">
                <div className={cn(
                  "w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full",
                  theme === "kids" ? "bg-sky-100 text-sky-600" : "bg-primary/10 text-primary"
                )}>
                  <Plus size={32} />
                </div>
                <h2 className="text-xl font-bold text-foreground">Gabung Kelas Baru</h2>
                <p className="text-muted-foreground text-sm mt-1">Masukkan 6 digit kode unik dari gurumu.</p>
              </div>
              
              <form onSubmit={handleJoinClass} className="space-y-4">
                <input 
                  required 
                  placeholder="A1B2C3" 
                  className={cn(
                    "w-full px-4 py-4 border-2 focus:border-primary text-center font-mono text-2xl uppercase tracking-[0.5em] outline-none transition-all placeholder:tracking-normal placeholder:text-base placeholder:text-gray-300",
                    theme === "kids" ? "rounded-2xl border-gray-200" : "rounded-lg border-border bg-secondary/30"
                  )}
                  value={classCode} 
                  maxLength={6}
                  onChange={e => setClassCode(e.target.value)} 
                />
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    onClick={() => setIsJoinModalOpen(false)} 
                    className={cn(
                      "flex-1 bg-transparent hover:bg-gray-100 text-gray-500 border-2 border-transparent",
                      theme === "kids" ? "rounded-xl" : "rounded-lg"
                    )}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={joining || classCode.length < 3} 
                    className={cn(
                      "flex-1",
                      theme === "kids" ? "bg-sky-600 hover:bg-sky-700 rounded-xl" : "bg-primary hover:bg-primary/90 rounded-lg"
                    )}
                  >
                    {joining ? "Memproses..." : "Gabung"}
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