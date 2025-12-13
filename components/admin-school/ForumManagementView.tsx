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
  Plus
} from "lucide-react";
import { collection, query, getDocs, orderBy, deleteDoc, doc, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import CreateChannelModal from "@/components/forum/CreateChannelModal"; 
// Pastikan path import ini sesuai dengan lokasi CreateChannelModal Anda
// Jika ada error import, sesuaikan path-nya.

// Interface sederhana untuk Forum (bisa dipindah ke types jika perlu global)
interface Forum {
  id: string;
  name: string;
  description?: string;
  type: 'school' | 'faculty' | 'class' | 'group';
  parentId?: string;
  memberCount?: number; // Optional, nanti bisa dihitung
  createdAt: any;
}

export default function ForumManagementView({ userProfile }: { userProfile: any }) {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. Fetch Forums Data
  const fetchForums = async () => {
    try {
      setLoading(true);
      // Ambil semua dokumen dari collection 'forums'
      // Urutkan berdasarkan waktu pembuatan terbaru
      const q = query(collection(db, "forums"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const fetchedForums: Forum[] = [];
      snapshot.forEach((doc) => {
        fetchedForums.push({ id: doc.id, ...doc.data() } as Forum);
      });
      
      setForums(fetchedForums);
    } catch (error) {
      console.error("Gagal mengambil data forum:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForums();
  }, []);

  // 2. Filter Logic (Search)
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
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  // Action: Delete Forum (Cascading Delete - Hapus Forum + Channel2-nya)
  const handleDeleteForum = async (forumId: string) => {
    if (confirm("PERINGATAN: Menghapus forum ini akan menghapus semua channel (Pengumuman & Diskusi) serta semua pesan di dalamnya. Tindakan ini TIDAK BISA dibatalkan. Lanjutkan?")) {
      try {
        setLoading(true);
        const batch = writeBatch(db);

        // 1. Hapus Dokumen Forum Induk
        const forumRef = doc(db, "forums", forumId);
        batch.delete(forumRef);

        // 2. Cari & Hapus Channel Anak (Pengumuman & Diskusi)
        // Query channel yang punya forumId == forumId
        const channelsQuery = query(collection(db, "channels"), where("forumId", "==", forumId));
        const channelsSnap = await getDocs(channelsQuery);
        
        channelsSnap.forEach((doc) => {
            batch.delete(doc.ref);
            // TODO (Optional): Hapus pesan-pesan di dalam channel ini juga (sub-collection messages)
            // Namun untuk batch delete messages dalam jumlah banyak, sebaiknya pakai Cloud Function
            // Untuk MVP, kita biarkan pesan menjadi 'orphan' (yatim piatu) atau hapus channelnya saja.
        });

        await batch.commit();
        
        // Update state lokal
        setForums(forums.filter(f => f.id !== forumId));
        alert("Forum dan channel terkait berhasil dihapus.");
      } catch (error) {
        console.error("Gagal hapus forum:", error);
        alert("Gagal menghapus forum.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Forum Sekolah</h2>
          <p className="text-slate-500 text-sm">Kelola ruang diskusi dan pengumuman sekolah.</p>
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
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-purple-200 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Buat Forum Baru
          </button>
        </div>
      </div>

      {/* Forums Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center items-center text-purple-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredForums.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquare size={48} className="mx-auto mb-2 opacity-20" />
            <p>Belum ada forum yang dibuat.</p>
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
                        {/* Tombol Edit bisa ditambahkan nanti */}
                        {/* <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Forum">
                          <Edit size={16} />
                        </button> */}
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
      
      <div className="text-xs text-slate-400 text-center">
        Menampilkan {filteredForums.length} forum aktif.
      </div>

      {/* Modal Create Forum */}
      <CreateChannelModal 
        userProfile={userProfile}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
            fetchForums(); // Refresh list setelah sukses buat
            setIsCreateModalOpen(false);
        }}
      />

    </div>
  );
}