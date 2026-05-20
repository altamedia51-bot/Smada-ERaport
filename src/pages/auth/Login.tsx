import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin();
    } else {
      setError('Username atau password tidak valid');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex items-center justify-center p-4 font-sans text-slate-700">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#1e293b] p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xl mb-4">
              ER
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">E-Raport KM</h1>
            <p className="text-slate-400 text-sm">Sistem Manajemen Nilai Akademik</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  placeholder="Masukkan username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Ingat Saya
                </label>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors mt-2"
              >
                Masuk ke Dasbor
              </button>
            </form>
            
          </div>
        </div>
      </div>
    </div>
  );
}
