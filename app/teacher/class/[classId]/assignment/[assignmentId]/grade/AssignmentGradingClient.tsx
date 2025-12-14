"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Search, CheckCircle2, 
  XCircle, Clock, FileText, ChevronRight, Save, Loader2, User, ChevronLeft,
  Gamepad2, Trophy, AlertCircle, Maximize2, Minimize2
} from "lucide-react";
// Import firebase dari path yang benar (relatif terhadap file ini)
import { db } from "../../../../../../../lib/firebase"; 
import { 
  doc, getDoc, collection, getDocs, serverTimestamp, setDoc, updateDoc, increment 
} from "firebase/firestore";
import { Button } from "../../../../../../../components/ui/button";
import { cn } from "../../../../../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AssignmentType } from "../../../../../../../lib/types/course.types";

// --- TIPE DATA ---
interface Student {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

interface Submission {
  studentId: string;
  submittedAt: any;
  status: "submitted" | "graded" | "late";
  score?: number;
  feedback?: string;
  // Struktur jawaban fleksibel
  answers?: any; 
  attachmentUrl?: string; 
  gameStats?: { score: number, time: string, completedLevels: number }; // Khusus game
}

interface AssignmentData {
  title: string;
  type: AssignmentType;
  totalPoints?: number;
  questionsCount?: number;
}

interface AssignmentGradingClientProps {
  classId: string;
  assignmentId: string;
}

export default function AssignmentGradingClient({ classId, assignmentId }: AssignmentGradingClientProps) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({}); // Map by studentId
  
  // Selection & Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<number | string>("");
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter State
  const [filterStatus, setFilterStatus] = useState<"all" | "submitted" | "graded" | "missing">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. FETCH DATA
  useEffect(() => {
    const initData = async () => {
      try {
        // A. Fetch Assignment Detail
        const assignSnap = await getDoc(doc(db, "classrooms", classId, "assignments", assignmentId));
        if (assignSnap.exists()) {
          setAssignment(assignSnap.data() as AssignmentData);
        }

        // B. Fetch Class Roster (Daftar Murid)
        const classSnap = await getDoc(doc(db, "classrooms", classId));
        if (classSnap.exists()) {
          const studentIds = classSnap.data().students || [];
          if (studentIds.length > 0) {
            const studentPromises = studentIds.map(async (uid: string) => {
              const uSnap = await getDoc(doc(db, "users", uid));
              return uSnap.exists() ? { uid: uSnap.id, ...uSnap.data() } : null;
            });
            const sData = await Promise.all(studentPromises);
            const validStudents = sData.filter((s): s is Student => s !== null);
            setStudents(validStudents);
            
            // Auto-select first student if available
            if (validStudents.length > 0) {
                // Optional: setSelectedStudentId(validStudents[0].uid);
            }
          }
        }

        // C. Fetch Submissions (Pengumpulan)
        const subColl = collection(db, "classrooms", classId, "assignments", assignmentId, "submissions");
        const subSnap = await getDocs(subColl);
        
        const subMap: Record<string, Submission> = {};
        subSnap.forEach(doc => {
          subMap[doc.id] = doc.data() as Submission;
        });
        setSubmissions(subMap);

      } catch (error) {
        console.error("Error init grading:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [classId, assignmentId]);

  // 2. HANDLE SELECTION CHANGE
  useEffect(() => {
    if (selectedStudentId) {
      const sub = submissions[selectedStudentId];
      // Jika tipe Kuis/Game dan sudah ada skor otomatis, pre-fill nilai
      if (sub) {
          setGradeScore(sub.score ?? "");
          setFeedback(sub.feedback ?? "");
      } else {
          setGradeScore("");
          setFeedback("");
      }
    }
  }, [selectedStudentId, submissions]);

  // 3. SAVE GRADE & UPDATE XP
  const handleSaveGrade = async (nextStudentId?: string | null) => {
    if (!selectedStudentId) return;
    setIsSaving(true);

    try {
      const scoreVal = Number(gradeScore);
      const maxPoints = assignment?.totalPoints || 100;

      // Validasi Nilai
      if (scoreVal < 0 || scoreVal > maxPoints) {
         alert(`Nilai harus antara 0 - ${maxPoints}`);
         setIsSaving(false);
         return;
      }

      const subRef = doc(db, "classrooms", classId, "assignments", assignmentId, "submissions", selectedStudentId);
      
      // A. Update Submission Doc
      await setDoc(subRef, {
        studentId: selectedStudentId,
        // studentName: ... (Optional redundancy)
        score: scoreVal,
        feedback: feedback,
        status: "graded",
        gradedAt: serverTimestamp()
      }, { merge: true });

      // B. UPDATE GAMIFICATION (XP)
      // Hanya tambah XP jika status sebelumnya belum 'graded' (agar tidak double XP saat edit nilai)
      const prevStatus = submissions[selectedStudentId]?.status;
      if (prevStatus !== 'graded') {
         const userRef = doc(db, "users", selectedStudentId);
         // Rumus XP: Nilai Tugas = XP yang didapat (Bisa disesuaikan)
         await updateDoc(userRef, {
            xp: increment(scoreVal),
            // Bisa tambah level up logic di sini atau via Cloud Functions
         });
      }

      // Update State Lokal
      setSubmissions(prev => ({
        ...prev,
        [selectedStudentId]: {
          ...prev[selectedStudentId],
          status: "graded",
          score: scoreVal,
          feedback: feedback
        }
      }));

      // Navigasi ke Siswa Berikutnya
      if (nextStudentId) {
         setSelectedStudentId(nextStudentId);
      } else {
         // alert("Nilai berhasil disimpan!");
      }

    } catch (error) {
      console.error("Gagal simpan nilai:", error);
      alert("Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredStudents = students.filter(student => {
    const sub = submissions[student.uid];
    const status = sub ? sub.status : "missing";
    const matchSearch = student.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === "all") return matchSearch;
    if (filterStatus === "missing") return !sub && matchSearch;
    // Handle 'submitted' filter to show both submitted and graded for easier flow, or strictly submitted
    if (filterStatus === "submitted") return (status === "submitted" || status === "late") && matchSearch; 
    return status === filterStatus && matchSearch;
  });

  // --- NAVIGATION LOGIC ---
  const currentIndex = selectedStudentId ? filteredStudents.findIndex(s => s.uid === selectedStudentId) : -1;
  const nextStudent = currentIndex >= 0 && currentIndex < filteredStudents.length - 1 ? filteredStudents[currentIndex + 1] : null;
  const prevStudent = currentIndex > 0 ? filteredStudents[currentIndex - 1] : null;

  const selectedStudent = students.find(s => s.uid === selectedStudentId);
  const selectedSubmission = selectedStudentId ? submissions[selectedStudentId] : null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-purple-600">
      <Loader2 className="animate-spin w-8 h-8 mr-2"/> 
      <span>Memuat Data Penilaian...</span>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 z-20">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
               <ArrowLeft size={20} />
            </button>
            <div>
               <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  {assignment?.title}
                  <span className="text-xs font-normal bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                     {assignment?.type}
                  </span>
               </h1>
               <p className="text-xs text-slate-500">
                  Total Poin: <strong>{assignment?.totalPoints || 100}</strong> • {filteredStudents.length} Siswa
               </p>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <div className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-lg">
               {['all', 'submitted', 'graded', 'missing'].map((f) => (
                  <button
                     key={f}
                     onClick={() => setFilterStatus(f as any)}
                     className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-md transition-all capitalize",
                        filterStatus === f ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                     )}
                  >
                     {f}
                  </button>
               ))}
            </div>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input 
                  placeholder="Cari siswa..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-purple-500 border rounded-lg text-sm outline-none w-48 transition-all"
               />
            </div>
         </div>
      </header>

      {/* MAIN CONTENT SPLIT VIEW */}
      <div className="flex flex-1 overflow-hidden">
         
         {/* LEFT PANEL: STUDENT LIST */}
         <aside className={cn(
            "w-80 bg-white border-r border-slate-200 overflow-y-auto transition-all duration-300 flex-shrink-0",
            isFullscreen ? "-ml-80" : "ml-0" // Hide when fullscreen
         )}>
            {filteredStudents.map(student => {
               const sub = submissions[student.uid];
               const isSelected = selectedStudentId === student.uid;
               const status = sub?.status || 'missing';

               return (
                  <div 
                     key={student.uid}
                     onClick={() => setSelectedStudentId(student.uid)}
                     className={cn(
                        "p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between group",
                        isSelected ? "bg-purple-50 border-purple-100" : ""
                     )}
                  >
                     <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-500">
                           {student.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover"/> : <User size={18}/>}
                        </div>
                        <div className="min-w-0">
                           <p className={cn("text-sm font-bold truncate", isSelected ? "text-purple-700" : "text-slate-700")}>
                              {student.displayName}
                           </p>
                           <p className="text-xs text-slate-400 truncate">{student.email}</p>
                        </div>
                     </div>

                     <div className="flex flex-col items-end gap-1">
                        {status === 'graded' ? (
                           <span className="text-sm font-bold text-purple-600">{sub.score}</span>
                        ) : status === 'submitted' ? (
                           <div className="w-2.5 h-2.5 rounded-full bg-green-500" title="Perlu Dinilai"/>
                        ) : (
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-300" title="Belum Submit"/>
                        )}
                        {isSelected && <ChevronRight size={14} className="text-purple-400"/>}
                     </div>
                  </div>
               );
            })}
            {filteredStudents.length === 0 && (
               <div className="p-8 text-center text-slate-400 text-sm">
                  Tidak ada siswa.
               </div>
            )}
         </aside>

         {/* RIGHT PANEL: GRADING AREA */}
         <main className="flex-1 bg-slate-50/50 flex flex-col relative overflow-hidden">
            {selectedStudent ? (
               <>
                  {/* Grading Header Toolbar */}
                  <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
                     <div className="flex items-center gap-3">
                        <h2 className="font-bold text-slate-800">{selectedStudent.displayName}</h2>
                        {selectedSubmission?.status === 'submitted' && (
                           <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">Siap Dinilai</span>
                        )}
                        {selectedSubmission?.status === 'graded' && (
                           <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">Selesai</span>
                        )}
                        {!selectedSubmission && (
                           <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">Belum Mengumpulkan</span>
                        )}
                     </div>
                     <div className="flex items-center gap-2">
                        <Button 
                           variant="ghost" size="sm" 
                           onClick={() => setIsFullscreen(!isFullscreen)}
                           className="text-slate-500"
                           title="Toggle Fullscreen"
                        >
                           {isFullscreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                        </Button>
                        <div className="h-6 w-px bg-slate-200 mx-1"></div>
                        <Button 
                           variant="outline" size="sm" 
                           disabled={!prevStudent}
                           onClick={() => setSelectedStudentId(prevStudent?.uid!)}
                        >
                           <ChevronLeft size={16}/>
                        </Button>
                        <Button 
                           variant="outline" size="sm" 
                           disabled={!nextStudent}
                           onClick={() => setSelectedStudentId(nextStudent?.uid!)}
                        >
                           <ChevronRight size={16}/>
                        </Button>
                     </div>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                     {/* 1. STUDENT WORK PREVIEW */}
                     <div className="flex-1 p-6 overflow-y-auto">
                        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[500px]">
                           {selectedSubmission ? (
                              <div className="space-y-6">
                                 {/* Submission Metadata */}
                                 <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-100 pb-4">
                                    <Clock size={16}/> 
                                    Diserahkan pada: {new Date(selectedSubmission.submittedAt.seconds * 1000).toLocaleString('id-ID')}
                                    {selectedSubmission.status === 'late' && <span className="text-red-500 font-bold">(Terlambat)</span>}
                                 </div>

                                 {/* --- CONTENT RENDERER BASED ON TYPE --- */}
                                 
                                 {/* TYPE: QUIZ */}
                                 {assignment?.type === 'quiz' && Array.isArray(selectedSubmission.answers) && (
                                    <div className="space-y-4">
                                       {selectedSubmission.answers.map((ans: any, idx: number) => (
                                          <div key={idx} className={cn("p-4 rounded-xl border flex gap-3", ans.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                                             <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs", ans.isCorrect ? "bg-green-500" : "bg-red-500")}>
                                                {idx + 1}
                                             </div>
                                             <div>
                                                <p className="text-sm font-bold text-slate-700 mb-1">Jawaban Siswa: {ans.answer}</p>
                                                <p className={cn("text-xs font-bold", ans.isCorrect ? "text-green-600" : "text-red-600")}>
                                                   {ans.isCorrect ? "Benar" : "Salah"}
                                                </p>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 )}

                                 {/* TYPE: GAME */}
                                 {assignment?.type === 'game' && (
                                    <div className="text-center py-10">
                                       <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto text-purple-600 mb-4">
                                          <Gamepad2 size={40}/>
                                       </div>
                                       <h3 className="text-2xl font-bold text-slate-800">{selectedSubmission.answers?.score || 0} Poin</h3>
                                       <p className="text-slate-500">Waktu: {selectedSubmission.answers?.time || '-'}</p>
                                    </div>
                                 )}

                                 {/* TYPE: ESSAY / FILE */}
                                 {(assignment?.type === 'essay' || assignment?.type === 'project') && (
                                    <div className="space-y-6">
                                       {selectedSubmission.attachmentUrl && (
                                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                                             <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><FileText size={20}/></div>
                                                <div>
                                                   <p className="font-bold text-slate-700 text-sm">Lampiran File</p>
                                                   <p className="text-xs text-slate-500">Klik tombol untuk melihat</p>
                                                </div>
                                             </div>
                                             <Button size="sm" variant="outline" onClick={() => window.open(selectedSubmission.attachmentUrl, '_blank')}>
                                                Buka File
                                             </Button>
                                          </div>
                                       )}
                                       
                                       {typeof selectedSubmission.answers === 'string' && (
                                          <div className="prose prose-slate max-w-none">
                                             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Jawaban Teks:</h4>
                                             <p className="whitespace-pre-wrap leading-relaxed text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                {selectedSubmission.answers}
                                             </p>
                                          </div>
                                       )}
                                    </div>
                                 )}

                              </div>
                           ) : (
                              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                                 <AlertCircle size={48} className="mb-4 opacity-20"/>
                                 <p>Siswa belum mengumpulkan tugas ini.</p>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* 2. GRADING SIDEBAR */}
                     <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col shadow-xl z-20">
                        <div className="flex-1 space-y-6">
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Nilai</label>
                              <div className="relative">
                                 <input 
                                    type="number" min="0" max={assignment?.totalPoints || 100}
                                    placeholder="0"
                                    className="w-full text-5xl font-bold text-purple-700 p-6 rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-center bg-slate-50 focus:bg-white"
                                    value={gradeScore}
                                    onChange={e => setGradeScore(e.target.value)}
                                 />
                                 <span className="absolute right-4 bottom-4 text-xs font-bold text-slate-400">/{assignment?.totalPoints || 100}</span>
                              </div>
                           </div>

                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Umpan Balik</label>
                              <textarea 
                                 placeholder="Berikan saran atau komentar..."
                                 className="w-full p-4 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all min-h-[120px] text-sm resize-none bg-slate-50 focus:bg-white"
                                 value={feedback}
                                 onChange={e => setFeedback(e.target.value)}
                              />
                           </div>
                        </div>

                        <div className="pt-6 mt-auto">
                           <Button 
                              onClick={() => handleSaveGrade(nextStudent?.uid)} 
                              disabled={isSaving} 
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 shadow-lg shadow-purple-200 font-bold"
                           >
                              {isSaving ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <Save size={18} className="mr-2"/>}
                              Simpan & Lanjut
                           </Button>
                           <p className="text-center text-xs text-slate-400 mt-2">
                              Otomatis menambah XP ke siswa
                           </p>
                        </div>
                     </div>
                  </div>
               </>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-500">
                     <User size={32}/>
                  </div>
                  <p className="font-medium text-slate-600">Pilih siswa di sebelah kiri</p>
                  <p className="text-sm">untuk mulai memberikan penilaian.</p>
               </div>
            )}
         </main>
      </div>
    </div>
  );
}