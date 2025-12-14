"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Users, CheckCircle2, XCircle, MinusCircle, AlertCircle, 
  Calendar, Clock, MapPin, ChevronRight, Lock, Unlock
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";

// --- INTERFACES ---
interface StudentData {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  lastActiveModule?: string;
}

interface ScheduleItem {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
  room?: string;
  subjectId?: string;
}

interface AttendanceViewProps {
  students: StudentData[];
}

const DAYS_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function AttendanceView({ students }: AttendanceViewProps) {
  const params = useParams();
  const classId = params.classId as string;
  const appId = (typeof window !== 'undefined' && (window as any).__app_id) || 'skoola-lms-default';

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // State Presensi Lokal (Simulasi)
  // Di real app, ini akan sync dengan collection 'attendance_records'
  const [attendanceState, setAttendanceState] = useState<Record<string, "present" | "absent" | "late" | "excused">>({});

  // Logic Hari Ini
  const today = new Date();
  const currentDayName = DAYS_MAP[today.getDay()];
  const currentTimeString = today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  
  const formattedDate = today.toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  // --- 1. FETCH SCHEDULES HARI INI ---
  useEffect(() => {
    if (!classId || !appId) return;

    const fetchTodaySchedule = async () => {
      try {
        setLoading(true);
        // Query ke artifacts schedules
        const q = query(
          collection(db, 'artifacts', appId, 'public', 'data', 'schedules'),
          where("classId", "==", classId),
          where("day", "==", currentDayName) // Filter hari ini
        );
        
        // Note: Sort client-side karena compound query kadang butuh index
        const snapshot = await getDocs(q);
        const todaysSchedules = snapshot.docs.map(doc => ({
           id: doc.id,
           ...doc.data()
        } as ScheduleItem));

        // Sort by start time
        todaysSchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        setSchedules(todaysSchedules);
      } catch (error) {
        console.error("Gagal load jadwal:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySchedule();
  }, [classId, currentDayName, appId]);

  // Helper: Cek status sesi (Active, Upcoming, Done)
  const getSessionStatus = (item: ScheduleItem) => {
     if (currentTimeString >= item.startTime && currentTimeString <= item.endTime) return "active";
     if (currentTimeString < item.startTime) return "upcoming";
     return "done";
  };

  // Helper: Init state presensi saat sesi dibuka
  const handleOpenSession = (scheduleId: string) => {
     setActiveSessionId(scheduleId);
     // Default semua siswa hadir (optimistic)
     const initial: any = {};
     students.forEach(s => initial[s.uid] = "present");
     setAttendanceState(initial);
  };

  const toggleStatus = (studentId: string) => {
     setAttendanceState(prev => {
        const current = prev[studentId];
        const next = current === "present" ? "absent" : 
                     current === "absent" ? "late" : 
                     current === "late" ? "excused" : "present";
        return { ...prev, [studentId]: next };
     });
  };

  // Stats calculation
  const getStats = () => {
     const total = students.length;
     if (total === 0) return { present: 0, absent: 0, rate: 0 };
     const present = Object.values(attendanceState).filter(s => s === "present" || s === "late").length;
     return {
        present,
        absent: total - present,
        rate: Math.round((present / total) * 100)
     };
  };

  return (
    <div className="max-w-5xl space-y-6 pb-20">
       
       {/* 1. Header Section */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
           <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="text-blue-600" /> Presensi Kelas
           </h2>
           <p className="text-slate-500 text-sm mt-1">
              {currentDayName === "Minggu" ? "Hari Libur" : `Jadwal Pelajaran Hari ${currentDayName}`}
           </p>
         </div>
         <div className="text-right bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-xs font-bold uppercase text-slate-400 mb-1">Hari Ini</p>
           <p className="text-lg font-bold text-slate-800">
             {formattedDate}
           </p>
         </div>
       </div>

       {/* 2. Schedule Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List Jadwal Hari Ini */}
          <div className="lg:col-span-1 space-y-4">
             <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Clock size={18} /> Sesi Hari Ini
             </h3>
             
             {loading ? (
                <div className="text-center py-8 text-slate-400 text-sm">Memuat jadwal...</div>
             ) : schedules.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 text-center">
                   <p className="text-slate-500 text-sm">Tidak ada jadwal pelajaran hari ini.</p>
                </div>
             ) : (
                <div className="space-y-3">
                   {schedules.map(item => {
                      const status = getSessionStatus(item);
                      const isActive = activeSessionId === item.id;
                      
                      return (
                         <div 
                            key={item.id}
                            onClick={() => handleOpenSession(item.id)}
                            className={cn(
                               "p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                               isActive 
                                 ? "bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-200" 
                                 : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm"
                            )}
                         >
                            <div className="flex justify-between items-start mb-2">
                               <span className={cn(
                                  "text-xs font-bold px-2 py-0.5 rounded",
                                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                               )}>
                                  {item.startTime} - {item.endTime}
                               </span>
                               {status === "active" && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider animate-pulse text-green-500 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                     Live
                                  </span>
                               )}
                            </div>
                            <h4 className={cn("font-bold text-lg", isActive ? "text-white" : "text-slate-800")}>
                               {item.subjectName}
                            </h4>
                            <p className={cn("text-xs flex items-center gap-1 mt-1", isActive ? "text-blue-100" : "text-slate-500")}>
                               <Users size={12} /> {item.teacherName}
                            </p>
                            
                            {isActive && (
                               <div className="absolute -right-2 -bottom-2 text-white/10">
                                  <CheckCircle2 size={64} />
                               </div>
                            )}
                         </div>
                      );
                   })}
                </div>
             )}
          </div>

          {/* Attendance Sheet */}
          <div className="lg:col-span-2">
             {activeSessionId ? (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-right-4">
                   {/* Sheet Header */}
                   <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                         <h3 className="font-bold text-slate-800 text-lg">Lembar Presensi</h3>
                         <p className="text-sm text-slate-500">
                            {schedules.find(s => s.id === activeSessionId)?.subjectName} • {formattedDate}
                         </p>
                      </div>
                      <div className="flex gap-4 text-center">
                         <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Hadir</p>
                            <p className="text-xl font-bold text-green-600">{getStats().present}</p>
                         </div>
                         <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Absen</p>
                            <p className="text-xl font-bold text-red-500">{getStats().absent}</p>
                         </div>
                         <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Rate</p>
                            <p className="text-xl font-bold text-blue-600">{getStats().rate}%</p>
                         </div>
                      </div>
                   </div>

                   {/* Student List */}
                   {students.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">Belum ada siswa di kelas ini.</div>
                   ) : (
                      <div className="divide-y divide-slate-100">
                         {students.map((student) => {
                            const status = attendanceState[student.uid] || "absent";
                            return (
                               <div key={student.uid} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                        {student.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover"/> : null}
                                     </div>
                                     <div>
                                        <p className="font-bold text-slate-700">{student.displayName}</p>
                                        <p className="text-xs text-slate-400">{student.email}</p>
                                     </div>
                                  </div>
                                  
                                  <button 
                                     onClick={() => toggleStatus(student.uid)}
                                     className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all min-w-[120px] justify-center border",
                                        status === "present" ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" :
                                        status === "absent" ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" :
                                        status === "late" ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" :
                                        "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" // excused
                                     )}
                                  >
                                     {status === "present" && <><CheckCircle2 size={16}/> Hadir</>}
                                     {status === "absent" && <><XCircle size={16}/> Absen</>}
                                     {status === "late" && <><Clock size={16}/> Terlambat</>}
                                     {status === "excused" && <><MinusCircle size={16}/> Izin</>}
                                  </button>
                               </div>
                            );
                         })}
                      </div>
                   )}
                   
                   {/* Footer Save Action (Placeholder) */}
                   <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                      <button 
                        onClick={() => alert("Data presensi tersimpan!")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
                      >
                         Simpan Presensi
                      </button>
                   </div>
                </div>
             ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl h-full flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-300">
                      <Users size={32} />
                   </div>
                   <h3 className="font-bold text-slate-700 text-lg">Pilih Sesi Jadwal</h3>
                   <p className="text-slate-400 text-sm max-w-xs mt-1">
                      Klik salah satu sesi jadwal di sebelah kiri untuk membuka lembar presensi.
                   </p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}