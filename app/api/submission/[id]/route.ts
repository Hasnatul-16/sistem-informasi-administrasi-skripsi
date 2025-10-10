import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Fungsi ini menangani update (PATCH) untuk sebuah submission
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = Number(params.id);
    if (isNaN(submissionId)) {
      return NextResponse.json({ message: 'ID pengajuan tidak valid' }, { status: 400 });
    }

    const { action, catatanAdmin } = await request.json(); // action bisa 'VERIFY' or 'REJECT'

    if (!action) {
      return NextResponse.json({ message: 'Aksi diperlukan' }, { status: 400 });
    }

    let updatedSubmission;

    if (action === 'VERIFY') {
      // Jika diverifikasi, ubah status menjadi DIPROSES_KAPRODI
      updatedSubmission = await prisma.thesisSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'DIPROSES_KAPRODI',
        },
      });
    } else if (action === 'REJECT') {
      // Jika ditolak, ubah status dan tambahkan catatan
      if (!catatanAdmin) {
        return NextResponse.json({ message: 'Catatan penolakan wajib diisi' }, { status: 400 });
      }
      updatedSubmission = await prisma.thesisSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'DITOLAK_ADMIN',
          catatanAdmin: catatanAdmin,
        },
      });
    } else {
      return NextResponse.json({ message: 'Aksi tidak valid' }, { status: 400 });
    }

    return NextResponse.json(updatedSubmission, { status: 200 });

  } catch (error) {
    console.error("Gagal mengupdate pengajuan:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
