import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;
    const { pembimbing1, pembimbing2 } = await request.json();

    if (!pembimbing1 || !pembimbing2) {
      return NextResponse.json({ message: 'Pembimbing 1 dan 2 wajib dipilih' }, { status: 400 });
    }

    if (pembimbing1 === pembimbing2) {
        return NextResponse.json({ message: 'Pembimbing 1 dan 2 tidak boleh orang yang sama' }, { status: 400 });
    }

    const updatedSubmission = await prisma.thesisSubmission.update({
      where: { id: submissionId },
      data: {
        pembimbing1: pembimbing1,
        pembimbing2: pembimbing2,
        status: 'DISETUJUI', // Status akhir setelah pembimbing ditetapkan
      },
    });

    return NextResponse.json(updatedSubmission, { status: 200 });
  } catch (error) {
    console.error("Gagal menetapkan pembimbing:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}