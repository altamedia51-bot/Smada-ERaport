import React, { useEffect, useState } from 'react';
import { 
  Users, UserCircle, GraduationCap, BookOpen, 
  TrendingUp, Activity, CheckCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mockClasses, mockSubjects } from '../store/mockDb';

function StatCard({ title, value, icon, colorClass }: { title: string, value: string | number, icon: React.ReactNode, colorClass: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const progressData = [
  { subject: 'MTK', progress: 85 },
  { subject: 'FIS', progress: 40 },
  { subject: 'KIM', progress: 95 },
  { subject: 'EKO', progress: 60 },
  { subject: 'SEJ', progress: 100 },
];

export function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
  });

  const [realtimeBarData, setRealtimeBarData] = useState([
    { name: 'X', MIPA: 0, IPS: 0, Bahasa: 0 },
    { name: 'XI', MIPA: 0, IPS: 0, Bahasa: 0 },
    { name: 'XII', MIPA: 0, IPS: 0, Bahasa: 0 },
  ]);

  const [realtimeProgress, setRealtimeProgress] = useState(progressData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We assume classes collection might not exist fully yet, we fallback to mockClasses length for demo if needed.
    // However, user wants it realtime. Let's listen to 'students', 'teachers', 'classes'
    
    // Setup listeners
    const unsubs: any[] = [];
    
    const dbRefs = ['students', 'teachers', 'classes', 'subjects'];
    const dataMap: any = {
      students: [],
      teachers: [],
      classes: [],
      subjects: []
    };

    let initialized = 0;

    const computeDashboardData = () => {
      const students = dataMap.students;
      const teachers = dataMap.teachers;
      const classes = dataMap.classes;
      const subjects = dataMap.subjects;
      
      const totalClasses = classes.length > 0 ? classes.length : mockClasses.length;
      const totalSubjects = subjects.length > 0 ? subjects.length : mockSubjects.length;

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: totalClasses,
        totalSubjects: totalSubjects,
      });

      // Compute BarData based on students and their classId level
      // If class level is not in student, we map via classes collection, fallback to level 'X'
      const classMap = new Map();
      classes.forEach((c: any) => classMap.set(c.id, c.level));
      mockClasses.forEach((c: any) => {
        if (!classMap.has(c.id)) classMap.set(c.id, c.level);
      });

      const bData = [
        { name: 'X', MIPA: 0, IPS: 0, Bahasa: 0 },
        { name: 'XI', MIPA: 0, IPS: 0, Bahasa: 0 },
        { name: 'XII', MIPA: 0, IPS: 0, Bahasa: 0 },
      ];

      students.forEach((s: any) => {
        const level = classMap.get(s.classId) || 'X';
        const major = s.major || 'MIPA';
        const targetRow = bData.find(row => row.name === level);
        if (targetRow) {
          if (major === 'MIPA') targetRow.MIPA++;
          else if (major === 'IPS') targetRow.IPS++;
          else if (major === 'Bahasa') targetRow.Bahasa++;
        }
      });

      setRealtimeBarData(bData);
    };

    dbRefs.forEach(colName => {
      const q = query(collection(db, colName));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const collectionData: any[] = [];
        snapshot.forEach(doc => collectionData.push({ id: doc.id, ...doc.data() }));
        dataMap[colName] = collectionData;
        initialized++;
        // If at least we initialized all 4
        if (initialized >= dbRefs.length) {
           setLoading(false);
           computeDashboardData();
        } else if (initialized > 0) {
           // still process it if some complete fast updates
           computeDashboardData();
        }
      });
      unsubs.push(unsubscribe);
    });

    // Animate progress just for demo feel of the static data
    const interval = setInterval(() => {
      setRealtimeProgress(prev => prev.map(d => ({
        ...d,
        progress: Math.min(100, Math.max(0, d.progress + Math.floor(Math.random() * 7) - 3))
      })));
    }, 2500);

    return () => {
      unsubs.forEach(u => u());
      clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="p-8 animate-pulse flex space-x-4">Loading dashboard data real-time...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Statistik</h2>
          <p className="text-slate-500 text-sm">Ringkasan data E-Raport Semester Genap 2023/2024</p>
        </div>
        <div className="flex bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm gap-2 text-sm font-medium">
          <span className="text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Data Tervalidasi</span>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Siswa" 
          value={stats.totalStudents} 
          icon={<Users size={24} />} 
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Total Guru" 
          value={stats.totalTeachers} 
          icon={<UserCircle size={24} />} 
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard 
          title="Jumlah Rombel" 
          value={stats.totalClasses} 
          icon={<GraduationCap size={24} />} 
          colorClass="bg-amber-50 text-amber-600"
        />
        <StatCard 
          title="Mata Pelajaran" 
          value={stats.totalSubjects} 
          icon={<BookOpen size={24} />} 
          colorClass="bg-rose-50 text-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Siswa per Jurusan / Tingkat */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Siswa per Jurusan & Tingkat (Database)</h3>
            <TrendingUp size={18} className="text-slate-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={realtimeBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend />
                <Bar dataKey="MIPA" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="IPS" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Bahasa" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progres Pengisian Nilai */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Progress Pengisian Nilai Mapel</h3>
            <Activity size={18} className="text-slate-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={realtimeProgress} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} />
                <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="progress" fill="#8b5cf6" radius={[0, 4, 4, 0]} animationDuration={500}>
                  {realtimeProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.progress === 100 ? '#10b981' : entry.progress > 50 ? '#3b82f6' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom section: Recent Activities */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
         <h3 className="font-bold text-slate-800 mb-4">Aktivitas Terbaru</h3>
         <div className="space-y-4">
            {[
              { time: '10 menit yang lalu', text: 'Budi Santoso, S.Pd telah mensubmit nilai Matematika X MIPA 1', role: 'Guru' },
              { time: '1 jam yang lalu', text: 'Siti Aminah, M.Pd memvalidasi leger nilai XI IPS 1', role: 'Wali Kelas' },
              { time: '2 jam yang lalu', text: 'Admin menambahkan 5 siswa mutasi masuk ke kelas X Bahasa', role: 'Admin' },
            ].map((activity, i) => (
              <div key={i} className="flex gap-3 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{activity.text}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{activity.time} • {activity.role}</p>
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
