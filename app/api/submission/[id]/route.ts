import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Status } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const submissionId = parseInt(resolvedParams.id, 10);
    if (isNaN(submissionId)) {
      return NextResponse.json({ message: 'ID pengajuan tidak valid' }, { status: 400 });
    }

    const body = await request.json();

    if (body.action) {
      const { action, catatanAdmin } = body;
      let newStatus: Status;

      if (action === 'VERIFY') {
        newStatus = 'DIPROSES_KAPRODI';
      } else if (action === 'REJECT') {
        newStatus = 'DITOLAK_ADMIN';
        if (!catatanAdmin) {
          return NextResponse.json({ message: 'Catatan penolakan wajib diisi' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ message: 'Aksi admin tidak valid' }, { status: 400 });
      }

      const updatedSubmission = await prisma.judul.update({
        where: { id: submissionId },
        data: {
          status: newStatus,
          catatan: catatanAdmin || null,
        },
      });
      return NextResponse.json(updatedSubmission, { status: 200 });
    }

    else if (body.pembimbing1) {
      const { pembimbing1, pembimbing2 } = body;

      if (!pembimbing1 || !pembimbing2) {
        return NextResponse.json({ message: 'Pembimbing 1 dan 2 wajib dipilih' }, { status: 400 });
      }
      if (pembimbing1 === pembimbing2) {
        return NextResponse.json({ message: 'Pembimbing 1 dan 2 tidak boleh orang yang sama' }, { status: 400 });
      }

      const updatedSubmission = await prisma.judul.update({
        where: { id: submissionId },
        data: {
          pembimbing1,
          pembimbing2,
          status: 'DISETUJUI',
        },
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