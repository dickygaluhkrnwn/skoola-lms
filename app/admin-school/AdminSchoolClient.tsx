"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  School, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Loader2,
  TrendingUp,
  Calendar,
  AlertCircle,
  BookOpen, // Import Icon Buku untuk Kelas
  Library   // Import Icon Library untuk Mata Pelajaran
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getCountFromServer, getDocs } from "firebase/firestore";
import { UserProfile } from "@/lib/types/user.types";
import { cn } from "@/lib/utils";

// IMPORT KOMPONEN VIEW
import UserManagementView from "@/components/admin-school/UserManagementView";
import ForumManagementView from "@/components/admin-school/ForumManagementView";
import SettingsView from "@/components/admin-school/SettingsView";
import ScheduleManagementView from "@/components/admin-school/ScheduleManagementView";
import ClassManagementView from "@/components/admin-school/ClassManagementView"; 
import CourseManagementView from "@/components/admin-school/CourseManagementView"; // Import View Baru

// --- KOMPONEN SIDEBAR ITEM ---
function SidebarItem({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all text-sm font-bold mb-1",
        active 
          ? "bg-indigo-50 text-indigo-600 border-2 border-indigo-100" 
          : "text-slate-500 hover:bg-slate-50 border-2 border-transparent hover:text-slate-900"
      )}
    >
      {icon} {label}
    </button>
  );
}

// --- KOMPONEN STAT CARD ---
function StatCard({ 
  title, 
  value, 
  icon, 
  loading = false,
  color = "indigo" 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  loading?: boolean;
  color?: "indigo" | "blue" | "green" | "orange";
}) {
  const colorStyles = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          {loading ? (
            <div className="h-9 w-24 bg-slate-100 rounded animate-pulse" />
          ) : (
            <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", colorStyles[color])}>
          {icon}
        </div>
      </div>
      {/* Dekorasi Background */}
      <div className={cn("absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10", colorStyles[color].split(" ")[0])} />
    </div>
  );
}

export default function AdminSchoolClient() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk Data Sekolah Admin
  const [adminSchoolId, setAdminSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>("");

  // Tambahkan 'courses' ke activeTab state
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "forum" | "settings" | "schedule" | "classes" | "courses">("dashboard");

  // State Statistik Realtime
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    forums: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // 1. Auth & Role Check & Get School ID
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          
          // STRICT CHECK: Hanya Role 'admin' yang boleh masuk
          if (userData.role !== "admin") {
            router.push("/learn"); 
            return;
          }
          setUserProfile(userData);

          // FETCH SCHOOL INFO
          const schoolQuery = query(
             collection(db, "schools"), 
             where("adminId", "==", user.uid)
          );
          const schoolSnap = await getDocs(schoolQuery);
          
          if (!schoolSnap.empty) {
             const sDoc = schoolSnap.docs[0];
             setAdminSchoolId(sDoc.id);
             setSchoolName(sDoc.data().name);
          }

        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Gagal verifikasi admin:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 2. Fetch Statistik Realtime (ISOLATED PER SCHOOL)
  useEffect(() => {
    if (activeTab === "dashboard" && userProfile) {
      const fetchStats = async () => {
        setLoadingStats(true);
        try {
          if (!adminSchoolId) {
             setStats({ students: 0, teachers: 0, classes: 0, forums: 0 });
             return;
          }

          // A. Count Students (Filtered by School)
          const studentsQuery = query(
             collection(db, "users"), 
             where("role", "==", "student"),
             where("schoolId", "==", adminSchoolId)
          );
          const studentsSnap = await getCountFromServer(studentsQuery);

          // B. Count Teachers (Filtered by School)
          const teachersQuery = query(
             collection(db, "users"), 
             where("role", "==", "teacher"),
             where("schoolId", "==", adminSchoolId)
          );
          const teachersSnap = await getCountFromServer(teachersQuery);

          // C. Count Forums (Filtered by School)
          const forumsQuery = query(
             collection(db, "forums"),
             where("schoolId", "==", adminSchoolId)
          );
          const forumsSnap = await getCountFromServer(forumsQuery);

          // D. Count Classes (Filtered by School)
          const classesQuery = query(
             collection(db, "classrooms"),
             where("schoolId", "==", adminSchoolId)
          );
          let classesCount = 0;
          try {
             const classesSnap = await getCountFromServer(classesQuery);
             classesCount = classesSnap.data().count;
          } catch (e) {
             console.log("Class count index missing or field missing, skipping...");
          }

          setStats({
            students: studentsSnap.data().count,
            teachers: teachersSnap.data().count,
            classes: classesCount,
            forums: forumsSnap.data().count,
          });
        } catch (error) {
          console.error("Gagal memuat statistik:", error);
        } finally {
          setLoadingStats(false);
        }
      };

      fetchStats();
    }
  }, [activeTab, userProfile, adminSchoolId]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        <span className="font-medium">Memuat Dashboard Sekolah...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      
      {/* --- SIDEBAR ADMIN --- */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 z-50">
        <div className="p-6">
           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
             <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
             <span className="text-xs font-bold text-indigo-700 tracking-wide uppercase">Operator Sekolah</span>
           </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
           <SidebarItem 
             active={activeTab === "dashboard"} 
             onClick={() => setActiveTab("dashboard")} 
             icon={<LayoutDashboard size={20} />} 
             label="Dashboard" 
           />
           <SidebarItem 
             active={activeTab === "users"} 
             onClick={() => setActiveTab("users")} 
             icon={<Users size={20} />} 
             label="Manajemen User" 
           />
           <SidebarItem 
             active={activeTab === "classes"} 
             onClick={() => setActiveTab("classes")} 
             icon={<BookOpen size={20} />} 
             label="Manajemen Kelas" 
           />
           {/* NEW SIDEBAR ITEM: COURSES */}
           <SidebarItem 
             active={activeTab === "courses"} 
             onClick={() => setActiveTab("courses")} 
             icon={<Library size={20} />} 
             label="Mata Pelajaran" 
           />
           <SidebarItem 
             active={activeTab === "schedule"} 
             onClick={() => setActiveTab("schedule")} 
             icon={<Calendar size={20} />} 
             label="Jadwal Pelajaran" 
           />
           <SidebarItem 
             active={activeTab === "forum"} 
             onClick={() => setActiveTab("forum")} 
             icon={<MessageSquare size={20} />} 
             label="Forum Sekolah" 
           />
           <SidebarItem 
             active={activeTab === "settings"} 
             onClick={() => setActiveTab("settings")} 
             icon={<Settings size={20} />} 
             label="Pengaturan" 
           />
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 px-2 py-2 mb-2">
             <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
               {userProfile?.displayName?.[0] || "A"}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-bold truncate text-slate-800">{userProfile?.displayName}</p>
               <p className="text-xs text-slate-500 truncate">Administrator</p>
             </div>
           </div>
           <button 
             onClick={handleLogout} 
             className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent rounded-xl w-full text-xs font-bold transition-all"
           >
             <LogOut size={16} /> Keluar Aplikasi
           </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        
        {/* VIEW: DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-8">
                 <h1 className="text-2xl font-bold text-slate-900">Selamat Datang, Admin! 👋</h1>
                 <p className="text-slate-500">
                   Panel Kontrol untuk <span className="font-bold text-indigo-600">{schoolName || "Sekolah Anda"}</span>
                 </p>
              </header>

              {!adminSchoolId ? (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8 flex gap-4 items-start">
                    <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0" />
                    <div>
                       <h3 className="font-bold text-yellow-800 mb-1">Konfigurasi Sekolah Diperlukan</h3>
                       <p className="text-sm text-yellow-700 mb-3">
                         Anda belum mengatur identitas sekolah. Silakan atur nama dan kode sekolah agar siswa & guru dapat bergabung.
                       </p>
                       <button 
                         onClick={() => setActiveTab("settings")}
                         className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm font-bold transition-colors"
                       >
                         Ke Pengaturan Sekolah
                       </button>
                    </div>
                 </div>
              ) : (
                 <>
                   {/* Stats Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <StatCard 
                        title="Total Siswa" 
                        value={stats.students} 
                        loading={loadingStats}
                        icon={<Users size={24} />} 
                        color="blue"
                      />
                      <StatCard 
                        title="Total Guru" 
                        value={stats.teachers} 
                        loading={loadingStats}
                        icon={<School size={24} />} 
                        color="indigo"
                      />
                      <StatCard 
                        title="Kelas Aktif" 
                        value={stats.classes} 
                        loading={loadingStats}
                        icon={<BarChart3 size={24} />} 
                        color="green"
                      />
                      <StatCard 
                        title="Forum Aktif" 
                        value={stats.forums} 
                        loading={loadingStats}
                        icon={<MessageSquare size={24} />} 
                        color="orange"
                      />
                   </div>

                   {/* Status Sistem */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 min-h-[300px]">
                         <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800">Aktivitas Terkini</h3>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                               <TrendingUp size={12} /> Live
                            </span>
                         </div>
                         <div className="space-y-4">
                            <div className="flex gap-4 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">S</div>
                               <div>
                                  <p className="text-sm font-bold text-slate-800">Sistem siap digunakan</p>
                                  <p className="text-xs text-slate-500 mt-0.5">Database dan layanan cloud berjalan normal.</p>
                               </div>
                               <span className="text-[10px] text-slate-400 ml-auto whitespace-nowrap">Baru saja</span>
                            </div>
                            
                            {stats.forums > 0 && (
                               <div className="flex gap-4 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">F</div>
                                  <div>
                                     <p className="text-sm font-bold text-slate-800">Forum Sekolah Aktif</p>
                                     <p className="text-xs text-slate-500 mt-0.5">{stats.forums} forum komunitas telah dibuat.</p>
                                  </div>
                                  <span className="text-[10px] text-slate-400 ml-auto whitespace-nowrap">Info</span>
                               </div>
                            )}
                         </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-2xl border border-slate-100">
                         <h3 className="font-bold text-slate-800 mb-4">Status Layanan</h3>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                               <span className="text-slate-600 font-medium">Database</span>
                               <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs bg-white px-2 py-1 rounded-md shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
                               </span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                               <span className="text-slate-600 font-medium">Storage</span>
                               <span className="text-blue-700 font-bold flex items-center gap-1.5 text-xs bg-white px-2 py-1 rounded-md shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Aman
                               </span>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100">
                               <p className="text-xs text-slate-400 text-center">Skoola LMS v2.0</p>
                            </div>
                         </div>
                      </div>
                   </div>
                 </>
              )}
           </div>
        )}

        {/* VIEW: USER MANAGEMENT */}
        {activeTab === "users" && (
           <UserManagementView />
        )}

        {/* VIEW: CLASS MANAGEMENT */}
        {activeTab === "classes" && (
           <ClassManagementView />
        )}

        {/* VIEW: COURSE MANAGEMENT (NEW) */}
        {activeTab === "courses" && (
           <CourseManagementView />
        )}

        {/* VIEW: SCHEDULE MANAGEMENT */}
        {activeTab === "schedule" && (
           <ScheduleManagementView />
        )}

        {/* VIEW: FORUM MANAGEMENT */}
        {activeTab === "forum" && userProfile && (
           <ForumManagementView userProfile={userProfile} />
        )}

        {/* VIEW: SETTINGS */}
        {activeTab === "settings" && (
           <SettingsView />
        )}

      </main>
    </div>
  );
}