"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Trash2, 
  Edit, 
  Shield, 
  GraduationCap, 
  School,
  Loader2,
  Mail,
  Calendar,
  AlertCircle
} from "lucide-react";
import { collection, query, getDocs, deleteDoc, doc, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/lib/types/user.types";
import { cn } from "@/lib/utils";

export default function UserManagementView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminSchoolName, setAdminSchoolName] = useState<string>("");
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  // 1. Fetch Users Data (Multi-Tenant Logic)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Langkah A: Cari Sekolah milik Admin ini
        const schoolQuery = query(
            collection(db, "schools"), 
            where("adminId", "==", currentUser.uid)
        );
        const schoolSnap = await getDocs(schoolQuery);

        if (schoolSnap.empty) {
           // Admin belum setup sekolah
           setLoading(false);
           return;
        }

        const schoolDoc = schoolSnap.docs[0];
        const mySchoolId = schoolDoc.id;
        setAdminSchoolName(schoolDoc.data().name);

        // Langkah B: Ambil User yang terdaftar di sekolah ini
        // Kita gunakan filtering client-side untuk sorting agar tidak kena error index firestore
        const usersQuery = query(
            collection(db, "users"), 
            where("schoolId", "==", mySchoolId)
        );
        
        const usersSnap = await getDocs(usersQuery);
        
        const fetchedUsers: UserProfile[] = [];
        usersSnap.forEach((doc) => {
          fetchedUsers.push(doc.data() as UserProfile);
        });
        
        // Sorting manual descending (terbaru diatas)
        fetchedUsers.sort((a, b) => b.createdAt - a.createdAt);
        
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Filter Logic (Local)
  const filteredUsers = users.filter((user) => {
    // Filter by Role
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    
    // Filter by Search (Name or Email)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        user.displayName?.toLowerCase().includes(q) || 
        user.email?.toLowerCase().includes(q)
      );
    }
    
    return true;
  });

  // Helper: Role Badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200"><Shield size={12} className="mr-1" /> Admin</span>;
      case "teacher":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"><School size={12} className="mr-1" /> Guru</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"><GraduationCap size={12} className="mr-1" /> Siswa</span>;
    }
  };

  // Helper: Date Formatter
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    // Handle Firestore Timestamp or number
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  // Action: Delete User (Placeholder Logic - Hati-hati di production)
  const handleDeleteUser = async (userId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus user ini dari sekolah?")) {
      try {
        // PENTING: Sebaiknya jangan deleteDoc user sepenuhnya jika user bisa punya akun global.
        // Tapi untuk skenario sekolah terisolasi, kita asumsikan delete = remove access.
        // Disini kita hanya menghapus data dari Firestore. Di real production harus hapus dari Auth juga (butuh Cloud Functions).
        
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter(u => u.uid !== userId));
        alert("User berhasil dihapus.");
      } catch (error) {
        console.error("Gagal hapus user:", error);
        alert("Gagal menghapus user.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Memuat data warga sekolah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Warga Sekolah</h2>
          <p className="text-slate-500 text-sm flex items-center gap-1">
             Data terisolasi untuk: <span className="font-bold text-indigo-600">{adminSchoolName || "..."}</span>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama atau email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
          
          {/* Add User Button */}
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-colors">
            + Tambah User
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: "all", label: "Semua" },
          { id: "student", label: "Siswa" },
          { id: "teacher", label: "Guru" },
          { id: "admin", label: "Admin" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRoleFilter(tab.id as UserRole | "all")}
            className={cn(
              "px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap border-b-2",
              roleFilter === tab.id 
                ? "text-indigo-600 border-indigo-600" 
                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <AlertCircle className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-600">Belum ada warga sekolah</p>
            <p className="text-sm mt-1 max-w-xs mx-auto">
              Bagikan <strong>Kode Sekolah</strong> (ada di menu Pengaturan) kepada guru dan siswa agar mereka bisa bergabung.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">User Info</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Jenjang</th>
                  <th className="px-6 py-4">Bergabung</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                          ) : (
                            user.displayName?.charAt(0).toUpperCase() || "?"
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{user.displayName || "Tanpa Nama"}</div>
                          <div className="text-slate-500 text-xs flex items-center gap-1">
                            <Mail size={10} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {user.schoolLevel ? (
                        <span className="uppercase font-bold text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                          {user.schoolLevel}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar size={12} />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit User">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.uid)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Hapus User"
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
        Menampilkan {filteredUsers.length} warga sekolah.
      </div>
    </div>
  );
}