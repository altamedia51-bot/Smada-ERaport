import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export function NonAcademicLayout({ 
  title, 
  children,
  onSave,
  onClassChange,
  students,
  selectedClass
}: { 
  title: string, 
  children: React.ReactNode, 
  onSave: () => void,
  onClassChange: (c: string) => void,
  students: any[],
  selectedClass: string
}) {
  const [classesList, setClassesList] = useState<any[]>([]);

  useEffect(() => {
    const qClasses = query(collection(db, 'classes'));
    const unsub = onSnapshot(qClasses, snapshot => {
      const cls: any[] = [];
      snapshot.forEach(doc => cls.push({ id: doc.id, ...doc.data() }));
      cls.sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
      setClassesList(cls);
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">Pilih kelas untuk mengelola data siswa</p>
        </div>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Kelas</label>
            <select 
              value={selectedClass} 
              onChange={e => onClassChange(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm min-w-[200px]"
            >
              <option value="">-- Pilih Kelas --</option>
              {classesList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={onSave}
            disabled={!selectedClass}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            Simpan Data
          </button>
        </div>
      </div>

      {selectedClass ? (
        students.length > 0 ? children : (
          <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg bg-slate-50">
            Belum ada data siswa di kelas ini.
          </div>
        )
      ) : (
        <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg bg-slate-50">
          Silakan pilih kelas terlebih dahulu.
        </div>
      )}
    </div>
  );
}

export function NotificationResult({ saveStatus }: { saveStatus: { type: 'success' | 'error', message: string } | null }) {
  if (!saveStatus) return null;
  return (
    <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 text-sm font-medium ${saveStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
      {saveStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {saveStatus.message}
    </div>
  );
}

// Helpers
export const loadStudents = (classId: string, setStudents: (s: any[]) => void) => {
  const q = query(collection(db, 'students'), where('classId', '==', classId));
  return onSnapshot(q, snapshot => {
    try {
      const s: any[] = [];
      snapshot.forEach(doc => s.push({ id: doc.id, ...doc.data() }));
      // sort students by name
      s.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      setStudents(s);
    } catch (err) {
      console.error("Error loading students:", err);
      setStudents([]);
    }
  });
};

export const useActiveYear = () => {
  const [activeYear, setActiveYear] = useState('');
  const [activeSemester, setActiveSemester] = useState('');
  useEffect(() => {
    const q = query(collection(db, 'academic_years'), where('isActive', '==', true));
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setActiveYear(snap.docs[0].id);
        setActiveSemester(data.semester);
      }
    });
    return () => unsub();
  }, []);
  return { activeYear, activeSemester };
};

export function InputKehadiran() {
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<Record<string, { sick: number, leave: number, absent: number }>>({});
  const { activeYear } = useActiveYear();
  const [saveStatus, setSaveStatus] = useState<{type: 'success'|'error', message: string} | null>(null);

  useEffect(() => {
    if (!selectedClass) { setStudents([]); return; }
    const unsub = loadStudents(selectedClass, setStudents);
    return () => unsub();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !activeYear) return;
    const load = async () => {
      try {
        const q = query(collection(db, 'academic_attendances'), where('classId', '==', selectedClass), where('academicYearId', '==', activeYear));
        const snap = await getDocs(q);
        const data: any = {};
        snap.forEach(doc => {
          const d = doc.data();
          data[d.studentId] = { sick: d.sick || 0, leave: d.leave || 0, absent: d.absent || 0 };
        });
        setAttendances(data);
      } catch (err) {
        console.error("Error loading attendances", err);
      }
    };
    load();
  }, [selectedClass, activeYear]);

  const handleSave = async () => {
    if (!activeYear) {
       setSaveStatus({ type: 'error', message: 'Tahun ajaran aktif belum diatur.' });
       return;
    }
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        const docRef = doc(db, 'academic_attendances', `${s.id}_${activeYear}`);
        const att = attendances[s.id] || { sick: 0, leave: 0, absent: 0 };
        batch.set(docRef, { ...att, studentId: s.id, classId: selectedClass, academicYearId: activeYear }, { merge: true });
      });
      await batch.commit();
      setSaveStatus({ type: 'success', message: 'Data kehadiran berhasil disimpan.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e: any) {
      setSaveStatus({ type: 'error', message: e.message });
    }
  };

  const updateAtt = (studentId: string, field: 'sick'|'leave'|'absent', val: string) => {
    setAttendances(p => ({ ...p, [studentId]: { ...(p[studentId] || {sick: 0, leave: 0, absent: 0}), [field]: Number(val) || 0 } }));
  };

  return (
    <div>
      <NotificationResult saveStatus={saveStatus} />
      <NonAcademicLayout title="Input Kehadiran" onSave={handleSave} onClassChange={setSelectedClass} students={students} selectedClass={selectedClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 border border-slate-200">
            <thead className="text-xs text-center text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 border-r border-slate-200 w-12" rowSpan={2}>No</th>
                <th className="px-4 py-3 border-r border-slate-200 text-left" rowSpan={2}>Nama Siswa</th>
                <th className="px-4 py-2 border-b border-slate-200" colSpan={3}>Kehadiran (Hari)</th>
              </tr>
              <tr>
                <th className="px-2 py-2 border-r border-slate-200">Sakit</th>
                <th className="px-2 py-2 border-r border-slate-200">Izin</th>
                <th className="px-2 py-2 border-r border-slate-200">Alpha</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 border-r border-slate-100 text-center">{idx + 1}</td>
                  <td className="px-4 py-2 border-r border-slate-100 font-medium text-slate-900">{s.name}</td>
                  <td className="px-2 py-2 border-r border-slate-100 text-center">
                    <input type="number" min="0" value={attendances[s.id]?.sick || 0} onChange={e => updateAtt(s.id, 'sick', e.target.value)} className="w-16 p-1 border border-slate-200 rounded text-center focus:ring-2 focus:ring-blue-500" />
                  </td>
                  <td className="px-2 py-2 border-r border-slate-100 text-center">
                    <input type="number" min="0" value={attendances[s.id]?.leave || 0} onChange={e => updateAtt(s.id, 'leave', e.target.value)} className="w-16 p-1 border border-slate-200 rounded text-center focus:ring-2 focus:ring-blue-500" />
                  </td>
                  <td className="px-2 py-2 border-slate-100 text-center">
                    <input type="number" min="0" value={attendances[s.id]?.absent || 0} onChange={e => updateAtt(s.id, 'absent', e.target.value)} className="w-16 p-1 border border-slate-200 rounded text-center focus:ring-2 focus:ring-blue-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NonAcademicLayout>
    </div>
  );
}

export function InputEkskul() {
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [ekskuls, setEkskuls] = useState<any[]>([]);
  const [studentValues, setStudentValues] = useState<Record<string, Array<{ekskulId: string, nilai: string, deskripsi: string}>>>({});
  const { activeYear } = useActiveYear();
  const [saveStatus, setSaveStatus] = useState<{type: 'success'|'error', message: string} | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'extracurriculars')), snap => {
      const data: any[] = [];
      snap.forEach(d => data.push({id: d.id, ...d.data()}));
      setEkskuls(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => { if (!selectedClass) { setStudents([]); return; } return loadStudents(selectedClass, setStudents); }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !activeYear) return;
    const load = async () => {
      try {
        const q = query(collection(db, 'academic_extracurriculars'), where('classId', '==', selectedClass), where('academicYearId', '==', activeYear));
        const snap = await getDocs(q);
        const data: any = {};
        snap.forEach(doc => { const d = doc.data(); data[d.studentId] = d.activities || []; });
        setStudentValues(data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [selectedClass, activeYear]);

  const handleSave = async () => {
    if (!activeYear) return setSaveStatus({ type: 'error', message: 'Tahun ajaran tidak ada.' });
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        const docRef = doc(db, 'academic_extracurriculars', `${s.id}_${activeYear}`);
        batch.set(docRef, { studentId: s.id, classId: selectedClass, academicYearId: activeYear, activities: studentValues[s.id] || [] }, { merge: true });
      });
      await batch.commit();
      setSaveStatus({ type: 'success', message: 'Data Ekskul berhasil disimpan.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e: any) { setSaveStatus({ type: 'error', message: e.message }); }
  };

  const addActivity = (studentId: string) => {
    setStudentValues(p => {
      const current = p[studentId] || [];
      return { ...p, [studentId]: [...current, { ekskulId: '', nilai: 'A', deskripsi: '' }] };
    });
  };

  const updateActivity = (studentId: string, index: number, field: string, val: string) => {
    setStudentValues(p => {
      const current = [...(p[studentId] || [])];
      current[index] = { ...current[index], [field]: val };
      return { ...p, [studentId]: current };
    });
  };

  const removeActivity = (studentId: string, index: number) => {
    setStudentValues(p => {
      const current = [...(p[studentId] || [])];
      current.splice(index, 1);
      return { ...p, [studentId]: current };
    });
  };

  return (
    <div>
      <NotificationResult saveStatus={saveStatus} />
      <NonAcademicLayout title="Nilai Ekstrakurikuler" onSave={handleSave} onClassChange={setSelectedClass} students={students} selectedClass={selectedClass}>
        <div className="space-y-6">
          {students.map((s, idx) => {
            const acts = studentValues[s.id] || [];
            return (
              <div key={s.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                  <h4 className="font-semibold text-slate-800">{idx + 1}. {s.name}</h4>
                  <button onClick={() => addActivity(s.id)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors">
                    + Tambah Ekskul
                  </button>
                </div>
                {acts.length === 0 ? <p className="text-xs text-slate-500 italic">Belum ada ekstrakurikuler yang diikuti.</p> : (
                  <div className="space-y-3">
                    {acts.map((act, actIdx) => (
                      <div key={actIdx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 border border-slate-200 rounded">
                        <select value={act.ekskulId} onChange={e => updateActivity(s.id, actIdx, 'ekskulId', e.target.value)} className="text-sm p-2 border rounded flex-1">
                          <option value="">-- Pilih Ekstrakurikuler --</option>
                          {ekskuls.map(ek => <option key={ek.id} value={ek.id}>{ek.name}</option>)}
                        </select>
                        <select value={act.nilai} onChange={e => updateActivity(s.id, actIdx, 'nilai', e.target.value)} className="text-sm p-2 border rounded w-24">
                          <option value="A">Sangat Baik (A)</option>
                          <option value="B">Baik (B)</option>
                          <option value="C">Cukup (C)</option>
                          <option value="K">Kurang (K)</option>
                        </select>
                        <input type="text" placeholder="Deskripsi/Catatan (opsional)" value={act.deskripsi} onChange={e => updateActivity(s.id, actIdx, 'deskripsi', e.target.value)} className="text-sm p-2 border rounded flex-1" />
                        <button onClick={() => removeActivity(s.id, actIdx)} className="text-red-500 hover:text-red-700 ml-auto p-2" title="Hapus"><AlertCircle size={16}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </NonAcademicLayout>
    </div>
  );
}

export function InputKokurikuler() {
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [kokurikulers, setKokurikulers] = useState<any[]>([]);
  const [studentValues, setStudentValues] = useState<Record<string, Array<{kokurId: string, deskripsi: string}>>>({});
  const { activeYear } = useActiveYear();
  const [saveStatus, setSaveStatus] = useState<{type: 'success'|'error', message: string} | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'cocurriculars')), snap => {
      const data: any[] = [];
      snap.forEach(d => data.push({id: d.id, ...d.data()}));
      setKokurikulers(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => { if (!selectedClass) { setStudents([]); return; } return loadStudents(selectedClass, setStudents); }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !activeYear) return;
    const load = async () => {
      const q = query(collection(db, 'academic_cocurriculars'), where('classId', '==', selectedClass), where('academicYearId', '==', activeYear));
      const snap = await getDocs(q);
      const data: any = {};
      snap.forEach(doc => { const d = doc.data(); data[d.studentId] = d.activities || []; });
      setStudentValues(data);
    };
    load();
  }, [selectedClass, activeYear]);

  const handleSave = async () => {
    if (!activeYear) return setSaveStatus({ type: 'error', message: 'Tahun ajaran tidak ada.' });
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        const docRef = doc(db, 'academic_cocurriculars', `${s.id}_${activeYear}`);
        batch.set(docRef, { studentId: s.id, classId: selectedClass, academicYearId: activeYear, activities: studentValues[s.id] || [] }, { merge: true });
      });
      await batch.commit();
      setSaveStatus({ type: 'success', message: 'Data Kokurikuler berhasil disimpan.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e: any) { setSaveStatus({ type: 'error', message: e.message }); }
  };

  const addActivity = (studentId: string) => {
    setStudentValues(p => {
      const current = p[studentId] || [];
      return { ...p, [studentId]: [...current, { kokurId: '', deskripsi: '' }] };
    });
  };

  const updateActivity = (studentId: string, index: number, field: string, val: string) => {
    setStudentValues(p => {
      const current = [...(p[studentId] || [])];
      current[index] = { ...current[index], [field]: val };
      return { ...p, [studentId]: current };
    });
  };

  const removeActivity = (studentId: string, index: number) => {
    setStudentValues(p => {
      const current = [...(p[studentId] || [])];
      current.splice(index, 1);
      return { ...p, [studentId]: current };
    });
  };

  return (
    <div>
      <NotificationResult saveStatus={saveStatus} />
      <NonAcademicLayout title="Nilai Kokurikuler" onSave={handleSave} onClassChange={setSelectedClass} students={students} selectedClass={selectedClass}>
        <div className="space-y-6">
          {students.map((s, idx) => {
            const acts = studentValues[s.id] || [];
            return (
              <div key={s.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                  <h4 className="font-semibold text-slate-800">{idx + 1}. {s.name}</h4>
                  <button onClick={() => addActivity(s.id)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors">
                    + Tambah Kokurikuler
                  </button>
                </div>
                {acts.length === 0 ? <p className="text-xs text-slate-500 italic">Belum ada kokurikuler yang diikuti.</p> : (
                  <div className="space-y-3">
                    {acts.map((act, actIdx) => (
                      <div key={actIdx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 border border-slate-200 rounded">
                        <select value={act.kokurId} onChange={e => updateActivity(s.id, actIdx, 'kokurId', e.target.value)} className="text-sm p-2 border rounded w-1/3">
                          <option value="">-- Pilih Kokurikuler/P5 --</option>
                          {kokurikulers.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                        </select>
                        <textarea placeholder="Deskripsi/Catatan (opsional)" value={act.deskripsi} onChange={e => updateActivity(s.id, actIdx, 'deskripsi', e.target.value)} className="text-sm p-2 border rounded flex-1 h-10" />
                        <button onClick={() => removeActivity(s.id, actIdx)} className="text-red-500 hover:text-red-700 ml-auto p-2" title="Hapus"><AlertCircle size={16}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </NonAcademicLayout>
    </div>
  );
}

export function InputPrestasi() {
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [studentValues, setStudentValues] = useState<Record<string, Array<{jenis: string, nama: string, deskripsi: string}>>>({});
  const { activeYear } = useActiveYear();
  const [saveStatus, setSaveStatus] = useState<{type: 'success'|'error', message: string} | null>(null);

  useEffect(() => { if (!selectedClass) { setStudents([]); return; } return loadStudents(selectedClass, setStudents); }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !activeYear) return;
    const load = async () => {
      const q = query(collection(db, 'academic_achievements'), where('classId', '==', selectedClass), where('academicYearId', '==', activeYear));
      const snap = await getDocs(q);
      const data: any = {};
      snap.forEach(doc => { const d = doc.data(); data[d.studentId] = d.activities || []; });
      setStudentValues(data);
    };
    load();
  }, [selectedClass, activeYear]);

  const handleSave = async () => {
    if (!activeYear) return setSaveStatus({ type: 'error', message: 'Tahun ajaran tidak ada.' });
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        const docRef = doc(db, 'academic_achievements', `${s.id}_${activeYear}`);
        batch.set(docRef, { studentId: s.id, classId: selectedClass, academicYearId: activeYear, activities: studentValues[s.id] || [] }, { merge: true });
      });
      await batch.commit();
      setSaveStatus({ type: 'success', message: 'Data Prestasi berhasil disimpan.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e: any) { setSaveStatus({ type: 'error', message: e.message }); }
  };

  const addActivity = (studentId: string) => {
    setStudentValues(p => {
      const current = p[studentId] || [];
      return { ...p, [studentId]: [...current, { jenis: 'Akademik', nama: '', deskripsi: '' }] };
    });
  };

  const updateActivity = (studentId: string, index: number, field: string, val: string) => {
    setStudentValues(p => {
      const current = [...(p[studentId] || [])];
      current[index] = { ...current[index], [field]: val };
      return { ...p, [studentId]: current };
    });
  };

  const removeActivity = (studentId: string, index: number) => {
    setStudentValues(p => {
      const current = [...(p[studentId] || [])];
      current.splice(index, 1);
      return { ...p, [studentId]: current };
    });
  };

  return (
    <div>
      <NotificationResult saveStatus={saveStatus} />
      <NonAcademicLayout title="Prestasi Siswa" onSave={handleSave} onClassChange={setSelectedClass} students={students} selectedClass={selectedClass}>
        <div className="space-y-6">
          {students.map((s, idx) => {
            const acts = studentValues[s.id] || [];
            return (
              <div key={s.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                  <h4 className="font-semibold text-slate-800">{idx + 1}. {s.name}</h4>
                  <button onClick={() => addActivity(s.id)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors">
                    + Tambah Prestasi
                  </button>
                </div>
                {acts.length === 0 ? <p className="text-xs text-slate-500 italic">Belum ada prestasi yang dicatat.</p> : (
                  <div className="space-y-3">
                    {acts.map((act, actIdx) => (
                      <div key={actIdx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 border border-slate-200 rounded">
                        <select value={act.jenis} onChange={e => updateActivity(s.id, actIdx, 'jenis', e.target.value)} className="text-sm p-2 border rounded w-32">
                          <option value="Akademik">Akademik</option>
                          <option value="Non Akademik">Non Akademik</option>
                        </select>
                        <input type="text" placeholder="Nama Prestasi" value={act.nama} onChange={e => updateActivity(s.id, actIdx, 'nama', e.target.value)} className="text-sm p-2 border rounded flex-1" />
                        <input type="text" placeholder="Keterangan (juara, tingkat, dll)" value={act.deskripsi} onChange={e => updateActivity(s.id, actIdx, 'deskripsi', e.target.value)} className="text-sm p-2 border rounded flex-1" />
                        <button onClick={() => removeActivity(s.id, actIdx)} className="text-red-500 hover:text-red-700 ml-auto p-2" title="Hapus"><AlertCircle size={16}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </NonAcademicLayout>
    </div>
  );
}

export function InputMutasi() {
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [studentValues, setStudentValues] = useState<Record<string, { tanggal: string, jenis: string, keterangan: string }>>({});
  const { activeYear } = useActiveYear();
  const [saveStatus, setSaveStatus] = useState<{type: 'success'|'error', message: string} | null>(null);

  useEffect(() => { if (!selectedClass) { setStudents([]); return; } return loadStudents(selectedClass, setStudents); }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !activeYear) return;
    const load = async () => {
      const q = query(collection(db, 'academic_mutations'), where('classId', '==', selectedClass), where('academicYearId', '==', activeYear));
      const snap = await getDocs(q);
      const data: any = {};
      snap.forEach(doc => { const d = doc.data(); data[d.studentId] = { tanggal: d.tanggal || '', jenis: d.jenis || 'Masuk', keterangan: d.keterangan || '' }; });
      setStudentValues(data);
    };
    load();
  }, [selectedClass, activeYear]);

  const handleSave = async () => {
    if (!activeYear) return setSaveStatus({ type: 'error', message: 'Tahun ajaran tidak ada.' });
    try {
      const batch = writeBatch(db);
      Object.keys(studentValues).forEach(studentId => {
        const docRef = doc(db, 'academic_mutations', `${studentId}_${activeYear}`);
        batch.set(docRef, { studentId, classId: selectedClass, academicYearId: activeYear, ...studentValues[studentId] }, { merge: true });
      });
      await batch.commit();
      setSaveStatus({ type: 'success', message: 'Data Mutasi berhasil disimpan.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e: any) { setSaveStatus({ type: 'error', message: e.message }); }
  };

  const updateVal = (studentId: string, field: string, val: string) => {
    setStudentValues(p => ({ ...p, [studentId]: { ...(p[studentId] || {tanggal: '', jenis: 'Masuk', keterangan: ''}), [field]: val } }));
  };

  return (
    <div>
      <NotificationResult saveStatus={saveStatus} />
      <NonAcademicLayout title="Catatan Mutasi Siswa" onSave={handleSave} onClassChange={setSelectedClass} students={students} selectedClass={selectedClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 border border-slate-200">
            <thead className="text-xs text-center text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 border-r border-slate-200 w-12">No</th>
                <th className="px-4 py-3 border-r border-slate-200 text-left">Nama Siswa</th>
                <th className="px-4 py-3 border-r border-slate-200 text-left">Jenis Mutasi</th>
                <th className="px-4 py-3 border-r border-slate-200 text-left">Tanggal</th>
                <th className="px-4 py-3 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 border-r border-slate-100 text-center">{idx + 1}</td>
                  <td className="px-4 py-2 border-r border-slate-100 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-2 border-r border-slate-100">
                    <select value={studentValues[s.id]?.jenis || 'Masuk'} onChange={e => updateVal(s.id, 'jenis', e.target.value)} className="w-full p-2 border border-slate-200 rounded">
                      <option value="Masuk">Masuk</option>
                      <option value="Keluar">Keluar</option>
                      <option value="-">- (Tidak Mutasi)</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border-r border-slate-100">
                    <input type="date" value={studentValues[s.id]?.tanggal || ''} onChange={e => updateVal(s.id, 'tanggal', e.target.value)} className="w-full p-2 border border-slate-200 rounded" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="text" placeholder="Asal/Tujuan Sekolah..." value={studentValues[s.id]?.keterangan || ''} onChange={e => updateVal(s.id, 'keterangan', e.target.value)} className="w-full p-2 border border-slate-200 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NonAcademicLayout>
    </div>
  );
}

export function InputCatatan() {
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [studentValues, setStudentValues] = useState<Record<string, { catatan: string }>>({});
  const { activeYear } = useActiveYear();
  const [saveStatus, setSaveStatus] = useState<{type: 'success'|'error', message: string} | null>(null);

  useEffect(() => { if (!selectedClass) { setStudents([]); return; } return loadStudents(selectedClass, setStudents); }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !activeYear) return;
    const load = async () => {
      const q = query(collection(db, 'academic_notes'), where('classId', '==', selectedClass), where('academicYearId', '==', activeYear));
      const snap = await getDocs(q);
      const data: any = {};
      snap.forEach(doc => { data[doc.data().studentId] = { catatan: doc.data().catatan || '' }; });
      setStudentValues(data);
    };
    load();
  }, [selectedClass, activeYear]);

  const handleSave = async () => {
    if (!activeYear) return setSaveStatus({ type: 'error', message: 'Tahun ajaran tidak ada.' });
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        const docRef = doc(db, 'academic_notes', `${s.id}_${activeYear}`);
        batch.set(docRef, { studentId: s.id, classId: selectedClass, academicYearId: activeYear, catatan: studentValues[s.id]?.catatan || '' }, { merge: true });
      });
      await batch.commit();
      setSaveStatus({ type: 'success', message: 'Catatan Wali Kelas berhasil disimpan.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e: any) { setSaveStatus({ type: 'error', message: e.message }); }
  };

  const updateVal = (studentId: string, val: string) => {
    setStudentValues(p => ({ ...p, [studentId]: { catatan: val } }));
  };

  return (
    <div>
      <NotificationResult saveStatus={saveStatus} />
      <NonAcademicLayout title="Catatan Wali Kelas" onSave={handleSave} onClassChange={setSelectedClass} students={students} selectedClass={selectedClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 border border-slate-200">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 border-r border-slate-200 w-12 text-center">No</th>
                <th className="px-4 py-3 border-r border-slate-200 text-left w-1/4">Nama Siswa</th>
                <th className="px-4 py-3 text-left">Catatan / Pesan Wali Kelas</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 border-r border-slate-100 text-center">{idx + 1}</td>
                  <td className="px-4 py-3 border-r border-slate-100 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3">
                    <textarea value={studentValues[s.id]?.catatan || ''} onChange={e => updateVal(s.id, e.target.value)} className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 min-h-[80px]" placeholder="Masukkan catatan atau pesan untuk siswa/orang tua..." />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NonAcademicLayout>
    </div>
  );
}

