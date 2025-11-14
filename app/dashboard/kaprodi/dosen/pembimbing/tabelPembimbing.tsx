"use client";

import { useState, useEffect } from 'react';
import type { Jurusan } from '@prisma/client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// Impor semua ikon yang dibutuhkan dari CDN
import {
    FiEye, FiX, FiUsers, FiActivity, FiLoader,
    FiSearch, FiAlertTriangle, FiHash, FiUser, FiSettings
} from 'react-icons/fi';

// --- Tipe Data ---

// Tipe data dari API /api/dosen
type DosenStat = {
    nama: string;
    nip: string;
    totalPengujiSempro: number;
    totalPengujiSemhas: number;
    totalPembimbing1: number;
    totalPembimbing2: number;
    totalBeban: number;
};

// Tipe Riwayat (Umum)
type RiwayatItem = {
    mahasiswa: string;
    nim: string;
    judul: string;
    tanggal: Date;
    role: string;
};

// Tipe Modal Riwayat PEMBIMBING
export type DosenPembimbingHistory = {
    namaDosen: string;
    nip: string;
    totalBimbingan: number;
    totalPembimbing1: number;
    totalPembimbing2: number;
    riwayat: RiwayatItem[];
};

// Tipe untuk Props dari page.tsx
interface DosenStatsClientProps {
    initialTahun: number;
    initialSemester: 'GANJIL' | 'GENAP';
    initialJurusan: Jurusan;
}



// --- Komponen Utama (All-in-One) ---

export default function PembimbingStatsClient({
    initialTahun,
    initialSemester,
    initialJurusan
}: DosenStatsClientProps) {
    
    // --- STATE ---
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // State untuk Filter (diambil dari URL atau initial props)
    const [filters, setFilters] = useState({
        tahun: searchParams.get('tahun') || String(initialTahun),
        semester: (searchParams.get('semester') as 'GANJIL' | 'GENAP') || initialSemester,
        jurusan: (searchParams.get('jurusan') as Jurusan) || initialJurusan,
        search: searchParams.get('search') || '',
    });
    
    // State untuk Data Tabel Utama
    const [dosenStats, setDosenStats] = useState<DosenStat[]>([]);
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // State untuk Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<DosenPembimbingHistory | null>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [selectedDosen, setSelectedDosen] = useState<DosenStat | null>(null);

    // Opsi untuk dropdown tahun
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

    // --- HANDLER ---

    // Handler untuk perubahan filter (Tahun, Semester, Search)
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Update URL
        const params = new URLSearchParams(searchParams.toString());
        params.set(name, value);
        // Hapus query 'search' jika kosong
        if (name === 'search' && value === '') {
            params.delete('search');
        }
        router.push(`${pathname}?${params.toString()}`);
        
        // Update state lokal
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };




    // --- LOGIKA FETCH DATA ---

    // Fungsi untuk mengambil data tabel utama
    const fetchTableData = async () => {
        setIsTableLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                tahun: filters.tahun,
                semester: filters.semester,
                jurusan: filters.jurusan,
            });
            // Hanya tambahkan search jika tidak kosong
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
    };

    // Fungsi untuk membuka modal dan mengambil data detail
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
                role: 'pembimbing' // --- PENTING: Minta data PEMBIMBING ---
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
            // Menampilkan error di modal
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

    // Fungsi untuk menutup modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalData(null);
        setSelectedDosen(null);
    };

    // Ambil data tabel utama setiap kali filter (dari state) berubah
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchTableData();
        }, 500); // 500ms delay

        return () => {
            clearTimeout(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]); 


    // --- Helper Function untuk Modal ---
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
        <main className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Daftar Dosen Pembimbing</h1>
            <p className="mt-0 text-gray-600">Menampilkan total dosen menjadi pembimbing skripsi.</p>
            
            <div className="bg-white p-6 rounded-lg shadow-md border space-y-4">
                
                {/* --- 1. BAGIAN FILTER (TIDAK BERUBAH) --- */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <label htmlFor="semester" className="text-sm font-semibold text-white mb-1">
                                Periode Semester
                            </label>
                            <select
                                id="semester"
                                name="semester"
                                value={filters.semester}
                                onChange={handleFilterChange}
                                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 transition duration-150 appearance-none min-w-[120px] font-sans"
                            >
                                <option value="GANJIL" className='text-gray-800'>Ganjil</option>
                                <option value="GENAP" className='text-gray-800'>Genap</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="tahun" className="text-sm font-semibold text-white mb-1">
                                Tahun Akademik
                            </label>
                            <select
                                id="tahun"
                                name="tahun"
                                value={filters.tahun}
                                onChange={handleFilterChange}
                                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 transition duration-150 appearance-none min-w-[100px] font-sans"
                            >
                                {yearOptions.map(y => (
                                    <option key={y} value={y} className='text-gray-800'>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="relative self-end">
                        <input
                            type="text"
                            name="search"
                            placeholder="Cari berdasarkan nama..."
                            value={filters.search}
                            onChange={handleFilterChange}
                            className="w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50 font-sans"
                        />
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 h-5 w-5" />
                    </div>
                </div>

                


                
                <div className="mt-6">
                    {isTableLoading ? (
                        <div className="text-center py-10 text-blue-500 flex flex-col items-center">
                            <FiLoader className="h-8 w-8 animate-spin" />
                            <p className="mt-2">Memuat data...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3">
                            <FiAlertTriangle className="h-5 w-5" />
                            <p className='font-medium'>Error terjadi saat memuat data: {error}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full w-full bg-white border divide-y divide-gray-200 table-fixed">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {/* Header Dosen */}
                                        <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[35%]">
                                            <div className="flex items-center gap-2"><FiUsers size={16} className="text-blue-600" /><span>Dosen</span></div>
                                        </th>
                                        {/* Header Pembimbing 1 */}
                                        <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[20%]">
                                            <div className="flex items-center gap-2"><FiUser size={16} className="text-blue-600" /><span>Pembimbing 1</span></div>
                                        </th>
                                        {/* Header Pembimbing 2 */}
                                        <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[20%]">
                                            <div className="flex items-center gap-2"><FiUser size={16} className="text-blue-600" /><span>Pembimbing 2</span></div>
                                        </th>
                                        {/* Header Total Bimbingan */}
                                        <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]">
                                            <div className="flex items-center gap-2"><FiActivity size={16} className="text-blue-600" /><span>Total Bimbingan</span></div>
                                        </th>
                                        {/* Header Aksi */}
                                        <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[10%]">
                                            <div className="flex items-center gap-2"><FiSettings size={16} className="text-blue-600" /><span>Aksi</span></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {dosenStats.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Tidak ada data dosen yang ditemukan pada periode ini.</td></tr>
                                    ) : (
                                        dosenStats.map((dosen) => (
                                            <tr key={dosen.nip} className="hover:bg-gray-50 transition-colors">
                                                {/* Kolom Dosen (Styling seperti Mahasiswa) */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <FiUser size={14} className="text-blue-600" />
                                                            <span className="text-sm text-gray-700">
                                                                <span className="font-semibold">Nama: </span>
                                                                {dosen.nama}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <FiHash size={14} className="text-blue-600" />
                                                            <span className="text-sm text-gray-700">
                                                                <span className="font-semibold">NIP: </span>
                                                                {dosen.nip}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Kolom Pembimbing 1 */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                    {dosen.totalPembimbing1} kali
                                                </td>
                                                {/* Kolom Pembimbing 2 */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                    {dosen.totalPembimbing2} kali
                                                </td>
                                                {/* Kolom Total Bimbingan */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                                    {dosen.totalPembimbing1 + dosen.totalPembimbing2} kali
                                                </td>
                                                {/* Kolom Aksi */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleOpenDetail(dosen)}
                                                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-900 font-semibold"
                                                        title="Lihat Detail Riwayat Pembimbing"
                                                    >
                                                        <FiEye className="h-4 w-4" /> Lihat
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

            {/* --- 3. BAGIAN MODAL (KHUSUS PEMBIMBING) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 transform transition-all animate-fade-in-scale">
                        
                        {/* Header Modal */}
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Riwayat Pembimbing - {selectedDosen?.nama || 'Memuat...'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 text-gray-500 hover:text-gray-800">
                                <FiX className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Body Konten Modal */}
                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            {isModalLoading || !modalData ? (
                                <div className="text-center py-10 text-indigo-500 flex flex-col items-center">
                                    <FiLoader className="h-8 w-8 animate-spin" />
                                    <p className="mt-2">Mengambil detail riwayat...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {renderSummaryCard('Total Bimbingan', modalData.totalBimbingan, 'bg-purple-100 text-purple-800')}
                                        {renderSummaryCard('Total Pembimbing 1', modalData.totalPembimbing1, 'bg-green-100 text-green-800')}
                                        {renderSummaryCard('Total Pembimbing 2', modalData.totalPembimbing2, 'bg-teal-100 text-teal-800')}
                                    </div>

                                    <p className="text-sm font-semibold text-gray-600 pt-2">
                                        Riwayat di Periode Aktif: <span className='font-bold text-indigo-700'>{periodeSaatIni}</span> ({modalData.riwayat.length} entri)
                                    </p>
                                    
                                    {/* Tabel Riwayat */}
                                    <div className="overflow-x-auto border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahasiswa (NIM)</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judul</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Role</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {modalData.riwayat.length > 0 ? (
                                                    modalData.riwayat.map((item, index) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {item.mahasiswa} <br />
                                                                <span className="text-gray-500 text-xs">({item.nim})</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate" title={item.judul}>
                                                                {item.judul}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                {formatDate(item.tanggal)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <RoleBadge role={item.role} />
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-8 text-gray-500">
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