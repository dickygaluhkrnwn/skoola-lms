"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Flame, Clock, ArrowLeft, Star, 
  Target, Zap, Brain, Puzzle, Swords, Lock,
  ChevronRight, Info, Gamepad2, Search, AlertCircle, User, School, Users as UsersIcon, Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, limit, doc, getDoc, orderBy, onSnapshot, setDoc, serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { ArenaSeason, ArenaChallenge, LeaderboardEntry } from "@/lib/types/social.types";
import { UserProfile } from "@/lib/types/user.types";
import { XPBar } from "@/components/gamification/xp-bar";

export default function ArenaClient() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeSeason, setActiveSeason] = useState<ArenaSeason | null>(null);
  
  // Realtime Data States
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]); 
  const [availableGames, setAvailableGames] = useState<ArenaChallenge[]>([]); 
  
  // Toggle Leaderboard Type
  const [lbType, setLbType] = useState<"school" | "individual" | "team">("school");
  
  // Team Logic
  const [myTeam, setMyTeam] = useState<any>(null);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
         router.push("/");
         return;
      }

      try {
        // A. Get User Data
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
           setUserProfile(userDoc.data() as UserProfile);
        }

        // B. Get Active Season
        const seasonsRef = collection(db, "arena_seasons");
        const qSeason = query(seasonsRef, where("isActive", "==", true), limit(1));
        const seasonSnap = await getDocs(qSeason);
        
        if (!seasonSnap.empty) {
           setActiveSeason({ id: seasonSnap.docs[0].id, ...seasonSnap.docs[0].data() } as ArenaSeason);
        }

        // C. Fetch Games (PURE REALTIME)
        const gamesRef = collection(db, "arena_challenges");
        const qGames = query(gamesRef, where("isActive", "==", true)); 
        const gamesSnap = await getDocs(qGames);

        if (!gamesSnap.empty) {
            const fetchedGames = gamesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ArenaChallenge));
            setAvailableGames(fetchedGames);
        } else {
            setAvailableGames([]); 
        }

        // D. Check Team Status
        const teamsRef = collection(db, "teams");
        const qTeam = query(teamsRef, where("members", "array-contains", user.uid));
        const teamSnap = await getDocs(qTeam);
        if(!teamSnap.empty) {
            setMyTeam({ id: teamSnap.docs[0].id, ...teamSnap.docs[0].data() });
        }

      } catch (err) {
        console.error("Error init arena:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- 2. LEADERBOARD LISTENER (Real Data) ---
  useEffect(() => {
    if (!activeSeason) return;

    const lbRef = collection(db, "arena_leaderboards");
    const qLb = query(
        lbRef, 
        where("seasonId", "==", activeSeason.id),
        where("type", "==", lbType), // Dynamic Type Filter
        orderBy("points", "desc"),
        limit(10) // Show top 10
    );

    const unsubscribe = onSnapshot(qLb, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaderboardEntry));
        setLeaderboardData(entries);
    }, (error) => {
        console.warn("Leaderboard fetch error (index might be missing):", error);
    });

    return () => unsubscribe();
  }, [activeSeason, lbType]);

  // --- HANDLERS ---
  const handlePlayGame = (gameId: string) => {
      router.push(`/social/arena/play/${gameId}`);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newTeamName.trim() || !auth.currentUser) return;

      try {
          const teamRef = doc(collection(db, "teams"));
          await setDoc(teamRef, {
              name: newTeamName,
              members: [auth.currentUser.uid],
              createdAt: serverTimestamp(),
              createdBy: auth.currentUser.uid
          });
          
          setMyTeam({ id: teamRef.id, name: newTeamName });
          setIsCreateTeamOpen(false);
          setNewTeamName("");
          alert("Tim berhasil dibuat! Mainkan game untuk menaikkan skor tim.");
      } catch (e) {
          console.error("Failed to create team", e);
      }
  };

  // --- STYLES ---
  const bgStyle = isKids ? "bg-orange-50" 
    : isUni ? "bg-slate-950 text-slate-100" 
    : isSMP ? "bg-indigo-50/50" 
    : isSMA ? "bg-slate-950 text-teal-100" 
    : "bg-slate-50";

  const cardStyle = isUni ? "bg-slate-900/50 border-white/10 backdrop-blur-md" 
    : isSMA ? "bg-slate-900/60 border-teal-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(20,184,166,0.1)]"
    : isKids ? "bg-white border-orange-100 shadow-[0_4px_0_#fed7aa]"
    : "bg-white border-slate-200 shadow-sm";

  if (loading) {
      return (
          <div className={cn("min-h-screen flex items-center justify-center", bgStyle)}>
              <div className="animate-spin text-4xl">⚔️</div>
          </div>
      );
  }

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-500 relative pb-20", bgStyle)}>
      {/* Background Decor */}
      {isUni && (
         <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950" />
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
         </div>
      )}
      {isSMA && (
         <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[120px]" />
         </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-6">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className={cn("rounded-full", (isUni || isSMA) ? "text-slate-400 hover:text-white hover:bg-white/10" : "hover:bg-slate-200")}>
                    <ArrowLeft size={24} />
                </Button>
                <div>
                    <h1 className={cn("text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-2", isKids ? "text-orange-600" : (isUni || isSMA) ? "text-white" : "text-slate-900")}>
                        <Swords size={32} className={cn(isKids ? "text-orange-500" : isUni ? "text-indigo-500" : isSMA ? "text-teal-500" : "text-slate-800")} />
                        Skoola Arena
                    </h1>
                    <p className={cn("text-sm font-medium", (isUni || isSMA) ? "text-slate-400" : "text-slate-500")}>Kompetisi Global & Asah Otak</p>
                </div>
            </div>
            <div className={cn("px-4 py-2 rounded-full flex items-center gap-2 font-bold border", isUni ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300" : isSMA ? "bg-teal-500/10 border-teal-500/30 text-teal-400" : isKids ? "bg-yellow-100 border-yellow-200 text-yellow-700" : "bg-white border-slate-200 text-slate-700 shadow-sm")}>
                <Trophy size={16} className={isKids ? "text-yellow-600" : "text-current"} />
                <span>{userProfile?.arenaStats?.totalPoints || 0} Poin</span>
            </div>
        </header>

        {/* SEASON BANNER */}
        <section className="mb-10">
            {activeSeason ? (
                <div className={cn("relative overflow-hidden rounded-3xl p-8 md:p-12 text-white shadow-2xl transition-all hover:scale-[1.01]", isUni ? "bg-gradient-to-r from-indigo-900 via-violet-900 to-slate-900 border border-indigo-500/30" : isSMA ? "bg-slate-900 border border-teal-500/30" : isKids ? "bg-gradient-to-r from-orange-400 to-yellow-400 shadow-orange-200" : "bg-gradient-to-r from-violet-600 to-indigo-600")}>
                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    {isSMA && <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(45,212,191,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,212,191,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />}

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />Season Aktif
                            </div>
                            <h2 className={cn("text-4xl md:text-6xl font-black mb-2", isSMA ? "font-mono tracking-tighter" : "")}>{activeSeason.title}</h2>
                            <p className="text-white/80 max-w-lg text-lg leading-relaxed">{activeSeason.description}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium opacity-70 mb-1">Berakhir Dalam</p>
                            <div className="flex items-center gap-2 text-2xl font-bold font-mono">
                                <Clock className="animate-pulse" />
                                {Math.max(0, Math.ceil((new Date(activeSeason.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} Hari
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-12 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 text-center flex flex-col items-center justify-center opacity-60">
                    <Lock size={48} className="mb-4 text-slate-400" />
                    <h3 className="text-xl font-bold text-slate-600">Arena Sedang Tutup</h3>
                    <p className="text-slate-500">Tunggu musim kompetisi berikutnya!</p>
                </div>
            )}
        </section>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* GAME LIST */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className={cn("text-xl font-bold flex items-center gap-2", (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                        <Gamepad2 /> Pilih Tantangan
                    </h3>
                    <div className={cn("text-xs px-3 py-1 rounded-full border", (isUni || isSMA) ? "border-white/10 text-slate-400" : "bg-slate-100 text-slate-500")}>
                        {availableGames.length} Tersedia
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableGames.length > 0 ? (
                        availableGames.map((game) => (
                            <motion.button
                                key={game.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={!activeSeason}
                                onClick={() => handlePlayGame(game.id!)}
                                className={cn(
                                    "relative p-6 rounded-2xl border text-left transition-all flex flex-col justify-between h-48 group overflow-hidden",
                                    cardStyle,
                                    !activeSeason && "opacity-50 cursor-not-allowed grayscale"
                                )}
                            >
                                <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br", isKids ? "from-orange-100/50 to-transparent" : isSMA ? "from-teal-500/10 to-transparent" : "from-indigo-500/10 to-transparent")} />
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={cn("p-3 rounded-xl", isUni ? "bg-indigo-500/20 text-indigo-300" : isSMA ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : isKids ? "bg-orange-100 text-orange-600" : "bg-violet-100 text-violet-600")}>
                                            {game.type === 'trivia' && <Brain size={24} />}
                                            {game.type === 'math-rush' && <Zap size={24} />}
                                            {game.type === 'word-match' && <Puzzle size={24} />}
                                            {game.type === 'word-find' && <Search size={24} />}
                                        </div>
                                        <div className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded border", game.difficulty === 'easy' ? "border-green-200 text-green-600 bg-green-50" : game.difficulty === 'medium' ? "border-yellow-200 text-yellow-600 bg-yellow-50" : "border-red-200 text-red-600 bg-red-50")}>
                                            {game.difficulty}
                                        </div>
                                    </div>
                                    <h4 className={cn("font-bold text-lg leading-tight mb-1", (isUni || isSMA) ? "text-slate-100" : "text-slate-800")}>{game.title}</h4>
                                    <p className={cn("text-xs line-clamp-2", (isUni || isSMA) ? "text-slate-400" : "text-slate-500")}>{game.description}</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium mt-4 z-10">
                                    <span className={cn("flex items-center gap-1", isKids ? "text-orange-600" : isSMA ? "text-teal-400" : "text-indigo-600")}>
                                        <Trophy size={14} /> +{game.pointsReward} Pts
                                    </span>
                                    <span className="text-slate-400 flex items-center gap-1">
                                        <Clock size={14} /> {game.timeLimit}s
                                    </span>
                                </div>
                            </motion.button>
                        ))
                    ) : (
                        <div className="col-span-full p-8 text-center text-slate-500 bg-slate-100 rounded-xl">
                            Belum ada game tersedia. Admin harus melakukan 'Seed Games' terlebih dahulu.
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: STATS & LEADERBOARD */}
            <div className="space-y-6">
                <div className={cn("p-6 rounded-2xl border relative overflow-hidden", cardStyle)}>
                    <h3 className={cn("font-bold mb-4 flex items-center gap-2", (isUni || isSMA) ? "text-white" : "text-slate-800")}><Target size={18} /> Statistik Kamu</h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className={cn("p-3 rounded-xl text-center", (isUni || isSMA) ? "bg-white/5" : "bg-slate-50")}>
                            <p className="text-xs opacity-60 mb-1">Rank Global</p>
                            <p className={cn("text-xl font-black", isSMA ? "text-teal-400" : "text-slate-800")}>#{userProfile?.arenaStats?.currentRank || "-"}</p>
                        </div>
                        <div className={cn("p-3 rounded-xl text-center", (isUni || isSMA) ? "bg-white/5" : "bg-slate-50")}>
                            <p className="text-xs opacity-60 mb-1">Menang</p>
                            <p className={cn("text-xl font-black", isSMA ? "text-teal-400" : "text-slate-800")}>{userProfile?.arenaStats?.gamesWon || 0}</p>
                        </div>
                    </div>
                    <div className="mt-4">
                       <XPBar currentXP={userProfile?.gamification?.xp || 0} maxXP={1000 * (userProfile?.gamification?.level || 1)} level={userProfile?.gamification?.level || 1} />
                    </div>
                </div>

                <div className={cn("p-6 rounded-2xl border", cardStyle)}>
                    {/* LEADERBOARD TOGGLE */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={cn("font-bold text-sm", (isUni || isSMA) ? "text-white" : "text-slate-800")}>Leaderboard (Live)</h3>
                        <div className={cn("flex rounded-lg p-1 gap-1", (isUni || isSMA) ? "bg-white/10" : "bg-slate-100")}>
                            <button 
                                onClick={() => setLbType("school")}
                                className={cn("p-1.5 rounded-md transition-all", lbType === "school" ? "bg-white shadow text-slate-800" : "text-slate-400 hover:text-slate-600")}
                                title="Top Sekolah"
                            >
                                <School size={16} />
                            </button>
                            <button 
                                onClick={() => setLbType("team")}
                                className={cn("p-1.5 rounded-md transition-all", lbType === "team" ? "bg-white shadow text-slate-800" : "text-slate-400 hover:text-slate-600")}
                                title="Top Tim"
                            >
                                <UsersIcon size={16} />
                            </button>
                            <button 
                                onClick={() => setLbType("individual")}
                                className={cn("p-1.5 rounded-md transition-all", lbType === "individual" ? "bg-white shadow text-slate-800" : "text-slate-400 hover:text-slate-600")}
                                title="Top Siswa"
                            >
                                <User size={16} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {lbType === 'team' && !myTeam && (
                            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-center">
                                <p className="text-xs mb-2 opacity-80">Kamu belum punya tim!</p>
                                <Button size="sm" onClick={() => setIsCreateTeamOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8">Buat Tim</Button>
                            </div>
                        )}

                        {leaderboardData.length > 0 ? (
                            leaderboardData.map((entry, index) => (
                                <div key={entry.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                    <span className={cn("w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold", index === 0 ? "bg-yellow-500 text-white" : index === 1 ? "bg-slate-400 text-white" : index === 2 ? "bg-orange-700 text-white" : (isUni || isSMA) ? "text-slate-500" : "text-slate-400")}>{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm font-bold truncate", (isUni || isSMA) ? "text-slate-300" : "text-slate-800")}>{entry.name}</p>
                                        {/* Show school name for individual rank */}
                                        {lbType === "individual" && entry.schoolName && <p className="text-[10px] opacity-60 truncate">{entry.schoolName}</p>}
                                    </div>
                                    <span className="text-xs font-mono opacity-50">{entry.points.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 opacity-50 text-xs flex flex-col items-center">
                               <AlertCircle size={24} className="mb-2 opacity-50" />
                               <span>Belum ada data peringkat {lbType === 'school' ? 'Sekolah' : lbType === 'team' ? 'Tim' : 'Siswa'}.</span>
                               {lbType === 'individual' && <span className="opacity-50 mt-1">Mainkan game untuk masuk leaderboard!</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* CREATE TEAM MODAL */}
        <AnimatePresence>
            {isCreateTeamOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsCreateTeamOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div 
                        initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} 
                        className={cn(
                            "p-6 rounded-2xl w-full max-w-sm relative z-10 shadow-xl",
                            (isSMA || isUni) ? "bg-slate-900 border border-white/10 text-white" : "bg-white"
                        )}
                    >
                        <h2 className="text-lg font-bold mb-4">Buat Tim Baru</h2>
                        <form onSubmit={handleCreateTeam}>
                            <input 
                                autoFocus
                                placeholder="Nama Tim (misal: Cyber Warriors)"
                                className={cn(
                                    "w-full p-3 border rounded-xl mb-4 outline-none focus:ring-2",
                                    (isSMA || isUni) 
                                    ? "bg-slate-800 border-slate-700 text-white focus:ring-teal-500 placeholder:text-slate-500" 
                                    : "bg-slate-50 border-slate-200 focus:ring-blue-500"
                                )}
                                value={newTeamName}
                                onChange={e => setNewTeamName(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsCreateTeamOpen(false)}>Batal</Button>
                                <Button type="submit">Buat</Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}