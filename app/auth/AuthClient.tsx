"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, EyeOff, Loader2, Mail, Lock, User, 
  GraduationCap, Presentation, ArrowRight, Sun, Briefcase, Calendar
} from "lucide-react";
import { auth, db } from "@/lib/firebase"; 
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context"; 

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
  const [role, setRole] = useState<"student" | "teacher" | null>(null);

  // Form Data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState<string>(""); // State untuk Umur

  // Logic Auto-Theme berdasarkan Umur
  useEffect(() => {
    if (view === "register" && age) {
      const ageNum = parseInt(age);
      if (!isNaN(ageNum)) {
        if (ageNum < 13) {
          if (theme !== "kids") toggleTheme("kids");
        } else {
          if (theme !== "pro") toggleTheme("pro");
        }
      }
    }
  }, [age, view, theme, toggleTheme]);

  // Cek Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            // Simpan preferensi tema user yang login ke localStorage agar konsisten
            if (userData.themePreference) {
               toggleTheme(userData.themePreference);
            }
            
            if (userData.role === "teacher") {
              router.push("/teacher");
            } else {
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
    if (!role) return setError("Pilih peran dulu ya!");
    if (!age && role === 'student') return setError("Masukkan umur kamu!"); // Validasi umur
    
    setAuthLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Simpan data user ke Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        displayName: name,
        email: email,
        role: role,
        age: parseInt(age) || 0, // Simpan umur
        xp: 0,
        level: 1,
        streak: 1, // Reset ke integer sederhana sesuai update SocialClient
        createdAt: Date.now(),
        themePreference: theme, // Simpan tema yang terpilih otomatis
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
      
      {/* 1. THEME TOGGLE (Floating Top Right) */}
      <div className="fixed top-6 right-6 z-50 flex items-center bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-gray-200 shadow-lg">
        <button
          type="button"
          onClick={() => toggleTheme("kids")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all",
            theme === "kids" 
              ? "bg-red-500 text-white shadow-md" 
              : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <Sun size={14} /> Anak
        </button>
        <button
          type="button"
          onClick={() => toggleTheme("pro")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all",
            theme === "pro" 
              ? "bg-sky-600 text-white shadow-md" 
              : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <Briefcase size={14} /> Dewasa
        </button>
      </div>

      {/* 2. LEFT SIDE: Visual Banner */}
      <div className={cn(
        "hidden lg:flex w-1/2 relative items-center justify-center text-white p-12 overflow-hidden transition-colors duration-500",
        theme === "kids" ? "bg-red-600" : "bg-slate-900"
      )}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/batik-rampung.png')]"></div>
        
        <div className={cn(
          "absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse transition-colors duration-500",
          theme === "kids" ? "bg-yellow-400" : "bg-sky-600"
        )}></div>

        <div className="relative z-10 max-w-lg">
          <motion.div 
            key={theme}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
              <span className={cn("w-2.5 h-2.5 rounded-full animate-pulse", theme === "kids" ? "bg-yellow-400" : "bg-sky-400")}></span>
              <span className="text-xs font-bold tracking-widest uppercase">SKOOLA {theme === 'kids' ? 'KIDS' : 'PRO'}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              {theme === "kids" ? (
                <>Belajar Jadi <br/><span className="text-yellow-300 italic">Seru Banget!</span></>
              ) : (
                <>Tingkatkan <br/><span className="text-sky-400 italic">Kompetensi Anda.</span></>
              )}
            </h1>
            
            <p className="text-white/80 text-lg leading-relaxed max-w-md">
              {theme === "kids" 
                ? "Ayo berpetualang sambil belajar Bahasa Indonesia. Kumpulkan poin dan jadilah juara!" 
                : "Platform BIPA terintegrasi untuk meningkatkan profisiensi bahasa Indonesia Anda secara profesional."}
            </p>
          </motion.div>
        </div>
      </div>

      {/* 3. RIGHT SIDE: Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-background">
        <div className="max-w-md w-full">
          
          <div className="text-center mb-10">
            <h2 className={cn("text-3xl font-bold mb-2 transition-colors", theme === 'kids' ? 'text-red-600' : 'text-slate-900')}>
              {view === "login" 
                ? (theme === "kids" ? "Halo, Petualang!" : "Selamat Datang") 
                : (theme === "kids" ? "Mulai Petualangan" : "Buat Akun Baru")}
            </h2>
            <p className="text-gray-500 font-medium">
              {view === "login" 
                ? "Lanjutkan progres belajarmu hari ini." 
                : "Daftar gratis untuk mulai belajar."}
            </p>
          </div>

          <div className="bg-secondary/50 p-1.5 rounded-xl flex mb-8">
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
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data Diri</label>
                  
                  {/* Pilihan Peran */}
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

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <InputField 
                            label="Nama Lengkap" 
                            placeholder="Budi Santoso"
                            icon={<User size={18} />} 
                            value={name} 
                            onChange={(e: any) => setName(e.target.value)}
                        />
                    </div>
                    <div className="col-span-1">
                        <InputField 
                            label="Umur" 
                            type="number"
                            placeholder="12"
                            min="5"
                            max="99"
                            icon={<Calendar size={18} />} 
                            value={age} 
                            onChange={(e: any) => setAge(e.target.value)}
                        />
                    </div>
                  </div>
                </div>
              )}

              <InputField 
                label="Alamat Email" 
                type="email"
                placeholder="nama@email.com"
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
                  theme === "kids" 
                    ? "bg-red-600 hover:bg-red-700 shadow-red-500/30" 
                    : "bg-sky-600 hover:bg-sky-700 shadow-sky-500/30"
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