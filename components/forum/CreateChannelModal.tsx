import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  writeBatch,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChannelType } from '@/lib/types/forum.types';
import { UserProfile } from '@/lib/types/user.types';

interface CreateChannelModalProps {
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateChannelModal({ 
  userProfile, 
  isOpen, 
  onClose,
  onSuccess
}: CreateChannelModalProps) {
  const [loading, setLoading] = useState(false);
  
  // State Data
  const [teacherClasses, setTeacherClasses] = useState<{id: string, name: string}[]>([]);
  const [selectedImportClass, setSelectedImportClass] = useState<string>("");

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'group' as ChannelType, 
    parentId: '', 
  });

  // 1. Fetch Kelas Guru saat Modal Dibuka (Jika Role Teacher)
  useEffect(() => {
    if (isOpen && userProfile.role === 'teacher') {
      const fetchClasses = async () => {
        try {
          console.log("Fetching classes for teacher:", userProfile.uid);
          // Menggunakan 'classrooms' sesuai TeacherClient.tsx
          const q = query(
            collection(db, 'classrooms'), 
            where('teacherId', '==', userProfile.uid)
          );
          const snapshot = await getDocs(q);
          
          const classes = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || doc.data().className || "Kelas Tanpa Nama"
          }));
          setTeacherClasses(classes);
        } catch (error) {
          console.error("Error fetching teacher classes:", error);
        }
      };
      fetchClasses();
    }
  }, [isOpen, userProfile]);

  // Tentukan opsi tipe channel berdasarkan Role
  const getAvailableTypes = () => {
    const types: { value: ChannelType; label: string }[] = [];
    
    if (userProfile.role === 'admin') {
      types.push({ value: 'school', label: 'Sekolah (Umum)' });
      types.push({ value: 'faculty', label: 'Jurusan / Fakultas' });
    }
    
    if (userProfile.role === 'teacher') {
      types.push({ value: 'class', label: 'Kelas' });
    }
    
    // Semua role bisa buat group (diskusi bebas)
    types.push({ value: 'group', label: 'Kelompok Belajar' });

    return types;
  };

  const availableTypes = getAvailableTypes();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      // 1. Tentukan ID Server/Forum
      let forumId = crypto.randomUUID(); // ID Unik untuk Forum ini
      const initialMembers = [userProfile.uid]; 

      // Jika tipe kelas & import dipilih, gunakan ID Kelas sebagai ID Forum
      // Ini bagus agar 1 Kelas = 1 Forum (tidak duplikat)
      if (formData.type === 'class' && selectedImportClass) {
        forumId = selectedImportClass; 
        
        // Cari siswa yang enroll di kelas ini
        const studentQuery = query(
          collection(db, 'users'),
          where('enrolledClasses', 'array-contains', selectedImportClass)
        );
        const studentSnap = await getDocs(studentQuery);
        studentSnap.forEach((doc) => {
          initialMembers.push(doc.id);
        });
        
        console.log(`Mengimport ${studentSnap.size} siswa ke forum.`);
      }

      // Gunakan Batch Write agar Atomicity terjaga (Semua sukses atau semua gagal)
      const batch = writeBatch(db);
      
      // Ambil School ID dari user profile
      const userSchoolId = userProfile.schoolId || null;

      // STEP 1: Buat Dokumen INDUK (Server/Forum) di collection 'forums'
      // Ini menjawab kekhawatiran masa depanmu!
      const forumRef = doc(db, 'forums', forumId);
      batch.set(forumRef, {
        id: forumId,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        // Jika ini sub-forum (misal forum jurusan), parentId merujuk ke ID Jurusan
        parentId: formData.parentId || '', 
        schoolId: userSchoolId, // <-- INJECT SCHOOL ID
        createdBy: userProfile.uid,
        moderators: [userProfile.uid],
        members: initialMembers,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // STEP 2: Buat Channel Anak (Pengumuman & Diskusi)
      
      // A. Channel Pengumuman
      const announcementRef = doc(collection(db, 'channels'));
      batch.set(announcementRef, {
        name: "Pengumuman",
        // PENTING: Menghubungkan channel ke dokumen 'forums' di atas
        forumId: forumId, 
        parentId: forumId, // field parentId tetap ada agar kompatibel dengan logika sidebar saat ini
        groupName: formData.name, // Denormalisasi nama grup untuk display cepat di sidebar
        schoolId: userSchoolId, // <-- INJECT SCHOOL ID
        
        description: `Pengumuman resmi untuk ${formData.name}`,
        type: formData.type,
        createdBy: userProfile.uid,
        moderators: [userProfile.uid],
        members: initialMembers,
        isLocked: true, // Hanya guru/admin
        category: 'announcement',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // B. Channel Diskusi
      const discussionRef = doc(collection(db, 'channels'));
      batch.set(discussionRef, {
        name: "Diskusi",
        forumId: forumId,
        parentId: forumId,
        groupName: formData.name,
        schoolId: userSchoolId, // <-- INJECT SCHOOL ID
        
        description: `Ruang diskusi bebas untuk ${formData.name}`,
        type: formData.type,
        createdBy: userProfile.uid,
        moderators: [userProfile.uid],
        members: initialMembers,
        isLocked: false, // Semua bisa chat
        category: 'discussion',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Commit Batch
      await batch.commit();

      // 3. Reset form & close
      setFormData({
        name: '',
        description: '',
        type: 'group',
        parentId: '',
      });
      setSelectedImportClass("");
      
      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error("Error creating forum:", error);
      alert("Gagal membuat forum. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            Buat Forum Baru
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Input Nama Forum */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nama Forum / Server
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Kelas 10-A, Klub Musik, Jurusan IPA"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              *Akan otomatis membuat channel <strong>#Pengumuman</strong> dan <strong>#Diskusi</strong> di dalamnya.
            </p>
          </div>

          {/* Input Tipe Forum */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tipe Forum
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as ChannelType})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* OPSI KHUSUS GURU: IMPORT SISWA DARI KELAS */}
          {userProfile.role === 'teacher' && formData.type === 'class' && (
             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                <label className="block text-xs font-bold uppercase text-blue-800 dark:text-blue-300 mb-1">
                  Link ke Kelas (Otomatis)
                </label>
                <select
                  value={selectedImportClass}
                  onChange={(e) => {
                    const clsId = e.target.value;
                    setSelectedImportClass(clsId);
                    // Otomatis isi nama forum jika masih kosong
                    if (clsId && !formData.name) {
                       const clsName = teacherClasses.find(c => c.id === clsId)?.name;
                       if (clsName) setFormData(prev => ({...prev, name: clsName}));
                    }
                  }}
                  className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Kelas Asal (Opsional) --</option>
                  {teacherClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                  *Siswa di kelas ini otomatis masuk ke Forum Pengumuman & Diskusi.
                </p>
                {teacherClasses.length === 0 && (
                  <p className="text-[10px] text-red-500 mt-1">
                    *Tidak ada kelas ditemukan. Pastikan Anda sudah membuat kelas.
                  </p>
                )}
             </div>
          )}

          {/* Input Conditional: ID Jurusan (Jika tipe faculty) */}
          {formData.type === 'faculty' && (
             <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
               Nama Jurusan / Fakultas
             </label>
             <input
               type="text"
               required
               placeholder="Contoh: Teknik Informatika"
               value={formData.parentId}
               onChange={(e) => setFormData({...formData, parentId: e.target.value})}
               className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
           </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Buat Forum
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}