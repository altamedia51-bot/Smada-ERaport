export type Role = 'admin' | 'teacher' | 'homeroom';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
  major: string;
  status: 'active' | 'mutated' | 'graduated';
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  phone: string;
  subjects: string[]; // Subject IDs
}

export interface ClassRoom {
  id: string;
  name: string;
  level: 'X' | 'XI' | 'XII';
  major: string;
  homeroomId: string;
  studentCount: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  groupType: 'A' | 'B' | 'C';
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  dailyScore: number;
  taskScore: number;
  ptsScore: number;
  pasScore: number;
  finalScore: number;
  description: string;
}

// Initial Mock Data
export const mockUsers: User[] = [
  { id: 'u1', name: 'Super Admin', username: 'admin', role: 'admin' },
  { id: 'u2', name: 'Budi Santoso, S.Pd', username: 'budi', role: 'teacher' },
  { id: 'u3', name: 'Siti Aminah, M.Pd', username: 'siti', role: 'homeroom' },
];

export const mockTeachers: Teacher[] = [
  { id: 't1', nip: '198001012005011001', name: 'Budi Santoso, S.Pd', phone: '08123456789', subjects: ['s1', 's2'] },
  { id: 't2', nip: '198202022006022002', name: 'Siti Aminah, M.Pd', phone: '08987654321', subjects: ['s3'] },
];

export const mockSubjects: Subject[] = [
  { id: 's1', code: 'MAT-101', name: 'Matematika', groupType: 'A' },
  { id: 's2', code: 'FIS-101', name: 'Fisika', groupType: 'C' },
  { id: 's3', code: 'BIND-101', name: 'Bahasa Indonesia', groupType: 'A' },
];

export const mockClasses: ClassRoom[] = [
  { id: 'c1', name: 'X IPA 1', level: 'X', major: 'MIPA', homeroomId: 't2', studentCount: 32 },
  { id: 'c2', name: 'XI IPS 1', level: 'XI', major: 'IPS', homeroomId: '', studentCount: 30 },
];

export const mockStudents: Student[] = [
  { id: 'st1', nis: '1001', nisn: '001002003', name: 'Agus Salim', gender: 'L', classId: 'c1', major: 'MIPA', status: 'active' },
  { id: 'st2', nis: '1002', nisn: '001002004', name: 'Ayu Lestari', gender: 'P', classId: 'c1', major: 'MIPA', status: 'active' },
  { id: 'st3', nis: '1003', nisn: '001002005', name: 'Bagus Setyawan', gender: 'L', classId: 'c2', major: 'IPS', status: 'active' },
];

export const mockGrades: Grade[] = [
  { id: 'g1', studentId: 'st1', subjectId: 's1', dailyScore: 85, taskScore: 80, ptsScore: 78, pasScore: 85, finalScore: 82.5, description: 'Sangat baik dalam pemahaman konsep' },
];

// Mock API Functions
export const api = {
  getDashboardStats: async () => ({
    totalStudentsX: 32,
    totalStudentsXI: 30,
    totalStudentsXII: 28,
    totalTeachers: 45,
    totalMajors: 3,
    totalClasses: 12,
    totalSubjects: 24,
  }),
};
