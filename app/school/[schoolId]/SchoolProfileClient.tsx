"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, School, MapPin, Users, Trophy, 
  Crown, Star, GraduationCap, Building2, BookOpen 
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { 
  doc, getDoc, collection, query, where, getDocs, limit 
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { School as SchoolType, UserProfile } from "@/lib/types/user.types";

export default function SchoolProfileClient({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<SchoolType | null>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [studentCount, setStudentCount] = useState(0);

  // Helper Theme (Untuk styling UI viewer)
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMA = theme === "sma";
  const isSMP = theme === "smp";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch School Data
        const schoolDoc = await getDoc(doc(db, "schools", schoolId));
        
        if (schoolDoc.exists()) {
           const sData = { id: schoolDoc.id, ...schoolDoc.data() } as SchoolType;
           setSchool(sData);

           // 2. Fetch Top Students (Limit 20 for preview)
           // Mencari user yang punya field 'schoolId' == schoolId ini
           const usersRef = collection(db, "users");
           const qStudents = query(
               usersRef, 
               where("schoolId", "==", schoolId),
               limit(20)
           );
           
           const studentsSnap = await getDocs(qStudents);
           const studentsList = studentsSnap.docs.map(d => d.data() as UserProfile);
           setStudents(studentsList);
           setStudentCount(studentsSnap.size); // Note: For exact count, use getCountFromServer in prod
        } else {
           // School not found
           setSchool(null);
        }
      } catch (err) {
        console.error("Error fetching school profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) fetchData();
  }, [schoolId]);

  // --- STYLES ---
  const bgStyle = isKids ? "bg-yellow-50" 
    : isUni ? "bg-slate-950 text-slate-100" 
    : isSMP ? "bg-indigo-50/30" 
    : isSMA ? "bg-slate-950 text-slate-200" 
    : "bg-slate-50";

  const cardStyle = isUni ? "bg-slate-900/50 border-white/10 backdrop-blur-md" 
    : isSMA ? "bg-slate-900/60 border-teal-500/20 backdrop-blur-md"
    : "bg-white border-slate-200 shadow-sm";

  // Level Badge Helper
  const getLevelBadge = (level: string) => {
      switch(level) {
          case 'sd': return { label: 'Sekolah Dasar', color: 'bg-red-100 text-red-600 border-red-200', icon: <Star size={14}/> };
          case 'smp': return { label: 'SMP', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: <BookOpen size={14}/> };
          case 'sma': return { label: 'SMA/K', color: 'bg-teal-100 text-teal-600 border-teal-200', icon: <Building2 size={14}/> };
          case 'uni': return { label: 'Universitas', color: 'bg-indigo-100 text-indigo-600 border-indigo-200', icon: <GraduationCap size={14}/> };
          default: return { label: 'Institusi', color: 'bg-slate-100 text-slate-600', icon: <School size={14}/> };
      }
  };

  if (loading) return <div className={cn("min-h-screen flex items-center justify-center", bgStyle)}>Loading...</div>;

  if (!school) {
      return (
          <div className={cn("min-h-screen flex flex-col items-center justify-center text-center p-6", bgStyle)}>
              <School size={64} className="opacity-20 mb-4" />
              <h2 className="text-2xl font-bold opacity-70">Sekolah Tidak Ditemukan</h2>
              <Button onClick={() => router.push("/social")} variant="outline" className="mt-4">Kembali ke Sosial</Button>
          </div>
      );
  }

  const levelInfo = getLevelBadge(school.level);

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-500 pb-20", bgStyle)}>
        
        {/* --- HERO HEADER --- */}
        <div className={cn("h-64 relative overflow-hidden flex items-end p-6", 
            school.level === 'uni' ? "bg-gradient-to-r from-indigo-900 to-violet-900" :
            school.level === 'sma' ? "bg-gradient-to-r from-slate-900 to-teal-900" :
            school.level === 'smp' ? "bg-gradient-to-r from-blue-600 to-indigo-600" :
            "bg-gradient-to-r from-red-500 to-orange-500"
        )}>
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center text-4xl border-4 border-white/20 backdrop-blur-sm">
                        🏫
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 bg-white/90 shadow-sm", levelInfo.color)}>
                                {levelInfo.icon} {levelInfo.label}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight drop-shadow-md">
                            {school.name}
                        </h1>
                        <div className="flex items-center gap-4 text-white/90 text-sm font-medium">
                            <span className="flex items-center gap-1"><MapPin size={14}/> {school.address || "Lokasi belum diatur"}</span>
                        </div>
                    </div>
                </div>

                <Button 
                    onClick={() => router.back()} 
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
                >
                    <ArrowLeft size={16} className="mr-2" /> Kembali
                </Button>
            </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: STATS */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className={cn("p-4 rounded-2xl border flex flex-col items-center justify-center text-center h-32", cardStyle)}>
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-2 text-yellow-600">
                            <Trophy size={20} />
                        </div>
                        <span className="text-2xl font-black">{school.arenaStats?.totalPoints?.toLocaleString() || 0}</span>
                        <span className="text-xs opacity-60 uppercase font-bold tracking-wider">Total Poin Arena</span>
                    </div>
                    <div className={cn("p-4 rounded-2xl border flex flex-col items-center justify-center text-center h-32", cardStyle)}>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 text-blue-600">
                            <Users size={20} />
                        </div>
                        <span className="text-2xl font-black">{studentCount}+</span>
                        <span className="text-xs opacity-60 uppercase font-bold tracking-wider">Siswa Terdaftar</span>
                    </div>
                    <div className={cn("p-4 rounded-2xl border flex flex-col items-center justify-center text-center h-32 col-span-2 md:col-span-1", cardStyle)}>
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2 text-purple-600">
                            <Crown size={20} />
                        </div>
                        <span className="text-2xl font-black">#{school.arenaStats?.globalRank || "-"}</span>
                        <span className="text-xs opacity-60 uppercase font-bold tracking-wider">Rank Nasional</span>
                    </div>
                </div>

                {/* Students Roster */}
                <div className={cn("p-6 rounded-2xl border min-h-[400px]", cardStyle)}>
                    <h3 className={cn("font-bold mb-6 flex items-center gap-2 text-lg", (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                        <Users className="text-teal-500" /> Daftar Siswa
                    </h3>

                    <div className="space-y-4">
                        {students.length === 0 ? (
                            <div className="text-center py-12 opacity-50">
                                <p>Belum ada siswa yang terdaftar di sistem.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {students.map((student) => (
                                    <div key={student.uid} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md", 
                                        (isUni || isSMA) ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-slate-100"
                                    )}>
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200/20">
                                            {student.photoURL ? (
                                                <img src={student.photoURL} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                                    {student.displayName?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-sm font-bold truncate", (isUni || isSMA) ? "text-slate-200" : "text-slate-800")}>
                                                {student.displayName}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs opacity-60">
                                                <span className="capitalize">{student.role}</span>
                                                <span>•</span>
                                                <span>Lvl {student.gamification?.level || 1}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {studentCount > 20 && (
                            <div className="text-center pt-4">
                                <Button variant="ghost" className="text-xs opacity-60">Muat Lebih Banyak...</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: INFO & ACTIONS */}
            <div className="space-y-6">
                
                {/* About Card */}
                <div className={cn("p-5 rounded-2xl border", cardStyle)}>
                    <h3 className={cn("font-bold mb-3 text-sm", (isUni || isSMA) ? "text-white" : "text-slate-800")}>Tentang Sekolah</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs opacity-50 uppercase font-bold mb-1">Kode Sekolah</p>
                            <p className={cn("font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit", (isUni || isSMA) ? "text-slate-300" : "text-slate-700")}>
                                {school.schoolCode}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs opacity-50 uppercase font-bold mb-1">Alamat</p>
                            <p className={cn("text-sm", (isUni || isSMA) ? "text-slate-300" : "text-slate-700")}>
                                {school.address || "-"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs opacity-50 uppercase font-bold mb-1">Terdaftar Sejak</p>
                            <p className={cn("text-sm", (isUni || isSMA) ? "text-slate-300" : "text-slate-700")}>
                                {school.createdAt ? new Date(school.createdAt).toLocaleDateString() : "-"}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}