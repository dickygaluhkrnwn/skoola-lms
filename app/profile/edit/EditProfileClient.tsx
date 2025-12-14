"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, User, AlignLeft, Camera,
  GraduationCap, School, Search, CheckCircle2, AlertCircle, Building2
} from "lucide-react";
import { auth, db } from "@/lib/firebase"; 
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
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
  const { theme, toggleTheme } = useTheme(); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form States
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [schoolName, setSchoolName] = useState(""); 
  const [schoolLevel, setSchoolLevel] = useState("sd");
  const [photoURL, setPhotoURL] = useState("");
  const [schoolId, setSchoolId] = useState<string | null>(null); // ID Sekolah yang terhubung

  // Verification States
  const [schoolCodeInput, setSchoolCodeInput] = useState("");
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeMessage, setCodeMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
          setSchoolName(data.schoolName || data.location || ""); 
          setSchoolLevel(data.schoolLevel || "sd");
          setPhotoURL(data.photoURL || "");
          setSchoolId(data.schoolId || null);
        }
      } catch (err) {
        console.error("Error load profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  // Fungsi Cek Kode Sekolah
  const handleVerifyCode = async () => {
    if (!schoolCodeInput || schoolCodeInput.length < 4) {
      setCodeMessage({ type: 'error', text: "Kode terlalu pendek" });
      return;
    }

    setIsCheckingCode(true);
    setCodeMessage(null);

    try {
      // Query cari sekolah berdasarkan kode
      const q = query(collection(db, "schools"), where("schoolCode", "==", schoolCodeInput.toUpperCase().trim()));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const schoolDoc = snapshot.docs[0];
        const schoolData = schoolDoc.data();

        // Update Form Data Otomatis
        setSchoolName(schoolData.name);
        setSchoolLevel(schoolData.level);
        setSchoolId(schoolDoc.id);

        setCodeMessage({ type: 'success', text: `Sekolah ditemukan: ${schoolData.name}` });
        
        // Opsional: Langsung ubah tema visual saat sekolah ditemukan
        if (['sd', 'smp', 'sma', 'uni'].includes(schoolData.level)) {
           // toggleTheme(schoolData.level); // Uncomment jika ingin efek instan
        }
      } else {
        setCodeMessage({ type: 'error', text: "Kode sekolah tidak ditemukan." });
      }
    } catch (err) {
      console.error(err);
      setCodeMessage({ type: 'error', text: "Gagal memverifikasi kode." });
    } finally {
      setIsCheckingCode(false);
    }
  };

  // Fungsi Simpan
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
        schoolId: schoolId || null, // Simpan schoolId agar terikat
        // photoURL: photoURL 
      });
      
      // 2. Update Theme Context Immediately 
      if (['sd', 'smp', 'sma', 'uni'].includes(schoolLevel)) {
         toggleTheme(schoolLevel as any);
      }
      
      alert("Profil berhasil disimpan!");
      router.push("/profile"); 
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
        "w-full max-w-xl p-6 md:p-8 border shadow-sm space-y-8",
        cardStyle
      )}>
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
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
          
          {/* SECTION: DATA DIRI */}
          <div className="space-y-4">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", isUni ? "text-slate-500" : "text-slate-400")}>Data Diri</h3>
            
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
          </div>

          <div className="w-full h-px bg-slate-200 dark:bg-slate-700" />

          {/* SECTION: AFILIASI SEKOLAH (FITUR BARU) */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className={cn("text-xs font-bold uppercase tracking-wider", isUni ? "text-slate-500" : "text-slate-400")}>
                  Afiliasi Sekolah
                </h3>
                {schoolId && (
                   <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                     <CheckCircle2 size={12} /> Terverifikasi
                   </span>
                )}
             </div>

             {/* Jika belum terhubung, tampilkan input kode */}
             {!schoolId ? (
                <div className={cn("p-4 rounded-xl border-2 border-dashed space-y-3", isUni ? "border-slate-700 bg-slate-800/50" : "border-indigo-100 bg-indigo-50")}>
                   <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className={cn("text-sm font-bold", isUni ? "text-indigo-300" : "text-indigo-900")}>Gabung dengan Sekolah</p>
                        <p className={cn("text-xs mt-1", isUni ? "text-slate-400" : "text-indigo-600/80")}>
                          Masukkan <strong>Kode Sekolah</strong> yang diberikan oleh admin/guru untuk bergabung.
                        </p>
                      </div>
                   </div>

                   <div className="flex gap-2">
                      <input 
                        value={schoolCodeInput}
                        onChange={(e) => {
                          setSchoolCodeInput(e.target.value.toUpperCase());
                          setCodeMessage(null);
                        }}
                        placeholder="Contoh: SKL-AB12"
                        className={cn("flex-1 px-4 py-2 border-2 outline-none transition-all font-mono font-bold uppercase tracking-wide", inputStyle)}
                      />
                      <Button 
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={isCheckingCode || !schoolCodeInput}
                        className={isKids ? "bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl" : ""}
                      >
                        {isCheckingCode ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                      </Button>
                   </div>

                   {/* Feedback Pesan */}
                   {codeMessage && (
                     <div className={cn(
                       "text-xs font-bold flex items-center gap-2",
                       codeMessage.type === 'success' ? "text-green-600" : "text-red-500"
                     )}>
                       {codeMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                       {codeMessage.text}
                     </div>
                   )}
                </div>
             ) : (
               // Jika sudah terhubung, tampilkan info sekolah
               <div className={cn("p-4 rounded-xl border flex items-center gap-4", isUni ? "bg-slate-800 border-green-900/50" : "bg-green-50 border-green-200")}>
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm">
                    🏫
                  </div>
                  <div>
                    <p className={cn("text-sm font-bold", isUni ? "text-white" : "text-slate-800")}>{schoolName}</p>
                    <p className={cn("text-xs", isUni ? "text-slate-400" : "text-slate-500")}>Status: Anggota Aktif</p>
                  </div>
                  {/* Tombol keluar bisa ditambahkan nanti jika perlu */}
               </div>
             )}

             {/* Input Manual / Readonly */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className={cn("text-sm font-bold flex items-center gap-2", isUni ? "text-slate-400" : "text-muted-foreground")}>
                     <GraduationCap size={16} /> Jenjang
                   </label>
                   <div className="relative">
                      <select 
                        value={schoolLevel}
                        onChange={(e) => setSchoolLevel(e.target.value)}
                        // Disable jika sudah join sekolah via kode
                        disabled={!!schoolId}
                        className={cn(
                          "w-full px-4 py-3 border-2 outline-none transition-all font-medium appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed", 
                          inputStyle
                        )}
                      >
                        {GRADE_LEVELS.map((level) => (
                           <option key={level.id} value={level.id}>{level.label}</option>
                        ))}
                      </select>
                      {!schoolId && (
                        <div className={cn("absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none", isUni ? "text-slate-500" : "text-gray-400")}>
                           <ArrowLeft size={14} className="-rotate-90" />
                        </div>
                      )}
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className={cn("text-sm font-bold flex items-center gap-2", isUni ? "text-slate-400" : "text-muted-foreground")}>
                     <School size={16} /> Nama Sekolah
                   </label>
                   <input 
                     value={schoolName}
                     onChange={(e) => setSchoolName(e.target.value)}
                     // Disable jika sudah join sekolah via kode
                     disabled={!!schoolId}
                     placeholder="Nama sekolahmu..."
                     className={cn(
                       "w-full px-4 py-3 border-2 outline-none transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed", 
                       inputStyle
                     )}
                   />
                 </div>
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