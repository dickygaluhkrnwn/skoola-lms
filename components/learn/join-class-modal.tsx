"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
  isLoading: boolean;
  theme: string;
}

export function JoinClassModal({ isOpen, onClose, onJoin, isLoading, theme }: JoinClassModalProps) {
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onJoin(code);
    setCode(""); // Reset kode setelah submit sukses/gagal (opsional, tergantung UX)
  };

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
              "bg-white p-6 w-full max-w-sm relative z-10 shadow-2xl",
              theme === "kids" ? "rounded-[2rem] border-4 border-sky-100" : "rounded-xl"
            )}
          >
            <div className="text-center mb-6">
              <div className={cn(
                "w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full animate-bounce",
                theme === "kids" ? "bg-sky-100 text-sky-600 border-4 border-white shadow-lg" : "bg-indigo-50 text-indigo-600"
              )}>
                <Plus size={40} />
              </div>
              <h2 className={cn("text-2xl font-bold", theme === "kids" ? "text-sky-800" : "text-foreground")}>
                {theme === "kids" ? "Gabung Kelas Baru!" : "Gabung Kelas"}
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                {theme === "kids" ? "Punya kode rahasia dari guru? Masukkan di sini ya!" : "Masukkan 6 digit kode unik dari gurumu."}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <input 
                required 
                placeholder="A1B2C3" 
                className={cn(
                  "w-full px-4 py-4 border-2 focus:border-primary text-center font-mono text-3xl uppercase tracking-[0.2em] outline-none transition-all placeholder:tracking-normal placeholder:text-base placeholder:text-gray-300",
                  theme === "kids" 
                    ? "rounded-2xl border-sky-100 focus:border-sky-400 bg-sky-50/50 text-sky-800 font-bold" 
                    : "rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white"
                )}
                value={code} 
                maxLength={6}
                onChange={e => setCode(e.target.value)} 
              />
              
              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  onClick={onClose} 
                  className={cn(
                    "flex-1 bg-transparent hover:bg-gray-100 text-gray-500 border-2 border-transparent",
                    theme === "kids" ? "rounded-2xl font-bold text-slate-400 hover:bg-slate-50" : "rounded-lg"
                  )}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || code.length < 3} 
                  className={cn(
                    "flex-1",
                    theme === "kids" 
                      ? "bg-sky-500 hover:bg-sky-400 text-white rounded-2xl shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none font-bold text-lg" 
                      : "bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  )}
                >
                  {isLoading ? "Tunggu..." : "Gabung!"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}