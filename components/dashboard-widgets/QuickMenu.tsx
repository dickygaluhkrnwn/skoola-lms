import React from "react";
import { BookOpen, Trophy, Users, Zap, Layout, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Tipe data untuk satu item menu
export interface QuickMenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: string; // Contoh: "bg-blue-500" atau "bg-gradient..."
  href: string;
}

interface QuickMenuProps {
  items?: QuickMenuItem[];
  className?: string;
}

export function QuickMenu({ items, className }: QuickMenuProps) {
  const router = useRouter();

  // Default menu jika tidak ada props items yang dikirim
  const defaultItems: QuickMenuItem[] = [
    {
      id: "learn",
      title: "Kelas Saya",
      subtitle: "Lanjut belajar",
      icon: <BookOpen className="h-5 w-5 text-white" />,
      colorClass: "bg-blue-500",
      href: "/learn"
    },
    {
      id: "social",
      title: "Arena Sosial",
      subtitle: "Main & Diskusi",
      icon: <Trophy className="h-5 w-5 text-white" />,
      colorClass: "bg-amber-500",
      href: "/social"
    },
    {
      id: "forum",
      title: "Forum Diskusi",
      subtitle: "Tanya Jawab",
      icon: <MessageSquare className="h-5 w-5 text-white" />,
      colorClass: "bg-purple-500",
      href: "/forum"
    },
    {
      id: "profile",
      title: "Profil Kamu",
      subtitle: "Cek Statistik",
      icon: <Users className="h-5 w-5 text-white" />,
      colorClass: "bg-emerald-500",
      href: "/profile"
    }
  ];

  const menuItems = items || defaultItems;

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => router.push(item.href)}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all hover:shadow-md",
            "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800",
            "hover:border-slate-300 dark:hover:border-slate-700"
          )}
        >
          {/* Decorative Background Blob - menggunakan opacity class parent color */}
          <div className={cn(
            "absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 transition-transform group-hover:scale-150",
            item.colorClass
          )} />
          
          <div className={cn(
            "mb-3 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110",
            item.colorClass
          )}>
            {item.icon}
          </div>

          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
              {item.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {item.subtitle}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}