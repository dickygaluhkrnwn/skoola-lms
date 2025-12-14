"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme-context"; 
import { cn } from "@/lib/utils";
import { onAuthStateChanged } from "firebase/auth";
import { UserProfile } from "@/lib/types/user.types";

// --- IMPORT SUB-COMPONENTS ---
import { ClassroomSidebar } from "@/components/student/classroom/ClassroomSidebar";
import { ClassroomMobileHeader, ClassroomMobileNav } from "@/components/student/classroom/MobileComponents";
import { 
  DashboardView, 
  AdventureView, 
  MaterialsView, 
  AssignmentsView, 
  PeopleView 
} from "@/components/student/classroom/ClassroomViews";

interface StudentClassroomClientProps {
  classId: string;
}

export default function StudentClassroomClient({ classId }: StudentClassroomClientProps) {
  const router = useRouter();
  const { theme } = useTheme(); 

  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [classData, setClassData] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classMembers, setClassMembers] = useState<any[]>([]); 
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "materials" | "assignments" | "people" | "adventure">("dashboard");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";

  // Auth Check & Fetch Logic
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Fetch User Profile untuk cek schoolId
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                setUserProfile(userDoc.data() as UserProfile);
            }
        } catch (e) {
            console.error("Error fetch user profile", e);
        }
      } else {
        router.push("/");
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!classId || !userId || !userProfile) return;

    const fetchClassAndMembers = async () => {
      try {
        const docRef = doc(db, "classrooms", classId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // --- VALIDASI ISOLASI SEKOLAH ---
          // 1. Cek apakah kelas punya schoolId (Backward compatibility: jika tdk punya, anggap public/legacy)
          // 2. Jika punya, pastikan sama dengan schoolId siswa
          if (data.schoolId && userProfile.schoolId && data.schoolId !== userProfile.schoolId) {
             console.warn("Access Denied: School mismatch");
             setAccessDenied(true);
             setLoading(false);
             return;
          }
          // --------------------------------

          setClassData(data);

          if (data.students && Array.isArray(data.students) && data.students.length > 0) {
              const membersPromises = data.students.map(async (uid: string) => {
                const userSnap = await getDoc(doc(db, "users", uid));
                if (userSnap.exists()) {
                   const userData = userSnap.data();
                   return {
                      uid: userSnap.id,
                      displayName: userData.displayName || "Siswa",
                      photoURL: userData.photoURL,
                      email: userData.email,
                      level: userData.level || userData.gamification?.level || 1,
                      xp: userData.xp || userData.gamification?.xp || 0
                   };
                }
                return null;
              });
              const members = await Promise.all(membersPromises);
              setClassMembers(members.filter(m => m !== null));
          }
        } else {
          alert("Kelas tidak ditemukan");
          router.push("/learn");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassAndMembers();

    // Realtime listener for Materials
    const materialsRef = collection(db, "classrooms", classId, "materials");
    const qMat = query(materialsRef, orderBy("createdAt", "desc"));
    const unsubMat = onSnapshot(qMat, (snapshot) => {
      const mats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaterials(mats);
    });

    // Realtime listener for Assignments
    const assignmentsRef = collection(db, "classrooms", classId, "assignments");
    const qAss = query(assignmentsRef, orderBy("createdAt", "desc"));
    const unsubAss = onSnapshot(qAss, (snapshot) => {
      const asses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignments(asses);
    });

    return () => {
      unsubMat();
      unsubAss();
    };
  }, [classId, router, userId, userProfile]);

  const classTotalXP = classMembers.reduce((total, member: any) => total + (member.xp || 0), 0);

  if (loading) return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center", isUni ? "bg-slate-950 text-white" : "bg-slate-900 text-white")}>
      {isKids ? (
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity }}>
              <span className="text-6xl">🏰</span>
          </motion.div>
      ) : (
          <Loader2 className={cn("animate-spin w-10 h-10 mb-4", isUni ? "text-indigo-500" : "text-teal-500")} /> 
      )}
      <p className={cn("font-medium animate-pulse mt-4", isKids && "font-display text-xl text-primary")}>
          {isKids ? "Membuka Gerbang Kelas..." : "Memuat Ruang Kelas..."}
      </p>
    </div>
  );

  if (accessDenied) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-4 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Akses Dibatasi</h1>
            <p className="text-slate-500 max-w-md mb-6">
                Maaf, Anda tidak memiliki izin untuk mengakses kelas ini karena terdaftar di sekolah yang berbeda.
            </p>
            <button 
                onClick={() => router.push('/learn')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
                Kembali ke Dashboard
            </button>
        </div>
      );
  }

  // Background logic update for Uni Theme
  const bgSoft = isKids ? "bg-yellow-50" 
    : isUni ? "bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200" 
    : isSMP ? "bg-slate-50/30" 
    : isSMA ? "bg-transparent text-slate-100" 
    : "bg-slate-50";

  // Data Adapter for Adventure Map
  const mapModules = [...materials, ...assignments].map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      isLocked: false, 
      type: item.type, 
      url: item.url, 
      locationData: item.locationData, 
      gameConfig: item.gameConfig, 
      content: item.content, 
      thumbnailUrl: item.type === 'video' ? '📺' : 
                    item.type === 'quiz' ? '📝' : 
                    item.type === 'game' ? '🎮' : 
                    item.type === 'map' ? '🗺️' : 
                    '📄' 
  }));

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-500 pb-24 md:pb-0 md:flex relative overflow-hidden", bgSoft)}>
      
      {/* --- UNI THEME BACKGROUND: Animated Mesh --- */}
      {isUni && (
         <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1121] to-indigo-950" />
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
         </div>
      )}

      {/* --- SMP THEME: AMBIENT BACKGROUND BLOBS --- */}
      {isSMP && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-400/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px] animate-pulse delay-700" />
            <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-fuchsia-400/20 rounded-full blur-[80px] animate-pulse delay-1000" />
        </div>
      )}

      {/* --- SMA THEME: AURORA MESH --- */}
      {isSMA && (
        <div className="fixed inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
           <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-teal-600/20 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
           <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      )}

      {/* 1. SIDEBAR (DESKTOP) */}
      <ClassroomSidebar 
          classData={classData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isKids={isKids}
          isUni={isUni}
          isSMP={isSMP}
          theme={theme}
      />

      {/* 2. MOBILE HEADER */}
      <ClassroomMobileHeader 
          classData={classData}
          isKids={isKids}
          isUni={isUni}
          isSMP={isSMP}
      />

      {/* 3. MOBILE NAV */}
      <ClassroomMobileNav 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isKids={isKids}
          isUni={isUni}
          isSMP={isSMP}
          theme={theme}
      />

      {/* 4. MAIN CONTENT AREA */}
      <main className={cn("flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto min-h-screen z-10", isUni && "text-slate-200")}>
         <div className="max-w-6xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
               
               {activeTab === "dashboard" && (
                  <DashboardView 
                      classData={classData} 
                      classTotalXP={classTotalXP} 
                      assignments={assignments} 
                      classMembers={classMembers} 
                      setActiveTab={setActiveTab} 
                      isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA} theme={theme}
                  />
               )}

               {activeTab === "adventure" && (
                  <AdventureView 
                    mapModules={mapModules} 
                    isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA} 
                    isClassroomContext={true}
                    classId={classId}
                  />
               )}

               {activeTab === "materials" && (
                  <MaterialsView materials={materials} isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA} theme={theme} />
               )}

               {activeTab === "assignments" && (
                  <AssignmentsView 
                      assignments={assignments} 
                      isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA} theme={theme} 
                      router={router} classId={classId}
                  />
               )}

               {activeTab === "people" && (
                  <PeopleView classMembers={classMembers} isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA} />
               )}

            </AnimatePresence>
         </div>
      </main>

    </div>
  );
}