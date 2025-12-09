"use client";

import { useState, useMemo } from 'react';
import SeminarHasilTable from './SeminarHasilTable'; 
import type { SeminarHasil, Judul, Mahasiswa } from '@prisma/client'; 
import {  FiSearch, FiInbox } from 'react-icons/fi';

type SeminarHasilWithDetails = SeminarHasil & {
    judul: Judul & {
        mahasiswa: Mahasiswa;
    };
};

interface SeminarHasilVerificationClientPageProps { 
    initialSeminarHasil: SeminarHasilWithDetails[]; 
    jurusanName: string;
}

export default function SeminarHasilVerificationClientPage({ initialSeminarHasil, jurusanName }: SeminarHasilVerificationClientPageProps) { 
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

    const filteredSeminarHasil = useMemo(() => {
        const dateFiltered = initialSeminarHasil.filter(sh => { 
            const shDate = new Date(sh.tanggal);
            return shDate.getMonth() + 1 === filters.month && shDate.getFullYear() === filters.year;
        });

        if (!searchQuery) {
            return dateFiltered;
        }

        const lowercasedQuery = searchQuery.toLowerCase();
        return dateFiltered.filter(sh =>
            sh.judul.mahasiswa.nama.toLowerCase().includes(lowercasedQuery) ||
            sh.judul.mahasiswa.nim.toLowerCase().includes(lowercasedQuery) ||
            sh.judul.judul.toLowerCase().includes(lowercasedQuery)
        );
    }, [initialSeminarHasil, filters, searchQuery]); 

    const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
    const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

    return (
        <main className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Verifikasi Pengajuan Sidang Skripsi</h1> 
                <p className="mt-1 text-gray-600">Jurusan: <strong>{jurusanName}</strong></p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border">

                <div className="bg-[#325827] p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        
                        <div className='flex flex-col'>
                            <label htmlFor="month" className="text-white font-semibold text-sm">Bulan</label>
                            <select id="month" name="month" value={filters.month} onChange={handleFilterChange}
                                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 min-w-[120px]">
                                {monthOptions.map(opt => <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>)}
                            </select>
                        </div>
                        
                        <div className='flex flex-col'>
                            <label htmlFor="year" className="text-white font-semibold text-sm">Tahun</label>
                            <select id="year" name="year" value={filters.year} onChange={handleFilterChange}
                                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 min-w-[100px]">
                                {yearOptions.map(year => <option key={year} value={year} className="text-black">{year}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="relative self-end">
                        <input
                            type="text"
                            placeholder="Cari berdasarkan nama, NIM, atau judul"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                    </div>
                </div>

                {filteredSeminarHasil.length === 0 ? ( 
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 py-16">
                        <FiInbox className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Pengajuan Ditemukan</h3>
                        <p className="text-sm">Tidak ada pendaftaran seminar hasil yang cocok dengan filter Anda di jurusan {jurusanName}.</p> 
                    </div>
                ) : (
                   <SeminarHasilTable initialSeminarHasils={filteredSeminarHasil} />
                )}
            </div>
        </main>
    );
}