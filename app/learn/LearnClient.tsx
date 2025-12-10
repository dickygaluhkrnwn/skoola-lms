"use client";

import React, { useState, useEffect } from "react";
import { School, Layout, Map as MapIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { 
  doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, increment, orderBy 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// --- IMPORTS: NEW COMPONENTS ---
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LearnHeader } from "@/components/learn/learn-header";
import { AdventureMap } from "@/components/learn/adventure-map"; // Kids View
import { ModuleList } from "@/components/learn/module-list";     // Pro View
import { ClassList } from "@/components/learn/class-list";
import { JoinClassModal } from "@/components/learn/join-class-modal";

import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/lib/types/user.types";
import { CourseModule } from "@/lib/types/course.types";

export default function LearnClient() {
  const router = useRouter();
  const { theme } = useTheme(); 
  
  // --- STATE MANAGEMENT ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<CourseModule[]>([]); 
  const [myClasses, setMyClasses] = useState<any[]>([]); // TODO: Define Class Type
  
  const [activeTab, setActiveTab] = useState<"map" | "classes">("map");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);

  // --- DATA FETCHING ---
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
          
          // 2. Fetch Classes
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
          // Fallback Dummy Data
          setModules([
            { 
              id: "dummy1", 
              title: "Selamat Datang!", 
              description: "Modul pertama dari Admin", 
              level: 1,
              order: 1,
              xpReward: 50,
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

  // --- ACTIONS ---
  const handleJoinClass = async (code: string) => {
    setJoining(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      const codeUpper = code.toUpperCase();
      
      // Validasi Lokal
      if (myClasses.some(c => c.code === codeUpper)) {
        alert("Kamu sudah bergabung di kelas ini!");
        setJoining(false);
        return;
      }

      // Cek Firestore
      const q = query(collection(db, "classrooms"), where("code", "==", codeUpper));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Kode kelas tidak ditemukan!");
        setJoining(false);
        return;
      }

      const classDoc = querySnapshot.docs[0];
      const classId = classDoc.id;
      
      // Update Database
      await updateDoc(doc(db, "classrooms", classId), {
        students: arrayUnion(user.uid),
        studentCount: increment(1)
      });
      await updateDoc(doc(db, "users", user.uid), {
        enrolledClasses: arrayUnion(classId)
      });

      // Update State Lokal (Optimistic UI update)
      setMyClasses(prev => [...prev, { id: classId, ...classDoc.data() }]);
      
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

  // --- LOADING STATE ---
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
        {/* 1. Header Component */}
        <LearnHeader 
          theme={theme} 
          userProfile={userProfile} 
          onOpenJoinModal={() => setIsJoinModalOpen(true)} 
        />

        {/* 2. Sub-Nav Tabs (Inline Navigation) */}
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

        {/* 3. Main Content Area */}
        <main className={cn(
          "px-4 transition-all pb-20",
          theme === "kids" ? "max-w-xl mx-auto" : "max-w-3xl mx-auto"
        )}>
          {/* LOGIC RENDERING BERDASARKAN TAB & TEMA */}
          
          {activeTab === "map" && (
            <>
              {/* Jika Pro -> Tampilkan List, Jika Kids -> Tampilkan Peta */}
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

      {/* 4. Modal Component */}
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