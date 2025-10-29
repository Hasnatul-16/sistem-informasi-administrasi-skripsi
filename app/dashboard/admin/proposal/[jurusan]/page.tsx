// app/dashboard/admin/proposal/[jurusan]/page.tsx
import prisma from '@/lib/prisma';
import { Jurusan, Status } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
// Import komponen client yang baru
import ProposalVerificationClientPage from './ProposalVerificationClientPage'; 

export const dynamic = 'force-dynamic';

// Fungsi mengambil SEMUA data proposal untuk jurusan tertentu
// --- PERUBAHAN: Hapus filter status 'TERKIRIM' ---
async function getAllProposalsByJurusan(jurusan: Jurusan) {
  const submissions = await prisma.proposal.findMany({
    where: {
      judul: { 
        jurusan: jurusan,
      },
      // Hapus filter status, ambil semua
    },
    include: {
      judul: { 
        include: {
          mahasiswa: true 
        }
      }
    },
    orderBy: {
      tanggal: 'desc', // Tampilkan yang terbaru dulu
    },
  });
  return submissions;
}

export default async function SeminarProposalVerificationPage({ params }: { params: { jurusan: string } }) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
      return <div className="p-4 text-red-600 font-medium">Akses ditolak.</div>;
  }

  const jurusanParam = params.jurusan.toUpperCase() as Jurusan;

  if (!Object.values(Jurusan).includes(jurusanParam)) {
    return <div className="p-4 text-red-600 font-medium">Jurusan tidak valid.</div>;
  }

  // Ambil SEMUA data dari database
  const allProposals = await getAllProposalsByJurusan(jurusanParam);
  // Format nama jurusan untuk tampilan
  const jurusanName = jurusanParam === 'SISTEM_INFORMASI' ? 'Sistem Informasi' : 'Matematika';

  return (
    // Kirim semua data dan nama jurusan ke komponen client
    <ProposalVerificationClientPage
      initialProposals={allProposals}
      jurusanName={jurusanName}
    />
  );
}