"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Jurusan } from '@prisma/client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    FiEye, FiX, FiUsers, FiActivity, FiLoader,
    FiSearch, FiAlertTriangle, FiUser, FiSettings
} from 'react-icons/fi';

type DosenStat = {
    nama: string;
    nip: string;
    totalPengujiSempro: number;
    totalPengujiSemhas: number;
    totalPembimbing1: number;
    totalPembimbing2: number;
    totalBeban: number;
};

type RiwayatItem = {
    mahasiswa: string;
    nim: string;
    judul: string;
    tanggal: Date;
    role: string;
};
export type DosenPembimbingHistory = {
    namaDosen: string;
    nip: string;
    totalBimbingan: number;
    totalPembimbing1: number;
    totalPembimbing2: number;
    riwayat: RiwayatItem[];
};

interface DosenStatsClientProps {
    initialTahun: number;
    initialSemester: 'GANJIL' | 'GENAP';
    initialJurusan: Jurusan;
}


export default function PembimbingStatsClient({
    initialTahun,
    initialSemester,
    initialJurusan
}: DosenStatsClientProps) {
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [filters, setFilters] = useState({
        tahun: searchParams.get('tahun') || String(initialTahun),
        semester: (searchParams.get('semester') as 'GANJIL' | 'GENAP') || initialSemester,
        jurusan: (searchParams.get('jurusan') as Jurusan) || initialJurusan,
        search: searchParams.get('search') || '',
    });
    
    const [dosenStats, setDosenStats] = useState<DosenStat[]>([]);
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<DosenPembimbingHistory | null>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [selectedDosen, setSelectedDosen] = useState<DosenStat | null>(null);

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        const params = new URLSearchParams(searchParams.toString());
        params.set(name, value);
  
        if (name === 'search' && value === '') {
            params.delete('search');
        }
        router.push(`${pathname}?${params.toString()}`);
  
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const fetchTableData = useCallback(async () => {
        setIsTableLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                tahun: filters.tahun,
                semester: filters.semester,
                jurusan: filters.jurusan,
            });
            if (filters.search) {
                params.append('search', filters.search);
            }

            // API-nya sama, kita panggil /api/dosen
            const res = await fetch(`/api/dosen?${params.toString()}`);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.details || errorData.message || 'Gagal memuat data tabel dosen.');
            }

            const data: DosenStat[] = await res.json();
            setDosenStats(data);

        } catch (err: unknown) {
            console.error("Error fetching data:", err);
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data.');
            setDosenStats([]);
        } finally {
            setIsTableLoading(false);
        }
    }, [filters]);

    const handleOpenDetail = async (dosen: DosenStat) => {
        setIsModalOpen(true);
        setIsModalLoading(true);
        setSelectedDosen(dosen);
        setModalData(null);
        
        try {
            const params = new URLSearchParams({
                nip: dosen.nip,
                tahun: filters.tahun,
                semester: filters.semester,
                jurusan: filters.jurusan,
                role: 'pembimbing' 
            });

            const res = await fetch(`/api/dosen/riwayat?${params.toString()}`);
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.details || errorData.message || 'Gagal memuat detail riwayat dosen.');
            }

            const data: DosenPembimbingHistory = await res.json();
            setModalData(data);

        } catch (err: unknown) {
            console.error("Error fetching detail:", err);
            setModalData({
                namaDosen: `Error Dosen (${dosen.nip})`,
                nip: dosen.nip,
                totalBimbingan: 0, totalPembimbing1: 0, totalPembimbing2: 0,
                riwayat: [{mahasiswa: 'Error', nim: 'N/A', judul: `Gagal memuat: ${err instanceof Error ? err.message : 'Unknown error'}`, tanggal: new Date(), role: 'Error'}]
            });
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalData(null);
        setSelectedDosen(null);
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchTableData();
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [fetchTableData]);


    const formatDate = (date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('id-ID', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const renderSummaryCard = (title: string, value: number, color: string) => (
        <div className={`p-4 rounded-lg shadow-md ${color} flex flex-col justify-center items-center h-24`}>
            <p className="text-sm font-medium text-gray-700">{title}</p>
            <h3 className="text-3xl font-bold mt-1">{value}</h3>
        </div>
    );
    
    const RoleBadge = ({ role }: { role: string }) => {
        let color = 'bg-gray-100 text-gray-800';
        if (role.toLowerCase().includes('penguji')) {
            color = 'bg-indigo-100 text-indigo-800';
        } else if (role.toLowerCase().includes('pembimbing')) {
            color = 'bg-green-100 text-green-800';
        }
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
                {role}
            </span>
        );
    };

    const periodeSaatIni = `${filters.semester.charAt(0) + filters.semester.slice(1).toLowerCase()} ${filters.tahun}`;

    // --- RENDER ---
    return (
        <main className="space-y-4 sm:space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Daftar Dosen Pembimbing</h1>
            <p className="mt-0 text-sm sm:text-base text-gray-600">Menampilkan total dosen menjadi pembimbing skripsi.</p>
            
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border space-y-3 sm:space-y-4">
  
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-3 sm:p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex flex-col w-full sm:w-auto">
                            <label htmlFor="semester" className="text-xs sm:text-sm font-semibold text-white mb-1">
                                Periode Semester
                            </label>
                            <select
                                id="semester"
                                name="semester"
                                value={filters.semester}
                                onChange={handleFilterChange}
                                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 transition duration-150 appearance-none min-w-full sm:min-w-[120px] font-sans text-sm"
                            >
                                <option value="GANJIL" className='text-gray-800'>Ganjil</option>
                                <option value="GENAP" className='text-gray-800'>Genap</option>
                            </select>
                        </div>
                        <div className="flex flex-col w-full sm:w-auto">
                            <label htmlFor="tahun" className="text-xs sm:text-sm font-semibold text-white mb-1">
                                Tahun Akademik
                            </label>
                            <select
                                id="tahun"
                                name="tahun"
                                value={filters.tahun}
                                onChange={handleFilterChange}
                                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 transition duration-150 appearance-none min-w-full sm:min-w-[100px] font-sans text-sm"
                            >
                                {yearOptions.map(y => (
                                    <option key={y} value={y} className='text-gray-800'>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-auto sm:self-end">
                        <input
                            type="text"
                            name="search"
                            placeholder="Cari berdasarkan nama..."
                            value={filters.search}
                            onChange={handleFilterChange}
                            className="w-full sm:w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50 font-sans text-sm"
                        />
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 h-5 w-5" />
                    </div>
                </div>

                


                
                <div className="mt-4 sm:mt-6">
                    {isTableLoading ? (
                        <div className="text-center py-10 text-blue-500 flex flex-col items-center">
                            <FiLoader className="h-8 w-8 animate-spin" />
                            <p className="mt-2 text-sm">Memuat data...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3">
                            <FiAlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <p className='font-medium text-sm'>Error terjadi saat memuat data: {error}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <table className="min-w-full w-full bg-white border divide-y divide-gray-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                  
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left">
                                            <div className="flex items-center gap-1 sm:gap-2"><FiUsers size={14} className="text-blue-600" /><span>Dosen</span></div>
                                        </th>
                                       
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                                            <div className="flex items-center gap-1 sm:gap-2"><FiUser size={14} className="text-blue-600" /><span>Pembimbing 1</span></div>
                                        </th>
                                        
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                                            <div className="flex items-center gap-1 sm:gap-2"><FiUser size={14} className="text-blue-600" /><span>Pembimbing 2</span></div>
                                        </th>
                                        
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                                            <div className="flex items-center gap-1 sm:gap-2"><FiActivity size={14} className="text-blue-600" /><span>Total Bimbingan</span></div>
                                        </th>
                                      
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                                            <div className="flex items-center gap-1 sm:gap-2"><FiSettings size={14} className="text-blue-600" /><span>Aksi</span></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {dosenStats.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 sm:px-6 py-8 sm:py-10 text-center text-gray-500 text-sm">Tidak ada data dosen yang ditemukan pada periode ini.</td></tr>
                                    ) : (
                                        dosenStats.map((dosen) => (
                                            <tr key={dosen.nip} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-gray-800 text-xs sm:text-sm line-clamp-2">
                                                                {dosen.nama}
                                                            </span>
                                                            <span className="text-xs text-gray-600 hidden sm:inline">
                                                                NIP: {dosen.nip}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                               
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
                                                    {dosen.totalPembimbing1}
                                                </td>
                                                
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
                                                    {dosen.totalPembimbing2}
                                                </td>
                                                
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-bold whitespace-nowrap">
                                                    {dosen.totalPembimbing1 + dosen.totalPembimbing2}
                                                </td>
                                                
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleOpenDetail(dosen)}
                                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 font-semibold"
                                                        title="Lihat Detail Riwayat Pembimbing"
                                                    >
                                                        <FiEye size={14} /> <span className="hidden sm:inline">Lihat</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div> 

            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 transform transition-all animate-fade-in-scale">
                        
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Riwayat Pembimbing - {selectedDosen?.nama || 'Memuat...'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 text-gray-500 hover:text-gray-800">
                                <FiX className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            {isModalLoading || !modalData ? (
                                <div className="text-center py-10 text-indigo-500 flex flex-col items-center">
                                    <FiLoader className="h-8 w-8 animate-spin" />
                                    <p className="mt-2">Mengambil detail riwayat...</p>
                                </div>
                            ) : (
                                <>
                                   
                                    <div className="grid grid-cols-3 gap-4">
                                        {renderSummaryCard('Total Bimbingan', modalData.totalBimbingan, 'bg-purple-100 text-purple-800')}
                                        {renderSummaryCard('Total Pembimbing 1', modalData.totalPembimbing1, 'bg-green-100 text-green-800')}
                                        {renderSummaryCard('Total Pembimbing 2', modalData.totalPembimbing2, 'bg-teal-100 text-teal-800')}
                                    </div>

                                    <p className="text-sm font-semibold text-gray-600 pt-2">
                                        Riwayat di Periode Aktif: <span className='font-bold text-indigo-700'>{periodeSaatIni}</span> ({modalData.riwayat.length} entri)
                                    </p>
                                    
                              
                                    <div className="overflow-x-auto -mx-4 sm:mx-0 border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">Mahasiswa</th>
                                                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">Judul</th>
                                                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">Tanggal</th>
                                                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase">Role</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {modalData.riwayat.length > 0 ? (
                                                    modalData.riwayat.map((item, index) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="line-clamp-1">{item.mahasiswa}</span>
                                                                    <span className="text-gray-500 text-xs hidden sm:inline">({item.nim})</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 max-w-xs line-clamp-2" title={item.judul}>
                                                                {item.judul}
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                                                {formatDate(item.tanggal)}
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                                                                <RoleBadge role={item.role} />
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                                                            Tidak ada riwayat bimbingan pada periode akademik ini.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}