import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, GraduationCap, 
  Settings, LogOut, Menu, X, CheckSquare, Award, Printer, UserCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { mockUsers } from '../../store/mockDb';

export function DashboardLayout({ onLogout }: { onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = mockUsers[0]; // Simulate Admin login

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { type: 'header', name: 'MASTER DATA' },
    { name: 'Data Siswa', path: '/master/siswa', icon: <Users size={20} /> },
    { name: 'Data Guru', path: '/master/guru', icon: <UserCircle size={20} /> },
    { name: 'Data Kelas', path: '/master/kelas', icon: <GraduationCap size={20} /> },
    { name: 'Data Admin', path: '/master/admin', icon: <Settings size={20} /> },
    { type: 'header', name: 'AKADEMIK' },
    { name: 'Input Nilai', path: '/akademik/nilai', icon: <CheckSquare size={20} /> },
    { type: 'header', name: 'NON AKADEMIK' },
    { name: 'Kehadiran & Sikap', path: '/non-akademik/kehadiran', icon: <Award size={20} /> },
    { type: 'header', name: 'LAPORAN' },
    { name: 'Cetak Raport', path: '/cetak/raport', icon: <Printer size={20} /> },
    { type: 'header', name: 'BANTUAN' },
    { name: 'Panduan', path: '/panduan', icon: <BookOpen size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#f4f7fa] text-slate-700 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 bg-[#1e293b] flex-shrink-0 text-white w-64 transition-transform duration-300 ease-in-out z-20 flex flex-col print:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">ER</div>
          <span className="text-white font-semibold text-lg tracking-tight">E-Raport KM</span>
          <button className="lg:hidden text-slate-400 ml-auto" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <nav className="space-y-1 px-4">
            {navItems.map((item, idx) => {
              if (item.type === 'header') {
                return (
                  <div key={idx} className="text-xs font-bold text-slate-500 uppercase px-3 py-2 mt-4 tracking-wider">
                    {item.name}
                  </div>
                );
              }
              return (
                <NavLink
                  key={idx}
                  to={item.path!}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm",
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-400 hover:bg-slate-800 transition-colors"
                  )}
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 mt-auto border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-600 border-2 border-blue-500 flex items-center justify-center font-bold text-white uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        "lg:ml-64 print:ml-0"
      )}>
        {/* Navbar Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex flex-shrink-0 items-center justify-between px-4 lg:px-8 z-10 print:hidden">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-700" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Dashboard Overview</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-sm text-right hidden sm:flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wider">Tahun Ajaran</span>
               <input 
                 type="text"
                 defaultValue="2023/2024"
                 className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm placeholder-slate-400"
                 placeholder="YYYY/YYYY"
               />
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 print:p-0">
          <div className="max-w-7xl mx-auto print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
