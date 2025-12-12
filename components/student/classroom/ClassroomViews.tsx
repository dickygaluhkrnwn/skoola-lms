"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Users, BookOpen, Video, FileText, Link as LinkIcon, 
  ClipboardList, FileCheck, Clock, Trophy, Map, Scroll, 
  AlertCircle, CheckCircle, GraduationCap, Palette,
  Gamepad2, UploadCloud, MapPin, Image as ImageIcon, AlignLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdventureMap } from "@/components/learn/adventure-map";
import { useRouter } from "next/navigation";
import { MaterialType, AssignmentType } from "@/lib/types/course.types";

// --- HELPER DATE FORMATTER (Supaya tidak Invalid Date) ---
const formatDeadline = (deadline: any) => {
    if (!deadline) return null;
    
    let dateObj;
    // Cek jika Firestore Timestamp (punya seconds)
    if (deadline && typeof deadline === 'object' && 'seconds' in deadline) {
        dateObj = new Date(deadline.seconds * 1000);
    } 
    // Cek jika angka (milliseconds) atau string ISO
    else {
        dateObj = new Date(deadline);
    }

    if (isNaN(dateObj.getTime())) return "Tanggal Invalid";

    return dateObj.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric'
    });
};

// --- DASHBOARD VIEW ---
export function DashboardView({ classData, classTotalXP, assignments, classMembers, setActiveTab, isKids, isSMP, isUni, isSMA, theme }: any) {
  return (
    <motion.div 
         key="dashboard"
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -10 }}
         className="space-y-6"
     >
       {/* Hero Banner */}
       <div className={cn(
           "rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-lg transition-all",
           isKids ? "bg-primary border-b-8 border-red-700" : 
           isSMP ? "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 shadow-2xl shadow-violet-500/30 ring-1 ring-white/20 backdrop-blur-3xl" :
           // UNI & SMA: Glassmorphism Hero
           (isUni || isSMA) ? "bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl" :
           "bg-blue-600"
       )}>
          {/* Deco */}
          <div className={cn(
              "absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 -mr-16 -mt-16 blur-3xl pointer-events-none",
              isUni ? "bg-indigo-500" : isSMA ? "bg-teal-400" : "bg-white"
          )} />
          {isKids && <div className="absolute bottom-4 right-4 text-6xl animate-bounce">🏰</div>}
          
          <div className="relative z-10">
             <div className="flex flex-wrap gap-2 mb-3">
                <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm",
                    isUni ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : 
                    isSMA ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : 
                    "bg-white/20 border border-white/30"
                )}>
                   Kode: {classData?.code}
                </span>
                {classData?.gradeLevel && (
                   <span className={cn(
                       "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm",
                       (isUni || isSMA) ? "bg-white/10 text-slate-300 border border-white/10" : "bg-white/20 border border-white/30"
                   )}>
                      <GraduationCap size={12}/> {classData.gradeLevel}
                   </span>
                )}
                {classData?.category && (
                   <span className={cn(
                       "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm",
                       (isUni || isSMA) ? "bg-white/10 text-slate-300 border border-white/10" : "bg-white/20 border border-white/30"
                   )}>
                      <Palette size={12}/> {classData.category}
                   </span>
                )}
             </div>
             <h1 className={cn("text-2xl md:text-4xl font-bold mb-2", isKids && "font-display tracking-wide drop-shadow-md")}>
                 {isKids ? `Selamat Datang di Markas ${classData?.name}! 👋` : `Selamat Datang di ${classData?.name}`}
             </h1>
             <p className={cn("max-w-xl text-sm md:text-base font-medium", (isUni || isSMA) ? "text-slate-400" : "text-white/90")}>
                 {classData?.description || (isKids ? "Siap untuk petualangan seru hari ini?" : "Deskripsi kelas belum diatur.")}
             </p>
          </div>
       </div>

       {/* Shortcuts */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <StatCard 
             icon={isKids ? <Map size={24}/> : <Map size={20}/>} 
             label={isKids ? "Peta Utama" : "Peta Belajar"} 
             value={isKids ? "Buka Peta" : "Akses"} 
             color="blue" 
             isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA}
             onClick={() => setActiveTab("adventure")} 
          />
          <StatCard 
             icon={isKids ? <Scroll size={24}/> : <ClipboardList size={20}/>} 
             label={isKids ? "Misi Rahasia" : "Tugas Aktif"} 
             value={assignments.length} 
             color="purple" 
             isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA}
             onClick={() => setActiveTab("assignments")} 
          />
          <StatCard 
             icon={<Trophy size={isKids ? 24 : 20}/>} 
             label={isKids ? "Harta Karun" : "XP Kelas"} 
             value={classTotalXP} 
             color="yellow" 
             isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA}
          />
          <StatCard 
             icon={<Users size={isKids ? 24 : 20}/>} 
             label={isKids ? "Pasukan" : "Anggota"} 
             value={classMembers.length || classData?.studentCount || 0} 
             color="green" 
             isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA}
             onClick={() => setActiveTab("people")} 
          />
       </div>
    </motion.div>
  );
}

// --- ADVENTURE VIEW ---
export function AdventureView({ mapModules, isKids, isSMP, isUni, isSMA }: any) {
  return (
    <motion.div 
         key="adventure"
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         exit={{ opacity: 0, scale: 0.95 }}
         className="space-y-6"
     >
         <div className="text-center mb-8">
             <h2 className={cn("text-2xl font-bold mb-2", isKids ? "text-primary font-display" : (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                 {isKids ? "🗺️ Peta Perjalanan Belajar" : "Peta Kurikulum"}
             </h2>
             <p className={cn("text-sm", (isUni || isSMA) ? "text-slate-400" : "text-slate-500")}>
                 {isKids ? "Ikuti jejak ini untuk menemukan harta karun ilmu!" : "Ikuti alur pembelajaran ini secara berurutan."}
             </p>
         </div>
         {/* Render Adventure Map Component */}
         {mapModules.length > 0 ? (
             <AdventureMap modules={mapModules} />
         ) : (
             <div className={cn("text-center py-12 border-2 border-dashed rounded-3xl", 
                isSMP ? "bg-white/40 border-violet-200" : 
                (isUni || isSMA) ? "bg-white/5 border-white/10" :
                "bg-slate-50 border-slate-200"
             )}>
                 <Map className={cn("w-12 h-12 mx-auto mb-4", (isUni || isSMA) ? "text-slate-600" : "text-slate-300")} />
                 <p className={cn("font-medium", (isUni || isSMA) ? "text-slate-500" : "text-slate-400")}>Peta masih kosong. Tunggu guru menggambar peta ya!</p>
             </div>
         )}
     </motion.div>
  );
}

// --- MATERIALS VIEW ---
export function MaterialsView({ materials, isKids, isSMP, isUni, isSMA, theme }: any) {
  return (
    <motion.div key="materials" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
       <div className="flex items-center justify-between">
           <h2 className={cn("text-xl font-bold", isKids && "font-display text-primary", (isUni || isSMA) && "text-white")}>
               {isKids ? "🎒 Bekal Petualangan" : "Materi Pembelajaran"}
           </h2>
       </div>
       
       {materials.length === 0 ? (
           <EmptyState 
               icon={<BookOpen size={32}/>} 
               text={isKids ? "Belum ada bekal ilmu dari Kapten Guru." : "Belum ada materi yang diunggah."} 
               isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni}
           />
       ) : (
           <div className="grid md:grid-cols-2 gap-4">
              {materials.map((item: any, idx: number) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                      <MaterialCard item={item} theme={theme} isKids={isKids} isSMP={isSMP} isUni={isUni} isSMA={isSMA} />
                  </motion.div>
              ))}
           </div>
       )}
    </motion.div>
  );
}

// --- ASSIGNMENTS VIEW ---
export function AssignmentsView({ assignments, isKids, isSMP, isUni, isSMA, theme, router, classId }: any) {
  return (
    <motion.div key="assignments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className={cn("text-xl font-bold", isKids && "font-display text-primary", (isUni || isSMA) && "text-white")}>
               {isKids ? "📜 Misi Rahasia" : "Daftar Tugas"}
           </h2>
       </div>

        {assignments.length === 0 ? (
            <EmptyState 
                icon={<ClipboardList size={32}/>} 
                text={isKids ? "Wah, tidak ada misi rahasia saat ini. Istirahatlah!" : "Tidak ada tugas aktif."} 
                isKids={isKids} isSMP={isSMP} isSMA={isSMA} isUni={isUni}
            />
        ) : (
            <div className="grid gap-4">
                {assignments.map((item: any, idx: number) => (
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                            "p-5 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden",
                            isKids ? "bg-white border-2 border-b-4 border-slate-100 hover:border-purple-400 hover:shadow-lg" : 
                            isSMP ? "bg-white/70 backdrop-blur-md border-white/60 hover:shadow-lg hover:border-violet-300 hover:bg-white/90" :
                            // UNI & SMA: Glass Card
                            (isUni || isSMA) ? "bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20" :
                            "bg-white border-slate-200 hover:border-purple-300 hover:shadow-md",
                            
                            // Specific Uni Hover
                            isUni && "hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]",
                            isSMA && "hover:border-teal-500/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.1)]"
                        )}
                        onClick={() => router.push(`/classroom/${classId}/assignment/${item.id}`)}
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex gap-4">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", 
                                    item.type === 'quiz' ? 'bg-orange-100 text-orange-600' : 
                                    item.type === 'game' ? 'bg-pink-100 text-pink-600' :
                                    item.type === 'project' ? 'bg-indigo-100 text-indigo-600' :
                                    'bg-purple-100 text-purple-600',
                                    
                                    isKids && "border-2 border-white shadow-md",
                                    isSMP && (item.type === 'quiz' ? 'bg-orange-50 text-orange-600' : 'bg-fuchsia-50 text-fuchsia-600'),
                                    isSMA && (item.type === 'quiz' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'),
                                    isUni && (item.type === 'quiz' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30')
                                )}>
                                    {item.type === 'quiz' ? <FileCheck size={28} /> : 
                                     item.type === 'game' ? <Gamepad2 size={28} /> :
                                     item.type === 'project' ? <UploadCloud size={28} /> :
                                     <ClipboardList size={28} />}
                                </div>
                                <div>
                                    <h3 className={cn("font-bold text-lg group-hover:text-purple-600 transition-colors", (isUni || isSMA) ? "text-slate-100 group-hover:text-white" : "text-slate-800")}>{item.title}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                                            isKids ? "bg-yellow-100 text-yellow-700" : 
                                            isSMP ? "bg-violet-100 text-violet-700" :
                                            (isUni || isSMA) ? "bg-slate-800 text-slate-400 border border-slate-700" :
                                            "bg-slate-100 text-slate-500"
                                        )}>
                                            {item.type === 'quiz' ? (isKids ? 'Tantangan Kuis' : 'Kuis') : 
                                             item.type === 'game' ? (isKids ? 'Permainan Seru' : 'Game Edukasi') :
                                             item.type === 'project' ? 'Proyek' :
                                             (isKids ? 'Laporan Misi' : 'Esai')}
                                        </span>
                                        {item.deadline && (
                                            <span className={cn("font-medium flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                                                (isUni || isSMA) ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "text-red-500 bg-red-50"
                                            )}>
                                                <Clock size={12} /> 
                                                {formatDeadline(item.deadline)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button size="sm" className={cn("hidden md:flex rounded-xl font-bold", 
                                isKids && "shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1", 
                                isSMP && "bg-violet-600 hover:bg-violet-700",
                                isSMA && "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20",
                                isUni && "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                            )}>
                                 {isKids ? "Terima Misi" : "Kerjakan"}
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
     </motion.div>
  );
}

// --- PEOPLE VIEW ---
export function PeopleView({ classMembers, isKids, isSMP, isUni, isSMA }: any) {
  return (
    <motion.div key="people" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
        <h2 className={cn("text-xl font-bold", isKids && "font-display text-primary", (isUni || isSMA) && "text-white")}>
               {isKids ? "👥 Pasukan Kita" : "Anggota Kelas"}
        </h2>
        <div className={cn("rounded-3xl border overflow-hidden shadow-sm", 
            isUni ? "bg-white/5 border-white/10 backdrop-blur-md" : 
            isSMP ? "bg-white/60 backdrop-blur-md border-white/60" :
            isSMA ? "bg-white/5 backdrop-blur-xl border-white/10" :
            "bg-white border-slate-200"
        )}>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className={cn("border-b", (isUni || isSMA) ? "bg-white/5 border-white/5" : "bg-slate-50/50 border-slate-100")}>
                      <tr>
                          <th className={cn("px-6 py-4 text-xs font-bold uppercase", (isUni || isSMA) ? "text-slate-400" : "text-slate-400")}>Nama</th>
                          <th className={cn("px-6 py-4 text-xs font-bold uppercase", (isUni || isSMA) ? "text-slate-400" : "text-slate-400")}>Level</th>
                          <th className={cn("px-6 py-4 text-xs font-bold uppercase text-right", (isUni || isSMA) ? "text-slate-400" : "text-slate-400")}>XP</th>
                      </tr>
                  </thead>
                  <tbody className={cn("divide-y", (isUni || isSMA) ? "divide-white/5" : "divide-slate-50/50")}>
                      {classMembers.map((member: any) => (
                          <tr key={member.uid} className={cn("transition-colors", (isUni || isSMA) ? "hover:bg-white/5" : "hover:bg-slate-50")}>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className={cn(
                                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs", 
                                          isKids ? "bg-primary/10 text-primary border border-primary/20" : 
                                          isSMP ? "bg-violet-100 text-violet-600" : 
                                          isSMA ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" :
                                          isUni ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" :
                                          "bg-slate-200 text-slate-600"
                                      )}>
                                          {member.displayName.charAt(0)}
                                      </div>
                                      <span className={cn("font-bold", (isUni || isSMA) ? "text-slate-200" : "text-slate-700")}>{member.displayName}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={cn(
                                      "px-2.5 py-1 rounded-lg text-xs font-bold", 
                                      isKids ? "bg-yellow-100 text-yellow-700" : 
                                      isSMP ? "bg-fuchsia-100 text-fuchsia-700" : 
                                      isSMA ? "bg-slate-800 text-slate-400 border border-slate-700" :
                                      isUni ? "bg-slate-800 text-indigo-300 border border-slate-700" :
                                      "bg-slate-100 text-slate-600"
                                  )}>
                                      Lvl {member.level}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <span className={cn("font-bold", isKids ? "text-primary" : isSMA ? "text-teal-400" : isUni ? "text-indigo-400" : "text-slate-600")}>{member.xp} XP</span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
               </table>
            </div>
        </div>
     </motion.div>
  );
}

// --- SHARED SUB COMPONENTS ---
function StatCard({ icon, label, value, color, theme, onClick, isKids, isSMP, isUni, isSMA }: any) {
  const colors: any = { 
      blue: isKids ? "bg-blue-100 text-blue-600" : isSMP ? "bg-violet-50 text-violet-600" : isSMA ? "bg-white/5 text-teal-400" : isUni ? "bg-white/5 text-indigo-400" : "bg-blue-50 text-blue-600", 
      purple: isKids ? "bg-purple-100 text-purple-600" : isSMP ? "bg-fuchsia-50 text-fuchsia-600" : isSMA ? "bg-white/5 text-teal-400" : isUni ? "bg-white/5 text-indigo-400" : "bg-purple-50 text-purple-600", 
      yellow: isKids ? "bg-yellow-100 text-yellow-600" : isSMA ? "bg-white/5 text-teal-400" : isUni ? "bg-white/5 text-indigo-400" : "bg-yellow-50 text-yellow-600", 
      green: isKids ? "bg-green-100 text-green-600" : isSMA ? "bg-white/5 text-teal-400" : isUni ? "bg-white/5 text-indigo-400" : "bg-green-50 text-green-600" 
  }
  return (
     <div onClick={onClick} className={cn(
         "p-4 rounded-3xl border flex flex-col items-center text-center transition-all h-full justify-between",
         isKids ? "bg-white border-2 border-b-4 border-slate-100 shadow-sm active:border-b-2 active:translate-y-[2px]" : 
         isSMP ? "bg-white/60 backdrop-blur-md border-white/60 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-violet-200" :
         (isUni || isSMA) ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300" :
         "bg-white border-slate-100 shadow-sm",
         onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]"
     )}>
        <div className={cn("p-3 rounded-2xl mb-2", colors[color])}>{icon}</div>
        <div>
           <div className={cn("text-xl md:text-2xl font-bold", isKids ? "text-primary font-display" : (isUni || isSMA) ? "text-white" : "text-slate-800")}>{value}</div>
           <div className={cn("text-[10px] md:text-xs font-bold uppercase tracking-wide", (isUni || isSMA) ? "text-slate-400" : "text-slate-400")}>{label}</div>
        </div>
     </div>
  )
}

function MaterialCard({ item, theme, isKids, isSMP, isUni, isSMA }: any) {
  // Helper: Open material logic
  const handleOpen = () => {
      if (item.type === 'map' && item.locationData) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${item.locationData.lat},${item.locationData.lng}`, '_blank');
      } else if (item.url) {
          window.open(item.url, '_blank');
      } else if (item.type === 'rich-text') {
          // TODO: Open modal for reading (Simpified for now: just alert)
          alert("Fitur baca artikel dalam aplikasi akan segera hadir! (Cek kembali update MateriView)");
      } else {
          alert("Konten tidak dapat dibuka.");
      }
  };

  // Helper: Icon
  const getIcon = () => {
      switch(item.type) {
          case 'pdf': return <FileText size={26} />;
          case 'map': return <MapPin size={26} />;
          case 'image': return <ImageIcon size={26} />;
          case 'rich-text': return <AlignLeft size={26} />;
          default: return <Video size={26} />;
      }
  };

  return (
     <div className={cn(
         "p-5 rounded-3xl border transition-all cursor-pointer group flex items-center gap-4 relative overflow-hidden",
         isKids ? "bg-white border-2 border-b-4 border-slate-100 hover:border-blue-400 hover:shadow-lg" : 
         isSMP ? "bg-white/70 backdrop-blur-md border-white/60 hover:shadow-lg hover:border-violet-300" :
         (isUni || isSMA) ? "bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]" :
         "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200",
         
         // Glow Effect for Uni/SMA
         isUni && "hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]",
         isSMA && "hover:border-teal-500/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.1)]"
     )} onClick={handleOpen}>
        
        {isKids && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />}
        {isSMP && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-violet-100/50 to-transparent rounded-bl-full pointer-events-none" />}
        {(isUni || isSMA) && <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity", isUni ? "from-indigo-500/10" : "from-teal-500/10")} />}

        <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", 
            item.type === 'video' 
               ? (isSMP ? 'bg-red-50 text-red-600' : isSMA ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : isUni ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-red-50 text-red-600') 
               : (isSMP ? 'bg-violet-50 text-violet-600' : isSMA ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : isUni ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-blue-50 text-blue-600'),
            isKids && "border-2 border-white shadow-md"
        )}>
           {getIcon()}
        </div>
        <div className="flex-1 min-w-0 relative z-10">
           <h4 className={cn("font-bold text-lg truncate transition-colors group-hover:text-primary", (isUni || isSMA) ? "text-slate-100" : "text-slate-800")}>{item.title}</h4>
           <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded", 
                    isKids ? "bg-slate-100 text-slate-500" : 
                    (isUni || isSMA) ? "bg-slate-800 text-slate-400 border border-slate-700" :
                    "bg-slate-100 text-slate-500"
                )}>
                   {item.type}
                </span>
                <span className={cn("text-xs", (isUni || isSMA) ? "text-slate-500" : "text-slate-400")}>• {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Baru'}</span>
           </div>
        </div>
        <div className={cn("p-2 rounded-full transition-colors", 
            isKids ? "bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white" : 
            isSMP ? "bg-violet-50 text-violet-500 group-hover:bg-violet-600 group-hover:text-white" :
            isSMA ? "bg-white/5 text-slate-400 group-hover:bg-teal-500 group-hover:text-white" :
            isUni ? "bg-white/5 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white" :
            "bg-slate-50 text-slate-300 group-hover:text-blue-500"
        )}>
            <LinkIcon size={20} />
        </div>
     </div>
  )
}

function EmptyState({ icon, text, isKids, isSMP, isSMA, isUni }: any) {
  return (
     <div className={cn(
         "text-center py-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center",
         isKids ? "bg-white border-slate-200" : 
         isSMP ? "bg-white/40 border-violet-200" :
         (isUni || isSMA) ? "bg-white/5 border-white/10" :
         "bg-slate-50 border-slate-200"
     )}>
        <div className={cn("p-4 rounded-full mb-4", 
            isKids ? "bg-slate-100 text-slate-400" : 
            (isUni || isSMA) ? "bg-white/5 text-slate-500" :
            "bg-white shadow-sm text-slate-300"
        )}>{icon}</div>
        <p className={cn("text-sm font-medium max-w-xs mx-auto", (isUni || isSMA) ? "text-slate-400" : "text-slate-500")}>{text}</p>
     </div>
  )
}