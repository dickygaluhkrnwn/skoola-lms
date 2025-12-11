"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Plus, Trash2, Save, CheckCircle2, 
  HelpCircle, FileText, CheckSquare, MoreVertical, Loader2 
} from "lucide-react";
import { db } from "../../../../../../lib/firebase"; // Relative path yang benar
import { 
  doc, getDoc, collection, addDoc, updateDoc, 
  serverTimestamp, query, orderBy, getDocs, deleteDoc 
} from "firebase/firestore";
import { Button } from "../../../../../../components/ui/button";
import { cn } from "../../../../../../lib/utils";
import { motion, Reorder } from "framer-motion";

// --- TIPE DATA ---
interface Question {
  id: string; // ID lokal sementara atau ID firestore
  text: string;
  type: "multiple-choice" | "essay";
  options?: string[]; // Hanya untuk PG
  correctAnswer?: number; // Index jawaban benar (0-3) untuk PG
  points: number; // Bobot nilai
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
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // 1. FETCH DATA TUGAS & SOAL (JIKA ADA)
  useEffect(() => {
    const initData = async () => {
      try {
        // A. Fetch Info Tugas
        const assignRef = doc(db, "classrooms", classId, "assignments", assignmentId);
        const assignSnap = await getDoc(assignRef);
        
        if (assignSnap.exists()) {
          setAssignment(assignSnap.data() as AssignmentData);
        } else {
          alert("Tugas tidak ditemukan!");
          router.push(`/teacher/class/${classId}`);
          return;
        }

        // B. Fetch Soal yang Sudah Ada (jika edit)
        const qRef = collection(db, "classrooms", classId, "assignments", assignmentId, "questions");
        const qQuery = query(qRef, orderBy("order", "asc"));
        const qSnap = await getDocs(qQuery);

        if (!qSnap.empty) {
          const loadedQuestions = qSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Question[];
          setQuestions(loadedQuestions);
        } else {
          // Default 1 soal kosong jika baru
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

  // --- LOGIC MANIPULASI SOAL (LOKAL) ---

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

  // --- LOGIC SIMPAN KE FIRESTORE ---
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // FIX: Berikan tipe eksplisit Promise<any>[] agar tidak 'any[]'
      const batchPromises: Promise<any>[] = [];
      const qCollRef = collection(db, "classrooms", classId, "assignments", assignmentId, "questions");
      
      // 1. Hapus soal lama (cara brutal tapi aman untuk konsistensi urutan)
      // Idealnya pakai batch write, tapi untuk MVP kita delete & re-create atau update by ID
      // Agar simpel: Kita update dokumen assignment dengan field 'questionCount'
      
      // Kita akan menimpa koleksi questions. 
      // Ambil semua dulu untuk dihapus (clean slate approach)
      const existingDocs = await getDocs(qCollRef);
      const deletePromises = existingDocs.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // 2. Simpan soal baru
      questions.forEach((q, index) => {
        const { id, ...qData } = q; // Buang ID temp
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
        status: "active" // Tandai aktif
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
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
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
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
            key={q.id} // Gunakan ID unik key (bukan index) agar animasi lancar
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group"
          >
            {/* Question Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <span className="bg-slate-200 text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                    {qIndex + 1}
                  </span>
                  <select 
                    className="bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
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
                  >
                    <Trash2 size={18} />
                  </button>
               </div>
            </div>

            {/* Question Body */}
            <div className="p-6 space-y-4">
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
                             "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                             q.correctAnswer === optIndex 
                               ? "border-green-500 bg-green-500 text-white shadow-sm" 
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
                             q.correctAnswer === optIndex && "bg-green-50/50 font-medium text-green-900"
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
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-700">
                   <FileText size={20} className="shrink-0" />
                   <p className="text-sm">
                     Siswa akan menjawab dalam bentuk teks panjang. Penilaian untuk soal esai harus dilakukan secara manual oleh Guru.
                   </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* ADD BUTTON */}
        <button 
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-bold"
        >
          <Plus size={20} /> Tambah Pertanyaan Baru
        </button>

      </main>
    </div>
  );
}