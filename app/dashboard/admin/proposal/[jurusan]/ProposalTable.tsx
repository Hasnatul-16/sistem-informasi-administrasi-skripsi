"use client";

import { useState } from 'react';
import Link from 'next/link';
import type { Proposal, Judul, Mahasiswa, Status } from '@prisma/client';
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

// Tipe data gabungan
type ProposalWithDetails = Proposal & {
    judul: Judul & {
        mahasiswa: Mahasiswa;
    };
};

interface ProposalTableProps {
    initialProposals: ProposalWithDetails[];
}

// ⭐ PERUBAHAN UTAMA DI SINI: Komponen Status Badge disamakan dengan SubmissionTable
const StatusBadge = ({ status }: { status: Status }) => {
    // Konfigurasi 5 Status Saja, disamakan persis dengan SubmissionTable Anda
    const statusConfig: { [key in Status]?: { text: string; icon: any; color: string } } = {
        // TERKIRIM dan DIPERIKSA_ADMIN dianggap sama (Diperiksa Admin)
        TERKIRIM: { text: "Diperiksa Admin", icon: FiClock, color: "bg-yellow-100 text-yellow-800" },
        DIPERIKSA_ADMIN: { text: "Diperiksa Admin", icon: FiClock, color: "bg-yellow-100 text-yellow-800" },
        DITOLAK_ADMIN: { text: "Ditolak Admin", icon: FiXCircle, color: "bg-red-100 text-red-800" },
        DIPROSES_KAPRODI: { text: "Diproses Kaprodi", icon: FiClock, color: "bg-purple-100 text-purple-800" },
        DISETUJUI: { text: "Disetujui", icon: FiCheckCircle, color: "bg-green-100 text-green-800" },
        // Fallback untuk status lain (jika ada status di Proposal yang tidak ada di 5 status ini, misal DIJADWALKAN)
    };

    const config = statusConfig[status] || {
        text: status.replace(/_/g, ' '), // Ganti underscore dengan spasi
        icon: FiFileText,
        color: "bg-gray-100 text-gray-800"
    };
    const Icon = config.icon;

    return (
        // Menggunakan gap-2 dan px-2 py-1 (disamakan dengan SubmissionTable Anda)
        <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            <Icon className="h-3 w-3" />
            {config.text}
        </span>
    );
};

export default function ProposalTable({ initialProposals }: ProposalTableProps) {
    const [proposals, setProposals] = useState(initialProposals ?? []);
    // State untuk melacak ID pengajuan yang sedang di-download
    const [loadingId, setLoadingId] = useState<number | null>(null);

    // Fungsi download SK (TIDAK BERUBAH)
    const handleDownloadSK = async (proposalId: number, nim: string) => {
        setLoadingId(proposalId);
        try {
            // Asumsi ada API route untuk download SK Proposal, misal `/api/sk-sempro/[id]`
            const res = await fetch(`/api/sk-sempro/${proposalId}`);

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
            a.download = `SK-Sempro-${nim || proposalId}.pdf`;
            document.body.appendChild(a);
            a.click();

            a.remove();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('downloadPdf error', err);
            alert('Gagal mengunduh PDF. Cek console untuk detail.');
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="overflow-x-auto">
            {/* Tambahkan w-full dan border agar mirip SubmissionTable */}
            <table className="min-w-full w-full bg-white border divide-y divide-gray-200 table-fixed">
                <thead className="bg-slate-50">
                    <tr>
                        {/* Header Mahasiswa - Mirip SubmissionTable */}
                        <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[20%]">
                            <div className="flex items-center gap-2"><FiUsers size={16} className="text-blue-600" /><span>Mahasiswa</span></div>
                        </th>
                        {/* Header Tanggal Pengajuan - Mirip SubmissionTable */}
                        <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]">
                            <div className="flex items-center gap-2"><FiCalendar size={16} className="text-blue-600" /><span>Tanggal Pengajuan</span></div>
                        </th>
                        {/* Tambahkan Header Topik - Mirip SubmissionTable */}
                        <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]">
                            <div className="flex items-center gap-2"><FiTag size={16} className="text-blue-600" /><span>Topik</span></div>
                        </th>
                        {/* Header Judul - Mirip SubmissionTable */}
                        <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[25%]">
                            <div className="flex items-center gap-2"><FiFileText size={16} className="text-blue-600" /> <span>Judul</span></div>
                        </th>
                        {/* Header Status - Mirip SubmissionTable */}
                        <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]">
                            <div className="flex items-center gap-2"><FiActivity size={16} className="text-blue-600" /> <span>Status</span></div>
                        </th>
                        {/* Header Aksi - Mirip SubmissionTable */}
                        <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[10%]">
                            <div className="flex items-center gap-2"><FiSettings size={16} className="text-blue-600" /> <span>Aksi</span></div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {proposals.map(prop => (
                        <tr key={prop.id} className="hover:bg-gray-50 transition-colors">
                            {/* Kolom Mahasiswa - Mirip SubmissionTable */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <FiUser size={14} className="text-blue-600" />
                                        <span className="text-sm text-gray-700">
                                            <span className="font-semibold">Nama: </span>
                                            {prop.judul.mahasiswa.nama}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FiHash size={14} className="text-blue-600" />
                                        <span className="text-sm text-gray-700">
                                            <span className="font-semibold">NIM: </span>
                                            {prop.judul.mahasiswa.nim}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            {/* Kolom Tanggal Pengajuan - Mirip SubmissionTable */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(prop.tanggal).toLocaleDateString('id-ID', {
                                    day: '2-digit', month: 'long', year: 'numeric' // Menggunakan format lengkap
                                })}
                            </td>
                            {/* Kolom Topik - Tambahan dari SubmissionTable */}
                            <td className="px-6 py-4 text-sm text-gray-600">{prop.judul.topik || '-'}</td>
                            {/* Kolom Judul - Mirip SubmissionTable */}
                            <td className="px-6 py-4">
                                <p className="text-sm text-gray-800 whitespace-normal break-words" title={prop.judul.judul}>{prop.judul.judul}</p>
                            </td>
                            {/* Kolom Status - Menggunakan StatusBadge yang baru */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={prop.status} />
                            </td>
                            {/* Kolom Aksi - Modifikasi agar mirip SubmissionTable */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {/* Tombol Verifikasi hanya untuk status TERKIRIM */}
                                {prop.status === 'TERKIRIM' && (
                                    <Link
                                        href={`/dashboard/admin/proposal/detail/${prop.id}`}
                                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-900 font-semibold"
                                    >
                                        Verifikasi <FiArrowRight className="h-4 w-4" />
                                    </Link>
                                )}

                                {/* Tombol Unduh SK hanya untuk status DISETUJUI */}
                                {prop.status === 'DISETUJUI' && (
                                    <button
                                        onClick={() => handleDownloadSK(prop.id, prop.judul.mahasiswa.nim)}
                                        disabled={loadingId === prop.id}
                                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-900 font-semibold disabled:text-gray-400 disabled:cursor-wait"
                                    >
                                        {loadingId === prop.id ? (
                                            <>
                                                <FiClock className="animate-spin h-4 w-4" /> Mengunduh...
                                            </>
                                        ) : (
                                            <>
                                                <FiDownload /> Unduh SK
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* Teks "Dalam Proses" untuk status lain */}
                                {prop.status !== 'TERKIRIM' && prop.status !== 'DISETUJUI' && (<span className="text-gray-400">Dalam Proses</span>)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}