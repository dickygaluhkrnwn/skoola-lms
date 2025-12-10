"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Map, Trophy, BookOpen, LogOut, User, Briefcase, GraduationCap } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context"; // Import Theme Hook

export function StudentSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme(); // Ambil tema aktif
  const [name, setName] = useState("Sobat Skoola");

  // Fetch nama user
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setName(snap.data().displayName);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <aside className={cn(
      "hidden md:flex w-64 border-r flex-col fixed inset-y-0 z-50 transition-colors duration-500",
      theme === "kids" ? "bg-white border-gray-200" : "bg-slate-900 border-slate-800"
    )}>
      <div className="p-6">
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-1.5 transition-all border",
          theme === "kids" 
            ? "rounded-full bg-red-50 border-red-100 text-red-600" 
            : "rounded-lg bg-slate-800 border-slate-700 text-white"
        )}>
          <span className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            theme === "kids" ? "bg-red-500" : "bg-sky-500"
          )}></span>
          <span className="text-sm font-bold tracking-wide">
            SKOOLA {theme === 'pro' && 'PRO'}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <SidebarItem 
          theme={theme}
          icon={<Map size={20} />} 
          label="Belajar" 
          active={pathname === "/learn"} 
          onClick={() => router.push("/learn")} 
        />
        <SidebarItem 
          theme={theme}
          icon={<Trophy size={20} />} 
          label="Sosial" 
          active={pathname === "/social"} 
          onClick={() => router.push("/social")} 
        />
        <SidebarItem 
          theme={theme}
          icon={<BookOpen size={20} />} 
          label="Kamus" 
          active={pathname === "/dictionary"} 
          onClick={() => alert("Fitur Kamus segera hadir!")} 
        />
      </nav>

      <div className={cn(
        "p-4 border-t transition-colors",
        theme === "kids" ? "border-gray-100" : "border-slate-800"
      )}>
        <div 
          className={cn(
            "flex items-center gap-3 px-4 py-3 mb-2 rounded-xl transition-colors cursor-pointer",
            theme === "kids" ? "bg-transparent hover:bg-gray-50" : "bg-slate-800/50 hover:bg-slate-800"
          )}
          onClick={() => router.push("/profile")} // Direct ke halaman profil
        >
           <div className={cn(
             "w-9 h-9 rounded-full flex items-center justify-center border shadow-sm",
             theme === "kids" 
              ? "bg-sky-100 text-sky-600 border-sky-200" 
              : "bg-slate-700 text-slate-300 border-slate-600 rounded-lg"
           )}>
             {theme === "kids" ? <User size={18} /> : <GraduationCap size={18} />}
           </div>
           <div className="flex-1 overflow-hidden">
             <p className={cn("text-sm font-bold truncate", theme === "kids" ? "text-gray-700" : "text-slate-200")}>{name}</p>
             <p className={cn("text-xs truncate", theme === "kids" ? "text-gray-400" : "text-slate-500")}>Murid</p>
           </div>
        </div>
        <button 
          onClick={handleLogout} 
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 w-full font-bold text-sm transition-all",
            theme === "kids" 
              ? "text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl" 
              : "text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg"
          )}
        >
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active, onClick, theme }: any) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex items-center gap-4 px-4 py-3 w-full transition-all text-sm font-bold group",
        // Logic Style Kids
        theme === "kids" && active && "bg-sky-100 text-sky-600 border-2 border-sky-200 shadow-sm rounded-xl",
        theme === "kids" && !active && "text-gray-500 hover:bg-gray-50 border-2 border-transparent hover:text-gray-900 rounded-xl",
        
        // Logic Style Pro
        theme === "pro" && active && "bg-primary text-white shadow-md shadow-primary/20 rounded-lg",
        theme === "pro" && !active && "text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
      )}
    >
      <span className={cn(
        "transition-transform duration-300", 
        active && theme === "kids" ? "scale-110" : ""
      )}>
        {icon}
      </span>
      {label}
      {/* Indikator Active Dot untuk Pro Theme */}
      {theme === "pro" && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
    </button>
  );
}