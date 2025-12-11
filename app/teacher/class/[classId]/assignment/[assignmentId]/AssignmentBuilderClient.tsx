"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Plus, Trash2, Save, CheckCircle2, 
  HelpCircle, FileText, Image as ImageIcon, Music, X, UploadCloud, Loader2
} from "lucide-react";
import { db } from "../../../../../../lib/firebase"; 
import { 
  doc, getDoc, collection, addDoc, updateDoc, 
  serverTimestamp, query, orderBy, getDocs, deleteDoc 
} from "firebase/firestore";
import { 
  getStorage, ref, uploadBytes, getDownloadURL 
} from "firebase/storage";
import { Button } from "../../../../../../components/ui/button";
import { cn } from "../../../../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- TIPE DATA ---
interface Question {
  id: string; 
  text: string;
  type: "multiple-choice" | "essay";
  
  // Media Support (Math & Listening)
  mediaUrl?: string; 
  mediaType?: "image" | "audio"; 

  options?: string[]; // Only for Multiple Choice
  correctAnswer?: number; 
  points: number;
}

interface AssignmentData {
  title: string;
  description: string;
  deadline?: any;
}

interface AssignmentBuilderClientProps {
  classId: string;
  assignmentId: string;
}

export default function AssignmentBuilderClient({ classId, assignmentId }: AssignmentBuilderClientProps) {
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null); // ID soal yang sedang upload
  
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Refs untuk file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeQuestionIndexRef = useRef<number | null>(null);

  // 1. FETCH DATA TUGAS & SOAL
  useEffect(() => {
    const initData = async () => {
      try {
        const assignRef = doc(db, "classrooms", classId, "assignments", assignmentId);
        const assignSnap = await getDoc(assignRef);
        
        if (assignSnap.exists()) {
          setAssignment(assignSnap.data() as AssignmentData);
        } else {
          alert("Tugas tidak ditemukan!");
          router.push(`/teacher/class/${classId}`);
          return;
        }

        const qRef = collection(db, "classrooms", classId, "assignments", assignmentId, "questions");
        const qQuery = query(qRef, orderBy("order", "asc"));
        const qSnap = await getDocs(qQuery);

        if (!qSnap.empty) {
          const loadedQuestions = qSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Question[];
          setQuestions(loadedQuestions);
        } else {
          // Default 1 soal
          setQuestions([{
            id: Date.now().toString(),
            text: "",
            type: "multiple-choice",
            options: ["", "", "", ""],
            correctAnswer: 0,
            points: 10
          }]);
        }
      } catch (error) {
        console.error("Error init:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [classId, assignmentId, router]);

  // --- LOGIC MANIPULASI SOAL ---

  const addQuestion = () => {
    const newQ: Question = {
      id: Date.now().toString(),
      text: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 10
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (index: number) => {
    const newQ = [...questions];
    newQ.splice(index, 1);
    setQuestions(newQ);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], [field]: value };
    setQuestions(newQ);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQ = [...questions];
    if (newQ[qIndex].options) {
      newQ[qIndex].options![optIndex] = value;
      setQuestions(newQ);
    }
  };

  // --- MEDIA UPLOAD HANDLER ---
  const triggerFileUpload = (index: number, type: "image" | "audio") => {
    activeQuestionIndexRef.current = index;
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "image" ? "image/*" : "audio/*";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const index = activeQuestionIndexRef.current;

    if (file && index !== null) {
      setUploadingMedia(questions[index].id);
      try {
        const storage = getStorage(); // Pastikan Firebase Storage aktif
        const fileExt = file.name.split('.').pop();
        const fileName = `assignments/${assignmentId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update Soal dengan URL Media
        const newQ = [...questions];
        newQ[index] = {
          ...newQ[index],
          mediaUrl: downloadURL,
          mediaType: file.type.startsWith("image") ? "image" : "audio"
        };
        setQuestions(newQ);

      } catch (error) {
        console.error("Upload error:", error);
        alert("Gagal mengupload media. Pastikan koneksi aman.");
      } finally {
        setUploadingMedia(null);
        activeQuestionIndexRef.current = null;
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
      }
    }
  };

  const removeMedia = (index: number) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], mediaUrl: undefined, mediaType: undefined };
    setQuestions(newQ);
  };

  // --- SAVE TO FIRESTORE ---
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const batchPromises: Promise<any>[] = [];
      const qCollRef = collection(db, "classrooms", classId, "assignments", assignmentId, "questions");
      
      // 1. Hapus soal lama (Clean Slate)
      const existingDocs = await getDocs(qCollRef);
      const deletePromises = existingDocs.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // 2. Simpan soal baru
      questions.forEach((q, index) => {
        const { id, ...qData } = q;
        const p = addDoc(qCollRef, {
          ...qData,
          order: index,
          createdAt: serverTimestamp()
        });
        batchPromises.push(p);
      });

      await Promise.all(batchPromises);

      // 3. Update status assignment
      const assignRef = doc(db, "classrooms", classId, "assignments", assignmentId);
      await updateDoc(assignRef, {
        questionCount: questions.length,
        totalPoints: questions.reduce((sum, q) => sum + (q.points || 0), 0),
        status: "active"
      });

      alert("Soal berhasil disimpan & diterbitkan!");
      router.push(`/teacher/class/${classId}`);

    } catch (error) {
      console.error("Gagal simpan:", error);
      alert("Gagal menyimpan soal.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-600">
      <Loader2 className="animate-spin w-8 h-8 mr-2"/> 
      <span>Memuat Builder...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 truncate max-w-xs md:max-w-md">
                {assignment?.title}
              </h1>
              <p className="text-xs text-slate-500">Mode Edit Soal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right text-xs text-slate-500 mr-2">
               <p>Total Soal: <span className="font-bold text-slate-800">{questions.length}</span></p>
               <p>Total Poin: <span className="font-bold text-slate-800">{questions.reduce((a,b)=>a+b.points,0)}</span></p>
            </div>
            <Button 
              onClick={handleSaveAll} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-blue-200 shadow-lg"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4"/> : <Save size={18} />}
              {saving ? "Menyimpan..." : "Simpan & Terbitkan"}
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        
        {questions.map((q, qIndex) => (
          <motion.div 
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group"
          >
            {/* Question Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                    {qIndex + 1}
                  </span>
                  <select 
                    className="bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-blue-400 transition-colors"
                    value={q.type}
                    onChange={(e) => updateQuestion(qIndex, "type", e.target.value)}
                  >
                    <option value="multiple-choice">Pilihan Ganda</option>
                    <option value="essay">Esai / Uraian</option>
                  </select>
               </div>
               
               <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                     <span className="text-[10px] uppercase font-bold text-slate-400">Poin</span>
                     <input 
                       type="number" 
                       className="w-10 text-right text-sm font-bold text-slate-700 outline-none"
                       value={q.points}
                       onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value) || 0)}
                     />
                  </div>
                  <button 
                    onClick={() => removeQuestion(qIndex)}
                    className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Soal"
                  >
                    <Trash2 size={18} />
                  </button>
               </div>
            </div>

            {/* Question Body */}
            <div className="p-6 space-y-4">
              {/* Media Attachment (Image/Audio) */}
              {q.mediaUrl ? (
                <div className="relative mb-4 group/media rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                   <button 
                      onClick={() => removeMedia(qIndex)}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-red-50 text-slate-500 hover:text-red-600 p-1.5 rounded-full shadow-sm z-10 transition-all"
                      title="Hapus Media"
                   >
                      <X size={16} />
                   </button>
                   
                   {q.mediaType === 'image' ? (
                     <img src={q.mediaUrl} alt="Soal Media" className="w-full max-h-80 object-contain mx-auto" />
                   ) : (
                     <div className="p-6 flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                           <Music size={24} />
                        </div>
                        <audio controls src={q.mediaUrl} className="w-full max-w-md" />
                     </div>
                   )}
                </div>
              ) : (
                <div className="flex gap-2 mb-2">
                   {uploadingMedia === q.id ? (
                      <span className="text-xs text-blue-600 flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg animate-pulse">
                         <Loader2 size={12} className="animate-spin"/> Mengupload...
                      </span>
                   ) : (
                      <>
                        <button 
                          onClick={() => triggerFileUpload(qIndex, "image")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200 hover:border-blue-200"
                        >
                          <ImageIcon size={14} /> + Gambar
                        </button>
                        <button 
                          onClick={() => triggerFileUpload(qIndex, "audio")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-xs font-bold hover:bg-purple-50 hover:text-purple-600 transition-colors border border-slate-200 hover:border-purple-200"
                        >
                          <Music size={14} /> + Audio
                        </button>
                      </>
                   )}
                </div>
              )}

              {/* Text Soal */}
              <div>
                 <textarea 
                   placeholder="Tulis pertanyaan Anda di sini..."
                   className="w-full text-lg font-medium text-slate-800 placeholder:text-slate-300 border-none outline-none resize-none focus:ring-0 bg-transparent min-h-[60px]"
                   value={q.text}
                   onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                 />
              </div>

              {/* Options (Only for PG) */}
              {q.type === "multiple-choice" && (
                <div className="space-y-3 pl-1">
                   {q.options?.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-3 group/opt">
                          <button 
                            onClick={() => updateQuestion(qIndex, "correctAnswer", optIndex)}
                            className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                              q.correctAnswer === optIndex 
                                ? "border-green-500 bg-green-500 text-white shadow-sm scale-110" 
                                : "border-slate-300 text-transparent hover:border-slate-400"
                            )}
                            title="Tandai sebagai jawaban benar"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <input 
                            placeholder={`Pilihan Jawaban ${String.fromCharCode(65 + optIndex)}`}
                            className={cn(
                              "flex-1 bg-slate-50 border-b-2 border-transparent focus:border-blue-500 outline-none px-3 py-2 text-sm transition-colors rounded-t-md",
                              q.correctAnswer === optIndex && "bg-green-50/50 font-medium text-green-900 border-green-500/30"
                            )}
                            value={opt}
                            onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                          />
                      </div>
                   ))}
                   <p className="text-[10px] text-slate-400 ml-9 mt-1 flex items-center gap-1">
                      <HelpCircle size={10} /> Klik lingkaran untuk kunci jawaban benar
                   </p>
                </div>
              )}

              {/* Essay Hint */}
              {q.type === "essay" && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-700 items-start">
                   <FileText size={20} className="shrink-0 mt-0.5" />
                   <div>
                     <p className="text-sm font-bold mb-1">Soal Uraian</p>
                     <p className="text-xs opacity-80">
                       Siswa akan menjawab dalam bentuk teks panjang. Penilaian untuk soal esai dilakukan secara manual di halaman Grading.
                     </p>
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* ADD BUTTON */}
        <button 
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-bold group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
             <Plus size={20} /> 
          </div>
          Tambah Pertanyaan Baru
        </button>

      </main>

      {/* Hidden Input for File Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />

    </div>
  );
}