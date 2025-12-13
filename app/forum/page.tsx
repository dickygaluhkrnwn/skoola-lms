"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from '@/lib/types/user.types';
import { ForumChannel } from '@/lib/types/forum.types';
import CreateChannelModal from '@/components/forum/CreateChannelModal';
import ChatArea from '@/components/forum/ChatArea';
import { MessageSquare, Plus, Hash, Info, Settings, Loader2 } from 'lucide-react';

export default function ForumPage() {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channelId');
  
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentChannel, setCurrentChannel] = useState<ForumChannel | null>(null);
  const [loadingChannel, setLoadingChannel] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. Auth & Profile Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Channel Detail (Realtime) saat channelId berubah
  useEffect(() => {
    if (!channelId) {
      setCurrentChannel(null);
      return;
    }

    setLoadingChannel(true);
    const unsub = onSnapshot(doc(db, 'channels', channelId), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentChannel({ id: docSnap.id, ...docSnap.data() } as ForumChannel);
      } else {
        setCurrentChannel(null);
      }
      setLoadingChannel(false);
    });

    return () => unsub();
  }, [channelId]);

  // Loading State Awal (Profile belum load)
  if (!userProfile) {
     return (
       <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-950">
         <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
       </div>
     );
  }

  // TAMPILAN 1: Empty State (Belum pilih channel)
  if (!channelId) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-950 p-8 text-center animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm mb-6 border border-slate-100 dark:border-slate-800">
          <MessageSquare className="w-16 h-16 text-blue-600 dark:text-blue-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Selamat Datang di Forum Sekolah
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
          Pilih channel di sidebar sebelah kiri untuk mulai berdiskusi, atau buat ruang diskusi baru bersama teman dan guru.
        </p>
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="group flex items-center px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          <div className="bg-white/20 rounded-full p-1 mr-2 group-hover:bg-white/30 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          Buat Channel Baru
        </button>

        {/* Modal Create Channel */}
        <CreateChannelModal 
          userProfile={userProfile}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    );
  }

  // TAMPILAN 2: Channel Detail & Chat Area
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 relative">
      
      {/* A. Channel Header */}
      <header className="flex-none flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-10">
        <div className="flex items-center min-w-0">
          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg mr-3">
            <Hash className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 truncate">
              {loadingChannel ? (
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                currentChannel?.name
              )}
              {currentChannel?.isLocked && !loadingChannel && (
                <span className="flex-none text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  Read Only
                </span>
              )}
            </h1>
            {/* FIX: Mengganti <p> menjadi <div> untuk menghindari Hydration Error karena ada div (loading skeleton) di dalamnya */}
            <div className="text-xs text-slate-500 truncate max-w-md">
              {loadingChannel ? (
                 <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-1" />
              ) : (
                currentChannel?.description || "Tidak ada deskripsi channel"
              )}
            </div>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-2">
           {/* Tombol Info */}
           <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Info Channel">
            <Info className="w-5 h-5" />
          </button>
           
           {/* Tombol Settings (Hanya untuk Moderator/Pembuat) */}
           {currentChannel && user && currentChannel.moderators?.includes(user.uid) && (
             <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Pengaturan Channel">
              <Settings className="w-5 h-5" />
            </button>
           )}
        </div>
      </header>

      {/* B. Content Area (Chat Area) */}
      <div className="flex-1 overflow-hidden relative">
        {loadingChannel ? (
           <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
           </div>
        ) : !currentChannel ? (
           <div className="flex flex-col items-center justify-center h-full text-center p-8">
             <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                <Hash className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Channel Tidak Ditemukan</h3>
             <p className="text-slate-500">Mungkin channel ini telah dihapus atau Anda tidak memiliki akses.</p>
           </div>
        ) : (
          <ChatArea 
            channelId={channelId} 
            userProfile={userProfile}
          />
        )}
      </div>

       {/* Modal tetap dirender agar bisa diakses jika nanti tombol create dipindah ke header */}
       <CreateChannelModal 
          userProfile={userProfile}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
    </div>
  );
}