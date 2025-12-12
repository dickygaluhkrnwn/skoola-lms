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
const InputField = ({ label, icon, type = "text", value, onChange, placeholder, min, max, isSMA, isUni }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <label className={cn("text-xs font-bold uppercase tracking-wider ml-1", (isSMA || isUni) ? "text-slate-400" : "text-slate-500")}>{label}</label>
      <div className="relative group">
        <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", 
            isUni ? "text-indigo-400 group-focus-within:text-indigo-300" :
            isSMA ? "text-slate-500 group-focus-within:text-teal-400" : 
            "text-slate-400 group-focus-within:text-violet-600"
        )}>
          {icon}
        </div>
        <input
          type={isPassword && showPassword ? "text" : type}
          className={cn(
            "w-full pl-12 pr-12 py-3.5 rounded-xl border outline-none transition-all font-medium backdrop-blur-sm",
            isUni 
              ? "bg-slate-900/60 border-white/10 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-600"
              : isSMA 
                ? "bg-slate-900/50 border-slate-700 text-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-slate-600"
                : "bg-slate-50/50 border-slate-200 focus:border-violet-500 focus:bg-white text-slate-900 focus:ring-4 focus:ring-violet-500/10 placeholder:text-slate-400"
          )}
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
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all",
              (isSMA || isUni) ? "text-slate-500 hover:text-slate-300 hover:bg-white/5" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            )}
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

  // Helper State for Themes
  const isSMA = (view === "register" && schoolLevel === "sma") || (view === "login" && theme === "sma");
  const isUni = (view === "register" && schoolLevel === "uni") || (view === "login" && theme === "uni");

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
    <div className={cn("min-h-screen flex items-center justify-center", (isSMA || isUni) ? "bg-slate-950 text-white" : "bg-slate-50")}>
        <Loader2 className={cn("w-10 h-10 animate-spin", isUni ? "text-indigo-500" : isSMA ? "text-teal-500" : "text-violet-600")} />
    </div>
  );

  return (
    <div className={cn(
      "min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans transition-colors duration-500",
      (isSMA || isUni) ? "bg-slate-950" : "bg-slate-50"
    )}>
      
      {/* --- AMBIENT BACKGROUND BLOBS --- */}
      {isUni ? (
         // UNI BACKGROUND: Mesh Gradient
         <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1121] to-indigo-950" />
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[150px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
         </div>
      ) : isSMA ? (
        // SMA BACKGROUND (Dark Aurora)
        <div className="fixed inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
           <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-teal-600/10 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
           <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      ) : (
        // DEFAULT BACKGROUND
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-400/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-400/30 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-cyan-400/20 rounded-full blur-[100px] animate-pulse delay-500" />
        </div>
      )}

      <div className={cn(
         "w-full max-w-5xl h-full md:h-[600px] flex rounded-3xl overflow-hidden shadow-2xl relative z-10 m-4 transition-all duration-500",
         isUni ? "bg-slate-900/60 backdrop-blur-2xl border border-white/10" :
         isSMA ? "bg-slate-900/40 backdrop-blur-2xl border border-white/10" : 
         "bg-white/60 backdrop-blur-xl border border-white/50"
      )}>
        
        {/* LEFT: VISUAL PANEL */}
        <div className={cn(
           "hidden md:flex w-1/2 relative p-12 flex-col text-white justify-between overflow-hidden transition-colors duration-500",
           isUni ? "bg-gradient-to-br from-indigo-900 via-slate-900 to-black" :
           isSMA ? "bg-gradient-to-br from-slate-900 to-indigo-950" : 
           "bg-gradient-to-br from-violet-600 to-indigo-700"
        )}>
            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            {/* Floating Elements */}
            <motion.div 
               animate={{ y: [0, -20, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-20 right-10 text-6xl opacity-20"
            >
               {isSMA || isUni ? '⚛️' : '🚀'}
            </motion.div>
            <motion.div 
               animate={{ y: [0, 20, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute bottom-40 left-10 text-6xl opacity-20"
            >
               {isSMA || isUni ? '🧬' : '💡'}
            </motion.div>

            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-6">
                  <div className={cn("p-2 rounded-lg backdrop-blur-sm", isUni ? "bg-indigo-500/20 text-indigo-300" : isSMA ? "bg-teal-500/20" : "bg-white/20")}>
                     <Sparkles size={24} className={isUni ? "text-indigo-300" : isSMA ? "text-teal-300" : "text-yellow-300"} />
                  </div>
                  <span className="font-bold tracking-widest text-sm uppercase opacity-80">SKOOLA LMS</span>
               </div>
               <h1 className="text-5xl font-black leading-tight mb-4">
                  {isUni ? (
                      <>
                        Discover Your <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Potential.</span>
                      </>
                  ) : isSMA ? (
                     <>
                        Elevate Your <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300">Learning.</span>
                     </>
                  ) : (
                     <>
                        Belajar Jadi <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">Lebih Seru.</span>
                     </>
                  )}
               </h1>
               <p className={cn("text-lg max-w-sm leading-relaxed", (isSMA || isUni) ? "text-slate-400" : "text-indigo-100/80")}>
                  {isUni ? "Ekosistem akademik digital untuk mahasiswa modern dan dosen profesional." :
                   isSMA ? "Platform digital terintegrasi untuk produktivitas akademik maksimal." : 
                   "Platform sekolah digital dengan gamifikasi yang bikin kamu ketagihan belajar."}
               </p>
            </div>

            <div className="relative z-10 flex gap-4 text-xs font-medium opacity-60">
               <span>© 2024 Skoola Edukasi</span>
               <span>•</span>
               <span>Versi 2.0</span>
            </div>
        </div>

        {/* RIGHT: FORM AREA */}
        <div className={cn(
           "w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto transition-colors duration-500",
           (isSMA || isUni) ? "bg-slate-950/50 backdrop-blur-md" : "bg-white/50 backdrop-blur-md"
        )}>
            <div className="max-w-sm w-full mx-auto">
                <div className="text-center mb-8">
                   <h2 className={cn("text-2xl font-bold mb-1", (isSMA || isUni) ? "text-white" : "text-slate-800")}>
                      {view === "login" ? "Selamat Datang Kembali!" : "Mulai Petualangan Baru"}
                   </h2>
                   <p className={cn("text-sm", (isSMA || isUni) ? "text-slate-400" : "text-slate-500")}>
                      {view === "login" ? "Masuk untuk melanjutkan progress belajarmu." : "Daftar akun gratis sekarang juga."}
                   </p>
                </div>

                {/* Tabs */}
                <div className={cn("flex p-1 rounded-xl mb-6", (isSMA || isUni) ? "bg-slate-800/50 border border-slate-700" : "bg-slate-100")}>
                   <button 
                      onClick={() => { setView("login"); setError(""); }}
                      className={cn(
                         "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                         view === "login" 
                           ? ((isSMA || isUni) ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm") 
                           : ((isSMA || isUni) ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")
                      )}
                   >
                      Masuk
                   </button>
                   <button 
                      onClick={() => { setView("register"); setError(""); }}
                      className={cn(
                         "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                         view === "register" 
                           ? ((isSMA || isUni) ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm") 
                           : ((isSMA || isUni) ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")
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
                                     role === "student" 
                                       ? (isUni ? "border-indigo-600 bg-indigo-900/30 text-indigo-400" : isSMA ? "border-teal-600 bg-teal-900/30 text-teal-400" : "border-violet-500 bg-violet-50 text-violet-700")
                                       : ((isSMA || isUni) ? "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600" : "border-slate-200 hover:border-slate-300")
                                  )}
                               >
                                  <GraduationCap size={20} />
                                  <span className="text-xs font-bold">Murid</span>
                               </div>
                               <div 
                                  onClick={() => setRole("teacher")}
                                  className={cn(
                                     "cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center gap-1 text-center transition-all",
                                     role === "teacher" 
                                       ? (isUni ? "border-indigo-600 bg-indigo-900/30 text-indigo-400" : isSMA ? "border-teal-600 bg-teal-900/30 text-teal-400" : "border-violet-500 bg-violet-50 text-violet-700")
                                       : ((isSMA || isUni) ? "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600" : "border-slate-200 hover:border-slate-300")
                                  )}
                               >
                                  <Presentation size={20} />
                                  <span className="text-xs font-bold">Guru</span>
                               </div>
                            </div>

                            {/* Level Selection */}
                            <div>
                               <label className={cn("text-xs font-bold uppercase ml-1 mb-1 block", (isSMA || isUni) ? "text-slate-400" : "text-slate-500")}>Jenjang</label>
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
                                              ? (isUni ? "border-indigo-500 bg-indigo-900/30 text-indigo-400" : isSMA ? `border-teal-500 bg-teal-900/30 text-teal-400` : `border-${lvl.color}-500 bg-${lvl.color}-50 text-${lvl.color}-700`) 
                                              : ((isSMA || isUni) ? "border-slate-700 text-slate-400 hover:border-slate-600" : "border-slate-200 hover:border-slate-300")
                                        )}
                                        // Override style dynamic untuk selain SMA/Uni agar warna asli tetap muncul
                                        style={schoolLevel === lvl.id && !isSMA && !isUni ? { borderColor: `var(--color-primary)`, color: `var(--color-primary)`, backgroundColor: `var(--color-secondary)` } : {}}
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
                               isSMA={isSMA}
                               isUni={isUni}
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
                         isSMA={isSMA}
                         isUni={isUni}
                      />

                      <InputField
                         label="Password"
                         type="password"
                         placeholder="••••••••"
                         icon={<Lock size={18} />}
                         value={password}
                         onChange={(e: any) => setPassword(e.target.value)}
                         isSMA={isSMA}
                         isUni={isUni}
                      />

                      {error && (
                         <div className={cn(
                            "p-3 text-xs font-bold rounded-lg border flex items-center gap-2",
                            (isSMA || isUni) ? "bg-red-900/20 text-red-400 border-red-900/50" : "bg-red-50 text-red-600 border-red-100"
                         )}>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {error}
                         </div>
                      )}

                      <button
                         type="submit"
                         disabled={authLoading}
                         className={cn(
                            "w-full py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4",
                            isUni 
                              ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                              : isSMA 
                                ? "bg-teal-600 hover:bg-teal-500 text-white shadow-teal-900/20" 
                                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/30"
                         )}
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