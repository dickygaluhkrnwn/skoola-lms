"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, Trophy, ArrowLeft, Heart, Zap, 
  CheckCircle, XCircle, AlertTriangle, Play, Brain, Puzzle, Search
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, increment, getDoc, collection, query, where, limit, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound"; 
import { UserProfile } from "@/lib/types/user.types"; // Import type

// --- MOCK DATA SOAL (Nanti pindah ke Firestore) ---
const TRIVIA_QUESTIONS = [
  { q: "Ibukota Indonesia di masa depan adalah...", opts: ["Jakarta", "Bandung", "Nusantara", "Surabaya"], a: "Nusantara" },
  { q: "Rumus luas lingkaran adalah...", opts: ["π x r", "π x r²", "2 x π x r", "p x l"], a: "π x r²" },
  { q: "Planet terbesar di tata surya?", opts: ["Bumi", "Mars", "Jupiter", "Saturnus"], a: "Jupiter" },
  { q: "Siapa penemu lampu pijar?", opts: ["Tesla", "Edison", "Einstein", "Newton"], a: "Edison" },
  { q: "25% dari 200 adalah...", opts: ["25", "50", "75", "100"], a: "50" },
];

const WORD_MATCH_PAIRS = [
  { id: 1, a: "Merah", b: "Red" },
  { id: 2, a: "Kucing", b: "Cat" },
  { id: 3, a: "Buku", b: "Book" },
  { id: 4, a: "Sekolah", b: "School" },
  { id: 5, a: "Guru", b: "Teacher" },
];

interface GameClientProps {
  gameId: string;
}

export default function ArenaGameClient({ gameId }: GameClientProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { playSound } = useSound();

  // --- STATE ---
  const [gameState, setGameState] = useState<"lobby" | "playing" | "finished">("lobby");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  
  // Game Specific State
  const [questionIndex, setQuestionIndex] = useState(0); 
  const [mathProblem, setMathProblem] = useState({ q: "", a: 0 }); 
  const [selectedPair, setSelectedPair] = useState<string[]>([]); 
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]); 

  // User State
  const [userId, setUserId] = useState<string | null>(null);

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMA = theme === "sma";

  // --- INITIALIZATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/social/arena");
      } else {
        setUserId(user.uid);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === "playing") {
      handleGameOver();
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  // --- GAMEPLAY HANDLERS ---

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setCombo(0);
    setTimeLeft(gameId === "math-rush" ? 30 : 60);
    
    if (gameId === "math-rush") generateMathProblem();
    if (gameId === "quick-trivia") setQuestionIndex(0);
    if (gameId === "word-match") {
       setMatchedPairs([]);
       setSelectedPair([]);
    }
  };

  const handleGameOver = async () => {
    setGameState("finished");
    if (userId) {
      try {
        const userRef = doc(db, "users", userId);
        const xpEarned = Math.floor(score / 10) + 10; 
        
        // 1. Update User Stats (Lokal)
        await updateDoc(userRef, {
          "arenaStats.totalPoints": increment(score),
          "arenaStats.gamesPlayed": increment(1),
          "arenaStats.gamesWon": increment(score > 0 ? 1 : 0), 
          "gamification.xp": increment(xpEarned),
          "lastActivityDate": Date.now() 
        });

        // 2. Update Leaderboards (Individu, Sekolah, Tim)
        const seasonsRef = collection(db, "arena_seasons");
        const qSeason = query(seasonsRef, where("isActive", "==", true), limit(1));
        const seasonSnap = await getDocs(qSeason);
        
        if (!seasonSnap.empty) {
            const seasonId = seasonSnap.docs[0].id;
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data() as UserProfile;
            
            // A. Update INDIVIDUAL Leaderboard
            const lbIndividuRef = doc(db, "arena_leaderboards", `${seasonId}_${userId}`);
            await setDoc(lbIndividuRef, {
                seasonId: seasonId,
                type: "individual",
                entityId: userId,
                name: userData.displayName,
                avatar: userData.photoURL || "",
                schoolName: userData.schoolName || "Umum",
                points: increment(score),
                updatedAt: serverTimestamp()
            }, { merge: true });

            // B. Update SCHOOL Leaderboard (Jika user punya sekolah)
            if (userData.schoolId) {
                // Gunakan ID sekolah sebagai entityId
                const lbSchoolRef = doc(db, "arena_leaderboards", `${seasonId}_${userData.schoolId}`);
                await setDoc(lbSchoolRef, {
                    seasonId: seasonId,
                    type: "school",
                    entityId: userData.schoolId,
                    name: userData.schoolName || "Sekolah Tidak Diketahui",
                    points: increment(score), // Poin user ditambahkan ke sekolah
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }

            // C. Update TEAM Leaderboard (Jika user punya tim)
            // Cek apakah user punya tim (query simple ke collection 'teams')
            const teamsRef = collection(db, "teams");
            const qTeam = query(teamsRef, where("members", "array-contains", userId), limit(1));
            const teamSnap = await getDocs(qTeam);

            if (!teamSnap.empty) {
                const teamDoc = teamSnap.docs[0];
                const teamId = teamDoc.id;
                const teamData = teamDoc.data();

                const lbTeamRef = doc(db, "arena_leaderboards", `${seasonId}_${teamId}`);
                await setDoc(lbTeamRef, {
                    seasonId: seasonId,
                    type: "team",
                    entityId: teamId,
                    name: teamData.name, // Nama Tim
                    points: increment(score),
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
        }

      } catch (err) {
        console.error("Failed to save score:", err);
      }
    }
  };

  // 1. TRIVIA LOGIC
  const handleTriviaAnswer = (answer: string) => {
    const currentQ = TRIVIA_QUESTIONS[questionIndex];
    if (answer === currentQ.a) {
      const bonus = Math.floor(timeLeft / 2); 
      setScore(prev => prev + 100 + bonus + (combo * 10));
      setCombo(prev => prev + 1);
    } else {
      setCombo(0);
      setTimeLeft(prev => Math.max(0, prev - 5)); 
    }

    if (questionIndex < TRIVIA_QUESTIONS.length - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      handleGameOver(); 
    }
  };

  // 2. MATH RUSH LOGIC
  const generateMathProblem = () => {
    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;
    
    if (op === "-") { if (a < b) [a, b] = [b, a]; }
    
    let ans = 0;
    if (op === "+") ans = a + b;
    if (op === "-") ans = a - b;
    if (op === "*") ans = a * b;

    setMathProblem({ q: `${a} ${op} ${b} = ?`, a: ans });
  };

  const handleMathAnswer = (input: number) => {
    if (input === mathProblem.a) {
      setScore(prev => prev + 50 + (combo * 5));
      setCombo(prev => prev + 1);
      generateMathProblem();
    } else {
      setCombo(0);
      setTimeLeft(prev => Math.max(0, prev - 5));
    }
  };

  // 3. WORD MATCH LOGIC
  const handleWordClick = (val: string) => {
    if (matchedPairs.includes(val)) return;
    
    const newSelection = [...selectedPair, val];
    setSelectedPair(newSelection);

    if (newSelection.length === 2) {
      const [first, second] = newSelection;
      const pair = WORD_MATCH_PAIRS.find(p => (p.a === first && p.b === second) || (p.a === second && p.b === first));
      
      if (pair) {
        setScore(prev => prev + 80);
        setMatchedPairs(prev => [...prev, first, second]);
        setCombo(prev => prev + 1);
      } else {
        setCombo(0);
        setTimeLeft(prev => Math.max(0, prev - 2));
      }
      
      setTimeout(() => setSelectedPair([]), 300);
    }
  };

  // --- RENDER HELPERS ---
  
  const renderTrivia = () => {
    const q = TRIVIA_QUESTIONS[questionIndex];
    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-slate-200 text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pertanyaan {questionIndex + 1}/{TRIVIA_QUESTIONS.length}</span>
          <h2 className="text-xl font-bold mt-2 text-slate-800">{q.q}</h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {q.opts.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleTriviaAnswer(opt)}
              className="p-4 rounded-xl bg-white border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 font-bold transition-all active:scale-95 text-left"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderMath = () => {
    const correctAnswer = mathProblem.a;
    const wrong1 = correctAnswer + Math.floor(Math.random() * 3) + 1;
    const wrong2 = correctAnswer - Math.floor(Math.random() * 3) - 1;
    const options = [correctAnswer, wrong1, wrong2].sort(() => Math.random() - 0.5);

    return (
      <div className="space-y-8 w-full max-w-sm text-center">
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl">
          <h2 className="text-5xl font-mono font-black">{mathProblem.q}</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleMathAnswer(opt)}
              className="aspect-square rounded-2xl bg-white border-b-4 border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-2xl font-bold text-slate-800 transition-all active:translate-y-1 active:border-b-0"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderWordMatch = () => {
    const allItems = WORD_MATCH_PAIRS.flatMap(p => [p.a, p.b]).sort(); 

    return (
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {allItems.map((item, i) => {
          const isSelected = selectedPair.includes(item);
          const isMatched = matchedPairs.includes(item);
          
          return (
            <button
              key={i}
              onClick={() => handleWordClick(item)}
              disabled={isMatched}
              className={cn(
                "p-4 rounded-xl font-bold text-sm transition-all border-2",
                isMatched 
                  ? "bg-green-100 border-green-300 text-green-700 opacity-50 scale-95"
                  : isSelected
                    ? "bg-indigo-100 border-indigo-500 text-indigo-700 scale-105 shadow-lg"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
    );
  };

  // --- MAIN RENDER ---

  if (loading) return null;

  return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4", 
      isUni ? "bg-slate-950" : isSMA ? "bg-slate-900" : isKids ? "bg-yellow-50" : "bg-slate-50"
    )}>
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
         <div className={cn("absolute top-[-20%] left-[-20%] w-[50vw] h-[50vw] rounded-full blur-[100px]", 
            isUni ? "bg-indigo-600" : "bg-blue-400")} />
         <div className={cn("absolute bottom-[-20%] right-[-20%] w-[50vw] h-[50vw] rounded-full blur-[100px]", 
            isUni ? "bg-violet-600" : "bg-teal-400")} />
      </div>

      {/* --- LOBBY STATE --- */}
      {gameState === "lobby" && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn("relative z-10 w-full max-w-md p-8 rounded-3xl text-center shadow-2xl border",
            isUni ? "bg-slate-900/80 border-white/10 backdrop-blur-xl text-white" : "bg-white border-slate-200"
          )}
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg mb-6 text-white">
             {gameId === 'math-rush' ? <Zap size={40} /> : gameId === 'word-match' ? <Zap size={40} /> : <Brain size={40} />}
          </div>
          
          <h1 className={cn("text-2xl font-black mb-2", (isUni || isSMA) ? "text-white" : "text-slate-900")}>
            {gameId === 'quick-trivia' ? "Cerdas Cermat" : gameId === 'math-rush' ? "Math Rush" : "Arena Challenge"}
          </h1>
          <p className={cn("text-sm mb-8", (isUni || isSMA) ? "text-slate-400" : "text-slate-500")}>
            Siap menguji kemampuanmu? Kumpulkan poin sebanyak mungkin dalam waktu terbatas!
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8 text-xs font-bold">
             <div className={cn("p-3 rounded-xl", (isUni || isSMA) ? "bg-white/5" : "bg-slate-100")}>
                <Clock className="w-5 h-5 mx-auto mb-1 opacity-50" />
                {gameId === 'math-rush' ? '30 Detik' : '60 Detik'}
             </div>
             <div className={cn("p-3 rounded-xl", (isUni || isSMA) ? "bg-white/5" : "bg-slate-100")}>
                <Trophy className="w-5 h-5 mx-auto mb-1 opacity-50" />
                +Pts Rank
             </div>
          </div>

          <div className="space-y-3">
            <Button onClick={startGame} className="w-full h-12 text-lg font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
               Mulai Sekarang
            </Button>
            <Button variant="ghost" onClick={() => router.back()} className="w-full text-slate-500">
               Kembali
            </Button>
          </div>
        </motion.div>
      )}

      {/* --- PLAYING STATE --- */}
      {gameState === "playing" && (
        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
           {/* HUD */}
           <div className="w-full flex justify-between items-center mb-8 px-4">
              <div className={cn("flex items-center gap-2 font-bold text-xl", timeLeft < 10 ? "text-red-500 animate-pulse" : (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                 <Clock /> {timeLeft}s
              </div>
              <div className="flex flex-col items-end">
                 <span className={cn("text-xs font-bold opacity-60", (isUni || isSMA) ? "text-white" : "text-slate-800")}>SCORE</span>
                 <span className={cn("text-3xl font-black font-mono", isKids ? "text-orange-500" : "text-indigo-500")}>
                    {score}
                 </span>
              </div>
           </div>

           {/* Game Content */}
           <motion.div
             key={questionIndex} 
             initial={{ x: 20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             exit={{ x: -20, opacity: 0 }}
             className="w-full flex justify-center"
           >
              {gameId === 'quick-trivia' && renderTrivia()}
              {gameId === 'math-rush' && renderMath()}
              {(gameId === 'word-match' || gameId === 'word-find') && renderWordMatch()}
           </motion.div>

           {/* Combo Indicator */}
           {combo > 1 && (
             <motion.div 
               initial={{ scale: 0 }} animate={{ scale: 1 }}
               className="absolute top-20 text-yellow-500 font-black text-4xl drop-shadow-lg rotate-12"
             >
               {combo}x COMBO!
             </motion.div>
           )}
        </div>
      )}

      {/* --- FINISHED STATE --- */}
      {gameState === "finished" && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn("relative z-10 w-full max-w-sm p-8 rounded-3xl text-center shadow-2xl border flex flex-col items-center",
            isUni ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200"
          )}
        >
           <div className="w-24 h-24 rounded-full bg-yellow-400 flex items-center justify-center mb-6 shadow-xl shadow-yellow-400/30">
              <Trophy size={48} className="text-yellow-800" />
           </div>
           
           <h2 className="text-3xl font-black mb-1">Game Selesai!</h2>
           <p className="text-slate-500 mb-6">Kamu hebat! Skor akhirmu:</p>
           
           <div className="text-6xl font-black font-mono text-indigo-600 mb-8">
              {score}
           </div>

           <div className="grid grid-cols-2 gap-4 w-full mb-6">
              <div className="p-3 bg-slate-100 rounded-xl dark:bg-slate-800">
                 <span className="text-xs text-slate-500 block">XP Didapat</span>
                 <span className="font-bold text-green-600">+{Math.floor(score / 10) + 10} XP</span>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl dark:bg-slate-800">
                 <span className="text-xs text-slate-500 block">Rank Points</span>
                 <span className="font-bold text-orange-600">+{score} pts</span>
              </div>
           </div>

           <Button onClick={() => router.push("/social/arena")} className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12 rounded-xl font-bold">
              Kembali ke Lobi
           </Button>
        </motion.div>
      )}

    </div>
  );
}