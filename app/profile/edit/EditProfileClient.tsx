"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, User, MapPin, AlignLeft, Globe, Camera,
  GraduationCap, School
} from "lucide-react";
import { auth, db } from "@/lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/lib/types/user.types";
import { onAuthStateChanged } from "firebase/auth";

const GRADE_LEVELS = [
  { id: 'sd', label: 'SD (Sekolah Dasar)' },
  { id: 'smp', label: 'SMP (Sekolah Menengah)' },
  { id: 'sma', label: 'SMA / SMK' },
  { id: 'uni', label: 'Universitas / Kuliah' },
  { id: 'umum', label: 'Umum' },
];

export default function EditProfileClient() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme(); // Import toggleTheme to update theme immediately
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form States
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [schoolName, setSchoolName] = useState(""); // Ganti location jadi schoolName biar lebih relevan
  const [schoolLevel, setSchoolLevel] = useState("sd");
  const [photoURL, setPhotoURL] = useState("");

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplayName(data.displayName || "");
          setBio(data.bio || "");
          setSchoolName(data.schoolName || data.location || ""); // Fallback ke location lama jika ada
          setSchoolLevel(data.schoolLevel || "sd");
          setPhotoURL(data.photoURL || "");
        }
      } catch (err) {
        console.error("Error load profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. Update Firestore
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        bio,
        schoolName,
        schoolLevel,
        // photoURL: photoURL // Nanti diaktifkan kalau sudah ada fitur upload image
      });
      
      // 2. Update Theme Context Immediately (Jika jenjang berubah)
      // Kita asumsikan jenjang sekolah = tema visual
      if (['sd', 'smp', 'sma', 'uni'].includes(schoolLevel)) {
         toggleTheme(schoolLevel as any);
      }
      
      // Feedback visual sederhana (bisa diganti toast)
      alert("Profil berhasil disimpan!");
      router.push("/profile"); // Kembali ke profil
    } catch (error) {
      console.error("Gagal simpan:", error);
      alert("Terjadi kesalahan saat menyimpan.");
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

  // Styles Helpers
  const bgStyle = isKids ? "bg-yellow-50" : isUni ? "bg-slate-950 text-slate-100" : "bg-slate-50";
  const cardStyle = isKids 
    ? "rounded-3xl border-yellow-200 bg-white" 
    : isUni 
      ? "rounded-xl border-slate-700 bg-slate-900 text-slate-200" 
      : "rounded-xl border-slate-200 bg-white";
  
  const inputStyle = isKids 
    ? "rounded-xl border-gray-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" 
    : isUni
      ? "rounded-lg border-slate-700 bg-slate-800 text-white focus:border-slate-500 focus:ring-1 focus:ring-slate-500 placeholder:text-slate-500"
      : "rounded-lg border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className={cn(
      "min-h-screen font-sans transition-colors duration-500 flex flex-col items-center p-4 md:p-8",
      bgStyle
    )}>
      
      {/* HEADER */}
      <div className="w-full max-w-xl flex items-center mb-8">
        <button 
          onClick={() => router.back()} 
          className={cn(
            "p-2 rounded-full transition-all hover:bg-black/5 mr-4",
            isKids ? "text-gray-600" : isUni ? "text-slate-400 hover:text-white" : "text-slate-600"
          )}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className={cn("text-2xl font-bold", isUni ? "text-white" : "text-foreground")}>Edit Profil</h1>
      </div>

      {/* FORM CARD */}
      <div className={cn(
        "w-full max-w-xl p-6 md:p-8 border shadow-sm",
        cardStyle
      )}>
        
        {/* Avatar Section (Mockup Upload) */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={() => alert("Upload foto segera hadir!")}>
            <div className={cn(
              "w-24 h-24 rounded-full border-4 shadow-md flex items-center justify-center text-4xl overflow-hidden",
              isKids ? "bg-sky-50 border-white" : isUni ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-white"
            )}>
              {photoURL ? (
                <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>😎</span>
              )}
            </div>
            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
          </div>
          <p className={cn("text-xs mt-2", isUni ? "text-slate-500" : "text-muted-foreground")}>Ketuk untuk ganti foto</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-2">
            <label className={cn("text-sm font-bold flex items-center gap-2", isUni ? "text-slate-400" : "text-muted-foreground")}>
              <User size={16} /> Nama Panggilan
            </label>
            <input 
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama keren kamu..."
              className={cn("w-full px-4 py-3 border-2 outline-none transition-all font-medium", inputStyle)}
            />
          </div>

          <div className="space-y-2">
            <label className={cn("text-sm font-bold flex items-center gap-2", isUni ? "text-slate-400" : "text-muted-foreground")}>
              <AlignLeft size={16} /> Bio / Status
            </label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan sedikit tentang hobimu..."
              rows={3}
              className={cn("w-full px-4 py-3 border-2 outline-none transition-all font-medium resize-none", inputStyle)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className={cn("text-sm font-bold flex items-center gap-2", isUni ? "text-slate-400" : "text-muted-foreground")}>
                 <GraduationCap size={16} /> Jenjang
               </label>
               <div className="relative">
                  <select 
                    value={schoolLevel}
                    onChange={(e) => setSchoolLevel(e.target.value)}
                    className={cn("w-full px-4 py-3 border-2 outline-none transition-all font-medium appearance-none cursor-pointer", inputStyle)}
                  >
                    {GRADE_LEVELS.map((level) => (
                       <option key={level.id} value={level.id}>{level.label}</option>
                    ))}
                  </select>
                  <div className={cn("absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none", isUni ? "text-slate-500" : "text-gray-400")}>
                     <ArrowLeft size={14} className="-rotate-90" />
                  </div>
               </div>
             </div>

             <div className="space-y-2">
               <label className={cn("text-sm font-bold flex items-center gap-2", isUni ? "text-slate-400" : "text-muted-foreground")}>
                 <School size={16} /> Nama Sekolah
               </label>
               <input 
                 value={schoolName}
                 onChange={(e) => setSchoolName(e.target.value)}
                 placeholder="Nama sekolahmu..."
                 className={cn("w-full px-4 py-3 border-2 outline-none transition-all font-medium", inputStyle)}
               />
             </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => router.back()}
              className={cn("flex-1", isUni ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-muted-foreground")}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className={cn(
                "flex-1 font-bold",
                isKids ? "rounded-xl bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200" : "bg-primary hover:bg-primary/90"
              )}
            >
              {saving ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Perubahan
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}