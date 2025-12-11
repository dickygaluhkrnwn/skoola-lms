"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Loader2, Mail, Lock, User,
  GraduationCap, Presentation, ArrowRight, Calendar
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
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
          {icon}
        </div>
        <input
          type={isPassword && showPassword ? "text" : type}
          className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-secondary/30 border-2 border-transparent focus:border-primary/20 focus:bg-white text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-gray-400"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-all"
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
  const [schoolLevel, setSchoolLevel] = useState<Theme | null>(null); // 'sd' | 'smp' | 'sma' | 'uni'
  
  // Form Data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Logic: Ganti tema visual secara langsung saat user memilih jenjang
  useEffect(() => {
    if (view === "register" && schoolLevel) {
      toggleTheme(schoolLevel);
    }
  }, [schoolLevel, view, toggleTheme]);

  // Cek Auth Existing User
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // Apply tema user yang tersimpan
            if (userData.schoolLevel) {
               toggleTheme(userData.schoolLevel as Theme);
            }

            if (userData.role === "teacher") {
              router.push("/teacher");
            } else {
              // Redirect ke dashboard (Catatan: Kita akan ubah /learn jadi /dashboard di Tahap 2)
              router.push("/learn"); 
            }
          }
        } catch (error) {
          console.error("Gagal load user:", error);
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
      console.error("Login Error:", err);
      setError("Login gagal. Email atau password salah.");
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return setError("Pilih peran (Murid/Guru) dulu ya!");
    if (!schoolLevel) return setError("Pilih jenjang sekolah kamu!");

    setAuthLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Simpan data user lengkap ke Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        displayName: name,
        email: email,
        role: role,
        schoolLevel: schoolLevel, // FIELD BARU: PENTING
        xp: 0,
        level: 1,
        streak: 1,
        createdAt: Date.now(),
        enrolledClasses: []
      });

    } catch (err: any) {
      console.error("Register Error:", err);
      setError(err.message || "Gagal mendaftar.");
      setAuthLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background font-sans overflow-hidden transition-colors duration-500">

      {/* LEFT SIDE: Dynamic Visual Banner */}
      <div className={cn(
        "hidden lg:flex w-1/2 relative items-center justify-center text-white p-12 overflow-hidden transition-colors duration-500",
        // Warna background berubah sesuai tema aktif
        theme === "sd" ? "bg-red-500" :
        theme === "smp" ? "bg-violet-600" :
        theme === "sma" ? "bg-emerald-600" : "bg-slate-900"
      )}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/batik-rampung.png')]"></div>

        <div className={cn(
          "absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse transition-colors duration-500",
          theme === "sd" ? "bg-yellow-400" :
          theme === "smp" ? "bg-cyan-400" :
          theme === "sma" ? "bg-teal-400" : "bg-blue-600"
        )}></div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            key={theme} // Trigger animasi saat tema berubah
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
              <span className={cn("w-2.5 h-2.5 rounded-full animate-pulse",
                 theme === "sd" ? "bg-yellow-400" :
                 theme === "smp" ? "bg-pink-400" :
                 theme === "sma" ? "bg-amber-400" : "bg-blue-400"
              )}></span>
              <span className="text-xs font-bold tracking-widest uppercase">SKOOLA 2.0</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              {theme === "sd" ? <>Belajar Itu <br/><span className="text-yellow-300 italic">Seru Banget!</span></> :
               theme === "smp" ? <>Eksplorasi <br/><span className="text-cyan-300 italic">Duniamu.</span></> :
               theme === "sma" ? <>Siapkan <br/><span className="text-amber-300 italic">Masa Depan.</span></> :
               <>Platform <br/><span className="text-blue-300 italic">Akademik Digital.</span></>
              }
            </h1>

            <p className="text-white/80 text-lg leading-relaxed max-w-md">
              Platform sekolah digital terintegrasi untuk semua jenjang pendidikan.
            </p>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE: Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-background">
        <div className="max-w-md w-full">

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2 text-primary transition-colors">
              {view === "login" ? "Selamat Datang" : "Buat Akun Baru"}
            </h2>
            <p className="text-gray-500 font-medium">
              {view === "login"
                ? "Masuk untuk melanjutkan pembelajaran."
                : "Daftar untuk mulai akses kelas digital."}
            </p>
          </div>

          {/* Toggle Login/Register */}
          <div className="bg-secondary p-1.5 rounded-xl flex mb-8">
            <button
              onClick={() => { setView("login"); setError(""); }}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                view === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              )}
            >
              Masuk
            </button>
            <button
              onClick={() => { setView("register"); setError(""); }}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                view === "register"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
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
              className="space-y-5"
            >
              {view === "register" && (
                <div className="space-y-5">
                  {/* Pilihan Peran */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Saya adalah...</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => setRole("student")}
                        className={cn(
                          "cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center group active:scale-95",
                          role === "student"
                            ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                            : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                        )}
                      >
                        <div className={cn("p-2 rounded-full", role === "student" ? "bg-primary text-white" : "bg-gray-100 text-gray-500")}>
                          <GraduationCap size={18} />
                        </div>
                        <span className="font-bold text-sm">Murid</span>
                      </div>
                      <div
                        onClick={() => setRole("teacher")}
                        className={cn(
                          "cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center group active:scale-95",
                          role === "teacher"
                            ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                            : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                        )}
                      >
                        <div className={cn("p-2 rounded-full", role === "teacher" ? "bg-primary text-white" : "bg-gray-100 text-gray-500")}>
                          <Presentation size={18} />
                        </div>
                        <span className="font-bold text-sm">Guru</span>
                      </div>
                    </div>
                  </div>

                  {/* Pilihan Jenjang Sekolah */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Jenjang Sekolah</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'sd', label: 'SD', icon: '🎒', color: 'red' },
                            { id: 'smp', label: 'SMP', icon: '🛹', color: 'violet' },
                            { id: 'sma', label: 'SMA', icon: '🎧', color: 'emerald' },
                            { id: 'uni', label: 'Univ', icon: '🏛️', color: 'slate' },
                        ].map((level) => (
                            <div
                                key={level.id}
                                onClick={() => setSchoolLevel(level.id as Theme)}
                                className={cn(
                                    "cursor-pointer p-2 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 text-center active:scale-95",
                                    schoolLevel === level.id
                                        ? `border-${level.color}-500 bg-${level.color}-50 text-${level.color}-700 ring-2 ring-${level.color}-200`
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                )}
                                style={{
                                    // Hack untuk memastikan warna aktif sesuai tema tanpa ribet class dynamic tailwind
                                    borderColor: schoolLevel === level.id ? `var(--color-primary)` : '',
                                    color: schoolLevel === level.id ? `var(--color-primary)` : '',
                                    backgroundColor: schoolLevel === level.id ? `var(--color-secondary)` : ''
                                }}
                            >
                                <span className="text-xl">{level.icon}</span>
                                <span className="font-bold text-xs">{level.label}</span>
                            </div>
                        ))}
                    </div>
                  </div>

                  <InputField
                    label="Nama Lengkap"
                    placeholder="Nama Anda"
                    icon={<User size={18} />}
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                  />
                </div>
              )}

              <InputField
                label="Alamat Email"
                type="email"
                placeholder="nama@sekolah.id"
                icon={<Mail size={18} />}
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
              />

              <InputField
                label="Kata Sandi"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
              />

              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-start gap-3 border border-red-100 animate-in slide-in-from-top-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-xl active:scale-[0.98]",
                  "bg-primary hover:bg-primary/90"
                )}
              >
                {authLoading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    {view === "login" ? "Masuk Sekarang" : "Buat Akun"} <ArrowRight size={20} />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}