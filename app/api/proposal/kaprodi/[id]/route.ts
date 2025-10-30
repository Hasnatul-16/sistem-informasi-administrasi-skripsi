

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Status } from '@prisma/client';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const proposalId = parseInt(params.id, 10);
        if (isNaN(proposalId)) {
            return NextResponse.json({ message: 'ID proposal tidak valid' }, { status: 400 });
        }

        const body = await request.json();
       
        const { penguji, jadwalSidang } = body;

       
        if (!penguji || !jadwalSidang) {
            return NextResponse.json({ message: 'Data Dosen Penguji dan Jadwal Sidang wajib diisi.' }, { status: 400 });
        }

        const updatedProposal = await prisma.proposal.update({
            where: { id: proposalId },
            data: {
                penguji: penguji, 
                jadwal_sidang: new Date(jadwalSidang), 
                
                status: Status.DISETUJUI,
            },
        });

      
        return NextResponse.json(updatedProposal, { status: 200 });

    } catch (error) {
        console.error("Gagal memproses aksi Kaprodi:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}