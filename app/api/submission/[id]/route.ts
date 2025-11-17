import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Status, Prisma } from '@prisma/client';


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

                
                const existingSKByPrefix = await prisma.judul.findFirst({
                    where: {
                        sk_pembimbing: {
                            startsWith: `B.${skNumberPrefix}/`
                        }
                    }
                });

                if (existingSKByPrefix) {
                    return NextResponse.json({
                        message: `Nomor urut (${skNumberPrefix}) sudah pernah dipakai sebagai SK Pembimbing sebelumnya. Harap gunakan nomor urut yang berbeda.`
                    }, { status: 409 });
                }

                const existingAsUndangan = await prisma.judul.findFirst({
                    where: {
                        no_undangan: {
                            startsWith: `B.${skNumberPrefix}/`
                        }
                    }
                });

                if (existingAsUndangan) {
                    return NextResponse.json({
                        message: `Nomor urut (${skNumberPrefix}) sudah terdaftar sebagai Undangan di dalam sistem. Harap gunakan nomor urut yang berbeda.`
                    }, { status: 409 });
                }

                const existingInProposalSK = await prisma.proposal.findFirst({
                    where: {
                        sk_penguji: {
                            startsWith: `B.${skNumberPrefix}/`
                        }
                    }
                });

                if (existingInProposalSK) {
                    return NextResponse.json({
                        message: `Nomor urut (${skNumberPrefix}) sudah terdaftar sebagai SK Penguji di proposal. Harap gunakan nomor urut yang berbeda.`
                    }, { status: 409 }); 
                }

                const existingInProposalUndangan = await prisma.proposal.findFirst({
                    where: {
                        undangan_penguji: {
                            startsWith: `B.${skNumberPrefix}/`
                        }
                    }
                });

                if (existingInProposalUndangan) {
                    return NextResponse.json({
                        message: `Nomor urut (${skNumberPrefix}) sudah terdaftar sebagai Undangan Penguji di proposal. Harap gunakan nomor urut yang berbeda.`
                    }, { status: 409 }); 
                }

                const existingInSeminarHasilSK = await prisma.seminarHasil.findFirst({
                    where: {
                        sk_penguji: {
                            startsWith: `B.${skNumberPrefix}/`
                        }
                    }
                });

                if (existingInSeminarHasilSK) {
                    return NextResponse.json({
                        message: `Nomor urut (${skNumberPrefix}) sudah terdaftar sebagai SK Penguji di seminar hasil. Harap gunakan nomor urut yang berbeda.`
                    }, { status: 409 }); 
                }

                const existingInSeminarHasilUndangan = await prisma.seminarHasil.findFirst({
                    where: {
                        undangan_penguji: {
                            startsWith: `B.${skNumberPrefix}/`
                        }
                    }
                });

                if (existingInSeminarHasilUndangan) {
                    return NextResponse.json({
                        message: `Nomor urut (${skNumberPrefix}) sudah terdaftar sebagai Undangan Penguji di seminar hasil. Harap gunakan nomor urut yang berbeda.`
                    }, { status: 409 });
                }

                dataToUpdate.  sk_pembimbing   = fullSkNumber;

                try {
                    const skNomorParts = fullSkNumber.split('/');
                    const basePart = skNomorParts[0];
                    const match = basePart.match(/^([A-Za-z]+\.?)([\d]+)$/);

                    if (match) {
                        const prefix = match[1];
                        const numberStr = match[2];
                        const parsedInt = parseInt(numberStr);

                        if (!isNaN(parsedInt)) {
                            const nextInt = parsedInt + 1;
                            const remainingParts = skNomorParts.slice(1).join('/');
                            dataToUpdate.no_undangan = `${prefix}${nextInt}/${remainingParts}`;
                        } else {
                            dataToUpdate.no_undangan = `B.${parseInt(skNumberPrefix) + 1}/${skNomorParts.slice(1).join('/')}`;
                        }
                    } else {
                        dataToUpdate.no_undangan = `B.${parseInt(skNumberPrefix) + 1}/Un.13/FST/PP.00.9/${month}/${year}`;
                    }
                } catch (error) {
                    dataToUpdate.no_undangan = `B.${parseInt(skNumberPrefix) + 1}/Un.13/FST/PP.00.9/${month}/${year}`;
                    console.error("Error parsing SK number for increment, using default fallback:", error);
                }

            } else if (action === 'REJECT') {
                newStatus = 'DITOLAK_ADMIN';
                if (!catatanAdmin) {
                    return NextResponse.json({ message: 'Catatan penolakan wajib diisi' }, { status: 400 });
                }
        
                dataToUpdate.  sk_pembimbing   = null;
                dataToUpdate.no_undangan = null;
    
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