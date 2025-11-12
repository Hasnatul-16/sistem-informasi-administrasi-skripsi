"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FiDownload, FiArchive } from 'react-icons/fi';
import type { Judul, Mahasiswa } from '@prisma/client';

type SubmissionWithStudent = Judul & {
  student: Mahasiswa;
};

interface ArsipTableProps {
  initialSubmissions: SubmissionWithStudent[];
}

export default function ArsipTable({ initialSubmissions }: ArsipTableProps) {
  const [submissions] = useState(initialSubmissions);
  const [filter, setFilter] = useState({ year: '', month: '', day: '' });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredSubmissions = useMemo(() => {
    if (!filter.year && !filter.month && !filter.day) {
      return submissions;
    }
    return submissions.filter(sub => {
      const submissionDate = new Date(sub.tanggal);
      const yearMatch = filter.year ? submissionDate.getFullYear() === parseInt(filter.year) : true;
      const monthMatch = filter.month ? (submissionDate.getMonth() + 1) === parseInt(filter.month) : true;
      const dayMatch = filter.day ? submissionDate.getDate() === parseInt(filter.day) : true;
      return yearMatch && monthMatch && dayMatch;
    });
  }, [submissions, filter]);

  const resetFilter = () => {
    setFilter({ year: '', month: '', day: '' });
  };

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h2 className="text-xl font-semibold mb-4">Arsip Pengajuan Skripsi</h2>
      
  
      <div className="flex flex-wrap items-end gap-4 p-4 mb-4 bg-gray-50 rounded-lg border">
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Berdasarkan Tanggal Pengajuan</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              name="day" 
              value={filter.day}
              onChange={handleFilterChange}
              placeholder="Hari (1-31)" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <input 
              type="number" 
              name="month" 
              value={filter.month}
              onChange={handleFilterChange}
              placeholder="Bulan (1-12)" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <input 
              type="number" 
              name="year" 
              value={filter.year}
              onChange={handleFilterChange}
              placeholder="Tahun (e.g., 2024)" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <button 
          onClick={resetFilter} 
          className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300"
        >
          Reset
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahasiswa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl. Pengajuan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SK Pembimbing</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seminar Proposal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seminar Hasil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSubmissions.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-gray-500">Data tidak ditemukan.</td></tr>
            ) : (
              filteredSubmissions.map(sub => (
                <tr key={sub.id}>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-900">{sub.student.nama}</p>
                    <p className="text-sm text-gray-500">{sub.student.nim}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{formatDate(sub.tanggal)}</td>
                  <td className="px-4 py-4">
                    {sub.status === 'DISETUJUI' ? (
                      <Link href={`/dashboard/admin/sk/${sub.id}`} className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline font-semibold">
                        <FiDownload /> Lihat SK
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">Belum Terbit</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 font-medium disabled:opacity-50" disabled={sub.status !== 'DISETUJUI'}>
                      <FiArchive/> Arsipkan
                    </button>
                  </td>
                   <td className="px-4 py-4">
                    <button className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 font-medium disabled:opacity-50" disabled={sub.status !== 'DISETUJUI'}>
                      <FiArchive/> Arsipkan
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}