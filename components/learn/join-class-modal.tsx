"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Terminal, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { db, auth } from "@/lib/firebase"; // Import db config
import { UserProfile } from "@/lib/types/user.types";

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
  isLoading: boolean;
  theme: string;
}

export function JoinClassModal({ isOpen, onClose, onJoin, isLoading, theme }: JoinClassModalProps) {
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  // Fetch current user profile when modal opens
  useEffect(() => {
    if (isOpen && auth.currentUser) {
        const fetchProfile = async () => {
            try {
                const docSnap = await getDoc(doc(db, "users", auth.currentUser!.uid));
                if (docSnap.exists()) {
                    setCurrentUserProfile(docSnap.data() as UserProfile);
                }
            } catch (e) {
                console.error("Failed to fetch user profile for validation", e);
            }
        };
        fetchProfile();
    } else {
        // Reset state when closed
        setCode("");
        setErrorMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setErrorMessage(null);
    setValidating(true);

    try {
        // 1. Pre-Check: Cari kelas berdasarkan kode
        const classroomsRef = collection(db, "classrooms");
        const q = query(classroomsRef, where("code", "==", code.trim())); // Asumsi field di db adalah 'code'
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setErrorMessage("Kode kelas tidak ditemukan.");
            setValidating(false);
            return;
        }

        const classroomData = querySnapshot.docs[0].data();
        
        // 2. School Isolation Check
        // Jika user punya schoolId DAN kelas punya schoolId, harus cocok.
        if (currentUserProfile?.schoolId && classroomData.schoolId) {
            if (currentUserProfile.schoolId !== classroomData.schoolId) {
                setErrorMessage("Kode valid, namun kelas ini bukan milik sekolah Anda.");
                setValidating(false);
                return;
            }
        } else if (classroomData.schoolId && !currentUserProfile?.schoolId) {
             // Opsional: Jika kelas punya sekolah tapi user 'umum' (belum join sekolah), tolak atau izinkan?
             // Sesuai aturan ketat: tolak agar user join sekolah dulu.
             setErrorMessage("Anda harus bergabung dengan sekolah terlebih dahulu untuk masuk kelas ini.");
             setValidating(false);
             return;
        }

        // 3. Jika lolos validasi, panggil fungsi onJoin dari parent
        await onJoin(code);
        setCode("");
        onClose(); // Tutup modal jika sukses (onJoin biasanya handle error sendiri jika gagal update db)

    } catch (err) {
        console.error("Error validating class code:", err);
        setErrorMessage("Terjadi kesalahan saat memvalidasi kode.");
    } finally {
        setValidating(false);
    }
  };

  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  // Combine loading states
  const isProcessing = isLoading || validating;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className={cn(
              "p-6 w-full max-w-sm relative z-10 shadow-2xl overflow-hidden transition-all",
              isKids ? "bg-white rounded-[2rem] border-4 border-sky-100" : 
              isSMP ? "bg-white/90 backdrop-blur-xl rounded-2xl border border-violet-100 ring-4 ring-violet-500/10" :
              isSMA ? "bg-slate-950 border border-teal-500/30 text-teal-400 rounded-lg shadow-[0_0_40px_rgba(45,212,191,0.15)]" : // Terminal Style
              isUni ? "bg-slate-900 rounded-xl border border-slate-700 text-white" :
              "bg-white rounded-xl"
            )}
          >
            {/* Close Button */}
            <button 
               onClick={onClose}
               className={cn(
                  "absolute top-4 right-4 p-1 rounded-full transition-colors",
                  isSMA ? "text-teal-500/50 hover:text-teal-400 hover:bg-teal-500/10 rounded-sm" :
                  isUni ? "text-slate-500 hover:text-white hover:bg-slate-800" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
               )}
            >
               <X size={20} />
            </button>

            <div className="text-center mb-6 pt-2">
              <div className={cn(
                "w-20 h-20 mx-auto mb-4 flex items-center justify-center transition-all",
                isKids ? "bg-sky-100 text-sky-600 border-4 border-white shadow-lg animate-bounce rounded-full" : 
                isSMP ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-300 rounded-2xl rotate-3" :
                isSMA ? "bg-slate-900 border border-teal-500/30 text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.2)] rounded-md" :
                isUni ? "bg-slate-800 text-white border border-slate-700 rounded-full" :
                "bg-primary/10 text-primary rounded-full"
              )}>
                {isSMA ? <Terminal size={40} /> : <Plus size={40} />}
              </div>
              <h2 className={cn(
                  "text-2xl font-bold", 
                  isKids ? "text-sky-800" : 
                  isSMA ? "text-teal-300 font-mono uppercase tracking-widest text-lg" : 
                  isUni ? "text-white" : "text-foreground"
              )}>
                {isKids ? "Gabung Kelas Baru!" : isSMA ? "ESTABLISH CONNECTION" : "Gabung Kelas"}
              </h2>
              <p className={cn(
                  "text-sm mt-2 max-w-[240px] mx-auto", 
                  isSMA ? "text-slate-500 font-mono text-xs" : 
                  isUni ? "text-slate-400" : "text-muted-foreground"
              )}>
                {isKids ? "Punya kode rahasia dari guru? Masukkan di sini ya!" : isSMA ? "Enter access code to decrypt classroom data." : "Masukkan 6 digit kode unik dari gurumu untuk bergabung."}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                {isSMA && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500/50 font-mono text-lg">{">"}</span>}
                <input 
                  required 
                  disabled={isProcessing}
                  placeholder={isSMA ? "_ _ _ _ _ _" : "A1B2C3"} 
                  className={cn(
                    "w-full px-4 py-4 border-2 text-center font-mono text-3xl uppercase tracking-[0.2em] outline-none transition-all placeholder:tracking-normal placeholder:text-base disabled:opacity-50 disabled:cursor-not-allowed",
                    isKids 
                      ? "rounded-2xl border-sky-100 focus:border-sky-400 bg-sky-50/50 text-sky-800 font-bold placeholder:text-sky-300" 
                      : isSMP
                        ? "rounded-xl border-violet-200 focus:border-violet-500 bg-white/50 text-violet-800"
                      : isSMA
                        ? "rounded-sm border-teal-500/30 bg-black/50 text-teal-400 focus:border-teal-500 placeholder:text-teal-900/50 shadow-inner"
                      : isUni
                        ? "rounded-lg border-slate-700 bg-slate-950 text-white focus:border-blue-500 placeholder:text-slate-600"
                        : "rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white focus:border-primary placeholder:text-gray-300"
                  )}
                  value={code} 
                  maxLength={6}
                  onChange={e => {
                      setCode(e.target.value);
                      setErrorMessage(null); // Clear error on type
                  }} 
                />
              </div>

              {/* Error Message Display */}
              {errorMessage && (
                  <div className={cn(
                      "flex items-center gap-2 p-3 rounded-lg text-xs font-medium animate-in slide-in-from-top-1",
                      isSMA ? "bg-red-900/20 text-red-400 border border-red-900/50" : "bg-red-50 text-red-600 border border-red-100"
                  )}>
                      <AlertCircle size={16} className="shrink-0" />
                      {errorMessage}
                  </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  onClick={onClose} 
                  variant="ghost"
                  disabled={isProcessing}
                  className={cn(
                    "flex-1 border-2 border-transparent",
                    isKids ? "rounded-2xl font-bold text-slate-400 hover:bg-slate-50" : 
                    isSMA ? "text-slate-500 hover:text-teal-400 hover:bg-teal-500/5 rounded-sm hover:border-teal-500/20 font-mono uppercase tracking-wide text-xs" :
                    isUni ? "text-slate-400 hover:text-white hover:bg-slate-800" : 
                    "rounded-lg"
                  )}
                >
                  {isSMA ? "Abort" : "Batal"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isProcessing || code.length < 3} 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    isKids 
                      ? "bg-sky-500 hover:bg-sky-400 text-white rounded-2xl shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none font-bold text-lg" 
                      : isSMP
                        ? "bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-200"
                      : isSMA
                        ? "bg-teal-600 hover:bg-teal-500 text-slate-900 rounded-sm font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(45,212,191,0.4)] disabled:opacity-50 disabled:shadow-none"
                      : "bg-primary hover:bg-primary/90 rounded-lg"
                  )}
                >
                  {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isSMA ? "VERIFYING..." : "Memproses..."}
                      </>
                  ) : (
                      isSMA ? "ACCESS" : "Gabung!"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}