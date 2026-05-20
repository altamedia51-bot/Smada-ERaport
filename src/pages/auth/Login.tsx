import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      // Auto register for demo environment if the user does not exist
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-login-credentials') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          onLogin();
        } catch (createErr: any) {
          if (createErr.code === 'auth/operation-not-allowed') {
            setError('Email/Password Sign-in belum diaktifkan di Firebase Console. Silakan buka Firebase Console > Authentication > Sign-in method, dan aktifkan Email/Password.');
          } else if (createErr.code === 'auth/email-already-in-use') {
            setError('Password salah. Silakan periksa kembali password Anda.');
          } else {
            console.error(createErr);
            setError('Gagal membuat akun admin: ' + createErr.message);
          }
        }
      } else {
        console.error(err);
        setError(err.message || 'Gagal login. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal login menggunakan Google. Silakan coba lagi.');
    } finally {
      setLoading(false);
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
            <form onSubmit={handleEmailLogin} className="space-y-5">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  placeholder="admin@sekolah.com"
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

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors mt-2 disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Masuk ke Dasbor'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Masuk dengan Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
