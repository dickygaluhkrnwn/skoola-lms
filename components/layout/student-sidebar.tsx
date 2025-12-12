"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard, Calendar, School, Users, Backpack, Map, BookOpen, Smile } from "lucide-react";
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

  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  return (
    <aside className={cn(
      "hidden md:flex w-64 flex-col fixed z-50 transition-all duration-500",
      // THEME STYLES
      isKids ? "inset-y-0 bg-white border-r-4 border-primary/20 shadow-xl" : 
      
      // UNI THEME: Glassmorphism (Transparan + Blur) agar background mesh terlihat
      isUni ? "inset-y-0 bg-slate-950/30 backdrop-blur-xl border-r border-white/5 text-slate-300" :
      
      isSMP ? "top-4 left-4 bottom-4 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(139,92,246,0.15)]" : 
      
      // SMA THEME: Floating Dark Glass
      isSMA ? "top-4 left-4 bottom-4 rounded-2xl bg-slate-950/40 backdrop-blur-xl border border-white/5 shadow-2xl" :
      
      "inset-y-0 bg-white border-r border-slate-200"
    )}>
      {/* BRANDING AREA */}
      <div className={cn(
        "p-6 flex items-center gap-3 transition-all",
        (isUni || isSMA) ? "border-b border-white/5" : "border-b border-transparent",
        isKids && "pb-8 pt-8 border-b-primary/10",
        isSMP && "bg-gradient-to-b from-white/50 to-transparent rounded-t-3xl"
      )}>
        <div className={cn(
          "flex items-center justify-center transition-all shrink-0 relative",
          isKids ? "w-14 h-14 bg-primary text-white rounded-3xl shadow-[0_6px_0_rgba(0,0,0,0.2)] rotate-[-6deg] hover:rotate-6 hover:scale-110 cursor-pointer duration-300" : 
          isSMP ? "w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-xl shadow-lg shadow-violet-500/40 ring-2 ring-white/50" :
          isSMA ? "w-10 h-10 bg-gradient-to-br from-teal-500 to-slate-800 text-white rounded-lg shadow-lg shadow-teal-900/50" :
          // UNI LOGO: Neon Glow
          isUni ? "w-10 h-10 bg-indigo-600 text-white rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400/30" :
          "w-10 h-10 bg-primary text-white rounded-lg shadow-sm"
        )}>
           {isKids && <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />}
          {isKids ? <span className="text-3xl">🎒</span> : <span className="font-bold text-lg">S</span>}
        </div>
        <div>
          <h1 className={cn(
            "font-bold leading-none tracking-tight transition-all",
            isKids ? "text-3xl text-primary font-display uppercase drop-shadow-sm" : 
            isSMP ? "text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600" :
            isSMA ? "text-xl font-bold text-slate-100 tracking-tight" :
            isUni ? "text-xl font-bold text-white tracking-widest uppercase" : "text-xl text-slate-800"
          )}>
            SKOOLA
          </h1>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest mt-1",
            isKids ? "text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full inline-block mt-2" : 
            isSMP ? "text-violet-500" : 
            isSMA ? "text-teal-400/80" :
            isUni ? "text-indigo-400" :
            "text-muted-foreground"
          )}>
            {theme === 'sd' ? 'Petualang Cilik' : theme === 'smp' ? 'Gen-Z Learning' : theme === 'sma' ? 'High School' : 'University Hub'}
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        <div className={cn("px-2 text-xs font-semibold uppercase tracking-wider mb-2 opacity-70", (isUni || isSMA) ? "text-slate-500" : "text-slate-500")}>
          {isKids ? "Peta Utama" : "Menu Utama"}
        </div>
        
        <SidebarItem 
          theme={theme}
          icon={isKids ? <Map size={24} /> : <LayoutDashboard size={20} />} 
          label={isKids ? "Markas Besar" : "Dashboard"} 
          active={pathname === "/learn"} 
          onClick={() => router.push("/learn")} 
        />
        
        <SidebarItem 
          theme={theme}
          icon={isKids ? <Smile size={24} /> : <Users size={20} />} 
          label={isKids ? "Teman Main" : "Sosial"} 
          active={pathname === "/social"} 
          onClick={() => router.push("/social")} 
        />
        
        <div className={cn("px-2 text-xs font-semibold uppercase tracking-wider mt-8 mb-2 opacity-70", (isUni || isSMA) ? "text-slate-500" : "text-slate-500")}>
          {isKids ? "Tas Sekolah" : "Akademik"}
        </div>
        
        <SidebarItem 
          theme={theme}
          icon={isKids ? <Calendar size={24} /> : <Calendar size={20} />} 
          label={isKids ? "Jadwal Seru" : "Jadwal"} 
          active={pathname === "/schedule"} 
          onClick={() => alert(isKids ? "Jadwal belum dipasang guru!" : "Fitur Jadwal segera hadir!")} 
        />
      </nav>

      {/* USER FOOTER */}
      <div className={cn(
        "p-4 border-t m-4 rounded-2xl transition-colors",
        isKids ? "bg-secondary/30 border-2 border-secondary border-b-4" :
        isSMP ? "mx-4 mb-4 border-none bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-2xl" :
        isSMA ? "mx-4 mb-4 border border-white/5 bg-white/5 backdrop-blur-sm rounded-xl" :
        // UNI THEME: Seamless Dark
        isUni ? "bg-white/5 border border-white/5 m-4 rounded-xl backdrop-blur-md" : 
        "bg-slate-50 border-slate-100"
      )}>
        <div 
          onClick={() => router.push("/profile")}
          className={cn(
            "flex items-center gap-3 mb-3 p-2 transition-all cursor-pointer group rounded-xl",
            isKids ? "hover:bg-white/50" : 
            (isUni || isSMA) ? "hover:bg-white/10" :
            "hover:bg-white hover:shadow-sm"
          )}
        >
           <div className={cn(
             "flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
             isKids 
             ? "w-10 h-10 bg-white text-secondary-foreground border-2 border-secondary rounded-full overflow-hidden" 
             : isUni 
               ? "w-9 h-9 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full"
               : "w-9 h-9 bg-primary/10 text-primary rounded-full"
           )}>
             <span className="font-bold text-sm">{name.charAt(0)}</span>
           </div>
           <div className="flex-1 overflow-hidden">
             <p className={cn("text-sm font-bold truncate", (isUni || isSMA) ? "text-slate-200 group-hover:text-white" : "text-slate-800")}>
               {name}
             </p>
             <p className={cn("text-[10px] truncate opacity-70 font-medium", (isUni || isSMA) ? "text-slate-400" : "text-slate-500")}>
               {isKids ? "Level 1 Explorer" : "Lihat Profil"}
             </p>
           </div>
        </div>
        
        <button 
          onClick={handleLogout} 
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2.5 w-full font-bold text-xs transition-all rounded-xl",
            isKids ? "bg-white text-red-500 border-2 border-red-100 hover:border-red-500 hover:bg-red-50 shadow-sm" :
            isSMP ? "bg-white/80 text-slate-600 hover:text-red-500 hover:bg-red-50 shadow-sm border border-slate-100" :
            isSMA ? "bg-white/5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 border border-white/5" :
            isUni 
              ? "bg-white/5 text-slate-400 hover:bg-rose-900/20 hover:text-rose-400 border border-white/5 hover:border-rose-500/30" 
              : "text-slate-500 hover:text-red-600 hover:bg-red-50"
          )}
        >
          <LogOut size={16} /> {isKids ? "Keluar Game" : "Keluar"}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active, onClick, theme }: any) {
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";

  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex items-center gap-3 px-3 py-3 w-full transition-all text-sm font-bold group relative overflow-hidden",
        
        // KIDS THEME
        isKids && "rounded-2xl border-2 border-transparent my-1",
        isKids && active && "bg-primary text-white border-primary shadow-[0_4px_0_rgba(185,28,28,0.2)] translate-y-[-2px]",
        isKids && !active && "text-slate-500 hover:bg-white hover:border-secondary hover:text-secondary-foreground hover:shadow-sm hover:translate-x-1",
        
        // SMP THEME
        isSMP && "rounded-xl my-1 border border-transparent",
        isSMP && active && "bg-violet-500/10 text-violet-700 border-violet-200/50 shadow-[0_0_15px_rgba(139,92,246,0.3)] backdrop-blur-md",
        isSMP && !active && "text-slate-500 hover:bg-violet-50/50 hover:text-violet-600 hover:pl-4",

        // SMA THEME - Dark Aesthetic
        isSMA && "rounded-lg my-1",
        isSMA && active && "bg-teal-500/10 text-teal-400 border-l-2 border-teal-500 pl-4",
        isSMA && !active && "text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:pl-4",

        // UNI THEME - Neon Tech & Glass
        isUni && "rounded-lg my-1",
        isUni && active && "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] backdrop-blur-md",
        isUni && !active && "text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/5 border border-transparent",

        // DEFAULT THEME
        !isKids && !isUni && !isSMP && !isSMA && "rounded-lg",
        !isKids && !isUni && !isSMP && !isSMA && active && "bg-primary/10 text-primary",
        !isKids && !isUni && !isSMP && !isSMA && !active && "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span className={cn(
        "transition-transform duration-300", 
        isKids && (active ? "scale-110 rotate-[-5deg]" : "group-hover:scale-110 group-hover:rotate-6"),
        isSMP && active && "drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]",
        isSMA && active && "text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]",
        // UNI GLOW ICON
        isUni && active && "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]"
      )}>
        {icon}
      </span>
      {label}
      
      {/* Active Indicator Dot for SMP */}
      {isSMP && active && (
          <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_currentColor] animate-pulse" />
      )}
      
      {/* Active Indicator for SMA */}
      {isSMA && active && <div className="absolute -bottom-1 w-1 h-1 bg-teal-400 rounded-full shadow-[0_0_5px_currentColor]" />}
    </button>
  );
}