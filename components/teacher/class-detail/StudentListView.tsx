"use client";

import React, { useState } from "react";
import { Users, Trash2, Trophy, Star, Search, CheckCircle2, User } from "lucide-react";
import { cn } from "../../../lib/utils";

// --- INTERFACES ---
interface StudentData {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  xp?: number;
  level?: number;
  completedModules?: string[];
  // lastActiveModule field is optional in interface if not strictly needed here but good for consistency
}

interface StudentListViewProps {
  students: StudentData[];
  totalModules: number;
  onDeleteStudent?: (studentId: string) => void;
}

export default function StudentListView({ 
  students, 
  totalModules,
  onDeleteStudent 
}: StudentListViewProps) {
  
  const [searchTerm, setSearchTerm] = useState("");

  // Filter Logic
  const filteredStudents = students.filter(s => 
     s.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl space-y-6">
       {/* Header & Filter */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-blue-600" /> Daftar Murid
             </h2>
             <p className="text-sm text-slate-500 mt-1">Kelola siswa dan pantau perkembangan belajar mereka.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 shadow-sm whitespace-nowrap">
                Total: {students.length}
             </div>
             <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                   placeholder="Cari nama atau email..."
                   className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
       </div>

       {/* Student Table */}
       <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
         {students.length === 0 ? (
            /* EMPTY STATE */
            <div className="text-center py-16 px-4 bg-slate-50/50 flex flex-col items-center">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-300">
                  <Users size={32} />
               </div>
               <h3 className="font-bold text-slate-700 mb-1">Kelas Masih Sepi</h3>
               <p className="text-sm text-slate-400 max-w-xs">
                  Belum ada murid yang bergabung. Bagikan kode kelas sekarang!
               </p>
            </div>
         ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Tidak ada siswa yang cocok dengan pencarian.</div>
         ) : (
            /* TABLE DATA */
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                     <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Profil Murid</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Level & XP</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Progres Belajar</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredStudents.map((student) => {
                        // Kalkulasi Progress
                        const completedCount = student.completedModules?.length || 0;
                        const progressPercent = totalModules > 0 
                           ? Math.min(100, Math.round((completedCount / totalModules) * 100))
                           : 0;
                        
                        return (
                           <tr key={student.uid} className="hover:bg-blue-50/30 transition-colors group">
                              {/* Kolom Nama */}
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-lg overflow-hidden shrink-0">
                                       {student.photoURL ? (
                                          <img src={student.photoURL} alt="av" className="w-full h-full object-cover"/>
                                       ) : (
                                          <User className="text-slate-400" size={20}/>
                                       )}
                                    </div>
                                    <div>
                                       <p className="font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">
                                          {student.displayName}
                                       </p>
                                       <p className="text-xs text-slate-400 font-mono">{student.email}</p>
                                    </div>
                                 </div>
                              </td>
                              
                              {/* Kolom Level & XP */}
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-lg border border-yellow-200 shadow-sm">
                                       <Trophy size={14} className="text-yellow-600"/>
                                       <span className="text-xs font-bold">Lvl {student.level || 1}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                       <Star size={12} className="text-slate-400"/> {student.xp || 0} XP
                                    </div>
                                 </div>
                              </td>

                              {/* Kolom Progress Bar */}
                              <td className="px-6 py-4">
                                 <div className="w-full max-w-[180px]">
                                    <div className="flex justify-between text-xs mb-1.5">
                                       <span className="font-medium text-slate-500 flex items-center gap-1">
                                          <CheckCircle2 size={12}/> {completedCount} Selesai
                                       </span>
                                       <span className="font-bold text-blue-600">{progressPercent}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                       <div 
                                          className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out" 
                                          style={{ width: `${progressPercent}%` }}
                                       />
                                    </div>
                                 </div>
                              </td>

                              {/* Kolom Aksi */}
                              <td className="px-6 py-4 text-right">
                                 <button 
                                    onClick={() => onDeleteStudent && onDeleteStudent(student.uid)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-100" 
                                    title="Keluarkan dari Kelas"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         )}
       </div>
    </div>
  );
}