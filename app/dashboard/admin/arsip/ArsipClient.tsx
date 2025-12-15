"use client";
 
import { useState, useEffect, useCallback } from 'react';
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
    initialTahun?: number;
    initialSemester?: 'GANJIL' | 'GENAP';
}

const ALL_JURUSAN: Jurusan[] = ['SISTEM_INFORMASI', 'MATEMATIKA'];



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
                <li key={index} className="flex items-start gap-1">
                    {step.isDone ? (
                        <FiCheckCircle className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                        <FiClock className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col">
                        <span className={`font-medium text-xs ${step.isDone ? 'text-gray-800' : 'text-gray-500'}`}>
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

const ViewStatus: React.FC<{ url: string | null }> = ({ url }) => {
    const isAvailable = !!url;

    const handleView = () => {
        if (!url) return;
        window.open(url, "_blank");
    };

    if (isAvailable) {
        return (
            <button
                onClick={handleView}
                className="inline-flex items-center gap-0.5 text-green-600 hover:text-green-900 font-semibold text-xs break-words"
            >
                <FiEye className="w-3 h-3" />
                <span>Lihat SK</span>
            </button>
        );
    }

    return (
        <span className="text-gray-400 text-xs flex items-center justify-center gap-1">
            <FiXCircle className="w-3 h-3" /> Belum Ada
        </span>
    );
};

const DownloadBeritaAcara: React.FC<{ id: number | null, type: 'proposal' | 'seminar-hasil' }> = ({ id, type }) => {
    const isAvailable = !!id;

    const handleDownload = () => {
        if (!id) return;
        const url = `/api/berita-acara-${type}/${id}`;
        window.open(url, "_blank");
    };

    if (isAvailable) {
        return (
            <button
                onClick={handleDownload}
                className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-900 font-semibold text-xs break-words"
            >
                <FiDownload className="w-3 h-3" />
                <span>Unduh</span>
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
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FiBookOpen /> Detail Arsip - {item.nama}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800">
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <FiUser className="w-4 h-4 text-green-800" /> Info Mahasiswa
                            </h4>
                            <div className="p-4 bg-gray-50 rounded-lg border text-xs space-y-2">
                                <p><strong>Nama:</strong> {item.nama}</p>
                                <p><strong>NIM:</strong> {item.nim}</p>
                                <p><strong>Prodi:</strong> {formatJurusan(item.jurusan)}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <FiBookOpen className="w-4 h-4 text-green-800" /> Info Judul
                            </h4>
                            <div className="p-4 bg-gray-50 rounded-lg border text-xs space-y-2">
                                <p><strong>Topik:</strong> {item.topik}</p>
                                <p><strong>Judul:</strong> <span className="italic">{item.judul}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <FiUsers className="w-4 h-4 text-green-800" /> Dosen Pembimbing
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg border">
                                <span className="text-xs font-semibold text-gray-800">Pembimbing I: </span>
                                <span className="text-xs text-gray-600">{item.pembimbing1 || '-'}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border">
                                <span className="text-xs font-semibold text-gray-800">Pembimbing II: </span>
                                <span className="text-xs text-gray-600">{item.pembimbing2 || '-'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <FiCode className="w-4 h-4 text-green-800" /> Dosen Penguji
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         
                            <div className="p-3 bg-gray-50 rounded-lg border space-y-1">
                                <span className="text-xs font-semibold text-gray-800">Penguji Sempro : </span>
                                <span className="text-xs text-gray-600">{item.proposal?.penguji || '-'}</span>
                            </div>
                   
                            <div className="p-3 bg-gray-50 rounded-lg border space-y-1">
                                <span className="text-xs font-semibold text-gray-800">Penguji  Sidang Skripsi 1: </span>
                                <span className="text-xs text-gray-600">{item.seminar_hasil?.penguji1 || '-'}</span>
                                <br/>
                                <span className="text-xs font-semibold text-gray-800">Penguji Sidang Skripsi 2: </span>
                                <span className="text-xs text-gray-600">{item.seminar_hasil?.penguji2 || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <FiCalendar className="w-4 h-4 tex--green-800" /> Riwayat Tahapan
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

const ArsipClient: React.FC<ArsipClientProps> = ({ initialJurusan, initialTahun, initialSemester }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [arsipData, setArsipData] = useState<ArsipData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 6 }, (_, i) => String((initialTahun || currentYear) - i));

    const [filters, setFilters] = useState({
        jurusan: (searchParams.get('jurusan') as Jurusan) || initialJurusan,
        search: searchParams.get('search') || '',
        tahun: searchParams.get('tahun') || String(initialTahun || currentYear),
        semester: (searchParams.get('semester') as 'GANJIL' | 'GENAP') || (initialSemester || 'GANJIL'),
    });
    
    const [selectedItem, setSelectedItem] = useState<ArsipData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchArsip = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                jurusan: filters.jurusan,
                tahun: filters.tahun,
                semester: filters.semester,
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
        newParams.set('jurusan', filters.jurusan);
        newParams.set('tahun', filters.tahun);
        newParams.set('semester', filters.semester);
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



    return (
              <main className="space-y-4 overflow-x-hidden">
            <div >
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Arsip Skripsi Mahasiswa</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">Menampilkan seluruh data pengajuan mahasiswa yang telah selesai atau sedang berjalan.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border space-y-4">

                <div className="bg-[#325827] p-3 sm:p-4 rounded-lg shadow-md flex flex-col gap-3 sm:gap-4">

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                            <div className="flex flex-col w-full sm:w-auto">
                                <label className="text-xs sm:text-sm font-semibold text-white mb-1">Periode Semester</label>
                                <select
                                    id="semester"
                                    name="semester"
                                    value={filters.semester}
                                    onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value as 'GANJIL' | 'GENAP' }))}
                                    className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 transition duration-150 appearance-none min-w-full sm:min-w-[120px] font-sans text-sm"
                                >
                                    <option value="GANJIL" className='text-gray-800'>Ganjil</option>
                                    <option value="GENAP" className='text-gray-800'>Genap</option>
                                </select>
                            </div>

                            <div className="flex flex-col w-full sm:w-auto">
                                <label className="text-xs sm:text-sm font-semibold text-white mb-1">Tahun Akademik</label>
                                <select
                                    id="tahun"
                                    name="tahun"
                                    value={filters.tahun}
                                    onChange={(e) => setFilters(prev => ({ ...prev, tahun: e.target.value }))}
                                    className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 transition duration-150 appearance-none min-w-full sm:min-w-[100px] font-sans text-sm"
                                >
                                    {yearOptions.map(y => (
                                        <option key={y} value={y} className='text-gray-800'>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Right side: Search */}
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Cari nama atau NIM..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full sm:w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50 text-xs sm:text-sm"
                            />
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border space-y-4">
                <p className="mt-1 text-gray-600">
                    Data ditampilkan untuk Jurusan:{' '}
                    <strong className='text-[#325827]'>{formatJurusan(filters.jurusan)}</strong>
                </p>

                <div className='flex items-center gap-4 mt-3'>
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
                            {formatJurusan(j)}
                        </button>
                    ))}
                </div>

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
                         <div className="overflow-x-auto">
                            <table className="min-w-full w-full bg-white border divide-y divide-gray-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {/* Header Mahasiswa */}
                                        <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left">
                                            <div className="flex items-center gap-1"><FiUsers size={12} className="text-green-800" /><span>Mahasiswa</span></div>
                                        </th>

                                        {/* Header Tanggal */}
                                        <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left">
                                            <div className="flex items-center gap-1"><FiCalendar size={12} className="text-green-800" /><span>Timeline</span></div>
                                        </th>
                                        {/* Header SK Pembimbing */}
                                        <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-center min-w-[90px]">
                                            <div className="flex items-center gap-1 justify-center"><FiDownload size={12} className="text-green-800" /><span>SK Pembimbing</span></div>
                                        </th>
                                        {/* Header SK Sempro */}
                                        <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-center min-w-[90px]">
                                            <div className="flex items-center gap-1 justify-center"><FiDownload size={12} className="text-green-800" /><span>SK Sempro</span></div>
                                        </th>
                                        {/* Header SK Sidang */}
                                        <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-center min-w-[90px]">
                                            <div className="flex items-center gap-1 justify-center"><FiDownload size={12} className="text-green-800" /><span>SK Sidang</span></div>
                                        </th>
                                        {/* Header Berita Acara Proposal */}
                                        <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-center min-w-[120px]">
                                            <div className="flex items-center gap-1 justify-center"><FiDownload size={12} className="text-green-800" /><span>Berita Acara Proposal</span></div>
                                        </th>
                                        {/* Header Berita Acara Sidang Skripsi */}
                                        <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-center min-w-[130px]">
                                            <div className="flex items-center gap-1 justify-center"><FiDownload size={12} className="text-green-800" /><span>Berita Acara Sidang Skripsi</span></div>
                                        </th>
                                        {/* Header Aksi */}
                                        <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-center min-w-[70px]">
                                            <div className="flex items-center gap-1 justify-center"><FiSettings size={12} className="text-green-800" /><span>Aksi</span></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {arsipData.length === 0 ? (
                                        <tr><td colSpan={10} className="px-4 sm:px-6 py-8 sm:py-10 text-center text-gray-500 text-sm">Tidak ada data arsip yang ditemukan.</td></tr>
                                    ) : (
                                        arsipData.map((item) => {
                                            const { steps } = getTimelineStatus(item);

                                            const skPembimbingUrl = item.file_sk_pembimbing;
                                            const skPengujiProposalUrl = item.proposal?.file_sk_proposal || null;
                                            const skPengujiSidangUrl = item.seminar_hasil?.file_sk_skripsi || null;

                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">

                                                    <td className="px-4 sm:px-6 py-2 sm:py-3">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1">
                                                                <FiUser size={12} className="text-green-800 flex-shrink-0" />
                                                                <span className="text-xs text-gray-700 break-words">
                                                                    <span className="font-semibold">Nama: </span>
                                                                    {item.nama}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <FiHash size={12} className="text-green-800 flex-shrink-0" />
                                                                <span className="text-xs text-gray-700 break-words">
                                                                    <span className="font-semibold">NIM: </span>
                                                                    {item.nim}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs text-gray-700">
                                                        <TimelineStatus steps={steps} />
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-center">
                                                        <ViewStatus url={skPembimbingUrl} />
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-center">
                                                        <ViewStatus url={skPengujiProposalUrl} />
                                                    </td>

                                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-center">
                                                        <ViewStatus url={skPengujiSidangUrl} />
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-center">
                                                        <DownloadBeritaAcara id={item.proposal?.id || null} type="proposal" />
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-center">
                                                        <DownloadBeritaAcara id={item.seminar_hasil?.id || null} type="seminar-hasil" />
                                                    </td>

                                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs font-medium text-center">
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
