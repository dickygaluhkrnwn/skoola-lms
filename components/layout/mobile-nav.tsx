"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Map, Trophy, BookOpen, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 flex justify-between items-center md:hidden z-50 pb-safe">
      <NavItem 
        active={pathname === "/learn"} 
        onClick={() => router.push("/learn")} 
        icon={<Map size={24} />} 
        label="Belajar" 
      />
      <NavItem 
        active={pathname === "/social"} 
        onClick={() => router.push("/social")} 
        icon={<Trophy size={24} />} 
        label="Sosial" 
      />
      <NavItem 
        active={pathname === "/dictionary"} 
        onClick={() => alert("Segera hadir!")} 
        icon={<BookOpen size={24} />} 
        label="Kamus" 
      />
      <button 
        onClick={handleLogout} 
        className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg"
      >
        <LogOut size={24} />
        <span className="text-[10px] font-bold">Keluar</span>
      </button>
    </nav>
  );
}

function NavItem({ icon, label, active = false, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors", 
        active ? "text-sky-600 bg-sky-50" : "text-gray-400 hover:text-sky-400"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}