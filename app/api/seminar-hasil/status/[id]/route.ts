import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Status, Prisma } from '@prisma/client';

type AdminActionBody = {
    action: 'VERIFY' | 'REJECT' | 'FINISH';
    catatan?: string;
    skPengujiPrefix?: string;
    undanganPengujiPrefix?: string; 
};

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const seminarHasilId = parseInt(id, 10);

    if (isNaN(seminarHasilId)) {
        return NextResponse.json({ message: 'ID Sidang Skripsi tidak valid.' }, { status: 400 });
    }

    try {
        const body: AdminActionBody = await request.json();
        const { action, catatan, skPengujiPrefix, undanganPengujiPrefix } = body;


        if (action !== 'VERIFY' && action !== 'REJECT' && action !== 'FINISH') {
            return NextResponse.json({ message: 'Aksi tidak valid.' }, { status: 400 });
        }

        let newStatus: Status;
        const dataToUpdate: Prisma.SeminarHasilUpdateInput = {
            catatan: catatan || null,
        };


        if (action === 'VERIFY') {
            newStatus = Status.DIPROSES_KAPRODI;
            if (skPengujiPrefix && /^\d+$/.test(skPengujiPrefix)) { 
                
                const today = new Date();
                const month = (today.getMonth() + 1).toString().padStart(2, '0');
                const year = today.getFullYear();
                const baseNumberInt = parseInt(skPengujiPrefix);

                const undanganPrefix = (baseNumberInt + 1).toString();
                const munaqasahPrefix = (baseNumberInt + 2).toString();

                const existingSKByPrefix = await prisma.seminarHasil.findFirst({
                    where: { sk_penguji: { startsWith: `B.${skPengujiPrefix}/` } }
                });
                if (existingSKByPrefix) {
                    return NextResponse.json({ 
                        message: `Nomor urut (${skPengujiPrefix}) sudah terdaftar sebagai SK Penguji` 
                    }, { status: 409 });
                }

                const skAsUndangan = await prisma.seminarHasil.findFirst({
                    where: { undangan_penguji: { startsWith: `B.${skPengujiPrefix}/` } }
                });
                if (skAsUndangan) {
                    return NextResponse.json({ 
                        message: `Nomor urut (${skPengujiPrefix}) sudah terdaftar sebagai Undangan Penguji` 
                    }, { status: 409 });
                }

                const skAsMunaqasah = await prisma.seminarHasil.findFirst({
                    where: { undangan_munaqasah: { startsWith: `B.${skPengujiPrefix}/` } }
                });
                if (skAsMunaqasah) {
                    return NextResponse.json({ 
                        message: `Nomor urut (${skPengujiPrefix}) sudah terdaftar sebagai Undangan Munaqasah` 
                    }, { status: 409 });
                }

                const existingUndanganPengujiByPrefix = await prisma.seminarHasil.findFirst({
                    where: { undangan_penguji: { startsWith: `B.${undanganPrefix}/` } }
                });
                if (existingUndanganPengujiByPrefix) {
                    return NextResponse.json({ 
                        message: `Nomor urut (${undanganPrefix}) sudah terdaftar sebagai Undangan Penguji` 
                    }, { status: 409 });
                }

                const undanganAsSkPenguji = await prisma.seminarHasil.findFirst({
                    where: { sk_penguji: { startsWith: `B.${undanganPrefix}/` } }
                });
                if (undanganAsSkPenguji) {
                    return NextResponse.json({ 
                        message: `Nomor urut (${undanganPrefix}) sudah terdaftar sebagai SK Penguji` 
                    }, { status: 409 });
                }

                const undanganAsMunaqasah = await prisma.seminarHasil.findFirst({
                    where: { undangan_munaqasah: { startsWith: `B.${undanganPrefix}/` } }
                });
                if (undanganAsMunaqasah) {
                    return NextResponse.json({ 
                        message: `Nomor urut (${undanganPrefix}) sudah terdaftar sebagai Undangan Munaqasah` 
                    }, { status: 409 });
                }

                const existingMunaqasahByPrefix = await prisma.seminarHasil.findFirst({
                    where: { undangan_munaqasah: { startsWith: `B.${munaqasahPrefix}/` } }
                });
                if (existingMunaqasahByPrefix) {
                    return NextResponse.json({ 
                        message: `Nomor urut (${munaqasahPrefix}) sudah terdaftar sebagai Undangan Munaqasah` 
                    }, { status: 409 });
                }

                const munaqasahAsSk = await prisma.seminarHasil.findFirst({
                    where: { sk_penguji: { startsWith: `B.${munaqasahPrefix}/` } }
                });
                if (munaqasahAsSk) {
                    return NextResponse.json({ 
                        message: `Nomor urut (${munaqasahPrefix}) sudah terdaftar sebagai SK Penguji` 
                    }, { status: 409 });
                }

                const munaqasahAsUndangan = await prisma.seminarHasil.findFirst({
                    where: { undangan_penguji: { startsWith: `B.${munaqasahPrefix}/` } }
                });
                if (munaqasahAsUndangan) {
                    return NextResponse.json({ 
                        message: `Nomor urut (${munaqasahPrefix}) sudah terdaftar sebagai Undangan Penguji` 
                    }, { status: 409 });
                }

                const existingSKInProposal = await prisma.proposal.findFirst({
                where: {
                    OR: [
                        { sk_penguji: { startsWith: `B.${skPengujiPrefix}/` } },
                        { undangan_penguji: { startsWith: `B.${skPengujiPrefix}/` } },
                    ]
                }
            });

            if (existingSKInProposal) {
                return NextResponse.json({
                    message: `Nomor urut (${skPengujiPrefix}) sudah digunakan di SK Proposal. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }

            const existingSKJudul = await prisma.judul.findFirst({
                where: {
                    OR: [
                        { sk_pembimbing: { startsWith: `B.${skPengujiPrefix}/` } },
                        { no_undangan: { startsWith: `B.${skPengujiPrefix}/` } },
                    ]
                }
            });

            if (existingSKJudul) {
                return NextResponse.json({
                    message: `Nomor urut (${skPengujiPrefix}) sudah digunakan di Sk Pembimbing. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }

            const existingUndanganInProposal = await prisma.proposal.findFirst({
                where: {
                    OR: [
                        { sk_penguji: { startsWith: `B.${undanganPrefix}/` } },
                        { undangan_penguji: { startsWith: `B.${undanganPrefix}/` } },
                    ]
                }
            });

            if (existingUndanganInProposal) {
                return NextResponse.json({
                    message: `Nomor urut (${undanganPrefix}) sudah digunakan di SK Proposal. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }

            const existingUndanganInJudul = await prisma.judul.findFirst({
                where: {
                    OR: [
                        { sk_pembimbing: { startsWith: `B.${undanganPrefix}/` } },
                        { no_undangan: { startsWith: `B.${undanganPrefix}/` } },
                    ]
                }
            });

            if (existingUndanganInJudul) {
                return NextResponse.json({
                    message: `Nomor urut (${undanganPrefix}) sudah digunakan di Sk Pembimbing. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }

            const existingMunaqasahInProposal = await prisma.proposal.findFirst({
                where: {
                    OR: [
                        { sk_penguji: { startsWith: `B.${munaqasahPrefix}/` } },
                        { undangan_penguji: { startsWith: `B.${munaqasahPrefix}/` } },
                    ]
                }
            });

            if (existingMunaqasahInProposal) {
                return NextResponse.json({
                    message: `Nomor urut (${munaqasahPrefix}) sudah digunakan di SK Proposal. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }

            const existingMunaqasahInJudul = await prisma.judul.findFirst({
                where: {
                    OR: [
                        { sk_pembimbing: { startsWith: `B.${munaqasahPrefix}/` } },
                        { no_undangan: { startsWith: `B.${munaqasahPrefix}/` } },
                    ]
                }
            });

            if (existingMunaqasahInJudul) {
                return NextResponse.json({
                    message: `Nomor urut (${munaqasahPrefix}) sudah digunakan di Sk Pembimbing. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }


                const fullSkPenguji = `B.${skPengujiPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;
                const fullUndanganPenguji = `B.${undanganPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;
                const fullUndanganMunaqasah = `B.${munaqasahPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;
                
                dataToUpdate.sk_penguji = fullSkPenguji;
                dataToUpdate.undangan_penguji = fullUndanganPenguji;
                dataToUpdate.undangan_munaqasah = fullUndanganMunaqasah;


            } else {
                 return NextResponse.json({ message: 'Nomor Urut SK (Prefix) wajib diisi dan harus berupa angka untuk verifikasi.' }, { status: 400 });
            }
        }

        else if (action === 'FINISH') {
            newStatus = Status.DISETUJUI;

            if (!skPengujiPrefix || !undanganPengujiPrefix) {
                 return NextResponse.json({
                    message: 'Nomor Urut SK Penguji dan Undangan wajib diisi untuk persetujuan akhir (DISETUJUI).'
                }, { status: 400 });
            }
            
            const today = new Date();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear();

            const undanganPrefixInt = parseInt(undanganPengujiPrefix);
            const munaqasahPrefix = (undanganPrefixInt + 1).toString();

            const existingSKByPrefix = await prisma.seminarHasil.findFirst({
                where: { sk_penguji: { startsWith: `B.${skPengujiPrefix}/` } }
            });
            if (existingSKByPrefix) {
                return NextResponse.json({ 
                    message: `Nomor urut (${skPengujiPrefix}) sudah terdaftar sebagai SK Penguji` 
                }, { status: 409 });
            }

            const skAsUndangan = await prisma.seminarHasil.findFirst({
                where: { undangan_penguji: { startsWith: `B.${skPengujiPrefix}/` } }
            });
            if (skAsUndangan) {
                return NextResponse.json({ 
                    message: `Nomor urut (${skPengujiPrefix}) sudah terdaftar sebagai Undangan Penguji` 
                }, { status: 409 });
            }

            const skAsMunaqasah = await prisma.seminarHasil.findFirst({
                where: { undangan_munaqasah: { startsWith: `B.${skPengujiPrefix}/` } }
            });
            if (skAsMunaqasah) {
                return NextResponse.json({ 
                    message: `Nomor urut (${skPengujiPrefix}) sudah terdaftar sebagai Undangan Munaqasah` 
                }, { status: 409 });
            }

            const existingUndanganPengujiByPrefix = await prisma.seminarHasil.findFirst({
                where: { undangan_penguji: { startsWith: `B.${undanganPengujiPrefix}/` } }
            });
            if (existingUndanganPengujiByPrefix) {
                return NextResponse.json({ 
                    message: `Nomor urut (${undanganPengujiPrefix}) sudah terdaftar sebagai Undangan Penguji` 
                }, { status: 409 });
            }

            const undanganAsSkPenguji = await prisma.seminarHasil.findFirst({
                where: { sk_penguji: { startsWith: `B.${undanganPengujiPrefix}/` } }
            });
            if (undanganAsSkPenguji) {
                return NextResponse.json({ 
                    message: `Nomor urut (${undanganPengujiPrefix}) sudah terdaftar sebagai SK Penguji` 
                }, { status: 409 });
            }

            const undanganAsMunaqasah = await prisma.seminarHasil.findFirst({
                where: { undangan_munaqasah: { startsWith: `B.${undanganPengujiPrefix}/` } }
            });
            if (undanganAsMunaqasah) {
                return NextResponse.json({ 
                    message: `Nomor urut (${undanganPengujiPrefix}) sudah terdaftar sebagai Undangan Munaqasah` 
                }, { status: 409 });
            }

            const existingMunaqasahByPrefix = await prisma.seminarHasil.findFirst({
                where: { undangan_munaqasah: { startsWith: `B.${munaqasahPrefix}/` } }
            });
            if (existingMunaqasahByPrefix) {
                return NextResponse.json({ 
                    message: `Nomor urut (${munaqasahPrefix}) sudah terdaftar sebagai Undangan Munaqasah` 
                }, { status: 409 });
            }

            const munaqasahAsSk = await prisma.seminarHasil.findFirst({
                where: { sk_penguji: { startsWith: `B.${munaqasahPrefix}/` } }
            });
            if (munaqasahAsSk) {
                return NextResponse.json({ 
                    message: `Nomor urut (${munaqasahPrefix}) sudah terdaftar sebagai SK Penguji` 
                }, { status: 409 });
            }

            const munaqasahAsUndangan = await prisma.seminarHasil.findFirst({
                where: { undangan_penguji: { startsWith: `B.${munaqasahPrefix}/` } }
            });
            if (munaqasahAsUndangan) {
                return NextResponse.json({ 
                    message: `Nomor urut (${munaqasahPrefix}) sudah terdaftar sebagai Undangan Penguji` 
                }, { status: 409 });
            }

             const existingSKPengujiInProposal = await prisma.proposal.findFirst({
                where: {
                    OR: [
                        { sk_penguji: { startsWith: `B.${skPengujiPrefix}/` } },
                        { undangan_penguji: { startsWith: `B.${skPengujiPrefix}/` } },
                    ]
                }
            });

            if (existingSKPengujiInProposal) {
                return NextResponse.json({
                    message: `Nomor urut (${skPengujiPrefix}) sudah digunakan di SK Proposal. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }

            // === VALIDASI BARU: Cek apakah prefix SK Penguji sudah digunakan di tabel Judul ===
            const existingSKPengujiInJudul = await prisma.judul.findFirst({
                where: {
                    OR: [
                        { sk_pembimbing: { startsWith: `B.${skPengujiPrefix}/` } },
                        { no_undangan: { startsWith: `B.${skPengujiPrefix}/` } },
                    ]
                }
            });

            if (existingSKPengujiInJudul) {
                return NextResponse.json({
                    message: `Nomor urut (${skPengujiPrefix}) sudah digunakan di Sk Pembimbing. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }

            // === VALIDASI BARU: Cek apakah prefix Undangan Penguji sudah digunakan di tabel Proposal ===
            const existingUndanganInProposal = await prisma.proposal.findFirst({
                where: {
                    OR: [
                        { sk_penguji: { startsWith: `B.${undanganPengujiPrefix}/` } },
                        { undangan_penguji: { startsWith: `B.${undanganPengujiPrefix}/` } },
                    ]
                }
            });

            if (existingUndanganInProposal) {
                return NextResponse.json({
                    message: `Nomor urut (${undanganPengujiPrefix}) sudah digunakan di SK Proposal. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }

            // === VALIDASI BARU: Cek apakah prefix Undangan Penguji sudah digunakan di tabel Judul ===
            const existingUndanganInJudul = await prisma.judul.findFirst({
                where: {
                    OR: [
                        { sk_pembimbing: { startsWith: `B.${undanganPengujiPrefix}/` } },
                        { no_undangan: { startsWith: `B.${undanganPengujiPrefix}/` } },
                    ]
                }
            });

            if (existingUndanganInJudul) {
                return NextResponse.json({
                    message: `Nomor urut (${undanganPengujiPrefix}) sudah digunakan di Sk Pembimbing. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }

            // === VALIDASI BARU: Cek apakah prefix Munaqasah sudah digunakan di tabel Proposal ===
            const existingMunaqasahInProposal = await prisma.proposal.findFirst({
                where: {
                    OR: [
                        { sk_penguji: { startsWith: `B.${munaqasahPrefix}/` } },
                        { undangan_penguji: { startsWith: `B.${munaqasahPrefix}/` } },
                    ]
                }
            });

            if (existingMunaqasahInProposal) {
                return NextResponse.json({
                    message: `Nomor urut (${munaqasahPrefix}) sudah digunakan di SK Proposal. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }

            // === VALIDASI BARU: Cek apakah prefix Munaqasah sudah digunakan di tabel Judul ===
            const existingMunaqasahInJudul = await prisma.judul.findFirst({
                where: {
                    OR: [
                        { sk_pembimbing: { startsWith: `B.${munaqasahPrefix}/` } },
                        { no_undangan: { startsWith: `B.${munaqasahPrefix}/` } },
                    ]
                }
            });

            if (existingMunaqasahInJudul) {
                return NextResponse.json({
                    message: `Nomor urut (${munaqasahPrefix}) sudah digunakan di Sk Pembimbing. Harap gunakan nomor urut yang berbeda.`
                }, { status: 409 });
            }




            const fullSkPenguji = `B.${skPengujiPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;
            const fullUndanganPenguji = `B.${undanganPengujiPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;
            const fullUndanganMunaqasah = `B.${munaqasahPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;

            dataToUpdate.sk_penguji = fullSkPenguji;
            dataToUpdate.undangan_penguji = fullUndanganPenguji;
            dataToUpdate.undangan_munaqasah = fullUndanganMunaqasah;


        } else {
            newStatus = Status.DITOLAK_ADMIN;

            if (!catatan) {
                return NextResponse.json({ message: 'Alasan penolakan wajib diisi' }, { status: 400 });
            }
       
            dataToUpdate.sk_penguji = null;
            dataToUpdate.undangan_penguji = null;
            dataToUpdate.undangan_munaqasah = null; 
        }

        dataToUpdate.status = newStatus;

      
        const updatedSeminarHasil = await prisma.seminarHasil.update({
            where: { id: seminarHasilId },
            data: dataToUpdate,
        });

       
        return NextResponse.json({
            message: `Status Sidang Skripsi berhasil diperbarui menjadi: ${newStatus}`,
            status: updatedSeminarHasil.status,
            sk_penguji: updatedSeminarHasil.sk_penguji,
            undangan_penguji: updatedSeminarHasil.undangan_penguji,
            undangan_munaqasah: updatedSeminarHasil.undangan_munaqasah 
        }, { status: 200 });
    } catch (error) {
        console.error('API Error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: 'Sidang Skripsi tidak ditemukan.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Gagal memperbarui status Sidang Skripsi.' }, { status: 500 });
    }
}