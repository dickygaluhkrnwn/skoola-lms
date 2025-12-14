"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User, LogOut, LayoutDashboard, School, Users, Map, Backpack, Smile, Calendar, GraduationCap, Globe } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";
import { UserProfile } from "@/lib/types/user.types";

export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme(); // Fallback theme
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [schoolData, setSchoolData] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            
            if (data.schoolId) {
                const schoolSnap = await getDoc(doc(db, "schools", data.schoolId));
                if (schoolSnap.exists()) {
                    setSchoolData(schoolSnap.data());
                }
            }
        }
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // Determine Real School Level
  const realSchoolLevel = schoolData?.level || userProfile?.schoolLevel || theme;
  
  const isKids = realSchoolLevel === "sd";
  const isSMP = realSchoolLevel === "smp";
  const isSMA = realSchoolLevel === "sma";
  const isUni = realSchoolLevel === "uni";

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 px-4 py-2 flex justify-between items-center md:hidden z-50 pb-safe transition-all duration-300",
      // KIDS THEME: Floating Island Look
      isKids ? "bg-white/95 backdrop-blur-md border-t-4 border-primary rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-4 mx-2 mb-2" :
      
      // SMP THEME: Floating Glass
      isSMP ? "bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-8px_32px_0_rgba(139,92,246,0.2)] rounded-t-2xl mx-2 mb-2 pb-3" :

      // SMA THEME: Dark Glass Sleek
      isSMA ? "bg-slate-950/80 backdrop-blur-xl border-t border-white/10 text-slate-400 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]" :

      // UNI THEME: Fully Glass & Neon
      isUni ? "bg-slate-950/70 backdrop-blur-xl border-t border-white/5 text-slate-400 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]" : 
      
      // DEFAULT
      "bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    )}>
      <NavItem 
        theme={realSchoolLevel}
        active={pathname === "/learn"} 
        onClick={() => router.push("/learn")} 
        icon={isKids ? <Map /> : <LayoutDashboard />} 
        label={isKids ? "Markas" : isUni ? "Kampus" : "Home"} 
      />
      
      <NavItem 
        theme={realSchoolLevel}
        active={pathname.includes("class")} 
        onClick={() => router.push("/learn?tab=classes")} 
        icon={isKids ? <Backpack /> : <School />} 
        label={isKids ? "Tas Sekolah" : isUni ? "Kuliah" : "Kelas"} 
      />
      
      <NavItem 
        theme={realSchoolLevel}
        active={pathname === "/social"} 
        onClick={() => router.push("/social")} 
        icon={isKids ? <Smile /> : <Globe />} 
        label={isKids ? "Dunia Kita" : "Sosial"} 
      />
      
      <NavItem 
        theme={realSchoolLevel}
        active={pathname === "/profile"} 
        onClick={() => router.push("/profile")} 
        icon={<User />} 
        label={isKids ? "Kartu" : "Profil"} 
      />
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
        "flex flex-col items-center gap-1 p-2 transition-all relative min-w-[60px]",
        
        // Kids Theme
        isKids ? "rounded-2xl" : "rounded-lg",
        isKids && active && "text-white bg-primary shadow-lg shadow-primary/30 -translate-y-4 scale-110 border-4 border-white z-10",
        isKids && !active && "text-gray-400 hover:text-primary hover:bg-primary/5",
        
        // Uni Theme: Neon Glow
        isUni && active && "text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.8)] scale-110 -translate-y-1",
        isUni && !active && "text-slate-500 hover:text-slate-300",

        // SMP Theme
        isSMP && active && "text-violet-600 scale-110 -translate-y-1",
        isSMP && !active && "text-slate-400",
        
        // SMA Theme
        isSMA && active && "text-teal-400 scale-105 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]",
        isSMA && !active && "text-slate-500 hover:text-slate-300",

        // Default
        !isKids && !isUni && !isSMP && !isSMA && active && "text-primary",
        !isKids && !isUni && !isSMP && !isSMA && !active && "text-slate-400"
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
      <span className={cn(
          "text-[10px] font-bold transition-all", 
          isKids && active && "hidden",
          active ? "opacity-100" : "opacity-70 scale-90"
      )}>{label}</span>
      
      {/* Active Indicators */}
      {isUni && active && <div className="absolute -bottom-1 w-8 h-1 bg-indigo-500/50 rounded-full blur-[4px]" />}
      {isSMA && active && <div className="absolute -bottom-2 w-1 h-1 bg-teal-400 rounded-full shadow-[0_0_5px_currentColor]" />}
    </button>
  );
}