import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Status } from '@prisma/client';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const seminarHasilId = parseInt(params.id, 10); 

    if (isNaN(seminarHasilId)) {
        return NextResponse.json({ message: 'ID Seminar Hasil tidak valid.' }, { status: 400 }); 
    }

    try {
        const body = await request.json();
        const { action, catatan } = body;

        if (action !== 'APPROVE' && action !== 'REJECT') {
            return NextResponse.json({ message: 'Aksi tidak valid.' }, { status: 400 });
        }

        let newStatus: Status;
        let catatanUpdate: string | null = null;

        if (action === 'APPROVE') {
            newStatus = Status.DIPROSES_KAPRODI;

        } else {
            newStatus = Status.DITOLAK_ADMIN;
            catatanUpdate = catatan;
        }

        const updatedSeminarHasil = await prisma.seminarHasil.update({
            where: { id: seminarHasilId },
            data: {
                status: newStatus,
                catatan: catatanUpdate,
            },
        });

        return NextResponse.json({
            message: 'Status Seminar Hasil berhasil diperbarui dan diteruskan ke Kaprodi.', 
            status: updatedSeminarHasil.status,
            catatan: updatedSeminarHasil.catatan
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating seminar hasil status:', error);
        return NextResponse.json({ message: 'Terjadi kesalahan saat memperbarui status Seminar Hasil.' }, { status: 500 });
    }
}