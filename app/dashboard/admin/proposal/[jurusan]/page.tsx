
import prisma from '@/lib/prisma';
import { Jurusan } from '@prisma/client';
import { authOptions } from '@/app/api/auth/auth';
import { getServerSession } from 'next-auth';

import ProposalVerificationClientPage from './ProposalVerificationClientPage'; 

export const dynamic = 'force-dynamic';


async function getAllProposalsByJurusan(jurusan: Jurusan) {
  const submissions = await prisma.proposal.findMany({
    where: {
      judul: { 
        jurusan: jurusan,
      },
     
    },
    include: {
      judul: { 
        include: {
          mahasiswa: true 
        }
      }
    },
    orderBy: {
      tanggal: 'desc', 
    },
  });
  return submissions;
}

export default async function SeminarProposalVerificationPage({ params }: { params: Promise<{ jurusan: string }> }) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
      return <div className="p-4 text-red-600 font-medium">Akses ditolak.</div>;
  }

  const { jurusan } = await params;
  const jurusanParam = jurusan.toUpperCase() as Jurusan;
  if (!Object.values(Jurusan).includes(jurusanParam)) {
    return <div className="p-4 text-red-600 font-medium">Jurusan tidak valid.</div>;
  }

  
  const allProposals = await getAllProposalsByJurusan(jurusanParam);
 
  const jurusanName = jurusanParam === 'SISTEM_INFORMASI' ? 'Sistem Informasi' : 'Matematika';

  return (
   
    <ProposalVerificationClientPage
      initialProposals={allProposals}
      jurusanName={jurusanName}
    />
  );
}