"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, User, LogOut, LayoutDashboard, School, Users } from "lucide-react";
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

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 border-t px-4 py-2 flex justify-between items-center md:hidden z-50 pb-safe transition-colors duration-300",
      isUni ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    )}>
      <NavItem 
        theme={theme}
        active={pathname === "/learn"} 
        onClick={() => router.push("/learn")} 
        icon={<LayoutDashboard />} 
        label="Home" 
      />
      
      {/* Shortcut ke Kelas */}
      <NavItem 
        theme={theme}
        active={pathname.includes("class")} 
        onClick={() => router.push("/learn?tab=classes")} 
        icon={<School />} 
        label="Kelas" 
      />
      
      {/* Akses Sosial */}
      <NavItem 
        theme={theme}
        active={pathname === "/social"} 
        onClick={() => router.push("/social")} 
        icon={<Users />} 
        label="Sosial" 
      />
      
      <NavItem 
        theme={theme}
        active={pathname === "/profile"} 
        onClick={() => router.push("/profile")} 
        icon={<User />} 
        label="Profil" 
      />
      
      <button 
        onClick={handleLogout} 
        className={cn(
          "flex flex-col items-center gap-1 transition-colors p-2 rounded-lg",
          theme === "sd" ? "text-gray-400 hover:text-red-500" : "text-slate-400 hover:text-red-500"
        )}
      >
        <LogOut size={24} />
        <span className="text-[10px] font-bold">Keluar</span>
      </button>
    </nav>
  );
}

function NavItem({ icon, label, active = false, onClick, theme }: any) {
  const isKids = theme === "sd";
  const isUni = theme === "uni";

  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex flex-col items-center gap-1 p-2 transition-all",
        // Kids Theme
        isKids ? "rounded-xl" : "rounded-md",
        isKids && active && "text-sky-600 bg-sky-50",
        isKids && !active && "text-gray-400 hover:text-sky-400",
        
        // Uni Theme (FIX CONTRAST)
        // Pastikan text-white agar terbaca
        isUni && active && "text-white bg-slate-800 border-t-2 border-white", 
        isUni && !active && "text-slate-500 hover:text-slate-300",

        // Default / Pro Theme
        !isKids && !isUni && active && "text-primary bg-primary/10",
        !isKids && !isUni && !active && "text-slate-400 hover:text-slate-600"
      )}
    >
      <div className={cn("transition-transform", active && isKids && "scale-110")}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
           size: 24, 
           className: active ? "fill-current opacity-20" : "" 
        }) : icon}
      </div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}