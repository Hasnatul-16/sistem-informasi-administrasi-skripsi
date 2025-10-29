// app/dashboard/admin/proposal/[jurusan]/ProposalVerificationClientPage.tsx
"use client";

import { useState, useMemo } from 'react';
import ProposalTable from './ProposalTable'; // Import ProposalTable
import type { Proposal, Judul, Mahasiswa, Status } from '@prisma/client';
import { FiFilter, FiSearch, FiInbox } from 'react-icons/fi';

// Tipe data gabungan yang sama seperti di ProposalTable
type ProposalWithDetails = Proposal & {
    judul: Judul & {
        mahasiswa: Mahasiswa;
    };
};

interface ProposalVerificationClientPageProps {
  initialProposals: ProposalWithDetails[];
  jurusanName: string;
}

export default function ProposalVerificationClientPage({ initialProposals, jurusanName }: ProposalVerificationClientPageProps) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // State Filter Bulan/Tahun
  const [filters, setFilters] = useState({
    month: currentMonth,
    year: currentYear,
  });
  
  // State Query Pencarian
  const [searchQuery, setSearchQuery] = useState('');

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Logika Filter dan Pencarian
  const filteredProposals = useMemo(() => {
    // 1. Filter berdasarkan bulan dan tahun
    const dateFiltered = initialProposals.filter(prop => {
      const propDate = new Date(prop.tanggal);
      return propDate.getMonth() + 1 === filters.month && propDate.getFullYear() === filters.year;
    });

    if (!searchQuery) {
      return dateFiltered;
    }

    // 2. Filter berdasarkan query pencarian (nama, nim, judul)
    const lowercasedQuery = searchQuery.toLowerCase();
    return dateFiltered.filter(prop => 
      prop.judul.mahasiswa.nama.toLowerCase().includes(lowercasedQuery) ||
      prop.judul.mahasiswa.nim.toLowerCase().includes(lowercasedQuery) ||
      prop.judul.judul.toLowerCase().includes(lowercasedQuery)
    );
  }, [initialProposals, filters, searchQuery]);

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <main className="space-y-6">
      {/* Header Halaman (diubah agar lebih mirip Judul Verifikasi) */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Verifikasi Pengajuan seminar proposal</h1>
        <p className="mt-1 text-gray-600">Jurusan: <strong>{jurusanName}</strong></p>
      </div>

      {/* Filter Bar dengan Desain Gradient */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                {/* Filter Bulan */}
                <div className='flex flex-col'>
                    <label htmlFor="month" className="text-white font-semibold text-sm">Bulan</label>
                    <select id="month" name="month" value={filters.month} onChange={handleFilterChange} 
                            className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 min-w-[120px]">
                        {monthOptions.map(opt => <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>)}
                    </select>
                </div>
                {/* Filter Tahun */}
                <div className='flex flex-col'>
                    <label htmlFor="year" className="text-white font-semibold text-sm">Tahun</label>
                    <select id="year" name="year" value={filters.year} onChange={handleFilterChange} 
                            className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 min-w-[100px]">
                        {yearOptions.map(year => <option key={year} value={year} className="text-black">{year}</option>)}
                    </select>
                </div>
                {/* Tombol Filter (hanya visual) */}
                <div className="self-end pt-5">
                    <button className="bg-white text-blue-600 font-bold py-2 px-4 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2">
                        <FiFilter/> Filter
                    </button>
                </div>
            </div>

            {/* Kolom Pencarian */}
            <div className="relative self-end">
                <input 
                    type="text"
                    placeholder="Cari berdasarkan nama..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"/>
            </div>
        </div>
        
        {/* Menggunakan ProposalTable yang dimodifikasi */}
        {filteredProposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 py-16">
            <FiInbox className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Pengajuan Ditemukan</h3>
            <p className="text-sm">Tidak ada pendaftaran seminar proposal yang cocok dengan filter Anda di jurusan {jurusanName}.</p>
          </div>
        ) : (
          <ProposalTable initialProposals={filteredProposals} />
        )}
      </div>
    </main>
  );
}