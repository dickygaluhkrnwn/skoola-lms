"use client";

import React, { useState, useEffect } from "react";
import { School, Layout, Map as MapIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { 
  doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, increment, orderBy, onSnapshot 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// --- IMPORTS: COMPONENTS (Relative Paths) ---
import { StudentSidebar } from "../../components/layout/student-sidebar";
import { MobileNav } from "../../components/layout/mobile-nav";
import { LearnHeader } from "../../components/learn/learn-header";
import { AdventureMap } from "../../components/learn/adventure-map"; // Kids View
import { ModuleList } from "../../components/learn/module-list";     // Pro View
import { ClassList } from "../../components/learn/class-list";
import { JoinClassModal } from "../../components/learn/join-class-modal";

import { useTheme } from "../../lib/theme-context";
import { cn } from "../../lib/utils";
import { UserProfile } from "../../lib/types/user.types";
import { CourseModule } from "../../lib/types/course.types";

// Extended interface untuk menangani completedModules secara lokal
interface ExtendedUserProfile extends UserProfile {
  completedModules?: string[]; // Array of Module IDs
}

export default function LearnClient() {
  const router = useRouter();
  const { theme } = useTheme(); 
  
  // --- STATE MANAGEMENT ---
  const [userProfile, setUserProfile] = useState<ExtendedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Raw modules dari DB
  const [rawModules, setRawModules] = useState<CourseModule[]>([]);
  // Processed modules (setelah dihitung locking logic-nya)
  const [modules, setModules] = useState<CourseModule[]>([]); 
  
  const [myClasses, setMyClasses] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<"map" | "classes">("map");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);

  // --- 1. INITIAL FETCH (Modules & Auth) ---
  useEffect(() => {
    // A. Fetch Global Modules Sekali Saja (Static Content)
    const fetchModules = async () => {
      try {
        const modQ = query(collection(db, "global_modules"), orderBy("order", "asc"));
        const modSnap = await getDocs(modQ);
        
        if (!modSnap.empty) {
          const fetched = modSnap.docs.map(d => ({ id: d.id, ...d.data() })) as unknown as CourseModule[];
          setRawModules(fetched);
        } else {
          // Fallback jika DB kosong
          setRawModules([
            { 
              id: "dummy1", 
              title: "Selamat Datang!", 
              description: "Menunggu konten dari admin...", 
              level: 1, 
              order: 1, 
              xpReward: 50, 
              lessons: [] 
            } as any
          ]);
        }
      } catch (err) {
        console.error("Gagal load modules:", err);
      }
    };
    fetchModules();

    // B. Listener Auth & User Data Real-time
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      // Listener User Profile (Real-time updates untuk XP/Level/Completed)
      const unsubUser = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as ExtendedUserProfile;
          
          // Normalisasi Data (Handle root vs nested gamification)
          const normalizedUser = {
            ...userData,
            gamification: {
              xp: userData.gamification?.xp ?? (userData as any).xp ?? 0,
              level: userData.gamification?.level ?? (userData as any).level ?? 1,
              currentStreak: userData.gamification?.currentStreak ?? (userData as any).streak ?? 0,
              // ... copy properties lain jika perlu
            }
          } as ExtendedUserProfile;

          setUserProfile(normalizedUser);

          // Fetch Classes (Jika enrolledClasses berubah)
          const enrolled = (userData as any).enrolledClasses || [];
          if (enrolled.length > 0) {
            try {
              const classesPromises = enrolled.map(async (classId: string) => {
                const classDoc = await getDoc(doc(db, "classrooms", classId));
                return classDoc.exists() ? { id: classDoc.id, ...classDoc.data() } : null;
              });
              const classes = await Promise.all(classesPromises);
              setMyClasses(classes.filter((c: any) => c !== null));
            } catch (e) {
              console.error("Error fetching classes:", e);
            }
          }
        }
        setLoading(false);
      });

      return () => unsubUser();
    });

    return () => unsubscribeAuth();
  }, [router]);

  // --- 2. DYNAMIC LOCKING LOGIC (STRICT SEQUENTIAL) ---
  useEffect(() => {
    if (!userProfile || rawModules.length === 0) return;

    const userLevel = userProfile.gamification?.level || 1;
    const completedModules = userProfile.completedModules || []; // Array of Module IDs

    const processedModules = rawModules.map((mod, index) => {
      // 1. Modul Pertama selalu UNLOCKED
      if (index === 0) {
        return { ...mod, isLocked: false };
      }

      // 2. Ambil Modul Sebelumnya
      const prevModule = rawModules[index - 1];
      
      // 3. Cek apakah Modul Sebelumnya sudah SELESAI
      // Ini adalah kunci agar tidak bisa loncat meskipun level tinggi
      const isPrevCompleted = completedModules.includes(prevModule.id);

      // 4. Cek Syarat Level (Opsional tapi direkomendasikan)
      // Modul level 2 butuh user level 2.
      // Jika user level 10 tapi belum selesai modul level 1, tetap terkunci (karena poin 3)
      const isLevelMet = userLevel >= mod.level;

      // KESIMPULAN: UNLOCKED hanya jika Prev Selesai DAN Level Cukup
      const isLocked = !(isPrevCompleted && isLevelMet);

      return { ...mod, isLocked };
    });

    setModules(processedModules);

  }, [userProfile, rawModules]);


  // --- ACTIONS ---
  const handleJoinClass = async (code: string) => {
    setJoining(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      const codeUpper = code.toUpperCase();
      
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

      alert("Berhasil bergabung!");
      setIsJoinModalOpen(false);
      setActiveTab("classes");
    } catch (error) {
      console.error(error);
      alert("Gagal bergabung. Coba lagi nanti.");
    } finally {
      setJoining(false);
    }
  };

  // --- RENDER ---
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
        {/* Header */}
        <LearnHeader 
          theme={theme} 
          userProfile={userProfile} 
          onOpenJoinModal={() => setIsJoinModalOpen(true)} 
        />

        {/* Tab Navigation */}
        <div className="max-w-3xl mx-auto px-4 mt-8 mb-6">
          <div className={cn(
            "flex p-1 shadow-sm border transition-all w-full max-w-sm mx-auto",
            theme === "kids" ? "bg-white rounded-2xl border-2 border-sky-100 shadow-sky-100" : "bg-zinc-100/50 rounded-lg border-zinc-200"
          )}>
            <button onClick={() => setActiveTab("map")} className={cn(
              "flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-2",
              theme === "kids" ? "rounded-xl" : "rounded-md",
              activeTab === "map" 
                ? (theme === "kids" ? "bg-sky-100 text-sky-700 shadow-inner" : "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5")
                : "text-gray-400 hover:text-gray-600"
            )}>
              {theme === "kids" ? <MapIcon size={16}/> : <Layout size={14}/>} 
              {theme === "kids" ? "Peta" : "Kurikulum"}
            </button>
            <button onClick={() => setActiveTab("classes")} className={cn(
              "flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-2",
              theme === "kids" ? "rounded-xl" : "rounded-md",
              activeTab === "classes" 
                ? (theme === "kids" ? "bg-sky-100 text-sky-700 shadow-inner" : "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5")
                : "text-gray-400 hover:text-gray-600"
            )}>
              <School size={16} /> {theme === "kids" ? "Sekolahku" : "Kelas Saya"}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <main className={cn(
          "px-4 transition-all pb-20",
          theme === "kids" ? "max-w-xl mx-auto" : "max-w-3xl mx-auto"
        )}>
          
          {activeTab === "map" && (
            <>
              {/* Dynamic Module Rendering */}
              {theme === "pro" ? (
                <ModuleList modules={modules} />
              ) : (
                <AdventureMap modules={modules} />
              )}
            </>
          )}

          {activeTab === "classes" && (
            <ClassList 
              classes={myClasses} 
              theme={theme} 
              onOpenJoinModal={() => setIsJoinModalOpen(true)} 
            />
          )}
        </main>
      </div>

      <MobileNav />

      {/* Modal */}
      <JoinClassModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
        onJoin={handleJoinClass}
        isLoading={joining}
        theme={theme}
      />
    </div>
  );
}