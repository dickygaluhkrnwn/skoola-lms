"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, Database, Trash2, Activity, Users, 
  School, BookOpen, FileText, Server, LogOut 
} from "lucide-react";
import { auth, db } from "../../lib/firebase"; 
import { 
  collection, getDocs, deleteDoc, doc, writeBatch, getCountFromServer 
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Button } from "../../components/ui/button";

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
  const [activeTab, setActiveTab] = useState<"dashboard" | "users">("dashboard");

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      addLog("Fetching system stats...");

      // 1. Count Users
      const usersSnap = await getCountFromServer(collection(db, "users"));
      
      // 2. Count Classes
      const classesSnap = await getCountFromServer(collection(db, "classrooms"));

      // 3. Estimate Materials & Assignments (Iterate classes is heavy, simple count for now or sample)
      // Note: For real scalable app, use distributed counters. Here we just count docs in subcollections of a few classes or just skip deep counts for speed.
      // For this demo, let's just count top-level collections if we had them, or skip deep counts to avoid huge reads.
      // We will just fetch Users list for the table.
      
      const usersQuery = await getDocs(collection(db, "users"));
      const usersData = usersQuery.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsersList(usersData);

      setStats({
        users: usersSnap.data().count,
        classes: classesSnap.data().count,
        materials: 0, // Placeholder as calculating deep subcollections is expensive
        assignments: 0 // Placeholder
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
    const confirm1 = confirm("⚠️ PERINGATAN KERAS: Ini akan menghapus SEMUA data KELAS (Materi, Tugas, Submission). Data Pengguna TIDAK dihapus. Lanjutkan?");
    if (!confirm1) return;
    
    const confirm2 = confirm("Apakah Anda benar-benar yakin? Tindakan ini tidak dapat dibatalkan.");
    if (!confirm2) return;
    
    setLoading(true);
    addLog("Memulai SYSTEM PURGE...");
    
    try {
      const batch = writeBatch(db);
      const classesSnap = await getDocs(collection(db, "classrooms"));
      
      let count = 0;
      classesSnap.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });

      await batch.commit();
      addLog(`BERHASIL: Menghapus ${count} kelas.`);
      fetchStats();
    } catch (error) {
      console.error(error);
      addLog("ERROR: Gagal melakukan purge.");
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
             <button 
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
             >
                <Activity size={18} /> Monitoring
             </button>
             <button 
                onClick={() => setActiveTab("users")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
             >
                <Users size={18} /> User Database
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
                   <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                      <ShieldAlert className="text-green-500" /> SYSTEM OVERVIEW
                   </h1>
                   <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      OPERATIONAL
                   </div>
                </header>

                {/* STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <StatBox label="TOTAL USERS" value={stats.users} icon={<Users size={24}/>} color="blue" />
                   <StatBox label="ACTIVE CLASSROOMS" value={stats.classes} icon={<School size={24}/>} color="purple" />
                   <StatBox label="MATERIALS" value="N/A" icon={<BookOpen size={24}/>} color="yellow" />
                   <StatBox label="ASSIGNMENTS" value="N/A" icon={<FileText size={24}/>} color="pink" />
                </div>

                {/* LOGS & ACTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* LOG CONSOLE */}
                   <div className="lg:col-span-2 bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs h-96 flex flex-col">
                      <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
                         <span className="text-slate-400 font-bold">SYSTEM LOGS</span>
                         <span className="text-slate-600">tail -f system.log</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1 text-slate-300">
                         {logs.map((log, i) => (
                            <div key={i} className="border-l-2 border-slate-800 pl-2 hover:bg-white/5 py-0.5">{log}</div>
                         ))}
                         {logs.length === 0 && <div className="text-slate-600 italic">No activity recorded...</div>}
                      </div>
                   </div>

                   {/* DANGER ZONE */}
                   <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-6">
                      <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                         <Database size={18} /> DANGER ZONE
                      </h3>
                      <p className="text-red-300/60 text-xs mb-6">
                         Tindakan di bawah ini bersifat destruktif dan tidak dapat dikembalikan. Gunakan hanya saat maintenance atau debugging.
                      </p>
                      
                      <Button 
                         onClick={handleResetSystem}
                         className="w-full bg-red-600 hover:bg-red-500 text-white font-bold border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                      >
                         <Trash2 size={16} className="mr-2" /> PURGE CLASSROOMS
                      </Button>
                   </div>
                </div>
             </div>
          )}

          {activeTab === "users" && (
             <div>
                <header className="mb-6">
                   <h1 className="text-2xl font-bold text-white">USER DATABASE</h1>
                   <p className="text-slate-500 text-sm">Registered entities in the system.</p>
                </header>

                <div className="bg-black/40 border border-slate-800 rounded-xl overflow-hidden">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-xs">
                         <tr>
                            <th className="px-6 py-4">Display Name</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Level</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4 text-right">UID</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                         {usersList.map((u) => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                               <td className="px-6 py-4 font-bold text-slate-200">{u.displayName}</td>
                               <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'teacher' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                                     {u.role || 'STUDENT'}
                                  </span>
                               </td>
                               <td className="px-6 py-4 text-slate-400">Lvl {u.level || u.gamification?.level || 1}</td>
                               <td className="px-6 py-4 text-slate-500 font-mono">{u.email}</td>
                               <td className="px-6 py-4 text-right text-slate-600 font-mono text-xs">{u.id.substring(0, 8)}...</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

       </main>
    </div>
  );
}

function StatBox({ label, value, icon, color }: any) {
   const colors: any = {
      blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
      pink: "text-pink-400 bg-pink-500/10 border-pink-500/20",
   }
   
   return (
      <div className={`p-6 rounded-xl border ${colors[color]} flex flex-col justify-between h-32 relative overflow-hidden`}>
         <div className="absolute right-[-10px] top-[-10px] opacity-10 transform scale-150 rotate-12">
            {React.cloneElement(icon, { size: 64 })}
         </div>
         <div className="relative z-10 flex justify-between items-start">
            {icon}
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">LIVE DATA</span>
         </div>
         <div className="relative z-10">
            <h3 className="text-3xl font-bold text-white tracking-tighter">{value}</h3>
            <p className="text-xs font-bold opacity-80 uppercase">{label}</p>
         </div>
      </div>
   )
}