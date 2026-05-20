import React from 'react';
import { BookOpen, FileText, CheckCircle, Upload } from 'lucide-react';

export function Panduan() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-slate-800">Panduan Penggunaan Aplikasi</h1>
        <p className="text-slate-500 text-sm mt-1">Petunjuk lengkap cara menggunakan E-Raport Sekolah</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <BookOpen size={100} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="text-emerald-500" size={20} />
              Cara Import Data Siswa / Guru
            </h2>
            <div className="space-y-4 text-slate-600 text-sm">
              <p>
                Untuk mempercepat entri data, Anda dapat menggunakan fitur Import Excel. Berikut adalah langkah-langkahnya:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Buka menu <strong>Data Siswa</strong> atau <strong>Data Guru</strong>.</li>
                <li>Klik tombol <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"><FileText size={14}/> Template Excel</span> untuk mengunduh format standar yang didukung oleh sistem.</li>
                <li>Buka file Excel yang telah diunduh, lalu isi data sesuai dengan kolom yang tersedia. Pastikan format kolom tidak diubah (terutama baris pertama yang berisi nama kolom).</li>
                <li>Simpan file Excel tersebut (format .xlsx atau .xls).</li>
                <li>Kembali ke aplikasi, klik tombol <span className="inline-flex items-center gap-1 font-medium text-white bg-emerald-600 px-2 py-0.5 rounded shadow-sm"><Upload size={14}/> Import Excel</span>.</li>
                <li>Pilih atau tarik (drag-and-drop) file Excel yang sudah diisi ke dalam area unggahan yang muncul.</li>
                <li>Klik <strong>Proses Import</strong>. Sistem akan membaca data dan langsung menyimpannya ke database.</li>
              </ol>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="text-blue-500" size={20} />
              Alur Pengisian Raport
            </h2>
            <div className="space-y-4 text-slate-600 text-sm">
              <p>
                Alur kerja standar dalam pengisian nilai raport di akhir semester:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5">1</div>
                  <div>
                    <strong className="text-slate-800 block">Setup Data Master</strong>
                    Pastikan data Siswa, Guru, dan Kelas sudah lengkap dan valid.
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5">2</div>
                  <div>
                    <strong className="text-slate-800 block">Input Nilai Akademik</strong>
                    Guru mata pelajaran memasukkan nilai tiap siswa per kelas melalui menu <strong>Input Nilai</strong>.
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5">3</div>
                  <div>
                    <strong className="text-slate-800 block">Input Kehadiran & Sikap</strong>
                    Wali Kelas memasukkan absensi, catatan wali kelas, dan nilai sikap melalui menu <strong>Kehadiran & Sikap</strong>.
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5">4</div>
                  <div>
                    <strong className="text-slate-800 block">Cetak Raport</strong>
                    Setelah seluruh nilai terkumpul, wali kelas atau admin dapat mencetak raport melalui menu <strong>Cetak Raport</strong>.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Butuh Bantuan?</h3>
            <p className="text-sm text-slate-600 mb-4">Jika Anda mengalami kesulitan teknis atau mendapati error (bug), silakan hubungi tim administrator IT sekolah.</p>
            <div className="text-sm font-medium text-slate-800 bg-white p-3 rounded-lg border border-slate-200 inline-block w-full text-center">
              IT Support: 0812-3456-7890
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
