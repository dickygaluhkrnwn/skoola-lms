"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Users, Share2, Copy, Check, 
  Trophy, Flame, Activity, Star, Shield, Crown, Zap, 
  Settings, LogOut, Trash2, X, Target, Award
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { 
  doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, deleteDoc, arrayRemove, arrayUnion 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/lib/types/user.types";
import { SocialPost } from "@/lib/types/social.types";

interface GroupData {
  id: string;
  name: string;
  description?: string;
  members: string[]; 
  createdBy: string;
  createdAt: any;
  schoolId?: string;
  completedChallenges?: string[]; 
}

// Dummy Team Challenges (Bisa dipindah ke DB 'team_challenges' nanti)
const TEAM_CHALLENGES = [
    { id: "ch-starter", title: "Tim Pemula", desc: "Kumpulkan total 500 Poin Tim.", target: 500, icon: <Zap />, reward: "⚡ Starter Badge" },
    { id: "ch-active", title: "Tim Aktif", desc: "Rata-rata streak anggota mencapai 3 hari.", target: 3, type: "streak", icon: <Flame />, reward: "🔥 On Fire Badge" },
    { id: "ch-elite", title: "Squad Elite", desc: "Kumpulkan total 5000 Poin Tim.", target: 5000, icon: <Crown />, reward: "👑 Elite Badge" },
];

export default function GroupDetailClient({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Group Data
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  
  // Stats Data
  const [teamPoints, setTeamPoints] = useState(0);
  const [teamStreak, setTeamStreak] = useState(0);
  
  // Feed Data & UI
  const [activities, setActivities] = useState<SocialPost[]>([]);
  const [activeTab, setActiveTab] = useState<"activity" | "challenges">("activity"); 
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMA = theme === "sma";
  const isSMP = theme === "smp"; 

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      if (!currUser) {
        router.push("/");
        return;
      }
      setUser(currUser);

      try {
        // Fetch User Profile
        const userDoc = await getDoc(doc(db, "users", currUser.uid));
        if (userDoc.exists()) {
           setUserProfile(userDoc.data() as UserProfile);
        }

        // Fetch Group Metadata (FIXED: Collection 'teams' instead of 'groups')
        const groupDoc = await getDoc(doc(db, "teams", groupId));
        if (groupDoc.exists()) {
           const gData = { id: groupDoc.id, ...groupDoc.data() } as GroupData;
           setGroup(gData);
           setEditName(gData.name);
           setEditDesc(gData.description || "");

           // Fetch Members Data
           if (gData.members && gData.members.length > 0) {
              const qMembers = query(collection(db, "users"), where("uid", "in", gData.members.slice(0, 10)));
              const membersSnap = await getDocs(qMembers);
              const membersList = membersSnap.docs.map(d => d.data() as UserProfile);
              setMembers(membersList);

              // Calculate Team Stats
              const totalP = membersList.reduce((acc, curr) => acc + (curr.arenaStats?.totalPoints || 0), 0);
              const avgStreak = Math.floor(membersList.reduce((acc, curr) => acc + (curr.gamification?.currentStreak || 0), 0) / membersList.length);
              setTeamPoints(totalP);
              setTeamStreak(avgStreak);
           }
        } else {
           // Jika tidak ditemukan, jangan langsung redirect jika baru dibuat (kadang ada delay propagasi)
           // Tapi untuk UX standar, alert dulu
           console.error("Tim tidak ditemukan di database:", groupId);
           alert("Tim tidak ditemukan atau telah dihapus!");
           router.push("/social");
        }
      } catch (err) {
        console.error("Error fetching group:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [groupId, router]);

  // --- 2. ACTIVITIES LISTENER ---
  useEffect(() => {
    if (!groupId) return;

    const q = query(
      collection(db, "posts"),
      where("contextType", "==", "group"),
      where("contextId", "==", groupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
              id: doc.id, 
              ...data,
              createdAt: (data.timestamp?.seconds * 1000) || Date.now()
          } as SocialPost;
      });
      
      fetchedPosts.sort((a, b) => b.createdAt - a.createdAt);
      setActivities(fetchedPosts);
    });

    return () => unsubscribe();
  }, [groupId]);

  // --- ACTIONS ---
  
  const handleShareInvite = async () => {
    if (!user || !group || isSharing) return;
    
    setIsSharing(true);
    try {
        const inviteText = `🚀 Ayo gabung tim **${group.name}** di Skoola Arena! \n\nGunakan Kode Tim: **${group.id}** \n\nKita butuh anggota hebat sepertimu untuk push rank! 🔥`;
        
        await addDoc(collection(db, "posts"), {
            authorId: user.uid,
            authorName: userProfile?.displayName,
            authorAvatar: userProfile?.photoURL || "",
            authorRole: userProfile?.role,
            authorSchoolId: userProfile?.schoolId || "",
            authorSchoolName: userProfile?.schoolName || "Umum",
            
            content: inviteText,
            likes: 0,
            comments: 0,
            contextType: "global",
            contextId: "public",
            
            timestamp: serverTimestamp(),
            createdAt: Date.now() 
        });
        
        alert("Undangan berhasil dibagikan ke Beranda Global!");
    } catch (error) {
        console.error("Failed to share invite", error);
        alert("Gagal membagikan undangan.");
    } finally {
        setIsSharing(false);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!group || !user) return;

      try {
          const groupRef = doc(db, "teams", groupId); // FIXED: 'teams'
          await updateDoc(groupRef, {
              name: editName,
              description: editDesc
          });
          
          setGroup(prev => prev ? { ...prev, name: editName, description: editDesc } : null);
          setIsEditOpen(false);
          alert("Profil tim berhasil diperbarui!");
      } catch (error) {
          console.error("Update failed:", error);
          alert("Gagal memperbarui profil tim.");
      }
  };

  const handleLeaveTeam = async () => {
      if (!confirm("Yakin ingin keluar dari tim ini?")) return;
      if (!group || !user) return;

      try {
          const groupRef = doc(db, "teams", groupId); // FIXED: 'teams'
          await updateDoc(groupRef, { members: arrayRemove(user.uid) });
          router.push("/social");
      } catch (error) {
          console.error("Leave failed:", error);
      }
  };

  const handleDeleteTeam = async () => {
      if (!confirm("⚠️ PERHATIAN: Menghapus tim tidak bisa dibatalkan.")) return;
      if (!group) return;

      try {
          await deleteDoc(doc(db, "teams", groupId)); // FIXED: 'teams'
          router.push("/social");
      } catch (error) {
          console.error("Delete failed:", error);
      }
  };

  // --- CLAIM BADGE LOGIC ---
  const handleClaimBadge = async (challenge: any) => {
      if (!group || !user) return;
      
      // Validasi Syarat
      const currentVal = challenge.type === 'streak' ? teamStreak : teamPoints;
      if (currentVal < challenge.target) return; // Belum memenuhi syarat

      try {
          // 1. Update Group Data (Tandai challenge selesai)
          const groupRef = doc(db, "teams", groupId); // FIXED: 'teams'
          await updateDoc(groupRef, {
              completedChallenges: arrayUnion(challenge.id)
          });

          // 2. Post Achievement to Global Feed
          const achieveText = `🏆 Tim **${group.name}** baru saja membuka pencapaian: **${challenge.reward}**! \n\nSelamat kepada seluruh anggota tim atas kerja kerasnya! 🎉`;
          
          await addDoc(collection(db, "posts"), {
              authorId: user.uid,
              authorName: "Sistem Skoola",
              authorAvatar: "", // System avatar
              authorRole: "admin",
              authorSchoolId: "",
              authorSchoolName: "Skoola Arena",
              
              content: achieveText,
              likes: 0,
              comments: 0,
              contextType: "global",
              contextId: "public",
              
              timestamp: serverTimestamp(),
              createdAt: Date.now()
          });

          // 3. Log to Activity Feed (Lokal)
          await addDoc(collection(db, "posts"), {
              authorId: "system",
              authorName: "Pencapaian Tim",
              authorAvatar: "",
              contextType: "group",
              contextId: groupId,
              content: `Mendapatkan badge ${challenge.reward}!`,
              createdAt: Date.now()
          });

          // Update local state
          setGroup(prev => prev ? { ...prev, completedChallenges: [...(prev.completedChallenges || []), challenge.id] } : null);
          alert(`Selamat! Badge ${challenge.reward} berhasil diklaim dan diposting!`);

      } catch (err) {
          console.error("Claim failed:", err);
      }
  };

  const copyInviteCode = () => {
      navigator.clipboard.writeText(groupId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // --- STYLES ---
  const bgStyle = isKids ? "bg-orange-50" 
    : isUni ? "bg-slate-950 text-slate-100" 
    : isSMP ? "bg-indigo-50/30" 
    : isSMA ? "bg-slate-950 text-slate-200" 
    : "bg-slate-50";

  const cardStyle = isUni ? "bg-slate-900/50 border-white/10 backdrop-blur-md" 
    : isSMA ? "bg-slate-900/60 border-teal-500/20 backdrop-blur-md"
    : "bg-white border-slate-200 shadow-sm";

  if (loading) return <div className={cn("min-h-screen flex items-center justify-center", bgStyle)}>Loading...</div>;

  const isLeader = group?.createdBy === user?.uid;

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-500 pb-20", bgStyle)}>
        
        {/* --- HEADER BANNER --- */}
        <div className={cn("h-64 relative overflow-hidden flex items-end p-6", 
            isUni ? "bg-gradient-to-r from-indigo-900 to-slate-900" :
            isSMA ? "bg-gradient-to-r from-slate-900 to-teal-900" :
            isKids ? "bg-gradient-to-r from-yellow-400 to-orange-400" :
            isSMP ? "bg-gradient-to-r from-violet-600 to-indigo-600" :
            "bg-gradient-to-r from-blue-600 to-indigo-600"
        )}>
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            <div className="relative z-10 w-full max-w-5xl mx-auto">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-6">
                        <div className={cn("w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl border-4", 
                            isUni ? "bg-slate-900 border-white/10" : "bg-white border-white/50 text-slate-800"
                        )}>
                            <Users size={48} className={isUni ? "text-indigo-400" : "text-blue-500"} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">Team</span>
                                {group?.createdBy === user.uid && <span className="bg-yellow-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-yellow-300 border border-yellow-500/30">Leader</span>}
                            </div>
                            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{group?.name}</h1>
                            <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                                <span className="flex items-center gap-1"><Users size={14}/> {group?.members.length} Anggota</span>
                                <span className="flex items-center gap-1"><Trophy size={14}/> {teamPoints.toLocaleString()} Poin Total</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={copyInviteCode} className="bg-white text-slate-900 hover:bg-slate-100 gap-2 font-bold">
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            <span className="hidden md:inline">{copied ? "ID Tersalin" : "Salin ID"}</span>
                        </Button>
                        {isLeader ? (
                            <Button onClick={() => setIsEditOpen(true)} className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20" size="icon">
                                <Settings size={20} />
                            </Button>
                        ) : (
                            <Button onClick={handleLeaveTeam} className="bg-red-500/20 hover:bg-red-500/40 text-white backdrop-blur-md border border-red-500/30" size="icon">
                                <LogOut size={20} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- DASHBOARD CONTENT --- */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: MAIN CONTENT (STATS & TABS) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className={cn("p-4 rounded-2xl border flex flex-col items-center justify-center text-center h-32", cardStyle)}>
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-2 text-yellow-600">
                            <Trophy size={20} />
                        </div>
                        <span className="text-2xl font-black">{teamPoints}</span>
                        <span className="text-xs opacity-60 uppercase font-bold tracking-wider">Total Poin</span>
                    </div>
                    <div className={cn("p-4 rounded-2xl border flex flex-col items-center justify-center text-center h-32", cardStyle)}>
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2 text-orange-600">
                            <Flame size={20} />
                        </div>
                        <span className="text-2xl font-black">{teamStreak}</span>
                        <span className="text-xs opacity-60 uppercase font-bold tracking-wider">Rata-rata Streak</span>
                    </div>
                    <div className={cn("p-4 rounded-2xl border flex flex-col items-center justify-center text-center h-32 col-span-2 md:col-span-1", cardStyle)}>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 text-blue-600">
                            <Zap size={20} />
                        </div>
                        <span className="text-2xl font-black">#{userProfile?.arenaStats?.currentRank || "-"}</span>
                        <span className="text-xs opacity-60 uppercase font-bold tracking-wider">Rank Tim</span>
                    </div>
                </div>

                {/* TABS NAVIGATION */}
                <div className="flex gap-2 border-b border-dashed border-slate-200/20 pb-2">
                    <button 
                        onClick={() => setActiveTab("activity")}
                        className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2", 
                            activeTab === "activity" ? (isUni ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800") : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Activity size={16} /> Aktivitas
                    </button>
                    <button 
                        onClick={() => setActiveTab("challenges")}
                        className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2", 
                            activeTab === "challenges" ? (isUni ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800") : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Target size={16} /> Misi Tim
                    </button>
                </div>

                {/* TAB CONTENT: ACTIVITY */}
                {activeTab === "activity" && (
                    <div className={cn("p-6 rounded-2xl border min-h-[400px]", cardStyle)}>
                        <h3 className={cn("font-bold mb-6 flex items-center gap-2 text-lg", (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                            Riwayat Tim
                        </h3>
                        <div className="space-y-6">
                            {activities.length === 0 ? (
                                <div className="text-center py-12 opacity-50 flex flex-col items-center border-2 border-dashed border-slate-200 rounded-xl">
                                    <Star size={40} className="mb-3 text-slate-300" />
                                    <p className="font-medium">Belum ada aktivitas.</p>
                                    <p className="text-xs max-w-xs mt-1">Selesaikan tantangan di Arena untuk mencatat sejarah timmu!</p>
                                </div>
                            ) : (
                                activities.map((act) => (
                                    <div key={act.id} className="flex gap-4 relative">
                                        <div className="absolute left-4 top-10 bottom-[-24px] w-0.5 bg-slate-200 dark:bg-slate-700 last:hidden"></div>
                                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center z-10 shrink-0">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        </div>
                                        <div className="pb-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn("font-bold text-sm", (isUni || isSMA) ? "text-slate-200" : "text-slate-900")}>
                                                    {act.authorName}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(act.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className={cn("text-sm", (isUni || isSMA) ? "text-slate-400" : "text-slate-600")}>
                                                {act.content}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: CHALLENGES */}
                {activeTab === "challenges" && (
                    <div className="space-y-4">
                        {TEAM_CHALLENGES.map((challenge) => {
                            const isCompleted = group?.completedChallenges?.includes(challenge.id);
                            const currentVal = challenge.type === 'streak' ? teamStreak : teamPoints;
                            const progress = Math.min((currentVal / challenge.target) * 100, 100);
                            const canClaim = !isCompleted && currentVal >= challenge.target;

                            return (
                                <div key={challenge.id} className={cn("p-5 rounded-xl border relative overflow-hidden", cardStyle)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", isCompleted ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500")}>
                                                {challenge.icon}
                                            </div>
                                            <div>
                                                <h4 className={cn("font-bold text-lg", (isUni || isSMA) ? "text-white" : "text-slate-900")}>
                                                    {challenge.title}
                                                </h4>
                                                <p className="text-sm opacity-70">{challenge.desc}</p>
                                            </div>
                                        </div>
                                        {isCompleted ? (
                                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1">
                                                <Check size={12} /> Selesai
                                            </span>
                                        ) : (
                                            <span className="text-xs font-mono opacity-60">
                                                {currentVal} / {challenge.target}
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${progress}%` }} 
                                            className={cn("h-full", isCompleted ? "bg-green-500" : "bg-blue-500")}
                                        />
                                    </div>

                                    {/* Claim Action */}
                                    <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-200/20">
                                        <div className="flex items-center gap-2 text-xs font-bold text-orange-500">
                                            <Award size={16} /> Hadiah: {challenge.reward}
                                        </div>
                                        {!isCompleted && (
                                            <Button 
                                                size="sm" 
                                                disabled={!canClaim} 
                                                onClick={() => handleClaimBadge(challenge)}
                                                className={cn(canClaim ? (isUni ? "bg-indigo-600" : "bg-blue-600") : "opacity-50")}
                                            >
                                                {canClaim ? "Klaim Badge & Bagikan" : "Belum Tercapai"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            {/* RIGHT: MEMBERS & SETTINGS */}
            <div className="space-y-6">
                
                {/* About Group */}
                <div className={cn("p-5 rounded-xl border", cardStyle)}>
                    <h3 className={cn("font-bold mb-3 text-sm", (isUni || isSMA) ? "text-white" : "text-slate-800")}>Tentang Tim</h3>
                    <p className={cn("text-sm leading-relaxed mb-4", (isUni || isSMA) ? "text-slate-400" : "text-slate-600")}>
                        {group?.description || "Belum ada deskripsi."}
                    </p>
                    <div className="flex justify-between text-xs opacity-60">
                        <span>Dibuat: {group?.createdAt ? new Date(group.createdAt.seconds * 1000).toLocaleDateString() : "-"}</span>
                    </div>
                </div>

                {/* Members List */}
                <div className={cn("p-5 rounded-xl border", cardStyle)}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={cn("font-bold text-sm", (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                            Squad ({members.length})
                        </h3>
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {members.map(member => (
                            <div key={member.uid} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-transparent group-hover:border-indigo-500 transition-all">
                                    {member.photoURL ? (
                                        <img src={member.photoURL} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                            {member.displayName?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className={cn("text-sm font-bold truncate", (isUni || isSMA) ? "text-slate-200" : "text-slate-800")}>
                                            {member.displayName}
                                        </p>
                                        {member.uid === group?.createdBy && <Crown size={12} className="text-yellow-500 fill-current" />}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs opacity-60">
                                        <span className="flex items-center gap-0.5"><Trophy size={10} /> {member.arenaStats?.totalPoints || 0}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5 text-orange-500"><Flame size={10} /> {member.gamification?.currentStreak || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile Share Button */}
                <div className="md:hidden space-y-3">
                    <Button 
                        onClick={handleShareInvite}
                        disabled={isSharing}
                        className={cn("w-full", isUni ? "bg-indigo-600" : "bg-blue-600")}
                    >
                        <Share2 size={16} className="mr-2" /> {isSharing ? "Membagikan..." : "Bagikan ke Feed"}
                    </Button>
                </div>

            </div>
        </div>

        {/* EDIT TEAM MODAL */}
        <AnimatePresence>
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsEditOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div 
                        initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} 
                        className={cn(
                            "p-6 rounded-2xl w-full max-w-md relative z-10 shadow-xl overflow-hidden",
                            (isSMA || isUni) ? "bg-slate-900 border border-white/10 text-white" : "bg-white"
                        )}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Settings size={20} /> Pengaturan Tim
                            </h2>
                            <button onClick={() => setIsEditOpen(false)} className="opacity-50 hover:opacity-100"><X size={20}/></button>
                        </div>

                        <form onSubmit={handleUpdateTeam} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-1 block">Nama Tim</label>
                                <input 
                                    className={cn(
                                        "w-full p-3 border rounded-xl outline-none focus:ring-2",
                                        (isSMA || isUni) ? "bg-slate-800 border-slate-700 text-white focus:ring-teal-500" : "bg-slate-50 border-slate-200 focus:ring-blue-500"
                                    )}
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    placeholder="Nama Tim"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-1 block">Deskripsi</label>
                                <textarea 
                                    className={cn(
                                        "w-full p-3 border rounded-xl outline-none focus:ring-2 min-h-[100px] resize-none",
                                        (isSMA || isUni) ? "bg-slate-800 border-slate-700 text-white focus:ring-teal-500" : "bg-slate-50 border-slate-200 focus:ring-blue-500"
                                    )}
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                    placeholder="Ceritakan tentang timmu..."
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Batal</Button>
                                <Button type="submit" className={cn(isUni ? "bg-indigo-600" : "bg-blue-600")}>Simpan Perubahan</Button>
                            </div>
                        </form>

                        <div className="mt-8 pt-6 border-t border-dashed border-white/10">
                            <h3 className="text-sm font-bold text-red-500 mb-2 flex items-center gap-2">
                                <Trash2 size={16} /> Zona Bahaya
                            </h3>
                            <p className="text-xs opacity-60 mb-4">Menghapus tim bersifat permanen dan tidak dapat dikembalikan.</p>
                            <Button 
                                onClick={handleDeleteTeam}
                                variant="danger" 
                                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                            >
                                Bubarkan Tim
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

    </div>
  );
}