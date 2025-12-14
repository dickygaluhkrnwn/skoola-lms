"use client";

import React, { useState, useEffect } from "react";
import { 
  Video, FileText, Loader2, X, ClipboardList, 
  FileCheck, Calendar, Clock, UploadCloud, 
  MapPin, Link as LinkIcon, Image as ImageIcon, 
  AlignLeft, Gamepad2, File
} from "lucide-react";
import { Button } from "../../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils";
import { MaterialType, AssignmentType, GameType } from "../../../lib/types/course.types";

// --- INTERFACES ---
interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Kita buat generik agar bisa menangani materi & tugas
  onUpload: (data: any) => Promise<void>; 
  isUploading: boolean;
  initialTab?: "material" | "assignment"; // Tab awal saat dibuka
  subjectName?: string; // Optional prop to display subject context (Fixed Error)
}

export default function UploadMaterialModal({
  isOpen,
  onClose,
  onUpload,
  isUploading,
  initialTab = "material",
  subjectName // Destructure prop baru
}: UploadMaterialModalProps) {
  
  const [activeTab, setActiveTab] = useState<"material" | "assignment">(initialTab);
  
  // State Form Umum
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // --- STATE KHUSUS MATERI ---
  const [materialType, setMaterialType] = useState<MaterialType>("video");
  const [content, setContent] = useState(""); // URL atau Text Content
  const [file, setFile] = useState<File | null>(null); // Untuk Upload File (PDF/Image)
  
  // State untuk Map Material
  const [mapData, setMapData] = useState({ lat: -6.200000, lng: 106.816666, placeName: "Jakarta" });

  // --- STATE KHUSUS TUGAS ---
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("essay");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [points, setPoints] = useState(100);

  // State untuk Game Assignment
  const [gameType, setGameType] = useState<GameType>("word-scramble");

  // Reset form saat modal dibuka/tutup
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setTitle("");
      setDescription("");
      setContent("");
      setFile(null);
      setMapData({ lat: -6.200000, lng: 106.816666, placeName: "Jakarta" });
      setDeadlineDate("");
      setDeadlineTime("");
      setPoints(100);
      setGameType("word-scramble");
    }
  }, [isOpen, initialTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Siapkan payload data dasar
    const baseData = {
      title,
      description,
      category: activeTab, // 'material' atau 'assignment'
    };

    let finalData: any;

    if (activeTab === "material") {
      // Logika Payload Materi
      finalData = {
        ...baseData,
        type: materialType,
        content: content, // URL Video, Link, atau Rich Text
        file: file, // File Object jika ada (akan diproses di parent component)
      };

      // Hanya tambahkan locationData jika tipe 'map'
      if (materialType === 'map') {
          finalData.locationData = { ...mapData, zoom: 15 };
      }
    } else {
      // Logika Payload Tugas
      let deadlineTimestamp = null;
      if (deadlineDate && deadlineTime) {
        deadlineTimestamp = new Date(`${deadlineDate}T${deadlineTime}`).getTime();
      }

      finalData = {
        ...baseData,
        type: assignmentType,
        deadline: deadlineTimestamp,
        points: Number(points),
      };

      // Hanya tambahkan gameConfig jika tipe 'game'
      if (assignmentType === 'game') {
          finalData.gameConfig = { gameType, data: null };
      }
    }

    await onUpload(finalData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
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
        className="bg-white rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
            <ClipboardList size={16} /> Tugas & Game
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto">
          <form id="create-content-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Context Badge (New Feature) */}
            {subjectName && (
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2 mb-2 animate-in slide-in-from-top-1">
                <FileText size={16} />
                <span>Menambahkan konten untuk: <strong>{subjectName}</strong></span>
              </div>
            )}

            {/* Common Fields */}
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Judul</label>
                    <input 
                        required 
                        placeholder={activeTab === "material" ? "Contoh: Peta Sebaran Fauna" : "Contoh: Tantangan Kosakata"} 
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
            </div>

            {/* --- FORM MATERI --- */}
            {activeTab === "material" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 border-t border-slate-100 pt-5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Tipe Materi</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    <TypeSelector active={materialType === "video"} onClick={() => setMaterialType("video")} icon={<Video size={18} />} label="Video" color="blue" />
                    <TypeSelector active={materialType === "rich-text"} onClick={() => setMaterialType("rich-text")} icon={<AlignLeft size={18} />} label="Artikel" color="blue" />
                    <TypeSelector active={materialType === "pdf"} onClick={() => setMaterialType("pdf")} icon={<FileText size={18} />} label="PDF" color="blue" />
                    <TypeSelector active={materialType === "image"} onClick={() => setMaterialType("image")} icon={<ImageIcon size={18} />} label="Gambar" color="blue" />
                    <TypeSelector active={materialType === "link"} onClick={() => setMaterialType("link")} icon={<LinkIcon size={18} />} label="Link" color="blue" />
                    <TypeSelector active={materialType === "map"} onClick={() => setMaterialType("map")} icon={<MapPin size={18} />} label="Peta" color="blue" />
                </div>

                {/* Input Fields based on Material Type */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    
                    {/* VIDEO & LINK */}
                    {(materialType === "video" || materialType === "link") && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                                {materialType === "video" ? "Link YouTube" : "Link URL (Website/Dokumen)"}
                            </label>
                            <input 
                                required type="url"
                                placeholder="https://..." 
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 text-sm"
                                value={content} onChange={e => setContent(e.target.value)}
                            />
                        </div>
                    )}

                    {/* TEXT CONTENT */}
                    {materialType === "rich-text" && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">Isi Artikel</label>
                            <textarea 
                                required 
                                placeholder="Tulis materi pembelajaran di sini..." 
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 text-sm min-h-[150px]"
                                value={content} onChange={e => setContent(e.target.value)}
                            />
                        </div>
                    )}

                    {/* FILE UPLOAD (PDF / IMAGE) */}
                    {(materialType === "pdf" || materialType === "image") && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">Upload File {materialType === 'pdf' ? '(PDF)' : '(JPG/PNG)'}</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-white hover:bg-slate-50 transition-colors">
                                <input 
                                    type="file" 
                                    accept={materialType === "pdf" ? ".pdf" : "image/*"}
                                    onChange={handleFileChange}
                                    className="hidden" 
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                    <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
                                    <span className="text-sm font-medium text-slate-600">
                                        {file ? file.name : "Klik untuk pilih file"}
                                    </span>
                                    <span className="text-xs text-slate-400 mt-1">Maksimal 10MB</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* MAP DATA */}
                    {materialType === "map" && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Nama Lokasi</label>
                                <input 
                                    required placeholder="Contoh: Monumen Nasional" 
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 text-sm"
                                    value={mapData.placeName} onChange={e => setMapData({...mapData, placeName: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Latitude</label>
                                    <input 
                                        type="number" step="any" required 
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 text-sm"
                                        value={mapData.lat} onChange={e => setMapData({...mapData, lat: parseFloat(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Longitude</label>
                                    <input 
                                        type="number" step="any" required 
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 text-sm"
                                        value={mapData.lng} onChange={e => setMapData({...mapData, lng: parseFloat(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 italic">* Koordinat bisa diambil dari Google Maps</p>
                        </div>
                    )}
                </div>
              </div>
            )}

            {/* --- FORM TUGAS --- */}
            {activeTab === "assignment" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 border-t border-slate-100 pt-5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Tipe Tugas</label>
                  <div className="grid grid-cols-4 gap-2">
                    <TypeSelector active={assignmentType === "quiz"} onClick={() => setAssignmentType("quiz")} icon={<FileCheck size={18} />} label="Kuis" color="purple" />
                    <TypeSelector active={assignmentType === "essay"} onClick={() => setAssignmentType("essay")} icon={<AlignLeft size={18} />} label="Esai" color="purple" />
                    <TypeSelector active={assignmentType === "project"} onClick={() => setAssignmentType("project")} icon={<UploadCloud size={18} />} label="Proyek" color="purple" />
                    <TypeSelector active={assignmentType === "game"} onClick={() => setAssignmentType("game")} icon={<Gamepad2 size={18} />} label="Game" color="purple" />
                  </div>

                  {/* Pengaturan Game */}
                  {assignmentType === "game" && (
                     <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <label className="text-xs font-bold text-purple-700 mb-1.5 block">Pilih Jenis Game</label>
                        <select 
                            className="w-full px-4 py-2 rounded-lg border border-purple-200 text-sm bg-white"
                            value={gameType}
                            onChange={(e) => setGameType(e.target.value as GameType)}
                        >
                            <option value="word-scramble">Acak Kata (Word Scramble)</option>
                            <option value="memory-match">Memory Match (Cocok Gambar)</option>
                            <option value="flashcard-challenge">Tantangan Flashcard</option>
                        </select>
                     </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Poin Maks</label>
                        <input 
                            type="number" min="0" max="100"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                            value={points} onChange={e => setPoints(Number(e.target.value))}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Tenggat Waktu</label>
                        <div className="flex gap-2">
                            <input 
                                type="date" required
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)}
                            />
                            <input 
                                type="time" required
                                className="w-24 px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                value={deadlineTime} onChange={e => setDeadlineTime(e.target.value)}
                            />
                        </div>
                    </div>
                  </div>
                  
                  {assignmentType === "quiz" && (
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-xs text-orange-700 flex gap-2">
                        <div className="shrink-0 pt-0.5">💡</div>
                        <p>
                          Setelah menyimpan, Anda akan diarahkan ke <strong>Pembuat Soal</strong> untuk menambahkan pertanyaan.
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
        "cursor-pointer p-2 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all hover:scale-[1.02] hover:shadow-sm h-full justify-center",
        active ? activeClass : "border-slate-100 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold text-center leading-tight">{label}</span>
    </div>
  );
}