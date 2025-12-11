"use client";

import React from "react";
import { 
  Users, BookOpen, Copy, Video, FileText, 
  Trophy, TrendingUp, CalendarCheck 
} from "lucide-react";
import { Button } from "../../ui/button";
import { Timestamp } from "firebase/firestore";

// --- INTERFACES ---
// Kita definisikan props yang dibutuhkan komponen ini
interface DashboardViewProps {
  classData: {
    name: string;
    description: string;
    code: string;
  } | null;
  students: any[]; // Bisa diperjelas tipenya jika ada file types global
  materials: any[];
  averageXP: number;
  onCopyCode: () => void;
  onChangeTab: (tab: "attendance") => void; // Fungsi untuk navigasi ke tab presensi
}

export default function DashboardView({
  classData,
  students,
  materials,
  averageXP,
  onCopyCode,
  onChangeTab
}: DashboardViewProps) {
  
  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Header Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide mb-3 inline-block">
            Kode: {classData?.code}
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{classData?.name}</h1>
          <p className="text-slate-500 max-w-xl">{classData?.description || "Tidak ada deskripsi."}</p>
          
          <div className="flex gap-3 mt-6">
            <Button onClick={onCopyCode} variant="outline" className="gap-2">
              <Copy size={16} /> Salin Kode
            </Button>
            <Button onClick={() => onChangeTab("attendance")} className="bg-blue-600 hover:bg-blue-700 gap-2 text-white">
              <CalendarCheck size={16} /> Cek Presensi Hari Ini
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Users size={18} />} 
          label="Total Murid" 
          value={students.length} 
          color="blue" 
        />
        <StatCard 
          icon={<Trophy size={18} />} 
          label="Rata-rata XP" 
          value={averageXP} 
          color="yellow" 
        />
        <StatCard 
          icon={<BookOpen size={18} />} 
          label="Materi" 
          value={materials.length} 
          color="green" 
        />
        <StatCard 
          icon={<TrendingUp size={18} />} 
          label="Keaktifan" 
          value="85%" 
          color="purple" 
        />
      </div>

      {/* 3. Recent Activity Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* A. Murid Terbaru */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-500" /> Murid Terbaru
          </h3>
          <div className="space-y-3">
            {students.slice(0, 3).map((s: any) => (
              <div key={s.uid} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs overflow-hidden">
                   {s.photoURL ? <img src={s.photoURL} alt="av" className="w-full h-full object-cover"/> : "🎓"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">{s.displayName}</p>
                  <p className="text-xs text-slate-400">Level {s.level || 1}</p>
                </div>
                <span className="text-xs font-bold text-blue-600">{s.xp || 0} XP</span>
              </div>
            ))}
            {students.length === 0 && (
              <p className="text-sm text-slate-400 italic py-2">Belum ada murid yang bergabung.</p>
            )}
          </div>
        </div>

        {/* B. Materi Terbaru */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-green-500" /> Materi Terbaru
          </h3>
          <div className="space-y-3">
            {materials.slice(0, 3).map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  {m.type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-slate-700 truncate">{m.title}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    {m.type === 'video' ? 'Video' : 'Artikel'}
                    <span>•</span>
                    {m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleDateString() : 'Baru saja'}
                  </p>
                </div>
              </div>
            ))}
            {materials.length === 0 && (
              <p className="text-sm text-slate-400 italic py-2">Belum ada materi yang diupload.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENT: StatCard ---
function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl mb-2 ${colorClasses[color] || colorClasses.blue}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</div>
    </div>
  );
}