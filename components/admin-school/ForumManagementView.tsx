"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Trash2, 
  Edit, 
  MessageSquare,
  School,
  Hash,
  Loader2,
  MoreVertical,
  Plus,
  AlertCircle
} from "lucide-react";
import { collection, query, getDocs, orderBy, deleteDoc, doc, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import CreateChannelModal from "@/components/forum/CreateChannelModal"; 
import { UserProfile } from "@/lib/types/user.types";

// Interface sederhana untuk Forum
interface Forum {
  id: string;
  name: string;
  description?: string;
  type: 'school' | 'faculty' | 'class' | 'group';
  parentId?: string;
  schoolId?: string;
  memberCount?: number; 
  createdAt: any;
}

export default function ForumManagementView({ userProfile }: { userProfile: UserProfile }) {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // State untuk menyimpan ID Sekolah milik Admin
  const [adminSchoolId, setAdminSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>("");

  // 1. Init: Cari Sekolah Milik Admin & Fetch Forum
  useEffect(() => {
    const initData = async () => {
      if (!userProfile?.uid) return;

      try {
        setLoading(true);
        // A. Cari Sekolah dimana adminId == userProfile.uid
        const schoolQuery = query(
           collection(db, "schools"), 
           where("adminId", "==", userProfile.uid)
        );
        const schoolSnap = await getDocs(schoolQuery);

        if (!schoolSnap.empty) {
           const schoolDoc = schoolSnap.docs[0];
           const sid = schoolDoc.id;
           setAdminSchoolId(sid);
           setSchoolName(schoolDoc.data().name);
           
           // B. Ambil Forum milik sekolah ini
           await fetchForums(sid);
        } else {
           // Admin belum punya sekolah
           setLoading(false);
        }
      } catch (err) {
        console.error("Error init forum view:", err);
        setLoading(false);
      }
    };

    initData();
  }, [userProfile]);

  // 2. Fetch Forums Data (Filtered by School)
  const fetchForums = async (schoolId: string) => {
    try {
      // Query hanya forum dengan schoolId yang sesuai
      // Note: Kita tidak pakai orderBy di query untuk menghindari error index Firestore
      const q = query(collection(db, "forums"), where("schoolId", "==", schoolId));
      const snapshot = await getDocs(q);
      
      const fetchedForums: Forum[] = [];
      snapshot.forEach((doc) => {
        fetchedForums.push({ id: doc.id, ...doc.data() } as Forum);
      });
      
      // Sort manual di client (Terbaru diatas)
      fetchedForums.sort((a, b) => {
         const timeA = a.createdAt?.seconds || 0;
         const timeB = b.createdAt?.seconds || 0;
         return timeB - timeA;
      });
      
      setForums(fetchedForums);
    } catch (error) {
      console.error("Gagal mengambil data forum:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Filter Logic (Search)
  const filteredForums = forums.filter((forum) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        forum.name.toLowerCase().includes(q) || 
        (forum.description && forum.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Helper: Forum Type Icon & Badge
  const getForumTypeBadge = (type: string) => {
    switch (type) {
      case "school":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200"><School size={12} className="mr-1" /> Sekolah</span>;
      case "faculty":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"><Hash size={12} className="mr-1" /> Jurusan</span>;
      case "class":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"><School size={12} className="mr-1" /> Kelas</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"><MessageSquare size={12} className="mr-1" /> Umum</span>;
    }
  };

  // Helper: Date Formatter
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  // Action: Delete Forum (Cascading Delete)
  const handleDeleteForum = async (forumId: string) => {
    if (confirm("PERINGATAN: Menghapus forum ini akan menghapus semua channel & pesan di dalamnya. Lanjutkan?")) {
      try {
        setLoading(true);
        const batch = writeBatch(db);

        // 1. Hapus Dokumen Forum Induk
        const forumRef = doc(db, "forums", forumId);
        batch.delete(forumRef);

        // 2. Cari & Hapus Channel Anak
        const channelsQuery = query(collection(db, "channels"), where("forumId", "==", forumId));
        const channelsSnap = await getDocs(channelsQuery);
        
        channelsSnap.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        
        // Update state lokal
        setForums(forums.filter(f => f.id !== forumId));
        alert("Forum berhasil dihapus.");
      } catch (error) {
        console.error("Gagal hapus forum:", error);
        alert("Gagal menghapus forum.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Construct admin profile with schoolId injected for CreateChannelModal
  // Ini penting agar saat Admin buat forum, forumnya otomatis dapet schoolId ini
  const adminProfileWithSchool = {
     ...userProfile,
     schoolId: adminSchoolId || undefined
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-sm font-medium">Memuat data forum sekolah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Forum Sekolah</h2>
          <p className="text-slate-500 text-sm flex items-center gap-1">
             Kelola ruang diskusi untuk: <span className="font-bold text-purple-700">{schoolName || "..."}</span>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari forum..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
            />
          </div>
          
          {/* Add Forum Button */}
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!adminSchoolId}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-purple-200 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Buat Forum Baru
          </button>
        </div>
      </div>

      {/* Forums Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {!adminSchoolId ? (
           <div className="p-12 text-center text-slate-400 flex flex-col items-center">
             <AlertCircle size={48} className="mb-4 text-slate-300" />
             <p className="font-bold text-slate-600">Sekolah Belum Dikonfigurasi</p>
             <p className="text-sm mt-1 max-w-xs mx-auto">
               Silakan atur identitas sekolah Anda di menu <strong>Pengaturan</strong> terlebih dahulu sebelum membuat forum.
             </p>
           </div>
        ) : filteredForums.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-600">Belum ada forum sekolah</p>
            <p className="text-sm mt-1">
              Buat forum resmi untuk pengumuman sekolah atau jurusan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Nama Forum</th>
                  <th className="px-6 py-4">Tipe</th>
                  <th className="px-6 py-4">Deskripsi</th>
                  <th className="px-6 py-4">Dibuat Pada</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredForums.map((forum) => (
                  <tr key={forum.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-base">{forum.name}</div>
                      <div className="text-xs text-slate-400 font-mono">ID: {forum.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      {getForumTypeBadge(forum.type)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                      {forum.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(forum.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDeleteForum(forum.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Hapus Forum & Channel"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {adminSchoolId && (
        <div className="text-xs text-slate-400 text-center">
          Menampilkan {filteredForums.length} forum aktif di {schoolName}.
        </div>
      )}

      {/* Modal Create Forum */}
      {/* Kita passing adminProfileWithSchool yg sudah diinject schoolId */}
      <CreateChannelModal 
        userProfile={adminProfileWithSchool}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
            if (adminSchoolId) fetchForums(adminSchoolId); 
            setIsCreateModalOpen(false);
        }}
      />

    </div>
  );
}