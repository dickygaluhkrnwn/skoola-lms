"use client";

import React from "react";
import { Users, Trash2, Brain, Palette, Calculator } from "lucide-react";

// --- INTERFACES ---
interface StudentData {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  xp?: number;
  level?: number;
  completedModules?: string[];
  talentArchetype?: "logic" | "creative" | "social" | "practical"; // Tetap pertahankan sebagai opsional
}

interface StudentListViewProps {
  students: StudentData[];
  totalModules: number;
  onDeleteStudent?: (studentId: string) => void;
}

// Helper untuk Icon Archetype
const getArchetypeIcon = (type?: string) => {
  switch (type) {
    case "logic": return <Brain size={16} className="text-blue-500" />;
    case "creative": return <Palette size={16} className="text-purple-500" />;
    case "practical": return <Calculator size={16} className="text-green-500" />;
    case "social": return <Users size={16} className="text-orange-500" />;
    default: return null;
  }
};

const getArchetypeLabel = (type?: string) => {
  switch (type) {
    case "logic": return "The Thinker";
    case "creative": return "The Creator";
    case "practical": return "The Maker";
    case "social": return "The Leader";
    default: return "-";
  }
};

export default function StudentListView({ 
  students, 
  totalModules,
  onDeleteStudent 
}: StudentListViewProps) {
  
  return (
    <div className="max-w-5xl space-y-6">
       <div className="flex justify-between items-center">
          <div>
             <h2 className="text-2xl font-bold text-slate-900">Daftar Murid</h2>
             <p className="text-sm text-slate-500 mt-1">Kelola siswa dan pantau perkembangan mereka.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 shadow-sm">
             Total: {students.length} Siswa
          </div>
       </div>

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
         ) : (
            /* TABLE DATA */
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                     <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Murid</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Profil Belajar</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {students.map((student) => {
                        // Kalkulasi Progress
                        const completedCount = student.completedModules?.length || 0;
                        const progressPercent = totalModules > 0 
                           ? Math.round((completedCount / totalModules) * 100) 
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
                                          <span className="text-xs font-bold text-slate-400">{student.displayName?.[0]}</span>
                                       )}
                                    </div>
                                    <div>
                                       <p className="font-bold text-slate-700 text-sm">{student.displayName}</p>
                                       <p className="text-xs text-slate-400">{student.email}</p>
                                    </div>
                                 </div>
                              </td>
                              
                              {/* Kolom Profil Belajar (Archetype & Level) */}
                              <td className="px-6 py-4">
                                 <div className="flex flex-col gap-1.5">
                                    {/* Minat Bakat Badge */}
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                       {getArchetypeIcon(student.talentArchetype)}
                                       <span>{getArchetypeLabel(student.talentArchetype)}</span>
                                    </div>
                                    
                                    {/* Level & XP */}
                                    <div className="flex items-center gap-2">
                                       <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-200">
                                          Lvl {student.level || 1}
                                       </span>
                                       <span className="text-[10px] text-slate-400 font-mono">
                                          {student.xp || 0} XP
                                       </span>
                                    </div>
                                 </div>
                              </td>

                              {/* Kolom Progress Bar */}
                              <td className="px-6 py-4">
                                 <div className="w-full max-w-[140px]">
                                    <div className="flex justify-between text-xs mb-1">
                                       <span className="font-medium text-slate-500">
                                          {completedCount} Modul
                                       </span>
                                       <span className="font-bold text-blue-600">{progressPercent}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                       <div 
                                          className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                          style={{ width: `${progressPercent}%` }}
                                       />
                                    </div>
                                 </div>
                              </td>

                              {/* Kolom Aksi */}
                              <td className="px-6 py-4 text-right">
                                 <button 
                                    onClick={() => onDeleteStudent && onDeleteStudent(student.uid)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100" 
                                    title="Keluarkan Murid"
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