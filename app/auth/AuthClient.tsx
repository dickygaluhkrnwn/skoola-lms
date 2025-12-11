"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Loader2, Mail, Lock, User,
  GraduationCap, Presentation, ArrowRight, Sparkles
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme, Theme } from "@/lib/theme-context";

// --- COMPONENTS ---
const InputField = ({ label, icon, type = "text", value, onChange, placeholder, min, max }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
          {icon}
        </div>
        <input
          type={isPassword && showPassword ? "text" : type}
          className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 focus:border-violet-500 focus:bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all font-medium placeholder:text-slate-400 backdrop-blur-sm"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-all"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

// --- MAIN CLIENT COMPONENT ---
export default function AuthClient() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [view, setView] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Register States
  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [schoolLevel, setSchoolLevel] = useState<Theme | null>(null);
  
  // Form Data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Update theme preview based on selection
  useEffect(() => {
    if (view === "register" && schoolLevel) {
      toggleTheme(schoolLevel);
    }
  }, [schoolLevel, view, toggleTheme]);

  // Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.schoolLevel) toggleTheme(userData.schoolLevel as Theme);
            router.push(userData.role === "teacher" ? "/teacher" : "/learn");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, toggleTheme]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError("Email atau password salah.");
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return setError("Pilih peran kamu dulu!");
    if (!schoolLevel) return setError("Pilih jenjang sekolah kamu!");

    setAuthLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName: name,
        email: email,
        role: role,
        schoolLevel: schoolLevel,
        xp: 0,
        level: 1,
        streak: 1,
        createdAt: Date.now(),
        enrolledClasses: []
      });
    } catch (err: any) {
      setError(err.message || "Gagal mendaftar.");
      setAuthLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 font-sans">
      
      {/* --- AMBIENT BACKGROUND BLOBS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-400/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-400/30 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-cyan-400/20 rounded-full blur-[100px] animate-pulse delay-500" />
      </div>

      <div className="w-full max-w-5xl h-full md:h-[600px] flex rounded-3xl overflow-hidden shadow-2xl relative z-10 m-4 bg-white/60 backdrop-blur-xl border border-white/50">
        
        {/* LEFT: VISUAL PANEL */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-violet-600 to-indigo-700 relative p-12 flex-col text-white justify-between overflow-hidden">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            {/* Floating Elements */}
            <motion.div 
               animate={{ y: [0, -20, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-20 right-10 text-6xl opacity-20"
            >
               🚀
            </motion.div>
            <motion.div 
               animate={{ y: [0, 20, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute bottom-40 left-10 text-6xl opacity-20"
            >
               💡
            </motion.div>

            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                     <Sparkles size={24} className="text-yellow-300" />
                  </div>
                  <span className="font-bold tracking-widest text-sm uppercase opacity-80">SKOOLA LMS</span>
               </div>
               <h1 className="text-5xl font-black leading-tight mb-4">
                  Belajar Jadi <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">Lebih Seru.</span>
               </h1>
               <p className="text-lg text-indigo-100/80 max-w-sm leading-relaxed">
                  Platform sekolah digital dengan gamifikasi yang bikin kamu ketagihan belajar.
               </p>
            </div>

            <div className="relative z-10 flex gap-4 text-xs font-medium opacity-60">
               <span>© 2024 Skoola Edukasi</span>
               <span>•</span>
               <span>Versi 2.0</span>
            </div>
        </div>

        {/* RIGHT: FORM AREA */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white/50 backdrop-blur-md overflow-y-auto">
            <div className="max-w-sm w-full mx-auto">
                <div className="text-center mb-8">
                   <h2 className="text-2xl font-bold text-slate-800 mb-1">
                      {view === "login" ? "Selamat Datang Kembali!" : "Mulai Petualangan Baru"}
                   </h2>
                   <p className="text-slate-500 text-sm">
                      {view === "login" ? "Masuk untuk melanjutkan progress belajarmu." : "Daftar akun gratis sekarang juga."}
                   </p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                   <button 
                      onClick={() => { setView("login"); setError(""); }}
                      className={cn(
                         "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                         view === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                   >
                      Masuk
                   </button>
                   <button 
                      onClick={() => { setView("register"); setError(""); }}
                      className={cn(
                         "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                         view === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                   >
                      Daftar
                   </button>
                </div>

                <AnimatePresence mode="wait">
                   <motion.form
                      key={view}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={view === "login" ? handleLogin : handleRegister}
                      className="space-y-4"
                   >
                      {view === "register" && (
                         <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                            {/* Role Selection */}
                            <div className="grid grid-cols-2 gap-3">
                               <div 
                                  onClick={() => setRole("student")}
                                  className={cn(
                                     "cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center gap-1 text-center transition-all",
                                     role === "student" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 hover:border-slate-300"
                                  )}
                               >
                                  <GraduationCap size={20} />
                                  <span className="text-xs font-bold">Murid</span>
                               </div>
                               <div 
                                  onClick={() => setRole("teacher")}
                                  className={cn(
                                     "cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center gap-1 text-center transition-all",
                                     role === "teacher" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 hover:border-slate-300"
                                  )}
                               >
                                  <Presentation size={20} />
                                  <span className="text-xs font-bold">Guru</span>
                               </div>
                            </div>

                            {/* Level Selection */}
                            <div>
                               <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Jenjang</label>
                               <div className="grid grid-cols-4 gap-2">
                                  {[
                                     { id: 'sd', label: 'SD', color: 'red' },
                                     { id: 'smp', label: 'SMP', color: 'violet' },
                                     { id: 'sma', label: 'SMA', color: 'emerald' },
                                     { id: 'uni', label: 'Univ', color: 'slate' },
                                  ].map((lvl) => (
                                     <div
                                        key={lvl.id}
                                        onClick={() => setSchoolLevel(lvl.id as Theme)}
                                        className={cn(
                                           "cursor-pointer py-2 rounded-lg border-2 text-center text-xs font-bold transition-all",
                                           schoolLevel === lvl.id 
                                              ? `border-${lvl.color}-500 bg-${lvl.color}-50 text-${lvl.color}-700` 
                                              : "border-slate-200 hover:border-slate-300"
                                        )}
                                        style={schoolLevel === lvl.id ? { borderColor: `var(--color-primary)`, color: `var(--color-primary)`, backgroundColor: `var(--color-secondary)` } : {}}
                                     >
                                        {lvl.label}
                                     </div>
                                  ))}
                               </div>
                            </div>

                            <InputField
                               label="Nama Lengkap"
                               placeholder="Nama Kamu"
                               icon={<User size={18} />}
                               value={name}
                               onChange={(e: any) => setName(e.target.value)}
                            />
                         </div>
                      )}

                      <InputField
                         label="Email"
                         type="email"
                         placeholder="nama@sekolah.id"
                         icon={<Mail size={18} />}
                         value={email}
                         onChange={(e: any) => setEmail(e.target.value)}
                      />

                      <InputField
                         label="Password"
                         type="password"
                         placeholder="••••••••"
                         icon={<Lock size={18} />}
                         value={password}
                         onChange={(e: any) => setPassword(e.target.value)}
                      />

                      {error && (
                         <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {error}
                         </div>
                      )}

                      <button
                         type="submit"
                         disabled={authLoading}
                         className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-violet-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                      >
                         {authLoading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                               {view === "login" ? "Masuk Sekarang" : "Buat Akun Baru"}
                               <ArrowRight size={18} />
                            </>
                         )}
                      </button>
                   </motion.form>
                </AnimatePresence>
            </div>
        </div>

      </div>
    </div>
  );
}