// app/dashboard/kaprodi/pengajuan-judul/page.tsx

import { PrismaClient, Jurusan } from '@prisma/client';
import KaprodiSubmissionTable from '../KaprodiSubmissionTable'; 
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

async function getDataForKaprodi(jurusanKaprodi: Jurusan) {
  // --- PERBAIKAN LOGIKA UTAMA DI SINI ---
  const submissions = await prisma.judul.findMany({
    where: {
      jurusan: jurusanKaprodi,
      // Hanya ambil data dengan status yang relevan untuk Kaprodi
      status: {
        in: ['DIPROSES_KAPRODI', 'DISETUJUI']
      }
    },
    include: {
     mahasiswa: { include: { user: true } },
    },
    orderBy: { tanggal: 'desc' }, // Urutkan dari yang terbaru diproses
  });

  const lecturers = await prisma.dosen.findMany({
    where: {
      jurusan: jurusanKaprodi,
    },
  });

  return { submissions, lecturers };
}

export default async function PengajuanJudulPage() {
  const session = await getServerSession(authOptions);
  const kaprodiJurusan = session?.user?.jurusan as Jurusan | undefined;

  if (!kaprodiJurusan) {
    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
        </main>
    );
  }

  const { submissions, lecturers } = await getDataForKaprodi(kaprodiJurusan);

  return (
    <main className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Persetujuan Judul Skripsi</h1>
            <p className="mt-1 text-gray-600">Tetapkan dosen pembimbing untuk pengajuan dari jurusan: <strong>{kaprodiJurusan.replace('_', ' ')}</strong></p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <KaprodiSubmissionTable initialSubmissions={submissions} lecturers={lecturers} />
        </div>
    </main>
  );
}

export const revalidate = 0;