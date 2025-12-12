"use client";

import React, { useState } from "react";
import { 
  Users, CheckCircle2, XCircle, MinusCircle, AlertCircle, Calendar, Clock
} from "lucide-react";
import { cn } from "../../../lib/utils";

// --- INTERFACES ---
interface StudentData {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  lastActiveModule?: string;
  // Field opsional lain jika ada di masa depan
}

interface AttendanceViewProps {
  students: StudentData[];
}

export default function AttendanceView({ students }: AttendanceViewProps) {
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");

  // Logic Hari Ini
  const today = new Date();
  const isSunday = today.getDay() === 0; // 0 = Minggu
  const formattedDate = today.toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  // Helper Logic Presensi
  const getStatus = (student: StudentData) => {
     if (isSunday) return "holiday";
     // Logic sederhana: jika ada lastActiveModule, dianggap hadir
     // Idealnya nanti dicek timestamp aktivitas terakhir vs hari ini
     return student.lastActiveModule ? "present" : "absent";
  };

  const filteredStudents = students.filter(s => {
     if (filter === "all") return true;
     return getStatus(s) === filter;
  });

  // Stats
  const presentCount = students.filter(s => getStatus(s) === "present").length;
  const absentCount = students.filter(s => getStatus(s) === "absent").length;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  return (
    <div className="max-w-5xl space-y-6">
       
       {/* 1. Header Section */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
           <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="text-blue-600" /> Presensi Kelas
           </h2>
           <p className="text-slate-500 text-sm mt-1">Pantau keaktifan belajar harian siswa secara real-time.</p>
         </div>
         <div className="text-right bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-xs font-bold uppercase text-slate-400 mb-1">Hari Ini</p>
           <p className="text-lg font-bold text-slate-800">
             {formattedDate}
           </p>
         </div>
       </div>

       {/* 2. Overview Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} />
             </div>
             <div>
                <p className="text-2xl font-bold text-green-700">{presentCount}</p>
                <p className="text-xs font-bold uppercase text-green-600/60">Siswa Hadir</p>
             </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                <XCircle size={24} />
             </div>
             <div>
                <p className="text-2xl font-bold text-red-700">{absentCount}</p>
                <p className="text-xs font-bold uppercase text-red-600/60">Belum Aktif</p>
             </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Users size={24} />
             </div>
             <div>
                <p className="text-2xl font-bold text-blue-700">{attendanceRate}%</p>
                <p className="text-xs font-bold uppercase text-blue-600/60">Tingkat Kehadiran</p>
             </div>
          </div>
       </div>

       {/* 3. Table Card */}
       <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
         
         {/* Filter Tabs */}
         <div className="flex border-b border-slate-100 px-4 pt-4 gap-2">
            <button 
               onClick={() => setFilter("all")}
               className={cn(
                  "px-4 py-2 text-sm font-bold border-b-2 transition-colors",
                  filter === "all" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-400 hover:text-slate-600"
               )}
            >
               Semua Siswa
            </button>
            <button 
               onClick={() => setFilter("present")}
               className={cn(
                  "px-4 py-2 text-sm font-bold border-b-2 transition-colors",
                  filter === "present" ? "border-green-600 text-green-700" : "border-transparent text-slate-400 hover:text-slate-600"
               )}
            >
               Hadir
            </button>
            <button 
               onClick={() => setFilter("absent")}
               className={cn(
                  "px-4 py-2 text-sm font-bold border-b-2 transition-colors",
                  filter === "absent" ? "border-red-600 text-red-700" : "border-transparent text-slate-400 hover:text-slate-600"
               )}
            >
               Belum Hadir
            </button>
         </div>
         
         {/* Empty State */}
         {students.length === 0 ? (
           <div className="text-center py-16 px-4 bg-slate-50/50 flex flex-col items-center">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-300">
               <Users size={32} />
             </div>
             <h3 className="font-bold text-slate-700 mb-1">Tidak Ada Data</h3>
             <p className="text-sm text-slate-400 max-w-xs">Belum ada murid di kelas ini.</p>
           </div>
         ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
               Tidak ada siswa dengan status ini.
            </div>
         ) : (
           /* Table Data */
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nama Murid</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Aktivitas Terakhir</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Status Hari Ini</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((s) => {
                     const status = getStatus(s);
                     
                     let statusEl;
                     if (status === "holiday") {
                        statusEl = (
                           <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                              <MinusCircle size={14}/> Libur
                           </span>
                        );
                     } else if (status === "present") {
                        statusEl = (
                           <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                              <CheckCircle2 size={14}/> Hadir
                           </span>
                        );
                     } else {
                        statusEl = (
                           <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                              <XCircle size={14}/> Alpa
                           </span>
                        );
                     }

                     return (
                        <tr key={s.uid} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs overflow-hidden border border-slate-200">
                                    {s.photoURL ? <img src={s.photoURL} alt="av" className="w-full h-full object-cover"/> : "🎓"}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-700 text-sm">{s.displayName}</p>
                                    <p className="text-xs text-slate-400">{s.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-sm text-slate-500">
                              {s.lastActiveModule ? (
                                 <span className="flex items-center gap-2 text-blue-600 font-medium">
                                    <Clock size={14} /> Mengerjakan Modul
                                 </span>
                              ) : (
                                 <span className="text-slate-400 italic">Belum ada aktivitas</span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-center">
                              {statusEl}
                           </td>
                        </tr>
                     )
                  })}
               </tbody>
             </table>
           </div>
         )}
       </div>
       
       {/* 3. Info Rules Box */}
       <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
         <AlertCircle className="text-yellow-600 shrink-0" size={20} />
         <div>
            <h4 className="font-bold text-yellow-800 text-sm">Aturan Presensi Otomatis</h4>
            <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
              Siswa dianggap <strong>Hadir</strong> jika sistem mendeteksi aktivitas belajar (menyelesaikan materi/kuis) pada hari tersebut.
              Hari Minggu dihitung sebagai hari libur.
            </p>
         </div>
       </div>
    </div>
  );
}