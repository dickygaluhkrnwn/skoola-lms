"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  onSnapshot,
  where
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

  // 2. Fetch Channels (Optimized & Isolated)
  useEffect(() => {
    if (!user || !userProfile) return;

    const channelsRef = collection(db, 'channels');
    let q;

    // A. ISOLASI SEKOLAH: Jika User punya School ID
    if (userProfile.schoolId) {
       // Query hanya channel milik sekolah tersebut
       // PENTING: Sorting dilakukan di client-side untuk menghindari index error Firestore
       q = query(channelsRef, where('schoolId', '==', userProfile.schoolId));
    } else {
       // B. FALLBACK: User umum / belum join sekolah
       q = query(channelsRef);
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChannels: ForumChannel[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<ForumChannel, 'id'>;
        fetchedChannels.push({ id: doc.id, ...data });
      });

      // C. CLIENT-SIDE SORTING (createdAt ASC)
      fetchedChannels.sort((a, b) => {
         const dateA = a.createdAt?.seconds || 0;
         const dateB = b.createdAt?.seconds || 0;
         return dateA - dateB; 
      });

      // D. FILTERING LOGIC (Security Layer - Lapis Kedua)
      const allowedChannels = fetchedChannels.filter(channel => {
        // 1. Admin bisa lihat semua di lingkup querynya
        if (userProfile.role === 'admin') return true;

        // 2. Tipe Sekolah & Jurusan public untuk warga sekolah
        if (channel.type === 'school' || channel.type === 'faculty') return true;

        // 3. Logic Private Channel (Class/Group)
        // PERBAIKAN ERROR TYPESCRIPT DISINI: Gunakan Array.isArray
        if (Array.isArray(channel.members) && channel.members.length > 0) {
           return channel.members.includes(user.uid);
        }

        // 4. Jika members undefined atau kosong, anggap Public di dalam sekolah tersebut
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
          userSchoolId={userProfile?.schoolId} 
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