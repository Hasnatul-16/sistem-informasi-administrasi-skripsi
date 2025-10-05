import { PrismaClient, Jurusan } from '@prisma/client';
import KaprodiSubmissionTable from './KaprodiSubmissionTable';

const prisma = new PrismaClient();

// Di aplikasi nyata, JURUSAN_KAPRODI akan didapat dari data sesi login
const JURUSAN_KAPRODI: Jurusan = 'SISTEM_INFORMASI'; 

async function getDataForKaprodi() {
  const submissions = await prisma.thesisSubmission.findMany({
    where: {
      status: 'DIPROSES_KAPRODI',
      student: {
        jurusan: JURUSAN_KAPRODI,
      },
    },
    include: {
      student: { include: { user: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const lecturers = await prisma.dosen.findMany({
    where: {
      jurusan: JURUSAN_KAPRODI,
    },
  });

  return { submissions, lecturers };
}

export default async function KaprodiDashboardPage() {
  const { submissions, lecturers } = await getDataForKaprodi();

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dasbor Kaprodi - Penetapan Pembimbing</h1>
        <h2 className="text-xl font-medium text-gray-700 mb-6">Jurusan: {JURUSAN_KAPRODI.replace('_', ' ')}</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <KaprodiSubmissionTable initialSubmissions={submissions} lecturers={lecturers} />
        </div>
      </div>
    </main>
  );
}

export const revalidate = 0;