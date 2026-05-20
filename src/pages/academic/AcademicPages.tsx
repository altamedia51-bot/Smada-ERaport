import React, { useState, useEffect } from 'react';
import { Save, FileCheck, Search, Printer } from 'lucide-react';
import { mockClasses, mockSubjects } from '../../store/mockDb';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function InputNilai() {
  const [selectedClass, setSelectedClass] = useState(mockClasses[0].id);
  const [selectedSubject, setSelectedSubject] = useState(mockSubjects[0].id);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData: any[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsData);
    });
    return () => unsubscribe();
  }, []);
  
  const classStudents = students.filter(s => s.classId === selectedClass);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Input Nilai Akademik</h2>
          <p className="text-sm text-slate-500">Mata Pelajaran yang Anda ampu</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          <select 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700"
          >
            {mockClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select 
            value={selectedSubject} 
            onChange={e => setSelectedSubject(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700"
          >
            {mockSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500 border border-slate-200">
          <thead className="text-xs text-center text-slate-700 uppercase bg-blue-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 border-r border-slate-200 w-12 text-center" rowSpan={2}>No</th>
              <th className="px-4 py-3 border-r border-slate-200 text-left" rowSpan={2}>Nama Siswa</th>
              <th className="px-4 py-2 border-b border-slate-200" colSpan={4}>Komponen Nilai</th>
              <th className="px-4 py-3 border-l border-slate-200" rowSpan={2}>Nilai Akhir</th>
            </tr>
            <tr>
              <th className="px-2 py-2 border-r border-slate-200 bg-blue-50/50">Harian</th>
              <th className="px-2 py-2 border-r border-slate-200 bg-blue-50/50">Tugas</th>
              <th className="px-2 py-2 border-r border-slate-200 bg-blue-50/50">PTS</th>
              <th className="px-2 py-2 bg-blue-50/50">PAS</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map((s, idx) => (
              <tr key={s.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 border-r border-slate-100 text-center">{idx + 1}</td>
                <td className="px-4 py-2 border-r border-slate-100 font-medium text-slate-900">{s.name}</td>
                <td className="px-2 py-2 border-r border-slate-100"><input type="number" className="w-16 p-1 border border-slate-200 rounded text-center text-slate-700" placeholder="0" defaultValue={80 + idx} /></td>
                <td className="px-2 py-2 border-r border-slate-100"><input type="number" className="w-16 p-1 border border-slate-200 rounded text-center text-slate-700" placeholder="0" defaultValue={85} /></td>
                <td className="px-2 py-2 border-r border-slate-100"><input type="number" className="w-16 p-1 border border-slate-200 rounded text-center text-slate-700" placeholder="0" defaultValue={78} /></td>
                <td className="px-2 py-2 border-r border-slate-100"><input type="number" className="w-16 p-1 border border-slate-200 rounded text-center text-slate-700" placeholder="0" defaultValue={82} /></td>
                <td className="px-4 py-2 font-bold text-slate-900 text-center bg-slate-50">
                  {((80 + idx + 85 + 78 + 82) / 4).toFixed(1)}
                </td>
              </tr>
            ))}
            {classStudents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500 bg-slate-50">
                  Tidak ada data siswa ditemukan di kelas ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex justify-end gap-3">
        <button className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
          Reset
        </button>
        <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
          <Save size={18} />
          Simpan Nilai
        </button>
      </div>
    </div>
  );
}

export function InputKehadiran() {
  const selectedClass = mockClasses[0].id;
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData: any[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsData);
    });
    return () => unsubscribe();
  }, []);

  const classStudents = students.filter(s => s.classId === selectedClass);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Kehadiran & Catatan Wali Kelas</h2>
        <p className="text-sm text-slate-500">Kelas: X MIPA 1</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500 border border-slate-200">
          <thead className="text-xs text-center text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 border-r border-slate-200 w-12" rowSpan={2}>No</th>
              <th className="px-4 py-3 border-r border-slate-200 text-left" rowSpan={2}>Nama Siswa</th>
              <th className="px-4 py-2 border-b border-slate-200" colSpan={3}>Kehadiran</th>
              <th className="px-4 py-3 border-l border-slate-200 text-left" rowSpan={2}>Catatan Wali Kelas</th>
            </tr>
            <tr>
              <th className="px-2 py-2 border-r border-slate-200">Sakit</th>
              <th className="px-2 py-2 border-r border-slate-200">Izin</th>
              <th className="px-2 py-2 border-r border-slate-200">Alpha</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map((s, idx) => (
              <tr key={s.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 border-r border-slate-100 text-center">{idx + 1}</td>
                <td className="px-4 py-2 border-r border-slate-100 font-medium text-slate-900">{s.name}</td>
                <td className="px-2 py-2 border-r border-slate-100"><input type="number" className="w-12 p-1 border border-slate-200 rounded text-center" defaultValue={0} /></td>
                <td className="px-2 py-2 border-r border-slate-100"><input type="number" className="w-12 p-1 border border-slate-200 rounded text-center" defaultValue={0} /></td>
                <td className="px-2 py-2 border-r border-slate-100"><input type="number" className="w-12 p-1 border border-slate-200 rounded text-center" defaultValue={0} /></td>
                <td className="px-4 py-2 border-l border-slate-100">
                  <textarea className="w-full p-2 border border-slate-200 rounded text-sm" rows={2} placeholder="Tulis catatan..."></textarea>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex justify-end gap-3">
        <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
          <Save size={18} />
          Simpan Data
        </button>
      </div>
    </div>
  );
}

export function CetakRaport() {
  const selectedClass = mockClasses[0].id;
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData: any[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsData);
    });
    return () => unsubscribe();
  }, []);

  const classStudents = students.filter(s => s.classId === selectedClass);

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    window.print();
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cetak Raport & Leger</h2>
          <p className="text-sm text-slate-500">Kelas: X MIPA 1 (Wali Kelas: Budi Santoso, S.Pd)</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors">
              <Printer size={18} />
              Cetak Leger Excel
            </button>
        </div>
      </div>

      <div className="overflow-x-auto print:hidden">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">NIS/NISN</th>
              <th className="px-6 py-3">Nama Siswa</th>
              <th className="px-6 py-3">Status Validasi</th>
              <th className="px-6 py-3 text-right">Aksi Cetak</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map(s => (
              <tr key={s.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{s.nis}</td>
                <td className="px-6 py-4">{s.name}</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
                    <FileCheck size={14} /> Siap Cetak
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={handlePrint} className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium text-xs">
                    <Printer size={14} /> Raport
                  </button>
                  <button onClick={handlePrint} className="flex items-center gap-1 text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 font-medium text-xs">
                    <Printer size={14} /> DKN
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Print Only Area (Simulated) */}
      <div className="hidden print:block p-8 border-2 border-black">
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase">RAPORT PESERTA DIDIK</h1>
          <h2 className="text-xl font-bold uppercase">KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET DAN TEKNOLOGI</h2>
          <p className="mt-4 font-bold">REPUBLIK INDONESIA</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div>
              <p><strong>Nama Sekolah:</strong> SMA Negeri 1 Template</p>
              <p><strong>Alamat:</strong> Jl. Pendidikan No.1</p>
              <p><strong>Nama Peserta Didik:</strong> {classStudents[0]?.name}</p>
           </div>
           <div>
              <p><strong>Kelas:</strong> {mockClasses[0].name}</p>
              <p><strong>Fase/Semester:</strong> E / Genap</p>
              <p><strong>Tahun Pelajaran:</strong> 2023/2024</p>
           </div>
        </div>
        <table className="w-full text-sm border-collapse border border-black mb-8">
           <thead>
              <tr className="bg-gray-200">
                 <th className="border border-black p-2 w-12 text-center">No</th>
                 <th className="border border-black p-2">Mata Pelajaran</th>
                 <th className="border border-black p-2 w-24 text-center">Nilai Akhir</th>
                 <th className="border border-black p-2 text-center">Capaian Kompetensi</th>
              </tr>
           </thead>
           <tbody>
              <tr>
                 <td className="border border-black p-2 text-center">1</td>
                 <td className="border border-black p-2">Pendidikan Agama & Budi Pekerti</td>
                 <td className="border border-black p-2 text-center font-bold">85</td>
                 <td className="border border-black p-2 text-xs">Menunjukkan penguasaan yang sangat baik dalam memahami konsep norma dan etika.</td>
              </tr>
              <tr>
                 <td className="border border-black p-2 text-center">2</td>
                 <td className="border border-black p-2">Pendidikan Pancasila</td>
                 <td className="border border-black p-2 text-center font-bold">88</td>
                 <td className="border border-black p-2 text-xs">Sangat baik dalam mengamati dinamika musyawarah.</td>
              </tr>
              <tr>
                 <td className="border border-black p-2 text-center">3</td>
                 <td className="border border-black p-2">Matematika</td>
                 <td className="border border-black p-2 text-center font-bold">82.5</td>
                 <td className="border border-black p-2 text-xs">Sangat baik dalam pemahaman konsep geometri.</td>
              </tr>
           </tbody>
        </table>

        <div className="flex justify-between mt-16 pt-8">
           <div className="text-center w-48">
              <p>Mengetahui,</p>
              <p className="mb-16">Orang Tua/Wali</p>
              <p className="border-b border-black inline-block w-40">({classStudents[0]?.name})</p>
           </div>
           <div className="text-center w-48">
              <p>Jakarta, 20 Mei 2024</p>
              <p className="mb-16">Wali Kelas</p>
              <p className="font-bold underline">Budi Santoso, S.Pd</p>
              <p>NIP. 198001012005011001</p>
           </div>
        </div>
      </div>

    </div>
  );
}
