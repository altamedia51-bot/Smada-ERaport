import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Upload, Download, X, Save } from 'lucide-react';
import { mockStudents, mockTeachers, mockClasses } from '../../store/mockDb';

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
  const [students, setStudents] = useState(mockStudents);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handleSaveSiswa = () => {
    if (!newSiswa.nis || !newSiswa.name) {
      alert("NIS dan Nama Lengkap wajib diisi!");
      return;
    }

    const newStudent = {
      id: 'st' + Date.now(),
      nis: newSiswa.nis,
      nisn: newSiswa.nisn,
      name: newSiswa.name,
      gender: newSiswa.gender as 'L' | 'P',
      classId: newSiswa.classId,
      major: newSiswa.major,
      status: newSiswa.status as 'active' | 'mutated' | 'graduated',
    };

    setStudents([newStudent, ...students]);
    mockStudents.unshift(newStudent); // Save to our mock "database" so it persists when navigating
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
  };

  const extraSiswaButtons = (
    <>
      <button className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors whitespace-nowrap">
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
              {students.map(s => (
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
                       <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Masuk</label>
                       <input type="number" defaultValue="2023" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
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
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <TableHeader title="Data Master Guru" action="Tambah Guru" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">NIP</th>
              <th className="px-6 py-3">Nama Guru</th>
              <th className="px-6 py-3">No HP</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {mockTeachers.map(t => (
              <tr key={t.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{t.nip || '-'}</td>
                <td className="px-6 py-4">{t.name}</td>
                <td className="px-6 py-4">{t.phone}</td>
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
