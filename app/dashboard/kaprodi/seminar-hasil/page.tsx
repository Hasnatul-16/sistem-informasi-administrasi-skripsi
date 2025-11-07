import { PrismaClient, Jurusan } from '@prisma/client';
import KaprodiHasilTable from './KaprodiHasilTable'; 
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

async function getDataForKaprodi(jurusanKaprodi: Jurusan) {
    const seminarHasil = await prisma.seminarHasil.findMany({
        where: {
            judul: {
                jurusan: jurusanKaprodi,
            },
            status: {
                in: ['DIPROSES_KAPRODI', 'DISETUJUI'] 
            }
        },
        include: {
            judul: {
                include: {
                    mahasiswa: { include: { user: true } },
                    proposal: {
                        select: { penguji: true },
                        orderBy: { tanggal: 'desc' },
                        take: 1
                    }
                }
            }
        },
        orderBy: { tanggal: 'desc' },
    });

    const lecturers = await prisma.dosen.findMany({
        where: {
            jurusan: jurusanKaprodi,
        },
    });


    const seminarHasilWithPengujiSempro = seminarHasil.map(sh => ({
        ...sh,
      
        pengujiSempro: sh.judul.proposal[0]?.penguji || null
    }));
    return { seminarHasil: seminarHasilWithPengujiSempro, lecturers };
}


export default async function SeminarHasilPage() { 
    const session = await getServerSession(authOptions);
    const kaprodiJurusan = session?.user?.jurusan as Jurusan | undefined;

    if (!kaprodiJurusan) {
        return (
            <main className="p-8">
                <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
            </main>
        );
    }

    const { seminarHasil, lecturers } = await getDataForKaprodi(kaprodiJurusan);

    return (
        <main className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Persetujuan Sidang Skripsi</h1> 
                <p className="mt-1 text-gray-600">Tetapkan penguji dan jadwal sidang untuk sidang skripsi dari jurusan: <strong>{kaprodiJurusan.replace('_', ' ')}</strong></p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border">
             
                <KaprodiHasilTable initialSeminarHasil={seminarHasil} lecturers={lecturers} />
            </div>
        </main>
    );
}

export const revalidate = 0;