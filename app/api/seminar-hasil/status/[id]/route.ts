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
        return NextResponse.json({ message: 'ID Seminar Hasil tidak valid.' }, { status: 400 });
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

                const fullSkPenguji = `B.${skPengujiPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;

                const undanganPrefix = (baseNumberInt + 1).toString();
                const fullUndanganPenguji = `B.${undanganPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;
                
                const munaqasahPrefix = (baseNumberInt + 2).toString();
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

            const fullSkPenguji = `B.${skPengujiPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;
            const fullUndanganPenguji = `B.${undanganPengujiPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;
            
            const munaqasahPrefix = (parseInt(undanganPengujiPrefix) + 1).toString();
            const fullUndanganMunaqasah = `B.${munaqasahPrefix}/Un.13/FST/PP.00.9/${month}/${year}`;

            dataToUpdate.sk_penguji = fullSkPenguji;
            dataToUpdate.undangan_penguji = fullUndanganPenguji;
            dataToUpdate.undangan_munaqasah = fullUndanganMunaqasah; // Tambahkan ini


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
            message: `Status Seminar Hasil berhasil diperbarui menjadi: ${newStatus}`,
            status: updatedSeminarHasil.status,
            sk_penguji: updatedSeminarHasil.sk_penguji,
            undangan_penguji: updatedSeminarHasil.undangan_penguji,
            undangan_munaqasah: updatedSeminarHasil.undangan_munaqasah
        }, { status: 200 });
    } catch (error) {
        console.error('API Error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: 'Seminar Hasil tidak ditemukan.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Gagal memperbarui status Seminar Hasil.' }, { status: 500 });
    }
}