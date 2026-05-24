import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, writeBatch, limit } from 'firebase/firestore';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';

export function ResetDatabase() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<Record<string, boolean>>({
    students: false,
    teachers: false,
    classes: false,
    subjects: false,
    majors: false,
    extracurriculars: false,
    cocurriculars: false,
    academic_grades: false,
    academic_configs: false,
  });

  const handleToggle = (col: string) => {
    setSelectedCollections(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const handleSelectAll = (checked: boolean) => {
    const fresh: Record<string, boolean> = {};
    Object.keys(selectedCollections).forEach(k => fresh[k] = checked);
    setSelectedCollections(fresh);
  };

  const handleInitialDelete = () => {
    const toDelete = Object.entries(selectedCollections).filter(([_, checked]) => checked);
    if (toDelete.length === 0) {
      alert("Pilih minimal satu database untuk dihapus."); // alert might also not work but we can try to avoid it by disabling the button
      return;
    }
    setShowConfirm(true);
  };

  const executeDelete = async () => {
    setShowConfirm(false);
    const toDelete = Object.entries(selectedCollections).filter(([_, checked]) => checked).map(([col]) => col);
    
    setIsDeleting(true);
    try {
      for (const col of toDelete) {
        let isDone = false;
        while (!isDone) {
          const q = query(collection(db, col), limit(400));
          const snapshot = await getDocs(q);
          if (snapshot.empty) {
            isDone = true;
            break;
          }
          const batch = writeBatch(db);
          snapshot.docs.forEach((d) => {
            batch.delete(doc(db, col, d.id));
          });
          await batch.commit();
        }
      }
      handleSelectAll(false);
      alert("Data yang dipilih telah berhasil dihapus sepenuhnya.");
    } catch (error: any) {
      console.error(error);
      alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedCount = Object.values(selectedCollections).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reset Database</h1>
        <p className="text-slate-500 mt-1">Hapus data dari database secara permanen.</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-red-100 p-2 rounded-full text-red-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-800">Peringatan Penghapusan Data</h2>
            <p className="text-red-600 mt-1 text-sm">
              Tindakan ini akan menghapus semua data yang ada di database secara permanen. 
              Pastikan Anda sudah memiliki cadangan data (backup) sebelum melanjutkan.
            </p>

            <div className="mt-4 flex gap-4">
              <button type="button" onClick={() => handleSelectAll(true)} className="text-sm font-medium text-red-700 hover:underline">Pilih Semua</button>
              <button type="button" onClick={() => handleSelectAll(false)} className="text-sm font-medium text-slate-600 hover:underline">Batalkan Pilihan</button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'students', label: 'Data Siswa', desc: 'collection: students' },
                { id: 'teachers', label: 'Data Guru', desc: 'collection: teachers' },
                { id: 'classes', label: 'Data Kelas', desc: 'collection: classes' },
                { id: 'subjects', label: 'Data Mata Pelajaran', desc: 'collection: subjects' },
                { id: 'majors', label: 'Data Jurusan', desc: 'collection: majors' },
                { id: 'extracurriculars', label: 'Data Ekstrakurikuler', desc: 'collection: extracurriculars' },
                { id: 'cocurriculars', label: 'Data Kokurikuler', desc: 'collection: cocurriculars' },
                { id: 'academic_grades', label: 'Nilai Akademik Siswa', desc: 'collection: academic_grades' },
                { id: 'academic_configs', label: 'Konfigurasi Kolom Nilai', desc: 'collection: academic_configs' },
              ].map(item => (
                <label key={item.id} className="flex items-start gap-3 p-3 bg-white border border-red-200 rounded-lg cursor-pointer hover:bg-red-50">
                  <input 
                    type="checkbox" 
                    checked={selectedCollections[item.id] || false}
                    onChange={() => handleToggle(item.id)}
                    className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
                  />
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-red-200">
              {!showConfirm ? (
                <button 
                  onClick={handleInitialDelete}
                  disabled={isDeleting || selectedCount === 0}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 size={18} />
                  {isDeleting ? "Menghapus..." : "Hapus Data Terpilih Permanen"}
                </button>
              ) : (
                <div className="bg-red-100 border border-red-300 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="font-bold text-red-900 flex items-center gap-2">
                    <AlertTriangle size={18} /> Konfirmasi Terakhir
                  </h3>
                  <p className="text-red-700 mt-1 mb-4 text-sm font-medium">
                    Tindakan ini tidak dapat diurungkan! Apakah Anda benar-benar yakin ingin menghapus permanen {selectedCount} tabel yang dipilih?
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    >
                      <X size={16} /> Batal
                    </button>
                    <button 
                      onClick={executeDelete}
                      className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-800 transition-colors"
                    >
                      <Check size={16} /> Ya, Hapus Permanen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
