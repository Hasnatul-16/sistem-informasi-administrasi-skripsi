// app/dashboard/kaprodi/page.tsx

import { PrismaClient, Jurusan } from '@prisma/client';
import KaprodiSubmissionTable from './KaprodiSubmissionTable';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// --- PERUBAHAN 1: Buat fungsi data menjadi dinamis ---
async function getDataForKaprodi(jurusanKaprodi: Jurusan) {
  const submissions = await prisma.thesisSubmission.findMany({
    where: {
      status: 'DIPROSES_KAPRODI',
      // Gunakan parameter, bukan konstanta
      jurusan: jurusanKaprodi,
    },
    include: {
      student: { include: { user: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const lecturers = await prisma.dosen.findMany({
    where: {
      // Gunakan parameter, bukan konstanta
      jurusan: jurusanKaprodi,
    },
  });

  return { submissions, lecturers };
}

export default async function KaprodiDashboardPage() {
  // --- PERUBAHAN 2: Dapatkan sesi dan jurusan Kaprodi ---
  const session = await getServerSession(authOptions);
  const kaprodiJurusan = session?.user?.jurusan;

  // Jika pengguna bukan Kaprodi atau tidak punya jurusan, tampilkan pesan error
  if (!kaprodiJurusan) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
        <p className="text-gray-700 mt-2">Anda tidak memiliki hak akses untuk halaman ini atau data jurusan tidak ditemukan.</p>
      </main>
    );
  }

  const { submissions, lecturers } = await getDataForKaprodi(kaprodiJurusan as Jurusan);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dasbor Kaprodi - Penetapan Pembimbing</h1>
        {/* Tampilkan jurusan secara dinamis */}
        <h2 className="text-xl font-medium text-gray-700 mb-6">Jurusan: {kaprodiJurusan.replace('_', ' ')}</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <KaprodiSubmissionTable initialSubmissions={submissions} lecturers={lecturers} />
        </div>
      </div>
    </main>
  );
}

export const revalidate = 0;
