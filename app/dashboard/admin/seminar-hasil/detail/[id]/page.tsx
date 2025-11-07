import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { FiAlertCircle, FiFileText, FiDownload, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import type { SeminarHasil, Judul, Mahasiswa } from '@prisma/client';
import SeminarHasilActionAdmin from './SeminarHasilActionAdmin';

export const dynamic = 'force-dynamic';

type SeminarHasilWithDetails = SeminarHasil & {
    judul: Judul & {
        mahasiswa: Mahasiswa;
    };
};

async function getSeminarHasilDetail(seminarHasilId: number): Promise<SeminarHasilWithDetails | null> {
    const submission = await prisma.seminarHasil.findUnique({
        where: { id: seminarHasilId },
        include: {
            judul: {
                include: {
                    mahasiswa: true
                }
            }
        },
    });
    return submission as SeminarHasilWithDetails;
}

const DetailItem = (label: string, value: string | undefined | null) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-md text-gray-900">{value || '-'}</p>
    </div>
);
const FileItem = (label: string, url: string | null | undefined) => (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-3">
            <FiFileText className="h-6 w-6 text-gray-500" />
            <span className="font-medium">{label}</span>
        </div>
        {url ? (
            <Link href={url} target="_blank" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
                <FiDownload /> Lihat File
            </Link>
        ) : (<span className="text-sm text-gray-400">Tidak ada file</span>)}
    </div>
);


export default async function SeminarHasilDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'ADMIN') {
        return <div className="p-4 text-red-600 font-medium">Akses ditolak. Anda bukan Admin.</div>;
    }

    const seminarHasilId = parseInt(params.id, 10);
    if (isNaN(seminarHasilId)) {
        return <div className="p-4 text-red-600 font-medium">ID Seminar Hasil tidak valid.</div>;
    }

    const submission = await getSeminarHasilDetail(seminarHasilId);

    if (!submission) {
        return (
            <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg border border-red-300">
                    <FiAlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Seminar Hasil Tidak Ditemukan</h1>
                    <p className="text-gray-600 mb-6">Pengajuan Seminar Hasil dengan ID ini tidak ditemukan.</p>
                    <Link href="/dashboard/admin" className="text-blue-600 hover:underline font-medium">
                        <FiArrowLeft className="inline-block mr-1" /> Kembali ke Dashboard Admin
                    </Link>
                </div>
            </main>
        );
    }

    const buktiSemproUrl = submission.bukti_sempro;
    const drafSkripsiUrl = submission.draf_skripsi;
    const buktiKonsultasiUrl = submission.bukti_konsultasi;
    const sertifikatToeflUrl = submission.sertifikat_toefl;
    const buktiHafalanUrl = submission.bukti_hafalan;
    const transkripUrl = submission.transkrip; 
   

    return (
        <main className="max-w-4xl mx-auto p-4 md:p-8">

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Detail Pengajuan Seminar Hasil</h1>
                <p className="text-gray-600 mt-1">Periksa kelengkapan data dan dokumen sebelum memverifikasi.</p>
            </div>

            <div className="space-y-6">

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-3">Informasi Mahasiswa</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {DetailItem("Nama Lengkap", submission.judul.mahasiswa.nama)}
                        {DetailItem("NIM", submission.judul.mahasiswa.nim)}
                        {DetailItem("Jurusan", submission.judul.mahasiswa.jurusan.replace('_', ' '))}
                        {DetailItem("Tanggal Pengajuan", new Date(submission.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-3">Detail Skripsi</h2>
                    <div className="space-y-4 pt-4">
                        {DetailItem("Topik Judul", submission.judul.topik)}
                        {DetailItem("Judul Skripsi", submission.judul.judul)}
                        {DetailItem("Pembimbing 1", submission.judul.pembimbing1)}
                        {DetailItem("Pembimbing 2", submission.judul.pembimbing2)}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-3">Dokumen Persyaratan Seminar Hasil</h2>
                    <div className="space-y-3 pt-4">
                        {FileItem("Bukti Seminar Proposal (Sempro)", buktiSemproUrl)}
                        {FileItem("Draf Skripsi Final", drafSkripsiUrl)}
                        {FileItem("Bukti Konsultasi Pembimbing", buktiKonsultasiUrl)}
                        {FileItem("Sertifikat TOEFL", sertifikatToeflUrl)}
                        {FileItem("Bukti Hafalan/Sertifikat", buktiHafalanUrl)}
                        {FileItem("Transkrip Nilai Terbaru", transkripUrl)}
                    </div>
                </div>

                <SeminarHasilActionAdmin submission={submission} />

            </div>
        </main>
    );
}