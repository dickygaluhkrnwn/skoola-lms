"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, Database, Trash2, Activity, Users, 
  School, BookOpen, FileText, Server, LogOut, 
  Trophy, PlayCircle, RefreshCw, Gamepad2, Eraser
} from "lucide-react";
import { auth, db } from "../../lib/firebase"; 
import { 
  collection, getDocs, deleteDoc, doc, writeBatch, getCountFromServer, 
  setDoc, serverTimestamp, query, where 
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Button } from "../../components/ui/button";
import { ArenaSeason, ArenaChallenge } from "@/lib/types/social.types";

export default function AdminConsolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    classes: 0,
    materials: 0,
    assignments: 0
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "arena">("dashboard");

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      addLog("Fetching system stats...");

      const usersSnap = await getCountFromServer(collection(db, "users"));
      const classesSnap = await getCountFromServer(collection(db, "classrooms"));
      const usersQuery = await getDocs(collection(db, "users"));
      const usersData = usersQuery.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsersList(usersData);

      setStats({
        users: usersSnap.data().count,
        classes: classesSnap.data().count,
        materials: 0,
        assignments: 0
      });

      addLog("Stats updated successfully.");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      addLog("ERROR: Failed to fetch stats.");
      setLoading(false);
    }
  };

  const handleResetSystem = async () => {
    const confirm1 = confirm("⚠️ PERINGATAN KERAS: Hapus SEMUA data KELAS? Data Pengguna aman.");
    if (!confirm1) return;
    
    setLoading(true);
    addLog("Memulai SYSTEM PURGE...");
    
    try {
      const batch = writeBatch(db);
      const classesSnap = await getDocs(collection(db, "classrooms"));
      classesSnap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      addLog(`BERHASIL: Menghapus kelas.`);
      fetchStats();
    } catch (error) {
      console.error(error);
      addLog("ERROR: Gagal purge.");
    } finally {
      setLoading(false);
    }
  };

  // --- ARENA CONTROL ---

  const handleStartSeason = async () => {
      const confirmStart = confirm("Mulai Season Baru? (Leaderboard akan dikosongkan dari data dummy otomatis)");
      if (!confirmStart) return;

      setLoading(true);
      addLog("Starting New Season...");

      try {
          const batch = writeBatch(db);

          // 1. Deactivate old seasons
          const seasonsRef = collection(db, "arena_seasons");
          const activeSnap = await getDocs(query(seasonsRef, where("isActive", "==", true)));
          activeSnap.forEach(doc => batch.update(doc.ref, { isActive: false }));

          // 2. Create New Season
          const seasonId = `season-${Date.now()}`;
          const newSeason: ArenaSeason = {
              id: seasonId,
              title: "Season 1: Cyber Punk",
              description: "Tunjukkan skill digitalmu di era masa depan! Kumpulkan poin dan menangkan badge eksklusif.",
              themeColor: "#8b5cf6",
              isActive: true,
              startDate: Date.now(),
              endDate: Date.now() + (30 * 24 * 60 * 60 * 1000)
          };
          const newSeasonRef = doc(db, "arena_seasons", seasonId);
          batch.set(newSeasonRef, newSeason);

          // NOTE: Tidak lagi mengisi Dummy Schools di sini agar Leaderboard bersih (0 data)
          
          await batch.commit();
          addLog(`SUCCESS: Season ${seasonId} active. Leaderboard is empty.`);
          alert("Season 1 Berhasil Dimulai (Data Kosong)!");

      } catch (err: any) {
          console.error(err);
          addLog(`ERROR: ${err.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handleSeedGames = async () => {
      setLoading(true);
      addLog("Seeding Games to DB...");
      try {
          const batch = writeBatch(db);
          
          const gamesData: ArenaChallenge[] = [
            { id: "quick-trivia", title: "Cerdas Cermat", description: "Jawab 10 soal pengetahuan umum secepat kilat!", type: "trivia", difficulty: "medium", pointsReward: 100, timeLimit: 60, xpReward: 50 },
            { id: "math-rush", title: "Math Rush", description: "Hitungan matematika dasar. Salah sekali, game over!", type: "math-rush", difficulty: "hard", pointsReward: 150, timeLimit: 30, xpReward: 75 },
            { id: "word-match", title: "Cocok Kata", description: "Hubungkan sinonim atau istilah sains yang sesuai.", type: "word-match", difficulty: "easy", pointsReward: 80, timeLimit: 90, xpReward: 40 },
            { id: "word-find", title: "Cari Kata", description: "Temukan kata tersembunyi dalam grid.", type: "word-find", difficulty: "medium", pointsReward: 100, timeLimit: 120, xpReward: 50 }
          ];

          gamesData.forEach(game => {
              const gameRef = doc(db, "arena_challenges", game.id);
              batch.set(gameRef, { ...game, isActive: true });
          });

          await batch.commit();
          addLog("SUCCESS: Games uploaded to Firestore.");
      } catch (err: any) {
          addLog(`ERROR: ${err.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handleClearLeaderboard = async () => {
      if(!confirm("Hapus semua data Leaderboard?")) return;
      setLoading(true);
      addLog("Clearing Leaderboard...");
      try {
          const batch = writeBatch(db);
          const lbSnap = await getDocs(collection(db, "arena_leaderboards"));
          lbSnap.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          addLog("SUCCESS: Leaderboard wiped.");
      } catch (err: any) {
          addLog(`ERROR: ${err.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-green-500 font-mono">
      <Activity className="animate-pulse mb-4" size={48} />
      <p>INITIALIZING SYSTEM MONITOR...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono flex">
       {/* SIDEBAR */}
       <aside className="w-64 border-r border-slate-800 bg-black/50 hidden md:flex flex-col">
          <div className="p-6 border-b border-slate-800">
             <div className="flex items-center gap-2 text-green-500 mb-1">
                <Server size={20} />
                <span className="font-bold tracking-widest">SYS.ADMIN</span>
             </div>
             <p className="text-xs text-slate-500">v2.0.4-stable</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
             <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                <Activity size={18} /> Monitoring
             </button>
             <button onClick={() => setActiveTab("users")} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                <Users size={18} /> User Database
             </button>
             <button onClick={() => setActiveTab("arena")} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold transition-all ${activeTab === 'arena' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                <Trophy size={18} /> Arena Control
             </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
             <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold w-full px-4 py-2 hover:bg-red-500/10 rounded transition-colors">
                <LogOut size={16} /> TERMINATE SESSION
             </button>
          </div>
       </aside>

       {/* MAIN CONTENT */}
       <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "dashboard" && (
             <div className="space-y-6">
                <header className="flex justify-between items-center mb-8">
                   <h1 className="text-2xl font-bold text-white flex items-center gap-3"><ShieldAlert className="text-green-500" /> SYSTEM OVERVIEW</h1>
                   <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />OPERATIONAL</div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <StatBox label="TOTAL USERS" value={stats.users} icon={<Users size={24}/>} color="blue" />
                   <StatBox label="ACTIVE CLASSROOMS" value={stats.classes} icon={<School size={24}/>} color="purple" />
                   <StatBox label="MATERIALS" value="N/A" icon={<BookOpen size={24}/>} color="yellow" />
                   <StatBox label="ASSIGNMENTS" value="N/A" icon={<FileText size={24}/>} color="pink" />
                </div>
                {/* LOGS */}
                <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs h-64 flex flex-col">
                    <div className="text-slate-400 font-bold mb-2 border-b border-slate-800 pb-2">SYSTEM LOGS</div>
                    <div className="flex-1 overflow-y-auto space-y-1 text-slate-300">
                        {logs.map((log, i) => <div key={i} className="border-l-2 border-slate-800 pl-2 hover:bg-white/5 py-0.5">{log}</div>)}
                    </div>
                </div>
             </div>
          )}

          {activeTab === "users" && (
             <div>
                <header className="mb-6"><h1 className="text-2xl font-bold text-white">USER DATABASE</h1></header>
                <div className="bg-black/40 border border-slate-800 rounded-xl overflow-hidden">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-xs">
                         <tr><th className="px-6 py-4">Display Name</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Level</th><th className="px-6 py-4">Email</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                         {usersList.map((u) => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                               <td className="px-6 py-4 font-bold text-slate-200">{u.displayName}</td>
                               <td className="px-6 py-4"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300">{u.role || 'STUDENT'}</span></td>
                               <td className="px-6 py-4 text-slate-400">Lvl {u.level || 1}</td>
                               <td className="px-6 py-4 text-slate-500 font-mono">{u.email}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === "arena" && (
              <div className="space-y-6">
                  <header className="mb-6 border-b border-slate-800 pb-4">
                      <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Trophy className="text-yellow-500" /> ARENA CONTROL</h1>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><PlayCircle size={20} /> Season Manager</h3>
                          <Button onClick={handleStartSeason} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Start New Season</Button>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Gamepad2 size={20} /> Game Content</h3>
                          <Button onClick={handleSeedGames} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold">Seed Games to DB</Button>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 text-red-400"><Eraser size={20} /> Data Cleanup</h3>
                          <Button onClick={handleClearLeaderboard} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold">Clear Leaderboard</Button>
                      </div>
                  </div>
              </div>
          )}
       </main>
    </div>
  );
}

function StatBox({ label, value, icon, color }: any) {
   const colors: any = { blue: "text-blue-400 bg-blue-500/10 border-blue-500/20", purple: "text-purple-400 bg-purple-500/10 border-purple-500/20", yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", pink: "text-pink-400 bg-pink-500/10 border-pink-500/20" }
   return (
      <div className={`p-6 rounded-xl border ${colors[color]} flex flex-col justify-between h-32 relative overflow-hidden`}>
         <div className="absolute right-[-10px] top-[-10px] opacity-10 transform scale-150 rotate-12">{React.cloneElement(icon, { size: 64 })}</div>
         <div className="relative z-10 flex justify-between items-start">{icon}<span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">LIVE DATA</span></div>
         <div className="relative z-10"><h3 className="text-3xl font-bold text-white tracking-tighter">{value}</h3><p className="text-xs font-bold opacity-80 uppercase">{label}</p></div>
      </div>
   )
}