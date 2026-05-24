import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Upload, Download, X, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { mockTeachers, mockClasses, mockSubjects } from '../../store/mockDb';
import { collection, query, onSnapshot, setDoc, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
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

export function NotificationToast({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
        type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        {type === 'success' ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-red-600" />}
        <p className="font-medium text-sm">{message}</p>
        <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>
      </div>
    </div>
  );
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title = "Hapus Data", description = "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan." }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title?: string, description?: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={32} />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-2">{title}</h3>
        <p className="text-slate-600 text-sm mb-6 pb-2" dangerouslySetInnerHTML={{ __html: description }}></p>
        <div className="flex justify-center gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex-1"
          >
            Batal
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex-1"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

export function DataSiswa() {
  const [students, setStudents] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [majorsList, setMajorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importFileSiswa, setImportFileSiswa] = useState<File | null>(null);
  const [editIdSiswa, setEditIdSiswa] = useState<string | null>(null);

  // Custom confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const displayClasses = classesList.length > 0 ? classesList : mockClasses;

  const handleImportSiswa = async () => {
    if (!importFileSiswa) {
      setNotification({ message: "Pilih file excel terlebih dahulu!", type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);
        
        let successCount = 0;
        for (const row of parsedData as any[]) {
          if (!row['NIS'] || !row['Nama Lengkap']) continue;
          
          const docId = 's' + Date.now() + Math.random().toString(36).substr(2, 5);
          await setDoc(doc(db, 'students', docId), {
            nis: String(row['NIS'] || ''),
            nisn: String(row['NISN'] || ''),
            name: String(row['Nama Lengkap'] || ''),
            gender: String(row['Jenis Kelamin (Laki-laki/Perempuan)'] || 'L').startsWith('P') ? 'P' : 'L',
            religion: String(row['Agama'] || 'Islam'),
            placeOfBirth: String(row['Tempat Lahir'] || ''),
            dateOfBirth: String(row['Tanggal Lahir (YYYY-MM-DD)'] || ''),
            address: String(row['Alamat'] || ''),
            phone: String(row['Nomor Telepon / HP'] || ''),
            classId: displayClasses.find(c => c.name === row['Kelas / Rombel'])?.id || displayClasses[0]?.id || '',
            major: String(row['Jurusan'] || 'Belum Ada Jurusan'),
            enrollmentDate: String(row['Tanggal Masuk (YYYY-MM-DD)'] || ''),
            acceptedSince: String(row['Diterima Sejak'] || 'Kelas X'),
            status: String(row['Status Siswa'] || 'active').toLowerCase() === 'aktif' ? 'active' : 'active',
            fatherName: String(row['Nama Ayah'] || ''),
            motherName: String(row['Nama Ibu'] || ''),
            guardianName: String(row['Nama Wali'] || ''),
            createdAt: Date.now()
          });
          successCount++;
        }
        setNotification({ message: `Berhasil mengimport ${successCount} data siswa!`, type: 'success' });
        setShowImportModal(false);
        setImportFileSiswa(null);
      } catch (error: any) {
        setNotification({ message: "Gagal mengimport data: " + error.message, type: 'error' });
      }
    };
    reader.readAsBinaryString(importFileSiswa);
  };

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

    const qClass = query(collection(db, 'classes'));
    const unsubClass = onSnapshot(qClass, (snapshot) => {
      const cls: any[] = [];
      snapshot.forEach(doc => cls.push({ id: doc.id, ...doc.data() }));
      cls.sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
      setClassesList(cls);
    });

    const qMajor = query(collection(db, 'majors'));
    const unsubMajor = onSnapshot(qMajor, (snapshot) => {
      const mjr: any[] = [];
      snapshot.forEach(doc => mjr.push({ id: doc.id, ...doc.data() }));
      setMajorsList(mjr);
    });

    return () => {
      unsubscribe();
      unsubClass();
      unsubMajor();
    }
  }, []);

  // Form states
  const [newSiswa, setNewSiswa] = useState({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L',
    religion: 'Islam',
    placeOfBirth: '',
    dateOfBirth: '',
    address: '',
    phone: '',
    classId: displayClasses[0]?.id || '',
    major: 'Belum Ada Jurusan',
    enrollmentDate: '',
    acceptedSince: 'Kelas X',
    status: 'active',
    fatherName: '',
    motherName: '',
    guardianName: ''
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

    const payload = {
      nis: newSiswa.nis,
      nisn: newSiswa.nisn,
      name: newSiswa.name,
      gender: newSiswa.gender as 'L' | 'P',
      religion: newSiswa.religion,
      placeOfBirth: newSiswa.placeOfBirth,
      dateOfBirth: newSiswa.dateOfBirth,
      address: newSiswa.address,
      phone: newSiswa.phone,
      classId: newSiswa.classId,
      major: newSiswa.major,
      enrollmentDate: newSiswa.enrollmentDate,
      acceptedSince: newSiswa.acceptedSince,
      status: newSiswa.status as 'active' | 'mutated' | 'graduated',
      fatherName: newSiswa.fatherName,
      motherName: newSiswa.motherName,
      guardianName: newSiswa.guardianName
    };

    try {
      if (editIdSiswa) {
        await updateDoc(doc(db, 'students', editIdSiswa), payload);
      } else {
        const docId = 'st' + Date.now();
        await setDoc(doc(db, 'students', docId), {
          ...payload,
          createdAt: Date.now()
        });
      }
      setShowAddModal(false);
      setEditIdSiswa(null);
      setNewSiswa({
        nis: '',
        nisn: '',
        name: '',
        gender: 'L',
        religion: 'Islam',
        placeOfBirth: '',
        dateOfBirth: '',
        address: '',
        phone: '',
        classId: displayClasses[0]?.id || '',
        major: 'Belum Ada Jurusan',
        enrollmentDate: '',
        acceptedSince: 'Kelas X',
        status: 'active',
        fatherName: '',
        motherName: '',
        guardianName: ''
      });
    } catch (err: any) {
      console.error("Error saving student: ", err.message);
      alert("Gagal menyimpan data: " + err.message);
    }
  };

  const handleEditClickSiswa = (s: any) => {
    setNewSiswa({
      nis: s.nis || '',
      nisn: s.nisn || '',
      name: s.name || '',
      gender: s.gender || 'L',
      religion: s.religion || 'Islam',
      placeOfBirth: s.placeOfBirth || '',
      dateOfBirth: s.dateOfBirth || '',
      address: s.address || '',
      phone: s.phone || '',
      classId: s.classId || displayClasses[0]?.id || '',
      major: s.major || 'Belum Ada Jurusan',
      enrollmentDate: s.enrollmentDate || '',
      acceptedSince: s.acceptedSince || 'Kelas X',
      status: s.status || 'active',
      fatherName: s.fatherName || '',
      motherName: s.motherName || '',
      guardianName: s.guardianName || ''
    });
    setEditIdSiswa(s.id);
    setShowAddModal(true);
  };

  const handleDeleteSiswa = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'students', id));
      setConfirmDeleteId(null);
    } catch (error: any) {
      alert('Gagal menghapus data: ' + error.message);
    }
  };

  const handleDeleteAllSiswa = async () => {
    if (students.length === 0) {
      setConfirmDeleteAll(false);
      return;
    }
    
    try {
      const q = query(collection(db, 'students'));
      const querySnapshot = await getDocs(q);
      await Promise.all(
        querySnapshot.docs.map(document => deleteDoc(doc(db, 'students', document.id)))
      );
      setConfirmDeleteAll(false);
    } catch (error: any) {
      alert('Gagal menghapus data: ' + error.message);
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

  const exportDataSiswa = () => {
    const wsData = students.map(s => ({
      "NIS": s.nis,
      "NISN": s.nisn,
      "Nama Lengkap": s.name,
      "Jenis Kelamin (Laki-laki/Perempuan)": s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      "Agama": s.religion || '',
      "Tempat Lahir": s.placeOfBirth || '',
      "Tanggal Lahir (YYYY-MM-DD)": s.dateOfBirth || '',
      "Alamat": s.address || '',
      "Nomor Telepon / HP": s.phone || '',
      "Kelas / Rombel": displayClasses.find(c => c.id === s.classId)?.name || '',
      "Jurusan": s.major || '',
      "Tanggal Masuk (YYYY-MM-DD)": s.enrollmentDate || '',
      "Diterima Sejak": s.acceptedSince || '',
      "Status Siswa": s.status === 'active' ? 'Aktif' : s.status === 'mutated' ? 'Mutasi' : 'Dikeluarkan',
      "Nama Ayah": s.fatherName || '',
      "Nama Ibu": s.motherName || '',
      "Nama Wali": s.guardianName || ''
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Siswa");
    XLSX.writeFile(wb, "data_siswa.xlsx");
  };

  const extraSiswaButtons = (
    <>
      <button onClick={exportDataSiswa} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors whitespace-nowrap">
        <Download size={18} />
        Export Data Siswa
      </button>
      <button onClick={downloadTemplateSiswa} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors whitespace-nowrap">
        <Download size={18} />
        Template Excel
      </button>
      <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors whitespace-nowrap">
        <Upload size={18} />
        Import Excel
      </button>
      <button onClick={() => setConfirmDeleteAll(true)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors whitespace-nowrap">
        <Trash2 size={18} />
        Hapus Semua
      </button>
    </>
  );

  return (
    <>
      {notification && <NotificationToast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
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
                  <td className="px-6 py-4">{displayClasses.find(c => c.id === s.classId)?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.status === 'active' ? 'Aktif' : 'Non Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button onClick={() => handleEditClickSiswa(s)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => setConfirmDeleteId(s.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
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
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFileSiswa(null);
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-emerald-50 transition-colors cursor-pointer group">
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xlsx, .xls" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setImportFileSiswa(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {importFileSiswa ? importFileSiswa.name : "Klik untuk upload atau drag and drop"}
                </p>
                <p className="text-xs text-slate-500 mt-1">.xlsx, .xls (Max 5MB)</p>
              </label>
              <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-100">
                <span className="font-bold">Perhatian:</span> Pastikan format sesuai dengan template Excel yang disediakan. Data NIS harus unik.
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFileSiswa(null);
                }} 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleImportSiswa} 
                className="px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 bg-emerald-600 rounded-lg transition-colors flex items-center gap-2"
              >
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
              <h3 className="font-bold text-slate-800 text-lg">{editIdSiswa ? 'Edit Data Siswa' : 'Tambah Data Siswa Baru'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditIdSiswa(null); }} className="text-slate-400 hover:text-slate-600">
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
                      <select name="religion" value={newSiswa.religion} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800">
                        <option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option>
                        <option value="Hindu">Hindu</option><option value="Buddha">Buddha</option><option value="Konghucu">Konghucu</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                       <input type="text" name="placeOfBirth" value={newSiswa.placeOfBirth} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" placeholder="Kota" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                       <input type="date" name="dateOfBirth" value={newSiswa.dateOfBirth} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                     </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label>
                    <textarea name="address" value={newSiswa.address} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" placeholder="Alamat lengkap..."></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / HP</label>
                    <input type="text" name="phone" value={newSiswa.phone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" placeholder="Contoh: 08123456789" />
                  </div>
                </div>
                
                {/* Kolom Kanan */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-2">Data Akademik & Orang Tua</h4>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas / Rombel</label>
                       <select name="classId" value={newSiswa.classId} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800">
                         {displayClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Jurusan</label>
                       <select name="major" value={newSiswa.major} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800">
                         <option value="Belum Ada Jurusan">Belum Ada Jurusan</option>
                         {majorsList.map(m => (
                           <option key={m.id} value={m.name}>{m.name}</option>
                         ))}
                       </select>
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Masuk</label>
                       <input type="date" name="enrollmentDate" value={newSiswa.enrollmentDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Diterima Sejak</label>
                       <select name="acceptedSince" value={newSiswa.acceptedSince} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800">
                         <option value="Kelas X">Kelas X</option><option value="Kelas XI">Kelas XI</option><option value="Kelas XII">Kelas XII</option>
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
                      <input type="text" name="fatherName" value={newSiswa.fatherName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ibu</label>
                      <input type="text" name="motherName" value={newSiswa.motherName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Wali (Opsional)</label>
                      <input type="text" name="guardianName" value={newSiswa.guardianName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
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
              <button onClick={() => { setShowAddModal(false); setEditIdSiswa(null); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg transition-colors">Batal</button>
              <button onClick={handleSaveSiswa} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                <Save size={16} /> Simpan Data Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Single Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Hapus Data Siswa</h3>
            <p className="text-slate-600 text-sm mb-6">Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setConfirmDeleteId(null)} 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex-1"
              >
                Batal
              </button>
              <button 
                onClick={() => handleDeleteSiswa(confirmDeleteId)} 
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex-1"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete All Modal */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Hapus SEMUA Data</h3>
            <p className="text-slate-600 text-sm mb-6">Apakah Anda yakin ingin menghapus <b>seluruh data siswa</b>? Tindakan ini tidak dapat dibatalkan dan semua data akan hilang secara permanen.</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setConfirmDeleteAll(false)} 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex-1"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteAllSiswa} 
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex-1"
              >
                Hapus Semua
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
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importFileGuru, setImportFileGuru] = useState<File | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [editIdGuru, setEditIdGuru] = useState<string | null>(null);
  const [confirmDeleteIdGuru, setConfirmDeleteIdGuru] = useState<string | null>(null);

  const handleImportGuru = async () => {
    if (!importFileGuru) {
      setNotification({ message: "Pilih file excel terlebih dahulu!", type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);
        
        let successCount = 0;
        for (const row of parsedData as any[]) {
          if (!row['NIP'] || !row['Nama Guru']) continue;
          
          const docId = 'tc' + Date.now() + Math.random().toString(36).substr(2, 5);
          
          // Helper to split comma separated string
          const parseCommaList = (str: any) => {
             if (!str || typeof str !== 'string') return [];
             return str.split(',').map(s => s.trim()).filter(s => s);
          };

          const isWali = String(row['Wali Kelas (Ya/Tidak)'] || 'Tidak').toLowerCase() === 'ya' ? 'Ya' : 'Tidak';
          
          await setDoc(doc(db, 'teachers', docId), {
            nip: String(row['NIP'] || ''),
            name: String(row['Nama Guru'] || ''),
            gender: String(row['Jenis Kelamin (L/P)'] || 'L').startsWith('P') ? 'P' : 'L',
            address: String(row['Alamat'] || ''),
            phone: String(row['Nomor HP'] || ''),
            email: String(row['Email'] || ''),
            username: String(row['Username'] || ''),
            password: String(row['Password'] || ''),
            status: String(row['Status Guru'] || 'Tetap'),
            subjects: parseCommaList(row['Mata Pelajaran (Pisahkan dengan koma)']),
            classesTaught: parseCommaList(row['Mengajar di Kelas (Pisahkan dengan koma)']),
            isHomeroom: isWali,
            homeroomClass: isWali === 'Ya' ? String(row['Wali Kelas di Kelas'] || '') : '',
            createdAt: Date.now()
          });
          successCount++;
        }
        setNotification({ message: `Berhasil mengimport ${successCount} data guru!`, type: 'success' });
        setShowImportModal(false);
        setImportFileGuru(null);
      } catch (error: any) {
        setNotification({ message: "Gagal mengimport data: " + error.message, type: 'error' });
      }
    };
    reader.readAsBinaryString(importFileGuru);
  };

  // Fallback to mock data if Firebase empty
  const displaySubjects = subjectsList.length > 0 ? subjectsList : mockSubjects;
  const displayClasses = classesList.length > 0 ? classesList : mockClasses;

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
    subjects: [] as string[],
    classesTaught: [] as string[],
    isHomeroom: 'Tidak',
    homeroomClass: ''
  });

  const handleClassCheck = (classId: string) => {
    setNewGuru(prev => ({
      ...prev,
      classesTaught: prev.classesTaught.includes(classId)
        ? prev.classesTaught.filter(c => c !== classId)
        : [...prev.classesTaught, classId]
    }));
  };

  const handleSubjectCheck = (subjectName: string) => {
    setNewGuru(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectName)
        ? prev.subjects.filter(s => s !== subjectName)
        : [...prev.subjects, subjectName]
    }));
  };

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

    const qSubj = query(collection(db, 'subjects'));
    const unsubSubj = onSnapshot(qSubj, (snapshot) => {
      const sbj: any[] = [];
      snapshot.forEach(doc => sbj.push({ id: doc.id, ...doc.data() }));
      sbj.sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
      setSubjectsList(sbj);
    });

    const qClass = query(collection(db, 'classes'));
    const unsubClass = onSnapshot(qClass, (snapshot) => {
      const cls: any[] = [];
      snapshot.forEach(doc => cls.push({ id: doc.id, ...doc.data() }));
      cls.sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
      setClassesList(cls);
    });

    return () => {
      unsubscribe();
      unsubSubj();
      unsubClass();
    }
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
      const targetTeacherId = editIdGuru || docId;
      let oldHomeroomClass = '';

      if (editIdGuru) {
        const prevTeacher = teachers.find(t => t.id === editIdGuru);
        if (prevTeacher) oldHomeroomClass = prevTeacher.homeroomClass || '';
        await updateDoc(doc(db, 'teachers', editIdGuru), { ...newGuru });
      } else {
        await setDoc(doc(db, 'teachers', docId), teacherObj);
      }

      // Sync to classes collection
      if (newGuru.isHomeroom === 'Ya' && newGuru.homeroomClass) {
        if (oldHomeroomClass && oldHomeroomClass !== newGuru.homeroomClass) {
          try { await updateDoc(doc(db, 'classes', oldHomeroomClass), { homeroomId: '' }); } catch (e) {}
        }
        try { await updateDoc(doc(db, 'classes', newGuru.homeroomClass), { homeroomId: targetTeacherId }); } catch (e) {}
      } else if (newGuru.isHomeroom === 'Tidak' && oldHomeroomClass) {
        try { await updateDoc(doc(db, 'classes', oldHomeroomClass), { homeroomId: '' }); } catch (e) {}
      }

      setShowAddModal(false);
      setEditIdGuru(null);
      setNewGuru({
        nip: '', name: '', gender: 'L', address: '', phone: '', email: '', username: '', password: '', status: 'Tetap', subjects: [], classesTaught: [], isHomeroom: 'Tidak', homeroomClass: ''
      });
    } catch (err: any) {
      console.error("Error saving teacher: ", err.message);
      alert("Gagal menyimpan data guru: " + err.message);
    }
  };

  const handleEditClickGuru = (t: any) => {
    setNewGuru({
      nip: t.nip || '',
      name: t.name || '',
      gender: t.gender || 'L',
      address: t.address || '',
      phone: t.phone || '',
      email: t.email || '',
      username: t.username || '',
      password: t.password || '',
      status: t.status || 'Tetap',
      subjects: t.subjects || [],
      classesTaught: t.classesTaught || [],
      isHomeroom: t.isHomeroom || 'Tidak',
      homeroomClass: t.homeroomClass || ''
    });
    setEditIdGuru(t.id);
    setShowAddModal(true);
  };

  const handleDeleteGuru = async () => {
    if (confirmDeleteIdGuru) {
      try {
        const teacherToDelete = teachers.find(t => t.id === confirmDeleteIdGuru);
        if (teacherToDelete && teacherToDelete.isHomeroom === 'Ya' && teacherToDelete.homeroomClass) {
          try { await updateDoc(doc(db, 'classes', teacherToDelete.homeroomClass), { homeroomId: '' }); } catch (e) {}
        }
        await deleteDoc(doc(db, 'teachers', confirmDeleteIdGuru));
      } catch (err) {
        console.error(err);
      }
      setConfirmDeleteIdGuru(null);
    }
  };

  const downloadTemplateGuru = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["NIP", "Nama Guru", "Jenis Kelamin (L/P)", "Alamat", "Nomor HP", "Email", "Username", "Password", "Status Guru", "Mata Pelajaran (Pisahkan dengan koma)", "Mengajar di Kelas (Pisahkan dengan koma)", "Wali Kelas (Ya/Tidak)", "Wali Kelas di Kelas"]
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
      {notification && <NotificationToast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
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
                <th className="px-6 py-3">Mengajar Kelas</th>
                <th className="px-6 py-3">Wali Kelas</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Memuat data...</td></tr>
              ) : teachers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4">Belum ada data guru</td></tr>
              ) : teachers.map(t => (
                <tr key={t.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{t.nip || '-'}</td>
                  <td className="px-6 py-4">{t.name}</td>
                  <td className="px-6 py-4">{t.phone}</td>
                  <td className="px-6 py-4">
                    {Array.isArray(t.subjects) ? t.subjects.join(', ') : (t.subjects || '-')}
                  </td>
                  <td className="px-6 py-4">
                    {Array.isArray(t.classesTaught) && t.classesTaught.length > 0 
                      ? t.classesTaught.join(', ') 
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {t.isHomeroom === 'Ya' ? (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Ya ({displayClasses.find(c => c.id === t.homeroomClass)?.name || classesList.find(c => c.id === t.homeroomClass)?.name || t.homeroomClass || '-'})
                      </span>
                    ) : (
                      <span className="text-slate-500">Tidak</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEditClickGuru(t)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => setConfirmDeleteIdGuru(t.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={!!confirmDeleteIdGuru} 
        onClose={() => setConfirmDeleteIdGuru(null)} 
        onConfirm={handleDeleteGuru} 
        title="Hapus Data Guru"
        description="Apakah Anda yakin ingin menghapus data guru ini?"
      />

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Import Data Guru</h3>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFileGuru(null);
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-emerald-50 transition-colors cursor-pointer group">
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xlsx, .xls" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setImportFileGuru(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {importFileGuru ? importFileGuru.name : "Klik untuk upload atau drag and drop"}
                </p>
                <p className="text-xs text-slate-500 mt-1">.xlsx, .xls (Max 5MB)</p>
              </label>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFileGuru(null);
                }} 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleImportGuru} 
                className="px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 bg-emerald-600 rounded-lg transition-colors flex items-center gap-2"
              >
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
              <h3 className="font-bold text-slate-800 text-lg">{editIdGuru ? 'Edit Data Guru' : 'Tambah Data Guru Baru'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditIdGuru(null); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
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
                             <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Mata Pelajaran Diampu</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 border border-slate-200 p-3 rounded-md max-h-32 overflow-y-auto">
                        {displaySubjects.map(subject => (
                          <label key={subject.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newGuru.subjects.includes(subject.name)}
                              onChange={() => handleSubjectCheck(subject.name)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="text-sm text-slate-700">{subject.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Mengajar di Kelas</label>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 border border-slate-200 p-3 rounded-md max-h-32 overflow-y-auto">
                        {displayClasses.map(c => (
                          <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newGuru.classesTaught.includes(c.name)}
                              onChange={() => handleClassCheck(c.name)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="text-sm text-slate-700">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Wali Kelas?</label>
                      <select name="isHomeroom" value={newGuru.isHomeroom} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                        <option>Tidak</option>
                        <option>Ya</option>
                      </select>
                    </div>
                    {newGuru.isHomeroom === 'Ya' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Wali Kelas di Kelas</label>
                        <select name="homeroomClass" value={newGuru.homeroomClass} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                          <option value="">-- Pilih Kelas --</option>
                          {displayClasses.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>          </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0 rounded-b-xl">
              <button onClick={() => { setShowAddModal(false); setEditIdGuru(null); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg">Batal</button>
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
  const [editIdAdmin, setEditIdAdmin] = useState<string | null>(null);
  const [confirmDeleteIdAdmin, setConfirmDeleteIdAdmin] = useState<string | null>(null);

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
      if (editIdAdmin) {
        await updateDoc(doc(db, 'admins', editIdAdmin), { name: newAdmin.name, email: newAdmin.email, password: newAdmin.password });
      } else {
        await setDoc(doc(db, 'admins', docId), adminObj);
      }
      setShowAddModal(false);
      setEditIdAdmin(null);
      setNewAdmin({ name: '', email: '', password: '' });
      alert("Akun Admin berhasil disimpan.");
    } catch (err: any) {
      alert("Gagal menyimpan admin: " + err.message);
    }
  };

  const handleEditClickAdmin = (a: any) => {
    setNewAdmin({
      name: a.name || '',
      email: a.email || '',
      password: a.password || ''
    });
    setEditIdAdmin(a.id);
    setShowAddModal(true);
  };

  const handleDeleteAdmin = async () => {
    if (confirmDeleteIdAdmin) {
      await deleteDoc(doc(db, 'admins', confirmDeleteIdAdmin));
      setConfirmDeleteIdAdmin(null);
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
                    <button onClick={() => handleEditClickAdmin(a)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => setConfirmDeleteIdAdmin(a.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={!!confirmDeleteIdAdmin} 
        onClose={() => setConfirmDeleteIdAdmin(null)} 
        onConfirm={handleDeleteAdmin} 
        title="Hapus Data Admin"
        description="Apakah Anda yakin ingin menghapus admin ini?"
      />

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">{editIdAdmin ? 'Edit Akun Admin' : 'Tambah Akun Admin'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditIdAdmin(null); }} className="text-slate-400 hover:text-slate-600">
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
              <button onClick={() => { setShowAddModal(false); setEditIdAdmin(null); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg">Batal</button>
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

export function DataMapel() {
  const [mapels, setMapels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileMapel, setImportFileMapel] = useState<File | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [editIdMapel, setEditIdMapel] = useState<string | null>(null);
  const [confirmDeleteIdMapel, setConfirmDeleteIdMapel] = useState<string | null>(null);

  const handleImportMapel = async () => {
    if (!importFileMapel) {
      setNotification({ message: "Pilih file excel terlebih dahulu!", type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        let successCount = 0;
        const batch = [];
        for (const row of jsonData as any[]) {
          if (!row['Kode Mapel'] || !row['Nama Mapel']) continue;

          const docId = 'sbj' + Date.now() + Math.random().toString(36).substr(2, 5);
          batch.push(setDoc(doc(db, 'subjects', docId), {
            code: String(row['Kode Mapel'] || ''),
            name: String(row['Nama Mapel'] || ''),
            groupType: String(row['Kelompok (A/B/C)'] || 'A'),
            createdAt: Date.now()
          }));
          successCount++;
        }
        await Promise.all(batch);
        setNotification({ message: `Berhasil mengimport ${successCount} data mapel!`, type: 'success' });
        setShowImportModal(false);
        setImportFileMapel(null);
      } catch (error: any) {
        setNotification({ message: "Gagal mengimport data: " + error.message, type: 'error' });
      }
    };
    reader.readAsBinaryString(importFileMapel);
  };

  const downloadTemplateMapel = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Kode Mapel", "Nama Mapel", "Kelompok (A/B/C)"]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Mapel");
    XLSX.writeFile(wb, "template_data_mapel.xlsx");
  };

  const [newMapel, setNewMapel] = useState({
    code: '',
    name: '',
    groupType: 'A'
  });

  useEffect(() => {
    const q = query(collection(db, 'subjects'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      data.sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
      setMapels(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMapel(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveMapel = async () => {
    if (!newMapel.code || !newMapel.name) {
      alert("Kode dan Nama Mapel wajib diisi!");
      return;
    }

    const docId = 'sbj' + Date.now();
    try {
      if (editIdMapel) {
        await updateDoc(doc(db, 'subjects', editIdMapel), { ...newMapel });
      } else {
        await setDoc(doc(db, 'subjects', docId), { ...newMapel, createdAt: Date.now() });
      }
      setShowAddModal(false);
      setEditIdMapel(null);
      setNewMapel({ code: '', name: '', groupType: 'A' });
    } catch (err: any) {
      alert("Gagal menyimpan mapel: " + err.message);
    }
  };

  const handleEditClickMapel = (m: any) => {
    setNewMapel({
      code: m.code || '',
      name: m.name || '',
      groupType: m.groupType || 'A'
    });
    setEditIdMapel(m.id);
    setShowAddModal(true);
  };

  const handleDeleteMapel = async () => {
    if (confirmDeleteIdMapel) {
      await deleteDoc(doc(db, 'subjects', confirmDeleteIdMapel));
      setConfirmDeleteIdMapel(null);
    }
  };

  const extraMapelButtons = (
    <>
      <button onClick={downloadTemplateMapel} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors whitespace-nowrap">
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
      {notification && <NotificationToast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <TableHeader 
          title="Data Master Mata Pelajaran" 
          action="Tambah Mapel" 
          extraButtons={extraMapelButtons}
          onActionClick={() => setShowAddModal(true)} 
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Kode Mapel</th>
                <th className="px-6 py-3">Nama Mata Pelajaran</th>
                <th className="px-6 py-3">Kelompok</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-4">Memuat data...</td></tr>
              ) : mapels.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4">Belum ada data mapel</td></tr>
              ) : mapels.map((m) => (
                <tr key={m.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{m.code}</td>
                  <td className="px-6 py-4">{m.name}</td>
                  <td className="px-6 py-4">Kelompok {m.groupType}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEditClickMapel(m)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => setConfirmDeleteIdMapel(m.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={!!confirmDeleteIdMapel} 
        onClose={() => setConfirmDeleteIdMapel(null)} 
        onConfirm={handleDeleteMapel} 
        title="Hapus Data Mata Pelajaran"
        description="Apakah Anda yakin ingin menghapus mapel ini?"
      />

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Import Data Mapel</h3>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFileMapel(null);
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-emerald-50 transition-colors cursor-pointer group">
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xlsx, .xls" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setImportFileMapel(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {importFileMapel ? importFileMapel.name : "Klik untuk upload atau drag and drop"}
                </p>
                <p className="text-xs text-slate-500 mt-1">.xlsx, .xls (Max 5MB)</p>
              </label>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFileMapel(null);
                }} 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleImportMapel} 
                className="px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 bg-emerald-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={16} /> Proses Import
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">{editIdMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditIdMapel(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Mapel</label>
                <input type="text" name="code" value={newMapel.code} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: MP-01" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input type="text" name="name" value={newMapel.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Nama Lengkap Mapel" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kelompok</label>
                <select name="groupType" value={newMapel.groupType} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="A">Kelompok A (Wajib)</option>
                  <option value="B">Kelompok B (Wajib)</option>
                  <option value="C">Kelompok C (Peminatan)</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => { setShowAddModal(false); setEditIdMapel(null); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg">Batal</button>
              <button onClick={handleSaveMapel} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg flex items-center gap-2 shadow-sm">
                <Save size={16} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DataEkstrakurikuler() {
  const [ekskuls, setEkskuls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editIdEkskul, setEditIdEkskul] = useState<string | null>(null);
  const [confirmDeleteIdEkskul, setConfirmDeleteIdEkskul] = useState<string | null>(null);

  const [newEkskul, setNewEkskul] = useState({
    code: '',
    name: '',
    coach: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'extracurriculars'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setEkskuls(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEkskul(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEkskul = async () => {
    if (!newEkskul.code || !newEkskul.name) {
      alert("Kode dan Nama Eskul wajib diisi!");
      return;
    }

    const docId = 'esk' + Date.now();
    try {
      if (editIdEkskul) {
        await updateDoc(doc(db, 'extracurriculars', editIdEkskul), { ...newEkskul });
      } else {
        await setDoc(doc(db, 'extracurriculars', docId), { ...newEkskul, createdAt: Date.now() });
      }
      setShowAddModal(false);
      setEditIdEkskul(null);
      setNewEkskul({ code: '', name: '', coach: '' });
    } catch (err: any) {
      alert("Gagal menyimpan eskul: " + err.message);
    }
  };

  const handleEditClickEkskul = (ek: any) => {
    setNewEkskul({
      code: ek.code || '',
      name: ek.name || '',
      coach: ek.coach || ''
    });
    setEditIdEkskul(ek.id);
    setShowAddModal(true);
  };

  const handleDeleteEkskul = async () => {
    if (confirmDeleteIdEkskul) {
      await deleteDoc(doc(db, 'extracurriculars', confirmDeleteIdEkskul));
      setConfirmDeleteIdEkskul(null);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <TableHeader title="Data Master Ekstrakurikuler" action="Tambah Ekstrakurikuler" onActionClick={() => setShowAddModal(true)} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Kode Eskul</th>
                <th className="px-6 py-3">Nama Ekstrakurikuler</th>
                <th className="px-6 py-3">Pembina</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-4">Memuat data...</td></tr>
              ) : ekskuls.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4">Belum ada data Ekstrakurikuler</td></tr>
              ) : ekskuls.map((ek) => (
                <tr key={ek.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{ek.code}</td>
                  <td className="px-6 py-4">{ek.name}</td>
                  <td className="px-6 py-4">{ek.coach || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEditClickEkskul(ek)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => setConfirmDeleteIdEkskul(ek.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={!!confirmDeleteIdEkskul} 
        onClose={() => setConfirmDeleteIdEkskul(null)} 
        onConfirm={handleDeleteEkskul} 
        title="Hapus Data Ekstrakurikuler"
        description="Apakah Anda yakin ingin menghapus ekstrakurikuler ini?"
      />

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">{editIdEkskul ? 'Edit Ekstrakurikuler' : 'Tambah Ekstrakurikuler'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditIdEkskul(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Eskul</label>
                <input type="text" name="code" value={newEkskul.code} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: EK-01" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ekstrakurikuler</label>
                <input type="text" name="name" value={newEkskul.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: Pramuka" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pembina</label>
                <input type="text" name="coach" value={newEkskul.coach} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Nama Pembina Eskul" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => { setShowAddModal(false); setEditIdEkskul(null); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg">Batal</button>
              <button onClick={handleSaveEkskul} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg flex items-center gap-2 shadow-sm">
                <Save size={16} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DataKokurikuler() {
  const [kokurikulers, setKokurikulers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editIdKoku, setEditIdKoku] = useState<string | null>(null);
  const [confirmDeleteIdKoku, setConfirmDeleteIdKoku] = useState<string | null>(null);

  const [newKoku, setNewKoku] = useState({
    theme: '',
    name: '',
    phase: 'Fase E (Kelas X)'
  });

  useEffect(() => {
    const q = query(collection(db, 'cocurriculars'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setKokurikulers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewKoku(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveKoku = async () => {
    if (!newKoku.theme || !newKoku.name) {
      alert("Tema dan Nama Proyek wajib diisi!");
      return;
    }

    const docId = 'kok' + Date.now();
    try {
      if (editIdKoku) {
        await updateDoc(doc(db, 'cocurriculars', editIdKoku), { ...newKoku });
      } else {
        await setDoc(doc(db, 'cocurriculars', docId), { ...newKoku, createdAt: Date.now() });
      }
      setShowAddModal(false);
      setEditIdKoku(null);
      setNewKoku({ theme: '', name: '', phase: 'Fase E (Kelas X)' });
    } catch (err: any) {
      alert("Gagal menyimpan kokurikuler: " + err.message);
    }
  };

  const handleEditClickKoku = (k: any) => {
    setNewKoku({
      theme: k.theme || '',
      name: k.name || '',
      phase: k.phase || 'Fase E (Kelas X)'
    });
    setEditIdKoku(k.id);
    setShowAddModal(true);
  };

  const handleDeleteKoku = async () => {
    if (confirmDeleteIdKoku) {
      await deleteDoc(doc(db, 'cocurriculars', confirmDeleteIdKoku));
      setConfirmDeleteIdKoku(null);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <TableHeader title="Data Master Kokurikuler (P5)" action="Tambah Proyek P5" onActionClick={() => setShowAddModal(true)} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Tema Proyek</th>
                <th className="px-6 py-3">Nama Proyek</th>
                <th className="px-6 py-3">Fase / Kelas</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-4">Memuat data...</td></tr>
              ) : kokurikulers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4">Belum ada data Kokurikuler</td></tr>
              ) : kokurikulers.map((k) => (
                <tr key={k.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{k.theme}</td>
                  <td className="px-6 py-4">{k.name}</td>
                  <td className="px-6 py-4">{k.phase}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEditClickKoku(k)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => setConfirmDeleteIdKoku(k.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={!!confirmDeleteIdKoku} 
        onClose={() => setConfirmDeleteIdKoku(null)} 
        onConfirm={handleDeleteKoku} 
        title="Hapus Data Kokurikuler"
        description="Apakah Anda yakin ingin menghapus proyek P5 ini?"
      />

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">{editIdKoku ? 'Edit Proyek P5' : 'Tambah Proyek P5'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditIdKoku(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tema Proyek</label>
                <input type="text" name="theme" value={newKoku.theme} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: Gaya Hidup Berkelanjutan" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Proyek</label>
                <input type="text" name="name" value={newKoku.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: Pengolahan Sampah Plastik" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fase / Kelas</label>
                <select name="phase" value={newKoku.phase} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="Fase E (Kelas X)">Fase E (Kelas X)</option>
                  <option value="Fase F (Kelas XI)">Fase F (Kelas XI)</option>
                  <option value="Fase F (Kelas XII)">Fase F (Kelas XII)</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => { setShowAddModal(false); setEditIdKoku(null); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg">Batal</button>
              <button onClick={handleSaveKoku} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg flex items-center gap-2 shadow-sm">
                <Save size={16} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DataJurusan() {
  const [majors, setMajors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editIdJurusan, setEditIdJurusan] = useState<string | null>(null);
  const [confirmDeleteIdJurusan, setConfirmDeleteIdJurusan] = useState<string | null>(null);

  const [newMajor, setNewMajor] = useState({
    name: '',
    code: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'majors'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setMajors(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMajor(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveMajor = async () => {
    if (!newMajor.name || !newMajor.code) {
      alert("Semua kolom wajib diisi!");
      return;
    }

    const docId = 'jur' + Date.now();
    try {
      if (editIdJurusan) {
        await updateDoc(doc(db, 'majors', editIdJurusan), { ...newMajor });
      } else {
        await setDoc(doc(db, 'majors', docId), {
          ...newMajor,
          createdAt: Date.now()
        });
      }
      setShowAddModal(false);
      setEditIdJurusan(null);
      setNewMajor({ name: '', code: '' });
    } catch (err: any) {
      alert("Gagal menambahkan jurusan: " + err.message);
    }
  };

  const handleEditClickJurusan = (m: any) => {
    setNewMajor({
      name: m.name || '',
      code: m.code || ''
    });
    setEditIdJurusan(m.id);
    setShowAddModal(true);
  };

  const handleDeleteJurusan = async () => {
    if (confirmDeleteIdJurusan) {
      await deleteDoc(doc(db, 'majors', confirmDeleteIdJurusan));
      setConfirmDeleteIdJurusan(null);
    }
  }

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <TableHeader title="Data Master Jurusan" action="Tambah Jurusan" onActionClick={() => setShowAddModal(true)} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Kode / Singkatan</th>
                <th className="px-6 py-3">Nama Jurusan</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-4">Memuat data...</td></tr>
              ) : majors.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-4">Belum ada data jurusan</td></tr>
              ) : majors.map(m => (
                <tr key={m.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{m.code}</td>
                  <td className="px-6 py-4">{m.name}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEditClickJurusan(m)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => setConfirmDeleteIdJurusan(m.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={!!confirmDeleteIdJurusan} 
        onClose={() => setConfirmDeleteIdJurusan(null)} 
        onConfirm={handleDeleteJurusan} 
        title="Hapus Data Jurusan"
        description="Apakah Anda yakin ingin menghapus jurusan ini?"
      />

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">{editIdJurusan ? 'Edit Jurusan' : 'Tambah Jurusan'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditIdJurusan(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
               <div>
                 <label className="block text-xs font-semibold text-slate-700 mb-1">Kode / Singkatan (contoh: IPA / IPS)</label>
                 <input type="text" name="code" value={newMajor.code} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="IPA" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Panjang Jurusan</label>
                 <input type="text" name="name" value={newMajor.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ilmu Pengetahuan Alam" />
               </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => { setShowAddModal(false); setEditIdJurusan(null); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg">Batal</button>
              <button onClick={handleSaveMajor} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg flex items-center gap-2 shadow-sm">
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
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [majorsList, setMajorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editIdKelas, setEditIdKelas] = useState<string | null>(null);
  const [confirmDeleteIdKelas, setConfirmDeleteIdKelas] = useState<string | null>(null);

  // Fallback to mockClasses initially if Firebase is empty (optional, but requested layout is nice)
  const displayClasses = classes.length > 0 ? classes : mockClasses;

  const [newClass, setNewClass] = useState({
    name: '',
    level: 'X',
    major: 'Belum Ada Jurusan',
    homeroomId: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'classes'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      data.sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
      setClasses(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const qTeacher = query(collection(db, 'teachers'));
    const unsubTeacher = onSnapshot(qTeacher, (querySnapshot) => {
      const teacherData: any[] = [];
      querySnapshot.forEach((doc) => {
        teacherData.push({ id: doc.id, ...doc.data() });
      });
      setTeachers(teacherData);
    });
    
    const qStudent = query(collection(db, 'students'));
    const unsubStudent = onSnapshot(qStudent, (querySnapshot) => {
      const studentData: any[] = [];
      querySnapshot.forEach((doc) => {
        studentData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentData);
    });

    const qMajor = query(collection(db, 'majors'));
    const unsubMajor = onSnapshot(qMajor, (querySnapshot) => {
      const majorData: any[] = [];
      querySnapshot.forEach((doc) => {
        majorData.push({ id: doc.id, ...doc.data() });
      });
      setMajorsList(majorData);
    });

    return () => {
      unsubTeacher();
      unsubStudent();
      unsubMajor();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewClass(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClass = async () => {
    if (!newClass.name) {
      alert("Nama Kelas wajib diisi!");
      return;
    }

    const docId = 'c' + Date.now();
    try {
      const targetClassId = editIdKelas || docId;
      let oldHomeroomId = '';

      if (editIdKelas) {
        const prevClass = classes.find(c => c.id === editIdKelas);
        if (prevClass) oldHomeroomId = prevClass.homeroomId || '';
        await updateDoc(doc(db, 'classes', editIdKelas), { ...newClass });
      } else {
        await setDoc(doc(db, 'classes', docId), { ...newClass, studentCount: 0, createdAt: Date.now() });
      }

      // Sync with Data Guru
      if (newClass.homeroomId) {
        if (oldHomeroomId && oldHomeroomId !== newClass.homeroomId) {
          // Clear old homeroom
          try { await updateDoc(doc(db, 'teachers', oldHomeroomId), { isHomeroom: 'Tidak', homeroomClass: '' }); } catch (e) {}
        }
        // Set new homeroom
        try { await updateDoc(doc(db, 'teachers', newClass.homeroomId), { isHomeroom: 'Ya', homeroomClass: targetClassId }); } catch (e) {}
      } else if (oldHomeroomId) {
        // Just cleared homeroom
        try { await updateDoc(doc(db, 'teachers', oldHomeroomId), { isHomeroom: 'Tidak', homeroomClass: '' }); } catch (e) {}
      }

      setShowAddModal(false);
      setEditIdKelas(null);
      setNewClass({ name: '', level: 'X', major: 'Belum Ada Jurusan', homeroomId: '' });
    } catch (err: any) {
      alert("Gagal menyimpan kelas: " + err.message);
    }
  };

  const handleEditClickKelas = (c: any) => {
    setNewClass({
      name: c.name || '',
      level: c.level || 'X',
      major: c.major || 'Belum Ada Jurusan',
      homeroomId: c.homeroomId || ''
    });
    setEditIdKelas(c.id);
    setShowAddModal(true);
  };

  const handleDeleteKelas = async () => {
    if (confirmDeleteIdKelas) {
      try {
        const classToDelete = classes.find(c => c.id === confirmDeleteIdKelas);
        if (classToDelete && classToDelete.homeroomId) {
          try { await updateDoc(doc(db, 'teachers', classToDelete.homeroomId), { isHomeroom: 'Tidak', homeroomClass: '' }); } catch (e) {}
        }
        await deleteDoc(doc(db, 'classes', confirmDeleteIdKelas));
      } catch (err) {
        console.error(err);
      }
      setConfirmDeleteIdKelas(null);
    }
  };

  // Helper to find teacher name
  const getTeacherName = (tId: string) => {
    const t = teachers.find(t => t.id === tId) || mockTeachers.find(t => t.id === tId);
    return t ? t.name : null;
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <TableHeader title="Data Master Kelas/Rombel" action="Tambah Kelas" onActionClick={() => setShowAddModal(true)} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Nama Kelas</th>
                <th className="px-6 py-3">Fase</th>
                <th className="px-6 py-3">Tingkat</th>
                <th className="px-6 py-3">Jurusan</th>
                <th className="px-6 py-3">Wali Kelas</th>
                <th className="px-6 py-3">Jml Siswa</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && classes.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4">Memuat data...</td></tr>
              ) : displayClasses.map(c => (
                <tr key={c.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                  <td className="px-6 py-4">{c.level === 'X' ? 'Fase E' : 'Fase F'}</td>
                  <td className="px-6 py-4">{c.level}</td>
                  <td className="px-6 py-4">{c.major}</td>
                  <td className="px-6 py-4">
                    {getTeacherName(c.homeroomId) || <span className="text-red-500 text-xs italic">Belum diset</span>}
                  </td>
                  <td className="px-6 py-4">{students.filter(s => s.classId === c.id).length} Siswa</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEditClickKelas(c)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => setConfirmDeleteIdKelas(c.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={!!confirmDeleteIdKelas} 
        onClose={() => setConfirmDeleteIdKelas(null)} 
        onConfirm={handleDeleteKelas} 
        title="Hapus Data Kelas"
        description="Apakah Anda yakin ingin menghapus kelas ini?"
      />

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">{editIdKelas ? 'Edit Kelas' : 'Tambah Kelas'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditIdKelas(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kelas</label>
                <input type="text" name="name" value={newClass.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: X IPA 1" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat</label>
                <select name="level" value={newClass.level} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="X">X (Fase E)</option>
                  <option value="XI">XI (Fase F)</option>
                  <option value="XII">XII (Fase F)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jurusan</label>
                <select name="major" value={newClass.major} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="Belum Ada Jurusan">Belum Ada Jurusan</option>
                  {majorsList.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Wali Kelas</label>
                <select name="homeroomId" value={newClass.homeroomId} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="">-- Pilih Wali Kelas --</option>
                  {mockTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 rounded-b-xl">
              <button onClick={() => { setShowAddModal(false); setEditIdKelas(null); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg">Batal</button>
              <button onClick={handleSaveClass} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg flex items-center gap-2 shadow-sm">
                <Save size={16} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
