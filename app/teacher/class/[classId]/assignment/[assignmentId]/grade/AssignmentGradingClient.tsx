"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Search, Filter, CheckCircle2, 
  XCircle, Clock, FileText, ChevronRight, Save, Loader2, User 
} from "lucide-react";
// FIX PATH IMPORT: Naik 7 level untuk keluar dari app folder
import { db } from "../../../../../../../lib/firebase"; 
import { 
  doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, setDoc, orderBy 
} from "firebase/firestore";
import { Button } from "../../../../../../../components/ui/button";
import { cn } from "../../../../../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  answers?: any; // Struktur jawaban fleksibel
  attachmentUrl?: string; // Jika tipe upload file
}

interface AssignmentData {
  title: string;
  type: "quiz" | "essay" | "upload";
  totalPoints?: number;
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
        // Struktur: classrooms/{cid}/assignments/{aid}/submissions/{uid}
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
  const handleSaveGrade = async () => {
    if (!selectedStudent) return;
    setIsSaving(true);

    try {
      const scoreVal = Number(gradeScore);
      const subRef = doc(db, "classrooms", classId, "assignments", assignmentId, "submissions", selectedStudent.uid);
      
      // Update atau Create Submission Doc (jika guru menilai manual sebelum siswa submit)
      // Kita gunakan setDoc dengan merge: true
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

      alert("Nilai berhasil disimpan!");
      setSelectedStudent(null); // Tutup modal

    } catch (error) {
      console.error("Gagal simpan nilai:", error);
      alert("Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- DEBUG TOOL: SIMULASI SUBMIT (HANYA UNTUK DEVELOPMENT) ---
  const simulateSubmission = async (student: Student) => {
    if(!confirm(`Simulasikan ${student.displayName} mengumpulkan tugas?`)) return;
    
    const subRef = doc(db, "classrooms", classId, "assignments", assignmentId, "submissions", student.uid);
    await setDoc(subRef, {
      studentId: student.uid,
      studentName: student.displayName,
      submittedAt: serverTimestamp(),
      status: "submitted",
      answers: "Ini adalah jawaban simulasi esai dari murid.",
      attachmentUrl: "https://example.com/file.pdf"
    }, { merge: true });
    
    window.location.reload(); // Refresh kasar untuk lihat hasil
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
                 {assignment?.type === 'quiz' ? 'Kuis' : assignment?.type === 'essay' ? 'Esai' : 'Upload File'}
               </span>
               <span className="text-slate-400 text-xs">• Total Poin: {assignment?.totalPoints || 100}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{assignment?.title}</h1>
          </div>
          
          <div className="flex gap-4 text-sm">
             <div className="text-center px-4 border-r border-slate-100">
                <p className="text-slate-400 text-xs font-bold uppercase">Total Murid</p>
                <p className="text-xl font-bold text-slate-800">{students.length}</p>
             </div>
             <div className="text-center px-4 border-r border-slate-100">
                <p className="text-slate-400 text-xs font-bold uppercase">Sudah Mengumpulkan</p>
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

      {/* TABLE LIST */}
      <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {students.length === 0 ? (
           <div className="text-center py-20">
              <p className="text-slate-400">Tidak ada murid di kelas ini.</p>
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
                 {students.map(student => {
                   const sub = submissions[student.uid];
                   const isSubmitted = sub && (sub.status === 'submitted' || sub.status === 'graded');
                   const isGraded = sub?.status === 'graded';

                   return (
                     <tr key={student.uid} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                {student.photoURL ? <img src={student.photoURL} alt="av" className="w-full h-full object-cover"/> : <User size={16} className="text-slate-400"/>}
                             </div>
                             <div>
                                <p className="font-bold text-slate-700 text-sm">{student.displayName}</p>
                                <p className="text-xs text-slate-400">{student.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          {isGraded ? (
                             <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">
                                <CheckCircle2 size={12}/> Selesai Dinilai
                             </span>
                          ) : isSubmitted ? (
                             <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                <FileText size={12}/> Siap Dinilai
                             </span>
                          ) : (
                             <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold">
                                <Clock size={12}/> Belum Submit
                             </span>
                          )}
                       </td>
                       <td className="px-6 py-4 text-sm text-slate-500">
                          {isSubmitted && sub.submittedAt 
                             ? new Date(sub.submittedAt.seconds * 1000).toLocaleString('id-ID')
                             : "-"}
                       </td>
                       <td className="px-6 py-4 text-center">
                          {isGraded ? (
                             <span className="text-lg font-bold text-purple-700">{sub.score}</span>
                          ) : (
                             <span className="text-slate-300">-</span>
                          )}
                       </td>
                       <td className="px-6 py-4 text-right flex justify-end gap-2">
                          {/* DEV ONLY BUTTON */}
                          {!isSubmitted && (
                             <button onClick={() => simulateSubmission(student)} className="text-[10px] text-blue-400 underline mr-2" title="Dev Only: Simulasi">
                               Simulasi
                             </button>
                          )}
                          
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenGrading(student)}
                            // FIX: Mengganti "default" menjadi "primary"
                            variant={isGraded ? "outline" : "primary"}
                            className={cn(
                              "text-xs h-8 gap-1", 
                              isGraded ? "text-purple-600 border-purple-200 hover:bg-purple-50" : "bg-purple-600 hover:bg-purple-700 text-white"
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
               className="bg-white rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
             >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <div>
                      <h2 className="text-lg font-bold text-slate-900">Penilaian Tugas</h2>
                      <p className="text-sm text-slate-500">Siswa: <span className="font-semibold text-purple-600">{selectedStudent.displayName}</span></p>
                   </div>
                   <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600">
                      <XCircle size={24} />
                   </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
                   {/* Jawaban Siswa Area */}
                   <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Jawaban Siswa</h3>
                      
                      {submissions[selectedStudent.uid] ? (
                         <div className="space-y-4">
                            {/* Jika ada file attachment */}
                            {submissions[selectedStudent.uid].attachmentUrl && (
                               <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700">
                                  <FileText size={20} />
                                  <div className="flex-1 overflow-hidden">
                                     <p className="text-sm font-bold truncate">File Lampiran Tugas</p>
                                     <a href={submissions[selectedStudent.uid].attachmentUrl} target="_blank" rel="noreferrer" className="text-xs underline hover:text-blue-900">
                                        Buka Lampiran
                                     </a>
                                  </div>
                               </div>
                            )}
                            
                            {/* Text Jawaban */}
                            <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
                               <p className="whitespace-pre-wrap">
                                  {submissions[selectedStudent.uid].answers || "Tidak ada teks jawaban."}
                               </p>
                            </div>
                         </div>
                      ) : (
                         <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            Siswa belum mengumpulkan tugas ini.
                         </div>
                      )}
                   </div>

                   {/* Form Nilai */}
                   <div className="grid gap-6">
                      <div>
                         <label className="text-sm font-bold text-slate-700 block mb-2">Nilai Akhir (0-100)</label>
                         <input 
                           type="number" 
                           min="0" 
                           max="100"
                           placeholder="0"
                           className="w-full text-3xl font-bold text-purple-700 p-4 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-center"
                           value={gradeScore}
                           onChange={e => setGradeScore(e.target.value)}
                         />
                      </div>
                      <div>
                         <label className="text-sm font-bold text-slate-700 block mb-2">Umpan Balik / Komentar Guru</label>
                         <textarea 
                           placeholder="Berikan apresiasi atau saran perbaikan..."
                           className="w-full p-4 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all min-h-[100px] text-sm"
                           value={feedback}
                           onChange={e => setFeedback(e.target.value)}
                         />
                      </div>
                   </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
                   <Button variant="ghost" onClick={() => setSelectedStudent(null)}>Batal</Button>
                   <Button onClick={handleSaveGrade} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                      {isSaving ? <Loader2 className="animate-spin w-4 h-4"/> : <Save size={18}/>}
                      Simpan Nilai
                   </Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}