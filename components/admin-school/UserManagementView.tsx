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
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  Filter,
  ArrowUpDown,
  X,
  Plus,
  Check,
  Camera,
  BookOpen,
  Users,
  IdCard,
  Building2
} from "lucide-react";
import { 
  collection, 
  query, 
  getDocs, 
  deleteDoc, 
  doc, 
  where, 
  addDoc,
  updateDoc,
  orderBy,
  onSnapshot 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/lib/types/user.types";
import { CourseSubject } from "@/lib/types/course.types"; // Import tipe mata pelajaran
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Extended Interface untuk mengakomodasi field baru adaptif
interface ExtendedUserProfile extends Omit<UserProfile, 'schoolLevel'> {
  teachingSubjects?: { id: string; name: string; level: string }[];
  schoolLevel?: string; // Automatically set based on school type
  
  // Field Tambahan Adaptif
  nim?: string;         // Khusus Mahasiswa
  prodi?: string;       // Khusus Mahasiswa
  semester?: string;    // Khusus Mahasiswa
  nisn?: string;        // Khusus Siswa
}

export default function UserManagementView() {
  // --- STATE ---
  const [users, setUsers] = useState<ExtendedUserProfile[]>([]);
  const [courses, setCourses] = useState<CourseSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [appId, setAppId] = useState<string>("");
  const [adminSchoolName, setAdminSchoolName] = useState<string>("");
  const [adminSchoolId, setAdminSchoolId] = useState<string>("");
  
  // Adaptive State
  const [schoolType, setSchoolType] = useState<'sd' | 'smp' | 'sma' | 'uni' | null>(null);

  // UI Control States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'name_asc'>('newest');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState<{
    displayName: string;
    email: string;
    role: UserRole;
    photoURL: string;
    teachingSubjects: { id: string; name: string; level: string }[];
    // Adaptive Fields
    nim: string;
    prodi: string;
    semester: string;
    nisn: string;
  }>({
    displayName: "",
    email: "",
    role: "student",
    photoURL: "",
    teachingSubjects: [],
    nim: "",
    prodi: "",
    semester: "",
    nisn: ""
  });

  // --- 1. INITIAL FETCH (Auth & School) ---
  useEffect(() => {
    const currentAppId = (typeof window !== 'undefined' && (window as any).__app_id) || 'skoola-lms-default';
    setAppId(currentAppId);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // A. Cari Sekolah milik Admin
        const schoolQuery = query(
             collection(db, "schools"), 
             where("adminId", "==", currentUser.uid)
        );
        const schoolSnap = await getDocs(schoolQuery);

        if (schoolSnap.empty) {
           setLoading(false);
           return;
        }

        const schoolDoc = schoolSnap.docs[0];
        const sData = schoolDoc.data();
        setAdminSchoolId(schoolDoc.id);
        setAdminSchoolName(sData.name);
        setSchoolType(sData.level || 'sd'); // Set School Type

        // B. Realtime Listener untuk Users
        const usersQuery = query(
             collection(db, "users"), 
             where("schoolId", "==", schoolDoc.id)
        );
        
        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
          const fetchedUsers: ExtendedUserProfile[] = [];
          snapshot.forEach((doc) => {
            fetchedUsers.push({ ...doc.data(), uid: doc.id } as ExtendedUserProfile);
          });
          setUsers(fetchedUsers);
          setLoading(false);
        });

        // C. Fetch Data Mata Pelajaran
        const coursesQuery = query(
          collection(db, 'artifacts', currentAppId, 'public', 'data', 'courses')
        );
        const unsubCourses = onSnapshot(coursesQuery, (snapshot) => {
           const fetchedCourses = snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
           } as CourseSubject));
           setCourses(fetchedCourses);
        });

        return () => {
          unsubUsers();
          unsubCourses();
        };

      } catch (error) {
        console.error("Error init:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- 2. FILTER & SORT LOGIC ---
  const filteredUsers = users
    .filter((user) => {
      // Filter Role
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      
      // Filter Search (Name, Email, Subjects, NIM, NISN, Prodi)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = user.displayName?.toLowerCase().includes(q);
        const matchesEmail = user.email?.toLowerCase().includes(q);
        const matchesSubject = user.teachingSubjects?.some(s => s.name.toLowerCase().includes(q));
        const matchesId = (user.nim || user.nisn || "").toLowerCase().includes(q);
        const matchesProdi = (user.prodi || "").toLowerCase().includes(q);

        return matchesName || matchesEmail || matchesSubject || matchesId || matchesProdi;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'name_asc': return (a.displayName || "").localeCompare(b.displayName || "");
        case 'oldest': return (a.createdAt || 0) - (b.createdAt || 0);
        case 'newest': return (b.createdAt || 0) - (a.createdAt || 0);
        default: return 0;
      }
    });

  // --- 3. HELPER LOGIC ---
  
  // Label Helpers
  const getStudentLabel = () => schoolType === 'uni' ? 'Mahasiswa' : 'Siswa';
  const getTeacherLabel = () => schoolType === 'uni' ? 'Dosen' : 'Guru';
  const getIdLabel = () => schoolType === 'uni' ? 'NIM' : 'NISN';

  const getOtherTeachersForCourse = (courseId: string) => {
    return users.filter(u => 
      u.role === 'teacher' && 
      u.uid !== editingUser?.uid &&
      u.teachingSubjects?.some(s => s.id === courseId)
    );
  };

  // --- 4. HANDLERS ---

  const handleOpenModal = (user?: ExtendedUserProfile) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        displayName: user.displayName || "",
        email: user.email || "",
        role: user.role,
        photoURL: user.photoURL || "",
        teachingSubjects: user.teachingSubjects || [],
        nim: user.nim || "",
        prodi: user.prodi || "",
        semester: user.semester || "",
        nisn: user.nisn || ""
      });
    } else {
      setEditingUser(null);
      setFormData({
        displayName: "",
        email: "",
        role: "student",
        photoURL: "",
        teachingSubjects: [],
        nim: "",
        prodi: "",
        semester: "",
        nisn: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleSubject = (course: CourseSubject) => {
    setFormData(prev => {
      const exists = prev.teachingSubjects.find(s => s.id === course.id);
      if (exists) {
        return {
          ...prev,
          teachingSubjects: prev.teachingSubjects.filter(s => s.id !== course.id)
        };
      } else {
        return {
          ...prev,
          teachingSubjects: [...prev.teachingSubjects, { id: course.id, name: course.name, level: course.level }]
        };
      }
    });
  };

  const handleSaveUser = async () => {
    if (!formData.displayName || !formData.email) return;
    setIsSubmitting(true);

    try {
      const payload = {
        displayName: formData.displayName,
        email: formData.email,
        role: formData.role,
        photoURL: formData.photoURL,
        schoolId: adminSchoolId,
        updatedAt: Date.now(),
        // Auto-set School Level based on School Type
        schoolLevel: schoolType === 'uni' ? 'University' : 
                     schoolType === 'sma' ? 'SMA' : 
                     schoolType === 'smp' ? 'SMP' : 'SD',
        
        // Conditionally add fields based on role & school type
        ...(formData.role === 'teacher' ? { teachingSubjects: formData.teachingSubjects } : {}),
        ...(formData.role === 'student' && schoolType === 'uni' ? { 
            nim: formData.nim, 
            prodi: formData.prodi, 
            semester: formData.semester 
        } : {}),
        ...(formData.role === 'student' && schoolType !== 'uni' ? { 
            nisn: formData.nisn 
        } : {})
      };

      if (editingUser) {
        // Update
        const userRef = doc(db, "users", editingUser.uid);
        await updateDoc(userRef, payload);
      } else {
        // Create
        await addDoc(collection(db, "users"), {
          ...payload,
          createdAt: Date.now(),
          uid: Date.now().toString() // Temp ID placeholder
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Gagal menyimpan data user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
      } catch (error) {
        console.error("Gagal hapus:", error);
      }
    }
  };

  // --- RENDER HELPERS ---

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200"><Shield size={10} className="mr-1" /> Admin</span>;
      case "teacher": return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200"><School size={10} className="mr-1" /> {getTeacherLabel()}</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><GraduationCap size={10} className="mr-1" /> {getStudentLabel()}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Sinkronisasi data sekolah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Warga {schoolType === 'uni' ? 'Kampus' : 'Sekolah'}</h2>
          <p className="text-slate-500 text-sm">
             Kelola akses {getTeacherLabel()} dan {getStudentLabel()} di <span className="font-bold text-indigo-600">{adminSchoolName}</span>
          </p>
        </div>
        
        <Button 
          onClick={() => handleOpenModal()} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </Button>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between sticky top-0 z-10">
        
        {/* Search */}
        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder={`Cari nama, email, ${getIdLabel()}...`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
             <Filter className="w-4 h-4 text-slate-500" />
             <select 
               value={roleFilter}
               onChange={(e) => setRoleFilter(e.target.value as any)}
               className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
             >
               <option value="all">Semua Role</option>
               <option value="student">{getStudentLabel()}</option>
               <option value="teacher">{getTeacherLabel()}</option>
               <option value="admin">Admin</option>
             </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
             <ArrowUpDown className="w-4 h-4 text-slate-500" />
             <select 
               value={sortOption}
               onChange={(e) => setSortOption(e.target.value as any)}
               className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
             >
               <option value="newest">Terbaru</option>
               <option value="oldest">Terlama</option>
               <option value="name_asc">Nama (A-Z)</option>
             </select>
          </div>

          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT: GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.uid} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative flex flex-col">
              
              {/* Card Header / Banner */}
              <div className={`h-20 ${user.role === 'teacher' ? 'bg-indigo-50' : user.role === 'admin' ? 'bg-purple-50' : 'bg-emerald-50'}`}></div>
              
              {/* Avatar & Main Info */}
              <div className="px-6 relative flex-1">
                <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white shadow-sm absolute -top-10 overflow-hidden flex items-center justify-center text-2xl font-bold text-slate-400 select-none">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      user.role === 'teacher' ? 'bg-indigo-100 text-indigo-500' :
                      user.role === 'admin' ? 'bg-purple-100 text-purple-500' : 'bg-emerald-100 text-emerald-500'
                    }`}>
                      {user.displayName?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                
                <div className="mt-12 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 truncate pr-2">{user.displayName}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                        <Mail size={10} /> {user.email}
                      </p>
                      {getRoleBadge(user.role)}
                    </div>
                  </div>

                  {/* Teacher Specific: Subjects */}
                  {user.role === 'teacher' && user.teachingSubjects && user.teachingSubjects.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Mengajar:</p>
                      <div className="flex flex-wrap gap-1">
                        {user.teachingSubjects.slice(0, 3).map(sub => (
                          <span key={sub.id} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium border border-slate-200">
                            {sub.name}
                          </span>
                        ))}
                        {user.teachingSubjects.length > 3 && (
                          <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md">
                            +{user.teachingSubjects.length - 3} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Student Specific: Adaptive Info */}
                  {user.role === 'student' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                        {schoolType === 'uni' ? (
                          <>
                            {user.nim && <p className="text-xs text-slate-600 font-mono">NIM: {user.nim}</p>}
                            {user.prodi && <p className="text-xs text-slate-600 flex items-center gap-1"><Building2 size={10}/> {user.prodi}</p>}
                          </>
                        ) : (
                          <>
                            {user.nisn && <p className="text-xs text-slate-600 font-mono">NISN: {user.nisn}</p>}
                            <p className="text-xs text-slate-500">Siswa {schoolType?.toUpperCase()}</p>
                          </>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                 <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-sm">
                    <Edit size={16} />
                 </button>
                 <button onClick={() => handleDeleteUser(user.uid)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-sm">
                    <Trash2 size={16} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTENT: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-4">Nama User</th>
                   <th className="px-6 py-4">Role</th>
                   <th className="px-6 py-4">Detail Info</th>
                   <th className="px-6 py-4 text-right">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {filteredUsers.map((user) => (
                   <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-200">
                           {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover"/> : user.displayName?.charAt(0)}
                         </div>
                         <div>
                           <div className="font-bold text-slate-800">{user.displayName}</div>
                           <div className="text-xs text-slate-500">{user.email}</div>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                     </td>
                     <td className="px-6 py-4">
                        {user.role === 'teacher' ? (
                          <div className="flex items-center gap-1 text-slate-600">
                            <BookOpen size={14} className="text-indigo-400" />
                            <span className="truncate max-w-[200px]">
                              {user.teachingSubjects?.map(s => s.name).join(", ") || "-"}
                            </span>
                          </div>
                        ) : user.role === 'student' ? (
                          <div className="flex flex-col text-xs">
                             {schoolType === 'uni' ? (
                               <>
                                 <span className="font-medium">{user.prodi || '-'}</span>
                                 <span className="text-slate-500">NIM: {user.nim || '-'}</span>
                               </>
                             ) : (
                               <span className="text-slate-500 font-mono">NISN: {user.nisn || '-'}</span>
                             )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Administrator</span>
                        )}
                     </td>
                     <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                         <button onClick={() => handleOpenModal(user)} className="text-indigo-600 hover:underline text-xs font-bold mr-2">Edit</button>
                         <button onClick={() => handleDeleteUser(user.uid)} className="text-red-500 hover:underline text-xs">Hapus</button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">{editingUser ? "Edit User" : "Tambah User Baru"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                
                {/* Photo Input (Smart URL) */}
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.photoURL ? (
                        <img src={formData.photoURL} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="text-slate-400 w-6 h-6" />
                      )}
                   </div>
                   <div className="flex-1">
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Foto Profil (URL)</label>
                      <input 
                        type="text" 
                        placeholder="https://..."
                        value={formData.photoURL}
                        onChange={(e) => setFormData({...formData, photoURL: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={!!editingUser}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-700 mb-1 block">Role</label>
                   <div className="flex gap-2">
                      {['student', 'teacher', 'admin'].map(r => (
                        <button
                          key={r}
                          onClick={() => setFormData({...formData, role: r as UserRole})}
                          className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                             formData.role === r 
                               ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                               : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                           {r === 'student' ? getStudentLabel() : r === 'teacher' ? getTeacherLabel() : 'Admin'}
                        </button>
                      ))}
                   </div>
                </div>

                {/* ADAPTIVE FIELDS */}
                {formData.role === 'student' && (
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                      <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Detail {getStudentLabel()}</h4>
                      
                      {schoolType === 'uni' ? (
                        /* UNIVERSITAS FORM */
                        <div className="space-y-3">
                           <div>
                              <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <IdCard size={12}/> Nomor Induk Mahasiswa (NIM)
                              </label>
                              <input 
                                type="text"
                                value={formData.nim}
                                onChange={(e) => setFormData({...formData, nim: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                placeholder="Contoh: 12345678"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                  <Building2 size={12}/> Program Studi
                                </label>
                                <input 
                                  type="text"
                                  value={formData.prodi}
                                  onChange={(e) => setFormData({...formData, prodi: e.target.value})}
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                  placeholder="Informatika"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-700 mb-1">Semester Awal</label>
                                <select 
                                  value={formData.semester}
                                  onChange={(e) => setFormData({...formData, semester: e.target.value})}
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                                >
                                   <option value="">Pilih...</option>
                                   {[1,2,3,4,5,6,7,8].map(i => <option key={i} value={i}>Sem {i}</option>)}
                                </select>
                              </div>
                           </div>
                        </div>
                      ) : (
                        /* SEKOLAH (SD/SMP/SMA) FORM */
                        <div>
                           <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                             <IdCard size={12}/> NIS / NISN
                           </label>
                           <input 
                             type="text"
                             value={formData.nisn}
                             onChange={(e) => setFormData({...formData, nisn: e.target.value})}
                             className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                             placeholder="Nomor Induk Siswa Nasional"
                           />
                        </div>
                      )}
                   </div>
                )}

                {/* TEACHER SUBJECTS */}
                {formData.role === 'teacher' && (
                   <div className="animate-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-bold text-slate-700 mb-2 flex justify-between items-center">
                         {schoolType === 'uni' ? 'Mata Kuliah' : 'Mata Pelajaran'} yang Diampu
                         <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Multi-select</span>
                      </label>
                      
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50 custom-scrollbar">
                         {courses.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">Belum ada data mata pelajaran.</p>
                         ) : (
                            <div className="space-y-1">
                               {courses.map(course => {
                                  const isSelected = formData.teachingSubjects.some(s => s.id === course.id);
                                  const otherTeachers = getOtherTeachersForCourse(course.id);
                                  const isAssignedToOthers = otherTeachers.length > 0;

                                  return (
                                     <div 
                                        key={course.id}
                                        onClick={() => handleToggleSubject(course)}
                                        className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                           isSelected 
                                            ? 'bg-indigo-50 border border-indigo-200' 
                                            : isAssignedToOthers 
                                              ? 'hover:bg-amber-50 border border-transparent'
                                              : 'hover:bg-white border border-transparent'
                                        }`}
                                     >
                                        <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                                           isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white'
                                        }`}>
                                           {isSelected && <Check size={10} className="text-white" />}
                                        </div>
                                        <div className="flex-1">
                                           <div className="flex justify-between items-start">
                                              <p className={`text-sm font-medium ${isSelected ? 'text-indigo-800' : 'text-slate-700'}`}>
                                                 {course.name}
                                              </p>
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                                course.level === 'SD' ? 'bg-red-50 text-red-600' :
                                                course.level === 'SMP' ? 'bg-blue-50 text-blue-600' :
                                                course.level === 'SMA' ? 'bg-gray-100 text-gray-600' :
                                                'bg-yellow-50 text-yellow-600'
                                              }`}>
                                                 {course.level}
                                              </span>
                                           </div>
                                           {isAssignedToOthers && (
                                              <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-100 w-fit">
                                                <Users size={10} />
                                                Sudah diampu: {otherTeachers.map(u => u.displayName).slice(0, 2).join(", ")}
                                                {otherTeachers.length > 2 && "..."}
                                              </div>
                                           )}
                                        </div>
                                     </div>
                                  );
                               })}
                            </div>
                         )}
                      </div>
                   </div>
                )}

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
               <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
               <Button onClick={handleSaveUser} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
               </Button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER STATS */}
      <div className="text-xs text-slate-400 text-center mt-8">
        Total {filteredUsers.length} user ditampilkan.
      </div>
    </div>
  );
}