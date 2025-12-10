"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Map, Trophy, BookOpen, LogOut, User } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export function StudentSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState("Sobat Skoola");

  // Fetch nama user untuk ditampilkan di sidebar
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
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col fixed inset-y-0 z-50">
      <div className="p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-sm font-bold text-red-600 tracking-wide">SKOOLA</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <SidebarItem 
          icon={<Map size={20} />} 
          label="Belajar" 
          active={pathname === "/learn"} 
          onClick={() => router.push("/learn")} 
        />
        <SidebarItem 
          icon={<Trophy size={20} />} 
          label="Sosial" 
          active={pathname === "/social"} 
          onClick={() => router.push("/social")} 
        />
        <SidebarItem 
          icon={<BookOpen size={20} />} 
          label="Kamus" 
          active={pathname === "/dictionary"} 
          onClick={() => alert("Fitur Kamus segera hadir!")} 
        />
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
           <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 border border-sky-200">
             <User size={16} />
           </div>
           <div className="flex-1 overflow-hidden">
             <p className="text-sm font-bold truncate text-gray-700">{name}</p>
             <p className="text-xs text-gray-400 truncate">Murid</p>
           </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all w-full font-bold text-sm"
        >
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex items-center gap-4 px-4 py-3 w-full rounded-xl transition-all text-sm font-bold",
        active 
          ? "bg-sky-100 text-sky-600 border-2 border-sky-200 shadow-sm" 
          : "text-gray-500 hover:bg-gray-50 border-2 border-transparent hover:text-gray-900"
      )}
    >
      {icon} {label}
    </button>
  );
}