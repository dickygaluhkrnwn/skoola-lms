"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Hash, School, BookOpen, Send, Plus, 
  MessageSquare, MoreVertical, Trash2, Heart, Crown, ArrowLeft,
  LayoutDashboard, GraduationCap, Building2, Globe
} from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useTheme } from "@/lib/theme-context"; 
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { 
  collection, query, orderBy, limit, getDocs, where, addDoc, 
  serverTimestamp, onSnapshot, doc, getDoc, setDoc 
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { UserSummary, UserProfile } from "@/lib/types/user.types";
import { useRouter } from "next/navigation"; 
import { onAuthStateChanged } from "firebase/auth";

// --- TYPES ---
type ContextType = "global" | "school" | "major" | "class" | "group";

interface ForumContext {
  id: string;
  name: string;
  type: ContextType;
  icon?: React.ReactNode;
  description?: string;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string; // New: Role badge support
  content: string;
  likes: number;
  comments: number;
  timestamp: any;
  contextType: ContextType;
  contextId: string;
  schoolName?: string; // Tampilkan nama sekolah di post global
}

export default function SocialClient() {
  const router = useRouter(); 
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  
  // State Navigasi Utama (Default ke Global)
  const [activeContext, setActiveContext] = useState<ForumContext>({ 
    id: "public", 
    name: "Beranda Nasional", 
    type: "global", 
    icon: <Globe size={20} /> 
  });

  // Data Lists
  const [myClasses, setMyClasses] = useState<ForumContext[]>([]);
  const [myGroups, setMyGroups] = useState<ForumContext[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // Form States
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Determine Real School Level
  const realSchoolLevel = schoolData?.level || userProfile?.schoolLevel || theme;
  const isKids = realSchoolLevel === "sd";
  const isUni = realSchoolLevel === "uni";
  const isSMP = realSchoolLevel === "smp";
  const isSMA = realSchoolLevel === "sma";

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

          // Fetch School Data
          if (userData.schoolId) {
             const schoolSnap = await getDoc(doc(db, "schools", userData.schoolId));
             if (schoolSnap.exists()) {
                const sData = schoolSnap.data();
                setSchoolData(sData);
                // Update default context name based on school
                setActiveContext(prev => ({
                   ...prev,
                   name: isUni ? "Lobi Kampus" : "Lobi Sekolah"
                }));
             }
          }

          // Fetch Enrolled Classes
          const enrolledClasses = userData.enrolledClasses || [];
          if (enrolledClasses.length > 0) {
            const classPromises = enrolledClasses.map(async (cid: string) => {
               const cDoc = await getDoc(doc(db, "classrooms", cid));
               return cDoc.exists() ? { id: cDoc.id, name: cDoc.data().name } : null;
            });
            const classesRes = await Promise.all(classPromises);
            setMyClasses(classesRes.filter(c => c !== null).map((c: any) => ({
              id: c.id,
              name: c.name,
              type: "class",
              icon: <BookOpen size={18} />
            })));
          }
        }

        // Fetch Groups
        const groupsQuery = query(collection(db, "groups"), where("members", "array-contains", user.uid));
        const groupsSnap = await getDocs(groupsQuery);
        const groupsData = groupsSnap.docs.map(d => ({
          id: d.id,
          name: d.data().name,
          type: "group" as ContextType,
          icon: <Users size={18} />
        }));
        setMyGroups(groupsData);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, isUni]); // Added isUni dependency for context update

  // --- 2. REALTIME POSTS LISTENER ---
  useEffect(() => {
    // FIX: Removing orderBy from query to avoid manual index creation requirement.
    // Sorting will be done client-side.
    let qPosts;
    
    if (activeContext.type === 'global') {
        qPosts = query(
            collection(db, "posts"),
            where("contextType", "==", "global")
        );
    } else {
        qPosts = query(
            collection(db, "posts"),
            where("contextType", "==", activeContext.type),
            where("contextId", "==", activeContext.id)
        );
    }

    const unsubscribe = onSnapshot(qPosts, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
      
      // Client-side Sorting & Limiting (The Fix)
      fetchedPosts.sort((a, b) => {
         const timeA = a.timestamp ? (a.timestamp.seconds || Date.now()/1000) : Date.now()/1000;
         const timeB = b.timestamp ? (b.timestamp.seconds || Date.now()/1000) : Date.now()/1000;
         return timeB - timeA;
      });

      setPosts(fetchedPosts.slice(0, 30)); // Manual limit
    }, (error) => {
      console.error("Error fetching posts:", error);
    });

    return () => unsubscribe();
  }, [activeContext]);

  // --- ACTIONS ---
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !auth.currentUser) return;

    setIsPosting(true);
    try {
      const postData: any = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "User",
        userAvatar: auth.currentUser.photoURL || "",
        userRole: userProfile?.role || 'student', 
        content: newPostContent,
        likes: 0,
        comments: 0,
        timestamp: serverTimestamp(),
        contextType: activeContext.type,
        contextId: activeContext.id,
      };

      // Jika posting di global, sertakan asal sekolah
      if (activeContext.type === 'global') {
          postData.schoolName = schoolData?.name || "Umum";
      } else {
          // Jika posting lokal, pastikan schoolId tersimpan untuk keamanan
          postData.schoolId = userProfile?.schoolId || null;
      }

      await addDoc(collection(db, "posts"), postData);
      setNewPostContent("");
    } catch (error) {
      console.error("Gagal posting:", error);
      alert("Gagal mengirim pesan.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !newGroupName.trim()) return;

    try {
      const newGroupRef = doc(collection(db, "groups"));
      const newGroupData = {
        name: newGroupName,
        createdBy: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
        schoolId: userProfile?.schoolId || null
      };
      
      await setDoc(newGroupRef, newGroupData);
      setMyGroups(prev => [...prev, {
        id: newGroupRef.id,
        name: newGroupName,
        type: "group",
        icon: <Users size={18} />
      }]);

      setNewGroupName("");
      setIsCreateGroupOpen(false);
      alert("Kelompok berhasil dibuat!");
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  // Helper Labels
  const getContextLabel = (type: ContextType) => {
      switch(type) {
          case 'global': return 'Komunitas Pendidikan Indonesia';
          case 'school': return isUni ? 'Lingkungan Kampus' : 'Lingkungan Sekolah';
          case 'class': return isUni ? 'Diskusi Kelas Kuliah' : 'Diskusi Kelas';
          case 'major': return isUni ? 'Forum Prodi' : 'Forum Jurusan';
          default: return 'Kelompok Belajar';
      }
  };

  // --- STYLES ---
  const bgStyle = isKids ? "bg-yellow-50" 
    : isUni ? "bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200" 
    : isSMP ? "bg-slate-50/30" 
    : isSMA ? "bg-transparent text-slate-100" 
    : "bg-slate-50";
  
  const sidebarStyle = isUni ? "bg-slate-950/30 backdrop-blur-xl border-white/5 text-slate-300 border-r" : 
                       isSMP ? "m-4 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(139,92,246,0.15)]" :
                       isSMA ? "m-4 rounded-2xl bg-slate-950/40 backdrop-blur-xl border border-white/5 shadow-2xl h-[calc(100vh-2rem)]" :
                       "bg-white border-r border-slate-200";

  const activeItemStyle = isKids 
    ? "bg-yellow-100 text-yellow-800" 
    : isUni 
      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] backdrop-blur-md" 
      : isSMP
        ? "bg-violet-500/10 text-violet-700 border border-violet-200 shadow-sm backdrop-blur-md"
        : isSMA
          ? "bg-teal-500/10 text-teal-400 border-l-2 border-teal-500 pl-4 shadow-[0_0_15px_rgba(20,184,166,0.1)]"
          : "bg-blue-50 text-blue-700";

  return (
    <div className={cn("flex min-h-screen font-sans transition-colors duration-500 relative", bgStyle)}>
      
      {/* --- UNI THEME BACKGROUND --- */}
      {isUni && (
         <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1121] to-indigo-950" />
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
         </div>
      )}

      {/* --- SMA THEME --- */}
      {isSMA && (
        <div className="fixed inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
           <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-teal-600/20 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
           <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      )}

      {/* --- SMP THEME --- */}
      {isSMP && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-400/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px] animate-pulse delay-700" />
        </div>
      )}

      {/* --- FLEX CONTAINER UTAMA --- */}
      <div className="flex-1 flex h-screen overflow-hidden relative z-10">
        
        {/* --- LEFT: SOCIAL NAVIGATOR (SIDEBAR) --- */}
        <aside className={cn("w-64 flex-shrink-0 border-r flex flex-col hidden md:flex h-full", sidebarStyle, (isSMP || isSMA) ? "rounded-3xl border-r-0 mr-0 h-[calc(100vh-2rem)]" : "")}>
          
          <div className={cn("p-4 border-b border-inherit flex items-center gap-3", (isSMP || isSMA || isUni) && "border-white/5")}>
            <button 
                onClick={() => router.back()} 
                className={cn(
                    "p-1.5 rounded-lg transition-colors -ml-1 hover:scale-105 active:scale-95",
                    (isUni || isSMA) ? "text-slate-400 hover:text-white hover:bg-white/10" : "hover:bg-slate-100 text-slate-500"
                )}
                title="Kembali ke Dashboard"
            >
                <ArrowLeft size={20} />
            </button>
            <h2 className={cn("font-bold text-sm uppercase tracking-wider opacity-70", (isSMA || isUni) && "text-slate-300")}>Jejaring Sosial</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
            
            {/* Global & School Context */}
            <div className="space-y-1">
              <p className={cn("px-3 text-[10px] font-bold uppercase opacity-50 mb-1", (isSMA || isUni) && "text-slate-400")}>Publik</p>
              <ContextButton 
                active={activeContext.id === "global"} 
                onClick={() => setActiveContext({ id: "global", name: "Beranda Nasional", type: "global", icon: <Globe size={18}/> })}
                icon={<Globe size={18}/>} 
                label="Beranda Nasional" 
                themeStyle={activeItemStyle}
                isSMP={isSMP} isSMA={isSMA} isUni={isUni}
              />
              
              {schoolData && (
                 <ContextButton 
                   active={activeContext.type === "school"} 
                   onClick={() => setActiveContext({ id: schoolData.id || "school", name: isUni ? "Lobi Kampus" : "Lobi Sekolah", type: "school", icon: <School size={18}/> })}
                   icon={<School size={18}/>} 
                   label={isUni ? "Lobi Kampus" : "Lobi Sekolah"} 
                   themeStyle={activeItemStyle}
                   isSMP={isSMP} isSMA={isSMA} isUni={isUni}
                 />
              )}
            </div>

            {/* Classes Context */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-3 mb-1">
                  <p className={cn("text-[10px] font-bold uppercase opacity-50", (isSMA || isUni) && "text-slate-400")}>{isUni ? "Matkul Saya" : "Kelas Saya"}</p>
              </div>
              {myClasses.length === 0 && <p className={cn("px-3 text-xs italic opacity-50", (isSMA || isUni) && "text-slate-500")}>Belum masuk kelas.</p>}
              {myClasses.map(c => (
                <ContextButton 
                  key={c.id}
                  active={activeContext.id === c.id} 
                  onClick={() => setActiveContext(c)}
                  icon={<BookOpen size={18}/>} 
                  label={c.name} 
                  themeStyle={activeItemStyle}
                  isSMP={isSMP} isSMA={isSMA} isUni={isUni}
                />
              ))}
            </div>

            {/* Groups Context */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-3 mb-1">
                  <p className={cn("text-[10px] font-bold uppercase opacity-50", (isSMA || isUni) && "text-slate-400")}>Kelompok</p>
                  <button onClick={() => setIsCreateGroupOpen(true)} className={cn("p-1 rounded transition-colors", (isSMA || isUni) ? "text-slate-400 hover:text-white hover:bg-white/10" : "hover:bg-slate-200")}><Plus size={12}/></button>
              </div>
              {myGroups.map(g => (
                <ContextButton 
                  key={g.id}
                  active={activeContext.id === g.id} 
                  onClick={() => setActiveContext(g)}
                  icon={<Users size={18}/>} 
                  label={g.name} 
                  themeStyle={activeItemStyle}
                  isSMP={isSMP} isSMA={isSMA} isUni={isUni}
                />
              ))}
              {myGroups.length === 0 && (
                 <button 
                   onClick={() => setIsCreateGroupOpen(true)}
                   className={cn(
                      "w-full text-left px-3 py-2 text-xs opacity-60 hover:opacity-100 flex items-center gap-2 rounded-lg transition-all",
                      (isSMA || isUni) ? "text-slate-400 hover:bg-white/5 hover:text-white" : "hover:bg-slate-100"
                   )}
                 >
                    <Plus size={14} /> Buat Kelompok Baru
                 </button>
              )}
            </div>
          </div>
        </aside>

        {/* --- MIDDLE: CHAT FEED --- */}
        <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
          
          {/* Header Area */}
          <header className={cn("h-16 border-b flex items-center justify-between px-6 shrink-0 backdrop-blur-md bg-opacity-90 z-10", 
             isUni ? "bg-slate-950/40 border-white/5" : 
             isSMP ? "bg-white/60 border-white/40 shadow-sm" : 
             isSMA ? "bg-slate-950/40 border-white/10" :
             "bg-white border-slate-200"
          )}>
             <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className={cn("md:hidden p-2 rounded-full mr-2", (isSMA || isUni) ? "text-slate-400 hover:bg-white/10" : "hover:bg-black/5")}>
                   <ArrowLeft size={20} />
                </button>

                <div className={cn("p-2 rounded-lg", 
                   isKids ? "bg-yellow-100 text-yellow-600" : 
                   isSMP ? "bg-violet-100 text-violet-600" :
                   isSMA ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" :
                   isUni ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : 
                   "bg-blue-50 text-blue-600"
                )}>
                   {activeContext.icon}
                </div>
                <div>
                   <h1 className={cn("font-bold text-lg leading-tight", (isSMA || isUni) ? "text-slate-200" : "text-slate-900")}>{activeContext.name}</h1>
                   <p className={cn("text-xs opacity-60 flex items-center gap-1", (isSMA || isUni) ? "text-slate-400" : "text-slate-500")}>
                      {getContextLabel(activeContext.type)}
                   </p>
                </div>
             </div>
          </header>

          {/* Feed List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
             {/* Create Post Input (Desktop Only / Top) */}
             <div className={cn("p-4 rounded-xl border mb-6", 
                isUni ? "bg-slate-900/50 border-white/10" : "bg-white border-slate-200 shadow-sm"
             )}>
                <textarea 
                   value={newPostContent}
                   onChange={e => setNewPostContent(e.target.value)}
                   placeholder={`Bagikan sesuatu di ${activeContext.name}...`}
                   className={cn("w-full bg-transparent border-none outline-none resize-none min-h-[60px] text-sm", (isSMA || isUni) ? "text-slate-200 placeholder:text-slate-600" : "text-slate-800")}
                />
                <div className="flex justify-between items-center mt-2 border-t border-dashed pt-3 border-slate-200/20">
                   <div className="text-xs text-slate-400">Tekan Enter untuk baris baru</div>
                   <Button 
                      size="sm"
                      onClick={handlePostSubmit} 
                      disabled={!newPostContent.trim() || isPosting}
                      className={cn(
                         isUni ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-blue-600 hover:bg-blue-700"
                      )}
                   >
                      <Send size={16} className="mr-2" /> Posting
                   </Button>
                </div>
             </div>

             {/* Posts Feed */}
             {loading ? (
                <div className={cn("text-center py-10 opacity-50", (isSMA || isUni) && "text-slate-400")}>Memuat feed...</div>
             ) : posts.length === 0 ? (
                <div className="text-center py-12 opacity-50 flex flex-col items-center">
                   <MessageSquare size={48} className={cn("mb-4 opacity-20", (isSMA || isUni) ? "text-teal-500" : "text-slate-400")}/>
                   <p className={cn((isSMA || isUni) && "text-slate-400")}>Belum ada postingan.</p>
                   <p className={cn("text-sm", (isSMA || isUni) && "text-slate-500")}>Jadilah yang pertama berbagi!</p>
                </div>
             ) : (
                posts.map(post => (
                   <motion.div 
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-2xl border transition-all",
                        isUni ? "bg-slate-900/40 border-white/5 hover:border-white/10" : 
                        "bg-white border-slate-100 shadow-sm hover:shadow-md"
                      )}
                   >
                      <div className="flex gap-3 mb-3">
                         <div className={cn("w-10 h-10 rounded-full shrink-0 overflow-hidden border", (isSMA || isUni) ? "bg-slate-800 border-slate-700" : "bg-gray-200 border-white/50")}>
                            {post.userAvatar ? <img src={post.userAvatar} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs">User</div>}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <span className={cn("font-bold text-sm", (isUni || isSMA) ? "text-slate-200" : "text-slate-900")}>{post.userName}</span>
                               {/* School Name in Global Feed */}
                               {activeContext.type === 'global' && post.schoolName && (
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 rounded border border-slate-200 truncate max-w-[150px]">
                                     {post.schoolName}
                                  </span>
                               )}
                            </div>
                            <span className={cn("text-[10px] opacity-50 block", (isSMA || isUni) ? "text-slate-400" : "text-slate-500")}>
                               {post.timestamp?.seconds ? new Date(post.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                            </span>
                         </div>
                      </div>
                      
                      <div className={cn("text-sm leading-relaxed whitespace-pre-wrap pl-[3.25rem]", (isUni || isSMA) ? "text-slate-300" : "text-slate-700")}>
                         {post.content}
                      </div>

                      {/* Interaction Bar (Placeholder) */}
                      <div className="flex gap-6 mt-4 pl-[3.25rem]">
                         <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors">
                            <Heart size={16} /> 0
                         </button>
                         <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-500 transition-colors">
                            <MessageSquare size={16} /> 0
                         </button>
                      </div>
                   </motion.div>
                ))
             )}
          </div>
        </main>

        {/* MODAL: CREATE GROUP */}
        <AnimatePresence>
           {isCreateGroupOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsCreateGroupOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                 <motion.div 
                    initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} 
                    className={cn(
                       "p-6 rounded-2xl w-full max-w-sm relative z-10 shadow-xl",
                       (isSMA || isUni) ? "bg-slate-900 border border-white/10 text-white" : "bg-white"
                    )}
                 >
                    <h2 className="text-lg font-bold mb-4">Buat Kelompok Belajar</h2>
                    <form onSubmit={handleCreateGroup}>
                       <input 
                          autoFocus
                          placeholder="Nama Kelompok (misal: Tim Roket)"
                          className={cn(
                             "w-full p-3 border rounded-xl mb-4 outline-none focus:ring-2",
                             (isSMA || isUni) 
                               ? "bg-slate-800 border-slate-700 text-white focus:ring-teal-500 placeholder:text-slate-500" 
                               : "bg-slate-50 border-slate-200 focus:ring-blue-500"
                          )}
                          value={newGroupName}
                          onChange={e => setNewGroupName(e.target.value)}
                       />
                       <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" onClick={() => setIsCreateGroupOpen(false)} className={(isSMA || isUni) ? "text-slate-400 hover:text-white hover:bg-white/10" : ""}>Batal</Button>
                          <Button type="submit" className={(isSMA || isUni) ? "bg-teal-600 hover:bg-teal-500 text-white" : ""}>Buat</Button>
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

// Sub-Component for Sidebar Button
function ContextButton({ active, onClick, icon, label, themeStyle, isSMP, isSMA, isUni }: any) {
   return (
      <button
         onClick={onClick}
         className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left group",
            active 
               ? themeStyle 
               : (isSMP 
                  ? "text-slate-500 hover:bg-violet-50/50 hover:text-violet-600" 
                  : (isSMA || isUni)
                    ? "text-slate-400 hover:bg-white/5 hover:text-white"
                    : "text-slate-500 hover:bg-slate-100")
         )}
      >
         <span className={cn("transition-transform group-hover:scale-110", active && "scale-110")}>{icon}</span>
         <span className="truncate">{label}</span>
      </button>
   )
}