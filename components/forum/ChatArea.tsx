"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types/user.types';
import { ForumMessage, ForumChannel } from '@/lib/types/forum.types';
import { Send, Paperclip, Smile, User, MessageSquare, Reply, X, Lock, ChevronDown, ChevronUp, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatAreaProps {
  channelId: string;
  userProfile: UserProfile;
}

export default function ChatArea({ channelId, userProfile }: ChatAreaProps) {
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [channel, setChannel] = useState<ForumChannel | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  
  // State untuk fitur Reply/Komentar
  const [replyTo, setReplyTo] = useState<ForumMessage | null>(null);
  
  // State untuk Toggle Hide/Show Replies (Key: Message ID, Value: boolean)
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Channel Info (untuk cek permission & category)
  useEffect(() => {
    if (!channelId) return;
    const unsub = onSnapshot(doc(db, 'channels', channelId), (docSnap) => {
      if (docSnap.exists()) {
        setChannel({ id: docSnap.id, ...docSnap.data() } as ForumChannel);
      }
    });
    return () => unsub();
  }, [channelId]);

  // 2. Fetch Messages Realtime
  useEffect(() => {
    if (!channelId) return;

    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', channelId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ForumMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          ...data,
          // Fallback timestamp jika serverTimestamp belum resolve (local write)
          createdAt: data.createdAt ? data.createdAt : Timestamp.now(), 
        } as ForumMessage);
      });

      // Sorting Client-side (Ascending - Terlama di atas)
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [channelId]);

  // Auto scroll ke bawah
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  }, [messages.length, replyTo]); 

  // 3. Logic Permission: Siapa yang boleh posting?
  const isAnnouncementChannel = channel?.category === 'announcement';
  const isTeacherOrAdmin = ['teacher', 'admin'].includes(userProfile.role);
  
  // Validasi Input Utama (Buat Pesan Baru / Thread Baru)
  const canPostMainMessage = useMemo(() => {
    if (!channel) return false;
    // Jika channel dikunci (Pengumuman), hanya Guru/Admin yang bisa
    if (channel.isLocked) {
      return isTeacherOrAdmin;
    }
    return true; // Diskusi bebas
  }, [channel, isTeacherOrAdmin]);

  // 4. Grouping Messages untuk Tampilan "Thread/Tweet"
  const threadMessages = useMemo(() => {
    if (!isAnnouncementChannel) return messages; 

    const mainPosts: ForumMessage[] = [];
    const replies: Record<string, ForumMessage[]> = {};

    messages.forEach(msg => {
      if (msg.replyToId) {
        if (!replies[msg.replyToId]) replies[msg.replyToId] = [];
        replies[msg.replyToId].push(msg);
      } else {
        mainPosts.push(msg);
      }
    });

    // Struktur: [{...mainPost, replies: [...]}, ...]
    return mainPosts.map(post => ({
      ...post,
      replies: replies[post.id] || []
    }));
  }, [messages, isAnnouncementChannel]);

  // 5. Handle Send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messageData: any = {
        channelId,
        content: newMessage.trim(),
        senderId: userProfile.uid,
        senderName: userProfile.displayName,
        senderRole: userProfile.role,
        senderAvatar: userProfile.photoURL || "",
        createdAt: serverTimestamp(),
        // INJECT SCHOOL ID: Penting untuk isolasi data di masa depan
        schoolId: userProfile.schoolId || null
      };

      // Jika sedang me-reply, tambahkan referensi
      if (replyTo) {
        messageData.replyToId = replyTo.id;
        messageData.replyToName = replyTo.senderName;
        
        // Auto-show replies saat kita sendiri yang komen
        setShowReplies(prev => ({ ...prev, [replyTo.id]: true }));
      }

      await addDoc(collection(db, 'messages'), messageData);
      setNewMessage(""); 
      setReplyTo(null); 
    } catch (error) {
      console.error("Gagal mengirim pesan:", error);
      alert("Gagal mengirim pesan. Periksa koneksi.");
    } finally {
      setSending(false);
    }
  };

  // Tambahan: Delete Message
  const handleDeleteMessage = async (msgId: string) => {
      if(confirm("Hapus pesan ini?")) {
          try {
            await deleteDoc(doc(db, "messages", msgId));
          } catch (err) {
            console.error("Gagal hapus pesan", err);
          }
      }
  };

  const toggleReplies = (postId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Helper: Format Time tanpa date-fns
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    // Menggunakan Native JS Intl API untuk format 'HH:mm'
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    }).replace('.', ':'); // Memastikan pemisah titik dua jika locale ID pakai titik
  };

  const getRoleBadge = (role: string) => {
    if (role === 'teacher') return <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 font-bold">GURU</span>;
    if (role === 'admin') return <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 font-bold">ADMIN</span>;
    return null;
  };

  // --- RENDER COMPONENT: THREAD ITEM (PENGUMUMAN) ---
  const AnnouncementThread = ({ post }: { post: ForumMessage & { replies: ForumMessage[] } }) => {
    const isRepliesVisible = showReplies[post.id];
    const replyCount = post.replies.length;
    const isMe = post.senderId === userProfile.uid;
    const canDelete = isMe || userProfile.role === 'admin';

    return (
      <div className="mb-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm group">
        {/* Main Post Header */}
        <div className="p-4 pb-2 flex items-start gap-3 relative">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-indigo-50">
             {post.senderAvatar ? (
               <img src={post.senderAvatar} alt={post.senderName} className="w-full h-full object-cover" />
             ) : (
               <User className="w-6 h-6 text-indigo-500" />
             )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-bold text-slate-900 dark:text-slate-100">{post.senderName}</span>
                {getRoleBadge(post.senderRole)}
              </div>
              <span className="text-xs text-slate-400">{formatTime(post.createdAt)}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
            
            {/* Delete Button Thread */}
            {canDelete && (
                <button 
                    onClick={() => handleDeleteMessage(post.id)}
                    className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus Thread"
                >
                    <Trash2 size={14} />
                </button>
            )}

            {/* Action Bar */}
            <div className="mt-3 flex items-center gap-4 border-t border-slate-50 dark:border-slate-800/50 pt-2">
              <button 
                onClick={() => setReplyTo(post)}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Reply className="w-3.5 h-3.5" />
                Balas
              </button>
              
              {replyCount > 0 && (
                <button 
                  onClick={() => toggleReplies(post.id)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors py-1 px-2 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {replyCount} Komentar
                  {isRepliesVisible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Replies Section (Collapsible) */}
        {replyCount > 0 && isRepliesVisible && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {post.replies.map(reply => (
              <div key={reply.id} className="flex gap-2 items-start ml-4 md:ml-12 relative group/reply">
                {/* Connector Line */}
                <div className="absolute -left-4 top-3 w-3 h-3 border-l-2 border-b-2 border-slate-300 rounded-bl-lg" />
                
                <div className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                   {reply.senderAvatar ? <img src={reply.senderAvatar} className="w-full h-full object-cover"/> : <User className="p-1 w-full h-full text-slate-500"/>}
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg rounded-tl-none border border-slate-200 dark:border-slate-700 flex-1 shadow-sm relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {reply.senderName}
                      {reply.senderId === userProfile.uid && " (Saya)"}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatTime(reply.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{reply.content}</p>
                  
                  {/* Delete Reply Button */}
                  {(reply.senderId === userProfile.uid || userProfile.role === 'admin') && (
                      <button 
                          onClick={() => handleDeleteMessage(reply.id)}
                          className="absolute top-1 right-1 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover/reply:opacity-100 transition-opacity"
                      >
                          <Trash2 size={12} />
                      </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- RENDER COMPONENT: BUBBLE CHAT (DISKUSI BIASA) ---
  const ChatBubble = ({ msg }: { msg: ForumMessage }) => {
    const isMe = msg.senderId === userProfile.uid;
    const canDelete = isMe || userProfile.role === 'admin';

    return (
      <div className={cn("flex w-full mb-4 group/bubble", isMe ? "justify-end" : "justify-start")}>
        <div className={cn("flex max-w-[80%] md:max-w-[70%]", isMe ? "flex-row-reverse" : "flex-row")}>
          <div className={cn(
            "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center overflow-hidden border",
            isMe ? "ml-2 bg-blue-100 border-blue-200" : "mr-2 bg-slate-100 border-slate-200"
          )}>
             {msg.senderAvatar ? <img src={msg.senderAvatar} className="h-full w-full object-cover" /> : <User className={cn("w-5 h-5", isMe ? "text-blue-600" : "text-slate-500")} />}
          </div>
          <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
            {!isMe && (
              <div className="flex items-center mb-1 ml-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{msg.senderName}</span>
                {getRoleBadge(msg.senderRole)}
              </div>
            )}
            <div className={cn(
              "px-4 py-2 rounded-2xl text-sm shadow-sm relative",
              isMe 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700"
            )}>
              <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
              <span className={cn("text-[10px] block text-right mt-1 opacity-70", isMe ? "text-blue-100" : "text-slate-400")}>
                {formatTime(msg.createdAt)}
              </span>

              {/* Delete Button */}
              {canDelete && (
                  <button 
                      onClick={() => handleDeleteMessage(msg.id)}
                      className={cn(
                          "absolute -right-7 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover/bubble:opacity-100 transition-opacity",
                          isMe && "right-auto -left-7"
                      )}
                      title="Hapus pesan"
                  >
                      <Trash2 size={14} />
                  </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      
      {/* A. Message List Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p className="text-sm">
              {isAnnouncementChannel ? "Belum ada pengumuman." : "Belum ada percakapan. Mulailah menyapa!"}
            </p>
          </div>
        )}

        {/* Render Berdasarkan Tipe Channel */}
        {isAnnouncementChannel ? (
          // MODE PENGUMUMAN (Thread Style)
          (threadMessages as (ForumMessage & { replies: ForumMessage[] })[]).map(post => (
            <AnnouncementThread key={post.id} post={post} />
          ))
        ) : (
          // MODE DISKUSI (Chat Style)
          messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)
        )}
        
        <div ref={scrollRef} />
      </div>

      {/* B. Input Area (Sticky Bottom) */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        
        {/* Indikator Sedang Membalas */}
        {replyTo && (
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-t-lg border border-indigo-100 dark:border-indigo-800 mb-2 text-xs text-indigo-700 dark:text-indigo-300 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4" />
              <span>Membalas <strong>{replyTo.senderName}</strong>: "{replyTo.content.substring(0, 30)}..."</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="hover:text-indigo-900"><X className="w-4 h-4"/></button>
          </div>
        )}

        {/* Form Input */}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto">
          <button 
            type="button"
            className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              // Logic Placeholder & Disabled State
              placeholder={
                replyTo 
                  ? `Tulis komentar balasan...` 
                  : isAnnouncementChannel 
                    ? (canPostMainMessage ? "Tulis pengumuman baru..." : "Hanya Guru yang dapat memposting pengumuman.") 
                    : "Kirim pesan..."
              }
              // Logic Disabled
              disabled={isAnnouncementChannel && !canPostMainMessage && !replyTo}
              
              className={cn(
                "w-full pl-4 pr-10 py-3 border-transparent focus:ring-0 rounded-xl text-sm transition-all",
                isAnnouncementChannel && !canPostMainMessage && !replyTo
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed italic"
                  : "bg-slate-100 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 text-slate-800 dark:text-slate-200"
              )}
            />
            {!isAnnouncementChannel && (
               <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yellow-500 transition-colors">
                 <Smile className="w-5 h-5" />
               </button>
            )}
          </div>

          <button 
            type="submit"
            disabled={!newMessage.trim() || sending || (isAnnouncementChannel && !canPostMainMessage && !replyTo)}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-transform active:scale-95"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        
        {/* Footer Info */}
        <p className="text-center text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
           {isAnnouncementChannel && !canPostMainMessage && !replyTo && <Lock className="w-3 h-3" />}
           {isAnnouncementChannel 
             ? "Channel Pengumuman Resmi." 
             : "Tekan Enter untuk mengirim."}
        </p>
      </div>

    </div>
  );
}