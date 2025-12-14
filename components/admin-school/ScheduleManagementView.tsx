"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  RefreshCw, 
  Filter, 
  Clock, 
  Users, 
  Trash2, 
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  Settings as SettingsIcon,
  AlertTriangle
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  onSnapshot,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { CourseSubject, Classroom } from "@/lib/types/course.types";
import { cn } from "@/lib/utils";

// --- TYPES ---

interface ScheduleItem {
  id: string;
  day: string;
  slot: number; // Slot index awal
  duration: number; // Berapa slot yang dipakai (SKS)
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  room?: string;
}

interface ExtendedTeacher {
  uid: string;
  displayName: string;
  teachingSubjects?: { id: string; name: string; level: string }[];
}

interface TimeSlot {
  index: number;
  start: string;
  end: string;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

export default function ScheduleManagementView() {
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appId, setAppId] = useState<string>("");
  const [adminSchoolId, setAdminSchoolId] = useState<string>("");
  const [schoolType, setSchoolType] = useState<'sd' | 'smp' | 'sma' | 'uni'>('sd');
  
  // Settings Config
  const [timeConfig, setTimeConfig] = useState({
    start: "07:00",
    end: "15:00",
    duration: 45 // Default menit per slot/SKS
  });
  
  // Data Master
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [courses, setCourses] = useState<CourseSubject[]>([]);
  const [teachers, setTeachers] = useState<ExtendedTeacher[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  // UI State
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [generatedCount, setGeneratedCount] = useState(0);
  const [generatedSlots, setGeneratedSlots] = useState<TimeSlot[]>([]);

  // --- 1. FETCH DATA ---
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

        // A. Get School Settings
        const schoolQuery = query(collection(db, "schools"), where("adminId", "==", currentUser.uid));
        const schoolSnap = await getDocs(schoolQuery);
        
        let currentSchoolId = "";
        if (!schoolSnap.empty) { 
           const sData = schoolSnap.docs[0].data();
           currentSchoolId = schoolSnap.docs[0].id;
           setAdminSchoolId(currentSchoolId);
           setSchoolType(sData.level || 'sd');
           
           // Set Time Config from Settings if available
           if (sData.lessonDuration) {
             // Asumsi jam masuk/pulang statis dulu atau bisa diambil dari settings juga nanti
             // Disini kita generate slot berdasarkan durasi
             setTimeConfig(prev => ({ ...prev, duration: sData.lessonDuration || 45 }));
           }
        }

        // B. Fetch Classes
        const classesRef = collection(db, "classrooms");
        const classesQ = currentSchoolId 
          ? query(classesRef, where("schoolId", "==", currentSchoolId)) 
          : classesRef;
          
        const classesSnap = await getDocs(classesQ);
        const fetchedClasses = classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Classroom));
        setClasses(fetchedClasses);
        if(fetchedClasses.length > 0) setSelectedClassId(fetchedClasses[0].id);

        // C. Fetch Teachers (Double casting fix applied)
        const usersRef = collection(db, "users");
        const teachersQ = currentSchoolId 
          ? query(usersRef, where("schoolId", "==", currentSchoolId), where("role", "==", "teacher"))
          : query(usersRef, where("role", "==", "teacher"));

        const teachersSnap = await getDocs(teachersQ);
        const fetchedTeachers = teachersSnap.docs.map(d => ({ 
          id: d.id, 
          ...d.data(), 
          uid: d.id 
        } as unknown as ExtendedTeacher));
        setTeachers(fetchedTeachers);

        // D. Fetch Courses
        const coursesQ = query(collection(db, 'artifacts', currentAppId, 'public', 'data', 'courses'));
        const coursesSnap = await getDocs(coursesQ);
        const fetchedCourses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseSubject));
        setCourses(fetchedCourses);

        // E. Fetch Existing Schedules
        const scheduleRef = collection(db, 'artifacts', currentAppId, 'public', 'data', 'schedules');
        const scheduleUnsub = onSnapshot(scheduleRef, (snap) => {
          const fetchedSchedules = snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem));
          const validClassIds = fetchedClasses.map(c => c.id);
          setSchedules(fetchedSchedules.filter(s => validClassIds.includes(s.classId)));
          setLoading(false);
        });

        return () => scheduleUnsub();

      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- 2. DYNAMIC SLOT GENERATOR ---
  // Generate slots based on start time and duration
  useEffect(() => {
    const slots: TimeSlot[] = [];
    let [h, m] = timeConfig.start.split(':').map(Number);
    const [endH, endM] = timeConfig.end.split(':').map(Number);
    
    let currentMinutes = h * 60 + m;
    const endMinutes = endH * 60 + endM;
    let index = 1;

    while (currentMinutes + timeConfig.duration <= endMinutes) {
      const startStr = `${Math.floor(currentMinutes / 60).toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`;
      
      currentMinutes += timeConfig.duration;
      
      const endStr = `${Math.floor(currentMinutes / 60).toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`;
      
      slots.push({ index, start: startStr, end: endStr });
      
      // Istirahat sederhana logic (misal setelah jam ke-4 ada break 30 menit)
      // Untuk MVP kita skip logic istirahat kompleks agar generator tidak crash
      
      index++;
    }
    setGeneratedSlots(slots);
  }, [timeConfig]);


  // --- 3. SMART GENERATOR LOGIC (THE BRAIN) ---
  const handleAutoGenerate = async () => {
    if (classes.length === 0 || courses.length === 0 || teachers.length === 0) {
      alert("Data master belum lengkap. Pastikan Kelas, Guru, dan Mapel sudah ada.");
      return;
    }

    if (!confirm(`PERINGATAN: Jadwal lama untuk ${classes.length} kelas akan DIHAPUS dan dibuat ulang. Lanjutkan?`)) return;

    setIsGenerating(true);
    setGeneratedCount(0);

    // Artificial delay for UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newSchedules: ScheduleItem[] = [];
    
    // Tracking Occupied Slots: "resourceId-day-slotIndex"
    // Resource bisa TeacherId atau ClassId (Kelas gabisa belajar 2 mapel di jam sama)
    const occupiedSlots = new Set<string>(); 

    const isSlotOccupied = (resourceId: string, day: string, slotIdx: number) => {
      return occupiedSlots.has(`${resourceId}-${day}-${slotIdx}`);
    };

    const markOccupied = (resourceId: string, day: string, slotIdx: number) => {
      occupiedSlots.add(`${resourceId}-${day}-${slotIdx}`);
    };

    // --- ALGORITMA ---
    
    for (const cls of classes) {
      // 1. Filter Mapel Relevan untuk Kelas ini
      // Univ: Filter by Semester/Prodi if available in future. Now matching 'gradeLevel'.
      const validCourses = courses.filter(c => 
        !c.level || !cls.gradeLevel || 
        c.level.toLowerCase() === (cls.gradeLevel as string).toLowerCase() ||
        cls.gradeLevel === 'umum'
      );
      
      // Shuffle mapel agar variatif
      const coursesPool = [...validCourses].sort(() => 0.5 - Math.random());

      // Loop Mapel
      for (const course of coursesPool) {
        // Tentukan Durasi (SKS)
        // Jika Univ, cari atribut 'SKS' di additionalInfo. Default 1.
        let durationSlots = 1;
        if (schoolType === 'uni') {
          const sksInfo = course.additionalInfo?.find(i => i.label.toLowerCase() === 'sks');
          if (sksInfo && !isNaN(parseInt(sksInfo.value))) {
            durationSlots = parseInt(sksInfo.value);
          }
        }

        // Cari Guru yang Kompeten
        const qualifiedTeachers = teachers.filter(t => 
          t.teachingSubjects?.some(s => s.id === course.id)
        );

        if (qualifiedTeachers.length === 0) continue; // Skip jika tidak ada guru

        // Mencoba menempatkan Mapel ini ke dalam Grid Waktu
        let placed = false;

        // Shuffle hari agar tidak menumpuk di Senin
        const shuffledDays = [...DAYS].sort(() => 0.5 - Math.random());

        for (const day of shuffledDays) {
          if (placed) break;

          // Cek setiap kemungkinan slot start
          for (let i = 0; i <= generatedSlots.length - durationSlots; i++) {
            const startSlot = generatedSlots[i];
            
            // Cek apakah KELAS free untuk durasi SKS ini
            let classFree = true;
            for (let d = 0; d < durationSlots; d++) {
              if (isSlotOccupied(cls.id, day, startSlot.index + d)) {
                classFree = false;
                break;
              }
            }
            if (!classFree) continue;

            // Cek apakah ada GURU yang free untuk durasi SKS ini
            const availableTeachers = qualifiedTeachers.filter(t => {
              for (let d = 0; d < durationSlots; d++) {
                if (isSlotOccupied(t.uid, day, startSlot.index + d)) return false;
              }
              return true;
            });

            if (availableTeachers.length > 0) {
              // Pick random teacher
              const selectedTeacher = availableTeachers[Math.floor(Math.random() * availableTeachers.length)];
              
              // ASSIGN JADWAL
              // Hitung waktu akhir berdasarkan durasi
              const endSlot = generatedSlots[i + durationSlots - 1];

              const newItem: ScheduleItem = {
                id: `${cls.id}-${day}-${startSlot.index}-${Date.now()}-${Math.random()}`,
                day,
                slot: startSlot.index,
                duration: durationSlots,
                startTime: startSlot.start,
                endTime: endSlot.end,
                subjectId: course.id,
                subjectName: course.name,
                teacherId: selectedTeacher.uid,
                teacherName: selectedTeacher.displayName,
                classId: cls.id,
                className: cls.name,
                room: "Reguler"
              };

              newSchedules.push(newItem);

              // Mark Occupied for Class & Teacher for ALL slots in duration
              for (let d = 0; d < durationSlots; d++) {
                markOccupied(cls.id, day, startSlot.index + d);
                markOccupied(selectedTeacher.uid, day, startSlot.index + d);
              }

              placed = true;
              break; 
            }
          }
        }
      }
    }

    // SAVING LOGIC
    try {
      // 1. Delete old
      const deletePromises = schedules.map(s => 
        deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schedules', s.id))
      );
      await Promise.all(deletePromises);

      // 2. Write new (Batch limit 500 ops)
      const batch = writeBatch(db);
      // Simple chunking not implemented here, assuming < 500 for demo
      newSchedules.forEach(s => {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', s.id);
        batch.set(ref, s);
      });

      await batch.commit();
      setGeneratedCount(newSchedules.length);
    } catch (error) {
      console.error("Batch error", error);
      alert("Gagal menyimpan jadwal.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 4. VIEW HELPERS ---
  const getScheduleForCell = (day: string, slotIdx: number, classId: string) => {
    // Find schedule starting at this slot
    const exact = schedules.find(s => s.day === day && s.slot === slotIdx && s.classId === classId);
    if (exact) return { type: 'start', data: exact };

    // Find if this slot is covered by a multi-slot schedule (SKS)
    const covered = schedules.find(s => 
      s.day === day && 
      s.classId === classId &&
      s.slot < slotIdx && 
      (s.slot + s.duration) > slotIdx
    );
    if (covered) return { type: 'covered', data: covered };

    return null;
  };

  const handleDeleteSchedule = async (id: string) => {
    if(!confirm("Hapus sesi jadwal ini?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schedules', id));
    } catch (e) { console.error(e); }
  }

  // Label Helpers
  const getTeacherLabel = () => schoolType === 'uni' ? 'Dosen' : 'Guru';
  const getSubjectLabel = () => schoolType === 'uni' ? 'Mata Kuliah' : 'Mapel';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p>Menyiapkan Kalender Akademik...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Generator Jadwal {schoolType === 'uni' ? 'Kuliah' : 'Pelajaran'}</h2>
          <p className="text-slate-500 text-sm">
            Menyusun jadwal otomatis dengan dukungan SKS dan deteksi bentrok {getTeacherLabel()}.
          </p>
        </div>
        <div className="flex gap-2">
           <Button 
            onClick={handleAutoGenerate} 
            disabled={isGenerating}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all ${isGenerating ? 'cursor-not-allowed opacity-80' : ''}`}
           >
             {isGenerating ? (
               <>
                 <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                 Sedang Mengkalkulasi...
               </>
             ) : (
               <>
                 <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
                 Auto Generate
               </>
             )}
           </Button>
        </div>
      </div>

      {/* CONFIG BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-6 text-sm text-slate-600 items-center">
         <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-700">Konfigurasi:</span>
         </div>
         <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg">
            <Clock className="w-3 h-3" /> Durasi: <strong>{timeConfig.duration} Menit</strong> /{schoolType === 'uni' ? 'SKS' : 'Sesi'}
         </div>
         <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg">
            <span>Slot Tersedia: <strong>{generatedSlots.length}</strong> /hari</span>
         </div>
         {generatedCount > 0 && !isGenerating && (
            <div className="ml-auto flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg animate-in fade-in">
               <CheckCircle2 className="w-4 h-4" /> {generatedCount} Sesi Terjadwal
            </div>
         )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SIDEBAR: CLASS SELECTOR */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Pilih Kelas
            </h3>
            
            {classes.length === 0 ? (
               <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                 Belum ada kelas.
               </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar flex-1">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex justify-between items-center",
                      selectedClassId === cls.id 
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm" 
                        : "text-slate-600 hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <span className="truncate">{cls.name}</span>
                    {selectedClassId === cls.id && <ArrowRight className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CALENDAR GRID */}
        <div className="lg:col-span-3">
          {selectedClassId === "all" ? (
             <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center justify-center text-center h-[500px] shadow-sm">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                   <Calendar className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Pilih Kelas untuk Melihat Jadwal</h3>
                <p className="text-slate-500 max-w-sm mt-2">Silakan pilih salah satu kelas di panel sebelah kiri untuk melihat dan mengelola jadwal mingguan.</p>
             </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Jadwal: <span className="text-indigo-600 font-extrabold">{classes.find(c => c.id === selectedClassId)?.name}</span>
                 </h3>
                 <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    {schedules.filter(s => s.classId === selectedClassId).length} Sesi Terjadwal
                 </span>
              </div>
              
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm border-collapse min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="p-3 border-b border-r border-slate-200 bg-slate-50 w-24 text-xs text-slate-500 font-bold uppercase tracking-wider text-center sticky left-0 z-10">
                        Waktu
                      </th>
                      {DAYS.map(day => (
                        <th key={day} className="p-3 border-b border-slate-200 bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wider text-center min-w-[160px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generatedSlots.map((slotObj) => (
                      <tr key={slotObj.index} className="hover:bg-slate-50/30 transition-colors">
                        {/* Time Column */}
                        <td className="p-2 border-b border-r border-slate-200 text-center bg-white sticky left-0 z-10">
                           <div className="font-bold text-slate-800 text-xs">{slotObj.start}</div>
                           <div className="text-[10px] text-slate-400">{slotObj.end}</div>
                        </td>

                        {/* Days Columns */}
                        {DAYS.map(day => {
                          const scheduleInfo = getScheduleForCell(day, slotObj.index, selectedClassId);
                          
                          // Rendering Logic for SKS (Rowspan simulation)
                          if (scheduleInfo?.type === 'covered') {
                             return null; // Don't render cell, handled by rowspan/height of the 'start' cell
                          }

                          if (scheduleInfo?.type === 'start') {
                             const item = scheduleInfo.data;
                             const rowSpan = item.duration; // SKS determines height
                             
                             return (
                                <td key={day} rowSpan={rowSpan} className="p-1 border-b border-slate-100 border-r last:border-r-0 relative align-top">
                                   <div className="h-full w-full bg-indigo-50 border border-indigo-200 rounded-lg p-2 flex flex-col justify-between hover:shadow-md hover:border-indigo-400 transition-all group relative min-h-[60px]">
                                      <div>
                                         <div className="font-bold text-indigo-800 text-xs leading-tight mb-1 line-clamp-2">
                                            {item.subjectName}
                                         </div>
                                         <div className="text-[10px] text-indigo-600 flex items-center gap-1 mt-1">
                                            <Users size={10} /> 
                                            <span className="truncate max-w-[100px]">{item.teacherName}</span>
                                         </div>
                                      </div>
                                      
                                      {/* Duration Badge if > 1 SKS */}
                                      {item.duration > 1 && (
                                        <div className="absolute bottom-1 right-1 text-[9px] bg-indigo-200 text-indigo-800 px-1 rounded">
                                          {item.duration} SKS
                                        </div>
                                      )}

                                      <button 
                                         onClick={() => handleDeleteSchedule(item.id)}
                                         className="absolute top-1 right-1 p-1 text-indigo-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                         title="Hapus Sesi"
                                      >
                                         <Trash2 size={12}/>
                                      </button>
                                   </div>
                                </td>
                             );
                          }

                          return (
                            <td key={day} className="p-1 border-b border-slate-100 border-r last:border-r-0 h-16">
                               <div className="h-full w-full border border-dashed border-slate-50 rounded-lg"></div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}