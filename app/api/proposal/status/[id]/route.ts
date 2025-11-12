import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Status, Prisma } from '@prisma/client';

type AdminActionBody = {
    action: 'VERIFY' | 'REJECT'; 
    catatan?: string;
    skPengujiPrefix?: string; 
};

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const proposalId = parseInt(id, 10);

    if (isNaN(proposalId)) {
        return NextResponse.json({ message: 'ID Proposal tidak valid.' }, { status: 400 });
    }

    try {
        const body: AdminActionBody = await request.json();
        const { action, catatan, skPengujiPrefix } = body;

       
        if (action !== 'VERIFY' && action !== 'REJECT') {
            return NextResponse.json({ message: 'Aksi tidak valid.' }, { status: 400 });
        }

        let newStatus: Status; 
        const dataToUpdate: Prisma.ProposalUpdateInput = {
            catatan: catatan || null,
        };

        if (action === 'VERIFY') {
          
            newStatus = Status.DIPROSES_KAPRODI; 
            
            if (!skPengujiPrefix) {
                return NextResponse.json({ 
                    message: 'Nomor Urut SK Penguji wajib diisi untuk verifikasi.' 
                }, { status: 400 });
            }
            
            const today = new Date();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear();
     
            const fullSkPenguji = `B.${skPengujiPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;

            dataToUpdate.sk_penguji = fullSkPenguji;

            try {
                const skNomorParts = fullSkPenguji.split('/');
                const basePart = skNomorParts[0];
                const match = basePart.match(/^([A-Za-z]+\.?)([\d]+)$/);

                if (match) {
                    const prefix = match[1];
                    const numberStr = match[2];
                    const parsedInt = parseInt(numberStr);

                    if (!isNaN(parsedInt)) {
                        const nextInt = parsedInt + 1;
                        const remainingParts = skNomorParts.slice(1).join('/');
                        dataToUpdate.undangan_penguji = `${prefix}${nextInt}/${remainingParts}`;
                    } else {
                        dataToUpdate.undangan_penguji = `B.${parseInt(skPengujiPrefix) + 1}/${skNomorParts.slice(1).join('/')}`;
                    }
                } else {
                  
                  dataToUpdate.undangan_penguji = `B.${parseInt(skPengujiPrefix) + 1}/Un.13/FST/PP.00.9/${month}/${year}`;
                }
            } catch (error) {
                dataToUpdate.undangan_penguji = `B.${parseInt(skPengujiPrefix) + 1}/Un.13/FST/PP.00.9/${month}/${year}`;
                console.error("Error parsing SK number for increment, using default fallback:", error);
            }

        } else { 
          
            newStatus = Status.DITOLAK_ADMIN; 
            
            if (!catatan) {
                return NextResponse.json({ message: 'Alasan penolakan wajib diisi' }, { status: 400 });
            }
      
            dataToUpdate.sk_penguji = null;
            dataToUpdate.undangan_penguji = null;
        }

        dataToUpdate.status = newStatus;


        const updatedProposal = await prisma.proposal.update({
            where: { id: proposalId },
            data: dataToUpdate,
        });

    
        return NextResponse.json({ 
            message: `Status proposal berhasil diperbarui dan diteruskan ke Kaprodi dengan status: ${newStatus}`,
            status: updatedProposal.status,
            catatan: updatedProposal.catatan
        }, { status: 200 });

    } catch (error) {
        console.error('API Error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: 'Proposal tidak ditemukan.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Gagal memperbarui status proposal.' }, { status: 500 });
    }
}