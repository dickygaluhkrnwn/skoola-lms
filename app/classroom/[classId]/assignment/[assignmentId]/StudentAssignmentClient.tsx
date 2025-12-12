"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Clock, FileText, CheckCircle2, UploadCloud, 
  Send, Loader2, AlertCircle, Music, Image as ImageIcon, X, File
} from "lucide-react";
import { db, auth } from "@/lib/firebase"; 
import { 
  doc, getDoc, collection, getDocs, serverTimestamp, setDoc, query, orderBy 
} from "firebase/firestore";
import { 
  getStorage, ref, uploadBytes, getDownloadURL 
} from "firebase/storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "@/lib/theme-context";

// --- TIPE DATA ---
interface AssignmentData {
  id: string;
  title: string;
  description: string;
  type: "quiz" | "essay" | "upload";
  deadline: any;
  totalPoints?: number;
  questionCount?: number;
}

interface Question {
  id: string;
  text: string;
  type: "multiple-choice" | "essay";
  options?: string[]; // Untuk PG
  points: number;
  mediaUrl?: string;
  mediaType?: "image" | "audio";
}

interface Submission {
  status: "submitted" | "graded" | "late";
  submittedAt: any;
  score?: number;
  feedback?: string;
  answers?: any; // Bisa string (essay), object (quiz map), atau string URL (upload)
  attachmentUrl?: string;
}

interface StudentAssignmentClientProps {
  classId: string;
  assignmentId: string;
}

export default function StudentAssignmentClient({ classId, assignmentId }: StudentAssignmentClientProps) {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  
  // State Pengerjaan
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({}); // Map questionId -> optionIndex
  const [essayAnswer, setEssayAnswer] = useState("");
  const [fileUrl, setFileUrl] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper Theme
  const isKids = theme === "sd";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";
  const isUni = theme === "uni";

  // 1. AUTH & DATA FETCHING
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchData(user.uid);
      } else {
        router.push("/");
      }
    });
    return () => unsubAuth();
  }, [classId, assignmentId, router]);

  const fetchData = async (uid: string) => {
    try {
      // A. Fetch Assignment Detail
      const assignRef = doc(db, "classrooms", classId, "assignments", assignmentId);
      const assignSnap = await getDoc(assignRef);
      
      if (!assignSnap.exists()) {
        alert("Tugas tidak ditemukan!");
        router.back();
        return;
      }
      const assignData = { id: assignSnap.id, ...assignSnap.data() } as AssignmentData;
      setAssignment(assignData);

      // B. Fetch Submission (Cek apakah sudah mengerjakan)
      const subRef = doc(db, "classrooms", classId, "assignments", assignmentId, "submissions", uid);
      const subSnap = await getDoc(subRef);
      if (subSnap.exists()) {
        setSubmission(subSnap.data() as Submission);
      }

      // C. Fetch Questions (Jika tipe Quiz)
      if (assignData.type === "quiz") {
        const qRef = collection(db, "classrooms", classId, "assignments", assignmentId, "questions");
        const qQuery = query(qRef, orderBy("order", "asc"));
        const qSnap = await getDocs(qQuery);
        const qList = qSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Question[];
        setQuestions(qList);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. HANDLER JAWABAN QUIZ
  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    if (submission) return; // Read-only jika sudah submit
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // 3. HANDLER FILE UPLOAD (REAL)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storage = getStorage();
      const fileExt = file.name.split('.').pop();
      // Path: assignments/student_uploads/{assignmentId}/{userId}.{ext}
      const fileName = `assignments/student_uploads/${assignmentId}/${userId}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setFileUrl(downloadURL);
      alert("File berhasil diupload!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Gagal mengupload file. Pastikan koneksi lancar.");
    } finally {
      setIsUploading(false);
    }
  };

  // 4. SUBMIT TUGAS
  const handleSubmit = async () => {
    if (!userId || !assignment) return;
    
    // Validasi sebelum submit
    if (assignment.type === "quiz" && Object.keys(quizAnswers).length < questions.length) {
       if(!confirm("Anda belum menjawab semua soal. Yakin ingin mengumpulkan?")) return;
    }
    if (assignment.type === "upload" && !fileUrl) {
       alert("Harap upload file tugas terlebih dahulu!");
       return;
    }
    if (assignment.type === "essay" && !essayAnswer.trim()) {
       if(!confirm("Jawaban esai masih kosong. Yakin ingin mengumpulkan?")) return;
    }

    if (!confirm("Apakah Anda yakin ingin mengumpulkan tugas ini? Jawaban tidak dapat diubah setelah dikumpulkan.")) return;

    setIsSubmitting(true);
    try {
      let payload: any = {
        studentId: userId,
        studentName: auth.currentUser?.displayName || "Siswa", 
        submittedAt: serverTimestamp(),
        status: "submitted",
      };

      // Format jawaban sesuai tipe tugas
      if (assignment.type === "quiz") {
        payload.answers = quizAnswers;
      } else if (assignment.type === "essay") {
        payload.answers = essayAnswer;
      } else if (assignment.type === "upload") {
        payload.answers = "File uploaded";
        payload.attachmentUrl = fileUrl; 
      }

      const subRef = doc(db, "classrooms", classId, "assignments", assignmentId, "submissions", userId);
      await setDoc(subRef, payload);

      // Update State Lokal (dengan Date lokal agar UI update instan)
      setSubmission({
        ...payload,
        submittedAt: { seconds: Date.now() / 1000 } 
      });

      alert("Tugas berhasil dikumpulkan! Kerja bagus.");
      
    } catch (error) {
      console.error("Gagal submit:", error);
      alert("Gagal mengumpulkan tugas. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className={cn("min-h-screen flex items-center justify-center", isUni ? "bg-slate-950 text-white" : "bg-slate-50 text-blue-600")}>
      <Loader2 className={cn("animate-spin w-8 h-8 mr-2", isUni ? "text-indigo-500" : "")}/> 
      <span>Memuat Tugas...</span>
    </div>
  );

  if (!assignment) return null;

  const isSubmitted = !!submission;
  const isGraded = submission?.status === "graded";

  // Background Styles
  const bgStyle = isKids ? "bg-yellow-50" : isUni ? "bg-slate-950 text-slate-200" : isSMP ? "bg-slate-50/30" : isSMA ? "bg-slate-950 text-slate-100" : "bg-slate-50";

  return (
    <div className={cn("min-h-screen font-sans p-4 md:p-8 pb-24 transition-colors duration-500 relative", bgStyle)}>
      
      {/* BACKGROUND EFFECTS FOR UNI/SMA */}
      {(isUni || isSMA) && (
         <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1121] to-indigo-950 opacity-80" />
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
         </div>
      )}

      {/* HEADER NAV */}
      <div className="max-w-4xl mx-auto mb-6 relative z-10">
        <button 
          onClick={() => router.back()} 
          className={cn("flex items-center gap-2 transition-colors font-medium mb-4", (isUni || isSMA) ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-blue-600")}
        >
          <ArrowLeft size={18} /> Kembali ke Kelas
        </button>

        <div className={cn("p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-all", 
            isUni ? "bg-slate-900/50 backdrop-blur-xl border-white/10" : 
            isSMA ? "bg-white/5 backdrop-blur-xl border-white/10" :
            "bg-white border-slate-200"
        )}>
           {/* Status Badge */}
           <div className="absolute top-6 right-6">
              {isGraded ? (
                 <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-purple-200">
                    <CheckCircle2 size={14} /> Dinilai: {submission?.score}/100
                 </span>
              ) : isSubmitted ? (
                 <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-200">
                    <CheckCircle2 size={14} /> Sudah Dikumpulkan
                 </span>
              ) : (
                 <span className={cn("px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border", 
                    (isUni || isSMA) ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200"
                 )}>
                    <Clock size={14} /> Belum Dikerjakan
                 </span>
              )}
           </div>

           <div className="pr-32">
              <h1 className={cn("text-2xl font-bold mb-2", (isUni || isSMA) ? "text-white" : "text-slate-900")}>{assignment.title}</h1>
              <div className={cn("flex items-center gap-4 text-sm mb-4", (isUni || isSMA) ? "text-slate-400" : "text-slate-500")}>
                 <span className={cn("flex items-center gap-1 px-2 py-1 rounded border", (isUni || isSMA) ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100")}>
                    <FileText size={14} /> {assignment.type === 'quiz' ? 'Kuis PG' : assignment.type === 'essay' ? 'Esai' : 'Upload File'}
                 </span>
                 {assignment.deadline && (
                    <span className={cn("flex items-center gap-1 font-medium px-2 py-1 rounded border", 
                       (isUni || isSMA) ? "text-rose-400 bg-rose-950/30 border-rose-900/50" : "text-red-500 bg-red-50 border-red-100"
                    )}>
                       <Clock size={14} /> Deadline: {new Date(assignment.deadline.seconds * 1000).toLocaleDateString()}
                    </span>
                 )}
              </div>
              <div className={cn("prose prose-sm max-w-none p-4 rounded-xl border", 
                 isUni ? "text-slate-300 bg-slate-950/50 border-white/5" : 
                 isSMA ? "text-slate-300 bg-white/5 border-white/5" :
                 "text-slate-600 bg-slate-50 border-slate-100"
              )}>
                 <p>{assignment.description || "Tidak ada instruksi khusus."}</p>
              </div>
           </div>
        </div>
      </div>

      {/* FEEDBACK GURU (JIKA ADA) */}
      {isGraded && submission?.feedback && (
         <div className={cn("max-w-4xl mx-auto mb-6 border p-6 rounded-2xl shadow-sm relative z-10", 
             (isUni || isSMA) ? "bg-purple-900/20 border-purple-800/50" : "bg-purple-50 border-purple-200"
         )}>
            <h3 className={cn("font-bold flex items-center gap-2 mb-2", (isUni || isSMA) ? "text-purple-300" : "text-purple-800")}>
               <AlertCircle size={18} /> Umpan Balik Guru
            </h3>
            <p className={cn("text-sm", (isUni || isSMA) ? "text-purple-200" : "text-purple-700")}>{submission.feedback}</p>
         </div>
      )}

      {/* MAIN CONTENT: WORKSPACE */}
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
         
         {/* TIPE 1: KUIS PILIHAN GANDA */}
         {assignment.type === "quiz" && (
            <div className="space-y-4">
               {questions.map((q, idx) => (
                  <div key={q.id} className={cn("p-6 rounded-2xl border shadow-sm transition-all", 
                      isUni ? "bg-slate-900/60 border-white/10" : 
                      isSMA ? "bg-white/5 border-white/10" :
                      "bg-white border-slate-200"
                  )}>
                      <div className="flex gap-4">
                         <span className={cn("flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm h-fit", 
                             (isUni || isSMA) ? "bg-indigo-500/20 text-indigo-300" : "bg-blue-100 text-blue-600"
                         )}>
                            {idx + 1}
                         </span>
                         <div className="flex-1">
                            {/* Media Soal */}
                            {q.mediaUrl && (
                               <div className={cn("mb-4 rounded-xl overflow-hidden border", (isUni || isSMA) ? "border-white/10 bg-black/20" : "border-slate-100 bg-slate-50")}>
                                  {q.mediaType === 'image' ? (
                                     <img src={q.mediaUrl} alt="Soal" className="w-full max-h-64 object-contain mx-auto" />
                                  ) : (
                                     <div className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                                           <Music size={20} />
                                        </div>
                                        <audio controls src={q.mediaUrl} className="w-full max-w-sm" />
                                     </div>
                                  )}
                               </div>
                            )}

                            <p className={cn("font-medium text-lg mb-4", (isUni || isSMA) ? "text-slate-200" : "text-slate-800")}>{q.text}</p>
                            
                            {/* Opsi Jawaban */}
                            <div className="space-y-3">
                               {q.options?.map((opt, optIdx) => {
                                  const savedAnswer = submission?.answers?.[q.id];
                                  const currentAnswer = quizAnswers[q.id];
                                  const isSelected = isSubmitted ? savedAnswer === optIdx : currentAnswer === optIdx;
                                  
                                  return (
                                     <div 
                                        key={optIdx}
                                        onClick={() => !isSubmitted && handleOptionSelect(q.id, optIdx)}
                                        className={cn(
                                           "p-4 rounded-xl border-2 transition-all flex items-center gap-3",
                                           !isSubmitted && "cursor-pointer",
                                           isSelected 
                                              ? ((isUni || isSMA) ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-blue-500 bg-blue-50 text-blue-700") 
                                              : ((isUni || isSMA) ? "border-white/10 bg-white/5 text-slate-300 hover:border-white/20" : "border-slate-100 bg-slate-50 hover:border-blue-200")
                                        )}
                                     >
                                        <div className={cn(
                                           "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                           isSelected ? ((isUni || isSMA) ? "border-indigo-500" : "border-blue-500") : ((isUni || isSMA) ? "border-slate-600" : "border-slate-300")
                                        )}>
                                           {isSelected && <div className={cn("w-2.5 h-2.5 rounded-full", (isUni || isSMA) ? "bg-indigo-500" : "bg-blue-500")} />}
                                        </div>
                                        <span className="font-medium">{opt}</span>
                                     </div>
                                  )
                               })}
                            </div>
                         </div>
                      </div>
                  </div>
               ))}
            </div>
         )}

         {/* TIPE 2: ESAI / URAIAN */}
         {assignment.type === "essay" && (
            <div className={cn("p-6 rounded-2xl border shadow-sm", (isUni || isSMA) ? "bg-slate-900/60 border-white/10" : "bg-white border-slate-200")}>
               <h3 className={cn("font-bold mb-3", (isUni || isSMA) ? "text-slate-200" : "text-slate-800")}>Jawaban Anda</h3>
               <textarea 
                  disabled={isSubmitted}
                  className={cn(
                      "w-full min-h-[300px] p-4 rounded-xl border-2 outline-none transition-all leading-relaxed resize-y",
                      (isUni || isSMA) 
                        ? "bg-black/20 border-white/10 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-600 disabled:opacity-50" 
                        : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-700 disabled:bg-slate-50 disabled:text-slate-500"
                  )}
                  placeholder="Tulis jawaban Anda di sini..."
                  value={isSubmitted ? (submission?.answers as string) : essayAnswer}
                  onChange={(e) => setEssayAnswer(e.target.value)}
               />
            </div>
         )}

         {/* TIPE 3: UPLOAD FILE */}
         {assignment.type === "upload" && (
            <div className={cn("p-8 rounded-2xl border shadow-sm text-center", (isUni || isSMA) ? "bg-slate-900/60 border-white/10" : "bg-white border-slate-200")}>
               <div className="max-w-md mx-auto">
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6", 
                      (isUni || isSMA) ? "bg-indigo-500/20 text-indigo-400" : "bg-blue-50 text-blue-500"
                  )}>
                     <UploadCloud size={40} />
                  </div>
                  <h3 className={cn("font-bold mb-2", (isUni || isSMA) ? "text-slate-200" : "text-slate-800")}>Upload Tugas Anda</h3>
                  <p className={cn("text-sm mb-6", (isUni || isSMA) ? "text-slate-400" : "text-slate-500")}>
                     Format yang didukung: PDF, DOCX, JPG, PNG. Maksimal 10MB.
                  </p>
                  
                  {/* Area Upload */}
                  {!isSubmitted ? (
                     <div className="space-y-4">
                        <div className={cn("p-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer", 
                            (isUni || isSMA) ? "border-slate-700 hover:bg-white/5" : "border-slate-300 hover:bg-slate-50"
                        )} onClick={() => fileInputRef.current?.click()}>
                           {isUploading ? (
                              <div className="flex flex-col items-center gap-2 text-blue-600">
                                 <Loader2 className="animate-spin" />
                                 <span className="text-sm font-bold">Mengupload...</span>
                              </div>
                           ) : fileUrl ? (
                              <div className="flex flex-col items-center gap-2 text-green-600">
                                 <CheckCircle2 size={32} />
                                 <span className="text-sm font-bold">File Siap Dikirim</span>
                                 <span className="text-xs text-slate-400 break-all">{fileUrl}</span>
                                 <Button variant="ghost" size="sm" onClick={(e) => {e.stopPropagation(); setFileUrl("");}} className="mt-2 text-red-500 hover:text-red-600">
                                    Ganti File
                                 </Button>
                              </div>
                           ) : (
                              <div className={cn((isUni || isSMA) ? "text-slate-500" : "text-slate-400")}>
                                 <p className="text-sm font-bold">Klik untuk pilih file</p>
                              </div>
                           )}
                        </div>
                        <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           onChange={handleFileChange}
                           accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                        />
                     </div>
                  ) : (
                     <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-green-700 font-bold">
                        <div className="flex items-center gap-2">
                           <CheckCircle2 size={20} />
                           File Berhasil Diupload
                        </div>
                        {submission?.attachmentUrl && (
                           <a href={submission.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs underline hover:text-green-900 font-normal">
                              Lihat File Saya
                           </a>
                        )}
                     </div>
                  )}
               </div>
            </div>
         )}

      </div>

      {/* FOOTER ACTION BAR */}
      {!isSubmitted && (
         <div className={cn("fixed bottom-0 left-0 right-0 p-4 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 backdrop-blur-md", 
             (isUni || isSMA) ? "bg-slate-950/80 border-white/10" : "bg-white border-slate-200"
         )}>
            <div className="max-w-4xl mx-auto flex justify-between items-center">
               <p className={cn("text-sm hidden md:block", (isUni || isSMA) ? "text-slate-400" : "text-slate-500")}>
                  Pastikan semua jawaban sudah terisi sebelum mengumpulkan.
               </p>
               <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || isUploading}
                  className={cn(
                      "w-full md:w-auto px-8 py-6 rounded-xl text-lg font-bold transition-transform active:scale-95",
                      (isUni || isSMA) ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                  )}
               >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2" size={20} />}
                  Kumpulkan Tugas
               </Button>
            </div>
         </div>
      )}

    </div>
  );
}