"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, User, MapPin, AlignLeft, Globe, Camera
} from "lucide-react";
import { auth, db } from "@/lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/lib/types/user.types";

export default function EditProfileClient() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form States
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setDisplayName(data.displayName || "");
          setBio(data.bio || "");
          setLocation(data.location || "");
          setPhotoURL(data.photoURL || "");
        }
      } catch (err) {
        console.error("Error load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        bio,
        location,
        // photoURL: photoURL // Nanti diaktifkan kalau sudah ada fitur upload image
      });
      
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

  return (
    <div className={cn(
      "min-h-screen font-sans transition-colors duration-500 flex flex-col items-center p-4 md:p-8",
      theme === "kids" ? "bg-yellow-50" : "bg-slate-50"
    )}>
      
      {/* HEADER */}
      <div className="w-full max-w-xl flex items-center mb-8">
        <button 
          onClick={() => router.back()} 
          className={cn(
            "p-2 rounded-full transition-all hover:bg-black/5 mr-4",
            theme === "kids" ? "text-gray-600" : "text-slate-600"
          )}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Edit Profil</h1>
      </div>

      {/* FORM CARD */}
      <div className={cn(
        "w-full max-w-xl bg-white p-6 md:p-8 border shadow-sm",
        theme === "kids" ? "rounded-3xl border-yellow-200" : "rounded-xl border-slate-200"
      )}>
        
        {/* Avatar Section (Mockup Upload) */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={() => alert("Upload foto segera hadir!")}>
            <div className={cn(
              "w-24 h-24 rounded-full border-4 border-white shadow-md flex items-center justify-center text-4xl bg-gray-100 overflow-hidden",
              theme === "kids" ? "bg-sky-50" : "bg-slate-50"
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
          <p className="text-xs text-muted-foreground mt-2">Ketuk untuk ganti foto</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <User size={16} /> Nama Panggilan
            </label>
            <input 
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama keren kamu..."
              className={cn(
                "w-full px-4 py-3 border-2 outline-none transition-all font-medium",
                theme === "kids" 
                  ? "rounded-xl border-gray-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" 
                  : "rounded-lg border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <AlignLeft size={16} /> Tentang Saya (Bio)
            </label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan sedikit tentang hobimu..."
              rows={3}
              className={cn(
                "w-full px-4 py-3 border-2 outline-none transition-all font-medium resize-none",
                theme === "kids" 
                  ? "rounded-xl border-gray-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" 
                  : "rounded-lg border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <MapPin size={16} /> Lokasi / Sekolah
            </label>
            <input 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Jakarta, SD Negeri 1..."
              className={cn(
                "w-full px-4 py-3 border-2 outline-none transition-all font-medium",
                theme === "kids" 
                  ? "rounded-xl border-gray-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" 
                  : "rounded-lg border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
              )}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex-1 text-muted-foreground"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className={cn(
                "flex-1 font-bold",
                theme === "kids" ? "rounded-xl bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200" : "bg-primary hover:bg-primary/90"
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