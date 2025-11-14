import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Jurusan, Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;

    if (userRole !== Role.ADMIN) {
      return NextResponse.json({ message: 'Akses Ditolak: Anda tidak memiliki izin.' }, { status: 403 });
    }

    const { id } = await params;
    const dosenId = parseInt(id, 10);

    if (isNaN(dosenId)) {
      return NextResponse.json({ message: 'ID dosen tidak valid.' }, { status: 400 });
    }

    const body = await request.json();
    const { nama, nip, jurusan } = body;

    if (!nama || !nip || !jurusan) {
      return NextResponse.json({ message: 'Nama, NIP, dan jurusan wajib diisi.' }, { status: 400 });
    }

    if (!(jurusan in Jurusan)) {
      return NextResponse.json({ message: 'Jurusan tidak valid.' }, { status: 400 });
    }

    const existingDosen = await prisma.dosen.findFirst({
      where: {
        nip,
        id: { not: dosenId }
      }
    });

    if (existingDosen) {
      return NextResponse.json({ message: 'NIP sudah digunakan oleh dosen lain.' }, { status: 400 });
    }

    const updatedDosen = await prisma.dosen.update({
      where: { id: dosenId },
      data: {
        nama,
        nip,
        jurusan: jurusan as Jurusan
      }
    });

    return NextResponse.json(updatedDosen, { status: 200 });

  } catch (error: unknown) {
    console.error("Gagal memperbarui dosen:", error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    return NextResponse.json({
      message: 'Gagal memperbarui dosen.',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;

    if (userRole !== Role.ADMIN) {
      return NextResponse.json({ message: 'Akses Ditolak: Anda tidak memiliki izin.' }, { status: 403 });
    }

    const { id } = await params;
    const dosenId = parseInt(id, 10);

    if (isNaN(dosenId)) {
      return NextResponse.json({ message: 'ID dosen tidak valid.' }, { status: 400 });
    }

   
    const dosen = await prisma.dosen.findUnique({
      where: { id: dosenId }
    });

    if (!dosen) {
      return NextResponse.json({ message: 'Dosen tidak ditemukan.' }, { status: 404 });
    }


    await prisma.dosen.delete({
      where: { id: dosenId }
    });

    return NextResponse.json({ message: 'Dosen berhasil dihapus.' }, { status: 200 });

  } catch (error: unknown) {
    console.error("Gagal menghapus dosen:", error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    return NextResponse.json({
      message: 'Gagal menghapus dosen.',
      details: errorMessage
    }, { status: 500 });
  }
}
