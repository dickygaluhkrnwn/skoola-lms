"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Video, FileText, Link as LinkIcon, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context"; // Import Theme
import { cn } from "@/lib/utils";

export default function StudentClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme(); // Gunakan Theme
  const classId = params.classId as string;

  const [classData, setClassData] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;

    // 1. Fetch Informasi Kelas
    const fetchClass = async () => {
      try {
        const docRef = doc(db, "classrooms", classId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setClassData(docSnap.data());
        } else {
          alert("Kelas tidak ditemukan");
          router.push("/learn");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClass();

    // 2. Real-time Listener untuk Materi
    const materialsRef = collection(db, "classrooms", classId, "materials");
    const q = query(materialsRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaterials(mats);
    });

    return () => unsubscribe();
  }, [classId, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-primary"><Loader2 className="animate-spin mr-2"/> Memuat Kelas...</div>;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-500">
      
      {/* HEADER VISUAL */}
      <div className={cn(
        "text-white p-6 pb-12 shadow-lg relative transition-all",
        theme === "kids" 
          ? "bg-sky-600 rounded-b-[2.5rem]" 
          : "bg-primary rounded-b-lg"
      )}>
        <button 
          onClick={() => router.push("/learn")} 
          className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="max-w-md mx-auto mt-8 text-center">
          <span className={cn(
            "text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
            theme === "kids" ? "bg-sky-700/50 text-sky-200 border-sky-500/30" : "bg-black/20 text-white/80 border-white/10"
          )}>
            {classData?.code}
          </span>
          <h1 className="text-2xl font-bold mt-4 mb-2">{classData?.name}</h1>
          <p className="text-white/80 text-sm max-w-xs mx-auto">{classData?.description}</p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
              Guru: {classData?.teacherName}
            </span>
          </div>
        </div>
      </div>

      {/* LIST MATERI */}
      <div className="max-w-md mx-auto px-4 -mt-8 pb-12 relative z-10">
        <div className={cn(
          "bg-white border overflow-hidden min-h-[300px] shadow-xl",
          theme === "kids" ? "rounded-2xl border-gray-100" : "rounded-xl border-border"
        )}>
          <div className={cn(
            "p-4 border-b flex justify-between items-center",
            theme === "kids" ? "border-gray-50 bg-gray-50/50" : "border-border bg-secondary/30"
          )}>
            <h3 className={cn(
              "font-bold flex items-center gap-2",
              theme === "kids" ? "text-gray-700" : "text-foreground"
            )}>
              <BookOpen size={18} className={cn(theme === "kids" ? "text-sky-500" : "text-primary")} /> Materi Pembelajaran
            </h3>
            <span className="text-xs text-muted-foreground">{materials.length} Item</span>
          </div>
          
          <div className="divide-y divide-border">
            {materials.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                    <span className="text-2xl mb-2">📭</span>
                    Belum ada materi dari guru.
                </div>
            ) : (
                materials.map((item, idx) => (
                <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "p-4 flex items-center justify-between transition-colors cursor-pointer group",
                      theme === "kids" ? "hover:bg-sky-50" : "hover:bg-secondary/50"
                    )}
                    onClick={() => window.open(item.content, "_blank")}
                >
                    <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
                      item.type === 'video' 
                        ? (theme === "kids" ? 'bg-red-100 text-red-500' : 'bg-red-500/10 text-red-600')
                        : (theme === "kids" ? 'bg-blue-100 text-blue-500' : 'bg-blue-500/10 text-blue-600')
                    )}>
                        {item.type === 'video' ? <Video size={18} /> : <FileText size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-bold text-sm transition-colors truncate pr-4",
                          theme === "kids" ? "text-gray-800 group-hover:text-sky-600" : "text-foreground group-hover:text-primary"
                        )}>{item.title}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5 flex items-center gap-1">
                            {item.type === 'video' ? 'Video' : 'Bacaan'} 
                        </p>
                    </div>
                    </div>
                    <LinkIcon size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                </motion.div>
                ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}