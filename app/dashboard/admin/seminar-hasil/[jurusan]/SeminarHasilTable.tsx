"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SeminarHasil, Judul, Mahasiswa, Status } from '@prisma/client'; 
import {
    FiClock,
    FiCheckCircle,
    FiFileText,
    FiArrowRight,
    FiDownload,
    FiXCircle,
    FiUsers,
    FiCalendar,
    FiTag,
    FiActivity,
    FiSettings,
    FiUser,
    FiHash
} from 'react-icons/fi';

type SeminarHasilWithDetails = SeminarHasil & {
    judul: Judul & {
        mahasiswa: Mahasiswa;
    };
};

interface SeminarHasilTableProps {
    initialSeminarHasils: SeminarHasilWithDetails[];
}

const StatusBadge = ({ status }: { status: Status }) => {
    const statusConfig: { [key in Status]?: { text: string; icon: React.ComponentType<{ className?: string }>; color: string } } = {
        TERKIRIM: { text: "Diperiksa Admin", icon: FiClock, color: "bg-yellow-100 text-yellow-800" },
        DIPERIKSA_ADMIN: { text: "Diperiksa Admin", icon: FiClock, color: "bg-yellow-100 text-yellow-800" },
        DITOLAK_ADMIN: { text: "Ditolak Admin", icon: FiXCircle, color: "bg-red-100 text-red-800" },
        DIPROSES_KAPRODI: { text: "Diproses Kaprodi", icon: FiClock, color: "bg-purple-100 text-purple-800" },
        DISETUJUI: { text: "Disetujui", icon: FiCheckCircle, color: "bg-green-100 text-green-800" },
    };

    const config = statusConfig[status] || {
        text: status.replace(/_/g, ' '),
        icon: FiFileText,
        color: "bg-gray-100 text-gray-800"
    };
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            <Icon className="h-3 w-3" />
            {config.text}
        </span>
    );
};

export default function SeminarHasilTable({ initialSeminarHasils }: SeminarHasilTableProps) {

    const [seminarHasils, setSeminarHasils] = useState(initialSeminarHasils ?? []);

    useEffect(() => {
        setSeminarHasils(initialSeminarHasils);
    }, [initialSeminarHasils]);

    const [loadingId, setLoadingId] = useState<number | null>(null);

    const handleDownloadSK = async (seminarHasilId: number, nim: string, nama: string) => {
        setLoadingId(seminarHasilId);
        try {
            const res = await fetch(`/api/sk_skripsi/${seminarHasilId}`); 

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                alert('Gagal mengunduh PDF: ' + (json?.error || res.statusText));
                setLoadingId(null);
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SK-Skripsi-${nama}-${nim}.pdf`; 
            document.body.appendChild(a);
            a.click();

            a.remove();
            URL.revokeObjectURL(url);
        } catch (err: unknown) {
            console.error('downloadPdf error', err);
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan server.';
            alert(`Gagal mengunduh PDF: ${errorMessage}`);
        } finally {
            setLoadingId(null);
        }
    };

    return (
         <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full w-full bg-white border divide-y divide-gray-200">
                <thead className="bg-slate-50">
                    <tr>
                       <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                            <div className="flex items-center gap-1 sm:gap-2"><FiUsers size={14} className="text-blue-600" /><span>Mahasiswa</span></div>
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                            <div className="flex items-center gap-1 sm:gap-2"><FiCalendar size={14} className="text-blue-600" /><span>Tanggal Pengajuan</span></div>
                        </th>
                         <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                            <div className="flex items-center gap-1 sm:gap-2"><FiTag size={14} className="text-blue-600" /><span>Topik</span></div>
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left">
                            <div className="flex items-center gap-1 sm:gap-2"><FiFileText size={14} className="text-blue-600" /> <span>Judul Skripsi</span></div>
                        </th>
                         <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                            <div className="flex items-center gap-1 sm:gap-2"><FiActivity size={14} className="text-blue-600" /> <span>Status</span></div>
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm text-left whitespace-nowrap">
                            <div className="flex items-center gap-1 sm:gap-2"><FiSettings size={14} className="text-blue-600" /> <span>Aksi</span></div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {seminarHasils.length === 0 ? (
                       <tr><td colSpan={6} className="px-4 sm:px-6 py-8 sm:py-10 text-center text-gray-500 text-sm">Tidak ada pengajuan pada periode yang dipilih.</td></tr>
                    ) : (
                        seminarHasils.map(sub => ( 
                            <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <FiUser size={14} className="text-blue-600" />
                                            <span className="text-sm text-gray-700">
                                                <span className="text-xs text-gray-600 hidden sm:inline">Nama: </span>
                                                {sub.judul.mahasiswa.nama}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiHash size={14} className="text-blue-600" />
                                            <span className="text-sm text-gray-700">
                                                <span className="text-xs text-gray-600 hidden sm:inline">NIM: </span>
                                                {sub.judul.mahasiswa.nim}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">

                                    {new Date(sub.tanggal).toLocaleDateString('id-ID', { 
                                        day: '2-digit', month: 'long', year: 'numeric'
                                    })}
                                </td>

                               <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 max-w-[100px] truncate">{sub.judul.topik || '-'}</td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <p className="text-xs sm:text-sm text-gray-800 line-clamp-2">{sub.judul.judul}</p>
                                </td>
                               <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <StatusBadge status={sub.status} /> 
                                </td>
                                 <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                                    {sub.status === 'TERKIRIM' && ( 
                                        <Link
                                            href={`/dashboard/admin/seminar-hasil/detail/${sub.id}`} 
                                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 font-semibold"
                                        >
                                           <span className="hidden sm:inline">Verifikasi</span> <FiArrowRight size={14} />
                                        </Link>
                                    )}

                                    {sub.status === 'DISETUJUI' && (
                                        <button
                                            onClick={() => handleDownloadSK(
                                                sub.id, 
                                                sub.judul.mahasiswa.nim, 
                                                sub.judul.mahasiswa.nama
                                            )}
                                            disabled={loadingId === sub.id}
                                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-900 font-semibold disabled:text-gray-400 disabled:cursor-wait"
                                        >
                                            {loadingId === sub.id ? (
                                                <>
                                                    <FiClock className="animate-spin h-4 w-4 flex-shrink-0" /> <span className="hidden sm:inline">Mengunduh...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiDownload size={14} className="flex-shrink-0" /> <span className="hidden sm:inline">Unduh SK</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                   {sub.status === 'DITOLAK_ADMIN' && (<span className="text-gray-400">Selesai</span>)}

                                     {sub.status !== 'TERKIRIM' && sub.status !== 'DISETUJUI' && sub.status !== 'DITOLAK_ADMIN' && (<span className="text-gray-400">Dalam Proses</span>)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}