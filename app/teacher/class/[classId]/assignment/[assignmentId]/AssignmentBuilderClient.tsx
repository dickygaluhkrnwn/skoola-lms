"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Plus, Trash2, Save, CheckCircle2, 
  HelpCircle, FileText, Image as ImageIcon, Music, X, UploadCloud, Loader2,
  Gamepad2, List, Grid, Layers, Lightbulb
} from "lucide-react";
import { db, storage } from "../../../../../../lib/firebase"; 
import { 
  doc, getDoc, collection, addDoc, updateDoc, 
  serverTimestamp, query, orderBy, getDocs, deleteDoc 
} from "firebase/firestore";
import { 
  ref, uploadBytes, getDownloadURL 
} from "firebase/storage";
import { Button } from "../../../../../../components/ui/button";
import { cn } from "../../../../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AssignmentType, GameType, QuestionType, QuizQuestion } from "../../../../../../lib/types/course.types";

// --- TIPE DATA LOCAL UNTUK BUILDER ---
interface AssignmentData {
  title: string;
  description: string;
  type: AssignmentType;
  gameConfig?: {
    gameType: GameType;
    data: any;
  };
}

interface AssignmentBuilderClientProps {
  classId: string;
  assignmentId: string;
}

export default function AssignmentBuilderClient({ classId, assignmentId }: AssignmentBuilderClientProps) {
  const router = useRouter();
  
  // State Global
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);

  // State Khusus Quiz
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null); // ID soal/item yang sedang upload

  // State Khusus Game Word Scramble
  const [gameWords, setGameWords] = useState<{word: string, hint: string}[]>([]);

  // State Khusus Game Memory Match & Flashcard
  // Kita gunakan struktur { front: string, back: string, frontImage?: string, backImage?: string }
  const [gamePairs, setGamePairs] = useState<{id: string, front: string, back: string, frontImage?: string, backImage?: string}[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeItemIndexRef = useRef<{type: 'quiz'|'pair_front'|'pair_back', index: number} | null>(null);

  // 1. FETCH DATA TUGAS & SOAL
  useEffect(() => {
    const initData = async () => {
      try {
        const assignRef = doc(db, "classrooms", classId, "assignments", assignmentId);
        const assignSnap = await getDoc(assignRef);
        
        if (assignSnap.exists()) {
          const data = assignSnap.data() as AssignmentData;
          setAssignment(data);

          // LOGIKA FETCH BERDASARKAN TIPE
          if (data.type === 'quiz') {
             // Fetch Questions
             const qRef = collection(db, "classrooms", classId, "assignments", assignmentId, "questions");
             const qQuery = query(qRef, orderBy("order", "asc"));
             const qSnap = await getDocs(qQuery);

             if (!qSnap.empty) {
               const loadedQuestions = qSnap.docs.map(d => ({ id: d.id, ...d.data() })) as QuizQuestion[];
               setQuestions(loadedQuestions);
             } else {
               // Default 1 soal kosong
               setQuestions([{
                 id: Date.now().toString(),
                 type: "multiple-choice",
                 text: "",
                 options: ["", "", "", ""],
                 correctAnswer: 0,
                 points: 10
               }]);
             }
          } 
          else if (data.type === 'game') {
              const gType = data.gameConfig?.gameType;
              const gData = data.gameConfig?.data;

              if (gType === 'word-scramble') {
                  setGameWords(gData || [{ word: "", hint: "" }]);
              } else if (gType === 'memory-match' || gType === 'flashcard-challenge') {
                  setGamePairs(gData || [{ id: Date.now().toString(), front: "", back: "" }]);
              }
          }

        } else {
          alert("Tugas tidak ditemukan!");
          router.push(`/teacher/class/${classId}`);
          return;
        }
      } catch (error) {
        console.error("Error init:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [classId, assignmentId, router]);

  // --- LOGIC: QUIZ BUILDER ---

  const addQuestion = () => {
    const newQ: QuizQuestion = {
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

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQ = [...questions];
    // @ts-ignore - dynamic key access
    newQ[index] = { ...newQ[index], [field]: value };
    setQuestions(newQ);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQ = [...questions];
    if (newQ[qIndex].options) {
      const newOpts = [...newQ[qIndex].options!];
      newOpts[optIndex] = value;
      newQ[qIndex].options = newOpts;
      setQuestions(newQ);
    }
  };

  // --- LOGIC: GAME BUILDER (WORD SCRAMBLE) ---
  const addWord = () => {
      setGameWords([...gameWords, { word: "", hint: "" }]);
  };
  
  const removeWord = (index: number) => {
      const newWords = [...gameWords];
      newWords.splice(index, 1);
      setGameWords(newWords);
  };

  const updateWord = (index: number, field: 'word' | 'hint', value: string) => {
      const newWords = [...gameWords];
      newWords[index][field] = value;
      setGameWords(newWords);
  };

  // --- LOGIC: GAME BUILDER (PAIRS: MEMORY/FLASHCARD) ---
  const addPair = () => {
      setGamePairs([...gamePairs, { id: Date.now().toString(), front: "", back: "" }]);
  };

  const removePair = (index: number) => {
      const newPairs = [...gamePairs];
      newPairs.splice(index, 1);
      setGamePairs(newPairs);
  };

  const updatePair = (index: number, field: 'front' | 'back', value: string) => {
      const newPairs = [...gamePairs];
      newPairs[index][field] = value;
      setGamePairs(newPairs);
  };

  // --- MEDIA UPLOAD HANDLER (Common) ---
  const triggerFileUpload = (index: number, context: 'quiz'|'pair_front'|'pair_back', type: "image" | "audio") => {
    activeItemIndexRef.current = { type: context, index };
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "image" ? "image/*" : "audio/*";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const activeRef = activeItemIndexRef.current;

    if (file && activeRef) {
      const { type, index } = activeRef;
      
      // Set loading state
      const loadingId = type === 'quiz' ? questions[index].id : gamePairs[index].id + type;
      setUploadingMedia(loadingId);

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `assignments/${assignmentId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update Data based on context
        if (type === 'quiz') {
            const newQ = [...questions];
            newQ[index] = { ...newQ[index], mediaUrl: downloadURL };
            setQuestions(newQ);
        } else if (type === 'pair_front') {
            const newP = [...gamePairs];
            newP[index] = { ...newP[index], frontImage: downloadURL };
            setGamePairs(newP);
        } else if (type === 'pair_back') {
            const newP = [...gamePairs];
            newP[index] = { ...newP[index], backImage: downloadURL };
            setGamePairs(newP);
        }

      } catch (error) {
        console.error("Upload error:", error);
        alert("Gagal mengupload media. Pastikan koneksi aman.");
      } finally {
        setUploadingMedia(null);
        activeItemIndexRef.current = null;
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
      }
    }
  };

  const removeMedia = (index: number, context: 'quiz'|'pair_front'|'pair_back') => {
    if (context === 'quiz') {
        const newQ = [...questions];
        newQ[index] = { ...newQ[index], mediaUrl: undefined };
        setQuestions(newQ);
    } else {
        const newP = [...gamePairs];
        if (context === 'pair_front') newP[index].frontImage = undefined;
        if (context === 'pair_back') newP[index].backImage = undefined;
        setGamePairs(newP);
    }
  };

  // --- SAVE TO FIRESTORE ---
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const assignRef = doc(db, "classrooms", classId, "assignments", assignmentId);

      // A. JIKA TIPE QUIZ
      if (assignment?.type === 'quiz') {
          const batchPromises: Promise<any>[] = [];
          const qCollRef = collection(db, "classrooms", classId, "assignments", assignmentId, "questions");
          
          // 1. Hapus soal lama
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
          await updateDoc(assignRef, {
            questionCount: questions.length, // field lama
            questionsCount: questions.length, // normalisasi nama field
            totalPoints: questions.reduce((sum, q) => sum + (q.points || 0), 0),
            status: "active"
          });
      } 
      
      // B. JIKA TIPE GAME
      else if (assignment?.type === 'game') {
          const gameType = assignment.gameConfig?.gameType;
          let gameData = null;

          if (gameType === 'word-scramble') {
              gameData = gameWords;
          } else {
              gameData = gamePairs;
          }

          await updateDoc(assignRef, {
              status: "active",
              gameConfig: {
                  ...assignment.gameConfig,
                  data: gameData
              }
          });
      }

      // C. TIPE LAIN (Project/Essay) -> Cukup update status
      else {
          await updateDoc(assignRef, {
              status: "active"
          });
      }

      alert("Tugas berhasil disimpan & diterbitkan!");
      router.push(`/teacher/class/${classId}`);

    } catch (error) {
      console.error("Gagal simpan:", error);
      alert("Gagal menyimpan data.");
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
              <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-500">Builder Mode</span>
                 <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                    {assignment?.type === 'game' ? `Game: ${assignment?.gameConfig?.gameType}` : assignment?.type}
                 </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {assignment?.type === 'quiz' && (
                <div className="hidden md:block text-right text-xs text-slate-500 mr-2">
                   <p>Total Soal: <span className="font-bold text-slate-800">{questions.length}</span></p>
                   <p>Total Poin: <span className="font-bold text-slate-800">{questions.reduce((a,b)=>a+(b.points||0),0)}</span></p>
                </div>
            )}
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
        
        {/* --- CASE 1: QUIZ BUILDER --- */}
        {assignment?.type === 'quiz' && (
            <>
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
                            <option value="short-answer">Isian Singkat</option>
                            <option value="true-false">Benar/Salah</option>
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
                      {/* Media Attachment */}
                      {q.mediaUrl ? (
                        <div className="relative mb-4 group/media rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                            <button 
                              onClick={() => removeMedia(qIndex, 'quiz')}
                              className="absolute top-2 right-2 bg-white/80 hover:bg-red-50 text-slate-500 hover:text-red-600 p-1.5 rounded-full shadow-sm z-10 transition-all"
                              title="Hapus Media"
                            >
                              <X size={16} />
                            </button>
                            <img src={q.mediaUrl} alt="Soal Media" className="w-full max-h-80 object-contain mx-auto" />
                        </div>
                      ) : (
                        <div className="flex gap-2 mb-2">
                            {uploadingMedia === q.id ? (
                              <span className="text-xs text-blue-600 flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg animate-pulse">
                                  <Loader2 size={12} className="animate-spin"/> Mengupload...
                              </span>
                            ) : (
                              <button 
                                onClick={() => triggerFileUpload(qIndex, 'quiz', "image")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200 hover:border-blue-200"
                              >
                                <ImageIcon size={14} /> + Gambar
                              </button>
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

                      {/* Options (Multiple Choice) */}
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
                        </div>
                      )}
                      
                      {/* Short Answer Hint */}
                      {q.type === "short-answer" && (
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="text-xs font-bold text-slate-500 uppercase">Kunci Jawaban Singkat</label>
                            <input 
                                placeholder="Masukkan jawaban yang benar..."
                                className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                value={q.correctAnswer as string || ""}
                                onChange={(e) => updateQuestion(qIndex, "correctAnswer", e.target.value)}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Sistem akan mencocokkan jawaban siswa dengan teks ini (case-insensitive).</p>
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
            </>
        )}

        {/* --- CASE 2: GAME BUILDER (Word Scramble) --- */}
        {assignment?.type === 'game' && assignment.gameConfig?.gameType === 'word-scramble' && (
             <div className="space-y-6">
                 <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex items-start gap-4">
                    <Gamepad2 size={32} className="text-purple-600 mt-1" />
                    <div>
                        <h2 className="text-lg font-bold text-purple-900">Konfigurasi Acak Kata</h2>
                        <p className="text-sm text-purple-700 mt-1">
                            Masukkan daftar kata yang harus disusun ulang oleh siswa. Sistem akan mengacak huruf secara otomatis.
                        </p>
                    </div>
                 </div>

                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-12 gap-4 font-bold text-xs text-slate-500 uppercase tracking-wide">
                        <div className="col-span-1 text-center">No</div>
                        <div className="col-span-5">Kata Kunci (Jawaban)</div>
                        <div className="col-span-5">Petunjuk (Hint)</div>
                        <div className="col-span-1"></div>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                        {gameWords.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-4 p-4 items-center group hover:bg-slate-50 transition-colors">
                                <div className="col-span-1 text-center font-bold text-slate-400">{idx + 1}</div>
                                <div className="col-span-5">
                                    <input 
                                        placeholder="Contoh: INDONESIA"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:border-purple-500 outline-none uppercase"
                                        value={item.word}
                                        onChange={(e) => updateWord(idx, 'word', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-5">
                                    <input 
                                        placeholder="Contoh: Negara kita tercinta..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-purple-500 outline-none"
                                        value={item.hint}
                                        onChange={(e) => updateWord(idx, 'hint', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <button 
                                        onClick={() => removeWord(idx)}
                                        className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                         <button 
                            onClick={addWord}
                            className="flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors"
                         >
                            <Plus size={16} /> Tambah Kata Baru
                         </button>
                    </div>
                 </div>
             </div>
        )}

        {/* --- CASE 3: GAME BUILDER (Memory Match & Flashcard) --- */}
        {assignment?.type === 'game' && (assignment.gameConfig?.gameType === 'memory-match' || assignment.gameConfig?.gameType === 'flashcard-challenge') && (
             <div className="space-y-6">
                 <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100 flex items-start gap-4">
                    <Grid size={32} className="text-pink-600 mt-1" />
                    <div>
                        <h2 className="text-lg font-bold text-pink-900">
                            Konfigurasi {assignment.gameConfig?.gameType === 'memory-match' ? 'Memory Match' : 'Flashcards'}
                        </h2>
                        <p className="text-sm text-pink-700 mt-1">
                            Buat pasangan kartu. {assignment.gameConfig?.gameType === 'memory-match' ? 'Siswa harus mencocokkan kartu yang berpasangan.' : 'Siswa akan menghafal sisi depan dan belakang kartu.'}
                        </p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gamePairs.map((pair, idx) => (
                        <div key={pair.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative group">
                            <div className="absolute top-2 right-2 flex gap-2">
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">#{idx + 1}</span>
                                <button 
                                    onClick={() => removePair(idx)}
                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex gap-4 mt-6">
                                {/* FRONT SIDE */}
                                <div className="flex-1 space-y-2">
                                    <div className="text-xs font-bold text-slate-400 uppercase text-center mb-1">Sisi Depan</div>
                                    <div 
                                        className={cn(
                                            "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden",
                                            pair.frontImage ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                                        )}
                                        onClick={() => triggerFileUpload(idx, 'pair_front', 'image')}
                                    >
                                        {pair.frontImage ? (
                                            <>
                                                <img src={pair.frontImage} alt="Front" className="w-full h-full object-cover" />
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); removeMedia(idx, 'pair_front'); }}
                                                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:bg-red-100"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center p-2">
                                                {uploadingMedia === pair.id + 'pair_front' ? (
                                                    <Loader2 size={20} className="animate-spin text-blue-500 mx-auto"/>
                                                ) : (
                                                    <>
                                                        <ImageIcon size={20} className="text-slate-300 mx-auto mb-1"/>
                                                        <span className="text-[10px] text-slate-400">Upload Gambar</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <input 
                                        placeholder="Teks Depan..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-center focus:border-blue-500 outline-none"
                                        value={pair.front}
                                        onChange={(e) => updatePair(idx, 'front', e.target.value)}
                                    />
                                </div>

                                {/* BACK SIDE */}
                                <div className="flex-1 space-y-2">
                                    <div className="text-xs font-bold text-slate-400 uppercase text-center mb-1">Sisi Belakang</div>
                                    <div 
                                        className={cn(
                                            "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden",
                                            pair.backImage ? "border-green-300 bg-green-50" : "border-slate-200 hover:border-green-300 hover:bg-slate-50"
                                        )}
                                        onClick={() => triggerFileUpload(idx, 'pair_back', 'image')}
                                    >
                                        {pair.backImage ? (
                                            <>
                                                <img src={pair.backImage} alt="Back" className="w-full h-full object-cover" />
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); removeMedia(idx, 'pair_back'); }}
                                                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:bg-red-100"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center p-2">
                                                {uploadingMedia === pair.id + 'pair_back' ? (
                                                    <Loader2 size={20} className="animate-spin text-green-500 mx-auto"/>
                                                ) : (
                                                    <>
                                                        <ImageIcon size={20} className="text-slate-300 mx-auto mb-1"/>
                                                        <span className="text-[10px] text-slate-400">Upload Gambar</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <input 
                                        placeholder="Teks Belakang..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-center focus:border-green-500 outline-none"
                                        value={pair.back}
                                        onChange={(e) => updatePair(idx, 'back', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Button */}
                    <button 
                        onClick={addPair}
                        className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center min-h-[200px] hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600 transition-all text-slate-400 gap-2"
                    >
                        <Plus size={32} />
                        <span className="font-bold text-sm">Tambah Kartu</span>
                    </button>
                 </div>
             </div>
        )}

        {/* --- CASE 4: PROJECT / ESSAY INSTRUCTION --- */}
        {(assignment?.type === 'project' || assignment?.type === 'essay') && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
                 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                    <FileText size={32} />
                 </div>
                 <h2 className="text-xl font-bold text-slate-900">Instruksi Tugas</h2>
                 <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
                    Tugas tipe <strong>{assignment.type === 'project' ? 'Proyek' : 'Esai'}</strong> didesain untuk pengumpulan jawaban tunggal (single submission).
                    <br/><br/>
                    Siswa akan melihat instruksi yang sudah Anda tulis di awal dan diminta mengunggah file (PDF/Doc/Gambar) atau menulis jawaban panjang di editor teks.
                 </p>
                 
                 <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-left text-sm text-yellow-800 flex gap-3 mt-6">
                    <Lightbulb size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <strong>Tips:</strong> Jika Anda ingin membuat soal uraian majemuk (Soal 1, Soal 2, dst), silakan gunakan tipe <strong>Kuis</strong> lalu pilih jenis soal "Esai / Uraian".
                    </div>
                 </div>

                 <div className="pt-4">
                    <Button onClick={() => router.back()} variant="outline">
                        Kembali ke Detail Kelas
                    </Button>
                 </div>
            </div>
        )}

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