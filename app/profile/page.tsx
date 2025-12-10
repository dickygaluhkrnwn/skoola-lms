"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Mail, Shield, Star, Flame, Camera, Save, ArrowLeft, Loader2 
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Form State
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
          setDisplayName(data.displayName || "");
        }
      } catch (error) {
        console.error("Gagal load profil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName
      });
      alert("Profil berhasil diperbarui!");
    } catch (error) {
      console.error("Gagal update:", error);
      alert("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-sans transition-colors duration-500 flex flex-col items-center p-6",
      theme === "kids" ? "bg-yellow-50" : "bg-slate-50"
    )}>
      
      {/* Header Nav */}
      <div className="w-full max-w-2xl flex items-center mb-8">
        <button 
          onClick={() => router.back()} 
          className={cn(
            "p-2 rounded-full transition-all hover:bg-black/5",
            theme === "kids" ? "text-gray-600" : "text-slate-600"
          )}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold ml-4 text-foreground">Profil Saya</h1>
      </div>

      <main className="w-full max-w-2xl space-y-6">
        
        {/* 1. CARD UTAMA (Avatar & Stats) */}
        <div className={cn(
          "bg-white p-8 border shadow-sm relative overflow-hidden",
          theme === "kids" ? "rounded-3xl border-yellow-200" : "rounded-xl border-slate-200"
        )}>
          {/* Background Decoration */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-32 opacity-20",
            theme === "kids" ? "bg-gradient-to-r from-yellow-400 to-red-400" : "bg-gradient-to-r from-slate-400 to-slate-600"
          )} />

          <div className="relative flex flex-col items-center mt-4">
            <div className="relative group">
              <div className={cn(
                "w-32 h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-4xl bg-gray-100 select-none",
                theme === "kids" ? "bg-sky-50" : "bg-slate-50"
              )}>
                {/* Avatar Placeholder (Emoji atau Inisial) */}
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>😎</span>
                )}
              </div>
              <button 
                onClick={() => alert("Fitur upload foto segera hadir!")}
                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition-colors"
                title="Ganti Foto"
              >
                <Camera size={16} />
              </button>
            </div>

            <h2 className="mt-4 text-2xl font-bold text-foreground">{userProfile?.displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                userProfile?.role === "teacher" 
                  ? (theme === "kids" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700")
                  : (theme === "kids" ? "bg-green-100 text-green-700" : "bg-emerald-100 text-emerald-700")
              )}>
                {userProfile?.role === "teacher" ? "Guru" : "Murid"}
              </span>
              <span className="text-sm text-muted-foreground">{userProfile?.email}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-dashed border-gray-200">
            <StatCard 
              theme={theme}
              icon={<Star size={20} className="text-yellow-500" />} 
              label="Total XP" 
              value={userProfile?.xp || 0} 
            />
            <StatCard 
              theme={theme}
              icon={<Shield size={20} className="text-blue-500" />} 
              label="Level" 
              value={userProfile?.level?.toUpperCase() || "BASIC"} 
            />
            <StatCard 
              theme={theme}
              icon={<Flame size={20} className="text-orange-500" />} 
              label="Streak" 
              value={`${userProfile?.streak || 0} Hari`} 
            />
          </div>
        </div>

        {/* 2. FORM EDIT PROFIL */}
        <div className={cn(
          "bg-white p-6 border shadow-sm",
          theme === "kids" ? "rounded-3xl border-gray-200" : "rounded-xl border-slate-200"
        )}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
            <User size={20} className="text-primary" /> Edit Data Diri
          </h3>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">Nama Panggilan</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={cn(
                  "w-full px-4 py-3 border-2 outline-none transition-all placeholder:text-gray-300 font-medium",
                  theme === "kids" 
                    ? "rounded-xl border-gray-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" 
                    : "rounded-lg border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
                )}
                placeholder="Nama kamu..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">Email (Tidak bisa diubah)</label>
              <div className="relative">
                <input 
                  disabled
                  value={userProfile?.email || ""}
                  className={cn(
                    "w-full px-4 py-3 border bg-gray-50 text-gray-400 cursor-not-allowed",
                    theme === "kids" ? "rounded-xl border-gray-200" : "rounded-lg border-slate-200"
                  )}
                />
                <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                disabled={saving}
                className={cn(
                  "min-w-[120px]",
                  theme === "kids" ? "rounded-xl bg-sky-500 hover:bg-sky-600" : "bg-primary hover:bg-primary/90"
                )}
              >
                {saving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Simpan
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

      </main>
    </div>
  );
}

// Sub-Component Stat Card
function StatCard({ icon, label, value, theme }: any) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-3 text-center border transition-all",
      theme === "kids" 
        ? "bg-gray-50 rounded-2xl border-gray-100 hover:bg-white hover:shadow-md" 
        : "bg-slate-50 rounded-lg border-slate-100 hover:border-slate-200"
    )}>
      <div className="mb-2">{icon}</div>
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">{label}</div>
    </div>
  );
}

// Tambahan Icon Lock yang lupa di-import
function Lock({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  )
}