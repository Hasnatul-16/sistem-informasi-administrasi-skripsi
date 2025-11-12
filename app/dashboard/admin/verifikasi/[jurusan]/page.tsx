import prisma from '@/lib/prisma';
import { Jurusan } from '@prisma/client';
import VerificationClientPage from './VerificationClientPage';

export const dynamic = 'force-dynamic';


async function getAllSubmissionsByJurusan(jurusan: Jurusan) {
  const submissions = await prisma.judul.findMany({
    where: {
      jurusan: jurusan,
    },
    orderBy: { tanggal: 'desc' },
    include: {
      mahasiswa: { include: { user: true } },
    },
  });
  return submissions;
}

export default async function AdminVerificationPageByJurusan({ params }: { params: Promise<{ jurusan: string }> }) {
  const { jurusan } = await params;
  const jurusanParam = jurusan.toUpperCase();
  const validatedJurusan = Object.values(Jurusan).includes(jurusanParam as Jurusan)
    ? (jurusanParam as Jurusan)
    : undefined;

  if (!validatedJurusan) {
    return <div className="p-4">Jurusan tidak valid.</div>;
  }

  const jurusanName = validatedJurusan.replace('_', ' ');
  const allSubmissions = await getAllSubmissionsByJurusan(validatedJurusan);

  return (
 
    <VerificationClientPage 
      initialSubmissions={allSubmissions.map(s => ({ ...s, student: s.mahasiswa }))} 
      jurusanName={jurusanName} 
    />
  );
}