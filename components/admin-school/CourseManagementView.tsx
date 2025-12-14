import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  BookOpen, 
  MoreVertical,
  Layers,
  GraduationCap,
  Copy,
  LayoutGrid,
  List as ListIcon,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Building2 // Icon untuk Fakultas/Prodi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  where,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { CourseSubject, CourseSubjectInfo, ClassLevel } from '@/lib/types/course.types';
import { Button } from '@/components/ui/button';

// --- COMPONENTS ---

interface CourseManagementViewProps {
  appId?: string; // Optional, defaults to global constant if not provided
}

export default function CourseManagementView({ appId: propAppId }: CourseManagementViewProps) {
  // --- STATE ---
  const [courses, setCourses] = useState<CourseSubject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // School Type State (Adaptive)
  const [schoolType, setSchoolType] = useState<'sd' | 'smp' | 'sma' | 'uni' | null>(null);
  
  // Control States
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterLevel, setFilterLevel] = useState<ClassLevel | 'ALL'>('ALL');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest');
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null); // For List View dropdown

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseSubject | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formLevel, setFormLevel] = useState<ClassLevel>('SD');
  
  // State Khusus Univ (Agar input lebih rapi)
  const [uniFakultas, setUniFakultas] = useState('');
  const [uniProdi, setUniProdi] = useState('');

  const [formAdditionalInfo, setFormAdditionalInfo] = useState<CourseSubjectInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Environment Handling
  const appId = propAppId || (typeof window !== 'undefined' && (window as any).__app_id) || 'skoola-lms-default';

  // --- 1. INITIAL FETCH (Auth & School Type) ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        // Fetch School Data to get Type
        const schoolQuery = query(
           collection(db, "schools"), 
           where("adminId", "==", user.uid)
        );
        const schoolSnap = await getDocs(schoolQuery);

        if (!schoolSnap.empty) {
           const sData = schoolSnap.docs[0].data();
           const type = sData.level || 'sd';
           setSchoolType(type);
           
           // Set default filter & form level based on school type
           if (type === 'uni') {
             setFilterLevel('University');
             setFormLevel('University');
           } else if (type === 'sma') {
             setFilterLevel('SMA');
             setFormLevel('SMA');
           } else if (type === 'smp') {
             setFilterLevel('SMP');
             setFormLevel('SMP');
           } else {
             setFilterLevel('SD');
             setFormLevel('SD');
           }
        }
      } catch (err) {
        console.error("Error fetching school type:", err);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- 2. FIRESTORE LISTENERS (COURSES) ---
  useEffect(() => {
    if (!appId) return;

    // Fetch all first, sort later in client for flexibility
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'courses')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCourses: CourseSubject[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CourseSubject));
      setCourses(fetchedCourses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appId]);

  // --- LOGIC: FILTERING & SORTING ---
  
  const filteredAndSortedCourses = courses
    .filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase());
      // Filter level logic: Jika user memilih 'ALL', tetap filter berdasarkan schoolType yang aktif
      // (Agar admin SD tidak melihat data Univ jika database tercampur)
      let targetLevel = filterLevel;
      if (targetLevel === 'ALL' && schoolType) {
         if (schoolType === 'uni') targetLevel = 'University';
         else if (schoolType === 'sma') targetLevel = 'SMA';
         else if (schoolType === 'smp') targetLevel = 'SMP';
         else targetLevel = 'SD';
      }
      
      const matchesLevel = course.level === targetLevel || filterLevel === 'ALL';
      return matchesSearch && matchesLevel;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'newest': return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest': return (a.createdAt || 0) - (b.createdAt || 0);
        default: return 0;
      }
    });

  // --- HANDLERS ---

  const handleOpenModal = (course?: CourseSubject) => {
    // Tentukan level otomatis berdasarkan schoolType
    const autoLevel = 
      schoolType === 'uni' ? 'University' : 
      schoolType === 'sma' ? 'SMA' : 
      schoolType === 'smp' ? 'SMP' : 'SD';

    if (course) {
      setEditingCourse(course);
      setFormName(course.name);
      setFormLevel(course.level); // Gunakan level dari data existing
      
      // Ekstrak data Fakultas & Prodi dari additionalInfo jika ada
      const existingFakultas = course.additionalInfo?.find(i => i.label === 'Fakultas')?.value || '';
      const existingProdi = course.additionalInfo?.find(i => i.label === 'Program Studi')?.value || '';
      setUniFakultas(existingFakultas);
      setUniProdi(existingProdi);

      // Sisa info masuk ke dynamic fields (selain Fakultas & Prodi)
      const otherInfo = course.additionalInfo?.filter(i => i.label !== 'Fakultas' && i.label !== 'Program Studi') || [];
      setFormAdditionalInfo(otherInfo);

    } else {
      setEditingCourse(null);
      setFormName('');
      setFormLevel(autoLevel); // Set otomatis
      setUniFakultas('');
      setUniProdi('');
      
      // Smart Default Attributes (Auto-Template)
      if (schoolType === 'uni') {
        setFormAdditionalInfo([
          { id: Date.now().toString() + '1', label: 'Kode MK', value: '' },
          { id: Date.now().toString() + '2', label: 'SKS', value: '3' } // Default 3 SKS
        ]);
      } else {
        setFormAdditionalInfo([]);
      }
    }
    setIsModalOpen(true);
  };

  const handleDuplicate = (course: CourseSubject) => {
    setFormName(`${course.name} (Salinan)`);
    setFormLevel(course.level);
    
    // Duplicate additional info with new IDs
    const duplicatedInfo = course.additionalInfo ? course.additionalInfo.map(info => ({
      ...info,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5)
    })) : [];
    
    // Setup state for duplicate
    const existingFakultas = duplicatedInfo.find(i => i.label === 'Fakultas')?.value || '';
    const existingProdi = duplicatedInfo.find(i => i.label === 'Program Studi')?.value || '';
    setUniFakultas(existingFakultas);
    setUniProdi(existingProdi);

    const otherInfo = duplicatedInfo.filter(i => i.label !== 'Fakultas' && i.label !== 'Program Studi');
    setFormAdditionalInfo(otherInfo);

    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedCourseId(expandedCourseId === id ? null : id);
  };

  // --- DYNAMIC FIELD HANDLERS ---

  const addField = () => {
    const newField: CourseSubjectInfo = {
      id: Date.now().toString(),
      label: '',
      value: ''
    };
    setFormAdditionalInfo([...formAdditionalInfo, newField]);
  };

  const removeField = (id: string) => {
    setFormAdditionalInfo(formAdditionalInfo.filter(field => field.id !== id));
  };

  const updateField = (id: string, key: 'label' | 'value', text: string) => {
    setFormAdditionalInfo(formAdditionalInfo.map(field => 
      field.id === id ? { ...field, [key]: text } : field
    ));
  };

  // --- CRUD OPERATIONS ---

  const handleSave = async () => {
    if (!formName.trim()) return;
    setIsSubmitting(true);

    try {
      // Gabungkan Fakultas & Prodi ke dalam additionalInfo sebelum save
      let finalAdditionalInfo = [...formAdditionalInfo];
      
      if (schoolType === 'uni') {
        if (uniFakultas.trim()) {
          finalAdditionalInfo.push({ id: 'fac-'+Date.now(), label: 'Fakultas', value: uniFakultas });
        }
        if (uniProdi.trim()) {
          finalAdditionalInfo.push({ id: 'prod-'+Date.now(), label: 'Program Studi', value: uniProdi });
        }
      }

      const courseData = {
        name: formName,
        level: formLevel,
        additionalInfo: finalAdditionalInfo,
        updatedAt: Date.now()
      };

      if (editingCourse) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'courses', editingCourse.id);
        await updateDoc(docRef, courseData);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'courses'), {
          ...courseData,
          createdAt: Date.now()
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'courses', courseId));
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  // --- UI LABELS HELPER ---
  const getCourseLabel = () => schoolType === 'uni' ? 'Mata Kuliah' : 'Mata Pelajaran';

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER & MAIN ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen {getCourseLabel()}</h2>
          <p className="text-gray-500">Atur kurikulum dan atribut {getCourseLabel().toLowerCase()} untuk sekolah Anda.</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah {schoolType === 'uni' ? 'Matkul' : 'Mapel'} Baru
        </Button>
      </div>

      {/* TOOLBAR: SEARCH, FILTER, SORT, VIEW */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between sticky top-0 z-10">
        
        {/* Search */}
        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text"
            placeholder={`Cari ${getCourseLabel().toLowerCase()}...`}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          
          {/* Note: Filter Level dihapus/disederhanakan karena level sekarang fix per sekolah */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 cursor-default">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            <span>Jenjang: <strong>{formLevel === 'University' ? 'Universitas' : formLevel}</strong></span>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <select 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="name_asc">Nama (A-Z)</option>
              <option value="name_desc">Nama (Z-A)</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Tampilan Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Tampilan List"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAndSortedCourses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Tidak ditemukan</h3>
          <p className="text-gray-500 mt-2">Belum ada data mata pelajaran.</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // --- GRID VIEW ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredAndSortedCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${getLevelColor(course.level)}`}></div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getLevelBadgeColor(course.level)}`}>
                        {course.level}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDuplicate(course)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenModal(course)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(course.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{course.name}</h3>
                    <div className="mt-4 space-y-2">
                      {course.additionalInfo && course.additionalInfo.length > 0 ? (
                        course.additionalInfo.slice(0, 3).map((info) => (
                          <div key={info.id} className="flex justify-between text-xs items-center py-1 border-b border-gray-50 last:border-0">
                            <span className="text-gray-500">{info.label}</span>
                            <span className="font-medium text-gray-700 truncate max-w-[50%]">{info.value}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">Tidak ada detail tambahan</p>
                      )}
                      {course.additionalInfo && course.additionalInfo.length > 3 && (
                        <p className="text-xs text-blue-500 font-medium pt-1">
                          + {course.additionalInfo.length - 3} atribut lainnya
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            // --- LIST VIEW ---
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Nama {getCourseLabel()}</th>
                      <th className="px-6 py-4 font-semibold">Jenjang</th>
                      <th className="px-6 py-4 font-semibold text-center">Atribut</th>
                      <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAndSortedCourses.map((course) => (
                      <React.Fragment key={course.id}>
                        <tr className={`hover:bg-gray-50 transition-colors ${expandedCourseId === course.id ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-6 py-4 font-medium text-gray-900">{course.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getLevelBadgeColor(course.level)}`}>
                              {course.level}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {course.additionalInfo && course.additionalInfo.length > 0 ? (
                              <button 
                                onClick={() => toggleExpand(course.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                              >
                                {course.additionalInfo.length} Detail
                                {expandedCourseId === course.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleDuplicate(course)} title="Duplikat" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                                <Copy className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleOpenModal(course)} title="Edit" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(course.id)} title="Hapus" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* Expandable Detail Row */}
                        {expandedCourseId === course.id && (
                          <tr className="bg-blue-50/30">
                            <td colSpan={4} className="px-6 py-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {course.additionalInfo?.map((info) => (
                                  <div key={info.id} className="bg-white p-3 rounded-xl border border-blue-100 flex flex-col">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">{info.label}</span>
                                    <span className="text-sm font-semibold text-gray-800">{info.value}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">
                {editingCourse ? `Edit ${getCourseLabel()}` : `Tambah ${getCourseLabel()} Baru`}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                
                {/* Information Badge */}
                <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 border border-blue-100">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>
                    Menambahkan {getCourseLabel().toLowerCase()} untuk jenjang: <strong>{formLevel === 'University' ? 'Universitas' : formLevel}</strong>
                  </span>
                </div>

                {/* Nama Mata Pelajaran */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama {getCourseLabel()}</label>
                  <input 
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={schoolType === 'uni' ? "Contoh: Matematika Diskrit / Kalkulus I" : "Contoh: Matematika / Tematik 1"}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* KHUSUS UNIVERSITAS: INPUT FAKULTAS & PRODI */}
                {schoolType === 'uni' && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-blue-500"/> Fakultas
                      </label>
                      <input 
                        type="text"
                        value={uniFakultas}
                        onChange={(e) => setUniFakultas(e.target.value)}
                        placeholder="Contoh: Fakultas Teknik"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <GraduationCap className="w-4 h-4 text-blue-500"/> Program Studi
                      </label>
                      <input 
                        type="text"
                        value={uniProdi}
                        onChange={(e) => setUniProdi(e.target.value)}
                        placeholder="Contoh: Informatika"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Dynamic Fields Section */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-500" />
                      Detail Tambahan {schoolType === 'uni' ? '(SKS/Kode MK)' : '(Opsional)'}
                    </label>
                    <button 
                      onClick={addField}
                      className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Tambah Detail
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formAdditionalInfo.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start group">
                        <div className="flex-1 space-y-2">
                           <input 
                            type="text"
                            placeholder="Label (Misal: SKS)"
                            value={field.label}
                            onChange={(e) => updateField(field.id, 'label', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                           <input 
                            type="text"
                            placeholder="Nilai (Misal: 3)"
                            value={field.value}
                            onChange={(e) => updateField(field.id, 'value', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white"
                          />
                        </div>
                        <button 
                          onClick={() => removeField(field.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors mt-0.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formAdditionalInfo.length === 0 && (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-xs text-gray-400">Belum ada detail tambahan.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSubmitting || !formName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>

          </motion.div>
        </div>
      )}
    </div>
  );
}

// --- HELPER FUNCTIONS ---

function getLevelColor(level: ClassLevel) {
  switch (level) {
    case 'SD': return 'bg-red-500';
    case 'SMP': return 'bg-blue-500';
    case 'SMA': return 'bg-gray-500';
    case 'University': return 'bg-yellow-500';
    default: return 'bg-gray-300';
  }
}

function getLevelBadgeColor(level: ClassLevel) {
  switch (level) {
    case 'SD': return 'bg-red-50 text-red-700 border border-red-100';
    case 'SMP': return 'bg-blue-50 text-blue-700 border border-blue-100';
    case 'SMA': return 'bg-gray-100 text-gray-700 border border-gray-200';
    case 'University': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    default: return 'bg-gray-100 text-gray-600';
  }
}