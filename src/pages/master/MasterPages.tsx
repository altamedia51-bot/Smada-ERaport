import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Upload, Download, X, Save } from 'lucide-react';
import { mockTeachers, mockClasses } from '../../store/mockDb';
import { collection, query, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

import * as XLSX from 'xlsx';

function TableHeader({ title, action, extraButtons, onActionClick }: { title: string, action: string, extraButtons?: React.ReactNode, onActionClick?: () => void }) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      <div className="flex flex-wrap gap-2 w-full lg:w-auto">
        <div className="relative flex-1 lg:w-64 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari data..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>
        {extraButtons}
        <button onClick={onActionClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors whitespace-nowrap">
          <Plus size={18} />
          {action}
        </button>
      </div>
    </div>
  );
}

export function DataSiswa() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData: any[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Form states
  const [newSiswa, setNewSiswa] = useState({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L',
    classId: mockClasses[0]?.id || '',
    major: 'MIPA',
    status: 'active'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSiswa(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSiswa = async () => {
    if (!newSiswa.nis || !newSiswa.name) {
      alert("NIS dan Nama Lengkap wajib diisi!");
      return;
    }

    const docId = 'st' + Date.now();
    const newStudent = {
      nis: newSiswa.nis,
      nisn: newSiswa.nisn,
      name: newSiswa.name,
      gender: newSiswa.gender as 'L' | 'P',
      classId: newSiswa.classId,
      major: newSiswa.major,
      status: newSiswa.status as 'active' | 'mutated' | 'graduated',
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'students', docId), newStudent);
      setShowAddModal(false);
      setNewSiswa({
        nis: '',
        nisn: '',
        name: '',
        gender: 'L',
        classId: mockClasses[0]?.id || '',
        major: 'MIPA',
        status: 'active'
      });
    } catch (err: any) {
      console.error("Error saving student: ", err.message);
      alert("Gagal menyimpan data: " + err.message);
    }
  };

  const downloadTemplateSiswa = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "NIS", "NISN", "Nama Lengkap", "Jenis Kelamin (Laki-laki/Perempuan)", 
        "Agama", "Tempat Lahir", "Tanggal Lahir (YYYY-MM-DD)", "Alamat", "Nomor Telepon / HP", 
        "Kelas / Rombel", "Jurusan", "Tanggal Masuk (YYYY-MM-DD)", "Diterima Sejak", "Status Siswa", 
        "Nama Ayah", "Nama Ibu", "Nama Wali"
      ]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Siswa");
    XLSX.writeFile(wb, "template_data_siswa.xlsx");
  };

  const extraSiswaButtons = (
    <>
      <button onClick={downloadTemplateSiswa} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors whitespace-nowrap">
        <Download size={18} />
        Template Excel
      </button>
      <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors whitespace-nowrap">
        <Upload size={18} />
        Import Excel
      </button>
    </>
  );

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <TableHeader 
          title="Data Master Siswa" 
          action="Tambah Siswa" 
          extraButtons={extraSiswaButtons} 
          onActionClick={() => setShowAddModal(true)} 
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">NIS/NISN</th>
                <th className="px-6 py-3">Nama Lengkap</th>
                <th className="px-6 py-3">L/P</th>
                <th className="px-6 py-3">Kelas</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Memuat data...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4">Belum ada data siswa</td></tr>
              ) : students.map(s => (
                <tr key={s.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{s.nis} / {s.nisn}</td>
                  <td className="px-6 py-4">{s.name}</td>
                  <td className="px-6 py-4">{s.gender}</td>
                  <td className="px-6 py-4">{mockClasses.find(c => c.id === s.classId)?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.status === 'active' ? 'Aktif' : 'Non Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                    <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Import Data Siswa</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-emerald-50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-medium text-slate-700">Klik untuk upload atau drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">.xlsx, .xls (Max 5MB)</p>
              </div>
              <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-100">
                <span className="font-bold">Perhatian:</span> Pastikan format sesuai dengan template Excel yang disediakan. Data NIS harus unik.
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors">Batal</button>
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 bg-emerald-600 rounded-lg transition-colors flex items-center gap-2">
                <Save size={16} /> Proses Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Siswa Modal Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Tambah Data Siswa Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kolom Kiri */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-2">Informasi Pribadi</h4>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">NIS</label>
                       <input type="text" name="nis" value={newSiswa.nis} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" placeholder="Contoh: 1001" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">NISN</label>
                       <input type="text" name="nisn" value={newSiswa.nisn} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" placeholder="001002003" />
                     </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                    <input type="text" name="name" value={newSiswa.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" placeholder="Nama Lengkap Siswa" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                      <select name="gender" value={newSiswa.gender} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800">
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Agama</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800">
                        <option>Islam</option><option>Kristen</option><option>Katolik</option>
                        <option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                       <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" placeholder="Kota" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                       <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                     </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label>
                    <textarea rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" placeholder="Alamat lengkap..."></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / HP</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" placeholder="Contoh: 08123456789" />
                  </div>
                </div>
                
                {/* Kolom Kanan */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-2">Data Akademik & Orang Tua</h4>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas / Rombel</label>
                       <select name="classId" value={newSiswa.classId} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800">
                         {mockClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Jurusan</label>
                       <select name="major" value={newSiswa.major} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800">
                         <option>MIPA</option><option>IPS</option><option>Bahasa</option>
                       </select>
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Masuk</label>
                       <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Diterima Sejak</label>
                       <select className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800">
                         <option>Kelas X</option><option>Kelas XI</option><option>Kelas XII</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Status Siswa</label>
                       <select name="status" value={newSiswa.status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800">
                         <option value="active">Aktif</option>
                         <option value="mutated">Mutasi</option>
                         <option value="dropped">Dikeluarkan</option>
                       </select>
                     </div>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ayah</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ibu</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Wali (Opsional)</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Foto Siswa</label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 border border-slate-300 flex items-center justify-center rounded-lg text-slate-400 overflow-hidden">
                        <Upload size={20} />
                      </div>
                      <div>
                        <button className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50">Isi Pasfoto File</button>
                        <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, max 2MB (3x4)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0 rounded-b-xl">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg transition-colors">Batal</button>
              <button onClick={handleSaveSiswa} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                <Save size={16} /> Simpan Data Siswa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DataGuru() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newGuru, setNewGuru] = useState({
    nip: '',
    name: '',
    gender: 'L',
    address: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    status: 'Tetap',
    subjects: '',
    isHomeroom: 'Tidak'
  });

  useEffect(() => {
    const q = query(collection(db, 'teachers'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const teacherData: any[] = [];
      querySnapshot.forEach((doc) => {
        teacherData.push({ id: doc.id, ...doc.data() });
      });
      setTeachers(teacherData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewGuru(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveGuru = async () => {
    if (!newGuru.nip || !newGuru.name) {
      alert("NIP dan Nama Guru wajib diisi!");
      return;
    }

    const docId = 'tc' + Date.now();
    const teacherObj = {
      ...newGuru,
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'teachers', docId), teacherObj);
      setShowAddModal(false);
      setNewGuru({
        nip: '', name: '', gender: 'L', address: '', phone: '', email: '', username: '', password: '', status: 'Tetap', subjects: '', isHomeroom: 'Tidak'
      });
    } catch (err: any) {
      console.error("Error saving teacher: ", err.message);
      alert("Gagal menyimpan data guru: " + err.message);
    }
  };

  const downloadTemplateGuru = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["NIP", "Nama Guru", "Jenis Kelamin (L/P)", "Alamat", "Nomor HP", "Email", "Username", "Password", "Status Guru", "Mata Pelajaran", "Wali Kelas (Ya/Tidak)"]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Guru");
    XLSX.writeFile(wb, "template_data_guru.xlsx");
  };

  const extraGuruButtons = (
    <>
      <button onClick={downloadTemplateGuru} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors whitespace-nowrap">
        <Download size={18} />
        Template Excel
      </button>
      <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors whitespace-nowrap">
        <Upload size={18} />
        Import Excel
      </button>
    </>
  );

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <TableHeader 
          title="Data Master Guru" 
          action="Tambah Guru" 
          extraButtons={extraGuruButtons} 
          onActionClick={() => setShowAddModal(true)} 
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">NIP</th>
                <th className="px-6 py-3">Nama Guru</th>
                <th className="px-6 py-3">No HP</th>
                <th className="px-6 py-3">Mapel</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4">Memuat data...</td></tr>
              ) : teachers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4">Belum ada data guru</td></tr>
              ) : teachers.map(t => (
                <tr key={t.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{t.nip || '-'}</td>
                  <td className="px-6 py-4">{t.name}</td>
                  <td className="px-6 py-4">{t.phone}</td>
                  <td className="px-6 py-4">{t.subjects || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                    <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Import Data Guru</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-emerald-50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-medium text-slate-700">Klik untuk upload atau drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">.xlsx, .xls (Max 5MB)</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors">Batal</button>
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 bg-emerald-600 rounded-lg transition-colors flex items-center gap-2">
                <Save size={16} /> Proses Import
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Tambah Data Guru Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-2">Informasi Profil</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">NIP</label>
                    <input type="text" name="nip" value={newGuru.nip} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Nomor Induk Pegawai" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Guru</label>
                    <input type="text" name="name" value={newGuru.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Nama Lengkap beserta gelar" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select name="gender" value={newGuru.gender} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label>
                    <textarea name="address" value={newGuru.address} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Alamat lengkap..."></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor HP</label>
                    <input type="text" name="phone" value={newGuru.phone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="081xxx" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-2">Akun & Akademik</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input type="email" name="email" value={newGuru.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="guru@sekolah.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Username Login</label>
                      <input type="text" name="username" value={newGuru.username} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="username" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Password Login</label>
                      <input type="password" name="password" value={newGuru.password} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status Guru</label>
                    <select name="status" value={newGuru.status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                      <option>Tetap (PNS/Yayasan)</option>
                      <option>Honorer</option>
                      <option>P3K</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mata Pelajaran Diampu</label>
                    <input type="text" name="subjects" value={newGuru.subjects} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Pisahkan dengan koma jika lebih dari 1" />
                    <p className="text-[10px] text-slate-500 mt-1">Contoh: Matematika, Fisika, Biologi</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Wali Kelas?</label>
                    <select name="isHomeroom" value={newGuru.isHomeroom} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                      <option>Tidak</option>
                      <option>Ya</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0 rounded-b-xl">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg">Batal</button>
              <button onClick={handleSaveGuru} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg flex items-center gap-2 shadow-sm">
                <Save size={16} /> Simpan Data Guru
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DataAdmin() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'admins'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const adminData: any[] = [];
      querySnapshot.forEach((doc) => {
        adminData.push({ id: doc.id, ...doc.data() });
      });
      setAdmins(adminData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      alert("Semua kolom wajib diisi!");
      return;
    }

    const docId = 'adm' + Date.now();
    const adminObj = {
      name: newAdmin.name,
      email: newAdmin.email,
      password: newAdmin.password, // In a real scenario, do not store plain text password
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'admins', docId), adminObj);
      setShowAddModal(false);
      setNewAdmin({ name: '', email: '', password: '' });
      alert("Akun Admin berhasil ditambahkan. Mereka bisa menggunakan email dan password tersebut untuk masuk.");
    } catch (err: any) {
      alert("Gagal menambahkan admin: " + err.message);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <TableHeader title="Data Master Admin" action="Tambah Admin" onActionClick={() => setShowAddModal(true)} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-4">Memuat data...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-4">Belum ada data admin</td></tr>
              ) : admins.map(a => (
                <tr key={a.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{a.name}</td>
                  <td className="px-6 py-4">{a.email}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Tambah Akun Admin</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
               <div>
                 <label className="block text-xs font-semibold text-slate-700 mb-1">Nama</label>
                 <input type="text" name="name" value={newAdmin.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Nama Admin" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                 <input type="email" name="email" value={newAdmin.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="admin@sekolah.com" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                 <input type="password" name="password" value={newAdmin.password} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
               </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg">Batal</button>
              <button onClick={handleSaveAdmin} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg flex items-center gap-2 shadow-sm">
                <Save size={16} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DataKelas() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <TableHeader title="Data Master Kelas/Rombel" action="Tambah Kelas" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Nama Kelas</th>
              <th className="px-6 py-3">Tingkat</th>
              <th className="px-6 py-3">Jurusan</th>
              <th className="px-6 py-3">Wali Kelas</th>
              <th className="px-6 py-3">Jml Siswa</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {mockClasses.map(c => (
              <tr key={c.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                <td className="px-6 py-4">{c.level}</td>
                <td className="px-6 py-4">{c.major}</td>
                <td className="px-6 py-4">{mockTeachers.find(t => t.id === c.homeroomId)?.name || <span className="text-red-500 text-xs italic">Belum diset</span>}</td>
                <td className="px-6 py-4">{c.studentCount} Siswa</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                  <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
