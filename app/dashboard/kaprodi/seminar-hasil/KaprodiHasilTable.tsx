"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { SeminarHasil, Judul, Mahasiswa, User, Dosen, Status } from '@prisma/client';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FiX, FiCheckCircle, FiCalendar, FiUser, FiBook, FiUsers, FiHash, FiEdit,  FiSearch, FiDownload, FiClock} from 'react-icons/fi';

const MySwal = withReactContent(Swal);

type SeminarHasilWithDetails = SeminarHasil & {
    judul: Judul & {
        mahasiswa: Mahasiswa & { user: User };
        pembimbing1: string | null; 
        pembimbing2: string | null;
    };
    pengujiSempro: string | null; 
};

interface KaprodiHasilTableProps {
    initialSeminarHasil: SeminarHasilWithDetails[];
    lecturers: Dosen[];
}

const StatusBadge = ({ status }: { status: Status }) => {
    const statusConfig: { [key in Status]?: { text: string; color: string } } = {
        DIPROSES_KAPRODI: { text: "Menunggu Jadwal & Penguji", color: "bg-purple-100 text-purple-800" },
        DISETUJUI: { text: "Jadwal & Penguji Ditetapkan", color: "bg-green-100 text-green-800" },
    };
    const config = statusConfig[status] || { text: status.replace('_', ' '), color: "bg-gray-100 text-gray-800" };

    return (
        <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.text}
        </span>
    );
};

const formatDateToLocalInput = (dateString: string | Date): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function KaprodiHasilTable({ initialSeminarHasil, lecturers }: KaprodiHasilTableProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [seminarHasil, setSeminarHasil] = useState(initialSeminarHasil ?? []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSeminarHasil, setSelectedSeminarHasil] = useState<SeminarHasilWithDetails | null>(null);

    const [actionData, setActionData] = useState({
        penguji1: '',
        penguji2: '',
        jadwalSidang: '',
        tempat: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const [filters, setFilters] = useState({ month: currentMonth, year: currentYear });
    const [searchQuery, setSearchQuery] = useState('');
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
    const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

    useEffect(() => {
        const monthParam = searchParams.get('month');
        const yearParam = searchParams.get('year');
        if (monthParam && yearParam) {
            setFilters({
                month: parseInt(monthParam),
                year: parseInt(yearParam)
            });
        }
    }, [searchParams]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: parseInt(value) };
        setFilters(newFilters);

        const params = new URLSearchParams(searchParams.toString());
        params.set('month', newFilters.month.toString());
        params.set('year', newFilters.year.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleActionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setActionData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }
    useEffect(() => {
        setSeminarHasil(initialSeminarHasil ?? []);
    }, [initialSeminarHasil]);

    const displayData = useMemo(() => {
        const dateFiltered = seminarHasil.filter(sh => {
            const shDate = new Date(sh.tanggal);
            return shDate.getMonth() + 1 === filters.month && shDate.getFullYear() === filters.year;
        });

        if (!searchQuery) {
            return dateFiltered;
        }
        
        const searchLower = searchQuery.toLowerCase();
        return dateFiltered.filter(sh =>
            sh.judul.mahasiswa.nama.toLowerCase().includes(searchLower) ||
            sh.judul.mahasiswa.nim.toLowerCase().includes(searchLower) ||
            sh.judul.judul.toLowerCase().includes(searchLower) ||
            sh.judul.topik.toLowerCase().includes(searchLower)
        );
    }, [seminarHasil, filters, searchQuery]);


    const resetActionData = useCallback(() => {
        setActionData({
            penguji1: '',
            penguji2: '',
            jadwalSidang: '',
            tempat: '',
        });
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedSeminarHasil(null);
        resetActionData();
    }, [resetActionData]);

    const openModal = (sh: SeminarHasilWithDetails) => {
        setSelectedSeminarHasil(sh);

        const initialJadwal = sh.jadwal_sidang ? formatDateToLocalInput(sh.jadwal_sidang) : '';

        const initialPenguji1 = sh.penguji1 || sh.pengujiSempro || ''; 
        const initialPenguji2 = sh.penguji2 || ''; 
        const initialTempat = sh.tempat || '';

        setActionData({
            penguji1: initialPenguji1,
            penguji2: initialPenguji2,
            jadwalSidang: initialJadwal,
            tempat: initialTempat,
        });
        setIsModalOpen(true);
    };

    const handleAssign = useCallback(async () => {
        const p1 = actionData.penguji1.trim();
        const p2 = actionData.penguji2.trim();
        const jadwal = actionData.jadwalSidang.trim();
        const tempat = actionData.tempat.trim();

        if (!selectedSeminarHasil || !p1 || !p2 || !jadwal || !tempat) {
            MySwal.fire({ 
                icon: 'warning', 
                title: 'Belum Lengkap', 
                text: 'Dosen Penguji 1, Dosen Penguji 2, Jadwal dan Tempat Sidang wajib diisi.',
                confirmButtonText: 'OK' 
            });
            return;
        }

        if (p1 === p2) {
            MySwal.fire({ icon: 'error', title: 'Kesalahan Input', text: 'Dosen Penguji 1 dan Penguji 2 tidak boleh sama.' });
            return;
        }

        if (p1 === selectedSeminarHasil.judul.pembimbing1 || p1 === selectedSeminarHasil.judul.pembimbing2 ||
            p2 === selectedSeminarHasil.judul.pembimbing1 || p2 === selectedSeminarHasil.judul.pembimbing2) {
            MySwal.fire({ icon: 'error', title: 'Kesalahan Input', text: 'Dosen Pembimbing tidak boleh menjadi Dosen Penguji.' });
            return;
        }


        setIsLoading(true);

        const newStatus = selectedSeminarHasil.status === 'DIPROSES_KAPRODI' ? 'DISETUJUI' : selectedSeminarHasil.status;
        const actionTitle = selectedSeminarHasil.status === 'DIPROSES_KAPRODI' ? 'Penetapan' : 'Pembaruan';

        try {
            const localDate = new Date(jadwal); 
            const isoStringForDB = localDate.toISOString();
            const response = await fetch(`/api/seminar-hasil/kaprodi/${selectedSeminarHasil.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    penguji1: p1,
                    penguji2: p2, 
                    jadwalSidang: isoStringForDB,
                    tempat: tempat,
                    status: newStatus
                }),
            });

            if (!response.ok) {
                const errorResponse = await response.json();
                throw new Error(errorResponse?.message || `Gagal ${actionTitle.toLowerCase()} data`);
            }
            const updated = await response.json();

            MySwal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: `${actionTitle} Penguji dan Jadwal berhasil.`,
                timer: 2000,
                showConfirmButton: false
            });

            setSeminarHasil(prev =>
                prev.map(sh => sh.id === updated.id ? { ...sh, ...updated, pengujiSempro: selectedSeminarHasil.pengujiSempro } : sh)
            );

            closeModal();
        }  catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
            MySwal.fire({ icon: 'error', title: 'Oops...', text: message });

        } finally {
            setIsLoading(false);
        }
    }, [selectedSeminarHasil, actionData, closeModal]);

     const handleDownloadBeritaAcara = async (seminarHasilId: number, nim: string, nama: string) => {
        setLoadingId(seminarHasilId);
        try {
            const response = await fetch(`/api/berita-acara-seminar-hasil/${seminarHasilId}`);
            if (!response.ok) {
                throw new Error('Failed to download Berita Acara');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Berita_Acara_Seminar_Hasil_${nim}_${nama}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading Berita Acara:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Gagal Mengunduh',
                text: 'Terjadi kesalahan saat mengunduh Berita Acara.',
            });
        } finally {
            setLoadingId(null);
        }
    };



    return (
        <>
            <div className="bg-[#325827] p-3 sm:p-4 rounded-lg shadow-md flex flex-col gap-3 sm:gap-4 mb-6">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex flex-col w-full sm:w-auto">
                            <label htmlFor="month" className="text-white font-semibold text-xs sm:text-sm">Bulan</label>
                            <select id="month" name="month" value={filters.month} onChange={handleFilterChange}
                                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 min-w-full sm:min-w-[120px] text-sm">
                                {monthOptions.map(opt => <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col w-full sm:w-auto">
                            <label htmlFor="year" className="text-white font-semibold text-xs sm:text-sm">Tahun</label>
                            <select id="year" name="year" value={filters.year} onChange={handleFilterChange}
                                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 min-w-full sm:min-w-[100px] text-sm">
                                {yearOptions.map(year => <option key={year} value={year} className="text-black">{year}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Cari nama, NIM, atau judul..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full sm:w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-8 sm:pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                        />
                        <FiSearch className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-white/70 w-4 h-4" />
                    </div>
                </div>
            </div>


            <div className="overflow-x-auto bg-white rounded-lg shadow-md border">
                <table className="min-w-full w-full bg-white border divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[150px]">
                                <div className="flex items-center gap-1"><FiUser size={12} className="text-green-800" /><span>Mahasiswa</span></div>
                            </th>
                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[120px]">
                                <div className="flex items-center gap-1"><FiCalendar size={12} className="text-green-800" /><span>Tgl Pengajuan</span></div>
                            </th>
                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[200px]">
                                <div className="flex items-center gap-1"><FiBook size={12} className="text-green-800" /><span>Judul Skripsi</span></div>
                            </th>
                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[150px]">
                                <div className="flex items-center gap-1"><FiUsers size={12} className="text-green-800" /><span>Penguji (Sempro)</span></div>
                            </th>
                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[250px]">
                                <div className="flex items-center gap-1"><FiUsers size={12} className="text-green-800" /><span>Penguji & Jadwal</span></div>
                            </th>
                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[100px]">
                                <div className="flex items-center gap-1 justify-center"><FiCheckCircle size={12} className="text-green-800" /><span>Aksi</span></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {displayData.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 sm:px-6 py-8 sm:py-10 text-center text-gray-500 text-sm">Tidak ada pengajuan sidang skripsi yang perlu diproses pada bulan ini.</td></tr>
                        ) : (
                            displayData.map(sh => (
                                <tr key={sh.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 sm:px-6 py-2 sm:py-3">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1">
                                                <FiUser size={12} className="text-green-800 flex-shrink-0" />
                                                <span className="text-xs text-gray-700 break-words">
                                                    <span className="font-semibold">Nama: </span>
                                                    {sh.judul.mahasiswa.nama}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FiHash size={12} className="text-green-800 flex-shrink-0" />
                                                <span className="text-xs text-gray-700 break-words">
                                                    <span className="font-semibold">NIM: </span>
                                                    {sh.judul.mahasiswa.nim}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs text-gray-700">
                                        {new Date(sh.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs text-gray-700">
                                        <p className="break-words">{sh.judul.judul}</p>
                                    </td>
                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs text-gray-700">
                                        <p className="font-medium">{sh.pengujiSempro || '-'}</p>
                                    </td>
                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs text-gray-700">
                                        {sh.status === 'DISETUJUI' ? (
                                            <ul className="list-none p-0 m-0 space-y-1 text-xs">
                                                <li><strong>Penguji 1:</strong> {sh.penguji1 || '-'}</li>
                                                <li><strong>Penguji 2:</strong> {sh.penguji2 || '-'}</li>
                                                <li><strong>Jadwal:</strong> {new Date(sh.jadwal_sidang!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</li>
                                                <li><strong>Tempat:</strong> {sh.tempat || '-'}</li>
                                            </ul>
                                        ) : (
                                            <StatusBadge status={sh.status} />
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs font-medium text-center">
                                        {sh.status === 'DIPROSES_KAPRODI' ? (
                                            <button onClick={() => openModal(sh)} className="inline-flex items-center gap-2 text-green-600 hover:text-green-900 font-semibold">
                                                <FiEdit className="h-4 w-4" /> Tetapkan
                                            </button>
                                        ) : sh.status === 'DISETUJUI' ? (
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={() => openModal(sh)}
                                                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-900 font-semibold"
                                                >
                                                    <FiEdit className="h-4 w-4" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadBeritaAcara(sh.id, sh.judul.mahasiswa.nim, sh.judul.mahasiswa.nama)}
                                                    disabled={loadingId === sh.id}
                                                    className="inline-flex items-center gap-2 text-green-800 hover:text-green-950 font-semibold"
                                                >
                                                    {loadingId === sh.id ? (
                                                        <>
                                                            <FiClock className="animate-spin h-4 w-4" /> Mengunduh...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiDownload size={14} /> Unduh BA
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <StatusBadge status={sh.status} />
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>


            {isModalOpen && selectedSeminarHasil && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4 md:p-6 overflow-y-auto sm:overflow-hidden">
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl animate-fade-in-scale h-full sm:max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4 pb-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {selectedSeminarHasil.status === 'DISETUJUI' ? 'Edit' : 'Tetapkan'} Penguji & Jadwal Sidang skripsi
                                </h2>
                               
                            </div>
                            <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                                <FiX size={20} />
                            </button>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Detail Pengajuan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pb-4 border-b">
                            <div className='space-y-2'>
                                <div>
                                    <p className="text-xs text-gray-500">Nama Mahasiswa</p>
                                    <p className="font-semibold text-base">{selectedSeminarHasil.judul.mahasiswa.nama}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">NIM</p>
                                    <p className="font-semibold text-base flex items-center gap-1"><FiHash size={12} className='text-gray-400' />{selectedSeminarHasil.judul.mahasiswa.nim}</p>
                                </div>
                            </div>
                            <div className='space-y-2'>
                                <div>
                                    <p className="text-xs text-gray-500">Topik</p>
                                    <p className="font-semibold text-base">{selectedSeminarHasil.judul.topik}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Tgl. Pengajuan</p>
                                    <p className="font-semibold text-base flex items-center gap-1"><FiCalendar size={12} className='text-gray-400' />{new Date(selectedSeminarHasil.tanggal).toLocaleDateString('id-ID')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border mt-4 mb-6">
                            <p className="text-xs text-gray-500 mb-1">Judul Skripsi</p>
                            <p className="font-semibold text-base leading-snug">{selectedSeminarHasil.judul.judul}</p>
                        </div>
                        <div className="mb-6 pb-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Dosen Pembimbing</h3>
                            <div className='p-4 bg-green-50 rounded-lg border border-green-200 grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Pembimbing 1</p>
                                    <p className="font-semibold text-green-800 text-base">{selectedSeminarHasil.judul.pembimbing1 || 'Belum Ditetapkan'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Pembimbing 2</p>
                                    <p className="font-semibold text-green-800 text-base">{selectedSeminarHasil.judul.pembimbing2 || 'Belum Ditetapkan'}</p>
                                </div>
                            </div>
                        </div>

                       
                        <div className='mb-6'>
                            <h3 className="text-lg font-semibold text-[#325827] mb-3">Update Penguji & Jadwal Sidang skripsi </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Dosen Penguji 1</label>
                                    <select
                                        name="penguji1"
                                        value={actionData.penguji1}
                                        onChange={handleActionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                                        required
                                    >
                                        <option value="" disabled>-- Pilih Dosen Penguji 1 --</option>
                                        {lecturers.map(dosen => (
                                
                                            (dosen.nama !== selectedSeminarHasil?.judul.pembimbing1 &&
                                            dosen.nama !== selectedSeminarHasil?.judul.pembimbing2) && (
                                                <option key={dosen.id} value={dosen.nama ?? ''}>{dosen.nama}</option>
                                            )
                                        ))}
                                    </select>
                                    <p className='text-xs text-green-800 mt-1'> dapat diubah.</p>
                                </div>

                           
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Dosen Penguji 2</label>
                                    <select
                                        name="penguji2"
                                        value={actionData.penguji2}
                                        onChange={handleActionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                                        required
                                    >
                                        <option value="" disabled>-- Pilih Dosen Penguji 2 --</option>
                                        {lecturers.map(dosen => (
                                            // Pastikan bukan Pembimbing
                                            (dosen.nama !== selectedSeminarHasil?.judul.pembimbing1 && 
                                            dosen.nama !== selectedSeminarHasil?.judul.pembimbing2) && (
                                                <option key={dosen.id} value={dosen.nama ?? ''}>{dosen.nama}</option>
                                            )
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal & Waktu Sidang</label>
                                    <input
                                        type="datetime-local"
                                        name="jadwalSidang"
                                        value={actionData.jadwalSidang}
                                        onChange={handleActionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        required
                                    />
                                </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Sidang</label>
                                    <input
                                        type="text"
                                        name="tempat"
                                        value={actionData.tempat}
                                        onChange={handleActionChange}
                                        placeholder="Masukkan tempat sidang"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>


                        <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
                            <button onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition-colors text-sm">Batal</button>
                            <button 
                                onClick={handleAssign} 
                                disabled={isLoading} 
                                className="px-4 py-2 bg-[#325827] text-white font-semibold rounded-md shadow-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {isLoading ? 'Menyimpan...' : (selectedSeminarHasil.status === 'DISETUJUI' ? 'Simpan Perubahan' : 'Simpan & Tetapkan Jadwal')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}