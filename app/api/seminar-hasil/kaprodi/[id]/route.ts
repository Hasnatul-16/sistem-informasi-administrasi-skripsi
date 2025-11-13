import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Status } from '@prisma/client';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const seminarHasilId = parseInt(resolvedParams.id, 10);
        if (isNaN(seminarHasilId)) {
            return NextResponse.json({ message: 'ID seminar hasil tidak valid' }, { status: 400 });
        }

        const body = await request.json();
        const { penguji1, penguji2, jadwalSidang, tempat } = body; 

        if (!penguji1 || !penguji2 || !jadwalSidang || !tempat) {
            return NextResponse.json({ message: 'Data Dosen Penguji 1, Penguji 2,Jadwal dan Tempat Sidang wajib diisi.' }, { status: 400 });
        }

        const updatedSeminarHasil = await prisma.seminarHasil.update({
            where: { id: seminarHasilId },
            data: {
                penguji1: penguji1,
                penguji2: penguji2,
                jadwal_sidang: new Date(jadwalSidang), 
                tempat: tempat,
                status: Status.DISETUJUI,
            },

            include: {
                judul: {
                    include: {
                        mahasiswa: { include: { user: true } },
                        proposal: { select: { penguji: true }, orderBy: { tanggal: 'desc' }, take: 1 }
                    }
                }
            }
        });

        const seminarHasilWithPengujiSempro = {
            ...updatedSeminarHasil,
            pengujiSempro: updatedSeminarHasil.judul.proposal[0]?.penguji || null
        };

        return NextResponse.json(seminarHasilWithPengujiSempro, { status: 200 });

    } catch (error) {
        console.error("Gagal memproses aksi Kaprodi Seminar Hasil:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}