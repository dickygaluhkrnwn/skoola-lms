"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Map, Trophy, BookOpen, LogOut, User, LayoutDashboard, Star } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

export function StudentSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [name, setName] = useState("Sobat Skoola");

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
      "hidden md:flex w-64 flex-col fixed inset-y-0 z-50 transition-all duration-500",
      theme === "kids" 
        ? "bg-white border-r-4 border-sky-100" // Kids: Border tebal & kartun
        : "bg-zinc-900 border-r border-zinc-800 text-zinc-100" // Pro: Sleek Dark
    )}>
      {/* BRANDING AREA */}
      <div className={cn(
        "p-6 flex items-center gap-3",
        theme === "pro" && "border-b border-zinc-800"
      )}>
        <div className={cn(
          "flex items-center justify-center transition-all",
          theme === "kids" 
            ? "w-12 h-12 bg-red-500 text-white rounded-2xl shadow-[0_4px_0_#991b1b] rotate-3" 
            : "w-8 h-8 bg-indigo-600 text-white rounded-md"
        )}>
          {theme === "kids" ? <span className="text-2xl">🎈</span> : <span className="font-bold">S</span>}
        </div>
        <div>
          <h1 className={cn(
            "font-bold leading-none tracking-tight",
            theme === "kids" ? "text-2xl text-sky-900 font-display uppercase" : "text-lg text-white"
          )}>
            SKOOLA
          </h1>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            theme === "kids" ? "text-orange-400" : "text-zinc-500"
          )}>
            {theme === "kids" ? "Dunia Belajar" : "Professional"}
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-4 space-y-3">
        <div className={cn("px-2 text-xs font-semibold uppercase tracking-wider mb-2", theme === "kids" ? "text-sky-300" : "text-zinc-500")}>
          {theme === "kids" ? "Petualanganmu" : "Menu Utama"}
        </div>
        
        <SidebarItem 
          theme={theme}
          icon={<LayoutDashboard size={theme === "kids" ? 24 : 20} />} 
          label={theme === "kids" ? "Peta Belajar" : "Dashboard"} 
          active={pathname === "/learn"} 
          onClick={() => router.push("/learn")} 
        />
        <SidebarItem 
          theme={theme}
          icon={<Trophy size={theme === "kids" ? 24 : 20} />} 
          label={theme === "kids" ? "Piala & Teman" : "Leaderboard"} 
          active={pathname === "/social"} 
          onClick={() => router.push("/social")} 
        />
        <SidebarItem 
          theme={theme}
          icon={<BookOpen size={theme === "kids" ? 24 : 20} />} 
          label={theme === "kids" ? "Kamus Ajaib" : "Referensi & Kamus"} 
          active={pathname === "/dictionary"} 
          onClick={() => alert("Fitur Kamus segera hadir!")} 
        />
        
        <div className={cn("px-2 text-xs font-semibold uppercase tracking-wider mt-6 mb-2", theme === "kids" ? "text-sky-300" : "text-zinc-500")}>
          {theme === "kids" ? "Kartu Identitas" : "Akun"}
        </div>
        <SidebarItem 
          theme={theme}
          icon={<User size={theme === "kids" ? 24 : 20} />} 
          label={theme === "kids" ? "Profil Pahlawan" : "Profil Saya"} 
          active={pathname === "/profile"} 
          onClick={() => router.push("/profile")} 
        />
      </nav>

      {/* USER FOOTER */}
      <div className={cn(
        "p-4",
        theme === "kids" ? "bg-white" : "border-t border-zinc-800 bg-zinc-900"
      )}>
        {/* Player Card untuk Kids */}
        <div 
          onClick={() => router.push("/profile")}
          className={cn(
            "flex items-center gap-3 mb-4 p-3 transition-all cursor-pointer group",
            theme === "kids" 
              ? "bg-yellow-50 border-2 border-yellow-200 rounded-2xl hover:bg-yellow-100 hover:scale-105 hover:shadow-sm" 
              : "rounded-lg hover:bg-zinc-800"
          )}
        >
           <div className={cn(
             "flex items-center justify-center shadow-sm transition-transform group-hover:rotate-12",
             theme === "kids" 
              ? "w-12 h-12 bg-white text-yellow-500 border-2 border-yellow-200 rounded-full text-2xl" 
              : "w-10 h-10 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full"
           )}>
             {theme === "kids" ? "😎" : <span className="font-bold text-sm">{name.charAt(0)}</span>}
           </div>
           <div className="flex-1 overflow-hidden">
             <p className={cn("text-sm font-bold truncate", theme === "kids" ? "text-yellow-700" : "text-zinc-200")}>
               {name}
             </p>
             <p className={cn("text-xs truncate flex items-center gap-1", theme === "kids" ? "text-yellow-600" : "text-zinc-500")}>
               {theme === "kids" && <Star size={10} fill="currentColor" />}
               {theme === "kids" ? "Level 1 Explorer" : "Lihat Profil"}
             </p>
           </div>
        </div>
        
        <button 
          onClick={handleLogout} 
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 w-full font-bold text-xs transition-all",
            theme === "kids" 
              ? "text-red-500 bg-red-50 hover:bg-red-100 border-2 border-red-100 rounded-2xl active:scale-95" 
              : "text-zinc-400 bg-zinc-950 border border-zinc-800 hover:text-white hover:border-zinc-600 rounded-md"
          )}
        >
          <LogOut size={16} /> Keluar
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
        "flex items-center gap-3 px-3 py-3 w-full transition-all text-sm font-bold group relative",
        
        // KIDS THEME STYLES (3D Buttons)
        theme === "kids" && active && "bg-sky-500 text-white shadow-[0_4px_0_#0369a1] translate-y-[-2px] rounded-xl",
        theme === "kids" && !active && "text-slate-500 hover:bg-sky-50 hover:text-sky-600 rounded-xl hover:translate-x-1",
        
        // PRO THEME STYLES (Flat & Sleek)
        theme === "pro" && active && "bg-indigo-600 text-white rounded-md shadow-lg shadow-indigo-900/20",
        theme === "pro" && !active && "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 rounded-md"
      )}
    >
      {/* Active Indicator Line for Pro */}
      {theme === "pro" && active && (
        <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-400 rounded-r-full hidden" />
      )}
      
      <span className={cn(
        "transition-transform duration-300", 
        // Animasi Ikon Kids: Bounce saat aktif atau hover
        theme === "kids" && (active || "group-hover:animate-bounce") 
      )}>
        {icon}
      </span>
      {label}
    </button>
  );
}