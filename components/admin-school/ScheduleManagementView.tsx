"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  User, 
  BookOpen, 
  Loader2,
  MapPin,
  Wand2,
  Save,
  X,
  Settings
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  writeBatch,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

// --- Tipe Data ---
interface ScheduleItem {
  id: string;
  subject: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
  type?: "class" | "break"; // Pembeda mapel atau istirahat
}

interface TeacherOption {
  uid: string;
  displayName: string;
}

interface ClassOption {
  id: string;
  name: string;
  category: string; // Mapel dari kategori kelas
  teacherId: string; // Untuk cek bentrok
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function ScheduleManagementView() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Senin");
  
  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data Reference
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  // --- States untuk Auto Generator ---
  const [autoConfig, setAutoConfig] = useState({
    startHour: "07:00",
    endHour: "14:00",
    slotDuration: 45, // menit
    days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    breaks: [{ name: "Istirahat & Shalat", start: "12:00", end: "13:00" }]
  });
  const [generatedPreview, setGeneratedPreview] = useState<Omit<ScheduleItem, 'id'>[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Form State Manual
  const [formData, setFormData] = useState({
    subject: "",
    classId: "",
    teacherId: "",
    day: "Senin",
    startTime: "07:00",
    endTime: "08:30",
    room: ""
  });

  // 1. Fetch Data Awal
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // A. Fetch Jadwal
      const schedQuery = query(collection(db, "schedules"), orderBy("startTime", "asc"));
      const schedSnap = await getDocs(schedQuery);
      const fetchedSchedules: ScheduleItem[] = [];
      schedSnap.forEach((doc) => {
        fetchedSchedules.push({ id: doc.id, ...doc.data() } as ScheduleItem);
      });
      setSchedules(fetchedSchedules);

      // B. Fetch Guru
      const teacherQuery = query(collection(db, "users"), where("role", "==", "teacher"));
      const teacherSnap = await getDocs(teacherQuery);
      const fetchedTeachers = teacherSnap.docs.map(doc => ({
        uid: doc.id,
        displayName: doc.data().displayName || "Guru Tanpa Nama"
      }));
      setTeachers(fetchedTeachers);

      // C. Fetch Kelas
      const classQuery = query(collection(db, "classrooms"));
      const classSnap = await getDocs(classQuery);
      const fetchedClasses = classSnap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name || d.className || "Kelas Tanpa Nama",
          category: d.category || "Umum",
          teacherId: d.teacherId
        };
      });
      setClasses(fetchedClasses);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Helper Time Functions
  const addMinutes = (time: string, mins: number) => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0);
    date.setMinutes(date.getMinutes() + mins);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    return (start1 < end2 && start2 < end1);
  };

  // 3. LOGIC GENERATOR OTOMATIS
  const handleGenerate = () => {
    const newSchedules: Omit<ScheduleItem, 'id'>[] = [];
    const usedSlots: Record<string, string[]> = {}; // Key: teacherId_day, Value: Array of "start-end" strings

    // Helper: Cek ketersediaan guru
    const isTeacherAvailable = (teacherId: string, day: string, start: string, end: string) => {
      const key = `${teacherId}_${day}`;
      if (!usedSlots[key]) return true;
      for (const slot of usedSlots[key]) {
        const [s, e] = slot.split('-');
        if (isTimeOverlap(start, end, s, e)) return false;
      }
      return true;
    };

    // Helper: Mark slot used
    const markSlotUsed = (teacherId: string, day: string, start: string, end: string) => {
      const key = `${teacherId}_${day}`;
      if (!usedSlots[key]) usedSlots[key] = [];
      usedSlots[key].push(`${start}-${end}`);
    };

    // A. Generate Slot Waktu per Hari
    autoConfig.days.forEach(day => {
      let currentTime = autoConfig.startHour;
      
      // Ambil kelas secara acak/berurutan untuk didistribusikan
      // Clone array kelas agar bisa dimanipulasi
      let remainingClasses = [...classes];

      while (currentTime < autoConfig.endHour && remainingClasses.length > 0) {
        const nextTime = addMinutes(currentTime, autoConfig.slotDuration);
        
        // Cek apakah slot ini tabrakan dengan Istirahat
        const breakTime = autoConfig.breaks.find(b => isTimeOverlap(currentTime, nextTime, b.start, b.end));
        
        if (breakTime) {
          // Skip ke akhir istirahat
          // (Opsional: Masukkan item istirahat ke jadwal visual)
          currentTime = breakTime.end;
          continue;
        }

        if (nextTime > autoConfig.endHour) break;

        // Cari kelas yang gurunya available di jam ini
        const classIndex = remainingClasses.findIndex(cls => 
          isTeacherAvailable(cls.teacherId, day, currentTime, nextTime)
        );

        if (classIndex !== -1) {
          const cls = remainingClasses[classIndex];
          const teacher = teachers.find(t => t.uid === cls.teacherId);
          
          newSchedules.push({
            subject: cls.category,
            classId: cls.id,
            className: cls.name,
            teacherId: cls.teacherId,
            teacherName: teacher?.displayName || "Guru",
            day: day,
            startTime: currentTime,
            endTime: nextTime,
            type: "class"
          });

          markSlotUsed(cls.teacherId, day, currentTime, nextTime);
          
          // Hapus kelas dari antrian (asumsi 1 kelas 1x pertemuan seminggu untuk demo ini)
          // Di sistem nyata, logic ini lebih kompleks (SKS, beban kerja, dll)
          remainingClasses.splice(classIndex, 1);
        }

        currentTime = nextTime;
      }
    });

    setGeneratedPreview(newSchedules);
    setIsPreviewMode(true);
  };

  const handleSaveGenerated = async () => {
    setSubmitting(true);
    try {
      const batch = writeBatch(db);
      generatedPreview.forEach(item => {
        const ref = doc(collection(db, "schedules"));
        batch.set(ref, { ...item, createdAt: serverTimestamp() });
      });
      await batch.commit();
      
      alert(`Berhasil menyimpan ${generatedPreview.length} jadwal!`);
      setIsAutoModalOpen(false);
      setIsPreviewMode(false);
      fetchData(); // Refresh
    } catch (error) {
      console.error("Gagal save batch:", error);
      alert("Gagal menyimpan jadwal otomatis.");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Handle Submit Manual
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.classId || !formData.teacherId) {
      alert("Mohon lengkapi data wajib.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedClass = classes.find(c => c.id === formData.classId);
      const selectedTeacher = teachers.find(t => t.uid === formData.teacherId);

      const newSchedule = {
        ...formData,
        className: selectedClass?.name || "Unknown Class",
        teacherName: selectedTeacher?.displayName || "Unknown Teacher",
        createdAt: serverTimestamp(),
        type: "class"
      };

      await addDoc(collection(db, "schedules"), newSchedule);
      
      setIsManualModalOpen(false);
      setFormData({
        subject: "",
        classId: "",
        teacherId: "",
        day: selectedDay,
        startTime: "07:00",
        endTime: "08:30",
        room: ""
      });
      fetchData();
      alert("Jadwal manual berhasil ditambahkan!");

    } catch (error) {
      console.error("Gagal tambah jadwal:", error);
      alert("Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus jadwal ini?")) return;
    try {
      await deleteDoc(doc(db, "schedules", id));
      setSchedules(schedules.filter(s => s.id !== id));
    } catch (error) {
      alert("Gagal menghapus jadwal.");
    }
  };

  const filteredSchedules = schedules.filter(s => s.day === selectedDay);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Jadwal</h2>
          <p className="text-slate-500 text-sm">Atur jadwal pelajaran manual atau gunakan generator otomatis.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAutoModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-purple-200 transition-colors flex items-center gap-2"
          >
            <Wand2 size={16} /> Generate Otomatis
          </button>
          <button 
            onClick={() => setIsManualModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Tambah Manual
          </button>
        </div>
      </div>

      {/* Day Filters */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1 custom-scrollbar">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={cn(
              "px-6 py-2 text-sm font-bold transition-colors whitespace-nowrap rounded-t-lg border-b-2",
              selectedDay === day 
                ? "text-indigo-600 border-indigo-600 bg-indigo-50/50" 
                : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Belum ada jadwal untuk hari {selectedDay}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <Clock size={12} /> {item.startTime} - {item.endTime}
                  </span>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h3 className="font-bold text-slate-800 text-lg mb-1">{item.subject}</h3>
                
                <div className="space-y-1 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-slate-400" />
                    <span>{item.className}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    <span>{item.teacherName}</span>
                  </div>
                  {item.room && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      <span>{item.room}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL MANUAL --- */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Input Jadwal Manual</h3>
            <form onSubmit={handleSubmitManual} className="space-y-4">
              {/* Form Manual yang sama seperti sebelumnya... */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input 
                  type="text" required placeholder="Contoh: Matematika"
                  className="w-full px-4 py-2 border rounded-xl outline-none"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Kelas</label>
                  <select 
                    required className="w-full px-4 py-2 border rounded-xl bg-white outline-none"
                    value={formData.classId}
                    onChange={e => setFormData({...formData, classId: e.target.value})}
                  >
                    <option value="">Pilih Kelas</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Guru</label>
                  <select 
                    required className="w-full px-4 py-2 border rounded-xl bg-white outline-none"
                    value={formData.teacherId}
                    onChange={e => setFormData({...formData, teacherId: e.target.value})}
                  >
                    <option value="">Pilih Guru</option>
                    {teachers.map(t => <option key={t.uid} value={t.uid}>{t.displayName}</option>)}
                  </select>
                </div>
              </div>
              {/* Waktu & Ruangan */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Hari</label>
                  <select 
                    className="w-full px-4 py-2 border rounded-xl bg-white outline-none"
                    value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})}
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mulai</label>
                  <input type="time" required className="w-full px-4 py-2 border rounded-xl outline-none"
                    value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Selesai</label>
                  <input type="time" required className="w-full px-4 py-2 border rounded-xl outline-none"
                    value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ruangan</label>
                <input type="text" placeholder="Lab 1" className="w-full px-4 py-2 border rounded-xl outline-none"
                  value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} />
              </div>
              
              <div className="flex gap-3 pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsManualModalOpen(false)} className="flex-1 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL AUTO GENERATOR --- */}
      {isAutoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Wand2 className="text-purple-600" /> Generator Jadwal Otomatis
            </h3>

            {!isPreviewMode ? (
              // STEP 1: CONFIGURATION
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-sm text-purple-800">
                  Fitur ini akan mendistribusikan semua kelas yang tersedia ke dalam slot waktu kosong secara otomatis, menghindari bentrok jadwal guru.
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Jam Masuk</label>
                    <input type="time" value={autoConfig.startHour} 
                      onChange={e => setAutoConfig({...autoConfig, startHour: e.target.value})}
                      className="w-full px-4 py-2 border rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Jam Pulang</label>
                    <input type="time" value={autoConfig.endHour} 
                      onChange={e => setAutoConfig({...autoConfig, endHour: e.target.value})}
                      className="w-full px-4 py-2 border rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Durasi per Sesi (Menit)</label>
                    <input type="number" value={autoConfig.slotDuration} 
                      onChange={e => setAutoConfig({...autoConfig, slotDuration: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Hari Sekolah</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(d => (
                        <button key={d} type="button"
                          onClick={() => {
                            const newDays = autoConfig.days.includes(d) 
                              ? autoConfig.days.filter(day => day !== d)
                              : [...autoConfig.days, d];
                            setAutoConfig({...autoConfig, days: newDays});
                          }}
                          className={cn(
                            "px-3 py-1 text-xs rounded-full border transition-all",
                            autoConfig.days.includes(d) 
                              ? "bg-purple-600 text-white border-purple-600" 
                              : "bg-white text-slate-500 border-slate-200"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Jam Istirahat / Shalat</label>
                  {autoConfig.breaks.map((b, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input type="text" value={b.name} className="flex-1 px-3 py-2 border rounded-lg text-sm bg-slate-50" disabled />
                      <input type="time" value={b.start} 
                        onChange={e => {
                          const newBreaks = [...autoConfig.breaks];
                          newBreaks[idx].start = e.target.value;
                          setAutoConfig({...autoConfig, breaks: newBreaks});
                        }}
                        className="w-24 px-3 py-2 border rounded-lg text-sm outline-none" />
                      <span className="self-center">-</span>
                      <input type="time" value={b.end} 
                        onChange={e => {
                          const newBreaks = [...autoConfig.breaks];
                          newBreaks[idx].end = e.target.value;
                          setAutoConfig({...autoConfig, breaks: newBreaks});
                        }}
                        className="w-24 px-3 py-2 border rounded-lg text-sm outline-none" />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button onClick={() => setIsAutoModalOpen(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">Batal</button>
                  <button onClick={handleGenerate} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200">
                    Mulai Generate
                  </button>
                </div>
              </div>
            ) : (
              // STEP 2: PREVIEW RESULT
              <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-sm text-emerald-800 flex justify-between items-center">
                  <span>Berhasil menyusun <strong>{generatedPreview.length}</strong> jadwal pelajaran.</span>
                  <button onClick={() => setIsPreviewMode(false)} className="text-xs underline hover:text-emerald-900">Ubah Konfigurasi</button>
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-xl divide-y divide-slate-100">
                  {generatedPreview.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">Tidak ada kelas yang bisa dijadwalkan dengan konfigurasi ini.</div>
                  ) : (
                    generatedPreview.map((item, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50 text-sm">
                        <div>
                          <span className="font-bold text-slate-800">{item.day}, {item.startTime}-{item.endTime}</span>
                          <div className="text-slate-500 text-xs">{item.className} • {item.subject}</div>
                        </div>
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">{item.teacherName}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button onClick={() => setIsAutoModalOpen(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">Batal</button>
                  <button onClick={handleSaveGenerated} disabled={submitting || generatedPreview.length === 0} 
                    className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex justify-center items-center gap-2">
                    {submitting ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
                    Simpan ke Database
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}