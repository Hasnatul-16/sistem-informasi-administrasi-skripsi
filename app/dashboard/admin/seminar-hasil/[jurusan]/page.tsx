import prisma from '@/lib/prisma';
import { Jurusan} from '@prisma/client';
import { authOptions } from '@/app/api/auth/auth';
import { getServerSession } from 'next-auth';
import SeminarHasilVerificationClientPage from './SeminarHasilVerificationClientPage';

export const dynamic = 'force-dynamic';

async function getAllSeminarHasilByJurusan(jurusan: Jurusan) {
    const submissions = await prisma.seminarHasil.findMany({
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

export default async function SeminarHasilVerificationPage({ params }: { params: Promise<{ jurusan: string }> }) { // <-- PERUBAHAN NAMA
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'ADMIN') {
        return <div className="p-4 text-red-600 font-medium">Akses ditolak.</div>;
    }

    const { jurusan } = await params;
    const jurusanParam = jurusan.toUpperCase() as Jurusan;

    if (!Object.values(Jurusan).includes(jurusanParam)) {
        return <div className="p-4 text-red-600 font-medium">Jurusan tidak valid.</div>;
    }

    const allSeminarHasil = await getAllSeminarHasilByJurusan(jurusanParam); 
    const jurusanName = jurusanParam === 'SISTEM_INFORMASI' ? 'Sistem Informasi' : 'Matematika';

    return (
        <SeminarHasilVerificationClientPage 
            initialSeminarHasil={allSeminarHasil} 
            jurusanName={jurusanName}
        />
    );
}