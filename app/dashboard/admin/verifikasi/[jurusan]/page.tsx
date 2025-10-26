// app/dashboard/admin/verifikasi/[jurusan]/page.tsx

import prisma from '@/lib/prisma';
import { Jurusan } from '@prisma/client';
import VerificationClientPage from './VerificationClientPage'; // Impor komponen client baru

export const dynamic = 'force-dynamic';

// Fungsi untuk mengambil SEMUA data pengajuan berdasarkan jurusan
async function getAllSubmissionsByJurusan(jurusan: Jurusan) {
  const submissions = await prisma.judul.findMany({
    where: {
      jurusan: jurusan,
      // --- PERBAIKAN: Hapus filter status: 'TERKIRIM' ---
      // Sekarang kita ambil semua status
    },
    orderBy: { tanggal: 'desc' },
    include: {
      mahasiswa: { include: { user: true } },
    },
  });
  return submissions;
}

export default async function AdminVerificationPageByJurusan({ params }: { params: { jurusan: string } }) {
  const jurusanParam = params.jurusan.toUpperCase();
  const jurusan = Object.values(Jurusan).includes(jurusanParam as Jurusan) 
    ? (jurusanParam as Jurusan)
    : undefined;

  if (!jurusan) {
    return <div className="p-4">Jurusan tidak valid.</div>;
  }

  const jurusanName = jurusan.replace('_', ' ');
  const allSubmissions = await getAllSubmissionsByJurusan(jurusan);

  return (
    // Render komponen client dan kirim semua data sebagai props
    <VerificationClientPage 
      initialSubmissions={allSubmissions.map(s => ({ ...s, student: s.mahasiswa }))} 
      jurusanName={jurusanName} 
    />
  );
}