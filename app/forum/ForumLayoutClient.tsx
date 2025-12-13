"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  onSnapshot,
  orderBy 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ForumSidebar from '@/components/forum/ForumSidebar';
import { ForumChannel } from '@/lib/types/forum.types';
import { UserProfile } from '@/lib/types/user.types';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function ForumLayoutClient({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [channels, setChannels] = useState<ForumChannel[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Auth & User Profile Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/auth');
        return;
      }
      setUser(currentUser);

      // Fetch User Profile
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        
        if (userDocSnapshot.exists()) {
          setUserProfile(userDocSnapshot.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 2. Fetch Channels (Realtime)
  useEffect(() => {
    if (!user || !userProfile) return;

    // Ambil semua channel, Sidebar yang akan bertugas mengelompokkan (Grouping)
    // Gunakan orderBy createdAt agar urutan channel konsisten
    const channelsRef = collection(db, 'channels');
    const q = query(channelsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChannels: ForumChannel[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<ForumChannel, 'id'>;
        fetchedChannels.push({ id: doc.id, ...data });
      });

      // FILTERING LOGIC (Security Layer)
      // Menentukan channel mana yang boleh dilihat user
      const allowedChannels = fetchedChannels.filter(channel => {
        // 1. Admin bisa lihat semua
        if (userProfile.role === 'admin') return true;

        // 2. Tipe Sekolah (School) biasanya publik untuk warga sekolah
        // Tapi jika ada field members khusus, kita utamakan cek members
        if (channel.type === 'school') return true;

        // 3. Cek Membership (Array 'members' berisi UID user)
        // Ini dibuat otomatis oleh CreateChannelModal untuk tipe Class/Group
        if (channel.members && Array.isArray(channel.members)) {
          return channel.members.includes(user.uid);
        }

        // Fallback untuk data lama atau channel bebas
        return true; 
      });

      setChannels(allowedChannels);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar Desktop - Hidden on Mobile */}
      <div className="hidden md:block h-full border-r border-slate-200 dark:border-slate-800">
        <ForumSidebar 
          channels={channels} 
          userRole={userProfile?.role}
          isLoading={loading}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {loading && !userProfile ? (
           <div className="flex items-center justify-center h-full">
             <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
           </div>
        ) : (
           children
        )}
      </main>
    </div>
  );
}