"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MessageSquare, Send, Globe, School, 
  Trophy, Flame, Gamepad2, MoreHorizontal,
  MapPin, ShieldCheck, Search, Clock, AlertCircle, Users, Zap, Plus, ArrowLeft, X 
} from "lucide-react";
import { useTheme } from "@/lib/theme-context"; 
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { 
  collection, query, where, addDoc, 
  serverTimestamp, onSnapshot, doc, getDoc, orderBy, limit, getDocs, setDoc
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/lib/types/user.types";
import { SocialPost, ArenaSeason, LeaderboardEntry } from "@/lib/types/social.types"; 
import { useRouter } from "next/navigation"; 
import { onAuthStateChanged } from "firebase/auth";
import { XPBar } from "@/components/gamification/xp-bar"; 

export default function SocialClient() {
  const router = useRouter(); 
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  
  // User Data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  
  // Team Data
  const [myTeam, setMyTeam] = useState<any>(null);
  const [teamStreak, setTeamStreak] = useState(0);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Feed State
  const [feedType, setFeedType] = useState<"global" | "school">("global");
  const [posts, setPosts] = useState<SocialPost[]>([]); 
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Arena & Leaderboard State
  const [activeSeason, setActiveSeason] = useState<ArenaSeason | null>(null);
  const [topSchools, setTopSchools] = useState<LeaderboardEntry[]>([]);
  const [arenaLoading, setArenaLoading] = useState(true);

  // Helper Theme
  const isKids = theme === "sd";
  const isUni = theme === "uni";
  const isSMP = theme === "smp";
  const isSMA = theme === "sma";

  // --- 1. INITIAL DATA FETCHING ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
         router.push("/");
         return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setUserProfile(userData);

          // Fetch School
          if (userData.schoolId) {
             const schoolSnap = await getDoc(doc(db, "schools", userData.schoolId));
             if (schoolSnap.exists()) {
                setSchoolData(schoolSnap.data());
             }
          }

          // Fetch Team
          const teamsRef = collection(db, "teams");
          const qTeam = query(teamsRef, where("members", "array-contains", user.uid));
          const teamSnap = await getDocs(qTeam);
          
          if (!teamSnap.empty) {
             const tData: any = { id: teamSnap.docs[0].id, ...teamSnap.docs[0].data() };
             setMyTeam(tData);

             // Calculate Team Streak
             if (tData.members && tData.members.length > 0) {
                const membersQuery = query(collection(db, "users"), where("uid", "in", tData.members.slice(0, 10)));
                const membersSnap = await getDocs(membersQuery);
                const streaks = membersSnap.docs.map(d => d.data().gamification?.currentStreak || 0);
                const avgStreak = Math.floor(streaks.reduce((a, b) => a + b, 0) / streaks.length);
                setTeamStreak(avgStreak);
             }
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- 2. ARENA & LEADERBOARD FETCHING ---
  useEffect(() => {
    const fetchArenaData = async () => {
        try {
            const seasonsRef = collection(db, "arena_seasons");
            const qSeason = query(seasonsRef, where("isActive", "==", true), limit(1));
            const seasonSnap = await getDocs(qSeason);

            if (!seasonSnap.empty) {
                const seasonData = { id: seasonSnap.docs[0].id, ...seasonSnap.docs[0].data() } as ArenaSeason;
                setActiveSeason(seasonData);

                const lbRef = collection(db, "arena_leaderboards");
                const qLb = query(
                    lbRef, 
                    where("seasonId", "==", seasonData.id),
                    where("type", "==", "school"),
                    orderBy("points", "desc"),
                    limit(5)
                );
                
                const unsubscribeLb = onSnapshot(qLb, 
                    (snapshot) => {
                        const schools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaderboardEntry));
                        setTopSchools(schools);
                    },
                    (error) => {
                        console.warn("Leaderboard index missing:", error.message);
                    }
                );
                
                return () => unsubscribeLb(); 
            } else {
                setActiveSeason(null);
            }
        } catch (err) {
            console.error("Error fetching arena data:", err);
        } finally {
            setArenaLoading(false);
        }
    };

    fetchArenaData();
  }, []);

  // --- 3. REALTIME FEED LISTENER ---
  useEffect(() => {
    if (!userProfile) return;

    const qPosts = query(
        collection(db, "posts"),
        where("contextType", "==", "global"), 
        limit(50)
    );

    const unsubscribe = onSnapshot(qPosts, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
              id: doc.id, 
              ...data,
              authorId: data.userId || data.authorId,
              authorName: data.userName || data.authorName,
              authorAvatar: data.userAvatar || data.authorAvatar,
              authorSchoolName: data.schoolName || data.authorSchoolName || "Umum",
              authorSchoolId: data.schoolId || data.authorSchoolId || "", 
              likesCount: data.likes || data.likesCount || 0,
              commentsCount: data.comments || data.commentsCount || 0,
              createdAt: (data.timestamp?.seconds * 1000) || data.createdAt || Date.now()
          } as SocialPost;
      });
      
      fetchedPosts.sort((a, b) => b.createdAt - a.createdAt);

      if (feedType === 'school' && userProfile.schoolId) {
          const schoolPosts = fetchedPosts.filter(p => p.authorSchoolId === userProfile.schoolId);
          setPosts(schoolPosts);
      } else {
          setPosts(fetchedPosts);
      }
      
    }, (error) => {
      console.error("Error fetching posts:", error);
    });

    return () => unsubscribe();
  }, [feedType, userProfile]);

  // --- ACTIONS ---
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !auth.currentUser || !userProfile) return;

    setIsPosting(true);
    try {
      const postData = {
        authorId: auth.currentUser.uid,
        authorName: userProfile.displayName,
        authorAvatar: userProfile.photoURL || "",
        authorRole: userProfile.role,
        
        authorSchoolId: userProfile.schoolId || "",
        authorSchoolName: schoolData?.name || "Umum",
        
        content: newPostContent,
        likes: 0,
        comments: 0,
        contextType: "global",
        contextId: "public",
        
        timestamp: serverTimestamp(),
        createdAt: Date.now() 
      };

      await addDoc(collection(db, "posts"), postData);
      setNewPostContent("");
    } catch (error) {
      console.error("Gagal posting:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTeamName.trim() || !auth.currentUser) return;

    try {
        const teamRef = doc(collection(db, "teams"));
        const newTeamData = {
            name: newTeamName,
            members: [auth.currentUser.uid],
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser.uid
        };
        await setDoc(teamRef, newTeamData);
        
        // Optimistic update
        setMyTeam({ id: teamRef.id, ...newTeamData });
        
        setIsCreateTeamOpen(false);
        setNewTeamName("");
        
        // Direct redirect to team page
        router.push(`/social/group/${teamRef.id}`);
    } catch (e) {
        console.error("Failed to create team", e);
        alert("Gagal membuat tim. Coba lagi.");
    }
  };

  // --- STYLES ---
  const bgStyle = isKids ? "bg-yellow-50" 
    : isUni ? "bg-slate-950 text-slate-100" 
    : isSMP ? "bg-slate-50/30" 
    : isSMA ? "bg-slate-950 text-slate-100" 
    : "bg-slate-50";

  const cardStyle = isUni ? "bg-slate-900/50 border-white/5 backdrop-blur-sm" 
    : isSMA ? "bg-slate-900/40 border-teal-500/10 backdrop-blur-sm"
    : "bg-white border-slate-200 shadow-sm";

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-500 relative", bgStyle)}>
      
      {/* --- BACKGROUND DECORATION --- */}
      {isUni && (
         <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1121] to-indigo-950 opacity-80" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
         </div>
      )}
      {isSMA && (
        <div className="fixed inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
           <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      )}

      {/* --- MAIN LAYOUT (3 COLUMNS) --- */}
      <div className="relative z-10 max-w-7xl mx-auto flex justify-center min-h-screen">
        
        {/* --- LEFT: MINI PROFILE & TEAM (Sticky) --- */}
        {/* Added shrink-0 to prevent width compression */}
        <aside className="hidden md:flex w-72 shrink-0 flex-col gap-6 p-6 sticky top-0 h-screen overflow-y-auto no-scrollbar border-r border-dashed border-slate-200/20">
           {userProfile ? (
             <>
               {/* Added shrink-0 to cards */}
               <div className={cn("p-6 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden shrink-0", cardStyle)}>
                  {/* Banner Background */}
                  <div className={cn("absolute top-0 left-0 w-full h-20 opacity-30", 
                      isUni ? "bg-indigo-600" : isSMA ? "bg-teal-600" : "bg-gradient-to-r from-blue-400 to-cyan-400")} />
                  
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full border-4 border-white/10 shadow-lg z-10 bg-slate-200 overflow-hidden mb-3">
                      {userProfile.photoURL ? (
                          <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white text-2xl font-bold">
                              {userProfile.displayName?.charAt(0)}
                          </div>
                      )}
                  </div>

                  {/* Name & School */}
                  <h2 className={cn("font-bold text-lg leading-tight z-10", (isUni || isSMA) ? "text-white" : "text-slate-800")}>
                      {userProfile.displayName}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs opacity-70 mt-1 mb-4 z-10">
                      <School size={12} />
                      <span>{schoolData?.name || "Belum ada Sekolah"}</span>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 w-full mb-4 z-10">
                      <div className="flex flex-col items-center p-2 rounded-lg bg-black/5 dark:bg-white/5">
                          <span className="text-xs opacity-60">Level</span>
                          <span className="font-bold text-sm">{userProfile.gamification?.level || 1}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-lg bg-black/5 dark:bg-white/5">
                          <span className="text-xs opacity-60">Badges</span>
                          <span className="font-bold text-sm">{userProfile.gamification?.totalBadges || 0}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-lg bg-black/5 dark:bg-white/5">
                          <span className="text-xs opacity-60">Streak</span>
                          <div className="flex items-center gap-0.5 font-bold text-sm text-orange-500">
                              <Flame size={12} fill="currentColor" />
                              {userProfile.gamification?.currentStreak || 0}
                          </div>
                      </div>
                  </div>

                  {/* XP Bar */}
                  <div className="w-full z-10">
                      <XPBar 
                          currentXP={userProfile.gamification?.xp || 0} 
                          maxXP={1000 * (userProfile.gamification?.level || 1)} 
                          level={userProfile.gamification?.level || 1} 
                      />
                  </div>
               </div>

               {/* TEAM CARD (NEW) */}
               {myTeam ? (
                 <div className={cn("p-5 rounded-2xl border relative overflow-hidden group cursor-pointer shrink-0", cardStyle)} onClick={() => router.push(`/social/group/${myTeam.id}`)}>
                    <div className="flex justify-between items-start mb-3">
                        <div className={cn("p-2 rounded-lg text-white", isUni ? "bg-indigo-600" : "bg-blue-500")}>
                            <Users size={20} />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">
                            <Zap size={12} fill="currentColor" />
                            {teamStreak}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs opacity-60 uppercase font-bold tracking-wider mb-1">Tim Kamu</p>
                        <h3 className={cn("text-lg font-bold truncate", (isUni || isSMA) ? "text-white" : "text-slate-900")}>
                            {myTeam.name}
                        </h3>
                        <p className="text-xs opacity-60 mt-1">{myTeam.members?.length || 1} Anggota Aktif</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-dashed border-white/10 flex justify-between items-center">
                        <span className="text-xs opacity-50">Ke Markas Tim</span>
                        <ArrowLeft size={16} className="rotate-180 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </div>
                 </div>
               ) : (
                 <div className={cn("p-5 rounded-2xl border border-dashed flex flex-col items-center text-center shrink-0", cardStyle)}>
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center mb-3">
                        <Users size={24} className="opacity-50" />
                    </div>
                    <h3 className="font-bold text-sm mb-1">Belum Punya Tim?</h3>
                    <p className="text-xs opacity-60 mb-4">Gabung tim untuk push rank & streak bareng teman!</p>
                    <Button size="sm" onClick={() => setIsCreateTeamOpen(true)} className={cn("w-full gap-2", isUni ? "bg-indigo-600" : "bg-blue-600")}>
                        <Plus size={16} /> Buat Tim
                    </Button>
                 </div>
               )}
             </>
           ) : (
             <div className="h-64 rounded-2xl animate-pulse bg-slate-200/20 shrink-0" />
           )}

           {/* Navigation Menu */}
           <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => router.push("/learn")}>
                  <Gamepad2 size={18} /> Kembali Belajar
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 text-opacity-50">
                  <Globe size={18} /> Jelajah Komunitas
              </Button>
           </div>
        </aside>

        {/* --- CENTER: MAIN FEED --- */}
        <main className="flex-1 w-full max-w-2xl border-r border-dashed border-slate-200/20 min-h-screen pb-20">
           {/* Header / Tabs */}
           <div className={cn("sticky top-0 z-20 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center", 
               (isUni || isSMA) ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-100")}>
               <h1 className={cn("font-bold text-xl", (isUni || isSMA) ? "text-white" : "text-slate-800")}>Beranda</h1>
               
               {/* Feed Filter Toggle */}
               <div className={cn("flex p-1 rounded-lg", (isUni || isSMA) ? "bg-white/5" : "bg-slate-100")}>
                   <button 
                      onClick={() => setFeedType("global")}
                      className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", 
                          feedType === "global" 
                            ? ((isUni || isSMA) ? "bg-slate-800 text-white shadow" : "bg-white text-slate-900 shadow") 
                            : "opacity-50 hover:opacity-100"
                      )}
                   >
                      Global
                   </button>
                   <button 
                      onClick={() => setFeedType("school")}
                      disabled={!userProfile?.schoolId}
                      className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1", 
                          feedType === "school" 
                            ? ((isUni || isSMA) ? "bg-slate-800 text-white shadow" : "bg-white text-slate-900 shadow") 
                            : "opacity-50 hover:opacity-100 disabled:opacity-20"
                      )}
                   >
                      Sekolahku {userProfile?.schoolId && <span className="w-2 h-2 rounded-full bg-red-500 ml-1" />}
                   </button>
               </div>
           </div>

           {/* Create Post Widget */}
           <div className="p-4 border-b border-dashed border-slate-200/10">
              <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      {userProfile?.photoURL && <img src={userProfile.photoURL} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                      <textarea 
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          placeholder={feedType === 'school' ? "Info apa untuk teman sekolahmu?" : "Apa yang sedang kamu pelajari hari ini?"}
                          className={cn("w-full bg-transparent outline-none resize-none text-base min-h-[80px]", 
                              (isUni || isSMA) ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400")}
                      />
                      <div className="flex justify-between items-center mt-2">
                          <div className="flex gap-2 text-slate-500">
                              {/* Icons placeholder */}
                          </div>
                          <Button 
                              size="sm" 
                              onClick={handlePostSubmit}
                              disabled={!newPostContent.trim() || isPosting}
                              className={cn(
                                  "rounded-full px-6 font-bold",
                                  isUni ? "bg-indigo-600 hover:bg-indigo-500" : 
                                  isSMA ? "bg-teal-600 hover:bg-teal-500" : 
                                  "bg-blue-600 hover:bg-blue-700"
                              )}
                          >
                              {isPosting ? "Mengirim..." : "Posting"}
                          </Button>
                      </div>
                  </div>
              </div>
           </div>

           {/* Posts List */}
           <div className="divide-y divide-dashed divide-slate-200/10">
              {loading ? (
                  <div className="p-10 text-center opacity-50">Memuat update...</div>
              ) : posts.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl">📭</div>
                      <h3 className="font-bold text-lg mb-2">Belum ada postingan</h3>
                      <p className="text-sm opacity-60 max-w-xs">
                          {feedType === 'school' ? "Jadilah yang pertama memposting di sekolahmu!" : "Mulai percakapan global sekarang!"}
                      </p>
                  </div>
              ) : (
                  posts.map((post) => (
                      <motion.div 
                          key={post.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                          <div className="flex gap-3">
                              {/* Post Avatar */}
                              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200/20">
                                  {post.authorAvatar ? <img src={post.authorAvatar} className="w-full h-full object-cover" /> : null}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                  {/* Header */}
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className={cn("font-bold text-sm truncate", (isUni || isSMA) ? "text-white" : "text-slate-900")}>
                                          {post.authorName}
                                      </span>
                                      
                                      {/* Role Badge */}
                                      {post.authorRole === 'teacher' && (
                                          <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1">
                                              <ShieldCheck size={10} /> Guru
                                          </span>
                                      )}

                                      <span className="text-slate-500 text-sm">•</span>
                                      <span className="text-slate-500 text-xs">
                                          {new Date(post.createdAt).toLocaleDateString()}
                                      </span>
                                  </div>

                                  {/* School Badge (Crucial for Global Identity) */}
                                  <div className="mb-2 flex">
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              if (post.authorSchoolId) router.push(`/school/${post.authorSchoolId}`);
                                          }}
                                          className={cn(
                                          "text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 max-w-full truncate font-medium hover:opacity-80 transition-opacity",
                                          (isUni || isSMA) 
                                            ? "bg-slate-800 border-slate-700 text-slate-300" 
                                            : "bg-slate-100 border-slate-200 text-slate-600"
                                      )}>
                                          <School size={10} />
                                          {post.authorSchoolName}
                                      </button>
                                  </div>

                                  {/* Content */}
                                  <p className={cn("text-sm whitespace-pre-wrap leading-relaxed mb-3", (isUni || isSMA) ? "text-slate-300" : "text-slate-800")}>
                                      {post.content}
                                  </p>

                                  {/* Actions */}
                                  <div className="flex items-center gap-6">
                                      <button className={cn("flex items-center gap-2 text-xs group-hover:text-pink-500 transition-colors", (isUni || isSMA) ? "text-slate-500" : "text-slate-400")}>
                                          <Heart size={16} /> 
                                          <span>{post.likesCount || 0}</span>
                                      </button>
                                      <button className={cn("flex items-center gap-2 text-xs group-hover:text-blue-500 transition-colors", (isUni || isSMA) ? "text-slate-500" : "text-slate-400")}>
                                          <MessageSquare size={16} />
                                          <span>{post.commentsCount || 0}</span>
                                      </button>
                                      <button className={cn("ml-auto text-slate-500 hover:text-white transition-colors")}>
                                          <MoreHorizontal size={16} />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </motion.div>
                  ))
              )}
           </div>
        </main>

        {/* --- RIGHT: ARENA TEASER (Sticky & Real Data) --- */}
        {/* Added shrink-0 and overflow-y-auto to fix button visibility issues */}
        <aside className="hidden lg:flex w-80 shrink-0 flex-col gap-6 p-6 sticky top-0 h-screen overflow-y-auto no-scrollbar">
            {/* Search Bar */}
            <div className={cn("relative mb-2", (isUni || isSMA) ? "opacity-100" : "opacity-100")}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    placeholder="Cari teman atau topik..." 
                    className={cn("w-full pl-10 pr-4 py-2.5 rounded-full text-sm outline-none border transition-all focus:ring-2", 
                        cardStyle,
                        (isUni || isSMA) ? "text-white placeholder:text-slate-600 focus:ring-indigo-500/50" : "focus:ring-blue-200"
                    )}
                />
            </div>

            {/* Arena Status Card */}
            <div className={cn("p-5 rounded-2xl border relative overflow-hidden", cardStyle)}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={cn("font-bold", (isUni || isSMA) ? "text-white" : "text-slate-900")}>Skoola Arena</h3>
                    <Trophy size={18} className="text-yellow-500" />
                </div>
                
                <div className="space-y-4">
                    {/* Active Season Info */}
                    {arenaLoading ? (
                        <div className="h-20 bg-slate-200/20 animate-pulse rounded-xl" />
                    ) : activeSeason ? (
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl text-white shadow-lg">
                            <p className="text-[10px] font-bold uppercase opacity-80 mb-1">{activeSeason.title}</p>
                            <p className="font-bold text-lg leading-none mb-1">{activeSeason.description}</p>
                            <div className="flex items-center gap-1 text-xs opacity-90 mt-2">
                                <Clock size={12} />
                                <span>Berakhir: {new Date(activeSeason.endDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ) : (
                        // Fallback jika belum ada Season aktif
                        <div className={cn("p-4 rounded-xl border border-dashed text-center", (isUni || isSMA) ? "border-slate-700 bg-slate-900/50" : "border-slate-300 bg-slate-50")}>
                            <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-bold opacity-70">Belum ada Musim Aktif</p>
                            <p className="text-[10px] opacity-50">Tunggu tantangan berikutnya!</p>
                        </div>
                    )}

                    {/* Daily Challenge Teaser */}
                    <div>
                        <p className={cn("text-xs font-bold uppercase mb-2", (isUni || isSMA) ? "text-slate-500" : "text-slate-400")}>Tantangan Harian</p>
                        {activeSeason ? (
                            <div className={cn("p-3 rounded-xl border flex items-center gap-3 cursor-not-allowed opacity-60", (isUni || isSMA) ? "bg-slate-800 border-white/5" : "bg-slate-50 border-slate-200")}>
                                <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center">
                                    <Flame size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Quick Trivia</p>
                                    <p className="text-xs opacity-60">+50 Poin Arena</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs opacity-50 italic">Tidak tersedia saat off-season.</p>
                        )}
                    </div>

                    <Button className="w-full bg-slate-800 text-white hover:bg-slate-700" disabled={!activeSeason} onClick={() => router.push("/social/arena")}>
                        Buka Arena {activeSeason ? "" : "(Tutup)"}
                    </Button>
                </div>
            </div>

            {/* Trending Schools / Leaderboard Preview */}
            <div className={cn("p-5 rounded-2xl border", cardStyle)}>
                <h3 className={cn("font-bold mb-4 text-sm", (isUni || isSMA) ? "text-white" : "text-slate-900")}>Top Sekolah Minggu Ini</h3>
                <div className="space-y-3">
                    {arenaLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-200/20 animate-pulse rounded-lg"/>)
                    ) : topSchools.length > 0 ? (
                        topSchools.map((school, index) => (
                            <div key={school.id} className="flex items-center gap-3">
                                <span className={cn("w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold", 
                                    index === 0 ? "bg-yellow-500 text-white" : 
                                    index === 1 ? "bg-slate-400 text-white" : 
                                    index === 2 ? "bg-orange-700 text-white" : "bg-slate-700/50 text-slate-400"
                                )}>{index + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-bold truncate", (isUni || isSMA) ? "text-slate-300" : "text-slate-800")}>
                                        {school.name}
                                    </p>
                                    <p className="text-[10px] opacity-50">{school.points.toLocaleString()} Poin</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs opacity-50 text-center py-4">Belum ada data peringkat.</p>
                    )}
                </div>
            </div>
        </aside>

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
                      <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-bold">Buat Tim Baru</h2>
                          <button onClick={() => setIsCreateTeamOpen(false)}><X size={20} className="opacity-50" /></button>
                      </div>
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
                              <Button type="submit">Buat & Masuk</Button>
                          </div>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

    </div>
  );
}