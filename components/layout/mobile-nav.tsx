"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Map, Trophy, BookOpen, LogOut, User } from "lucide-react";
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

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 border-t px-6 py-2 flex justify-between items-center md:hidden z-50 pb-safe transition-colors duration-300",
      theme === "kids" 
        ? "bg-white border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" 
        : "bg-slate-900 border-slate-800"
    )}>
      <NavItem 
        theme={theme}
        active={pathname === "/learn"} 
        onClick={() => router.push("/learn")} 
        icon={<Map size={24} />} 
        label="Belajar" 
      />
      <NavItem 
        theme={theme}
        active={pathname === "/social"} 
        onClick={() => router.push("/social")} 
        icon={<Trophy size={24} />} 
        label="Sosial" 
      />
      {/* Tambahan Menu Profil di Mobile */}
      <NavItem 
        theme={theme}
        active={pathname === "/profile"} 
        onClick={() => router.push("/profile")} 
        icon={<User size={24} />} 
        label="Profil" 
      />
      <button 
        onClick={handleLogout} 
        className={cn(
          "flex flex-col items-center gap-1 transition-colors p-2 rounded-lg",
          theme === "kids" ? "text-gray-400 hover:text-red-500" : "text-slate-500 hover:text-red-400"
        )}
      >
        <LogOut size={24} />
        <span className="text-[10px] font-bold">Keluar</span>
      </button>
    </nav>
  );
}

function NavItem({ icon, label, active = false, onClick, theme }: any) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex flex-col items-center gap-1 p-2 transition-all",
        // Kids Theme
        theme === "kids" ? "rounded-xl" : "rounded-md",
        theme === "kids" && active && "text-sky-600 bg-sky-50",
        theme === "kids" && !active && "text-gray-400 hover:text-sky-400",
        
        // Pro Theme
        theme === "pro" && active && "text-primary bg-slate-800",
        theme === "pro" && !active && "text-slate-500 hover:text-slate-300"
      )}
    >
      <div className={cn("transition-transform", active && theme === "kids" && "scale-110")}>
        {icon}
      </div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}