import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/auth/Login';

import { DataSiswa, DataGuru, DataKelas, DataMapel, DataEkstrakurikuler, DataKokurikuler, DataAdmin, DataJurusan } from './pages/master/MasterPages';
import { DataTahunAjaran } from './pages/master/DataTahunAjaran';
import { InputNilai, CetakRaport, CetakDKN } from './pages/academic/AcademicPages';

import { InputKehadiran, InputEkskul, InputKokurikuler, InputPrestasi, InputMutasi, InputCatatan } from './pages/academic/NonAcademicPages';

import { Panduan } from './pages/Panduan';
import { ResetDatabase } from './pages/settings/ResetDatabase';

import { PlaceholderPage } from './pages/Placeholder';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse">Loading...</div></div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout onLogout={() => auth.signOut()} />}>
        <Route index element={<Dashboard />} />
        
        {/* Master Data */}
        <Route path="master/tahun-ajaran" element={<DataTahunAjaran />} />
        <Route path="master/siswa" element={<DataSiswa />} />
        <Route path="master/guru" element={<DataGuru />} />
        <Route path="master/kelas" element={<DataKelas />} />
        <Route path="master/mapel" element={<DataMapel />} />
        <Route path="master/ekstrakurikuler" element={<DataEkstrakurikuler />} />
        <Route path="master/kokurikuler" element={<DataKokurikuler />} />
        <Route path="master/jurusan" element={<DataJurusan />} />
        <Route path="master/admin" element={<DataAdmin />} />
        
        {/* Akademik */}
        <Route path="akademik/nilai" element={<InputNilai />} />
        
        {/* Non Akademik */}
        <Route path="non-akademik/kehadiran" element={<InputKehadiran />} />
        <Route path="non-akademik/ekskul" element={<InputEkskul />} />
        <Route path="non-akademik/kokurikuler" element={<InputKokurikuler />} />
        <Route path="non-akademik/prestasi" element={<InputPrestasi />} />
        <Route path="non-akademik/mutasi" element={<InputMutasi />} />
        <Route path="non-akademik/catatan" element={<InputCatatan />} />
        
        {/* Laporan Cetak */}
        <Route path="laporan/dkn" element={<CetakDKN />} />
        <Route path="laporan/raport" element={<CetakRaport />} />
        <Route path="laporan/pts" element={<PlaceholderPage title="Cetak PTS" />} />
        <Route path="laporan/pas" element={<PlaceholderPage title="Cetak PAS / PSAS" />} />
        <Route path="laporan/leger" element={<PlaceholderPage title="Cetak Leger Nilai" />} />
        
        {/* Cetak Legacy */}
        <Route path="cetak/raport" element={<CetakRaport />} />
        
        {/* Settings */}
        <Route path="pengaturan/database" element={<ResetDatabase />} />

        {/* Bantuan */}
        <Route path="panduan" element={<Panduan />} />
      </Route>
    </Routes>
  );
}
