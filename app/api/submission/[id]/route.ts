import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Status, Prisma } from '@prisma/client';

type AdminActionBody = {
    action: 'VERIFY' | 'REJECT';
    catatanAdmin?: string;
    skNumberPrefix?: string; 
};

type KaprodiActionBody = {
    pembimbing1: string;
    pembimbing2: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
try {
    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return NextResponse.json({ message: 'ID pengajuan tidak valid' }, { status: 400 });
    }

    const body = await request.json();

        const { 
            action, 
            catatanAdmin, 
            skNumberPrefix, 
            pembimbing1, 
            pembimbing2 
        } = body;

        if (action) {
            let newStatus: Status;
            
            const dataToUpdate: Prisma.JudulUpdateInput = {
                catatan: catatanAdmin || null,
            };

            if (action === 'VERIFY') {
                newStatus = 'DIPROSES_KAPRODI';

                if (!skNumberPrefix) {
                    return NextResponse.json({ 
                        message: 'Nomor Urut SK wajib diisi untuk verifikasi.' 
                    }, { status: 400 });
                }
                
                const today = new Date();
                const month = (today.getMonth() + 1).toString().padStart(2, '0');
                const year = today.getFullYear();
 
                const fullSkNumber = `B.${skNumberPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;

                dataToUpdate.sk_number = fullSkNumber;
                dataToUpdate.sk_tanggal = today; 

            } else if (action === 'REJECT') {
                newStatus = 'DITOLAK_ADMIN';
                if (!catatanAdmin) {
                    return NextResponse.json({ message: 'Catatan penolakan wajib diisi' }, { status: 400 });
                }

                dataToUpdate.sk_number = null;
                dataToUpdate.sk_tanggal = null;
            } else {
                return NextResponse.json({ message: 'Aksi admin tidak valid' }, { status: 400 });
            }

            dataToUpdate.status = newStatus;

            const updatedSubmission = await prisma.judul.update({
                where: { id: submissionId },
             data: dataToUpdate,
            });
            return NextResponse.json(updatedSubmission, { status: 200 });
        }

        else if (pembimbing1) {
            if (!pembimbing1 || !pembimbing2) {
                return NextResponse.json({ message: 'Pembimbing 1 dan 2 wajib dipilih' }, { status: 400 });
            }
            if (pembimbing1 === pembimbing2) {
                return NextResponse.json({ message: 'Pembimbing 1 dan 2 tidak boleh orang yang sama' }, { status: 400 });
            }

            const updateDataKaprodi: Prisma.JudulUpdateInput = {
                pembimbing1,
                pembimbing2,
                status: 'DISETUJUI',
            };
            
            const updatedSubmission = await prisma.judul.update({
                where: { id: submissionId },
                data: updateDataKaprodi,
            });
            return NextResponse.json(updatedSubmission, { status: 200 });
        }

        else {
            return NextResponse.json({ message: 'Aksi tidak valid atau data tidak lengkap' }, { status: 400 });
        }

    } catch (error) {
        console.error("Gagal memproses aksi:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}