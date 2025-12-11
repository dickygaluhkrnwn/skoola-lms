"use client";

import React, { useState } from "react";
import { 
  Plus, Calendar, Clock, FileText, CheckCircle2, 
  MoreVertical, FileCheck, ClipboardList 
} from "lucide-react";
import { Button } from "../../ui/button";
import { Timestamp } from "firebase/firestore";
import { cn } from "../../../lib/utils";
import { motion } from "framer-motion";

// --- INTERFACES ---
export interface AssignmentData {
  id: string;
  title: string;
  description: string;
  type: "quiz" | "essay" | "upload";
  deadline: Timestamp | null;
  createdAt: Timestamp;
  status: "active" | "closed";
  submissionCount?: number; 
}

interface AssignmentsViewProps {
  assignments: AssignmentData[];
  onOpenCreateModal: () => void;
  onDeleteAssignment: (id: string) => void;
  onViewDetail: (id: string) => void;
  onGradeAssignment: (id: string) => void;
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

  return (
    <div className="max-w-5xl space-y-6">
       
       {/* 1. Header & Actions */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <ClipboardList className="text-purple-600" /> Daftar Tugas & Ujian
             </h2>
             <p className="text-sm text-slate-500 mt-1">
                Kelola penugasan, kuis, dan latihan untuk murid.
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
             {filteredAssignments.map((item) => (
                <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white p-5 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group relative"
                >
                   <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                         {/* Icon Box */}
                         <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                            item.type === "quiz" ? "bg-orange-50 text-orange-600" :
                            item.type === "essay" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                         )}>
                            {item.type === "quiz" ? <FileCheck size={24} /> : 
                             item.type === "essay" ? <FileText size={24} /> : <ClipboardList size={24} />}
                         </div>
                         
                         {/* Content Info */}
                         <div>
                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-purple-700 transition-colors">
                               {item.title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                               <span className="bg-slate-100 px-2 py-0.5 rounded uppercase font-bold tracking-wider text-[10px]">
                                  {item.type === "quiz" ? "Kuis PG" : item.type === "essay" ? "Esai" : "Upload File"}
                               </span>
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
                      <div className="text-right hidden md:block">
                         <p className="text-xs font-bold uppercase text-slate-400 mb-1">Sudah Mengumpulkan</p>
                         <div className="flex items-center justify-end gap-1 text-purple-600 font-bold text-lg">
                            <CheckCircle2 size={18} /> {item.submissionCount || 0} Murid
                         </div>
                      </div>
                   </div>

                   {/* Footer Actions */}
                   <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                      <div className="flex gap-2">
                         <Button 
                           variant="ghost" // KEMBALI KE GHOST
                           size="sm" 
                           onClick={() => onViewDetail(item.id)}
                           className="text-slate-500 hover:text-purple-700 text-xs border-transparent hover:bg-slate-50"
                         >
                            Lihat Detail
                         </Button>
                         <Button 
                           variant="ghost" // KEMBALI KE GHOST
                           size="sm" 
                           onClick={() => onGradeAssignment(item.id)}
                           className="text-slate-500 hover:text-purple-700 text-xs font-bold border-transparent hover:bg-slate-50"
                         >
                            Nilai Tugas ({item.submissionCount || 0})
                         </Button>
                      </div>
                      <button 
                         onClick={() => onDeleteAssignment(item.id)}
                         className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors text-xs flex items-center gap-1"
                      >
                         Hapus
                      </button>
                   </div>
                </motion.div>
             ))}
          </div>
       )}
    </div>
  );
}