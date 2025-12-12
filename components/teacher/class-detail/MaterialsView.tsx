"use client";

import React, { useState } from "react";
import { 
  BookOpen, Plus, Video, FileText, Link as LinkIcon, Trash2, Calendar,
  MapPin, Image as ImageIcon, AlignLeft, ExternalLink, X, File
} from "lucide-react";
import { Button } from "../../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import { cn } from "../../../lib/utils";
import { MaterialType } from "../../../lib/types/course.types";

// --- INTERFACES ---
interface MaterialData {
  id: string;
  title: string;
  type: MaterialType;
  content?: string; // HTML for rich-text
  url?: string;     // URL for others
  locationData?: {
    lat: number;
    lng: number;
    placeName: string;
  };
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
  
  // State untuk modal baca artikel (Rich Text)
  const [readingMaterial, setReadingMaterial] = useState<MaterialData | null>(null);

  // Helper: Handle Buka Materi
  const handleOpenMaterial = (item: MaterialData) => {
    if (item.type === 'rich-text') {
      setReadingMaterial(item);
    } else if (item.type === 'map' && item.locationData) {
      const { lat, lng } = item.locationData;
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    } else if (item.url) {
      window.open(item.url, '_blank');
    } else {
        alert("Konten tidak dapat dibuka.");
    }
  };

  // Helper: Get Icon & Color
  const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
        case 'video': return { icon: <Video size={24} />, color: "text-red-600 bg-red-50 group-hover:bg-red-100" };
        case 'pdf': return { icon: <FileText size={24} />, color: "text-red-500 bg-red-50 group-hover:bg-red-100" }; // PDF identik dengan merah adobe
        case 'image': return { icon: <ImageIcon size={24} />, color: "text-purple-600 bg-purple-50 group-hover:bg-purple-100" };
        case 'map': return { icon: <MapPin size={24} />, color: "text-green-600 bg-green-50 group-hover:bg-green-100" };
        case 'link': return { icon: <LinkIcon size={24} />, color: "text-blue-600 bg-blue-50 group-hover:bg-blue-100" };
        case 'rich-text': return { icon: <AlignLeft size={24} />, color: "text-slate-600 bg-slate-100 group-hover:bg-slate-200" };
        default: return { icon: <BookOpen size={24} />, color: "text-blue-600 bg-blue-50" };
    }
  };

  const getLabel = (type: MaterialType) => {
      switch (type) {
          case 'rich-text': return 'Artikel';
          case 'pdf': return 'Dokumen PDF';
          case 'map': return 'Lokasi Peta';
          case 'image': return 'Gambar';
          case 'link': return 'Tautan Luar';
          default: return 'Video';
      }
  };

  return (
    <div className="max-w-5xl space-y-6">
       {/* Header Section */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="text-blue-600" /> Materi Pembelajaran
             </h2>
             <p className="text-sm text-slate-500 mt-1">
                Kelola bahan ajar suplemen (Video, PDF, Peta, dll) untuk kelas ini.
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
                Mulai upload materi agar murid makin paham!
             </p>
          </div>
       ) : (
          /* List Content */
          <div className="grid gap-4">
             {materials.map((item, idx) => {
                const style = getMaterialIcon(item.type);
                return (
                <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden"
                >
                   {/* Left: Icon & Info */}
                   <div className="flex items-start md:items-center gap-4 overflow-hidden mb-4 md:mb-0">
                      <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-colors shrink-0",
                          style.color
                      )}>
                          {style.icon}
                      </div>
                      <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors truncate pr-4">
                             {item.title}
                          </p>
                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                             <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide text-slate-500 border border-slate-200">
                                {getLabel(item.type)}
                             </span>
                             <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {item.createdAt 
                                   ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) 
                                   : 'Baru saja'}
                             </span>
                             {item.type === 'map' && item.locationData && (
                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                    <MapPin size={12} /> {item.locationData.placeName}
                                </span>
                             )}
                          </div>
                      </div>
                   </div>

                   {/* Right: Actions */}
                   <div className="flex gap-2 shrink-0 md:border-l md:pl-4 md:border-slate-100">
                      <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenMaterial(item)} 
                          className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 border-transparent gap-2"
                      >
                          {item.type === 'rich-text' ? <BookOpen size={16}/> : <ExternalLink size={16}/>}
                          {item.type === 'rich-text' ? 'Baca' : 'Buka'}
                      </Button>
                      <button 
                          onClick={() => onDeleteMaterial(item.id)} 
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Hapus Materi"
                      >
                          <Trash2 size={18}/>
                      </button>
                   </div>
                </motion.div>
             )})}
          </div>
       )}

       {/* Modal Baca Artikel (Rich Text) */}
       <AnimatePresence>
         {readingMaterial && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setReadingMaterial(null)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 max-h-[85vh] flex flex-col"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                        <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Artikel</span>
                            <h3 className="text-xl font-bold text-slate-900 mt-1">{readingMaterial.title}</h3>
                        </div>
                        <button onClick={() => setReadingMaterial(null)} className="text-slate-400 hover:text-slate-700">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto prose prose-slate max-w-none">
                        {/* Render simple text with line breaks if it's not HTML, or just text */}
                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                            {readingMaterial.content}
                        </div>
                    </div>
                </motion.div>
            </div>
         )}
       </AnimatePresence>
    </div>
  );
}