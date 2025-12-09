"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Jurusan } from '@prisma/client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    FiEye, FiCalendar, FiDownload, FiCheckCircle, FiClock,
    FiBookOpen, FiUser, FiCode, FiUsers, FiX, FiXCircle,
    FiSearch, FiLoader, FiAlertTriangle, FiHash, FiSettings
} from 'react-icons/fi';
import React from 'react';
import { ArsipData } from '@/app/api/arsip/route';

interface ArsipClientProps {
    initialJurusan: Jurusan;
    isKaprodi: boolean; 
}

const ALL_JURUSAN: Jurusan[] = ['SISTEM_INFORMASI', 'MATEMATIKA'];

const BULAN_FILTER = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' }, { value: '04', label: 'April' },
    { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

const formatJurusan = (jurusan: Jurusan) => {
    return jurusan.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
};

const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '-';
    try {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
        return '-';
    }
};

const getTimelineStatus = (item: ArsipData) => {
    const steps = [
        { label: 'Pengajuan Judul', date: item.tanggal_pengajuan_judul, isDone: !!item.tanggal_pengajuan_judul },
        { label: 'Pengajuan Seminar Proposal', date: item.proposal?.tanggal, isDone: !!item.proposal?.tanggal },
        { label: 'Pengajuan Sidang Skripsi', date: item.seminar_hasil?.tanggal, isDone: !!item.seminar_hasil?.tanggal },
    ];

    let latestDate: Date | null = null;
    let latestLabel: string = 'Belum Ada Data';

    for (let i = steps.length - 1; i >= 0; i--) {
        const step = steps[i];
        if (step.isDone) {
            const currentDate = step.date ? (step.date instanceof Date ? step.date : new Date(step.date)) : null;
            if (currentDate) {
                 latestDate = currentDate;
            }
            latestLabel = step.label;
            break;
        }
    }

    if (!latestDate && item.tanggal_pengajuan_judul) {
        latestDate = new Date(item.tanggal_pengajuan_judul);
        latestLabel = 'Pengajuan Judul';
    }

    return {
        latestLabel,
        latestDate: latestDate,
        steps,
    };
};

const TimelineStatus: React.FC<{ steps: ReturnType<typeof getTimelineStatus>['steps'] }> = ({ steps }) => {
    return (
        <ul className="list-none p-0 m-0 space-y-1 text-xs">
            {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                    {step.isDone ? (
                        <FiCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                        <FiClock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col">
                        <span className={`font-medium ${step.isDone ? 'text-gray-800' : 'text-gray-500'}`}>
                            {step.label}
                        </span>
                        <span className="text-gray-500 text-[10px]">
                            {formatDate(step.date)}
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    );
};

const DownloadStatus: React.FC<{ url: string | null, nama: string, nim: string, type: 'pembimbing' | 'proposal' | 'skripsi' }> = ({ url, nama, nim, type }) => {
    const [loading, setLoading] = useState(false);
    const isAvailable = !!url;

    const handleDownload = async () => {
        if (!url) return;
        try {
            setLoading(true);
            const res = await fetch(url);
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.error || `HTTP ${res.status}`);
            }

            const blob = await res.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            const sanitize = (name: string) => name.replace(/[\\/:*?"<>|]/g, '_');
            let outName: string;
            if (type === 'pembimbing') {
                outName = `SK-pembimbing-${nama}-${nim}.pdf`;
            } else if (type === 'proposal') {
                outName = `SK-Proposal-${nama}-${nim}.pdf`;
            } else if (type === 'skripsi') {
                outName = `SK-Skripsi-${nama}-${nim}.pdf`;
            } else {
                outName = 'SK.pdf';
            }
            const safeName = sanitize(outName);
            a.download = safeName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(downloadUrl);
        } catch (err: unknown) {
            console.error('Download SK error:', err);
            const message = err instanceof Error ? err.message : 'Internal Server Error';
            alert('Gagal mengunduh SK: ' + message);
        } finally {
            setLoading(false);
        }
    };

    if (isAvailable) {
        return (
            <button
                onClick={handleDownload}
                disabled={loading}
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-900 font-semibold disabled:text-gray-400 disabled:cursor-wait"
            >
                <FiDownload className="w-4 h-4 mr-1" />
                {loading ? 'Mengunduh...' : 'unduh SK'}
            </button>
        );
    }

    return (
        <span className="text-gray-400 text-xs flex items-center justify-center gap-1">
            <FiXCircle className="w-3 h-3" /> Belum Ada
        </span>
    );
};

const DetailModal: React.FC<{ item: ArsipData | null, onClose: () => void }> = ({ item, onClose }) => {
    if (!item) return null;
    
    const { steps } = getTimelineStatus(item);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 transform transition-all animate-fade-in-scale">
                
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FiBookOpen /> Detail Arsip - {item.nama}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800">
                        <FiX className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                        <div className="space-y-2">
                            <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <FiUser className="w-5 h-5 text-green-800" /> Info Mahasiswa
                            </h4>
                            <div className="p-4 bg-gray-50 rounded-lg border text-sm space-y-2">
                                <p><strong>Nama:</strong> {item.nama}</p>
                                <p><strong>NIM:</strong> {item.nim}</p>
                                <p><strong>Prodi:</strong> {formatJurusan(item.jurusan)}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <FiBookOpen className="w-5 h-5 text-green-800" /> Info Judul
                            </h4>
                            <div className="p-4 bg-gray-50 rounded-lg border text-sm space-y-2">
                                <p><strong>Topik:</strong> {item.topik}</p>
                                <p><strong>Judul:</strong> <span className="italic">{item.judul}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            <FiUsers className="w-5 h-5 text-green-800" /> Dosen Pembimbing
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg border">
                                <span className="text-sm font-semibold text-gray-800">Pembimbing I: </span>
                                <span className="text-sm text-gray-600">{item.pembimbing1 || '-'}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border">
                                <span className="text-sm font-semibold text-gray-800">Pembimbing II: </span>
                                <span className="text-sm text-gray-600">{item.pembimbing2 || '-'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            <FiCode className="w-5 h-5 text-green-800" /> Dosen Penguji
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         
                            <div className="p-3 bg-gray-50 rounded-lg border space-y-1">
                                <span className="text-sm font-semibold text-gray-800">Penguji Sempro : </span>
                                <span className="text-sm text-gray-600">{item.proposal?.penguji || '-'}</span>
                            </div>
                   
                            <div className="p-3 bg-gray-50 rounded-lg border space-y-1">
                                <span className="text-sm font-semibold text-gray-800">Penguji  Sidang Skripsi 1: </span>
                                <span className="text-sm text-gray-600">{item.seminar_hasil?.penguji1 || '-'}</span>
                                <br/>
                                <span className="text-sm font-semibold text-gray-800">Penguji Sidang Skripsi 2: </span>
                                <span className="text-sm text-gray-600">{item.seminar_hasil?.penguji2 || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            <FiCalendar className="w-5 h-5 tex--green-800" /> Riwayat Tahapan
                        </h4>
                        <div className="p-4 bg-gray-50 rounded-lg border">
                            <TimelineStatus steps={steps} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ArsipClient: React.FC<ArsipClientProps> = ({ initialJurusan, isKaprodi }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [arsipData, setArsipData] = useState<ArsipData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const defaultMonth = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }, []);

    const [filters, setFilters] = useState({
        monthYear: searchParams.get('month') || defaultMonth,
        jurusan: (searchParams.get('jurusan') as Jurusan) || initialJurusan,
        search: searchParams.get('search') || '',
    });
    
    const [selectedItem, setSelectedItem] = useState<ArsipData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchArsip = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                month: filters.monthYear,
                jurusan: filters.jurusan,
            });
            if (filters.search) {
                params.append('search', filters.search);
            }

            const res = await fetch(`/api/arsip?${params.toString()}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Gagal mengambil data arsip');
            }
            const data: ArsipData[] = await res.json();
            setArsipData(data);
        } catch (err) {
            setError((err as Error).message);
            setArsipData([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters]); 

    useEffect(() => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('month', filters.monthYear);
        newParams.set('jurusan', filters.jurusan);
        if (filters.search) {
            newParams.set('search', filters.search);
        } else {
            newParams.delete('search');
        }

        router.replace(`${pathname}?${newParams.toString()}`);

        const handler = setTimeout(() => {
            fetchArsip();
        }, 500);
        return () => {
            clearTimeout(handler);
        };
    }, [filters, router, pathname, fetchArsip, searchParams]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === "month" || name === "year") {
            const [currentYear, currentMonth] = filters.monthYear.split('-');
            const newMonthYear = name === "month" 
                ? `${currentYear}-${value}` 
                : `${value}-${currentMonth}`;
            
            setFilters(prev => ({ ...prev, monthYear: newMonthYear }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleJurusanChange = (newJurusan: Jurusan) => {
        setFilters(prev => ({
            ...prev,
            jurusan: newJurusan
        }));
    };

    const openModal = (item: ArsipData) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const [currentYear, currentMonthNum] = filters.monthYear.split('-');
    
    const availableYears = useMemo(() => {
        const year = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => year - i);
    }, []);

    return (
              <main className="space-y-4 sm:space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Arsip Skripsi Mahasiswa</h1>
            <p className="text-xs sm:text-sm text-gray-600">Menampilkan seluruh data pengajuan mahasiswa yang telah selesai atau sedang berjalan.</p>
            
            <div className="bg-white p-6 rounded-lg shadow-md border space-y-4">

                {/* --- 1. BAGIAN FILTER (Style dari DosenStatsClient) --- */}
                <div className="bg-[#325827] p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                    {/* Filter Group: Bulan & Tahun (Logika Arsip) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                        <div className="flex flex-col">
                            <label htmlFor="month" className="text-sm font-semibold text-white mb-1">
                                Bulan Pengajuan judul
                            </label>
                            <select
                                id="month"
                                name="month"
                                value={currentMonthNum}
                                onChange={handleFilterChange}
                                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 transition duration-150 appearance-none min-w-[120px] font-sans w-full sm:w-auto"
                            >
                                {BULAN_FILTER.map(bulan => (
                                    <option key={bulan.value} value={bulan.value} className='text-gray-800'>{bulan.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="year" className="text-sm font-semibold text-white mb-1">
                                Tahun Pengajuan
                            </label>
                            <select
                                id="year"
                                name="year"
                                value={currentYear}
                                onChange={handleFilterChange}
                                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 transition duration-150 appearance-none min-w-[100px] font-sans w-full sm:w-auto"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year} className='text-gray-800'>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Kolom Search (Style dari DosenStatsClient) */}
                    <div className="relative w-full sm:w-auto sm:self-end">
                        <input
                            type="text"
                            name="search"
                            placeholder="Cari nama atau NIM..."
                            value={filters.search}
                            onChange={handleFilterChange}
                            className="w-full sm:w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50 font-sans"
                        />
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 h-5 w-5" />
                    </div>
                </div>
                {!isKaprodi && (
                    <div className='flex items-center gap-4 pt-2'>
                        <label className="text-sm font-medium text-gray-700">Filter Jurusan:</label>
                        {ALL_JURUSAN.map(j => (
                            <button
                                key={j}
                                onClick={() => handleJurusanChange(j)}
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition duration-150 ${
                                    filters.jurusan === j
                                        ? 'bg-[#325827] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {j.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border space-y-4">
                <p className="mt-1 text-gray-600">
                    Data ditampilkan untuk Jurusan:{' '}
                    <strong className='text-[#325827]'>{formatJurusan(filters.jurusan)}</strong>
                </p>

                <div className="mt-6">
                    {isLoading ? (
                        <div className="text-center py-10 text-[#325827] flex flex-col items-center">
                            <FiLoader className="h-8 w-8 animate-spin" />
                            <p className="mt-2">Memuat data arsip...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3">
                            <FiAlertTriangle className="h-5 w-5" />
                            <p className='font-medium'>Error terjadi saat memuat data: {error}</p>
                        </div>
                    ) : (
                         <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <table className="min-w-full w-full bg-white border divide-y divide-gray-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {/* Header Mahasiswa */}
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                                            <div className="flex items-center gap-1 sm:gap-2"><FiUsers size={14} className="text-green-800" /><span>Mahasiswa</span></div>
                                        </th>
                                        
                                        {/* Header Tanggal */}
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                                            <div className="flex items-center gap-1 sm:gap-2"><FiCalendar size={14} className="text-green-800" /><span>Timeline</span></div>
                                        </th>
                                        {/* Header SK Pembimbing */}
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-center whitespace-nowrap">
                                            <div className="flex items-center gap-1 sm:gap-2 justify-center"><FiDownload size={14} className="text-green-800" /><span>SK Pembimbing</span></div>
                                        </th>
                                        {/* Header SK Sempro */}
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-center whitespace-nowrap">
                                            <div className="flex items-center gap-1 sm:gap-2 justify-center"><FiDownload size={14} className="text-green-800" /><span>SK Sempro</span></div>
                                        </th>
                                        {/* Header SK Sidang */}
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-center whitespace-nowrap">
                                            <div className="flex items-center gap-1 sm:gap-2 justify-center"><FiDownload size={14} className="text-green-800" /><span>SK Sidang</span></div>
                                        </th>
                                        {/* Header Aksi */}
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-center whitespace-nowrap">
                                            <div className="flex items-center gap-1 sm:gap-2 justify-center"><FiSettings size={14} className="text-green-800" /><span>Aksi</span></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {arsipData.length === 0 ? (
                                        <tr><td colSpan={8} className="px-4 sm:px-6 py-8 sm:py-10 text-center text-gray-500 text-sm">Tidak ada data arsip yang ditemukan.</td></tr>
                                    ) : (
                                        arsipData.map((item) => {
                                            const { steps } = getTimelineStatus(item);
                                            
                                            const skPembimbingUrl = item.sk_pembimbing_number ? `/api/sk/${item.id}` : null;
                                            const skPengujiProposalUrl = item.proposal?.sk_penguji_file ? `/api/sk_proposal/${item.proposal.id}` : null;
                                            const skPengujiSidangUrl = item.seminar_hasil?.sk_penguji_file ? `/api/sk_skripsi/${item.seminar_hasil.id}` : null;

                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                 
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <FiUser size={14} className="text-green-800" />
                                                                <span className="text-sm text-gray-700">
                                                                    <span className="font-semibold">Nama: </span>
                                                                    {item.nama}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <FiHash size={14} className="text-green-800" />
                                                                <span className="text-sm text-gray-700">
                                                                    <span className="font-semibold">NIM: </span>
                                                                    {item.nim}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                   
                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        <TimelineStatus steps={steps} />
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <DownloadStatus url={skPembimbingUrl} nama={item.nama} nim={item.nim} type="pembimbing" />
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <DownloadStatus url={skPengujiProposalUrl} nama={item.nama} nim={item.nim} type="proposal" />
                                                    </td>
                                                
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <DownloadStatus url={skPengujiSidangUrl} nama={item.nama} nim={item.nim} type="skripsi" />
                                                    </td>
                                                
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                        <button 
                                                            onClick={() => openModal(item)}
                                                            className="inline-flex items-center gap-2 text-green-600 hover:text-green-900 font-semibold"
                                                            title="Lihat Detail Lengkap"
                                                        >
                                                            <FiEye className="h-4 w-4" /> Lihat
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            
           
            {isModalOpen && <DetailModal item={selectedItem} onClose={closeModal} />}
        </main>
    );
};

export default ArsipClient;
