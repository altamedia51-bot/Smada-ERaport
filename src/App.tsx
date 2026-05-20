import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/auth/Login';

import { DataSiswa, DataGuru, DataKelas, DataAdmin } from './pages/master/MasterPages';
import { InputNilai, InputKehadiran, CetakRaport } from './pages/academic/AcademicPages';

import { Panduan } from './pages/Panduan';

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
        <Route path="master/siswa" element={<DataSiswa />} />
        <Route path="master/guru" element={<DataGuru />} />
        <Route path="master/kelas" element={<DataKelas />} />
        <Route path="master/admin" element={<DataAdmin />} />
        
        {/* Akademik */}
        <Route path="akademik/nilai" element={<InputNilai />} />
        
        {/* Non Akademik */}
        <Route path="non-akademik/kehadiran" element={<InputKehadiran />} />
        
        {/* Cetak */}
        <Route path="cetak/raport" element={<CetakRaport />} />
        
        {/* Bantuan */}
        <Route path="panduan" element={<Panduan />} />
      </Route>
    </Routes>
  );
}
