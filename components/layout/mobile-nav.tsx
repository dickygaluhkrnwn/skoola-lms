"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { User, LogOut, LayoutDashboard, School, Users, Map, Backpack, Smile } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const isUni = theme === "uni";
  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 px-4 py-2 flex justify-between items-center md:hidden z-50 pb-safe transition-all duration-300",
      // KIDS THEME: Floating Island Look
      isKids ? "bg-white/95 backdrop-blur-md border-t-4 border-primary rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-4 mx-2 mb-2" :
      
      // SMP THEME: Floating Glass
      isSMP ? "bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-8px_32px_0_rgba(139,92,246,0.2)] rounded-t-2xl mx-2 mb-2 pb-3" :

      // SMA THEME: Dark Glass Sleek
      isSMA ? "bg-slate-950/80 backdrop-blur-xl border-t border-white/10 text-slate-400 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]" :

      // UNI THEME
      isUni ? "bg-slate-900 border-t border-slate-800 text-slate-400" : 
      
      // DEFAULT
      "bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    )}>
      <NavItem 
        theme={theme}
        active={pathname === "/learn"} 
        onClick={() => router.push("/learn")} 
        icon={isKids ? <Map /> : <LayoutDashboard />} 
        label={isKids ? "Markas" : "Home"} 
      />
      
      <NavItem 
        theme={theme}
        active={pathname.includes("class")} 
        onClick={() => router.push("/learn?tab=classes")} 
        icon={isKids ? <Backpack /> : <School />} 
        label={isKids ? "Kelas" : "Kelas"} 
      />
      
      <NavItem 
        theme={theme}
        active={pathname === "/social"} 
        onClick={() => router.push("/social")} 
        icon={isKids ? <Smile /> : <Users />} 
        label={isKids ? "Teman" : "Sosial"} 
      />
      
      <NavItem 
        theme={theme}
        active={pathname === "/profile"} 
        onClick={() => router.push("/profile")} 
        icon={<User />} 
        label={isKids ? "Kartu" : "Profil"} 
      />
      
      <button 
        onClick={handleLogout} 
        className={cn(
          "flex flex-col items-center gap-1 transition-colors p-2 rounded-lg group",
          theme === "sd" ? "text-red-300 hover:text-red-500 active:scale-95" : 
          theme === "smp" ? "text-slate-400 hover:text-red-500" : 
          theme === "sma" ? "text-slate-500 hover:text-rose-500" :
          "text-slate-400 hover:text-red-500"
        )}
      >
        <div className={cn("transition-transform group-active:scale-90", isKids && "bg-red-50 p-1 rounded-full")}>
            <LogOut size={isKids ? 20 : 24} className={isKids ? "text-red-400" : ""} />
        </div>
        <span className={cn("text-[10px] font-bold", isKids && "text-red-400")}>{isKids ? "Keluar" : "Out"}</span>
      </button>
    </nav>
  );
}

function NavItem({ icon, label, active = false, onClick, theme }: any) {
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";

  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex flex-col items-center gap-1 p-2 transition-all relative",
        
        // Kids Theme: Bouncy & Colorful
        isKids ? "rounded-2xl w-16" : "rounded-md",
        isKids && active && "text-white bg-primary shadow-lg shadow-primary/30 -translate-y-4 scale-110 border-4 border-white",
        isKids && !active && "text-gray-400 hover:text-primary hover:bg-primary/5",
        
        // Uni Theme (High Contrast)
        isUni && active && "text-white bg-slate-800 border-t-2 border-white", 
        isUni && !active && "text-slate-500 hover:text-slate-300",

        // SMP Theme (Glowing)
        isSMP && active && "text-violet-600 scale-110",
        
        // SMA Theme (Neon Minimal)
        isSMA && active && "text-teal-400 scale-105 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]",
        isSMA && !active && "text-slate-500 hover:text-slate-300",

        // Default / Pro Theme
        !isKids && !isUni && !isSMP && !isSMA && active && "text-primary bg-primary/10",
        !isKids && !isUni && !isSMP && !isSMA && !active && "text-slate-400 hover:text-slate-600"
      )}
    >
      <div className={cn(
          "transition-transform duration-300", 
          active && isKids && "animate-bounce",
          active && isSMP && "drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
      )}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
           size: isKids && active ? 20 : 24, 
           className: active && !isKids && !isSMP && !isUni && !isSMA ? "fill-current opacity-20" : "" 
        }) : icon}
      </div>
      <span className={cn("text-[10px] font-bold", isKids && active && "hidden")}>{label}</span>
      
      {/* Active Dot for SMP */}
      {isSMP && active && <div className="absolute -bottom-1 w-1 h-1 bg-violet-600 rounded-full shadow-[0_0_5px_currentColor] animate-pulse" />}
      
      {/* Active Indicator for SMA */}
      {isSMA && active && <div className="absolute -bottom-1 w-1 h-1 bg-teal-400 rounded-full shadow-[0_0_5px_currentColor]" />}
    </button>
  );
}