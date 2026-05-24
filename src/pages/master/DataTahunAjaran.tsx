import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ConfirmDeleteModal, NotificationToast } from './MasterPages';

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

export function DataTahunAjaran() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [formData, setFormData] = useState({
    name: '', // e.g. "2023/2024"
    semester: 'Ganjil',
    isActive: false,
  });

  useEffect(() => {
    const q = query(collection(db, 'academic_years'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setAcademicYears(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return false;
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setToast({ message: 'Tahun pelajaran harus diisi', type: 'error' });
      return;
    }
    
    try {
      if (formData.isActive) {
        // If this one is set to active, deactivate others
        const activeYears = academicYears.filter(y => y.isActive && y.id !== editId);
        for (const y of activeYears) {
          await updateDoc(doc(db, 'academic_years', y.id), { isActive: false });
        }
      }

      if (editId) {
        await updateDoc(doc(db, 'academic_years', editId), formData);
        setToast({ message: 'Tahun ajaran berhasil diperbarui', type: 'success' });
      } else {
        const id = `${formData.name.replace(/\//g, '-')}-${formData.semester}`.toLowerCase();
        await setDoc(doc(db, 'academic_years', id), formData);
        setToast({ message: 'Tahun ajaran berhasil ditambahkan', type: 'success' });
      }
      setShowAddModal(false);
      setEditId(null);
      setFormData({ name: '', semester: 'Ganjil', isActive: false });
    } catch (error: any) {
      console.error(error);
      setToast({ message: 'Terjadi kesalahan: ' + error.message, type: 'error' });
    }
  };

  const handleEdit = (item: any) => {
    setFormData({ name: item.name, semester: item.semester, isActive: item.isActive || false });
    setEditId(item.id);
    setShowAddModal(true);
  };

  const handleDeleteConfig = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteDoc(doc(db, 'academic_years', confirmDeleteId));
      setToast({ message: 'Tahun ajaran berhasil dihapus', type: 'success' });
    } catch (error: any) {
      console.error(error);
      setToast({ message: 'Gagal menghapus tahun ajaran', type: 'error' });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <TableHeader 
            title="Data Tahun Ajaran" 
            action="Tambah Tahun Ajaran" 
            onActionClick={() => {
              setFormData({ name: '', semester: 'Ganjil', isActive: false });
              setEditId(null);
              setShowAddModal(true);
            }} 
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                <th className="p-4 font-semibold text-slate-600">No</th>
                <th className="p-4 font-semibold text-slate-600">Tahun Pelajaran</th>
                <th className="p-4 font-semibold text-slate-600">Semester</th>
                <th className="p-4 font-semibold text-slate-600">Status Aktif</th>
                <th className="p-4 font-semibold text-slate-600 flex justify-end">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : academicYears.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Belum ada data tahun ajaran.</td>
                </tr>
              ) : academicYears.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-700">{idx + 1}</td>
                  <td className="p-4 font-medium text-slate-800">{item.name}</td>
                  <td className="p-4 text-slate-600">{item.semester}</td>
                  <td className="p-4">
                    {item.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle2 size={14} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Tidak Aktif
                      </span>
                    )}
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">{editId ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Pelajaran</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Contoh: 2023/2024" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                <select 
                  name="semester" 
                  value={formData.semester} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-2 group">
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    checked={formData.isActive} 
                    onChange={handleChange} 
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Set sebagai tahun ajaran aktif</span>
                </label>
                <p className="text-xs text-slate-500 mt-1 ml-6">Jika dicentang, ini akan mematikan status aktif tahun ajaran lain.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 rounded-b-xl">
              <button 
                onClick={() => { setShowAddModal(false); setEditId(null); }} 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSave} 
                className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              >
                <Save size={16} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDeleteModal 
          isOpen={true} 
          onClose={() => setConfirmDeleteId(null)} 
          onConfirm={handleDeleteConfig} 
          title="Hapus Tahun Ajaran"
          description="Apakah Anda yakin ingin menghapus data tahun ajaran ini?"
        />
      )}
    </div>
  );
}
