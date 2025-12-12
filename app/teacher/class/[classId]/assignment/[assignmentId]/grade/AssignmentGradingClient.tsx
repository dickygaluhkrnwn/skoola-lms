"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Search, CheckCircle2, 
  XCircle, Clock, FileText, ChevronRight, Save, Loader2, User, ChevronLeft,
  Gamepad2
} from "lucide-react";
// Import firebase dari path yang benar (relatif terhadap file ini)
import { db } from "../../../../../../../lib/firebase"; 
import { 
  doc, getDoc, collection, getDocs, serverTimestamp, setDoc 
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
  answers?: any; // Bisa string (essay), array object (quiz), atau game stats
  attachmentUrl?: string; // Jika tipe upload file
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
  
  // State Grading Modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [gradeScore, setGradeScore] = useState<number | string>("");
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
            // Ambil detail profil tiap murid
            const studentPromises = studentIds.map(async (uid: string) => {
              const uSnap = await getDoc(doc(db, "users", uid));
              return uSnap.exists() ? { uid: uSnap.id, ...uSnap.data() } : null;
            });
            const sData = await Promise.all(studentPromises);
            setStudents(sData.filter((s): s is Student => s !== null));
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

  // 2. OPEN GRADING MODAL
  const handleOpenGrading = (student: Student) => {
    setSelectedStudent(student);
    const sub = submissions[student.uid];
    setGradeScore(sub?.score ?? ""); // Isi nilai jika sudah ada
    setFeedback(sub?.feedback ?? ""); // Isi feedback jika sudah ada
  };

  // 3. SAVE GRADE
  const handleSaveGrade = async (nextStudent?: Student | null) => {
    if (!selectedStudent) return;
    setIsSaving(true);

    try {
      const scoreVal = Number(gradeScore);
      // Validasi Nilai
      if (scoreVal < 0 || scoreVal > (assignment?.totalPoints || 100)) {
         alert(`Nilai harus antara 0 - ${assignment?.totalPoints || 100}`);
         setIsSaving(false);
         return;
      }

      const subRef = doc(db, "classrooms", classId, "assignments", assignmentId, "submissions", selectedStudent.uid);
      
      // Update atau Create Submission Doc
      await setDoc(subRef, {
        studentId: selectedStudent.uid,
        studentName: selectedStudent.displayName,
        score: scoreVal,
        feedback: feedback,
        status: "graded",
        gradedAt: serverTimestamp()
      }, { merge: true });

      // Update State Lokal
      setSubmissions(prev => ({
        ...prev,
        [selectedStudent.uid]: {
          ...prev[selectedStudent.uid],
          status: "graded",
          score: scoreVal,
          feedback: feedback
        }
      }));

      // Navigasi ke Siswa Berikutnya (Optional)
      if (nextStudent) {
         handleOpenGrading(nextStudent);
      } else {
         alert("Nilai berhasil disimpan!");
         setSelectedStudent(null); // Tutup modal
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
    return status === filterStatus && matchSearch;
  });

  // --- NEXT / PREV STUDENT LOGIC ---
  const currentIndex = selectedStudent ? filteredStudents.findIndex(s => s.uid === selectedStudent.uid) : -1;
  const nextStudent = currentIndex >= 0 && currentIndex < filteredStudents.length - 1 ? filteredStudents[currentIndex + 1] : null;
  const prevStudent = currentIndex > 0 ? filteredStudents[currentIndex - 1] : null;


  // --- DEV TOOL: SIMULASI SUBMIT ---
  const simulateSubmission = async (student: Student) => {
    if(!confirm(`Simulasikan ${student.displayName} mengumpulkan tugas?`)) return;
    
    const subRef = doc(db, "classrooms", classId, "assignments", assignmentId, "submissions", student.uid);
    
    // Payload simulasi berdasarkan tipe
    let dummyPayload: any = {
      studentId: student.uid,
      studentName: student.displayName,
      submittedAt: serverTimestamp(),
      status: "submitted",
    };

    if (assignment?.type === 'quiz') {
        dummyPayload.answers = [
            { questionId: "1", answer: "A", isCorrect: true },
            { questionId: "2", answer: "C", isCorrect: false },
        ];
        dummyPayload.score = 50; // Auto graded score usually
    } else if (assignment?.type === 'game') {
        dummyPayload.answers = { score: 1200, time: "45s", completedLevels: 3 };
        dummyPayload.score = 100;
    } else {
        dummyPayload.answers = "Ini adalah jawaban simulasi esai dari murid. Jawaban ini cukup panjang untuk menguji tampilan layout grading.";
        dummyPayload.attachmentUrl = "https://example.com/dummy-file.pdf";
    }

    await setDoc(subRef, dummyPayload, { merge: true });
    
    window.location.reload(); 
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-purple-600">
      <Loader2 className="animate-spin w-8 h-8 mr-2"/> 
      <span>Memuat Data Penilaian...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors font-medium mb-4"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                 {assignment?.type === 'quiz' ? 'Kuis' : assignment?.type === 'game' ? 'Game' : 'Esai/Proyek'}
               </span>
               <span className="text-slate-400 text-xs">• Total Poin: {assignment?.totalPoints || 100}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{assignment?.title}</h1>
          </div>
          
          <div className="flex gap-4 text-sm divide-x divide-slate-100">
             <div className="text-center px-4">
                <p className="text-slate-400 text-xs font-bold uppercase">Total Murid</p>
                <p className="text-xl font-bold text-slate-800">{students.length}</p>
             </div>
             <div className="text-center px-4">
                <p className="text-slate-400 text-xs font-bold uppercase">Mengumpulkan</p>
                <p className="text-xl font-bold text-green-600">
                  {Object.values(submissions).filter(s => s.status === 'submitted' || s.status === 'graded').length}
                </p>
             </div>
             <div className="text-center px-4">
                <p className="text-slate-400 text-xs font-bold uppercase">Sudah Dinilai</p>
                <p className="text-xl font-bold text-purple-600">
                  {Object.values(submissions).filter(s => s.status === 'graded').length}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
         <div className="flex gap-2">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'submitted', label: 'Perlu Dinilai' },
              { id: 'graded', label: 'Selesai' },
              { id: 'missing', label: 'Belum Submit' }
            ].map(f => (
               <button
                 key={f.id}
                 onClick={() => setFilterStatus(f.id as any)}
                 className={cn(
                   "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                   filterStatus === f.id 
                     ? "bg-purple-600 text-white border-purple-600" 
                     : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                 )}
               >
                 {f.label}
               </button>
            ))}
         </div>
         <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              placeholder="Cari nama siswa..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
         </div>
      </div>

      {/* TABLE LIST */}
      <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredStudents.length === 0 ? (
           <div className="text-center py-20">
              <p className="text-slate-400">Tidak ada data siswa yang sesuai filter.</p>
           </div>
        ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-100">
                 <tr>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nama Murid</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Waktu Submit</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Nilai</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {filteredStudents.map(student => {
                   const sub = submissions[student.uid];
                   const isSubmitted = sub && (sub.status === 'submitted' || sub.status === 'graded');
                   const isGraded = sub?.status === 'graded';

                   return (
                     <tr key={student.uid} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                {student.photoURL ? <img src={student.photoURL} alt="av" className="w-full h-full object-cover"/> : <User size={16} className="text-slate-400"/>}
                             </div>
                             <div>
                                <p className="font-bold text-slate-700 text-sm group-hover:text-purple-700 transition-colors">{student.displayName}</p>
                                <p className="text-xs text-slate-400">{student.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          {isGraded ? (
                             <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">
                                <CheckCircle2 size={12}/> Selesai
                             </span>
                          ) : isSubmitted ? (
                             <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold animate-pulse">
                                <FileText size={12}/> Perlu Dinilai
                             </span>
                          ) : (
                             <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-xs font-bold">
                                <XCircle size={12}/> Belum Submit
                             </span>
                          )}
                       </td>
                       <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                          {isSubmitted && sub.submittedAt 
                             ? new Date(sub.submittedAt.seconds * 1000).toLocaleString('id-ID')
                             : "-"}
                       </td>
                       <td className="px-6 py-4 text-center">
                          {isGraded || (isSubmitted && sub.score !== undefined) ? (
                             <span className="text-lg font-bold text-slate-800">{sub.score}</span>
                          ) : (
                             <span className="text-slate-300">-</span>
                          )}
                       </td>
                       <td className="px-6 py-4 text-right flex justify-end gap-2">
                          {/* DEV ONLY BUTTON */}
                          {!isSubmitted && (
                             <button onClick={() => simulateSubmission(student)} className="text-[10px] text-blue-400 underline mr-2 opacity-0 group-hover:opacity-100 transition-opacity" title="Dev Only: Simulasi">
                               Dev: Submit
                             </button>
                          )}
                          
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenGrading(student)}
                            variant={isGraded ? "outline" : "primary"} 
                            className={cn(
                              "text-xs h-8 gap-1 shadow-sm", 
                              isGraded 
                                ? "text-slate-600 border-slate-300 hover:bg-slate-50" 
                                : "bg-purple-600 hover:bg-purple-700 text-white"
                            )}
                          >
                             {isGraded ? "Edit Nilai" : "Beri Nilai"} <ChevronRight size={14} />
                          </Button>
                       </td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
           </div>
        )}
      </div>

      {/* MODAL PENILAIAN */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedStudent(null)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
             
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="bg-white rounded-2xl w-full max-w-4xl relative z-10 shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden"
             >
                {/* LEFT: STUDENT WORK */}
                <div className="flex-1 bg-slate-50 p-6 overflow-y-auto border-r border-slate-200">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Jawaban Siswa</h3>
                         <h2 className="text-xl font-bold text-slate-800">{selectedStudent.displayName}</h2>
                      </div>
                      <div className="text-right">
                         <span className={cn(
                           "px-3 py-1 rounded-full text-xs font-bold",
                           submissions[selectedStudent.uid]?.status === 'graded' ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                         )}>
                            {submissions[selectedStudent.uid]?.status === 'graded' ? "Sudah Dinilai" : "Menunggu Penilaian"}
                         </span>
                      </div>
                   </div>

                   {submissions[selectedStudent.uid] ? (
                      <div className="space-y-4">
                         
                         {/* -- TYPE: QUIZ -- */}
                         {assignment?.type === 'quiz' && Array.isArray(submissions[selectedStudent.uid].answers) && (
                             <div className="space-y-3">
                                {submissions[selectedStudent.uid].answers.map((ans: any, idx: number) => (
                                    <div key={idx} className={cn("p-4 rounded-xl border flex items-start gap-3", ans.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", ans.isCorrect ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700")}>
                                            {ans.isCorrect ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 mb-1">Soal #{idx+1}</p>
                                            <p className="text-xs text-slate-500">Jawaban: <span className="font-mono font-bold">{ans.answer}</span></p>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4 bg-slate-100 rounded-xl text-center">
                                    <p className="text-sm text-slate-500">Nilai Otomatis Quiz: <span className="font-bold text-slate-900">{submissions[selectedStudent.uid].score}</span></p>
                                </div>
                             </div>
                         )}

                         {/* -- TYPE: GAME -- */}
                         {assignment?.type === 'game' && (
                             <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 text-center">
                                <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto text-purple-700 mb-4">
                                    <Gamepad2 size={32} />
                                </div>
                                <h3 className="font-bold text-purple-900 text-lg">Hasil Permainan</h3>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="bg-white p-3 rounded-xl">
                                        <p className="text-xs text-slate-400 uppercase">Skor Game</p>
                                        <p className="font-bold text-xl text-slate-800">{submissions[selectedStudent.uid].answers?.score || 0}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl">
                                        <p className="text-xs text-slate-400 uppercase">Waktu</p>
                                        <p className="font-bold text-xl text-slate-800">{submissions[selectedStudent.uid].answers?.time || "-"}</p>
                                    </div>
                                </div>
                             </div>
                         )}

                         {/* -- TYPE: ESSAY / PROJECT (Attachment) -- */}
                         {(assignment?.type === 'essay' || assignment?.type === 'project') && (
                             <>
                                {submissions[selectedStudent.uid].attachmentUrl && (
                                    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm group hover:border-blue-300 transition-colors cursor-pointer" onClick={() => window.open(submissions[selectedStudent.uid].attachmentUrl, '_blank')}>
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                             <FileText size={20} />
                                          </div>
                                          <div>
                                             <p className="font-bold text-slate-700 text-sm">Lampiran File</p>
                                             <p className="text-xs text-slate-400">Klik untuk membuka</p>
                                          </div>
                                       </div>
                                    </div>
                                )}
                                
                                {/* Text Answer */}
                                {typeof submissions[selectedStudent.uid].answers === 'string' && (
                                    <div className="prose prose-sm max-w-none text-slate-700 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[200px]">
                                       <p className="whitespace-pre-wrap font-serif leading-relaxed">
                                          {submissions[selectedStudent.uid].answers}
                                       </p>
                                    </div>
                                )}
                             </>
                         )}
                         
                      </div>
                   ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                         <Clock size={48} className="mb-4 opacity-20" />
                         <p>Siswa belum mengumpulkan tugas ini.</p>
                      </div>
                   )}
                </div>

                {/* RIGHT: GRADING FORM */}
                <div className="w-full md:w-80 bg-white p-6 flex flex-col border-l border-slate-200">
                   <div className="flex justify-between items-center mb-6">
                      <h2 className="font-bold text-slate-900">Form Nilai</h2>
                      <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                         <XCircle size={20} />
                      </button>
                   </div>

                   <div className="flex-1 space-y-6">
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Nilai Akhir</label>
                         <div className="relative">
                            <input 
                              type="number" 
                              min="0" 
                              max={assignment?.totalPoints || 100}
                              placeholder="0"
                              className="w-full text-4xl font-bold text-purple-700 p-4 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-center"
                              value={gradeScore}
                              onChange={e => setGradeScore(e.target.value)}
                            />
                            <span className="absolute right-4 bottom-4 text-xs font-bold text-slate-400">/{assignment?.totalPoints || 100}</span>
                         </div>
                      </div>
                      
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Umpan Balik</label>
                         <textarea 
                           placeholder="Berikan saran..."
                           className="w-full p-4 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all min-h-[150px] text-sm resize-none bg-slate-50 focus:bg-white"
                           value={feedback}
                           onChange={e => setFeedback(e.target.value)}
                         />
                      </div>
                   </div>

                   <div className="pt-6 border-t border-slate-100 mt-auto space-y-3">
                      <Button onClick={() => handleSaveGrade(null)} disabled={isSaving} className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 shadow-lg shadow-purple-200">
                         {isSaving ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <Save size={18} className="mr-2"/>}
                         Simpan Nilai
                      </Button>
                      
                      <div className="flex gap-2">
                         <Button 
                           disabled={!prevStudent} 
                           variant="outline" 
                           onClick={() => handleOpenGrading(prevStudent!)}
                           className="flex-1 h-10 text-xs border-slate-200 hover:bg-slate-50"
                         >
                            <ChevronLeft size={14} className="mr-1"/> Sebelumnya
                         </Button>
                         <Button 
                           disabled={!nextStudent} 
                           variant="outline" 
                           onClick={() => handleOpenGrading(nextStudent!)} // Pindah tanpa simpan
                           className="flex-1 h-10 text-xs border-slate-200 hover:bg-slate-50"
                         >
                            Berikutnya <ChevronRight size={14} className="ml-1"/>
                         </Button>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}