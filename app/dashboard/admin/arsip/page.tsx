// src/app/dashboard/admin/arsip/page.tsx

import prisma from '@/lib/prisma';
import ArsipTable from './ArsipTable';

// Gunakan 'force-dynamic' untuk memastikan data selalu baru
export const dynamic = 'force-dynamic';

async function getAllSubmissions() {
  const submissions = await prisma.judul.findMany({
    // --- PERUBAHAN UTAMA ADA DI SINI ---
    where: {
      // Filter ini memberitahu database untuk hanya mengambil
      // data yang statusnya 'DISETUJUI'.
      status: 'DISETUJUI',
    },
    include: {
      mahasiswa: true,
    },
    orderBy: {
      // Mengurutkan berdasarkan tanggal kapan status diubah menjadi 'DISETUJUI'
      tanggal: 'desc',
    },
  });
  return submissions;
}

export default async function ArsipSKPage() {
  const submissions = await getAllSubmissions();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Arsip Skripsi Mahasiswa</h1>
      
      {/* Komponen ArsipTable akan menerima data yang sudah difilter */}
      {/* Map `mahasiswa` -> `student` agar shape sesuai dengan yang diharapkan oleh `ArsipTable` */}
      <ArsipTable initialSubmissions={submissions.map(s => ({ ...s, student: s.mahasiswa }))} />
    </div>
  );
}