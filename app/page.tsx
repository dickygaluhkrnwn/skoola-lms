"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, EyeOff, Loader2, Mail, Lock, User, 
  GraduationCap, Presentation, ArrowRight
} from "lucide-react";
// UPDATE: Kita pakai import dari lib/firebase yang baru kamu buat!
import { auth, db } from "@/lib/firebase"; 
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  onAuthStateChanged, User as FirebaseUser 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation"; // Router untuk pindah halaman
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILITIES ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENTS (UI) ---
const InputField = ({ label, icon, type = "text", value, onChange, placeholder }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors">
          {icon}
        </div>
        <input
          type={isPassword && showPassword ? "text" : type}
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false); // Loading khusus tombol
  const [error, setError] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 1. CEK LOGIN & REDIRECT OTOMATIS
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Jika user ada, cek role-nya di database
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            // Redirect sesuai role
            if (userData.role === "teacher") {
              router.push("/teacher"); // Nanti kita buat
            } else {
              router.push("/learn"); // Ke Dashboard Murid
            }
          }
        } catch (error) {
          console.error("Gagal mengambil data user:", error);
        }
      } 
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Tidak perlu redirect manual disini, useEffect di atas akan menangani-nya
    } catch (err: any) {
      setError("Login gagal. Periksa email atau password Anda.");
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("Silakan pilih peran Anda (Murid atau Guru)!");
      return;
    }
    setAuthLoading(true);
    setError("");

    try {
      // 1. Buat User di Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // 2. Simpan Data Role ke Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        displayName: name,
        email: email,
        role: role,
        xp: 0,
        level: "basic",
        streak: 1, // Bonus streak awal
        createdAt: new Date().toISOString()
      });

      // Redirect akan ditangani oleh useEffect
    } catch (err: any) {
      setError(err.message || "Gagal mendaftar.");
      setAuthLoading(false);
    }
  };

  // Tampilan Loading Awal (Full Screen)
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Menyiapkan SKOOLA...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      
      {/* LEFT SIDE: Visual */}
      <div className="hidden lg:flex w-1/2 bg-red-700 relative items-center justify-center text-white p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/batik-rampung.png')]"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-red-600 rounded-full blur-[120px] animate-pulse"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
            <span className="text-xs font-medium tracking-wide uppercase">SKOOLA ID</span>
          </div>
          <h1 className="text-6xl font-bold mb-6 leading-tight font-heading">
            Mulai Petualangan <span className="text-yellow-400 italic">Bahasa.</span>
          </h1>
          <p className="text-red-100 text-lg leading-relaxed mb-8">
            Platform belajar sosial pertama di Indonesia. Kumpulkan XP, tantang teman, dan raih sertifikatmu.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {view === "login" ? "Halo, Sobat Skoola!" : "Gabung Sekarang"}
            </h2>
            <p className="text-gray-500 text-sm">
              {view === "login" ? "Lanjutkan progres belajarmu." : "Gratis dan seru selamanya."}
            </p>
          </div>

          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button 
              onClick={() => { setView("login"); setError(""); }}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                view === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Masuk
            </button>
            <button 
              onClick={() => { setView("register"); setError(""); }}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                view === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
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
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pilih Peran</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => setRole("student")}
                      className={cn(
                        "cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center",
                        role === "student" ? "border-red-600 bg-red-50 text-red-700 ring-2 ring-red-200" : "border-gray-200 hover:border-red-200"
                      )}
                    >
                      <GraduationCap size={20} />
                      <span className="font-bold text-xs">Murid</span>
                    </div>
                    <div 
                      onClick={() => setRole("teacher")}
                      className={cn(
                        "cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center",
                        role === "teacher" ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200" : "border-gray-200 hover:border-blue-200"
                      )}
                    >
                      <Presentation size={20} />
                      <span className="font-bold text-xs">Guru</span>
                    </div>
                  </div>
                  <InputField 
                    label="Nama Panggilan" 
                    placeholder="Budi"
                    icon={<User size={18} />} 
                    value={name} 
                    onChange={(e: any) => setName(e.target.value)}
                  />
                </div>
              )}

              <InputField 
                label="Email" 
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
                <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    {view === "login" ? "Masuk" : "Buat Akun"} <ArrowRight size={18} />
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