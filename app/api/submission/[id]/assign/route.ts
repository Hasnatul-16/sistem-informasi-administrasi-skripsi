import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Konversi ID dari string (URL) menjadi number
    const submissionId = parseInt(params.id, 10);
    
    // Validasi jika ID tidak valid
    if (isNaN(submissionId)) {
        return NextResponse.json({ message: 'ID pengajuan tidak valid' }, { status: 400 });
    }

    const { pembimbing1, pembimbing2 } = await request.json();

    if (!pembimbing1 || !pembimbing2) {
      return NextResponse.json({ message: 'Pembimbing 1 dan 2 wajib dipilih' }, { status: 400 });
    }

    if (pembimbing1 === pembimbing2) {
      return NextResponse.json({ message: 'Pembimbing 1 dan 2 tidak boleh orang yang sama' }, { status: 400 });
    }

    // 2. Gunakan ID yang sudah menjadi number untuk update
    const updatedSubmission = await prisma.thesisSubmission.update({
      where: { id: submissionId },
      data: {
        pembimbing1: pembimbing1,
        pembimbing2: pembimbing2,
        status: 'DISETUJUI',
      },
    });

    return NextResponse.json(updatedSubmission, { status: 200 });

  } catch (error) {
    console.error("Gagal menetapkan pembimbing:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
