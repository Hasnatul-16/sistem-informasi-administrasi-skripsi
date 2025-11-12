"use client";

import { useState, useMemo } from 'react';
import SubmissionTable from './SubmissionTable'; 
import type { Judul, Mahasiswa, User } from '@prisma/client';
import { FiSearch } from 'react-icons/fi';

type SubmissionWithStudent = Judul & {
  student: Mahasiswa & { user: User };
};

interface VerificationClientPageProps {
  initialSubmissions: SubmissionWithStudent[];
  jurusanName: string;
}

export default function VerificationClientPage({ initialSubmissions, jurusanName }: VerificationClientPageProps) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState({
    month: currentMonth,
    year: currentYear,
  });
  
  const [searchQuery, setSearchQuery] = useState('');

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredSubmissions = useMemo(() => {
    const dateFiltered = initialSubmissions.filter(sub => {
      const subDate = new Date(sub.tanggal);
      return subDate.getMonth() + 1 === filters.month && subDate.getFullYear() === filters.year;
    });

    if (!searchQuery) {
      return dateFiltered;
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    return dateFiltered.filter(sub => 
      sub.student.nama.toLowerCase().includes(lowercasedQuery) ||
      sub.student.nim.toLowerCase().includes(lowercasedQuery) ||
      sub.judul.toLowerCase().includes(lowercasedQuery)
    );
  }, [initialSubmissions, filters, searchQuery]);

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Verifikasi Pengajuan</h1>
        <p className="mt-1 text-gray-600">Jurusan: <strong>{jurusanName}</strong></p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        
   
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                
                <div>
                    <label htmlFor="month" className="text-white font-semibold text-sm">Bulan</label>
                    <select id="month" name="month" value={filters.month} onChange={handleFilterChange} 
                            className="w-full mt-1 p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50">
                        {monthOptions.map(opt => <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>)}
                    </select>
                </div>
               
                <div>
                    <label htmlFor="year" className="text-white font-semibold text-sm">Tahun</label>
                    <select id="year" name="year" value={filters.year} onChange={handleFilterChange} 
                            className="w-full mt-1 p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50">
                        {yearOptions.map(year => <option key={year} value={year} className="text-black">{year}</option>)}
                    </select>
                </div>
            </div>

            {/* Kolom Pencarian */}
            <div className="relative self-end">
                <input 
                    type="text"
                    placeholder="Cari berdasarkan nama, nim, atau judul..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"/>
            </div>
        </div>
        
        <SubmissionTable initialSubmissions={filteredSubmissions} />
      </div>
    </main>
  );
}