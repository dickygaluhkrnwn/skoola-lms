"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Clock, FileText, CheckCircle2, UploadCloud, 
  Send, Loader2, AlertCircle, FileCheck, X 
} from "lucide-react";
import { db, auth } from "@/lib/firebase"; 
import { 
  doc, getDoc, collection, addDoc, getDocs, serverTimestamp, setDoc, query, orderBy 
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";

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

// Pastikan export default function ada di sini
export default function StudentAssignmentClient({ classId, assignmentId }: StudentAssignmentClientProps) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  
  // State Pengerjaan
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({}); // Map questionId -> optionIndex
  const [essayAnswer, setEssayAnswer] = useState("");
  const [fileUrl, setFileUrl] = useState(""); // Simulasi URL file
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 3. SUBMIT TUGAS
  const handleSubmit = async () => {
    if (!userId || !assignment) return;
    
    if (!confirm("Apakah Anda yakin ingin mengumpulkan tugas ini? Jawaban tidak dapat diubah setelah dikumpulkan.")) return;

    setIsSubmitting(true);
    try {
      let payload: any = {
        studentId: userId,
        studentName: auth.currentUser?.displayName || "Siswa", // Fallback name
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
        payload.attachmentUrl = fileUrl; // Simulasi link file
      }

      const subRef = doc(db, "classrooms", classId, "assignments", assignmentId, "submissions", userId);
      await setDoc(subRef, payload);

      // Update State Lokal
      setSubmission({
        ...payload,
        submittedAt: new Date() // Placeholder untuk UI langsung update
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-600">
      <Loader2 className="animate-spin w-8 h-8 mr-2"/> 
      <span>Memuat Tugas...</span>
    </div>
  );

  if (!assignment) return null;

  const isSubmitted = !!submission;
  const isGraded = submission?.status === "graded";

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 pb-24">
      
      {/* HEADER NAV */}
      <div className="max-w-4xl mx-auto mb-6">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium mb-4"
        >
          <ArrowLeft size={18} /> Kembali ke Kelas
        </button>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
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
                 <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-slate-200">
                    <Clock size={14} /> Belum Dikerjakan
                 </span>
              )}
           </div>

           <div className="pr-32">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{assignment.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                 <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    <FileText size={14} /> {assignment.type === 'quiz' ? 'Kuis PG' : assignment.type === 'essay' ? 'Esai' : 'Upload File'}
                 </span>
                 {assignment.deadline && (
                    <span className="flex items-center gap-1 text-red-500 font-medium bg-red-50 px-2 py-1 rounded border border-red-100">
                       <Clock size={14} /> Deadline: {new Date(assignment.deadline.seconds * 1000).toLocaleDateString()}
                    </span>
                 )}
              </div>
              <div className="prose prose-sm text-slate-600 max-w-none bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <p>{assignment.description || "Tidak ada instruksi khusus."}</p>
              </div>
           </div>
        </div>
      </div>

      {/* FEEDBACK GURU (JIKA ADA) */}
      {isGraded && submission?.feedback && (
         <div className="max-w-4xl mx-auto mb-6 bg-purple-50 border border-purple-200 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-purple-800 flex items-center gap-2 mb-2">
               <AlertCircle size={18} /> Umpan Balik Guru
            </h3>
            <p className="text-purple-700 text-sm">{submission.feedback}</p>
         </div>
      )}

      {/* MAIN CONTENT: WORKSPACE */}
      <div className="max-w-4xl mx-auto space-y-6">
         
         {/* TIPE 1: KUIS PILIHAN GANDA */}
         {assignment.type === "quiz" && (
            <div className="space-y-4">
               {questions.map((q, idx) => (
                  <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                     <div className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                           {idx + 1}
                        </span>
                        <div className="flex-1">
                           <p className="font-medium text-slate-800 text-lg mb-4">{q.text}</p>
                           
                           {/* Opsi Jawaban */}
                           <div className="space-y-3">
                              {q.options?.map((opt, optIdx) => {
                                 const isSelected = quizAnswers[q.id] === optIdx;
                                 return (
                                    <div 
                                       key={optIdx}
                                       onClick={() => !isSubmitted && handleOptionSelect(q.id, optIdx)}
                                       className={cn(
                                          "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3",
                                          isSelected 
                                             ? "border-blue-500 bg-blue-50 text-blue-700" 
                                             : "border-slate-100 hover:border-blue-200 bg-slate-50",
                                          isSubmitted && "cursor-default opacity-80" // Disable if submitted
                                       )}
                                    >
                                       <div className={cn(
                                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                          isSelected ? "border-blue-500" : "border-slate-300"
                                       )}>
                                          {isSelected && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
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
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-3">Jawaban Anda</h3>
               <textarea 
                  disabled={isSubmitted}
                  className="w-full min-h-[300px] p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-700 leading-relaxed resize-y disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="Tulis jawaban Anda di sini..."
                  value={isSubmitted ? (submission?.answers as string) : essayAnswer}
                  onChange={(e) => setEssayAnswer(e.target.value)}
               />
            </div>
         )}

         {/* TIPE 3: UPLOAD FILE */}
         {assignment.type === "upload" && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
               <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                     <UploadCloud size={40} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Upload Tugas Anda</h3>
                  <p className="text-slate-500 text-sm mb-6">
                     Format yang didukung: PDF, DOCX, JPG, PNG. Maksimal 10MB.
                  </p>
                  
                  {/* Simulasi Input File / Link */}
                  {!isSubmitted ? (
                     <div className="space-y-4">
                        <input 
                           type="text" 
                           placeholder="[SIMULASI] Tempel Link File (Google Drive/Dropbox)"
                           className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-center"
                           value={fileUrl}
                           onChange={(e) => setFileUrl(e.target.value)}
                        />
                        <Button className="w-full bg-slate-900 text-white" disabled>
                           Pilih File (Demo Disabled)
                        </Button>
                     </div>
                  ) : (
                     <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-center gap-2 text-green-700 font-bold">
                        <CheckCircle2 size={20} />
                        File Berhasil Diupload
                     </div>
                  )}
               </div>
            </div>
         )}

      </div>

      {/* FOOTER ACTION BAR */}
      {!isSubmitted && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
               <p className="text-sm text-slate-500 hidden md:block">
                  Pastikan semua jawaban sudah terisi sebelum mengumpulkan.
               </p>
               <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg font-bold shadow-lg shadow-blue-200 transition-transform active:scale-95"
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