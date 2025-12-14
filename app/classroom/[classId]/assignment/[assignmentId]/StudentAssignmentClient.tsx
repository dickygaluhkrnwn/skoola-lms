"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Clock, FileText, CheckCircle2, UploadCloud, 
  Send, Loader2, AlertCircle, Music, Image as ImageIcon, X, File,
  Gamepad2, Lightbulb, Play, RotateCcw, Trophy, Lock, Star, HelpCircle
} from "lucide-react";
import { db, auth, storage } from "@/lib/firebase"; 
import { 
  doc, getDoc, collection, getDocs, serverTimestamp, setDoc, query, orderBy 
} from "firebase/firestore";
import { 
  ref, uploadBytes, getDownloadURL 
} from "firebase/storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "@/lib/theme-context";
import { AssignmentType, GameType, QuizQuestion } from "@/lib/types/course.types";
import { UserProfile } from "@/lib/types/user.types";

// --- TIPE DATA ---
interface AssignmentData {
  id: string;
  title: string;
  description: string;
  type: AssignmentType;
  deadline: any;
  totalPoints?: number;
  gameConfig?: {
    gameType: GameType;
    data: any;
  };
}

interface Submission {
  status: "submitted" | "graded" | "late";
  submittedAt: any;
  score?: number;
  feedback?: string;
  answers?: any; 
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // --- STATE PENGERJAAN ---
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | string>>({}); 
  const [essayAnswer, setEssayAnswer] = useState("");
  const [fileUrl, setFileUrl] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // --- STATE GAME ---
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [gameScore, setGameScore] = useState(0);
  const [gameData, setGameData] = useState<any>(null); // Local game state
  const [gameTimer, setGameTimer] = useState(0); 
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // -- Word Scramble Specific --
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [scrambleInput, setScrambleInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";

  // 1. AUTH & DATA FETCHING
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        
        try {
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            if (userDocSnap.exists()) {
                const profileData = userDocSnap.data() as UserProfile;
                setUserProfile(profileData);
                fetchData(user.uid, profileData); 
            } else {
                fetchData(user.uid, null); 
            }
        } catch (e) {
            console.error("Error fetching user profile", e);
            fetchData(user.uid, null);
        }

      } else {
        router.push("/");
      }
    });
    return () => unsubAuth();
  }, [classId, assignmentId, router]);

  const fetchData = async (uid: string, profile: UserProfile | null) => {
    try {
      // 0. Validate School Isolation
      const classRef = doc(db, "classrooms", classId);
      const classSnap = await getDoc(classRef);
      
      if (!classSnap.exists()) {
         alert("Kelas tidak ditemukan.");
         router.push("/learn");
         return;
      }

      const classData = classSnap.data();
      
      if (classData.schoolId && profile?.schoolId && classData.schoolId !== profile.schoolId) {
         setAccessDenied(true);
         setLoading(false);
         return;
      } else if (classData.schoolId && !profile?.schoolId) {
         setAccessDenied(true); 
         setLoading(false);
         return;
      }

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

      // B. Fetch Submission
      const subRef = doc(db, "classrooms", classId, "assignments", assignmentId, "submissions", uid);
      const subSnap = await getDoc(subRef);
      if (subSnap.exists()) {
        const subData = subSnap.data() as Submission;
        setSubmission(subData);
        // Jika sudah submit, load jawaban ke state (untuk review)
        if(subData.answers) {
            if(assignData.type === 'quiz' && Array.isArray(subData.answers)) {
                const loadedAnswers: any = {};
                subData.answers.forEach((a: any) => loadedAnswers[a.questionId] = a.answer);
                setQuizAnswers(loadedAnswers);
            } else if (assignData.type === 'essay') {
                setEssayAnswer(subData.answers);
            }
        }
      }

      // C. Load Content Based on Type
      if (assignData.type === "quiz") {
        const qRef = collection(db, "classrooms", classId, "assignments", assignmentId, "questions");
        const qQuery = query(qRef, orderBy("order", "asc"));
        const qSnap = await getDocs(qQuery);
        const qList = qSnap.docs.map(d => ({ id: d.id, ...d.data() })) as QuizQuestion[];
        setQuestions(qList);
      } 
      else if (assignData.type === "game" && assignData.gameConfig) {
          if (assignData.gameConfig.gameType === 'word-scramble') {
              // Prepare Words
              const rawData = assignData.gameConfig.data || [];
              const prepared = rawData.map((item: any) => ({
                  ...item,
                  shuffled: shuffleString(item.word),
                  isSolved: false
              }));
              setGameData(prepared);
          } else if (assignData.gameConfig.gameType === 'memory-match') {
              // Prepare Cards
              const originalPairs = assignData.gameConfig.data || [];
              let cards: any[] = [];
              originalPairs.forEach((pair: any) => {
                  cards.push({ id: pair.id + '_1', pairId: pair.id, content: pair.front, image: pair.frontImage, isFlipped: false, isMatched: false });
                  cards.push({ id: pair.id + '_2', pairId: pair.id, content: pair.back, image: pair.backImage, isFlipped: false, isMatched: false });
              });
              // Shuffle cards
              cards.sort(() => Math.random() - 0.5);
              setGameData({ cards, flipped: [], matchedCount: 0 });
          }
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Shuffle String
  const shuffleString = (str: string) => {
      const arr = str.split('');
      for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.join('').toUpperCase();
  };

  const formatDeadline = (deadline: any) => {
    if (!deadline) return "Tanpa Batas";
    let dateObj;
    if (deadline && typeof deadline === 'object' && 'seconds' in deadline) {
        dateObj = new Date(deadline.seconds * 1000);
    } else {
        dateObj = new Date(deadline);
    }
    if (isNaN(dateObj.getTime())) return "Tanggal Tidak Valid";
    return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });
  };

  // --- GAME LOGIC ENGINE ---
  useEffect(() => {
      if (gameState === 'playing') {
          timerRef.current = setInterval(() => {
              setGameTimer(t => t + 1);
          }, 1000);
      } else {
          if (timerRef.current) clearInterval(timerRef.current);
      }
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState]);

  // Handler: Word Scramble
  const handleScrambleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const currentWord = gameData[currentWordIndex];
      
      if (scrambleInput.toUpperCase() === currentWord.word.toUpperCase()) {
          // Correct!
          const newData = [...gameData];
          newData[currentWordIndex].isSolved = true;
          setGameData(newData);
          setGameScore(s => s + 100); // 100 points per word
          setScrambleInput("");

          if (currentWordIndex < gameData.length - 1) {
              setCurrentWordIndex(prev => prev + 1);
          } else {
              finishGame();
          }
      } else {
          // Wrong animation logic could go here
          alert("Salah! Coba lagi.");
      }
  };

  // Handler: Memory Match
  const handleCardClick = (idx: number) => {
      if (gameData.flipped.length >= 2 || gameData.cards[idx].isFlipped || gameData.cards[idx].isMatched) return;

      const newCards = [...gameData.cards];
      newCards[idx].isFlipped = true;
      
      const newFlipped = [...gameData.flipped, idx];
      
      if (newFlipped.length === 2) {
          setGameData({ ...gameData, cards: newCards, flipped: newFlipped });
          // Check match
          const card1 = newCards[newFlipped[0]];
          const card2 = newCards[newFlipped[1]];
          
          if (card1.pairId === card2.pairId) {
              // Match!
              setTimeout(() => {
                  const matchedCards = [...newCards];
                  matchedCards[newFlipped[0]].isMatched = true;
                  matchedCards[newFlipped[1]].isMatched = true;
                  
                  const newScore = gameScore + 100;
                  const newMatchedCount = (gameData.matchedCount || 0) + 1;
                  
                  setGameScore(newScore);
                  setGameData({ ...gameData, cards: matchedCards, flipped: [], matchedCount: newMatchedCount });
                  
                  // Check win (all pairs matched)
                  if (newMatchedCount >= (gameData.cards.length / 2)) {
                      finishGame(newScore);
                  }
              }, 500);
          } else {
              // No Match
              setTimeout(() => {
                  const resetCards = [...newCards];
                  resetCards[newFlipped[0]].isFlipped = false;
                  resetCards[newFlipped[1]].isFlipped = false;
                  setGameData({ ...gameData, cards: resetCards, flipped: [] });
              }, 1000);
          }
      } else {
          setGameData({ ...gameData, cards: newCards, flipped: newFlipped });
      }
  };

  const finishGame = (finalScore?: number) => {
      setGameState('finished');
      // Auto submit score
      if(!submission) {
         // Optionally auto-submit here, or let user click "Submit Score"
      }
  };

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (gameResult?: any) => {
    if (!userId || !assignment) return;
    
    // Validasi Manual
    if (!gameResult) {
        if (assignment.type === "quiz" && Object.keys(quizAnswers).length < questions.length) {
           if(!confirm("Anda belum menjawab semua soal. Yakin ingin mengumpulkan?")) return;
        }
        if (assignment.type === "project" && !fileUrl) {
           alert("Harap upload file tugas terlebih dahulu!");
           return;
        }
        if (assignment.type === "essay" && !essayAnswer.trim()) {
           if(!confirm("Jawaban esai masih kosong. Yakin ingin mengumpulkan?")) return;
        }
        if (!confirm("Apakah Anda yakin ingin mengumpulkan tugas ini?")) return;
    }

    setIsSubmitting(true);
    try {
      let payload: any = {
        studentId: userId,
        studentName: auth.currentUser?.displayName || "Siswa", 
        submittedAt: serverTimestamp(),
        status: "submitted",
      };

      if (assignment.type === "quiz") {
        payload.answers = Object.entries(quizAnswers).map(([qid, ans]) => ({
            questionId: qid,
            answer: ans,
            isCorrect: questions.find(q => q.id === qid)?.correctAnswer == ans // Loose equality for string/number mix
        }));
        // Auto Score Quiz
        const correctCount = payload.answers.filter((a: any) => a.isCorrect).length;
        payload.score = Math.round((correctCount / questions.length) * 100);
        payload.status = "graded"; 

      } else if (assignment.type === "game") {
        const score = gameResult?.score || gameScore;
        const time = gameResult?.time || gameTimer;
        payload.answers = {
            score: score,
            time: `${time}s`,
            gameType: assignment.gameConfig?.gameType
        };
        payload.score = score;
        payload.status = "graded";

      } else if (assignment.type === "essay") {
        payload.answers = essayAnswer;
      } else if (assignment.type === "project") { 
        payload.answers = "File uploaded";
        payload.attachmentUrl = fileUrl; 
      }

      const subRef = doc(db, "classrooms", classId, "assignments", assignmentId, "submissions", userId);
      await setDoc(subRef, payload);

      setSubmission({
        ...payload,
        submittedAt: { seconds: Date.now() / 1000 } 
      });

      alert("Tugas berhasil dikumpulkan!");
      
    } catch (error) {
      console.error("Gagal submit:", error);
      alert("Gagal mengumpulkan tugas. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload File Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `assignments/student_uploads/${assignmentId}/${userId}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setFileUrl(downloadURL);
      alert("File berhasil diupload!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Gagal mengupload file.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return (
    <div className={cn("min-h-screen flex items-center justify-center", isUni ? "bg-slate-950 text-white" : "bg-slate-50 text-blue-600")}>
      <Loader2 className="animate-spin w-8 h-8 mr-2"/> 
      <span>Memuat Tugas...</span>
    </div>
  );

  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Akses Dibatasi</h1>
        <button onClick={() => router.push('/learn')} className="mt-6 px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg">Kembali</button>
      </div>
    );
  }

  if (!assignment) return null;

  const isSubmitted = !!submission;
  const isGraded = submission?.status === "graded";

  return (
    <div className={cn("min-h-screen font-sans p-4 md:p-8 pb-24 transition-colors duration-500 relative", 
        isUni ? "bg-slate-950 text-slate-200" : isKids ? "bg-yellow-50" : "bg-slate-50"
    )}>
      
      {/* HEADER NAV */}
      <div className="max-w-4xl mx-auto mb-6 relative z-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-4">
          <ArrowLeft size={18} /> Kembali
        </button>

        <div className={cn("p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-all", 
            isUni ? "bg-slate-900/50 backdrop-blur-xl border-white/10" : "bg-white border-slate-200"
        )}>
           <div className="absolute top-6 right-6">
              {isGraded ? (
                 <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-purple-200">
                    <Trophy size={14} /> Nilai: {submission?.score}
                 </span>
              ) : isSubmitted ? (
                 <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-200">
                    <CheckCircle2 size={14} /> Selesai
                 </span>
              ) : (
                 <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-slate-200">
                    <Clock size={14} /> Belum Dikerjakan
                 </span>
              )}
           </div>
           
           <h1 className={cn("text-2xl font-bold mb-2", isUni && "text-white")}>{assignment.title}</h1>
           <div className={cn("prose prose-sm max-w-none opacity-80", isUni && "text-slate-300")}>
              <p>{assignment.description}</p>
           </div>
           
           <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
               <Clock size={14} /> 
               <span>Deadline: <strong>{formatDeadline(assignment.deadline)}</strong></span>
           </div>
        </div>
      </div>

      {/* WORKSPACE AREA */}
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
         
         {/* -- VIEW MODE: GAME -- */}
         {!isSubmitted && assignment.type === "game" && (
             <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 relative min-h-[500px] flex flex-col">
                 
                 {/* GAME INTRO SCREEN */}
                 {gameState === 'intro' && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center bg-slate-900/90 z-20">
                         <Gamepad2 size={64} className="text-purple-400 mb-6 animate-bounce" />
                         <h2 className="text-3xl font-bold mb-2">Siap Bermain?</h2>
                         <p className="text-slate-400 mb-8 max-w-md">
                             {assignment.gameConfig?.gameType === 'word-scramble' ? "Susun huruf menjadi kata yang benar!" : "Temukan semua pasangan kartu!"}
                         </p>
                         <Button onClick={() => setGameState('playing')} className="bg-purple-600 hover:bg-purple-500 text-lg px-8 py-6 rounded-2xl shadow-lg shadow-purple-900/50">
                             <Play size={24} className="mr-2" /> Mulai Game
                         </Button>
                     </div>
                 )}

                 {/* GAME PLAYING SCREEN */}
                 {gameState === 'playing' && (
                     <div className="p-6 flex-1 flex flex-col">
                         {/* HUD */}
                         <div className="flex justify-between items-center mb-6 bg-white/10 p-3 rounded-xl backdrop-blur-md">
                             <div className="flex items-center gap-2 text-white font-bold">
                                 <Clock size={18} className="text-yellow-400"/> {gameTimer}s
                             </div>
                             <div className="text-xs text-slate-400 uppercase font-bold tracking-widest">
                                {assignment.gameConfig?.gameType === 'word-scramble' ? `Word ${currentWordIndex + 1}/${gameData?.length}` : "Memory Match"}
                             </div>
                             <div className="text-white font-bold">{gameScore} pts</div>
                         </div>

                         {/* WORD SCRAMBLE ENGINE */}
                         {assignment.gameConfig?.gameType === 'word-scramble' && gameData && (
                             <div className="flex-1 flex flex-col items-center justify-center gap-8">
                                 <div className="bg-white/5 px-6 py-2 rounded-full border border-white/10">
                                    <p className="text-sm text-slate-300">Petunjuk: <span className="text-white font-bold">{gameData[currentWordIndex].hint}</span></p>
                                 </div>
                                 
                                 <div className="text-5xl md:text-7xl font-mono font-bold text-yellow-400 tracking-[0.5em] text-center drop-shadow-lg">
                                     {gameData[currentWordIndex].shuffled}
                                 </div>

                                 <form onSubmit={handleScrambleSubmit} className="w-full max-w-md flex flex-col gap-4">
                                     <input 
                                         autoFocus
                                         className="w-full bg-black/30 border border-white/20 rounded-xl p-4 text-center text-2xl text-white font-bold tracking-widest uppercase focus:border-purple-500 outline-none"
                                         placeholder="KETIK JAWABAN..."
                                         value={scrambleInput}
                                         onChange={(e) => setScrambleInput(e.target.value)}
                                     />
                                     <Button type="submit" className="w-full bg-green-600 hover:bg-green-500 py-6 text-lg">
                                         Cek Jawaban
                                     </Button>
                                 </form>
                             </div>
                         )}

                         {/* MEMORY MATCH ENGINE */}
                         {assignment.gameConfig?.gameType === 'memory-match' && gameData && (
                             <div className="flex-1 grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 content-center max-w-2xl mx-auto">
                                 {gameData.cards.map((card: any, idx: number) => (
                                     <motion.div 
                                         key={card.id}
                                         layout
                                         onClick={() => handleCardClick(idx)}
                                         className={cn(
                                             "aspect-square rounded-xl cursor-pointer perspective-1000 relative",
                                         )}
                                         animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                                     >
                                         {/* Card Back (Cover) */}
                                         <div className={cn("absolute inset-0 bg-slate-700 rounded-xl border-2 border-slate-600 flex items-center justify-center backface-hidden", (card.isFlipped || card.isMatched) && "hidden")}>
                                             <Gamepad2 className="text-slate-500 opacity-20" size={32}/>
                                         </div>
                                         
                                         {/* Card Front (Content) */}
                                         <div className={cn("absolute inset-0 bg-white rounded-xl flex items-center justify-center p-2 text-center text-slate-900 font-bold border-4 text-sm md:text-base", 
                                             card.isMatched ? "border-green-500 bg-green-50" : "border-purple-500",
                                             !(card.isFlipped || card.isMatched) && "hidden" // optimization
                                         )} style={{ transform: "rotateY(180deg)" }}>
                                             {card.image ? <img src={card.image} className="w-full h-full object-cover rounded-lg"/> : card.content}
                                         </div>
                                     </motion.div>
                                 ))}
                             </div>
                         )}

                     </div>
                 )}

                 {/* GAME FINISHED SCREEN */}
                 {gameState === 'finished' && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center bg-slate-900/95 z-30">
                         <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 mb-6 shadow-[0_0_40px_rgba(250,204,21,0.4)] animate-bounce">
                             <Trophy size={48} />
                         </div>
                         <h2 className="text-4xl font-bold mb-2 text-yellow-400">Permainan Selesai!</h2>
                         <p className="text-2xl font-bold mb-6">Skor: {gameScore}</p>
                         
                         <Button onClick={() => handleSubmit({ score: gameScore, time: gameTimer })} disabled={isSubmitting} className="bg-green-600 hover:bg-green-500 text-lg px-8 py-4 rounded-xl w-full max-w-sm mb-4">
                             {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2"/>}
                             Kirim Hasil
                         </Button>
                         
                         <button onClick={() => { setGameState('intro'); setGameScore(0); setGameTimer(0); }} className="text-slate-500 hover:text-white flex items-center gap-2">
                             <RotateCcw size={16}/> Main Lagi
                         </button>
                     </div>
                 )}
             </div>
         )}

         {/* -- VIEW MODE: QUIZ -- */}
         {!isSubmitted && assignment.type === "quiz" && (
             <div className="space-y-6">
                 {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex gap-4">
                           <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {idx + 1}
                           </span>
                           <div className="flex-1">
                              {q.mediaUrl && (
                                 <div className="mb-4">
                                     <img src={q.mediaUrl} alt="Soal" className="max-h-64 rounded-lg object-contain bg-slate-50 border" />
                                 </div>
                              )}
                              <p className="font-medium text-lg mb-6">{q.text}</p>
                              
                              <div className="space-y-3">
                                 {q.options?.map((opt, optIdx) => (
                                     <div 
                                        key={optIdx}
                                        onClick={() => setQuizAnswers({...quizAnswers, [q.id]: optIdx})} // Save index if option
                                        className={cn(
                                           "p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all",
                                           quizAnswers[q.id] === optIdx 
                                             ? "border-blue-500 bg-blue-50 text-blue-700" 
                                             : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                                        )}
                                     >
                                         <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", quizAnswers[q.id] === optIdx ? "border-blue-500" : "border-slate-300")}>
                                             {quizAnswers[q.id] === optIdx && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"/>}
                                         </div>
                                         <span className="font-medium">{opt}</span>
                                     </div>
                                 ))}
                                 
                                 {/* Short Answer Input */}
                                 {q.type === 'short-answer' && (
                                     <input 
                                        placeholder="Ketik jawaban Anda..."
                                        className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition-all"
                                        value={(quizAnswers[q.id] as string) || ""}
                                        onChange={(e) => setQuizAnswers({...quizAnswers, [q.id]: e.target.value})}
                                     />
                                 )}
                              </div>
                           </div>
                        </div>
                    </div>
                 ))}
             </div>
         )}

         {/* -- VIEW MODE: PROJECT / ESSAY -- */}
         {!isSubmitted && (assignment.type === "essay" || assignment.type === "project") && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        {assignment.type === 'essay' ? <FileText size={20} className="text-blue-500"/> : <UploadCloud size={20} className="text-purple-500"/>}
                        Jawaban Anda
                    </h3>
                    
                    <textarea 
                       className="w-full min-h-[200px] p-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-y text-slate-700 leading-relaxed bg-slate-50 focus:bg-white"
                       placeholder={assignment.type === 'essay' ? "Ketikan jawaban esai Anda di sini..." : "Tambahkan catatan untuk guru (opsional)..."}
                       value={essayAnswer}
                       onChange={(e) => setEssayAnswer(e.target.value)}
                    />
                </div>

                {/* File Upload for Project */}
                {(assignment.type === 'project') && (
                    <div>
                        <label className="text-sm font-bold text-slate-700 block mb-2">Lampirkan File</label>
                        <div 
                           className={cn("border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all", 
                               fileUrl ? "border-green-300 bg-green-50" : "border-slate-300 hover:bg-slate-50 hover:border-blue-300"
                           )}
                           onClick={() => fileInputRef.current?.click()}
                        >
                           {isUploading ? (
                               <div className="flex flex-col items-center text-blue-600 gap-2">
                                   <Loader2 className="animate-spin" /> Mengupload...
                               </div>
                           ) : fileUrl ? (
                               <div className="flex items-center gap-3 text-green-700">
                                   <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                                       <CheckCircle2 size={20} />
                                   </div>
                                   <div className="flex-1 overflow-hidden">
                                       <p className="font-bold text-sm truncate">File Terupload</p>
                                       <p className="text-xs opacity-70 truncate">Siap dikirim</p>
                                   </div>
                                   <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setFileUrl(""); }}>
                                       Hapus
                                   </Button>
                               </div>
                           ) : (
                               <div className="text-center text-slate-400">
                                   <UploadCloud size={32} className="mx-auto mb-2" />
                                   <p className="text-sm font-medium">Klik untuk upload file proyek</p>
                                   <p className="text-xs opacity-70">PDF, JPG, PNG, DOCX (Max 10MB)</p>
                               </div>
                           )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    </div>
                )}
            </div>
         )}
      </div>

      {/* FOOTER ACTION BAR (Non-Game Only) */}
      {!isSubmitted && assignment.type !== 'game' && (
         <div className={cn("fixed bottom-0 left-0 right-0 p-4 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 backdrop-blur-md", 
             isUni ? "bg-slate-950/80 border-white/10" : "bg-white border-slate-200"
         )}>
           <div className="max-w-4xl mx-auto flex justify-between items-center">
              <p className={cn("text-sm hidden md:block", isUni ? "text-slate-400" : "text-slate-500")}>
                 Pastikan semua jawaban sudah terisi sebelum mengumpulkan.
              </p>
              <Button 
                 onClick={() => handleSubmit()} 
                 disabled={isSubmitting || isUploading}
                 className={cn(
                   "w-full md:w-auto px-8 py-6 rounded-xl text-lg font-bold transition-transform active:scale-95",
                   isUni ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                 )}
              >
                 {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2" size={20} />}
                 Kumpulkan Tugas
              </Button>
           </div>
         </div>
      )}
      
      {/* SUCCESS STATE OVERLAY (Jika sudah submit & graded) */}
      {isSubmitted && (
         <div className="max-w-4xl mx-auto mt-8 relative z-10 animate-in fade-in slide-in-from-bottom-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-lg">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    {isGraded ? <Trophy size={40}/> : <CheckCircle2 size={40}/>}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {isGraded ? "Nilai Keluar!" : "Tugas Terkirim!"}
                </h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    {isGraded 
                        ? `Selamat! Kamu mendapatkan nilai ${submission?.score}/100. Cek umpan balik dari guru untuk detailnya.` 
                        : "Jawabanmu sudah aman tersimpan. Guru akan segera memeriksa dan memberikan nilai."}
                </p>
                
                {isGraded && submission?.feedback && (
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left mb-8 max-w-lg mx-auto">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Umpan Balik Guru</h4>
                        <p className="text-slate-700 italic">"{submission.feedback}"</p>
                    </div>
                )}

                <Button onClick={() => router.back()} variant="outline" className="px-8">
                    Kembali ke Kelas
                </Button>
            </div>
         </div>
      )}

    </div>
  );
}