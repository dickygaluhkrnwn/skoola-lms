"use client";

import React from "react";
import { 
  BookOpen, Plus, Video, FileText, Link as LinkIcon, Trash2 
} from "lucide-react";
import { Button } from "../../ui/button";
import { motion } from "framer-motion";
import { Timestamp } from "firebase/firestore";

// --- INTERFACES ---
interface MaterialData {
  id: string;
  title: string;
  type: "video" | "text";
  content: string;
  createdAt: Timestamp;
}

interface MaterialsViewProps {
  materials: MaterialData[];
  onOpenUploadModal: () => void;
  onDeleteMaterial: (id: string) => void;
}

export default function MaterialsView({ 
  materials, 
  onOpenUploadModal,
  onDeleteMaterial 
}: MaterialsViewProps) {

  return (
    <div className="max-w-5xl space-y-6">
       {/* Header Section */}
       <div className="flex justify-between items-center bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
          <div>
             <h2 className="text-xl font-bold text-blue-900">Materi Tambahan</h2>
             <p className="text-sm text-blue-600 mt-1">
                Kelola bahan ajar suplemen (Video/Artikel) untuk kelas ini.
             </p>
          </div>
          <Button 
            onClick={onOpenUploadModal} 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
             <Plus size={18} /> Tambah Materi
          </Button>
       </div>

       {/* Materials List */}
       {materials.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-slate-50/50 flex flex-col items-center rounded-2xl border border-dashed border-slate-200">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-300">
                <BookOpen size={32} />
             </div>
             <h3 className="font-bold text-slate-700 mb-1">Belum Ada Materi</h3>
             <p className="text-sm text-slate-400 max-w-xs">
                Mulai upload video atau artikel agar murid makin paham!
             </p>
          </div>
       ) : (
          /* List Content */
          <div className="grid gap-3">
             {materials.map((item) => (
                <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-blue-300 hover:shadow-md transition-all group"
                >
                   {/* Left: Icon & Info */}
                   <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-colors shrink-0 ${
                         item.type === "video" 
                            ? "bg-red-50 text-red-500 group-hover:bg-red-100" 
                            : "bg-blue-50 text-blue-500 group-hover:bg-blue-100"
                      }`}>
                         {item.type === "video" ? <Video size={24} /> : <FileText size={24} />}
                      </div>
                      <div className="min-w-0">
                         <p className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors truncate pr-4">
                            {item.title}
                         </p>
                         <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide text-slate-500 border border-slate-200">
                               {item.type === 'video' ? 'Video' : 'Artikel'}
                            </span>
                            <span>•</span>
                            <span>
                               {item.createdAt 
                                  ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) 
                                  : 'Baru saja'}
                            </span>
                         </p>
                      </div>
                   </div>

                   {/* Right: Actions */}
                   <div className="flex gap-2 shrink-0">
                      <button 
                         onClick={() => window.open(item.content, "_blank")} 
                         className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" 
                         title="Buka Link"
                      >
                         <LinkIcon size={18}/>
                      </button>
                      <button 
                         onClick={() => onDeleteMaterial(item.id)} 
                         className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" 
                         title="Hapus Materi"
                      >
                         <Trash2 size={18}/>
                      </button>
                   </div>
                </motion.div>
             ))}
          </div>
       )}
    </div>
  );
}