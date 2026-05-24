import React from 'react';
import { Construction } from 'lucide-react';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-sm border border-slate-200 p-12 min-h-[60vh]">
      <div className="bg-blue-50 p-4 rounded-full mb-6">
        <Construction className="w-12 h-12 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-md text-center">
        Modul ini sedang dalam tahap pengembangan. Fitur {title.toLowerCase()} akan segera tersedia.
      </p>
    </div>
  );
}
