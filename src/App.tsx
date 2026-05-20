import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/auth/Login';

import { DataSiswa, DataGuru, DataKelas } from './pages/master/MasterPages';
import { InputNilai, InputKehadiran, CetakRaport } from './pages/academic/AcademicPages';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout onLogout={() => setIsAuthenticated(false)} />}>
        <Route index element={<Dashboard />} />
        
        {/* Master Data */}
        <Route path="master/siswa" element={<DataSiswa />} />
        <Route path="master/guru" element={<DataGuru />} />
        <Route path="master/kelas" element={<DataKelas />} />
        
        {/* Akademik */}
        <Route path="akademik/nilai" element={<InputNilai />} />
        
        {/* Non Akademik */}
        <Route path="non-akademik/kehadiran" element={<InputKehadiran />} />
        
        {/* Cetak */}
        <Route path="cetak/raport" element={<CetakRaport />} />
      </Route>
    </Routes>
  );
}
