"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, LogOut, User, LayoutDashboard, Calendar, School, Users } from "lucide-react";
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
  const isUni = theme === "uni";

  return (
    <aside className={cn(
      "hidden md:flex w-64 flex-col fixed inset-y-0 z-50 transition-all duration-500 border-r",
      isKids ? "bg-white border-r-4 border-primary/20" : 
      isUni ? "bg-slate-900 border-slate-800 text-slate-100" :
      "bg-white border-slate-200"
    )}>
      {/* BRANDING AREA */}
      <div className={cn(
        "p-6 flex items-center gap-3",
        (isUni || theme === 'sma') && "border-b border-border/10"
      )}>
        <div className={cn(
          "flex items-center justify-center transition-all shrink-0",
          isKids ? "w-12 h-12 bg-primary text-white rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.2)] rotate-3" : 
          "w-10 h-10 bg-primary text-white rounded-lg shadow-sm"
        )}>
          {isKids ? <span className="text-2xl">🎒</span> : <span className="font-bold text-lg">S</span>}
        </div>
        <div>
          <h1 className={cn(
            "font-bold leading-none tracking-tight",
            isKids ? "text-2xl text-primary font-display uppercase" : 
            isUni ? "text-lg text-white" : "text-xl text-slate-800"
          )}>
            SKOOLA
          </h1>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest mt-1",
            isKids ? "text-secondary-foreground" : "text-muted-foreground"
          )}>
            {theme === 'sd' ? 'Sekolah Dasar' : theme === 'smp' ? 'Junior High' : theme === 'sma' ? 'High School' : 'University'}
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        <div className={cn("px-2 text-xs font-semibold uppercase tracking-wider mb-2 opacity-70", isUni ? "text-slate-400" : "text-slate-500")}>
          Menu Utama
        </div>
        
        <SidebarItem 
          theme={theme}
          icon={<LayoutDashboard size={isKids ? 24 : 20} />} 
          label="Dashboard" 
          active={pathname === "/learn"} 
          onClick={() => router.push("/learn")} 
        />
        
        {/* FIX: Label diubah jadi "Sosial" agar jelas */}
        <SidebarItem 
          theme={theme}
          icon={<Users size={isKids ? 24 : 20} />} 
          label="Sosial" 
          active={pathname === "/social"} 
          onClick={() => router.push("/social")} 
        />
        
        <div className={cn("px-2 text-xs font-semibold uppercase tracking-wider mt-6 mb-2 opacity-70", isUni ? "text-slate-400" : "text-slate-500")}>
          Akademik
        </div>
        <SidebarItem 
          theme={theme}
          icon={<School size={isKids ? 24 : 20} />} 
          label="Kelas Saya" 
          active={pathname.includes("/classroom")} 
          onClick={() => router.push("/learn?tab=classes")} 
        />
        <SidebarItem 
          theme={theme}
          icon={<Calendar size={isKids ? 24 : 20} />} 
          label="Jadwal" 
          active={pathname === "/schedule"} 
          onClick={() => alert("Fitur Jadwal segera hadir!")} 
        />

        <div className={cn("px-2 text-xs font-semibold uppercase tracking-wider mt-6 mb-2 opacity-70", isUni ? "text-slate-400" : "text-slate-500")}>
          Akun
        </div>
        <SidebarItem 
          theme={theme}
          icon={<User size={isKids ? 24 : 20} />} 
          label="Profil Saya" 
          active={pathname === "/profile"} 
          onClick={() => router.push("/profile")} 
        />
      </nav>

      {/* USER FOOTER */}
      <div className={cn(
        "p-4 border-t",
        isUni ? "bg-slate-900 border-slate-800" : "bg-secondary/20 border-border"
      )}>
        <div 
          onClick={() => router.push("/profile")}
          className={cn(
            "flex items-center gap-3 mb-4 p-3 transition-all cursor-pointer group rounded-xl",
            isKids ? "bg-white border-2 border-primary/20 hover:bg-secondary hover:border-secondary-foreground" : 
            isUni ? "hover:bg-slate-800" : "hover:bg-white hover:shadow-sm"
          )}
        >
           <div className={cn(
             "flex items-center justify-center shadow-sm transition-transform group-hover:rotate-12",
             isKids 
              ? "w-10 h-10 bg-secondary text-secondary-foreground border-2 border-white rounded-full" 
              : "w-9 h-9 bg-primary/10 text-primary rounded-full"
           )}>
             <span className="font-bold text-sm">{name.charAt(0)}</span>
           </div>
           <div className="flex-1 overflow-hidden">
             <p className={cn("text-sm font-bold truncate", isUni ? "text-slate-200" : "text-slate-800")}>
               {name}
             </p>
             <p className={cn("text-xs truncate opacity-70", isUni ? "text-slate-400" : "text-slate-500")}>
               Lihat Profil
             </p>
           </div>
        </div>
        
        <button 
          onClick={handleLogout} 
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2.5 w-full font-bold text-xs transition-all rounded-lg",
            isUni 
              ? "text-slate-400 hover:text-white hover:bg-slate-800" 
              : "text-slate-500 hover:text-red-600 hover:bg-red-50"
          )}
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active, onClick, theme }: any) {
  const isKids = theme === "sd";
  const isUni = theme === "uni";

  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 w-full transition-all text-sm font-bold group relative",
        
        // KIDS THEME
        isKids && "rounded-xl",
        isKids && active && "bg-primary text-white shadow-[0_4px_0_rgba(0,0,0,0.2)] translate-y-[-2px]",
        isKids && !active && "text-slate-500 hover:bg-secondary hover:text-secondary-foreground hover:translate-x-1",
        
        // SMP/SMA THEME (Modern Flat)
        !isKids && !isUni && "rounded-lg",
        !isKids && !isUni && active && "bg-primary/10 text-primary",
        !isKids && !isUni && !active && "text-slate-500 hover:bg-slate-50 hover:text-slate-900",

        // UNI THEME (Fixed Contrast)
        isUni && "rounded-md",
        // FIX: Gunakan text-white agar terbaca di atas bg-slate-800
        isUni && active && "bg-slate-800 text-white border-l-2 border-white pl-[10px]", 
        isUni && !active && "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
      )}
    >
      <span className={cn(
        "transition-transform duration-300", 
        isKids && (active || "group-hover:animate-bounce") 
      )}>
        {icon}
      </span>
      {label}
    </button>
  );
}