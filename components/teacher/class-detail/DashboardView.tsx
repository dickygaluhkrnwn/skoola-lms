"use client";

import React from "react";
import { 
  Users, BookOpen, Copy, Video, FileText, 
  Trophy, TrendingUp, CalendarCheck, Clock,
  CheckCircle2, Gamepad2
} from "lucide-react";
import { Button } from "../../ui/button";
import { Timestamp } from "firebase/firestore";
// Import tipe data Classroom dari pusat
import { Classroom } from "../../../lib/types/course.types";

// --- INTERFACES ---
interface DashboardViewProps {
  classData: Classroom | null;
  students: any[]; 
  materials: any[];
  averageXP: number;
  onCopyCode: () => void;
  onChangeTab: (tab: any) => void; 
}

export default function DashboardView({
  classData,
  students,
  materials,
  averageXP,
  onCopyCode,
  onChangeTab
}: DashboardViewProps) {
  
  // Calculate specific stats
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.lastActiveModule).length;
  const activityRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;
  
  // Recent materials (top 3)
  const recentMaterials = materials.slice(0, 3);
  
  // Top students (by XP)
  const topStudents = [...students].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 3);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Header Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
             <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide inline-block">
               Kode: {classData?.code || "-"}
             </span>
             {classData?.gradeLevel && (
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide inline-block border border-indigo-100">
                  {classData.gradeLevel}
                </span>
             )}
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{classData?.name}</h1>
          <p className="text-slate-500 max-w-xl text-sm leading-relaxed">{classData?.description || "Tidak ada deskripsi."}</p>
          
          <div className="flex gap-3 mt-6">
            <Button onClick={onCopyCode} variant="outline" className="gap-2 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm">
              <Copy size={16} /> Salin Kode
            </Button>
            <Button onClick={() => onChangeTab("attendance")} className="bg-blue-600 hover:bg-blue-700 gap-2 text-white shadow-md shadow-blue-200">
              <CalendarCheck size={16} /> Cek Presensi Hari Ini
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Users size={20} />} 
          label="Total Murid" 
          value={totalStudents} 
          color="blue" 
          subLabel="Siswa terdaftar"
        />
        <StatCard 
          icon={<Trophy size={20} />} 
          label="Rata-rata XP" 
          value={averageXP} 
          color="yellow" 
          subLabel="Poin gamifikasi"
        />
        <StatCard 
          icon={<BookOpen size={20} />} 
          label="Materi" 
          value={materials.length} 
          color="green" 
          subLabel="Modul tersedia"
        />
        <StatCard 
          icon={<TrendingUp size={20} />} 
          label="Keaktifan" 
          value={`${activityRate}%`} 
          color="purple" 
          subLabel="Siswa aktif belajar"
        />
      </div>

      {/* 3. Recent Activity Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* A. Leaderboard (Top Students) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" /> Leaderboard Kelas
              </h3>
              <button onClick={() => onChangeTab("students")} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                 Lihat Semua
              </button>
          </div>
          
          <div className="space-y-3 flex-1">
            {topStudents.length > 0 ? topStudents.map((s: any, idx: number) => (
              <div key={s.uid} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    idx === 0 ? "bg-yellow-100 text-yellow-700" :
                    idx === 1 ? "bg-slate-200 text-slate-600" :
                    "bg-orange-100 text-orange-700"
                }`}>
                   #{idx + 1}
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs overflow-hidden shrink-0 border border-slate-200">
                   {s.photoURL ? <img src={s.photoURL} alt="av" className="w-full h-full object-cover"/> : "🎓"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate">{s.displayName}</p>
                  <p className="text-xs text-slate-400">Level {s.level || 1}</p>
                </div>
                <div className="text-right">
                   <span className="text-sm font-bold text-blue-600 block">{s.xp || 0} XP</span>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                 <Users size={32} className="opacity-20 mb-2"/>
                 <p className="text-sm">Belum ada data siswa.</p>
              </div>
            )}
          </div>
        </div>

        {/* B. Materi Terbaru */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={18} className="text-green-500" /> Materi Terbaru
              </h3>
              <button onClick={() => onChangeTab("materials")} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                 Kelola Materi
              </button>
          </div>
          
          <div className="space-y-3 flex-1">
            {recentMaterials.length > 0 ? recentMaterials.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    m.type === 'video' ? 'bg-red-50 text-red-500' : 
                    m.type === 'game' ? 'bg-purple-50 text-purple-500' :
                    'bg-blue-50 text-blue-500'
                }`}>
                  {m.type === 'video' ? <Video size={18} /> : 
                   m.type === 'game' ? <Gamepad2 size={18} /> : <FileText size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">{m.title}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={10} />
                    {m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleDateString() : 'Baru saja'}
                  </p>
                </div>
                {/* Badge if new (logic placeholder) */}
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                 <BookOpen size={32} className="opacity-20 mb-2"/>
                 <p className="text-sm">Belum ada materi yang diupload.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ icon, label, value, color, subLabel }: { icon: React.ReactNode, label: string, value: string | number, color: string, subLabel: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow group relative overflow-hidden">
      <div className={`p-3 rounded-xl w-fit mb-3 transition-transform group-hover:scale-110 ${colorClasses[color] || colorClasses.blue}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-sm font-bold text-slate-600">{label}</div>
      <div className="text-xs text-slate-400 mt-1">{subLabel}</div>
      
      {/* Decoration Circle */}
      <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-10 ${colorClasses[color]?.replace('text-', 'bg-')}`}></div>
    </div>
  );
}