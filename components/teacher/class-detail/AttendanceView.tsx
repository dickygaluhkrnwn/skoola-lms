"use client";

import React from "react";
import { 
  Users, CheckCircle2, XCircle, MinusCircle, AlertCircle 
} from "lucide-react";

// --- INTERFACES ---
interface StudentData {
  uid: string;
  displayName: string;
  lastActiveModule?: string;
  // Nanti kita akan butuh timestamp asli dari backend untuk presensi akurat
  // lastStudyTimestamp?: any; 
}

interface AttendanceViewProps {
  students: StudentData[];
}

export default function AttendanceView({ students }: AttendanceViewProps) {
  // Logic Hari Ini
  const today = new Date();
  const isSunday = today.getDay() === 0; // 0 = Minggu
  const formattedDate = today.toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  });

  return (
    <div className="max-w-5xl space-y-6">
       {/* 1. Header Section */}
       <div className="flex justify-between items-end">
         <div>
           <h2 className="text-2xl font-bold text-slate-900">Presensi Kelas</h2>
           <p className="text-slate-500">Pantau keaktifan belajar harian siswa.</p>
         </div>
         <div className="text-right">
           <p className="text-xs font-bold uppercase text-slate-400 mb-1">Hari Ini</p>
           <p className="text-xl font-bold text-blue-600">
             {formattedDate}
           </p>
         </div>
       </div>

       {/* 2. Table Card */}
       <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
         {/* Legend (Keterangan Icon) */}
         <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500"/> 
                <span className="font-medium">Hadir (Belajar)</span>
            </div>
            <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500"/> 
                <span className="font-medium">Belum Belajar</span>
            </div>
            <div className="flex items-center gap-2">
                <MinusCircle size={16} className="text-slate-400"/> 
                <span className="font-medium">Libur (Minggu)</span>
            </div>
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
         ) : (
           /* Table Data */
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100">
                   <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nama Murid</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Aktivitas Terakhir</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Status Hari Ini</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {students.map((s) => {
                      // LOGIC PRESENSI SEMENTARA
                      // Logic: Jika punya lastActiveModule -> dianggap sudah belajar hari ini.
                      // Nanti perlu diganti dengan pengecekan Timestamp tanggal hari ini.
                      const hasStudiedToday = s.lastActiveModule ? true : false; 
                      
                      let statusEl;
                      if (isSunday) {
                         statusEl = (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                                <MinusCircle size={14}/> Libur
                            </span>
                         );
                      } else if (hasStudiedToday) {
                         statusEl = (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                <CheckCircle2 size={14}/> Hadir
                            </span>
                         );
                      } else {
                         statusEl = (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                <XCircle size={14}/> Alpa
                            </span>
                         );
                      }

                      return (
                         <tr key={s.uid} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-700">{s.displayName}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                               {s.lastActiveModule ? "Mengerjakan Modul" : "Belum ada aktivitas"}
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
             <h4 className="font-bold text-yellow-800 text-sm">Aturan Presensi</h4>
             <p className="text-xs text-yellow-700 mt-1">
               Siswa dianggap <strong>Hadir</strong> jika menyelesaikan minimal 1 materi atau kuis pada hari tersebut.
               Hari Minggu dihitung sebagai hari libur (tidak wajib belajar).
             </p>
          </div>
       </div>
    </div>
  );
}