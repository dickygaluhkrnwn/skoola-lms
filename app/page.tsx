"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthClient from "@/app/auth/AuthClient";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, BookOpen, GraduationCap, 
  Rocket, LayoutDashboard, Shapes
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Catatan: Metadata dihapus karena ini sekarang Client Component ('use client').
// Metadata global sudah ada di app/layout.tsx.

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Cek status login
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDashboardClick = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Jika tombol "Masuk" diklik, tampilkan komponen AuthClient
  if (showAuth) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col justify-center relative">
        <div className="absolute top-4 left-4 z-10">
           <Button variant="ghost" onClick={() => setShowAuth(false)} className="gap-2">
             &larr; Kembali ke Beranda
           </Button>
        </div>
        <AuthClient />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white selection:bg-blue-100 font-sans">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Skoola</span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Button onClick={handleDashboardClick} className="font-bold bg-blue-600 hover:bg-blue-700">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => setShowAuth(true)} variant="default" className="bg-slate-900 text-white hover:bg-slate-800 font-semibold">
                Masuk / Daftar
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-6 border border-blue-100">
              🚀 Platform LMS Multi-Jenjang #1
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Belajar Jadi Lebih <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Seru & Cerdas.
              </span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              Skoola menggabungkan kurikulum standar dengan gamifikasi yang memikat. 
              Pantau streak harianmu, selesaikan tantangan bulanan, dan raih prestasi akademikmu.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Button onClick={handleDashboardClick} size="lg" className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 rounded-full font-bold">
                  Buka Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button onClick={() => setShowAuth(true)} size="lg" className="h-12 px-8 text-base bg-slate-900 hover:bg-slate-800 shadow-lg rounded-full font-bold">
                  Mulai Sekarang - Gratis
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <FeatureCard 
            icon={<Shapes className="h-6 w-6 text-orange-500" />}
            title="Sekolah Dasar"
            desc="Belajar sambil bermain dengan animasi interaktif yang menyenangkan."
            color="bg-orange-50 hover:border-orange-200"
          />
          <FeatureCard 
            icon={<BookOpen className="h-6 w-6 text-green-500" />}
            title="SMP & SMA"
            desc="Materi terstruktur, latihan soal adaptif, dan persiapan ujian."
            color="bg-green-50 hover:border-green-200"
          />
          <FeatureCard 
            icon={<GraduationCap className="h-6 w-6 text-blue-500" />}
            title="Universitas"
            desc="Kolaborasi, manajemen tugas, dan diskusi tingkat lanjut."
            color="bg-blue-50 hover:border-blue-200"
          />
          <FeatureCard 
            icon={<Rocket className="h-6 w-6 text-purple-500" />}
            title="Gamifikasi"
            desc="Raih XP, naik level, dan kumpulkan badge eksklusif setiap bulan."
            color="bg-purple-50 hover:border-purple-200"
          />
        </div>
      </section>

      {/* DASHBOARD PREVIEW SECTION */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">Pusat Komando Siswa</h2>
          <p className="text-slate-600 mb-12 max-w-2xl mx-auto">
            Bukan sekadar daftar pelajaran. Dashboard Skoola didesain untuk memicu semangatmu 
            dengan fitur Streak, Tantangan Harian, dan Musim Bulanan.
          </p>
          
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 mx-auto max-w-5xl bg-white p-2 md:p-4">
             <div className="aspect-[16/9] bg-slate-100 rounded-xl flex items-center justify-center relative overflow-hidden group">
                {/* Placeholder Visual untuk Dashboard */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100"></div>
                <div className="relative z-10 text-center p-8">
                   <div className="bg-white p-6 rounded-full shadow-sm inline-block mb-4">
                      <LayoutDashboard className="h-12 w-12 text-blue-500" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-700">Intip Dashboard Kamu</h3>
                   <p className="text-slate-500 mt-2">Login untuk melihat progress, streak, dan tugasmu.</p>
                   {!user && (
                     <Button variant="outline" onClick={() => setShowAuth(true)} className="mt-6 border-blue-200 text-blue-600 hover:bg-blue-50">
                       Masuk untuk Akses
                     </Button>
                   )}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="py-8 bg-white border-t border-slate-100 text-center">
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} Skoola LMS. Dikembangkan dengan ❤️ untuk Pendidikan Indonesia.
        </p>
      </footer>

    </main>
  );
}

function FeatureCard({ icon, title, desc, color }: any) {
  return (
    <div className={cn("p-6 rounded-2xl border border-transparent transition-all duration-300", color)}>
      <div className="mb-4 bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2 text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}