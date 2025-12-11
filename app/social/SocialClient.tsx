"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Hash, School, BookOpen, Send, Plus, 
  MessageSquare, MoreVertical, Trash2, Heart, Crown
} from "lucide-react";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useTheme } from "@/lib/theme-context"; 
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { 
  collection, query, orderBy, limit, getDocs, where, addDoc, 
  serverTimestamp, onSnapshot, doc, getDoc, setDoc 
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { UserSummary } from "@/lib/types/user.types";

// --- TYPES ---
type ContextType = "school" | "major" | "class" | "group";

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
  content: string;
  likes: number;
  comments: number;
  timestamp: any;
  contextType: ContextType;
  contextId: string;
}

interface GroupData {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
}

export default function SocialClient() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  
  // State Navigasi Utama
  const [activeContext, setActiveContext] = useState<ForumContext>({ 
    id: "global", 
    name: "Lobi Sekolah", 
    type: "school", 
    icon: <School size={20} /> 
  });

  // Data Lists
  const [myClasses, setMyClasses] = useState<ForumContext[]>([]);
  const [myGroups, setMyGroups] = useState<ForumContext[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserSummary[]>([]);

  // Form States
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const isKids = theme === "sd";
  const isUni = theme === "uni";

  // --- 1. INITIAL DATA FETCHING (Classes & Groups) ---
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // A. Fetch User & Classes
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Fetch Classes Details
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

        // B. Fetch Groups (Where user is member)
        const groupsQuery = query(collection(db, "groups"), where("members", "array-contains", user.uid));
        const groupsSnap = await getDocs(groupsQuery);
        const groupsData = groupsSnap.docs.map(d => ({
          id: d.id,
          name: d.data().name,
          type: "group" as ContextType,
          icon: <Users size={18} />
        }));
        setMyGroups(groupsData);

        // C. Fetch Leaderboard (Sekali saja untuk sidebar kanan)
        const lbQuery = query(collection(db, "users"), where("role", "==", "student"), orderBy("xp", "desc"), limit(5));
        const lbSnap = await getDocs(lbQuery);
        const lbData = lbSnap.docs.map(d => ({ 
           uid: d.id, displayName: d.data().displayName, xp: d.data().xp, photoURL: d.data().photoURL 
        })) as UserSummary[];
        setLeaderboard(lbData);

      } catch (err) {
        console.error("Error fetching initial data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // --- 2. REALTIME POSTS LISTENER ---
  useEffect(() => {
    // Query posts berdasarkan Context Aktif
    // NOTE UNTUK USER: Jika error "index required" muncul, klik link di console browser!
    const qPosts = query(
      collection(db, "posts"),
      where("contextType", "==", activeContext.type),
      where("contextId", "==", activeContext.id),
      orderBy("timestamp", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(qPosts, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
      setPosts(fetchedPosts);
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
      await addDoc(collection(db, "posts"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Siswa",
        userAvatar: auth.currentUser.photoURL || "",
        content: newPostContent,
        likes: 0,
        comments: 0,
        timestamp: serverTimestamp(),
        contextType: activeContext.type,
        contextId: activeContext.id
      });
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
        createdAt: serverTimestamp()
      };
      
      await setDoc(newGroupRef, newGroupData);
      
      // Update local state
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

  // --- STYLES ---
  const bgStyle = isKids ? "bg-yellow-50" : isUni ? "bg-slate-950 text-slate-200" : "bg-slate-50";
  const sidebarStyle = isUni ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const activeItemStyle = isKids 
    ? "bg-yellow-100 text-yellow-800" 
    : isUni 
      ? "bg-blue-900/50 text-blue-200 border-l-2 border-blue-500" 
      : "bg-blue-50 text-blue-700";

  return (
    <div className={cn("flex min-h-screen font-sans transition-colors duration-500", bgStyle)}>
      
      <StudentSidebar />

      <div className="flex-1 md:ml-64 flex h-screen overflow-hidden relative">
        
        {/* --- LEFT: FORUM NAVIGATOR (SIDEBAR) --- */}
        <aside className={cn("w-64 flex-shrink-0 border-r flex flex-col hidden md:flex", sidebarStyle)}>
          <div className="p-4 border-b border-inherit">
            <h2 className="font-bold text-sm uppercase tracking-wider opacity-70">Forum Diskusi</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            
            {/* 1. SEKOLAH & JURUSAN */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase opacity-50 mb-1">Publik</p>
              <ContextButton 
                active={activeContext.id === "global"} 
                onClick={() => setActiveContext({ id: "global", name: "Lobi Sekolah", type: "school", icon: <School size={18}/> })}
                icon={<School size={18}/>} 
                label="Lobi Sekolah" 
                themeStyle={activeItemStyle}
              />
              <ContextButton 
                active={activeContext.id === "major_science"} // Contoh hardcoded major
                onClick={() => setActiveContext({ id: "major_science", name: "Forum Sains", type: "major", icon: <Hash size={18}/> })}
                icon={<Hash size={18}/>} 
                label="Forum Sains" 
                themeStyle={activeItemStyle}
              />
            </div>

            {/* 2. KELAS SAYA */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-3 mb-1">
                 <p className="text-[10px] font-bold uppercase opacity-50">Kelas Saya</p>
              </div>
              {myClasses.length === 0 && <p className="px-3 text-xs italic opacity-50">Belum masuk kelas.</p>}
              {myClasses.map(c => (
                <ContextButton 
                  key={c.id}
                  active={activeContext.id === c.id} 
                  onClick={() => setActiveContext(c)}
                  icon={<BookOpen size={18}/>} 
                  label={c.name} 
                  themeStyle={activeItemStyle}
                />
              ))}
            </div>

            {/* 3. KELOMPOK BELAJAR */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-3 mb-1">
                 <p className="text-[10px] font-bold uppercase opacity-50">Kelompok</p>
                 <button onClick={() => setIsCreateGroupOpen(true)} className="hover:bg-slate-200 p-1 rounded transition-colors dark:hover:bg-slate-700"><Plus size={12}/></button>
              </div>
              {myGroups.map(g => (
                <ContextButton 
                  key={g.id}
                  active={activeContext.id === g.id} 
                  onClick={() => setActiveContext(g)}
                  icon={<Users size={18}/>} 
                  label={g.name} 
                  themeStyle={activeItemStyle}
                />
              ))}
              {myGroups.length === 0 && (
                 <button 
                   onClick={() => setIsCreateGroupOpen(true)}
                   className="w-full text-left px-3 py-2 text-xs opacity-60 hover:opacity-100 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                 >
                    <Plus size={14} /> Buat Kelompok Baru
                 </button>
              )}
            </div>

          </div>
        </aside>

        {/* --- MIDDLE: CHAT FEED --- */}
        <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
          {/* Channel Header */}
          <header className={cn("h-16 border-b flex items-center px-6 shrink-0 backdrop-blur-md bg-opacity-90 z-10", sidebarStyle)}>
             <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", isKids ? "bg-yellow-100 text-yellow-600" : isUni ? "bg-slate-800 text-blue-400" : "bg-blue-50 text-blue-600")}>
                   {activeContext.icon}
                </div>
                <div>
                   <h1 className="font-bold text-lg leading-tight">{activeContext.name}</h1>
                   <p className="text-xs opacity-60 flex items-center gap-1">
                      {activeContext.type === 'school' ? 'Diskusi tingkat sekolah' : 
                       activeContext.type === 'class' ? 'Forum privat kelas' : 'Diskusi kelompok'}
                   </p>
                </div>
             </div>
          </header>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
             {loading ? (
                <div className="text-center py-10 opacity-50">Memuat diskusi...</div>
             ) : posts.length === 0 ? (
                <div className="text-center py-20 opacity-50 flex flex-col items-center">
                   <MessageSquare size={48} className="mb-4 opacity-20"/>
                   <p>Belum ada percakapan di sini.</p>
                   <p className="text-sm">Jadilah yang pertama menyapa!</p>
                </div>
             ) : (
                posts.map(post => (
                   <motion.div 
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-3 group", isUni ? "hover:bg-slate-900/50" : "hover:bg-slate-50", "p-2 rounded-xl transition-colors")}
                   >
                      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                         {post.userAvatar ? <img src={post.userAvatar} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs">User</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-baseline gap-2">
                            <span className={cn("font-bold text-sm", isUni ? "text-slate-200" : "text-slate-900")}>{post.userName}</span>
                            <span className="text-[10px] opacity-50">{post.timestamp?.seconds ? new Date(post.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</span>
                         </div>
                         <p className={cn("text-sm leading-relaxed whitespace-pre-wrap mt-0.5", isUni ? "text-slate-300" : "text-slate-700")}>
                            {post.content}
                         </p>
                      </div>
                   </motion.div>
                ))
             )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-inherit bg-inherit shrink-0 pb-safe md:pb-4">
             <div className={cn("flex gap-2 items-end p-2 rounded-xl border transition-all focus-within:ring-2", isUni ? "bg-slate-800 border-slate-700 focus-within:ring-blue-900" : "bg-white border-slate-300 focus-within:ring-blue-100")}>
                <textarea 
                   value={newPostContent}
                   onChange={e => setNewPostContent(e.target.value)}
                   placeholder={`Kirim pesan ke #${activeContext.name}...`}
                   className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-2.5 px-2 text-sm"
                   onKeyDown={e => {
                      if(e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handlePostSubmit(e);
                      }
                   }}
                />
                <Button 
                   size="icon" 
                   onClick={handlePostSubmit} 
                   disabled={!newPostContent.trim() || isPosting}
                   className={cn("mb-1", isKids ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900" : "bg-blue-600 hover:bg-blue-700")}
                >
                   <Send size={18} />
                </Button>
             </div>
          </div>
        </main>

        {/* --- RIGHT: LEADERBOARD/INFO (Hidden on mobile) --- */}
        <aside className={cn("w-60 border-l hidden lg:block p-4", sidebarStyle)}>
           <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-4">Top Siswa</h3>
           <div className="space-y-3">
              {leaderboard.map((user, i) => (
                 <div key={user.uid} className="flex items-center gap-3">
                    <div className="relative">
                       <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                          {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : null}
                       </div>
                       {i === 0 && <Crown size={12} className="absolute -top-1 -right-1 text-yellow-500 fill-yellow-500"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-bold truncate">{user.displayName}</p>
                       <p className="text-[10px] opacity-60">{user.xp} XP</p>
                    </div>
                 </div>
              ))}
           </div>
        </aside>

        {/* MODAL: CREATE GROUP */}
        <AnimatePresence>
           {isCreateGroupOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsCreateGroupOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                 <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm relative z-10 shadow-xl">
                    <h2 className="text-lg font-bold mb-4 dark:text-white">Buat Kelompok Belajar</h2>
                    <form onSubmit={handleCreateGroup}>
                       <input 
                          autoFocus
                          placeholder="Nama Kelompok (misal: Tim Roket)"
                          className="w-full p-3 border rounded-xl mb-4 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                          value={newGroupName}
                          onChange={e => setNewGroupName(e.target.value)}
                       />
                       <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" onClick={() => setIsCreateGroupOpen(false)}>Batal</Button>
                          <Button type="submit">Buat</Button>
                       </div>
                    </form>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>

      </div>
      <MobileNav />
    </div>
  );
}

// Sub-Component for Sidebar Button
function ContextButton({ active, onClick, icon, label, themeStyle }: any) {
   return (
      <button
         onClick={onClick}
         className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left group",
            active 
               ? themeStyle 
               : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
         )}
      >
         <span className={cn("transition-transform group-hover:scale-110", active && "scale-110")}>{icon}</span>
         <span className="truncate">{label}</span>
      </button>
   )
}