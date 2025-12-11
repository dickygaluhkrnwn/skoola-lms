"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
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
    setCode(""); 
  };

  const isKids = theme === "sd";
  const isUni = theme === "uni";

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
              "p-6 w-full max-w-sm relative z-10 shadow-2xl overflow-hidden",
              isKids ? "bg-white rounded-[2rem] border-4 border-sky-100" : 
              isUni ? "bg-slate-900 rounded-xl border border-slate-700 text-white" :
              "bg-white rounded-xl"
            )}
          >
            {/* Close Button */}
            <button 
               onClick={onClose}
               className={cn(
                  "absolute top-4 right-4 p-1 rounded-full transition-colors",
                  isUni ? "text-slate-500 hover:text-white hover:bg-slate-800" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
               )}
            >
               <X size={20} />
            </button>

            <div className="text-center mb-6 pt-2">
              <div className={cn(
                "w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full",
                isKids ? "bg-sky-100 text-sky-600 border-4 border-white shadow-lg animate-bounce" : 
                isUni ? "bg-slate-800 text-white border border-slate-700" :
                "bg-primary/10 text-primary"
              )}>
                <Plus size={40} />
              </div>
              <h2 className={cn("text-2xl font-bold", isKids ? "text-sky-800" : isUni ? "text-white" : "text-foreground")}>
                {isKids ? "Gabung Kelas Baru!" : "Gabung Kelas"}
              </h2>
              <p className={cn("text-sm mt-2 max-w-[240px] mx-auto", isUni ? "text-slate-400" : "text-muted-foreground")}>
                {isKids ? "Punya kode rahasia dari guru? Masukkan di sini ya!" : "Masukkan 6 digit kode unik dari gurumu untuk bergabung."}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <input 
                required 
                placeholder="A1B2C3" 
                className={cn(
                  "w-full px-4 py-4 border-2 text-center font-mono text-3xl uppercase tracking-[0.2em] outline-none transition-all placeholder:tracking-normal placeholder:text-base",
                  isKids 
                    ? "rounded-2xl border-sky-100 focus:border-sky-400 bg-sky-50/50 text-sky-800 font-bold placeholder:text-sky-300" 
                    : isUni
                      ? "rounded-lg border-slate-700 bg-slate-950 text-white focus:border-blue-500 placeholder:text-slate-600"
                      : "rounded-lg border-zinc-200 bg-zinc-50 focus:bg-white focus:border-primary placeholder:text-gray-300"
                )}
                value={code} 
                maxLength={6}
                onChange={e => setCode(e.target.value)} 
              />
              
              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  onClick={onClose} 
                  variant="ghost"
                  className={cn(
                    "flex-1 border-2 border-transparent",
                    isKids ? "rounded-2xl font-bold text-slate-400 hover:bg-slate-50" : 
                    isUni ? "text-slate-400 hover:text-white hover:bg-slate-800" : 
                    "rounded-lg"
                  )}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || code.length < 3} 
                  className={cn(
                    "flex-1",
                    isKids 
                      ? "bg-sky-500 hover:bg-sky-400 text-white rounded-2xl shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none font-bold text-lg" 
                      : "bg-primary hover:bg-primary/90 rounded-lg"
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