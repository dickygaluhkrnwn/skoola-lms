"use client";

import React, { useState, useEffect } from "react";
import { 
  Video, FileText, Loader2, X, ClipboardList, 
  FileCheck, Calendar, Clock, UploadCloud 
} from "lucide-react";
import { Button } from "../../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils";

// --- INTERFACES ---
interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Kita buat generik agar bisa menangani materi & tugas
  onUpload: (data: any) => Promise<void>; 
  isUploading: boolean;
  initialTab?: "material" | "assignment"; // Tab awal saat dibuka
}

export default function UploadMaterialModal({
  isOpen,
  onClose,
  onUpload,
  isUploading,
  initialTab = "material"
}: UploadMaterialModalProps) {
  
  const [activeTab, setActiveTab] = useState<"material" | "assignment">(initialTab);
  
  // State Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // State Khusus Materi
  const [materialType, setMaterialType] = useState<"video" | "text">("video");
  const [content, setContent] = useState("");

  // State Khusus Tugas
  const [assignmentType, setAssignmentType] = useState<"quiz" | "essay" | "upload">("essay");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");

  // Reset form saat modal dibuka/tutup
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setTitle("");
      setDescription("");
      setContent("");
      setDeadlineDate("");
      setDeadlineTime("");
    }
  }, [isOpen, initialTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Siapkan payload data berdasarkan tab aktif
    const baseData = {
      title,
      description,
      category: activeTab, // 'material' atau 'assignment'
    };

    let finalData;

    if (activeTab === "material") {
      finalData = {
        ...baseData,
        type: materialType,
        content, // Link Video atau Isi Artikel
      };
    } else {
      // Gabungkan Date & Time untuk Deadline
      let deadlineTimestamp = null;
      if (deadlineDate && deadlineTime) {
        deadlineTimestamp = new Date(`${deadlineDate}T${deadlineTime}`);
      }

      finalData = {
        ...baseData,
        type: assignmentType,
        deadline: deadlineTimestamp,
        // Untuk tipe 'quiz', nanti bisa ditambah builder soal. 
        // Sementara kita anggap deskripsi sebagai instruksi tugas.
      };
    }

    await onUpload(finalData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
      />
      
      {/* Modal Content */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("material")}
            className={cn(
              "flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2",
              activeTab === "material" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            )}
          >
            <Video size={16} /> Materi Belajar
          </button>
          <button
            onClick={() => setActiveTab("assignment")}
            className={cn(
              "flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2",
              activeTab === "assignment" ? "bg-white text-purple-600 border-b-2 border-purple-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            )}
          >
            <ClipboardList size={16} /> Tugas & Ujian
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto">
          <form id="create-content-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Common Fields */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Judul</label>
              <input 
                required 
                placeholder={activeTab === "material" ? "Contoh: Video Pantun" : "Contoh: Kuis Harian 1"} 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Deskripsi / Instruksi</label>
              <textarea 
                placeholder="Berikan penjelasan singkat..." 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[80px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* --- FORM MATERI --- */}
            {activeTab === "material" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-3">
                    <TypeSelector 
                      active={materialType === "video"} 
                      onClick={() => setMaterialType("video")} 
                      icon={<Video size={20} />} 
                      label="Video YouTube" 
                      color="blue"
                    />
                    <TypeSelector 
                      active={materialType === "text"} 
                      onClick={() => setMaterialType("text")} 
                      icon={<FileText size={20} />} 
                      label="Artikel / Teks" 
                      color="blue"
                    />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                    {materialType === "video" ? "Link YouTube" : "Link Dokumen / Isi Artikel"}
                  </label>
                  <input 
                    required 
                    type={materialType === "video" ? "url" : "text"}
                    placeholder={materialType === "video" ? "https://youtube.com/..." : "Tempel link Google Docs atau tulis isi materi..."} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* --- FORM TUGAS --- */}
            {activeTab === "assignment" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="grid grid-cols-3 gap-3">
                    <TypeSelector 
                      active={assignmentType === "quiz"} 
                      onClick={() => setAssignmentType("quiz")} 
                      icon={<FileCheck size={20} />} 
                      label="Kuis PG" 
                      color="purple"
                    />
                    <TypeSelector 
                      active={assignmentType === "essay"} 
                      onClick={() => setAssignmentType("essay")} 
                      icon={<FileText size={20} />} 
                      label="Esai" 
                      color="purple"
                    />
                    <TypeSelector 
                      active={assignmentType === "upload"} 
                      onClick={() => setAssignmentType("upload")} 
                      icon={<UploadCloud size={20} />} 
                      label="Upload File" 
                      color="purple"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Tenggat Tanggal</label>
                       <div className="relative">
                         <Calendar size={16} className="absolute left-3 top-3 text-slate-400" />
                         <input 
                           type="date"
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                           value={deadlineDate}
                           onChange={e => setDeadlineDate(e.target.value)}
                         />
                       </div>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Tenggat Jam</label>
                       <div className="relative">
                         <Clock size={16} className="absolute left-3 top-3 text-slate-400" />
                         <input 
                           type="time"
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                           value={deadlineTime}
                           onChange={e => setDeadlineTime(e.target.value)}
                         />
                       </div>
                    </div>
                 </div>
                 
                 {assignmentType === "quiz" && (
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-xs text-orange-700 flex gap-2">
                       <div className="shrink-0 pt-0.5">💡</div>
                       <p>
                         Setelah menyimpan tugas ini, Anda akan diarahkan ke halaman <strong>Pembuat Soal Kuis</strong> untuk menambahkan pertanyaan.
                       </p>
                    </div>
                 )}
              </div>
            )}

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50">
           <Button type="button" variant="ghost" onClick={onClose} className="flex-1 text-slate-500 hover:bg-white hover:shadow-sm">
              Batal
           </Button>
           <Button 
             form="create-content-form" 
             type="submit" 
             disabled={isUploading} 
             className={cn(
               "flex-1 text-white shadow-lg transition-all",
               activeTab === "material" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-purple-600 hover:bg-purple-700 shadow-purple-200"
             )}
           >
             {isUploading ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : null}
             {isUploading ? "Menyimpan..." : (activeTab === "material" ? "Simpan Materi" : "Buat Tugas")}
           </Button>
        </div>

      </motion.div>
    </div>
  );
}

// Sub-component Helper
function TypeSelector({ active, onClick, icon, label, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color: "blue" | "purple" }) {
  const activeClass = color === "blue" 
    ? "border-blue-500 bg-blue-50 text-blue-700" 
    : "border-purple-500 bg-purple-50 text-purple-700";

  return (
    <div 
      onClick={onClick}
      className={cn(
        "cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:scale-[1.02]",
        active ? activeClass : "border-slate-200 text-slate-500 hover:border-slate-300"
      )}
    >
      {icon}
      <span className="text-xs font-bold text-center leading-tight">{label}</span>
    </div>
  );
}