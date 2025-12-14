"use client";

import React, { useState } from "react";
import { 
  Plus, Calendar, Clock, FileText, CheckCircle2, 
  MoreVertical, FileCheck, ClipboardList, PenTool,
  Gamepad2, UploadCloud, Trophy, Layers
} from "lucide-react";
import { Button } from "../../ui/button";
import { Timestamp } from "firebase/firestore";
import { cn } from "../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AssignmentType, GameType } from "../../../lib/types/course.types";

// --- INTERFACES ---
export interface AssignmentData {
  id: string;
  title: string;
  description: string;
  type: AssignmentType; // Menggunakan tipe dari course.types.ts
  deadline: Timestamp | null;
  points: number;
  gameConfig?: {
    gameType: GameType;
  };
  createdAt: Timestamp;
  status: "active" | "closed";
  submissionCount?: number; 
  subjectName?: string; // NEW: Nama Mapel agar Wali Kelas tidak bingung
}

interface AssignmentsViewProps {
  assignments: AssignmentData[];
  onOpenCreateModal: () => void;
  onDeleteAssignment: (id: string) => void;
  onViewDetail: (id: string) => void; // Ke Builder
  onGradeAssignment: (id: string) => void; // Ke Grading
}

export default function AssignmentsView({ 
  assignments, 
  onOpenCreateModal,
  onDeleteAssignment,
  onViewDetail,
  onGradeAssignment
}: AssignmentsViewProps) {
  
  const [filter, setFilter] = useState<"active" | "closed">("active");

  const filteredAssignments = assignments.filter(a => a.status === filter);

  // Helper untuk mendapatkan Label dan Icon berdasarkan Tipe Tugas
  const getTypeInfo = (item: AssignmentData) => {
    switch (item.type) {
        case 'quiz':
            return { label: 'Kuis PG', icon: <FileCheck size={24} />, color: "bg-orange-50 text-orange-600 border-orange-100" };
        case 'essay':
            return { label: 'Esai', icon: <FileText size={24} />, color: "bg-blue-50 text-blue-600 border-blue-100" };
        case 'project':
            return { label: 'Proyek', icon: <UploadCloud size={24} />, color: "bg-indigo-50 text-indigo-600 border-indigo-100" };
        case 'game':
            // Detailkan jenis gamenya
            const gameLabel = item.gameConfig?.gameType === 'word-scramble' ? 'Acak Kata' : 
                              item.gameConfig?.gameType === 'memory-match' ? 'Memory Match' : 'Game';
            return { label: `Game: ${gameLabel}`, icon: <Gamepad2 size={24} />, color: "bg-pink-50 text-pink-600 border-pink-100" };
        default:
            return { label: 'Tugas', icon: <ClipboardList size={24} />, color: "bg-slate-50 text-slate-600 border-slate-100" };
    }
  };

  return (
    <div className="max-w-5xl space-y-6 pb-20">
       
       {/* 1. Header & Actions */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="text-purple-600" /> Daftar Tugas & Ujian
             </h2>
             <p className="text-sm text-slate-500 mt-1">
                Kelola penugasan, kuis, proyek, dan permainan edukatif.
             </p>
          </div>
          <Button 
            onClick={onOpenCreateModal} 
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-lg shadow-purple-200 transition-all active:scale-95"
          >
             <Plus size={18} /> Buat Tugas Baru
          </Button>
       </div>

       {/* 2. Filter Tabs */}
       <div className="flex gap-2 border-b border-slate-200 pb-1">
          <button 
             onClick={() => setFilter("active")}
             className={cn(
               "px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2",
               filter === "active" 
                 ? "text-purple-700 border-purple-600 bg-purple-50" 
                 : "text-slate-500 border-transparent hover:text-slate-800"
             )}
          >
             Sedang Aktif
          </button>
          <button 
             onClick={() => setFilter("closed")}
             className={cn(
               "px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2",
               filter === "closed" 
                 ? "text-slate-800 border-slate-600 bg-slate-100" 
                 : "text-slate-500 border-transparent hover:text-slate-800"
             )}
          >
             Selesai / Ditutup
          </button>
       </div>

       {/* 3. Assignments List */}
       {filteredAssignments.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-50/50 flex flex-col items-center rounded-2xl border border-dashed border-slate-200">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-300">
                <FileCheck size={32} />
             </div>
             <h3 className="font-bold text-slate-700 mb-1">
                {filter === "active" ? "Tidak Ada Tugas Aktif" : "Belum Ada Tugas Selesai"}
             </h3>
             <p className="text-sm text-slate-400 max-w-xs">
                {filter === "active" 
                   ? "Buat tugas baru untuk menguji pemahaman murid." 
                   : "Tugas yang sudah melewati deadline akan muncul di sini."}
             </p>
          </div>
       ) : (
          <div className="grid gap-4">
             {filteredAssignments.map((item) => {
                const info = getTypeInfo(item);
                return (
                <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white p-5 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group relative"
                >
                   <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex gap-4 flex-1">
                         {/* Icon Box */}
                         <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 border",
                            info.color
                         )}>
                            {info.icon}
                         </div>
                         
                         {/* Content Info */}
                         <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-purple-700 transition-colors truncate">
                                    {item.title}
                                </h3>
                                {/* Poin Badge */}
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded border border-yellow-200 flex items-center gap-0.5">
                                    <Trophy size={10} /> {item.points} Poin
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                               <span className={cn("px-2 py-0.5 rounded uppercase font-bold tracking-wider text-[10px] border", info.color)}>
                                  {info.label}
                               </span>

                               {/* Badge Mapel (NEW FEATURE) */}
                               {item.subjectName && (
                                  <span className="bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-600 border border-indigo-100 flex items-center gap-1">
                                     <Layers size={10} /> {item.subjectName}
                                  </span>
                               )}

                               <span className="flex items-center gap-1">
                                  <Calendar size={12} /> 
                                  Deadline: {item.deadline 
                                    ? new Date(item.deadline.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })
                                    : "Tanpa Batas"}
                               </span>
                            </div>
                         </div>
                      </div>

                      {/* Right Side Stats */}
                      <div className="text-left md:text-right shrink-0">
                          <p className="text-xs font-bold uppercase text-slate-400 mb-1">Sudah Mengumpulkan</p>
                          <div className="flex items-center md:justify-end gap-1 text-purple-600 font-bold text-lg">
                             <CheckCircle2 size={18} /> {item.submissionCount || 0} Murid
                          </div>
                      </div>
                   </div>

                   {/* Footer Actions */}
                   <div className="mt-4 pt-4 border-t border-slate-50 flex flex-wrap gap-2 justify-between items-center">
                      <div className="flex gap-2 w-full md:w-auto">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => onViewDetail(item.id)}
                           className="flex-1 md:flex-none text-slate-500 hover:text-purple-700 text-xs border-transparent hover:bg-slate-50 gap-1"
                         >
                            <PenTool size={14} /> Edit {item.type === 'game' ? 'Game' : 'Soal'}
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => onGradeAssignment(item.id)}
                           className="flex-1 md:flex-none text-slate-500 hover:text-purple-700 text-xs font-bold border-transparent hover:bg-slate-50 gap-1"
                         >
                            <CheckCircle2 size={14} /> Nilai Tugas ({item.submissionCount || 0})
                         </Button>
                      </div>
                      <button 
                         onClick={() => onDeleteAssignment(item.id)}
                         className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors text-xs flex items-center gap-1 w-full md:w-auto justify-center"
                      >
                         Hapus
                      </button>
                   </div>
                </motion.div>
             )})}
          </div>
       )}
    </div>
  );
}