// src/app/dashboard/admin/arsip/page.tsx

import prisma from '@/lib/prisma';
import ArsipTable from './ArsipTable'; // Impor komponen baru

// Ambil semua data pengajuan untuk diarsipkan
async function getAllSubmissions() {
  const submissions = await prisma.thesisSubmission.findMany({
    include: {
      student: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return submissions;
}

export default async function ArsipSKPage() {
  const submissions = await getAllSubmissions();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Arsip Skripsi Mahasiswa</h1>
      
      {/* Panggil komponen ArsipTable dan kirimkan semua data ke dalamnya */}
      <ArsipTable initialSubmissions={submissions} />
    </div>
  );
}

export const revalidate = 0;